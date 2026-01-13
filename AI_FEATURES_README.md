# AI Features Documentation

## ⚠️ IMPORTANT UPDATE - January 2026

### Feature Status

| Feature | Status | Details |
|---------|--------|---------|
| **Auto Geo-Tagging** | ✅ FULLY WORKING | Privacy-safe location detection |
| **Image Classification** | ⚠️ TEMPORARILY DISABLED | API deprecated, researching alternatives |

---

## What Happened to Image Classification?

**Hugging Face Free Inference API has been deprecated** as of January 2026.

- **Error:** HTTP 410 Gone  
- **Message:** "api-inference.huggingface.co is no longer supported"
- **Paid Alternative:** `router.huggingface.co` (requires billing)
- **Our Action:** Temporarily disabled until free alternative is found

**Impact:** Users must manually select problem category from dropdown. All other features work normally.

---

## Feature 1: Auto Geo-Tagging ✅ WORKING

### Overview
Automatically detects user location and converts to privacy-safe address.

### How It Works
1. User clicks "Auto Location" button
2. Browser Geolocation API gets GPS coordinates  
3. Backend calls OpenStreetMap Nominatim API
4. Privacy filter removes house numbers
5. Address auto-fills with area/city/state only

### Privacy Guarantees
- ✅ No house numbers exposed
- ✅ No exact building addresses  
- ✅ Only general area shown (suburb/city/state)
- ✅ OpenStreetMap respects privacy (no tracking)

### Technical Implementation

**Frontend (`CitizenApp/src/pages/ReportProblem.jsx`):**
```javascript
const getCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      const response = await fetch(`${BACKEND_URL}/api/reports/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
      });
      
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        location_text: data.address.display_text,
        latitude,
        longitude
      }));
    },
    (error) => {
      // Handle permission denied / timeout
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};
```

**Backend (`backend/routes/reports.py`):**
```python
@router.post("/geocode")
async def reverse_geocode(data: Dict):
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    
    # Validate coordinates
    if not await GeocodingService.validate_coordinates(latitude, longitude):
        raise HTTPException(status_code=400, detail="Invalid coordinates")
    
    # Get privacy-safe address
    address = await GeocodingService.reverse_geocode(latitude, longitude)
    
    return {
        "success": True,
        "address": address,
        "coordinates": {"latitude": latitude, "longitude": longitude}
    }
