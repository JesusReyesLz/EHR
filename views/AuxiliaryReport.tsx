
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Save, FlaskConical, ImageIcon, X, AlertCircle, 
  CheckCircle2, ShieldCheck, Lock, Beaker, FileText, Activity,
  User, Stethoscope, Clock, AlertTriangle, Microscope, Fingerprint,
  ClipboardList, List, LayoutList, ChevronDown, PenTool, Plus, Trash2
} from 'lucide-react';
import { Patient, ClinicalNote, PatientStatus } from '../types';
import { LAB_CATALOG, IMAGING_CATALOG } from '../constants';

const AuxiliaryReport: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [reportType, setReportType] = useState<'Laboratorio' | 'Imagenología'>('Laboratorio');
  
  // Extraer estudios dinámicamente de la orden (p.reason)
  // Si no hay reason (ej. nota manual), será array vacío.
  const requestedStudies = useMemo(() => {
    if (!patient?.reason) return [];
    // Basic filter to ignore long sentences, assume comma separation for studies
    const parts = patient.reason.split(', ').filter(s => s.length > 0 && s.length < 50); 
    return parts.length > 0 ? parts : [];
  }, [patient]);

  // Selección manual de estudio si no hay orden o se quiere reportar algo específico
  const [selectedStudyName, setSelectedStudyName] = useState('');
  const [customStudyName, setCustomStudyName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);

  // ESTADO DEL FORMULARIO COMPLETO
  const [form, setForm] = useState({
    // Contexto del Estudio
    studyDate: new Date().toISOString().split('T')[0],
    studyTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    requestingDr: 'Dr. Alejandro Méndez', // Debería venir de la orden original
    clinicalIndication: patient?.reason || '', // Problema clínico en estudio
    
    // Resultados Imagenología (Texto Libre Estructurado)
    technique: '', // Técnica usada
    findings: '', // Hallazgos
    conclusion: '', // Interpretación final
    category: '', // BIRADS, etc.

    // Calidad y Seguridad
    methodology: 'Automatizada / Referencia Estándar', // Método general
    incidents: 'Sin incidentes ni accidentes durante el procedimiento.',
    
    // Personal
    technicianName: '', // Quien realizó el estudio
    validatorName: 'Q.F.B. BEATRIZ MENDOZA', // Quien valida/interpreta
  });

  const [labResults, setLabResults] = useState<any[]>([]);

  // Inicialización de resultados de laboratorio (Tabla)
  useEffect(() => {
    // Si hay estudios solicitados y son tipo lab (o no definidos), inicializar tabla
    if (requestedStudies.length > 0 && reportType === 'Laboratorio') {
      setLabResults(requestedStudies.map(study => ({
        analyte: study,
        value: '',
        unit: 'N/A',
        refRange: 'Ver Anexo',
        status: 'Normal',
        method: '' 
      })));
    } else if (reportType === 'Laboratorio' && labResults.length === 0) {
        // Inicializar con una fila vacía para manual
        setLabResults([{ analyte: '', value: '', unit: '', refRange: '', status: 'Normal' }]);
    }
  }, [requestedStudies, reportType]);

  // Efecto para actualizar validador por defecto según tipo
  useEffect(() => {
      if (reportType === 'Imagenología') {
          setForm(prev => ({ ...prev, validatorName: 'Dr. Carlos Ruiz (Radiólogo)', methodology: 'Digital' }));
      } else {
          setForm(prev => ({ ...prev, validatorName: 'Q.F.B. Beatriz Mendoza', methodology: 'Automatizada' }));
      }
  }, [reportType]);

  if (!patient) return <div className="p-20 text-center uppercase font-black">Paciente no encontrado</div>;

  const addLabRow = () => {
      setLabResults([...labResults, { analyte: '', value: '', unit: '', refRange: '', status: 'Normal' }]);
  };

  const removeLabRow = (index: number) => {
      setLabResults(labResults.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validaciones
    if (!form.technicianName || !form.validatorName) {
        alert("Es obligatorio identificar tanto al personal que realizó el estudio como al profesional que valida.");
        return;
    }
    
    const studyTitle = selectedStudyName || customStudyName || (requestedStudies.length > 0 ? requestedStudies.join(', ') : 'Estudio General');
    
    if (reportType === 'Imagenología') {
        if (!form.findings || !form.conclusion) {
            alert("El reporte de imagenología requiere Hallazgos y Conclusión.");
            return;
        }
    }

    const newNoteId = `RES-${Date.now()}`;
    const reportTitle = reportType === 'Laboratorio' 
        ? 'Reporte de Resultados de Laboratorio' 
        : `Informe de Imagenología: ${studyTitle}`;

    onSaveNote({
      id: newNoteId,
      patientId: patient.id,
      type: reportTitle,
      date: new Date().toLocaleString('es-MX'),
      author: form.validatorName, // El responsable legal es quien valida
      content: { 
        ...form,
        reportType, 
        studyTitle,
        labResults: reportType === 'Laboratorio' ? labResults : undefined,
        requestedStudies,
      },
      isSigned: true,
      hash: `CERT-AUX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    });

    onUpdatePatient({ ...patient, status: PatientStatus.READY_RESULTS });
    navigate(`/patient/${patient.id}`, { state: { openNoteId: newNoteId } });
  };

  // Catálogo combinado para búsqueda manual
  const allStudies = reportType === 'Laboratorio' ? LAB_CATALOG : IMAGING_CATALOG;

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">SERVICIOS AUXILIARES DE DIAGNÓSTICO</p>
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Reporte Profesional y Técnico</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">NOM-004-SSA3-2012 • Expediente Clínico</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
           <button onClick={() => setReportType('Laboratorio')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${reportType === 'Laboratorio' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
               <FlaskConical size={14}/> Laboratorio
           </button>
           <button onClick={() => setReportType('Imagenología')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${reportType === 'Imagenología' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>
               <ImageIcon size={14}/> Imagenología
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           
           {/* 1. FICHA DE IDENTIFICACIÓN Y CONTEXTO DEL ESTUDIO */}
           <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                  <ClipboardList size={16} /> Contexto de la Solicitud
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Paciente</label>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                          <p className="text-sm font-black text-slate-900 uppercase">{patient.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{patient.age} Años • {patient.sex} • {patient.curp}</p>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Médico / Servicio Solicitante</label>
                      <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input 
                              className="w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-indigo-400 transition-all" 
                              value={form.requestingDr}
                              onChange={e => setForm({...form, requestingDr: e.target.value})}
                              placeholder="Nombre del médico..."
                          />
                      </div>
                  </div>
              </div>
              
              {/* SELECCIÓN MANUAL DE ESTUDIO (SI NO VIENE DE ORDEN O SE QUIERE CAMBIAR) */}
              <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-2 flex items-center justify-between">
                      <span>Estudio a Reportar</span>
                      <button onClick={() => setUseCustomName(!useCustomName)} className="text-indigo-600 underline cursor-pointer">{useCustomName ? 'Seleccionar de lista' : 'Escribir manualmente'}</button>
                  </label>
                  {useCustomName ? (
                      <input 
                          className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm font-black uppercase outline-none"
                          placeholder={`Escriba el nombre del estudio de ${reportType}...`}
                          value={customStudyName}
                          onChange={e => setCustomStudyName(e.target.value)}
                      />
                  ) : (
                      <select 
                          className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm font-black uppercase outline-none"
                          value={selectedStudyName}
                          onChange={e => setSelectedStudyName(e.target.value)}
                      >
                          <option value="">-- Seleccione Estudio --</option>
                          {requestedStudies.map((s, i) => <option key={`req-${i}`} value={s}>{s} (Solicitado)</option>)}
                          {allStudies.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                      </select>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha y Hora Realización</label>
                      <div className="flex gap-2">
                          <input type="date" className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.studyDate} onChange={e => setForm({...form, studyDate: e.target.value})} />
                          <input type="time" className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.studyTime} onChange={e => setForm({...form, studyTime: e.target.value})} />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Stethoscope size={10} /> Indicación Clínica</label>
                      <input 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-indigo-400" 
                          value={form.clinicalIndication}
                          onChange={e => setForm({...form, clinicalIndication: e.target.value})}
                          placeholder="Diagnóstico presuntivo o motivo..."
                      />
                  </div>
              </div>
           </div>

           {/* 2. RESULTADOS TÉCNICOS (DIFERENCIADO) */}
           {reportType === 'Laboratorio' ? (
             <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-sm overflow-hidden">
                <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2">
                      <Activity size={16} /> Resultados Analíticos
                   </h3>
                   <button onClick={addLabRow} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-200 transition-all flex items-center gap-2">
                      <Plus size={12}/> Agregar Analito
                   </button>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr>
                        <th className="px-6 py-4">Analito / Parámetro</th>
                        <th className="px-4 py-4 text-center">Resultado</th>
                        <th className="px-4 py-4 text-center">Unidad</th>
                        <th className="px-4 py-4 text-center">Ref.</th>
                        <th className="px-6 py-4 text-center">Estatus</th>
                        <th className="px-4 py-4"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {labResults.map((r, i) => (
                         <tr key={i} className="hover:bg-indigo-50/20 transition-all">
                            <td className="px-6 py-4">
                                <input 
                                   className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 text-xs font-black uppercase text-slate-700 outline-none"
                                   value={r.analyte}
                                   onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, analyte: e.target.value} : lr))}
                                   placeholder="Nombre del parametro..."
                                />
                            </td>
                            <td className="px-4 py-4">
                               <input 
                                 className="w-24 mx-auto block bg-slate-50 border-2 border-slate-200 p-2 rounded-xl font-black text-center text-indigo-700 focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner" 
                                 value={r.value} 
                                 placeholder="0.0"
                                 onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, value: e.target.value} : lr))} 
                               />
                            </td>
                            <td className="px-4 py-4 text-center"><input className="w-16 bg-transparent border-none text-[10px] text-center font-bold text-slate-400 uppercase" value={r.unit} onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, unit: e.target.value} : lr))} /></td>
                            <td className="px-4 py-4 text-center"><input className="w-24 bg-transparent border-none text-[10px] text-center font-bold text-slate-400" value={r.refRange} onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, refRange: e.target.value} : lr))} /></td>
                            <td className="px-6 py-4 text-center">
                               <select 
                                 className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-white transition-all shadow-md outline-none cursor-pointer ${r.status === 'Normal' ? 'bg-emerald-500' : 'bg-rose-600'}`} 
                                 value={r.status} 
                                 onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, status: e.target.value} : lr))}
                               >
                                  <option>Normal</option><option>Alto</option><option>Bajo</option><option>Positivo</option><option>Negativo</option>
                               </select>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <button onClick={() => removeLabRow(i)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           ) : (
             // --- IMAGENOLOGÍA / GABINETE (FORMATO NARRATIVO) ---
             <div className="bg-white border border-slate-200 rounded-[3.5rem] p-12 space-y-10 shadow-sm animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4 text-blue-600 border-b border-blue-50 pb-4">
                    <ImageIcon size={24}/>
                    <h3 className="text-lg font-black uppercase tracking-tight">Interpretación de Estudio</h3>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-500">Técnica del Estudio</label>
                       <input 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-400 transition-all"
                          placeholder="Ej: Tomografía Helicoidal multicorte, fases simple y contrastada..."
                          value={form.technique}
                          onChange={e => setForm({...form, technique: e.target.value})}
                       />
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-900 flex items-center gap-2"><LayoutList size={14}/> Hallazgos (Descripción Detallada)</label>
                       <textarea 
                         className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-96 text-sm font-medium outline-none shadow-inner focus:bg-white focus:border-blue-400 transition-all leading-relaxed resize-none" 
                         placeholder="Describa sistemáticamente las estructuras evaluadas (tejidos blandos, óseos, parénquima, etc.)..."
                         value={form.findings} 
                         onChange={e => setForm({...form, findings: e.target.value})} 
                       />
                   </div>
                </div>
                
                <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-blue-800 flex items-center gap-2"><PenTool size={14}/> Conclusión / Impresión Diagnóstica</label>
                       <textarea 
                         className="w-full p-6 bg-white border border-blue-200 rounded-3xl h-32 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 text-blue-900" 
                         placeholder="CONCLUSIÓN (EJ. FRACTURA TRANSVERSA DE TIBIA, BIRADS 4...)"
                         value={form.conclusion} 
                         onChange={e => setForm({...form, conclusion: e.target.value})} 
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Categoría (Opcional)</label>
                           <input 
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase"
                              placeholder="Ej: BIRADS 4C"
                              value={form.category}
                              onChange={e => setForm({...form, category: e.target.value})}
                           />
                       </div>
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Sugerencia</label>
                           <input 
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase"
                              placeholder="Ej: Correlacionar con clínica / Biopsia"
                           />
                       </div>
                   </div>
                </div>
             </div>
           )}
           
           {/* 3. REGISTRO DE CONTINGENCIAS E INCIDENTES */}
           <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={14} /> Registro de Incidentes / Accidentes
              </h3>
              <textarea 
                  className="w-full p-4 bg-white border border-rose-200 rounded-2xl h-24 text-xs font-medium text-slate-700 outline-none resize-none focus:ring-2 focus:ring-rose-200"
                  value={form.incidents}
                  onChange={e => setForm({...form, incidents: e.target.value})}
                  placeholder="Describa cualquier evento adverso (ej. extravasación, reacción vagal, hemólisis, falla de equipo)..."
              />
           </div>

        </div>
        
        {/* COLUMNA DERECHA: RESPONSABLES Y CIERRE */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-10 border border-white/10 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-48 bg-indigo-600/10 -skew-x-12 translate-x-24"></div>
              
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-4 text-indigo-400 border-b border-white/10 pb-4">
                    <ShieldCheck size={24} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Responsables del Estudio</h3>
                 </div>
                 
                 <div className="space-y-6">
                     <div className="bg-white/5 p-5 rounded-2xl space-y-2 border border-white/10">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Fingerprint size={12} />
                            <p className="text-[8px] font-black uppercase tracking-widest">Realizó (Técnico / Operativo)</p>
                        </div>
                        <input 
                            className="w-full bg-transparent border-b border-white/20 text-[10px] font-bold text-white uppercase outline-none focus:border-emerald-400 transition-all py-1 placeholder-slate-600" 
                            value={form.technicianName} 
                            onChange={(e) => setForm({...form, technicianName: e.target.value})}
                            placeholder="Nombre del Técnico/Enfermero"
                        />
                     </div>

                     <div className="bg-white/5 p-5 rounded-2xl space-y-2 border border-white/10">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <FileText size={12} />
                            <p className="text-[8px] font-black uppercase tracking-widest">Valida / Interpreta (Profesional)</p>
                        </div>
                        <input 
                            className="w-full bg-transparent border-b border-white/20 text-[10px] font-bold text-white uppercase outline-none focus:border-indigo-400 transition-all py-1 placeholder-slate-600" 
                            value={form.validatorName} 
                            onChange={(e) => setForm({...form, validatorName: e.target.value})}
                            placeholder="Nombre del Especialista/QFB"
                        />
                        <p className="text-[8px] text-indigo-400 font-bold uppercase mt-1 flex justify-end">Cédula Prof. requerida</p>
                     </div>
                 </div>

                 <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed pt-4 border-t border-white/10">
                    "Al firmar digitalmente, el profesional asume la responsabilidad legal de la veracidad y calidad de los resultados reportados."
                 </p>
              </div>

              <button 
                onClick={handleSave} 
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-5 relative z-10 active:scale-95"
              >
                <Save size={20} /> CERTIFICAR Y EMITIR
              </button>
           </div>

           <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex items-start gap-5 shadow-sm">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-900 font-bold uppercase leading-relaxed">
                 Verifique los valores de referencia según edad y sexo del paciente. Reporte valores críticos de inmediato al médico tratante.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryReport;
