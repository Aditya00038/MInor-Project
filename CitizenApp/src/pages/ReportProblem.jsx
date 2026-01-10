import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Camera, X, AlertCircle, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { motion } from 'framer-motion';

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Get address from coordinates using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            // Format: "City, State, Country"
            const city = data.address?.city || data.address?.town || '';
            const state = data.address?.state || '';
            const country = data.address?.country || '';
            const location_text = [city, state, country].filter(Boolean).join(', ');
            
            setLocationAddress(location_text || `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
            setFormData(prev => ({ 
              ...prev, 
              location_text: location_text || `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
              latitude,
              longitude 
            }));
            setLocationStatus('success');
            setTimeout(() => setLocationStatus(null), 3000);
          } catch (error) {
            console.error('Geocoding error:', error);
            const location_text = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
            setLocationAddress(location_text);
            setFormData(prev => ({ 
              ...prev, 
              location_text,
              latitude,
              longitude 
            }));
            setLocationStatus('success');
            setTimeout(() => setLocationStatus(null), 3000);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationStatus('error');
          setTimeout(() => setLocationStatus(null), 3000);
        }
      );
    } else {
      setLocationStatus('error');
      setTimeout(() => setLocationStatus(null), 3000);
    }
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
      });
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
