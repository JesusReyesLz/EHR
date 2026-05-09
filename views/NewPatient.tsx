
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight,
  User, 
  Save,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  Search,
  Plus,
  Mail,
  Activity,
  Zap,
  LayoutList,
  Check,
  ChevronDown,
  Bed,
  Minus,
  Edit,
  Stethoscope,
  FlaskConical,
  Tag,
  Database,
  UserCheck,
  History,
  Droplet,
  Briefcase,
  Heart,
  X,
  AlertOctagon,
  FilePenLine,
  CalendarCheck,
  Video,
  Baby
} from 'lucide-react';
import { Patient, PatientStatus, ModuleType, PriorityLevel, AgendaStatus } from '../types';
import { LAB_CATALOG, IMAGING_CATALOG } from '../constants';

interface NewPatientProps {
  onAdd: (p: Patient) => void;
  patients: Patient[];
}

const QUICK_TAGS = ["Control Crónicos", "Certificado Médico", "Seguimiento", "Interpretación Labs", "Urgencia Menor", "Control Niño Sano"];

// Función auxiliar para normalizar texto (quitar acentos y pasar a minúsculas)
const cleanStr = (str: string) => 
  (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const NewPatient: React.FC<NewPatientProps> = ({ onAdd, patients }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Buscar paciente si estamos editando una cita específica
  const existingPatient = useMemo(() => patients.find(p => p.id === id), [patients, id]);

  // Helper para fecha local (Asegura hoy = YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [activeTab, setActiveTab] = useState<'id' | 'scheduling'>('id');
  const [labSearch, setLabSearch] = useState('');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [isImmediate, setIsImmediate] = useState(true);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  
  const [allergyInput, setAllergyInput] = useState('');

  const [viewDate, setViewDate] = useState(new Date());

  // Estado para visualización detallada de edad
  const [ageDetails, setAgeDetails] = useState({ years: 0, months: 0, days: 0 });

  const [form, setForm] = useState<Partial<Patient>>({
    name: '',
    curp: '',
    age: 0,
    ageUnit: 'Años', 
    birthDate: '', 
    sex: 'M',
    bloodType: '', 
    allergies: [],
    status: PatientStatus.SCHEDULED,
    priority: PriorityLevel.NONE,
    assignedModule: ModuleType.OUTPATIENT,
    scheduledDate: getLocalDateString(),
    appointmentTime: getCurrentTime(),
    phone: '',
    email: '',
    reason: '',
    agendaStatus: AgendaStatus.PENDING,
    address: '',
    occupation: '',
    religion: '',
    education: '',
    civilStatus: ''
  });

  // Function to calculate precise age from birthdate
  const calculateAgeFromDate = (birthDateString: string) => {
      if (!birthDateString) return;
      
      const [year, month, day] = birthDateString.split('-').map(Number);
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
      
      setAgeDetails({ years, months, days });

      // Lógica para guardar la unidad principal en el form (para compatibilidad con filtros)
      if (years > 0) {
          setForm(prev => ({ ...prev, birthDate: birthDateString, age: years, ageUnit: 'Años' }));
      } else if (months > 0) {
          setForm(prev => ({ ...prev, birthDate: birthDateString, age: months, ageUnit: 'Meses' }));
      } else {
          setForm(prev => ({ ...prev, birthDate: birthDateString, age: days, ageUnit: 'Días' }));
      }
  };

  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Resultados de búsqueda en base de datos
  const dbResults = useMemo(() => {
    if (!form.name || form.name.length < 2) return [];
    const search = cleanStr(form.name);
    return patients
      .filter(p => !p.id.startsWith('OLD-'))
      .filter(p => cleanStr(p.name).includes(search) || cleanStr(p.curp).includes(search));
  }, [patients, form.name]);

  // Cargar datos al montar si es edición directa
  useEffect(() => {
    if (existingPatient) {
      setForm(existingPatient);
      // Recalcular detalle si hay fecha de nacimiento
      if (existingPatient.birthDate) {
          calculateAgeFromDate(existingPatient.birthDate);
      }
      if (existingPatient.assignedModule === ModuleType.AUXILIARY) {
        setSelectedStudies(existingPatient.reason?.split(', ').filter(s => s) || []);
      }
      setIsImmediate(existingPatient.status !== PatientStatus.SCHEDULED);
    }
  }, [existingPatient]);

  // Validación de disponibilidad
  const timeConflict = useMemo(() => {
    if (!form.scheduledDate || !form.appointmentTime) return false;
    return patients.some(p => 
      p.id !== form.id && 
      p.scheduledDate === form.scheduledDate && 
      p.appointmentTime === form.appointmentTime &&
      p.status !== PatientStatus.ATTENDED &&
      !p.id.startsWith('OLD-')
    );
  }, [patients, form.scheduledDate, form.appointmentTime, form.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [viewDate]);

  const adjustTime = (minutes: number) => {
    const [h, m] = (form.appointmentTime || "09:00").split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutes);
    setForm({
      ...form, 
      appointmentTime: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    });
  };

  const selectPatientFromDb = (p: Patient) => {
    setForm({
      ...p,
      status: PatientStatus.SCHEDULED,
      priority: PriorityLevel.NONE,
      scheduledDate: getLocalDateString(),
      appointmentTime: getCurrentTime(),
      reason: '',
      agendaStatus: AgendaStatus.PENDING,
      transitTargetModule: undefined,
      bedNumber: undefined,
      paymentStatus: 'Pendiente', 
      pendingCharges: []
    });
    if (p.birthDate) calculateAgeFromDate(p.birthDate);
    setShowAutocomplete(false);
  };

  const handleAddAllergy = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!allergyInput.trim()) return;
    const current = form.allergies || [];
    if (!current.includes(allergyInput.trim().toUpperCase())) {
      setForm({ ...form, allergies: [...current, allergyInput.trim().toUpperCase()] });
    }
    setAllergyInput('');
  };

  const handleRemoveAllergy = (allergy: string) => {
    setForm({ ...form, allergies: (form.allergies || []).filter(a => a !== allergy) });
  };

  const invitePatientToPortal = async (email: string, name: string) => {
    try {
      const response = await fetch('/api/auth/invite-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Paciente invitado al portal:', data);
        alert(`Se ha enviado un correo a ${email} para que el paciente active su cuenta en el Portal de Telemedicina.`);
      } else {
        console.error('Error al invitar:', data.error);
        // No bloqueamos el flujo si ya existe o falla, solo informamos en consola
      }
    } catch (err) {
      console.error('Error de red al invitar paciente:', err);
    }
  };

  const handleSaveIdentity = async () => {
    if (!form.name) {
      alert("El nombre completo del paciente es el único campo obligatorio.");
      return;
    }

    const patientData: Patient = {
      ...form as Patient,
      id: form.id || Math.random().toString(36).substr(2, 7).toUpperCase(),
      name: form.name?.toUpperCase() || '',
      curp: form.curp?.toUpperCase() || '',
      status: existingPatient ? existingPatient.status : PatientStatus.SCHEDULED,
      modifiedBy: "ACTUALIZACION_DATOS"
    };

    onAdd(patientData);

    // Si es un paciente nuevo y tiene email, invitarlo al portal
    if (!isEditing && form.email) {
      await invitePatientToPortal(form.email, form.name);
    }

    navigate(-1);
  };

  const handleSaveScheduling = async () => {
    if (!form.name) {
      alert("El nombre es requerido para programar.");
      return;
    }

    const finalReason = form.assignedModule === ModuleType.AUXILIARY 
      ? selectedStudies.join(', ') 
      : form.reason;

    const dateChanged = isEditing && existingPatient && existingPatient.scheduledDate !== form.scheduledDate;

    if (dateChanged && existingPatient) {
        const ghostRecord: Patient = {
            ...existingPatient,
            id: `OLD-${existingPatient.id}-${Date.now()}`,
            scheduledDate: existingPatient.scheduledDate,
            appointmentTime: existingPatient.appointmentTime,
            agendaStatus: AgendaStatus.RESCHEDULED,
            status: PatientStatus.ATTENDED, 
            modifiedBy: "SISTEMA_REAGENDA_HISTORICO"
        };
        onAdd(ghostRecord);
    }

    let finalStatus = form.status || PatientStatus.SCHEDULED;
    let finalAgendaStatus = form.agendaStatus || AgendaStatus.PENDING;
    let lastVisitDate = getLocalDateString();

    if (isImmediate) {
       if (form.assignedModule === ModuleType.TELEMEDICINE) {
           finalStatus = PatientStatus.ONLINE_WAITING;
       } else {
           finalStatus = form.assignedModule === ModuleType.AUXILIARY ? PatientStatus.WAITING_FOR_SAMPLES : PatientStatus.WAITING;
       }
       finalAgendaStatus = AgendaStatus.ARRIVED_ON_TIME;
    } else {
        finalStatus = PatientStatus.SCHEDULED;
    }

    const patientData: Patient = {
      ...form as Patient,
      id: form.id || Math.random().toString(36).substr(2, 7).toUpperCase(),
      name: form.name?.toUpperCase() || '',
      curp: form.curp?.toUpperCase() || '',
      lastVisit: lastVisitDate, 
      reason: finalReason || 'Ingreso a sistema',
      priority: form.priority || PriorityLevel.NONE,
      status: finalStatus,
      agendaStatus: finalAgendaStatus,
      modifiedBy: isEditing ? "REPROGRAMACION" : "NUEVO_INGRESO"
    };

    onAdd(patientData); 

    // Si es un paciente nuevo y tiene email, invitarlo al portal
    if (!isEditing && form.email) {
      await invitePatientToPortal(form.email, form.name);
    }
    
    if (isEditing) navigate('/agenda');
    else if (isImmediate) {
        if(form.assignedModule === ModuleType.TELEMEDICINE) navigate('/telemedicine');
        else navigate('/'); 
    }
    else navigate('/agenda');
  };

  const priorityColors: Record<string, string> = {
    '0': 'bg-slate-100 text-slate-400 border-slate-200',
    '1': 'bg-rose-100 text-rose-600 border-rose-200',
    '2': 'bg-orange-100 text-orange-600 border-orange-200',
    '3': 'bg-amber-100 text-amber-600 border-amber-200',
    '4': 'bg-emerald-100 text-emerald-600 border-emerald-200',
    '5': 'bg-blue-100 text-blue-600 border-blue-200'
  };

  // VISTA DE FORMULARIO
  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in">
      <style>{`
        @media print {
          .no-print, nav, aside, button { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0.5cm !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-7xl { max-width: 100% !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #000 !important; }
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
          @page { margin: 0.5cm; size: portrait; }
        }
      `}</style>
      {/* ... Header and Tabs (Identical) ... */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 no-print">
        <div className="flex items-center gap-6">
               <button onClick={() => navigate(-1)} aria-label="Volver atrás" className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
                 <ChevronLeft className="w-6 h-6 text-slate-600" aria-hidden="true" />
               </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none flex items-center gap-3">
              {isEditing ? <Edit className="text-blue-600" /> : <User className="text-emerald-600" />}
              {isEditing ? 'Modificar Datos' : form.id ? 'Reingreso de Paciente' : 'Nuevo Registro'}
            </h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-2">
               {isEditing ? 'Edición de Cita' : 'Base de Datos Sincronizada'} • {getLocalDateString()}
            </p>
          </div>
        </div>
        
        <div role="tablist" aria-label="Pasos de registro" className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
           <button role="tab" aria-selected={activeTab === 'id'} aria-controls="panel-id" id="tab-id" onClick={() => setActiveTab('id')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 ${activeTab === 'id' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>1. Identificación</button>
           <button role="tab" aria-selected={activeTab === 'scheduling'} aria-controls="panel-scheduling" id="tab-scheduling" onClick={() => setActiveTab('scheduling')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 ${activeTab === 'scheduling' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>2. Programación</button>
        </div>
        <div className="w-16"></div> 
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'id' ? (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10 animate-in slide-in-from-left-4">
              {/* ... Basic info ... */}
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><User size={20} /></div>
                    Filiación y Datos Personales
                 </h3>
                 {form.id && !isEditing && (
                    <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase border border-emerald-200">
                       Paciente Existente (ID: {form.id})
                    </span>
                 )}
              </div>
              
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-8" id="panel-id" role="tabpanel" aria-labelledby="tab-id">
                <legend className="sr-only">Datos Personales</legend>
                <div className="col-span-full space-y-2 relative">
                  <label htmlFor="patient-name" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo del Paciente <span className="text-rose-500" aria-hidden="true">*</span></label>
                  <input 
                    id="patient-name"
                    type="text" 
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" 
                    value={form.name || ''} 
                    onChange={e => {
                      setForm({...form, name: e.target.value});
                      setShowAutocomplete(true);
                    }} 
                    onFocus={() => setShowAutocomplete(true)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                    placeholder="APELLIDOS NOMBRE(S)" 
                    role="combobox"
                    aria-expanded={showAutocomplete}
                    aria-controls={showAutocomplete ? "autocomplete-list" : undefined}
                    aria-autocomplete="list"
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && dbResults.length > 0 && (
                    <div id="autocomplete-list" role="listbox" aria-label="Pacientes Existentes" className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                      <div className="p-2 bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest" aria-hidden="true">
                        Pacientes Existentes ({dbResults.length})
                      </div>
                      {dbResults.map(p => (
                        <button
                          key={p.id}
                          role="option"
                          aria-selected="false"
                          onClick={() => selectPatientFromDb(p)}
                          className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between group focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase group-hover:text-blue-700">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                              ID: {p.id} • CURP: {p.curp || 'N/D'} • {p.age} {p.ageUnit}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="patient-curp" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">CURP (Opcional)</label>
                  <input id="patient-curp" type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono uppercase text-sm font-bold outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" value={form.curp || ''} onChange={e => setForm({...form, curp: e.target.value.toUpperCase()})} maxLength={18} placeholder="Puede registrarse posteriormente" />
                </div>
                
                {/* --- CONTROL DE EDAD AVANZADO (UPDATED) --- */}
                <fieldset className="grid grid-cols-2 gap-4 col-span-full md:col-span-1">
                  <legend className="sr-only">Control de Edad</legend>
                  <div className="space-y-2 col-span-2">
                       <label htmlFor="patient-birthdate" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><CalendarIcon size={12} aria-hidden="true"/> Fecha de Nacimiento</label>
                       <input 
                         id="patient-birthdate"
                         type="date" 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                         value={form.birthDate || ''}
                         onChange={(e) => calculateAgeFromDate(e.target.value)}
                       />
                       {/* DISPLAY DETAILED AGE */}
                       {form.birthDate && (
                           <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-700 mt-2">
                               <Baby size={12} aria-hidden="true"/>
                               <span>Edad Calculada: {ageDetails.years} Años, {ageDetails.months} Meses, {ageDetails.days} Días</span>
                           </div>
                       )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="patient-age" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Edad (Manual)</label>
                    <input 
                        id="patient-age"
                        type="number" 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                        value={form.age || ''} 
                        onChange={e => setForm({...form, age: parseInt(e.target.value) || 0, birthDate: ''})} // Clear birth date on manual edit
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="patient-age-unit" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Unidad</label>
                    <select 
                        id="patient-age-unit"
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                        value={form.ageUnit || 'Años'} 
                        onChange={e => setForm({...form, ageUnit: e.target.value as any, birthDate: ''})} 
                    >
                      <option value="Años">Años</option>
                      <option value="Meses">Meses</option>
                      <option value="Días">Días</option>
                    </select>
                  </div>
                </fieldset>

                {/* ... Rest of fields (Sex, Blood, etc) ... */}
                <div className="space-y-2">
                    <label htmlFor="patient-sex" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Sexo</label>
                    <select id="patient-sex" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase focus:ring-2 focus:ring-blue-100 outline-none transition-all" value={form.sex || 'M'} onChange={e => setForm({...form, sex: e.target.value as any})}>
                      <option value="M">MASCULINO</option><option value="F">FEMENINO</option>
                    </select>
                </div>
                {/* ... (Allergies, Contact info - kept same) ... */}
                <div className="space-y-2">
                   <label htmlFor="patient-blood" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Droplet size={10} className="text-rose-500" aria-hidden="true" /> Grupo Sanguíneo</label>
                   <select id="patient-blood" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={form.bloodType || ''} onChange={e => setForm({...form, bloodType: e.target.value})}>
                      <option value="">DESCONOCIDO / N/A</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                   </select>
                </div>
                
                <div className="space-y-2">
                   <label htmlFor="patient-allergies" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><AlertOctagon size={10} className="text-amber-500" aria-hidden="true" /> Alergias</label>
                   <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-2 min-h-[64px] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      {(form.allergies || []).map(allergy => (
                         <span key={allergy} className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border border-rose-200">
                            {allergy}
                            <button onClick={() => handleRemoveAllergy(allergy)} className="hover:text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded"><X size={10} aria-hidden="true" /></button>
                         </span>
                      ))}
                      <input 
                        id="patient-allergies"
                        className="flex-1 bg-transparent p-2 text-xs font-bold uppercase outline-none min-w-[100px]" 
                        placeholder={form.allergies && form.allergies.length > 0 ? "+ Añadir" : "Escriba y presione Enter..."}
                        value={allergyInput}
                        onChange={e => setAllergyInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddAllergy(e)}
                      />
                      <button onClick={(e: any) => handleAddAllergy(e)} aria-label="Añadir alergia" className="p-2 bg-slate-200 rounded-xl hover:bg-slate-300 text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"><Plus size={14} aria-hidden="true" /></button>
                   </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="patient-phone" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono de Contacto</label>
                  <input id="patient-phone" type="tel" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="55 0000 0000" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="patient-email" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
                    <input id="patient-email" type="email" className="w-full pl-12 pr-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} placeholder="paciente@ejemplo.com" />
                  </div>
                </div>

                <div className="space-y-2">
                   <label htmlFor="patient-occupation" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Briefcase size={10} aria-hidden="true" /> Ocupación</label>
                   <input id="patient-occupation" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium uppercase outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={form.occupation || ''} onChange={e => setForm({...form, occupation: e.target.value})} placeholder="Ej: Empleado, Estudiante..." />
                </div>
                <div className="space-y-2">
                   <label htmlFor="patient-civil" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Heart size={10} aria-hidden="true" /> Estado Civil</label>
                   <select id="patient-civil" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={form.civilStatus || ''} onChange={e => setForm({...form, civilStatus: e.target.value})}>
                      <option value="">N/A</option>
                      <option value="Soltero(a)">Soltero(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Unión Libre">Unión Libre</option>
                      <option value="Viudo(a)">Viudo(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                   </select>
                </div>

                <div className="col-span-full space-y-2">
                   <label htmlFor="patient-address" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Dirección Completa</label>
                   <input id="patient-address" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium uppercase outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} placeholder="Calle, Número, Colonia..." />
                </div>
              </fieldset>

              {/* Botón de Guardado Específico para Identidad */}
               <div className="pt-6 border-t border-slate-50 flex justify-end">
                 <button onClick={handleSaveIdentity} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <FilePenLine size={18} aria-hidden="true" /> Actualizar Datos de Identificación
                 </button>
              </div>
            </div>
          ) : (
             /* ... Schedule Tab Content (Same as before) ... */
             <div id="panel-scheduling" role="tabpanel" aria-labelledby="tab-scheduling" className="space-y-8 animate-in slide-in-from-right-4">
              <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg" aria-hidden="true"><CalendarIcon size={20} /></div>
                     Detalles de la Cita
                  </h3>
                  
                  <div role="group" aria-label="Tipo de ingreso" className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                    <button aria-pressed={isImmediate} onClick={() => { setIsImmediate(true); setForm({...form, scheduledDate: getLocalDateString(), appointmentTime: getCurrentTime()}); }} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isImmediate ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Zap size={12} aria-hidden="true" /> Ingreso Inmediato
                    </button>
                    <button aria-pressed={!isImmediate} onClick={() => setIsImmediate(false)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900 ${!isImmediate ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Clock size={12} aria-hidden="true" /> Cita Programada
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   {/* ... Date/Time Pickers ... */}
                   <div className="space-y-4 relative" ref={calendarRef}>
                      <label id="label-scheduled-date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <CalendarIcon size={14} className="text-blue-600" aria-hidden="true" /> Fecha Programada
                      </label>
                      <button 
                        aria-labelledby="label-scheduled-date"
                        aria-haspopup="dialog"
                        aria-expanded={showCalendarDropdown}
                        onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-black text-slate-900"
                      >
                         <span className="uppercase">{new Date(form.scheduledDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                         <ChevronDown size={18} aria-hidden="true" className={`transition-transform ${showCalendarDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showCalendarDropdown && (
                        <div role="dialog" aria-label="Seleccionar fecha" className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-50 p-6 animate-in zoom-in-95">
                           <div className="flex items-center justify-between mb-4 px-2">
                              <button aria-label="Mes anterior" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><ChevronLeft size={16} aria-hidden="true"/></button>
                              <span aria-live="polite" className="text-xs font-black uppercase tracking-tight">{viewDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}</span>
                              <button aria-label="Mes siguiente" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><ChevronRight size={16} aria-hidden="true"/></button>
                           </div>
                           <div className="grid grid-cols-7 gap-1 mb-2 text-center" aria-hidden="true">
                              {['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-[8px] font-black text-slate-300 uppercase">{d}</span>)}
                           </div>
                           <div className="grid grid-cols-7 gap-1">
                              {calendarDays.map((day, i) => {
                                 if (!day) return <div key={`empty-${i}`} />;
                                 const dateStr = getLocalDateString(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                                 const isSelected = form.scheduledDate === dateStr;
                                 const isToday = getLocalDateString() === dateStr;
                                 return (
                                   <button key={day} aria-label={dateStr} aria-pressed={isSelected} onClick={() => { setForm({...form, scheduledDate: dateStr}); setShowCalendarDropdown(false); }} className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelected ? 'bg-blue-600 text-white shadow-lg' : isToday ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                                     {day}
                                   </button>
                                 );
                              })}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      <label htmlFor="appointment-time" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Clock size={14} className="text-blue-600" aria-hidden="true" /> Horario de Atención {timeConflict && <span role="alert" className="text-rose-600 animate-pulse ml-2 font-black">(SATURADO)</span>}
                      </label>
                      <div className="flex items-center gap-4">
                         <div className="relative flex-1">
                           <input 
                             id="appointment-time"
                             type="time" 
                             className={`w-full p-6 border-none rounded-3xl text-2xl font-black text-center outline-none shadow-xl focus:ring-4 focus:ring-blue-500/20 transition-all ${timeConflict ? 'bg-rose-50 border-rose-300 border-2 text-rose-700' : 'bg-slate-900 text-white'}`} 
                             value={form.appointmentTime || ''} 
                             onChange={e => setForm({...form, appointmentTime: e.target.value})} 
                             aria-invalid={timeConflict}
                             aria-describedby={timeConflict ? "time-conflict-error" : undefined}
                           />
                         </div>
                         <div className="flex flex-col gap-2">
                            <button aria-label="Añadir 15 minutos" onClick={() => adjustTime(15)} className="p-3 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><Plus size={16} aria-hidden="true"/></button>
                            <button aria-label="Restar 15 minutos" onClick={() => adjustTime(-15)} className="p-3 bg-slate-100 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"><Minus size={16} aria-hidden="true"/></button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* ... Module and Priority Selectors ... */}
                <fieldset className="pt-8 border-t border-slate-50 space-y-6">
                   <legend className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Selección de Módulo / Destino</legend>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                     {[
                       { id: ModuleType.OUTPATIENT, icon: <Stethoscope size={20}/>, label: 'Consulta' },
                       { id: ModuleType.EMERGENCY, icon: <Activity size={20}/>, label: 'Urgencias' },
                       { id: ModuleType.HOSPITALIZATION, icon: <Bed size={20}/>, label: 'Hospitalización' },
                       { id: ModuleType.AUXILIARY, icon: <FlaskConical size={20}/>, label: 'Laboratorio' },
                       { id: ModuleType.TELEMEDICINE, icon: <Video size={20}/>, label: 'Telemedicina' }
                     ].map(mod => (
                       <button 
                         key={mod.id}
                         aria-pressed={form.assignedModule === mod.id}
                         onClick={() => setForm({...form, assignedModule: mod.id})}
                         className={`p-6 rounded-3xl border-2 text-center transition-all group flex flex-col items-center gap-3 focus:outline-none focus:ring-2 focus:ring-slate-900 ${form.assignedModule === mod.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                       >
                          <div aria-hidden="true" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${form.assignedModule === mod.id ? 'bg-blue-600/20 text-blue-400' : 'bg-white text-slate-300'}`}>
                             {mod.icon}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none">{mod.label}</span>
                       </button>
                     ))}
                   </div>
                </fieldset>
                {/* ... Priority and Reason ... */}
                <fieldset className="space-y-4 pt-8 border-t border-slate-50">
                   <legend className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nivel de Prioridad (Triage Inicial)</legend>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.values(PriorityLevel).map(lvl => {
                         const levelId = lvl.split(' ')[0];
                         return (
                           <button 
                             key={lvl}
                             aria-pressed={form.priority === lvl}
                             onClick={() => setForm({...form, priority: lvl})}
                             className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-slate-900 ${form.priority === lvl ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105' : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'}`}
                           >
                              <div aria-hidden="true" className={`w-2 h-2 rounded-full ${priorityColors[levelId].replace('text-', 'bg-').split(' ')[0]}`}></div>
                              <span className="text-[9px] font-black uppercase truncate">{lvl.split('-')[1]}</span>
                           </button>
                         );
                      })}
                   </div>
                </fieldset>

                {form.assignedModule === ModuleType.AUXILIARY ? (
                  <div className="space-y-6 pt-8 border-t border-slate-50 animate-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudios Solicitados</h4>
                        <div className="relative w-64">
                           <label htmlFor="search-studies" className="sr-only">Filtrar catálogo de estudios</label>
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" aria-hidden="true" />
                           <input id="search-studies" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Filtrar catálogo..." value={labSearch} onChange={e => setLabSearch(e.target.value)} />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 no-scrollbar" role="group" aria-label="Lista de estudios">
                        {[...LAB_CATALOG, ...IMAGING_CATALOG].filter(s => s.name.toLowerCase().includes(labSearch.toLowerCase())).map(s => (
                           <button key={s.name} aria-pressed={selectedStudies.includes(s.name)} onClick={() => setSelectedStudies(prev => prev.includes(s.name) ? prev.filter(st => st !== s.name) : [...prev, s.name])} className={`p-4 rounded-2xl border flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedStudies.includes(s.name) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}>
                              <span className="text-[9px] font-black uppercase text-left">{s.name}</span>
                              {selectedStudies.includes(s.name) ? <Check size={14} aria-hidden="true" /> : <Plus size={14} className="opacity-30" aria-hidden="true" />}
                           </button>
                        ))}
                     </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-8 border-t border-slate-50">
                     <div className="flex items-center gap-2 mb-2"><Tag size={16} className="text-blue-600" aria-hidden="true" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Etiquetas Rápidas de Motivo</span></div>
                     <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Etiquetas rápidas">
                        {QUICK_TAGS.map(tag => (
                          <button key={tag} aria-pressed={form.reason === tag} onClick={() => setForm({...form, reason: tag})} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all border focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.reason === tag ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'}`}>{tag}</button>
                        ))}
                     </div>
                     <label htmlFor="patient-reason" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Motivo / Especialidad</label>
                     <textarea id="patient-reason" className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-32 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-inner" value={form.reason || ''} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Ej: Control Diabetes, Ingreso Programado Cirugía..." />
                  </div>
                )}

                {/* Botón de Guardado Específico para Programación */}
                <div className="pt-6 border-t border-slate-50 flex justify-end">
                   <button onClick={handleSaveScheduling} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                      <CalendarCheck size={18} aria-hidden="true" /> Confirmar Programación / Reagendar
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ... Right Column (Operational Summary) ... */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden border-b-8 border-blue-600">
              <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-3 relative z-10">
                 <LayoutList size={16} /> Resumen Operativo
              </h3>
              
              <div className="space-y-6 relative z-10">
                 <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Paciente</p>
                    <p className="text-sm font-black uppercase text-white truncate">{form.name || 'PENDIENTE'}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fecha</p>
                       <p className="text-xs font-bold text-white uppercase">{new Date(form.scheduledDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hora</p>
                       <p className={`text-xs font-bold ${timeConflict ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{form.appointmentTime} hrs</p>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Admisión</p>
                       <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${isImmediate ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                          {isImmediate ? 'Inmediato (Hoy)' : 'Programado'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Módulo</p>
                       <p className="text-[9px] font-black text-blue-400 uppercase">{form.assignedModule}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* ... Alerts ... */}
           {timeConflict && (
              <div id="time-conflict-error" role="alert" className="bg-rose-50 border border-rose-200 rounded-[2.5rem] p-8 flex items-start gap-5 shadow-sm animate-bounce">
                <AlertTriangle className="w-6 h-6 text-rose-600 mt-1 flex-shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest leading-none">Conflicto de Horario</p>
                  <p className="text-[10px] text-rose-700 font-medium leading-relaxed mt-2">
                    Ya existe una cita programada para las {form.appointmentTime}. Se recomienda ajustar el horario para evitar demoras en la atención.
                  </p>
                </div>
              </div>
           )}

           <div role="status" aria-live="polite" className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 flex items-start gap-5 shadow-sm">
             <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" aria-hidden="true" />
             <div className="space-y-1">
               <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Aviso de Recepción</p>
               <p className="text-[10px] text-amber-700 font-medium leading-relaxed mt-2">
                 {isImmediate 
                   ? "El paciente aparecerá en el Monitor Activo inmediatamente después de guardar."
                   : "El registro será guardado en la Agenda Operativa del día seleccionado."}
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NewPatient;
