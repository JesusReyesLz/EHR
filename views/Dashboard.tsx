
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Clock, Activity, ChevronRight, 
  FlaskConical, Beaker, FileText, CheckCircle2, 
  MapPin, AlertTriangle, Printer, Microscope, ClipboardList
} from 'lucide-react';
import { ModuleType, Patient, PatientStatus, PriorityLevel, Vitals } from '../types';

interface DashboardProps {
  module: ModuleType;
  patients: Patient[];
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onUpdatePriority: (id: string, priority: PriorityLevel) => void;
  onModuleChange: (mod: ModuleType) => void;
  onUpdatePatient?: (p: Patient) => void;
  doctorInfo: any;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  module, patients, onUpdateStatus, onUpdatePriority, onModuleChange, onUpdatePatient, doctorInfo 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const isAuxiliary = module === ModuleType.AUXILIARY;

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.curp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = p.assignedModule === module;
    return matchesSearch && matchesModule && p.status !== PatientStatus.ATTENDED;
  });

  // Agrupación para Auxiliares
  const waitingPatients = filteredPatients.filter(p => p.status === PatientStatus.WAITING_FOR_SAMPLES);
  const inProcessPatients = filteredPatients.filter(p => p.status === PatientStatus.TAKING_SAMPLES || p.status === PatientStatus.PROCESSING_RESULTS);
  const readyPatients = filteredPatients.filter(p => p.status === PatientStatus.READY_RESULTS);

  if (isAuxiliary) {
    return (
      <div className="max-w-full space-y-10 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Servicios de Diagnóstico</p>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">AUXILIARES</h1>
          </div>
          <button onClick={() => navigate('/auxiliary-intake')} className="flex items-center px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-all">
            <FlaskConical className="w-5 h-5 mr-3" /> Nuevo Ingreso
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA 1: SALA DE ESPERA */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
               <h3 className="text-xs font-black uppercase text-amber-600 flex items-center gap-2"><Clock size={16} /> Sala de Espera</h3>
               <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black">{waitingPatients.length}</span>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
               {waitingPatients.map(p => (
                 <div key={p.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 hover:border-indigo-400 transition-all">
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase truncate">{p.name}</p>
                       <p className="text-[9px] text-slate-400 font-mono mt-1">{p.curp}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Estudios:</p>
                       <p className="text-[10px] font-bold text-indigo-600 uppercase line-clamp-2">{p.reason}</p>
                    </div>
                    <button 
                      onClick={() => onUpdateStatus(p.id, PatientStatus.TAKING_SAMPLES)}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                      Llamar a Toma <ChevronRight size={14} />
                    </button>
                 </div>
               ))}
               {waitingPatients.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase text-[10px]">Sin pacientes en espera</div>}
            </div>
          </div>

          {/* COLUMNA 2: TOMA DE MUESTRA / PROCESO */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-xl flex flex-col min-h-[600px] ring-4 ring-indigo-50">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
               <h3 className="text-xs font-black uppercase text-indigo-700 flex items-center gap-2"><Microscope size={16} /> Toma de Muestra</h3>
               <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{inProcessPatients.length}</span>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
               {inProcessPatients.map(p => (
                 <div key={p.id} className="p-6 bg-indigo-50/50 rounded-2xl border-2 border-indigo-200 space-y-4 animate-pulse">
                    <div>
                       <p className="text-xs font-black text-indigo-900 uppercase truncate">{p.name}</p>
                       <p className="text-[9px] text-indigo-400 font-mono mt-1">ID ORDEN: {p.id}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/patient/${p.id}/auxiliary-report`)}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      Capturar Resultados <Beaker size={14} />
                    </button>
                 </div>
               ))}
               {inProcessPatients.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase text-[10px]">Sin tomas en curso</div>}
            </div>
          </div>

          {/* COLUMNA 3: RESULTADOS LISTOS */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
               <h3 className="text-xs font-black uppercase text-emerald-600 flex items-center gap-2"><CheckCircle2 size={16} /> Resultados Listos</h3>
               <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">{readyPatients.length}</span>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
               {readyPatients.map(p => (
                 <div key={p.id} className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-4">
                    <p className="text-xs font-black text-slate-900 uppercase truncate">{p.name}</p>
                    <div className="flex gap-2">
                       <button onClick={() => navigate(`/patient/${p.id}`)} className="flex-1 py-3 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Ver Reporte</button>
                       <button className="p-3 bg-emerald-600 text-white rounded-xl shadow-md"><Printer size={16}/></button>
                    </div>
                 </div>
               ))}
               {readyPatients.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase text-[10px]">Sin resultados para entrega</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista estándar para otros módulos
  return (
    <div className="max-w-full space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Consola Médica Integral</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900">{module}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{module}</h1>
        </div>
        <button 
          onClick={() => navigate('/new-patient')}
          className="flex items-center px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5 mr-3" /> Admisión Inmediata
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
           <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder={`Buscar en ${module}...`}
                className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-[1.5rem] focus:bg-white outline-none transition-all text-sm font-bold shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-blue-600 transition-all"><Printer size={20} /></button>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <th className="px-10 py-6">Paciente / Identificación</th>
                    <th className="px-10 py-6 text-center">Triage / Prioridad</th>
                    <th className="px-10 py-6 text-center">Ubicación</th>
                    <th className="px-10 py-6 text-center">Estatus Clínico</th>
                    <th className="px-10 py-6 text-right">Ficha</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black uppercase">{p.name[0]}</div>
                             <div>
                                <p className="font-black text-slate-900 text-sm uppercase">{p.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono tracking-widest">{p.curp}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-[8px] font-black uppercase">{p.priority}</span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className="text-[10px] font-black uppercase">{p.bedNumber || 'Sin Asignar'}</span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase">{p.status}</span>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <button onClick={() => navigate(`/patient/${p.id}`)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center ml-auto"><ChevronRight size={20} /></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
