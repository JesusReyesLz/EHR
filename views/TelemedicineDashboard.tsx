
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, Calendar, Clock, Search, Filter, 
  Wifi, UserCheck, Phone, MoreVertical, 
  CheckCircle2, AlertCircle, FileText, Monitor,
  Users, Globe, Activity, ShieldCheck, Play, Link as LinkIcon,
  Star, Briefcase, Zap, UserPlus, Stethoscope, BadgeCheck,
  ChevronRight, ArrowRight, MapPin, ClipboardList, Thermometer,
  Eye, X, Power, Lock, LogIn, WifiOff, BellOff, LogOut, User,
  ArrowLeft, GraduationCap, MessageSquare, ImageIcon, Ambulance, FlaskConical, Plus, Coffee, Truck, Wallet, DollarSign, Download,
  History
} from 'lucide-react';
import { Patient, PatientStatus, AgendaStatus, PriorityLevel, ModuleType, DoctorInfo, TeleIntakeForm, HomeServiceRequest, ClinicalNote } from '../types';
import { MOCK_DOCTORS, LAB_CATALOG } from '../constants';

interface TelemedicineDashboardProps {
  patients: Patient[];
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onAddPatient?: (patient: Patient) => void;
  onAddHomeRequest?: (req: HomeServiceRequest) => void;
  doctorsList?: DoctorInfo[]; // New prop for availability
  onDoctorStatusChange?: (cedula: string, isOnline: boolean) => void; // New prop for status toggle
  currentUser?: DoctorInfo; // New prop for wallet
  notes?: ClinicalNote[]; // New prop for history
}

