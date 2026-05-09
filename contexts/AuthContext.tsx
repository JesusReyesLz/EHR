import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface ActiveSession {
  id: string;
  name: string;
  email: string;
  role: string;
  cedula?: string;
  clinicId: string;
  currentArea: string | null;
  isGuardMode: boolean;
  allowedModules: string[];
  staffId?: string;
}

interface GlobalSettings {
  clinicName: string;
  activeModules: string[];
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface AuthContextType {
  user: ActiveSession | null;
  token: string | null;
  globalSettings: GlobalSettings | null;
  login: (token: string, user: ActiveSession) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ActiveSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user?.clinicId) return;
    try {
      const docRef = doc(db, 'clinics', user.clinicId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalSettings({
          clinicName: data.name,
          activeModules: data.activeModules || [],
          logoUrl: data.logoUrl,
          address: data.address,
          phone: data.phone,
          email: data.email
        });
      }
    } catch (error) {
      console.error("Error fetching global settings", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          let allowedModules: string[] = [];
          if (userData.customModules) {
            allowedModules = JSON.parse(userData.customModules);
          } else if (userData.roleId) {
            const roleDoc = await getDoc(doc(db, 'roles', userData.roleId));
            if (roleDoc.exists()) {
              const roleData = roleDoc.data();
              if (roleData.defaultModules) {
                allowedModules = JSON.parse(roleData.defaultModules);
              }
            }
          }

          const activeSession: ActiveSession = {
            id: firebaseUser.uid,
            name: userData.name,
            email: userData.email,
            role: userData.roleId,
            cedula: userData.cedula,
            clinicId: userData.clinicId,
            currentArea: null,
            isGuardMode: false,
            allowedModules,
            staffId: userData.staffId
          };
          setToken(token);
          setUser(activeSession);
        } else {
          // If user doc doesn't exist, log them out
          await signOut(auth);
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.clinicId) {
      fetchSettings();
    }
  }, [user?.clinicId]);

  const login = (newToken: string, newUser: ActiveSession) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await signOut(auth);
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-500">Cargando sesión...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, globalSettings, login, logout, isAuthenticated: !!user, refreshSettings: fetchSettings }}>
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
