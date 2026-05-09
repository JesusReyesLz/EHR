
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Activity, FileText, ChevronRight, HeartPulse, Plus, X, 
  Search, Printer, Lock, CheckCircle2, Edit3, AlertOctagon, 
  Thermometer, Droplet, Scale, Ruler, FilePlus2, ClipboardList,
  LogOut, Globe, Accessibility, QrCode, Upload, Paperclip, FileImage, 
  FileBox, Download, Save, DollarSign
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Patient, ClinicalNote, DoctorInfo, PatientStatus, Vitals } from '../types';
import { NOTE_CATEGORIES, CIE10_CODES } from '../constants';
import { OccupationalAdmissionView } from './notes/OccupationalAdmissionView';
import { MedicalCertificateView } from './notes/MedicalCertificateView';
import PDFViewer from '../src/components/PDFViewer';

interface PatientProfileProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onUpdatePatient: (p: Patient) => void;
  onSaveNote: (n: ClinicalNote) => void;
  doctorInfo: DoctorInfo;
}

// COPIA LOCAL DE LA CONFIGURACIÓN DE CAMPOS SUIVE (Misma que Telemedicine)
const PROGRAM_SPECIFICS: Record<string, { label: string; type: 'select' | 'text' | 'number'; options?: string[] }[]> = {
    'Planificación Familiar': [
        { label: 'Método Elegido', type: 'select', options: ['Oral', 'Inyectable Mensual', 'Inyectable Bimensual', 'Implante Subdérmico', 'DIU T Cobre', 'DIU Medicado', 'Parche', 'Preservativo', 'OTB', 'Vasectomía', 'Ninguno'] },
        { label: 'Tipo Usuario', type: 'select', options: ['Activo', 'Nuevo Aceptante', 'Reingreso', 'Cambio de Método'] },
        { label: 'Insumos Entregados', type: 'number' }
    ],
    'Control Prenatal': [
        { label: 'Trimestre', type: 'select', options: ['1ero', '2do', '3ero'] },
        { label: 'Riesgo Obstétrico', type: 'select', options: ['Bajo', 'Alto'] },
        { label: 'Enfoque', type: 'select', options: ['Primera Vez', 'Subsecuente', 'Puerperio'] }
    ],
    'Control Niño Sano': [
        { label: 'Estado Nutricional', type: 'select', options: ['Normal', 'Desnutrición Leve', 'Desnutrición Mod/Sev', 'Sobrepeso', 'Obesidad'] },
        { label: 'Desarrollo', type: 'select', options: ['Normal', 'Rezago', 'Retardo'] },
        { label: 'Tamiz Realizado', type: 'select', options: ['Ninguno', 'Metabólico', 'Auditivo', 'Visual', 'Cardiaco'] }
    ],
    'Crónico-Degenerativas': [
        { label: 'Patología', type: 'select', options: ['Diabetes', 'Hipertensión', 'Obesidad', 'Dislipidemia', 'Síndrome Metabólico'] },
        { label: 'Estatus Control', type: 'select', options: ['Controlado', 'No Controlado'] },
        { label: 'Complicaciones', type: 'select', options: ['Sin Complicaciones', 'Renales', 'Visuales', 'Neuropatía', 'Cardiovasculares'] }
    ],
    'Salud Mental': [
        { label: 'Trastorno Principal', type: 'select', options: ['Depresión', 'Ansiedad', 'Adicciones', 'Violencia', 'Esquizofrenia', 'Otro'] },
        { label: 'Intervención', type: 'select', options: ['Psicoterapia', 'Farmacológico', 'Mixto', 'Referencia'] }
    ],
    'Detección Cáncer': [
        { label: 'Tipo Detección', type: 'select', options: ['Cérvico-Uterino (PCR/Pap)', 'Mama (Exploración)', 'Mama (Mastografía)', 'Próstata (Ag/Tacto)'] },
        { label: 'Resultado (Si aplica)', type: 'select', options: ['Pendiente', 'Negativo', 'Anormal/Positivo'] }
    ]
};

