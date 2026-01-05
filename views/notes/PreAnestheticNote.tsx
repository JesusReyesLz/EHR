
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Wind, 
  AlertTriangle, HeartPulse, Scale, Ruler, Stethoscope, 
  Brain, Syringe, Timer, Lock, FileText, CheckCircle2,
  AlertOctagon, Eye
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals } from '../../types';

const PreAnestheticNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [form, setForm] = useState({
    // Datos del Procedimiento
    surgeryProposed: '',
    diagnosis: '',
    surgeryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    
    // Evaluación Vía Aérea (Crucial Anestesia)
    mallampati: 'I', // I, II, III, IV
    patilAldreti: '> 6.5 cm', // Distancia Tiromentoniana
    mouthOpening: '> 3 cm', 
    cervicalMobility: 'Normal',
    teethCondition: 'Integras', // Prótesis, Piezas flojas, etc.
    
    // Evaluación Sistémica
    cardiovascularStatus: '',
    respiratoryStatus: '',
    neurologicalStatus: '', // Estado basal (referencia para Aldrete posterior)
    
    // Riesgos
    riskASA: 'ASA I',
    riskGoldman: 'Clase I',
    functionalCapacity: '> 4 METs',
    allergies: '', // Relevancia crítica
    
    // Plan Anestésico
    anestheticTechnique: 'General Balanceada', // Regional, Sedación, TIVA, etc.
    airwayManagement: 'Intubación Orotraqueal',
    monitoringPlan: 'Básico (ECG, PNI, SpO2, Capnografía)',
    invasiveLines: 'No requeridas',
    
    // Indicaciones Pre-anestésicas
    fastingSolids: '8',
    fastingLiquids: '2',
    premedication: '',
    specialRecommendations: 'Consentimiento informado de anestesia firmado. Cruzar paquete globular si aplica.',
    
    // Pronóstico
    prognosis: 'Bueno para la vida y la función'
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (patient && !noteId) {
       if (patient.currentVitals) setVitals(patient.currentVitals);
       setForm(prev => ({
           ...prev,
           diagnosis: patient.reason || '',
           allergies: patient.allergies?.join(', ') || 'Negadas'
       }));
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
       <div className="w-24 h-24 bg-teal-50 border-4 border-teal-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-teal-600" />
       </div>
       <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Valoración Pre-Anestésica Cerrada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">El plan anestésico ha sido establecido y validado legalmente. No se permiten cambios posteriores.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.riskASA || !form.anestheticTechnique || !form.mallampati) {
            alert("Campos obligatorios: Clasificación ASA, Mallampati y Técnica Anestésica.");
            return;
        }
        if (!window.confirm("¿Finalizar Valoración Pre-Anestésica? Esto autoriza el plan para quirófano.")) return;
    }

    const currentNoteId = noteId || `ANEST-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota Pre-anestésica',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Roberto Cruz (Anestesiólogo)',
      content: { ...form, vitals },
      isSigned: finalize,
      hash: finalize ? `CERT-ANEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  const getASAColor = (asa: string) => {
      if (asa.includes('I') && !asa.includes('II') && !asa.includes('III')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      if (asa.includes('II')) return 'bg-blue-100 text-blue-800 border-blue-200';
      if (asa.includes('III')) return 'bg-amber-100 text-amber-800 border-amber-200';
      if (asa.includes('IV') || asa.includes('V')) return 'bg-rose-100 text-rose-800 border-rose-200';
      return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-teal-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Valoración Pre-Anestésica</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-006-SSA3-2011 • Anestesiología
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-teal-50 px-6 py-3 rounded-2xl border border-teal-100 text-teal-800">
             <Wind size={20} />
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Plan Propuesto</p>
                 <p className="text-sm font-black uppercase">{form.anestheticTechnique}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: SIGNOS Y RIESGO */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-teal-400"/> Signos Vitales Basales
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                        { l: 'T.A.', v: vitals.bp, u: 'mmHg' },
                        { l: 'F.C.', v: vitals.hr, u: 'lpm' },
                        { l: 'F.R.', v: vitals.rr, u: 'rpm' },
                        { l: 'SatO2', v: vitals.o2, u: '%' },
                        { l: 'Peso', v: vitals.weight, u: 'kg' },
                        { l: 'IMC', v: vitals.bmi, u: '' }
                    ].map(item => (
                        <div key={item.l} className="bg-white/10 p-3 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{item.l}</p>
                            <input 
                                className="w-full bg-transparent text-lg font-black text-white outline-none" 
                                value={item.v}
                                onChange={e => setVitals({...vitals, [item.l === 'T.A.' ? 'bp' : item.l === 'F.C.' ? 'hr' : item.l === 'F.R.' ? 'rr' : item.l === 'SatO2' ? 'o2' : 'weight']: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <AlertTriangle size={14}/> Estratificación de Riesgo
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Clasificación ASA</label>
                        <select 
                            className={`w-full p-4 rounded-xl text-xs font-black uppercase outline-none border-2 ${getASAColor(form.riskASA)}`}
                            value={form.riskASA} 
                            onChange={e => setForm({...form, riskASA: e.target.value})}
                        >
                            <option>ASA I (Sano)</option>
                            <option>ASA II (Enf. Leve)</option>
                            <option>ASA III (Enf. Severa)</option>
                            <option>ASA IV (Amenaza Vida)</option>
                            <option>ASA V (Moribundo)</option>
                            <option>ASA E (Emergencia)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Índice Goldman (Cardíaco)</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" value={form.riskGoldman} onChange={e => setForm({...form, riskGoldman: e.target.value})}>
                            <option>Clase I (0-5 pts) - Bajo Riesgo</option>
                            <option>Clase II (6-12 pts) - Riesgo Intermedio</option>
                            <option>Clase III (13-25 pts) - Alto Riesgo</option>
                            <option>Clase IV (&gt;26 pts) - Muy Alto Riesgo</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Capacidad Funcional (METs)</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" value={form.functionalCapacity} onChange={e => setForm({...form, functionalCapacity: e.target.value})}>
                            <option>&gt; 4 METs (Sube escaleras)</option>
                            <option>&lt; 4 METs (Limitado)</option>
                            <option>Desconocida / No evaluable</option>
                        </select>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-[9px] font-black text-rose-500 uppercase ml-2 flex items-center gap-1"><AlertOctagon size={10}/> Alergias Conocidas</label>
                        <textarea className="w-full p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-800 h-20 resize-none outline-none" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: VÍA AÉREA Y PLAN */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. EVALUACIÓN VÍA AÉREA */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 flex items-center gap-2">
                        <Wind size={14}/> Evaluación de la Vía Aérea
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Mallampati</label>
                            <select className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-bold" value={form.mallampati} onChange={e => setForm({...form, mallampati: e.target.value})}>
                                <option>I (Visibilidad Total)</option>
                                <option>II (Úvula Parcial)</option>
                                <option>III (Solo Base)</option>
                                <option>IV (Solo Paladar Duro)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Apertura Bucal</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={form.mouthOpening} onChange={e => setForm({...form, mouthOpening: e.target.value})}>
                                <option>&gt; 3 cm (I)</option>
                                <option>2.6 - 3 cm (II)</option>
                                <option>&lt; 2.5 cm (III)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Patil-Aldreti</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={form.patilAldreti} onChange={e => setForm({...form, patilAldreti: e.target.value})}>
                                <option>&gt; 6.5 cm (I)</option>
                                <option>6.0 - 6.5 cm (II)</option>
                                <option>&lt; 6.0 cm (III)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Mov. Cervical</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={form.cervicalMobility} onChange={e => setForm({...form, cervicalMobility: e.target.value})}>
                                <option>Normal (>90°)</option>
                                <option>Limitada</option>
                                <option>Muy Limitada</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Estado Dental y Observaciones V.A.</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium" value={form.teethCondition} onChange={e => setForm({...form, teethCondition: e.target.value})} placeholder="Piezas dentales flojas, prótesis removibles, cuello corto..." />
                    </div>
                </div>

                {/* 2. EVALUACIÓN SISTÉMICA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><HeartPulse size={10}/> Cardiovascular / Respiratorio</label>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" value={form.cardiovascularStatus} onChange={e => setForm({...form, cardiovascularStatus: e.target.value})} placeholder="Ruidos cardiacos, campos pulmonares..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Brain size={10}/> Neurológico Basal</label>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" value={form.neurologicalStatus} onChange={e => setForm({...form, neurologicalStatus: e.target.value})} placeholder="Estado de conciencia, déficit motor/sensitivo previo..." />
                    </div>
                </div>

                {/* 3. PLAN ANESTÉSICO */}
                <div className="p-6 bg-teal-50/50 border border-teal-100 rounded-[2.5rem] space-y-6">
                    <h4 className="text-[10px] font-black text-teal-700 uppercase tracking-widest flex items-center gap-2">
                        <Syringe size={14}/> Plan Anestésico Propuesto
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Técnica Anestésica</label>
                            <select className="w-full p-4 bg-white border border-teal-200 rounded-xl text-xs font-black uppercase outline-none" value={form.anestheticTechnique} onChange={e => setForm({...form, anestheticTechnique: e.target.value})}>
                                <option>General Balanceada</option>
                                <option>General TIVA</option>
                                <option>Bloqueo Neuraxial (Raquídeo/Epidural)</option>
                                <option>Bloqueo Regional Periférico</option>
                                <option>Sedación Consciente + Local</option>
                                <option>Monitoreo Anestésico (MAC)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Manejo Vía Aérea</label>
                            <input className="w-full p-4 bg-white border border-teal-200 rounded-xl text-xs font-bold" value={form.airwayManagement} onChange={e => setForm({...form, airwayManagement: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Plan de Monitoreo</label>
                        <input className="w-full p-4 bg-white border border-teal-200 rounded-xl text-xs font-medium" value={form.monitoringPlan} onChange={e => setForm({...form, monitoringPlan: e.target.value})} />
                    </div>
                </div>

                {/* 4. ÓRDENES PRE-OPERATORIAS */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Timer size={14}/> Indicaciones Pre-Anestésicas</label>
                    <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Ayuno Sólidos</p>
                            <input className="w-12 bg-transparent font-black text-lg text-slate-900 outline-none text-center" value={form.fastingSolids} onChange={e => setForm({...form, fastingSolids: e.target.value})} />
                            <span className="text-[9px] font-bold">hrs</span>
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Ayuno Líquidos</p>
                            <input className="w-12 bg-transparent font-black text-lg text-slate-900 outline-none text-center" value={form.fastingLiquids} onChange={e => setForm({...form, fastingLiquids: e.target.value})} />
                            <span className="text-[9px] font-bold">hrs</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Premedicación / Recomendaciones</label>
                        <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none" value={form.specialRecommendations} onChange={e => setForm({...form, specialRecommendations: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pronóstico</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.prognosis} onChange={e => setForm({...form, prognosis: e.target.value})} />
                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-teal-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-teal-700 transition-all flex items-center gap-4">
                    <Save size={20} /> Autorizar Plan Anestésico
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreAnestheticNote;
