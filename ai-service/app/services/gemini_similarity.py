"""
Gemini-powered semantic similarity for complaints.
Uses Google Gemini API for intelligent comparison instead of basic string matching.
Falls back to fuzzy matching if Gemini is unavailable.
"""
import logging
import json
import os
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv()

logger = logging.getLogger(__name__)
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    logger.warning("google-generativeai not installed. Install with: pip install google-generativeai")

# Fallback to fuzzy matching if Gemini unavailable
try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False


class GeminiSimilarityService:
    """
    Semantic similarity using Google Gemini API.
    Compares complaints for semantic meaning, not just string similarity.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-1.5-flash"  # Fastest model, good for quick comparisons
        
        if HAS_GEMINI and self.api_key:
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model_name)
            self.available = True
            logger.info("Gemini API initialized for similarity analysis")
        else:
            self.available = False
            logger.warning("Gemini similarity disabled: API key or library not available")

    def compare_complaints_gemini(
        self, 
        complaint1: Dict, 
        complaint2: Dict
    ) -> Dict:
        """
        Compare two complaints using Gemini semantic analysis.
        
        Args:
            complaint1: dict with title, description, type, location
            complaint2: dict with title, description, type, location
            
        Returns:
            {
                "similarity_score": 0.0-1.0,
                "reason": "explanation",
                "type_match": bool,
                "location_match": bool,
                "is_duplicate": bool,
                "source": "gemini"
            }
        """
        if not self.available:
            return self._fallback_comparison(complaint1, complaint2)

        try:
            prompt = self._build_comparison_prompt(complaint1, complaint2)
            response = self.client.generate_content(prompt)
            
            # Parse JSON response
            response_text = response.text
            parsed = self._parse_json_response(response_text)
            
            if parsed:
                return {
                    **parsed,
                    "source": "gemini"
                }
        except Exception as e:
            logger.error(f"Gemini comparison failed: {e}. Falling back to fuzzy matching.")
            return self._fallback_comparison(complaint1, complaint2)

        return self._fallback_comparison(complaint1, complaint2)

    def _build_comparison_prompt(self, complaint1: Dict, complaint2: Dict) -> str:
        """Build the Gemini prompt for complaint comparison."""
        return f"""
You are a complaint similarity analyzer. Compare these two community issue reports and determine if they are about the same problem.

COMPLAINT 1:
- Title: {complaint1.get('title', '')}
- Description: {complaint1.get('description', '')}
- Type: {complaint1.get('type', 'unknown')}
- Location: {complaint1.get('location', {}).get('city', 'unknown')}

COMPLAINT 2:
- Title: {complaint2.get('title', '')}
- Description: {complaint2.get('description', '')}
- Type: {complaint2.get('type', 'unknown')}
- Location: {complaint2.get('location', {}).get('city', 'unknown')}

Analyze:
1. Do they describe the same issue (regardless of wording)?
   Example: "pothole on Main Road" and "crater near Main Street" are the SAME issue.
2. Are they in the same location (or nearby)?
3. Would they have the same solution/resolution path?

Return a JSON object with ONLY these fields (no markdown, no explanation):
{{
  "similarity_score": <number 0.0 to 1.0>,
  "reason": "<brief explanation in one sentence>",
  "type_match": <true/false - same category>,
  "location_match": <true/false - same area>,
  "is_duplicate": <true if similarity > 0.75>
}}

