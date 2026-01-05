
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Microscope, ImageIcon, Save, User, Search, 
  FlaskConical, CheckCircle2, Plus, X, ClipboardList, Info, 
  CreditCard, UserCheck, Timer, AlertCircle, Fingerprint, Heart,
  Calendar, FileText, ArrowRight, Database, History, UserPlus,
  ShieldCheck, FileSignature
} from 'lucide-react';
import { Patient, ClinicalNote, ModuleType, PatientStatus, PriorityLevel, ChargeItem, PriceItem, PriceType } from '../types';
import { LAB_CATALOG, IMAGING_CATALOG, INITIAL_PRICES } from '../constants';

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
  
  // Consent State
  const [showConsent, setShowConsent] = useState(false);
  const [consentSigned, setConsentSigned] = useState(false);

  // Load prices from localStorage to get dynamically created studies
  const prices: PriceItem[] = useMemo(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  }, []);

  // Merge static catalogs with dynamic price items marked as 'Estudios / Auxiliares'
  const mergedLabCatalog = useMemo(() => {
      const dynamicLabs = prices.filter(p => p.category === 'Estudios / Auxiliares' && !p.code.startsWith('IMG')).map(p => ({
          name: p.name,
          preparation: 'Consultar indicaciones',
          indications: 'Estudio de Laboratorio'
      }));
      const combined = [...LAB_CATALOG, ...dynamicLabs];
      return Array.from(new Map(combined.map(item => [item.name, item])).values());
  }, [prices]);

  const mergedImagingCatalog = useMemo(() => {
      const dynamicImg = prices.filter(p => p.category === 'Estudios / Auxiliares' && (p.code.startsWith('IMG') || p.name.includes('Rayos') || p.name.includes('Tomografía') || p.name.includes('Ultrasonido'))).map(p => ({
          name: p.name,
          preparation: 'Consultar indicaciones',
          indications: 'Estudio de Gabinete'
      }));
      const combined = [...IMAGING_CATALOG, ...dynamicImg];
      return Array.from(new Map(combined.map(item => [item.name, item])).values());
  }, [prices]);

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

  // Determine if any selected study requires consent (e.g., Contrast, Biopsy, HIV)
  const requiresConsent = useMemo(() => {
      const allStudies = [...opForm.labStudies, ...opForm.imagingStudies].join(' ').toLowerCase();
      return allStudies.includes('contraste') || allStudies.includes('biopsia') || allStudies.includes('vih') || allStudies.includes('punción');
  }, [opForm]);

  // Búsqueda en TODA la base de datos (Histórico y Activos)
  const filteredPatients = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const search = searchTerm.toLowerCase();
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
    // Reset consent if studies change
    setConsentSigned(false);
  };

  const handleSelectExisting = (p: Patient) => {
    setSelectedPatient(p);
    setPatientForm({ 
      ...p, 
      status: PatientStatus.WAITING_FOR_SAMPLES,
      assignedModule: ModuleType.AUXILIARY,
      priority: PriorityLevel.ROUTINE,
      reason: '' 
    });
    setSearchTerm('');
  };

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const handleSave = () => {
    if (!patientForm.name) return;
    if (selectedCount === 0) {
      alert("Seleccione al menos un estudio para el ingreso.");
      return;
    }
    
    if (requiresConsent && !consentSigned) {
        alert("Algunos estudios seleccionados requieren Consentimiento Informado. Por favor, fírmelo antes de continuar.");
        setShowConsent(true);
        return;
    }

    const studySummary = [...opForm.labStudies, ...opForm.imagingStudies].join(', ');
    
    // Generar cargos pendientes
    const pendingCharges: ChargeItem[] = [];
    const allSelectedStudies = [...opForm.labStudies, ...opForm.imagingStudies];
    
    allSelectedStudies.forEach(studyName => {
        const priceItem = prices.find(p => p.name === studyName);
        const price = priceItem ? priceItem.price : 0;
        const tax = priceItem ? (price * priceItem.taxPercent / 100) : 0;

        pendingCharges.push({
            id: generateId('CHG'),
            date: new Date().toISOString(),
            concept: studyName,
            quantity: 1,
            unitPrice: price,
            tax: tax,
            total: price + tax,
            type: 'Estudios',
            status: 'Pendiente'
        });
    });

    let pToSave: Patient;

    if (selectedPatient) {
      const existingPending = selectedPatient.pendingCharges || [];
      pToSave = {
        ...selectedPatient, 
        ...patientForm as Patient, 
        status: PatientStatus.WAITING_FOR_SAMPLES,
        assignedModule: ModuleType.AUXILIARY,
        reason: studySummary,
        lastVisit: new Date().toISOString().split('T')[0],
        paymentStatus: 'Pendiente', 
        pendingCharges: [...existingPending, ...pendingCharges]
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
        lastVisit: new Date().toISOString().split('T')[0],
        paymentStatus: 'Pendiente', 
        pendingCharges: pendingCharges
      };
      onAddPatient(pToSave);
    }

    // Save consent note if required and signed
    if (requiresConsent && consentSigned) {
        const consentNote: ClinicalNote = {
            id: `CONS-LAB-${Date.now()}`,
            patientId: pToSave.id,
            type: 'Consentimiento Informado (Laboratorio/Imagen)',
            date: new Date().toLocaleString('es-MX'),
            author: 'Admisión Auxiliares',
            content: {
                authorizedAct: studySummary,
                risks: 'Reacción adversa a medio de contraste, hematoma, infección (según procedimiento).',
                benefits: 'Diagnóstico preciso para tratamiento.',
                contingencyAuth: true
            },
            isSigned: true
        };
        onSaveNote(consentNote);
    }

    navigate('/'); 
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
      {/* ... Header and Patient Search Section (same as original) ... */}
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
           {/* ... Patient Selection Logic (Same as original) ... */}
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
                 {(activeTab === 'lab' ? mergedLabCatalog : mergedImagingCatalog).map(study => {
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
                 
                 {/* CONSENT REQUIREMENT INDICATOR */}
                 {requiresConsent && (
                     <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                         <AlertCircle className="text-amber-500 flex-shrink-0" size={16}/>
                         <div className="space-y-1">
                             <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Requiere Consentimiento</p>
                             <button onClick={() => setShowConsent(true)} className="text-[9px] underline text-white hover:text-amber-400">
                                 {consentSigned ? '✅ Firmado y Validado' : '⚠️ Pendiente de Firma'}
                             </button>
                         </div>
                     </div>
                 )}

                 <div className="bg-blue-50/10 p-6 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-blue-300 font-medium uppercase leading-relaxed tracking-tight">
                     "Nota: Al guardar, se generarán cargos pendientes en la cuenta del paciente. Deberá realizar el pago en Caja antes de proceder a la toma de muestra."
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

      {/* CONSENT MODAL */}
      {showConsent && (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <ShieldCheck size={32} className="text-indigo-600"/>
                          <div>
                             <h3 className="text-xl font-black text-slate-900 uppercase">Consentimiento Informado</h3>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para procedimientos diagnósticos invasivos</p>
                          </div>
                      </div>
                      <button onClick={() => setShowConsent(false)}><X size={24} className="text-slate-400"/></button>
                  </div>
                  <div className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
                      <p className="text-xs text-justify font-medium text-slate-600 leading-relaxed">
                          Por medio de la presente, autorizo al personal técnico y médico del laboratorio para realizar la toma de muestras y/o estudios de imagenología solicitados (incluyendo el uso de medios de contraste o punciones si aplica).
                          <br/><br/>
                          He sido informado de los riesgos potenciales como hematomas, reacciones alérgicas leves a severas, o molestias locales, así como de los beneficios diagnósticos.
                          <br/><br/>
                          Confirmo que he proporcionado información veraz sobre mis antecedentes alérgicos y estado de salud.
                      </p>
                      
                      <div 
                         onClick={() => setConsentSigned(!consentSigned)}
                         className={`h-32 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer transition-all ${consentSigned ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-500 group'}`}
                      >
                          {consentSigned ? (
                              <div className="text-emerald-600 text-center space-y-2">
                                  <CheckCircle2 size={40} className="mx-auto"/>
                                  <p className="text-[10px] font-black uppercase tracking-widest">Firmado Digitalmente</p>
                              </div>
                          ) : (
                              <div className="text-slate-400 text-center space-y-2 group-hover:text-indigo-600">
                                  <FileSignature size={32} className="mx-auto"/>
                                  <p className="text-[10px] font-black uppercase tracking-widest">Click para Firmar</p>
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button 
                        onClick={() => setShowConsent(false)} 
                        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
                      >
                          Guardar y Cerrar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AuxiliaryIntake;
