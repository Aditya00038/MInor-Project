# CitizenApp - Civic Issue Reporting Platform

A comprehensive web application for citizens to report and track civic infrastructure issues with visual verification and transparent resolution tracking.

## 🎯 Project Overview

This platform connects citizens, field workers, and government authorities to ensure timely resolution of civic infrastructure issues like:
- Garbage on open spaces
- Road damage
- Drainage issues
- Street light problems
- Water leakage
- Potholes

## ✨ Features

### 🔐 Authentication
- User registration and login using Firebase Authentication
- Secure email/password authentication
- Protected routes for authenticated users

### 🏠 Home Dashboard
- Quick action buttons for all major features
- Visual statistics of reports (Total, Resolved, Pending)
- Step-by-step guide on how the system works

### 📝 Report Problem
- Multi-category problem reporting
- Image/Video upload for visual proof
- GPS location capture (automatic or manual)
- Real-time status tracking

### 📍 Track Reports
- View all submitted reports
- Filter by status (Reported, Assigned, In Progress, Completed)
- Detailed report view with before/after images
- Real-time updates using Firestore

### 💬 Chatbot Assistant
- Interactive chatbot for instant help
- Pre-defined responses for common queries
- Quick question buttons
- Information about reporting, tracking, and system features

### 🏆 Leaderboard
- Top-performing workers ranking
- Performance metrics (Tasks completed, Ratings, Efficiency)
- Visual podium for top 3 workers
- Complete rankings table

### 👤 Profile & Settings
- Update profile information
- Change password
- Notification preferences
- Email and push notification settings

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Lucide React** - Icons

### Backend & Database
- **Firebase Authentication** - User management
- **Cloud Firestore** - Real-time database
- **Firebase Storage** - Image/video storage

### Styling
- **CSS3** - Custom styling with responsive design

## 📦 Installation

1. **Navigate to project directory**
\`\`\`bash
cd CitizenApp
\`\`\`

2. **Install dependencies** (already installed)
\`\`\`bash
npm install
\`\`\`

3. **Start development server**
\`\`\`bash
npm run dev
\`\`\`

4. **Open browser**
Navigate to `http://localhost:5173`

## 🔥 Firebase Configuration

The app is configured with Firebase services:
- **Authentication**: Email/Password authentication
- **Firestore**: Real-time database for reports
- **Storage**: Image/video storage

Configuration file: `src/firebase/config.js`

## 📱 Application Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | User authentication |
| `/register` | Register | New user registration |
| `/` | Home | Dashboard with statistics |
| `/report` | Report Problem | Submit new civic issue |
| `/track` | Track Reports | View all reports with filters |
| `/chatbot` | Chatbot | Interactive help assistant |
| `/leaderboard` | Leaderboard | Worker performance rankings |
| `/profile` | Profile | User settings and preferences |

## 🔒 Security Features
- Protected routes (authentication required)
- Firebase security rules
- User-specific data access
- Secure password handling

## 📊 Firestore Data Structure

### Reports Collection
\`\`\`javascript
{
  category: string,
  description: string,
  location: string,
  imageUrl: string,
  afterImageUrl: string,  // Added after completion
  userId: string,
  userEmail: string,
  userName: string,
  status: "Reported" | "Assigned" | "In Progress" | "Completed",
  createdAt: Timestamp
}
\`\`\`

## 👥 User Flow

1. **Register/Login** → Create account or sign in
2. **Home Dashboard** → View statistics and quick actions
3. **Report Problem** → Submit civic issue with photo/video
4. **Track Reports** → Monitor resolution status
5. **View Details** → See before-after images
6. **Use Chatbot** → Get instant help
7. **Check Leaderboard** → View worker performance
8. **Manage Profile** → Update settings and preferences

## 🎓 For Minor Project Presentation

### Key Highlights:
1. **Real-World Problem**: Addresses civic infrastructure issues
2. **Transparency**: Visual proof through images
3. **User-Friendly**: Clean, intuitive interface
4. **Real-time Updates**: Live status tracking
5. **Scalable**: Foundation for AI/ML integration
6. **Secure**: Firebase authentication

### Demo Sequence:
1. Show registration/login process
2. Report a sample problem with image
3. Track report status with filters
4. Demonstrate chatbot functionality
5. Show leaderboard rankings
6. Update profile settings

## 🚀 Future Enhancements

For Major Project:
- AI/ML-based problem detection from images
- Advanced analytics dashboard
- Mobile app (React Native)
- Real-time push notifications
- Government admin panel
- Worker mobile application
- Automated task assignment
- Multi-language support

## 📝 Project Structure
\`\`\`
CitizenApp/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── firebase/
│   │   └── config.js
│   ├── pages/
│   │   ├── Auth.css
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Home.jsx & Home.css
│   │   ├── ReportProblem.jsx & .css
│   │   ├── TrackReports.jsx & .css
│   │   ├── Chatbot.jsx & .css
│   │   ├── Leaderboard.jsx & .css
│   │   └── Profile.jsx & .css
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
└── package.json
\`\`\`

---

**Built for making cities better through citizen participation 🏙️**

