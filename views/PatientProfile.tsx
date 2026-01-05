
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, ChevronLeft, Printer, ShieldCheck, User, Plus, FileText, ClipboardList, 
  Thermometer, Heart, Wind, Droplet, Edit3, Trash2, Save, HeartPulse, 
  TrendingUp, ChevronRight, FilePlus2, Flame, Droplets, X, QrCode, BadgeCheck, Scale, Ruler,
  Calendar, CheckSquare, Maximize2, Clock, Info, LogOut, CheckCircle2, Lock, RotateCcw, FileBadge, AlertOctagon,
  FileSpreadsheet, Globe, Accessibility, Stethoscope, List, Baby, Syringe, Pill, Edit,
  Video, Wifi
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Patient, ClinicalNote, Vitals, DoctorInfo, PatientStatus, ModuleType } from '../types';
import { NOTE_CATEGORIES } from '../constants';

// Helper para parsear fechas híbridas (ISO y Locale DD/MM/YYYY)
const parseDateSafe = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  try {
    const cleanStr = dateStr.trim();
    const parts = cleanStr.split(/[\s,]+/); 
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : '00:00';
    if (datePart.includes('/')) {
        const [day, month, year] = datePart.split('/').map(Number);
        let [hour, minute] = timePart.split(':').map(Number);
        if (isNaN(hour)) hour = 0;
        if (isNaN(minute)) minute = 0;
        if (day && month && year) {
             const composed = new Date(year, month - 1, day, hour, minute);
             if (!isNaN(composed.getTime())) return composed;
        }
    }
  } catch (e) {}
  return new Date(0); 
};

