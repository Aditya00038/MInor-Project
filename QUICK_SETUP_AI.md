# ⚠️ AI FEATURES STATUS - January 2026

## 📌 Quick Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Auto Geo-Tagging** | ✅ WORKING | GPS + OpenStreetMap |  
| **Image Classification** | ⚠️ DISABLED | HuggingFace API deprecated |

---

## ✅ Auto Geo-Tagging - WORKING PERFECTLY

**Location detection works!** Privacy-safe address resolution using OpenStreetMap.

### How to use:
1. Click "Auto Location" button
2. Allow browser permission  
3. Address auto-fills (area/city only, no house numbers)

---

## ⚠️ Image Classification - TEMPORARILY DISABLED

### Why it's disabled:
Hugging Face shut down their free inference API (HTTP 410 Gone) in January 2026.  
We're researching free alternatives like TensorFlow.js or other APIs.

### What to do:
- ✅ Photo upload still works
- ✅ **Select category manually** from dropdown
- ✅ Everything else works normally

---

## 🚀 Setup Guide

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start Backend
```bash
python -m uvicorn main:app --reload
```
Backend: `http://localhost:8000`

### 3. Start Frontend
```bash
cd CitizenApp  
npm install
npm run dev
```
Frontend: `http://localhost:5173`

---

## 🧪 Testing

### Test Location (WORKS ✅)
1. Go to Report Problem page
2. Click "Auto Location"  
3. Allow location permission
4. **Expected:** Address appears with area/city/state

### Test Classification (DISABLED ⚠️)
1. Upload a photo
2. **Expected:** Yellow warning appears  
3. **Action:** Select category manually from dropdown

---

## 🔧 Troubleshooting

### "Location not loading"
- Enable browser location permissions
- Must use HTTPS or localhost
- Check backend is running on port 8000

### "Classification says unavailable"
- **This is normal!** API was deprecated
- Just select category manually
- Feature will return when free alternative is found

---

## 💰 Cost
**$0/month** - OpenStreetMap is free forever

---

## 📚 Full Documentation
See [AI_FEATURES_README.md](AI_FEATURES_README.md) for complete technical details.

---

Last updated: January 13, 2026
