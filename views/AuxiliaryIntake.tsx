
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Microscope, ImageIcon, Save, User, Search, 
  FlaskConical, CheckCircle2, Plus, X, ClipboardList, Info, 
  CreditCard, UserCheck, Timer, AlertCircle, Fingerprint, Heart,
  Calendar, FileText, ArrowRight
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
    allergies: [],
    status: PatientStatus.WAITING_FOR_SAMPLES,
    priority: PriorityLevel.ROUTINE,
    assignedModule: ModuleType.AUXILIARY,
    scheduledDate: new Date().toISOString().split('T')[0], 
    reason: ''
  });

  const [opForm, setOpForm] = useState({
    labStudies: [] as string[],
    imagingStudies: [] as string[],
    urgency: 'Rutina',
    paymentStatus: 'Pendiente',
    technicianAssigned: 'Q.F.B. Beatriz Mendoza',
    observations: ''
  });

  const selectedCount = opForm.labStudies.length + opForm.imagingStudies.length;

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
      status: PatientStatus.WAITING_FOR_SAMPLES,
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    setSearchTerm('');
    setIsNewPatient(false);
  };

  const handleSave = () => {
    if (!patientForm.name || !patientForm.curp || !patientForm.age) {
      alert("Campos de identificación obligatorios.");
      return;
    }

    if (selectedCount === 0) {
      alert("Seleccione al menos un estudio.");
      return;
    }

    let pToSave: Patient;
    const isFuture = new Date(patientForm.scheduledDate!).getTime() > new Date().setHours(0,0,0,0);

    if (selectedPatient) {
      pToSave = {
        ...selectedPatient,
        ...patientForm as Patient,
        assignedModule: ModuleType.AUXILIARY,
        status: PatientStatus.WAITING_FOR_SAMPLES,
        reason: [...opForm.labStudies, ...opForm.imagingStudies].join(', ')
      };
      onUpdatePatient(pToSave);
    } else {
      pToSave = {
        ...patientForm as Patient,
        id: Math.random().toString(36).substr(2, 7).toUpperCase(),
        name: patientForm.name?.toUpperCase() || '',
        curp: patientForm.curp?.toUpperCase() || '',
        lastVisit: new Date().toISOString().split('T')[0],
        assignedModule: ModuleType.AUXILIARY,
        status: PatientStatus.WAITING_FOR_SAMPLES,
        reason: [...opForm.labStudies, ...opForm.imagingStudies].join(', '),
        vitalsHistory: []
      };
      onAddPatient(pToSave);
    }

    const intakeNote: ClinicalNote = {
      id: `INT-${Date.now()}`,
      patientId: pToSave.id,
      type: 'Ingreso Técnico a Auxiliares',
      date: new Date().toLocaleString('es-MX'),
      author: 'Recepción Auxiliares',
      content: { ...opForm, isIntake: true },
      isSigned: true,
      hash: `CERT-INT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    };

    onSaveNote(intakeNote);
    alert(isFuture ? `Programado para ${patientForm.scheduledDate}.` : `Ingreso técnico completado.`);
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Admisión Diagnóstica</h1>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
           <button onClick={() => setIsNewPatient(false)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isNewPatient ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Localizar</button>
           <button onClick={() => setIsNewPatient(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isNewPatient ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Nuevo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4"><User className="text-indigo-600" /> Identificación</h3>
                 <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <Calendar className="text-indigo-600 w-5 h-5" />
                    <input type="date" className="bg-transparent text-xs font-black uppercase outline-none text-indigo-700" value={patientForm.scheduledDate} onChange={e => setPatientForm({...patientForm, scheduledDate: e.target.value})} />
                 </div>
              </div>

              {!isNewPatient && !selectedPatient ? (
                <div className="space-y-6">
                   <div className="relative">
                      <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold outline-none" placeholder="Buscar por Nombre o CURP..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto no-scrollbar">
                      {filteredPatients.map(p => (
                         <button key={p.id} onClick={() => handleSelectExisting(p)} className="flex items-center p-6 bg-white border border-slate-100 rounded-[1.8rem] hover:border-indigo-400 hover:shadow-xl transition-all text-left group">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all mr-5 text-lg">{p.name.charAt(0)}</div>
                            <div>
                               <p className="text-xs font-black text-slate-900 uppercase truncate">{p.name}</p>
                               <p className="text-[9px] text-slate-400 font-mono mt-1">{p.curp}</p>
                            </div>
                         </button>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
                   <div className="col-span-full space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Nombre Completo *</label>
                     <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-sm" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">CURP *</label>
                     {/* Corrected variable from 'form' to 'patientForm' below */}
                     <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono uppercase text-sm font-bold" value={patientForm.curp} onChange={e => setPatientForm({...patientForm, curp: e.target.value.toUpperCase()})} maxLength={18} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Edad</label>
                       <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: parseInt(e.target.value)})}/>
                     </div>
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Sexo</label>
                       <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase shadow-inner" value={patientForm.sex} onChange={e => setPatientForm({...patientForm, sex: e.target.value as any})}>
                         <option value="M">MASCULINO</option><option value="F">FEMENINO</option>
                       </select>
                     </div>
                   </div>
                </div>
              )}
           </div>

           <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4"><ClipboardList className="text-indigo-600" /> Estudios</h3>
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                    <button onClick={() => setActiveTab('lab')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'lab' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Laboratorio</button>
                    <button onClick={() => setActiveTab('imaging')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'imaging' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500'}`}>Imagenología</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {(activeTab === 'lab' ? LAB_CATALOG : IMAGING_CATALOG).map(study => {
                    const isSelected = (activeTab === 'lab' ? opForm.labStudies : opForm.imagingStudies).includes(study.name);
                    return (
                      <button key={study.name} onClick={() => toggleStudy(study.name, activeTab)} className={`text-left p-6 rounded-[1.8rem] border-2 transition-all flex items-center justify-between group ${isSelected ? 'bg-indigo-50 border-indigo-600 shadow-lg scale-[1.02]' : 'bg-slate-50 border-transparent hover:border-indigo-200'}`}>
                         <span className={`text-[10px] font-black uppercase tracking-tight leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-500'}`}>{study.name}</span>
                         {isSelected ? <CheckCircle2 className="text-indigo-600" size={20} /> : <Plus className="text-slate-200 opacity-50" size={20} />}
                      </button>
                    );
                 })}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-slate-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-10 sticky top-32 border border-white/10">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} className="text-indigo-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Administrativo</h3>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Estatus Pago</label>
                   <div className="grid grid-cols-2 gap-4">
                      {['Pagado', 'Pendiente'].map(s => (
                         <button 
                           key={s} 
                           onClick={() => setOpForm({...opForm, paymentStatus: s})} 
                           className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${opForm.paymentStatus === s ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-105' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                         >
                            {s}
                         </button>
                      ))}
                   </div>
                 </div>

                 {/* Resumen dinámico basado en selección */}
                 <div className="p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] space-y-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Resumen de Orden</p>
                    <div className="space-y-3">
                       {selectedCount > 0 ? (
                         <>
                           {[...opForm.labStudies, ...opForm.imagingStudies].slice(0, 4).map(s => (
                             <div key={s} className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                               <CheckCircle2 size={12} className="text-indigo-500" />
                               <span className="uppercase truncate">{s}</span>
                             </div>
                           ))}
                           {selectedCount > 4 && <p className="text-[9px] text-slate-500 font-black italic">...y {selectedCount - 4} más</p>}
                         </>
                       ) : (
                         <p className="text-[10px] text-slate-600 font-black italic text-center py-4">Seleccione estudios del catálogo</p>
                       )}
                    </div>
                 </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSave}
                  className="w-full py-7 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] hover:bg-indigo-500 transition-all flex items-center justify-center gap-5 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Finalizar Admisión</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryIntake;
