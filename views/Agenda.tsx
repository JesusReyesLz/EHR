
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
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
  Save,
  FileText,
  UserMinus,
  CheckCircle,
  MoreVertical
} from 'lucide-react';
import { Patient, PatientStatus, ModuleType, AgendaStatus } from '../types';

// Función auxiliar para normalizar texto (quitar acentos y pasar a minúsculas)
const cleanStr = (str: string) => 
  (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface AgendaProps {
  onUpdateStatus: (id: string, status: PatientStatus, agendaStatus?: AgendaStatus) => void;
  patients: Patient[];
}

const Agenda: React.FC<AgendaProps> = ({ onUpdateStatus, patients }) => {
  const navigate = useNavigate();

  // Helper para fecha local (Asegura hoy = 24/12/2025)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState<'pending' | 'arrived' | 'noshow' | 'modified'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDate, setPrintDate] = useState(today);
  
  // Estado para controlar qué menú de arribo está abierto
  const [openArriboMenuId, setOpenArriboMenuId] = useState<string | null>(null);

  // Búsqueda global para encontrar en qué fecha está un paciente
  const globalSearchResults = useMemo(() => {
    if (searchTerm.length < 3) return [];
    const search = cleanStr(searchTerm);
    return patients
      .filter(p => !p.id.startsWith('OLD-')) // No mostrar duplicados históricos en búsqueda global
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
    PatientStatus.WAITING_FOR_SAMPLES
  ].includes(p.status);

  // Filtrado por fecha seleccionada en la vista principal
  const dayAppointments = useMemo(() => {
    return patients.filter(p => p.scheduledDate === selectedDate);
  }, [patients, selectedDate]);

  const filteredAppointments = useMemo(() => {
    const search = cleanStr(searchTerm);
    return dayAppointments.filter(p => {
      const matchesSearch = cleanStr(p.name).includes(search) || cleanStr(p.curp).includes(search);
      const arrived = isActuallyArrived(p);
      const modified = p.agendaStatus === AgendaStatus.CANCELLED || p.agendaStatus === AgendaStatus.RESCHEDULED;

      if (activeTab === 'pending') return matchesSearch && !arrived && !modified && p.agendaStatus === AgendaStatus.PENDING;
      if (activeTab === 'arrived') return matchesSearch && arrived && !modified;
      if (activeTab === 'noshow') return matchesSearch && p.agendaStatus === AgendaStatus.NO_SHOW;
      if (activeTab === 'modified') return matchesSearch && modified;
      return matchesSearch;
    });
  }, [dayAppointments, activeTab, searchTerm]);

  const handleStartInTake = (p: Patient, status: AgendaStatus) => {
    setOpenArriboMenuId(null);
    
    if (status === AgendaStatus.NO_SHOW) {
      onUpdateStatus(p.id, PatientStatus.ATTENDED, AgendaStatus.NO_SHOW);
      return;
    }

    onUpdateStatus(p.id, p.assignedModule === ModuleType.AUXILIARY ? PatientStatus.WAITING_FOR_SAMPLES : PatientStatus.WAITING, status);
  };

  const handleCancel = (p: Patient) => {
    if (window.confirm(`¿Confirmar cancelación de cita para ${p.name}? Se mantendrá el registro para fines de auditoría.`)) {
      onUpdateStatus(p.id, PatientStatus.ATTENDED, AgendaStatus.CANCELLED);
    }
  };

  // MODAL DE PREVISUALIZACIÓN DE IMPRESIÓN
  const PrintPreviewModal = () => {
    const printList = patients.filter(p => p.scheduledDate === printDate)
      .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in no-print">
        <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
          <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Printer size={24} /></div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 uppercase">Previsualización de Agenda</h2>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Seleccione fecha y verifique la lista antes de imprimir</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase ml-2">Fecha a Imprimir:</span>
                  <input 
                    type="date" 
                    className="p-1 text-xs font-black outline-none bg-transparent" 
                    value={printDate} 
                    onChange={e => setPrintDate(e.target.value)} 
                  />
               </div>
               <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-600 transition-all">Imprimir Ahora</button>
               <button onClick={() => setShowPrintModal(false)} className="p-3 hover:bg-rose-50 rounded-xl transition-all border border-slate-200"><X size={24} className="text-slate-400" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-16 print:p-0 bg-white">
            <div className="max-w-4xl mx-auto space-y-10">
               <div className="flex justify-between border-b-4 border-slate-900 pb-8">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">AGENDA DE ATENCIÓN CLÍNICA</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase">Unidad Médica Especializada • Hospital San Rafael</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha del Reporte</p>
                    <p className="text-lg font-black text-slate-900 uppercase">{new Date(printDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
               </div>

               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest border-b-2 border-slate-900">
                        <th className="p-4 w-20">Hora</th>
                        <th className="p-4">Paciente / CURP</th>
                        <th className="p-4">Módulo / Motivo</th>
                        <th className="p-4 text-center">Estatus Agenda</th>
                        <th className="p-4 text-right">Responsable Mod.</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {printList.map(p => {
                        const isMod = p.agendaStatus === AgendaStatus.CANCELLED || p.agendaStatus === AgendaStatus.RESCHEDULED;
                        return (
                          <tr key={p.id} className={`text-[11px] ${isMod ? 'opacity-50 grayscale' : ''}`}>
                             <td className={`p-4 font-black ${isMod ? 'line-through' : ''}`}>{p.appointmentTime || '--:--'}</td>
                             <td className="p-4">
                                <p className={`font-black uppercase ${isMod ? 'line-through' : ''}`}>{p.name}</p>
                                <p className="text-[8px] text-slate-400 font-mono">{p.curp}</p>
                             </td>
                             <td className="p-4">
                                <p className="font-bold uppercase text-[9px]">{p.assignedModule}</p>
                                <p className="text-[9px] text-slate-500 italic truncate max-w-[180px]">{p.reason}</p>
                             </td>
                             <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                                  p.agendaStatus === AgendaStatus.PENDING ? 'bg-slate-100 text-slate-600' :
                                  p.agendaStatus === AgendaStatus.CANCELLED ? 'bg-rose-100 text-rose-700' :
                                  p.agendaStatus === AgendaStatus.RESCHEDULED ? 'bg-amber-100 text-amber-700' :
                                  p.agendaStatus === AgendaStatus.ARRIVED_LATE ? 'bg-orange-100 text-orange-700' :
                                  p.agendaStatus === AgendaStatus.NO_SHOW ? 'bg-rose-50 text-rose-800' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {p.agendaStatus}
                                </span>
                             </td>
                             <td className="p-4 text-right text-[8px] font-bold text-slate-400">
                                {p.modifiedBy ? `ID: ${p.modifiedBy}` : 'SISTEMA'}
                             </td>
                          </tr>
                        );
                     })}
                     {printList.length === 0 && (
                        <tr><td colSpan={5} className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em]">Sin pacientes programados para este día</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full space-y-10 animate-in fade-in duration-500 pb-20">
      {showPrintModal && <PrintPreviewModal />}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 no-print">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em] mb-2">
            <CalendarIcon className="text-blue-600 w-4 h-4" />
            <span>Gestión Operativa de Unidades</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Agenda <span className="text-blue-600">Clínica</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={() => setShowPrintModal(true)} className="p-5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-2xl shadow-sm transition-all">
            <Printer size={24} />
          </button>
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
          placeholder="Buscar paciente para ver fecha de registro (Ej: PEREZ)..." 
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
                         <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black group-hover/row:bg-blue-600 group-hover/row:text-white transition-all text-xl">{p.name.charAt(0)}</div>
                         <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{p.curp}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Agendada</p>
                            <p className="text-sm font-black text-blue-600 uppercase">{new Date(p.scheduledDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
                const hasA = patients.filter(p => !p.id.startsWith('OLD-')).some(p => p.scheduledDate === ds);
                return (
                  <button key={d} onClick={() => setSelectedDate(ds)} className={`aspect-square flex items-center justify-center rounded-2xl text-[11px] font-black transition-all ${isSel ? 'bg-blue-600 text-white shadow-xl scale-110' : isT ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'hover:bg-slate-50 text-slate-700'}`}>
                    {d}
                    {hasA && !isSel && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSelectedDate(today)} className="mt-10 w-full py-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Hoy (24 Dic)</button>
          </div>

          <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-xl space-y-6 relative overflow-hidden">
             <History className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
             <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Auditoría del Día</h4>
             <div className="grid grid-cols-2 gap-6 relative z-10">
                <div><p className="text-3xl font-black">{dayAppointments.filter(p => !p.id.startsWith('OLD-')).length}</p><p className="text-[9px] font-bold text-slate-500 uppercase">Citados</p></div>
                <div><p className="text-3xl font-black text-emerald-400">{dayAppointments.filter(p => isActuallyArrived(p)).length}</p><p className="text-[9px] font-bold text-slate-500 uppercase">Presentes</p></div>
             </div>
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
                          {selectedDate === today ? 'Hoy: ' : ''}
                          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronizado con Monitor Activo</p>
                     </div>
                  </div>
                  <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-2xl shadow-inner gap-1">
                     <button onClick={() => setActiveTab('pending')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>Pendientes ({dayAppointments.filter(p => p.agendaStatus === AgendaStatus.PENDING && !isActuallyArrived(p)).length})</button>
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

                return (
                  <div key={appt.id} className="p-10 flex flex-col md:flex-row items-center hover:bg-slate-50/50 transition-all group gap-10">
                    <div className="w-24 text-center border-r border-slate-100 pr-10 shrink-0">
                      <p className={`text-3xl font-black leading-none ${arrived || isMod ? 'text-slate-300' : 'text-slate-900'} ${isMod ? 'line-through' : ''}`}>{appt.appointmentTime || '--:--'}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase mt-3 tracking-widest">HORA</p>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-3">
                       <div className="flex items-center gap-4">
                          <p className={`font-black text-xl uppercase tracking-tighter truncate ${arrived || isMod ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{appt.name}</p>
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${appt.assignedModule === ModuleType.AUXILIARY ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                             {appt.assignedModule}
                          </span>
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
                          {appt.modifiedBy && (
                            <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase flex items-center gap-2">
                               <ShieldAlert size={12} /> Usuario: {appt.modifiedBy}
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="flex gap-3 shrink-0">
                       {!arrived && !isMod && appt.agendaStatus !== AgendaStatus.NO_SHOW && (
                         <div className="flex gap-2 items-center relative">
                            <button onClick={() => handleCancel(appt)} className="p-5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all" title="Cancelar"><XCircle size={24} /></button>
                            <button onClick={() => navigate(`/edit-patient/${appt.id}`)} className="p-5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Modificar"><Edit3 size={24} /></button>
                            
                            {selectedDate === today && (
                              <div className="relative">
                                <button 
                                  onClick={() => setOpenArriboMenuId(openArriboMenuId === appt.id ? null : appt.id)}
                                  className="flex items-center px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-blue-600 transition-all gap-2"
                                >
                                  Arribo <MoreVertical size={14} />
                                </button>
                                
                                {openArriboMenuId === appt.id && (
                                  <div className="absolute bottom-full right-0 mb-4 w-56 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[100] p-2 animate-in slide-in-from-bottom-2">
                                     <button onClick={() => handleStartInTake(appt, AgendaStatus.ARRIVED_ON_TIME)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-2xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all"><CheckCircle size={16}/></div>
                                        <span className="text-[10px] font-black uppercase text-slate-700">A Tiempo</span>
                                     </button>
                                     <button onClick={() => handleStartInTake(appt, AgendaStatus.ARRIVED_LATE)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 rounded-2xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all"><Clock size={16}/></div>
                                        <span className="text-[10px] font-black uppercase text-slate-700">Tarde</span>
                                     </button>
                                     <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                     <button onClick={() => handleStartInTake(appt, AgendaStatus.NO_SHOW)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 rounded-2xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all"><UserMinus size={16}/></div>
                                        <span className="text-[10px] font-black uppercase text-slate-700">Faltó / No Llegó</span>
                                     </button>
                                  </div>
                                )}
                              </div>
                            )}
                         </div>
                       )}
                       {arrived && <button onClick={() => navigate(`/patient/${appt.id}`)} className="px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:text-blue-600 transition-all">Expediente</button>}
                       
                       {/* Si faltó, permitir ver expediente o reagendar desde tab faltas */}
                       {appt.agendaStatus === AgendaStatus.NO_SHOW && activeTab === 'noshow' && (
                         <div className="flex gap-2">
                            <button onClick={() => navigate(`/edit-patient/${appt.id}`)} className="p-5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Reagendar"><Edit3 size={24} /></button>
                            <button onClick={() => navigate(`/patient/${appt.id}`)} className="px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:text-blue-600 transition-all">Ficha</button>
                         </div>
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
