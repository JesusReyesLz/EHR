
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Wind, 
  AlertTriangle, HeartPulse, Droplets, Brain, Syringe, 
  Timer, Lock, CheckCircle2, AlertOctagon, ThumbsUp, Scale
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

const PostAnestheticNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void, doctorInfo?: DoctorInfo }> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  // Estado para la calculadora de Aldrete
  const [aldrete, setAldrete] = useState({
      activity: 2,
      respiration: 2,
      circulation: 2,
      consciousness: 2,
      oxygenation: 2
  });
  
  const aldreteTotal = useMemo(() => (Object.values(aldrete) as number[]).reduce((a, b) => a + b, 0), [aldrete]);

  const [form, setForm] = useState({
    // Datos Generales
    anesthesiologist: doctorInfo?.name || 'Dr. Roberto Cruz',
    procedurePerformed: '',
    
    // Tiempos
    anesthesiaStartTime: '',
    anesthesiaEndTime: '',
    duration: '',
    
    // Técnica y Manejo
    technique: 'General Balanceada', // General, Regional, Sedación
    airwayDevice: 'Tubo Endotraqueal',
    monitoringUsed: 'ECG, PNI, SpO2, Capnografía, Temp',
    
    // Fármacos
    medsInduction: '',
    medsMaintenance: '',
    medsAnalgesia: '', // Intraoperatoria
    medsReversal: '', // Reversión de bloqueo neuromuscular/sedación
    
    // Balance Hídrico (Ingresos/Egresos)
    inCrystalloids: 0,
    inColloids: 0,
    inBlood: 0,
    inBloodProducts: 0, // NEW
    outUrine: 0,
    outBleeding: 0,
    outEmesis: 0, // NEW
    
    // Incidentes
    incidents: 'Sin incidentes ni accidentes.',
    
    // Estado al Egreso de Sala
    painScoreEVA: 0, // 0-10
    bromageScore: 0, // 0-3 (Para regional)
    nauseaVomiting: false,
    
    // Plan Post-Anestésico
    postOpAnalgesia: 'Ketorolaco 30mg IV c/8h',
    antiemetics: 'Ondansetron 4mg IV dosis única si náusea',
    oxygenTherapy: 'Puntas nasales a 3 lpm',
    monitoringPlan: 'Vigilancia estrecha en UCPA por 2 horas',
    dischargeCriteria: 'Pasa a Recuperación (UCPA)'
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  // Calcular balance hídrico
  const fluidBalance = useMemo(() => {
      const totalIn = (form.inCrystalloids || 0) + (form.inColloids || 0) + (form.inBlood || 0) + (form.inBloodProducts || 0);
      const totalOut = (form.outUrine || 0) + (form.outBleeding || 0) + (form.outEmesis || 0);
      return totalIn - totalOut;
  }, [form]);

  useEffect(() => {
    if (patient && !noteId) {
       if (patient.currentVitals) setVitals(patient.currentVitals);
       setForm(prev => ({
           ...prev,
           procedurePerformed: patient.reason || ''
       }));
    }

    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content as any);
        if (noteToEdit.content.vitals) setVitals(noteToEdit.content.vitals);
        if (noteToEdit.content.aldrete) setAldrete(noteToEdit.content.aldrete);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6 animate-in fade-in">
       <div className="w-24 h-24 bg-violet-50 border-4 border-violet-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-violet-600" />
       </div>
       <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Nota Post-Anestésica Cerrada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">El paciente ha sido entregado a la unidad de recuperación con el plan establecido.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.technique || !form.postOpAnalgesia || aldreteTotal < 8) {
            if(aldreteTotal < 8 && !window.confirm("ALERTA: El puntaje de Aldrete es bajo (<8). ¿Confirma que el paciente es apto para traslado a recuperación?")) return;
            if(!form.technique || !form.postOpAnalgesia) {
                alert("Campos obligatorios: Técnica Anestésica y Plan de Analgesia.");
                return;
            }
        }
        if (!window.confirm("¿Finalizar Nota Post-Anestésica? Esto autoriza el traslado a UCPA.")) return;
    }

    const currentNoteId = noteId || `POSTANEST-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota Post-anestésica',
      date: new Date().toLocaleString('es-MX'),
      author: form.anesthesiologist,
      content: { ...form, vitals, aldrete, fluidBalance },
      isSigned: finalize,
      hash: finalize ? `CERT-POSTANEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  const AldreteSelector = ({ label, value, onChange, options }: any) => (
      <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <div className="flex gap-1">
              {options.map((opt: any) => (
                  <button 
                    key={opt.val}
                    onClick={() => onChange(opt.val)}
                    className={`flex-1 p-2 rounded-xl text-[8px] font-bold uppercase border transition-all ${value === opt.val ? 'bg-violet-600 text-white border-violet-600 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                  >
                      <span className="block text-lg mb-1">{opt.val}</span>
                      {opt.text}
                  </button>
              ))}
          </div>
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-violet-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Valoración Pre-Anestésica</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-006-SSA3-2011 • Recuperación
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-violet-50 px-6 py-3 rounded-2xl border border-violet-100 text-violet-800">
             <Brain size={20} />
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Aldrete Score</p>
                 <p className="text-2xl font-black uppercase leading-none">{aldreteTotal}/10</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: SIGNOS, BALANCE Y ALDRETE */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* ALDRETE CALCULATOR */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Activity size={14}/> Escala de Aldrete (Recuperación)
                </h3>
                <div className="space-y-4">
                    <AldreteSelector 
                        label="Actividad Motora"
                        value={aldrete.activity}
                        onChange={(v: number) => setAldrete({...aldrete, activity: v})}
                        options={[{val:2, text:'4 Extremidades'}, {val:1, text:'2 Extremidades'}, {val:0, text:'Ninguna'}]}
                    />
                    <AldreteSelector 
                        label="Respiración"
                        value={aldrete.respiration}
                        onChange={(v: number) => setAldrete({...aldrete, respiration: v})}
                        options={[{val:2, text:'Profunda/Tos'}, {val:1, text:'Disnea/Limitada'}, {val:0, text:'Apnea'}]}
                    />
                    <AldreteSelector 
                        label="Circulación (TA)"
                        value={aldrete.circulation}
                        onChange={(v: number) => setAldrete({...aldrete, circulation: v})}
                        options={[{val:2, text:'±20% Basal'}, {val:1, text:'±20-50% Basal'}, {val:0, text:'±50% Basal'}]}
                    />
                    <AldreteSelector 
                        label="Conciencia"
                        value={aldrete.consciousness}
                        onChange={(v: number) => setAldrete({...aldrete, consciousness: v})}
                        options={[{val:2, text:'Despierto'}, {val:1, text:'Despierta al llamado'}, {val:0, text:'No responde'}]}
                    />
                    <AldreteSelector 
                        label="Saturación O2"
                        value={aldrete.oxygenation}
                        onChange={(v: number) => setAldrete({...aldrete, oxygenation: v})}
                        options={[{val:2, text:'>92% Aire Amb.'}, {val:1, text:'>90% con O2'}, {val:0, text:'<90% con O2'}]}
                    />
                </div>
            </div>

            {/* BALANCE HÍDRICO */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Droplets size={14} className="text-cyan-400"/> Balance Hídrico
                    </h3>
                    <p className={`text-lg font-black ${fluidBalance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fluidBalance > 0 ? '+' : ''}{fluidBalance} ml</p>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/10 pb-1">Ingresos</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1"><label className="text-[7px] font-bold text-slate-400 uppercase">Cristaloides</label><input type="number" className="w-full bg-white/10 rounded-lg p-2 text-xs font-bold text-center outline-none" value={form.inCrystalloids} onChange={e => setForm({...form, inCrystalloids: parseInt(e.target.value) || 0})} /></div>
                            <div className="space-y-1"><label className="text-[7px] font-bold text-slate-400 uppercase">Coloides</label><input type="number" className="w-full bg-white/10 rounded-lg p-2 text-xs font-bold text-center outline-none" value={form.inColloids} onChange={e => setForm({...form, inColloids: parseInt(e.target.value) || 0})} /></div>
                            <div className="space-y-1"><label className="text-[7px] font-bold text-slate-400 uppercase">Sangre/Der</label><input type="number" className="w-full bg-white/10 rounded-lg p-2 text-xs font-bold text-center outline-none" value={form.inBloodProducts} onChange={e => setForm({...form, inBloodProducts: parseInt(e.target.value) || 0})} /></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest border-b border-white/10 pb-1">Egresos</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1"><label className="text-[7px] font-bold text-slate-400 uppercase">Sangrado</label><input type="number" className="w-full bg-white/10 rounded-lg p-2 text-xs font-bold text-center outline-none" value={form.outBleeding} onChange={e => setForm({...form, outBleeding: parseInt(e.target.value) || 0})} /></div>
                            <div className="space-y-1"><label className="text-[7px] font-bold text-slate-400 uppercase">Uresis</label><input type="number" className="w-full bg-white/10 rounded-lg p-2 text-xs font-bold text-center outline-none" value={form.outUrine} onChange={e => setForm({...form, outUrine: parseInt(e.target.value) || 0})} /></div>
                            <div className="space-y-1"><label className="text-[7px] font-bold text-slate-400 uppercase">Emesis/Otros</label><input type="number" className="w-full bg-white/10 rounded-lg p-2 text-xs font-bold text-center outline-none" value={form.outEmesis} onChange={e => setForm({...form, outEmesis: parseInt(e.target.value) || 0})} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VITALES AL EGRESO */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <HeartPulse size={14}/> Vitales (Egreso Sala)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">T.A.</label><input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">F.C.</label><input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center" value={vitals.hr} onChange={e => setVitals({...vitals, hr: parseInt(e.target.value)})} /></div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Temp</label><input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center" value={vitals.temp} onChange={e => setVitals({...vitals, temp: parseFloat(e.target.value)})} /></div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">SpO2</label><input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center" value={vitals.o2} onChange={e => setVitals({...vitals, o2: parseInt(e.target.value)})} /></div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: DESCRIPCIÓN Y PLAN */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. TÉCNICA Y FÁRMACOS */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Activity size={14} className="text-violet-600"/> Técnica Anestésica
                            </label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={form.technique} onChange={e => setForm({...form, technique: e.target.value})}>
                                <option>General Balanceada</option><option>General TIVA</option><option>Bloqueo Neuraxial</option><option>Bloqueo Regional</option><option>Sedación</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Wind size={14} className="text-blue-600"/> Dispositivo Vía Aérea
                            </label>
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.airwayDevice} onChange={e => setForm({...form, airwayDevice: e.target.value})} />
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Inicio Anestesia</label>
                            <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.anesthesiaStartTime} onChange={e => setForm({...form, anesthesiaStartTime: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Término Anestesia</label>
                            <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.anesthesiaEndTime} onChange={e => setForm({...form, anesthesiaEndTime: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Syringe size={14} className="text-indigo-600"/> Fármacos Administrados</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" placeholder="Inducción..." value={form.medsInduction} onChange={e => setForm({...form, medsInduction: e.target.value})} />
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" placeholder="Mantenimiento..." value={form.medsMaintenance} onChange={e => setForm({...form, medsMaintenance: e.target.value})} />
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" placeholder="Analgesia Intraoperatoria..." value={form.medsAnalgesia} onChange={e => setForm({...form, medsAnalgesia: e.target.value})} />
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" placeholder="Reversión..." value={form.medsReversal} onChange={e => setForm({...form, medsReversal: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* 2. INCIDENTES */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <AlertOctagon size={14} className="text-rose-600"/> Contingencias / Accidentes
                    </label>
                    <textarea 
                        className="w-full p-4 bg-rose-50/20 border border-rose-100 rounded-2xl h-20 text-xs font-medium resize-none text-rose-900 outline-none" 
                        value={form.incidents} 
                        onChange={e => setForm({...form, incidents: e.target.value})} 
                        placeholder="Descripción de eventualidades..."
                    />
                </div>

                {/* 3. ESTADO Y PLAN */}
                <div className="p-8 bg-violet-50/50 border border-violet-100 rounded-3xl space-y-6">
                    <h4 className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex items-center gap-2">
                        <ThumbsUp size={14}/> Estado Clínico y Plan Inmediato
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Dolor (EVA)</label>
                            <input type="number" min="0" max="10" className="w-full p-4 bg-white border border-violet-100 rounded-xl text-xs font-bold text-center" value={form.painScoreEVA} onChange={e => setForm({...form, painScoreEVA: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Bromage (Regional)</label>
                            <select className="w-full p-4 bg-white border border-violet-100 rounded-xl text-xs font-bold outline-none" value={form.bromageScore} onChange={e => setForm({...form, bromageScore: parseInt(e.target.value) || 0})}>
                                <option value="0">0 - Nulo (100%)</option>
                                <option value="1">1 - Parcial (33%)</option>
                                <option value="2">2 - Casi Completo (66%)</option>
                                <option value="3">3 - Completo (100%)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Náusea / Vómito</label>
                            <div className="flex gap-2">
                                <button onClick={() => setForm({...form, nauseaVomiting: true})} className={`flex-1 p-4 rounded-xl border text-[10px] font-black uppercase ${form.nauseaVomiting ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-violet-100 text-slate-400'}`}>Sí</button>
                                <button onClick={() => setForm({...form, nauseaVomiting: false})} className={`flex-1 p-4 rounded-xl border text-[10px] font-black uppercase ${!form.nauseaVomiting ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-violet-100 text-slate-400'}`}>No</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Analgesia Post-Op</label>
                            <input className="w-full p-4 bg-white border border-violet-100 rounded-xl text-xs font-medium" value={form.postOpAnalgesia} onChange={e => setForm({...form, postOpAnalgesia: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Antieméticos</label>
                            <input className="w-full p-4 bg-white border border-violet-100 rounded-xl text-xs font-medium" value={form.antiemetics} onChange={e => setForm({...form, antiemetics: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Oxigenoterapia</label>
                            <input className="w-full p-4 bg-white border border-violet-100 rounded-xl text-xs font-medium" value={form.oxygenTherapy} onChange={e => setForm({...form, oxygenTherapy: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Criterio de Alta Qx</label>
                            <input className="w-full p-4 bg-white border border-violet-100 rounded-xl text-xs font-bold" value={form.dischargeCriteria} onChange={e => setForm({...form, dischargeCriteria: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-violet-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-violet-700 transition-all flex items-center gap-4">
                    <Save size={20} /> Autorizar Egreso a Recuperación
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostAnestheticNote;
