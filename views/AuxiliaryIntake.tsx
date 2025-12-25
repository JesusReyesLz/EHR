
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Microscope, ImageIcon, Save, User, Search, 
  FlaskConical, CheckCircle2, Plus, X, ClipboardList, Info, 
  CreditCard, UserCheck, Timer, AlertCircle, Fingerprint, Heart,
  Calendar, FileText, ArrowRight, Database, History, UserPlus
} from 'lucide-react';
import { Patient, ClinicalNote, ModuleType, PatientStatus, PriorityLevel } from '../types';
import { LAB_CATALOG, IMAGING_CATALOG } from '../constants';

interface AuxiliaryIntakeProps {
  patients: Patient[];
  onSaveNote: (n: ClinicalNote) => void;
  onUpdatePatient: (p: Patient) => void;
  onAddPatient: (p: Patient) => void;
}

const AuxiliaryIntake: React.FC<AuxiliaryIntakeProps> = ({ patients, onSaveNote, onUpdatePatient, onAddPatient }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'lab' | 'imaging'>('lab');

  const [patientForm, setPatientForm] = useState<Partial<Patient>>({
    name: '',
    curp: '',
    age: 0,
    sex: 'M',
    bloodType: 'O+',
    status: PatientStatus.WAITING_FOR_SAMPLES,
    priority: PriorityLevel.ROUTINE,
    assignedModule: ModuleType.AUXILIARY,
    scheduledDate: new Date().toISOString().split('T')[0], 
    reason: ''
  });

  const [opForm, setOpForm] = useState({
    labStudies: [] as string[],
    imagingStudies: [] as string[],
    paymentStatus: 'Pendiente',
    observations: ''
  });

  const selectedCount = opForm.labStudies.length + opForm.imagingStudies.length;

  // Búsqueda en TODA la base de datos (Histórico y Activos)
  const filteredPatients = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const search = searchTerm.toLowerCase();
    // Filtramos para evitar duplicados visuales si hay registros históricos (OLD-) pero permitimos encontrar al paciente original
    return patients
      .filter(p => !p.id.startsWith('OLD-')) 
      .filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.curp.toLowerCase().includes(search)
      );
  }, [patients, searchTerm]);

  const toggleStudy = (study: string, type: 'lab' | 'imaging') => {
    const key = type === 'lab' ? 'labStudies' : 'imagingStudies';
    const current = (opForm as any)[key] as string[];
    if (current.includes(study)) {
      setOpForm({...opForm, [key]: current.filter(s => s !== study)});
    } else {
      setOpForm({...opForm, [key]: [...current, study]});
    }
  };

  const handleSelectExisting = (p: Patient) => {
    setSelectedPatient(p);
    // Pre-llenamos el formulario con los datos de la base de datos
    setPatientForm({ 
      ...p, 
      // Forzamos el estatus y módulo para la nueva admisión a auxiliares
      status: PatientStatus.WAITING_FOR_SAMPLES,
      assignedModule: ModuleType.AUXILIARY,
      priority: PriorityLevel.ROUTINE,
      reason: '' // Limpiamos el motivo anterior para poner los nuevos estudios
    });
    setSearchTerm('');
  };

  const handleSave = () => {
    if (!patientForm.name) return;
    if (selectedCount === 0) {
      alert("Seleccione al menos un estudio para el ingreso.");
      return;
    }

    let pToSave: Patient;
    const studySummary = [...opForm.labStudies, ...opForm.imagingStudies].join(', ');

    if (selectedPatient) {
      // ACTUALIZACIÓN DE PACIENTE EXISTENTE (REINGRESO A AUXILIARES)
      pToSave = {
        ...selectedPatient, // Mantenemos ID e historial
        ...patientForm as Patient, // Sobrescribimos datos editados si hubo
        status: PatientStatus.WAITING_FOR_SAMPLES,
        assignedModule: ModuleType.AUXILIARY,
        reason: studySummary,
        lastVisit: new Date().toISOString().split('T')[0]
      };
      onUpdatePatient(pToSave);
    } else {
      // PACIENTE TOTALMENTE NUEVO
      pToSave = {
        ...patientForm as Patient,
        id: `AUX-${Date.now().toString().slice(-4)}`,
        name: patientForm.name?.toUpperCase() || '',
        curp: patientForm.curp?.toUpperCase() || '',
        assignedModule: ModuleType.AUXILIARY,
        status: PatientStatus.WAITING_FOR_SAMPLES,
        reason: studySummary,
        allergies: [],
        chronicDiseases: [],
        lastVisit: new Date().toISOString().split('T')[0]
      };
      onAddPatient(pToSave);
    }

    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 shadow-xl"><ChevronLeft size={24} /></button>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Admisión de Servicios Auxiliares</h1>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
           <button onClick={() => { setIsNewPatient(false); setSelectedPatient(null); setPatientForm({name:'', curp:'', age:0, sex:'M', bloodType:'O+'}); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isNewPatient ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Base de Datos</button>
           <button onClick={() => { setIsNewPatient(true); setSelectedPatient(null); setPatientForm({name:'', curp:'', age:0, sex:'M', bloodType:'O+'}); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isNewPatient ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Nuevo Registro</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4 border-b border-slate-50 pb-6">
                 {isNewPatient ? <UserPlus size={20} className="text-indigo-600" /> : <Database size={20} className="text-indigo-600" />}
                 {isNewPatient ? 'Registro de Paciente Nuevo' : 'Búsqueda en Padrón de Pacientes'}
              </h3>

              {!isNewPatient && !selectedPatient ? (
                <div className="relative">
                   <div className="flex items-center gap-4 mb-4 text-slate-400">
                      <Search size={20} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Ingrese Nombre o CURP para localizar expediente existente</p>
                   </div>
                   <input 
                      className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-xl font-black outline-none focus:bg-white focus:border-indigo-200 transition-all shadow-inner text-center uppercase" 
                      placeholder="Ej: JUAN PEREZ..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)}
                      autoFocus 
                   />
                   
                   {filteredPatients.length > 0 && (
                     <div className="mt-6 space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Resultados Encontrados ({filteredPatients.length})</p>
                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                           {filteredPatients.map(p => (
                             <button 
                                key={p.id} 
                                onClick={() => handleSelectExisting(p)} 
                                className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all rounded-3xl group shadow-sm text-left"
                             >
                                <div className="flex items-center gap-5">
                                   <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      {p.name.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-900 uppercase">{p.name}</p>
                                      <div className="flex gap-4 mt-1">
                                         <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{p.curp}</span>
                                         <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><History size={10} /> Última: {p.lastVisit}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-indigo-500 text-slate-300 group-hover:text-indigo-500">
                                   <ArrowRight size={20} />
                                </div>
                             </button>
                           ))}
                        </div>
                     </div>
                   )}
                   {searchTerm.length > 2 && filteredPatients.length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                         <p className="font-bold text-xs uppercase">No se encontraron pacientes con esos datos.</p>
                      </div>
                   )}
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-4 space-y-6">
                   {selectedPatient && (
                      <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 className="text-indigo-600" size={20} />
                            <p className="text-xs font-black text-indigo-900 uppercase">Paciente Identificado</p>
                         </div>
                         <button onClick={() => { setSelectedPatient(null); setPatientForm({name:'', curp:'', age:0}); setSearchTerm(''); }} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">Cambiar</button>
                      </div>
                   )}
                   
                   <div className="grid grid-cols-2 gap-8">
                      <div className="col-span-2 space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Nombre Completo</label>
                         <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:bg-white focus:border-indigo-200" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} readOnly={!!selectedPatient} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">CURP</label>
                         <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold outline-none focus:bg-white" value={patientForm.curp} onChange={e => setPatientForm({...patientForm, curp: e.target.value.toUpperCase()})} maxLength={18} readOnly={!!selectedPatient} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Edad</label>
                         <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: parseInt(e.target.value) || 0})} readOnly={!!selectedPatient} />
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4"><ClipboardList className="text-indigo-600" /> Selección de Estudios</h3>
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
                    <button onClick={() => setActiveTab('lab')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'lab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Laboratorio</button>
                    <button onClick={() => setActiveTab('imaging')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'imaging' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>Imagenología</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto no-scrollbar">
                 {(activeTab === 'lab' ? LAB_CATALOG : IMAGING_CATALOG).map(study => {
                    const isSelected = (activeTab === 'lab' ? opForm.labStudies : opForm.imagingStudies).includes(study.name);
                    return (
                      <button key={study.name} onClick={() => toggleStudy(study.name, activeTab)} className={`text-left p-6 rounded-[1.8rem] border-2 transition-all flex items-center justify-between group ${isSelected ? 'bg-indigo-50 border-indigo-600 shadow-sm' : 'bg-slate-50 border-transparent hover:border-indigo-200'}`}>
                         <span className="text-[10px] font-black uppercase tracking-tight leading-tight pr-4">{study.name}</span>
                         {isSelected ? <CheckCircle2 className="text-indigo-600 shrink-0" size={20} /> : <Plus className="text-slate-300 group-hover:text-indigo-400 shrink-0" size={20} />}
                      </button>
                    );
                 })}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-10 sticky top-32 border-b-8 border-indigo-600">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-6 flex items-center gap-3">
                 <Timer size={20} /> Resumen Administrativo
              </h3>
              <div className="space-y-6">
                 <div className="p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] space-y-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Servicios a Realizar</p>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar">
                       {selectedCount > 0 ? [...opForm.labStudies, ...opForm.imagingStudies].map(s => (
                         <div key={s} className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                           <p className="text-[10px] font-bold text-slate-300 uppercase leading-none">{s}</p>
                         </div>
                       )) : <p className="text-[10px] italic opacity-40">Sin estudios seleccionados</p>}
                    </div>
                 </div>

                 <div className="bg-blue-50/10 p-6 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-blue-300 font-medium uppercase leading-relaxed tracking-tight">
                     "Nota: Si el paciente ya existe en el sistema, esta acción actualizará su estatus a 'En Espera de Toma' en el módulo de Auxiliares, manteniendo su historial clínico previo."
                   </p>
                 </div>

                 <button 
                  onClick={handleSave} 
                  disabled={selectedCount === 0 || !patientForm.name}
                  className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 disabled:opacity-20 active:scale-95"
                 >
                   Confirmar e Ingresar <ArrowRight size={20}/>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryIntake;
