"""
FastAPI router for similarity endpoints.
Provides /api/v1/similar endpoint using Gemini semantic analysis.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from app.services.gemini_similarity import get_gemini_similarity_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["similarity"])

# Request/response models
class LocationInput(BaseModel):
    coordinates: List[float] = Field(default=[0, 0], description="[lng, lat]")
    city: Optional[str] = None
    address: Optional[str] = None


class ComplaintSimilarityRequest(BaseModel):
    complaint_id: Optional[str] = None
    title: str
    description: str
    type: str
    location: Optional[LocationInput] = None
    limit: int = 5


class SimilarityResult(BaseModel):
    complaint_id: str
    similarity_score: float
    reason: str
    type_match: bool
    location_match: bool
    is_duplicate: bool
    source: str


class SimilarityResponse(BaseModel):
    similarities: List[SimilarityResult]
    source: str
    message: Optional[str] = None


@router.post("/api/v1/similar", response_model=SimilarityResponse)
def find_similar_complaints(req: ComplaintSimilarityRequest):
    """
    Find similar complaints using Gemini semantic analysis.
    
    **Improvements over fuzzy matching:**
    - Understands semantic meaning (pothole = crater)
    - Location-aware matching
    - Detects true duplicates, not just string similarity
    
    Falls back to fuzzy matching if Gemini unavailable.
    """
    try:
        gemini_service = get_gemini_similarity_service()
        
        # Prepare the new complaint
        new_complaint = {
            "id": req.complaint_id,
            "title": req.title,
            "description": req.description,
            "type": req.type,
            "location": {
                "coordinates": req.location.coordinates if req.location else [0, 0],
                "city": req.location.city if req.location else "",
                "address": req.location.address if req.location else ""
            }
        }
        
        # EXAMPLE: Existing complaints (in production, fetch from database)
        existing_complaints = [
            {
                "id": "1",
                "title": "Pothole on MG Road",
                "description": "There is a large pothole on MG Road near the market",
                "type": "pothole",
                "location": {"city": "Delhi", "address": "MG Road"}
            },
            {
                "id": "2",
                "title": "Crater in the road",
                "description": "Crater near MG Road market, very dangerous for vehicles",
                "type": "pothole",
                "location": {"city": "Delhi", "address": "MG Road market"}
            },
            {
                "id": "3",
                "title": "Broken streetlight",
                "description": "Streetlight on Raj Nagar Road is not working",
                "type": "broken_streetlight",
                "location": {"city": "Delhi", "address": "Raj Nagar Road"}
            }
        ]
        
        # Compare new complaint with existing ones
        similarities = []
        for existing in existing_complaints[:req.limit]:
            result = gemini_service.compare_complaints_gemini(new_complaint, existing)
            similarities.append(
                SimilarityResult(
                    complaint_id=existing.get("id"),
                    similarity_score=result.get("similarity_score", 0.0),
                    reason=result.get("reason", ""),
                    type_match=result.get("type_match", False),
                    location_match=result.get("location_match", False),
                    is_duplicate=result.get("is_duplicate", False),
                    source=result.get("source", "unknown")
                )
            )
        
        # Sort by similarity score descending
        similarities.sort(key=lambda x: x.similarity_score, reverse=True)
        
        source = "gemini" if gemini_service.available else "fuzzy_fallback"
        
        return SimilarityResponse(
            similarities=similarities,
            source=source,
            message=f"Found {len(similarities)} similar complaints using {source} analysis"
        )
        
    except Exception as e:
        logger.error(f"Similarity endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/severity")
def predict_severity(complaint: dict):
    """
    Predict complaint severity using Gemini analysis.
    
    Returns severity level (critical/high/medium/low) with confidence score.
    """
    try:
        gemini_service = get_gemini_similarity_service()
        result = gemini_service.predict_severity_gemini(complaint)
        return result
    except Exception as e:
        logger.error(f"Severity prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v1/health")
def health_check():
    """Check if similarity service is available."""
    gemini_service = get_gemini_similarity_service()
    return {
        "gemini_available": gemini_service.available,
        "model": gemini_service.model_name if gemini_service.available else None,
        "fallback": "fuzzy_matching + keyword_analysis"
    }