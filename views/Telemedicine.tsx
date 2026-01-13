
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, VideoOff, Mic, MicOff, ShieldCheck, MessageSquare, PhoneOff, 
  ChevronLeft, Clock, FileText, User, Send, X, Minimize2, Share, 
  MoreVertical, Paperclip, Smile, Maximize2, Layout, Save, Stethoscope, Activity, ClipboardList, PenTool, CheckCircle2,
  History, Ambulance, MapPin, FlaskConical, Plus, AlertTriangle, Watch, Map, Siren, ExternalLink, LogOut, Globe, Accessibility,
  FolderPlus, ChevronRight, Info, Baby, Heart, Brain, Search, Pill, PlusCircle, Trash2, Printer, ArrowLeft, ArrowDown
} from 'lucide-react';
import { Patient, ClinicalNote, PatientStatus, HomeServiceRequest, Vitals, DoctorInfo, MedicationPrescription, MedicationStock, PriceItem, PriceType } from '../types';
import { LAB_CATALOG, NOTE_CATEGORIES, VADEMECUM_DB, INITIAL_STOCK, INITIAL_PRICES, MOCK_DOCTORS } from '../constants';

interface TelemedicineProps {
  patients?: Patient[]; 
  notes?: ClinicalNote[]; 
  onSaveNote?: (note: ClinicalNote) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onAddHomeRequest?: (req: HomeServiceRequest) => void;
  currentUser?: DoctorInfo; 
}

// --- CONFIGURACIÓN DE CAMPOS ESPECÍFICOS POR PROGRAMA (SUIVE) ---
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