const PatientProfile: React.FC<PatientProfileProps> = ({ patients, notes, onUpdatePatient, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [showMenu, setShowMenu] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [showPdfView, setShowPdfView] = useState(false);
  
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<Partial<Vitals>>({});

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeData, setFinalizeData] = useState({
      diagnosisType: 'CIE-10' as 'CIE-10' | 'Epónimo',
      diagnosis: '',
      cieCode: '',
      consultationType: 'Subsecuente',
      program: 'Consulta Externa',
      specifics: {} as Record<string, any>,
      isIndigenous: false,
      isDisability: false,
      isMigrant: false,
      referral: 'Ninguna',
      notes: ''
  });

  // --- UPLOAD DOCUMENT STATES ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
      title: '',
      category: 'Resultados de Laboratorio',
      fileUrl: '',
      fileType: '', // 'image/png', 'application/pdf', etc.
      fileName: ''
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
     
     const finalDischargeData = {
         diagnosticos: [{ name: finalizeData.diagnosis, status: 'Confirmado' }],
         program: finalizeData.program,
         programDetails: {
             consultationType: finalizeData.consultationType as '1a Vez' | 'Subsecuente',
             isIndigenous: finalizeData.isIndigenous,
             isDisability: finalizeData.isDisability,
             isMigrant: finalizeData.isMigrant,
             referral: finalizeData.referral,
             specifics: finalizeData.specifics
         },
         notes: finalizeData.notes,
         medico: doctorInfo.name,
         timestamp: new Date().toISOString()
     };

     // 1. Create Discharge Note/Record (SUIVE compatible)
     const dischargeNote: ClinicalNote = {
         id: `SUIVE-${Date.now()}`,
         patientId: patient.id,
         type: 'Cierre de Consulta (SUIVE)',
         date: new Date().toLocaleString('es-MX'),
         author: doctorInfo.name,
         content: finalDischargeData,
         isSigned: true,
         hash: `SUIVE-${Math.random().toString(36).substr(2,8)}`
     };
     onSaveNote(dischargeNote);

     // 2. Update Patient Status
     onUpdatePatient({
         ...patient,
         status: PatientStatus.ATTENDED,
         bedNumber: undefined,
         transitTargetModule: undefined,
         history: {
             ...patient.history,
             dischargeData: finalDischargeData
         }
     });

     setShowFinalizeModal(false);
     navigate('/');
  };

  // --- DOCUMENT UPLOAD HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) return alert("El archivo es demasiado grande (Máx 5MB).");
          
          const reader = new FileReader();
          reader.onload = (ev) => {
              setUploadForm(prev => ({
                  ...prev,
                  fileUrl: ev.target?.result as string,
                  fileType: file.type,
                  fileName: file.name
              }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveDocument = () => {
      if (!uploadForm.title || !uploadForm.fileUrl) return alert("Debe seleccionar un archivo y asignar un título.");

      const newDocNote: ClinicalNote = {
          id: `DOC-${Date.now()}`,
          patientId: patient.id,
          type: uploadForm.category, // Usamos la categoría como el 'type' principal para visualización
          date: new Date().toLocaleString('es-MX'),
          author: `${doctorInfo.name} (Carga Manual)`,
          content: {
              ...uploadForm,
              isAttachment: true, // Flag para identificar que es un adjunto
              notes: `Documento cargado externamente: ${uploadForm.fileName}`
          },
          isSigned: true, // Se asume validado al subir
          hash: `EXT-DOC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      };

      onSaveNote(newDocNote);
      setShowUploadModal(false);
      setUploadForm({ title: '', category: 'Resultados de Laboratorio', fileUrl: '', fileType: '', fileName: '' });
  };

  // ... (Existing handlers and renders remain same) ...
  const handleSpecificChange = (key: string, value: any) => {
      setFinalizeData(prev => ({
          ...prev,
          specifics: { ...prev.specifics, [key]: value }
      }));
  };

  const renderProgramSpecificFields = () => {
     const fields = PROGRAM_SPECIFICS[finalizeData.program];
     if (!fields) return null;

     return (
         <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
             <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest border-b border-blue-200 pb-2 mb-2 flex items-center gap-2">
                 <ClipboardList size={12}/> Detalles del Programa: {finalizeData.program}
             </h4>
             <div className="grid grid-cols-2 gap-4">
                 {fields.map((field) => (
                     <div key={field.label} className="space-y-1">
                         <label className="text-[9px] font-black text-slate-500 uppercase">{field.label}</label>
                         {field.type === 'select' ? (
                             <select 
                                 className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none"
                                 onChange={(e) => handleSpecificChange(field.label, e.target.value)}
                             >
                                 <option value="">Seleccione...</option>
                                 {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                         ) : (
                             <input 
                                 type={field.type}
                                 className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none"
                                 onChange={(e) => handleSpecificChange(field.label, e.target.value)}
                             />
                         )}
                     </div>
                 ))}
             </div>
         </div>
     );
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
      'Nota de Ingreso a Hospitalización': `/patient/${id}/note/admission`, // Already mapped
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
      'Carnet de Salud Integral': `/patient/${id}/health-control`
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

  // Helper para mostrar edad detallada
  const getDisplayAge = () => {
    if (patient.age >= 2 || !patient.birthDate) {
        return `${patient.age} ${patient.ageUnit ? patient.ageUnit.toUpperCase() : 'AÑOS'}`;
    }
    
    const [year, month, day] = patient.birthDate.split('-').map(Number);
    const birth = new Date(year, month - 1, day);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    
    if (days < 0) {
        months--;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonthDate.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    
    if (years > 0) return `${years} AÑOS ${months} MESES`;
    if (months > 0) return `${months} MESES ${days} DÍAS`;
    return `${days} DÍAS`;
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* BANNER DE BLOQUEO SI ESTÁ FINALIZADO */}
      {isAttended && (
        <div className="bg-amber-500 text-slate-900 p-5 rounded-[2rem] flex items-center justify-between shadow-2xl border-2 border-amber-400 no-print" role="alert">
           <div className="flex items-center gap-5">
              <Lock size={24} aria-hidden="true" />
              <div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">Expediente Archivado - Solo Lectura</p>
                 <p className="text-xs font-bold text-amber-900 mt-1 uppercase opacity-80">Atención finalizada. Inmutable para auditoría legal.</p>
              </div>
           </div>
           <button onClick={() => navigate('/')} className="p-3 bg-white/20 hover:bg-white/40 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-900" aria-label="Cerrar advertencia y volver al inicio"><X size={20} aria-hidden="true"/></button>
        </div>
      )}
      
      {/* HEADER DE PACIENTE */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden no-print group">
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
            
            {/* IZQUIERDA: AVATAR Y DATOS PRINCIPALES */}
            <div className="flex items-center gap-8">
               <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl relative group-hover:scale-105 transition-transform" aria-hidden="true">
                  {patient.name.charAt(0)}
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${patient.priority.includes('Rojo') ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                      <Activity size={14} className="text-white" aria-hidden="true"/>
                  </div>
               </div>
               <div>
                  <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {patient.id}</span>
                      <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{getDisplayAge()} • {patient.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}</span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{patient.name}</h1>
               </div>
            </div>

            {/* DERECHA: BOTONES DE ACCIÓN */}
            <div className="flex items-center gap-3 flex-wrap">
               <button onClick={() => navigate('/billing', { state: { patientId: patient.id } })} className="flex items-center gap-3 px-8 py-4 bg-amber-50 text-amber-600 border border-amber-100 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
                  <DollarSign size={18} className="group-hover:scale-110 transition-transform" aria-hidden="true"/> CAJA / COBRAR
               </button>
               {!isAttended && (
                 <button onClick={() => setShowFinalizeModal(true)} className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                    <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" aria-hidden="true"/> FINALIZAR
                 </button>
               )}
               <button onClick={() => navigate(`/edit-patient/${patient.id}`)} className="flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <Edit3 size={18} className="group-hover:scale-110 transition-transform" aria-hidden="true"/> EDITAR FICHA
               </button>
               <button onClick={() => navigate('/')} className="p-4 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-[2rem] transition-all border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cerrar perfil de paciente"><X size={20} aria-hidden="true" /></button>
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
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertOctagon size={12} className={patientAllergies.length > 0 ? "text-rose-500" : "text-slate-300"} aria-hidden="true"/> ALERGIAS</p>
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
      
      {/* ... Rest of component ... */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                 <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-3">
                    <ClipboardList className="text-blue-600 w-5 h-5" aria-hidden="true" /> HISTORIAL DE ATENCIONES
                 </h3>
                 {!isAttended && (
                   <div className="flex gap-2">
                       {/* BOTÓN SUBIR DOCUMENTO */}
                       <button onClick={() => setShowUploadModal(true)} className="px-6 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-[1.5rem] font-black text-[9px] uppercase hover:bg-slate-200 transition-all flex items-center gap-2 tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                           <Upload size={14} aria-hidden="true"/> Subir Documento
                       </button>
                       <button onClick={() => setShowMenu(true)} className="px-8 py-3 bg-blue-600 text-white rounded-[1.5rem] font-black text-[9px] uppercase shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                           <FilePlus2 size={14} aria-hidden="true" /> NUEVA NOTA
                       </button>
                   </div>
                 )}
              </div>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar" role="list" aria-label="Lista de notas y documentos">
                 {patientNotes.map(note => {
                    const isAttachment = note.content?.isAttachment;
                    
                    return (
                        <button 
                            key={note.id} 
                            onClick={() => {
                                if (isAttachment) {
                                    setSelectedNote(note);
                                } else {
                                    navigate(getNoteRoute(note.type, note.id));
                                }
                            }} 
                            className="w-full text-left p-6 hover:bg-slate-50 transition-all group flex items-start justify-between focus:outline-none focus:bg-slate-100 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            role="listitem"
                            aria-label={`Ver ${note.content?.title || note.type} del ${note.date} por ${note.author}`}
                        >
                        <div className="flex gap-5 items-center">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAttachment ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : (!note.isSigned ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-white border-2 border-slate-100 text-slate-400')}`} aria-hidden="true">
                                {isAttachment ? <Paperclip size={20} /> : <FileText size={20} />}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-700 tracking-tight flex items-center gap-2">
                                    {note.content?.title || note.type}
                                    {!note.isSigned && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[7px] font-black uppercase border border-amber-200" aria-label="Borrador">Borrador</span>}
                                    {isAttachment && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[7px] font-black uppercase border border-indigo-200" aria-label="Documento adjunto">Adjunto</span>}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{note.date} • {note.author}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all self-center" aria-hidden="true" />
                        </button>
                    );
                 })}
                 {patientNotes.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest text-slate-400">Sin registros previos</div>}
              </div>
           </div>
        </div>
        
        <div className="lg:col-span-4 space-y-8">
           <div className={`bg-slate-900 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px] ${isAttended ? 'opacity-80 grayscale pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center relative z-10 mb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <HeartPulse className="text-emerald-400" size={18} aria-hidden="true" /> Signos Vitales
                 </h3>
                 <button onClick={() => setShowVitalsModal(true)} className="w-10 h-10 bg-white/10 hover:bg-emerald-500 rounded-2xl transition-all border border-white/5 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900" aria-label="Actualizar signos vitales">
                    <Plus size={18} aria-hidden="true" />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10 flex-1">
                 <div className="col-span-2 bg-white/10 p-5 rounded-[2rem] border border-white/5 backdrop-blur-sm flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-slate-400">
                             <Activity size={14} aria-hidden="true"/>
                             <span className="text-[9px] font-bold uppercase tracking-widest">T.A.</span>
                        </div>
                        <p className="text-4xl font-black leading-none" aria-label={`Tensión arterial: ${patient.currentVitals?.bp || 'No registrada'}`}>{patient.currentVitals?.bp || '--/--'}</p>
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1 block" aria-hidden="true">MMHG</span>
                    </div>
                    <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center" aria-hidden="true">
                        <Activity size={16} className="text-emerald-500"/>
                    </div>
                 </div>

                 {[
                   { l: 'F.C.', v: patient.currentVitals?.hr || '--', u: 'LPM', i: <HeartPulse size={12} aria-hidden="true"/>, label: 'Frecuencia cardíaca' },
                   { l: 'TEMP', v: patient.currentVitals?.temp || '--', u: '°C', i: <Thermometer size={12} aria-hidden="true"/>, label: 'Temperatura' },
                   { l: 'SATO2', v: patient.currentVitals?.o2 || '--', u: '%', i: <Droplet size={12} aria-hidden="true"/>, label: 'Saturación de oxígeno' },
                   { l: 'PESO', v: patient.currentVitals?.weight || '--', u: 'KG', i: <Scale size={12} aria-hidden="true"/>, label: 'Peso' },
                   { l: 'TALLA', v: patient.currentVitals?.height || '--', u: 'CM', i: <Ruler size={12} aria-hidden="true"/>, label: 'Talla' },
                   { l: 'IMC', v: patient.currentVitals?.bmi || '--', u: '', i: <Activity size={12} aria-hidden="true"/>, label: 'Índice de masa corporal' }
                 ].map(item => (
                    <div key={item.l} className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 backdrop-blur-sm flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-1 text-slate-400" aria-hidden="true">
                          {item.i}
                          <span className="text-[8px] font-bold uppercase tracking-widest">{item.l}</span>
                       </div>
                       <p className="text-xl font-black leading-none mt-1" aria-label={`${item.label}: ${item.v} ${item.u}`}>
                          {item.v} <span className="text-[7px] text-slate-500 font-bold uppercase align-top" aria-hidden="true">{item.u}</span>
                       </p>
                    </div>
                 ))}
              </div>
              
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>
              <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
           </div>
        </div>
      </div>
      {/* ... Modals (New Note, Vitals, Finalize, Upload, View Note) ... */}
      {showMenu && !isAttended && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-xl animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="new-note-title">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
            <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 id="new-note-title" className="text-2xl font-black uppercase tracking-tighter text-slate-900">Orden de Intervención</h4>
              <button onClick={() => setShowMenu(false)} className="p-3 hover:bg-rose-50 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cerrar menú"><X size={32} className="text-slate-400" aria-hidden="true" /></button>
            </div>
            
            {/* SEARCH BAR */}
            <div className="px-10 pb-6 bg-slate-50 border-b border-slate-200">
               <div className="relative">
                  <label htmlFor="menu-search" className="sr-only">Buscar tipo de nota o documento</label>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
                  <input 
                    id="menu-search"
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
                      <div className="grid grid-cols-1 gap-4" role="list" aria-label={`Notas de ${cat.title}`}>
                        {filteredNotes.map(note => {
                          return (
                            <button 
                              key={note} 
                              onClick={() => {
                                   navigate(getNoteRoute(note));
                                   setShowMenu(false);
                              }} 
                              className="w-full text-left p-5 rounded-2xl text-xs font-black uppercase transition-all shadow-sm border border-slate-200 bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-blue-500"
                              role="listitem"
                            >
                              <span>{note}</span>
                              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
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

      {/* MODAL UPLOAD DOCUMENT */}
      {showUploadModal && (
          <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="upload-doc-title">
              <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl space-y-8">
                  <div className="flex justify-between items-center">
                      <h3 id="upload-doc-title" className="text-2xl font-black text-slate-900 uppercase tracking-tight">Adjuntar Documento</h3>
                      <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cerrar modal de subida"><X size={24} aria-hidden="true"/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label htmlFor="upload-title" className="text-[9px] font-black text-slate-400 uppercase ml-2">Título del Documento</label>
                          <input 
                            id="upload-title"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Ej: Análisis de Sangre Chopo, Rx Tórax..."
                            value={uploadForm.title}
                            onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                            autoFocus
                          />
                      </div>
                      
                      <div className="space-y-2">
                          <label htmlFor="upload-category" className="text-[9px] font-black text-slate-400 uppercase ml-2">Categoría / Tipo</label>
                          <select 
                             id="upload-category"
                             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none uppercase focus:ring-2 focus:ring-blue-500"
                             value={uploadForm.category}
                             onChange={e => setUploadForm({...uploadForm, category: e.target.value})}
                          >
                             <option>Resultados de Laboratorio</option>
                             <option>Imagenología (Rx/TAC/USG)</option>
                             <option>Receta Externa</option>
                             <option>Resumen Clínico Externo</option>
                             <option>Documento Legal</option>
                             <option>Otro</option>
                          </select>
                      </div>

                      <button 
                         onClick={() => fileInputRef.current?.click()}
                         className={`w-full h-40 border-2 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${uploadForm.fileUrl ? 'bg-emerald-50 border-emerald-300' : ''}`}
                         aria-label="Seleccionar archivo para adjuntar"
                      >
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*,.pdf" 
                            onChange={handleFileSelect} 
                            aria-hidden="true"
                            tabIndex={-1}
                         />
                         {uploadForm.fileUrl ? (
                             <div className="text-center space-y-2">
                                 <CheckCircle2 size={32} className="text-emerald-600 mx-auto" aria-hidden="true"/>
                                 <p className="text-[10px] font-black uppercase text-emerald-700 max-w-[200px] truncate">{uploadForm.fileName}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase">Click para cambiar</p>
                             </div>
                         ) : (
                             <div className="text-center space-y-2 text-slate-400">
                                 <Upload size={32} className="mx-auto" aria-hidden="true"/>
                                 <p className="text-[10px] font-black uppercase">Click para seleccionar archivo</p>
                                 <p className="text-[8px]">PDF o Imágenes (Máx 5MB)</p>
                             </div>
                         )}
                      </button>
                  </div>

                  <button 
                    onClick={handleSaveDocument}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                      <Save size={16} aria-hidden="true"/> Guardar en Historial
                  </button>
              </div>
          </div>
      )}
      
      {/* MODAL SIGNOS VITALES */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="vitals-title">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                 <h3 id="vitals-title" className="text-2xl font-black text-slate-900 uppercase tracking-tight">Actualizar Signos</h3>
                 <button onClick={() => setShowVitalsModal(false)} className="p-2 hover:bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cerrar modal de signos vitales"><X size={24} aria-hidden="true"/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label htmlFor="vitals-bp" className="text-[9px] font-black text-slate-400 uppercase ml-2">Tensión Arterial</label>
                      <input id="vitals-bp" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="120/80" value={vitalsForm.bp || ''} onChange={e => setVitalsForm({...vitalsForm, bp: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                      <label htmlFor="vitals-hr" className="text-[9px] font-black text-slate-400 uppercase ml-2">Frecuencia Cardiaca</label>
                      <input id="vitals-hr" type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="70" value={vitalsForm.hr || ''} onChange={e => setVitalsForm({...vitalsForm, hr: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label htmlFor="vitals-rr" className="text-[9px] font-black text-slate-400 uppercase ml-2">Frecuencia Resp.</label>
                      <input id="vitals-rr" type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16" value={vitalsForm.rr || ''} onChange={e => setVitalsForm({...vitalsForm, rr: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label htmlFor="vitals-temp" className="text-[9px] font-black text-slate-400 uppercase ml-2">Temperatura (°C)</label>
                      <input id="vitals-temp" type="number" step="0.1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="36.5" value={vitalsForm.temp || ''} onChange={e => setVitalsForm({...vitalsForm, temp: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label htmlFor="vitals-o2" className="text-[9px] font-black text-slate-400 uppercase ml-2">Saturación O2 (%)</label>
                      <input id="vitals-o2" type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="98" value={vitalsForm.o2 || ''} onChange={e => setVitalsForm({...vitalsForm, o2: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label htmlFor="vitals-weight" className="text-[9px] font-black text-slate-400 uppercase ml-2">Peso (kg)</label>
                      <input id="vitals-weight" type="number" step="0.1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="70" value={vitalsForm.weight || ''} onChange={e => setVitalsForm({...vitalsForm, weight: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                      <label htmlFor="vitals-height" className="text-[9px] font-black text-slate-400 uppercase ml-2">Talla (cm)</label>
                      <input id="vitals-height" type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="170" value={vitalsForm.height || ''} onChange={e => setVitalsForm({...vitalsForm, height: parseInt(e.target.value) || 0})} />
                  </div>
              </div>

              <button onClick={handleUpdateVitals} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                  Guardar Medición
              </button>
           </div>
        </div>
      )}

      {showFinalizeModal && (
          <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="finalize-title">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                          <h3 id="finalize-title" className="text-2xl font-black text-slate-900 uppercase tracking-tight">Finalizar Atención</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos para Hoja Diaria / SUIVE</p>
                      </div>
                      <button onClick={() => setShowFinalizeModal(false)} className="p-3 hover:bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cerrar modal de finalización"><X size={24} aria-hidden="true"/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2" id="diagnosis-type-label">Diagnóstico de Egreso <span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Requerido</span></label>
                              <div className="flex bg-slate-100 rounded-lg p-1" role="radiogroup" aria-labelledby="diagnosis-type-label">
                                  <button 
                                      role="radio"
                                      aria-checked={finalizeData.diagnosisType === 'CIE-10'}
                                      onClick={() => setFinalizeData({...finalizeData, diagnosisType: 'CIE-10'})}
                                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${finalizeData.diagnosisType === 'CIE-10' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                      CIE-10
                                  </button>
                                  <button 
                                      role="radio"
                                      aria-checked={finalizeData.diagnosisType === 'Epónimo'}
                                      onClick={() => setFinalizeData({...finalizeData, diagnosisType: 'Epónimo'})}
                                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${finalizeData.diagnosisType === 'Epónimo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                      Epónimo (Libre)
                                  </button>
                              </div>
                          </div>
                          
                          {finalizeData.diagnosisType === 'CIE-10' ? (
                              <div className="space-y-2">
                                  <label htmlFor="cie-code-select" className="sr-only">Seleccione un diagnóstico CIE-10</label>
                                  <select 
                                      id="cie-code-select"
                                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                      value={finalizeData.cieCode}
                                      onChange={e => {
                                          const code = e.target.value;
                                          const selected = CIE10_CODES.find(c => c.code === code);
                                          setFinalizeData({
                                              ...finalizeData, 
                                              cieCode: code, 
                                              diagnosis: selected ? `${selected.code} - ${selected.name}` : ''
                                          });
                                      }}
                                  >
                                      <option value="">Seleccione un diagnóstico CIE-10...</option>
                                      {CIE10_CODES.map(c => (
                                          <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                      ))}
                                  </select>
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  <label htmlFor="free-diagnosis" className="sr-only">Escriba el diagnóstico libremente</label>
                                  <textarea 
                                      id="free-diagnosis"
                                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 h-24 resize-none" 
                                      placeholder="Escriba el diagnóstico libremente..."
                                      value={finalizeData.diagnosis}
                                      onChange={e => setFinalizeData({...finalizeData, diagnosis: e.target.value, cieCode: ''})}
                                  />
                              </div>
                          )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2" id="consultation-type-label">Tipo de Consulta</label>
                              <div className="flex gap-2" role="radiogroup" aria-labelledby="consultation-type-label">
                                  <button role="radio" aria-checked={finalizeData.consultationType === '1a Vez'} onClick={() => setFinalizeData({...finalizeData, consultationType: '1a Vez'})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${finalizeData.consultationType === '1a Vez' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>1a Vez</button>
                                  <button role="radio" aria-checked={finalizeData.consultationType === 'Subsecuente'} onClick={() => setFinalizeData({...finalizeData, consultationType: 'Subsecuente'})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${finalizeData.consultationType === 'Subsecuente' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>Subsecuente</button>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label htmlFor="program-select" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Programa / Servicio</label>
                              <select 
                                  id="program-select"
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500"
                                  value={finalizeData.program}
                                  onChange={e => setFinalizeData({...finalizeData, program: e.target.value, specifics: {}})}
                              >
                                  <option value="Consulta General">Consulta General</option>
                                  <option value="Urgencias">Urgencias</option>
                                  <option value="Hospitalización">Hospitalización</option>
                                  <option value="Laboratorio">Laboratorio</option>
                                  <option value="Imagenología">Imagenología</option>
                                  <option value="Odontología">Odontología</option>
                                  <option value="Psicología">Psicología</option>
                                  <option value="Nutrición">Nutrición</option>
                                  <option value="Planificación Familiar">Planificación Familiar</option>
                                  <option value="Control Prenatal">Control Prenatal</option>
                                  <option value="Control Niño Sano">Control Niño Sano</option>
                                  <option value="Crónico-Degenerativas">Crónico-Degenerativas</option>
                                  <option value="Salud Mental">Salud Mental</option>
                                  <option value="Detección Cáncer">Detección Cáncer</option>
                                  <option value="Telemedicina">Telemedicina</option>
                              </select>
                           </div>
                      </div>

                      {renderProgramSpecificFields()}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4" role="group" aria-label="Datos Sociodemográficos">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Datos Sociodemográficos</label>
                              <button 
                                  aria-pressed={finalizeData.isIndigenous}
                                  onClick={() => setFinalizeData({...finalizeData, isIndigenous: !finalizeData.isIndigenous})}
                                  className={`w-full p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${finalizeData.isIndigenous ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-2">
                                      <Globe size={16} aria-hidden="true"/> <span className="text-[10px] font-black uppercase">Indígena / Lengua</span>
                                  </div>
                                  {finalizeData.isIndigenous && <CheckCircle2 size={16} aria-hidden="true"/>}
                              </button>
                              <button 
                                  aria-pressed={finalizeData.isDisability}
                                  onClick={() => setFinalizeData({...finalizeData, isDisability: !finalizeData.isDisability})}
                                  className={`w-full p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${finalizeData.isDisability ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-2">
                                      <Accessibility size={16} aria-hidden="true"/> <span className="text-[10px] font-black uppercase">Discapacidad</span>
                                  </div>
                                  {finalizeData.isDisability && <CheckCircle2 size={16} aria-hidden="true"/>}
                              </button>
                               <button 
                                  aria-pressed={finalizeData.isMigrant}
                                  onClick={() => setFinalizeData({...finalizeData, isMigrant: !finalizeData.isMigrant})}
                                  className={`w-full p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${finalizeData.isMigrant ? 'bg-teal-50 border-teal-400 text-teal-900' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-2">
                                      <Globe size={16} aria-hidden="true"/> <span className="text-[10px] font-black uppercase">Migrante</span>
                                  </div>
                                  {finalizeData.isMigrant && <CheckCircle2 size={16} aria-hidden="true"/>}
                              </button>
                           </div>
                           
                           <div className="space-y-2">
                              <label htmlFor="referral-select" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Referencia y Notas</label>
                              <select 
                                id="referral-select"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none mb-2 focus:ring-2 focus:ring-blue-500"
                                value={finalizeData.referral}
                                onChange={e => setFinalizeData({...finalizeData, referral: e.target.value})}
                              >
                                  <option value="Ninguna">Ninguna (Alta)</option>
                                  <option value="Enviado a 2o Nivel">Enviado a 2o Nivel</option>
                                  <option value="Enviado a 3er Nivel">Enviado a 3er Nivel</option>
                                  <option value="Contrarreferencia">Contrarreferencia (Recibido)</option>
                                  <option value="Defunción">Defunción</option>
                              </select>
                              <label htmlFor="additional-notes" className="sr-only">Notas adicionales</label>
                              <textarea 
                                  id="additional-notes"
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium uppercase outline-none h-20 resize-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Notas adicionales..."
                                  value={finalizeData.notes}
                                  onChange={e => setFinalizeData({...finalizeData, notes: e.target.value})}
                              />
                           </div>
                      </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-4">
                      <button onClick={() => setShowFinalizeModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancelar</button>
                      <button 
                          onClick={handleConfirmFinalize}
                          className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                          <LogOut size={16} aria-hidden="true" /> Confirmar Cierre
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="view-note-title">
           <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white/20">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-lg" aria-hidden="true">
                        {selectedNote.content?.isAttachment ? <Paperclip size={24}/> : <FileText size={24} />}
                    </div>
                    <div>
                        <h3 id="view-note-title" className="text-xs font-black text-slate-900 uppercase tracking-widest m-0">{selectedNote.content?.title || selectedNote.type}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Folio: {selectedNote.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    {!selectedNote.content?.isAttachment && <button onClick={() => setShowPdfView(true)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><FileText size={18} aria-hidden="true" /> Versión PDF</button>}
                    {!selectedNote.content?.isAttachment && <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><Printer size={18} aria-hidden="true" /> Imprimir Web</button>}
                    {selectedNote.content?.isAttachment && <a href={selectedNote.content.fileUrl} download={selectedNote.content.fileName || 'documento'} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><Download size={18} aria-hidden="true" /> Descargar</a>}
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-rose-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cerrar nota"><X size={24} aria-hidden="true"/></button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 bg-white">
                 {/* Lógica de Renderizado Diferenciada */}
                 {selectedNote.content?.isAttachment ? (
                     <div className="flex flex-col items-center justify-center space-y-4 h-full">
                         {selectedNote.content.fileType?.startsWith('image/') ? (
                             <img src={selectedNote.content.fileUrl} alt="Adjunto" className="max-w-full max-h-[70vh] rounded-xl shadow-lg object-contain" />
                         ) : (
                             <iframe src={selectedNote.content.fileUrl} title="Documento PDF" className="w-full h-[70vh] rounded-xl border border-slate-200 shadow-sm" />
                         )}
                         <p className="text-xs font-bold text-slate-500 uppercase">{selectedNote.content.fileName}</p>
                     </div>
                 ) : (
                     <div className="max-w-4xl mx-auto space-y-12 text-slate-900 print:text-black print:m-0 print:w-full print:max-w-none">
                        {/* Re-render note content structured for printing */}
                        <div className="flex justify-between border-b-4 border-slate-900 pb-10">
                           <div className="space-y-4">
                              <h1 className="text-3xl font-black text-slate-900 uppercase leading-none">{doctorInfo.hospital}</h1>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Expediente Clínico Electrónico Certificado</p>
                           </div>
                           <div className="text-right"><QrCode size={80} className="text-slate-900 inline-block mb-2" /><p className="text-xs font-black text-rose-600 uppercase tracking-tighter">FOLIO: {selectedNote.id}</p></div>
                        </div>

                        {/* Patient Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl print:bg-transparent print:border-slate-900 print:rounded-none">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
                                <p className="text-xs font-bold text-slate-900 uppercase">{patient.name}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Edad / Sexo</p>
                                <p className="text-xs font-bold text-slate-900 uppercase">{getDisplayAge()} / {patient.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</p>
                                <p className="text-xs font-bold text-slate-900 uppercase">{selectedNote.date}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo de Nota</p>
                                <p className="text-xs font-bold text-slate-900 uppercase">{selectedNote.type}</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                           {selectedNote.type.toLowerCase().includes('admisión laboral') ? (
                             <OccupationalAdmissionView content={selectedNote.content} />
                           ) : selectedNote.type.toLowerCase().includes('certificado médico') ? (
                             <MedicalCertificateView 
                                content={selectedNote.content} 
                                patientName={patient.name} 
                                patientAge={getDisplayAge()} 
                                patientSex={patient.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}
                                patientCurp={patient.curp || ''}
                             />
                           ) : (
                             Object.entries(selectedNote.content).map(([key, val]) => {
                               if (key === 'vitals' || key === 'isAttachment' || key === 'fileUrl' || key === 'fileName' || key === 'fileType' || key === 'reportType' || key === 'studyTitle') return null;
                               
                               if (key === 'labResults' && Array.isArray(val)) {
                                 return (
                                   <div key={key} className="space-y-2">
                                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Resultados de Laboratorio</h4>
                                   <table className="w-full text-left border-collapse mt-4">
                                     <thead>
                                       <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-500">
                                         <th className="py-2">Analito</th>
                                         <th className="py-2 text-center">Resultado</th>
                                         <th className="py-2 text-center">Unidad</th>
                                         <th className="py-2 text-center">Ref.</th>
                                         <th className="py-2 text-center">Estatus</th>
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {val.map((r: any, i: number) => (
                                         <tr key={i} className="border-b border-slate-200 text-xs font-bold uppercase">
                                           <td className="py-2">{r.analyte}</td>
                                           <td className="py-2 text-center text-indigo-700">{r.value}</td>
                                           <td className="py-2 text-center text-slate-500">{r.unit}</td>
                                           <td className="py-2 text-center text-slate-500">{r.refRange}</td>
                                           <td className="py-2 text-center">
                                             <span className={`px-2 py-1 rounded text-[9px] font-black ${r.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                               {r.status}
                                             </span>
                                           </td>
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                               );
                             }

                             if (key === 'requestedStudies' && Array.isArray(val)) {
                               if (val.length === 0) return null;
                               return (
                                 <div key={key} className="space-y-2">
                                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Estudios Solicitados</h4>
                                   <div className="text-sm font-medium text-slate-800 italic uppercase leading-relaxed print:text-black">
                                      {val.join(', ')}
                                   </div>
                                 </div>
                               );
                             }

                             if (key === 'meds' && Array.isArray(val)) {
                               if (val.length === 0) return null;
                               return (
                                 <div key={key} className="space-y-2">
                                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Medicamentos Administrados</h4>
                                   <table className="w-full text-left border-collapse mt-4">
                                     <thead>
                                       <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-500">
                                         <th className="py-2">Medicamento</th>
                                         <th className="py-2">Dosis</th>
                                         <th className="py-2">Hora</th>
                                         <th className="py-2">Estatus</th>
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {val.map((m: any, i: number) => (
                                         <tr key={i} className="border-b border-slate-200 text-xs font-bold uppercase">
                                           <td className="py-2">{m.medName || m.name}</td>
                                           <td className="py-2">{m.dosage}</td>
                                           <td className="py-2">{m.time}</td>
                                           <td className="py-2">{m.status}</td>
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                               );
                             }

                             if (key === 'procedures' && Array.isArray(val)) {
                               if (val.length === 0) return null;
                               return (
                                 <div key={key} className="space-y-2">
                                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Procedimientos</h4>
                                   <table className="w-full text-left border-collapse mt-4">
                                     <thead>
                                       <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-500">
                                         <th className="py-2">Procedimiento</th>
                                         <th className="py-2">Hora</th>
                                         <th className="py-2">Notas</th>
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {val.map((p: any, i: number) => (
                                         <tr key={i} className="border-b border-slate-200 text-xs font-bold uppercase">
                                           <td className="py-2">{p.procedure}</td>
                                           <td className="py-2">{p.time}</td>
                                           <td className="py-2 text-[10px] text-slate-600">{p.notes}</td>
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                               );
                             }

                             if (key === 'risks' && typeof val === 'object' && val !== null) {
                               const risksVal = val as any;
                               return (
                                 <div key={key} className="space-y-2">
                                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Valoración de Riesgos</h4>
                                   <div className="grid grid-cols-3 gap-4 mt-2">
                                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                         <p className="text-[8px] font-black uppercase text-slate-400">Riesgo Caídas</p>
                                         <p className="text-xs font-bold uppercase">{risksVal.fall}</p>
                                      </div>
                                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                         <p className="text-[8px] font-black uppercase text-slate-400">Riesgo UPP</p>
                                         <p className="text-xs font-bold uppercase">{risksVal.ulcer}</p>
                                      </div>
                                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                         <p className="text-[8px] font-black uppercase text-slate-400">Dolor (EVA)</p>
                                         <p className="text-xs font-bold uppercase">{risksVal.pain?.score} - {risksVal.pain?.location}</p>
                                      </div>
                                   </div>
                                 </div>
                               );
                             }

                             if (key === 'vitalsSummary' && Array.isArray(val)) {
                               if (val.length === 0) return null;
                               return (
                                 <div key={key} className="space-y-2">
                                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Resumen de Signos Vitales</h4>
                                   <table className="w-full text-left border-collapse mt-4 text-center">
                                     <thead>
                                       <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-500">
                                         <th className="py-2">Hora</th>
                                         <th className="py-2">T.A.</th>
                                         <th className="py-2">F.C.</th>
                                         <th className="py-2">F.R.</th>
                                         <th className="py-2">Temp</th>
                                         <th className="py-2">SatO2</th>
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {val.map((v: any, i: number) => (
                                         <tr key={i} className="border-b border-slate-200 text-[10px] font-bold uppercase">
                                           <td className="py-2">{v.date?.split(' ')[1]?.substring(0,5) || v.time}</td>
                                           <td className="py-2">{v.bp}</td>
                                           <td className="py-2">{v.hr}</td>
                                           <td className="py-2">{v.rr}</td>
                                           <td className="py-2">{v.temp}°</td>
                                           <td className="py-2">{v.o2}%</td>
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                               );
                             }

                             return (
                               <div key={key} className="space-y-2">
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">{key}</h4>
                                 <div className="text-sm font-medium text-slate-800 italic uppercase leading-relaxed print:text-black whitespace-pre-wrap">
                                    {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                                 </div>
                               </div>
                             );
                           }))}
                        </div>

                        {/* Signatures */}
                        <div className="pt-24 border-t-2 border-slate-200 grid grid-cols-2 gap-24 print:border-slate-900 mt-20">
                            <div className="text-center space-y-4">
                                <div className="w-full border-b-2 border-slate-900"></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight text-slate-900">{selectedNote.author}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Médico Tratante</p>
                                    <p className="text-[8px] text-slate-400 mt-1 uppercase">Cédula Prof: {doctorInfo.license}</p>
                                </div>
                            </div>
                            <div className="text-center space-y-4">
                                <div className="w-full border-b-2 border-slate-900"></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight text-slate-900">Firma Electrónica</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Certificado Digital</p>
                                    <p className="text-[8px] text-slate-400 mt-1 uppercase font-mono break-all">{selectedNote.hash}</p>
                                </div>
                            </div>
                        </div>
                     </div>
                 )}
              </div>
           </div>
           
           <style>{`
             @media print {
               .no-print { display: none !important; }
               body { background: white !important; margin: 0 !important; padding: 0 !important; }
               .fixed { position: absolute !important; inset: 0 !important; background: white !important; }
               .max-w-5xl { max-width: 100% !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; }
               .overflow-y-auto { overflow: visible !important; }
               @page { margin: 1.5cm; size: letter portrait; }
             }
           `}</style>
        </div>
      )}

      {showPdfView && selectedNote && !selectedNote.content?.isAttachment && (
        <PDFViewer filename={`${selectedNote.type.replace(/\s+/g, '_')}_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`} onClose={() => setShowPdfView(false)}>
           <div className="w-[210mm] min-h-[297mm] p-[15mm] bg-white text-slate-900 text-[11px] leading-relaxed relative flex flex-col">
               <div className="flex justify-between border-b-2 border-slate-900 pb-4 mb-4">
                   <div className="space-y-1">
                      <h1 className="text-xl font-black text-slate-900 uppercase leading-none">{doctorInfo.hospital}</h1>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Expediente Clínico Electrónico Certificado</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">FOLIO: {selectedNote.id}</p>
                   </div>
               </div>

               <div className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6">
                   <div className="flex-1">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
                       <p className="text-[10px] font-bold text-slate-900 uppercase">{patient.name}</p>
                   </div>
                   <div className="flex-1">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Edad / Sexo</p>
                       <p className="text-[10px] font-bold text-slate-900 uppercase">{getDisplayAge()} / {patient.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}</p>
                   </div>
                   <div className="flex-1">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</p>
                       <p className="text-[10px] font-bold text-slate-900 uppercase">{selectedNote.date}</p>
                   </div>
                   <div className="flex-1">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo de Nota</p>
                       <p className="text-[10px] font-bold text-slate-900 uppercase">{selectedNote.type}</p>
                   </div>
               </div>

               <div className="flex-1 space-y-6">
                   {selectedNote.type.toLowerCase().includes('admisión laboral') ? (
                     <OccupationalAdmissionView content={selectedNote.content} />
                   ) : selectedNote.type.toLowerCase().includes('certificado médico') ? (
                     <MedicalCertificateView 
                        content={selectedNote.content} 
                        patientName={patient.name} 
                        patientAge={getDisplayAge()} 
                        patientSex={patient.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}
                        patientCurp={patient.curp || ''}
                     />
                   ) : (
                     Object.entries(selectedNote.content).map(([key, val]) => {
                        if (key === 'vitals' || key === 'isAttachment' || key === 'fileUrl' || key === 'fileName' || key === 'fileType' || key === 'reportType' || key === 'studyTitle') return null;
                        
                        if (key === 'labResults' && Array.isArray(val)) {
                          if (val.length === 0) return null;
                          return (
                            <div key={key} className="space-y-2">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">Resultados de Laboratorio</h4>
                              <table className="w-full text-left border-collapse mt-2">
                                <thead>
                                  <tr className="border-b border-slate-900 text-[8px] font-black uppercase text-slate-500">
                                    <th className="py-1">Analito</th>
                                    <th className="py-1">Resultado</th>
                                    <th className="py-1">Unidad</th>
                                    <th className="py-1">Ref.</th>
                                    <th className="py-1">Estatus</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {val.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-200 text-[9px] font-bold">
                                      <td className="py-1">{r.analyte}</td>
                                      <td className="py-1 text-slate-900">{r.value}</td>
                                      <td className="py-1 text-slate-500">{r.unit}</td>
                                      <td className="py-1 text-slate-500">{r.refRange}</td>
                                      <td className="py-1">{r.status}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={key} className="space-y-1 mb-4 page-break-inside-avoid">
                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">{key}</h4>
                            <div className="text-[10px] font-medium text-slate-800 uppercase leading-relaxed whitespace-pre-wrap">
                               {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                            </div>
                          </div>
                        );
                     })
                   )}
               </div>

               <div className="pt-10 mt-10 border-t border-slate-200 grid grid-cols-2 gap-12 page-break-inside-avoid">
                   <div className="text-center space-y-2">
                       <div className="w-48 mx-auto border-b-2 border-slate-900"></div>
                       <div>
                           <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{selectedNote.author}</p>
                           <p className="text-[8px] font-bold text-slate-500 uppercase">Cédula Prof: {doctorInfo.license}</p>
                       </div>
                   </div>
                   <div className="text-center space-y-2">
                       <div className="w-48 mx-auto border-b-2 border-slate-900"></div>
                       <p className="text-[8px] font-bold text-slate-500 uppercase">Firma del Paciente (Opcional)</p>
                   </div>
               </div>
           </div>
        </PDFViewer>
      )}
    </div>
  );
};

export default PatientProfile;
