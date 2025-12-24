
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Users, Clock, Activity, Microscope, 
  ChevronRight, FlaskConical, ImageIcon, ClipboardList, Timer, 
  Zap, User, FlaskRound as Flask, PlayCircle, CheckCircle
} from 'lucide-react';
import { ModuleType, Patient, PatientStatus, PriorityLevel, ClinicalNote } from '../types';

interface DashboardProps {
  module: ModuleType;
  patients: Patient[];
  notes?: ClinicalNote[];
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onUpdatePriority: (id: string, priority: PriorityLevel) => void;
  onModuleChange: (mod: ModuleType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ module, patients, notes = [], onUpdateStatus, onUpdatePriority, onModuleChange }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const modules = (Object.values(ModuleType) as ModuleType[]).filter(m => m !== ModuleType.ADMIN && m !== ModuleType.MONITOR && m !== ModuleType.INVENTORY);

  // Pacientes Físicos en el módulo (En sala de espera de toma)
  const patientsInAux = useMemo(() => {
    return patients.filter(p => 
      p.assignedModule === ModuleType.AUXILIARY && 
      p.status !== PatientStatus.ATTENDED &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.curp.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [patients, searchTerm, module]);

  // Órdenes pendientes de resultados (Ya se tomó la muestra o está solicitada)
  const activeOrders = useMemo(() => {
    return notes.filter(n => 
      n.type === 'Solicitud de Estudios Auxiliares' && 
      !notes.some(r => r.type.includes('Reporte') && r.content.orderId === n.id)
    );
  }, [notes]);

  const getPriorityStyle = (level: PriorityLevel | undefined) => {
    const currentLevel = level ?? PriorityLevel.MEDIUM;
    switch (currentLevel) {
      case PriorityLevel.CRITICAL: return 'bg-rose-600 text-white animate-pulse';
      case PriorityLevel.HIGH: return 'bg-orange-500 text-white';
      case PriorityLevel.MEDIUM: return 'bg-amber-400 text-slate-900';
      case PriorityLevel.LOW: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="max-w-full space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Centro de Control Operativo</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900">{module}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {module === ModuleType.AUXILIARY ? 'Unidad de ' : ''}
            <span className={module === ModuleType.AUXILIARY ? 'text-indigo-600' : 'text-slate-900'}>
               {module === ModuleType.AUXILIARY ? 'Diagnóstico' : module}
            </span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(module === ModuleType.AUXILIARY ? '/auxiliary-intake' : '/new-patient')}
            className={`flex items-center px-10 py-5 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 group ${module === ModuleType.AUXILIARY ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-blue-600'}`}
          >
            <UserPlus className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            {module === ModuleType.AUXILIARY ? 'Ingresar Paciente a Toma' : 'Ingresar Paciente'}
          </button>
        </div>
      </div>

      {/* Selector de Módulo */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        {modules.map((mod) => (
          <button
            key={mod}
            onClick={() => onModuleChange(mod)}
            className={`flex items-center px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              module === mod ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {mod}
            <span className={`ml-3 px-2 py-0.5 rounded-lg text-[8px] ${module === mod ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {mod === ModuleType.AUXILIARY ? activeOrders.length : patients.filter(p => p.assignedModule === mod && p.status !== PatientStatus.ATTENDED).length}
            </span>
          </button>
        ))}
      </div>

      {/* VISTA AUXILIARES */}
      {module === ModuleType.AUXILIARY ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Sidebar: Sala de Espera (Pacientes Físicos) */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <Clock className="text-amber-500" /> Pacientes en Sala de Toma
                 </h3>
                 <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                    {patientsInAux.map(p => (
                       <div key={p.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-400 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                             <p className="text-xs font-black text-slate-900 uppercase">{p.name}</p>
                             <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${getPriorityStyle(p.priority)}`}>{p.priority.split(' ')[0]}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.reason}</p>
                          <div className="flex gap-2 mt-4">
                             <button 
                               /* Fix: Property 'SAMPLE_TAKEN' does not exist on type 'typeof PatientStatus'. Changed to 'TAKING_SAMPLES'. */
                               onClick={() => onUpdateStatus(p.id, PatientStatus.TAKING_SAMPLES)}
                               className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase"
                             >
                               Llamar a Toma
                             </button>
                             <button onClick={() => navigate(`/patient/${p.id}`)} className="p-2 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-indigo-600"><ChevronRight size={14} /></button>
                          </div>
                       </div>
                    ))}
                    {patientsInAux.length === 0 && (
                      <div className="py-20 text-center opacity-30 flex flex-col items-center">
                         <Users className="mb-4 w-12 h-12" />
                         <p className="text-[10px] font-black uppercase tracking-widest">Sin pacientes en sala</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Principal: Cola de Procesamiento (Órdenes) */}
           <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden flex flex-col min-h-[600px]">
                 <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><ClipboardList size={24} /></div>
                       <h3 className="text-sm font-black uppercase tracking-widest">Cola de Análisis y Resultados</h3>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl">Analítica en Tiempo Real</span>
                 </div>
                 
                 <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                    {activeOrders.map(order => {
                       const p = patients.find(pat => pat.id === order.patientId);
                       const studies = [...(order.content.labStudies || []), ...(order.content.imagingStudies || [])];
                       const isLab = order.content.labStudies?.length > 0;
                       
                       return (
                          <div key={order.id} className="p-10 flex flex-col md:flex-row items-center justify-between hover:bg-indigo-50/20 transition-all gap-8">
                             <div className="flex items-center gap-8 flex-1">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl ${isLab ? 'bg-indigo-600' : 'bg-blue-500'}`}>
                                   {isLab ? <Flask size={32} /> : <ImageIcon size={32} />}
                                </div>
                                <div className="space-y-3">
                                   <div className="flex items-center gap-4">
                                      <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{p?.name || 'Paciente Externo'}</p>
                                      <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase">{order.content.urgency}</span>
                                   </div>
                                   <div className="flex flex-wrap gap-2">
                                      {studies.map(s => <span key={s} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-bold text-indigo-700 uppercase">{s}</span>)}
                                   </div>
                                   <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-2">
                                      <Timer size={12} /> Solicitado: {order.date}
                                   </p>
                                </div>
                             </div>
                             <button 
                                onClick={() => navigate(`/patient/${order.patientId}/auxiliary-report/${order.id}`)}
                                className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-4"
                             >
                                <PlayCircle size={18} /> Cargar Resultados
                             </button>
                          </div>
                       );
                    })}
                    {activeOrders.length === 0 && (
                       <div className="h-full flex flex-col items-center justify-center text-slate-300 py-48">
                          <Zap size={80} className="mb-6 opacity-10" />
                          <p className="text-xs font-black uppercase tracking-widest">No hay órdenes pendientes de resultados</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* VISTA ESTÁNDAR (CONSULTA / URGENCIAS) */
        <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
           <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="relative flex-1 w-full max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder={`Buscar pacientes en ${module}...`}
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-200 outline-none transition-all text-sm font-bold text-slate-900 shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                      <th className="px-10 py-6">Paciente</th>
                      <th className="px-10 py-6 text-center">Estatus</th>
                      <th className="px-10 py-6">Motivo</th>
                      <th className="px-10 py-6 text-right">Acción</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {patients.filter(p => p.assignedModule === module && p.status !== PatientStatus.ATTENDED).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                         <td className="px-10 py-8">
                            <div className="flex items-center">
                               <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black mr-6 border-2 border-white shadow-lg group-hover:bg-blue-600 transition-colors">{p.name.charAt(0)}</div>
                               <div>
                                  <p className="font-black text-slate-900 text-sm uppercase leading-none mb-1">{p.name}</p>
                                  <span className="text-[9px] text-slate-400 font-mono tracking-widest">{p.curp}</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-center">
                            <span className="px-4 py-2 rounded-xl text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">{p.status}</span>
                         </td>
                         <td className="px-10 py-8">
                            <p className="text-[10px] font-bold text-slate-600 uppercase italic truncate max-w-[250px]">{p.reason}</p>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <button onClick={() => navigate(`/patient/${p.id}`)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-md group-hover:scale-110"><ChevronRight size={20} /></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
