
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, History, Search, Filter, Eye, Printer, 
  Database, User, Clock, Activity, FileText, ClipboardList, Edit, X, Save
} from 'lucide-react';
import { Patient, ClinicalNote, ModuleType, PatientStatus } from '../types';

const HistoryRegistries: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient?: (p: Patient) => void }> = ({ patients, notes, onUpdatePatient }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialModule = (location.state?.module as ModuleType) || ModuleType.OUTPATIENT;
  
  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({ assignedModule: ModuleType.OUTPATIENT, program: '' });

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

  const handleEditClick = (p: Patient) => {
    setEditingPatient(p);
    setEditForm({
      assignedModule: p.assignedModule,
      program: p.history?.dischargeData?.program || 'Consulta General'
    });
  };

  const handleSaveEdit = () => {
    if (!editingPatient || !onUpdatePatient) return;
    
    const updatedPatient = {
      ...editingPatient,
      assignedModule: editForm.assignedModule,
      history: {
        ...editingPatient.history,
        dischargeData: {
          ...editingPatient.history?.dischargeData,
          program: editForm.program
        }
      }
    };
    
    onUpdatePatient(updatedPatient);
    setEditingPatient(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 no-print">
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

      <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
         <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
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
            <div className="flex gap-4 no-print">
               <button onClick={() => window.print()} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 shadow-sm border border-slate-200"><Printer size={20} /></button>
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
                     <th className="px-10 py-6 text-right no-print">Expediente</th>
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
                          <td className="px-10 py-8 text-right no-print">
                             <div className="flex items-center justify-end gap-2">
                               <button onClick={() => handleEditClick(p)} className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all shadow-sm">
                                  <Edit size={18} />
                               </button>
                               <button onClick={() => navigate(`/patient/${p.id}`)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
                                  <Eye size={18} />
                               </button>
                             </div>
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

      {/* MODAL DE EDICIÓN HISTÓRICA */}
      {editingPatient && (
        <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Editar Registro Histórico</h3>
                 <button onClick={() => setEditingPatient(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Módulo Asignado</label>
                    <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none"
                        value={editForm.assignedModule}
                        onChange={e => setEditForm({...editForm, assignedModule: e.target.value as ModuleType})}
                    >
                        {Object.values(ModuleType).filter(m => m !== ModuleType.ADMIN && m !== ModuleType.MONITOR).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Programa / Servicio (SUIVE)</label>
                    <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none"
                        value={editForm.program}
                        onChange={e => setEditForm({...editForm, program: e.target.value})}
                    >
                        <option value="Consulta General">Consulta General</option>
                        <option value="Urgencias">Urgencias</option>
                        <option value="Hospitalización">Hospitalización</option>
                        <option value="Laboratorio">Laboratorio</option>
                        <option value="Imagenología">Imagenología</option>
                        <option value="Odontología">Odontología</option>
                        <option value="Psicología">Psicología</option>
                        <option value="Nutrición">Nutrición</option>
                        <option value="Planificación Familiar">Planificación Familiar</option>
                        <option value="Control Prenatal">Control Prenatal</option>
                        <option value="Control Niño Sano">Control Niño Sano</option>
                        <option value="Crónico-Degenerativas">Crónico-Degenerativas</option>
                        <option value="Salud Mental">Salud Mental</option>
                        <option value="Detección Cáncer">Detección Cáncer</option>
                        <option value="Telemedicina">Telemedicina</option>
                    </select>
                 </div>
              </div>

              <button onClick={handleSaveEdit} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                 <Save size={18} /> Guardar Cambios
              </button>
           </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print, nav, aside, button { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0.5cm !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-7xl { max-width: 100% !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #000 !important; }
          @page { margin: 0.5cm; size: landscape; }
        }
      `}</style>
    </div>
  );
};

export default HistoryRegistries;
