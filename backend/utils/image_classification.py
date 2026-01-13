"""
Image Classification Service - TEMPORARILY DISABLED
Hugging Face Free Inference API was deprecated in January 2026 (HTTP 410 Gone)
Classification feature temporarily disabled until free alternative is found
"""
from typing import Dict, List
import os
from dotenv import load_dotenv

load_dotenv()

class ImageClassificationService:
    """
    Image classification temporarily disabled
    
    REASON: Hugging Face free inference API discontinued as of January 2026
    All requests to api-inference.huggingface.co return HTTP 410 Gone
    
    Returns fallback response for all classification requests
    until a free alternative API is implemented
    """
    
    # DEPRECATED: Hugging Face API shut down (HTTP 410 as of Jan 2026)
    # Recommended migration: https://router.huggingface.co (PAID service only)
    API_URL = None  # Disabled - no free alternative found yet
    HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")
    
    # Category mapping preserved for future use when free API is found
    CATEGORY_MAPPING = {
        # Garbage/Waste related
        "trash can": "Garbage on Open Spaces",
        "dumpster": "Garbage on Open Spaces", 
        "waste container": "Garbage on Open Spaces",
        "garbage": "Garbage on Open Spaces",
        "litter": "Garbage on Open Spaces",
        
        # Road/Infrastructure
        "street": "Road Damage",
        "road": "Road Damage",
        "pavement": "Road Damage",
        "sidewalk": "Road Damage",
        "pothole": "Pothole",
        "asphalt": "Road Damage",
        
        # Water/Drainage
        "manhole": "Drainage Issues",
        "sewer": "Drainage Issues",
        "drain": "Drainage Issues",
        "water": "Water Leakage",
        "pipe": "Water Leakage",
        "puddle": "Drainage Issues",
        "flood": "Drainage Issues",
        
        # Lighting
        "street light": "Street Light Problem",
        "lamp": "Street Light Problem",
        "light": "Street Light Problem",
        "pole": "Street Light Problem",
        
        # Parks/Public spaces
        "park": "Park Issues",
        "bench": "Broken Bench",
        "playground": "Park Issues",
        "tree": "Park Issues",
        "grass": "Park Issues",
        
        # Infrastructure damage
        "wall": "Other",
        "fence": "Other",
        "barrier": "Other",
        "sign": "Other",
        "traffic": "Accident Spot"
    }
    
    @staticmethod
    async def classify_image(image_bytes: bytes) -> Dict:
        """
        Classification temporarily disabled due to API deprecation
        
        Args:
            image_bytes: Raw image bytes (not processed)
            
        Returns:
            Fallback response directing users to manual category selection
        """
        print("⚠️  Image classification disabled: Hugging Face Free API deprecated (HTTP 410)")
        print("📝 User must select category manually until free alternative is found")
        return ImageClassificationService._fallback_response()
    
    @staticmethod
    def _fallback_response() -> Dict:
        """
        Return fallback response when classification is unavailable
        """
        return {
            "predicted_category": "Other",
            "confidence": 0.0,
            "all_predictions": [],
            "should_manual_review": True,
            "message": "AI classification temporarily unavailable - Hugging Face API deprecated. Please select category manually."
        }
    
    @staticmethod
    def get_available_categories() -> List[str]:
        """
        Return list of supported civic problem categories
        """
        return [
            'Garbage on Open Spaces',
            'Road Damage',
            'Drainage Issues',
            'Street Light Problem',
            'Water Leakage',
            'Pothole',
            'Accident Spot',
            'Broken Bench',
            'Park Issues',
            'Other'
        ]
