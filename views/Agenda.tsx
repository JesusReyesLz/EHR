
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search,
  PlayCircle
} from 'lucide-react';
import { Patient, PatientStatus } from '../types';

interface AgendaProps {
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  patients: Patient[];
}

const Agenda: React.FC<AgendaProps> = ({ onUpdateStatus, patients }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  
  // En este demo usamos los pacientes de INITIAL_PATIENTS como si fueran la agenda del día
  const dailyAppointments = patients.filter(p => p.status !== PatientStatus.ATTENDED);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda y Citas</h1>
          <p className="text-slate-500 text-sm">Pacientes programados para hoy</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${view === v ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Nueva Cita
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Octubre 2023</h3>
              <div className="flex space-x-1">
                <button className="p-1 hover:bg-slate-100 rounded-md text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-slate-100 rounded-md text-slate-600"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
              <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: 31 }).map((_, i) => (
                <button key={i} className={`p-2 rounded-lg font-semibold ${i + 1 === 28 ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-bold text-slate-900">Citas Confirmadas: Hoy</h3>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {dailyAppointments.length > 0 ? dailyAppointments.map((appt) => (
                <div key={appt.id} className="p-4 flex items-center hover:bg-slate-50 transition-all group">
                  <div className="w-20 text-center border-r border-slate-100 pr-4">
                    <p className="text-sm font-bold text-slate-900">{appt.lastVisit.split(' ')[1] || '09:00'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">AM</p>
                  </div>
                  <div className="flex-1 px-6">
                    <p className="font-bold text-slate-800 text-sm">{appt.name}</p>
                    <p className="text-xs text-slate-500 italic">{appt.reason}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border bg-blue-50 text-blue-600 border-blue-100`}>
                      Confirmado
                    </span>
                    <button 
                      onClick={() => {
                        onUpdateStatus(appt.id, PatientStatus.IN_CONSULTATION);
                        navigate('/');
                      }}
                      className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                    >
                      <PlayCircle className="w-4 h-4 mr-1.5" /> Atender
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center text-slate-400 font-bold text-sm">
                  No hay citas programadas para hoy.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
