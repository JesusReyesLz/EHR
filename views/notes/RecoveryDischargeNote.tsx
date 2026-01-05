
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Wind, 
  HeartPulse, Brain, Lock, CheckSquare, 
  FileText, LogOut, CheckCircle2
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals } from '../../types';

const RecoveryDischargeNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // Estados
  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [aldrete, setAldrete] = useState({
      activity: 2,
      respiration: 2,
      circulation: 2,
      consciousness: 2,
      oxygenation: 2
  });
  
  const aldreteTotal = useMemo(() => (Object.values(aldrete) as number[]).reduce((a, b) => a + b, 0), [aldrete]);

  const [whoChecklist, setWhoChecklist] = useState({
      instrumentCountCorrect: false,
      specimenLabeled: false,
      equipmentIssues: false,
      recoveryConcernsReviewed: false
  });

  const [form, setForm] = useState({
    // Encabezado
    anesthesiologist: 'Dr. Roberto Cruz',
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    
    // Evolución (SOAP simplificado)
    evolutionSubjective: '', // Estado del paciente, dolor, náusea
    evolutionObjective: '', // Herida quirúrgica, sangrado, drenajes
    evolutionAnalysis: '', // Diagnóstico situacional al egreso
    
    // Plan
    dischargeDestination: 'Hospitalización', // Piso, UCI, Domicilio
    analgesiaPlan: '',
    antiemeticPlan: '',
    oxygenRequirement: 'Aire ambiente',
    recommendations: 'Vigilancia de signos vitales por turno. Avisar en caso de dolor no controlado.'
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (patient && !noteId) {
       if (patient.currentVitals) setVitals(patient.currentVitals);
       setForm(prev => ({
           ...prev,
           evolutionSubjective: 'Paciente refiere dolor leve controlado, niega náusea.',
           evolutionObjective: 'Herida quirúrgica limpia, sin sangrado activo. Drenajes funcionales.',
       }));
    }

    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content.formData);
        if (noteToEdit.content.vitals) setVitals(noteToEdit.content.vitals);
        if (noteToEdit.content.aldrete) setAldrete(noteToEdit.content.aldrete);
        if (noteToEdit.content.whoChecklist) setWhoChecklist(noteToEdit.content.whoChecklist);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6 animate-in fade-in">
       <div className="w-24 h-24 bg-teal-50 border-4 border-teal-100 rounded-full flex items-center justify-center mx-auto shadow-2xl">
          <Lock className="w-10 h-10 text-teal-600" />
       </div>
       <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Alta de Recuperación Cerrada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">El paciente ha sido egresado de la unidad de cuidados post-anestésicos con criterios de seguridad verificados.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (aldreteTotal < 9) {
             if (!window.confirm(`ALERTA: El puntaje de Aldrete es ${aldreteTotal}/10. Generalmente se requiere >= 9 para alta a piso. ¿Desea continuar bajo criterio médico?`)) return;
        }
        if (!whoChecklist.instrumentCountCorrect || !whoChecklist.recoveryConcernsReviewed) {
             alert("Debe completar la Lista de Verificación de Seguridad OMS antes de dar el alta.");
             return;
        }
        if (!window.confirm("¿Firmar y autorizar egreso de recuperación?")) return;
    }

    const currentNoteId = noteId || `REC-DIS-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Alta de Recuperación',
      date: new Date().toLocaleString('es-MX'),
      author: form.anesthesiologist,
      content: { formData: form, vitals, aldrete, whoChecklist, aldreteTotal },
      isSigned: finalize,
      hash: finalize ? `CERT-REC-DIS-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  const AldreteOption = ({ label, value, current, onClick }: any) => (
      <button 
        onClick={onClick}
        className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center gap-1 h-20 ${current === value ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-200' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
      >
          <span className="text-lg">{value}</span>
          <span className="text-center leading-tight">{label}</span>
      </button>
  );

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-teal-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Egreso de Recuperación</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-006-SSA3-2011 • Unidad de Cuidados Post-Anestésicos
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${aldreteTotal >= 9 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
             <Brain size={20} />
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Aldrete Score</p>
                 <p className="text-2xl font-black uppercase leading-none">{aldreteTotal}/10</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: ALDRETE Y VITALES */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* ALDRETE CALCULATOR - DETAILED */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Activity size={14} className="text-teal-600"/> Escala de Aldrete
                    </h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${aldreteTotal >= 9 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {aldreteTotal >= 9 ? 'Alta Autorizada' : 'Retener'}
                    </span>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Actividad Motora</p>
                        <div className="flex gap-1">
                            <AldreteOption label="4 Ext" value={2} current={aldrete.activity} onClick={() => setAldrete({...aldrete, activity: 2})} />
                            <AldreteOption label="2 Ext" value={1} current={aldrete.activity} onClick={() => setAldrete({...aldrete, activity: 1})} />
                            <AldreteOption label="0 Ext" value={0} current={aldrete.activity} onClick={() => setAldrete({...aldrete, activity: 0})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Respiración</p>
                        <div className="flex gap-1">
                            <AldreteOption label="Profunda" value={2} current={aldrete.respiration} onClick={() => setAldrete({...aldrete, respiration: 2})} />
                            <AldreteOption label="Disnea" value={1} current={aldrete.respiration} onClick={() => setAldrete({...aldrete, respiration: 1})} />
                            <AldreteOption label="Apnea" value={0} current={aldrete.respiration} onClick={() => setAldrete({...aldrete, respiration: 0})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Circulación (TA)</p>
                        <div className="flex gap-1">
                            <AldreteOption label="±20%" value={2} current={aldrete.circulation} onClick={() => setAldrete({...aldrete, circulation: 2})} />
                            <AldreteOption label="±20-50%" value={1} current={aldrete.circulation} onClick={() => setAldrete({...aldrete, circulation: 1})} />
                            <AldreteOption label="±50%" value={0} current={aldrete.circulation} onClick={() => setAldrete({...aldrete, circulation: 0})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Conciencia</p>
                        <div className="flex gap-1">
                            <AldreteOption label="Alerta" value={2} current={aldrete.consciousness} onClick={() => setAldrete({...aldrete, consciousness: 2})} />
                            <AldreteOption label="Llamado" value={1} current={aldrete.consciousness} onClick={() => setAldrete({...aldrete, consciousness: 1})} />
                            <AldreteOption label="No Resp" value={0} current={aldrete.consciousness} onClick={() => setAldrete({...aldrete, consciousness: 0})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Coloración / SatO2</p>
                        <div className="flex gap-1">
                            <AldreteOption label=">92% AA" value={2} current={aldrete.oxygenation} onClick={() => setAldrete({...aldrete, oxygenation: 2})} />
                            <AldreteOption label=">90% O2" value={1} current={aldrete.oxygenation} onClick={() => setAldrete({...aldrete, oxygenation: 1})} />
                            <AldreteOption label="<90% O2" value={0} current={aldrete.oxygenation} onClick={() => setAldrete({...aldrete, oxygenation: 0})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* VITALES DE EGRESO */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <HeartPulse size={14} className="text-rose-400"/> Signos Vitales al Alta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">T.A.</label>
                        <input className="w-full bg-transparent border-b border-slate-700 text-lg font-black text-center outline-none" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">F.C.</label>
                        <input className="w-full bg-transparent border-b border-slate-700 text-lg font-black text-center outline-none" value={vitals.hr} onChange={e => setVitals({...vitals, hr: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Temp</label>
                        <input className="w-full bg-transparent border-b border-slate-700 text-lg font-black text-center outline-none" value={vitals.temp} onChange={e => setVitals({...vitals, temp: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">SatO2</label>
                        <input className="w-full bg-transparent border-b border-slate-700 text-lg font-black text-center outline-none" value={vitals.o2} onChange={e => setVitals({...vitals, o2: parseInt(e.target.value) || 0})} />
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: EVOLUCIÓN Y CHECKLIST OMS */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* CHECKLIST OMS SALIDA */}
                <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <CheckSquare size={14} /> Lista de Verificación de Seguridad de la Cirugía (Salida)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => setWhoChecklist({...whoChecklist, instrumentCountCorrect: !whoChecklist.instrumentCountCorrect})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${whoChecklist.instrumentCountCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                            {whoChecklist.instrumentCountCorrect ? <CheckCircle2 size={18}/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                            <span className="text-[9px] font-black uppercase">Recuento de Instrumentos, Gasas y Agujas Correcto</span>
                        </button>
                        <button 
                            onClick={() => setWhoChecklist({...whoChecklist, specimenLabeled: !whoChecklist.specimenLabeled})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${whoChecklist.specimenLabeled ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                            {whoChecklist.specimenLabeled ? <CheckCircle2 size={18}/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                            <span className="text-[9px] font-black uppercase">Etiquetado de Muestras (Si aplica)</span>
                        </button>
                        <button 
                            onClick={() => setWhoChecklist({...whoChecklist, equipmentIssues: !whoChecklist.equipmentIssues})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${whoChecklist.equipmentIssues ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                            {whoChecklist.equipmentIssues ? <CheckCircle2 size={18}/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                            <span className="text-[9px] font-black uppercase">Problemas con Instrumental/Equipos Resueltos</span>
                        </button>
                        <button 
                            onClick={() => setWhoChecklist({...whoChecklist, recoveryConcernsReviewed: !whoChecklist.recoveryConcernsReviewed})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${whoChecklist.recoveryConcernsReviewed ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                            {whoChecklist.recoveryConcernsReviewed ? <CheckCircle2 size={18}/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                            <span className="text-[9px] font-black uppercase">Revisión de Aspectos Clave para Recuperación</span>
                        </button>
                    </div>
                </div>

                {/* EVOLUCIÓN */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <FileText size={14} className="text-blue-600"/> Evolución en Recuperación (Resumen)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <textarea 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" 
                                value={form.evolutionSubjective} 
                                onChange={e => setForm({...form, evolutionSubjective: e.target.value})} 
                                placeholder="Subjetivo: Dolor, náusea, confort..."
                             />
                             <textarea 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" 
                                value={form.evolutionObjective} 
                                onChange={e => setForm({...form, evolutionObjective: e.target.value})} 
                                placeholder="Objetivo: Sangrado, diuresis, herida..."
                             />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Análisis / Diagnóstico de Egreso</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.evolutionAnalysis} onChange={e => setForm({...form, evolutionAnalysis: e.target.value})} placeholder="Ej: Post-quirúrgico inmediato estable" />
                    </div>
                </div>

                {/* PLAN Y DESTINO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Destino</label>
                            <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.dischargeDestination} onChange={e => setForm({...form, dischargeDestination: e.target.value})}>
                                <option>Hospitalización (Piso)</option>
                                <option>Unidad de Cuidados Intensivos (UCI)</option>
                                <option>Domicilio (Ambulatoria)</option>
                                <option>Traslado</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Requerimiento O2</label>
                            <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium" value={form.oxygenRequirement} onChange={e => setForm({...form, oxygenRequirement: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Recomendaciones y Plan</label>
                        <textarea 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-32 text-xs font-medium resize-none outline-none" 
                            value={form.recommendations} 
                            onChange={e => setForm({...form, recommendations: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-teal-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-teal-700 transition-all flex items-center gap-4">
                    <LogOut size={20} /> Autorizar Alta UCPA
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryDischargeNote;
