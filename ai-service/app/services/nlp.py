"""
NLP utilities for complaint analysis.
Keyword-based classification, priority scoring, and sentiment analysis.
Optionally uses scikit-learn models for more robust classification.
"""
import re
import logging
from collections import Counter

logger = logging.getLogger(__name__)

# Complaint types and their associated keywords
CATEGORY_KEYWORDS = {
    "pothole": [
        "pothole", "craters", "hole in the road", "hole in road", "dips in road",
        "road damaged", "road surface broken", "bumpy road", "sunken road"
    ],
    "garbage": [
        "garbage", "trash", "waste", "rubbish", "litter", "garbage dump",
        "trash pile", "bins not emptied", "garbage collection", "solid waste",
        "waste not collected", "uncollected garbage"
    ],
    "broken_streetlight": [
        "streetlight", "street light", "street lamp", "lamppost", "streetlight not working",
        "light not working", "light broken", "no light at night", "dark street",
        "not lit", "faulty street light"
    ],
    "water_leakage": [
        "water leak", "water leakage", "leaking pipe", "pipe burst", "water dripping",
        "leaky tap", "water flowing", "wasted water", "leak in the pipe", "water pipe leak"
    ],
    "drainage": [
        "drain", "drainage", "blocked drain", "clogged drain", "drain overflow",
        "flooding", "waterlogging", "water logging", "stagnant water", "drain blocked",
        "water stagnation", "flooded road"
    ],
    "damaged_infrastructure": [
        "broken bench", "damaged fence", "broken bridge", "damaged sidewalk",
        "broken sidewalk", "damaged footpath", "cracked wall", "dangerous structure",
        "collapsed structure", "broken railing", "damaged signboard"
    ],
    "noise_pollution": [
        "noise pollution", "loud noise", "excessive noise", "construction noise",
        "loud music", "beeping", "honking", "noisy at night"
    ],
    "stray_animals": [
        "stray dog", "stray dogs", "stray animal", "feral", "stray cattle",
        "dogs on road", "animal menace", "wild pigs", "stray monkey"
    ],
    "electricity": [
        "power cut", "electricity cut", "no power", "power outage", "electrical fault",
        "sparks", "wire hanging", "electric wire", "power line", "voltage fluctuation",
        "frequent power"
    ],
    "sewage": [
        "sewage", "sewage overflow", "sewage leaking", "manhole overflow", "stinking smell",
        "foul smell", "stagnant sewage", "sewage line"
    ],
    "road_damage": [
        "road damage", "road damaged", "cracked road", "broken road", "road in bad condition",
        "rutted road", "unpaved", "road erosion"
    ]
}

# Department routing map
DEPARTMENT_MAP = {
    "pothole": "Public Works Department",
    "road_damage": "Public Works Department",
    "damaged_infrastructure": "Public Works Department",
    "public_property_damage": "Public Works Department",
    "garbage": "Sanitation Department",
    "sewage": "Sanitation Department",
    "broken_streetlight": "Electricity Board",
    "electricity": "Electricity Board",
    "water_leakage": "Water Supply Department",
    "drainage": "Drainage Department",
    "noise_pollution": "Environmental Department",
    "stray_animals": "Animal Control",
    "other": "General Administration"
}

# Priority scoring keywords
CRITICAL_KEYWORDS = [
    "danger", "hazard", "emergency", "collapse", "flood", "electrocution",
    "accident", "injury", "unsafe", "health risk", "contaminated", "life threatening",
    "serious risk", "immediate attention", "can cause accident", "feels unsafe"
]

HIGH_KEYWORDS = [
    "urgent", "serious", "broken", "damaged", "overflow", "spill", "large",
    "major", "extensive", "dangerous"
]

MEDIUM_KEYWORDS = [
    "moderate", "noticeable", "growing", "worsening", "frequent", "multiple"
]

LOW_KEYWORDS = [
    "minor", "small", "cosmetic", "aesthetic", "slightly"
]

# Sentiment keywords
NEGATIVE_STRONG = [
    "very bad", "terrible", "dangerous", "worst", "fed up", "sick of",
    "unacceptable", "angry", "frustrated", "furious", "appalled", "disgusting",
    "nightmare", "horrible", "awful", "exhausted"
]

NEGATIVE_MILD = [
    "issue", "problem", "need fix", "please fix", "noticed", "concern",
    "worried", "unhappy", "not working"
]

POSITIVE_KEYWORDS = [
    "good", "thanks", "great", "nice", "appreciate", "pleased", "satisfied"
]


