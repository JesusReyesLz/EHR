
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  History,
  Search,
  Filter,
  Users,
  Edit3,
  CalendarDays,
  X,
  User as UserIcon,
  ShieldAlert,
  UserMinus,
  CheckCircle,
  MoreVertical,
  MapPin,
  AlertTriangle,
  Stethoscope,
  Video,
  Monitor
} from 'lucide-react';
import { Patient, PatientStatus, ModuleType, AgendaStatus, PriorityLevel } from '../types';

// Función auxiliar para normalizar texto (quitar acentos y pasar a minúsculas)
const cleanStr = (str: string) => 
  (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface AgendaProps {
  onUpdateStatus: (id: string, status: PatientStatus, agendaStatus?: AgendaStatus) => void;
  patients: Patient[];
}

const Agenda: React.FC<AgendaProps> = ({ onUpdateStatus, patients }) => {
  const navigate = useNavigate();

  // Helper para fecha local (Asegura hoy = YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  
  // Tabs de Estado
  const [activeTab, setActiveTab] = useState<'pending' | 'arrived' | 'noshow' | 'modified'>('pending');
  
  // Filtro de Modalidad (Físico vs Digital)
  const [modalityFilter, setModalityFilter] = useState<'all' | 'physical' | 'digital'>('all');

  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el Modal de Arribo
  const [arrivalModalOpen, setArrivalModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Patient | null>(null);

  // Mapeo de colores de Triage para franja lateral
  const priorityColors: Record<string, string> = {
    '0': 'bg-slate-200',
    '1': 'bg-rose-500',
    '2': 'bg-orange-500',
    '3': 'bg-amber-500',
    '4': 'bg-emerald-500',
    '5': 'bg-blue-500'
  };

  // Búsqueda global para encontrar en qué fecha está un paciente
  const globalSearchResults = useMemo(() => {
    if (searchTerm.length < 3) return [];
    const search = cleanStr(searchTerm);
    return patients
      .filter(p => !p.id.startsWith('OLD-')) // En búsqueda global ocultamos los históricos para evitar duplicidad visual
      .filter(p => cleanStr(p.name).includes(search) || cleanStr(p.curp).includes(search))
      .sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || ''));
  }, [patients, searchTerm]);

  const isActuallyArrived = (p: Patient) => [
    PatientStatus.WAITING, 
    PatientStatus.IN_CONSULTATION, 
    PatientStatus.ATTENDED, 
    PatientStatus.ADMITTED, 
    PatientStatus.IN_ROOM,
    PatientStatus.READY_RESULTS,
    PatientStatus.TAKING_SAMPLES,
    PatientStatus.PROCESSING_RESULTS,
    PatientStatus.WAITING_FOR_SAMPLES,
    PatientStatus.ONLINE_WAITING,
    PatientStatus.ONLINE_IN_CALL
  ].includes(p.status);

  // Filtrado por fecha seleccionada y orden por hora
  const dayAppointments = useMemo(() => {
    return patients
      .filter(p => p.scheduledDate === selectedDate)
      .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));
  }, [patients, selectedDate]);

  // Identificar conflictos de horario (mismo bloque de tiempo)
  const timeConflicts = useMemo(() => {
    const counts: Record<string, number> = {};
    dayAppointments.forEach(p => {
      if (p.appointmentTime && !isActuallyArrived(p)) {
        counts[p.appointmentTime] = (counts[p.appointmentTime] || 0) + 1;
      }
    });
    return Object.keys(counts).filter(time => counts[time] > 1);
  }, [dayAppointments]);

  const filteredAppointments = useMemo(() => {
    const search = cleanStr(searchTerm);
    return dayAppointments.filter(p => {
      // 1. Filtro de Texto
      const matchesSearch = cleanStr(p.name).includes(search) || cleanStr(p.curp).includes(search);
      
      // 2. Filtro de Estado (Tabs)
      const arrived = isActuallyArrived(p);
      const modified = p.agendaStatus === AgendaStatus.CANCELLED || p.agendaStatus === AgendaStatus.RESCHEDULED;
      const noShow = p.agendaStatus === AgendaStatus.NO_SHOW;

      let matchesTab = false;
      if (activeTab === 'pending') matchesTab = !arrived && !modified && !noShow;
      else if (activeTab === 'arrived') matchesTab = arrived && !modified;
      else if (activeTab === 'noshow') matchesTab = noShow;
      else if (activeTab === 'modified') matchesTab = modified;

      // 3. Filtro de Modalidad (Físico vs Digital)
      let matchesModality = true;
      if (modalityFilter === 'physical') matchesModality = p.assignedModule !== ModuleType.TELEMEDICINE;
      if (modalityFilter === 'digital') matchesModality = p.assignedModule === ModuleType.TELEMEDICINE;

      return matchesSearch && matchesTab && matchesModality;
    });
  }, [dayAppointments, activeTab, searchTerm, modalityFilter]);

  const handleOpenArrivalModal = (p: Patient) => {
    // Si es telemedicina, el arribo es automático o vía dashboard, pero permitimos marcarlo aquí también
    if (p.assignedModule === ModuleType.TELEMEDICINE) {
        if(window.confirm("¿Marcar paciente como conectado en Sala Virtual?")) {
            onUpdateStatus(p.id, PatientStatus.ONLINE_WAITING, AgendaStatus.ARRIVED_ON_TIME);
        }
        return;
    }
    setSelectedAppointment(p);
    setArrivalModalOpen(true);
  };

  const handleStartInTake = (status: AgendaStatus) => {
    if (!selectedAppointment) return;
    
    if (status === AgendaStatus.NO_SHOW) {
      onUpdateStatus(selectedAppointment.id, PatientStatus.ATTENDED, AgendaStatus.NO_SHOW);
    } else {
      onUpdateStatus(
        selectedAppointment.id, 
        selectedAppointment.assignedModule === ModuleType.AUXILIARY ? PatientStatus.WAITING_FOR_SAMPLES : PatientStatus.WAITING, 
        status
      );
    }
    setArrivalModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCancel = (p: Patient) => {
    if (window.confirm(`¿Confirmar cancelación definitiva de la cita para ${p.name}?`)) {
      onUpdateStatus(p.id, PatientStatus.ATTENDED, AgendaStatus.CANCELLED);
    }
  };

  return (
    <div className="max-w-full space-y-10 animate-in fade-in duration-500 pb-20">
      {/* MODAL DE ARRIBO */}
      {arrivalModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 flex flex-col gap-8 animate-in zoom-in-95">
              <div className="flex justify-between items-start">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrar Asistencia Presencial</p>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedAppointment.name}</h3>
                    <p className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2"><Clock size={14}/> Cita Programada: {selectedAppointment.appointmentTime} hrs</p>
                 </div>
                 <button onClick={() => setArrivalModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-all"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="space-y-3">
                 <button onClick={() => handleStartInTake(AgendaStatus.ARRIVED_ON_TIME)} className="w-full flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600"><CheckCircle size={20}/></div>
                    <div className="text-left">
                       <p className="text-sm font-black uppercase">Llegó a Tiempo</p>
                       <p className="text-[10px] font-bold opacity-70 uppercase">Enviar a Sala de Espera Física</p>
                    </div>
                 </button>

                 <button onClick={() => handleStartInTake(AgendaStatus.ARRIVED_LATE)} className="w-full flex items-center gap-4 p-5 bg-amber-50 border border-amber-100 hover:bg-amber-500 hover:text-white rounded-2xl transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center group-hover:bg-white group-hover:text-amber-600"><Clock size={20}/></div>
                    <div className="text-left">
                       <p className="text-sm font-black uppercase">Llegó Tarde</p>
                       <p className="text-[10px] font-bold opacity-70 uppercase">Registrar con retardo</p>
                    </div>
                 </button>

                 <button onClick={() => handleStartInTake(AgendaStatus.NO_SHOW)} className="w-full flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-2xl transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center group-hover:bg-white group-hover:text-rose-600"><UserMinus size={20}/></div>
                    <div className="text-left">
                       <p className="text-sm font-black uppercase">No Asistió / Falta</p>
                       <p className="text-[10px] font-bold opacity-70 uppercase">Marcar inasistencia y archivar</p>
                    </div>
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 no-print">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em] mb-2">
            <CalendarIcon className="text-blue-600 w-4 h-4" />
            <span>Gestión Operativa de Unidades</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Agenda <span className="text-blue-600">Híbrida</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* SELECTOR DE MODALIDAD (FÍSICO VS DIGITAL) */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
              <button 
                onClick={() => setModalityFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${modalityFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  Todos
              </button>
              <button 
                onClick={() => setModalityFilter('physical')}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${modalityFilter === 'physical' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <MapPin size={12}/> Consultorio
              </button>
              <button 
                onClick={() => setModalityFilter('digital')}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${modalityFilter === 'digital' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <Video size={12}/> Telemedicina
              </button>
          </div>

          <button onClick={() => navigate('/new-patient')} className="flex items-center px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all group">
            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" /> Agendar Paciente
          </button>
        </div>
      </div>

      <div className="relative group z-30 no-print">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={24} />
        </div>
        <input 
          className="w-full pl-20 pr-8 py-7 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-xl font-black uppercase placeholder-slate-300" 
          placeholder="Buscar paciente en el histórico..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        {searchTerm.length >= 3 && (
          <div className="absolute top-full left-0 w-full mt-4 bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 backdrop-blur-xl">
             <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Localización Histórica ({globalSearchResults.length})</p>
                <button onClick={() => setSearchTerm('')} className="p-2 hover:bg-slate-200 rounded-lg transition-all"><XCircle size={20} className="text-slate-400" /></button>
             </div>
             <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {globalSearchResults.map(p => (
                   <div key={p.id} className="p-8 flex items-center justify-between hover:bg-blue-50 transition-all border-b border-slate-50 last:border-0 group/row">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xl">{p.name.charAt(0)}</div>
                         <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{p.curp}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Agendada</p>
                            <p className="text-sm font-black text-blue-600 uppercase">{p.scheduledDate}</p>
                         </div>
                         <button onClick={() => { setSelectedDate(p.scheduledDate!); setSearchTerm(''); }} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-md flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                            <CalendarDays size={16} /> Ir al día
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-4 space-y-8 no-print">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 text-blue-50 opacity-50 pointer-events-none"><CalendarIcon size={160} /></div>
            <div className="flex justify-between items-center mb-8 relative z-10">
               <button onClick={() => {
                 const d = new Date(selectedDate + 'T12:00:00');
                 d.setMonth(d.getMonth() - 1);
                 setSelectedDate(getLocalDateString(d));
               }} className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl transition-all"><ChevronLeft size={18} /></button>
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
               </h3>
               <button onClick={() => {
                 const d = new Date(selectedDate + 'T12:00:00');
                 d.setMonth(d.getMonth() + 1);
                 setSelectedDate(getLocalDateString(d));
               }} className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl transition-all"><ChevronRight size={18} /></button>
            </div>

            <div className="grid grid-cols-7 gap-3 text-center relative z-10">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <span key={d} className="text-[9px] font-black text-slate-300 uppercase mb-2">{d}</span>)}
              {Array.from({ length: new Date(new Date(selectedDate + 'T12:00:00').getFullYear(), new Date(selectedDate + 'T12:00:00').getMonth(), 1).getDay() }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: new Date(new Date(selectedDate + 'T12:00:00').getFullYear(), new Date(selectedDate + 'T12:00:00').getMonth() + 1, 0).getDate() }).map((_, i) => {
                const d = i + 1;
                const ds = getLocalDateString(new Date(new Date(selectedDate + 'T12:00:00').getFullYear(), new Date(selectedDate + 'T12:00:00').getMonth(), d));
                const isSel = selectedDate === ds;
                const isT = today === ds;
                const hasA = patients.some(p => p.scheduledDate === ds && !p.id.startsWith('OLD-'));
                return (
                  <button key={d} onClick={() => setSelectedDate(ds)} className={`aspect-square flex items-center justify-center rounded-2xl text-[11px] font-black transition-all relative ${isSel ? 'bg-blue-600 text-white shadow-xl scale-110' : isT ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'hover:bg-slate-50 text-slate-700'}`}>
                    {d}
                    {hasA && !isSel && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSelectedDate(today)} className="mt-10 w-full py-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Hoy ({new Date().getDate()} {new Date().toLocaleDateString('es-MX', { month: 'short' })})</button>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden min-h-[700px] flex flex-col no-print">
            <div className="p-8 border-b border-slate-100 space-y-8">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedDate === today ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-slate-900'}`}>
                        <CalendarIcon size={28} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronizado con Monitor Activo</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap bg-slate-50 border border-slate-100 p-1.5 rounded-2xl shadow-inner gap-1">
                     <button onClick={() => setActiveTab('pending')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>Pendientes</button>
                     <button onClick={() => setActiveTab('arrived')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'arrived' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>Arribados</button>
                     <button onClick={() => setActiveTab('noshow')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'noshow' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Faltas</button>
                     <button onClick={() => setActiveTab('modified')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'modified' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400'}`}>Modificados</button>
                  </div>
               </div>
            </div>

            <div className="divide-y divide-slate-50 flex-1 overflow-y-auto no-scrollbar">
              {filteredAppointments.length > 0 ? filteredAppointments.map((appt) => {
                const arrived = isActuallyArrived(appt);
                const isMod = appt.agendaStatus === AgendaStatus.CANCELLED || appt.agendaStatus === AgendaStatus.RESCHEDULED;
                const hasConflict = timeConflicts.includes(appt.appointmentTime || '');
                const priorityId = appt.priority.split(' ')[0];
                const isTele = appt.assignedModule === ModuleType.TELEMEDICINE;

                return (
                  <div key={appt.id} className="relative flex flex-col md:flex-row items-center hover:bg-slate-50/50 transition-all group p-10 gap-10">
                    {/* Franja lateral de color según Triage */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${priorityColors[priorityId]}`}></div>
                    
                    <div className="w-24 text-center shrink-0">
                      <p className={`text-3xl font-black leading-none ${hasConflict && !arrived ? 'text-rose-600' : arrived || isMod ? 'text-slate-300' : 'text-slate-900'} ${isMod ? 'line-through' : ''}`}>
                        {appt.appointmentTime || '--:--'}
                      </p>
                      {hasConflict && !arrived && <p className="text-[7px] font-black text-rose-500 uppercase mt-2 animate-pulse">SATURADO</p>}
                      <p className="text-[9px] text-slate-400 font-black uppercase mt-3 tracking-widest">HORA</p>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-3">
                       <div className="flex items-center gap-4">
                          <p className={`font-black text-xl uppercase tracking-tighter truncate ${arrived || isMod ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{appt.name}</p>
                          
                          {/* INDICADOR DE MODALIDAD */}
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm flex items-center gap-2 ${isTele ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                             {isTele ? <Video size={12}/> : <MapPin size={12}/>}
                             {isTele ? 'Teleconsulta' : appt.assignedModule}
                          </span>

                          {arrived && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[8px] font-black uppercase border border-emerald-100">
                               <CheckCircle size={10} className="text-emerald-500" /> {appt.bedNumber ? `En ${appt.bedNumber}` : isTele ? 'En Sala Virtual' : 'En Sala de Espera'}
                            </div>
                          )}
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase italic truncate max-w-xl">
                             <Filter size={12} className="mr-2 opacity-30" /> {appt.reason}
                          </div>
                          {appt.agendaStatus && appt.agendaStatus !== AgendaStatus.PENDING && (
                             <div className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-2 ${
                                appt.agendaStatus === AgendaStatus.ARRIVED_ON_TIME ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                appt.agendaStatus === AgendaStatus.ARRIVED_LATE ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                appt.agendaStatus === AgendaStatus.NO_SHOW ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                isMod ? 'bg-slate-900 text-white border border-slate-800' :
                                'bg-rose-50 text-rose-600'
                             }`}>
                                {appt.agendaStatus === AgendaStatus.RESCHEDULED ? <History size={12} className="text-amber-400" /> : appt.agendaStatus === AgendaStatus.CANCELLED ? <XCircle size={12} className="text-rose-400" /> : <CheckCircle2 size={12} />}
                                {appt.agendaStatus === AgendaStatus.RESCHEDULED ? 'Cita Reagendada' : appt.agendaStatus === AgendaStatus.CANCELLED ? 'Cita Cancelada' : appt.agendaStatus}
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="flex gap-3 shrink-0">
                       {!arrived && !isMod && appt.agendaStatus !== AgendaStatus.NO_SHOW && (
                         <div className="flex gap-2 items-center">
                            <button onClick={() => handleCancel(appt)} className="p-5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all" title="Cancelar Cita"><XCircle size={24} /></button>
                            <button onClick={() => navigate(`/edit-patient/${appt.id}`)} className="p-5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Modificar Datos"><Edit3 size={24} /></button>
                            
                            <button 
                              onClick={() => handleOpenArrivalModal(appt)}
                              className={`flex items-center px-8 py-5 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all gap-3 ${isTele ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-900 hover:bg-blue-600'}`}
                            >
                              {isTele ? 'Conectar' : 'Registrar Arribo'} {isTele ? <Monitor size={14} /> : <MapPin size={14} className="animate-pulse" />}
                            </button>
                         </div>
                       )}
                       {arrived && (
                           <button 
                             onClick={() => isTele ? navigate(`/telemedicine/${appt.id}`) : navigate(`/patient/${appt.id}`)} 
                             className="px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:text-blue-600 transition-all flex items-center gap-2"
                           >
                               {isTele ? <Video size={14}/> : <Stethoscope size={14}/>} {isTele ? 'Ir a Sala' : 'Ver Expediente'}
                           </button>
                       )}
                       
                       {appt.agendaStatus === AgendaStatus.NO_SHOW && activeTab === 'noshow' && (
                         <div className="flex gap-2">
                            <button onClick={() => navigate(`/edit-patient/${appt.id}`)} className="p-5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Reagendar"><Edit3 size={24} /></button>
                            <button onClick={() => navigate(`/patient/${appt.id}`)} className="px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:text-blue-600 transition-all">Ficha</button>
                         </div>
                       )}
                       {isMod && (
                         <button onClick={() => navigate(`/edit-patient/${appt.id}`)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Reagendar</button>
                       )}
                    </div>
                  </div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center py-52 opacity-20 text-slate-400">
                  <Users size={120} className="mb-8" />
                  <p className="text-lg font-black uppercase tracking-[0.4em]">Sin registros para este filtro</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
