
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, AlertTriangle, Activity, Stethoscope, 
  HeartPulse, Clock, Lock, Thermometer, Wind, Droplet, Brain, Siren,
  Bone, FileText, Syringe, Ambulance, Scale
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals } from '../../types';

const EmergencyNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // Estados iniciales
  const [triageLevel, setTriageLevel] = useState('Amarillo'); // Rojo, Naranja, Amarillo, Verde, Azul
  const [vitals, setVitals] = useState<Vitals & { glucose: string, glasgow: string, pain: string }>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: '',
      glucose: '', glasgow: '15', pain: '0'
  });

  const [form, setForm] = useState({
    // Generales
    admissionDate: new Date().toISOString().split('T')[0],
    admissionTime: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}),
    accidentType: 'No aplica / Enfermedad General', // Trabajo, Trayecto, Violencia, etc.
    
    // Interrogatorio
    motivoAtencion: '',
    ahfm: '', // Antecedentes Heredofamiliares
    app: '',  // Antecedentes Personales Patológicos
    apnp: '', // No Patológicos (Toxicomanías, alimentación, etc.)
    padecimientoActual: '', // PA
    ipays: '', // Interrogatorio por aparatos y sistemas

    // Exploración
    exploracionFisica: '', // Habitus y exploración general
    estadoMental: '', // Descripción cualitativa (adicional al Glasgow)
    
    // Auxiliares
    pruebasRealizadas: '', // Labs/Gabinete solicitados y resultados preliminares
    
    // Diagnóstico y Manejo
    diagnosticoInicial: '',
    planTratamiento: '', // Medicamentos indicados
    procedimientosRealizados: '', // Maniobras en urgencias (Suturas, RCP, Intubación)
    
    // Cierre
    pronostico: 'Reservado a evolución',
    destino: 'Observación Urgencias' // Domicilio, Hospitalización, Quirófano, Traslado, Defunción
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    // Cargar datos del paciente si es nueva nota
    if (patient && !noteId) {
       if (patient.currentVitals) {
           setVitals(prev => ({...prev, ...patient.currentVitals}));
       }
    }

    // Cargar nota existente
    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content as any);
        if (noteToEdit.content.vitals) setVitals(noteToEdit.content.vitals);
        if (noteToEdit.content.triageLevel) setTriageLevel(noteToEdit.content.triageLevel);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6 animate-in fade-in">
       <div className="w-24 h-24 bg-rose-50 border-4 border-rose-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-rose-600" />
       </div>
       <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Nota de Urgencias Cerrada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">Este registro médico legal ha sido firmado y sellado digitalmente. No se permiten modificaciones posteriores conforme a la NOM-004.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.motivoAtencion || !form.diagnosticoInicial || !form.padecimientoActual) {
            alert("Campos obligatorios faltantes: Motivo, Padecimiento Actual o Diagnóstico.");
            return;
        }
        if (!window.confirm("¿Certificar y finalizar Nota de Urgencias? El documento no podrá editarse posteriormente.")) return;
    }

    const newNoteId = noteId || `URG-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: patient.id,
      type: 'Nota Inicial de Urgencias',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form, vitals, triageLevel },
      isSigned: finalize,
      hash: finalize ? `CERT-URG-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: newNoteId } : {} });
  };

  const getTriageColor = (level: string) => {
      switch(level) {
          case 'Rojo': return 'bg-rose-600 text-white border-rose-700';
          case 'Naranja': return 'bg-orange-500 text-white border-orange-600';
          case 'Amarillo': return 'bg-amber-400 text-amber-900 border-amber-500';
          case 'Verde': return 'bg-emerald-500 text-white border-emerald-600';
          case 'Azul': return 'bg-blue-500 text-white border-blue-600';
          default: return 'bg-slate-200 text-slate-600';
      }
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header & Triage */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
               {noteId ? 'Editando Nota Urgencias' : 'Nota Inicial de Urgencias'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-004-SSA3-2012
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Clasificación Triage:</p>
            <div className="flex gap-1">
                {['Rojo', 'Naranja', 'Amarillo', 'Verde', 'Azul'].map(color => (
                    <button
                        key={color}
                        onClick={() => setTriageLevel(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm flex items-center justify-center ${triageLevel === color ? getTriageColor(color) + ' scale-110 ring-2 ring-offset-2 ring-slate-200' : 'bg-white border-slate-200 opacity-40 hover:opacity-100'}`}
                        title={`Prioridad ${color}`}
                    >
                        {triageLevel === color && <Activity size={14}/>}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: VITALES Y ADMISIÓN */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <HeartPulse size={14} className="text-rose-500"/> Signos Vitales
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{form.admissionTime} hrs</p>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Activity size={10}/> T.A. (mmHg)</label>
                        <input className="w-full bg-transparent text-lg font-black text-white outline-none" placeholder="120/80" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} />
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><HeartPulse size={10}/> F.C. (lpm)</label>
                        <input type="number" className="w-full bg-transparent text-lg font-black text-white outline-none" placeholder="0" value={vitals.hr} onChange={e => setVitals({...vitals, hr: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Wind size={10}/> F.R. (rpm)</label>
                        <input type="number" className="w-full bg-transparent text-lg font-black text-white outline-none" placeholder="0" value={vitals.rr} onChange={e => setVitals({...vitals, rr: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Thermometer size={10}/> Temp (°C)</label>
                        <input type="number" step="0.1" className="w-full bg-transparent text-lg font-black text-white outline-none" placeholder="0.0" value={vitals.temp} onChange={e => setVitals({...vitals, temp: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Droplet size={10}/> SatO2 (%)</label>
                        <input type="number" className="w-full bg-transparent text-lg font-black text-white outline-none" placeholder="0" value={vitals.o2} onChange={e => setVitals({...vitals, o2: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Droplet size={10} className="text-rose-500"/> Dxtx (mg/dL)</label>
                        <input type="number" className="w-full bg-transparent text-lg font-black text-white outline-none" placeholder="0" value={vitals.glucose} onChange={e => setVitals({...vitals, glucose: e.target.value})} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 relative z-10">
                     <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Brain size={10}/> Glasgow</label>
                        <input type="number" max="15" className="w-full bg-transparent text-sm font-black text-white outline-none" placeholder="15/15" value={vitals.glasgow} onChange={e => setVitals({...vitals, glasgow: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><AlertTriangle size={10}/> Dolor (EVA)</label>
                        <input type="number" max="10" className="w-full bg-transparent text-sm font-black text-white outline-none" placeholder="0/10" value={vitals.pain} onChange={e => setVitals({...vitals, pain: e.target.value})} />
                     </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo de Urgencia / Contexto</label>
                    <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none"
                        value={form.accidentType}
                        onChange={e => setForm({...form, accidentType: e.target.value})}
                    >
                        <option>No aplica / Enfermedad General</option>
                        <option>Accidente de Trabajo</option>
                        <option>Accidente de Trayecto</option>
                        <option>Accidente Automovilístico</option>
                        <option>Violencia / Hechos Delictivos</option>
                        <option>Intoxicación</option>
                        <option>Urgencia Obstétrica</option>
                    </select>
                </div>
                {form.accidentType.includes('Violencia') && (
                     <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                         <Siren size={20} className="text-rose-600 flex-shrink-0"/>
                         <p className="text-[9px] font-bold text-rose-800 uppercase leading-tight">Recuerde realizar y anexar la Notificación al Ministerio Público (NOM-004).</p>
                     </div>
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: NOTA CLÍNICA */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. MOTIVO Y ANTECEDENTES */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={14} className="text-rose-600"/> Motivo de Atención (Síntoma Principal)
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-rose-400 transition-all shadow-inner" 
                            value={form.motivoAtencion} 
                            onChange={e => setForm({...form, motivoAtencion: e.target.value})} 
                            placeholder="Razón principal de la urgencia..."
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Antecedentes Heredofamiliares (AHFM)</label>
                           <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none" value={form.ahfm} onChange={e => setForm({...form, ahfm: e.target.value})} placeholder="Carga genética relevante..." />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Personales Patológicos (APP)</label>
                           <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none" value={form.app} onChange={e => setForm({...form, app: e.target.value})} placeholder="Enfermedades, Qx, Alergias..." />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <FileText size={14} className="text-blue-600"/> Padecimiento Actual (Interrogatorio)
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner leading-relaxed" 
                            value={form.padecimientoActual} 
                            onChange={e => setForm({...form, padecimientoActual: e.target.value})} 
                            placeholder="Describa semiología detallada, evolución, terapéutica empleada previa..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Interrogatorio por Aparatos y Sistemas (IPAYS)</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium" value={form.ipays} onChange={e => setForm({...form, ipays: e.target.value})} placeholder="Datos relevantes negativos o positivos..." />
                    </div>
                </div>

                {/* 2. EXPLORACIÓN Y RESULTADOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Stethoscope size={14} className="text-emerald-600"/> Exploración Física
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-48 text-sm font-medium outline-none resize-none" 
                            value={form.exploracionFisica} 
                            onChange={e => setForm({...form, exploracionFisica: e.target.value})} 
                            placeholder="Habitus exterior, cabeza, cuello, tórax, abdomen, extremidades..." 
                        />
                        <input 
                            className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 placeholder-emerald-300"
                            placeholder="Estado Mental / Neurológico..."
                            value={form.estadoMental}
                            onChange={e => setForm({...form, estadoMental: e.target.value})}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Bone size={14} className="text-indigo-600"/> Auxiliares de Diagnóstico
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-48 text-sm font-medium outline-none resize-none" 
                            value={form.pruebasRealizadas} 
                            onChange={e => setForm({...form, pruebasRealizadas: e.target.value})} 
                            placeholder="Resultados de Laboratorio, Rx, EKG realizados en urgencias..." 
                        />
                    </div>
                </div>

                {/* 3. DIAGNÓSTICO Y PLAN */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={14} className="text-rose-600"/> Diagnóstico (Problemas Clínicos)
                        </label>
                        <textarea 
                            className="w-full p-6 bg-rose-50/30 border border-rose-100 rounded-2xl h-24 text-sm font-black text-rose-900 outline-none" 
                            value={form.diagnosticoInicial} 
                            onChange={e => setForm({...form, diagnosticoInicial: e.target.value})} 
                            placeholder="Diagnósticos presuntivos o de certeza..."
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Syringe size={14}/> Tratamiento Indicado
                             </label>
                             <textarea 
                                className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-sm font-medium outline-none" 
                                value={form.planTratamiento} 
                                onChange={e => setForm({...form, planTratamiento: e.target.value})} 
                                placeholder="Soluciones, Medicamentos, Dosis..."
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Activity size={14}/> Procedimientos en Urgencias
                             </label>
                             <textarea 
                                className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-sm font-medium outline-none" 
                                value={form.procedimientosRealizados} 
                                onChange={e => setForm({...form, procedimientosRealizados: e.target.value})} 
                                placeholder="Sutura, Curación, Sondaje, Intubación, RCP..."
                             />
                        </div>
                    </div>
                </div>

                {/* 4. CIERRE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pronóstico</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={form.pronostico} onChange={e => setForm({...form, pronostico: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Destino del Paciente</label>
                        <select className="w-full p-4 bg-slate-900 text-white border-none rounded-xl text-sm font-black uppercase outline-none" value={form.destino} onChange={e => setForm({...form, destino: e.target.value})}>
                            <option>Observación Urgencias</option>
                            <option>Domicilio (Alta)</option>
                            <option>Hospitalización</option>
                            <option>Quirófano</option>
                            <option>Traslado a otra unidad</option>
                            <option>Defunción</option>
                            <option>Alta Voluntaria</option>
                        </select>
                     </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-700 transition-all flex items-center gap-4">
                    <Save size={20} /> Certificar Nota
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyNote;
