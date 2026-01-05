
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Stethoscope, 
  ClipboardList, HeartPulse, Thermometer, Wind, Droplet, Scale, Ruler,
  AlertTriangle, FileText, Brain, Utensils, Syringe, Bed, 
  RotateCcw, History, AlertCircle
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals } from '../../types';

const HospitalAdmissionNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [form, setForm] = useState({
    // Administrativo
    admissionDate: new Date().toISOString().split('T')[0],
    admissionTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    service: 'Medicina Interna',
    bed: '',
    source: 'Urgencias', // Consulta Externa, Traslado, Urgencias
    isReadmission: false, // Reingreso por misma afección

    // Interrogatorio
    motivoIngreso: '',
    ahfm: '', // Heredofamiliares
    app: '',  // Personales Patológicos
    apnp: '', // No Patológicos
    padecimientoActual: '', // PA
    ipays: '', // Aparatos y Sistemas

    // Exploración
    exploracionFisica: '', 
    estadoMental: '',
    
    // Auxiliares
    resultadosPrevios: '', // Labs que trae el paciente o se tomaron en urgencias
    
    // Diagnóstico
    diagnosticoIngreso: '',
    comorbilidades: '',
    
    // Plan de Manejo (Ingreso)
    dieta: 'Ayuno hasta nueva orden',
    soluciones: '',
    medicamentos: '',
    medidasGenerales: 'Signos vitales por turno, cuidados generales de enfermería.',
    estudiosSolicitados: '',
    
    // Pronóstico y Riesgos
    pronostico: 'Reservado a evolución',
    riesgoCaida: 'Bajo',
    riesgoTrombosis: 'Bajo',
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (patient && !noteId) {
       if (patient.currentVitals) setVitals(patient.currentVitals);
       setForm(prev => ({
           ...prev,
           bed: patient.bedNumber || '',
           ahfm: patient.history?.hereditary?.note || '', // Intentar pre-llenar si existe historial
           app: patient.history?.personalPathological?.note || '',
           apnp: `Habitación: ${patient.history?.nonPathological?.housing || ''}`,
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
    <div className="p-20 text-center space-y-6">
       <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto" />
       <h2 className="text-2xl font-black uppercase">Nota de Ingreso Sellada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium">Este documento legal forma parte del expediente y no puede ser modificado.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Volver</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.motivoIngreso || !form.diagnosticoIngreso || !form.padecimientoActual) {
            alert("Campos obligatorios: Motivo de Ingreso, Padecimiento Actual y Diagnóstico.");
            return;
        }
        if (!window.confirm("¿Confirmar Ingreso Hospitalario? Se generará la nota legal.")) return;
    }

    const newNoteId = noteId || `ING-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: patient.id,
      type: 'Nota de Ingreso a Hospitalización',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form, vitals },
      isSigned: finalize,
      hash: finalize ? `CERT-HOSP-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: newNoteId } : {} });
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
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nota de Ingreso</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-004-SSA3-2012 • Hospitalización
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-blue-700">
             <Bed size={20} />
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Cama Asignada</p>
                 <p className="text-sm font-black uppercase">{form.bed || 'Sin Asignar'}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: VITALES & ALERTA DE REINGRESO */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* ALERTA DE REINGRESO */}
            <div className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all ${form.isReadmission ? 'bg-rose-50 border-rose-200 shadow-lg' : 'bg-slate-50 border-slate-200'}`} onClick={() => setForm({...form, isReadmission: !form.isReadmission})}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${form.isReadmission ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <RotateCcw size={24} />
                    </div>
                    <div>
                        <p className={`text-sm font-black uppercase ${form.isReadmission ? 'text-rose-700' : 'text-slate-500'}`}>Reingreso</p>
                        <p className="text-[9px] font-bold uppercase opacity-60">Misma afección (año en curso)</p>
                    </div>
                    {form.isReadmission && <AlertCircle className="ml-auto text-rose-500" size={20} />}
                </div>
            </div>

            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <HeartPulse size={14} className="text-emerald-400"/> Signos Vitales (Ingreso)
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    {[
                        { l: 'T.A.', v: vitals.bp, u: 'mmHg', i: <Activity size={12}/> },
                        { l: 'F.C.', v: vitals.hr, u: 'lpm', i: <HeartPulse size={12}/> },
                        { l: 'F.R.', v: vitals.rr, u: 'rpm', i: <Wind size={12}/> },
                        { l: 'Temp', v: vitals.temp, u: '°C', i: <Thermometer size={12}/> },
                        { l: 'SatO2', v: vitals.o2, u: '%', i: <Droplet size={12}/> },
                        { l: 'Peso', v: vitals.weight, u: 'kg', i: <Scale size={12}/> },
                    ].map(item => (
                        <div key={item.l} className="bg-white/10 p-3 rounded-2xl border border-white/5">
                            <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">{item.i} {item.l}</label>
                            <input 
                                className="w-full bg-transparent text-lg font-black text-white outline-none" 
                                value={item.v}
                                onChange={e => setVitals({...vitals, [item.l === 'T.A.' ? 'bp' : item.l === 'F.C.' ? 'hr' : item.l === 'F.R.' ? 'rr' : item.l === 'Temp' ? 'temp' : item.l === 'SatO2' ? 'o2' : 'weight']: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Servicio Tratante</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                        <option>Medicina Interna</option><option>Cirugía General</option><option>Ginecología y Obs.</option><option>Pediatría</option><option>Traumatología</option><option>UCI</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Origen del Paciente</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                        <option>Urgencias</option><option>Consulta Externa</option><option>Referencia / Traslado</option><option>Quirófano (Post-Qx)</option>
                    </select>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: NOTA CLÍNICA */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. INTERROGATORIO */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={14} className="text-rose-600"/> Motivo de Ingreso
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-rose-400 transition-all shadow-inner" 
                            value={form.motivoIngreso} 
                            onChange={e => setForm({...form, motivoIngreso: e.target.value})} 
                            placeholder="Razón principal de la hospitalización..."
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Antecedentes Heredofamiliares</label>
                           <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none" value={form.ahfm} onChange={e => setForm({...form, ahfm: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Personales Patológicos (APP)</label>
                           <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none" value={form.app} onChange={e => setForm({...form, app: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <FileText size={14} className="text-blue-600"/> Padecimiento Actual (Historia de la Enfermedad)
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner leading-relaxed" 
                            value={form.padecimientoActual} 
                            onChange={e => setForm({...form, padecimientoActual: e.target.value})} 
                            placeholder="Semiología detallada, evolución cronológica, tratamientos previos..."
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Interrogatorio por Aparatos y Sistemas (IPAYS)</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium" value={form.ipays} onChange={e => setForm({...form, ipays: e.target.value})} placeholder="Síntomas generales y por sistemas..." />
                    </div>
                </div>

                {/* 2. EXPLORACIÓN FÍSICA */}
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
                    </div>
                    <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Brain size={14} className="text-purple-600"/> Estado Mental / Neurológico
                            </label>
                            <textarea 
                                className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium outline-none resize-none" 
                                value={form.estadoMental} 
                                onChange={e => setForm({...form, estadoMental: e.target.value})} 
                                placeholder="Glasgow, funciones mentales superiores..." 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <ClipboardList size={14} className="text-indigo-600"/> Resultados Auxiliares Previos
                            </label>
                            <textarea 
                                className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium outline-none resize-none" 
                                value={form.resultadosPrevios} 
                                onChange={e => setForm({...form, resultadosPrevios: e.target.value})} 
                                placeholder="Labs/Gabinete traídos por paciente..." 
                            />
                         </div>
                    </div>
                </div>

                {/* 3. DIAGNÓSTICO Y PLAN DE MANEJO */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={14} className="text-rose-600"/> Diagnóstico de Ingreso
                        </label>
                        <input 
                            className="w-full p-6 bg-rose-50/30 border border-rose-100 rounded-2xl text-sm font-black text-rose-900 outline-none" 
                            value={form.diagnosticoIngreso} 
                            onChange={e => setForm({...form, diagnosticoIngreso: e.target.value})} 
                            placeholder="Diagnóstico principal..."
                        />
                    </div>

                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">Plan de Manejo Inicial (Indicaciones)</h4>
                        
                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Utensils size={10}/> Dieta</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.dieta} onChange={e => setForm({...form, dieta: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Droplet size={10}/> Soluciones IV</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.soluciones} onChange={e => setForm({...form, soluciones: e.target.value})} placeholder="Ej: Hartmann 1000cc p/8h" />
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Syringe size={10}/> Medicamentos</label>
                             <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none resize-none" value={form.medicamentos} onChange={e => setForm({...form, medicamentos: e.target.value})} placeholder="Nombre, Dosis, Vía, Frecuencia..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Medidas Generales</label>
                                <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium outline-none resize-none" value={form.medidasGenerales} onChange={e => setForm({...form, medidasGenerales: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pronóstico</label>
                                <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold" value={form.pronostico} onChange={e => setForm({...form, pronostico: e.target.value})} />
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 border-t border-slate-200 pt-4">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><AlertTriangle size={10}/> Riesgo Caída</label>
                                <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.riesgoCaida} onChange={e => setForm({...form, riesgoCaida: e.target.value})}>
                                    <option>Bajo</option><option>Medio</option><option>Alto</option>
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Activity size={10}/> Riesgo Trombosis</label>
                                <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.riesgoTrombosis} onChange={e => setForm({...form, riesgoTrombosis: e.target.value})}>
                                    <option>Bajo</option><option>Moderado</option><option>Alto</option>
                                </select>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-4">
                    <Save size={20} /> Certificar Ingreso
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalAdmissionNote;
