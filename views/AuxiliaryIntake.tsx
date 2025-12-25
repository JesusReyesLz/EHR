
import React, { useState, useMemo } from 'react';
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
    setPatientForm({ ...p, status: PatientStatus.WAITING_FOR_SAMPLES });
    setSearchTerm('');
  };

  const handleSave = () => {
    if (!patientForm.name || !patientForm.curp) return;
    if (selectedCount === 0) {
      alert("Seleccione al menos un estudio para el ingreso.");
      return;
    }

    let pToSave: Patient;
    const studySummary = [...opForm.labStudies, ...opForm.imagingStudies].join(', ');

    if (selectedPatient) {
      pToSave = {
        ...selectedPatient,
        ...patientForm as Patient,
        status: PatientStatus.WAITING_FOR_SAMPLES,
        reason: studySummary
      };
      onUpdatePatient(pToSave);
    } else {
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

    // Nota administrativa omitida del historial clínico por requerimiento
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
           <button onClick={() => { setIsNewPatient(false); setSelectedPatient(null); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isNewPatient ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Localizar</button>
           <button onClick={() => { setIsNewPatient(true); setSelectedPatient(null); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isNewPatient ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Nuevo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4 border-b border-slate-50 pb-6"><User className="text-indigo-600" /> Datos del Paciente</h3>

              {!isNewPatient && !selectedPatient ? (
                <div className="relative">
                   <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:bg-white transition-all shadow-inner" placeholder="Buscar por Nombre o CURP..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   {filteredPatients.length > 0 && (
                     <div className="absolute top-full left-0 w-full mt-4 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in zoom-in-95">
                        {filteredPatients.map(p => (
                          <button key={p.id} onClick={() => handleSelectExisting(p)} className="w-full flex items-center p-6 hover:bg-indigo-50 transition-all text-left border-b border-slate-50 last:border-0">
                             <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black mr-6 shadow-md">{p.name[0]}</div>
                             <div><p className="text-xs font-black uppercase tracking-tight text-slate-900">{p.name}</p><p className="text-[9px] text-slate-400 font-mono mt-1">{p.curp}</p></div>
                          </button>
                        ))}
                     </div>
                   )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
                   <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Nombre Completo</label><input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:bg-white focus:border-indigo-200" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} /></div>
                   <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">CURP</label><input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold outline-none focus:bg-white" value={patientForm.curp} onChange={e => setPatientForm({...patientForm, curp: e.target.value.toUpperCase()})} maxLength={18} /></div>
                   <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Edad</label><input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: parseInt(e.target.value) || 0})} /></div>
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
                     "Nota: Este ingreso administrativo no será persistido en el expediente clínico permanente del paciente para agilizar la operatividad de recepción."
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
