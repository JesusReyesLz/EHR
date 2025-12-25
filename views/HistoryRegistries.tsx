
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, History, Search, Filter, Eye, Printer, 
  Database, User, Clock, Activity, FileText, ClipboardList
} from 'lucide-react';
import { Patient, ClinicalNote, ModuleType, PatientStatus } from '../types';

const HistoryRegistries: React.FC<{ patients: Patient[], notes: ClinicalNote[] }> = ({ patients, notes }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialModule = (location.state?.module as ModuleType) || ModuleType.OUTPATIENT;
  
  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [searchTerm, setSearchTerm] = useState('');

  const finalizedPatients = useMemo(() => {
    // Obtenemos pacientes con estado ATENDIDO del módulo seleccionado
    return patients.filter(p => 
        p.assignedModule === selectedModule && 
        p.status === PatientStatus.ATTENDED &&
        !p.id.startsWith('OLD-') // Excluir registros fantasma de reagenda
    );
  }, [selectedModule, patients]);

  const filteredHistory = finalizedPatients.filter(p => {
    const search = searchTerm.toLowerCase();
    const dischargeData = p.history?.dischargeData;
    const diagnosis = dischargeData?.diagnosticos?.[0]?.name || p.reason || '';
    
    return (p.name.toLowerCase().includes(search) || 
            p.curp.toLowerCase().includes(search) ||
            diagnosis.toLowerCase().includes(search));
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
           <button onClick={() => navigate('/')} className="flex items-center text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] hover:opacity-70 transition-all">
              <ChevronLeft size={14} className="mr-2" /> Volver al Monitor
           </button>
           <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Archivo Histórico</h1>
           <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Consultas Finalizadas por Módulo</p>
        </div>
        <div className="flex flex-wrap items-center bg-white border border-slate-200 p-2 rounded-[2.5rem] shadow-sm gap-1">
           {Object.values(ModuleType).filter(m => m !== ModuleType.ADMIN && m !== ModuleType.MONITOR).map(m => (
             <button 
                key={m} 
                onClick={() => setSelectedModule(m)}
                className={`px-6 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${selectedModule === m ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                {m}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-2xl overflow-hidden">
         <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative flex-1 w-full max-w-2xl">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
               <input 
                 type="text" 
                 placeholder={`Buscar paciente o diagnóstico en ${selectedModule}...`}
                 className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-200 outline-none transition-all text-sm font-bold shadow-inner"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex gap-4">
               <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 shadow-sm border border-slate-200"><Printer size={20} /></button>
               <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 shadow-sm border border-slate-200"><Filter size={20} /></button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                     <th className="px-10 py-6">Fecha Cierre</th>
                     <th className="px-10 py-6">Paciente / CURP</th>
                     <th className="px-10 py-6">Diagnóstico Principal</th>
                     <th className="px-10 py-6">Programa / Detalles</th>
                     <th className="px-10 py-6 text-right">Expediente</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(p => {
                    const discharge = p.history?.dischargeData;
                    const mainDiag = discharge?.diagnosticos?.[0] || { name: p.reason, status: 'Presuntivo' };
                    
                    return (
                       <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                          <td className="px-10 py-8">
                             <p className="text-[10px] font-black text-slate-900 uppercase">{p.lastVisit}</p>
                             <p className="text-[8px] text-slate-400 font-mono mt-1">Folio: {p.id}</p>
                          </td>
                          <td className="px-10 py-8">
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                             <p className="text-[9px] text-slate-400 font-mono mt-1">{p.curp}</p>
                          </td>
                          <td className="px-10 py-8">
                             <p className="text-[10px] font-black text-blue-700 uppercase">{mainDiag.name}</p>
                             <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[7px] font-bold uppercase mt-1 inline-block border border-blue-100">
                                {mainDiag.status}
                             </span>
                          </td>
                          <td className="px-10 py-8">
                             <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                {discharge?.program ? <ClipboardList size={10} /> : <Activity size={10} />}
                                {discharge?.program || 'Consulta General'}
                             </p>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <button onClick={() => navigate(`/patient/${p.id}`)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2 ml-auto">
                                <Eye size={18} />
                             </button>
                          </td>
                       </tr>
                    );
                  })}
                  {filteredHistory.length === 0 && (
                    <tr>
                       <td colSpan={5} className="py-40 text-center opacity-30">
                          <History size={64} className="mx-auto mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">Sin consultas finalizadas en este módulo</p>
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

export default HistoryRegistries;
