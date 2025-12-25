
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, FlaskConical, ImageIcon, X, AlertCircle, CheckCircle2, ShieldCheck, Lock, Beaker, FileText, Activity } from 'lucide-react';
import { Patient, ClinicalNote, PatientStatus } from '../types';

const AuxiliaryReport: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [reportType, setReportType] = useState<'Laboratorio' | 'Imagenología'>('Laboratorio');
  
  // Extraer estudios dinámicamente de la orden (p.reason)
  const requestedStudies = useMemo(() => {
    if (!patient?.reason) return [];
    return patient.reason.split(', ').filter(s => s.length > 0);
  }, [patient]);

  const [labResults, setLabResults] = useState<any[]>([]);
  const [findings, setFindings] = useState('');
  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (requestedStudies.length > 0) {
      setLabResults(requestedStudies.map(study => ({
        analyte: study,
        value: '',
        unit: 'N/A',
        refRange: 'Ver Anexo',
        status: 'Normal'
      })));
    }
  }, [requestedStudies]);

  if (!patient) return <div className="p-20 text-center uppercase font-black">Paciente no encontrado</div>;

  const handleSave = () => {
    const hasEmpty = labResults.some(r => !r.value && reportType === 'Laboratorio');
    if (hasEmpty && reportType === 'Laboratorio') {
       if (!window.confirm("Hay campos vacíos en los resultados. ¿Desea continuar con el reporte parcial?")) return;
    }

    const newNoteId = `RES-${Date.now()}`;
    onSaveNote({
      id: newNoteId,
      patientId: patient.id,
      type: `Reporte Final de ${reportType}`,
      date: new Date().toLocaleString('es-MX'),
      author: 'Q.F.B. Beatriz Mendoza',
      content: { 
        reportType, 
        labResults: reportType === 'Laboratorio' ? labResults : undefined, 
        findings,
        requestedStudies 
      },
      isSigned: true,
      hash: `CERT-AUX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    });

    onUpdatePatient({ ...patient, status: PatientStatus.READY_RESULTS });
    navigate(`/patient/${patient.id}`, { state: { openNoteId: newNoteId } });
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">VALIDACIÓN DE RESULTADOS</p>
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Captura Técnica de Servicios</h1>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
           <button onClick={() => setReportType('Laboratorio')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Laboratorio' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Laboratorio</button>
           <button onClick={() => setReportType('Imagenología')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Imagenología' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Imagenología</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           {/* HEADER PACIENTE COMPACTO */}
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between border-l-[10px] border-indigo-500">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400"><Beaker size={28} /></div>
                 <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ORDEN DE SERVICIO</p>
                    <h2 className="text-xl font-black uppercase">{patient.name}</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Estudios solicitados: {requestedStudies.length}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">FOLIO DE ADMISIÓN</p>
                 <p className="text-lg font-black">{patient.id}</p>
              </div>
           </div>

           {reportType === 'Laboratorio' ? (
             <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-sm overflow-hidden">
                <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                   <h3 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2">
                      <Activity size={16} /> Parámetros Analíticos Solicitados
                   </h3>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr>
                        <th className="px-10 py-5">Estudio / Analito</th>
                        <th className="px-4 py-5 text-center">Resultado</th>
                        <th className="px-4 py-5 text-center">Unidad</th>
                        <th className="px-4 py-5 text-center">Ref.</th>
                        <th className="px-10 py-5 text-center">Estatus</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {labResults.map((r, i) => (
                         <tr key={i} className="hover:bg-indigo-50/20 transition-all">
                            <td className="px-10 py-6 text-xs font-black uppercase text-slate-700">{r.analyte}</td>
                            <td className="px-4 py-6">
                               <input 
                                 className="w-28 mx-auto block bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-black text-center text-indigo-700 focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner" 
                                 value={r.value} 
                                 placeholder="0.0"
                                 onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, value: e.target.value} : lr))} 
                               />
                            </td>
                            <td className="px-4 py-6 text-center"><input className="w-16 bg-transparent border-none text-[10px] text-center font-bold text-slate-400 uppercase" value={r.unit} onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, unit: e.target.value} : lr))} /></td>
                            <td className="px-4 py-6 text-center text-[10px] font-bold text-slate-400">{r.refRange}</td>
                            <td className="px-10 py-6 text-center">
                               <select 
                                 className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase text-white transition-all shadow-md outline-none cursor-pointer ${r.status === 'Normal' ? 'bg-emerald-500' : 'bg-rose-600'}`} 
                                 value={r.status} 
                                 onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, status: e.target.value} : lr))}
                               >
                                  <option>Normal</option><option>Alto</option><option>Bajo</option>
                               </select>
                            </td>
                         </tr>
                      ))}
                      {labResults.length === 0 && (
                        <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">No se cargaron analitos</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[3.5rem] p-12 space-y-10 shadow-sm">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest block ml-2 text-blue-600">Descripción de Hallazgos Radiológicos / Ultrasonográficos</label>
                   <textarea 
                     className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-64 text-sm font-medium italic outline-none shadow-inner focus:bg-white focus:border-blue-400 transition-all leading-relaxed" 
                     placeholder="Inicie dictamen radiológico..."
                     value={findings} 
                     onChange={e => setFindings(e.target.value)} 
                   />
                </div>
                <div className="p-8 bg-blue-50 border border-dashed border-blue-200 rounded-3xl flex items-center gap-6">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><ImageIcon /></div>
                   <p className="text-[10px] text-blue-900 font-bold uppercase leading-relaxed max-w-lg">
                      "Para estudios de imagenología, se recomienda adjuntar las placas o archivos DICOM en la sección de anexos del expediente una vez sellada la nota."
                   </p>
                </div>
             </div>
           )}
        </div>
        
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-10 border border-white/10 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-48 bg-indigo-600/10 -skew-x-12 translate-x-24"></div>
              
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-4 text-indigo-400 border-b border-white/10 pb-4">
                    <ShieldCheck size={24} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Protocolo de Cierre</h3>
                 </div>
                 <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                    "Al finalizar este reporte, los resultados se integrarán de forma permanente al Expediente Clínico Electrónico del paciente y se habilitará la opción de impresión para el paciente."
                 </p>
                 <div className="bg-white/5 p-6 rounded-2xl space-y-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Validador Responsable</p>
                    <p className="text-[10px] font-bold text-white uppercase">Q.F.B. BEATRIZ MENDOZA</p>
                    <p className="text-[9px] text-indigo-400 font-black uppercase">NOM-007-SSA3-2011</p>
                 </div>
              </div>

              <button 
                onClick={handleSave} 
                className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-5 relative z-10 active:scale-95"
              >
                <Save size={24} /> GUARDAR Y FINALIZAR
              </button>
           </div>

           <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex items-start gap-5 shadow-sm">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-900 font-bold uppercase leading-relaxed">
                 Asegúrese de que los valores de referencia sean los adecuados para la edad y sexo del paciente antes de realizar el sellado digital.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryReport;
