
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, History, Activity, X, User, ShieldCheck, ClipboardList, 
  FileEdit, ChevronRight, Clock, Stethoscope, Microscope, Eye, 
  FileText, ImageIcon, LayoutGrid, Zap, FlaskConical, Download,
  Maximize2, ZoomIn, ZoomOut, RotateCw, HeartPulse, TrendingUp,
  Thermometer, Wind, Droplet, Printer, QrCode, BadgeCheck, MapPin, Phone,
  Info, Calendar, ArrowLeft, ArrowRight, EyeOff, AlertCircle, FileStack, Flame, Scale, Ruler, Heart,
  Droplets,
  Timer,
  CheckCircle2,
  Trash2,
  FileCheck,
  Save,
  Pill,
  FilePlus2
} from 'lucide-react';
import { NOTE_CATEGORIES } from '../constants';
import { Patient, ClinicalNote, Vitals, DiuresisEntry, DoctorInfo, MedicationPrescription } from '../types';
import { VitalsEditorModal } from './Dashboard';

const PatientProfile: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient: (p: Patient) => void, onSaveNote: (n: ClinicalNote) => void, doctorInfo: DoctorInfo }> = ({ patients, notes, onUpdatePatient, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showDiuresisModal, setShowDiuresisModal] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{laneIdx: number, pointIdx: number} | null>(null);
  
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [trendDate, setTrendDate] = useState(getLocalDateString());
  
  const patient = patients.find(p => p.id === id);

  // Helper para parsear fechas DD/MM/YYYY, HH:MM:SS a timestamp para ordenamiento
  const parseClinicalDate = (dateStr: string) => {
    try {
      const [dmy, hms] = dateStr.split(', ');
      const [d, m, y] = dmy.split('/');
      return new Date(`${y}-${m}-${d}T${hms || '00:00:00'}`).getTime();
    } catch (e) {
      return 0;
    }
  };
  
  // Notas del paciente filtradas y ordenadas por fecha real
  const patientNotes = useMemo(() => {
    return notes
      .filter(n => n.patientId === id)
      .sort((a, b) => parseClinicalDate(b.date) - parseClinicalDate(a.date));
  }, [notes, id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [patient?.vitalsHistory, trendDate]);

  // Lógica de filtrado de historial para la gráfica (detecta tomas del día seleccionado)
  const historyData = useMemo(() => {
    if (!patient?.vitalsHistory || patient.vitalsHistory.length === 0) return null;
    
    const [y, m, d] = trendDate.split('-');
    // Normalización: Algunos navegadores o localizaciones omiten el 0 a la izquierda
    const dayInt = parseInt(d);
    const monthInt = parseInt(m);
    
    const pattern1 = `${d}/${m}/${y}`; // 24/12/2025
    const pattern2 = `${dayInt}/${monthInt}/${y}`; // 24/12/2025 o 1/1/2025

    const filtered = patient.vitalsHistory.filter(v => {
      const vDateOnly = v.date.split(',')[0].trim();
      return vDateOnly === pattern1 || vDateOnly === pattern2 || v.date.includes(trendDate);
    }).reverse();

    return filtered.length > 0 ? filtered : null;
  }, [patient, trendDate]);

  const dailyDiuresis = useMemo(() => {
    if (!patient?.diuresisHistory) return [];
    return patient.diuresisHistory
      .filter(d => d.date === trendDate)
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [patient, trendDate]);

  const totalDiuresisVolume = useMemo(() => {
    return dailyDiuresis.reduce((sum, entry) => sum + entry.amount, 0);
  }, [dailyDiuresis]);

  const handleSaveMonitoringSheet = () => {
    const hasVitals = historyData && historyData.length > 0;
    const hasDiuresis = dailyDiuresis && dailyDiuresis.length > 0;

    if (!hasVitals && !hasDiuresis) {
      alert("No se detectaron registros para la fecha seleccionada. Realice al menos una toma antes de sellar.");
      return;
    }

    if (!window.confirm(`¿Desea generar y sellar el documento oficial de monitorización para el día ${trendDate}?`)) return;

    const sheetId = `MON-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: sheetId,
      patientId: patient!.id,
      type: 'Monitorización Integral de Signos y Diuresis',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo.name,
      content: {
        isMonitoringSheet: true,
        sheetDate: trendDate,
        vitalsList: historyData || [],
        diuresisList: dailyDiuresis,
        totalDiuresis: totalDiuresisVolume,
        currentWeight: patient?.currentVitals?.weight || 0,
        summary: `Reporte consolidado generado por Dr. ${doctorInfo.name}.`
      },
      isSigned: true,
      hash: `CERT-GRAF-${Math.random().toString(36).substr(2, 10).toUpperCase()}`
    };

    onSaveNote(newNote);
    
    // Abrir previsualización automáticamente
    setTimeout(() => {
      setSelectedNote(newNote);
    }, 100);
  };

  const renderCompactMonitor = (data: Vitals[] | null, isPrintVersion = false) => {
    if (!data || data.length === 0) return (
      <div className="py-12 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[2rem]">
         <p className="text-[10px] font-black uppercase tracking-widest">Sin registros gráficos para la fecha</p>
      </div>
    );

    const paddingX = 40;
    const pointSpacing = isPrintVersion ? 45 : 60;
    const chartWidth = Math.max(isPrintVersion ? 600 : 700, (data.length > 1 ? (data.length - 1) : 1) * pointSpacing + paddingX * 2);
    const laneHeight = isPrintVersion ? 45 : 55; 
    const spacing = 12;
    const totalHeight = (laneHeight + spacing) * 4 + 30;

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
      const normalized = Math.min(Math.max((val - config.min) / range, 0), 1);
      return top + laneHeight - (normalized * laneHeight);
    };

    const step = data.length > 1 ? (chartWidth - paddingX * 2) / (data.length - 1) : 0;

    return (
      <div className={`${isPrintVersion ? 'bg-white' : 'bg-slate-50'} rounded-[2.5rem] p-6 border ${isPrintVersion ? 'border-slate-100' : 'border-slate-200'} overflow-hidden shadow-inner`}>
        <div className="overflow-x-auto no-scrollbar scroll-smooth">
          <svg width={chartWidth} height={totalHeight} className="overflow-visible">
            {lanes.map((lane, lIdx) => {
              const thresholdY = getY(lane.threshold, lIdx, lane);
              const points = data.map((d, i) => ({
                x: paddingX + i * step,
                y: getY(getVal(d, lane.key), lIdx, lane),
                val: getVal(d, lane.key),
                raw: d
              }));

              return (
                <g key={lane.key}>
                  <text x={0} y={lIdx * (laneHeight + spacing) + laneHeight / 2} className="fill-slate-400 font-black text-[8px] uppercase">{lane.label}</text>
                  <rect x={paddingX} y={lIdx * (laneHeight + spacing)} width={chartWidth - paddingX * 2} height={laneHeight} className="fill-white/80" rx="12" />
                  <line x1={paddingX} y1={thresholdY} x2={chartWidth - paddingX} y2={thresholdY} stroke={lane.color} strokeWidth="1" strokeDasharray="4,2" opacity="0.1" />
                  
                  {points.length > 1 && (
                    <path d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke={lane.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                  )}

                  {points.map((p, i) => {
                    const isHovered = !isPrintVersion && hoveredPoint?.laneIdx === lIdx && hoveredPoint?.pointIdx === i;
                    const isCritical = lane.isLowThreshold ? p.val <= lane.threshold : p.val >= lane.threshold;
                    
                    return (
                      <g key={i} onMouseEnter={() => !isPrintVersion && setHoveredPoint({laneIdx: lIdx, pointIdx: i})} onMouseLeave={() => !isPrintVersion && setHoveredPoint(null)}>
                        {isHovered && <circle cx={p.x} cy={p.y} r="14" className={`${isCritical ? 'fill-rose-500/20' : 'fill-blue-500/10'} animate-in zoom-in`} />}
                        <circle cx={p.x} cy={p.y} r={isHovered ? 6 : 3} className={`${isCritical ? 'fill-rose-600' : ''} stroke-white stroke-2 cursor-pointer`} style={{ fill: isCritical ? '#e11d48' : lane.color }} />
                        {isHovered && (
                          <g className="animate-in fade-in zoom-in-95 pointer-events-none">
                             <rect x={p.x - 35} y={p.y - 45} width="70" height="35" rx="10" className="fill-slate-900 shadow-2xl" />
                             <text x={p.x} y={p.y - 33} textAnchor="middle" className="fill-white font-black text-[10px]">{lane.key === 'bp' ? p.raw.bp : p.val}{lane.unit}</text>
                             <text x={p.x} y={p.y - 20} textAnchor="middle" className={`font-black text-[6px] uppercase tracking-widest ${isCritical ? 'fill-rose-400' : 'fill-emerald-400'}`}>{isCritical ? 'ALERTA' : 'NORMAL'}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {data.map((d, i) => (
              <text key={i} x={paddingX + i * step} y={totalHeight - 5} textAnchor="middle" className="fill-slate-400 text-[7px] font-black uppercase">
                {d.date.replace(',', '').split(' ')[1]?.substr(0,5)}
              </text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const DiuresisTracker = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
           <div>
              <h3 className="text-xs font-black uppercase tracking-[0.1em] text-slate-900 flex items-center gap-3">
                 <Droplets className="text-blue-600 w-4 h-4" /> Control Diuresis
              </h3>
              <p className="text-[8px] font-black text-blue-600 uppercase mt-1 tracking-widest">Total Hoy: {totalDiuresisVolume} ml</p>
           </div>
           <button 
             onClick={() => setShowDiuresisModal(true)}
             className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-slate-900 transition-all"
           >
              <Plus size={16} />
           </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-2">
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[7px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                    <th className="p-4">Hora</th>
                    <th className="p-4 text-center">ml</th>
                    <th className="p-4 text-center">Gasto</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {dailyDiuresis.map(entry => {
                    const weight = patient?.currentVitals?.weight || 70;
                    const output = (entry.amount / weight).toFixed(2);
                    return (
                      <tr key={entry.id} className="hover:bg-blue-50/30 transition-all text-[9px]">
                         <td className="p-4 font-black text-slate-900">{entry.time}</td>
                         <td className="p-4 text-center font-black text-blue-600">{entry.amount}</td>
                         <td className="p-4 text-center font-bold text-slate-400">{output}</td>
                      </tr>
                    );
                 })}
                 {dailyDiuresis.length === 0 && (
                   <tr><td colSpan={3} className="p-10 text-center text-slate-300 font-black uppercase text-[7px]">Sin registros hoy</td></tr>
                 )}
              </tbody>
              {dailyDiuresis.length > 0 && (
                <tfoot className="bg-slate-50">
                   <tr className="text-[9px] font-black uppercase">
                      <td className="p-4">Total</td>
                      <td className="p-4 text-center text-blue-700 font-black">{totalDiuresisVolume} ml</td>
                      <td className="p-4 text-center text-slate-400">---</td>
                   </tr>
                </tfoot>
              )}
           </table>
        </div>
      </div>
    );
  };

  const DiuresisModal = () => {
    const [entry, setEntry] = useState({
      amount: 100,
      characteristics: 'Normal / Clara',
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    });

    const saveDiuresis = () => {
      const newHistory = [
        { ...entry, id: Date.now().toString(), date: trendDate, color: 'yellow' },
        ...(patient?.diuresisHistory || [])
      ];
      onUpdatePatient({ ...patient!, diuresisHistory: newHistory });
      setShowDiuresisModal(false);
    };

    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase text-slate-900">Registro de Diuresis</h3>
              <button onClick={() => setShowDiuresisModal(false)}><X className="text-slate-400" /></button>
           </div>
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                   <input type="time" className="w-full p-4 bg-slate-50 rounded-xl font-black text-sm" value={entry.time} onChange={e => setEntry({...entry, time: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ml</label>
                   <input type="number" className="w-full p-4 bg-slate-50 rounded-xl font-black text-lg text-blue-600" value={entry.amount} onChange={e => setEntry({...entry, amount: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <button onClick={saveDiuresis} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-600 transition-all">Sellar Registro</button>
           </div>
        </div>
      </div>
    );
  };

  const renderNoteContent = (note: ClinicalNote) => {
    // RENDERIZADO ESPECIAL PARA RECETAS GUARDADAS
    if (note.type.includes('Receta Médica')) {
       const meds = (note.content.meds as MedicationPrescription[]) || [];
       const diagnosis = note.content.diagnosis || 'Consulta General';
       const indications = note.content.instructions || 'Vigilancia de síntomas.';
       
       return (
          <div className="space-y-10 animate-in slide-in-from-top-2">
             <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico Asociado</p>
                <p className="text-sm font-black text-slate-900 uppercase">{diagnosis}</p>
             </div>
             
             <div className="space-y-6">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-4">Plan Terapéutico (Rp.)</h4>
                <div className="grid grid-cols-1 gap-4">
                   {meds.map((m, idx) => (
                      <div key={idx} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                         <div className="flex gap-4 items-start">
                            <span className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center font-black text-[10px] shrink-0">{idx + 1}</span>
                            <div>
                               <p className="text-sm font-black text-slate-900 uppercase leading-none">{m.name}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{m.dosage} {m.frequency} • {m.duration} • Vía {m.route}</p>
                               {m.instructions && <p className="text-[9px] italic text-blue-600 mt-2">"{m.instructions}"</p>}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="p-8 bg-slate-900 text-white rounded-[2rem] space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Indicaciones Generales</p>
                <p className="text-xs italic leading-relaxed">"{indications}"</p>
             </div>
          </div>
       );
    }

    if (note.content.isMonitoringSheet) {
      const vitals = (note.content.vitalsList as Vitals[]) || [];
      const diuresis = (note.content.diuresisList as DiuresisEntry[]) || [];
      const weight = note.content.currentWeight || patient?.currentVitals?.weight || '--';

      const timelineMap: Record<string, { v?: Vitals, d?: DiuresisEntry[] }> = {};
      vitals.forEach(v => {
        const h = v.date.replace(',', '').split(' ')[1]?.substr(0,5) || '??:??';
        if (!timelineMap[h]) timelineMap[h] = {};
        timelineMap[h].v = v;
      });
      diuresis.forEach(d => {
        const h = d.time;
        if (!timelineMap[h]) timelineMap[h] = {};
        if (!timelineMap[h].d) timelineMap[h].d = [];
        timelineMap[h].d!.push(d);
      });

      const sortedHours = Object.keys(timelineMap).sort();

      return (
        <div className="space-y-12 animate-in slide-in-from-top-2">
           <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                 <Scale className="text-blue-600" size={24} />
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Peso del Paciente</p>
                    <p className="text-xl font-black text-slate-900">{weight} kg</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                 <Droplets className="text-blue-600" size={24} />
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Eliminación Total (24h)</p>
                    <p className="text-xl font-black text-blue-700">{note.content.totalDiuresis || 0} ml</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-blue-600 pl-4">I. Evolución Gráfica de Signos Vitales</h4>
              {renderCompactMonitor(vitals, true)}
           </div>

           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-indigo-600 pl-4">II. Tabla de Mesa de Control Técnico</h4>
              <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200">
                 <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[8px]">
                       <tr>
                          <th className="p-4">Hora</th>
                          <th className="p-4 text-center">T/A (mmHg)</th>
                          <th className="p-4 text-center">F.C. (LPM)</th>
                          <th className="p-4 text-center">T° (°C)</th>
                          <th className="p-4 text-center">SpO2 (%)</th>
                          <th className="p-4 text-center bg-blue-600/20">Diuresis (ml)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                       {sortedHours.length > 0 ? sortedHours.map(hour => {
                          const item = timelineMap[hour];
                          const totalD = item.d?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
                          return (
                            <tr key={hour} className="hover:bg-slate-50">
                               <td className="p-4 font-black text-slate-900 bg-slate-50/50">{hour}</td>
                               <td className="p-4 text-center">{item.v?.bp || '--'}</td>
                               <td className="p-4 text-center text-rose-600">{item.v?.hr || '--'}</td>
                               <td className="p-4 text-center text-amber-600">{item.v?.temp || '--'}</td>
                               <td className="p-4 text-center text-emerald-600">{item.v?.o2 || '--'}</td>
                               <td className="p-4 text-center font-black text-blue-700 bg-blue-50/30">{totalD > 0 ? `${totalD} ml` : '--'}</td>
                            </tr>
                          );
                       }) : (
                         <tr><td colSpan={6} className="p-10 text-center text-slate-300 uppercase font-black">Sin datos para mostrar en tabla</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
           
           <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
              <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-2">Comentarios del Documento</p>
              <p className="text-xs italic text-slate-500 font-medium">{note.content.summary}</p>
           </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {Object.entries(note.content).map(([key, val]) => {
          if (typeof val !== 'string' || ['author', 'date', 'type', 'id'].includes(key) || key.startsWith('is')) return null;
          return (
            <div key={key} className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-blue-600 pl-3">{key}</h4>
              <div className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap pl-4">{val}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!patient) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in">
      <div className="sticky top-16 z-40 bg-white border-2 border-blue-100 rounded-[2.5rem] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between no-print">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-2xl bg-slate-900 text-blue-400 flex items-center justify-center text-2xl font-black shadow-xl uppercase border-4 border-white">{patient.name.charAt(0)}</div>
           <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{patient.name}</h2>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">EXP: {patient.id}</span>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.age} Años • {patient.sex} • {patient.bloodType}</span>
                 <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                    <Flame size={10} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">ALERGIAS: {patient.allergies[0] || 'NEGADAS'}</span>
                 </div>
              </div>
           </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/')} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-100 transition-all"><X size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 space-y-8">
           <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                    <TrendingUp className="text-blue-600" /> Gráfica de Monitoreo
                 </h3>
                 <div className="flex items-center gap-3 no-print">
                    <button 
                      onClick={handleSaveMonitoringSheet}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2"
                    >
                       <FileCheck size={16} /> Sellar Gráfica
                    </button>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
                       <Calendar size={14} className="text-slate-400" />
                       <input type="date" className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-700" value={trendDate} onChange={e => setTrendDate(e.target.value)} />
                    </div>
                    <button onClick={() => window.print()} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg">
                       <Printer size={18} />
                    </button>
                 </div>
              </div>
              {renderCompactMonitor(historyData)}
           </div>

           <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-4">
                    <FileStack className="text-blue-600 w-5 h-5" /> Historial de Atenciones
                 </h3>
                 <button onClick={() => setShowMenu(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center gap-3">
                    <FilePlus2 size={16} /> Nueva Nota / Documento
                 </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto no-scrollbar">
                 {patientNotes.map(note => (
                    <button key={note.id} onClick={() => setSelectedNote(note)} className="w-full text-left p-8 hover:bg-blue-50/20 transition-all group flex items-start justify-between gap-6">
                       <div className="flex gap-6">
                          <div className={`w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm ${note.type.includes('Monitorización') || note.type.includes('Gráfica') ? 'border-emerald-200 bg-emerald-50' : note.type.includes('Receta') ? 'border-blue-200 bg-blue-50' : ''}`}>
                             {note.type.includes('Monitorización') || note.type.includes('Gráfica') ? <Activity size={20} className="text-emerald-600 group-hover:text-white" /> : note.type.includes('Receta') ? <Pill size={20} className="text-blue-600 group-hover:text-white" /> : note.type.includes('Nota') ? <FileText size={20} /> : <FlaskConical size={20} />}
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700">{note.type}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{note.date} • {note.author}</p>
                             <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-1 max-w-xl leading-relaxed">
                                {note.content.diagnosis || note.content.summary || 'Ver detalles del registro consolidado...'}
                             </p>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-all translate-x-0 group-hover:translate-x-1" />
                    </button>
                 ))}
                 {patientNotes.length === 0 && <div className="py-20 text-center opacity-20"><ClipboardList size={48} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Sin registros históricos</p></div>}
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="h-[320px]">
              <DiuresisTracker />
           </div>

           <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border-b-8 border-blue-600">
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xs font-black flex items-center uppercase tracking-widest text-blue-400">
                   <HeartPulse size={16} className="mr-3" /> Última Toma
                </h3>
                <button onClick={() => setShowVitalsModal(true)} className="p-2 bg-white/5 hover:bg-blue-600 rounded-lg transition-all"><FileEdit size={12} /></button>
              </div>
              <div className="space-y-6 relative z-10">
                 {[
                   { l: 'T.A.', v: patient.currentVitals?.bp || '--/--', u: 'mmHg', i: <Droplet size={14} className="text-blue-400" /> },
                   { l: 'F.C.', v: patient.currentVitals?.hr || '--', u: 'LPM', i: <Activity size={14} className="text-rose-400" /> },
                   { l: 'T°', v: patient.currentVitals?.temp || '--', u: '°C', i: <Thermometer size={14} className="text-amber-400" /> },
                   { l: 'SatO2', v: patient.currentVitals?.o2 || '--', u: '%', i: <Wind size={14} className="text-emerald-400" /> }
                 ].map(item => (
                    <div key={item.l} className="flex justify-between items-end border-b border-white/5 pb-3">
                       <div>
                          <div className="flex items-center gap-2 mb-1">{item.i} <span className="text-[8px] font-black text-slate-500 uppercase">{item.l}</span></div>
                          <p className="text-2xl font-black leading-none">{item.v}<span className="text-[8px] text-slate-500 ml-1 font-bold">{item.u}</span></p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-blue-600 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3"><Zap size={14} /> Intervención Rápida</h3>
                 <button onClick={() => setShowMenu(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"><Plus size={14} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => navigate(`/patient/${id}/note/evolution`)} className="w-full py-4 bg-white text-blue-700 rounded-2xl font-black text-[9px] uppercase shadow-lg hover:bg-slate-900 hover:text-white transition-all">Nota de Evolución</button>
                 <button onClick={() => navigate(`/patient/${id}/prescription`)} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-[9px] uppercase hover:bg-white hover:text-blue-700 transition-all border border-white/20">Receta Médica</button>
                 <button onClick={() => setShowMenu(true)} className="w-full py-4 bg-blue-700/50 text-white rounded-2xl font-black text-[9px] uppercase hover:bg-slate-900 transition-all border border-white/10 flex items-center justify-center gap-2">
                    <FilePlus2 size={12} /> Nueva Nota / Documento
                 </button>
              </div>
           </div>
        </div>
      </div>

      {showVitalsModal && (
        <VitalsEditorModal 
          patient={patient} 
          onClose={() => setShowVitalsModal(false)} 
          onSave={(v) => { 
            onUpdatePatient({ 
              ...patient, 
              currentVitals: v, 
              vitalsHistory: [v, ...(patient.vitalsHistory || [])].slice(0, 500) 
            }); 
            setShowVitalsModal(false); 
          }} 
        />
      )}

      {showDiuresisModal && <DiuresisModal />}

      {selectedNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white/20">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedNote.type.includes('Monitorización') || selectedNote.type.includes('Gráfica') ? 'bg-emerald-600' : selectedNote.type.includes('Receta') ? 'bg-blue-600' : 'bg-blue-600'}`}>
                       {selectedNote.type.includes('Monitorización') || selectedNote.type.includes('Gráfica') ? <Activity size={24} /> : selectedNote.type.includes('Receta') ? <Pill size={24} /> : <FileText size={24} />}
                    </div>
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedNote.type}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Sello Digital Digital NOM-024</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all"><Printer size={18} /> Imprimir</button>
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-rose-50 transition-all"><X size={24}/></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 lg:p-20 bg-white print:p-0">
                 <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex justify-between border-b-4 border-slate-900 pb-10">
                       <div className="space-y-4">
                          <h1 className="text-3xl font-black text-blue-900 tracking-tighter uppercase leading-none">{doctorInfo.hospital}</h1>
                          <div className="space-y-1">
                             <p className="text-xs font-black text-slate-900 uppercase">Dr. {doctorInfo.name} • {doctorInfo.specialty}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cédula Profesional: {doctorInfo.cedula}</p>
                          </div>
                       </div>
                       <div className="text-right space-y-2">
                          <QrCode size={80} className="text-slate-900 inline-block mb-2" />
                          <p className="text-xs font-black text-rose-600 uppercase tracking-tighter">ID: {selectedNote.id}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-10 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100">
                       <div className="col-span-2 space-y-4">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paciente</label><p className="text-lg font-black text-slate-900 uppercase">{patient.name}</p></div>
                          <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">CURP</label><p className="text-xs font-bold font-mono">{patient.curp}</p></div>
                             <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Edad / Sexo</label><p className="text-xs font-bold uppercase">{patient.age} Años / {patient.sex}</p></div>
                          </div>
                       </div>
                       <div className="space-y-4 text-right border-l-2 border-white pl-8">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Fecha Reporte</label><p className="text-sm font-black text-slate-900">{selectedNote.content.sheetDate || selectedNote.date.split(',')[0]}</p></div>
                          <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Área</label><p className="text-sm font-black text-blue-600">UNIDAD HOSPITALARIA</p></div>
                       </div>
                    </div>

                    <div className="space-y-10">
                       <div className="bg-slate-900 text-white px-8 py-3 rounded-xl flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">{selectedNote.type}</p>
                          <p className="text-[9px] font-bold opacity-60">DICTAMEN OFICIAL</p>
                       </div>
                       <div className="grid grid-cols-1 gap-12 text-sm">
                          {renderNoteContent(selectedNote)}
                       </div>
                    </div>

                    <div className="pt-20 border-t-2 border-slate-900 flex justify-between items-end">
                       <div className="space-y-4">
                          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100"><BadgeCheck size={40} /></div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest max-w-[150px]">CERTIFICACIÓN DIGITAL NOM-024-SSA3-2012</p>
                       </div>
                       <div className="text-center space-y-4">
                          <div className="w-64 h-px bg-slate-900 mx-auto"></div>
                          <p className="text-sm font-black text-slate-900 uppercase">Dr. {doctorInfo.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Firma Electrónica Autorizada</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border-4 border-blue-50">
            <div className="p-12 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Intervención Médica Completa</h4>
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
                                'Hoja de Enfermería': `/patient/${id}/nursing-sheet`,
                                'Nota Pre-operatoria': `/patient/${id}/note/generic/Pre-operatoria`,
                                'Nota Post-operatoria': `/patient/${id}/note/generic/Post-operatoria`,
                                'Nota Pre-anestésica': `/patient/${id}/note/generic/Pre-anestésica`,
                                'Nota Post-anestésica': `/patient/${id}/note/generic/Post-anestésica`,
                                'Receta Médica': `/patient/${id}/prescription`,
                                'Consentimiento Informado': `/patient/${id}/consent`,
                                'Resumen Clínico': `/patient/${id}/note/generic/Resumen-Clinico`,
                                'Lista de Verificación OMS': `/patient/${id}/note/generic/Checklist-OMS`,
                                'Solicitud de Estudios Auxiliares': `/patient/${id}/auxiliary-order`
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
