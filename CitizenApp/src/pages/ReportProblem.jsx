import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Camera, X, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { motion } from 'framer-motion';

const BACKEND_URL = 'http://localhost:8000';

export default function ReportProblem() {
  const { currentUser } = useAuth();
  const { darkMode, colors } = useTheme();
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    location_text: '', // TEXT format: "City, State, Country"
    latitude: null,
    longitude: null
  });
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaType, setMediaType] = useState(null); // 'photo', 'video'
  const [locationStatus, setLocationStatus] = useState(null);
  const [locationAddress, setLocationAddress] = useState(''); // Store readable address
  const [classificationResult, setClassificationResult] = useState(null);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(true);

  // Auto-fetch location on component mount if enabled
  useEffect(() => {
    if (autoLocationEnabled && !formData.latitude) {
      getCurrentLocation();
    }
  }, [autoLocationEnabled]);

  const categories = [
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
  ];

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  async function getCurrentLocation() {
    setLocationStatus('getting');
    
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setTimeout(() => setLocationStatus(null), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        // Use backend geocoding endpoint (privacy-safe, no house numbers)
        try {
          const response = await fetch(`${BACKEND_URL}/api/reports/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
          });
          
          if (!response.ok) throw new Error('Geocoding failed');
          
          const data = await response.json();
          const addressData = data.address;
          
          // Use privacy-safe display text (no house numbers)
          const displayAddress = addressData.display_text || `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
          
          setLocationAddress(displayAddress);
          setFormData(prev => ({ 
            ...prev, 
            location_text: displayAddress,
            latitude,
            longitude 
          }));
          setLocationStatus('success');
          setTimeout(() => setLocationStatus(null), 3000);
          
        } catch (error) {
          console.error('Backend geocoding error, using fallback:', error);
          // Fallback: show coordinates only
          const location_text = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
          setLocationAddress(`⚠️ ${location_text} (Address lookup failed - check backend connection)`);
          setFormData(prev => ({ 
            ...prev, 
            location_text,
            latitude,
            longitude 
          }));
          setLocationStatus('geocode-error');
          setTimeout(() => setLocationStatus(null), 3000);
        }
      },
      (error) => {
        console.error('Geolocation permission denied or error:', error);
        setLocationStatus('error');
        setTimeout(() => setLocationStatus(null), 3000);
        
        // Show helpful message based on error
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location permission denied. Please enable location access in your browser settings to auto-fill address.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert('Location unavailable. Please enter address manually.');
        } else {
          alert('Location timeout. Please try again or enter address manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  async function startCamera() {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Unable to access camera');
      setCameraActive(false);
    }
  }

  function capturePhoto() {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.toBlob(blob => {
        setMedia(blob);
        setPreview(canvasRef.current.toDataURL());
        setMediaType('photo');
        stopCamera();
        // Automatically classify the captured image
        classifyImage(blob);
      });
    }
  }

  async function classifyImage(imageBlob) {
    if (!imageBlob) return;
    
    try {
      setClassificationResult({ loading: true });
      
      const formData = new FormData();
      formData.append('file', imageBlob);
      
      const response = await fetch(`${BACKEND_URL}/api/reports/classify-image`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Classification failed');
      
      const data = await response.json();
      const classification = data.classification;
      
      setClassificationResult({
        loading: false,
        category: classification.predicted_category,
        confidence: classification.confidence,
        shouldReview: classification.should_manual_review,
        message: classification.message
      });
      
      // Auto-fill category if confidence is high
      if (!classification.should_manual_review && classification.confidence > 0.4) {
        setFormData(prev => ({
          ...prev,
          category: classification.predicted_category
        }));
      }
      
    } catch (error) {
      console.error('Image classification error:', error);
      setClassificationResult({
        loading: false,
        category: null,
        confidence: 0,
        shouldReview: true,
        message: 'Auto-classification unavailable - please select category manually'
      });
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setPreview(URL.createObjectURL(file));
      setMediaType(file.type.startsWith('video/') ? 'video' : 'photo');
      // Automatically classify uploaded image
      if (file.type.startsWith('image/')) {
        classifyImage(file);
      }
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  }

  function removeMedia() {
    setMedia(null);
    setPreview(null);
    setMediaType(null);
    setClassificationResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.category || !formData.description || !formData.location_text) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = '';
      let uploadStatus = 'Starting upload...';

      if (media) {
        try {
          // Upload to backend instead of Firebase Storage (avoids CORS issues)
          const formDataUpload = new FormData();
          formDataUpload.append('file', media);
          
          const uploadResponse = await fetch('http://localhost:8000/api/uploads/upload', {
            method: 'POST',
            body: formDataUpload
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }

          const uploadedFile = await uploadResponse.json();
          mediaUrl = `http://localhost:8000${uploadedFile.url}`;
          console.log('✓ File uploaded successfully:', mediaUrl);
        } catch (uploadError) {
          console.warn('Backend upload failed, trying Firebase Storage...', uploadError);
          // Fallback: Try Firebase Storage if backend upload fails
          try {
            const storageRef = ref(storage, `reports/${Date.now()}_${mediaType}`);
            await uploadBytes(storageRef, media);
            mediaUrl = await getDownloadURL(storageRef);
            console.log('✓ Firebase upload succeeded:', mediaUrl);
          } catch (firebaseError) {
            console.warn('Firebase Storage also failed, proceeding without media', firebaseError);
            // Continue without media if both uploads fail
          }
        }
      }

      // Add report - NOW WITH TEXT LOCATION
      const reportRef = await addDoc(collection(db, 'reports'), {
        category: formData.category,
        description: formData.description,
        location_text: formData.location_text, // Store text address
        latitude: formData.latitude,
        longitude: formData.longitude,
        mediaUrl,
        mediaType,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Anonymous',
        status: 'submitted',
        points: 3,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✓ Report submitted:', reportRef.id);

      // Add points to user profile (3 points for submitting)
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        points: (await getUserPoints()) + 3,
        reportsSubmitted: (await getUserReportsCount()) + 1
      }).catch(() => {
        // If document doesn't exist, create it
        addDoc(collection(db, 'users'), {
          uid: currentUser.uid,
          email: currentUser.email,
          points: 3,
          reportsSubmitted: 1,
          createdAt: serverTimestamp()
        });
      });

      setSuccess(true);
      setFormData({ category: '', description: '', location_text: '', latitude: null, longitude: null });
      removeMedia();
      setLocationAddress('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again. Error: ' + error.message);
    }
    setLoading(false);
  }

  async function getUserPoints() {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snapshot = await userRef.get?.();
      return snapshot?.data?.().points || 0;
    } catch {
      return 0;
    }
  }

  async function getUserReportsCount() {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snapshot = await userRef.get?.();
      return snapshot?.data?.().reportsSubmitted || 0;
    } catch {
      return 0;
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'} pt-20 pb-12 px-4`}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Report a Problem
          </h1>
          <p className={`${colors.textSecondary} text-lg`}>Help us improve your community by reporting civic issues</p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center gap-3"
          >
            <CheckCircle size={24} />
            <div>
              <p className="font-bold">Report submitted successfully!</p>
              <p className="text-sm">You earned 3 points! Workers will be notified.</p>
            </div>
          </motion.div>
        )}

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${colors.surface} rounded-2xl shadow-xl p-8 space-y-6 ${colors.border} border`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <motion.div whileHover={{ scale: 1.01 }} className="group">
              <label className={`block text-lg font-semibold ${colors.text} mb-3`}>
                Problem Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} rounded-xl focus:border-blue-600 focus:outline-none transition-colors text-base`}
              >
                <option value="">Select a category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </motion.div>

            {/* Description */}
            <motion.div whileHover={{ scale: 1.01 }} className="group">
              <label className={`block text-lg font-semibold ${colors.text} mb-3`}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the problem in detail... (min 10 characters)"
                rows="5"
                required
                className={`w-full px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' : 'border-gray-200 bg-white text-gray-900'} rounded-xl focus:border-blue-600 focus:outline-none transition-colors text-base resize-none`}
              />
            </motion.div>

            {/* Location Section */}
            <motion.div className="group">
              <label className={`block text-lg font-semibold ${colors.text} mb-3`}>
                Location *
              </label>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  name="location_text"
                  value={formData.location_text}
                  onChange={handleChange}
                  placeholder="City, State, Country (or use GPS...)"
                  required
                  className={`flex-1 px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' : 'border-gray-200 bg-white text-gray-900'} rounded-xl focus:border-blue-600 focus:outline-none transition-colors`}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <MapPin size={20} />
                  Auto Location
                </motion.button>
              </div>
              {locationStatus === 'getting' && (
                <p className="text-blue-600 text-sm flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Getting location...
                </p>
              )}
              {locationStatus === 'success' && (
                <p className="text-green-600 text-sm flex items-center gap-2">
                  ✓ Location: {locationAddress}
                </p>
              )}
              {locationStatus === 'error' && (
                <p className="text-red-600 text-sm">Please enter location manually</p>
              )}
              {locationStatus === 'geocode-error' && (
                <p className="text-orange-600 text-sm flex items-center gap-2">
                  ⚠️ Got coordinates but address lookup failed. Make sure backend is running.
                </p>
              )}
              {formData.location_text && (
                <p className={`${colors.textSecondary} text-xs mt-2`}>📍 {formData.location_text}</p>
              )}
            </motion.div>

            {/* Camera Section */}
            <motion.div className="group">
              <label className={`block text-lg font-semibold ${colors.text} mb-3`}>
                Capture Photo/Video (Optional)
              </label>
              
              {!cameraActive ? (
                <div className="space-y-3">
                  {!preview && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={startCamera}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-3 text-lg"
                    >
                      <Camera size={24} />
                      Open Camera
                    </motion.button>
                  )}
                  {preview && (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden shadow-lg">
                        {mediaType === 'photo' ? (
                          <img src={preview} alt="Captured" className="w-full h-auto" />
                        ) : (
                          <video src={preview} controls className="w-full h-auto" />
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={removeMedia}
                          className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700"
                        >
                          <X size={20} />
                        </motion.button>
                      </div>
                      
                      {/* AI Classification Result */}
                      {classificationResult && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl ${
                            classificationResult.loading
                              ? darkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                              : classificationResult.shouldReview
                              ? darkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
                              : darkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {classificationResult.loading ? (
                                <div className="animate-spin text-blue-600">
                                  <Sparkles size={20} />
                                </div>
                              ) : classificationResult.shouldReview ? (
                                <AlertCircle size={20} className="text-yellow-600" />
                              ) : (
                                <CheckCircle size={20} className="text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${
                                classificationResult.loading
                                  ? 'text-blue-600'
                                  : classificationResult.shouldReview
                                  ? 'text-yellow-700'
                                  : 'text-green-700'
                              }`}>
                                {classificationResult.loading ? 'AI analyzing image...' : '🤖 AI Suggestion'}
                              </p>
                              {!classificationResult.loading && (
                                <>
                                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {classificationResult.message}
                                  </p>
                                  {classificationResult.category && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Category:
                                      </span>
                                      <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-full">
                                        {classificationResult.category}
                                      </span>
                                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        ({Math.round(classificationResult.confidence * 100)}% confidence)
                                      </span>
                                    </div>
                                  )}
                                  {classificationResult.shouldReview && (
                                    <p className={`text-xs mt-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                                      💡 Tip: AI confidence is low. Please verify or change the category above.
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* File Upload Alternative */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className={`block text-center py-2 px-4 ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          } rounded-lg cursor-pointer hover:bg-opacity-80 transition-all text-sm`}
                        >
                          📎 Or upload from gallery
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-xl shadow-lg"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                    width={320}
                    height={240}
                  />
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
                    >
                      Capture Photo
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={stopCamera}
                      className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting Report...
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  Submit Report & Earn 3 Points
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-8 ${darkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-600'} border-l-4 rounded-lg p-6`}
        >
          <h3 className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-2`}>💡 How it works:</h3>
          <ul className={`${darkMode ? 'text-blue-200' : 'text-blue-800'} space-y-1 text-sm`}>
            <li>✓ Submit a problem and earn 3 points</li>
            <li>✓ Workers get notified and work on it</li>
            <li>✓ Track problem status (Submitted → In Progress → Done)</li>
            <li>✓ Earn rewards at 100, 200+ points</li>
          </ul>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
