
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Bed, ChevronRight, Users, 
  Flame, Plus, UserPlus, ShieldCheck, X, 
  MoveHorizontal, Truck, LogIn, FileText,
  Baby, Heart, HeartPulse, Thermometer, 
  LayoutGrid, ClipboardList, LogOut
} from 'lucide-react';
import { Patient, ModuleType, PatientStatus } from '../types';

interface HospitalMonitorProps {
  patients: Patient[];
  onUpdatePatient?: (p: Patient) => void;
}

type HospitalArea = 'Medicina Interna' | 'Cirugía' | 'Obstetricia' | 'Pediatría' | 'UCI';

const AREA_CONFIG: Record<HospitalArea, { color: string, prefix: string, beds: number, icon: any, module: ModuleType }> = {
  'Medicina Interna': { color: 'blue', prefix: 'MI', beds: 12, icon: <Thermometer className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'Cirugía': { color: 'indigo', prefix: 'CX', beds: 10, icon: <Activity className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'Obstetricia': { color: 'purple', prefix: 'OB', beds: 8, icon: <Baby className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'Pediatría': { color: 'teal', prefix: 'PD', beds: 10, icon: <Heart className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION },
  'UCI': { color: 'rose', prefix: 'ICU', beds: 6, icon: <HeartPulse className="w-4 h-4" />, module: ModuleType.HOSPITALIZATION }
};

const HospitalMonitor: React.FC<HospitalMonitorProps> = ({ patients, onUpdatePatient }) => {
  const navigate = useNavigate();
  const [activeMainModule, setActiveMainModule] = useState<'Consulta' | 'Urgencias' | 'Hospitalización'>('Urgencias');
  const [activeHospArea, setActiveHospArea] = useState<HospitalArea>('Medicina Interna');
  
  // Estado de traslado: Almacena al paciente que se desea mover
  const [patientInTransit, setPatientInTransit] = useState<Patient | null>(null);

  const handleStartMove = (patient: Patient) => {
    setPatientInTransit(patient);
  };

  const handleCompleteMove = (newBedId: string, targetModule: ModuleType) => {
    if (!patientInTransit || !onUpdatePatient) return;

    // Si el módulo cambia (ej. de Urgencias a Hospitalización), actualizamos assignedModule
    onUpdatePatient({
      ...patientInTransit,
      bedNumber: newBedId,
      assignedModule: targetModule,
      status: PatientStatus.TRANSIT
    });
    
    setPatientInTransit(null);
  };

  const handleConfirmArrival = (patient: Patient) => {
    if (!onUpdatePatient) return;
    onUpdatePatient({
      ...patient,
      status: patient.assignedModule === ModuleType.HOSPITALIZATION ? PatientStatus.ADMITTED : PatientStatus.IN_CONSULTATION
    });
  };

  // --- RENDERS COMUNES ---

  const renderSidebarPending = (moduleFilter: ModuleType, themeColor: string) => {
    const pending = patients.filter(p => p.assignedModule === moduleFilter && !p.bedNumber);
    return (
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
              <Users size={16} className={`mr-2 text-${themeColor}-600`} /> Ingresos Pendientes
            </h3>
            <span className={`px-2 py-0.5 bg-${themeColor}-50 text-${themeColor}-600 rounded-lg text-[9px] font-black`}>{pending.length}</span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
            {pending.map(p => (
              <div 
                key={p.id}
                onClick={() => handleStartMove(p)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer group ${patientInTransit?.id === p.id ? `bg-${themeColor}-600 border-${themeColor}-400 text-white scale-105 shadow-xl` : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className={`text-[10px] font-black uppercase ${patientInTransit?.id === p.id ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${p.id}`); }} title="Ver Expediente">
                      <FileText size={14} className={patientInTransit?.id === p.id ? "text-white/70" : `text-${themeColor}-500`} />
                    </button>
                    <MoveHorizontal size={14} className={patientInTransit?.id === p.id ? "text-white animate-pulse" : "text-slate-300"} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${patientInTransit?.id === p.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{p.priority.split(' ')[0]}</span>
                  <p className="text-[8px] font-bold uppercase opacity-60 italic truncate">{p.reason}</p>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="py-20 text-center space-y-4 opacity-30">
                <ShieldCheck className="w-12 h-12 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sin pendientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderConsulta = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
      {renderSidebarPending(ModuleType.OUTPATIENT, 'blue')}
      <div className="lg:col-span-9 space-y-6">
        <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
                 <LayoutGrid className="w-6 h-6 mr-3 text-blue-600" /> Consultorios Disponibles
              </h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => {
                 const roomId = `C-${(i+1).toString().padStart(2, '0')}`;
                 const activePatient = patients.find(p => p.assignedModule === ModuleType.OUTPATIENT && p.bedNumber === roomId);
                 
                 return (
                    <div 
                      key={roomId}
                      onClick={() => !activePatient && patientInTransit && handleCompleteMove(roomId, ModuleType.OUTPATIENT)}
                      className={`relative h-48 rounded-[2.5rem] border-2 transition-all p-6 flex flex-col justify-between group ${
                        activePatient ? 'bg-slate-900 border-slate-900 shadow-2xl' : 
                        patientInTransit ? 'bg-blue-50 border-blue-400 border-dashed cursor-pointer scale-105' :
                        'bg-slate-50 border-slate-100'
                      }`}
                    >
                       <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black ${activePatient ? 'text-blue-400' : 'text-slate-300'}`}>{roomId}</span>
                          {activePatient && (
                            <button onClick={(e) => { e.stopPropagation(); handleStartMove(activePatient); }} className="text-white/40 hover:text-white"><MoveHorizontal size={14} /></button>
                          )}
                       </div>

                       {activePatient ? (
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-white uppercase truncate">{activePatient.name}</p>
                             <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${activePatient.id}`); }} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[8px] font-black uppercase">Ficha</button>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${activePatient.id}/note/evolution`); }} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[8px] font-black uppercase">Nota</button>
                             </div>
                          </div>
                       ) : (
                          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-300">
                             <UserPlus size={24} className={patientInTransit ? "animate-pulse text-blue-400" : ""} />
                             <p className="text-[8px] font-black uppercase tracking-widest">Disponible</p>
                          </div>
                       )}
                    </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );

  const renderUrgencias = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-6">
      {renderSidebarPending(ModuleType.EMERGENCY, 'rose')}
      <div className="lg:col-span-9 space-y-6">
        <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl border-4 border-slate-800">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center">
                  <Flame className="w-6 h-6 mr-3 text-rose-500" /> Triage y Boxes Urgencias
               </h3>
               {patientInTransit && (
                 <div className="flex items-center gap-3 bg-rose-600/20 text-rose-400 px-6 py-3 rounded-2xl border border-rose-600/30 animate-in fade-in">
                    <span className="text-[10px] font-black uppercase tracking-widest">Moviendo a: {patientInTransit.name}</span>
                    <button onClick={() => setPatientInTransit(null)} className="ml-2 hover:text-white"><X size={16} /></button>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
               {Array.from({ length: 15 }).map((_, i) => {
                  const boxId = `BOX-${(i+1).toString().padStart(2, '0')}`;
                  const patient = patients.find(p => p.assignedModule === ModuleType.EMERGENCY && p.bedNumber === boxId);
                  
                  return (
                     <div 
                       key={i} 
                       onClick={() => !patient && patientInTransit && handleCompleteMove(boxId, ModuleType.EMERGENCY)}
                       className={`relative h-52 rounded-3xl border-2 p-5 flex flex-col justify-between transition-all group ${
                         patient ? 'bg-slate-800 border-slate-700 shadow-2xl scale-105' : 
                         patientInTransit ? 'bg-rose-600/10 border-rose-500/50 border-dashed cursor-pointer hover:bg-rose-600/20' : 
                         'bg-white/5 border-white/5 opacity-40'
                       }`}
                     >
                        <div className="flex justify-between items-start">
                           <span className="text-[9px] font-black text-slate-500">{boxId}</span>
                           <div className="flex gap-2">
                             {patient?.status === PatientStatus.TRANSIT && <Truck size={14} className="text-amber-400 animate-bounce" />}
                             {patient && <button onClick={(e) => { e.stopPropagation(); handleStartMove(patient); }} className="text-slate-600 hover:text-white"><MoveHorizontal size={14} /></button>}
                           </div>
                        </div>

                        {patient ? (
                           <div className="space-y-4">
                              <p className="text-[9px] font-black text-white uppercase truncate">{patient.name}</p>
                              {patient.status === PatientStatus.TRANSIT ? (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleConfirmArrival(patient); }}
                                   className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl text-[8px] font-black uppercase shadow-lg flex items-center justify-center gap-2"
                                 >
                                    Confirmar Arribo
                                 </button>
                              ) : (
                                 <div className="grid grid-cols-2 gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${patient.id}`); }} className="py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[7px] font-black uppercase">Ficha</button>
                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${patient.id}/note/emergency`); }} className="py-2 bg-rose-600 text-white rounded-lg text-[7px] font-black uppercase">Nota</button>
                                 </div>
                              )}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center flex-1 gap-2">
                              <Plus size={16} className={patientInTransit ? "text-rose-400 animate-pulse" : "text-white/10"} />
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
    </div>
  );

  const renderHospitalizacion = () => {
    const config = AREA_CONFIG[activeHospArea];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in zoom-in-95">
        {renderSidebarPending(ModuleType.HOSPITALIZATION, config.color)}
        
        <div className="lg:col-span-9 space-y-8">
           <div className="bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-wrap gap-2">
              {(Object.keys(AREA_CONFIG) as HospitalArea[]).map(area => (
                 <button 
                   key={area}
                   onClick={() => { setActiveHospArea(area); }}
                   className={`flex items-center px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeHospArea === area ? `bg-${AREA_CONFIG[area].color}-600 text-white shadow-xl` : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   <span className="mr-3">{AREA_CONFIG[area].icon}</span> {area}
                 </button>
              ))}
           </div>

           <div className={`bg-white border-2 border-${config.color}-100 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden`}>
              <div className="flex justify-between items-center mb-12">
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-${config.color}-50 text-${config.color}-600 rounded-2xl flex items-center justify-center`}><Bed /></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase">Ala de {activeHospArea}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Camas: {config.prefix}-01 al {config.prefix}-{config.beds.toString().padStart(2, '0')}</p>
                    </div>
                 </div>
                 {patientInTransit && (
                   <div className={`flex items-center gap-4 bg-${config.color}-50 text-${config.color}-700 px-6 py-3 rounded-2xl border border-${config.color}-100 animate-pulse`}>
                      <span className="text-[10px] font-black uppercase">Moviendo a: {patientInTransit.name}</span>
                      <X size={16} className="cursor-pointer" onClick={() => setPatientInTransit(null)} />
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                 {Array.from({ length: config.beds }).map((_, i) => {
                    const bedId = `${config.prefix}-${(i+1).toString().padStart(2, '0')}`;
                    const patient = patients.find(p => p.assignedModule === ModuleType.HOSPITALIZATION && p.bedNumber === bedId);
                    
                    return (
                       <div 
                         key={i}
                         onClick={() => !patient && patientInTransit && handleCompleteMove(bedId, ModuleType.HOSPITALIZATION)}
                         className={`group relative h-56 rounded-[2.5rem] border-2 transition-all p-6 flex flex-col justify-between ${
                           patient ? 'bg-slate-900 border-slate-900 shadow-2xl scale-105' : 
                           patientInTransit ? `bg-${config.color}-50 border-${config.color}-500 border-dashed cursor-pointer scale-105` : 
                           'bg-slate-50 border-slate-100'
                         }`}
                       >
                          <div className="flex justify-between items-start">
                             <span className={`text-[10px] font-black ${patient ? 'text-white/40' : 'text-slate-300'}`}>{bedId}</span>
                             <div className="flex gap-2">
                               {patient?.status === PatientStatus.TRANSIT && <Truck size={14} className="text-amber-400 animate-bounce" />}
                               {patient && <button onClick={(e) => { e.stopPropagation(); handleStartMove(patient); }} className="text-white/20 hover:text-white"><MoveHorizontal size={14} /></button>}
                             </div>
                          </div>

                          {patient ? (
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-white uppercase tracking-tight leading-tight line-clamp-2">{patient.name}</p>
                                {patient.status === PatientStatus.TRANSIT ? (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handleConfirmArrival(patient); }} 
                                     className={`w-full py-2 bg-amber-500 text-slate-900 rounded-xl text-[8px] font-black uppercase shadow-lg`}
                                   >
                                      Ingresar
                                   </button>
                                ) : (
                                   <div className="grid grid-cols-2 gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${patient.id}`); }} className="py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[7px] font-black uppercase">Ficha</button>
                                      <button onClick={(e) => { e.stopPropagation(); navigate(`/patient/${patient.id}/note/evolution`); }} className="py-2 bg-blue-600 text-white rounded-lg text-[7px] font-black uppercase">Nota</button>
                                   </div>
                                )}
                             </div>
                          ) : (
                             <div className="flex flex-col items-center justify-center flex-1">
                                <Bed size={24} className={patientInTransit ? `text-${config.color}-400 animate-pulse` : "text-slate-200"} />
                                <p className="text-[7px] font-black text-slate-300 uppercase mt-2">Disponible</p>
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full space-y-10 pb-20 px-4 lg:px-0">
      
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em] mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Centro de Mando Clínico Integrado</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Hospital <span className="text-blue-600 italic">Monitor</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center bg-white border border-slate-200 p-2 rounded-[2.5rem] shadow-sm self-start gap-1">
          {(['Consulta', 'Urgencias', 'Hospitalización'] as const).map(mod => (
            <button 
              key={mod}
              onClick={() => { setActiveMainModule(mod); }}
              className={`flex items-center px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeMainModule === mod ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {mod === 'Consulta' ? <Users size={18} className="mr-3" /> : mod === 'Urgencias' ? <Flame size={18} className="mr-3" /> : <LayoutGrid size={18} className="mr-3" />}
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Banner Informativo de Traslado Activo */}
      {patientInTransit && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border-b-4 border-amber-500 animate-in slide-in-from-top-4 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center animate-pulse"><Truck /></div>
              <div>
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">MODO TRASLADO ACTIVO</p>
                 <h4 className="text-lg font-black uppercase tracking-tight">Paciente: {patientInTransit.name}</h4>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Origen: {patientInTransit.assignedModule} • {patientInTransit.bedNumber || 'Sin ubicación previa'}
                 </p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <p className="text-[10px] font-black text-slate-400 uppercase max-w-xs text-right hidden md:block">
                 Navegue entre las pestañas y áreas para seleccionar la nueva cama o consultorio de destino.
              </p>
              <button 
                onClick={() => setPatientInTransit(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl text-[10px] font-black uppercase transition-all"
              >
                 Cancelar Movimiento
              </button>
           </div>
        </div>
      )}

      <div className="min-h-[700px]">
         {activeMainModule === 'Consulta' && renderConsulta()}
         {activeMainModule === 'Urgencias' && renderUrgencias()}
         {activeMainModule === 'Hospitalización' && renderHospitalizacion()}
      </div>
    </div>
  );
};

export default HospitalMonitor;
