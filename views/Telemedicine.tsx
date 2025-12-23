
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  ShieldCheck, 
  MessageSquare, 
  PhoneOff,
  Maximize2,
  Camera,
  ChevronLeft,
  Lock
} from 'lucide-react';
// Changed MOCK_PATIENTS to INITIAL_PATIENTS to match exported member in constants.tsx
import { INITIAL_PATIENTS } from '../constants';

const Telemedicine: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Changed MOCK_PATIENTS to INITIAL_PATIENTS
  const patient = INITIAL_PATIENTS.find(p => p.id === id);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col lg:flex-row">
      {/* Video Call Area */}
      <div className="flex-1 relative flex flex-col">
        <div className="absolute top-6 left-6 z-10 flex items-center space-x-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center px-3 py-1.5 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center">
              <Lock className="w-3 h-3 mr-1" /> Canal Cifrado E2EE
            </span>
          </div>
        </div>

        {/* Remote Patient Video Placeholder */}
        <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
          <div className="text-center">
            <div className="w-32 h-32 bg-slate-700 rounded-full flex items-center justify-center text-4xl font-bold text-slate-500 mx-auto mb-4 border-4 border-slate-600 shadow-2xl">
              {patient.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{patient.name}</h2>
            <p className="text-slate-400 text-sm">Esperando al paciente...</p>
          </div>
          
          {/* Local Doctor Video Overlay */}
          <div className="absolute bottom-6 right-6 w-48 h-32 bg-slate-700 rounded-2xl border-2 border-slate-600 shadow-2xl overflow-hidden">
            <div className="w-full h-full bg-slate-600 flex items-center justify-center">
              <span className="text-xs text-slate-400 font-bold">Tú (Dr. Méndez)</span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/5 p-6 flex items-center justify-center space-x-4">
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="w-16 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors px-6 font-bold"
          >
            <PhoneOff className="w-5 h-5 mr-2" /> Terminar
          </button>
        </div>
      </div>

      {/* Note taking Area (Split Screen) */}
      <div className="w-full lg:w-96 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Nota de Teleconsulta</h3>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">NOM-004 Compatible</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo de Consulta</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Padecimientos reportados</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plan de Tratamiento</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"></textarea>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
            Guardar y Firmar Nota
          </button>
        </div>
      </div>
    </div>
  );
};

export default Telemedicine;