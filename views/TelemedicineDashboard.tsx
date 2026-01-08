
import React, { useState, useMemo, useEffect } from 'react';
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
  History, Navigation, Bot, Send, Headphones, CalendarCheck, FileSignature, AlertOctagon, Check, Smartphone, Home,
  Pill, ChevronLeft, TrendingUp, Menu, Info, Heart, ShoppingBag, Package, Watch, Award, BookOpen, ToggleRight, ToggleLeft,
  MapPinned, Syringe, CalendarDays, Siren, Bike
} from 'lucide-react';
import { Patient, PatientStatus, AgendaStatus, PriorityLevel, ModuleType, DoctorInfo, TeleIntakeForm, HomeServiceRequest, ClinicalNote, StaffMember } from '../types';
import { MOCK_DOCTORS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TelemedicineDashboardProps {
  patients: Patient[];
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onAddPatient?: (patient: Patient) => void;
  onAddHomeRequest?: (req: HomeServiceRequest) => void;
  onUpdateHomeRequest?: (req: HomeServiceRequest) => void; 
  doctorsList?: DoctorInfo[]; 
  onDoctorStatusChange?: (cedula: string, isOnline: boolean) => void; 
  currentUser?: DoctorInfo; 
  notes?: ClinicalNote[]; 
  homeRequests?: HomeServiceRequest[];
  staffList?: StaffMember[]; 
}

// --- CONSTANTES LOCALES PARA SERVICIOS ---
const PHARMACY_ITEMS = [
    { id: 1, name: 'Paracetamol 500mg', price: 50, category: 'Dolor', image: '💊' },
    { id: 2, name: 'Ibuprofeno 400mg', price: 85, category: 'Dolor', image: '💊' },
    { id: 3, name: 'Loratadina 10mg', price: 40, category: 'Alergias', image: '🤧' },
    { id: 4, name: 'Omeprazol 20mg', price: 65, category: 'Gástrico', image: '🤢' },
    { id: 5, name: 'Kit Primeros Auxilios', price: 250, category: 'Material', image: '⛑️' },
    { id: 6, name: 'Termómetro Digital', price: 150, category: 'Equipo', image: '🌡️' },
    { id: 7, name: 'Vitaminas C + Zinc', price: 120, category: 'Suplementos', image: '🍊' },
    { id: 8, name: 'Jarabe para Tos', price: 95, category: 'Respiratorio', image: '🥣' },
];

const LAB_PACKAGES = [
    { id: 1, name: 'Check-up General', includes: 'BH, QS(6), EGO', price: 450, time: '24 hrs' },
    { id: 2, name: 'Perfil Diabético', includes: 'Glucosa, HbA1c, Microalbúmina', price: 600, time: '24 hrs' },
    { id: 3, name: 'Perfil Tiroideo', includes: 'TSH, T3, T4', price: 550, time: '48 hrs' },
    { id: 4, name: 'Prueba COVID-19', includes: 'Antígenos Nasofaríngeo', price: 300, time: '2 hrs' },
    { id: 5, name: 'Perfil Lipídico', includes: 'Colesterol, Triglicéridos, HDL/LDL', price: 400, time: '24 hrs' },
];

const MOCK_IOT_DATA = [
    { time: '08:00', hr: 72, o2: 98 },
    { time: '09:00', hr: 75, o2: 97 },
    { time: '10:00', hr: 70, o2: 99 },
    { time: '11:00', hr: 78, o2: 98 },
    { time: '12:00', hr: 82, o2: 96 },
    { time: '13:00', hr: 74, o2: 98 },
    { time: '14:00', hr: 76, o2: 97 },
];

// Helper to generate time slots based on schedule
const generateTimeSlots = (schedule: DoctorInfo['schedule'], date: Date) => {
    if (!schedule) return [];
    
    // Check if day is available
    const dayOfWeek = date.getDay(); // 0 = Sunday
    if (!schedule.days.includes(dayOfWeek)) return [];

    const slots = [];
    const [startH, startM] = schedule.startHour.split(':').map(Number);
    const [endH, endM] = schedule.endHour.split(':').map(Number);
    
    let current = new Date(date);
    current.setHours(startH, startM, 0, 0);
    
    const end = new Date(date);
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
        const timeString = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        slots.push(timeString);
        current.setMinutes(current.getMinutes() + schedule.slotDuration);
    }
    
    return slots;
};

