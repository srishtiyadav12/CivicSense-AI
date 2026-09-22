from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "CivicSense AI Service"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Model settings
    CLASSIFIER_MODEL_PATH: str = "app/models/data/classifier.joblib"
    VECTORIZER_PATH: str = "app/models/data/vectorizer.joblib"
    USE_ML_MODEL: bool = False  # Set to True once a model has been trained

    # SQLAlchemy-style URI for the MySQL database (optional, for similarity search)
    MYSQL_URI: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
