# 🚀 AI-Powered Features Documentation

## 🎯 Overview

This civic reporting platform includes two intelligent automation features designed to enhance user experience while maintaining strict privacy standards:

1. **🌍 Automatic Geo-Tagging & Address Resolution** - Privacy-first location services
2. **🤖 AI Image Classification** - Free, open-source problem category detection

---

## 1. 🌍 Automatic Geo-Tagging

### Features
- **One-click location capture** using browser Geolocation API
- **Privacy-respecting address resolution** via OpenStreetMap Nominatim
- **No house numbers or exact addresses** exposed
- **Graceful permission handling** with fallback options
- **Mobile PWA compatible**

### How It Works

```
User clicks "Auto Location"
    ↓
Browser requests GPS permission
    ↓
Coordinates sent to backend
    ↓
OpenStreetMap reverse geocoding
    ↓
Privacy-filtered address returned
    (Road/Area, Suburb, City, State)
    ↓
Displayed to user (no house numbers)
```

### Privacy Guarantees
- ✅ **No house numbers** - Only street/area names
- ✅ **No building identifiers** - General location only
- ✅ **Numeric coordinates stored internally** - For worker routing
- ✅ **Human-readable address for display** - User-friendly UI
- ✅ **Permission denial handled gracefully** - Manual entry fallback

### API Endpoint

**POST** `/api/reports/geocode`

```json
Request:
{
  "latitude": 28.6139,
  "longitude": 77.2090
}

Response:
{
  "success": true,
  "address": {
    "road": "Rajpath",
    "suburb": "Connaught Place",
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "display_text": "Rajpath, Connaught Place, New Delhi, Delhi"
  },
  "coordinates": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

### Frontend Usage

```javascript
// Automatic on page load
useEffect(() => {
  if (autoLocationEnabled) {
    getCurrentLocation();
  }
}, []);

// Manual trigger
<button onClick={getCurrentLocation}>
  Auto Location
</button>
```

---

## 2. 🤖 AI Image Classification

### Features
- **Free Hugging Face Inference API** - No billing required
- **Automatic category detection** from uploaded images
- **Confidence scoring** - Shows prediction reliability
- **Manual review option** - Low confidence → user verification
- **Privacy-focused** - No face detection or personal data
- **Modular design** - Easy to swap models or add custom ML

### Supported Categories

1. Garbage on Open Spaces
2. Road Damage
3. Drainage Issues
4. Street Light Problem
5. Water Leakage
6. Pothole
7. Accident Spot
8. Broken Bench
9. Park Issues
10. Other

### How It Works

```
User captures/uploads image
    ↓
Image sent to backend
    ↓
Hugging Face Vision Model (ViT)
    ↓
Label mapping to civic categories
    ↓
Confidence score calculated
    ↓
If confidence > 40%:
   → Auto-fill category
Else:
   → Show suggestion + manual review
```

### Model Architecture

- **Base Model**: `google/vit-base-patch16-224`
- **Type**: Vision Transformer (ViT)
- **Training**: ImageNet-21k → ImageNet-1k
- **Free Tier**: Hugging Face Inference API
- **Latency**: ~2-5 seconds (model loading + inference)

### Label Mapping Strategy

The system maps generic ImageNet labels to civic problem categories:

```python
CATEGORY_MAPPING = {
    "trash can": "Garbage on Open Spaces",
    "pothole": "Pothole",
    "street light": "Street Light Problem",
    "manhole": "Drainage Issues",
    "water": "Water Leakage",
    ...
}
```

### API Endpoint

**POST** `/api/reports/classify-image`

```json
Request: FormData with image file

Response:
{
  "success": true,
  "classification": {
    "predicted_category": "Road Damage",
    "confidence": 0.724,
    "should_manual_review": false,
    "message": "Category detected",
    "all_predictions": [
      {"label": "asphalt", "score": 0.724},
      {"label": "street", "score": 0.185},
      {"label": "road", "score": 0.091}
    ]
  },
  "available_categories": [...]
}
```

### Confidence Thresholds

| Confidence | Action | UI Feedback |
|------------|--------|-------------|
| **> 0.6** | Auto-fill, high trust | ✅ Green badge, "Category detected" |
| **0.4 - 0.6** | Auto-fill, suggest review | ⚠️ Yellow badge, "Please verify" |
| **< 0.4** | Manual selection required | ⚠️ Yellow badge, "Low confidence" |

### Privacy & Ethics

✅ **No face detection** - Model not trained on faces  
✅ **No personal identification** - Generic object recognition only  
✅ **No background tracking** - One-time classification per image  
✅ **No data retention** - Images not stored by Hugging Face  
✅ **User control** - Can always override AI suggestion  

---

## 🛠️ Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies:
- `httpx` - Async HTTP client for API calls
- `python-multipart` - File upload handling

### 2. Configure Hugging Face API (Optional)

Image classification requires a **free** Hugging Face API token:

1. Sign up at [https://huggingface.co/](https://huggingface.co/)
2. Go to [Settings → Tokens](https://huggingface.co/settings/tokens)
3. Create a new token (read access)
4. Add to `.env`:

```env
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: If you leave this empty, image classification will be disabled gracefully. Users will select categories manually.

