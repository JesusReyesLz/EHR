
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, History, Search, Filter, Eye, Printer, 
  Database, User, Clock, Activity, FileText, ClipboardList
} from 'lucide-react';
import { Patient, ClinicalNote, ModuleType } from '../types';

const HistoryRegistries: React.FC<{ patients: Patient[], notes: ClinicalNote[] }> = ({ patients, notes }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialModule = (location.state?.module as ModuleType) || ModuleType.OUTPATIENT;
  
  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [searchTerm, setSearchTerm] = useState('');

  const moduleHistory = useMemo(() => {
    // Obtenemos todas las notas firmadas del módulo seleccionado
    return notes.filter(n => {
      const p = patients.find(pat => pat.id === n.patientId);
      return p?.assignedModule === selectedModule && n.isSigned;
    });
  }, [selectedModule, notes, patients]);

  const filteredHistory = moduleHistory.filter(n => {
    const p = patients.find(pat => pat.id === n.patientId);
    return (p?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            n.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.id.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
           <button onClick={() => navigate('/')} className="flex items-center text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] hover:opacity-70 transition-all">
              <ChevronLeft size={14} className="mr-2" /> Volver al Monitor
           </button>
           <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Archivo de Atenciones</h1>
           <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Auditoría Clínica por Módulo Sanitario</p>
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
                 placeholder={`Filtrar en el histórico de ${selectedModule}...`}
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
                     <th className="px-10 py-6">Fecha / Hora</th>
                     <th className="px-10 py-6">Paciente / CURP</th>
                     <th className="px-10 py-6">Tipo de Nota / Intervención</th>
                     <th className="px-10 py-6">Dictamen / Hallazgo</th>
                     <th className="px-10 py-6 text-right">Expediente</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(note => {
                    const p = patients.find(pat => pat.id === note.patientId);
                    return (
                       <tr key={note.id} className="hover:bg-slate-50 transition-all group">
                          <td className="px-10 py-8">
                             <p className="text-[10px] font-black text-slate-900 uppercase">{note.date}</p>
                             <p className="text-[8px] text-slate-400 font-mono mt-1">Sello: {note.hash?.substr(0,12)}</p>
                          </td>
                          <td className="px-10 py-8">
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{p?.name}</p>
                             <p className="text-[9px] text-slate-400 font-mono mt-1">{p?.curp}</p>
                          </td>
                          <td className="px-10 py-8">
                             <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[8px] font-black uppercase border border-blue-100">{note.type}</span>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 flex items-center gap-1"><Clock size={10} /> Atendió: {note.author}</p>
                          </td>
                          <td className="px-10 py-8">
                             <p className="text-[10px] text-slate-500 font-bold uppercase italic line-clamp-2 max-w-[300px]">
                                {note.content.diagnosis || note.content.conclusion || note.content.studyRequested || 'Sin descripción'}
                             </p>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <button onClick={() => navigate(`/patient/${note.patientId}`, { state: { openNoteId: note.id } })} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg">
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
                          <p className="text-xs font-black uppercase tracking-widest">Sin registros históricos en este filtro</p>
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
