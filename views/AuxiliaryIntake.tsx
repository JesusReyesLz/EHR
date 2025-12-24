
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Microscope, ImageIcon, Save, User, Search, 
  FlaskConical, CheckCircle2, Plus, X, ClipboardList, Info, 
  CreditCard, UserCheck, Timer, AlertCircle, Fingerprint, Heart
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

  // Estado del formulario de paciente (para nuevos o edición rápida)
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({
    name: '',
    curp: '',
    age: 0,
    sex: 'M',
    bloodType: 'O+',
    allergies: [],
    status: PatientStatus.WAITING,
    priority: PriorityLevel.ROUTINE,
    assignedModule: ModuleType.AUXILIARY,
    reason: ''
  });

  // Estado operativo
  const [opForm, setOpForm] = useState({
    labStudies: [] as string[],
    imagingStudies: [] as string[],
    urgency: 'Rutina',
    paymentStatus: 'Pendiente',
    technicianAssigned: 'Q.F.B. Beatriz Mendoza',
    observations: ''
  });

  const filteredPatients = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.curp.toLowerCase().includes(searchTerm.toLowerCase())
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
    setPatientForm({
      ...p,
      assignedModule: ModuleType.AUXILIARY,
      status: PatientStatus.WAITING
    });
    setSearchTerm('');
    setIsNewPatient(false);
  };

  const handleSave = () => {
    // 1. Validar campos de identificación obligatorios
    if (!patientForm.name || !patientForm.curp || !patientForm.age) {
      alert("Los campos de identificación (Nombre, CURP, Edad) son obligatorios conforme a la NOM-004.");
      return;
    }

    if (opForm.labStudies.length === 0 && opForm.imagingStudies.length === 0) {
      alert("Debe seleccionar al menos un estudio para realizar el ingreso.");
      return;
    }

    let patientToProcess: Patient;

    if (selectedPatient) {
      // Actualizar paciente existente
      patientToProcess = {
        ...selectedPatient,
        ...patientForm as Patient,
        assignedModule: ModuleType.AUXILIARY,
        status: PatientStatus.WAITING,
        reason: [...opForm.labStudies, ...opForm.imagingStudies].join(', ')
      };
      onUpdatePatient(patientToProcess);
    } else {
      // Crear nuevo paciente
      patientToProcess = {
        ...patientForm as Patient,
        id: Math.random().toString(36).substr(2, 7).toUpperCase(),
        name: patientForm.name?.toUpperCase() || '',
        curp: patientForm.curp?.toUpperCase() || '',
        lastVisit: new Date().toISOString().split('T')[0],
        assignedModule: ModuleType.AUXILIARY,
        status: PatientStatus.WAITING,
        reason: [...opForm.labStudies, ...opForm.imagingStudies].join(', '),
        priority: patientForm.priority || PriorityLevel.ROUTINE,
        chronicDiseases: []
      };
      onAddPatient(patientToProcess);
    }

    // 2. Crear nota de Ingreso Técnico
    const intakeNote: ClinicalNote = {
      id: `INTAKE-${Date.now()}`,
      patientId: patientToProcess.id,
      type: 'Ingreso Técnico a Auxiliares',
      date: new Date().toLocaleString('es-MX'),
      author: 'Admisión Auxiliares',
      content: { 
        ...opForm, 
        patientSummary: { 
           name: patientToProcess.name, 
           curp: patientToProcess.curp,
           age: patientToProcess.age
        },
        isIntake: true 
      },
      isSigned: true,
      hash: `CERT-AUX-INT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    onSaveNote(intakeNote);
    navigate('/'); // Vuelve al dashboard de auxiliares
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* HEADER DE ADMISIÓN */}
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Registro de Ingreso a Diagnóstico</h1>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <Timer size={14} className="text-indigo-500 mr-2" /> Admisión Técnica y Alta de Paciente
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
           <button onClick={() => { setIsNewPatient(false); setSelectedPatient(null); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isNewPatient ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Buscar Paciente</button>
           <button onClick={() => { setIsNewPatient(true); setSelectedPatient(null); setPatientForm({ name: '', curp: '', age: 0, sex: 'M', bloodType: 'O+', allergies: [], assignedModule: ModuleType.AUXILIARY }); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isNewPatient ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Alta Paciente Nuevo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* COLUMNA IZQUIERDA: IDENTIFICACIÓN Y ESTUDIOS */}
        <div className="lg:col-span-8 space-y-10">
           
           {/* SECCIÓN 1: IDENTIFICACIÓN */}
           <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4">
                 <User className="text-indigo-600" /> 1. Ficha de Identificación (NOM-004)
              </h3>

              {!isNewPatient && !selectedPatient ? (
                <div className="space-y-6">
                   <div className="relative">
                      <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:ring-8 focus:ring-indigo-50 transition-all"
                        placeholder="Escriba Nombre o CURP para buscar..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto no-scrollbar">
                      {filteredPatients.map(p => (
                         <button 
                           key={p.id}
                           onClick={() => handleSelectExisting(p)}
                           className="flex items-center p-6 bg-white border border-slate-100 rounded-[1.8rem] hover:border-indigo-400 hover:shadow-xl transition-all text-left group"
                         >
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all mr-5 text-lg">{p.name.charAt(0)}</div>
                            <div className="flex-1">
                               <p className="text-xs font-black text-slate-900 uppercase truncate">{p.name}</p>
                               <p className="text-[9px] text-slate-400 font-mono tracking-tighter mt-1">{p.curp}</p>
                            </div>
                         </button>
                      ))}
                      {searchTerm.length >= 2 && filteredPatients.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-50 rounded-3xl">
                           No se encontraron coincidencias. ¿Desea registrarlo como nuevo?
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-top-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="col-span-full space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Nombre Completo *</label>
                        <input 
                          type="text" 
                          className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-black uppercase text-sm shadow-inner"
                          value={patientForm.name}
                          onChange={e => setPatientForm({...patientForm, name: e.target.value})}
                          placeholder="APELLIDOS Y NOMBRES"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">CURP *</label>
                        <input 
                          type="text" 
                          className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono uppercase text-sm font-bold shadow-inner"
                          value={patientForm.curp}
                          onChange={e => setPatientForm({...patientForm, curp: e.target.value})}
                          maxLength={18}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Edad *</label>
                          <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold shadow-inner" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: parseInt(e.target.value)})}/>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Sexo *</label>
                          <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase shadow-inner" value={patientForm.sex} onChange={e => setPatientForm({...patientForm, sex: e.target.value as any})}>
                            <option value="M">MASCULINO</option><option value="F">FEMENINO</option><option value="O">OTRO</option>
                          </select>
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Grupo y Rh</label>
                        <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase shadow-inner" value={patientForm.bloodType} onChange={e => setPatientForm({...patientForm, bloodType: e.target.value})}>
                           {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block ml-2">Alergias</label>
                        <input className="w-full p-5 bg-slate-50 border border-rose-100 rounded-2xl text-xs font-bold uppercase text-rose-600 shadow-inner" value={patientForm.allergies?.join(', ')} onChange={e => setPatientForm({...patientForm, allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})} placeholder="NEGADAS" />
                      </div>
                   </div>

                   {selectedPatient && (
                      <div className="pt-6 border-t border-slate-100 flex justify-end">
                         <button onClick={() => { setSelectedPatient(null); setIsNewPatient(false); }} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                           <X size={12} /> Limpiar Selección
                         </button>
                      </div>
                   )}
                </div>
              )}
           </div>

           {/* SECCIÓN 2: ESTUDIOS */}
           <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4">
                    <ClipboardList className="text-indigo-600" /> 2. Selección de Estudios a Realizar
                 </h3>
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                    <button onClick={() => setActiveTab('lab')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lab' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Laboratorio</button>
                    <button onClick={() => setActiveTab('imaging')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'imaging' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500'}`}>Imagenología</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                 {(activeTab === 'lab' ? LAB_CATALOG : IMAGING_CATALOG).map(study => {
                    const isSelected = (activeTab === 'lab' ? opForm.labStudies : opForm.imagingStudies).includes(study.name);
                    return (
                      <button 
                        key={study.name}
                        onClick={() => toggleStudy(study.name, activeTab)}
                        className={`text-left p-6 rounded-[1.8rem] border-2 transition-all flex items-center justify-between group ${isSelected ? 'bg-indigo-50 border-indigo-600 shadow-lg scale-[1.02]' : 'bg-slate-50 border-transparent hover:border-indigo-200'}`}
                      >
                         <span className={`text-[10px] font-black uppercase tracking-tight leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-500'}`}>{study.name}</span>
                         {isSelected ? <CheckCircle2 className="text-indigo-600" size={20} /> : <Plus className="text-slate-200 opacity-50 group-hover:text-indigo-400" size={20} />}
                      </button>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* COLUMNA DERECHA: DATOS OPERATIVOS */}
        <div className="lg:col-span-4 space-y-10">
           
           <div className="bg-slate-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-10 sticky top-32">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-4">
                 <CreditCard size={20} /> Datos Administrativos
              </h3>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Estatus del Pago</label>
                    <div className="grid grid-cols-2 gap-4">
                       {['Pagado', 'Pendiente'].map(s => (
                          <button key={s} onClick={() => setOpForm({...opForm, paymentStatus: s})} className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${opForm.paymentStatus === s ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>
                             {s}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Prioridad de Procesamiento</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['Rutina', 'Prioridad', 'Urgente'].map(u => (
                          <button key={u} onClick={() => setOpForm({...opForm, urgency: u})} className={`py-3 rounded-xl text-[8px] font-black uppercase border transition-all ${opForm.urgency === u ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>
                             {u}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Observaciones Técnicas</label>
                    <textarea 
                      className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-xs h-32 outline-none italic leading-relaxed focus:border-indigo-500 focus:bg-white/10 transition-all" 
                      value={opForm.observations} 
                      onChange={e => setOpForm({...opForm, observations: e.target.value})} 
                      placeholder="Ej: Requiere silla de ruedas, ayuno parcial..." 
                    />
                 </div>
              </div>

              <div className="p-8 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] space-y-6 shadow-inner">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Resumen de Recepción</p>
                 <div className="space-y-3">
                    {[...opForm.labStudies, ...opForm.imagingStudies].map(s => (
                       <div key={s} className="flex justify-between items-center text-[11px] font-black border-b border-white/5 pb-2">
                          <span className="uppercase text-slate-300 truncate pr-4">• {s}</span>
                          <span className="text-emerald-400">OK</span>
                       </div>
                    ))}
                    {[...opForm.labStudies, ...opForm.imagingStudies].length === 0 && <p className="text-[10px] text-slate-600 font-black italic text-center">Seleccione estudios</p>}
                 </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={(!patientForm.name && !selectedPatient) || ([...opForm.labStudies, ...opForm.imagingStudies].length === 0)}
                className="w-full py-7 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-5 group disabled:opacity-20 disabled:cursor-not-allowed"
              >
                 <UserCheck size={24} className="group-hover:scale-110 transition-transform" /> 
                 Finalizar Admisión
              </button>
           </div>

           <div className="p-10 bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] flex items-start gap-6">
              <AlertCircle className="text-indigo-600 w-10 h-10 shrink-0 mt-1" />
              <div className="space-y-2">
                 <p className="text-[11px] font-black text-indigo-900 uppercase tracking-tight">Legalidad de la Información</p>
                 <p className="text-[10px] text-indigo-700 font-bold leading-relaxed uppercase">
                    "Toda la información capturada forma parte del expediente clínico integrado del paciente y tiene validez jurídica conforme a la NOM-004-SSA3-2012."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryIntake;
