
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Clock, Activity, ChevronRight, 
  FlaskConical, Beaker, FileText, CheckCircle2, 
  MapPin, AlertTriangle, Printer, Microscope, ClipboardList,
  ChevronDown, MapPinned, Users, Info, X, Check, Timer, ArrowRight,
  ShoppingBag, Trash2, Lock, DollarSign, CheckCircle, UserMinus
} from 'lucide-react';
import { ModuleType, Patient, PatientStatus, PriorityLevel, AgendaStatus, ClinicalNote } from '../types';
import Billing from './Billing';
import Finance from './Finance';
import StaffManagement from './StaffManagement';
import TelemedicineDashboard from './TelemedicineDashboard';

interface DashboardProps {
  module: ModuleType;
  patients: Patient[];
  notes: ClinicalNote[];
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onUpdatePriority: (id: string, priority: PriorityLevel) => void;
  onModuleChange: (mod: ModuleType) => void;
  onUpdatePatient?: (p: Patient) => void;
  onDeletePatient?: (id: string) => void;
  doctorInfo: any;
}

// Función auxiliar para normalizar texto (quitar acentos y pasar a minúsculas)
const cleanStr = (str: string) => 
  (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const TriageDropdown: React.FC<{ 
  current: PriorityLevel, 
  onSelect: (val: PriorityLevel) => void 
}> = ({ current, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStyle = (val: string) => {
    if (val.includes('Rojo')) return 'bg-rose-50 border-rose-200 text-rose-700';
    if (val.includes('Naranja')) return 'bg-orange-50 border-orange-200 text-orange-700';
    if (val.includes('Amarillo')) return 'bg-amber-50 border-amber-200 text-amber-700';
    if (val.includes('Verde')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (val.includes('Azul')) return 'bg-blue-50 border-blue-200 text-blue-700';
    return 'bg-slate-50 border-slate-200 text-slate-400';
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight border transition-all shadow-sm ${getStyle(current)}`}
      >
        {current.split('-')[1] || current}
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-2.5 bg-slate-50 border-b border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccionar Clasificación</p>
            </div>
            {Object.values(PriorityLevel).map((level) => (
              <button
                key={level}
                onClick={() => {
                  onSelect(level);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-[9px] font-black uppercase transition-all flex items-center justify-between hover:bg-slate-50 ${current === level ? 'bg-blue-50/50 text-blue-700' : 'text-slate-600'}`}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${getStyle(level).split(' ')[0]}`}></div>
                   {level}
                </div>
                {current === level && <Check size={12} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  module, patients, notes, onUpdateStatus, onUpdatePriority, onModuleChange, onUpdatePatient, onDeletePatient, doctorInfo 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADO PARA ELIMINACIÓN MÚLTIPLE
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // AHORA EL DASHBOARD MANEJA TODOS LOS MÓDULOS PRINCIPALES
  const isAuxiliary = module === ModuleType.AUXILIARY;
  const isBilling = module === ModuleType.BILLING;
  const isFinance = module === ModuleType.FINANCE;
  const isStaff = module === ModuleType.STAFF;
  const isTelemedicine = module === ModuleType.TELEMEDICINE;
  
  const modules = [
    ModuleType.OUTPATIENT, 
    ModuleType.EMERGENCY, 
    ModuleType.HOSPITALIZATION, 
    ModuleType.AUXILIARY, 
    ModuleType.BILLING,
    ModuleType.FINANCE,
    ModuleType.STAFF,
    ModuleType.TELEMEDICINE
  ];

  const filteredPatients = patients.filter(p => {
    const search = cleanStr(searchTerm);
    const matchesSearch = cleanStr(p.name).includes(search) || cleanStr(p.id).includes(search);
    const matchesModule = p.assignedModule === module;
    
    // LOGICA DE FILTRADO CORRECTA PARA MONITOR ACTIVO
    const isActiveStatus = p.status !== PatientStatus.ATTENDED && 
                           p.status !== PatientStatus.READY_RESULTS &&
                           p.status !== PatientStatus.SCHEDULED; 

    const isValidAgenda = p.agendaStatus !== AgendaStatus.CANCELLED && 
                          p.agendaStatus !== AgendaStatus.NO_SHOW &&
                          p.agendaStatus !== AgendaStatus.RESCHEDULED;

    return matchesSearch && matchesModule && isActiveStatus && isValidAgenda;
  });

  const handlePatientAction = (p: Patient) => {
    if (isDeleteMode) return; // Si estamos borrando, clic en la fila no navega
    if (!p.bedNumber && module !== ModuleType.AUXILIARY) {
      navigate('/monitor', { state: { patientToAssign: p, targetModule: module } });
    } else {
      navigate(`/patient/${p.id}`);
    }
  };

  const handleDelete = (p: Patient) => {
      if (window.confirm(`¿Está seguro de eliminar al paciente ${p.name} del monitor activo? Esta acción no se puede deshacer.`)) {
          if (onDeletePatient) onDeletePatient(p.id);
      }
  };

  const handleToggleSelect = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
      if (selectedIds.size === 0) return;
      if (window.confirm(`¿Confirmar eliminación de ${selectedIds.size} pacientes seleccionados?`)) {
          selectedIds.forEach(id => {
              if (onDeletePatient) onDeletePatient(id);
          });
          setSelectedIds(new Set());
          setIsDeleteMode(false);
      }
  };

  const handleManualPayment = (p: Patient) => {
      if(window.confirm("¿Confirmar que el pago ha sido realizado manualmente? Esto actualizará el estado y habilitará el paso a toma de muestras.")) {
          if(onUpdatePatient) {
              onUpdatePatient({ 
                  ...p, 
                  paymentStatus: 'Pagado', 
                  pendingCharges: [],
                  status: PatientStatus.WAITING_FOR_SAMPLES // Automáticamente lo pone disponible para toma
              });
          }
      }
  };

  const ModuleSelector = () => (
    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full lg:w-fit overflow-x-auto no-scrollbar mb-4">
      {modules.map(mod => (
        <button
          key={mod}
          onClick={() => { onModuleChange(mod); setIsDeleteMode(false); setSelectedIds(new Set()); }}
          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
            module === mod 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          {mod === ModuleType.BILLING ? 'Caja / Tickets' : mod === ModuleType.FINANCE ? 'Finanzas' : mod === ModuleType.STAFF ? 'RRHH / Personal' : mod === ModuleType.TELEMEDICINE ? 'Telemedicina' : mod}
        </button>
      ))}
    </div>
  );

  if (isTelemedicine) {
    return (
      <div className="max-w-full space-y-6 animate-in fade-in duration-500">
        <ModuleSelector />
        <div className="-mt-4">
           <TelemedicineDashboard patients={patients} onUpdateStatus={onUpdateStatus} />
        </div>
      </div>
    );
  }

  if (isStaff) {
    return (
      <div className="max-w-full space-y-6 animate-in fade-in duration-500">
        <ModuleSelector />
        <div className="-mt-4">
           <StaffManagement />
        </div>
      </div>
    );
  }

  if (isFinance) {
    return (
      <div className="max-w-full space-y-6 animate-in fade-in duration-500">
        <ModuleSelector />
        <div className="-mt-4">
           <Finance />
        </div>
      </div>
    );
  }

  if (isBilling) {
    return (
      <div className="max-w-full space-y-6 animate-in fade-in duration-500">
        <ModuleSelector />
        <div className="-mt-4">
           <Billing patients={patients} notes={notes} onUpdatePatient={onUpdatePatient} />
        </div>
      </div>
    );
  }

  if (isAuxiliary) {
    const waiting = filteredPatients.filter(p => p.status === PatientStatus.WAITING_FOR_SAMPLES);
    const taking = filteredPatients.filter(p => p.status === PatientStatus.TAKING_SAMPLES);
    const processing = filteredPatients.filter(p => p.status === PatientStatus.PROCESSING_RESULTS);

    return (
      <div className="max-w-full space-y-6 animate-in fade-in duration-500">
        <ModuleSelector />

        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Servicios de Diagnóstico</p>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Monitor de Auxiliares</h1>
          </div>
          <button onClick={() => navigate('/auxiliary-intake')} className="flex items-center px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-all">
            <FlaskConical className="w-5 h-5 mr-3" /> Nuevo Ingreso
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col min-h-[600px]">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                 <h3 className="text-xs font-black uppercase text-amber-600 flex items-center gap-3"><Clock size={18} /> Sala de Espera</h3>
                 <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-xl text-[10px] font-black shadow-inner">{waiting.length}</span>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                 {waiting.map(p => {
                    const isPendingPayment = p.paymentStatus === 'Pendiente';
                    return (
                        <div key={p.id} className={`p-6 bg-slate-50 border rounded-[2.5rem] space-y-4 transition-all group relative ${isPendingPayment ? 'border-amber-200' : 'border-slate-100 hover:border-indigo-300'}`}>
                           <button onClick={() => handleDelete(p)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 z-10 p-2"><Trash2 size={16}/></button>
                           <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">ID: {p.id}</p>
                                  {isPendingPayment ? (
                                      <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1">
                                          <DollarSign size={8}/> Pago Pendiente
                                      </span>
                                  ) : (
                                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1">
                                          <CheckCircle size={8}/> Pagado
                                      </span>
                                  )}
                              </div>
                           </div>
                           <div className="p-3 bg-white rounded-2xl border border-slate-50">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estudios Solicitados:</p>
                              <p className="text-[10px] font-bold text-indigo-600 uppercase line-clamp-2">{p.reason}</p>
                           </div>
                           
                           {isPendingPayment && (
                               <button 
                                   onClick={() => handleManualPayment(p)}
                                   className="w-full py-2 bg-white border border-amber-200 text-amber-600 rounded-xl text-[9px] font-black uppercase hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                               >
                                   <CheckCircle size={12}/> Validar Pago Manual
                               </button>
                           )}

                           <button 
                             disabled={isPendingPayment}
                             onClick={() => onUpdateStatus(p.id, PatientStatus.TAKING_SAMPLES)}
                             className={`w-full py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                                 isPendingPayment 
                                 ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none' 
                                 : 'bg-indigo-600 hover:bg-slate-900'
                             }`}
                           >
                             {isPendingPayment ? (
                                 <><Lock size={14} /> Requiere Pago</>
                             ) : (
                                 <>Llamar a Toma <ArrowRight size={14} /></>
                             )}
                           </button>
                        </div>
                    );
                 })}
                 {waiting.length === 0 && <div className="py-20 text-center opacity-10 font-black uppercase text-[10px] tracking-[0.4em]">Vacio</div>}
              </div>
           </div>

           <div className="bg-indigo-50/50 border border-indigo-100 rounded-[3.5rem] p-8 shadow-inner flex flex-col min-h-[600px]">
              <div className="flex items-center justify-between mb-8 border-b border-indigo-100 pb-6">
                 <h3 className="text-xs font-black uppercase text-indigo-700 flex items-center gap-3"><Activity size={18} /> Sala de Toma</h3>
                 <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-md">{taking.length}</span>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                 {taking.map(p => (
                    <div key={p.id} className="p-6 bg-white border-2 border-indigo-200 rounded-[2.5rem] space-y-4 shadow-xl relative">
                       <button onClick={() => handleDelete(p)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 z-10 p-2"><Trash2 size={16}/></button>
                       <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">{p.name}</p>
                       <button 
                         onClick={() => onUpdateStatus(p.id, PatientStatus.PROCESSING_RESULTS)}
                         className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                       >
                         Muestra Recolectada <ArrowRight size={14} />
                       </button>
                    </div>
                 ))}
                 {taking.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase text-[10px] tracking-[0.4em]">Sin pacientes en toma</div>}
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col min-h-[600px]">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                 <h3 className="text-xs font-black uppercase text-blue-700 flex items-center gap-3"><FileText size={18} /> Espera de Captura</h3>
                 <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black shadow-inner">{processing.length}</span>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                 {processing.map(p => (
                    <div key={p.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-4 hover:border-blue-300 transition-all relative">
                       <button onClick={() => handleDelete(p)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 z-10 p-2"><Trash2 size={16}/></button>
                       <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                       <button 
                         onClick={() => navigate(`/patient/${p.id}/auxiliary-report`)}
                         className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                       >
                         <Beaker size={14} /> Capturar Resultados
                       </button>
                    </div>
                 ))}
                 {processing.length === 0 && <div className="py-20 text-center opacity-10 font-black uppercase text-[10px] tracking-[0.4em]">Sin resultados pendientes</div>}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6 animate-in fade-in duration-500">
      
      <ModuleSelector />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Monitor de Atención Clínica</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900">{module}</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">{module}</h1>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <button className="p-5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 transition-all shadow-sm"><Printer size={20} /></button>
          
          <button 
            onClick={() => setIsDeleteMode(!isDeleteMode)}
            className={`flex items-center px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isDeleteMode ? 'bg-rose-600 text-white hover:bg-slate-900' : 'bg-white border border-slate-200 text-rose-500 hover:bg-rose-50'}`}
          >
            {isDeleteMode ? 'Cancelar Selección' : 'Eliminar Pacientes'}
          </button>

          <button 
            onClick={() => navigate('/new-patient')}
            className="flex items-center px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5 mr-3" /> Nuevo Ingreso
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input 
                type="text" 
                placeholder={`Buscar paciente por nombre o folio...`}
                className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-[1.5rem] focus:bg-white outline-none border border-transparent focus:border-blue-100 transition-all text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto pb-20">
           <table className="w-full text-left border-separate border-spacing-y-0">
              <thead>
                 <tr className="bg-white text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <th className="px-10 py-6">
                        {isDeleteMode && <span className="text-rose-500">SEL</span>} Paciente / Identificación
                    </th>
                    <th className="px-10 py-6 text-center">Triage / Prioridad</th>
                    <th className="px-10 py-6 text-center">Ubicación / Estancia</th>
                    <th className="px-10 py-6 text-center">Estado Clínico</th>
                    <th className="px-10 py-6 text-right">Acción</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredPatients.map(p => {
                    const displayStatus = p.bedNumber ? "En Consulta" : "En sala de espera";
                    const isSelected = selectedIds.has(p.id);
                    
                    return (
                       <tr key={p.id} className={`transition-all group ${isSelected ? 'bg-rose-50' : 'hover:bg-blue-50/20'}`}>
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-6">
                                {isDeleteMode && (
                                    <button 
                                        onClick={() => handleToggleSelect(p.id)}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-lg font-black shadow-lg">
                                   {p.name[0] || 'P'}
                                </div>
                                <div className="space-y-1">
                                   <p className="font-black text-slate-900 text-[13px] uppercase tracking-tight leading-none">{p.name}</p>
                                   <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                      ID: {p.id} • {p.age}A • {p.sex === 'M' ? 'MASC' : 'FEM'}
                                   </p>
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                             <TriageDropdown 
                               current={p.priority} 
                               onSelect={(val) => onUpdatePriority(p.id, val)} 
                             />
                          </td>
                          <td className="px-10 py-8 text-center">
                             {!p.bedNumber ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase italic">
                                   <AlertTriangle size={12} className="text-amber-500" /> Sin Asignar
                                </div>
                             ) : (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/50 border border-blue-100 rounded-xl text-[9px] font-black text-blue-800 uppercase tracking-widest shadow-sm">
                                   <MapPin size={12} className="text-blue-500" /> {p.bedNumber}
                                </div>
                             )}
                          </td>
                          <td className="px-10 py-8 text-center">
                             <span className={`inline-flex items-center justify-center min-w-[120px] px-3 py-2 rounded-xl text-[8px] font-black uppercase border tracking-wider shadow-sm transition-all leading-none ${displayStatus === "En sala de espera" ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-blue-50/80 text-blue-700 border-blue-100'}`}>
                                {displayStatus}
                             </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleDelete(p)}
                                  className="w-14 h-14 rounded-[1.5rem] bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm z-10 relative"
                                  title="Eliminar del Monitor"
                                >
                                   <Trash2 size={20} />
                                </button>
                                <button 
                                  onClick={() => handlePatientAction(p)}
                                  className={`w-14 h-14 rounded-[1.5rem] transition-all flex items-center justify-center shadow-xl group/btn active:scale-95 ${p.bedNumber ? 'bg-slate-900 text-white hover:bg-blue-600' : 'bg-slate-900 text-amber-400 hover:bg-slate-800'}`}
                                >
                                    {p.bedNumber ? (
                                      <ChevronRight size={20} />
                                    ) : (
                                      <MapPinned size={20} className="animate-pulse" />
                                    )}
                                </button>
                             </div>
                          </td>
                       </tr>
                    );
                 })}
                 {filteredPatients.length === 0 && (
                    <tr>
                       <td colSpan={5} className="py-32 text-center opacity-30 font-black uppercase tracking-[0.4em] text-slate-400">
                          <Users size={64} className="mx-auto mb-6" />
                          Sin pacientes en lista activa
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* BARRA FLOTANTE DE ACCIÓN MASIVA */}
        {isDeleteMode && selectedIds.size > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 z-50">
                <span className="text-xs font-bold uppercase">{selectedIds.size} Pacientes Seleccionados</span>
                <button 
                    onClick={handleBulkDelete}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                >
                    <Trash2 size={14}/> Confirmar Eliminación
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
