
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
  Tag
} from 'lucide-react';
import { Patient, PatientStatus, ModuleType, PriorityLevel, AgendaStatus } from '../types';
import { LAB_CATALOG, IMAGING_CATALOG } from '../constants';

interface NewPatientProps {
  onAdd: (p: Patient) => void;
  patients: Patient[];
}

const QUICK_TAGS = ["Control Crónicos", "Certificado Médico", "Seguimiento", "Interpretación Labs", "Urgencia Menor"];

const NewPatient: React.FC<NewPatientProps> = ({ onAdd, patients }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Buscar paciente si estamos editando
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
  const [isImmediate, setIsImmediate] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  
  const [viewDate, setViewDate] = useState(new Date());

  const [form, setForm] = useState<Partial<Patient>>({
    name: '',
    curp: '',
    age: 0,
    sex: 'M',
    bloodType: 'O+',
    allergies: [],
    status: PatientStatus.SCHEDULED,
    priority: PriorityLevel.NONE,
    assignedModule: ModuleType.OUTPATIENT,
    scheduledDate: getLocalDateString(),
    appointmentTime: getCurrentTime(),
    phone: '',
    email: '',
    reason: '',
    agendaStatus: AgendaStatus.PENDING
  });

  // Cargar datos al montar si es edición
  useEffect(() => {
    if (existingPatient) {
      setForm(existingPatient);
      if (existingPatient.assignedModule === ModuleType.AUXILIARY) {
        setSelectedStudies(existingPatient.reason?.split(', ').filter(s => s) || []);
      }
      // Determinar si fue inmediato (no programado)
      setIsImmediate(existingPatient.status !== PatientStatus.SCHEDULED && existingPatient.status !== PatientStatus.ATTENDED);
    }
  }, [existingPatient]);

  // Validación de disponibilidad
  const timeConflict = useMemo(() => {
    if (!form.scheduledDate || !form.appointmentTime) return false;
    return patients.some(p => 
      p.id !== id && 
      p.scheduledDate === form.scheduledDate && 
      p.appointmentTime === form.appointmentTime &&
      p.status !== PatientStatus.ATTENDED &&
      !p.id.startsWith('OLD-')
    );
  }, [patients, form.scheduledDate, form.appointmentTime, id]);

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

  const handleSave = () => {
    if (!form.name || !form.curp) {
      alert("Nombre y CURP son campos obligatorios.");
      return;
    }

    const finalReason = form.assignedModule === ModuleType.AUXILIARY 
      ? selectedStudies.join(', ') 
      : form.reason;

    // Detectar si hubo cambio de fecha (Reagenda real)
    const dateChanged = isEditing && existingPatient && existingPatient.scheduledDate !== form.scheduledDate;

    // 1. SI HUBO CAMBIO DE FECHA: Crear registro "fantasma" para el día anterior
    // Esto asegura que en el día original aparezca en "Modificados"
    if (dateChanged && existingPatient) {
        const ghostRecord: Patient = {
            ...existingPatient, // Copia datos originales
            id: `OLD-${existingPatient.id}-${Date.now()}`, // ID único para el historial
            scheduledDate: existingPatient.scheduledDate, // Mantiene fecha vieja
            appointmentTime: existingPatient.appointmentTime, // Mantiene hora vieja
            agendaStatus: AgendaStatus.RESCHEDULED, // Se marca como reagendada
            status: PatientStatus.ATTENDED, // Se marca atendido/cerrado para que no salga en monitor activo
            modifiedBy: "SISTEMA_REAGENDA_HISTORICO"
        };
        onAdd(ghostRecord); // Guardamos el rastro en el día viejo
    }

    // 2. Configurar el registro ACTIVO (El que se mueve al nuevo día)
    let finalStatus = form.status || PatientStatus.SCHEDULED;
    let finalAgendaStatus = form.agendaStatus || AgendaStatus.PENDING;
    let lastVisitDate = existingPatient?.lastVisit || getLocalDateString();

    if (isImmediate) {
       finalStatus = form.assignedModule === ModuleType.AUXILIARY ? PatientStatus.WAITING_FOR_SAMPLES : PatientStatus.WAITING;
       finalAgendaStatus = AgendaStatus.ARRIVED_ON_TIME;
    } else {
       finalStatus = PatientStatus.SCHEDULED;
    }

    if (dateChanged) {
        // Si cambió fecha, en el nuevo día debe aparecer como PENDIENTE (Normal)
        finalAgendaStatus = AgendaStatus.PENDING;
        // Guardamos referencia de la fecha anterior
        lastVisitDate = existingPatient?.scheduledDate || lastVisitDate; 
    }

    const patientData: Patient = {
      ...form as Patient,
      id: isEditing ? (existingPatient?.id || id!) : Math.random().toString(36).substr(2, 7).toUpperCase(),
      name: form.name?.toUpperCase() || '',
      curp: form.curp?.toUpperCase() || '',
      lastVisit: lastVisitDate,
      reason: finalReason || 'Ingreso a sistema',
      priority: form.priority || PriorityLevel.NONE,
      status: finalStatus,
      agendaStatus: finalAgendaStatus,
      modifiedBy: isEditing ? "RECEPCION" : undefined
    };

    onAdd(patientData); 
    
    // Navegación
    if (isEditing) navigate('/agenda'); // Volver a agenda tras editar
    else if (isImmediate) navigate('/'); // Ir a monitor si es inmediato
    else navigate('/agenda'); // Ir a agenda si es programado nuevo
  };

  const priorityColors: Record<string, string> = {
    '0': 'bg-slate-100 text-slate-400 border-slate-200',
    '1': 'bg-rose-100 text-rose-600 border-rose-200',
    '2': 'bg-orange-100 text-orange-600 border-orange-200',
    '3': 'bg-amber-100 text-amber-600 border-amber-200',
    '4': 'bg-emerald-100 text-emerald-600 border-emerald-200',
    '5': 'bg-blue-100 text-blue-600 border-blue-200'
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none flex items-center gap-3">
              {isEditing ? <Edit className="text-blue-600" /> : <User className="text-emerald-600" />}
              {isEditing ? 'Modificar / Reagendar Cita' : 'Admisión Médica'}
            </h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-2">
               {isEditing ? 'Edición de Datos y Citas' : 'Sincronización Hospitalaria'} • {getLocalDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
           <button onClick={() => setActiveTab('id')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'id' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>1. Identificación</button>
           <button onClick={() => setActiveTab('scheduling')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'scheduling' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>2. Programación</button>
        </div>

        <button onClick={handleSave} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-3">
          <Save className="w-5 h-5" /> {isEditing ? 'Guardar Cambios' : 'Finalizar Registro'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'id' ? (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10 animate-in slide-in-from-left-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><User size={20} /></div>
                 Filiación y Datos Personales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-full space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo del Paciente</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-sm outline-none focus:bg-white focus:border-blue-400 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="APELLIDOS NOMBRE(S)" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">CURP (18 Dígitos)</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono uppercase text-sm font-bold outline-none focus:bg-white focus:border-blue-400" value={form.curp} onChange={e => setForm({...form, curp: e.target.value.toUpperCase()})} maxLength={18} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Edad</label>
                    <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.age} onChange={e => setForm({...form, age: parseInt(e.target.value)})}/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Sexo</label>
                    <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase" value={form.sex} onChange={e => setForm({...form, sex: e.target.value as any})}>
                      <option value="M">MASCULINO</option><option value="F">FEMENINO</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono de Contacto</label>
                  <input type="tel" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="55 0000 0000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="email" className="w-full pl-12 pr-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-400 transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="paciente@ejemplo.com" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><CalendarIcon size={20} /></div>
                     Detalles de la Cita
                  </h3>
                  
                  <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                    <button onClick={() => setIsImmediate(false)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${!isImmediate ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Clock size={12} /> Cita Programada
                    </button>
                    <button onClick={() => { setIsImmediate(true); setForm({...form, scheduledDate: getLocalDateString(), appointmentTime: getCurrentTime()}); }} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${isImmediate ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Zap size={12} /> Ingreso Inmediato
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-4 relative" ref={calendarRef}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <CalendarIcon size={14} className="text-blue-600" /> Fecha Programada
                      </label>
                      <button 
                        onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-blue-400 transition-all text-sm font-black text-slate-900"
                      >
                         <span className="uppercase">{new Date(form.scheduledDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                         <ChevronDown size={18} className={`transition-transform ${showCalendarDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showCalendarDropdown && (
                        <div className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-50 p-6 animate-in zoom-in-95">
                           <div className="flex items-center justify-between mb-4 px-2">
                              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={16}/></button>
                              <span className="text-xs font-black uppercase tracking-tight">{viewDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}</span>
                              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={16}/></button>
                           </div>
                           <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                              {['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-[8px] font-black text-slate-300 uppercase">{d}</span>)}
                           </div>
                           <div className="grid grid-cols-7 gap-1">
                              {calendarDays.map((day, i) => {
                                 if (!day) return <div key={`empty-${i}`} />;
                                 const dateStr = getLocalDateString(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                                 const isSelected = form.scheduledDate === dateStr;
                                 const isToday = getLocalDateString() === dateStr;
                                 return (
                                   <button key={day} onClick={() => { setForm({...form, scheduledDate: dateStr}); setShowCalendarDropdown(false); }} className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg' : isToday ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                                     {day}
                                   </button>
                                 );
                              })}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Clock size={14} className="text-blue-600" /> Horario de Atención {timeConflict && <span className="text-rose-600 animate-pulse ml-2 font-black">(SATURADO)</span>}
                      </label>
                      <div className="flex items-center gap-4">
                         <div className="relative flex-1">
                           <input 
                             type="time" 
                             className={`w-full p-6 border-none rounded-3xl text-2xl font-black text-center outline-none shadow-xl focus:ring-4 focus:ring-blue-500/20 transition-all ${timeConflict ? 'bg-rose-50 border-rose-300 border-2 text-rose-700' : 'bg-slate-900 text-white'}`} 
                             value={form.appointmentTime} 
                             onChange={e => setForm({...form, appointmentTime: e.target.value})} 
                           />
                         </div>
                         <div className="flex flex-col gap-2">
                            <button onClick={() => adjustTime(15)} className="p-3 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"><Plus size={16}/></button>
                            <button onClick={() => adjustTime(-15)} className="p-3 bg-slate-100 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"><Minus size={16}/></button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-6">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Selección de Módulo / Destino</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                       { id: ModuleType.OUTPATIENT, icon: <Stethoscope size={20}/>, label: 'Consulta' },
                       { id: ModuleType.EMERGENCY, icon: <Activity size={20}/>, label: 'Urgencias' },
                       { id: ModuleType.HOSPITALIZATION, icon: <Bed size={20}/>, label: 'Hospitalización' },
                       { id: ModuleType.AUXILIARY, icon: <FlaskConical size={20}/>, label: 'Laboratorio' }
                     ].map(mod => (
                       <button 
                         key={mod.id}
                         onClick={() => setForm({...form, assignedModule: mod.id})}
                         className={`p-6 rounded-3xl border-2 text-center transition-all group flex flex-col items-center gap-3 ${form.assignedModule === mod.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                       >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${form.assignedModule === mod.id ? 'bg-blue-600/20 text-blue-400' : 'bg-white text-slate-300'}`}>
                             {mod.icon}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none">{mod.label}</span>
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-slate-50">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nivel de Prioridad (Triage Inicial)</label>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.values(PriorityLevel).map(lvl => {
                         const levelId = lvl.split(' ')[0];
                         return (
                           <button 
                             key={lvl}
                             onClick={() => setForm({...form, priority: lvl})}
                             className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${form.priority === lvl ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105' : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'}`}
                           >
                              <div className={`w-2 h-2 rounded-full ${priorityColors[levelId].replace('text-', 'bg-').split(' ')[0]}`}></div>
                              <span className="text-[9px] font-black uppercase truncate">{lvl.split('-')[1]}</span>
                           </button>
                         );
                      })}
                   </div>
                </div>

                {form.assignedModule === ModuleType.AUXILIARY ? (
                  <div className="space-y-6 pt-8 border-t border-slate-50 animate-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudios Solicitados</h4>
                        <div className="relative w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                           <input className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" placeholder="Filtrar catálogo..." value={labSearch} onChange={e => setLabSearch(e.target.value)} />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                        {[...LAB_CATALOG, ...IMAGING_CATALOG].filter(s => s.name.toLowerCase().includes(labSearch.toLowerCase())).map(s => (
                           <button key={s.name} onClick={() => setSelectedStudies(prev => prev.includes(s.name) ? prev.filter(st => st !== s.name) : [...prev, s.name])} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedStudies.includes(s.name) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}>
                              <span className="text-[9px] font-black uppercase text-left">{s.name}</span>
                              {selectedStudies.includes(s.name) ? <Check size={14} /> : <Plus size={14} className="opacity-30" />}
                           </button>
                        ))}
                     </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-8 border-t border-slate-50">
                     <div className="flex items-center gap-2 mb-2"><Tag size={16} className="text-blue-600" /><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Etiquetas Rápidas de Motivo</label></div>
                     <div className="flex flex-wrap gap-2 mb-4">
                        {QUICK_TAGS.map(tag => (
                          <button key={tag} onClick={() => setForm({...form, reason: tag})} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all border ${form.reason === tag ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'}`}>{tag}</button>
                        ))}
                     </div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Motivo / Especialidad</label>
                     <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-32 text-sm font-bold outline-none focus:bg-white shadow-inner" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Ej: Control Diabetes, Ingreso Programado Cirugía..." />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

           {timeConflict && (
              <div className="bg-rose-50 border border-rose-200 rounded-[2.5rem] p-8 flex items-start gap-5 shadow-sm animate-bounce">
                <AlertTriangle className="w-6 h-6 text-rose-600 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest leading-none">Conflicto de Horario</p>
                  <p className="text-[10px] text-rose-700 font-medium leading-relaxed mt-2">
                    Ya existe una cita programada para las {form.appointmentTime}. Se recomienda ajustar el horario para evitar demoras en la atención.
                  </p>
                </div>
              </div>
           )}

           <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 flex items-start gap-5 shadow-sm">
             <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
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
