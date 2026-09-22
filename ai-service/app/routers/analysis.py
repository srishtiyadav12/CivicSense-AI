from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging

from app.models import schemas
from app.services import nlp, similarity
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
health_router = APIRouter()


@health_router.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "CivicSense AI Service",
        "model_loaded": settings.USE_ML_MODEL
    }


@router.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_complaint(request: schemas.AnalyzeRequest):
    """
    Analyze a complaint: classify type, route to department,
    score priority, and analyze sentiment.
    """
    if not request.title.strip() or not request.description.strip():
        raise HTTPException(status_code=400, detail="Title and description are required")

    try:
        result = nlp.analyze_text(request.title, request.description)

        # Optionally use ML model if available and enabled
        if settings.USE_ML_MODEL:
            pipeline = nlp.load_ml_model()
            if pipeline is not None:
                ml_result = nlp.analyze_with_ml(request.title, request.description, pipeline)
                if ml_result.get("confidence", 0) > result.get("confidence", 0):
                    result.update(ml_result)

        return schemas.AnalyzeResponse(**result)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.post("/similar", response_model=schemas.SimilarResponse)
async def find_similar_complaints(request: schemas.SimilarRequest):
    """
    Find complaints similar to the given one.
    Fetches recent existing complaints from MongoDB (if available) and
    computes similarity scores, filtering out the source complaint itself.
    """
    try:
        text = f"{request.title} {request.description}"
        new_complaint = {
            "complaint_id": request.complaint_id or "new",
            "title": request.title,
            "description": request.description,
            "type": request.type,
            "coordinates": request.coordinates or [0, 0],
            "city": request.city
        }

        # Fetch existing complaints from MongoDB if a URI is configured
        existing = _fetch_existing_complaints(request.limit * 20)

        if not existing:
            return schemas.SimilarResponse(similarities=[])

        results = similarity.find_similar(new_complaint, existing, limit=request.limit)

        # Exclude the source complaint itself
        if request.complaint_id:
            results = [r for r in results if r.get("complaint_id") != request.complaint_id]

        return schemas.SimilarResponse(similarities=results[:request.limit])
    except Exception as e:
        logger.error(f"Similarity search failed: {e}")
        raise HTTPException(status_code=500, detail="Similarity search failed")


@router.post("/predict", response_model=schemas.PredictResponse)
async def predict_complaint(request: schemas.PredictRequest):
    """Predict priority and estimate resolution time for a complaint."""
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    priority = nlp.predict_priority(request.title, request.description, request.department)
    resolution = nlp.estimate_resolution(
        request.title, request.description, priority["priority_label"],
        priority["priority"]
    )
    return schemas.PredictResponse(
        priority_estimate=priority,
        resolution_estimate=resolution
    )


@router.post("/chat", response_model=schemas.ChatResponse)
async def citizen_chat(request: schemas.ChatRequest):
    """Rule-based citizen assistant for common questions."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    result = nlp.chatbot_reply(request.message)
    return schemas.ChatResponse(**result)


@router.post("/ocr", response_model=schemas.OcrResponse)
async def ocr_complaint(request: schemas.OcrRequest):
    """
    Extract issue type from a complaint photo. Tries OCR first (pytesseract /
    easyocr if installed); gracefully falls back to a caption/text hint so the
    endpoint stays demoable without a heavy OCR engine installed.
    """
    extracted_text = ""
    source = "fallback"

    if request.image_base64:
        try:
            extracted_text = _ocr_from_base64(request.image_base64)
            if extracted_text:
                source = "ocr"
        except Exception as e:
            logger.warning(f"OCR engine unavailable: {e}")

    text = extracted_text or request.text or ""
    if not text.strip():
        return schemas.OcrResponse(
            ocr_text="",
            extraction_source="none",
            complaint_type="other",
            priority=nlp.score_priority(""),
            department="General Administration"
        )

    analysis = nlp.analyze_text(text, "")
    priority = nlp.score_priority(text)
    priority_obj = {
        "priority": priority[0],
        "priority_label": priority[1],
        "confidence": 0.6,
        "signals": "ocr"
    }
    return schemas.OcrResponse(
        ocr_text=text,
        extraction_source=source,
        complaint_type=analysis["complaint_type"],
        priority=priority_obj,
        department=analysis["department"]
    )


def _ocr_from_base64(image_base64: str) -> str:
    """Decode base64 image and run OCR if an engine is present. Returns '' if not."""
    import base64, io
    raw = base64.b64decode(image_base64.split(",")[-1])
    buf = io.BytesIO(raw)
    try:
        from PIL import Image
        img = Image.open(buf).convert("RGB")
        try:
            import pytesseract
            from tempfile import NamedTemporaryFile
            with NamedTemporaryFile(suffix=".png") as tmp:
                img.save(tmp.name)
                return (pytesseract.image_to_string(tmp.name) or "").strip()
        except ImportError:
            logger.info("pytesseract not installed; OCR skipped")
    except ImportError:
        logger.info("Pillow not installed; OCR skipped")
    return ""


def _fetch_existing_complaints(limit: int = 100):
    """Fetch recent complaints from MySQL for similarity comparison."""
    try:
        import pymysql

        uri = settings.MYSQL_URI
        if not uri:
            logger.info("No MYSQL_URI configured. Skipping similarity against stored complaints.")
            return []

        # Accept either 'mysql://user:pass@host:port/db' or a URI formatted from parts
        from urllib.parse import urlparse
        parsed = urlparse(uri)
        conn = pymysql.connect(
            host=parsed.hostname or "localhost",
            port=parsed.port or 3306,
            user=parsed.username or "root",
            password=parsed.password or "",
            database=parsed.path.lstrip("/") or "civicsense",
            connect_timeout=2
        )

        existing = []
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(
                "SELECT id, title, description, type, locLat, locLng, locCity "
                "FROM complaints WHERE isDeleted = 0 ORDER BY createdAt DESC LIMIT %s",
                (limit,)
            )
            rows = cursor.fetchall()

        conn.close()

        for doc in rows:
            lat = doc.get("locLat")
            lng = doc.get("locLng")
            existing.append({
                "complaint_id": str(doc.get("id", "")),
                "title": doc.get("title", ""),
                "description": doc.get("description", ""),
                "type": doc.get("type", ""),
                "coordinates": [float(lng), float(lat)] if lat is not None and lng is not None else [0, 0],
                "city": doc.get("locCity", "")
            })

        logger.info(f"Fetched {len(existing)} existing complaints for similarity comparison")
        return existing
    except Exception as e:
        logger.warning(f"Failed to fetch existing complaints from MySQL: {e}")
        return []
