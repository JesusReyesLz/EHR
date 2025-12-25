
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Users, Clock, Activity, 
  ChevronRight, Timer, PlayCircle, HeartPulse,
  X, Printer, MapPin, Calendar, AlertTriangle, ChevronDown,
  FlaskConical, TestTube, FileText, CheckCircle2, ArrowRight,
  History, Eye, Trash2, Heart, Scale, Ruler, Wind, Droplet, Thermometer, Save
} from 'lucide-react';
import { ModuleType, Patient, PatientStatus, PriorityLevel, ClinicalNote, Vitals } from '../types';

interface DashboardProps {
  module: ModuleType;
  patients: Patient[];
  notes?: ClinicalNote[];
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onUpdatePriority: (id: string, priority: PriorityLevel) => void;
  onModuleChange: (mod: ModuleType) => void;
  onUpdatePatient?: (p: Patient) => void;
  onDeletePatient?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  module, 
  patients, 
  notes = [], 
  onUpdateStatus, 
  onUpdatePriority, 
  onModuleChange,
  onUpdatePatient,
  onDeletePatient
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showTriageSelector, setShowTriageSelector] = useState<string | null>(null);
  
  const [auxTab, setAuxTab] = useState<'waiting' | 'process' | 'history'>('waiting');

  const calculateDays = (dateStr?: string) => {
    if (!dateStr) return 1;
    const start = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const priorityColors: Record<string, string> = {
    '0': 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none',
    '1': 'bg-rose-600 text-white',
    '2': 'bg-orange-500 text-white',
    '3': 'bg-amber-400 text-slate-900',
    '4': 'bg-emerald-500 text-white',
    '5': 'bg-blue-600 text-white'
  };

  const renderTriageBadge = (p: Patient) => {
    const level = p.priority?.split(' ')[0] || '0';
    const label = p.priority?.split('-')[1] || 'Sin Triage';
    
    return (
      <div className="relative group/triage">
        <button 
          onClick={() => setShowTriageSelector(showTriageSelector === p.id ? null : p.id)}
          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-sm ${priorityColors[level]}`}
        >
          {level !== '0' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
          {label}
          <ChevronDown size={12} className="opacity-50" />
        </button>

        {showTriageSelector === p.id && (
           <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2 no-print">
              {Object.values(PriorityLevel).map(lvl => (
                 <button 
                    key={lvl} 
                    onClick={() => { onUpdatePriority(p.id, lvl); setShowTriageSelector(null); }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3 group/opt"
                 >
                    <div className={`w-3 h-3 rounded-full ${priorityColors[lvl.split(' ')[0]]}`}></div>
                    <span className="text-[10px] font-black uppercase text-slate-700 group-hover/opt:text-blue-600">{lvl}</span>
                 </button>
              ))}
           </div>
        )}
      </div>
    );
  };

  const handlePatientAction = (p: Patient) => {
    if (!p.bedNumber && module !== ModuleType.AUXILIARY) {
      navigate('/monitor', { state: { patientToAssign: p, targetModule: p.assignedModule } });
    } else {
      navigate(`/patient/${p.id}`);
    }
  };

  const handleAuxAction = (p: Patient, action: 'start' | 'report' | 'view' | 'delete') => {
    if (action === 'start') {
       onUpdateStatus(p.id, PatientStatus.TAKING_SAMPLES);
    } else if (action === 'report') {
       const lastOrder = notes.find(n => n.patientId === p.id && (n.type.includes('Solicitud') || n.type.includes('Ingreso')));
       const route = lastOrder ? `/patient/${p.id}/auxiliary-report/${lastOrder.id}` : `/patient/${p.id}/auxiliary-report`;
       navigate(route);
    } else if (action === 'view') {
       navigate(`/patient/${p.id}`);
    } else if (action === 'delete') {
       if (onDeletePatient) onDeletePatient(p.id);
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.curp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = p.assignedModule === module;
    let isActive = p.status !== PatientStatus.SCHEDULED && p.status !== PatientStatus.ATTENDED;
    if (module === ModuleType.AUXILIARY) {
       isActive = p.status !== PatientStatus.SCHEDULED && [
         PatientStatus.WAITING_FOR_SAMPLES, 
         PatientStatus.WAITING,
         PatientStatus.PROCESSING_RESULTS, 
         PatientStatus.TAKING_SAMPLES, 
         PatientStatus.ATTENDED, 
         PatientStatus.READY_RESULTS
       ].includes(p.status);
    }
    return matchesSearch && matchesModule && isActive;
  });

  if (module === ModuleType.AUXILIARY) {
    const waitingPatients = filteredPatients.filter(p => p.status === PatientStatus.WAITING_FOR_SAMPLES || p.status === PatientStatus.WAITING);
    const inProcessPatients = filteredPatients.filter(p => p.status === PatientStatus.PROCESSING_RESULTS || p.status === PatientStatus.TAKING_SAMPLES);
    const historyPatients = filteredPatients.filter(p => p.status === PatientStatus.ATTENDED || p.status === PatientStatus.READY_RESULTS);

    return (
      <div className="max-w-full space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Consola Médica Integral</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900">{module}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Laboratorio e Imagen
            </h1>
          </div>
          
          <button 
            onClick={() => navigate('/auxiliary-intake')}
            className="flex items-center px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all hover:bg-slate-900 active:scale-95 group"
          >
            <FlaskConical className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            Admisión de Estudios
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-200 flex items-center gap-4">
           <Search className="ml-4 text-slate-400 w-5 h-5" />
           <input 
             type="text" 
             placeholder="Buscar paciente en sala o proceso..."
             className="w-full py-3 bg-transparent font-bold text-sm outline-none text-slate-700 placeholder-slate-300"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="flex bg-white border border-slate-200 p-2 rounded-[2rem] shadow-sm w-fit mx-auto md:mx-0">
           <button onClick={() => setAuxTab('waiting')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${auxTab === 'waiting' ? 'bg-amber-50 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Clock size={14} /> Sala de Espera ({waitingPatients.length})
           </button>
           <button onClick={() => setAuxTab('process')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${auxTab === 'process' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FlaskConical size={14} /> En Toma / Proceso ({inProcessPatients.length})
           </button>
           <button onClick={() => setAuxTab('history')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${auxTab === 'history' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <History size={14} /> Resultados Listos ({historyPatients.length})
           </button>
        </div>

        <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-200 overflow-hidden min-h-[500px]">
           {auxTab === 'waiting' && (
              <>
                <div className="p-8 border-b border-slate-100 bg-amber-50/30 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200"><Clock size={24} /></div>
                      <div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pacientes Presentes en Sala</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listos para pasar a toma de muestra</p>
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100">
                         {waitingPatients.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                               <td className="px-10 py-6">
                                  <div className="flex items-center">
                                     <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black mr-5 border border-amber-100 uppercase text-lg">{p.name.charAt(0)}</div>
                                     <div>
                                        <p className="font-black text-slate-900 text-xs uppercase leading-none mb-1.5">{p.name}</p>
                                        <span className="text-[9px] text-slate-400 font-mono tracking-widest">{p.curp}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estudios</span>
                                     <span className="text-xs font-bold text-slate-700 uppercase line-clamp-1 max-w-md">{p.reason}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6 text-right space-x-3">
                                  <button 
                                     onClick={() => handleAuxAction(p, 'delete')} 
                                     className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                     title="Eliminar Registro"
                                  >
                                     <Trash2 size={18} />
                                  </button>
                                  <button 
                                     onClick={() => handleAuxAction(p, 'start')} 
                                     className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg gap-2"
                                  >
                                     <TestTube size={14} /> Pasar a Toma
                                  </button>
                               </td>
                            </tr>
                         ))}
                         {waitingPatients.length === 0 && (
                            <tr><td colSpan={3} className="py-20 text-center text-slate-300 font-black uppercase text-xs">Sin pacientes presentes en sala</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
              </>
           )}

           {auxTab === 'process' && (
              <>
                <div className="p-8 border-b border-slate-100 bg-indigo-50/30 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-200"><FlaskConical size={24} /></div>
                      <div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Estudios en Procesamiento</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Captura de resultados e interpretación</p>
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100">
                         {inProcessPatients.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                               <td className="px-10 py-6">
                                  <div className="flex items-center">
                                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black mr-5 border border-indigo-100 uppercase text-lg">{p.name.charAt(0)}</div>
                                     <div>
                                        <p className="font-black text-slate-900 text-xs uppercase leading-none mb-1.5">{p.name}</p>
                                        <span className="text-[9px] text-slate-400 font-mono tracking-widest">{p.curp}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                     <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
                                        {p.status === PatientStatus.TAKING_SAMPLES ? 'En Toma de Muestra' : 'Procesando Resultados'}
                                     </span>
                                  </div>
                                  <p className="text-[8px] font-medium text-slate-400 mt-1 uppercase max-w-xs truncate">{p.reason}</p>
                               </td>
                               <td className="px-10 py-6 text-right space-x-3">
                                  <button 
                                     onClick={() => handleAuxAction(p, 'report')} 
                                     className="inline-flex items-center px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm gap-2"
                                  >
                                     <FileText size={14} /> Capturar Resultados
                                  </button>
                               </td>
                            </tr>
                         ))}
                         {inProcessPatients.length === 0 && (
                            <tr><td colSpan={3} className="py-20 text-center text-slate-300 font-black uppercase text-xs">Sin estudios en proceso</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
              </>
           )}

           {auxTab === 'history' && (
              <>
                <div className="p-8 border-b border-slate-100 bg-emerald-50/30 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200"><CheckCircle2 size={24} /></div>
                      <div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Resultados Finalizados</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulta de estudios completados hoy</p>
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100">
                         {historyPatients.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                               <td className="px-10 py-6">
                                  <div className="flex items-center">
                                     <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black mr-5 border border-emerald-100 uppercase text-lg">{p.name.charAt(0)}</div>
                                     <div>
                                        <p className="font-black text-slate-900 text-xs uppercase leading-none mb-1.5">{p.name}</p>
                                        <span className="text-[9px] text-slate-400 font-mono tracking-widest">{p.curp}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Atención</span>
                                     <span className="text-xs font-bold text-slate-700 uppercase">{p.lastVisit}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6 text-right">
                                  <button 
                                     onClick={() => handleAuxAction(p, 'view')} 
                                     className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm gap-2"
                                  >
                                     <Eye size={14} /> Ver Expediente
                                  </button>
                               </td>
                            </tr>
                         ))}
                         {historyPatients.length === 0 && (
                            <tr><td colSpan={3} className="py-20 text-center text-slate-300 font-black uppercase text-xs">No hay resultados recientes</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
              </>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-10 animate-in fade-in duration-700">
      
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Consola Médica Integral</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900">{module}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {module}
          </h1>
        </div>
        
        <button 
          onClick={() => navigate('/new-patient')}
          className="flex items-center px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:bg-blue-600 active:scale-95 group"
        >
          <UserPlus className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
          Admisión Inmediata
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
         <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="relative flex-1 w-full max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder={`Buscar pacientes activos en ${module}...`}
                className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-200 outline-none transition-all text-sm font-bold text-slate-900 shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:text-blue-600 transition-all shadow-sm">
              <Printer size={20} />
           </button>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <th className="px-10 py-6">Paciente / Identificación</th>
                    <th className="px-10 py-6 text-center">Triage / Prioridad</th>
                    <th className="px-10 py-6 text-center">Ubicación / Estancia</th>
                    <th className="px-10 py-6 text-center">Estado Clínico</th>
                    <th className="px-10 py-6 text-right">Acción</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                       <td className="px-10 py-8">
                          <div className="flex items-center">
                             <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black mr-6 border-2 border-white shadow-lg group-hover:bg-blue-600 transition-colors uppercase text-xl">{p.name.charAt(0)}</div>
                             <div>
                                <p className="font-black text-slate-900 text-sm uppercase leading-none mb-1.5">{p.name}</p>
                                <div className="flex items-center gap-3">
                                   <span className="text-[9px] text-slate-400 font-mono tracking-widest">{p.curp}</span>
                                   <span className="text-[8px] font-black text-slate-300 uppercase">{p.age}A • {p.sex}</span>
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex justify-center">
                             {renderTriageBadge(p)}
                          </div>
                       </td>
                       <td className="px-10 py-8 text-center">
                          {p.bedNumber ? (
                             <div className="inline-flex flex-col items-center">
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-[9px] font-black uppercase">
                                   <MapPin size={10} /> {p.bedNumber}
                                </div>
                                {module === ModuleType.HOSPITALIZATION && (
                                   <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-1">
                                      <Calendar size={10} /> Atendido: {calculateDays(p.lastVisit)} Días
                                   </p>
                                )}
                             </div>
                          ) : (
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-400 rounded-xl border border-slate-200 text-[9px] font-black uppercase italic">
                                <AlertTriangle size={10} /> Sin asignar
                             </div>
                          )}
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border shadow-sm ${
                             p.status === PatientStatus.WAITING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             p.status === PatientStatus.ADMITTED ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                             'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                             {module === ModuleType.HOSPITALIZATION && p.status === PatientStatus.IN_CONSULTATION ? 'ENCAMADO' : p.status}
                          </span>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <button 
                             onClick={() => handlePatientAction(p)} 
                             className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-md group-hover:scale-110 flex items-center justify-center ml-auto"
                          >
                             {p.bedNumber ? <ChevronRight size={20} /> : <MapPin size={20} className="text-amber-400" />}
                          </button>
                       </td>
                    </tr>
                 ))}
                 {filteredPatients.length === 0 && (
                    <tr>
                       <td colSpan={5} className="py-40 text-center opacity-20">
                          <Users size={80} className="mx-auto mb-6" />
                          <p className="text-sm font-black uppercase tracking-widest">Sin pacientes presentes en este módulo</p>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export const VitalsEditorModal: React.FC<{ patient: Patient, onClose: () => void, onSave: (v: Vitals) => void }> = ({ patient, onClose, onSave }) => {
  const [vitals, setVitals] = useState<Vitals>(patient.currentVitals || {
    bp: '120/80',
    temp: 36.5,
    hr: 70,
    rr: 16,
    o2: 98,
    weight: 70,
    height: 170,
    bmi: 24.2,
    date: new Date().toISOString()
  });

  const calculateBMI = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      const heightInMeters = h / 100;
      return parseFloat((w / (heightInMeters * heightInMeters)).toFixed(1));
    }
    return 0;
  };

  const handleChange = (field: keyof Vitals, value: string | number) => {
    const newVitals = { ...vitals, [field]: value };
    if (field === 'weight' || field === 'height') {
      newVitals.bmi = calculateBMI(Number(newVitals.weight), Number(newVitals.height));
    }
    setVitals(newVitals);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><HeartPulse size={24} /></div>
            <div>
               <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Nueva Toma de Signos</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase">{patient.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all border border-slate-200"><X size={24} className="text-slate-500" /></button>
        </div>
        
        <div className="p-10 space-y-8">
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Presión Arterial', key: 'bp', type: 'text', icon: <Droplet size={14} className="text-blue-500" />, unit: 'mmHg' },
                { label: 'Temp Corporal', key: 'temp', type: 'number', icon: <Thermometer size={14} className="text-amber-500" />, unit: '°C' },
                { label: 'Frec. Cardíaca', key: 'hr', type: 'number', icon: <Heart size={14} className="text-rose-500" />, unit: 'LPM' },
                { label: 'Frec. Resp', key: 'rr', type: 'number', icon: <Wind size={14} className="text-emerald-500" />, unit: 'RPM' },
                { label: 'Saturación O2', key: 'o2', type: 'number', icon: <Activity size={14} className="text-blue-400" />, unit: '%' },
                { label: 'Peso', key: 'weight', type: 'number', icon: <Scale size={14} className="text-slate-400" />, unit: 'kg' },
                { label: 'Talla', key: 'height', type: 'number', icon: <Ruler size={14} className="text-slate-400" />, unit: 'cm' },
              ].map(item => (
                <div key={item.key} className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      {item.icon} {item.label}
                   </label>
                   <div className="relative">
                      <input 
                        type={item.type} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 outline-none focus:bg-white focus:border-blue-400 transition-all"
                        value={(vitals as any)[item.key]}
                        onChange={e => handleChange(item.key as keyof Vitals, item.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">{item.unit}</span>
                   </div>
                </div>
              ))}
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-blue-600" /> IMC
                 </label>
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl font-black text-blue-700 text-center">
                    {vitals.bmi}
                 </div>
              </div>
           </div>

           <button 
             onClick={() => {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = now.getFullYear();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
                onSave({ ...vitals, date: formattedDate });
             }}
             className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
           >
              <Save size={18} /> Guardar y Sellar Registro
           </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
