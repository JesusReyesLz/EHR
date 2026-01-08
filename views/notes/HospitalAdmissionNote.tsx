import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Add FlaskConical to the import list from lucide-react
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Stethoscope, 
  ClipboardList, HeartPulse, Thermometer, Wind, Droplet, Scale, Ruler,
  AlertTriangle, FileText, Brain, Utensils, Syringe, Bed, 
  RotateCcw, AlertCircle, CheckCircle2, Lock, User, FlaskConical
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

interface HospitalAdmissionProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

const HospitalAdmissionNote: React.FC<HospitalAdmissionProps> = ({ patients, notes, onSaveNote, doctorInfo }) => {
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
    source: 'Urgencias', 
    isReadmission: false, 

    // 1. Interrogatorio
    motivoIngreso: '',
    ahfm: '', // Antecedentes Heredofamiliares
    app: '',  // Antecedentes Personales Patológicos
    apnp: '', // Antecedentes Personales No Patológicos
    padecimientoActual: '', // PA
    ipays: '', // Interrogatorio por Aparatos y Sistemas

    // 2. Exploración Física
    habitusExterior: 'Paciente consciente, orientado, con facies no característica de dolor agudo, edad aparente concuerda con cronológica.',
    exploracionFisica: '', // Exploración por regiones (Cabeza, cuello, tórax, etc)
    estadoMental: 'Orientado en sus 3 esferas (Persona, lugar y tiempo). Glasgow 15/15.',
    
    // 3. Auxiliares
    resultadosEstudios: '', // Labs, gabinete previos o de urgencias
    
    // 4. Diagnósticos
    diagnosticoIngreso: '', // Impresión diagnóstica principal
    comorbilidades: '',
    
    // 5. Plan de Manejo y Pronóstico
    dieta: 'Dieta normal para la edad / Líquidos claros',
    soluciones: 'Solución Salina 0.9% 1000cc p/8h',
    medicamentos: '', // Medicamentos indicados al ingreso
    medidasGenerales: 'Signos vitales por turno. Cuidados generales de enfermería. Movilización fuera de cama.',
    pronostico: 'Bueno para la vida y la función.',
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
           diagnosticoIngreso: patient.reason || '',
           apnp: `Tabaquismo: ${patient.chronicDiseases?.includes('Tabaquismo') ? 'Positivo' : 'Negado'}. Alcoholismo: Negado.`,
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
       <ShieldCheck className="w-20 h-20 text-blue-600 mx-auto opacity-50" />
       <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tighter">Nota de Ingreso Archivada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium">Este documento médico-legal ha sido certificado y no admite modificaciones posteriores.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.motivoIngreso || !form.diagnosticoIngreso || !form.padecimientoActual) {
            alert("Los campos: Motivo de Ingreso, Padecimiento Actual y Diagnóstico son obligatorios por norma.");
            return;
        }
        if (!window.confirm("¿Confirmar Ingreso Hospitalario? Se generará el registro oficial inmutable.")) return;
    }

    const currentNoteId = noteId || `ING-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Ingreso a Hospitalización',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo?.name || 'Dr. Alejandro Méndez',
      content: { ...form, vitals },
      isSigned: finalize,
      hash: finalize ? `CERT-HOSP-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-blue-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Nota de Ingreso Hospitalario</h1>
            <p className="text-xs text-blue-600 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500"/> NOM-004-SSA3-2012 • Hospitalización Integral
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-blue-50 px-8 py-4 rounded-[2rem] border border-blue-100 text-blue-800">
             <Bed size={28} />
             <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ubicación Asignada</p>
                 <p className="text-xl font-black uppercase leading-none">{form.bed || 'PENDIENTE'}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: SIGNOS VITALES Y ADMISIÓN */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-8 relative overflow-hidden border-b-8 border-blue-500">
                <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-blue-400">
                        <HeartPulse size={16} /> Signos Vitales de Ingreso
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                        { l: 'T.A.', v: vitals.bp, u: 'mmHg', i: <Activity size={14}/> },
                        { l: 'F.C.', v: vitals.hr, u: 'lpm', i: <HeartPulse size={14}/> },
                        { l: 'F.R.', v: vitals.rr, u: 'rpm', i: <Wind size={14}/> },
                        { l: 'Temp', v: vitals.temp, u: '°C', i: <Thermometer size={14}/> },
                        { l: 'SatO2', v: vitals.o2, u: '%', i: <Droplet size={14}/> },
                        { l: 'Peso', v: vitals.weight, u: 'kg', i: <Scale size={14}/> },
                    ].map(item => (
                        <div key={item.l} className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-1">{item.i} {item.l}</label>
                            <input 
                                className="w-full bg-transparent text-xl font-black text-white outline-none" 
                                value={item.v}
                                onChange={e => setVitals({...vitals, [item.l === 'T.A.' ? 'bp' : item.l === 'F.C.' ? 'hr' : item.l === 'F.R.' ? 'rr' : item.l === 'Temp' ? 'temp' : item.l === 'SatO2' ? 'o2' : 'weight']: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <div 
                    onClick={() => setForm({...form, isReadmission: !form.isReadmission})}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.isReadmission ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                    <div className="flex items-center gap-3">
                        <RotateCcw size={18} />
                        <span className="text-[10px] font-black uppercase">¿Es Reingreso? (Misma afección)</span>
                        {form.isReadmission && <CheckCircle2 className="ml-auto text-rose-500" size={16} />}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Servicio Tratante</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                        <option>Medicina Interna</option><option>Cirugía General</option><option>Gineco-Obstetricia</option><option>Pediatría</option><option>Traumatología</option><option>UCI</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Número de Cama</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-center" placeholder="EJ: 201-A" value={form.bed} onChange={e => setForm({...form, bed: e.target.value})} />
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: NOTA CLÍNICA */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm space-y-10">
                
                {/* 1. INTERROGATORIO */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <FileText className="text-blue-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">I. Interrogatorio Clínico</h3>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={16} className="text-rose-600"/> Motivo de Ingreso
                        </label>
                        <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-24 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all shadow-inner" value={form.motivoIngreso} onChange={e => setForm({...form, motivoIngreso: e.target.value})} placeholder="Razón clínica para la hospitalización..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Heredofamiliares (AHFM)</label>
                           <textarea className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-xs font-medium resize-none outline-none focus:border-blue-400 shadow-sm" value={form.ahfm} onChange={e => setForm({...form, ahfm: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Personales Patológicos (APP)</label>
                           <textarea className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-xs font-medium resize-none outline-none focus:border-blue-400 shadow-sm" value={form.app} onChange={e => setForm({...form, app: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">No Patológicos (APNP)</label>
                           <textarea className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-xs font-medium resize-none outline-none focus:border-blue-400 shadow-sm" value={form.apnp} onChange={e => setForm({...form, apnp: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Aparatos y Sistemas (IPAYS)</label>
                           <textarea className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-xs font-medium resize-none outline-none focus:border-blue-400 shadow-sm" value={form.ipays} onChange={e => setForm({...form, ipays: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Stethoscope size={16} className="text-blue-600"/> Padecimiento Actual (Resumen)
                        </label>
                        <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-48 text-sm font-medium text-slate-700 outline-none focus:bg-white transition-all shadow-inner leading-relaxed" value={form.padecimientoActual} onChange={e => setForm({...form, padecimientoActual: e.target.value})} placeholder="Evolución cronológica de síntomas, tratamientos previos..." />
                    </div>
                </div>

                {/* 2. EXPLORACIÓN */}
                <div className="space-y-8 pt-10 border-t border-slate-100">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <Activity className="text-emerald-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">II. Exploración Física</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Habitus Exterior</label>
                               <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none" value={form.habitusExterior} onChange={e => setForm({...form, habitusExterior: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Exploración por Regiones</label>
                               <textarea className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-48 text-sm font-medium outline-none resize-none shadow-sm" value={form.exploracionFisica} onChange={e => setForm({...form, exploracionFisica: e.target.value})} placeholder="Cabeza, cuello, tórax, abdomen, extremidades..." />
                            </div>
                        </div>
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Brain size={14}/> Estado Mental</label>
                                <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none shadow-sm" value={form.estadoMental} onChange={e => setForm({...form, estadoMental: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><FlaskConical size={14}/> Resultados Auxiliares</label>
                                <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-28 text-xs font-medium outline-none shadow-sm" value={form.resultadosEstudios} onChange={e => setForm({...form, resultadosEstudios: e.target.value})} placeholder="Labs o gabinete relevantes..." />
                             </div>
                             <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-2">
                                <p className="text-[9px] font-black text-blue-400 uppercase">Diagnóstico Presuntivo</p>
                                <textarea className="w-full bg-transparent border-none p-0 text-xs font-black text-blue-900 uppercase outline-none" value={form.diagnosticoIngreso} onChange={e => setForm({...form, diagnosticoIngreso: e.target.value})} />
                             </div>
                        </div>
                    </div>
                </div>

                {/* 3. PLAN DE MANEJO */}
                <div className="space-y-8 pt-10 border-t border-slate-100">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <ClipboardList className="text-indigo-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">III. Plan de Manejo Inmediato</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Utensils size={14}/> Dieta</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.dieta} onChange={e => setForm({...form, dieta: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Droplet size={14}/> Soluciones IV</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.soluciones} onChange={e => setForm({...form, soluciones: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Syringe size={14}/> Medicamentos</label>
                                <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none shadow-sm" value={form.medicamentos} onChange={e => setForm({...form, medicamentos: e.target.value})} placeholder="Fármaco, dosis, vía, horario..." />
                             </div>
                        </div>
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Medidas Generales / Enfermería</label>
                                <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none shadow-sm" value={form.medidasGenerales} onChange={e => setForm({...form, medidasGenerales: e.target.value})} />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Pronóstico</label>
                                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold" value={form.pronostico} onChange={e => setForm({...form, pronostico: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Riesgo Caída</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black" value={form.riesgoCaida} onChange={e => setForm({...form, riesgoCaida: e.target.value})}>
                                        <option>Bajo</option><option>Medio</option><option>Alto</option>
                                    </select>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
                    <button onClick={() => navigate(-1)} className="px-10 py-5 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Descartar</button>
                    <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        <Save size={18} className="inline mr-2" /> Guardar Avance
                    </button>
                    <button onClick={() => handleSave(true)} className="px-14 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4 active:scale-95">
                        <ShieldCheck size={22} /> Certificar Ingreso
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalAdmissionNote;