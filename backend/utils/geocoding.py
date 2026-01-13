"""
Geocoding utilities using OpenStreetMap Nominatim API
Privacy-respecting reverse geocoding without exposing exact addresses
"""
import httpx
from typing import Dict, Optional
import time

class GeocodingService:
    """
    Privacy-first geocoding service using OpenStreetMap Nominatim
    - Does not expose house numbers or exact street addresses
    - Returns only area, landmark, and city-level information
    """
    
    BASE_URL = "https://nominatim.openstreetmap.org"
    
    @staticmethod
    async def reverse_geocode(latitude: float, longitude: float) -> Dict[str, Optional[str]]:
        """
        Convert coordinates to privacy-respecting address
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude
            
        Returns:
            Dictionary with area, city, state, country (no house numbers)
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{GeocodingService.BASE_URL}/reverse",
                    params={
                        "format": "json",
                        "lat": latitude,
                        "lon": longitude,
                        "zoom": 16,  # Street level zoom without house numbers
                        "addressdetails": 1
                    },
                    headers={
                        "User-Agent": "CivicReportApp/1.0"  # Required by Nominatim
                    }
                )
                
                if response.status_code != 200:
                    return GeocodingService._fallback_address(latitude, longitude)
                
                data = response.json()
                address = data.get("address", {})
                
                # Extract privacy-safe address components
                # We deliberately omit house_number, building, specific addresses
                result = {
                    "road": address.get("road"),
                    "suburb": address.get("suburb") or address.get("neighbourhood") or address.get("quarter"),
                    "city": (
                        address.get("city") or 
                        address.get("town") or 
                        address.get("village") or
                        address.get("municipality")
                    ),
                    "state": address.get("state"),
                    "country": address.get("country"),
                    "postcode": address.get("postcode"),
                    # Generate display-friendly text
                    "display_text": GeocodingService._format_display_address(address),
                    "raw_display": data.get("display_name")  # Full name for reference
                }
                
                return result
                
        except Exception as e:
            print(f"Geocoding error: {str(e)}")
            return GeocodingService._fallback_address(latitude, longitude)
    
    @staticmethod
    def _format_display_address(address: dict) -> str:
        """
        Create a privacy-respecting display address
        Format: "Road/Area, Suburb/Neighbourhood, City, State"
        """
        components = []
        
        # Add road or area (but never house number)
        road = address.get("road")
        suburb = address.get("suburb") or address.get("neighbourhood") or address.get("quarter")
        
        if road and suburb and road != suburb:
            components.append(f"{road}, {suburb}")
        elif road:
            components.append(road)
        elif suburb:
            components.append(suburb)
        
        # Add city
        city = (
            address.get("city") or 
            address.get("town") or 
            address.get("village") or
            address.get("municipality")
        )
        if city:
            components.append(city)
        
        # Add state
        state = address.get("state")
        if state:
            components.append(state)
        
        return ", ".join(components) if components else None
    
    @staticmethod
    def _fallback_address(latitude: float, longitude: float) -> Dict[str, Optional[str]]:
        """
        Fallback when geocoding fails - return coordinates only
        """
        return {
            "road": None,
            "suburb": None,
            "city": None,
            "state": None,
            "country": None,
            "postcode": None,
            "display_text": f"{latitude:.4f}°, {longitude:.4f}°",
            "raw_display": f"Coordinates: {latitude:.4f}°, {longitude:.4f}°"
        }
    
    @staticmethod
    async def validate_coordinates(latitude: float, longitude: float) -> bool:
        """
        Validate that coordinates are within reasonable bounds
        """
        if not (-90 <= latitude <= 90):
            return False
        if not (-180 <= longitude <= 180):
            return False
        return True