const PatientProfile: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient: (p: Patient) => void, onSaveNote: (n: ClinicalNote) => void, doctorInfo: DoctorInfo }> = ({ patients, notes, onUpdatePatient, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  
  const [vitalsForm, setVitalsForm] = useState<Vitals>({
    bp: '120/80', temp: 36.6, hr: 72, rr: 18, o2: 98, weight: 82, height: 175, bmi: 26.8, date: ''
  });

  const isAttended = useMemo(() => patient?.status === PatientStatus.ATTENDED, [patient]);

  if (!patient) return <div className="p-20 text-center uppercase font-black text-slate-300">Paciente no encontrado</div>;

  const patientNotes = useMemo(() => notes.filter(n => n.patientId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, id]);

  const renderDynamicChart = (data: Vitals[] | null) => {
    if (!data || data.length === 0) return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm h-[280px] flex flex-col items-center justify-center opacity-40">
        <TrendingUp size={32} className="mb-2 text-slate-300" />
        <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">Sin datos históricos de signos vitales</p>
      </div>
    );
    const chartData = [...data]
        .map(v => ({ ...v, parsedDate: parseDateSafe(v.date) }))
        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
        .slice(-15)
        .map(v => {
             const timeLabel = v.parsedDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
             const [sys, dia] = (v.bp && v.bp.includes('/')) ? v.bp.split('/').map(n => parseInt(n) || 0) : [0, 0];
             return { name: timeLabel, sys, dia, hr: Number(v.hr) || 0, temp: Number(v.temp) || 0 };
        });

    return (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="sys" stroke="#3b82f6" strokeWidth={3} name="T.A. Sistólica" dot={{r: 4}} />
                    <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={3} name="Frec. Cardiaca" dot={{r: 4}} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
  };

  const getNoteRoute = (type: string, noteId?: string) => {
    const typeMap: any = { 
      'Historia Clínica Medica': `/patient/${id}/history`, 
      'Nota de Evolución': `/patient/${id}/note/evolution`, 
      'Nota de Ingreso a Hospitalización': `/patient/${id}/note/admission`, 
      'Nota Pre-operatoria': `/patient/${id}/note/preoperative`, 
      'Nota Pre-anestésica': `/patient/${id}/note/preanesthetic`,
      'Hoja de Registro Anestésico': `/patient/${id}/note/anesthetic-record`, 
      'Nota Post-anestésica': `/patient/${id}/note/postanesthetic`, 
      'Nota de Alta de Recuperación': `/patient/${id}/note/recovery-discharge`,
      'Nota Post-operatoria': `/patient/${id}/note/postoperative`,
      'Nota Quirúrgica': `/patient/${id}/note/surgical`,
      'Nota Inicial de Urgencias': `/patient/${id}/note/emergency`,
      'Nota de Interconsulta': `/patient/${id}/note/interconsulta`,
      'Nota de Egreso / Alta': `/patient/${id}/note/discharge`,
      'Nota de Referencia y Traslado': `/patient/${id}/note/referral`,
      'Nota de Contrarreferencia': `/patient/${id}/note/counter-referral`,
      'Resumen Clínico': `/patient/${id}/note/summary`,
      'Hoja de Enfermería': `/patient/${id}/nursing-sheet`, 
      'Receta Médica': `/patient/${id}/prescription`,
      'Carta de Consentimiento Informado': `/patient/${id}/consent`,
      'Hoja de Egreso Voluntario': `/patient/${id}/voluntary-discharge`,
      'Notificación al Ministerio Público': `/patient/${id}/mp-notification`,
      'Certificado de Defunción': `/patient/${id}/death-certificate`,
      'Consentimiento Telemedicina': `/patient/${id}/telemedicine-consent`,
      'Solicitud de Estudios': `/patient/${id}/auxiliary-order`,
      'Reporte de Resultados / Interpretación': `/patient/${id}/auxiliary-report`,
      'Registro de Transfusión': `/patient/${id}/transfusion`,
      'Estudio Socioeconómico': `/patient/${id}/social-work`,
      'Expediente Estomatológico': `/patient/${id}/stomatology`,
      'Estudio Epidemiológico': `/patient/${id}/epidemiology`,
      'Reporte de ESAVI': `/patient/${id}/note/esavi`,
      'Certificado Médico': `/patient/${id}/note/medical-certificate`
    };
    
    let path = '';
    if (type.startsWith('Certificado Médico')) {
        path = `/patient/${id}/note/medical-certificate`;
    } else {
        path = typeMap[type] || `/patient/${id}/note/generic/${type}`;
    }
    return noteId ? `${path}/${noteId}` : path;
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* BANNER DE BLOQUEO SI ESTÁ FINALIZADO */}
      {isAttended && (
        <div className="bg-amber-500 text-slate-900 p-5 rounded-[2rem] flex items-center justify-between shadow-2xl border-2 border-amber-400 no-print">
           <div className="flex items-center gap-5">
              <Lock size={24} />
              <div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">Expediente Archivado - Solo Lectura</p>
                 <p className="text-xs font-bold text-amber-900 mt-1 uppercase opacity-80">Atención finalizada. Inmutable para auditoría legal.</p>
              </div>
           </div>
           <button onClick={() => navigate('/')} className="p-3 bg-white/20 hover:bg-white/40 rounded-xl transition-all"><X size={20}/></button>
        </div>
      )}

      {/* HEADER DE FICHA */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between no-print relative">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-blue-400 flex items-center justify-center text-2xl font-black shadow-lg uppercase">{patient.name.charAt(0)}</div>
           <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">PACIENTE</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{patient.name}</h2>
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">EXP: {patient.id}</span>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {!isAttended && (
             <button onClick={() => setShowFinalizeModal(true)} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all group">
                <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /> Finalizar Atención
             </button>
           )}
           <button onClick={() => navigate('/')} className="p-3 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200"><X size={20} className="text-slate-400" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
           {renderDynamicChart(patient.vitalsHistory || null)}
           <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                 <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight leading-none flex items-center gap-2">
                    <ClipboardList className="text-blue-600 w-4 h-4" /> Historial de Atenciones
                 </h3>
                 {!isAttended && (
                   <button onClick={() => setShowMenu(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[8px] uppercase shadow-md hover:bg-slate-900 transition-all flex items-center gap-2 tracking-widest"><FilePlus2 size={14} /> Nueva Nota</button>
                 )}
              </div>
              <div className="divide-y divide-slate-50">
                 {patientNotes.map(note => (
                    <button 
                        key={note.id} 
                        onClick={() => note.isSigned ? setSelectedNote(note) : navigate(getNoteRoute(note.type, note.id))} 
                        className="w-full text-left p-6 hover:bg-blue-50/20 transition-all group flex items-start justify-between"
                    >
                       <div className="flex gap-4 items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!note.isSigned ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-400'}`}>
                              <FileText size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-700 tracking-tight flex items-center gap-2">
                                 {note.type}
                                 {!note.isSigned && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[7px] font-black uppercase border border-amber-200">Borrador</span>}
                             </p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{note.date} • {note.author}</p>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-all self-center" />
                    </button>
                 ))}
                 {patientNotes.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">Sin registros previos</div>}
              </div>
           </div>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
           <div className={`bg-slate-50 border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-6 ${isAttended ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
                 <HeartPulse className="text-blue-600" size={18} />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">SIGNOS VITALES</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { l: 'T.A.', v: patient.currentVitals?.bp || '120/80', u: 'mmHg', i: <Activity size={14} className="text-blue-500" /> },
                   { l: 'F.C.', v: patient.currentVitals?.hr || '72', u: 'lpm', i: <Heart size={14} className="text-rose-500" /> },
                   { l: 'TEMP', v: patient.currentVitals?.temp || '36.6', u: '°C', i: <Thermometer size={14} className="text-amber-500" /> },
                   { l: 'SATO2', v: patient.currentVitals?.o2 || '98', u: '%', i: <Droplet size={14} className="text-cyan-500" /> }
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
           </div>
        </div>
      </div>

      {showMenu && !isAttended && (
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
                             navigate(getNoteRoute(note));
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
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedNote.type}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Folio: {selectedNote.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm flex items-center gap-3 hover:bg-blue-600 transition-all"><Printer size={18} /> Imprimir</button>
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-rose-50 transition-all"><X size={24}/></button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-20 bg-white">
                 <div className="max-w-4xl mx-auto space-y-12 text-slate-900 print:text-black">
                    <div className="flex justify-between border-b-4 border-slate-900 pb-10">
                       <div className="space-y-4">
                          <h1 className="text-3xl font-black text-slate-900 uppercase leading-none">{doctorInfo.hospital}</h1>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Expediente Clínico Electrónico Certificado</p>
                       </div>
                       <div className="text-right"><QrCode size={80} className="text-slate-900 inline-block mb-2" /><p className="text-xs font-black text-rose-600 uppercase tracking-tighter">FOLIO: {selectedNote.id}</p></div>
                    </div>
                    <div className="space-y-10">
                       {Object.entries(selectedNote.content).map(([key, val]) => {
                         if (key === 'vitals') return null;
                         return (
                           <div key={key} className="space-y-2">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">{key}</h4>
                             <div className="text-sm font-medium text-slate-800 italic uppercase leading-relaxed print:text-black">
                                {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                             </div>
                           </div>
                         );
                       })}
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