def preprocess(text: str) -> str:
    """Normalize text for keyword matching."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def match_category(text: str) -> tuple:
    """Match text against category keywords. Returns (category, matched_keywords)."""
    processed = preprocess(text)
    matched = []

    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in processed:
                matched.append(keyword)

    if matched:
        # Pick the category with the most keyword matches
        category_counter = Counter()
        for kw in matched:
            for cat, keywords in CATEGORY_KEYWORDS.items():
                if kw in keywords:
                    category_counter[cat] += 1
        best_category = category_counter.most_common(1)[0][0]
        return best_category, matched

    return "other", matched


def score_priority(text: str) -> tuple:
    """Heuristic priority scoring. Returns (priority_int, label)."""
    processed = preprocess(text)

    for kw in CRITICAL_KEYWORDS:
        if kw in processed:
            return 4, "Critical"

    for kw in HIGH_KEYWORDS:
        if kw in processed:
            return 3, "High"

    for kw in MEDIUM_KEYWORDS:
        if kw in processed:
            return 2, "Medium"

    for kw in LOW_KEYWORDS:
        if kw in processed:
            return 1, "Low"

    return 2, "Medium"


def analyze_sentiment(text: str) -> dict:
    """Simple rule-based sentiment analysis. Returns {'score', 'label'}."""
    processed = preprocess(text)

    strong_negatives = sum(1 for kw in NEGATIVE_STRONG if kw in processed)
    mild_negatives = sum(1 for kw in NEGATIVE_MILD if kw in processed)
    positives = sum(1 for kw in POSITIVE_KEYWORDS if kw in processed)

    # Look for intensifiers
    intensifiers = ["very", "extremely", "really", "highly", "absolutely"]
    has_intensifier = any(i in processed for i in intensifiers)

    score = 0.0
    if strong_negatives > 0:
        score = -0.7 if has_intensifier else -0.5
    elif mild_negatives > 0:
        score = -0.3 if has_intensifier else -0.1
    elif positives > 0:
        score = 0.3 if has_intensifier else 0.2
    else:
        score = 0.0

    # Clamp between -1 and 1
    score = max(-1.0, min(1.0, score))

    if score <= -0.5:
        label = "very_negative"
    elif score < 0:
        label = "negative"
    elif score == 0:
        label = "neutral"
    elif score < 0.5:
        label = "positive"
    else:
        label = "very_positive"

    return {"score": round(score, 2), "label": label}


def extract_keywords(text: str, limit: int = 10) -> list:
    """Extract key descriptive terms from the complaint text."""
    processed = preprocess(text)
    words = processed.split()

    # Stop words to remove
    stopwords = set([
        "a", "an", "the", "and", "or", "but", "is", "are", "was", "were",
        "be", "been", "being", "does", "do", "did", "have", "has", "had",
        "it", "this", "that", "these", "those", "there", "here", "of", "to",
        "in", "on", "at", "for", "with", "from", "by", "i", "we", "me", "my",
        "our", "please", "need", "needed", "fix", "also", "very", "there",
        "one", "street", "road", "area", "near", "around", "about"
    ])

    filtered = [w for w in words if w not in stopwords and len(w) > 2]
    return filtered[:limit]


def analyze_text(title: str, description: str) -> dict:
    """Main analysis function combining classification, routing, priority, and sentiment."""
    combined = f"{title} {description}"

    category, keywords = match_category(combined)
    priority, priority_label = score_priority(combined)
    sentiment = analyze_sentiment(combined)
    extracted = extract_keywords(combined)

    department = DEPARTMENT_MAP.get(category, "General Administration")

    # Simple confidence heuristic based on keyword match quality
    confidence = min(0.9, 0.5 + (0.1 * len(keywords))) if category != "other" else 0.3

    return {
        "complaint_type": category,
        "department": department,
        "priority": priority,
        "priority_label": priority_label,
        "confidence": round(confidence, 2),
        "sentiment": sentiment,
        "keywords": keywords[:15] if keywords else extracted,
        "source": "heuristic"
    }


# --- Optional scikit-learn integration (for future trained models) ---

def load_ml_model():
    """Load the trained sklearn pipeline if available, else None.
    The pipeline bundles its own TfidfVectorizer, so only the saved
    classifier.joblib artifact (produced by scripts/train_model.py) is needed.
    """
    import os
    import joblib
    from app.core.config import settings

    classifier_path = settings.CLASSIFIER_MODEL_PATH

    if os.path.exists(classifier_path):
        try:
            pipeline = joblib.load(classifier_path)
            logger.info("Trained ML pipeline loaded")
            return pipeline
        except Exception as e:
            logger.warning(f"Failed to load ML pipeline: {e}")

    logger.info("No trained ML pipeline found. Using heuristic classification.")
    return None


def analyze_with_ml(title: str, description: str, pipeline) -> dict:
    """Classify using the trained sklearn pipeline (vectorizer + classifier bundled)."""
    text = f"{title} {description}"
    prediction = pipeline.predict([text])[0]
    probabilities = pipeline.predict_proba([text])[0]
    confidence = float(max(probabilities))

    return {
        "complaint_type": prediction,
        "department": DEPARTMENT_MAP.get(prediction, "General Administration"),
        "confidence": round(confidence, 2),
        "source": "ml_model"
    }


# ============================================================================
# "Deeper AI" helpers: priority prediction, resolution-time estimation, and a
# rule-based citizen assistant. Pure Python so the service runs anywhere.
# ============================================================================

# Baseline SLA (working days) per department.
RESOLUTION_SLA_DAYS = {
    "Public Works Department": (7, 14),
    "Sanitation Department": (2, 5),
    "Electricity Board": (3, 7),
    "Water Supply Department": (4, 8),
    "Drainage Department": (3, 6),
    "Environmental Department": (5, 10),
    "Animal Control": (2, 4),
    "General Administration": (10, 20)
}

# Departments that side effects/plumbing issues route to; used to bump "other".
RISK_PRIORITY_BOOST = {"Electricity Board", "Drainage Department", "Water Supply Department"}


def predict_priority(title: str, description: str, department: str = None) -> dict:
    """
    Predict a priority from 1 (low) to 4 (critical) with a confidence score.
    Decision-rules: keyword urgency first, then sentiment, then category risk.
    Mimics a small ML model and is fully deterministic for the demo.
    """
    text = f"{title} {description}"
    priority, label = score_priority(text)

    # Negative sentiment escalates urgency.
    sentiment = analyze_sentiment(text)
    if sentiment["label"] in ("very_negative", "negative"):
        priority = min(4, priority + 1)

    # Infrastructure-risk categories get bumped from a neutral default.
    if priority == 2 and department in RISK_PRIORITY_BOOST:
        priority = 3

    labels = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
    # Confidence: higher when strong signals agree.
    confidence = 0.95 if priority in (1, 4) else 0.88 if sentiment["score"] != 0 else 0.8

    return {
        "priority": priority,
        "priority_label": labels.get(priority, "Medium"),
        "confidence": round(round(min(0.99, confidence), 2)),
        "signals": sentiment["label"]
    }


def estimate_resolution(title: str, description: str, department: str = None, priority: int = None) -> dict:
    """
    Estimate a range of working days to resolve a complaint based on the
    department SLA baseline, scaled by predicted priority and sentiment.
    """
    if priority is None:
        priority = predict_priority(title, description, department)["priority"]

    lo, hi = RESOLUTION_SLA_DAYS.get(department or "General Administration", (10, 20))

    # Higher priority is triaged faster (shorter ETA).
    multiplier = {1: 2.0, 2: 1.5, 3: 1.1, 4: 0.8}[priority]
    est_lo = max(1, int(round(lo * multiplier)))
    est_hi = max(est_lo + 1, int(round(hi * multiplier)))

    return {
        "department": department or "General Administration",
        "estimated_days_min": est_lo,
        "estimated_days_max": est_hi,
        "display": f"{est_lo}–{est_hi} working days",
        "basis": "department SLA adjusted by predicted priority"
    }


# --- Rule-based citizen assistant -------------------------------------------
FAQ_RULES = [
    (("track", "status", "where", "check", "progress"),
     "You can track your complaint status on the My Complaints dashboard, or by opening "
     "the complaint from its link. Statuses flow: submitted → under review → assigned → in progress → resolved."),
    (("file", "report", "submit", "create", "how to"),
     "Tap 'Report an Issue' in the sidebar, add a title, description, a photo, and an optional map "
     "location. Our AI classifies it and routes it to the right department automatically."),
    (("resolve", "resolution", "how long", "days", "time", "when"),
     "Resolution time depends on the department and priority. High/critical issues are triaged first. "
     "You'll get a live status update via email and, if enabled, a browser/mobile notification when it changes."),
    (("duplicate", "already", "repeat", "same"),
     "We auto-detect duplicates: if a similar complaint already exists, yours gets linked to it instead of "
     "creating a new one, so the department works on one ticket."),
    (("escalate", "high priority", "not moving", "stuck", "slow", "waiting"),
     "If your complaint hasn't moved, you can raise priority by rating the report as urgent, or reach your "
     "local department. Admins can also reassign it to a less-loaded official."),
    (("department", "who", "official", "routed"),
     "Each issue type maps to a department — e.g. potholes to Public Works, garbage to Sanitation, "
     "power cuts to the Electricity Board. Geo-routing assigns it to the closest available official."),
]


def chatbot_reply(message: str) -> dict:
    """
    Simple FAQ-driven assistant. Greets, then matches the user's question to
    the best rule. Falls back to a helpful generic response.
    """
    text = preprocess(message or "")
    greeting = any(g in text for g in ("hi", "hello", "hey", "namaste"))
    thanks = any(t_ in text for t_ in ("thank", "great", "nice"))

    if thanks:
        return {"reply": "Happy to help! Anything else you'd like to know about CivicSense?", "intent": "thanks"}

    best, intent = None, None
    for keywords, answer in FAQ_RULES:
        if any(k in text for k in keywords):
            if best is None:
                best, intent = answer, keywords[0]
            break

    if best:
        prefix = "Hello! " if greeting else ""
        return {"reply": prefix + best, "intent": intent}

    if greeting:
        return {
            "reply": "Hello! 👋 I can help with how to file a complaint, track status, resolution times, "
                     "duplicate detection, escalation, and department routing. Try asking one of those.",
            "intent": "greeting"
        }

    return {
        "reply": "I could only match part of that. I'm best with questions about filing, tracking, resolution "
                 "times, escalation, and routing — try rephrasing, or type 'help'.",
        "intent": "fallback"
    }
