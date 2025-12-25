
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, ChevronLeft, Printer, ShieldCheck, User, Plus, FileText, ClipboardList, 
  Thermometer, Heart, Wind, Droplet, Edit3, Trash2, Save, HeartPulse, 
  TrendingUp, ChevronRight, FilePlus2, Flame, Droplets, X, QrCode, BadgeCheck, Scale, Ruler,
  Calendar, CheckSquare, Maximize2, Clock, Info
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../types';
import { NOTE_CATEGORIES } from '../constants';

const PatientProfile: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient: (p: Patient) => void, onSaveNote: (n: ClinicalNote) => void, doctorInfo: DoctorInfo }> = ({ patients, notes, onUpdatePatient, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{laneIdx: number, pointIdx: number, val: any, time: string, x: number, y: number} | null>(null);
  
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<Vitals>({
    bp: '120/80', temp: 36.6, hr: 72, rr: 18, o2: 98, weight: 82, height: 175, bmi: 26.8, date: ''
  });

  useEffect(() => {
    if (vitalsForm.weight > 0 && vitalsForm.height > 0) {
      const hM = vitalsForm.height / 100;
      const calculatedBmi = parseFloat((vitalsForm.weight / (hM * hM)).toFixed(1));
      if (calculatedBmi !== vitalsForm.bmi) {
        setVitalsForm(prev => ({ ...prev, bmi: calculatedBmi }));
      }
    }
  }, [vitalsForm.weight, vitalsForm.height]);

  if (!patient) return <div className="p-20 text-center uppercase font-black text-slate-300">Paciente no encontrado</div>;

  const patientNotes = useMemo(() => notes.filter(n => n.patientId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, id]);

  const handleQuickUpdateVitals = () => {
    const timestamp = new Date().toLocaleString('es-MX');
    const entry = { ...vitalsForm, date: timestamp };
    const updatedPatient: Patient = { 
      ...patient, 
      currentVitals: entry, 
      vitalsHistory: [entry, ...(patient.vitalsHistory || [])] 
    };
    onUpdatePatient(updatedPatient);
    setShowVitalsModal(false);
  };

  const renderDynamicChart = (data: Vitals[] | null) => {
    const vitalsData = data && data.length > 0 ? [...data].reverse() : [];
    
    if (vitalsData.length === 0) return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm h-[200px] flex flex-col items-center justify-center opacity-40">
        <TrendingUp size={32} className="mb-2 text-slate-300" />
        <p className="font-black uppercase text-[8px] tracking-widest">Sin datos históricos</p>
      </div>
    );

    // Ajustes de compactación
    const paddingX = 60, pointSpacing = 80, chartWidth = Math.max(600, (vitalsData.length - 1) * pointSpacing + paddingX * 2);
    const laneHeight = 45, spacing = 15, totalHeight = (laneHeight + spacing) * 4 + 40;
    
    const lanes = [
      { label: 'T/A', key: 'bp', color: '#3b82f6', min: 60, max: 200 },
      { label: 'F.C.', key: 'hr', color: '#f43f5e', min: 40, max: 160 },
      { label: 'T°', key: 'temp', color: '#f59e0b', min: 34, max: 41 },
      { label: 'SPO2', key: 'o2', color: '#10b981', min: 70, max: 100 }
    ];

    const getVal = (d: Vitals, key: string) => key === 'bp' ? parseInt(d.bp?.split('/')[0]) || 120 : (d as any)[key] || 0;
    const getY = (val: number, laneIdx: number, config: any) => {
      const top = laneIdx * (laneHeight + spacing) + 20;
      const normalized = Math.min(Math.max((val - config.min) / (config.max - config.min), 0), 1);
      return top + laneHeight - (normalized * laneHeight);
    };

    const step = vitalsData.length > 1 ? (chartWidth - paddingX * 2) / (vitalsData.length - 1) : 0;

    return (
      <div className="relative group">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-x-auto custom-scrollbar relative">
          <div className="flex justify-between items-center mb-6 no-print">
             <div className="flex items-center gap-3">
                <TrendingUp className="text-blue-600 w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">MONITOREO DE TENDENCIAS</h3>
             </div>
             <button onClick={() => window.print()} className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all"><Printer size={14} /></button>
          </div>

          <div className="relative">
            {hoveredPoint && (
              <div className="absolute z-50 bg-slate-900 text-white px-3 py-2 rounded-xl text-[9px] font-black shadow-2xl pointer-events-none transition-all duration-200" style={{ left: hoveredPoint.x + 10, top: hoveredPoint.y - 40 }}>
                <p className="text-blue-400 uppercase tracking-widest mb-1 border-b border-white/10">{hoveredPoint.time}</p>
                <p>VALOR: <span className="text-emerald-400">{hoveredPoint.val}</span></p>
              </div>
            )}
            
            <svg width={chartWidth} height={totalHeight} className="overflow-visible select-none">
              {lanes.map((lane, lIdx) => {
                const topY = lIdx * (laneHeight + spacing) + 20;
                return (
                  <g key={lane.label}>
                    <text x={0} y={topY + laneHeight/2} className="fill-slate-400 font-black text-[8px] uppercase tracking-widest">{lane.label}</text>
                    <line x1={paddingX} y1={topY} x2={chartWidth-paddingX} y2={topY} className="stroke-slate-100" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={topY + laneHeight} x2={chartWidth-paddingX} y2={topY + laneHeight} className="stroke-slate-100" strokeDasharray="3 3" />
                    
                    {vitalsData.length > 1 && (
                      <path d={vitalsData.map((d, i) => {
                           const x = paddingX + i * step;
                           const y = getY(getVal(d, lane.key), lIdx, lane);
                           return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')} fill="none" stroke={lane.color} strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
                    )}

                    {vitalsData.map((d, i) => {
                       const x = paddingX + i * step;
                       const y = getY(getVal(d, lane.key), lIdx, lane);
                       return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="15" fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHoveredPoint({ laneIdx: lIdx, pointIdx: i, val: getVal(d, lane.key), time: d.date.split(', ')[1] || '--:--', x, y })} onMouseLeave={() => setHoveredPoint(null)} />
                          <circle cx={x} cy={y} r="4" fill={lane.color} className={`transition-all duration-300 ${hoveredPoint?.pointIdx === i && hoveredPoint?.laneIdx === lIdx ? 'r-6 fill-slate-900 scale-125' : ''}`} />
                        </g>
                       );
                    })}
                  </g>
                );
              })}
              
              {vitalsData.map((d, i) => (
                <text key={i} x={paddingX + i * step} y={totalHeight - 5} className="fill-slate-300 font-black text-[7px] text-center" textAnchor="middle">
                  {d.date.split(', ')[1]?.substring(0, 5) || '--:--'}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* HEADER COMPACTO */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between no-print relative overflow-hidden">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-blue-400 flex items-center justify-center text-2xl font-black shadow-lg uppercase">{patient.name.charAt(0)}</div>
           <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">PACIENTE</p>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {patient.name} <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] ml-2 font-black uppercase tracking-widest">EXP: {patient.id}</span>
              </h2>
              <div className="flex gap-6 mt-3">
                 <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">EDAD</p><p className="font-black text-slate-700 text-xs">{patient.age} AÑOS</p></div>
                 <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">GRUPO S/R</p><p className="font-black text-slate-700 text-xs">{patient.bloodType}</p></div>
                 <div className="bg-rose-50 px-3 py-0.5 rounded-lg border border-rose-100">
                    <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1"><Flame size={8} /> ALERGIAS</p>
                    <p className="text-[9px] font-black text-rose-600 uppercase">{patient.allergies.length > 0 ? patient.allergies[0] : 'NEGADAS'}</p>
                 </div>
              </div>
           </div>
        </div>
        <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200"><X size={20} className="text-slate-400" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
           {renderDynamicChart(patient.vitalsHistory || null)}

           <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                 <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight leading-none flex items-center gap-2">
                    <ClipboardList className="text-blue-600 w-4 h-4" /> Historial de Atenciones
                 </h3>
                 <button onClick={() => setShowMenu(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[8px] uppercase shadow-md hover:bg-slate-900 transition-all flex items-center gap-2 tracking-widest"><FilePlus2 size={14} /> Nueva Nota</button>
              </div>
              <div className="divide-y divide-slate-50">
                 {patientNotes.map(note => (
                    <button key={note.id} onClick={() => setSelectedNote(note)} className="w-full text-left p-6 hover:bg-blue-50/20 transition-all group flex items-start justify-between">
                       <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={18} /></div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-700 tracking-tight">{note.type}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{note.date} • {note.author.split(' ')[0]}</p>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-all self-center" />
                    </button>
                 ))}
                 {patientNotes.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">Sin registros previos</div>}
              </div>
           </div>
        </div>
        
        {/* PANEL DE SIGNOS VITALES COMPACTO */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
                 <HeartPulse className="text-blue-600" size={18} />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">SIGNOS VITALES</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 {[
                   { l: 'T.A.', v: patient.currentVitals?.bp || '120/80', u: 'mmHg', i: <Activity size={14} className="text-blue-500" /> },
                   { l: 'F.C.', v: patient.currentVitals?.hr || '72', u: 'lpm', i: <Heart size={14} className="text-rose-500" /> },
                   { l: 'F.R.', v: patient.currentVitals?.rr || '16', u: 'rpm', i: <Wind size={14} className="text-emerald-500" /> },
                   { l: 'TEMP', v: patient.currentVitals?.temp || '36.6', u: '°C', i: <Thermometer size={14} className="text-amber-500" /> },
                   { l: 'SATO2', v: patient.currentVitals?.o2 || '98', u: '%', i: <Droplet size={14} className="text-cyan-500" /> },
                   { l: 'PESO', v: patient.currentVitals?.weight || '82', u: 'kg', i: <Scale size={14} className="text-indigo-500" /> },
                   { l: 'TALLA', v: patient.currentVitals?.height || '175', u: 'cm', i: <Ruler size={14} className="text-violet-500" /> },
                   { l: 'IMC', v: patient.currentVitals?.bmi || '26.8', u: '', i: <Activity size={14} className="text-slate-400" /> }
                 ].map(item => (
                    <div key={item.l} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col justify-center transition-all hover:shadow-md">
                       <div className="flex items-center gap-2 mb-1 opacity-60">
                          {item.i}
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.l}</span>
                       </div>
                       <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">
                          {item.v}<span className="text-[7px] text-slate-300 ml-1 font-bold uppercase">{item.u}</span>
                       </p>
                    </div>
                 ))}
              </div>

              <button 
                onClick={() => {
                   setVitalsForm(patient.currentVitals || { bp: '120/80', temp: 36.6, hr: 72, rr: 18, o2: 98, weight: 82, height: 175, bmi: 26.8, date: '' });
                   setShowVitalsModal(true);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                 ACTUALIZAR REGISTRO
              </button>
           </div>

           {/* ACCESO RÁPIDO A HOJA ENFERMERÍA */}
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-5 flex items-center justify-between group cursor-pointer hover:bg-emerald-50 transition-all" onClick={() => navigate(`/patient/${id}/nursing-sheet`)}>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all"><CheckSquare size={18} /></div>
                 <div>
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Hoja de Enfermería</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Sellar Sábana de Turno</p>
                 </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-all" />
           </div>
        </div>
      </div>

      {/* MODALES IGUALES PERO MÁS COMPACTOS SI FUERA NECESARIO */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-10 border border-white/20">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Activity size={20}/></div>
                    <h3 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Actualizar Signos</h3>
                 </div>
                 <button onClick={() => setShowVitalsModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { l: 'Tensión Art.', k: 'bp', i: <Activity className="text-blue-500" />, u: 'mmHg', type: 'text' },
                  { l: 'Frec. Card.', k: 'hr', i: <HeartPulse className="text-rose-500" />, u: 'lpm', type: 'number' },
                  { l: 'Frec. Resp.', k: 'rr', i: <Wind className="text-emerald-500" />, u: 'rpm', type: 'number' },
                  { l: 'Temp. Corp.', k: 'temp', i: <Thermometer className="text-amber-500" />, u: '°C', type: 'number' },
                  { l: 'Sat. O2', k: 'o2', i: <Droplet className="text-cyan-500" />, u: '%', type: 'number' },
                  { l: 'Peso (kg)', k: 'weight', i: <Scale className="text-indigo-500" />, u: 'kg', type: 'number' },
                  { l: 'Talla (cm)', k: 'height', i: <Ruler className="text-violet-500" />, u: 'cm', type: 'number' },
                  { l: 'IMC', k: 'bmi', i: <Activity className="text-slate-400" />, u: '', type: 'number', readOnly: true }
                ].map(v => (
                  <div key={v.k} className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">{v.i} {v.l}</label>
                    <div className="relative">
                      <input type={v.type} readOnly={v.readOnly} className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-center focus:border-blue-500 outline-none transition-all ${v.readOnly ? 'opacity-40' : ''}`} value={(vitalsForm as any)[v.k]} onChange={e => setVitalsForm({...vitalsForm, [v.k]: v.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value})} />
                      <span className="absolute right-2 bottom-1 text-[6px] font-black text-slate-300 uppercase">{v.u}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleQuickUpdateVitals}
                className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Save size={18} /> GUARDAR EN MONITOREO
              </button>
           </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
            <div className="p-10 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-2xl font-black uppercase tracking-tighter">Orden de Intervención</h4>
              <button onClick={() => setShowMenu(false)} className="p-3 hover:bg-rose-50 rounded-2xl transition-all"><X size={32} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                {NOTE_CATEGORIES.map(cat => (
                  <div key={cat.title} className="space-y-4">
                    <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-50 pb-2">{cat.title}</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {cat.notes.map(note => (
                        <button key={note} onClick={() => {
                             const typeMap: any = { 
                               'Historia Clínica Medica': `/patient/${id}/history`, 
                               'Nota de Evolución': `/patient/${id}/note/evolution`, 
                               'Nota Inicial de Urgencias': `/patient/${id}/note/emergency`,
                               'Hoja de Enfermería': `/patient/${id}/nursing-sheet`, 
                               'Receta Médica': `/patient/${id}/prescription`,
                               'Nota de Egreso / Alta': `/patient/${id}/note/discharge`,
                               'Nota Pre-operatoria': `/patient/${id}/note/surgical`
                             };
                             navigate(typeMap[note] || `/patient/${id}/note/generic/${note}`);
                             setShowMenu(false);
                        }} className="w-full text-left p-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">{note}</button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white/20">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-lg"><FileText size={24} /></div>
                    <div><p className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedNote.type}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Sello Digital NOM-024</p></div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all"><Printer size={18} /> Imprimir Certificado</button>
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-rose-50 transition-all"><X size={24}/></button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-20 bg-white">
                 <div className="max-w-4xl mx-auto space-y-12 text-slate-900 print:text-black">
                    <div className="flex justify-between border-b-4 border-slate-900 pb-10">
                       <div className="space-y-4">
                          <h1 className="text-3xl font-black text-slate-900 uppercase leading-none">{doctorInfo.hospital}</h1>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Certificación Federal de Salud Pública</p>
                       </div>
                       <div className="text-right"><QrCode size={80} className="text-slate-900 inline-block mb-2" /><p className="text-xs font-black text-rose-600 uppercase tracking-tighter">FOLIO: {selectedNote.id}</p></div>
                    </div>
                    <div className="space-y-10">
                       {Object.entries(selectedNote.content).map(([key, val]) => (
                         <div key={key} className="space-y-2">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">{key}</h4>
                           <div className="text-sm font-medium text-slate-800 italic uppercase leading-relaxed print:text-black">
                              {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
