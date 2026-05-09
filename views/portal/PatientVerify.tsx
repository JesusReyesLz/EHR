import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';

const PatientVerify: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/portal/register');
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar el código');
      }

      setSuccess('Cuenta verificada exitosamente. Redirigiendo al login...');
      setTimeout(() => {
        navigate('/portal/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase tracking-wide text-sm">
        <ArrowLeft className="w-5 h-5" />
        Volver al Inicio
      </Link>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/portal/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Login
        </Link>
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
            <KeyRound className="text-white w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 uppercase tracking-tighter">
          Verificar <span className="text-blue-600">Correo</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Ingresa el código de 6 dígitos enviado a <br/><span className="font-bold text-slate-900">{email}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleVerify}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide text-center">
                Código de Verificación
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full text-center text-3xl tracking-[0.5em] py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 font-black"
                  placeholder="000000"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || code.length !== 6 || !!success}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientVerify;