// --- SUB-COMPONENT: PORTAL DEL PACIENTE (RESPONSIVO) ---
const PatientAppView: React.FC<{
    currentUser: DoctorInfo;
    doctors: DoctorInfo[];
    myAppointments: Patient[];
    notes: ClinicalNote[]; 
    onBookAppointment: (doc: DoctorInfo | null, time: string, intake: TeleIntakeForm, date?: string) => void;
    onRequestHomeService: (type: 'lab' | 'specialist' | 'pharmacy', details?: any) => void;
    onGoBack: () => void;
    currentWaitingPatient?: Patient; 
}> = ({ currentUser, doctors, myAppointments, notes, onBookAppointment, onRequestHomeService, onGoBack, currentWaitingPatient }) => {
    const [appTab, setAppTab] = useState<'home' | 'doctors' | 'history' | 'vitals'>('home');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Flow States
    const [flowStep, setFlowStep] = useState<'none' | 'profile' | 'schedule' | 'consent' | 'intake' | 'waiting'>('none');
    const [selectedDoc, setSelectedDoc] = useState<DoctorInfo | null>(null);
    const [consentSigned, setConsentSigned] = useState(false);
    const [intakeForm, setIntakeForm] = useState<TeleIntakeForm>({
        mainSymptom: '', onsetDuration: '', painLevel: 0, chronicConditions: [], allergies: '', currentMedication: '', notes: '', submittedAt: ''
    });

    // Scheduling State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Modales de Servicios
    const [activeServiceModal, setActiveServiceModal] = useState<'none' | 'pharmacy' | 'lab' | 'home_visit'>('none');
    
    // Estados internos de los servicios
    const [cart, setCart] = useState<any[]>([]);
    const [pharmacyCategory, setPharmacyCategory] = useState('Todos');
    const [homeVisitAddress, setHomeVisitAddress] = useState('');
    const [pharmacyAddress, setPharmacyAddress] = useState('');
    const [labAddress, setLabAddress] = useState('');
    const [labSearch, setLabSearch] = useState('');

    // Cross-Selling States
    const [addLabToVisit, setAddLabToVisit] = useState(false);
    const [addDoctorToLab, setAddDoctorToLab] = useState(false);

    useEffect(() => {
        if (currentWaitingPatient) {
            setFlowStep('waiting');
        }
    }, [currentWaitingPatient]);

    const handleStartImmediate = () => {
        setSelectedDoc(null); 
        // Immediate assumes today/now
        setSelectedDate(new Date());
        setSelectedSlot(new Date().toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'}));
        setFlowStep('consent');
    };

    const handleSelectDoctor = (doc: DoctorInfo) => {
        setSelectedDoc(doc);
        setFlowStep('profile');
    };

    const handleProceedToSchedule = () => {
        setFlowStep('schedule');
    };

    const handleConfirmSchedule = () => {
        if (!selectedSlot) return alert("Seleccione una hora");
        setFlowStep('consent');
    };

    const handleConsent = () => {
        if (!consentSigned) return alert("Debe aceptar el consentimiento informado.");
        setFlowStep('intake');
    };

    const handleSubmitIntake = () => {
        if (!intakeForm.mainSymptom) return alert("Describa su síntoma principal.");
        
        onBookAppointment(
            selectedDoc, 
            selectedSlot || new Date().toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'}), 
            { ...intakeForm, submittedAt: new Date().toISOString() },
            selectedDate.toISOString().split('T')[0]
        );
        setFlowStep('waiting');
    };

    // Service Actions
    const handlePharmacyOrder = () => {
        if(cart.length === 0) return alert("El carrito está vacío");
        if(!pharmacyAddress) return alert("Por favor ingrese la dirección de entrega.");
        
        onRequestHomeService('pharmacy', { items: cart, address: pharmacyAddress });
        alert("Pedido de farmacia enviado. Un repartidor se pondrá en contacto.");
        setCart([]);
        setPharmacyAddress('');
        setActiveServiceModal('none');
    };

    const handleLabOrder = (pkg: any) => {
        if(!labAddress) return alert("Por favor ingrese la dirección para la toma de muestra.");
        
        onRequestHomeService('lab', { 
            package: pkg, 
            address: labAddress,
            includeDoctor: addDoctorToLab // Cross-sell
        });
        alert(`Solicitud de ${pkg.name} enviada. ${addDoctorToLab ? 'Incluye valoración médica.' : ''}`);
        setLabAddress('');
        setAddDoctorToLab(false);
        setActiveServiceModal('none');
    };

    const handleHomeVisitOrder = () => {
        if(!homeVisitAddress) return alert("Ingrese su dirección");
        onRequestHomeService('specialist', { 
            address: homeVisitAddress,
            includeLab: addLabToVisit // Cross-sell
        });
        alert(`Solicitud de médico a domicilio enviada. ${addLabToVisit ? 'Incluye toma de muestras.' : ''}`);
        setHomeVisitAddress('');
        setAddLabToVisit(false);
        setActiveServiceModal('none');
    };

    // --- RENDER CONTENT ---
    const renderContent = () => {
        
        // --- 1. DOCTOR PROFILE ---
        if (flowStep === 'profile' && selectedDoc) {
            return (
                <div className="space-y-6 animate-in slide-in-from-right-4 max-w-3xl mx-auto">
                     <button onClick={() => setFlowStep('none')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4 font-bold text-xs uppercase">
                        <ChevronLeft size={16}/> Volver al directorio
                     </button>
                     
                     <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100">
                         <div className="h-48 bg-slate-100 relative">
                             {selectedDoc.coverUrl ? (
                                 <img src={selectedDoc.coverUrl} className="w-full h-full object-cover" alt="Cover"/>
                             ) : (
                                 <div className="w-full h-full bg-gradient-to-r from-[#0057B8] to-blue-600"></div>
                             )}
                         </div>
                         <div className="px-10 pb-10">
                             <div className="flex justify-between items-end -mt-16 mb-6">
                                 <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-2xl relative">
                                     {selectedDoc.avatarUrl ? (
                                         <img src={selectedDoc.avatarUrl} className="w-full h-full object-cover rounded-[1.2rem]" alt="Avatar"/>
                                     ) : (
                                         <div className="w-full h-full bg-slate-200 rounded-[1.2rem] flex items-center justify-center text-slate-400 font-black text-4xl">{selectedDoc.name.charAt(0)}</div>
                                     )}
                                     {selectedDoc.isVerified && (
                                         <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-full border-4 border-white" title="Médico Verificado">
                                             <BadgeCheck size={20} fill="currentColor"/>
                                         </div>
                                     )}
                                 </div>
                                 <div className="flex gap-2">
                                     <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                                         <span className="text-xl font-black text-amber-500 flex items-center gap-1">{selectedDoc.rating || 5.0} <Star size={16} fill="currentColor"/></span>
                                         <span className="text-[9px] font-bold text-slate-400 uppercase">Calificación</span>
                                     </div>
                                     <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                                         <span className="text-xl font-black text-emerald-600">${selectedDoc.price}</span>
                                         <span className="text-[9px] font-bold text-slate-400 uppercase">Consulta</span>
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="space-y-6">
                                 <div>
                                     <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                         {selectedDoc.name}
                                     </h2>
                                     <p className="text-sm font-bold text-[#0057B8] uppercase tracking-widest">{selectedDoc.specialty}</p>
                                     {selectedDoc.university && <p className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1 mt-1"><GraduationCap size={12}/> {selectedDoc.university}</p>}
                                     <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Cédula Prof: {selectedDoc.cedula}</p>
                                 </div>

                                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                     <h3 className="text-xs font-black uppercase text-slate-400 mb-2">Acerca del Especialista</h3>
                                     <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                         {selectedDoc.biography || "Especialista certificado con amplia experiencia en el manejo de pacientes. Comprometido con la salud y el bienestar integral."}
                                     </p>
                                 </div>

                                 <button onClick={handleProceedToSchedule} className="w-full py-5 bg-[#0057B8] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                                     <CalendarCheck size={18}/> Ver Disponibilidad
                                 </button>
                             </div>
                         </div>
                     </div>
                </div>
            );
        }

        // --- 1.5. SCHEDULE PICKER ---
        if (flowStep === 'schedule' && selectedDoc) {
            const availableSlots = generateTimeSlots(selectedDoc.schedule, selectedDate);
            return (
                <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-4">
                     <button onClick={() => setFlowStep('profile')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-bold text-xs uppercase">
                        <ChevronLeft size={16}/> Volver al perfil
                     </button>
                     
                     <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200">
                         <div className="text-center mb-6">
                             <h2 className="text-2xl font-black text-slate-900 uppercase">Seleccionar Horario</h2>
                             <p className="text-xs text-slate-400 uppercase font-bold mt-1">{selectedDoc.name}</p>
                         </div>

                         <div className="mb-8">
                             <div className="flex items-center justify-between mb-4">
                                 <button onClick={() => {
                                     const prev = new Date(selectedDate);
                                     prev.setDate(prev.getDate() - 1);
                                     // Prevent past dates
                                     if(prev >= new Date(new Date().setHours(0,0,0,0))) setSelectedDate(prev);
                                 }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><ChevronLeft/></button>
                                 
                                 <div className="text-center">
                                     <p className="text-lg font-black uppercase text-slate-800">
                                         {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                                     </p>
                                     <p className="text-[10px] font-bold text-blue-600 uppercase">
                                         {selectedDate.toDateString() === new Date().toDateString() ? 'Hoy' : ''}
                                     </p>
                                 </div>

                                 <button onClick={() => {
                                     const next = new Date(selectedDate);
                                     next.setDate(next.getDate() + 1);
                                     setSelectedDate(next);
                                 }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><ChevronRight/></button>
                             </div>

                             {availableSlots.length > 0 ? (
                                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                     {availableSlots.map(slot => (
                                         <button 
                                            key={slot}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`py-3 px-2 rounded-xl text-xs font-black transition-all ${selectedSlot === slot ? 'bg-[#0057B8] text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-600 hover:bg-blue-50'}`}
                                         >
                                             {slot}
                                         </button>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="py-12 text-center text-slate-400 font-bold uppercase text-xs bg-slate-50 rounded-2xl">
                                     No hay horarios disponibles este día
                                 </div>
                             )}
                         </div>

                         <button 
                             onClick={handleConfirmSchedule}
                             disabled={!selectedSlot}
                             className="w-full py-5 bg-[#0057B8] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             Confirmar Cita
                         </button>
                     </div>
                </div>
            );
        }

        // --- 2. CONSENTIMIENTO ---
        if (flowStep === 'consent') {
            return (
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
                    <button onClick={() => setFlowStep(selectedDoc ? 'schedule' : 'none')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-bold text-xs uppercase">
                        <ChevronLeft size={16}/> Cancelar
                    </button>
                    
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 text-[#0057B8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck size={32}/>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase">Consentimiento Informado</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">NOM-024-SSA3-2012</p>
                        </div>
                        
                        <div className="h-64 overflow-y-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 text-xs text-slate-600 font-medium leading-relaxed mb-6 custom-scrollbar text-justify">
                            <p className="mb-4">1. Entiendo que la telemedicina implica el uso de comunicaciones electrónicas para permitir a los proveedores de atención médica en diferentes ubicaciones compartir información médica individual con el fin de mejorar la atención al paciente.</p>
                            <p className="mb-4">2. Autorizo la transmisión de mis datos personales, imágenes y audio de forma encriptada (AES-256) para fines de diagnóstico y tratamiento.</p>
                            <p className="mb-4">3. Reconozco que la consulta remota tiene limitaciones en la exploración física y que, en caso de emergencia real, debo acudir a un hospital.</p>
                            <p>4. Acepto el uso de firma electrónica simple para la validación de recetas y solicitudes de estudios generadas en esta sesión.</p>
                        </div>

                        <div 
                            onClick={() => setConsentSigned(!consentSigned)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${consentSigned ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${consentSigned ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                                {consentSigned && <Check size={14}/>}
                            </div>
                            <span className="text-xs font-black uppercase">He leído y acepto los términos legales</span>
                        </div>

                        <button 
                            onClick={handleConsent} 
                            disabled={!consentSigned}
                            className="w-full mt-8 py-5 bg-[#0057B8] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            );
        }

        // --- 3. INTAKE ---
        if (flowStep === 'intake') {
            return (
                <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-4">
                    <div className="text-center">
                         <h2 className="text-3xl font-black text-slate-900 uppercase">Cuéntanos qué sientes</h2>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Esta información será revisada por el médico antes de la llamada</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Síntoma Principal</label>
                            <textarea 
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-[#0057B8] transition-all h-32 resize-none"
                                placeholder="Ej: Tengo fiebre y dolor de garganta desde ayer..."
                                value={intakeForm.mainSymptom}
                                onChange={e => setIntakeForm({...intakeForm, mainSymptom: e.target.value})}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nivel de Dolor (1-10)</label>
                                <input 
                                    type="range" min="0" max="10" 
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0057B8]"
                                    value={intakeForm.painLevel}
                                    onChange={e => setIntakeForm({...intakeForm, painLevel: parseInt(e.target.value)})}
                                />
                                <div className="text-center font-black text-xl text-[#0057B8]">{intakeForm.painLevel}</div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio de Síntomas</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                                    placeholder="Ej: Hace 2 días"
                                    value={intakeForm.onsetDuration}
                                    onChange={e => setIntakeForm({...intakeForm, onsetDuration: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2 flex items-center gap-1"><AlertOctagon size={12}/> Alergias</label>
                            <input 
                                className="w-full p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-sm font-bold text-rose-900 outline-none placeholder:text-rose-300"
                                placeholder="Escriba sus alergias o 'Ninguna'..."
                                value={intakeForm.allergies}
                                onChange={e => setIntakeForm({...intakeForm, allergies: e.target.value})}
                            />
                        </div>

                        <button onClick={handleSubmitIntake} className="w-full py-5 bg-[#0057B8] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                            Solicitar Atención <ArrowRight size={18}/>
                        </button>
                    </div>
                </div>
            );
        }

        // --- 4. WAITING ROOM ---
        if (flowStep === 'waiting' && currentWaitingPatient) {
            const status = currentWaitingPatient.status;
            let message = "Esperando médico...";
            let subMessage = "Por favor no cierre esta ventana.";
            let icon = <Clock size={64} className="text-white animate-pulse"/>;
            let bgClass = "bg-[#0057B8]";

            if (status === PatientStatus.ONLINE_REVIEWING) {
                message = "El Médico ha aceptado su solicitud";
                subMessage = "Está leyendo su historial clínico y motivo de consulta.";
                icon = <FileText size={64} className="text-white animate-bounce"/>;
                bgClass = "bg-indigo-600";
            } else if (status === PatientStatus.ONLINE_IN_CALL) {
                message = "Llamada Entrante";
                subMessage = "Conectando sala segura...";
                icon = <Video size={64} className="text-white animate-ping"/>;
                bgClass = "bg-emerald-600";
            }

            return (
                <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl mb-8 ${bgClass}`}>
                        {icon}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase text-center max-w-md">{message}</h2>
                    <p className="text-slate-500 font-medium mt-4 text-center max-w-sm">{subMessage}</p>
                    {status === PatientStatus.ONLINE_IN_CALL && (
                        <button className="mt-8 px-10 py-4 bg-emerald-500 text-white rounded-full font-black uppercase tracking-widest shadow-xl animate-pulse">
                            Unirse a la Videollamada
                        </button>
                    )}
                </div>
            );
        }

        // --- DEFAULT TABS ---
        
        // 1. SIGNOS VITALES (IoT)
        if (appTab === 'vitals') {
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => setAppTab('home')} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={24}/></button>
                        <h2 className="text-2xl font-black text-slate-900">Mis Signos Vitales</h2>
                    </div>

                    <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-xl relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Dispositivo Conectado</p>
                                <h3 className="text-xl font-black uppercase flex items-center gap-2 mt-1"><Watch size={20}/> Apple Watch Series 8</h3>
                            </div>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                             <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Heart size={12} className="text-rose-500"/> Frecuencia Cardíaca</p>
                                 <p className="text-4xl font-black">72 <span className="text-xs font-bold text-slate-400">LPM</span></p>
                             </div>
                             <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Activity size={12} className="text-blue-400"/> Oxigenación</p>
                                 <p className="text-4xl font-black">98 <span className="text-xs font-bold text-slate-400">%</span></p>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm h-80">
                        <h4 className="text-xs font-black uppercase text-slate-500 mb-6">Tendencia (Últimas 6 horas)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_IOT_DATA}>
                                <defs>
                                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false}/>
                                <YAxis fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']}/>
                                <Tooltip contentStyle={{borderRadius:'16px', border:'none'}}/>
                                <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // 2. DOCTORS DIRECTORY
        if (appTab === 'doctors') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setAppTab('home')} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                            <ChevronLeft size={24} className="text-slate-600"/>
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Directorio de Especialistas</h2>
                            <p className="text-sm text-slate-500">Seleccione un médico para agendar su teleconsulta.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(doc => (
                            <div key={doc.cedula} onClick={() => handleSelectDoctor(doc)} className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl hover:border-blue-300 transition-all group cursor-pointer relative overflow-hidden">
                                {doc.isVerified && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1"><BadgeCheck size={12}/> Verificado</div>}
                                <div className="flex justify-between items-start mb-4 mt-2">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-bold text-2xl group-hover:bg-[#0057B8] group-hover:text-white transition-colors overflow-hidden">
                                        {doc.avatarUrl ? <img src={doc.avatarUrl} className="w-full h-full object-cover"/> : doc.name.charAt(0)}
                                    </div>
                                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Disponible
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 uppercase leading-tight">{doc.name}</h3>
                                <p className="text-xs font-bold text-[#0057B8] uppercase tracking-widest mt-1">{doc.specialty}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Star size={12} className="text-amber-400 fill-current"/>
                                    <span className="text-xs font-bold text-slate-600">{doc.rating || 5.0}</span>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Consulta</p>
                                        <p className="text-lg font-black text-slate-900">${doc.price}</p>
                                    </div>
                                    <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest group-hover:bg-[#0057B8] transition-all shadow-lg">
                                        Ver Perfil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // --- VISTA PRINCIPAL (HOME) ---
        return (
            <div className="space-y-10 animate-in fade-in">
                {/* Hero Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#0057B8] to-blue-700 rounded-[3rem] shadow-2xl text-white p-8 md:p-12">
                    <div className="relative z-10 max-w-2xl">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-sm border border-white/10">
                            Salud Digital 24/7
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">¿Cómo te sientes hoy?</h2>
                        <p className="text-blue-100 text-sm md:text-base font-medium mb-8 max-w-lg leading-relaxed">
                            Conecta con especialistas certificados, monitorea tus signos vitales y accede a tu historial médico de forma segura.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={handleStartImmediate} className="px-8 py-4 bg-white text-[#0057B8] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl flex items-center gap-2 animate-pulse">
                                <Video size={18}/> Atención Inmediata
                            </button>
                            <button onClick={() => setAppTab('doctors')} className="px-8 py-4 bg-blue-800/50 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 border border-white/20">
                                <Calendar size={18}/> Agendar Cita
                            </button>
                        </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                        <Activity size={400} />
                    </div>
                    <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Servicios Rápidos: BOTONES GRANDES Y COLORIDOS */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Zap className="text-amber-500" size={24}/> Servicios Disponibles
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* MÉDICO YA (URGENCIA) */}
                            <button 
                                onClick={handleStartImmediate} 
                                className="relative overflow-hidden group p-6 h-48 rounded-[2.5rem] bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl hover:shadow-rose-300/50 transition-all hover:scale-[1.02] text-left"
                            >
                                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <Siren size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <Video size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Médico Ya</h3>
                                        <p className="text-sm font-medium opacity-90">Atención Inmediata 24/7</p>
                                    </div>
                                </div>
                            </button>

                            {/* MIS SIGNOS (IoT) */}
                            <button 
                                onClick={() => setAppTab('vitals')}
                                className="relative overflow-hidden group p-6 h-48 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-xl hover:shadow-cyan-300/50 transition-all hover:scale-[1.02] text-left"
                            >
                                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <Activity size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <Watch size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Mis Signos</h3>
                                        <p className="text-sm font-medium opacity-90">Conectar Wearables</p>
                                    </div>
                                </div>
                            </button>

                            {/* LABORATORIO */}
                            <button 
                                onClick={() => setActiveServiceModal('lab')}
                                className="relative overflow-hidden group p-6 h-48 rounded-[2.5rem] bg-gradient-to-br from-violet-600 to-purple-500 text-white shadow-xl hover:shadow-violet-300/50 transition-all hover:scale-[1.02] text-left"
                            >
                                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <FlaskConical size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <FlaskConical size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Laboratorio</h3>
                                        <p className="text-sm font-medium opacity-90">Toma a Domicilio</p>
                                    </div>
                                </div>
                            </button>

                            {/* VISITA MÉDICA */}
                            <button 
                                onClick={() => setActiveServiceModal('home_visit')}
                                className="relative overflow-hidden group p-6 h-48 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-xl hover:shadow-emerald-300/50 transition-all hover:scale-[1.02] text-left"
                            >
                                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <Stethoscope size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <MapPinned size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Visita Médica</h3>
                                        <p className="text-sm font-medium opacity-90">Doctor en Casa</p>
                                    </div>
                                </div>
                            </button>

                            {/* FARMACIA */}
                            <button 
                                onClick={() => setActiveServiceModal('pharmacy')}
                                className="relative overflow-hidden group p-6 h-48 rounded-[2.5rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl hover:shadow-orange-300/50 transition-all hover:scale-[1.02] text-left"
                            >
                                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <ShoppingBag size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <Pill size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Farmacia</h3>
                                        <p className="text-sm font-medium opacity-90">Envío Exprés</p>
                                    </div>
                                </div>
                            </button>

                             {/* AMBULANCIA (Ejemplo adicional o espacio libre) */}
                             <button 
                                className="relative overflow-hidden group p-6 h-48 rounded-[2.5rem] bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 transition-all hover:scale-[1.02] text-left flex flex-col items-center justify-center gap-4"
                            >
                                <Plus size={48} className="opacity-50"/>
                                <p className="text-xs font-black uppercase tracking-widest">Más Servicios</p>
                            </button>

                        </div>
                    </div>

                    {/* Próximas Citas y Historial */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-100 p-1 rounded-2xl">
                            <button 
                                onClick={() => setAppTab('home')} 
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${appTab !== 'history' ? 'bg-white shadow text-[#0057B8]' : 'text-slate-500'}`}
                            >
                                Próximas
                            </button>
                            <button 
                                onClick={() => setAppTab('history')} 
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${appTab === 'history' ? 'bg-white shadow text-[#0057B8]' : 'text-slate-500'}`}
                            >
                                Recetas e Historial
                            </button>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm min-h-[200px]">
                            {appTab === 'history' ? (
                                // HISTORIAL DE ATENCIONES Y RECETAS
                                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {notes.filter(n => n.patientId === 'DEMO-PATIENT' || n.type.includes('Teleconsulta') || n.type.includes('Receta')).map(note => (
                                        <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-sm transition-all">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{note.type.split('(')[0]}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold">{note.date.split(',')[0]}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 line-clamp-1">{note.author}</p>
                                            </div>
                                            <button className="p-2 bg-white rounded-xl text-slate-400 hover:text-[#0057B8] shadow-sm"><Download size={16}/></button>
                                        </div>
                                    ))}
                                    {notes.length === 0 && (
                                        <div className="text-center py-10 opacity-40">
                                            <History size={32} className="mx-auto mb-2 text-slate-300"/>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Sin historial clínico</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // CITAS PRÓXIMAS
                                myAppointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {myAppointments.map(appt => (
                                            <div key={appt.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer">
                                                <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-slate-100">
                                                    <span className="text-[9px] font-black uppercase text-rose-500">{new Date(appt.scheduledDate || new Date()).toLocaleString('es-MX', {month:'short'})}</span>
                                                    <span className="text-lg font-black text-slate-900">{new Date(appt.scheduledDate || new Date()).getDate()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-slate-900 truncate">{appt.assignedDoctorName || 'Médico General'}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium truncate">{appt.appointmentTime || 'Pendiente'} • {appt.status}</p>
                                                    {appt.status === PatientStatus.ONLINE_WAITING && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-md">
                                                            En Espera
                                                        </span>
                                                    )}
                                                    {appt.status === PatientStatus.ONLINE_REVIEWING && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase rounded-md animate-pulse">
                                                            Médico Leyendo...
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                    <ChevronRight size={16}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                                        <Calendar size={48} className="mb-2 text-slate-300"/>
                                        <p className="text-xs font-bold text-slate-400">No tienes citas próximas</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* --- MODALES DE SERVICIOS --- */}
                
                {/* 1. FARMACIA */}
                {activeServiceModal === 'pharmacy' && (
                    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 flex flex-col max-h-[85vh]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <ShoppingBag size={24} className="text-amber-500"/> Farmacia Express
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Entrega en 60 minutos</p>
                                </div>
                                <button onClick={() => setActiveServiceModal('none')} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2">
                                {['Todos', 'Dolor', 'Alergias', 'Gástrico', 'Material', 'Equipo'].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setPharmacyCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${pharmacyCategory === cat ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-8 flex-1 overflow-hidden">
                                {/* Product Grid */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                                    {PHARMACY_ITEMS.filter(i => pharmacyCategory === 'Todos' || i.category === pharmacyCategory).map(item => (
                                        <div key={item.id} className="p-4 border border-slate-100 rounded-3xl flex flex-col justify-between hover:border-amber-400 hover:shadow-lg transition-all group bg-white">
                                            <div className="text-center mb-4">
                                                <span className="text-4xl">{item.image}</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.category}</p>
                                                <p className="text-xs font-black uppercase text-slate-800 leading-tight line-clamp-2">{item.name}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-50">
                                                <p className="text-lg font-black text-emerald-600">${item.price}</p>
                                                <button onClick={() => setCart([...cart, item])} className="p-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-amber-500 transition-all"><Plus size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Cart Sidebar */}
                                <div className="w-80 bg-slate-50 rounded-3xl p-6 flex flex-col border border-slate-200">
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Tu Pedido</h4>
                                    <div className="space-y-4 mb-4">
                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                            <input 
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-amber-400 transition-all"
                                                placeholder="Dirección de entrega..."
                                                value={pharmacyAddress}
                                                onChange={e => setPharmacyAddress(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{item.image}</span>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[9px] font-bold uppercase truncate w-24">{item.name}</p>
                                                        <p className="text-[8px] font-bold text-emerald-600">${item.price}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500"><X size={14}/></button>
                                            </div>
                                        ))}
                                        {cart.length === 0 && <div className="text-center py-10 opacity-30 text-xs font-black uppercase">Carrito vacío</div>}
                                    </div>
                                    <div className="pt-4 border-t border-slate-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                                            <span className="text-2xl font-black text-slate-900">${cart.reduce((a,b)=>a+b.price,0)}</span>
                                        </div>
                                        <button onClick={handlePharmacyOrder} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                                            <ShoppingBag size={18}/> Realizar Pedido
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. LABORATORIO */}
                {activeServiceModal === 'lab' && (
                    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 flex flex-col max-h-[85vh]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <FlaskConical size={24} className="text-rose-500"/> Laboratorio
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Toma de muestras a domicilio</p>
                                </div>
                                <button onClick={() => setActiveServiceModal('none')} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input 
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                                        placeholder="Dirección para toma de muestra..."
                                        value={labAddress}
                                        onChange={e => setLabAddress(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <input 
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-rose-200"
                                        placeholder="Buscar estudios..."
                                        value={labSearch}
                                        onChange={(e) => setLabSearch(e.target.value)}
                                    />
                                </div>
                                {/* Cross-sell: Add Doctor Visit */}
                                <div onClick={() => setAddDoctorToLab(!addDoctorToLab)} className={`p-4 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all ${addDoctorToLab ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <Stethoscope size={18} className={addDoctorToLab ? 'text-indigo-600' : 'text-slate-400'}/>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase ${addDoctorToLab ? 'text-indigo-900' : 'text-slate-500'}`}>Añadir Valoración Médica</p>
                                            <p className="text-[8px] text-slate-400 font-bold">Un médico acompañará al técnico</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${addDoctorToLab ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                        {addDoctorToLab && <Check size={12}/>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Paquetes Recomendados</p>
                                {LAB_PACKAGES.filter(p => p.name.toLowerCase().includes(labSearch.toLowerCase())).map(pkg => (
                                    <div key={pkg.id} className="p-5 border border-slate-100 rounded-3xl flex justify-between items-center hover:shadow-lg hover:border-rose-200 transition-all bg-white group">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black uppercase text-slate-900">{pkg.name}</p>
                                                <span className="bg-rose-50 text-rose-600 text-[8px] px-2 py-0.5 rounded font-black uppercase">{pkg.time}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1 font-medium">{pkg.includes}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-rose-600">${pkg.price}</p>
                                            <button onClick={() => handleLabOrder(pkg)} className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-rose-600 transition-all shadow-md">Solicitar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. VISITA MÉDICA */}
                {activeServiceModal === 'home_visit' && (
                    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 flex flex-col border border-white/20">
                            <div className="text-center mb-8 relative">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Stethoscope size={32}/>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Médico en Casa</h3>
                                <p className="text-xs text-slate-500 font-bold mt-2 uppercase">Llegada estimada: 45-60 min</p>
                            </div>
                            
                            <div className="space-y-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><MapPinned size={10}/> Dirección de Visita</label>
                                    <div className="relative">
                                        <textarea 
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium resize-none h-24 outline-none focus:border-emerald-400 focus:bg-white transition-all shadow-inner"
                                            placeholder="Calle, Número, Colonia, Referencias..."
                                            value={homeVisitAddress}
                                            onChange={e => setHomeVisitAddress(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Cross-sell: Add Lab */}
                                <div onClick={() => setAddLabToVisit(!addLabToVisit)} className={`p-4 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all ${addLabToVisit ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <FlaskConical size={18} className={addLabToVisit ? 'text-rose-600' : 'text-slate-400'}/>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase ${addLabToVisit ? 'text-rose-900' : 'text-slate-500'}`}>Añadir Toma de Muestras</p>
                                            <p className="text-[8px] text-slate-400 font-bold">El médico tomará muestras básicas</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${addLabToVisit ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'}`}>
                                        {addLabToVisit && <Check size={12}/>}
                                    </div>
                                </div>

                                <div className="bg-emerald-50 p-4 rounded-2xl flex items-center justify-between border border-emerald-100">
                                    <span className="text-[10px] font-black uppercase text-emerald-800">Costo Estimado</span>
                                    <span className="text-xl font-black text-emerald-600">${800 + (addLabToVisit ? 450 : 0)}.00</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setActiveServiceModal('none')} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                                <button onClick={handleHomeVisitOrder} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                    Confirmar <ArrowRight size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar Responsivo */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-8 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0057B8] rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Mi Salud</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portal del Paciente</p>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => setAppTab('home')} className={`text-xs font-bold uppercase tracking-widest hover:text-[#0057B8] transition-colors ${appTab === 'home' ? 'text-[#0057B8]' : 'text-slate-500'}`}>Inicio</button>
                        <button onClick={() => setAppTab('doctors')} className={`text-xs font-bold uppercase tracking-widest hover:text-[#0057B8] transition-colors ${appTab === 'doctors' ? 'text-[#0057B8]' : 'text-slate-500'}`}>Doctores</button>
                        <button onClick={() => setAppTab('vitals')} className={`text-xs font-bold uppercase tracking-widest hover:text-[#0057B8] transition-colors ${appTab === 'vitals' ? 'text-[#0057B8]' : 'text-slate-500'}`}>Mis Signos</button>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-900">Paciente Demo</p>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase">Activo</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                                <User size={20}/>
                            </div>
                            <button onClick={onGoBack} className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all" title="Cerrar Sesión">
                                <LogOut size={20}/>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600">
                        <Menu size={24} />
                    </button>
                </div>
                
                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                         <button onClick={() => {setAppTab('home'); setMobileMenuOpen(false);}} className="text-left p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700">Inicio</button>
                         <button onClick={() => {setAppTab('doctors'); setMobileMenuOpen(false);}} className="text-left p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700">Directorio Médico</button>
                         <button onClick={() => {setAppTab('vitals'); setMobileMenuOpen(false);}} className="text-left p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700">Mis Signos</button>
                         <div className="border-t border-slate-100 pt-2">
                             <button onClick={onGoBack} className="w-full text-left p-3 hover:bg-rose-50 rounded-xl text-sm font-bold text-rose-600 flex items-center gap-2">
                                <LogOut size={16}/> Cerrar Sesión
                             </button>
                         </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

const TelemedicineDashboard: React.FC<TelemedicineDashboardProps> = ({ patients, onUpdateStatus, onAddPatient, onAddHomeRequest, onUpdateHomeRequest, doctorsList = MOCK_DOCTORS, currentUser, homeRequests = [], staffList = [], notes = [] }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'landing' | 'doctor' | 'patient_app'>('landing');
  
  // DOCTOR VIEW STATES
  const [docTab, setDocTab] = useState<'waiting' | 'agenda' | 'finance'>('waiting');
  const [viewingPatientIntake, setViewingPatientIntake] = useState<Patient | null>(null);
  
  // Doctor Availability Toggle
  const [isDoctorAvailable, setIsDoctorAvailable] = useState(true);

  // ... (Doctor View Logic Remains Similar) ...
  // --- FILTERS ---
  const waitingRoom = patients.filter(p => p.status === PatientStatus.ONLINE_QUEUE);
  const myScheduled = patients.filter(p => p.status === PatientStatus.ONLINE_WAITING && p.assignedDoctorId === currentUser?.cedula);
  const activePatients = patients.filter(p => p.status === PatientStatus.ONLINE_REVIEWING || p.status === PatientStatus.ONLINE_IN_CALL);
  
  const myConsultations = useMemo(() => {
      return patients.filter(p => (p.status === PatientStatus.ATTENDED || p.status === PatientStatus.ONLINE_IN_CALL) && p.assignedModule === ModuleType.TELEMEDICINE);
  }, [patients]);

  const totalEarnings = useMemo(() => {
      return myConsultations.length * (currentUser?.price || 800);
  }, [myConsultations, currentUser]);

  const earningsData = [
      { name: 'Lun', value: 4000 }, { name: 'Mar', value: 3000 },
      { name: 'Mie', value: 5000 }, { name: 'Jue', value: 2000 },
      { name: 'Vie', value: 6000 }, { name: 'Sab', value: 8000 },
      { name: 'Dom', value: 1000 }
  ];

  // --- ACTIONS (DOCTOR) ---
  const handleReviewIntake = (patient: Patient) => {
      onUpdateStatus(patient.id, PatientStatus.ONLINE_REVIEWING);
      setViewingPatientIntake(patient);
  };

  const handleStartCall = () => {
      if (viewingPatientIntake) {
          onUpdateStatus(viewingPatientIntake.id, PatientStatus.ONLINE_IN_CALL);
          navigate(`/telemedicine/${viewingPatientIntake.id}`);
      }
  };

  // --- ACTIONS (PATIENT) ---
  const handlePatientBook = (doc: DoctorInfo | null, time: string, intake: TeleIntakeForm, date?: string) => {
      if (onAddPatient) {
          const isImmediate = !doc;
          const newP: Patient = {
              id: `APP-${Date.now()}`,
              name: 'Paciente Demo',
              age: 30, sex: 'M', curp: '', bloodType: '', allergies: [intake.allergies], chronicDiseases: intake.chronicConditions,
              status: isImmediate ? PatientStatus.ONLINE_QUEUE : PatientStatus.ONLINE_WAITING,
              priority: intake.painLevel > 7 ? PriorityLevel.HIGH : PriorityLevel.ROUTINE,
              assignedModule: ModuleType.TELEMEDICINE,
              scheduledDate: date || new Date().toISOString().split('T')[0],
              appointmentTime: time,
              reason: isImmediate ? 'Atención Inmediata' : 'Cita Programada',
              assignedDoctorId: doc?.cedula,
              assignedDoctorName: doc?.name,
              lastVisit: '',
              teleIntake: intake
          };
          onAddPatient(newP);
      }
  };

  const handlePatientRequestHome = (type: 'lab' | 'specialist' | 'pharmacy', details?: any) => {
      if (onAddHomeRequest) {
          let reason = '';
          if (type === 'lab') reason = `Solicitud de Lab: ${details.package?.name}`;
          else if (type === 'pharmacy') reason = `Pedido Farmacia: ${details.items?.length} items`;
          else reason = 'Visita Médica a Domicilio';

          onAddHomeRequest({
              id: `REQ-${Date.now()}`,
              patientId: 'DEMO-PATIENT',
              patientName: 'Paciente Demo',
              patientAddress: details?.address || 'Dirección Registrada en App',
              requestedBy: 'Paciente (App)',
              requestedDate: new Date().toISOString(),
              status: 'Pendiente',
              studies: type === 'lab' ? [details.package.name] : [],
              notes: reason,
              hasDoctorVisit: details?.includeDoctor || type === 'specialist',
              hasLabCollection: details?.includeLab || type === 'lab',
              hasPharmacyDelivery: type === 'pharmacy'
          });
      }
  };

  // --- LANDING VIEW ---
  if (viewMode === 'landing') {
      return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in zoom-in-95">
              <div className="text-center space-y-4 mb-12">
                  <div className="w-24 h-24 bg-[#0057B8] rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl mb-6">
                      <Wifi size={48} className="text-white"/>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Telemedicina MX</h1>
                  <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Seleccione su perfil de acceso</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                  <button 
                    onClick={() => setViewMode('doctor')}
                    className="group relative overflow-hidden bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl hover:shadow-2xl hover:border-blue-500 transition-all text-left"
                  >
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-blue-50 text-[#0057B8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <Stethoscope size={32}/>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 uppercase">Soy Médico</h3>
                          <p className="text-sm text-slate-500 mt-2 font-medium">Gestión de consultas, agenda y finanzas profesionales.</p>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Activity size={200}/>
                      </div>
                  </button>

                  <button 
                    onClick={() => setViewMode('patient_app')}
                    className="group relative overflow-hidden bg-slate-900 p-10 rounded-[3rem] shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all text-left"
                  >
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <Smartphone size={32}/>
                          </div>
                          <h3 className="text-2xl font-black text-white uppercase">Soy Paciente</h3>
                          <p className="text-sm text-slate-400 mt-2 font-medium">Agendar citas, solicitar estudios y ver historial.</p>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-5 text-white group-hover:opacity-10 transition-opacity">
                          <User size={200}/>
                      </div>
                  </button>
              </div>
          </div>
      );
  }

  // --- PATIENT APP VIEW ---
  if (viewMode === 'patient_app') {
      const myActive = patients.find(p => p.name === 'Paciente Demo' && (p.status === PatientStatus.ONLINE_QUEUE || p.status === PatientStatus.ONLINE_WAITING || p.status === PatientStatus.ONLINE_REVIEWING || p.status === PatientStatus.ONLINE_IN_CALL));
      
      const patientNotes = notes.filter(n => n.patientId === 'DEMO-PATIENT' || (myActive && n.patientId === myActive.id));

      return (
          <PatientAppView 
              currentUser={currentUser || MOCK_DOCTORS[0]} 
              doctors={doctorsList}
              myAppointments={patients.filter(p => p.name === 'Paciente Demo')} 
              notes={patientNotes}
              onBookAppointment={handlePatientBook}
              onRequestHomeService={handlePatientRequestHome}
              onGoBack={() => setViewMode('landing')}
              currentWaitingPatient={myActive}
          />
      );
  }

  // --- DOCTOR MANAGEMENT VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
         <div>
             <button onClick={() => setViewMode('landing')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 mb-2">
                 <ArrowLeft size={12}/> Volver al Inicio
             </button>
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Portal del Especialista</h2>
             <div className="flex items-center gap-3 mt-1">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14}/> Dr. {currentUser?.name || 'Médico'}
                </p>
                {/* DOCTOR AVAILABILITY TOGGLE */}
                <button 
                    onClick={() => setIsDoctorAvailable(!isDoctorAvailable)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${isDoctorAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                >
                    {isDoctorAvailable ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Disponible
                            <ToggleRight size={16}/>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div> No Disponible
                            <ToggleLeft size={16}/>
                        </>
                    )}
                </button>
             </div>
         </div>
         
         <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
             <button onClick={() => setDocTab('waiting')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${docTab === 'waiting' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Sala de Espera</button>
             <button onClick={() => setDocTab('finance')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${docTab === 'finance' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Finanzas</button>
         </div>
      </div>

      {docTab === 'waiting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* WAITING ROOMS */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-3">
                        <Clock size={18} className="text-amber-500"/> Pacientes en Espera
                    </h3>
                    <div className="flex gap-2">
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black">Bolsa: {waitingRoom.length}</span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black">Mis Citas: {myScheduled.length}</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {[...myScheduled, ...waitingRoom].map(p => (
                        <div key={p.id} className={`p-6 bg-slate-50 hover:bg-white border hover:border-blue-200 rounded-[2rem] shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${p.assignedDoctorId ? 'border-blue-200' : 'border-slate-200'}`}>
                            <div className={`absolute top-0 left-0 w-1 h-full ${p.assignedDoctorId ? 'bg-blue-500' : 'bg-amber-400'}`}></div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-lg font-black text-slate-700 border border-slate-100 shadow-sm">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">{p.name}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><History size={10}/> {p.appointmentTime || 'Sin Hora'}</span>
                                            {p.assignedDoctorId ? 
                                                <span className="text-[8px] bg-blue-100 text-blue-700 px-2 rounded-full font-black uppercase">Agendado</span> : 
                                                <span className="text-[8px] bg-amber-100 text-amber-700 px-2 rounded-full font-black uppercase">Espera General</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleReviewIntake(p)}
                                    disabled={!isDoctorAvailable}
                                    className={`px-6 py-3 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 group-hover:scale-105 ${isDoctorAvailable ? 'bg-[#0057B8] hover:bg-slate-900' : 'bg-slate-300 cursor-not-allowed'}`}
                                >
                                    <FileText size={14}/> Atender
                                </button>
                            </div>
                        </div>
                    ))}
                    {waitingRoom.length === 0 && myScheduled.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Coffee size={48} className="mb-4 text-slate-400"/>
                            <p className="text-xs font-black text-slate-400 uppercase">Sala de espera vacía</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ACTIVE CALLS / INTAKE REVIEW */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl h-fit min-h-[500px] flex flex-col">
                <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-emerald-400">
                    <Activity size={16}/> En Curso / Revisión
                </h3>
                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* INTAKE REVIEW MODAL (Embedded) */}
                    {viewingPatientIntake && (
                        <div className="bg-white text-slate-900 rounded-3xl p-6 border-4 border-amber-400 animate-in zoom-in-95 h-full flex flex-col">
                             <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                                 <div>
                                     <h4 className="text-sm font-black uppercase">Revisión de Caso</h4>
                                     <p className="text-[10px] text-slate-500 font-bold uppercase">Expediente Rápido</p>
                                 </div>
                                 <button onClick={() => setViewingPatientIntake(null)} className="p-1 hover:bg-slate-100 rounded"><X size={16}/></button>
                             </div>
                             
                             <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4">
                                 {/* Triage Info */}
                                 <div className="bg-slate-50 p-4 rounded-2xl">
                                     <h5 className="text-[10px] font-black uppercase text-blue-600 mb-2">Triage Actual</h5>
                                     <div className="space-y-1 text-xs">
                                         <p><span className="font-bold">Paciente:</span> {viewingPatientIntake.name}</p>
                                         <p><span className="font-bold">Motivo:</span> {viewingPatientIntake.teleIntake?.mainSymptom}</p>
                                         <p><span className="font-bold">Dolor:</span> {viewingPatientIntake.teleIntake?.painLevel}/10</p>
                                         <p><span className="font-bold">Alergias:</span> {viewingPatientIntake.teleIntake?.allergies || 'Negadas'}</p>
                                     </div>
                                 </div>

                                 {/* Historial Clínico (Mini Expediente) */}
                                 <div>
                                     <h5 className="text-[10px] font-black uppercase text-violet-600 mb-2 flex items-center gap-2"><History size={12}/> Notas Previas</h5>
                                     <div className="space-y-2">
                                         {notes.filter(n => n.patientId === viewingPatientIntake.id || n.patientId === 'DEMO-PATIENT').length > 0 ? (
                                             notes.filter(n => n.patientId === viewingPatientIntake.id || n.patientId === 'DEMO-PATIENT').slice(0, 3).map(n => (
                                                 <div key={n.id} className="p-3 bg-white border border-slate-200 rounded-xl">
                                                     <div className="flex justify-between">
                                                         <span className="text-[9px] font-bold uppercase text-slate-700">{n.type}</span>
                                                         <span className="text-[8px] text-slate-400">{n.date.split(',')[0]}</span>
                                                     </div>
                                                     {n.content.diagnosis && <p className="text-[9px] text-slate-500 italic truncate">{n.content.diagnosis}</p>}
                                                 </div>
                                             ))
                                         ) : (
                                             <p className="text-[9px] text-slate-400 italic">Sin historial previo</p>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             <button onClick={handleStartCall} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg animate-pulse">
                                 <Video size={14}/> Iniciar Videollamada
                             </button>
                        </div>
                    )}

                    {activePatients.filter(p => p.id !== viewingPatientIntake?.id).map(p => (
                        <div key={p.id} className="bg-white/10 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase">{p.name}</p>
                                <p className="text-[8px] font-bold text-emerald-400 uppercase mt-0.5 animate-pulse">
                                    {p.status === PatientStatus.ONLINE_REVIEWING ? '● Leyendo Historial' : '● En Llamada'}
                                </p>
                            </div>
                            <button onClick={() => navigate(`/telemedicine/${p.id}`)} className="p-2 bg-white/20 hover:bg-emerald-500 rounded-xl transition-all"><ArrowRight size={14}/></button>
                        </div>
                    ))}
                    {activePatients.length === 0 && !viewingPatientIntake && <p className="text-center text-[10px] text-slate-500 font-bold uppercase py-4">Ninguna consulta activa</p>}
                </div>
            </div>
        </div>
      )}

      {/* --- FINANCE TAB --- */}
      {docTab === 'finance' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between h-48 relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10"><DollarSign size={120}/></div>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Ingresos Totales (Mes)</p>
                          <p className="text-4xl font-black mt-2">${totalEarnings.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur rounded-xl p-3 flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase">Consultas Realizadas</span>
                          <span className="text-lg font-black">{myConsultations.length}</span>
                      </div>
                  </div>

                  <div className="md:col-span-2 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                          <TrendingUp size={16}/> Tendencia de Ingresos Semanal
                      </h3>
                      <div className="h-32 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={earningsData}>
                                    <defs>
                                        <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false}/>
                                    <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarn)" />
                                </AreaChart>
                           </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Desglose de Consultas</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                              <tr>
                                  <th className="p-4 rounded-l-xl">Fecha</th>
                                  <th className="p-4">Paciente</th>
                                  <th className="p-4">Tipo</th>
                                  <th className="p-4 text-right rounded-r-xl">Honorarios</th>
                              </tr>
                          </thead>
                          <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                              {myConsultations.map(c => (
                                  <tr key={c.id}>
                                      <td className="p-4">{c.lastVisit || new Date().toLocaleDateString()}</td>
                                      <td className="p-4 uppercase">{c.name}</td>
                                      <td className="p-4 uppercase text-[10px]"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">Telemedicina</span></td>
                                      <td className="p-4 text-right text-emerald-600 font-black">${(currentUser?.price || 800).toLocaleString()}</td>
                                  </tr>
                              ))}
                              {myConsultations.length === 0 && (
                                  <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-[10px] font-black uppercase">Sin registros financieros</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default TelemedicineDashboard;