### 3. Test Endpoints

```bash
# Start backend
cd backend
python -m uvicorn main:app --reload

# Test geocoding
curl -X POST http://localhost:8000/api/reports/geocode \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.6139, "longitude": 77.2090}'

# Test classification (with image file)
curl -X POST http://localhost:8000/api/reports/classify-image \
  -F "file=@test_image.jpg"
```

---

## 📊 Architecture

### Modular Design

```
backend/
├── utils/
│   ├── geocoding.py           # OpenStreetMap integration
│   └── image_classification.py # Hugging Face integration
├── routes/
│   └── reports.py             # API endpoints
└── main.py                    # FastAPI app

frontend/
└── CitizenApp/src/pages/
    └── ReportProblem.jsx       # Auto-location + AI UI
```

### Extensibility

**Easy model replacement**:
```python
# Switch to custom model
API_URL = "https://your-custom-model-endpoint"
```

**Add new categories**:
```python
# In image_classification.py
CATEGORY_MAPPING = {
    "new_label": "New Category",
    ...
}
```

---

## 🔒 Privacy & Security

### Data Flow

| Stage | Data | Privacy Protection |
|-------|------|-------------------|
| GPS capture | Exact coordinates | ✅ Never shown to user |
| Geocoding | Street/area name | ✅ No house numbers |
| Display | City, State only | ✅ Approximate location |
| Storage | Coordinates + text | ✅ Both formats saved |
| Image classification | Photo bytes | ✅ No faces, no tracking |
| ML inference | Generic labels | ✅ No personal data |

### Permissions

- **Location**: Optional, can be denied → manual entry
- **Camera**: Optional, can be denied → gallery upload
- **Files**: Optional, can skip media entirely

---

## 💰 Cost Analysis

### 100% Free Implementation

| Service | Tier | Cost | Limits |
|---------|------|------|--------|
| **OpenStreetMap Nominatim** | Free | $0 | 1 req/sec (fair use) |
| **Hugging Face Inference API** | Free | $0 | Rate-limited (acceptable) |
| **Browser Geolocation API** | Free | $0 | No limits |

**Total Monthly Cost**: **$0** ✅

### Scaling (Future)

If you outgrow free tiers:
- **Nominatim**: Self-host (open-source)
- **Hugging Face**: Deploy custom model on Hugging Face Spaces (free tier)
- **Alternative**: Use local ML models with TensorFlow.js

---

## 🧪 Testing

### Manual Testing

1. **Geo-tagging**:
   - Click "Auto Location"
   - Check browser permission prompt
   - Verify address displayed (no house number)
   - Try denying permission → manual entry works

2. **Image Classification**:
   - Upload garbage image → Check "Garbage on Open Spaces" detection
   - Upload road damage → Check "Road Damage" or "Pothole"
   - Upload random image → Check low confidence warning

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Location permission denied | Manual entry available |
| Geocoding API down | Show coordinates only |
| HF token missing | Classification disabled, manual selection |
| Low confidence (<0.4) | Yellow warning, suggest review |
| Network timeout | Graceful fallback |

---

## 🚀 Future Enhancements

### Planned Features

1. **Custom ML Model Training**
   - Fine-tune ViT on civic issues dataset
   - Deploy on Hugging Face Spaces (free)
   - Improve accuracy for local infrastructure

2. **Offline Mode**
   - Cache OpenStreetMap tiles
   - Download ML model for local inference
   - Service Worker caching

3. **Multi-lingual Support**
   - Translate categories
   - Regional label mapping

4. **Advanced Analytics**
   - Track classification accuracy
   - A/B test different models
   - User feedback loop

---

## 📚 References

- [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/)
- [Browser Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Vision Transformer (ViT) Paper](https://arxiv.org/abs/2010.11929)

---

## 🤝 Contributing

To improve AI features:

1. Add more category mappings in `image_classification.py`
2. Test with diverse civic issue images
3. Fine-tune confidence thresholds
4. Suggest better free ML models

---

## 📧 Support

For AI feature issues:
- Location not working → Check browser permissions
- Classification not working → Verify HF token in `.env`
- Slow classification → Normal on first request (model loading)

---

**Built with ❤️ for civic engagement**
