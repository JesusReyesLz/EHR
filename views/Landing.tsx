import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Stethoscope, Beaker } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTestLogin = (role: string) => {
    const testUser = {
      id: `test-${role.toLowerCase()}`,
      name: `Usuario de Prueba (${role})`,
      email: `test@${role.toLowerCase()}.com`,
      role: role,
      clinicId: 'test-clinic',
      currentArea: null,
      isGuardMode: false
    };
    login('test-token', testUser);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl" aria-hidden="true">
            <ShieldCheck className="text-white w-12 h-12" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-4xl font-black text-slate-900 uppercase tracking-tighter">
          MedExpediente <span className="text-blue-600">MX</span>
        </h1>
        <p className="mt-2 text-center text-base text-slate-600 font-medium">
          Sistema Integral de Expediente Clínico Electrónico
        </p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          
          {/* Portal de Pacientes */}
          <Link to="/portal/login" className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-blue-300 hover:shadow-blue-200/50 transition-all group flex flex-col items-center text-center focus:outline-none focus:ring-4 focus:ring-blue-500">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" aria-hidden="true">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-2">Portal de Pacientes</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Agenda consultas de telemedicina, revisa tu historial y recetas.
            </p>
            <span className="mt-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-bold rounded-xl text-blue-700 bg-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors uppercase tracking-widest">
              Ingresar
            </span>
          </Link>

          {/* Acceso Personal Médico */}
          <Link to="/login" className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-slate-300 hover:shadow-slate-200/50 transition-all group flex flex-col items-center text-center focus:outline-none focus:ring-4 focus:ring-slate-500">
            <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" aria-hidden="true">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-2">Personal Médico</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Acceso exclusivo para médicos, enfermería y administración.
            </p>
            <span className="mt-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-bold rounded-xl text-slate-700 bg-slate-100 group-hover:bg-slate-800 group-hover:text-white transition-colors uppercase tracking-widest">
              Acceso Restringido
            </span>
          </Link>

        </div>

        {/* Test Mode Section */}
        <div className="mt-12 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 justify-center text-amber-800">
              <Beaker className="w-6 h-6" />
              <h3 className="text-lg font-black uppercase tracking-wide">Modo de Prueba (Test Mode)</h3>
            </div>
            <p className="text-sm text-amber-700 text-center mb-6 font-medium">
              Usa estos botones para probar la aplicación sin necesidad de registrarte o iniciar sesión con Firebase.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button 
                onClick={() => handleTestLogin('SUPER_ADMIN')}
                className="w-full py-3 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-500/50"
              >
                Super Admin
              </button>
              <button 
                onClick={() => handleTestLogin('ADMIN')}
                className="w-full py-3 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-500/50"
              >
                Admin Clínica
              </button>
              <button 
                onClick={() => handleTestLogin('MEDICO')}
                className="w-full py-3 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                Médico
              </button>
              <button 
                onClick={() => handleTestLogin('ENFERMERIA')}
                className="w-full py-3 px-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
              >
                Enfermería
              </button>
              <button 
                onClick={() => handleTestLogin('RECEPCION')}
                className="w-full py-3 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
              >
                Recepción
              </button>
              <button 
                onClick={() => handleTestLogin('CAJA')}
                className="w-full py-3 px-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-violet-500/50"
              >
                Caja/Cobro
              </button>
              <button 
                onClick={() => handleTestLogin('FARMACIA')}
                className="w-full py-3 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-500/50"
              >
                Farmacia
              </button>
              <button 
                onClick={() => handleTestLogin('PACIENTE')}
                className="w-full py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
              >
                Paciente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
