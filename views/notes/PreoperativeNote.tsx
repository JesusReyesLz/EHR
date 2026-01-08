
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Calendar, Clock, Activity, 
  AlertTriangle, FileCheck, Stethoscope, Scissors, HeartPulse, 
  Utensils, ClipboardList, Lock, User, Syringe, CheckSquare, CheckCircle2
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

interface PreoperativeNoteProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

const PreoperativeNote: React.FC<PreoperativeNoteProps> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [form, setForm] = useState({
    // Programación
    surgeryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Mañana por defecto
    surgeryTime: '08:00',
    surgeryType: 'Electiva', // Electiva / Urgencia
    
    // Equipo Quirúrgico
    surgeon: doctorInfo?.name || 'Dr. Alejandro Méndez',
    anesthesiologist: '',
    surgicalRoom: '',
    
    // Diagnóstico y Plan
    preopDiagnosis: '',
    plannedProcedure: '', // Operación proyectada
    surgicalPlan: '', // Abordaje, técnica, insumos especiales
    
    // Evaluación de Riesgos
    riskASA: 'ASA I',
    riskGoldman: 'Clase I',
    thrombosisRisk: 'Bajo',
    
    // Seguridad y Preparación
    informedConsentSigned: false,
    surgicalSiteMarked: false,
    preopStudiesReviewed: false,
    bloodBankReserve: 'No requerida', // Reserva / Cruzada / No req
    
    // Órdenes Preoperatorias
    fastingHoursSolids: '8',
    fastingHoursLiquids: '2',
    premedication: '', // Antibiótico profiláctico, sedación
    specialCare: 'Baño prequirúrgico, vendaje de miembros pélvicos.',
    
    // Pronóstico
    prognosisLife: 'Bueno',
    prognosisFunction: 'Bueno para la función'
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (patient && !noteId) {
       if (patient.currentVitals) setVitals(patient.currentVitals);
       setForm(prev => ({
           ...prev,
           preopDiagnosis: patient.reason || ''
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
       <div className="w-24 h-24 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-blue-600" />
       </div>
       <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Nota Preoperatoria Cerrada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">La planificación quirúrgica ha sido sellada y validada para pase a quirófano.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.preopDiagnosis || !form.plannedProcedure || !form.surgicalPlan) {
            alert("Campos críticos faltantes: Diagnóstico, Procedimiento o Plan Quirúrgico.");
            return;
        }
        if (!form.informedConsentSigned) {
             if (!window.confirm("ADVERTENCIA: El Consentimiento Informado no está marcado como firmado. ¿Desea continuar bajo su responsabilidad?")) return;
        }
        if (!window.confirm("¿Certificar Nota Preoperatoria? Esto autoriza el pase a quirófano.")) return;
    }

    const currentNoteId = noteId || `PREOP-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota Pre-operatoria',
      date: new Date().toLocaleString('es-MX'),
      author: form.surgeon,
      content: { ...form, vitals },
      isSigned: finalize,
      hash: finalize ? `CERT-PREOP-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-blue-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nota Pre-operatoria</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-004-SSA3-2012 • Planificación
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-blue-700">
             <Scissors size={20} />
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Programación</p>
                 <p className="text-sm font-black uppercase">{form.surgeryType}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: LOGÍSTICA Y SIGNOS */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400"/> Signos Vitales (Base)
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                        { l: 'T.A.', v: vitals.bp, u: 'mmHg' },
                        { l: 'F.C.', v: vitals.hr, u: 'lpm' },
                        { l: 'F.R.', v: vitals.rr, u: 'rpm' },
                        { l: 'Temp', v: vitals.temp, u: '°C' },
                        { l: 'SatO2', v: vitals.o2, u: '%' },
                        { l: 'Peso', v: vitals.weight, u: 'kg' }
                    ].map(item => (
                        <div key={item.l} className="bg-white/10 p-3 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{item.l}</p>
                            <input 
                                className="w-full bg-transparent text-lg font-black text-white outline-none" 
                                value={item.v}
                                onChange={e => setVitals({...vitals, [item.l === 'T.A.' ? 'bp' : item.l === 'F.C.' ? 'hr' : item.l === 'F.R.' ? 'rr' : item.l === 'Temp' ? 'temp' : item.l === 'SatO2' ? 'o2' : 'weight']: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Calendar size={14}/> Logística Quirúrgica
                </h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Fecha Cx</label>
                            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.surgeryDate} onChange={e => setForm({...form, surgeryDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Hora Programada</label>
                            <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.surgeryTime} onChange={e => setForm({...form, surgeryTime: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo de Cirugía</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" value={form.surgeryType} onChange={e => setForm({...form, surgeryType: e.target.value})}>
                            <option>Electiva</option>
                            <option>Urgencia</option>
                            <option>Urgencia Diferida</option>
                            <option>Ambulatoria</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Sala / Quirófano</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" placeholder="Ej: Sala 1" value={form.surgicalRoom} onChange={e => setForm({...form, surgicalRoom: e.target.value})} />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Cirujano Responsable</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.surgeon} onChange={e => setForm({...form, surgeon: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Anestesiólogo</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" placeholder="Nombre..." value={form.anesthesiologist} onChange={e => setForm({...form, anesthesiologist: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: PLAN CLÍNICO */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. DIAGNÓSTICO Y PLAN */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Activity size={14} className="text-rose-600"/> Diagnóstico Pre-operatorio
                            </label>
                            <textarea 
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-black uppercase outline-none focus:bg-white focus:border-rose-400 transition-all" 
                                value={form.preopDiagnosis} 
                                onChange={e => setForm({...form, preopDiagnosis: e.target.value})} 
                                placeholder="CIE-10 o descripción..."
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Scissors size={14} className="text-blue-600"/> Operación Proyectada
                            </label>
                            <textarea 
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-black uppercase outline-none focus:bg-white focus:border-blue-400 transition-all" 
                                value={form.plannedProcedure} 
                                onChange={e => setForm({...form, plannedProcedure: e.target.value})} 
                                placeholder="Nombre del procedimiento..."
                            />
                         </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Plan Quirúrgico (Técnica / Abordaje)</label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner" 
                            value={form.surgicalPlan} 
                            onChange={e => setForm({...form, surgicalPlan: e.target.value})} 
                            placeholder="Descripción breve de la técnica, posición del paciente, insumos especiales..."
                        />
                    </div>
                </div>

                {/* 2. EVALUACIÓN DE RIESGOS */}
                <div className="p-8 bg-indigo-50/30 border border-indigo-100 rounded-3xl space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                        <HeartPulse size={14}/> Evaluación de Riesgo Quirúrgico
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Clasificación ASA</label>
                            <select className="w-full p-4 bg-white border border-indigo-100 rounded-xl text-xs font-bold uppercase outline-none" value={form.riskASA} onChange={e => setForm({...form, riskASA: e.target.value})}>
                                <option>ASA I (Sano)</option>
                                <option>ASA II (Enf. Leve)</option>
                                <option>ASA III (Enf. Severa)</option>
                                <option>ASA IV (Amenaza Vida)</option>
                                <option>ASA V (Moribundo)</option>
                                <option>ASA E (Emergencia)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Riesgo Cardiaco (Goldman)</label>
                            <select className="w-full p-4 bg-white border border-indigo-100 rounded-xl text-xs font-bold uppercase outline-none" value={form.riskGoldman} onChange={e => setForm({...form, riskGoldman: e.target.value})}>
                                <option>Clase I (0-5 pts)</option>
                                <option>Clase II (6-12 pts)</option>
                                <option>Clase III (13-25 pts)</option>
                                <option>Clase IV (&gt;26 pts)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Reserva de Sangre</label>
                            <select className="w-full p-4 bg-white border border-indigo-100 rounded-xl text-xs font-bold uppercase outline-none" value={form.bloodBankReserve} onChange={e => setForm({...form, bloodBankReserve: e.target.value})}>
                                <option>No Requerida</option>
                                <option>Reserva Disponible</option>
                                <option>Paquetes Cruzados</option>
                                <option>Plasma / Plaquetas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3. CHECKLIST SEGURIDAD */}
                <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <CheckSquare size={14} className="text-emerald-600"/> Verificación de Seguridad (Pausa Inicial)
                     </label>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button 
                            onClick={() => setForm({...form, informedConsentSigned: !form.informedConsentSigned})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${form.informedConsentSigned ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                        >
                            {form.informedConsentSigned ? <CheckCircle2 size={18}/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                            <span className="text-[10px] font-black uppercase">Consentimiento Informado</span>
                        </button>
                        <button 
                            onClick={() => setForm({...form, surgicalSiteMarked: !form.surgicalSiteMarked})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${form.surgicalSiteMarked ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                        >
                            {form.surgicalSiteMarked ? <CheckCircle2 size={18}/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                            <span className="text-[10px] font-black uppercase">Marcaje Quirúrgico</span>
                        </button>
                        <button 
                            onClick={() => setForm({...form, preopStudiesReviewed: !form.preopStudiesReviewed})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${form.preopStudiesReviewed ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                        >
                            {form.preopStudiesReviewed ? <CheckCircle2 size={18}/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                            <span className="text-[10px] font-black uppercase">Estudios Revisados</span>
                        </button>
                     </div>
                </div>

                {/* 4. ÓRDENES Y PRONÓSTICO */}
                <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Utensils size={14}/> Ayuno y Dieta</label>
                        <div className="flex gap-4">
                           <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Sólidos</p>
                              <div className="flex items-center gap-2">
                                 <input className="w-full bg-transparent font-black text-lg text-slate-900 outline-none" value={form.fastingHoursSolids} onChange={e => setForm({...form, fastingHoursSolids: e.target.value})} />
                                 <span className="text-[10px] font-bold">HRS</span>
                              </div>
                           </div>
                           <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Líquidos Claros</p>
                              <div className="flex items-center gap-2">
                                 <input className="w-full bg-transparent font-black text-lg text-slate-900 outline-none" value={form.fastingHoursLiquids} onChange={e => setForm({...form, fastingHoursLiquids: e.target.value})} />
                                 <span className="text-[10px] font-bold">HRS</span>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-2 mt-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Syringe size={14}/> Medicación Preanestésica / Profilaxis</label>
                           <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold" placeholder="Antibiótico, sedante..." value={form.premedication} onChange={e => setForm({...form, premedication: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cuidados Específicos y Pronóstico</label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none resize-none" 
                            value={form.specialCare} 
                            onChange={e => setForm({...form, specialCare: e.target.value})} 
                            placeholder="Tricotomía, vendaje, etc..." 
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pronóstico Vida</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.prognosisLife} onChange={e => setForm({...form, prognosisLife: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pronóstico Función</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.prognosisFunction} onChange={e => setForm({...form, prognosisFunction: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                    <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                    <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        Guardar Borrador
                    </button>
                    <button onClick={() => handleSave(true)} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-4">
                        <Save size={20} /> Autorizar Cirugía
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreoperativeNote;
