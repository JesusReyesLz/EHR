import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Activity, FileText, ChevronRight, HeartPulse, Plus, X, 
  Search, Printer, Lock, CheckCircle2, Edit3, AlertOctagon, 
  Thermometer, Droplet, Scale, Ruler, FilePlus2, ClipboardList,
  LogOut, Globe, Accessibility, QrCode
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Patient, ClinicalNote, DoctorInfo, PatientStatus, Vitals } from '../types';
import { NOTE_CATEGORIES } from '../constants';

interface PatientProfileProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onUpdatePatient: (p: Patient) => void;
  onSaveNote: (n: ClinicalNote) => void;
  doctorInfo: DoctorInfo;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patients, notes, onUpdatePatient, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [showMenu, setShowMenu] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<Partial<Vitals>>({});

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeData, setFinalizeData] = useState({
      diagnosis: '',
      consultationType: 'Subsecuente',
      program: 'Consulta Externa',
      specifics: {},
      isIndigenous: false,
      isDisability: false,
      isMigrant: false,
      referral: 'Ninguna',
      notes: ''
  });

  useEffect(() => {
    if (patient?.currentVitals) {
        setVitalsForm(patient.currentVitals);
    }
  }, [patient]);

  if (!patient) return <div className="p-20 text-center">Paciente no encontrado</div>;

  const isAttended = patient.status === PatientStatus.ATTENDED;

  const patientNotes = useMemo(() => {
      return notes.filter(n => n.patientId === id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, id]);

  const handleUpdateVitals = () => {
      if (!vitalsForm.bp || !vitalsForm.temp) return alert("Complete al menos T/A y Temperatura");
      const newVitals: Vitals = {
          bp: vitalsForm.bp || '',
          temp: Number(vitalsForm.temp),
          hr: Number(vitalsForm.hr),
          rr: Number(vitalsForm.rr),
          o2: Number(vitalsForm.o2),
          weight: Number(vitalsForm.weight),
          height: Number(vitalsForm.height),
          bmi: Number(vitalsForm.bmi),
          date: new Date().toLocaleString('es-MX')
      };
      
      // Calculate BMI if missing but weight/height present
      if (!newVitals.bmi && newVitals.weight && newVitals.height) {
          const h = newVitals.height / 100;
          newVitals.bmi = parseFloat((newVitals.weight / (h * h)).toFixed(1));
      }

      onUpdatePatient({
          ...patient,
          currentVitals: newVitals,
          vitalsHistory: [newVitals, ...(patient.vitalsHistory || [])]
      });
      setShowVitalsModal(false);
  };

  const handleConfirmFinalize = () => {
     if (!finalizeData.diagnosis) return alert("El diagnóstico es obligatorio");
     
     // 1. Create Discharge Note/Record (SUIVE compatible)
     const dischargeNote: ClinicalNote = {
         id: `SUIVE-${Date.now()}`,
         patientId: patient.id,
         type: 'Cierre de Consulta (SUIVE)',
         date: new Date().toLocaleString('es-MX'),
         author: doctorInfo.name,
         content: { ...finalizeData, medico: doctorInfo.name, timestamp: new Date().toISOString() },
         isSigned: true,
         hash: `SUIVE-${Math.random().toString(36).substr(2,8)}`
     };
     onSaveNote(dischargeNote);

     // 2. Update Patient Status
     onUpdatePatient({
         ...patient,
         status: PatientStatus.ATTENDED,
         history: {
             ...patient.history,
             dischargeData: { ...finalizeData, medico: doctorInfo.name, timestamp: new Date().toISOString() }
         }
     });

     setShowFinalizeModal(false);
     navigate('/');
  };

  const renderProgramSpecificFields = () => {
     // Optional logic to render specific fields based on program selection
     return null; 
  };

  const renderDynamicChart = (history: Vitals[] | null) => {
    if (!history || history.length < 2) return null;
    const data = [...history].reverse().map(v => ({
        date: v.date.split(' ')[0], // Just date part
        systolic: parseInt(v.bp.split('/')[0]),
        diastolic: parseInt(v.bp.split('/')[1]),
        weight: v.weight
    }));

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm h-64">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Tendencia de Tensión Arterial</h4>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']}/>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}/>
                    <Area type="monotone" dataKey="systolic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBp)" strokeWidth={2} />
                    <Area type="monotone" dataKey="diastolic" stroke="#93c5fd" fillOpacity={1} fill="url(#colorBp)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
  };

  const getNoteRoute = (type: string, noteId?: string) => {
    const typeMap: any = { 
      'Historia Clínica Medica': `/patient/${id}/history`, 
      'Nota de Evolución': `/patient/${id}/note/evolution`, 
      'Nota de Ingreso a Hospitalización': `/patient/${id}/note/admission`, 
      'Nota Pre-operatoria': `/patient/${id}/note/preoperative`, 
      'Nota Pre-anestésica': `/patient/${id}/note/preanesthetic`,
      'Hoja de Registro Anestésico': `/patient/${id}/note/anesthetic-record`, 
      'Nota Post-anestésica': `/patient/${id}/note/postanesthetic`, 
      'Nota de Alta de Recuperación': `/patient/${id}/note/recovery-discharge`,
      'Nota Post-operatoria': `/patient/${id}/note/postoperative`,
      'Nota Quirúrgica': `/patient/${id}/note/surgical`,
      'Nota Inicial de Urgencias': `/patient/${id}/note/emergency`,
      'Nota de Interconsulta': `/patient/${id}/note/interconsulta`,
      'Nota de Egreso / Alta': `/patient/${id}/note/discharge`,
      'Nota de Referencia y Traslado': `/patient/${id}/note/referral`,
      'Nota de Contrarreferencia': `/patient/${id}/note/counter-referral`,
      'Resumen Clínico': `/patient/${id}/note/summary`,
      'Hoja de Enfermería': `/patient/${id}/nursing-sheet`, 
      'Receta Médica': `/patient/${id}/prescription`,
      'Carta de Consentimiento Informado': `/patient/${id}/consent`,
      'Hoja de Egreso Voluntario': `/patient/${id}/voluntary-discharge`,
      'Notificación al Ministerio Público': `/patient/${id}/mp-notification`,
      'Certificado de Defunción': `/patient/${id}/death-certificate`,
      'Consentimiento Telemedicina': `/patient/${id}/telemedicine-consent`,
      'Solicitud de Estudios': `/patient/${id}/auxiliary-order`,
      'Reporte de Resultados / Interpretación': `/patient/${id}/auxiliary-report`,
      'Registro de Transfusión': `/patient/${id}/transfusion`,
      'Estudio Socioeconómico': `/patient/${id}/social-work`,
      'Expediente Estomatológico': `/patient/${id}/stomatology`,
      'Estudio Epidemiológico': `/patient/${id}/epidemiology`,
      'Reporte de ESAVI': `/patient/${id}/note/esavi`,
      'Certificado Médico': `/patient/${id}/note/medical-certificate`,
      'Carnet Perinatal / Control Prenatal': `/patient/${id}/perinatal-card`,
      'Tarjeta de Control de Enfermedades Crónicas': `/patient/${id}/chronic-card`,
      'Carnet de Salud Integral / Niño Sano': `/patient/${id}/health-control`
    };
    
    let path = '';
    if (type.startsWith('Certificado Médico')) {
        path = `/patient/${id}/note/medical-certificate`;
    } else {
        path = typeMap[type] || `/patient/${id}/note/generic/${type}`;
    }
    return noteId ? `${path}/${noteId}` : path;
  };

  const patientAllergies = patient.allergies || [];
  const patientChronic = patient.chronicDiseases || [];

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* BANNER DE BLOQUEO SI ESTÁ FINALIZADO */}
      {isAttended && (
        <div className="bg-amber-500 text-slate-900 p-5 rounded-[2rem] flex items-center justify-between shadow-2xl border-2 border-amber-400 no-print">
           <div className="flex items-center gap-5">
              <Lock size={24} />
              <div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">Expediente Archivado - Solo Lectura</p>
                 <p className="text-xs font-bold text-amber-900 mt-1 uppercase opacity-80">Atención finalizada. Inmutable para auditoría legal.</p>
              </div>
           </div>
           <button onClick={() => navigate('/')} className="p-3 bg-white/20 hover:bg-white/40 rounded-xl transition-all"><X size={20}/></button>
        </div>
      )}
      
      {/* HEADER DE PACIENTE */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden no-print group">
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
            
            {/* IZQUIERDA: AVATAR Y DATOS PRINCIPALES */}
            <div className="flex items-center gap-8">
               <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl relative group-hover:scale-105 transition-transform">
                  {patient.name.charAt(0)}
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${patient.priority.includes('Rojo') ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                      <Activity size={14} className="text-white"/>
                  </div>
               </div>
               <div>
                  <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {patient.id}</span>
                      <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{patient.age} AÑOS • {patient.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}</span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{patient.name}</h1>
               </div>
            </div>

            {/* DERECHA: BOTONES DE ACCIÓN */}
            <div className="flex items-center gap-3 flex-wrap">
               {!isAttended && (
                 <button onClick={() => setShowFinalizeModal(true)} className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm group">
                    <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform"/> FINALIZAR
                 </button>
               )}
               <button onClick={() => navigate(`/edit-patient/${patient.id}`)} className="flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group">
                  <Edit3 size={18} className="group-hover:scale-110 transition-transform"/> EDITAR FICHA
               </button>
               <button onClick={() => navigate('/')} className="p-4 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-[2rem] transition-all border border-slate-200 shadow-sm"><X size={20} /></button>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 pt-10 border-t border-slate-100 relative z-10">
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">CURP</p>
               <p className="text-sm font-bold text-slate-700 font-mono tracking-tight bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit">{patient.curp || 'NO REGISTRADO'}</p>
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">TIPO SANGUÍNEO</p>
               <p className="text-sm font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-xl w-fit border border-slate-200">{patient.bloodType || 'N/D'}</p>
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertOctagon size={12} className={patientAllergies.length > 0 ? "text-rose-500" : "text-slate-300"}/> ALERGIAS</p>
               <p className={`text-sm font-bold uppercase truncate ${patientAllergies.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {patientAllergies.length > 0 ? patientAllergies.join(', ') : 'NEGADAS'}
               </p>
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">ENFERMEDADES CRÓNICAS</p>
               <p className="text-sm font-bold text-slate-700 uppercase truncate">
                  {patientChronic.length > 0 ? patientChronic.join(', ') : 'NINGUNA'}
               </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           {renderDynamicChart(patient.vitalsHistory || null)}
           
           <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                 <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-3">
                    <ClipboardList className="text-blue-600 w-5 h-5" /> HISTORIAL DE ATENCIONES
                 </h3>
                 {!isAttended && (
                   <button onClick={() => setShowMenu(true)} className="px-8 py-3 bg-blue-600 text-white rounded-[1.5rem] font-black text-[9px] uppercase shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 tracking-widest"><FilePlus2 size={14} /> NUEVA NOTA</button>
                 )}
              </div>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                 {patientNotes.map(note => (
                    <button 
                        key={note.id} 
                        onClick={() => note.isSigned ? setSelectedNote(note) : navigate(getNoteRoute(note.type, note.id))} 
                        className="w-full text-left p-6 hover:bg-slate-50 transition-all group flex items-start justify-between"
                    >
                       <div className="flex gap-5 items-center">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${!note.isSigned ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-white border-2 border-slate-100 text-slate-400'}`}>
                              <FileText size={20} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-700 tracking-tight flex items-center gap-2">
                                 {note.type}
                                 {!note.isSigned && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[7px] font-black uppercase border border-amber-200">Borrador</span>}
                             </p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{note.date} • {note.author}</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all self-center" />
                    </button>
                 ))}
                 {patientNotes.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest text-slate-400">Sin registros previos</div>}
              </div>
           </div>
        </div>
        
        <div className="lg:col-span-4 space-y-8">
           <div className={`bg-slate-900 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px] ${isAttended ? 'opacity-80 grayscale pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center relative z-10 mb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <HeartPulse className="text-emerald-400" size={18} /> Signos Vitales
                 </h3>
                 <button onClick={() => setShowVitalsModal(true)} className="w-10 h-10 bg-white/10 hover:bg-emerald-500 rounded-2xl transition-all border border-white/5 flex items-center justify-center">
                    <Plus size={18} />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10 flex-1">
                 <div className="col-span-2 bg-white/10 p-5 rounded-[2rem] border border-white/5 backdrop-blur-sm flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-slate-400">
                             <Activity size={14}/>
                             <span className="text-[9px] font-bold uppercase tracking-widest">T.A.</span>
                        </div>
                        <p className="text-4xl font-black leading-none">{patient.currentVitals?.bp || '--/--'}</p>
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1 block">MMHG</span>
                    </div>
                    <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                        <Activity size={16} className="text-emerald-500"/>
                    </div>
                 </div>

                 {[
                   { l: 'F.C.', v: patient.currentVitals?.hr || '--', u: 'LPM', i: <HeartPulse size={12}/> },
                   { l: 'TEMP', v: patient.currentVitals?.temp || '--', u: '°C', i: <Thermometer size={12}/> },
                   { l: 'SATO2', v: patient.currentVitals?.o2 || '--', u: '%', i: <Droplet size={12}/> },
                   { l: 'PESO', v: patient.currentVitals?.weight || '--', u: 'KG', i: <Scale size={12}/> },
                   { l: 'TALLA', v: patient.currentVitals?.height || '--', u: 'CM', i: <Ruler size={12}/> },
                   { l: 'IMC', v: patient.currentVitals?.bmi || '--', u: '', i: <Activity size={12}/> }
                 ].map(item => (
                    <div key={item.l} className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 backdrop-blur-sm flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-1 text-slate-400">
                          {item.i}
                          <span className="text-[8px] font-bold uppercase tracking-widest">{item.l}</span>
                       </div>
                       <p className="text-xl font-black leading-none mt-1">
                          {item.v} <span className="text-[7px] text-slate-500 font-bold uppercase align-top">{item.u}</span>
                       </p>
                    </div>
                 ))}
              </div>
              
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>
              <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
           </div>
        </div>
      </div>

      {/* MODAL NUEVA NOTA (MENU) - UNIFICADO Y ESTILIZADO */}
      {showMenu && !isAttended && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
            <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Orden de Intervención</h4>
              <button onClick={() => setShowMenu(false)} className="p-3 hover:bg-rose-50 rounded-2xl transition-all"><X size={32} className="text-slate-400" /></button>
            </div>
            
            {/* SEARCH BAR */}
            <div className="px-10 pb-6 bg-slate-50 border-b border-slate-200">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="BUSCAR TIPO DE NOTA O DOCUMENTO..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                    value={menuSearchTerm}
                    onChange={(e) => setMenuSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-3 gap-10 bg-white">
                {NOTE_CATEGORIES.map(cat => {
                  const filteredNotes = cat.notes.filter(note => 
                      note.toLowerCase().includes(menuSearchTerm.toLowerCase())
                  );
                  
                  if (filteredNotes.length === 0) return null;

                  return (
                    <div key={cat.title} className="space-y-6">
                      <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.25em] border-b-2 border-blue-50 pb-2">{cat.title}</h5>
                      <div className="grid grid-cols-1 gap-4">
                        {filteredNotes.map(note => {
                          return (
                            <button 
                              key={note} 
                              onClick={() => {
                                   navigate(getNoteRoute(note));
                                   setShowMenu(false);
                              }} 
                              className="w-full text-left p-5 rounded-2xl text-xs font-black uppercase transition-all shadow-sm border border-slate-200 bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg flex items-center justify-between group"
                            >
                              <span>{note}</span>
                              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      
      {showVitalsModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Actualizar Signos</h3>
                 <button onClick={() => setShowVitalsModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tensión Arterial</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="120/80" value={vitalsForm.bp || ''} onChange={e => setVitalsForm({...vitalsForm, bp: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Frecuencia Cardiaca</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="70" value={vitalsForm.hr || ''} onChange={e => setVitalsForm({...vitalsForm, hr: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Frecuencia Resp.</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="16" value={vitalsForm.rr || ''} onChange={e => setVitalsForm({...vitalsForm, rr: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Temperatura (°C)</label>
                      <input type="number" step="0.1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="36.5" value={vitalsForm.temp || ''} onChange={e => setVitalsForm({...vitalsForm, temp: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Saturación O2 (%)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="98" value={vitalsForm.o2 || ''} onChange={e => setVitalsForm({...vitalsForm, o2: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Peso (kg)</label>
                      <input type="number" step="0.1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="70" value={vitalsForm.weight || ''} onChange={e => setVitalsForm({...vitalsForm, weight: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Talla (cm)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="170" value={vitalsForm.height || ''} onChange={e => setVitalsForm({...vitalsForm, height: parseInt(e.target.value) || 0})} />
                  </div>
              </div>

              <button onClick={handleUpdateVitals} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all">
                  Guardar Medición
              </button>
           </div>
        </div>
      )}

      {showFinalizeModal && (
          <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Finalizar Atención</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos para Hoja Diaria / SUIVE</p>
                      </div>
                      <button onClick={() => setShowFinalizeModal(false)} className="p-3 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico de Egreso (CIE-10) <span className="text-rose-500">*</span></label>
                          <textarea 
                              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-blue-500 h-24 resize-none" 
                              placeholder="Ej: J00 Faringoamigdalitis Aguda"
                              value={finalizeData.diagnosis}
                              onChange={e => setFinalizeData({...finalizeData, diagnosis: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de Consulta</label>
                              <div className="flex gap-2">
                                  <button onClick={() => setFinalizeData({...finalizeData, consultationType: '1a Vez'})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${finalizeData.consultationType === '1a Vez' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>1a Vez</button>
                                  <button onClick={() => setFinalizeData({...finalizeData, consultationType: 'Subsecuente'})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${finalizeData.consultationType === 'Subsecuente' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>Subsecuente</button>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Programa / Servicio</label>
                              <select 
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none"
                                  value={finalizeData.program}
                                  onChange={e => setFinalizeData({...finalizeData, program: e.target.value, specifics: {}})}
                              >
                                  <option>Consulta Externa</option>
                                  <option>Urgencias</option>
                                  <option>Planificación Familiar</option>
                                  <option>Control Prenatal</option>
                                  <option>Control Niño Sano</option>
                                  <option>Crónico-Degenerativas</option>
                                  <option>Salud Mental</option>
                                  <option>Detección Cáncer</option>
                                  <option>Dental / Estomatología</option>
                              </select>
                           </div>
                      </div>

                      {renderProgramSpecificFields()}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Datos Sociodemográficos</label>
                              <div 
                                  onClick={() => setFinalizeData({...finalizeData, isIndigenous: !finalizeData.isIndigenous})}
                                  className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${finalizeData.isIndigenous ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-2">
                                      <Globe size={16}/> <span className="text-[10px] font-black uppercase">Indígena / Lengua</span>
                                  </div>
                                  {finalizeData.isIndigenous && <CheckCircle2 size={16}/>}
                              </div>
                              <div 
                                  onClick={() => setFinalizeData({...finalizeData, isDisability: !finalizeData.isDisability})}
                                  className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${finalizeData.isDisability ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-2">
                                      <Accessibility size={16}/> <span className="text-[10px] font-black uppercase">Discapacidad</span>
                                  </div>
                                  {finalizeData.isDisability && <CheckCircle2 size={16}/>}
                              </div>
                               <div 
                                  onClick={() => setFinalizeData({...finalizeData, isMigrant: !finalizeData.isMigrant})}
                                  className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${finalizeData.isMigrant ? 'bg-teal-50 border-teal-400 text-teal-900' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-2">
                                      <Globe size={16}/> <span className="text-[10px] font-black uppercase">Migrante</span>
                                  </div>
                                  {finalizeData.isMigrant && <CheckCircle2 size={16}/>}
                              </div>
                           </div>
                           
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Referencia y Notas</label>
                              <select 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none mb-2"
                                value={finalizeData.referral}
                                onChange={e => setFinalizeData({...finalizeData, referral: e.target.value})}
                              >
                                  <option value="Ninguna">Ninguna (Alta)</option>
                                  <option value="Enviado a 2o Nivel">Enviado a 2o Nivel</option>
                                  <option value="Enviado a 3er Nivel">Enviado a 3er Nivel</option>
                                  <option value="Contrarreferencia">Contrarreferencia (Recibido)</option>
                                  <option value="Defunción">Defunción</option>
                              </select>
                              <textarea 
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium uppercase outline-none h-20 resize-none"
                                  placeholder="Notas adicionales..."
                                  value={finalizeData.notes}
                                  onChange={e => setFinalizeData({...finalizeData, notes: e.target.value})}
                              />
                           </div>
                      </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-4">
                      <button onClick={() => setShowFinalizeModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                      <button 
                          onClick={handleConfirmFinalize}
                          className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                          <LogOut size={16} /> Confirmar Cierre
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white/20">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedNote.type}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Folio: {selectedNote.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all"><Printer size={18} /> Imprimir</button>
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-rose-50 transition-all"><X size={24}/></button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-20 bg-white">
                 <div className="max-w-4xl mx-auto space-y-12 text-slate-900 print:text-black">
                    {/* Re-render note content structured for printing */}
                    <div className="flex justify-between border-b-4 border-slate-900 pb-10">
                       <div className="space-y-4">
                          <h1 className="text-3xl font-black text-slate-900 uppercase leading-none">{doctorInfo.hospital}</h1>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Expediente Clínico Electrónico Certificado</p>
                       </div>
                       <div className="text-right"><QrCode size={80} className="text-slate-900 inline-block mb-2" /><p className="text-xs font-black text-rose-600 uppercase tracking-tighter">FOLIO: {selectedNote.id}</p></div>
                    </div>
                    <div className="space-y-10">
                       {Object.entries(selectedNote.content).map(([key, val]) => {
                         if (key === 'vitals') return null;
                         return (
                           <div key={key} className="space-y-2">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">{key}</h4>
                             <div className="text-sm font-medium text-slate-800 italic uppercase leading-relaxed print:text-black">
                                {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                             </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;