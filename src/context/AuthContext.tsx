import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface DatabaseUser {
  uid: string;
  email: string;
  name: string;
  phone: string | null;
  licenseNumber: string | null;
  profilePictureUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  averageRating?: number;
  reviewCount?: number;
}

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: DatabaseUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = async (firebaseUser: FirebaseUser, idToken: string) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setDbUser(data.data);
      } else {
        console.error('Failed to sync user with database:', data.error);
      }
    } catch (err) {
      console.error('Error syncing user with database:', err);
    }
  };

  const refreshDbUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setDbUser(data.data);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        await syncUser(firebaseUser, idToken);
      } else {
        setUser(null);
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, token, loading, loginWithGoogle, logout, refreshDbUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
