
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Microscope, ImageIcon, 
  Clock, Save, User, UserCheck, AlertTriangle, CheckCircle2,
  Table, FileText, Plus, Trash2, Info, Search, Activity
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface AuxiliaryReportProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const AuxiliaryReport: React.FC<AuxiliaryReportProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [reportType, setReportType] = useState<'Laboratorio' | 'Imagenología'>('Laboratorio');
  
  // Estados para Laboratorio
  const [labResults, setLabResults] = useState([
    { id: '1', analyte: 'Glucosa en ayuno', value: '110', unit: 'mg/dL', refRange: '70-100', status: 'Alto' },
    { id: '2', analyte: 'Hemoglobina Glicosilada', value: '6.5', unit: '%', refRange: '4-5.6', status: 'Crítico' },
  ]);

  // Estados generales del reporte
  const [form, setForm] = useState({
    studyRequested: 'Química Sanguínea de 6 elementos y HbA1c',
    clinicalProblem: 'Control de Diabetes Mellitus Tipo 2, sospecha de descontrol glucémico.',
    findings: '', // Para imagenología
    conclusion: '', // Para imagenología
    incidents: 'Sin incidentes ni accidentes durante la toma o procesamiento.',
    performedBy: 'Q.F.B. Beatriz Mendoza',
    validatedBy: 'Dr. Alejandro Méndez',
    studyDateTime: new Date().toISOString().slice(0, 16),
  });

  if (!patient) return null;

  const handleSave = () => {
    const newNote: ClinicalNote = {
      id: `AUX-${Date.now()}`,
      patientId: patient.id,
      type: `Reporte de Servicios Auxiliares (${reportType})`,
      date: new Date().toLocaleString('es-MX'),
      author: form.validatedBy,
      content: { 
        ...form, 
        reportType, 
        labResults: reportType === 'Laboratorio' ? labResults : undefined 
      },
      isSigned: true,
      hash: `CERT-AUX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-indigo-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Servicios Auxiliares</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-indigo-500 mr-2" /> NOM-004-SSA3-2012 • Numeral 9.2
            </p>
          </div>
        </div>
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
           <button 
             onClick={() => setReportType('Laboratorio')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Laboratorio' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
           >
              <Microscope size={16} /> Laboratorio
           </button>
           <button 
             onClick={() => setReportType('Imagenología')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Imagenología' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
           >
              <ImageIcon size={16} /> Imagenología
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Ficha de Identificación del Paciente */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">{patient.name.charAt(0)}</div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente Identificado</p>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{patient.name}</h3>
                   <p className="text-[10px] text-slate-500 font-mono mt-1">{patient.curp}</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-8 text-center">
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Edad</p><p className="text-xs font-black">{patient.age} Años</p></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Sexo</p><p className="text-xs font-black">{patient.sex}</p></div>
             </div>
          </div>

          {/* Detalles del Estudio Solicitado */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
             <div className="flex items-center gap-4 text-indigo-700 border-b border-indigo-50 pb-4">
                <FileText size={24} />
                <h3 className="text-sm font-black uppercase tracking-widest">Información de la Solicitud</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Estudio Solicitado</label>
                   <input 
                     className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                     value={form.studyRequested} 
                     onChange={e => setForm({...form, studyRequested: e.target.value})} 
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Fecha y Hora del Estudio</label>
                   <input 
                     type="datetime-local"
                     className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                     value={form.studyDateTime} 
                     onChange={e => setForm({...form, studyDateTime: e.target.value})} 
                   />
                </div>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Problema Clínico en Estudio</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium outline-none italic leading-relaxed" 
                  value={form.clinicalProblem} 
                  onChange={e => setForm({...form, clinicalProblem: e.target.value})} 
                  placeholder="Justificación del estudio..."
                />
             </div>
          </div>

          {/* SECCIÓN DE RESULTADOS (Dinámica) */}
          {reportType === 'Laboratorio' ? (
            <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center">
                    <Microscope className="w-5 h-5 mr-3" /> Tabla de Resultados Analíticos
                  </h3>
                  <button 
                    onClick={() => setLabResults([...labResults, { id: Date.now().toString(), analyte: '', value: '', unit: '', refRange: '', status: 'Normal' }])}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all"
                  >
                     <Plus size={14} /> Añadir Analito
                  </button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                           <th className="px-6 py-4">ANALITO</th>
                           <th className="px-6 py-4 text-center">RESULTADO</th>
                           <th className="px-6 py-4 text-center">UNIDADES</th>
                           <th className="px-6 py-4 text-center">VALORES DE REF.</th>
                           <th className="px-6 py-4 text-center">ESTATUS</th>
                           <th className="px-6 py-4 text-right">ACCIONES</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 font-black text-[10px] text-slate-700">
                        {labResults.map((r, i) => (
                           <tr key={r.id} className="hover:bg-indigo-50/30">
                              <td className="px-6 py-4"><input className="bg-transparent font-black outline-none w-full" defaultValue={r.analyte} /></td>
                              <td className="px-6 py-4 text-center"><input className="bg-transparent text-center font-black outline-none w-full text-indigo-700" defaultValue={r.value} /></td>
                              <td className="px-6 py-4 text-center"><input className="bg-transparent text-center outline-none w-full text-slate-500" defaultValue={r.unit} /></td>
                              <td className="px-6 py-4 text-center font-medium"><input className="bg-transparent text-center outline-none w-full italic" defaultValue={r.refRange} /></td>
                              <td className="px-6 py-4 text-center">
                                 <select 
                                   className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase outline-none ${r.status === 'Alto' || r.status === 'Crítico' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
                                   defaultValue={r.status}
                                 >
                                    <option>Normal</option>
                                    <option>Alto</option>
                                    <option>Bajo</option>
                                    <option>Crítico</option>
                                 </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button onClick={() => setLabResults(labResults.filter(lr => lr.id !== r.id))} className="text-slate-200 hover:text-rose-600"><Trash2 size={16} /></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
               <div className="flex items-center gap-4 text-indigo-700 border-b border-indigo-50 pb-4">
                  <ImageIcon size={24} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Interpretación de Imagenología</h3>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Descripción de Hallazgos</label>
                  <textarea 
                    className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-64 text-sm outline-none shadow-inner leading-relaxed" 
                    value={form.findings} 
                    onChange={e => setForm({...form, findings: e.target.value})} 
                    placeholder="Describa los hallazgos radiológicos observados..."
                  />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Conclusión Radiológica / Impresión</label>
                  <textarea 
                    className="w-full p-6 bg-indigo-50/30 border border-indigo-100 rounded-[2rem] h-24 text-sm font-black outline-none italic" 
                    value={form.conclusion} 
                    onChange={e => setForm({...form, conclusion: e.target.value})} 
                    placeholder="Resumen del diagnóstico por imagen..."
                  />
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Vertical: Seguridad e Incidentes */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
           {/* Seguridad y Responsables */}
           <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden group">
              <ShieldCheck className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center relative z-10">
                 <UserCheck className="w-5 h-5 mr-3" /> Responsables del Estudio
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Personal que realizó</label>
                   <input 
                     className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white/10" 
                     value={form.performedBy} 
                     onChange={e => setForm({...form, performedBy: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Personal que valida (Interpretación)</label>
                   <input 
                     className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white/10" 
                     value={form.validatedBy} 
                     onChange={e => setForm({...form, validatedBy: e.target.value})}
                   />
                </div>
              </div>
           </div>

           {/* Incidentes o Accidentes */}
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center">
                 <AlertTriangle className="w-5 h-5 mr-3" /> Incidentes o Accidentes
              </h3>
              <textarea 
                 className="w-full p-6 bg-rose-50/10 border border-rose-100 rounded-[2rem] h-32 text-[10px] font-bold outline-none italic leading-relaxed"
                 value={form.incidents}
                 onChange={e => setForm({...form, incidents: e.target.value})}
                 placeholder="Reporte de incidentes durante el estudio..."
              />
           </div>

           <button 
             onClick={handleSave}
             className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 group"
           >
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> Certificar Reporte
           </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 2rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-7xl { max-width: 100% !important; }
          .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-indigo-600 { background: #4f46e5 !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #e2e8f0 !important; }
          .shadow-2xl, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          input, textarea { border: none !important; background: transparent !important; }
        }
      `}</style>
    </div>
  );
};

export default AuxiliaryReport;
