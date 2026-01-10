import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = useCallback(async (user) => {
    if (!user) {
      setUserProfile(null);
      return null;
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const profile = { id: userSnap.id, ...userSnap.data() };
        setUserProfile(profile);
        return profile;
      } else {
        // Create a new user profile if it doesn't exist
        const newProfile = {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || null,
          points: 0,
          reportsSubmitted: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile({ id: user.uid, ...newProfile });
        return newProfile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Refresh user profile
  const refreshUserProfile = useCallback(async () => {
    if (currentUser) {
      return await fetchUserProfile(currentUser);
    }
    return null;
  }, [currentUser, fetchUserProfile]);

  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Create Firestore profile
    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, {
      email: email,
      displayName: displayName,
      photoURL: null,
      points: 0,
      reportsSubmitted: 0,
      createdAt: new Date().toISOString()
    });
    
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserProfile]);

  const value = {
    currentUser,
    userProfile,
    refreshUserProfile,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
