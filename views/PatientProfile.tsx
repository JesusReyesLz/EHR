
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, History, Activity, X, User, ShieldCheck, ClipboardList, 
  FileEdit, ChevronRight, Clock, Stethoscope, Microscope, Eye, 
  FileText, ImageIcon, LayoutGrid, Zap, FlaskConical, Download,
  Maximize2, ZoomIn, ZoomOut, RotateCw, HeartPulse, TrendingUp,
  Thermometer, Wind, Droplet, Printer, QrCode, BadgeCheck, MapPin, Phone,
  Info, Calendar, ArrowLeft, ArrowRight, EyeOff, AlertCircle, FileStack, Flame, Scale, Ruler, Heart
} from 'lucide-react';
import { NOTE_CATEGORIES } from '../constants';
import { Patient, ClinicalNote, Vitals } from '../types';
import { VitalsEditorModal } from './Dashboard';

const PatientProfile: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient: (p: Patient) => void, onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onUpdatePatient, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const patient = patients.find(p => p.id === id);
  const patientNotes = useMemo(() => notes.filter(n => n.patientId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [patient?.vitalsHistory, scrollRef.current]);

  // Effect to handle automatic note opening from navigation state
  useEffect(() => {
    if (location.state && (location.state as any).openNoteId) {
      const noteId = (location.state as any).openNoteId;
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setSelectedNote(note);
        // Clear history state to prevent reopening on simple refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, notes]);

  const historyData = useMemo(() => {
    if (!patient?.vitalsHistory || patient.vitalsHistory.length === 0) return null;
    return [...patient.vitalsHistory].reverse();
  }, [patient]);

  const renderIntegratedMonitor = () => {
    if (!historyData) return (
      <div className="py-20 text-center opacity-10 flex flex-col items-center">
         <Activity size={80} className="mb-4" />
         <p className="text-[10px] font-black uppercase tracking-widest">Sin registros suficientes para graficar</p>
      </div>
    );

    const paddingX = 50;
    const pointSpacing = 50;
    const chartWidth = Math.max(800, (historyData.length - 1) * pointSpacing + paddingX * 2);
    const laneHeight = 80;
    const spacing = 20;
    const totalHeight = (laneHeight + spacing) * 4;

    const lanes = [
      { label: 'T/A', key: 'bp', color: '#2563eb', min: 60, max: 200, threshold: 140, unit: 'mmHg' },
      { label: 'F.C.', key: 'hr', color: '#e11d48', min: 40, max: 160, threshold: 100, unit: 'LPM' },
      { label: 'T°', key: 'temp', color: '#d97706', min: 34, max: 41, threshold: 38, unit: '°C' },
      { label: 'SpO2', key: 'o2', color: '#059669', min: 70, max: 100, threshold: 94, isLowThreshold: true, unit: '%' }
    ];

    const getVal = (d: Vitals, key: string) => {
      if (key === 'bp') return parseInt(d.bp?.split('/')[0]) || 120;
      return (d as any)[key] || 0;
    };

    const getY = (val: number, laneIdx: number, config: any) => {
      const top = laneIdx * (laneHeight + spacing);
      const range = config.max - config.min;
      const normalized = (val - config.min) / range;
      return top + laneHeight - (normalized * laneHeight);
    };

    const step = historyData.length > 1 ? (chartWidth - paddingX * 2) / (historyData.length - 1) : 0;

    return (
      <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200 overflow-hidden shadow-inner">
        <div ref={scrollRef} className="overflow-x-auto no-scrollbar cursor-crosshair scroll-smooth">
          <svg width={chartWidth} height={totalHeight} className="overflow-visible">
            {lanes.map((lane, lIdx) => {
              const thresholdY = getY(lane.threshold, lIdx, lane);
              const points = historyData.map((d, i) => ({
                x: paddingX + i * step,
                y: getY(getVal(d, lane.key), lIdx, lane),
                val: getVal(d, lane.key)
              }));

              return (
                <g key={lane.key}>
                  <text x={10} y={lIdx * (laneHeight + spacing) + laneHeight / 2} className="fill-slate-400 font-black text-[10px] uppercase">{lane.label}</text>
                  <rect x={paddingX} y={lIdx * (laneHeight + spacing)} width={chartWidth - paddingX * 2} height={laneHeight} className="fill-white/50" rx="10" />
                  <line x1={paddingX} y1={thresholdY} x2={chartWidth - paddingX} y2={thresholdY} stroke={lane.color} strokeWidth="1.5" strokeDasharray="4" opacity="0.3" />
                  
                  {points.length > 1 && (
                    <path 
                      d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`} 
                      fill="none" stroke={lane.color} strokeWidth="3" strokeLinecap="round" opacity="0.7" 
                    />
                  )}

                  {points.map((p, i) => {
                    const isCritical = lane.isLowThreshold ? p.val <= lane.threshold : p.val >= lane.threshold;
                    return (
                      <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                        <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 4} className={`${isCritical ? 'fill-rose-600 animate-pulse' : `fill-[${lane.color}]`} stroke-white stroke-2 transition-all`} />
                        {isCritical && hoveredIdx === i && <circle cx={p.x} cy={p.y} r="12" className="fill-rose-500/20" />}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            
            {historyData.map((d, i) => (
              <text key={i} x={paddingX + i * step} y={totalHeight - 5} textAnchor="middle" className="fill-slate-400 text-[8px] font-black uppercase">{d.date.split(' ')[1]}</text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // Helper para renderizar contenido de notas de forma bonita
  const renderNoteContent = (note: ClinicalNote) => {
    // Mapa de traducción para etiquetas profesionales
    const labelMap: Record<string, string> = {
      mainProblem: 'Diagnóstico Principal',
      secondaryProblems: 'Diagnósticos Secundarios / Comorbilidades',
      cieCode: 'Código CIE-11',
      subjectiveNarrative: 'S: Subjetivo (Interrogatorio)',
      objectivePhysical: 'O: Exploración Física',
      objectiveResults: 'O: Resultados de Estudios',
      analysisReasoning: 'A: Análisis y Evolución',
      plan: 'P: Plan de Tratamiento (Rp.)',
      nonPharmaPlan: 'Plan No Farmacológico',
      medConciliation: 'Conciliación de Medicamentos',
      pharmacovigilance: 'Farmacovigilancia',
      nursingInstructions: 'Indicaciones Enfermería',
      seguimiento: 'Pronóstico y Seguimiento',
      vitalsInterpretation: 'Interpretación de Signos Vitales',
      studyRequested: 'Estudios Solicitados',
      clinicalJustification: 'Justificación Clínica',
      findings: 'Hallazgos',
      conclusion: 'Conclusión / Interpretación',
      imagingTechnique: 'Técnica de Imagen',
      performedBy: 'Realizado por',
      validatedBy: 'Validado por',
      incidents: 'Incidentes'
    };

    // Orden específico para notas SOAP
    const orderedKeys = [
      'mainProblem', 'cieCode', 'secondaryProblems', 
      'subjectiveNarrative', 
      'objectivePhysical', 'objectiveResults', 
      'analysisReasoning', 
      'plan', 'nonPharmaPlan', 'seguimiento'
    ];

    // Claves restantes que no están en el orden específico
    const remainingKeys = Object.keys(note.content).filter(k => 
      !orderedKeys.includes(k) && 
      !['vitals', 'prescriptions', 'isSigned', 'hash', 'author', 'date', 'labResults', 'images', 'orderId', 'reportType'].includes(k) &&
      typeof note.content[k] === 'string' && 
      (note.content[k] as string).length > 0
    );

    const contentToRender = [
      ...orderedKeys.filter(k => note.content[k]), 
      ...remainingKeys
    ];

    return (
      <div className="space-y-8">
        {contentToRender.map(key => (
          <div key={key} className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-blue-600 pl-3">
              {labelMap[key] || key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <div className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap pl-4">
              {note.content[key]}
            </div>
          </div>
        ))}

        {/* Renderizado especial para Resultados de Laboratorio */}
        {note.content.labResults && (note.content.labResults as any[]).length > 0 && (
          <div className="space-y-4 pt-4">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">Tabla de Resultados Analíticos</h4>
             <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 text-slate-500 font-black uppercase">
                      <tr>
                         <th className="p-3">Analito</th>
                         <th className="p-3">Resultado</th>
                         <th className="p-3">Unidad</th>
                         <th className="p-3">Ref.</th>
                         <th className="p-3 text-center">Estado</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-medium">
                      {(note.content.labResults as any[]).map((res: any, idx: number) => (
                         <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold">{res.analyte}</td>
                            <td className="p-3 font-black text-slate-900">{res.value}</td>
                            <td className="p-3 text-slate-500">{res.unit}</td>
                            <td className="p-3 text-slate-400 italic">{res.refRange}</td>
                            <td className="p-3 text-center">
                               <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${res.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {res.status}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Renderizado especial para Imágenes */}
        {note.content.images && (note.content.images as any[]).length > 0 && (
          <div className="space-y-4 pt-4">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">Evidencia de Imagen (PACS)</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(note.content.images as any[]).map((img: any, idx: number) => (
                   <div key={idx} className="relative aspect-square bg-black rounded-xl overflow-hidden group">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                         <p className="text-[8px] text-white font-mono truncate">{img.name}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>
    );
  };

  if (!patient) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 animate-in fade-in">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-2 border-blue-100 rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between no-print">
        <div className="flex items-center gap-8">
           <div className="w-20 h-20 rounded-[2rem] bg-slate-900 text-blue-400 flex items-center justify-center text-3xl font-black shadow-xl uppercase border-4 border-white">{patient.name.charAt(0)}</div>
           <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{patient.name}</h2>
                <button 
                  onClick={() => setShowVitalsModal(true)}
                  className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 animate-in zoom-in group"
                  title="Actualizar Signos Vitales"
                >
                  <HeartPulse size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                 <span className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">EXP: {patient.id}</span>
                 <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{patient.age} Años • {patient.sex} • {patient.bloodType}</span>
                 <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                    <Flame size={12} />
                    <span className="text-[9px] font-black uppercase">ALERGIAS: {patient.allergies[0] || 'NEGADAS'}</span>
                 </div>
              </div>
           </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => navigate('/')} className="p-5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white rounded-2xl border border-slate-100 transition-all shadow-sm"><X size={24}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-9 space-y-10">
           {/* Monitor Integrado */}
           <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 px-4">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-4">
                    <TrendingUp className="text-blue-600" /> Monitor de Tendencias Actuales
                 </h3>
              </div>
              {renderIntegratedMonitor()}
           </div>

           {/* Expediente Histórico */}
           <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-4">
                    <FileStack className="text-blue-600 w-6 h-6" /> Registro de Atenciones (Expediente)
                 </h3>
                 <div className="flex gap-2">
                    <button onClick={() => navigate(`/patient/${id}/history`)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Nueva Historia Clínica</button>
                 </div>
              </div>
              <div className="divide-y divide-slate-100">
                 {patientNotes.map(note => (
                    <button key={note.id} onClick={() => setSelectedNote(note)} className="w-full text-left p-10 hover:bg-blue-50/30 transition-all group flex items-start justify-between gap-10">
                       <div className="flex gap-8">
                          <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                             {note.type.includes('Nota') ? <FileText size={24} /> : <FlaskConical size={24} />}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700">{note.type}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{note.date} • {note.author}</p>
                             <p className="text-xs text-slate-500 italic mt-3 line-clamp-2 max-w-2xl leading-relaxed">
                                {note.content.diagnosis || note.content.mainProblem || note.content.conclusion || 'Consulta General...'}
                             </p>
                          </div>
                       </div>
                       <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-all translate-x-0 group-hover:translate-x-2" />
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Sidebar Estado Real-time */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border-b-8 border-blue-600">
              <Activity className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5" />
              <div className="flex justify-between items-center mb-10 relative z-10">
                <h3 className="text-sm font-black flex items-center uppercase tracking-widest text-blue-400">
                   <HeartPulse size={18} className="mr-3" /> Signos Actuales
                </h3>
                <button onClick={() => setShowVitalsModal(true)} className="p-2 bg-white/5 hover:bg-blue-600 rounded-lg transition-all">
                  <FileEdit size={14} />
                </button>
              </div>
              <div className="space-y-10 relative z-10">
                 {[
                   { l: 'Tensión Art.', v: patient.currentVitals?.bp || '--/--', u: 'mmHg', i: <Droplet className="text-blue-400" /> },
                   { l: 'Frec. Card.', v: patient.currentVitals?.hr || '--', u: 'LPM', i: <Activity className="text-rose-400" /> },
                   { l: 'Temperatura', v: patient.currentVitals?.temp || '--', u: '°C', i: <Thermometer className="text-amber-400" /> },
                   { l: 'Sat. O2', v: patient.currentVitals?.o2 || '--', u: '%', i: <Wind className="text-emerald-400" /> }
                 ].map(item => (
                    <div key={item.l} className="flex justify-between items-end border-b border-white/5 pb-4">
                       <div>
                          <div className="flex items-center gap-2 mb-1">{item.i} <span className="text-[9px] font-black text-slate-500 uppercase">{item.l}</span></div>
                          <p className="text-3xl font-black leading-none">{item.v}<span className="text-[10px] text-slate-500 ml-1 font-bold">{item.u}</span></p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-blue-600 text-white rounded-[2.5rem] p-10 shadow-xl space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                 <Plus size={18} /> Nueva Intervención
              </h3>
              <div className="grid grid-cols-1 gap-2">
                 <button onClick={() => navigate(`/patient/${id}/note/evolution`)} className="w-full py-4 bg-white text-blue-700 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 hover:text-white transition-all">Nota de Evolución</button>
                 <button onClick={() => navigate(`/patient/${id}/prescription`)} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-white hover:text-blue-700 transition-all border border-white/20">Receta Médica</button>
                 <button onClick={() => navigate(`/patient/${id}/auxiliary-order`)} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-white hover:text-blue-700 transition-all border border-white/20">Solicitar Estudios</button>
              </div>
           </div>
        </div>
      </div>

      {/* Botón Flotante Acción Rápida */}
      <div className="fixed bottom-10 right-10 z-[100] no-print">
         <button onClick={() => setShowMenu(true)} className="w-20 h-20 rounded-3xl bg-blue-600 text-white shadow-[0_20px_50px_-10px_rgba(37,99,235,0.5)] flex items-center justify-center hover:scale-110 hover:bg-slate-900 transition-all group ring-8 ring-blue-50">
            <Plus size={40} className="group-hover:rotate-90 transition-transform" />
         </button>
      </div>

      {showVitalsModal && (
        <VitalsEditorModal patient={patient} onClose={() => setShowVitalsModal(false)} onSave={(v) => { onUpdatePatient({ ...patient, currentVitals: v, vitalsHistory: [v, ...(patient.vitalsHistory || [])].slice(0, 50) }); setShowVitalsModal(false); }} />
      )}

      {/* Visor de Documentos NOM-004 */}
      {selectedNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white/20">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileText size={24} /></div>
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedNote.type}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">NOM-004-SSA3-2012</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all"><Printer size={18} /> Imprimir Registro</button>
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-rose-50 transition-all"><X size={24}/></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 lg:p-20 bg-white print:p-0">
                 <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex justify-between border-b-4 border-slate-900 pb-10">
                       <div className="space-y-4">
                          <h1 className="text-3xl font-black text-blue-900 tracking-tighter uppercase leading-none">CENTRO MÉDICO SAN FRANCISCO</h1>
                          <div className="space-y-1">
                             <p className="text-xs font-black text-slate-900 uppercase">Dr. Alejandro Méndez • Medicina Interna</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cédula Profesional: 12345678 • Universidad Autónoma de Chiapas</p>
                          </div>
                       </div>
                       <div className="text-right space-y-2">
                          <QrCode size={80} className="text-slate-900 inline-block mb-2" />
                          <p className="text-sm font-black text-rose-600 leading-none tracking-tighter uppercase">ID: {selectedNote.id}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-10 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100">
                       <div className="col-span-2 space-y-4">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre del Paciente</label><p className="text-lg font-black text-slate-900 uppercase">{patient.name}</p></div>
                          <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">CURP</label><p className="text-xs font-bold font-mono">{patient.curp}</p></div>
                             <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Edad / Sexo</label><p className="text-xs font-bold uppercase">{patient.age} Años / {patient.sex}</p></div>
                          </div>
                       </div>
                       <div className="space-y-4 text-right border-l-2 border-white pl-8">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Fecha de Registro</label><p className="text-sm font-black text-slate-900">{selectedNote.date.split(',')[0]}</p></div>
                          <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Hora</label><p className="text-sm font-black text-slate-900">{selectedNote.date.split(',')[1]}</p></div>
                       </div>
                    </div>

                    <div className="space-y-10">
                       <div className="bg-slate-900 text-white px-8 py-3 rounded-xl flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">{selectedNote.type}</p>
                          <p className="text-[9px] font-bold opacity-60">DICTAMEN CLÍNICO OFICIAL</p>
                       </div>

                       <div className="grid grid-cols-1 gap-12 text-sm">
                          {selectedNote.content.vitals && (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl grid grid-cols-4 gap-y-6 gap-x-4 text-center">
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">T.A.</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.bp || '--'}</p><span className="text-[8px] text-slate-400">mmHg</span></div>
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">F.C.</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.hr || '--'}</p><span className="text-[8px] text-slate-400">LPM</span></div>
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">F.R.</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.rr || '--'}</p><span className="text-[8px] text-slate-400">RPM</span></div>
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Temp</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.temp || '--'}</p><span className="text-[8px] text-slate-400">°C</span></div>
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">SpO2</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.o2 || '--'}</p><span className="text-[8px] text-slate-400">%</span></div>
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Peso</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.weight || '--'}</p><span className="text-[8px] text-slate-400">kg</span></div>
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Talla</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.height || '--'}</p><span className="text-[8px] text-slate-400">cm</span></div>
                              <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">IMC</p><p className="text-base font-black text-slate-900">{selectedNote.content.vitals.bmi || '--'}</p><span className="text-[8px] text-slate-400">kg/m²</span></div>
                            </div>
                          )}

                          {renderNoteContent(selectedNote)}
                       </div>
                    </div>

                    <div className="pt-20 border-t-2 border-slate-900 flex justify-between items-end">
                       <div className="space-y-4">
                          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100"><BadgeCheck size={40} /></div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest max-w-[150px]">CERTIFICACIÓN DIGITAL AVANZADA NOM-024-SSA3-2012</p>
                       </div>
                       <div className="text-center space-y-4">
                          <div className="w-64 h-px bg-slate-900 mx-auto"></div>
                          <p className="text-sm font-black text-slate-900 uppercase">Dr. Alejandro Méndez</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Firma Médica Autorizada</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border-4 border-blue-50">
            <div className="p-12 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Intervención Médica</h4>
              <button onClick={() => setShowMenu(false)} className="p-5 hover:bg-rose-50 text-slate-400 rounded-3xl transition-all"><X size={32} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                {NOTE_CATEGORIES.map(cat => (
                  <div key={cat.title} className="space-y-8">
                    <h5 className="text-[12px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-50 pb-3">{cat.title}</h5>
                    <div className="grid grid-cols-1 gap-3">
                      {cat.notes.map(note => (
                        <button key={note} onClick={() => {
                             const typeMap: Record<string, string> = {
                                'Historia Clínica Medica': `/patient/${id}/history`,
                                'Nota de Evolución': `/patient/${id}/note/evolution`,
                                'Nota Inicial de Urgencias': `/patient/${id}/note/emergency`,
                                'Solicitud de Estudios Auxiliares': `/patient/${id}/auxiliary-order`,
                                'Hoja de Enfermería': `/patient/${id}/nursing-sheet`
                             };
                             const route = typeMap[note];
                             if (route) navigate(route);
                             setShowMenu(false);
                          }} className="w-full text-left p-5 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
                          {note}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
