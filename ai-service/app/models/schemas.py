from typing import List, Optional, Any
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    title: str = Field(..., description="Title of the complaint")
    description: str = Field(..., description="Full description of the complaint")
    location: Optional[str] = Field(None, description="Location string (city/ward)")


class AnalyzeResponse(BaseModel):
    complaint_type: str
    department: str
    priority: int
    priority_label: str
    confidence: float
    sentiment: dict
    keywords: List[str]
    source: str


class SimilarRequest(BaseModel):
    complaint_id: Optional[str] = None
    title: str = Field(..., description="Title of the complaint to compare")
    description: str = Field(..., description="Description to compare")
    type: Optional[str] = None
    coordinates: Optional[List[float]] = None
    city: Optional[str] = None
    limit: int = Field(5, ge=1, le=20)


class SimilarityResult(BaseModel):
    complaint_id: str
    score: float
    is_duplicate: bool


class SimilarResponse(BaseModel):
    similarities: List[Any]


class PredictRequest(BaseModel):
    title: str
    description: str
    department: Optional[str] = None


class PriorityPrediction(BaseModel):
    priority: int
    priority_label: str
    confidence: float
    signals: str


class ResolutionEstimate(BaseModel):
    department: str
    estimated_days_min: int
    estimated_days_max: int
    display: str
    basis: str


class PredictResponse(BaseModel):
    priority_estimate: PriorityPrediction
    resolution_estimate: ResolutionEstimate


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    intent: str


class OcrRequest(BaseModel):
    image_base64: Optional[str] = None
    text: Optional[str] = Field(None, description="Fallback text if OCR engine unavailable")


class OcrResponse(BaseModel):
    ocr_text: str
    extraction_source: str
    complaint_type: str
    priority: dict
    department: str
