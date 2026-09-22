"""
CivicSense AI - NLP Microservice
Provides complaint classification, department routing, priority scoring,
sentiment analysis, and duplicate detection.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.routers.similarity_router import router as similarity_router

from app.routers import analysis
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CivicSense AI Service",
    description="NLP classification, routing, sentiment, and deduplication for civic complaints",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api/v1", tags=["analysis"])
app.include_router(similarity_router, tags=["similarity"])
app.include_router(analysis.health_router, tags=["health"])

@app.get("/", tags=["root"])
async def root():
    return {
        "service": "CivicSense AI Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/api/v1/analyze", "/api/v1/similar", "/health"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
