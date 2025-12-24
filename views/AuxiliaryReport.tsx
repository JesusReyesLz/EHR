
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Microscope, ImageIcon, 
  Save, User, UserCheck, AlertTriangle, CheckCircle2,
  Table, FileText, Plus, Trash2, Info, Search, Activity, FlaskConical,
  Lock, ArrowRight, ShieldAlert, Thermometer, Droplet, UserPlus, Timer,
  FlaskRound as Flask
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
    studyRequested: 'Cargando estudios...',
    clinicalJustification: '',
    findings: '', 
    conclusion: '', 
    imagingTechnique: 'Proyección Estándar',
    incidents: 'Sin incidentes.',
    performedBy: 'Q.F.B. Beatriz Mendoza',
    validatedBy: 'Dr. Alejandro Méndez',
    dateTime: new Date().toLocaleString('es-MX'),
  });

  useEffect(() => {
     if (order) {
        const studies = order.content.labStudies || (order.type.includes('Solicitud') ? order.content.labStudies : []);
        const imaging = order.content.imagingStudies || (order.type.includes('Solicitud') ? order.content.imagingStudies : []);
        
        if (imaging && imaging.length > 0) {
           setReportType('Imagenología');
           setForm(f => ({ ...f, studyRequested: imaging.join(', ') }));
        } else if (studies && studies.length > 0) {
           setReportType('Laboratorio');
           setForm(f => ({ ...f, studyRequested: studies.join(', ') }));
           const initialResults = studies.map((s: string, idx: number) => {
              const meta = LAB_CATALOG.find(m => m.name === s);
              return { 
                id: idx.toString(), 
                analyte: s, 
                value: '', 
                unit: s.includes('Glucosa') ? 'mg/dL' : s.includes('Sanguíneo') ? 'N/A' : 'mg/dL', 
                refRange: meta?.indications || 'Normal', 
                status: 'Normal' 
              };
           });
           setLabResults(initialResults);
        }
     }
  }, [order]);

  if (!patient) return null;

  const handleSave = () => {
    if (reportType === 'Laboratorio' && labResults.some(r => !r.value)) {
       alert("Capture todos los resultados.");
       return;
    }

    const newNoteId = `RES-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: patient.id,
      type: `Reporte de Resultados: ${reportType}`,
      date: new Date().toLocaleString('es-MX'),
      author: form.performedBy,
      content: { 
        ...form, 
        reportType, 
        orderId: orderId,
        labResults: reportType === 'Laboratorio' ? labResults : undefined 
      },
      isSigned: true,
      hash: `CERT-AUX-${Math.random().toString(36).substr(2, 10).toUpperCase()}`
    };

    if (onUpdatePatient) {
       onUpdatePatient({
          ...patient,
          status: PatientStatus.ATTENDED 
       });
    }

    onSaveNote(newNote);
    alert("Resultados Certificados y Archivados.");
    navigate(`/`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500 px-4">
      
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
             <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Consola Analítica</h1>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Carga de Resultados • NOM-024 Compatible</p>
          </div>
        </div>
        <div className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-3">
           <Flask size={16} /> {reportType}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           
           <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm flex items-center justify-between overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-32 bg-slate-50 -skew-x-12 translate-x-10"></div>
              <div className="flex items-center gap-8 relative z-10">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">{patient.name.charAt(0)}</div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{patient.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{patient.curp} • {patient.age}A • {patient.sex === 'M' ? 'HOMBRE' : 'MUJER'}</p>
                 </div>
              </div>
           </div>

           {reportType === 'Laboratorio' ? (
             <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-2xl overflow-hidden">
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <Table size={20} className="text-indigo-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Panel de Captura Analítica</h3>
                   </div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Puntos de datos más juntos</p>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                            <th className="px-8 py-4">Analito</th>
                            <th className="px-4 py-4 text-center">Valor</th>
                            <th className="px-4 py-4 text-center">Unidad</th>
                            <th className="px-4 py-4 text-center">Referencia</th>
                            <th className="px-8 py-4 text-center">Estatus</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {labResults.map((r, i) => (
                            <tr key={r.id} className="hover:bg-indigo-50/20 transition-all group">
                               <td className="px-8 py-3 text-[11px] font-black text-slate-700 uppercase tracking-tight leading-none">{r.analyte}</td>
                               <td className="px-4 py-3">
                                  <input 
                                    className="w-24 mx-auto block bg-white border-2 border-slate-200 p-3 rounded-xl font-black text-center text-indigo-700 text-xl outline-none focus:border-indigo-600 transition-all" 
                                    value={r.value} 
                                    onChange={e => setLabResults(labResults.map(lr => lr.id === r.id ? {...lr, value: e.target.value} : lr))} 
                                    placeholder="0.00" 
                                  />
                               </td>
                               <td className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase">{r.unit}</td>
                               <td className="px-4 py-3 text-center text-[9px] font-bold text-slate-400 uppercase italic leading-tight max-w-[120px]">{r.refRange}</td>
                               <td className="px-8 py-3 text-center">
                                  <select 
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm cursor-pointer border-none outline-none ${r.status !== 'Normal' ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'}`}
                                    value={r.status}
                                    onChange={e => setLabResults(labResults.map(lr => lr.id === r.id ? {...lr, status: e.target.value} : lr))}
                                  >
                                     <option>Normal</option><option>Alto</option><option>Bajo</option>
                                  </select>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[3.5rem] p-12 shadow-2xl space-y-10 animate-in zoom-in-95">
                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-900 uppercase block ml-2">Técnica Radiológica / Procedimiento</label>
                      <input className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-tight" value={form.imagingTechnique} onChange={e => setForm({...form, imagingTechnique: e.target.value})} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-900 uppercase block ml-2">Descripción de Hallazgos</label>
                      <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-64 text-sm font-medium italic leading-relaxed outline-none shadow-inner" value={form.findings} onChange={e => setForm({...form, findings: e.target.value})} />
                   </div>
                </div>
             </div>
           )}

           <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[2.5rem] p-8 space-y-4">
              <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block ml-2">Interpretación Diagnóstica / Conclusión</label>
              <textarea 
                className="w-full p-6 bg-white border border-indigo-200 rounded-[2rem] h-24 text-sm font-black uppercase outline-none focus:border-indigo-600" 
                value={form.conclusion} 
                onChange={e => setForm({...form, conclusion: e.target.value})} 
                placeholder="Escriba el dictamen final..."
              />
           </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white border-t-8 border-indigo-600 rounded-[3.5rem] p-12 shadow-2xl space-y-10 sticky top-32">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-4"><UserCheck size={24} /> Validación Sanitaria</h3>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Técnico / Analista que realiza</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase" value={form.performedBy} onChange={e => setForm({...form, performedBy: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Médico / Químico Responsable</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase" value={form.validatedBy} onChange={e => setForm({...form, validatedBy: e.target.value})} />
                 </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Cierre</p>
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                   <span className="text-[9px] font-bold text-slate-600 uppercase">Muestras Validadas</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                   <span className="text-[9px] font-bold text-slate-600 uppercase">Control de Calidad OK</span>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] hover:bg-emerald-600 transition-all flex items-center justify-center gap-5"
              >
                 <Save size={24} /> Finalizar y Sellar
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryReport;
