
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Scissors, Activity, HeartPulse, 
  ClipboardCheck, Clock, Droplets, UserCheck, Lock, AlertTriangle,
  FileText, Microscope, Thermometer, Syringe, Layers, CheckCircle2,
  AlertOctagon, Scale
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals } from '../../types';

const PostOperativeNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [form, setForm] = useState({
    // Tiempos
    surgeryDate: new Date().toISOString().split('T')[0],
    surgeryStartTime: '',
    surgeryEndTime: '',
    anesthesiaStartTime: '',
    anesthesiaEndTime: '',
    
    // Equipo Quirúrgico
    surgeon: 'Dr. Alejandro Méndez',
    assistant1: '',
    assistant2: '',
    anesthesiologist: '',
    instrumentalNurse: '',
    circulatingNurse: '',
    
    // Diagnósticos y Procedimientos
    preOpDiagnosis: '',
    postOpDiagnosis: '',
    plannedOperation: '',
    realizedOperation: '',
    surgicalTechnique: '', // Descripción detallada
    transOpFindings: '', // Hallazgos
    
    // Seguridad y Control
    woundClassification: 'Limpia', // Limpia, Limpia-Contaminada, Contaminada, Sucia
    surgicalCountCorrect: true, // Gasas, Compresas, Instrumental
    incidents: 'Sin incidentes ni accidentes.',
    
    // Hemodinamia y Fluidos
    bleeding: '50', // ml
    uresis: '', // ml
    transfusions: 'No requeridas',
    emesis: '',
    
    // Auxiliares Transoperatorios
    transOpStudies: 'No realizados', // Rx, Fluoro, Patología transoperatoria
    biopsySent: false,
    biopsyDetails: '',
    
    // Egreso de Quirófano
    aldreteScore: '10', // Escala de recuperación
    immediatePostOpStatus: 'Estable, reactivo, sin dolor.',
    postOpPlan: 'Pasa a Recuperación, analgesia horario, vigilancia estrecha.',
    prognosis: 'Bueno para la vida y la función.',
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (patient && !noteId) {
        if (patient.currentVitals) setVitals(patient.currentVitals);
    }
    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content as any);
        if (noteToEdit.content.vitals) setVitals(noteToEdit.content.vitals);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6 animate-in fade-in">
       <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-2xl">
          <Lock className="w-10 h-10 text-emerald-400" />
       </div>
       <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Nota Post-Operatoria Sellada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">Este registro quirúrgico ha sido certificado y bloqueado para garantizar la integridad clínica y legal del expediente.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.postOpDiagnosis || !form.realizedOperation || !form.surgicalTechnique) {
            alert("Campos críticos faltantes: Diagnóstico Post-op, Operación Realizada o Descripción de la Técnica.");
            return;
        }
        if (!window.confirm("¿Certificar y finalizar Nota Post-operatoria? Esta acción cerrará el registro quirúrgico de forma permanente.")) return;
    }

    const currentNoteId = noteId || `POSTOP-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota Post-operatoria',
      date: new Date().toLocaleString('es-MX'),
      author: form.surgeon,
      content: { ...form, vitals },
      isSigned: finalize,
      hash: finalize ? `CERT-SURG-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-indigo-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nota Post-operatoria</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-004-SSA3-2012 • Acto Quirúrgico
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 text-indigo-700">
             <Scissors size={20} />
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Procedimiento</p>
                 <p className="text-sm font-black uppercase">{form.realizedOperation || 'En Proceso'}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: EQUIPO Y TIEMPOS */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* TIEMPOS QUIRÚRGICOS */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Clock size={14}/> Tiempos Quirúrgicos
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Fecha de Cirugía</label>
                         <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.surgeryDate} onChange={e => setForm({...form, surgeryDate: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Inicio Cirugía</label>
                            <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.surgeryStartTime} onChange={e => setForm({...form, surgeryStartTime: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Término Cirugía</label>
                            <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.surgeryEndTime} onChange={e => setForm({...form, surgeryEndTime: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Inicio Anestesia</label>
                            <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.anesthesiaStartTime} onChange={e => setForm({...form, anesthesiaStartTime: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Término Anestesia</label>
                            <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.anesthesiaEndTime} onChange={e => setForm({...form, anesthesiaEndTime: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* EQUIPO QUIRÚRGICO */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <UserCheck size={14} className="text-emerald-400"/> Equipo Quirúrgico
                </h3>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Cirujano</label>
                        <input className="w-full p-2.5 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white outline-none" value={form.surgeon} onChange={e => setForm({...form, surgeon: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Anestesiólogo</label>
                        <input className="w-full p-2.5 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white outline-none" value={form.anesthesiologist} onChange={e => setForm({...form, anesthesiologist: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Ayudante 1</label>
                            <input className="w-full p-2.5 bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium text-white outline-none" value={form.assistant1} onChange={e => setForm({...form, assistant1: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Ayudante 2</label>
                            <input className="w-full p-2.5 bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium text-white outline-none" value={form.assistant2} onChange={e => setForm({...form, assistant2: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Enf. Quirúrgica</label>
                            <input className="w-full p-2.5 bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium text-white outline-none" value={form.instrumentalNurse} onChange={e => setForm({...form, instrumentalNurse: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Enf. Circulante</label>
                            <input className="w-full p-2.5 bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium text-white outline-none" value={form.circulatingNurse} onChange={e => setForm({...form, circulatingNurse: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* BALANCE DE FLUIDOS */}
            <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-2">
                    <Droplets size={14}/> Balance de Fluidos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-rose-400 uppercase ml-1">Sangrado (ml)</label>
                        <input type="number" className="w-full p-3 bg-white border border-rose-100 rounded-xl text-lg font-black text-rose-600 text-center outline-none" value={form.bleeding} onChange={e => setForm({...form, bleeding: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Uresis (ml)</label>
                        <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-lg font-black text-slate-600 text-center outline-none" value={form.uresis} onChange={e => setForm({...form, uresis: e.target.value})} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Transfusiones / Hemoderivados</label>
                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.transfusions} onChange={e => setForm({...form, transfusions: e.target.value})} />
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: DESCRIPCIÓN QUIRÚRGICA */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. DIAGNÓSTICO Y PROCEDIMIENTO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico Pre-operatorio</label>
                           <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none outline-none" value={form.preOpDiagnosis} onChange={e => setForm({...form, preOpDiagnosis: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Operación Planeada</label>
                           <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none outline-none" value={form.plannedOperation} onChange={e => setForm({...form, plannedOperation: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2">Diagnóstico Post-operatorio</label>
                           <textarea className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl h-20 text-xs font-black uppercase resize-none outline-none text-emerald-900" value={form.postOpDiagnosis} onChange={e => setForm({...form, postOpDiagnosis: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">Operación Realizada</label>
                           <textarea className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl h-20 text-xs font-black uppercase resize-none outline-none text-blue-900" value={form.realizedOperation} onChange={e => setForm({...form, realizedOperation: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* 2. TÉCNICA QUIRÚRGICA */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Scissors size={14} className="text-indigo-600"/> Descripción de la Técnica Quirúrgica
                    </label>
                    <textarea 
                        className="w-full p-6 bg-white border border-slate-200 rounded-2xl h-64 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner leading-relaxed" 
                        value={form.surgicalTechnique} 
                        onChange={e => setForm({...form, surgicalTechnique: e.target.value})} 
                        placeholder="Posición, asepsia y antisepsia, abordaje, hallazgos, procedimiento paso a paso, cierre, material utilizado..."
                    />
                </div>

                {/* 3. HALLAZGOS Y ACCIDENTES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Microscope size={14} className="text-purple-600"/> Hallazgos Transoperatorios
                        </label>
                        <textarea 
                            className="w-full p-5 bg-purple-50/20 border border-purple-100 rounded-2xl h-32 text-xs font-medium outline-none resize-none" 
                            value={form.transOpFindings} 
                            onChange={e => setForm({...form, transOpFindings: e.target.value})} 
                            placeholder="Anatomía patológica macroscópica, variantes anatómicas..."
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-600"/> Incidentes / Accidentes
                        </label>
                        <textarea 
                            className="w-full p-5 bg-amber-50/30 border border-amber-100 rounded-2xl h-32 text-xs font-medium outline-none resize-none" 
                            value={form.incidents} 
                            onChange={e => setForm({...form, incidents: e.target.value})} 
                        />
                     </div>
                </div>

                {/* 4. SEGURIDAD Y CIERRE */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} /> Control de Seguridad y Cierre
                        </h4>
                        <button 
                            onClick={() => setForm({...form, surgicalCountCorrect: !form.surgicalCountCorrect})}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${form.surgicalCountCorrect ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}
                        >
                            {form.surgicalCountCorrect ? <CheckCircle2 size={12}/> : <AlertOctagon size={12}/>} 
                            {form.surgicalCountCorrect ? 'Cuenta Completa' : 'Cuenta Pendiente/Incorrecta'}
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Clasificación Herida</label>
                            <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.woundClassification} onChange={e => setForm({...form, woundClassification: e.target.value})}>
                                <option>Limpia</option>
                                <option>Limpia-Contaminada</option>
                                <option>Contaminada</option>
                                <option>Sucia / Infectada</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Piezas a Patología</label>
                            <div className="flex gap-2">
                                <button onClick={() => setForm({...form, biopsySent: true})} className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase ${form.biopsySent ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}>Sí</button>
                                <button onClick={() => setForm({...form, biopsySent: false})} className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase ${!form.biopsySent ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-white border-slate-200 text-slate-400'}`}>No</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Aldrete Post-op</label>
                            <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-center" value={form.aldreteScore} onChange={e => setForm({...form, aldreteScore: e.target.value})} placeholder="10" />
                        </div>
                    </div>

                    {form.biopsySent && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <label className="text-[9px] font-black text-indigo-600 uppercase ml-2">Descripción de Piezas Enviadas</label>
                            <input className="w-full p-4 bg-white border border-indigo-100 rounded-xl text-xs font-medium" value={form.biopsyDetails} onChange={e => setForm({...form, biopsyDetails: e.target.value})} placeholder="Ej: Vesícula biliar, apéndice cecal..." />
                        </div>
                    )}
                </div>

                {/* 5. PLAN POST-OPERATORIO */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Layers size={14} className="text-blue-600"/> Plan de Manejo Inmediato
                    </label>
                    <textarea 
                        className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none resize-none" 
                        value={form.postOpPlan} 
                        onChange={e => setForm({...form, postOpPlan: e.target.value})} 
                        placeholder="Indicaciones para recuperación, analgesia, antibióticos, dieta..."
                    />
                    <div className="flex gap-4 items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Pronóstico:</p>
                        <input className="flex-1 bg-transparent border-b border-blue-200 text-xs font-bold text-blue-900 outline-none uppercase" value={form.prognosis} onChange={e => setForm({...form, prognosis: e.target.value})} />
                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-4">
                    <Save size={20} /> Certificar Cirugía
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostOperativeNote;