Be strict: two different problems (even if same area) should score lower.
Be generous with semantic understanding: "broken streetlight" and "no light at night" are the same thing.
"""

    def _parse_json_response(self, response_text: str) -> Optional[Dict]:
        """Parse JSON from Gemini response, handling markdown wrapping."""
        try:
            # Remove markdown code blocks if present
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            # Parse JSON
            data = json.loads(text.strip())
            
            # Validate required fields
            if "similarity_score" in data and "reason" in data:
                return {
                    "similarity_score": float(data.get("similarity_score", 0.5)),
                    "reason": str(data.get("reason", "")),
                    "type_match": bool(data.get("type_match", False)),
                    "location_match": bool(data.get("location_match", False)),
                    "is_duplicate": bool(data.get("is_duplicate", False))
                }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
        
        return None

    def _fallback_comparison(self, complaint1: Dict, complaint2: Dict) -> Dict:
        """Fallback: use fuzzy string matching when Gemini unavailable."""
        if not HAS_RAPIDFUZZ:
            return {
                "similarity_score": 0.0,
                "reason": "Similarity service unavailable",
                "type_match": False,
                "location_match": False,
                "is_duplicate": False,
                "source": "unavailable"
            }

        # Combine title + description for comparison
        text1 = f"{complaint1.get('title', '')} {complaint1.get('description', '')}"
        text2 = f"{complaint2.get('title', '')} {complaint2.get('description', '')}"
        
        # Fuzzy match score (0-100) → normalize to 0-1
        fuzzy_score = fuzz.token_sort_ratio(text1, text2) / 100.0
        
        # Type match
        type_match = complaint1.get("type") == complaint2.get("type")
        
        # Location match (simplified)
        loc1 = complaint1.get("location", {}).get("city", "")
        loc2 = complaint2.get("location", {}).get("city", "")
        location_match = loc1 and loc2 and loc1.lower() == loc2.lower()
        
        return {
            "similarity_score": round(fuzzy_score, 3),
            "reason": "Based on string similarity (Gemini unavailable)",
            "type_match": type_match,
            "location_match": location_match,
            "is_duplicate": fuzzy_score >= 0.75,
            "source": "fuzzy_fallback"
        }

    def predict_severity_gemini(self, complaint: Dict) -> Dict:
        """
        Predict complaint severity using Gemini.
        
        Returns:
            {
                "severity": "low|medium|high|critical",
                "confidence": 0.0-1.0,
                "reasoning": "explanation",
                "source": "gemini"
            }
        """
        if not self.available:
            return self._fallback_severity(complaint)

        try:
            prompt = self._build_severity_prompt(complaint)
            response = self.client.generate_content(prompt)
            
            parsed = self._parse_json_response(response.text)
            if parsed and "severity" in parsed:
                return {
                    "severity": parsed.get("severity", "medium"),
                    "confidence": float(parsed.get("confidence", 0.5)),
                    "reasoning": parsed.get("reasoning", ""),
                    "source": "gemini"
                }
        except Exception as e:
            logger.error(f"Gemini severity prediction failed: {e}")
            return self._fallback_severity(complaint)

        return self._fallback_severity(complaint)

    def _build_severity_prompt(self, complaint: Dict) -> str:
        """Build prompt for severity prediction."""
        return f"""
You are an expert at assessing public issue severity.

COMPLAINT:
- Title: {complaint.get('title', '')}
- Description: {complaint.get('description', '')}
- Type: {complaint.get('type', 'unknown')}
- Location: {complaint.get('location', {}).get('address', 'unknown')}

Assess the SEVERITY (impact on public safety, infrastructure, health).

SEVERITY LEVELS:
- CRITICAL: Immediate danger, can cause injury/death, emergency response needed
  Example: "Open manhole in middle of road", "Power line touching wet street"
- HIGH: Significant safety risk, affects many people, urgent action needed
  Example: "Multiple large potholes on main road", "Entire street flooded"
- MEDIUM: Affects some people, needs attention, can wait 1-2 weeks
  Example: "Broken streetlight on side street", "Single small pothole"
- LOW: Minor issue, cosmetic or low-impact, can wait 2+ weeks
  Example: "Slight graffiti on wall", "Small debris on sidewalk"

Return JSON:
{{
  "severity": "<critical|high|medium|low>",
  "confidence": <0.0-1.0>,
  "reasoning": "<one sentence explanation>"
}}
"""

    def _fallback_severity(self, complaint: Dict) -> Dict:
        """Fallback severity prediction using keyword matching."""
        text = f"{complaint.get('title', '')} {complaint.get('description', '')}".lower()
        
        critical_words = ["danger", "hazard", "emergency", "collapse", "electrocution", 
                         "injury", "death", "accident", "unsafe", "manhole", "open"]
        high_words = ["urgent", "serious", "broken", "damaged", "flood", "overflow", 
                     "multiple", "large", "extensive"]
        medium_words = ["issue", "problem", "need", "attention", "fix", "broken"]
        
        if any(w in text for w in critical_words):
            severity = "critical"
            confidence = 0.7
        elif any(w in text for w in high_words):
            severity = "high"
            confidence = 0.7
        elif any(w in text for w in medium_words):
            severity = "medium"
            confidence = 0.6
        else:
            severity = "low"
            confidence = 0.5
        
        return {
            "severity": severity,
            "confidence": confidence,
            "reasoning": "Keyword-based assessment (Gemini unavailable)",
            "source": "keyword_fallback"
        }


# Singleton instance
_similarity_service = None

def get_gemini_similarity_service() -> GeminiSimilarityService:
    """Get or create the Gemini similarity service."""
    global _similarity_service
    if _similarity_service is None:
        _similarity_service = GeminiSimilarityService()
    return _similarity_service