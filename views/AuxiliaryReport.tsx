
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Microscope, ImageIcon, 
  Save, User, UserCheck, AlertTriangle, CheckCircle2,
  Table, FileText, Plus, Trash2, Info, Search, Activity, FlaskConical,
  Lock, ArrowRight, ShieldAlert, Thermometer, Droplet, UserPlus, Timer
} from 'lucide-react';
import { Patient, ClinicalNote, PatientStatus } from '../types';
import { LAB_CATALOG, IMAGING_CATALOG } from '../constants';

interface AuxiliaryReportProps {
  patients: Patient[];
  notes?: ClinicalNote[];
  onSaveNote: (note: ClinicalNote) => void;
  onUpdatePatient?: (p: Patient) => void;
}

const AuxiliaryReport: React.FC<AuxiliaryReportProps> = ({ patients, notes = [], onSaveNote, onUpdatePatient }) => {
  const { id, orderId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);
  const order = notes.find(n => n.id === orderId);

  const [reportType, setReportType] = useState<'Laboratorio' | 'Imagenología'>('Laboratorio');
  const [labResults, setLabResults] = useState<any[]>([]);

  const [form, setForm] = useState({
    studyRequested: order?.content.labStudies?.join(', ') || order?.content.imagingStudies?.join(', ') || 'Solicitud Técnica',
    clinicalJustification: order?.content.clinicalJustification || '',
    findings: '', 
    conclusion: '', 
    imagingTechnique: 'Proyección AP y Lateral',
    incidents: 'Sin incidentes durante el procesamiento.',
    performedBy: 'Q.F.B. Beatriz Mendoza',
    validatedBy: 'Dr. Alejandro Méndez',
    dateTime: new Date().toLocaleString('es-MX'),
  });

  useEffect(() => {
     if (order) {
        const studies = order.content.labStudies || [];
        const imaging = order.content.imagingStudies || [];
        
        if (imaging.length > 0) {
           setReportType('Imagenología');
        } else {
           setReportType('Laboratorio');
           // Generar filas basadas en el catálogo
           const initialResults = studies.map((s: string, idx: number) => {
              const meta = LAB_CATALOG.find(m => m.name === s);
              return { id: idx.toString(), analyte: s, value: '', unit: 'mg/dL', refRange: meta?.indications || 'N/A', status: 'Normal' };
           });
           setLabResults(initialResults);
        }
     }
  }, [order]);

  if (!patient) return null;

  const handleSave = () => {
    if (reportType === 'Laboratorio' && labResults.some(r => !r.value)) {
       alert("Debe capturar los valores de todos los analitos solicitados.");
       return;
    }

    const newNoteId = `RES-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: patient.id,
      type: `Reporte de Resultados: ${reportType}`,
      date: new Date().toLocaleString('es-MX'),
      author: form.validatedBy,
      content: { 
        ...form, 
        reportType, 
        orderId: orderId,
        labResults: reportType === 'Laboratorio' ? labResults : undefined 
      },
      isSigned: true,
      hash: `CERT-AUX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    // Al cerrar el reporte, el paciente ya está atendido en auxiliares
    if (onUpdatePatient) {
       onUpdatePatient({
          ...patient,
          status: PatientStatus.ATTENDED
       });
    }

    onSaveNote(newNote);
    alert("Resultados guardados y certificados. El paciente ha sido dado de alta del módulo de auxiliares.");
    navigate(`/`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header Operativo */}
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex flex-col md:flex-row justify-between items-center gap-8 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Captura de Resultados</h1>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <Timer size={14} className="text-indigo-500 mr-2" /> Fase Analítica y Post-Analítica
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
              <Microscope size={20} className="text-indigo-600" />
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest">{reportType}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           
           {/* Info del Paciente en el Reporte */}
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">{patient.name.charAt(0)}</div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{patient.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{patient.curp} • {patient.age}A • {patient.sex}</p>
                 </div>
              </div>
           </div>

           {/* CUERPO DEL REPORTE */}
           {reportType === 'Laboratorio' ? (
             <div className="bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><FlaskConical size={20} /></div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Análisis Clínicos (Resultados)</h3>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                            <th className="px-10 py-6">Parámetro / Analito</th>
                            <th className="px-6 py-6 text-center">Resultado</th>
                            <th className="px-6 py-6 text-center">Unidades</th>
                            <th className="px-6 py-6 text-center">Estado</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {labResults.map((r, i) => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-all">
                               <td className="px-10 py-6 text-sm font-black text-slate-700 uppercase">{r.analyte}</td>
                               <td className="px-6 py-6">
                                  <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-center text-indigo-700 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner text-lg" 
                                    value={r.value} 
                                    onChange={e => setLabResults(labResults.map(lr => lr.id === r.id ? {...lr, value: e.target.value} : lr))} 
                                    placeholder="0.0" 
                                    autoFocus={i === 0}
                                  />
                               </td>
                               <td className="px-6 py-6 text-center font-bold text-slate-400 uppercase text-xs">{r.unit}</td>
                               <td className="px-6 py-6 text-center">
                                  <select 
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase outline-none shadow-sm ${r.status !== 'Normal' ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'}`}
                                    value={r.status}
                                    onChange={e => setLabResults(labResults.map(lr => lr.id === r.id ? {...lr, status: e.target.value} : lr))}
                                  >
                                     <option>Normal</option><option>Alto</option><option>Bajo</option><option>Crítico</option>
                                  </select>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl space-y-12">
                <div className="flex items-center gap-4 text-indigo-700 border-b border-indigo-50 pb-6">
                   <ImageIcon size={28} />
                   <h3 className="text-sm font-black uppercase tracking-widest">Interpretación Radiológica</h3>
                </div>
                
                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Descripción de Hallazgos</label>
                      <textarea 
                        className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-64 text-sm font-medium outline-none italic leading-relaxed focus:bg-white transition-all shadow-inner"
                        placeholder="Describa estructuras anatómicas, lesiones observadas..."
                        value={form.findings}
                        onChange={e => setForm({...form, findings: e.target.value})}
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Impresión Diagnóstica / Conclusión</label>
                      <textarea 
                        className="w-full p-6 bg-indigo-50/20 border-2 border-indigo-100 rounded-[2rem] h-24 text-sm font-black uppercase outline-none focus:bg-indigo-50 transition-all"
                        placeholder="Resumen del diagnóstico por imagen..."
                        value={form.conclusion}
                        onChange={e => setForm({...form, conclusion: e.target.value})}
                      />
                   </div>
                </div>
             </div>
           )}

           {/* Bitácora de Incidentes */}
           <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6">
              <ShieldAlert className="text-amber-500 w-10 h-10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase">Control de Calidad Analítica</p>
                 <input className="w-full bg-transparent border-b border-slate-200 text-[10px] font-medium italic outline-none" value={form.incidents} onChange={e => setForm({...form, incidents: e.target.value})} />
              </div>
           </div>
        </div>

        {/* LADO DERECHO: ACCIONES Y FIRMAS */}
        <div className="lg:col-span-4 space-y-10">
           
           <div className="bg-slate-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-10 sticky top-32">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-4">
                 <UserCheck size={20} /> Validación Sanitaria
              </h3>
              
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Químico / Técnico Responsable</label>
                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase focus:ring-2 focus:ring-indigo-50 outline-none" value={form.performedBy} onChange={e => setForm({...form, performedBy: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Validado por (Cédula Prof.)</label>
                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase focus:ring-2 focus:ring-indigo-50 outline-none" value={form.validatedBy} onChange={e => setForm({...form, validatedBy: e.target.value})} />
                 </div>
              </div>

              <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-center shadow-xl border-b-4 border-indigo-800">
                 <Lock size={32} className="mx-auto mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight">Certificar Resultados con e.firma avanzada</p>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-8 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-5 group"
              >
                 <Save size={24} className="group-hover:scale-110 transition-transform" /> 
                 Firmar y Guardar
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryReport;
