import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuthSuccess = async (user: any, isNewUser: boolean = false) => {
      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let activeSession;

      if (!userDoc.exists()) {
        // If it's the super admin's first login, bootstrap their account
        if (user.email === 'pruebkey77@gmail.com' || user.email === 'admin@medexpediente.mx') {
          const clinicId = 'CLINIC_DEFAULT';
          
          // Create default clinic
          await setDoc(doc(db, 'clinics', clinicId), {
            name: "Clínica Principal",
            address: "Configurar Dirección",
            phone: "Configurar Teléfono",
            email: "contacto@clinica.com",
            activeModules: ["Pacientes", "Consulta", "Inventario", "Caja", "Reportes", "Configuración", "Super Admin"],
            createdAt: new Date().toISOString()
          }, { merge: true });

          // Create super admin user
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || name || "Super Administrador",
            roleId: "SUPER_ADMIN",
            clinicId: clinicId,
            isActive: true,
            customModules: []
          });

          activeSession = {
            id: user.uid,
            name: user.displayName || name || "Super Administrador",
            email: user.email,
            role: "SUPER_ADMIN",
            clinicId: clinicId,
            currentArea: null,
            isGuardMode: false
          };
        } else if (isNewUser) {
          // Create a regular user document for newly registered users
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || name || "Usuario",
            roleId: "USER", // Default role
            clinicId: "CLINIC_DEFAULT", // Assign to default clinic for now
            isActive: true,
            customModules: []
          });

          activeSession = {
            id: user.uid,
            name: user.displayName || name || "Usuario",
            email: user.email,
            role: "USER",
            clinicId: "CLINIC_DEFAULT",
            currentArea: null,
            isGuardMode: false
          };
        } else {
          throw new Error('Usuario no registrado. Contacte al administrador de su clínica.');
        }
      } else {
        const userData = userDoc.data();
        
        if (!userData.isActive) {
          throw new Error('Usuario inactivo. Contacte al administrador.');
        }

        activeSession = {
          id: user.uid,
          name: userData.name,
          email: userData.email,
          role: userData.roleId,
          cedula: userData.cedula,
          clinicId: userData.clinicId,
          currentArea: null,
          isGuardMode: false
        };
      }

      const token = await user.getIdToken();
      login(token, activeSession);
      navigate('/');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isResettingPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Se ha enviado un enlace de recuperación a tu correo electrónico.');
        setIsResettingPassword(false);
      } else if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        await handleAuthSuccess(userCredential.user, true);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo electrónico ya está en uso');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else {
        setError(err.message || 'Error al autenticar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthSuccess(userCredential.user, true); // Pass true in case it's a new user
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthSuccess(userCredential.user, true); // Pass true in case it's a new user
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión con Facebook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase tracking-wide text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1">
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        Volver al Inicio
      </Link>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl" aria-hidden="true">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-black text-slate-900 uppercase tracking-tighter">
          MedExpediente <span className="text-blue-600">MX</span>
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Sistema Integral de Expediente Clínico Electrónico
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
            {error && (
              <div id="login-error" role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6 text-left">
                {error}
              </div>
            )}
            {successMsg && (
              <div id="login-success" role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium mb-6 text-left">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-6" noValidate>
              {isRegistering && !isResettingPassword && (
                <div>
                  <label htmlFor="name" className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={!!error}
                      aria-describedby={error ? "login-error" : undefined}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              {!isResettingPassword && (
                <div>
                  <label htmlFor="password" className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!error}
                      aria-describedby={error ? "login-error" : undefined}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Procesando...' : (isResettingPassword ? 'Enviar Enlace de Recuperación' : (isRegistering ? 'Crear Cuenta' : 'Ingresar con Correo'))}
              </button>
            </form>

            <div className="mt-4 text-center space-y-2">
              {!isResettingPassword && !isRegistering && (
                <button
                  type="button"
                  onClick={() => setIsResettingPassword(true)}
                  className="block w-full text-sm font-bold text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-1 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
              
              {isResettingPassword ? (
                <button
                  type="button"
                  onClick={() => setIsResettingPassword(false)}
                  className="block w-full text-sm font-bold text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-1 transition-colors"
                >
                  Volver a Iniciar Sesión
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="block w-full text-sm font-bold text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-1 transition-colors"
                >
                  {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
              )}
            </div>

            {!isResettingPassword && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500 font-medium">O continuar con</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    type="button"
                    aria-label="Iniciar sesión con Google"
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" aria-hidden="true" />
                    Google
                  </button>
                  <button
                    onClick={handleFacebookLogin}
                    disabled={loading}
                    type="button"
                    aria-label="Iniciar sesión con Facebook"
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" alt="" className="w-5 h-5" aria-hidden="true" />
                    Facebook
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;