// ... (DoctorPublicProfile component remains the same) ...
const DoctorPublicProfile: React.FC<{ 
    doctor: DoctorInfo; 
    onBack: () => void; 
    onSchedule: () => void; 
}> = ({ doctor, onBack, onSchedule }) => {
  return (
    <div className="animate-in slide-in-from-right duration-300 bg-slate-50 min-h-screen pb-20 absolute inset-0 z-50 overflow-y-auto">
       {/* Navigation */}
       <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-xl">
             <ArrowLeft size={20} /> <span className="font-black text-xs uppercase tracking-widest">Regresar al Directorio</span>
          </button>
          <div className="text-right hidden md:block">
             <p className="font-black text-slate-900 text-sm uppercase">{doctor.name}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase">{doctor.specialty} • {doctor.hospital}</p>
          </div>
       </div>

       {/* Cover & Avatar */}
       <div className="relative">
          <div className="h-64 w-full bg-slate-200 overflow-hidden">
             {doctor.coverUrl ? (
                <img src={doctor.coverUrl} className="w-full h-full object-cover" alt="Cover" />
             ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
                </div>
             )}
          </div>
          <div className="max-w-5xl mx-auto px-6 relative -mt-20 flex flex-col md:flex-row items-end md:items-end gap-8">
             <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl">
                {doctor.avatarUrl ? (
                   <img src={doctor.avatarUrl} className="w-full h-full object-cover rounded-[2rem]" alt="Avatar" />
                ) : (
                   <div className="w-full h-full bg-slate-100 rounded-[2rem] flex items-center justify-center text-5xl font-black text-slate-300 uppercase border-4 border-slate-50">
                      {doctor.name.charAt(0)}
                   </div>
                )}
             </div>
             <div className="flex-1 pb-4 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">{doctor.name}</h1>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                         <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{doctor.specialty}</span>
                         {doctor.isPremium && <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"><BadgeCheck size={12}/> Verificado</span>}
                         <div className="flex items-center gap-1 text-amber-500 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-bold text-slate-700">{doctor.rating}</span>
                            <span className="text-[10px] text-slate-400 font-medium ml-1">({doctor.reviewCount} Opiniones)</span>
                         </div>
                         {doctor.isOnline ? (
                             <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 border border-emerald-200"><Wifi size={12}/> Disponible</span>
                         ) : (
                             <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 border border-slate-200"><WifiOff size={12}/> Ocupado</span>
                         )}
                      </div>
                   </div>
                   <button 
                      onClick={onSchedule}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                   >
                      Agendar Cita <ChevronRight size={16}/>
                   </button>
                </div>
             </div>
          </div>
       </div>

       {/* Content Grid */}
       <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ... (Rest of bio content) ... */}
          {/* Left Column: Bio & Info */}
          <div className="lg:col-span-2 space-y-10">
             
             {/* About */}
             <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-6">
                <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3 border-b border-slate-50 pb-4">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><User size={20}/></div>
                   Acerca del Especialista
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium text-justify">
                   {doctor.biography || `El Dr. ${doctor.name.split(' ')[0]} es un especialista con amplia experiencia en ${doctor.specialty}. Se dedica a proporcionar diagnósticos precisos y planes de tratamiento personalizados, priorizando siempre el bienestar y la comodidad del paciente. Su enfoque combina la evidencia científica más reciente con un trato humano y cercano.`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><GraduationCap size={18} /></div>
                      <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Egresado de</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">{doctor.institution}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><MapPin size={18} /></div>
                      <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">{doctor.hospital}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Services */}
             <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900 uppercase ml-4 flex items-center gap-2"><Briefcase size={18} className="text-slate-400"/> Servicios Ofrecidos</h3>
                <div className="flex flex-wrap gap-3">
                   {doctor.services?.map((svc, i) => (
                      <span key={i} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase shadow-sm flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {svc}
                      </span>
                   )) || (
                       <>
                        <span className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase shadow-sm">Consulta de {doctor.specialty}</span>
                        <span className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase shadow-sm">Seguimiento y Control</span>
                        <span className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase shadow-sm">Telemedicina</span>
                       </>
                   )}
                </div>
             </div>

             {/* Reviews */}
             {(doctor.allowReviews ?? true) && (
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><MessageSquare size={20}/></div>
                         Opiniones de Pacientes
                      </h3>
                      <div className="text-right bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                         <p className="text-3xl font-black text-slate-900">{doctor.rating}</p>
                         <div className="flex text-amber-400 gap-0.5 justify-end">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} fill="currentColor" />)}
                         </div>
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                      {[
                         { user: "María F.", date: "Hace 2 días", text: "Excelente atención del doctor, muy profesional y atento. Resolvió todas mis dudas con paciencia.", rating: 5 },
                         { user: "Carlos R.", date: "Hace 1 semana", text: "Buena consulta, las instalaciones son muy cómodas y el trato fue amable.", rating: 4 },
                         { user: "Ana G.", date: "Hace 3 semanas", text: "Muy recomendado, me ayudó mucho con mi tratamiento.", rating: 5 }
                      ].map((review, idx) => (
                         <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center font-black text-xs text-slate-500 shadow-sm">
                                     {review.user.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="text-xs font-black text-slate-900 uppercase">{review.user}</p>
                                      <div className="flex text-amber-400 gap-0.5">
                                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={8} fill="currentColor" />)}
                                      </div>
                                  </div>
                                </div>
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{review.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed italic ml-11">"{review.text}"</p>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>

          {/* Right Column: Quick Stats & Gallery */}
          <div className="space-y-8">
             <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                   <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 border-b border-white/10 pb-2 mb-2">Costo por Consulta</p>
                       <p className="text-5xl font-black tracking-tighter">${doctor.price}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Moneda Nacional (MXN)</p>
                   </div>
                   
                   <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                         <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400"><CheckCircle2 size={14} /></div>
                         <span className="text-xs font-bold text-slate-200 uppercase">Duración aprox. 45 min</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                         <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400"><Video size={14} /></div>
                         <span className="text-xs font-bold text-slate-200 uppercase">Disponible Online</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                         <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400"><ShieldCheck size={14} /></div>
                         <span className="text-xs font-bold text-slate-200 uppercase">Certificado Vigente</span>
                      </div>
                   </div>
                </div>
                {/* Decoration */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
             </div>

             <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><ImageIcon size={14}/> Galería / Instalaciones</h4>
                <div className="grid grid-cols-2 gap-4">
                   {doctor.gallery && doctor.gallery.length > 0 ? doctor.gallery.map((img, i) => (
                      <div key={i} className="aspect-square rounded-[2rem] overflow-hidden bg-slate-200 shadow-sm border border-slate-100 group/img relative">
                         <img src={img} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" alt="Gallery" />
                      </div>
                   )) : (
                      <>
                         <div className="aspect-square rounded-[2rem] bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2">
                             <ImageIcon size={24}/>
                             <span className="text-[8px] font-black uppercase">Recepción</span>
                         </div>
                         <div className="aspect-square rounded-[2rem] bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2">
                             <Stethoscope size={24}/>
                             <span className="text-[8px] font-black uppercase">Consultorio</span>
                         </div>
                      </>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

// ... (IntakeModal component remains the same) ...
const IntakeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TeleIntakeForm) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    // ... same implementation ...
    const [formData, setFormData] = useState<TeleIntakeForm>({
        mainSymptom: '',
        onsetDuration: '',
        painLevel: 0,
        chronicConditions: [],
        allergies: '',
        currentMedication: '',
        notes: '',
        submittedAt: new Date().toISOString()
    });

    const commonConditions = ['Diabetes', 'Hipertensión', 'Asma', 'Cardiopatía', 'Ninguna'];

    const handleSubmit = () => {
        if (!formData.mainSymptom || !formData.onsetDuration) return alert("Por favor complete los síntomas principales.");
        onSubmit({...formData, submittedAt: new Date().toISOString()});
    };

    const toggleCondition = (condition: string) => {
        const current = formData.chronicConditions;
        if (current.includes(condition)) {
            setFormData({...formData, chronicConditions: current.filter(c => c !== condition)});
        } else {
            setFormData({...formData, chronicConditions: [...current, condition]});
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Historial Preliminar</h3>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Para agilizar su atención médica</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Síntoma Principal</label>
                        <textarea 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all h-24"
                            placeholder="Describa qué siente (ej. Fiebre, dolor de cabeza...)"
                            value={formData.mainSymptom}
                            onChange={e => setFormData({...formData, mainSymptom: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Inicio de Síntomas</label>
                            <input 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                placeholder="Ej: Hace 2 días"
                                value={formData.onsetDuration}
                                onChange={e => setFormData({...formData, onsetDuration: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Nivel Dolor (0-10)</label>
                            <input 
                                type="number" min="0" max="10"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                value={formData.painLevel}
                                onChange={e => setFormData({...formData, painLevel: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Padecimientos Crónicos</label>
                        <div className="flex flex-wrap gap-2">
                            {commonConditions.map(c => (
                                <button 
                                    key={c}
                                    onClick={() => toggleCondition(c)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 transition-all ${formData.chronicConditions.includes(c) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Alergias Conocidas</label>
                        <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                            placeholder="Medicamentos, alimentos..."
                            value={formData.allergies}
                            onChange={e => setFormData({...formData, allergies: e.target.value})}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white">
                    <button 
                        onClick={handleSubmit}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                        Enviar y Entrar a Sala <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: HOME LAB REQUEST MODAL ---
const HomeLabRequestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (req: { name: string, address: string, studies: string[], phone: string, coordinates: { lat: number, lng: number } }) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    // ... same implementation ...
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
    
    // Simulación de selección de coordenadas
    const [isMapMode, setIsMapMode] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);

    const toggleStudy = (studyName: string) => {
        if (selectedStudies.includes(studyName)) {
            setSelectedStudies(prev => prev.filter(s => s !== studyName));
        } else {
            setSelectedStudies(prev => [...prev, studyName]);
        }
    };

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Simulación: Obtener coordenadas relativas al contenedor para el demo
        // En producción se usaría Google Maps API o Leaflet
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Mock coordinates for demo
        setSelectedCoords({ lat: x / rect.width, lng: y / rect.height });
    };

    const handleSubmit = () => {
        if (!name || !address || selectedStudies.length === 0) return alert("Complete los datos obligatorios y seleccione al menos un estudio.");
        onSubmit({ 
            name, 
            address, 
            studies: selectedStudies, 
            phone,
            coordinates: selectedCoords || { lat: 0.5, lng: 0.5 } // Default center if not selected
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><Ambulance size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Laboratorio a Domicilio</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Solicitud de Unidad Móvil</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {/* VISUAL MAP SELECTOR (MOCK) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1 flex justify-between">
                            <span>Ubicación Exacta</span>
                            <span className="text-rose-500">{selectedCoords ? 'Ubicación Fijada' : 'Toque el mapa para fijar'}</span>
                        </label>
                        <div 
                            className="relative w-full h-40 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 cursor-crosshair group"
                            onClick={handleMapClick}
                        >
                             <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-99.1332,19.4326,12,0/600x300?access_token=YOUR_TOKEN')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all"></div>
                             {/* Fallback pattern if image fails */}
                             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
                             
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-slate-400 uppercase bg-white/80 px-2 py-1 rounded shadow-sm">
                                    {selectedCoords ? '' : 'Click para fijar ubicación'}
                                </span>
                             </div>

                             {selectedCoords && (
                                 <div 
                                    className="absolute w-8 h-8 -ml-4 -mt-8 text-rose-600 animate-bounce drop-shadow-xl"
                                    style={{ left: `${selectedCoords.lat * 100}%`, top: `${selectedCoords.lng * 100}%` }}
                                 >
                                     <MapPin size={32} fill="currentColor" className="text-rose-600"/>
                                 </div>
                             )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Datos de Ubicación</h4>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Nombre del Paciente</label>
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase outline-none" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Dirección Escrita</label>
                            <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none h-20 resize-none" placeholder="Calle, Número, Colonia, Referencias..." value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Teléfono de Contacto</label>
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Para coordinar llegada..." value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2"><FlaskConical size={14}/> Selección de Estudios</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {LAB_CATALOG.map((lab) => {
                                const isSelected = selectedStudies.includes(lab.name);
                                return (
                                    <button 
                                    key={lab.name}
                                    onClick={() => toggleStudy(lab.name)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-amber-700' : 'text-slate-600'}`}>{lab.name}</span>
                                        {isSelected ? <CheckCircle2 size={14} className="text-amber-600"/> : <Plus size={14} className="text-slate-300"/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white">
                    <button 
                        onClick={handleSubmit}
                        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                        Solicitar Unidad <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sub-component: Vista de Paciente / Enfermería
const PatientView: React.FC<{ 
    onQuickRequest: () => void; 
    onDoctorSelect: (doc: DoctorInfo) => void; 
    onViewProfile: (doc: DoctorInfo) => void;
    onHomeLabRequest: () => void; // New Handler
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    doctorsList: DoctorInfo[];
    notes?: ClinicalNote[];
}> = ({ onQuickRequest, onDoctorSelect, onViewProfile, onHomeLabRequest, searchTerm, setSearchTerm, doctorsList, notes }) => {
    const [patientTab, setPatientTab] = useState<'services' | 'history'>('services');

    const filteredDoctors = doctorsList.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get Active Requests from LocalStorage (Simple Hack for Demo Consistency)
    const activeRequests = React.useMemo(() => {
        const reqs: HomeServiceRequest[] = JSON.parse(localStorage.getItem('med_home_req_v1') || '[]');
        return reqs.filter(r => r.requestedBy === 'Portal Paciente' && r.status !== 'Finalizado');
    }, []);

    // Filter patient history (Mocked based on local storage)
    const myHistory = useMemo(() => {
        return notes?.filter(n => n.patientId.startsWith('TELE-')) || []; // Show demo tele-notes
    }, [notes]);

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Navigation Tabs for Patient */}
            <div className="flex justify-center no-print">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                    <button 
                        onClick={() => setPatientTab('services')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${patientTab === 'services' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Stethoscope size={14} className="inline mr-2"/> Consultas y Servicios
                    </button>
                    <button 
                        onClick={() => setPatientTab('history')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${patientTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <FileText size={14} className="inline mr-2"/> Mi Historial
                    </button>
                </div>
            </div>

            {patientTab === 'services' && (
                <>
                {/* ACTIVE REQUESTS TRACKER (PATIENT PORTAL) */}
                {activeRequests.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-600">
                            <Truck className="animate-pulse" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Mis Solicitudes en Curso</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeRequests.map(req => (
                                <div key={req.id} className="bg-white border border-rose-100 rounded-[2rem] p-6 shadow-lg flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-rose-500"></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Estatus: {req.status}</p>
                                        <h4 className="text-lg font-black text-slate-900 uppercase">Toma de Muestras</h4>
                                        {req.assignedStaff ? (
                                            <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                                                <UserCheck size={14}/> Atiende: {req.assignedStaff}
                                            </p>
                                        ) : (
                                            <p className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1">
                                                <Clock size={14}/> Esperando asignación...
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                                        <FlaskConical size={20}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hero Section - Selección Rápida */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* 1. ATENCIÓN INMEDIATA */}
                    <div 
                        onClick={onQuickRequest}
                        className="md:col-span-1 bg-gradient-to-br from-rose-500 to-rose-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-rose-200 cursor-pointer hover:scale-[1.02] transition-transform group relative overflow-hidden flex flex-col justify-between min-h-[300px]"
                    >
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                            <Zap size={200} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <Activity size={28} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Atención Inmediata</h2>
                            <p className="text-[11px] font-medium opacity-90 leading-relaxed">
                                Conectar con el primer médico disponible. Ideal para consultas rápidas.
                            </p>
                        </div>
                        <div className="relative z-10 mt-6">
                            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg group-hover:bg-rose-50 transition-colors">
                                Solicitar <ArrowRight size={14}/>
                            </span>
                        </div>
                    </div>

                    {/* 2. LABORATORIO A DOMICILIO (NUEVO) */}
                    <div 
                        onClick={onHomeLabRequest}
                        className="md:col-span-1 bg-gradient-to-br from-amber-400 to-amber-500 rounded-[3rem] p-8 text-white shadow-2xl shadow-amber-200 cursor-pointer hover:scale-[1.02] transition-transform group relative overflow-hidden flex flex-col justify-between min-h-[300px]"
                    >
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                            <Ambulance size={200} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <FlaskConical size={28} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Laboratorio a Domicilio</h2>
                            <p className="text-[11px] font-medium opacity-90 leading-relaxed">
                                Solicite toma de muestras en la comodidad de su hogar. Unidades móviles listas.
                            </p>
                        </div>
                        <div className="relative z-10 mt-6">
                            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg group-hover:bg-amber-50 transition-colors">
                                Agendar Unidad <ArrowRight size={14}/>
                            </span>
                        </div>
                    </div>

                    {/* 3. DIRECTORIO */}
                    <div className="md:col-span-1 bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl cursor-default relative overflow-hidden flex flex-col justify-center text-center space-y-6 min-h-[300px]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070')] opacity-10 bg-cover bg-center"></div>
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-xl font-black uppercase tracking-tight">Directorio de Especialistas</h2>
                            <p className="text-[10px] text-slate-400">Busque por nombre o especialidad.</p>
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <input 
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 outline-none focus:bg-white/20 transition-all font-bold text-xs"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Directorio Médico */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Stethoscope className="text-blue-600" />
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Médicos Disponibles</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDoctors.map((doc, idx) => (
                            <div key={idx} className={`bg-white rounded-[2.5rem] p-6 border-2 transition-all hover:shadow-xl group flex flex-col justify-between ${doc.isPremium ? 'border-amber-200 shadow-amber-100/50' : 'border-slate-100 shadow-sm'}`}>
                                <div className="cursor-pointer" onClick={() => onViewProfile(doc)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 uppercase overflow-hidden">
                                            {doc.avatarUrl ? <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover"/> : doc.name.charAt(0)}
                                        </div>
                                        {/* Status Badge */}
                                        {doc.isOnline ? (
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border border-emerald-200 animate-pulse">
                                                <Wifi size={12}/> En Línea
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border border-slate-200">
                                                <WifiOff size={12}/> Ocupado
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase leading-tight group-hover:text-blue-700 transition-colors">{doc.name}</h4>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">{doc.specialty}</p>
                                    <p className="text-[9px] text-slate-400 mt-2 line-clamp-2">{doc.institution} • {doc.hospital}</p>
                                    
                                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star size={12} fill="currentColor" />
                                            <span className="text-xs font-bold text-slate-700">{doc.rating}</span>
                                            <span className="text-[9px] text-slate-400">({doc.reviewCount})</span>
                                        </div>
                                        <div className="text-right flex-1">
                                            <span className="text-xs font-black text-emerald-600">${doc.price}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mt-6">
                                    <button 
                                        onClick={() => onViewProfile(doc)}
                                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all"
                                    >
                                        Ver Perfil
                                    </button>
                                    <button 
                                        onClick={() => onDoctorSelect(doc)}
                                        disabled={!doc.isOnline}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${doc.isOnline ? 'bg-slate-900 text-white hover:bg-blue-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        Agendar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}

            {/* HISTORY TAB */}
            {patientTab === 'history' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <History size={24} className="text-blue-600"/>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Historial de Atenciones</h3>
                    </div>

                    {myHistory.length > 0 ? (
                        <div className="space-y-4">
                            {myHistory.map(note => (
                                <div key={note.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                            {note.type.includes('Lab') ? <FlaskConical size={24}/> : <FileText size={24}/>}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{note.date}</p>
                                            <h4 className="text-lg font-black text-slate-900 uppercase">{note.type}</h4>
                                            <p className="text-xs text-blue-600 font-bold uppercase mt-1">Dr. {note.author}</p>
                                        </div>
                                    </div>
                                    <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
                                        <Download size={14}/> Descargar PDF
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <FileText size={48} className="mx-auto text-slate-300 mb-4"/>
                            <p className="text-slate-400 font-black uppercase text-xs">Aún no tienes historial registrado</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TelemedicineDashboard: React.FC<TelemedicineDashboardProps & { 
    onAddHomeRequest?: (req: HomeServiceRequest) => void,
    doctorsList: DoctorInfo[],
    onDoctorStatusChange?: (cedula: string, isOnline: boolean) => void,
    currentUser?: DoctorInfo,
    notes?: ClinicalNote[]
}> = ({ 
    patients, 
    onUpdateStatus, 
    onAddPatient, 
    onAddHomeRequest, 
    doctorsList = MOCK_DOCTORS, 
    onDoctorStatusChange, 
    currentUser, 
    notes = [] 
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'doctor' | 'patient'>('doctor'); // Switcher State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDoctor, setViewingDoctor] = useState<DoctorInfo | null>(null);
  
  // Tab for Doctor View
  const [doctorTab, setDoctorTab] = useState<'dashboard' | 'finance'>('dashboard');

  // STATES FOR DOCTOR SESSION & AVAILABILITY
  const [doctorSession, setDoctorSession] = useState({
      isConnected: false,
      username: '',
      isAvailable: false // Default to false (Busy/Offline)
  });

  // States for Modals
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showHomeLabModal, setShowHomeLabModal] = useState(false); // NEW STATE
  const [showTriagePreview, setShowTriagePreview] = useState<Patient | null>(null);
  const [selectedDoctorForRequest, setSelectedDoctorForRequest] = useState<DoctorInfo | undefined>(undefined);

  // ... (Existing helper functions remain same) ...
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const today = getLocalDateString();

  const doctorViewPatients = useMemo(() => {
    return patients.filter(p => {
        const isTele = p.assignedModule === ModuleType.TELEMEDICINE;
        const isToday = p.scheduledDate === today;
        const isActiveStatus = [PatientStatus.ONLINE_WAITING, PatientStatus.ONLINE_IN_CALL, PatientStatus.ONLINE_QUEUE].includes(p.status);
        const isPending = p.status !== PatientStatus.ATTENDED;
        return isTele && (isToday || isActiveStatus) && isPending;
    });
  }, [patients, today]);

  const generalQueue = doctorViewPatients.filter(p => p.status === PatientStatus.ONLINE_QUEUE);
  const myScheduledPatients = doctorViewPatients.filter(p => p.status !== PatientStatus.ONLINE_QUEUE);

  const handleStartCall = (p: Patient) => {
      if (p.teleIntake && p.status === PatientStatus.ONLINE_QUEUE) {
          setShowTriagePreview(p);
      } else {
        if (window.confirm(`¿Iniciar sesión de telemedicina con ${p.name}?`)) {
            onUpdateStatus(p.id, PatientStatus.ONLINE_IN_CALL);
            navigate(`/telemedicine/${p.id}`);
        }
      }
  };

  const confirmTriageAccept = () => {
      if (!showTriagePreview) return;
      onUpdateStatus(showTriagePreview.id, PatientStatus.ONLINE_IN_CALL);
      navigate(`/telemedicine/${showTriagePreview.id}`);
      setShowTriagePreview(null);
  };

  const initiatePatientRequest = (type: 'quick' | 'specific', doctor?: DoctorInfo) => {
      setSelectedDoctorForRequest(doctor);
      setShowIntakeModal(true);
  };

  const handleIntakeSubmit = (intakeData: TeleIntakeForm) => {
      if (!onAddPatient) return;
      const isQuick = !selectedDoctorForRequest;
      const newPatient: Patient = {
          id: `TELE-${Date.now().toString().slice(-6)}`,
          name: 'PACIENTE DEMOSTRACIÓN', // En app real, vendría del perfil logueado
          curp: 'DEMO010101HM',
          age: 30,
          sex: 'O',
          bloodType: 'O+',
          allergies: intakeData.allergies ? [intakeData.allergies] : [],
          status: isQuick ? PatientStatus.ONLINE_QUEUE : PatientStatus.ONLINE_WAITING,
          priority: PriorityLevel.MEDIUM,
          assignedModule: ModuleType.TELEMEDICINE,
          scheduledDate: today,
          lastVisit: today,
          appointmentTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          reason: isQuick ? `SÍNTOMA: ${intakeData.mainSymptom}` : `Teleconsulta con Dr. ${selectedDoctorForRequest?.name}`,
          chronicDiseases: intakeData.chronicConditions,
          agendaStatus: AgendaStatus.ARRIVED_ON_TIME,
          assignedDoctorId: selectedDoctorForRequest?.cedula,
          assignedDoctorName: selectedDoctorForRequest?.name,
          teleIntake: intakeData 
      };
      onAddPatient(newPatient);
      setShowIntakeModal(false);
      setSelectedDoctorForRequest(undefined);
      alert(isQuick ? "Solicitud enviada. Un médico revisará su historial breve y lo atenderá pronto." : `Cita agendada con Dr. ${selectedDoctorForRequest?.name}.`);
      setViewMode('doctor'); 
  };

  const handleHomeLabSubmit = (reqData: { name: string, address: string, studies: string[], phone: string, coordinates: { lat: number, lng: number } }) => {
      if (!onAddHomeRequest) return;
      const newRequest: HomeServiceRequest = {
          id: `HLAB-${Date.now()}`,
          patientId: `P-${Date.now().toString().slice(-4)}`, // Temp ID
          patientName: reqData.name,
          patientAddress: reqData.address,
          patientPhone: reqData.phone,
          requestedBy: 'Portal Paciente',
          requestedDate: new Date().toISOString(),
          status: 'Pendiente',
          studies: reqData.studies,
          coordinates: reqData.coordinates // Save Coordinates
      };
      onAddHomeRequest(newRequest);
      setShowHomeLabModal(false);
      alert("Solicitud de laboratorio a domicilio enviada. Un coordinador logístico se pondrá en contacto pronto.");
  };

  const getOriginBadge = (p: Patient) => {
      if (p.assignedDoctorId) {
          return <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-violet-200">Cita Agendada</span>;
      }
      return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-rose-200">Atención Inmediata</span>;
  };

  const handleDoctorLogin = () => {
      if(!doctorSession.username) return alert("Ingrese su ID de Telemedicina");
      setDoctorSession({ ...doctorSession, isConnected: true, isAvailable: true }); // Auto available on login
      
      // Update global availability
      if (onDoctorStatusChange && currentUser) onDoctorStatusChange(currentUser.cedula, true);
  };

  const handleDoctorLogout = () => {
      if(window.confirm("¿Desea cerrar su sesión de la red de telemedicina? (No cerrará sesión en el sistema principal)")) {
          setDoctorSession({ isConnected: false, username: '', isAvailable: false });
          // Update global availability
          if (onDoctorStatusChange && currentUser) onDoctorStatusChange(currentUser.cedula, false);
      }
  };

  // Toggle Availability
  const toggleAvailability = (available: boolean) => {
      setDoctorSession({...doctorSession, isAvailable: available});
      if (onDoctorStatusChange && currentUser) onDoctorStatusChange(currentUser.cedula, available);
  };

  if (viewingDoctor) {
      return (
        <DoctorPublicProfile 
            doctor={viewingDoctor} 
            onBack={() => setViewingDoctor(null)} 
            onSchedule={() => { setViewingDoctor(null); initiatePatientRequest('specific', viewingDoctor); }} 
        />
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-20">
      
      {/* Header & Role Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-violet-600 uppercase text-[10px] font-black tracking-[0.3em]">
             <Wifi size={16}/>
             <span>Plataforma e-Health</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              {viewMode === 'doctor' ? 'Consola Médica' : 'Portal del Paciente'}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
            {/* ... (Existing Doctor Profile Button) ... */}
            {viewMode === 'doctor' && (
                <button 
                    onClick={() => navigate('/settings', { state: { initialTab: 'public_profile' } })}
                    className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <User size={14} className="text-slate-500 group-hover:text-blue-700"/>
                    </div>
                    <span>Mi Perfil Público</span>
                </button>
            )}

            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2">
                <button 
                    onClick={() => setViewMode('doctor')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'doctor' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Briefcase size={14} /> Vista Médico
                </button>
                <button 
                    onClick={() => setViewMode('patient')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'patient' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <UserCheck size={14} /> Vista Paciente
                </button>
            </div>
        </div>
      </div>

      {viewMode === 'patient' ? (
          <PatientView 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onQuickRequest={() => initiatePatientRequest('quick')}
            onDoctorSelect={(doc) => initiatePatientRequest('specific', doc)}
            onViewProfile={(doc) => setViewingDoctor(doc)}
            onHomeLabRequest={() => setShowHomeLabModal(true)} 
            doctorsList={doctorsList}
            notes={notes}
          />
      ) : (
          /* VISTA MÉDICO ... (Sin cambios aquí) ... */
          !doctorSession.isConnected ? (
              /* PANTALLA DE CONEXIÓN DEL MÉDICO */
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 text-center max-w-lg w-full space-y-8">
                      <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-xl text-white">
                          <Lock size={32} />
                      </div>
                      <div className="space-y-2">
                          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Acceso Telemedicina</h2>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ingrese su ID para conectarse a la red</p>
                      </div>
                      <div className="space-y-4">
                          <div className="relative">
                             <input 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-sm font-black uppercase outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                                placeholder="ID USUARIO / CÉDULA"
                                value={doctorSession.username}
                                onChange={e => setDoctorSession({...doctorSession, username: e.target.value})}
                             />
                          </div>
                          <button 
                             onClick={handleDoctorLogin}
                             className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                          >
                             <LogIn size={16} /> Conectar a Red
                          </button>
                      </div>
                  </div>
              </div>
          ) : (
            /* DASHBOARD DEL MÉDICO CONECTADO */
            <>
                {/* ... (Existing Doctor Dashboard Content) ... */}
                <div className={`p-4 rounded-3xl border-2 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 transition-all ${doctorSession.isAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="flex items-center gap-4 pl-2">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-colors ${doctorSession.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {doctorSession.isAvailable ? <Wifi size={24}/> : <WifiOff size={24}/>}
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${doctorSession.isAvailable ? 'text-emerald-700' : 'text-rose-700'}`}>
                                Estado de Conexión: {doctorSession.isAvailable ? 'EN LÍNEA' : 'OCUPADO / FUERA DE LÍNEA'}
                            </p>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Dr. {doctorSession.username}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 hidden md:block">
                                Control:
                            </span>
                            <button 
                            onClick={() => toggleAvailability(true)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${doctorSession.isAvailable ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                            <CheckCircle2 size={14}/> Disponible
                            </button>
                            <button 
                            onClick={() => toggleAvailability(false)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${!doctorSession.isAvailable ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                            <BellOff size={14}/> Ocupado
                            </button>
                        </div>
                        
                        <div className="w-px h-8 bg-slate-200 mx-2"></div>
                        
                        <button 
                            onClick={() => setDoctorTab(doctorTab === 'finance' ? 'dashboard' : 'finance')}
                            className={`p-3 rounded-2xl transition-all shadow-md ${doctorTab === 'finance' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                            title="Mi Billetera"
                        >
                            <Wallet size={18}/>
                        </button>
                        
                        <button 
                            onClick={handleDoctorLogout}
                            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-700 transition-all shadow-md ml-2"
                            title="Cerrar Sesión de Red"
                        >
                            <LogOut size={18}/>
                        </button>
                    </div>
                </div>

                {doctorTab === 'finance' ? (
                    /* FINANCE TAB */
                    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4">
                        <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl text-center space-y-6 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-20 bg-indigo-600/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                             <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 relative z-10">Saldo Total Acumulado</p>
                             <p className="text-7xl font-black relative z-10">${currentUser?.walletBalance?.toFixed(2) || '0.00'}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase relative z-10">Disponible para retiro inmediato</p>
                             
                             <button className="px-10 py-4 bg-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center gap-3 mx-auto relative z-10">
                                 <DollarSign size={16}/> Retirar Fondos
                             </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Historial de Ingresos</h3>
                            <div className="space-y-4">
                                {myScheduledPatients.filter(p => p.status === PatientStatus.ATTENDED).map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black uppercase text-slate-900">{p.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{p.lastVisit}</p>
                                        </div>
                                        <p className="text-sm font-black text-emerald-600">+$800.00</p>
                                    </div>
                                ))}
                                {myScheduledPatients.filter(p => p.status === PatientStatus.ATTENDED).length === 0 && (
                                    <div className="text-center py-10 opacity-30">
                                        <p className="text-xs font-black uppercase text-slate-400">Sin movimientos recientes</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* DASHBOARD GRID */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* COLUMNA IZQUIERDA: MIS CITAS (Agenda Digital Personal) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
                                        <Calendar size={18} className="text-violet-600"/> Mi Agenda Digital
                                    </h3>
                                    <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-lg text-[10px] font-black">{myScheduledPatients.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                                <th className="px-8 py-5">Hora</th>
                                                <th className="px-6 py-5">Paciente</th>
                                                <th className="px-6 py-5">Motivo</th>
                                                <th className="px-6 py-5 text-center">Estado</th>
                                                <th className="px-8 py-5 text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {myScheduledPatients.map(p => (
                                                <tr key={p.id} className="hover:bg-violet-50/30 transition-all group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 bg-slate-100 w-fit px-3 py-1.5 rounded-xl border border-slate-200">
                                                            <Clock size={12} className="text-slate-500"/>
                                                            <span className="text-xs font-black text-slate-700">{p.appointmentTime}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-black text-xs">{p.name.charAt(0)}</div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-900 uppercase">{p.name}</p>
                                                                <div className="flex gap-2 mt-0.5">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Exp: {p.id}</p>
                                                                    {getOriginBadge(p)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6"><p className="text-[10px] font-medium text-slate-500 uppercase italic truncate max-w-[150px]">{p.reason}</p></td>
                                                    <td className="px-6 py-6 text-center">
                                                        {p.status === PatientStatus.ONLINE_WAITING ? (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase border border-emerald-200 animate-pulse">
                                                                <Wifi size={12}/> En Sala
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase border border-slate-200">
                                                                <Clock size={12}/> Programado
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button 
                                                            onClick={() => handleStartCall(p)}
                                                            disabled={!doctorSession.isAvailable || (p.status !== PatientStatus.ONLINE_WAITING && p.status !== PatientStatus.ONLINE_IN_CALL)}
                                                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ml-auto ${doctorSession.isAvailable && (p.status === PatientStatus.ONLINE_WAITING || p.status === PatientStatus.ONLINE_IN_CALL) ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                                        >
                                                            {doctorSession.isAvailable ? <><Play size={14} fill="currentColor" /> Iniciar</> : 'Ocupado'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {myScheduledPatients.length === 0 && (
                                                <tr><td colSpan={5} className="py-20 text-center opacity-30 text-xs font-black uppercase text-slate-400 tracking-widest">No hay citas directas agendadas</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: SALA DE ESPERA GENERAL (UBER STYLE) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className={`rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col h-full border-b-8 border-rose-500 transition-colors ${doctorSession.isAvailable ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 border-slate-300'}`}>
                                {doctorSession.isAvailable && <div className="absolute right-0 top-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>}
                                
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                            <Zap className={doctorSession.isAvailable ? "text-rose-500 animate-pulse" : "text-slate-300"} /> Sala de Urgencia
                                        </h3>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${doctorSession.isAvailable ? 'text-slate-400' : 'text-slate-300'}`}>Bolsa General de Pacientes</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-xl text-xs font-black ${doctorSession.isAvailable ? 'bg-rose-600' : 'bg-slate-200 text-slate-400'}`}>{generalQueue.length}</span>
                                </div>

                                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar relative z-10 pr-2">
                                    {generalQueue.map(p => (
                                        <div key={p.id} className={`p-5 rounded-3xl backdrop-blur-sm transition-all group border ${doctorSession.isAvailable ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-white border-slate-200 opacity-50'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm font-black uppercase">{p.name}</p>
                                                    <p className={`text-[9px] font-bold uppercase mt-1 ${doctorSession.isAvailable ? 'text-rose-400' : 'text-slate-400'}`}>Espera: 5 min</p>
                                                </div>
                                                {doctorSession.isAvailable && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>}
                                            </div>
                                            <p className={`text-[10px] italic mb-4 line-clamp-2 ${doctorSession.isAvailable ? 'text-slate-300' : 'text-slate-400'}`}>"{p.teleIntake?.mainSymptom || p.reason}"</p>
                                            
                                            {p.teleIntake && (
                                                <div className="flex gap-2 mb-4">
                                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${doctorSession.isAvailable ? 'bg-white/10' : 'bg-slate-100 text-slate-500'}`}>Dolor: {p.teleIntake.painLevel}/10</span>
                                                    {p.teleIntake.chronicConditions.length > 0 && <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${doctorSession.isAvailable ? 'bg-white/10 text-amber-300' : 'bg-slate-100 text-slate-400'}`}>Crónicos</span>}
                                                </div>
                                            )}

                                            <button 
                                                onClick={() => handleStartCall(p)}
                                                disabled={!doctorSession.isAvailable}
                                                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${doctorSession.isAvailable ? 'bg-white text-slate-900 hover:bg-rose-500 hover:text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                            >
                                                {p.teleIntake ? 'Ver Triage y Atender' : 'Atender Ahora'} <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {generalQueue.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-40 opacity-30">
                                            <Coffee size={40} className="mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Sala General Vacía</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
          )
      )}

      <IntakeModal isOpen={showIntakeModal} onClose={() => setShowIntakeModal(false)} onSubmit={handleIntakeSubmit} />
      <HomeLabRequestModal isOpen={showHomeLabModal} onClose={() => setShowHomeLabModal(false)} onSubmit={handleHomeLabSubmit} />
      
      {/* MODAL PREVISUALIZACIÓN TRIAGE (PARA MÉDICO) */}
      {showTriagePreview && (
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 relative">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center"><ClipboardList size={28}/></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Ficha de Triage Digital</h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{showTriagePreview.name}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowTriagePreview(null)} className="p-3 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="p-6 bg-slate-50 rounded-3xl space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Síntoma Principal</p>
                          <p className="text-lg font-black text-slate-900 leading-snug">"{showTriagePreview.teleIntake?.mainSymptom}"</p>
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[10px] font-black text-slate-500 uppercase">Inicio</span>
                              <span className="font-bold text-slate-900">{showTriagePreview.teleIntake?.onsetDuration}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[10px] font-black text-slate-500 uppercase">Escala Dolor</span>
                              <span className={`font-black ${showTriagePreview.teleIntake?.painLevel! > 7 ? 'text-rose-600' : 'text-slate-900'}`}>{showTriagePreview.teleIntake?.painLevel}/10</span>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4 mb-10">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Antecedentes Reportados</h4>
                      <div className="flex gap-4">
                          <div className="flex-1 p-4 border border-slate-100 rounded-2xl">
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Crónicos</p>
                              <p className="text-xs font-black uppercase text-slate-700">{showTriagePreview.teleIntake?.chronicConditions.join(', ') || 'Ninguno'}</p>
                          </div>
                          <div className="flex-1 p-4 border border-slate-100 rounded-2xl">
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Alergias</p>
                              <p className="text-xs font-black uppercase text-rose-600">{showTriagePreview.teleIntake?.allergies || 'Negadas'}</p>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <button onClick={() => setShowTriagePreview(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                      <button onClick={confirmTriageAccept} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                          <CheckCircle2 size={18}/> Aceptar y Conectar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TelemedicineDashboard;
