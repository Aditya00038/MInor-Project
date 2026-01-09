import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Camera, Upload, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

export default function ReportProblem() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    location: ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = [
    'Garbage on Open Spaces',
    'Road Damage',
    'Drainage Issues',
    'Street Light Problem',
    'Water Leakage',
    'Pothole',
    'Other'
  ];

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setFormData({ ...formData, location });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      if (file) {
        const storageRef = ref(storage, `reports/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'reports'), {
        ...formData,
        imageUrl,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        status: 'Reported',
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setFormData({ category: '', description: '', location: '' });
      setFile(null);
      setPreview(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Report a Problem</h1>
        <p>Help us improve your community by reporting civic issues</p>
      </div>

      {success && (
        <div className="success-message">
          <AlertCircle size={20} />
          Report submitted successfully! We'll keep you updated.
        </div>
      )}

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label>Problem Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the problem in detail..."
            rows="5"
            required
          />
        </div>

        <div className="form-group">
          <label>Location *</label>
          <div className="location-input">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location or use GPS"
              required
            />
            <button type="button" onClick={getCurrentLocation} className="location-btn">
              <MapPin size={20} />
              Get Location
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Upload Image/Video</label>
          <div className="file-upload">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              <Camera size={24} />
              <span>{file ? file.name : 'Choose a file'}</span>
            </label>
          </div>
          {preview && (
            <div className="preview">
              {file?.type.startsWith('video/') ? (
                <video src={preview} controls className="preview-media" />
              ) : (
                <img src={preview} alt="Preview" className="preview-media" />
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? (
            <>
              <Upload size={20} className="spinning" />
              Submitting...
            </>
          ) : (
            <>
              <Upload size={20} />
              Submit Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
