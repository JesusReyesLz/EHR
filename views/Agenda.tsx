
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  PlayCircle,
  Microscope,
  Stethoscope,
  LayoutGrid
} from 'lucide-react';
import { Patient, PatientStatus, ModuleType } from '../types';

interface AgendaProps {
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  patients: Patient[];
}

const Agenda: React.FC<AgendaProps> = ({ onUpdateStatus, patients }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const today = new Date().toISOString().split('T')[0];
  
  const dailyAppointments = useMemo(() => {
    return patients.filter(p => 
      p.status !== PatientStatus.ATTENDED && 
      (p.scheduledDate === today || p.lastVisit === today || !p.scheduledDate)
    );
  }, [patients, today]);

  const handleStartInTake = (p: Patient) => {
     // Al iniciar atención desde la agenda:
     // 1. Movemos a estatus "En sala de espera"
     // 2. Navegamos al Monitor para que el médico le asigne consultorio/cama
     onUpdateStatus(p.id, PatientStatus.WAITING);
     alert(`Paciente ${p.name} marcado como arribado. Se ha enviado al monitor hospitalario para asignación de ubicación.`);
     navigate('/monitor', { state: { patientToAssign: p, targetModule: p.assignedModule } });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Agenda Operativa</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest flex items-center">
             <CalendarIcon className="mr-2 text-blue-600 w-4 h-4" /> Gestión de Citas
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-white border border-slate-200 p-1.5 rounded-[1.5rem] shadow-sm">
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${view === v ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}
              >
                {v === 'day' ? 'Hoy' : v === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/new-patient')} className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl hover:bg-slate-900 transition-all tracking-widest">
            <Plus className="w-5 h-5 mr-3" /> Agendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="grid grid-cols-7 gap-2 text-center text-[8px] font-black text-slate-400 uppercase mb-4">
              <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[10px]">
              {Array.from({ length: 31 }).map((_, i) => (
                <button key={i} className={`p-3 rounded-xl font-black transition-all ${i + 1 === 28 ? 'bg-blue-600 text-white shadow-lg scale-110' : 'hover:bg-slate-50 text-slate-600'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Pacientes Agendados: {today}</h3>
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-[9px] font-black uppercase">{dailyAppointments.length} Pendientes</span>
            </div>
            
            <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
              {dailyAppointments.length > 0 ? dailyAppointments.map((appt) => {
                const isAux = appt.assignedModule === ModuleType.AUXILIARY;
                return (
                  <div key={appt.id} className="p-8 flex flex-col md:flex-row items-center hover:bg-slate-50 transition-all group gap-8">
                    <div className="w-24 text-center border-r border-slate-100 pr-8">
                      <p className="text-xl font-black text-slate-900 leading-none">{appt.appointmentTime || '09:00'}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase mt-2">HORA</p>
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                          <p className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">{appt.name}</p>
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border flex items-center gap-2 ${isAux ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                             {isAux ? <Microscope size={10} /> : <Stethoscope size={10} />}
                             {appt.assignedModule}
                          </span>
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-none">{appt.reason}</p>
                    </div>
                    <button 
                      onClick={() => handleStartInTake(appt)}
                      className="flex items-center px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all shadow-lg tracking-widest"
                    >
                      <PlayCircle className="w-4 h-4 mr-3" /> Registrar Arribo
                    </button>
                  </div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center py-40 opacity-20">
                  <CalendarIcon size={80} className="mb-6" />
                  <p className="text-sm font-black uppercase tracking-widest">Sin citas programadas hoy</p>
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
