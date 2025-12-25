
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, Bed, Users, Flame, Plus, UserPlus, ShieldCheck, X, 
  MoveHorizontal, Truck, Baby, Heart, HeartPulse, Thermometer, 
  LayoutGrid, Settings2, Trash2, Edit2, Check, MapPin, ArrowRight,
  LogOut, Save, AlertTriangle
} from 'lucide-react';
import { Patient, ModuleType, PatientStatus } from '../types';
import { DEFAULT_INFRASTRUCTURE } from '../constants';

interface HospitalMonitorProps {
  patients: Patient[];
  onUpdatePatient?: (p: Patient) => void;
}

type HospitalArea = 'Medicina Interna' | 'Cirugía' | 'Obstetricia' | 'Pediatría' | 'UCI';

const AREA_CONFIG: Record<HospitalArea, { color: string, prefix: string, icon: any, module: ModuleType }> = {
  'Medicina Interna': { color: 'blue', prefix: 'MI', icon: <Thermometer className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'Cirugía': { color: 'indigo', prefix: 'CX', icon: <Activity className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'Obstetricia': { color: 'purple', prefix: 'OB', icon: <Baby className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'Pediatría': { color: 'teal', prefix: 'PD', icon: <Heart className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'UCI': { color: 'rose', prefix: 'ICU', icon: <HeartPulse className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION }
};

const HospitalMonitor: React.FC<HospitalMonitorProps> = ({ patients, onUpdatePatient }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeMainModule, setActiveMainModule] = useState<'Consulta' | 'Urgencias' | 'Hospitalización'>('Urgencias');
  const [activeHospArea, setActiveHospArea] = useState<HospitalArea>('Medicina Interna');
  const [patientInTransit, setPatientInTransit] = useState<Patient | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Estado de infraestructura persistente
  const [infra, setInfra] = useState(() => {
    const saved = localStorage.getItem('med_infra_v_prod');
    return saved ? JSON.parse(saved) : DEFAULT_INFRASTRUCTURE;
  });

  // Estado del Modal de Gestión
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'add' | 'rename' | 'delete';
    targetId?: string;
    contextModule: 'outpatient' | 'emergency' | 'hosp';
    contextArea?: HospitalArea;
    inputValue: string;
  }>({
    isOpen: false,
    type: 'add',
    contextModule: 'outpatient',
    inputValue: ''
  });

  useEffect(() => {
    localStorage.setItem('med_infra_v_prod', JSON.stringify(infra));
  }, [infra]);

  useEffect(() => {
    if (location.state?.patientToAssign) {
      setPatientInTransit(location.state.patientToAssign);
      const target = location.state.targetModule;
      if (target === ModuleType.OUTPATIENT) setActiveMainModule('Consulta');
      else if (target === ModuleType.EMERGENCY) setActiveMainModule('Urgencias');
      else if (target === ModuleType.HOSPITALIZATION) setActiveMainModule('Hospitalización');
    }
  }, [location.state]);

  const handleOpenAdd = (mod: 'outpatient' | 'emergency' | 'hosp', area?: HospitalArea) => {
    setModalConfig({
      isOpen: true,
      type: 'add',
      contextModule: mod,
      contextArea: area,
      inputValue: ''
    });
  };

  const handleOpenRename = (id: string, mod: 'outpatient' | 'emergency' | 'hosp', area?: HospitalArea) => {
    setModalConfig({
      isOpen: true,
      type: 'rename',
      targetId: id,
      contextModule: mod,
      contextArea: area,
      inputValue: id
    });
  };

  const handleOpenDelete = (id: string, mod: 'outpatient' | 'emergency' | 'hosp', area?: HospitalArea) => {
    const isOccupied = patients.some(p => (p.bedNumber === id || p.transitTargetBed === id) && p.status !== PatientStatus.ATTENDED);
    if (isOccupied) {
      alert(`No se puede eliminar ${id} porque está ocupado o reservado por un traslado.`);
      return;
    }
    setModalConfig({
      isOpen: true,
      type: 'delete',
      targetId: id,
      contextModule: mod,
      contextArea: area,
      inputValue: ''
    });
  };

  const executeInfraAction = () => {
    const { type, targetId, contextModule, contextArea, inputValue } = modalConfig;
    const cleanValue = inputValue.trim().toUpperCase();

    if ((type === 'add' || type === 'rename') && !cleanValue) return;

    setInfra((prev: any) => {
      const newState = { ...prev };
      
      // Helper to update specific array
      const updateList = (list: string[]) => {
        if (type === 'add') return [...list, cleanValue];
        if (type === 'delete') return list.filter(id => id !== targetId);
        if (type === 'rename') return list.map(id => id === targetId ? cleanValue : id);
        return list;
      };

      if (contextModule === 'outpatient') {
        newState.outpatient = updateList(prev.outpatient);
      } else if (contextModule === 'emergency') {
        newState.emergency = updateList(prev.emergency);
      } else if (contextModule === 'hosp' && contextArea) {
        newState.hospitalization = {
          ...prev.hospitalization,
          [contextArea]: updateList(prev.hospitalization[contextArea])
        };
      }
      return newState;
    });

    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleCompleteMove = (newBedId: string, targetModule: ModuleType) => {
    if (!patientInTransit || !onUpdatePatient) return;
    onUpdatePatient({
      ...patientInTransit,
      transitTargetBed: newBedId,
      transitTargetModule: targetModule,
      status: PatientStatus.TRANSIT
    });
    setPatientInTransit(null);
    window.history.replaceState({}, document.title);
  };

  const handleConfirmArrival = (patient: Patient) => {
    if (!onUpdatePatient) return;
    onUpdatePatient({
      ...patient,
      bedNumber: patient.transitTargetBed,
      assignedModule: patient.transitTargetModule || patient.assignedModule,
      transitTargetBed: undefined,
      transitTargetModule: undefined,
      status: patient.transitTargetModule === ModuleType.HOSPITALIZATION 
        ? PatientStatus.ADMITTED 
        : PatientStatus.IN_CONSULTATION
    });
  };

  const getOccupant = (id: string, module: ModuleType) => {
    const patient = patients.find(p => 
      (p.bedNumber === id && p.assignedModule === module) || 
      (p.transitTargetBed === id && p.transitTargetModule === module)
    );
    if (!patient) return null;

    const isSourceOfTransit = patient.bedNumber === id && patient.assignedModule === module && patient.status === PatientStatus.TRANSIT;
    const isTargetOfTransit = patient.transitTargetBed === id && patient.transitTargetModule === module && patient.status === PatientStatus.TRANSIT;

    return { patient, isSourceOfTransit, isTargetOfTransit };
  };

  const renderCard = (id: string, module: ModuleType, themeColor: string) => {
    const occupant = getOccupant(id, module);
    const p = occupant?.patient;
    const isTransit = occupant?.isSourceOfTransit || occupant?.isTargetOfTransit;
    
    return (
      <div 
        key={id}
        onClick={() => !p && !isEditMode && patientInTransit && handleCompleteMove(id, module)}
        className={`relative h-60 rounded-[2.5rem] border-2 p-6 flex flex-col justify-between transition-all group ${
          p ? (isTransit ? 'bg-amber-50 border-amber-400 border-dashed' : 'bg-slate-900 border-slate-900 shadow-xl') : 
          patientInTransit ? `bg-${themeColor}-50 border-${themeColor}-400 border-dashed cursor-pointer scale-105` : 'bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex justify-between items-start">
          <span className={`text-[10px] font-black ${p ? (isTransit ? 'text-amber-600' : 'text-blue-400') : 'text-slate-300'}`}>{id}</span>
          {isEditMode && !p && (
            <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenRename(id, module === ModuleType.OUTPATIENT ? 'outpatient' : module === ModuleType.EMERGENCY ? 'emergency' : 'hosp', module === ModuleType.HOSPITALIZATION ? activeHospArea : undefined); }} 
                className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400 hover:text-blue-600 border border-slate-100"
              >
                <Edit2 size={12}/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenDelete(id, module === ModuleType.OUTPATIENT ? 'outpatient' : module === ModuleType.EMERGENCY ? 'emergency' : 'hosp', module === ModuleType.HOSPITALIZATION ? activeHospArea : undefined); }} 
                className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400 hover:text-rose-600 border border-slate-100"
              >
                <Trash2 size={12}/>
              </button>
            </div>
          )}
          {p && !isTransit && (
            <button onClick={(e) => { e.stopPropagation(); setPatientInTransit(p); }} className="text-white/40 hover:text-white"><MoveHorizontal size={14} /></button>
          )}
        </div>

        {p ? (
          <div className="space-y-3">
             <div className="space-y-1">
                <p className={`text-[11px] font-black uppercase truncate ${isTransit ? 'text-amber-900' : 'text-white'}`}>{p.name}</p>
                {occupant.isSourceOfTransit && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white rounded-lg text-[7px] font-black uppercase shadow-sm">
                    <LogOut size={8} /> Saliendo hacia: {p.transitTargetBed}
                  </div>
                )}
                {occupant.isTargetOfTransit && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-200 text-amber-900 rounded-lg text-[7px] font-black uppercase animate-pulse">
                    <Truck size={8} /> Por arribar...
                  </div>
                )}
             </div>

             <div className="flex gap-2">
                {occupant.isTargetOfTransit ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleConfirmArrival(p); }} 
                    className="w-full py-3 bg-amber-600 text-white rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-slate-900 transition-all"
                  >
                    <Check size={12} /> Confirmar Arribo
                  </button>
                ) : occupant.isSourceOfTransit ? (
                  <div className="w-full py-2.5 bg-slate-900/5 text-slate-400 border border-dashed border-slate-200 rounded-xl text-[8px] font-black uppercase flex items-center justify-center">Bloqueado por Traslado</div>
                ) : (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${p.id}`); }} className="flex-1 py-2 bg-white/10 text-white rounded-xl text-[8px] font-black uppercase hover:bg-white/20">Ficha</button>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${p.id}/note/${module === ModuleType.EMERGENCY ? 'emergency' : 'evolution'}`); }} className={`flex-1 py-2 bg-${themeColor}-600 text-white rounded-xl text-[8px] font-black uppercase hover:opacity-80`}>Nota</button>
                  </>
                )}
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-20"><UserPlus size={24} /></div>
        )}
      </div>
    );
  };

  const renderPendingSidebar = (moduleFilter: ModuleType, themeColor: string) => {
    const pending = patients.filter(p => p.assignedModule === moduleFilter && !p.bedNumber && !p.transitTargetBed && p.status !== PatientStatus.ATTENDED);
    return (
      <div className="lg:col-span-3 space-y-6 no-print">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
              <Users size={16} className={`mr-2 text-${themeColor}-600`} /> Pendientes de Ubicación
            </h3>
            <span className={`px-3 py-1 bg-${themeColor}-50 text-${themeColor}-600 rounded-lg text-[10px] font-black`}>{pending.length}</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {pending.map(p => (
              <div 
                key={p.id}
                onClick={() => !isEditMode && setPatientInTransit(p)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer group ${patientInTransit?.id === p.id ? `bg-${themeColor}-600 border-${themeColor}-400 text-white scale-105 shadow-xl` : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
              >
                <p className={`text-[11px] font-black uppercase mb-1 ${patientInTransit?.id === p.id ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black opacity-60 uppercase">{p.priority.split(' ')[0]}</span>
                   <p className="text-[8px] font-bold opacity-40 truncate">{p.reason}</p>
                </div>
              </div>
            ))}
            {pending.length === 0 && <div className="py-20 text-center opacity-20"><ShieldCheck className="mx-auto mb-2" /><p className="text-[9px] font-black uppercase">Sin ingresos pendientes</p></div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full space-y-10 pb-20 animate-in fade-in">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Infraestructura y Gestión Operativa</p>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Monitor Hospitalario</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
             onClick={() => setIsEditMode(!isEditMode)}
             className={`flex items-center gap-2 px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-lg transition-all border-2 ${isEditMode ? 'bg-amber-600 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
             <Settings2 size={16} /> {isEditMode ? 'Finalizar Edición' : 'Gestionar Infraestructura'}
          </button>
          <div className="flex bg-white border border-slate-200 p-2 rounded-[2.5rem] shadow-sm gap-1">
            {(['Consulta', 'Urgencias', 'Hospitalización'] as const).map(mod => (
              <button 
                key={mod}
                onClick={() => { setActiveMainModule(mod); }}
                className={`px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeMainModule === mod ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>
      </div>

      {patientInTransit && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border-b-4 border-amber-500 animate-in slide-in-from-top-4 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center animate-pulse"><Truck /></div>
              <div>
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Reserva de Espacio Activa</p>
                 <h4 className="text-lg font-black uppercase">{patientInTransit.name}</h4>
                 <p className="text-[9px] text-slate-400">Seleccione el consultorio o cama de destino para bloquear ambas ubicaciones.</p>
              </div>
           </div>
           <button onClick={() => setPatientInTransit(null)} className="px-8 py-3 bg-white/10 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase transition-all">Cancelar</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {activeMainModule === 'Consulta' && (
          <>
            {renderPendingSidebar(ModuleType.OUTPATIENT, 'blue')}
            <div className="lg:col-span-9 bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                     <LayoutGrid className="text-blue-600" /> Consultorios
                  </h3>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {infra.outpatient.map((id: string) => renderCard(id, ModuleType.OUTPATIENT, 'blue'))}
                  {isEditMode && (
                    <button 
                      onClick={() => handleOpenAdd('outpatient')}
                      className="h-60 rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all bg-white group"
                    >
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors"><Plus size={32} /></div>
                       <p className="text-[10px] font-black uppercase">Agregar Consultorio</p>
                    </button>
                  )}
               </div>
            </div>
          </>
        )}

        {activeMainModule === 'Urgencias' && (
          <>
            {renderPendingSidebar(ModuleType.EMERGENCY, 'rose')}
            <div className="lg:col-span-9 bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl border-4 border-slate-800">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                     <Flame className="text-rose-500" /> Boxes de Urgencias
                  </h3>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
                  {infra.emergency.map((id: string) => renderCard(id, ModuleType.EMERGENCY, 'rose'))}
                  {isEditMode && (
                    <button 
                      onClick={() => handleOpenAdd('emergency')}
                      className="h-60 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-white/20 hover:border-rose-500 hover:text-rose-400 transition-all group"
                    >
                       <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-rose-500/20 transition-colors"><Plus size={24} /></div>
                       <p className="text-[10px] font-black uppercase">Nuevo Box</p>
                    </button>
                  )}
               </div>
            </div>
          </>
        )}

        {activeMainModule === 'Hospitalización' && (
          <>
            {renderPendingSidebar(ModuleType.HOSPITALIZATION, AREA_CONFIG[activeHospArea].color)}
            <div className="lg:col-span-9 space-y-8">
               <div className="bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-wrap gap-2">
                  {(Object.keys(AREA_CONFIG) as HospitalArea[]).map(area => (
                     <button 
                       key={area}
                       onClick={() => setActiveHospArea(area)}
                       className={`flex items-center px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeHospArea === area ? `bg-${AREA_CONFIG[area].color}-600 text-white shadow-xl` : 'text-slate-500 hover:bg-slate-50'}`}
                     >
                       <span className="mr-3">{AREA_CONFIG[area].icon}</span> {area}
                     </button>
                  ))}
               </div>
               <div className={`bg-white border-2 border-${AREA_CONFIG[activeHospArea].color}-100 rounded-[3.5rem] p-12 shadow-2xl`}>
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-4">
                        <Bed className={`text-${AREA_CONFIG[activeHospArea].color}-600`} /> Ala de {activeHospArea}
                     </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                     {(infra.hospitalization[activeHospArea] || []).map((id: string) => renderCard(id, ModuleType.HOSPITALIZATION, AREA_CONFIG[activeHospArea].color))}
                     {isEditMode && (
                        <button 
                          onClick={() => handleOpenAdd('hosp', activeHospArea)}
                          className={`h-60 rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-${AREA_CONFIG[activeHospArea].color}-400 hover:text-${AREA_CONFIG[activeHospArea].color}-500 transition-all bg-white group`}
                        >
                           <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-${AREA_CONFIG[activeHospArea].color}-50 transition-colors`}><Plus size={24} /></div>
                           <p className="text-[10px] font-black uppercase">Añadir Cama</p>
                        </button>
                     )}
                  </div>
               </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE GESTIÓN DE INFRAESTRUCTURA */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-12 flex flex-col space-y-8 border border-white/20">
              <div className="flex items-center gap-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${modalConfig.type === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    {modalConfig.type === 'delete' ? <AlertTriangle size={28} /> : modalConfig.type === 'add' ? <Plus size={28} /> : <Edit2 size={28} />}
                 </div>
                 <div>
                    <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">
                       {modalConfig.type === 'add' ? 'Nuevo Espacio' : modalConfig.type === 'rename' ? 'Renombrar Espacio' : 'Eliminar Espacio'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                       {modalConfig.contextModule === 'hosp' ? modalConfig.contextArea : modalConfig.contextModule}
                    </p>
                 </div>
              </div>

              {modalConfig.type === 'delete' ? (
                 <p className="text-sm font-medium text-slate-600 leading-relaxed bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    ¿Confirma que desea eliminar permanentemente el espacio <strong>{modalConfig.targetId}</strong>? Esta acción no se puede deshacer y afectará los registros históricos asociados a esta ubicación.
                 </p>
              ) : (
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Identificador del Espacio</label>
                    <input 
                      autoFocus
                      className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-xl font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all text-center"
                      placeholder="Ej: C-10, BOX-05, CAMA-01"
                      value={modalConfig.inputValue}
                      onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})}
                    />
                 </div>
              )}

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setModalConfig({...modalConfig, isOpen: false})} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                 <button 
                   onClick={executeInfraAction}
                   className={`flex-[2] py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${modalConfig.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-blue-600'}`}
                 >
                    {modalConfig.type === 'delete' ? 'Confirmar Eliminación' : 'Guardar Cambios'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HospitalMonitor;
