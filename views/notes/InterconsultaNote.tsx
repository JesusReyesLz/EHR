
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Users, Stethoscope, 
  MessageSquare, BookOpen, Lock, PenTool, Activity, 
  HeartPulse, Thermometer, Wind, FileText, ClipboardList,
  Brain, Microscope, Clock, Calendar
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals } from '../../types';

const InterconsultaNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // Estado para Signos Vitales (Snapshot al momento de la interconsulta)
  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [form, setForm] = useState({
    // Datos Generales
    requestedBy: '', // Médico solicitante
    serviceRequesting: '', // Servicio solicitante
    dateService: new Date().toISOString().split('T')[0],
    timeService: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    
    // Motivo
    consultReason: '', // Motivo de atención/consulta

    // S: Subjetivo
    interrogationSummary: '', // Resumen: AHFM, APP, APNP, PA, IPAYS

    // O: Objetivo
    physicalExam: '', // Exploración Física y Estado Mental
    relevantResults: '', // Resultados relevantes de estudios

    // A: Análisis
    diagnosticCriteria: '', // Criterios diagnósticos
    clinicalDiagnosis: '', // Diagnóstico o problemas clínicos

    // P: Plan
    studyPlan: '', // Plan de estudios
    suggestions: '', // Sugerencias de diagnóstico y tratamiento
    treatmentAndPrognosis: '' // Tratamiento y Pronóstico
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    // 1. Cargar nota existente si hay noteId
    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content as any);
        if (noteToEdit.content.vitals) {
            setVitals(noteToEdit.content.vitals);
        }
      }
    } 
    // 2. Si es nota nueva, cargar vitales actuales del paciente
    else if (patient && patient.currentVitals) {
        setVitals(patient.currentVitals);
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;
  
  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6 animate-in fade-in">
       <div className="w-24 h-24 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-rose-600" />
       </div>
       <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Interconsulta Certificada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">Este dictamen de especialista ha sido sellado digitalmente y no puede ser modificado por normativa sanitaria.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    // Validación estricta solo para certificación
    if (finalize && (!form.consultReason || !form.clinicalDiagnosis || !form.suggestions)) {
      alert("Para certificar el dictamen, es obligatorio completar: Motivo, Diagnóstico y Sugerencias.");
      return;
    }

    if (finalize) {
      const legalMsg = "Atención: Al finalizar este registro médico, se integrará de forma permanente al expediente clínico conforme a la NOM-004-SSA3-2012. Una vez certificado, NO podrá ser editado ni eliminado. ¿Desea proceder?";
      if (!window.confirm(legalMsg)) return;
    }

    const currentNoteId = noteId || `INT-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Interconsulta',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez (Especialista)',
      content: { ...form, vitals }, // Guardamos snapshot de vitales
      isSigned: finalize,
      hash: finalize ? `CERT-INT-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      <div className="bg-white border-b-8 border-indigo-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
               {noteId ? 'Editando Interconsulta' : 'Nota de Interconsulta'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500"/> Numeral 8.6 NOM-004-SSA3
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
            <Users className="text-indigo-600" size={20} />
            <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Paciente</p>
                <p className="text-sm font-black text-indigo-900 uppercase">{patient.name}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: DATOS GENERALES Y VITALES */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Clock size={14}/> Datos del Servicio
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Médico / Servicio Solicitante</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none" value={form.requestedBy} onChange={e => setForm({...form, requestedBy: e.target.value})} placeholder="Nombre del médico..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Fecha Atención</label>
                            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.dateService} onChange={e => setForm({...form, dateService: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Hora Atención</label>
                            <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.timeService} onChange={e => setForm({...form, timeService: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden border-b-4 border-indigo-500">
                <div className="relative z-10 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400"/> Signos Vitales
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Al momento</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                        { l: 'T.A.', v: vitals.bp, u: 'mmHg', i: <Activity size={12}/> },
                        { l: 'F.C.', v: vitals.hr, u: 'lpm', i: <HeartPulse size={12}/> },
                        { l: 'F.R.', v: vitals.rr, u: 'rpm', i: <Wind size={12}/> },
                        { l: 'Temp', v: vitals.temp, u: '°C', i: <Thermometer size={12}/> }
                    ].map(item => (
                        <div key={item.l} className="bg-white/10 p-3 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">{item.i} {item.l}</p>
                            <input 
                                className="w-full bg-transparent text-lg font-black text-white outline-none" 
                                value={item.v}
                                onChange={e => setVitals({...vitals, [item.l === 'T.A.' ? 'bp' : item.l === 'F.C.' ? 'hr' : item.l === 'F.R.' ? 'rr' : 'temp']: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-20"></div>
            </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO CLÍNICO */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* SECCIÓN 1: INTERROGATORIO Y MOTIVO */}
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <MessageSquare size={14} className="text-blue-600"/> Motivo de Interconsulta
                    </label>
                    <textarea 
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner" 
                        value={form.consultReason} 
                        onChange={e => setForm({...form, consultReason: e.target.value})} 
                        placeholder="Razón específica de la solicitud..."
                    />
                </div>
                
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <FileText size={14} className="text-indigo-600"/> Resumen del Interrogatorio (AHFM, APP, APNP, PA, IPAYS)
                    </label>
                    <textarea 
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner" 
                        value={form.interrogationSummary} 
                        onChange={e => setForm({...form, interrogationSummary: e.target.value})} 
                        placeholder="Datos relevantes del interrogatorio..."
                    />
                </div>
            </div>

            {/* SECCIÓN 2: EXPLORACIÓN Y AUXILIARES */}
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Stethoscope size={14} className="text-emerald-600"/> Exploración Física y Estado Mental
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-medium outline-none focus:bg-white focus:border-emerald-400 transition-all" 
                            value={form.physicalExam} 
                            onChange={e => setForm({...form, physicalExam: e.target.value})} 
                            placeholder="Hallazgos físicos dirigidos y evaluación mental..."
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Microscope size={14} className="text-purple-600"/> Resultados Relevantes de Estudios
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-medium outline-none focus:bg-white focus:border-purple-400 transition-all" 
                            value={form.relevantResults} 
                            onChange={e => setForm({...form, relevantResults: e.target.value})} 
                            placeholder="Laboratorio, Gabinete, etc..."
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: ANÁLISIS Y PLAN */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[9px] font-black text-indigo-900 uppercase tracking-widest ml-2">Diagnóstico o Problemas Clínicos</label>
                            <input 
                                className="w-full p-4 bg-white border border-indigo-200 rounded-2xl text-sm font-black uppercase outline-none focus:border-indigo-500 shadow-sm"
                                value={form.clinicalDiagnosis}
                                onChange={e => setForm({...form, clinicalDiagnosis: e.target.value})}
                                placeholder="Diagnóstico Principal..."
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Brain size={14}/> Criterios Diagnósticos
                        </label>
                        <textarea 
                            className="w-full p-4 bg-white border border-indigo-200 rounded-2xl h-20 text-sm font-medium outline-none" 
                            value={form.diagnosticCriteria} 
                            onChange={e => setForm({...form, diagnosticCriteria: e.target.value})} 
                            placeholder="Justificación del diagnóstico..."
                        />
                    </div>
                </div>

                <div className="h-px bg-indigo-200 w-full"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Sugerencias Diagnósticas y Terapéuticas</label>
                        <textarea 
                            className="w-full p-6 bg-white border border-indigo-200 rounded-2xl h-32 text-sm font-medium outline-none shadow-sm" 
                            value={form.suggestions} 
                            onChange={e => setForm({...form, suggestions: e.target.value})} 
                            placeholder="Recomendaciones al médico tratante..."
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Plan de Estudios</label>
                        <textarea 
                            className="w-full p-6 bg-white border border-indigo-200 rounded-2xl h-32 text-sm font-medium outline-none shadow-sm" 
                            value={form.studyPlan} 
                            onChange={e => setForm({...form, studyPlan: e.target.value})} 
                            placeholder="Estudios adicionales sugeridos..."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <ClipboardList size={14}/> Tratamiento Definitivo y Pronóstico
                    </label>
                    <textarea 
                        className="w-full p-6 bg-white border border-indigo-200 rounded-2xl h-24 text-sm font-medium outline-none shadow-sm" 
                        value={form.treatmentAndPrognosis} 
                        onChange={e => setForm({...form, treatmentAndPrognosis: e.target.value})} 
                        placeholder="Manejo farmacológico y pronóstico..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4">
                    <ShieldCheck size={20} /> Certificar Dictamen
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InterconsultaNote;
