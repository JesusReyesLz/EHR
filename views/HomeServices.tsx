
import React, { useState, useMemo } from 'react';
import { 
  Ambulance, MapPin, Clock, User, FileText, CheckCircle2, 
  AlertCircle, Truck, Phone, ChevronRight, Filter, Search, Calendar,
  UserPlus, X, MapPinned, LayoutList, Navigation, UserCheck, Timer, Wallet, DollarSign,
  ArrowRight
} from 'lucide-react';
import { HomeServiceRequest, StaffMember, DoctorInfo } from '../types';

interface HomeServicesProps {
    requests: HomeServiceRequest[];
    onUpdateRequest: (req: HomeServiceRequest) => void;
    staffList: StaffMember[];
    currentUser: DoctorInfo; // Passed to identify who accepts the job
}

const HomeServices: React.FC<HomeServicesProps> = ({ requests, onUpdateRequest, staffList, currentUser }) => {
    // Mode Switcher: Dispatch (Admin) vs Field (Nurse/Uber Mode)
    const [viewMode, setViewMode] = useState<'dispatch' | 'field'>('dispatch');
    
    // Dispatch View State
    const [filter, setFilter] = useState<'Pendiente' | 'Asignado' | 'En Proceso' | 'Todos'>('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<HomeServiceRequest | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({ unit: '', staffId: '' });

    // Field View State (My Jobs)
    const [fieldTab, setFieldTab] = useState<'available' | 'active' | 'wallet'>('active');

    // --- SHARED HELPERS ---
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Pendiente': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Asignado': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Camino': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Recolectado': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Finalizado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    // --- DISPATCH LOGIC ---
    const filteredRequests = requests.filter(r => {
        const matchesFilter = filter === 'Todos' || r.status === filter;
        const matchesSearch = r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.patientAddress.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const availableStaff = staffList.filter(s => s.isHomeServiceEnabled && s.status === 'Activo');

    const confirmAssignment = () => {
        if (!selectedRequest || !assignForm.unit || !assignForm.staffId) return alert("Seleccione unidad y personal.");
        const staff = staffList.find(s => s.id === assignForm.staffId);
        onUpdateRequest({
            ...selectedRequest,
            status: 'Asignado',
            assignedUnit: assignForm.unit,
            assignedStaff: staff ? `${staff.name} (${staff.role})` : 'Personal Externo'
        });
        setShowAssignModal(false);
    };

    // --- FIELD (UBER MODE) LOGIC ---
    // Solicitudes disponibles (Bolsa de trabajo)
    const availableJobs = requests.filter(r => r.status === 'Pendiente');
    
    // Mis trabajos activos (Asignados a mi nombre o en proceso si yo lo tomé)
    const myActiveJobs = requests.filter(r => 
        (r.assignedStaff?.includes(currentUser.name) || r.assignedStaff === currentUser.name) && 
        r.status !== 'Finalizado' && r.status !== 'Pendiente'
    );

    // Wallet Logic
    const myCompletedJobs = requests.filter(r => 
        (r.assignedStaff?.includes(currentUser.name) || r.assignedStaff === currentUser.name) && 
        r.status === 'Finalizado'
    );
    
    const walletBalance = useMemo(() => {
        return myCompletedJobs.reduce((acc, job) => acc + (job.commission || 150), 0); // Mock commission if not set
    }, [myCompletedJobs]);

    const handleAcceptJob = (req: HomeServiceRequest) => {
        if (window.confirm(`¿Confirmar aceptación del servicio para ${req.patientName}?`)) {
            onUpdateRequest({
                ...req,
                status: 'Asignado',
                assignedStaff: currentUser.name, // Assign to self
                assignedUnit: 'Vehículo Particular / App',
                acceptedAt: new Date().toISOString(),
                commission: 250 // Tarifa base simulada por servicio
            });
            setFieldTab('active');
        }
    };

    const handleUpdateStatusField = (req: HomeServiceRequest, newStatus: HomeServiceRequest['status']) => {
        let updateData = { ...req, status: newStatus };
        if (newStatus === 'Finalizado') {
            updateData.completedAt = new Date().toISOString();
        }
        onUpdateRequest(updateData);
    };

    const handleStatusChange = (newStatus: HomeServiceRequest['status']) => {
        if (selectedRequest) {
            const updated = { ...selectedRequest, status: newStatus };
            onUpdateRequest(updated);
            setSelectedRequest(updated);
        }
    };

    return (
        <div className="max-w-[98%] mx-auto space-y-6 animate-in fade-in pb-20 h-[calc(100vh-100px)] flex flex-col">
            {/* Header with Mode Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 shrink-0 no-print">
                <div>
                    <div className="flex items-center gap-3 text-rose-600 uppercase text-[10px] font-black tracking-[0.3em]">
                        <Ambulance size={16}/>
                        <span>Logística y Operaciones</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Centro de Comando</h1>
                </div>
                <div className="flex bg-slate-900 p-1.5 rounded-2xl shadow-xl border border-slate-800">
                    <button 
                        onClick={() => setViewMode('dispatch')} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'dispatch' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        Despacho (Admin)
                    </button>
                    <button 
                        onClick={() => setViewMode('field')} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'field' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        Modo Operativo (App)
                    </button>
                </div>
            </div>

            {viewMode === 'field' ? (
                /* --- VISTA OPERATIVA (UBER MODE) --- */
                <div className="flex-1 flex flex-col bg-slate-50 border border-slate-200 rounded-[3rem] overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-99.1332,19.4326,12,0/1200x800?access_token=YOUR_TOKEN')] bg-cover bg-center opacity-30 grayscale pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Tabs Flotantes */}
                        <div className="p-6 flex justify-center">
                            <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/20">
                                <button 
                                    onClick={() => setFieldTab('active')} 
                                    className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${fieldTab === 'active' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Navigation size={14}/> Mi Ruta ({myActiveJobs.length})
                                </button>
                                <button 
                                    onClick={() => setFieldTab('available')} 
                                    className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${fieldTab === 'available' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <MapPinned size={14}/> Disponibles ({availableJobs.length})
                                </button>
                                <button 
                                    onClick={() => setFieldTab('wallet')} 
                                    className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${fieldTab === 'wallet' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Wallet size={14}/> Ganancias
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                            <div className="max-w-2xl mx-auto space-y-4">
                                
                                {fieldTab === 'wallet' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                                        <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-xl flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-emerald-600/20 rounded-full blur-3xl transform -translate-y-1/2 translate-x-1/2"></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 relative z-10">Saldo Disponible</p>
                                            <p className="text-5xl font-black relative z-10">${walletBalance.toFixed(2)}</p>
                                            <button className="mt-4 px-6 py-2 bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg relative z-10">
                                                Solicitar Retiro
                                            </button>
                                        </div>

                                        <div className="bg-white/80 backdrop-blur rounded-[2.5rem] p-6 shadow-sm border border-white/50">
                                            <h4 className="text-xs font-black uppercase text-slate-400 mb-4 ml-2">Historial de Servicios ({myCompletedJobs.length})</h4>
                                            <div className="space-y-3">
                                                {myCompletedJobs.map(job => (
                                                    <div key={job.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 uppercase">{job.patientName}</p>
                                                            <p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(job.completedAt || job.requestedDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <span className="text-emerald-600 font-black text-sm">+${job.commission || 150}</span>
                                                    </div>
                                                ))}
                                                {myCompletedJobs.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No hay servicios finalizados.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {fieldTab === 'active' && (
                                    /* MY ACTIVE JOBS */
                                    myActiveJobs.length > 0 ? myActiveJobs.map(job => (
                                        <div key={job.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border-l-8 border-rose-600 animate-in slide-in-from-bottom-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(job.status)}`}>{job.status}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(job.requestedDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 uppercase">{job.patientName}</h3>
                                                </div>
                                                <button onClick={() => window.open(`https://maps.google.com/?q=${job.patientAddress}`)} className="p-3 bg-slate-100 rounded-2xl hover:bg-rose-100 hover:text-rose-600 transition-all"><Navigation size={24}/></button>
                                            </div>

                                            <div className="space-y-4 mb-6">
                                                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                                                    <MapPin className="text-rose-500 shrink-0 mt-0.5" size={16}/>
                                                    <p className="text-xs font-bold text-slate-600 uppercase">{job.patientAddress}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {job.studies.map((s, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase border border-blue-100">{s}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {job.status === 'Asignado' && (
                                                    <button onClick={() => handleUpdateStatusField(job, 'En Camino')} className="col-span-2 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                                                        <Truck size={18}/> Iniciar Viaje
                                                    </button>
                                                )}
                                                {job.status === 'En Camino' && (
                                                    <button onClick={() => handleUpdateStatusField(job, 'En Proceso')} className="col-span-2 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                                                        <MapPin size={18}/> Llegué al Domicilio
                                                    </button>
                                                )}
                                                {job.status === 'En Proceso' && (
                                                    <button onClick={() => handleUpdateStatusField(job, 'Recolectado')} className="col-span-2 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={18}/> Muestra Tomada
                                                    </button>
                                                )}
                                                {job.status === 'Recolectado' && (
                                                    <button onClick={() => handleUpdateStatusField(job, 'Finalizado')} className="col-span-2 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                                        <ArrowRight size={18}/> Entregar en Laboratorio (Finalizar)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-20 bg-white/80 backdrop-blur rounded-[3rem] shadow-sm">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Navigation size={32}/></div>
                                            <p className="text-slate-400 font-black uppercase text-xs">No tienes ruta activa</p>
                                            <button onClick={() => setFieldTab('available')} className="mt-4 text-rose-600 font-black text-xs uppercase hover:underline">Buscar Servicios</button>
                                        </div>
                                    )
                                )}
                                
                                {fieldTab === 'available' && (
                                    /* AVAILABLE JOBS (UBER FEED) */
                                    availableJobs.length > 0 ? availableJobs.map(job => (
                                        <div key={job.id} className="bg-white rounded-[2.5rem] p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 animate-in slide-in-from-bottom-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase border border-emerald-200">Nueva Solicitud</span>
                                                    <h3 className="text-lg font-black text-slate-900 uppercase mt-2">{job.patientName}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1"><Clock size={10}/> {new Date(job.requestedDate).toLocaleTimeString()} • Zona: Centro</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-slate-900">$250</p>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase">Tarifa Estimada</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase truncate">
                                                    <MapPin size={14} className="text-rose-500 shrink-0"/> {job.patientAddress}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">{job.studies.length} Estudios Solicitados</p>
                                                <button 
                                                    onClick={() => handleAcceptJob(job)}
                                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
                                                >
                                                    Aceptar <ChevronRight size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-20 bg-white/80 backdrop-blur rounded-[3rem] shadow-sm">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 animate-pulse"><MapPinned size={32}/></div>
                                            <p className="text-slate-400 font-black uppercase text-xs">Buscando solicitudes cercanas...</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- VISTA DESPACHO (ADMINISTRATIVA) --- */
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                    {/* Header Filter (Moved inside Dispatch View) */}
                    <div className="lg:col-span-12 flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit mb-4">
                        {['Todos', 'Pendiente', 'Asignado', 'En Proceso'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f as any)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* COLUMNA IZQUIERDA: LISTA DE SOLICITUDES */}
                    <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
                        <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 shrink-0">
                            <Search className="text-slate-400" size={20}/>
                            <input 
                                className="flex-1 bg-transparent outline-none text-sm font-bold uppercase placeholder-slate-300"
                                placeholder="Buscar paciente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {filteredRequests.map(req => (
                                <div 
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className={`bg-white border rounded-[2rem] p-5 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden ${selectedRequest?.id === req.id ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-sm">
                                                {req.patientName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-black text-slate-900 uppercase truncate">{req.patientName}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(req.requestedDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 pl-12">
                                        <div className="flex items-center gap-2 text-slate-500 text-[9px] uppercase font-bold truncate">
                                            <MapPin size={10} className="text-rose-500 shrink-0"/>
                                            <span className="truncate">{req.patientAddress}</span>
                                        </div>
                                        {req.assignedStaff && (
                                            <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-2 text-blue-600 text-[9px] font-black uppercase">
                                                <UserCheck size={10}/> {req.assignedStaff}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredRequests.length === 0 && (
                                <div className="py-20 text-center opacity-30">
                                    <LayoutList size={48} className="mx-auto mb-4 text-slate-400"/>
                                    <p className="text-xs font-black uppercase text-slate-400">Sin solicitudes</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: MAPA Y DETALLE */}
                    <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden relative">
                        {/* MAPA INTERACTIVO */}
                        <div className="flex-1 bg-slate-200 rounded-[3rem] overflow-hidden relative border-4 border-white shadow-xl group">
                            <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-99.1332,19.4326,12,0/1200x800?access_token=YOUR_TOKEN')] bg-cover bg-center opacity-80 grayscale group-hover:grayscale-0 transition-all duration-700"></div>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

                            {/* Markers */}
                            {filteredRequests.map(req => {
                                const coords = req.coordinates || { lat: 0.5, lng: 0.5 };
                                const isSelected = selectedRequest?.id === req.id;
                                
                                return (
                                    <div 
                                        key={req.id}
                                        onClick={() => setSelectedRequest(req)}
                                        className={`absolute cursor-pointer transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'scale-125 z-20' : 'scale-100 z-10 hover:scale-110'}`}
                                        style={{ left: `${coords.lat * 100}%`, top: `${coords.lng * 100}%` }}
                                    >
                                        <div className={`relative flex flex-col items-center ${isSelected ? 'animate-bounce' : ''}`}>
                                            <div className={`p-2 rounded-full shadow-lg border-2 border-white ${req.status === 'Pendiente' ? 'bg-rose-600' : req.status === 'Asignado' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                                                {req.status === 'Asignado' || req.status === 'En Camino' ? <Truck size={20} className="text-white"/> : <MapPin size={20} className="text-white"/>}
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-full mt-2 bg-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-30">
                                                    <p className="text-[9px] font-black uppercase text-slate-900">{req.patientName}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* DETALLE FLOTANTE */}
                        {selectedRequest && (
                            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md border border-slate-200 rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 z-30 flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedRequest.patientName}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin size={10}/> {selectedRequest.patientAddress}</p>
                                    {selectedRequest.assignedStaff && <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Asignado a: {selectedRequest.assignedStaff}</p>}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {selectedRequest.status === 'Pendiente' ? (
                                        <button 
                                            onClick={() => { setSelectedRequest(selectedRequest); setShowAssignModal(true); setAssignForm({ unit: selectedRequest.assignedUnit || '', staffId: '' }); }}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
                                        >
                                            <UserPlus size={14}/> Asignar Unidad
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleStatusChange('Pendiente')} className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-slate-200">Liberar</button>
                                            <button onClick={() => handleStatusChange('Finalizado')} className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 shadow-lg">Forzar Cierre</button>
                                        </div>
                                    )}
                                    <button onClick={() => setSelectedRequest(null)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200"><X size={18}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Asignación Manual (Solo Dispatch) */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 uppercase">Asignar Logística</h3>
                            <button onClick={() => setShowAssignModal(false)}><X size={24} className="text-slate-400"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad Móvil</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none"
                                    value={assignForm.unit}
                                    onChange={e => setAssignForm({...assignForm, unit: e.target.value})}
                                >
                                    <option value="">Seleccione Unidad...</option>
                                    <option value="Unidad Moto 01">Unidad Moto 01 (Rápida)</option>
                                    <option value="Unidad Moto 02">Unidad Moto 02 (Rápida)</option>
                                    <option value="Ambulancia A-04">Ambulancia A-04 (Traslado)</option>
                                    <option value="Vehículo Utilitario 1">Vehículo Utilitario 1</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal Responsable</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none"
                                    value={assignForm.staffId}
                                    onChange={e => setAssignForm({...assignForm, staffId: e.target.value})}
                                >
                                    <option value="">Seleccione Personal...</option>
                                    {availableStaff.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button onClick={confirmAssignment} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">
                            Confirmar Asignación
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeServices;
