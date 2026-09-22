"""
Similarity detection for finding duplicate/related complaints.
Uses rapidfuzz (fuzzy string matching) when available, else falls back
to a pure Python token-based similarity. Also includes category features.
"""
import logging

# rapidfuzz is optional; fall back to pure-Python token similarity if unavailable
try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

from app.services.nlp import match_category

logger = logging.getLogger(__name__)

# Thresholds
DUPLICATE_THRESHOLD = 80   # fuzzy ratio above which complaints are considered duplicates
RELATED_THRESHOLD = 60     # fuzzy ratio above which complaints are related

CATEGORY_WEIGHT = 0.4     # Weight for category match
TEXT_WEIGHT = 0.6         # Weight for text similarity


def _tokenize(text: str) -> set:
    """Simple tokenization into a set of significant words."""
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    stopwords = set([
        "a", "an", "the", "and", "or", "but", "is", "are", "was", "were",
        "be", "been", "it", "this", "that", "these", "those", "there", "here",
        "of", "to", "in", "on", "at", "for", "with", "from", "by", "i", "we",
        "please", "need", "fix", "very", "street", "road", "area", "near"
    ])
    return {w for w in re.split(r'\s+', text) if w and w not in stopwords and len(w) > 2}


def jaccard_similarity(text1: str, text2: str) -> float:
    """Compute Jaccard similarity between two texts."""
    set1 = _tokenize(text1)
    set2 = _tokenize(text2)

    if not set1 or not set2:
        return 0.0

    intersection = len(set1 & set2)
    union = len(set1 | set2)
    return intersection / union if union > 0 else 0.0


def combined_similarity(complaint1: dict, complaint2: dict) -> dict:
    """Compute combined similarity between two complaints."""
    text1 = f"{complaint1.get('title', '')} {complaint1.get('description', '')}"
    text2 = f"{complaint2.get('title', '')} {complaint2.get('description', '')}"

    # Token-based Jaccard similarity (always available)
    jaccard = jaccard_similarity(text1, text2)

    # Fuzzy string similarity (only if rapidfuzz installed)
    if HAS_RAPIDFUZZ:
        fuzzy_ratio = fuzz.token_sort_ratio(text1, text2) / 100.0
    else:
        fuzzy_ratio = jaccard

    # Category match
    cat1 = match_category(text1)[0]
    cat2 = match_category(text2)[0]
    category_match = 1.0 if cat1 == cat2 else 0.0

    # Text similarity is a blend of fuzzy and jaccard
    text_sim = (fuzzy_ratio * 0.6) + (jaccard * 0.4)

    # Combined score
    score = (TEXT_WEIGHT * text_sim) + (CATEGORY_WEIGHT * category_match)

    return {
        "score": round(score, 3),
        "text_similarity": round(text_sim, 3),
        "category_match": category_match,
        "category": cat1,
        "is_duplicate": score >= 0.75
    }


def find_similar(new_complaint: dict, existing_complaints: list, limit: int = 5) -> list:
    """
    Find similar complaints from a list of existing ones.
    Args:
        new_complaint: dict with title, description, optional location
        existing_complaints: list of dicts with same structure
        limit: max number of results
    Returns:
        Sorted list of similarity results, each with complaint_id and score
    """
    results = []

    for existing in existing_complaints:
        try:
            result = combined_similarity(new_complaint, existing)
            result["complaint_id"] = existing.get("complaint_id", str(existing.get("_id", "")))
            results.append(result)
        except Exception as e:
            logger.warning(f"Similarity computation failed for {existing.get('complaint_id')}: {e}")

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)

    return results[:limit]