```

**Geocoding Service (`backend/utils/geocoding.py`):**
```python
class GeocodingService:
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
    
    @staticmethod
    async def reverse_geocode(latitude: float, longitude: float) -> Dict:
        params = {
            "format": "json",
            "lat": latitude,
            "lon": longitude,
            "zoom": 18,
            "addressdetails": 1
        }
        
        headers = {
            "User-Agent": "CivicReportApp/1.0"  # Required by Nominatim
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                GeocodingService.NOMINATIM_URL,
                params=params,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return GeocodingService._format_display_address(data.get("address", {}))
    
    @staticmethod
    def _format_display_address(address: Dict) -> Dict:
        # Privacy filter - REMOVE house_number, building, house_name
        parts = []
        if road := address.get("road"):
            parts.append(road)
        if suburb := address.get("suburb"):
            parts.append(suburb)
        if city := address.get("city") or address.get("town") or address.get("village"):
            parts.append(city)
        if state := address.get("state"):
            parts.append(state)
        if country := address.get("country"):
            parts.append(country)
        
        return {
            "road": address.get("road", ""),
            "suburb": address.get("suburb", ""),
            "city": city,
            "state": address.get("state", ""),
            "country": address.get("country", ""),
            "display_text": ", ".join(parts)
        }
```

### API Endpoint

**Request:**
```http
POST http://localhost:8000/api/reports/geocode
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response:**
```json
{
  "success": true,
  "address": {
    "road": "Connaught Place",
    "suburb": "Connaught Place",
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "display_text": "Connaught Place, New Delhi, Delhi, India"
  },
  "coordinates": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

### Testing
```bash
# Test with curl
curl -X POST http://localhost:8000/api/reports/geocode \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.6139, "longitude": 77.2090}'
```

---

## Feature 2: Image Classification ⚠️ DISABLED

### Why It's Disabled
Hugging Face deprecated their free inference API in January 2026. All requests return:
```
HTTP 410 Gone
Message: "api-inference.huggingface.co is no longer supported. Please use router.huggingface.co instead."
```

The new `router.huggingface.co` endpoint requires paid billing setup.

### Current Behavior
- Endpoint still exists but returns fallback response
- No AI processing occurs
- Users see warning message: "AI classification temporarily unavailable"
- Manual category selection required

### Technical Implementation (Disabled)

**Backend (`backend/utils/image_classification.py`):**
```python
class ImageClassificationService:
    """Classification temporarily disabled - API deprecated"""
    
    API_URL = None  # Disabled
    
    @staticmethod
    async def classify_image(image_bytes: bytes) -> Dict:
        print("⚠️ Classification disabled: HuggingFace API deprecated")
        return ImageClassificationService._fallback_response()
    
    @staticmethod
    def _fallback_response() -> Dict:
        return {
            "predicted_category": "Other",
            "confidence": 0.0,
            "all_predictions": [],
            "should_manual_review": True,
            "message": "AI classification temporarily unavailable - Hugging Face API deprecated. Please select category manually."
        }
```

### Future Plans
Researching free alternatives:
1. **TensorFlow.js** - Client-side classification (no backend needed)
2. **Replicate.com** - Free tier available
3. **Cloudflare Workers AI** - Free tier with limits
4. **Self-hosted model** - MobileNet or EfficientNet

---

## Setup Instructions

### Prerequisites
- Python 3.9+ with pip
- Node.js 16+ with npm
- MySQL 8.0+
- Modern browser (Chrome/Firefox/Edge)

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `httpx` - Async HTTP client for OpenStreetMap
- `python-multipart` - File upload support
- `mysql-connector-python` - Database
- `python-dotenv` - Environment variables

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=citizen_app_db

# Backend
PORT=8000
ENV=development

# Note: HUGGINGFACE_API_TOKEN not needed (classification disabled)
```

3. **Start backend:**
```bash
python -m uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
```bash
cd CitizenApp
npm install
```

2. **Configure backend URL:**
In `CitizenApp/src/pages/ReportProblem.jsx`:
```javascript
const BACKEND_URL = 'http://localhost:8000';  // Already set
```

3. **Start dev server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Testing Guide

### Test 1: Auto-Location (WORKING ✅)

1. Open `http://localhost:5173`
2. Navigate to "Report Problem" page
3. Click "Auto Location" button  
4. Browser asks for location permission - click "Allow"
5. **Expected Result:**
   - Address appears within 2-3 seconds
   - Shows: "Connaught Place, New Delhi, Delhi, India"
   - NO house numbers visible
   - Location icon turns green with checkmark

**Success Criteria:**
- ✅ No errors in browser console
- ✅ Address is human-readable
- ✅ No house numbers shown
- ✅ Latitude/longitude saved in form state

**If it fails:**
- Check browser console for errors
- Verify backend is running (`http://localhost:8000/docs`)
- Test geocode endpoint directly with curl
- Check browser location permissions

### Test 2: Image Classification (DISABLED ⚠️)

1. On Report Problem page, click "Capture Photo" or upload image
2. **Expected Result:**
   - Photo appears in preview
   - Yellow warning card appears:
     - Icon: ⚠️ AlertCircle  
     - Text: "AI classification temporarily unavailable"
     - Message: "Please select category manually"
   - Category dropdown remains empty (not auto-filled)

3. **Action Required:**
   - Manually select category from dropdown
   - Continue with report submission

**Success Criteria:**
- ✅ Photo upload works
- ✅ Warning message displays correctly
- ✅ No errors in console
- ✅ Report can be submitted after manual selection

---

## API Documentation

### Geocoding Endpoint ✅

**Endpoint:** `POST /api/reports/geocode`

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response (Success):**
```json
{
  "success": true,
  "address": {
    "road": "Connaught Place",
    "suburb": "Connaught Place",
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "display_text": "Connaught Place, New Delhi, Delhi, India"
  },
  "coordinates": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

**Response (Error - Invalid Coordinates):**
```json
{
  "detail": "Invalid coordinates"
}
```

**Rate Limits:**
- OpenStreetMap: 1 request/second (fair use)
- Our implementation: No artificial limits

### Classification Endpoint ⚠️ (Disabled)

**Endpoint:** `POST /api/reports/classify-image`

**Request Body:** `multipart/form-data`
```
file: [image blob]
```

**Response (Always Fallback):**
```json
{
  "success": true,
  "classification": {
    "predicted_category": "Other",
    "confidence": 0.0,
    "should_manual_review": true,
    "message": "AI classification temporarily unavailable - Hugging Face API deprecated. Please select category manually.",
    "all_predictions": []
  },
  "available_categories": [
    "Garbage on Open Spaces",
    "Road Damage",
    "Drainage Issues",
    "Street Light Problem",
    "Water Leakage",
    "Pothole",
    "Accident Spot",
    "Broken Bench",
    "Park Issues",
    "Other"
  ]
}
```

---

## Troubleshooting

### Problem: "Location permission denied"
**Solution:**
1. Check browser address bar for location icon
2. Click icon → Permissions → Location → Allow
3. For Chrome: Settings → Privacy → Site Settings → Location
4. Reload page and try again

### Problem: "Location timeout"
**Solution:**
- Enable device GPS/location services
- Try outdoors or near window (better GPS signal)
- Increase timeout in code (currently 10s)
- Use manual address entry as fallback

### Problem: "Geocoding failed"
**Solution:**
- Check backend is running: `http://localhost:8000/docs`
- Test endpoint directly:
  ```bash
  curl -X POST http://localhost:8000/api/reports/geocode \
    -H "Content-Type: application/json" \
    -d '{"latitude": 28.6139, "longitude": 77.2090}'
  ```
- Check backend logs for errors
- Verify internet connection (needs OpenStreetMap access)

### Problem: "Classification warning appears"
**This is normal!** Classification is disabled. Just select category manually from dropdown.

### Problem: "CORS errors"
**Solution:**
- Verify backend CORS settings in `main.py`
- Ensure frontend uses correct `BACKEND_URL`
- Check browser console for specific CORS error

---

## Cost Analysis

| Service | Usage | Cost |
|---------|-------|------|
| OpenStreetMap Nominatim | Reverse geocoding | **$0/month** |
| Browser Geolocation API | Built-in GPS | **$0/month** |
| Hugging Face API | ~~Classification~~ DEPRECATED | N/A |
| **TOTAL** | | **$0/month** |

**Notes:**
- OpenStreetMap is free forever (fair use policy)
- No API keys required for geocoding
- No billing setup needed
- Suitable for student/academic projects

---

## Future Enhancements

### Short-term (Classification alternatives):
1. **TensorFlow.js integration**
   - Run MobileNet in browser
   - No backend needed
   - Works offline
   - ~2MB model size

2. **Replicate.com free tier**
   - Free inference API
   - Better models available
   - Easy integration

3. **Cloudflare Workers AI**
   - Free tier: 10,000 requests/day
   - Fast inference
   - Global CDN

### Long-term:
- Fine-tune custom civic issues model
- Offline classification with cached models
- Multi-lingual category translation
- Advanced image preprocessing (blur faces/plates)
- Mobile app with native camera integration

---

## Architecture Diagrams

### Geo-Tagging Flow
```
User clicks "Auto Location"
  ↓
Browser Geolocation API → Gets GPS coordinates
  ↓
Frontend → POST /api/reports/geocode {lat, lng}
  ↓
Backend Geocoding Service → OpenStreetMap API
  ↓
Privacy Filter → Remove house numbers
  ↓
Return {road, suburb, city, state, country}
  ↓
Frontend → Auto-fill address field
```

### Classification Flow (Current - Disabled)
```
User uploads photo
  ↓
Frontend → POST /api/reports/classify-image
  ↓
Backend → ImageClassificationService.classify_image()
  ↓
Return fallback response (no AI processing)
  ↓
Frontend → Show warning, require manual selection
```

---

## Contributing

### Want to help restore classification?

**Research these alternatives:**
1. TensorFlow.js + MobileNet
2. Replicate.com API
3. Cloudflare Workers AI
4. Other free ML APIs

**Submit PR with:**
- Updated `image_classification.py`
- Working implementation
- Documentation
- Test results

---

## Support

**Issues? Questions?**
- Check this README first
- Review [QUICK_SETUP_AI.md](QUICK_SETUP_AI.md)
- Open GitHub issue with:
  - Feature affected (geo-tagging/classification)
  - Error message
  - Browser console logs
  - Backend logs

---

Last updated: January 13, 2026  
Location Feature: ✅ Fully Working  
Classification Feature: ⚠️ Temporarily Disabled (API deprecated)
