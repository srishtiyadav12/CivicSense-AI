"""
Train a scikit-learn text classifier for civic complaint categorization.
Run: python -m scripts.train_model
"""
import os
import sys
import logging
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp import CATEGORY_KEYWORDS, analyze_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_training_data(n_per_category: int = 100):
    """Generate synthetic training data from keyword categories."""
    import random

    samples = []
    intros = [
        "There is a {kw} problem at {place}.",
        "Residents are facing {desc} in {place}.",
        "We have noticed {desc} near our locality.",
        "Complaint regarding {desc} at {place}.",
        "The {kw} issue has been ongoing for weeks.",
        "Citizens are concerned about {desc}.",
        "Please address the {desc} matter urgently.",
        "There's a serious {kw} situation in our area.",
        "I want to report {desc} happening on our street.",
        "{region} is experiencing {desc} and needs action."
    ]

    places = ["Main Road", "Market Street", "Residential Colony", "City Center",
              "Near School", "Industrial Area", "Public Park", "Bridge Road",
              "Bus Stand", "Railway Station", "Community Hall", "Local Market"]

    regions = ["Our neighborhood", "The residential sector", "This locality",
               "The community", "Our area"]

    for category, keywords in CATEGORY_KEYWORDS.items():
        for _ in range(n_per_category):
            kw = random.choice(keywords)
            place = random.choice(places)
            region = random.choice(regions)
            intro = random.choice(intros)
            state = {
                "kw": kw,
                "desc": kw,
                "place": place,
                "region": region
            }
            text = intro.format(**state)
            samples.append({"text": text, "category": category})

    return pd.DataFrame(samples)


def train():
    """Train the classifier and save model artifacts."""
    logger.info("Generating training data...")
    df = generate_training_data(n_per_category=200)
    logger.info(f"Generated {len(df)} training samples across {df['category'].nunique()} categories")

    X = df['text']
    y = df['category']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            stop_words='english'
        )),
        ('clf', MultinomialNB())
    ])

    logger.info("Training classifier...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.info(f"Test accuracy: {acc:.4f}")
    logger.info("\nClassification Report:")
    logger.info(classification_report(y_test, y_pred))

    # Save model
    os.makedirs('app/models/data', exist_ok=True)
    joblib.dump(pipeline, 'app/models/data/classifier.joblib')
    logger.info("Model saved to app/models/data/classifier.joblib")

    return pipeline


if __name__ == "__main__":
    train()
