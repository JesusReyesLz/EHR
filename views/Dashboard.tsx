
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus,
  Clock,
  Activity,
  ArrowRightCircle,
  Stethoscope,
  Filter,
  MoreVertical,
  MapPin,
  AlertCircle,
  Microscope,
  LayoutGrid,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { ModuleType, Patient, PatientStatus } from '../types';

interface DashboardProps {
  module: ModuleType;
  patients: Patient[];
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onModuleChange: (mod: ModuleType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ module, patients, onUpdateStatus, onModuleChange }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const modules = Object.values(ModuleType).filter(m => m !== ModuleType.ADMIN);

  // Pesos de prioridad por estatus para ordenamiento
  const statusPriority = useMemo(() => ({
    [PatientStatus.TRIAGE]: 0,
    [PatientStatus.IN_CONSULTATION]: 1,
    [PatientStatus.WAITING]: 2,
    [PatientStatus.ADMITTED]: 3,
    [PatientStatus.ATTENDED]: 4,
  }), []);

  const activePatients = useMemo(() => {
    return patients
      .filter(p => 
        p.assignedModule === module &&
        p.status !== PatientStatus.ATTENDED &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.curp.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
  }, [patients, module, searchTerm, statusPriority]);

  const getStatusStyle = (status: PatientStatus) => {
    switch (status) {
      case PatientStatus.TRIAGE: return 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';
      case PatientStatus.IN_CONSULTATION: return 'bg-blue-50 text-blue-800 border-blue-200';
      case PatientStatus.WAITING: return 'bg-amber-50 text-amber-800 border-amber-200';
      case PatientStatus.ADMITTED: return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSecondaryHeader = () => {
    switch (module) {
      case ModuleType.OUTPATIENT: return "Horario de Cita";
      case ModuleType.EMERGENCY:
      case ModuleType.HOSPITALIZATION: return "Cama / Ubicación";
      case ModuleType.AUXILIARY: return "Estudio / Servicio";
      default: return "Referencia";
    }
  };

  const getModuleIcon = (mod: ModuleType) => {
    switch (mod) {
      case ModuleType.OUTPATIENT: return <Clock className="w-4 h-4" />;
      case ModuleType.EMERGENCY: return <Activity className="w-4 h-4" />;
      case ModuleType.HOSPITALIZATION: return <MapPin className="w-4 h-4" />;
      case ModuleType.AUXILIARY: return <Microscope className="w-4 h-4" />;
      default: return <LayoutGrid className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Bar con Breadcrumb Operativo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Panel de Gestión Clínica</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span className="text-slate-900">{module}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{module}</h1>
          <p className="text-slate-600 text-sm font-medium">Control de pacientes activos y cola de atención priorizada.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 transition-all shadow-sm hover:border-slate-300">
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/new-patient')}
            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5 mr-3" />
            Ingresar Paciente
          </button>
        </div>
      </div>

      {/* Navegación Interna de Módulos (Tabs) */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        {modules.map((mod) => (
          <button
            key={mod}
            onClick={() => onModuleChange(mod)}
            className={`flex items-center px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              module === mod 
              ? 'bg-slate-900 text-white shadow-lg' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="mr-2.5">{getModuleIcon(mod)}</span>
            {mod}
            {module === mod && (
              <span className="ml-2.5 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px]">
                {patients.filter(p => p.assignedModule === mod && p.status !== PatientStatus.ATTENDED).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder={`Buscar en ${module}...`}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-600 uppercase text-[9px] font-black tracking-[0.2em]">
                <th className="px-10 py-6">Identificación y Datos Generales</th>
                <th className="px-10 py-6">{getSecondaryHeader()}</th>
                <th className="px-10 py-6">Prioridad / Estatus</th>
                <th className="px-10 py-6 text-right">Manejo Clínico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activePatients.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black mr-5 border-2 border-white shadow-md group-hover:bg-blue-600 transition-colors">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm tracking-tight uppercase">{p.name}</p>
                        <div className="flex items-center space-x-3 mt-1">
                           <span className="text-[10px] text-slate-600 font-mono font-bold">{p.curp}</span>
                           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                           <span className="text-[10px] text-blue-700 font-black uppercase tracking-widest">{p.age}A • {p.sex}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    {module === ModuleType.OUTPATIENT && (
                      <div className="flex items-center text-xs font-black text-slate-800">
                        <Clock className="w-4 h-4 mr-2.5 text-blue-600" />
                        {p.appointmentTime || '--:--'}
                      </div>
                    )}
                    {(module === ModuleType.EMERGENCY || module === ModuleType.HOSPITALIZATION) && (
                      <div className="flex items-center text-xs font-black text-slate-800">
                        <MapPin className="w-4 h-4 mr-2.5 text-indigo-600" />
                        {p.bedNumber || 'BOX-00'}
                      </div>
                    )}
                    {module === ModuleType.AUXILIARY && (
                      <div className="flex items-center text-xs font-black text-slate-800">
                        <Microscope className="w-4 h-4 mr-2.5 text-emerald-600" />
                        {p.reason || 'ESTUDIO GENERAL'}
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-widest ${getStatusStyle(p.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2.5 ${p.status === PatientStatus.TRIAGE ? 'bg-rose-500 animate-pulse' : 'bg-current'}`}></span>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => navigate(`/patient/${p.id}`)}
                        className="flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
                      >
                        Ver Expediente
                        <ArrowRightCircle className="w-4 h-4 ml-2.5" />
                      </button>
                      <button className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                         <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {activePatients.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-32 text-center">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                         <AlertCircle className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-black text-lg uppercase tracking-tight">No hay pacientes activos en {module}</p>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Todos los servicios programados para este módulo han sido atendidos.</p>
                      <button 
                        onClick={() => navigate('/new-patient')}
                        className="mt-6 text-blue-700 font-black text-[10px] uppercase tracking-widest hover:underline"
                      >
                        Registrar nueva atención
                      </button>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
