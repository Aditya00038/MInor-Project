"""
Image Classification Service using Hugging Face Inference API (FREE)
Classifies civic issues from uploaded images
"""
import httpx
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class ImageClassificationService:
    """
    Free image classification using Hugging Face Inference API
    - No billing required
    - Uses open-source vision models
    - Privacy-focused (no face detection)
    - Returns problem category with confidence score
    """
    
    # Free Hugging Face Inference API endpoint
    API_URL = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224"
    
    # Get API token from environment (free tier)
    # Sign up at https://huggingface.co/ to get free token
    HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")
    
    # Map vision model labels to civic problem categories
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
        Classify civic issue from image using free Hugging Face API
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            {
                "predicted_category": str,
                "confidence": float,
                "all_predictions": List[Dict],
                "should_manual_review": bool
            }
        """
        try:
            if not ImageClassificationService.HF_TOKEN:
                return ImageClassificationService._fallback_response()
            
            headers = {
                "Authorization": f"Bearer {ImageClassificationService.HF_TOKEN}"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    ImageClassificationService.API_URL,
                    headers=headers,
                    content=image_bytes
                )
                
                if response.status_code == 503:
                    # Model is loading, wait and retry once
                    await asyncio.sleep(5)
                    response = await client.post(
                        ImageClassificationService.API_URL,
                        headers=headers,
                        content=image_bytes
                    )
                
                if response.status_code != 200:
                    return ImageClassificationService._fallback_response()
                
                predictions = response.json()
                
                # Process predictions
                return ImageClassificationService._process_predictions(predictions)
                
        except Exception as e:
            print(f"Image classification error: {str(e)}")
            return ImageClassificationService._fallback_response()
    
    @staticmethod
    def _process_predictions(predictions: List[Dict]) -> Dict:
        """
        Map model predictions to civic problem categories
        """
        if not predictions:
            return ImageClassificationService._fallback_response()
        
        # Try to match predicted labels to our categories
        best_match = None
        best_confidence = 0.0
        
        for pred in predictions[:5]:  # Check top 5 predictions
            label = pred.get("label", "").lower()
            score = pred.get("score", 0.0)
            
            # Check if label matches any of our category keywords
            for keyword, category in ImageClassificationService.CATEGORY_MAPPING.items():
                if keyword in label:
                    if score > best_confidence:
                        best_match = category
                        best_confidence = score
                        break
        
        # Determine if manual review is needed
        # Require manual review if confidence < 0.4 or no match found
        should_manual_review = (best_confidence < 0.4) or (best_match is None)
        
        return {
            "predicted_category": best_match or "Other",
            "confidence": round(best_confidence, 3),
            "all_predictions": [
                {
                    "label": p.get("label"),
                    "score": round(p.get("score", 0), 3)
                }
                for p in predictions[:5]
            ],
            "should_manual_review": should_manual_review,
            "message": "Low confidence - please verify category" if should_manual_review else "Category detected"
        }
    
    @staticmethod
    def _fallback_response() -> Dict:
        """
        Return fallback response when classification fails
        """
        return {
            "predicted_category": "Other",
            "confidence": 0.0,
            "all_predictions": [],
            "should_manual_review": True,
            "message": "Auto-classification unavailable - please select category manually"
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


# Import asyncio for retry logic
import asyncio