const Telemedicine: React.FC<TelemedicineProps> = ({ patients = [], notes = [], onSaveNote, onUpdatePatient, onAddHomeRequest, currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const patient = patients.find(p => p.id === id);
  const patientHistory = notes.filter(n => n.patientId === id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'notes' | 'history' | 'lab' | 'ficha' | 'docs'>('notes'); 
  const [elapsedTime, setElapsedTime] = useState(0);
  const [chatMessage, setChatMessage] = useState('');

  // --- DATA LOADING FOR PRESCRIPTION ENGINE ---
  const [inventory] = useState<MedicationStock[]>(() => {
    const saved = localStorage.getItem('med_inventory_v6');
    let data = saved ? JSON.parse(saved) : INITIAL_STOCK;
    if (data.length > 0 && !data[0].batches) {
        data = data.map((item: any) => ({
            ...item,
            batches: [{ id: `BATCH-${Date.now()}`, batchNumber: item.batch || 'S/L', expiryDate: item.expiryDate || '', currentStock: item.currentStock || 0 }]
        }));
    }
    return data;
  });

  const [prices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  // --- PRESCRIPTION STATE ---
  const [medications, setMedications] = useState<MedicationPrescription[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<(MedicationStock & { inStock: number })[]>([]);
  const [procSuggestions, setProcSuggestions] = useState<PriceItem[]>([]);
  const [searchType, setSearchType] = useState<'med' | 'proc'>('med');

  // --- DOCS VIEW STATE ---
  const [viewingDocType, setViewingDocType] = useState<string | null>(null);

  // IoT Simulation State
  const [isIoTConnected, setIsIoTConnected] = useState(false);
  const [iotData, setIotData] = useState<Partial<Vitals>>({});

  // Lab Request State
  const [labSelection, setLabSelection] = useState<string[]>([]);
  const [labAddress, setLabAddress] = useState(patient?.address || '');
  
  // Finalize / SUIVE Modal State
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeData, setFinalizeData] = useState({
      diagnosis: '',
      consultationType: 'Subsecuente',
      program: 'Consulta General',
      specifics: {} as Record<string, any>,
      isIndigenous: false,
      isDisability: false,
      isMigrant: false,
      referral: 'Ninguna',
      notes: ''
  });

  const [messages, setMessages] = useState<{sender: string, text: string, time: string, isSystem?: boolean}[]>([
      {sender: 'Sistema', text: 'Conexión cifrada E2EE establecida (AES-256).', time: '10:00', isSystem: true},
      {sender: 'Sistema', text: 'El paciente ha ingresado a la sala virtual.', time: '10:01', isSystem: true},
      {sender: 'Paciente', text: 'Buenos días doctor, ¿me escucha bien?', time: '10:02', isSystem: false}
  ]);

  // PSOAP State
  const [clinicalNote, setClinicalNote] = useState({
      subjective: '', 
      objectiveVitals: { temp: '', hr: '', rr: '', o2: '', bp: '' }, 
      objectiveExam: '', 
      analysis: '', 
      plan: '' // Text plan (recommendations)
  });

  // Pre-fill triage data if available
  useEffect(() => {
     if (patient?.teleIntake) {
         setClinicalNote(prev => ({
             ...prev,
             subjective: `MOTIVO TRIAGE: ${patient.teleIntake?.mainSymptom}\nINICIO: ${patient.teleIntake?.onsetDuration}\nDOLOR: ${patient.teleIntake?.painLevel}/10\n\n`
         }));
         setFinalizeData(prev => ({...prev, diagnosis: patient.teleIntake?.chronicConditions.join(', ') || ''}));
     }
  }, [patient]);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- PRESCRIPTION HANDLERS ---
  const handleSearch = (val: string) => {
    setSearchTerm(val);
    if (val.length <= 1) {
       setSuggestions([]);
       setProcSuggestions([]);
       return;
    }

    const term = val.toLowerCase();

    if (searchType === 'med') {
      const stockMatches = inventory.filter(i => 
        i.name.toLowerCase().includes(term) || i.genericName.toLowerCase().includes(term)
      ).map(i => ({ ...i, inStock: (i.batches || []).reduce((acc, b) => acc + b.currentStock, 0) }));

      const catalogMatches = VADEMECUM_DB.filter(v => 
        (v.name.toLowerCase().includes(term) || v.genericName.toLowerCase().includes(term)) &&
        !stockMatches.some(s => s.name === v.name)
      ).map(v => ({ ...v, inStock: 0 }));

      setSuggestions([...stockMatches, ...catalogMatches]);
    } else {
      const serviceMatches = prices.filter(p => 
         p.type === PriceType.SERVICE && 
         (p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
      );
      setProcSuggestions(serviceMatches);
    }
  };

  const addMed = (med?: MedicationStock & { inStock?: number }) => {
    const newMed: MedicationPrescription = {
      id: `MED-${Date.now()}`,
      name: med?.name || 'NUEVO FÁRMACO / INSUMO',
      genericName: med?.genericName || '',
      dosage: med?.concentration || '',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      route: 'Oral',
      instructions: ''
    };
    setMedications([...medications, newMed]);
    setSearchTerm('');
    setSuggestions([]);
  };

  const addManualItem = () => {
    if (searchType === 'med') {
        const name = searchTerm.trim() || "FÁRMACO MANUAL";
        const newMed: MedicationPrescription = {
            id: `MAN-${Date.now()}`,
            name: name.toUpperCase(),
            genericName: '',
            dosage: '',
            frequency: '',
            duration: '',
            route: 'Oral',
            instructions: ''
        };
        setMedications([...medications, newMed]);
    } else {
        const name = searchTerm.trim() || "PROCEDIMIENTO MANUAL";
        const newProc: PriceItem = {
            id: `PROC-MAN-${Date.now()}`,
            name: name.toUpperCase(),
            price: 0,
            type: PriceType.SERVICE,
            category: 'Manual',
            taxPercent: 0,
            code: 'MAN'
        };
        setSelectedProcedures([...selectedProcedures, newProc]);
    }
    setSearchTerm('');
    setSuggestions([]);
    setProcSuggestions([]);
  };

  const addProcedure = (proc: PriceItem) => {
     setSelectedProcedures([...selectedProcedures, proc]);
     setSearchTerm('');
     setProcSuggestions([]);
  };

  const removeMed = (mid: string) => setMedications(medications.filter(m => m.id !== mid));
  const removeProc = (pid: string) => setSelectedProcedures(selectedProcedures.filter(p => p.id !== pid));

  const updateMed = (mid: string, field: keyof MedicationPrescription, value: string) => {
    setMedications(medications.map(m => m.id === mid ? { ...m, [field]: value } : m));
  };

  // --- GENERAL HANDLERS ---

  const handleSendMessage = (e?: React.FormEvent) => {
      e?.preventDefault();
      if(!chatMessage.trim()) return;
      setMessages([...messages, {
          sender: currentUser?.name || 'Médico',
          text: chatMessage,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          isSystem: false
      }]);
      setChatMessage('');
  };

  const handleConnectIoT = () => {
      setIsIoTConnected(true);
      setTimeout(() => {
          const newData = {
              hr: Math.floor(Math.random() * (90 - 60 + 1) + 60),
              o2: Math.floor(Math.random() * (100 - 95 + 1) + 95),
              temp: 36.6
          };
          setIotData(newData);
          setClinicalNote(prev => ({
              ...prev,
              objectiveVitals: { ...prev.objectiveVitals, hr: newData.hr.toString(), o2: newData.o2.toString(), temp: newData.temp.toString() }
          }));
          alert("Dispositivo Wearable Vinculado Exitosamente.");
      }, 1500);
  };

  const handlePanicButton = () => {
      if(confirm("¿ACTIVAR PROTOCOLO DE EMERGENCIA?\n\nSe enviará la ubicación del paciente a servicios de urgencia locales y se notificará a contactos de emergencia.")) {
          alert("ALERTA ENVIADA. Servicios de emergencia notificados con coordenadas GPS.");
      }
  };

  const handleSaveNote = () => {
      if (!onSaveNote || !patient) return;
      
      const newNote: ClinicalNote = {
          id: `TELE-${Date.now()}`,
          patientId: patient.id,
          type: 'Nota de Teleconsulta (Evolución)',
          date: new Date().toLocaleString('es-MX'),
          author: currentUser?.name || 'Dr. Alejandro Méndez', 
          content: {
              subjective: clinicalNote.subjective,
              objective: `Signos Vitales (IoT/Reportados): T:${clinicalNote.objectiveVitals.temp}, FC:${clinicalNote.objectiveVitals.hr}, FR:${clinicalNote.objectiveVitals.rr}, SatO2:${clinicalNote.objectiveVitals.o2}, TA:${clinicalNote.objectiveVitals.bp}.\n\nExploración (Video): ${clinicalNote.objectiveExam}`,
              analysis: clinicalNote.analysis,
              plan: clinicalNote.plan,
              prescriptions: medications, 
              procedures: selectedProcedures, 
              duration: formatTime(elapsedTime)
          },
          isSigned: true,
          hash: `CERT-TELE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          origin: 'Telemedicine' 
      };

      onSaveNote(newNote);

      // GENERAR NOTA DE RECETA SEPARADA SI HAY MEDICAMENTOS
      if (medications.length > 0) {
          const prescriptionNote: ClinicalNote = {
              id: `REC-${Date.now()}`,
              patientId: patient.id,
              type: 'Receta Médica', 
              date: new Date().toLocaleString('es-MX'),
              author: currentUser?.name || 'Dr. Alejandro Méndez',
              content: {
                  diagnosis: clinicalNote.analysis,
                  meds: medications,
                  procedures: selectedProcedures,
                  instructions: clinicalNote.plan,
                  folio: `REC-TELE-${Date.now().toString().slice(-6)}`,
                  isTelemedicine: true
              },
              isSigned: true,
              hash: `CERT-REC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              origin: 'Telemedicine'
          };
          onSaveNote(prescriptionNote);
      }

      alert('Nota de evolución y receta guardadas exitosamente.');
  };

  const handleSubmitHomeLab = () => {
      if (labSelection.length === 0 || !labAddress) return alert("Seleccione estudios y confirme dirección.");
      
      const req: HomeServiceRequest = {
          id: `HOME-${Date.now()}`,
          patientId: patient!.id,
          patientName: patient!.name,
          patientAddress: labAddress,
          requestedBy: currentUser?.name || 'Dr. Médico',
          requestedDate: new Date().toISOString(),
          status: 'Pendiente',
          studies: labSelection
      };

      if (onAddHomeRequest) onAddHomeRequest(req);
      
      alert("Solicitud de unidad móvil generada exitosamente. El equipo de enfermería ha sido notificado.");
      setLabSelection([]);
      setActiveSidePanel('notes');
  };

  const handleOpenDocInSidebar = (noteType: string) => {
      setViewingDocType(noteType);
  };

  const handleConfirmFinalize = () => {
     if (!finalizeData.diagnosis) return alert("El diagnóstico es obligatorio para el cierre (SUIVE).");
     if (!patient || !onSaveNote || !onUpdatePatient) return;

     // 1. Guardar Nota de Teleconsulta si hay datos escritos
     if (clinicalNote.subjective || clinicalNote.analysis || medications.length > 0) {
         handleSaveNote(); // Incluye lógica de receta separada
     }

     // 2. Crear Nota de Cierre / SUIVE (Para Hoja Diaria)
     const dischargeNote: ClinicalNote = {
         id: `SUIVE-${Date.now()}`,
         patientId: patient.id,
         type: 'Cierre de Consulta (SUIVE)',
         date: new Date().toLocaleString('es-MX'),
         author: currentUser?.name || 'Dr. Médico',
         content: { 
             ...finalizeData, 
             medico: currentUser?.name || 'Dr. Médico', 
             timestamp: new Date().toISOString(),
             origin: 'Telemedicine' 
         },
         isSigned: true,
         hash: `SUIVE-TELE-${Math.random().toString(36).substr(2,8)}`
     };
     onSaveNote(dischargeNote);

     // 3. Actualizar Paciente a ATENDIDO
     onUpdatePatient({
         ...patient,
         status: PatientStatus.ATTENDED,
         history: {
             ...patient.history,
             dischargeData: { ...finalizeData, medico: currentUser?.name, timestamp: new Date().toISOString() }
         }
     });

     setShowFinalizeModal(false);
     navigate('/telemedicine'); 
  };

  const handleSpecificChange = (key: string, value: any) => {
      setFinalizeData(prev => ({
          ...prev,
          specifics: { ...prev.specifics, [key]: value }
      }));
  };

  const renderProgramFields = () => {
     const fields = PROGRAM_SPECIFICS[finalizeData.program];
     if (!fields) return null;

     return (
         <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-4 animate-in slide-in-from-top-2 mb-6">
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

  if (!patient) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Paciente no encontrado</div>;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-500">
      
      {/* --- TOP BAR (FLOATING) --- */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button 
              onClick={() => {
                  if(window.confirm("¿Salir de la sala? La llamada continuará en segundo plano.")) navigate('/telemedicine');
              }}
              className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-2.5 shadow-lg">
               <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
               <span className="text-white font-mono font-bold text-sm tracking-wider">{formatTime(elapsedTime)}</span>
            </div>
            
            <button onClick={handlePanicButton} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-lg border border-rose-500 animate-pulse">
                <Siren size={16}/> <span className="text-[10px] font-black uppercase">S.O.S.</span>
            </button>
          </div>
          
          <div className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4 flex items-center gap-4 shadow-lg">
             <div className="text-right">
                <p className="text-white font-black text-xs uppercase tracking-wide">{patient.name}</p>
                <p className="text-slate-400 text-[9px] font-bold uppercase">{patient.age} Años • {patient.sex}</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0057B8] to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner border border-white/10">
                {patient.name.charAt(0)}
             </div>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA (SPLIT SCREEN) --- */}
      <div className="flex-1 flex relative">
          
          {/* LEFT: MAIN VIDEO (PATIENT) */}
          <div className={`flex-1 bg-slate-900 flex items-center justify-center relative transition-all duration-300 ${activeSidePanel !== 'notes' ? 'w-full' : 'w-1/2'}`}>
              <div className="relative w-full h-full flex items-center justify-center bg-slate-800">
                  <div className="text-center opacity-40 animate-pulse">
                    <div className="w-48 h-48 bg-slate-700 rounded-full flex items-center justify-center text-6xl font-black text-slate-500 mx-auto mb-6 border-4 border-slate-600 shadow-2xl">
                      {patient.name.charAt(0)}
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Señal de Video Encriptada</p>
                  </div>
                  
                  {isIoTConnected && (
                      <div className="absolute top-24 left-6 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 text-emerald-400 shadow-2xl animate-in slide-in-from-left-4">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                              <Watch size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Apple Watch Series 8</span>
                          </div>
                          <div className="space-y-1">
                              <p className="text-xs font-bold">FC: <span className="text-lg font-black text-white">{iotData.hr}</span> lpm</p>
                              <p className="text-xs font-bold">SpO2: <span className="text-lg font-black text-white">{iotData.o2}</span> %</p>
                          </div>
                      </div>
                  )}
              </div>

              <div className="absolute bottom-24 left-6 w-48 aspect-video bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-20 group hover:border-blue-500/50 transition-all">
                 {isVideoOn ? (
                     <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Dr. Méndez</span>
                        {!isMicOn && <div className="absolute top-2 left-2 p-1 bg-rose-500 rounded-md"><MicOff size={10} className="text-white"/></div>}
                     </div>
                 ) : (
                     <div className="w-full h-full bg-slate-900 flex items-center justify-center flex-col gap-2">
                        <VideoOff size={18} className="text-rose-500"/>
                     </div>
                 )}
              </div>
          </div>

          {/* RIGHT: SOAP EDITOR / TOOLS (The "Split Screen") */}
          <div className="w-[550px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto no-scrollbar">
                  <button onClick={() => setActiveSidePanel('notes')} className={`flex-1 py-4 px-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeSidePanel === 'notes' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Nota SOAP</button>
                  <button onClick={() => setActiveSidePanel('docs')} className={`flex-1 py-4 px-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center justify-center gap-1 ${activeSidePanel === 'docs' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}><FolderPlus size={14}/> Documentos</button>
                  <button onClick={() => setActiveSidePanel('ficha')} className={`flex-1 py-4 px-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeSidePanel === 'ficha' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Ficha</button>
                  <button onClick={() => setActiveSidePanel('history')} className={`flex-1 py-4 px-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeSidePanel === 'history' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Historial</button>
                  <button onClick={() => setActiveSidePanel('lab')} className={`flex-1 py-4 px-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeSidePanel === 'lab' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Estudios</button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
                  
                  {/* PESTAÑA: DOCUMENTOS EN BARRA LATERAL (VIEWER) */}
                  {activeSidePanel === 'docs' && (
                      <div className="space-y-6 animate-in slide-in-from-right-4 h-full flex flex-col">
                          {!viewingDocType ? (
                              <>
                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                                    <Info size={16} className="text-indigo-600 mt-1 flex-shrink-0"/>
                                    <p className="text-[10px] text-indigo-800 font-medium leading-relaxed">
                                        Seleccione un documento para visualizarlo o editarlo en este panel sin salir de la consulta.
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    {NOTE_CATEGORIES.map(cat => (
                                        <div key={cat.title}>
                                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">{cat.title}</h5>
                                            <div className="space-y-2">
                                                {cat.notes.map(note => (
                                                    <button 
                                                        key={note}
                                                        onClick={() => handleOpenDocInSidebar(note)}
                                                        className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all flex justify-between items-center group"
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-blue-700">{note}</span>
                                                        <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-500"/>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                              </>
                          ) : (
                              // VISOR DE DOCUMENTO (SIMPLE SUMMARY VIEW)
                              <div className="flex flex-col h-full">
                                  <div className="flex items-center gap-2 mb-4">
                                      <button onClick={() => setViewingDocType(null)} className="p-2 hover:bg-slate-200 rounded-lg"><ArrowLeft size={16}/></button>
                                      <h3 className="text-sm font-black uppercase text-slate-900">{viewingDocType}</h3>
                                  </div>
                                  
                                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 overflow-y-auto">
                                      {(() => {
                                          const relevantNote = patientHistory.find(n => n.type.includes(viewingDocType || '') || (viewingDocType && viewingDocType.includes(n.type)));
                                          
                                          if (viewingDocType === 'Receta Médica') {
                                              return (
                                                  <>
                                                    <div className="text-center mb-6 border-b pb-4">
                                                        <h2 className="text-lg font-black uppercase text-slate-900">Receta Médica</h2>
                                                        <p className="text-[10px] text-slate-500 font-bold">Vista Previa del Plan Actual</p>
                                                    </div>
                                                    {medications.length > 0 || selectedProcedures.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {medications.map((m, i) => (
                                                                <div key={i} className="text-xs border-b border-dashed pb-2">
                                                                    <p className="font-bold text-slate-900">{m.name} ({m.genericName})</p>
                                                                    <p className="text-slate-600">{m.dosage} - {m.frequency}</p>
                                                                    <p className="text-slate-500 italic">{m.instructions}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-xs text-slate-400 italic">Agregue medicamentos en la pestaña SOAP para visualizarlos aquí.</p>
                                                    )}
                                                    <div className="mt-8 text-center">
                                                        <p className="text-[10px] font-black uppercase text-blue-600">Firma Digital Pre-autorizada</p>
                                                    </div>
                                                  </>
                                              );
                                          }

                                          if (relevantNote) {
                                              return (
                                                  <div className="space-y-4">
                                                      <div className="border-b pb-2">
                                                          <p className="font-bold text-sm text-slate-900">{relevantNote.type}</p>
                                                          <p className="text-xs text-slate-500">{relevantNote.date} • {relevantNote.author}</p>
                                                      </div>
                                                      <div className="space-y-3 text-xs">
                                                          {Object.entries(relevantNote.content).map(([key, val]) => {
                                                              if (key === 'vitals' || typeof val === 'object') return null;
                                                              return (
                                                                  <div key={key}>
                                                                      <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wide">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                                      <p className="text-slate-600 whitespace-pre-wrap">{String(val)}</p>
                                                                  </div>
                                                              );
                                                          })}
                                                      </div>
                                                  </div>
                                              );
                                          } else {
                                              return (
                                                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                                      <FileText size={32} className="text-slate-400 mb-2"/>
                                                      <p className="text-xs font-bold text-slate-500">No se encontraron registros previos de este tipo.</p>
                                                      <button 
                                                          onClick={() => window.open(`/#/patient/${id}/note/generic/${viewingDocType}`, '_blank', 'width=1000,height=800')} 
                                                          className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold uppercase hover:bg-slate-200 flex items-center gap-2"
                                                      >
                                                          <ExternalLink size={12}/> Abrir en Ventana Nueva
                                                      </button>
                                                  </div>
                                              );
                                          }
                                      })()}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {/* FICHA TÉCNICA DEL PACIENTE */}
                  {activeSidePanel === 'ficha' && (
                      <div className="space-y-6 animate-in slide-in-from-right-4">
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-black text-slate-500">{patient.name.charAt(0)}</div>
                                  <div>
                                      <h3 className="text-sm font-black uppercase text-slate-900">{patient.name}</h3>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">{patient.sex} • {patient.age} Años</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Alergias</p>
                                      <p className="text-[10px] font-bold text-rose-800">{patient.allergies?.join(', ') || 'Negadas'}</p>
                                  </div>
                                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Tipo Sangre</p>
                                      <p className="text-[10px] font-bold text-blue-800">{patient.bloodType || 'N/D'}</p>
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase">Enfermedades Crónicas</p>
                                  <p className="text-xs font-medium text-slate-700">{patient.chronicDiseases?.join(', ') || 'Ninguna reportada'}</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* NOTA SOAP - CON MOTOR DE PRESCRIPCIÓN INTEGRADO */}
                  {activeSidePanel === 'notes' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><FileText size={14}/> Nota Clínica (En Vivo)</h3>
                              {!isIoTConnected && (
                                  <button onClick={handleConnectIoT} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-600 transition-all flex items-center gap-2">
                                      <Watch size={12}/> Vincular IoT
                                  </button>
                              )}
                          </div>
                          
                          <div className="space-y-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">(S) Subjetivo</label>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-24 resize-none outline-none focus:border-blue-400 transition-all" value={clinicalNote.subjective} onChange={e => setClinicalNote({...clinicalNote, subjective: e.target.value})} placeholder="Síntomas referidos..." />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">(O) Objetivo / Vitales</label>
                                  <div className="grid grid-cols-3 gap-2 mb-2">
                                      <input className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] text-center font-bold" placeholder="FC" value={clinicalNote.objectiveVitals.hr} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, hr: e.target.value}})} />
                                      <input className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] text-center font-bold" placeholder="SpO2" value={clinicalNote.objectiveVitals.o2} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, o2: e.target.value}})} />
                                      <input className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] text-center font-bold" placeholder="Temp" value={clinicalNote.objectiveVitals.temp} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, temp: e.target.value}})} />
                                  </div>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-16 resize-none outline-none focus:border-blue-400 transition-all" value={clinicalNote.objectiveExam} onChange={e => setClinicalNote({...clinicalNote, objectiveExam: e.target.value})} placeholder="Hallazgos visuales..." />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">(A) Análisis / Diagnóstico</label>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-20 resize-none outline-none focus:border-blue-400 transition-all" value={clinicalNote.analysis} onChange={e => setClinicalNote({...clinicalNote, analysis: e.target.value})} placeholder="Impresión diagnóstica..." />
                              </div>
                              
                              {/* (P) PLAN: PRESCRIPTION ENGINE INTEGRATED */}
                              <div className="space-y-2 border-t-2 border-slate-100 pt-4 mt-2">
                                  <div className="flex justify-between items-center mb-2">
                                      <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                          <Pill size={12}/> (P) Plan y Tratamiento
                                      </label>
                                      <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                          <button onClick={() => setSearchType('med')} className={`px-2 py-1 rounded text-[8px] font-black uppercase ${searchType === 'med' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Fármacos</button>
                                          <button onClick={() => setSearchType('proc')} className={`px-2 py-1 rounded text-[8px] font-black uppercase ${searchType === 'proc' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Proc.</button>
                                      </div>
                                  </div>

                                  {/* Search Box with Manual Entry */}
                                  <div className="relative flex gap-2">
                                     <div className="relative flex-1">
                                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                         <input 
                                            className="pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-blue-400 w-full shadow-sm transition-all"
                                            placeholder={searchType === 'med' ? "Buscar Fármaco..." : "Buscar Procedimiento..."}
                                            value={searchTerm}
                                            onChange={e => handleSearch(e.target.value)}
                                         />
                                         {(suggestions.length > 0 || procSuggestions.length > 0) && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                                               {searchType === 'med' ? suggestions.map(s => (
                                                  <button key={s.id} onClick={() => addMed(s)} className="w-full text-left p-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center">
                                                     <div><p className="text-[10px] font-black uppercase text-slate-900">{s.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase">{s.genericName}</p></div>
                                                     <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${s.inStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{s.inStock > 0 ? `Stock: ${s.inStock}` : 'Agotado'}</span>
                                                  </button>
                                               )) : procSuggestions.map(p => (
                                                  <button key={p.id} onClick={() => addProcedure(p)} className="w-full text-left p-2.5 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center">
                                                     <div><p className="text-[10px] font-black uppercase text-indigo-900">{p.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{p.category}</p></div>
                                                     <span className="px-1.5 py-0.5 bg-white border border-slate-100 rounded text-[9px] font-black text-slate-700">${p.price}</span>
                                                  </button>
                                               ))}
                                            </div>
                                         )}
                                     </div>
                                     <button 
                                        onClick={addManualItem} 
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shrink-0"
                                        title="Agregar elemento no listado"
                                     >
                                         <PlusCircle size={14}/> Manual
                                     </button>
                                  </div>
                                  
                                  {/* Added Meds List */}
                                  <div className="space-y-2 mt-3">
                                      {medications.map((m, idx) => (
                                         <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase text-slate-800">{m.name} <span className="text-slate-400 font-normal">({m.genericName})</span></p>
                                                </div>
                                                <button onClick={() => removeMed(m.id)} className="text-slate-300 hover:text-rose-600"><Trash2 size={12}/></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold uppercase" placeholder="Dosis..." value={m.dosage} onChange={e => updateMed(m.id, 'dosage', e.target.value)} />
                                                <input className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold uppercase" placeholder="Frecuencia..." value={m.frequency} onChange={e => updateMed(m.id, 'frequency', e.target.value)} />
                                            </div>
                                            <input className="w-full mt-2 p-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-medium italic" placeholder="Instrucciones..." value={m.instructions} onChange={e => updateMed(m.id, 'instructions', e.target.value)} />
                                         </div>
                                      ))}

                                      {selectedProcedures.map((proc, i) => (
                                         <div key={i} className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                            <span className="text-[10px] font-bold text-indigo-900 uppercase">{proc.name}</span>
                                            <button onClick={() => removeProc(proc.id)} className="text-indigo-400 hover:text-rose-500"><X size={12}/></button>
                                         </div>
                                      ))}
                                  </div>

                                  <div className="pt-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Recomendaciones Generales</label>
                                      <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-16 resize-none outline-none" value={clinicalNote.plan} onChange={e => setClinicalNote({...clinicalNote, plan: e.target.value})} placeholder="Medidas generales, dieta, alarmas..." />
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeSidePanel === 'history' && (
                      <div className="space-y-4">
                           {patientHistory.map((note) => (
                              <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                      <span className="text-[9px] font-black uppercase text-slate-400">{note.date}</span>
                                      <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">{note.type}</span>
                                  </div>
                                  {note.content.diagnosis && <p className="text-xs font-medium text-slate-700">{note.content.diagnosis}</p>}
                              </div>
                           ))}
                           {patientHistory.length === 0 && <p className="text-center text-[10px] text-slate-400 uppercase mt-10">Sin historial previo</p>}
                      </div>
                  )}

                  {activeSidePanel === 'lab' && (
                       <div className="space-y-4">
                           <div className="bg-white p-4 rounded-xl border border-slate-200">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dirección de Toma</label>
                               <textarea className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" value={labAddress} onChange={e => setLabAddress(e.target.value)} />
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                               {LAB_CATALOG.map((lab) => (
                                   <button key={lab.name} onClick={() => setLabSelection(prev => prev.includes(lab.name) ? prev.filter(l => l !== lab.name) : [...prev, lab.name])} className={`p-3 rounded-xl border text-left text-[10px] font-bold uppercase ${labSelection.includes(lab.name) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                       {lab.name}
                                   </button>
                               ))}
                           </div>
                           <button onClick={handleSubmitHomeLab} className="w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-rose-700">Solicitar Unidad Móvil</button>
                       </div>
                  )}
                  
                  {activeSidePanel === 'chat' && (
                      <div className="flex flex-col h-full">
                          <div className="flex-1 space-y-3 mb-4">
                              {messages.map((m, i) => (
                                  <div key={i} className={`flex flex-col ${m.isSystem ? 'items-center' : m.sender.includes('Dr') ? 'items-end' : 'items-start'}`}>
                                      <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${m.isSystem ? 'bg-slate-100 text-slate-500 text-[9px] uppercase font-bold' : m.sender.includes('Dr') ? 'bg-[#0057B8] text-white' : 'bg-white border border-slate-200'}`}>
                                          {m.text}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                              <input className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                              <button type="submit" className="p-3 bg-[#0057B8] text-white rounded-xl"><Send size={14}/></button>
                          </form>
                      </div>
                  )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
                  <button onClick={handleSaveNote} className="py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                      <Save size={14}/> Guardar Nota
                  </button>
                  <button onClick={() => setShowFinalizeModal(true)} className="py-3 bg-[#0057B8] text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2">
                      <PhoneOff size={14}/> Finalizar
                  </button>
              </div>
          </div>
      </div>

      {/* --- BOTTOM CONTROL BAR (VIDEO) --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transform -translate-x-[250px]">
          <div className="flex items-center gap-4 p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
              <button onClick={() => setIsMicOn(!isMicOn)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white'}`}>
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={() => setIsVideoOn(!isVideoOn)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white'}`}>
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                <Share size={20} />
              </button>
          </div>
      </div>

      {/* MODAL DE FINALIZACIÓN Y CIERRE (SUIVE) */}
      {showFinalizeModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Finalizar Consulta</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generar Registro SUIVE-1</p>
                      </div>
                      <button onClick={() => setShowFinalizeModal(false)} className="p-3 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                  </div>

                  <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico de Egreso (CIE-10)</label>
                          <textarea 
                              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-blue-500 h-24 resize-none" 
                              placeholder="Ej: J00 Faringoamigdalitis Aguda"
                              value={finalizeData.diagnosis}
                              onChange={e => setFinalizeData({...finalizeData, diagnosis: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de Consulta</label>
                              <div className="flex gap-2">
                                  <button onClick={() => setFinalizeData({...finalizeData, consultationType: '1a Vez'})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${finalizeData.consultationType === '1a Vez' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>1a Vez</button>
                                  <button onClick={() => setFinalizeData({...finalizeData, consultationType: 'Subsecuente'})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${finalizeData.consultationType === 'Subsecuente' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>Subsecuente</button>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Programa Prioritario</label>
                              <select 
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none"
                                  value={finalizeData.program}
                                  onChange={e => setFinalizeData({...finalizeData, program: e.target.value, specifics: {}})}
                              >
                                  <option value="Consulta General">Consulta General</option>
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

                      {/* RENDERIZADO DINÁMICO DE CAMPOS ESPECÍFICOS */}
                      {renderProgramFields()}

                      <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Datos Estadísticos</label>
                          <div className="grid grid-cols-2 gap-3">
                              <div onClick={() => setFinalizeData({...finalizeData, isIndigenous: !finalizeData.isIndigenous})} className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${finalizeData.isIndigenous ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-slate-200'}`}>
                                  <span className="text-[9px] font-black uppercase flex items-center gap-1"><Globe size={12}/> Indígena</span>
                                  {finalizeData.isIndigenous && <CheckCircle2 size={12}/>}
                              </div>
                              <div onClick={() => setFinalizeData({...finalizeData, isDisability: !finalizeData.isDisability})} className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${finalizeData.isDisability ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200'}`}>
                                  <span className="text-[9px] font-black uppercase flex items-center gap-1"><Accessibility size={12}/> Discapacidad</span>
                                  {finalizeData.isDisability && <CheckCircle2 size={12}/>}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                      <button onClick={() => setShowFinalizeModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                      <button 
                          onClick={handleConfirmFinalize}
                          className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                          <LogOut size={16} /> Cerrar y Reportar
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Telemedicine;
