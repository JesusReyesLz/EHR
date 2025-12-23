
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, Activity, ShieldCheck, HeartPulse, Scale, Thermometer,
  FileText, Search, Heart, Dna, Printer, Plus, Pill, AlertCircle,
  Stethoscope, Droplets, BookOpen, UserCheck, AlertTriangle, Trash2, Microscope,
  Send, MessageCircle, ClipboardCheck, UserPlus, Truck, MapPinned, Building2,
  Repeat, CheckCircle, Lightbulb, Zap, Brain, Clipboard, Scissors, Clock, 
  Calendar as CalendarIcon, Timer, Wind, Droplet, Users, ShieldAlert, Check,
  LogOut, Info, AlertOctagon
} from 'lucide-react';
import { ClinicalNote, Vitals, MedicationPrescription, MedicationStock } from '../types';
import { VADEMECUM_DB } from '../constants';

interface NoteEditorProps {
  onSave: (note: ClinicalNote) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ onSave }) => {
  const { id, noteType } = useParams();
  const navigate = useNavigate();
  const type = decodeURIComponent(noteType || 'Nota de Evolución');

  const isEvolution = type.toLowerCase().includes('evolución');
  const isPostOp = type.toLowerCase().includes('post-operatoria') || type.toLowerCase().includes('operatoria post');
  const isPreOp = type.toLowerCase().includes('pre-operatoria') || type.toLowerCase().includes('operatoria pre');
  const isAnesthesia = type.toLowerCase().includes('anestésica') || type.toLowerCase().includes('anestesia');
  const isDischarge = type.toLowerCase().includes('egreso') || type.toLowerCase().includes('alta');
  const isEmergency = type.toLowerCase().includes('urgencias');
  const isInterconsulta = type.toLowerCase().includes('interconsulta');
  const isReferral = type.toLowerCase().includes('referencia') || type.toLowerCase().includes('traslado');
  const isCounterReferral = type.toLowerCase().includes('contrarreferencia');

  const [form, setForm] = useState({
    subjective: '', 
    objective: '',  
    interpretacionEstudios: '', 
    diagnosis: '',  
    plan: '',       
    cuidadosGenerales: 'Control de signos vitales cada 15 min por 2 horas, luego cada hora. Vigilar sangrado de herida quirúrgica.',
    prognosisLife: 'Bueno',
    prognosisFunction: 'Bueno',
    // Campos Post-operatorios
    diagnosisPre: '',
    diagnosisPost: '',
    operationPlanned: '',
    operationRealized: '',
    technique: '',
    findings: '',
    gasasCount: true,
    compresasCount: true,
    instrumentalCount: true,
    incidentes: 'Sin incidentes ni accidentes reportados.',
    bleeding: '50 ml',
    transfusions: 'Ninguna',
    transOpResults: 'Pendiente resultado de patología',
    personalCirujano: 'Dr. Alejandro Méndez',
    personalAnestesiologo: 'Dr. Roberto Cruz',
    postOpState: 'Estable, reactivo.',
    postOpPlan: 'Pase a recuperación.',
    // Campos Pre-operatorios
    surgeryDate: new Date().toISOString().split('T')[0],
    surgicalType: 'Mayor',
    surgicalRisk: 'ASA I',
    preOpCare: 'Ayuno de 8 hrs, Consentimiento firmado.',
    // Campos Egreso / Alta (NOM-004 Numeral 8.9)
    admissionDate: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 días atrás demo
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeReason: 'Mejoría',
    finalDiagnosis: '',
    evolutionSummary: '',
    stayManagement: '',
    pendingProblems: 'Ninguno reportado.',
    alarmSigns: 'Fiebre > 38.5°C, Dolor abdominal intenso, Sangrado transvaginal/herida, Dificultad respiratoria.',
    dischargePlan: 'Continuar tratamiento en domicilio, dieta baja en sodio, cita en 7 días.',
    // Campos Anestesia
    airwayEval: 'Mallampati I',
    anesthesiaProposed: 'General Balanceada',
    // Campos Urgencias
    motivoAtencion: '',
    estadoMental: 'Alerta, orientado.',
    tratamientoUrgencias: '',
    triage: 'Verde'
  });

  const [vitals, setVitals] = useState<Vitals>({
    bp: '120/80', temp: 36.6, hr: 72, rr: 18, o2: 98, weight: 70, height: 170, bmi: 24.2, date: new Date().toISOString()
  });

  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<MedicationStock[]>([]);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (vitals.weight > 0 && vitals.height > 0) {
      const h = vitals.height / 100;
      const bmi = parseFloat((vitals.weight / (h * h)).toFixed(1));
      setVitals(prev => ({ ...prev, bmi }));
    }
  }, [vitals.weight, vitals.height]);

  const handleSearchMed = (val: string) => {
    setSearchTerm(val);
    if (val.length > 1) {
      const filtered = VADEMECUM_DB.filter(m => 
        m.name.toLowerCase().includes(val.toLowerCase()) || m.genericName.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectMedFromDB = (med: MedicationStock) => {
    const newPrescription: MedicationPrescription = {
      id: `MED-REC-${Date.now()}`,
      name: med.name,
      dosage: '',
      frequency: '',
      duration: '',
      route: med.presentation.includes('Inyectable') ? 'IV' : 'Oral',
      instructions: ''
    };
    setPrescriptions([...prescriptions, newPrescription]);
    setSearchTerm('');
    setSuggestions([]);
  };

  const saveNote = () => {
    const newNote: ClinicalNote = {
      id: `NOTE-EGR-${Date.now()}`,
      patientId: id || '',
      type: type,
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form, vitals, prescriptions },
      isSigned: true,
      hash: `CERT-SHA256-DISCHARGE-${Math.random().toString(36).substr(2, 12).toUpperCase()}`
    };
    onSave(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${isDischarge ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-blue-400'}`}>
            {isDischarge ? <LogOut size={32} /> : <FileText size={32} />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{type}</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> Cumplimiento NOM-004 • Numeral 8.9
            </p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Administrativo</p>
           <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Cierre de Episodio Clínico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          
          {/* Signos Vitales al Egreso */}
          <div className={`${isDischarge ? 'bg-emerald-950' : 'bg-slate-900'} text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border-4 border-white/5`}>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center text-emerald-400 mb-10">
              <HeartPulse className="w-6 h-6 mr-4" /> Signos Vitales al Momento del Egreso
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {[
                { label: 'Tensión Art.', key: 'bp', icon: <Droplets size={12} /> },
                { label: 'Temp °C', key: 'temp', icon: <Thermometer size={12} /> },
                { label: 'Frec. Card.', key: 'hr', icon: <Activity size={12} /> },
                { label: 'SatO2 %', key: 'o2', icon: <Wind size={12} /> }
              ].map(v => (
                <div key={v.key} className="space-y-3">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center">{v.icon} <span className="ml-2">{v.label}</span></label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-black text-center focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={(vitals as any)[v.key]}
                    onChange={e => setVitals({...vitals, [v.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CUERPO NOTA DE EGRESO (Numeral 8.9) */}
          <div className="space-y-10">
             {/* Datos de Ingreso y Egreso */}
             <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 text-emerald-700 border-b border-emerald-50 pb-4">
                   <CalendarIcon size={24} />
                   <h3 className="text-sm font-black uppercase tracking-widest">I. Periodo Hospitalario y Motivo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Fecha de Ingreso</label>
                      <input type="date" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold outline-none" value={form.admissionDate} onChange={e => setForm({...form, admissionDate: e.target.value})} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block ml-2">Fecha de Egreso</label>
                      <input type="date" className="w-full p-6 bg-emerald-50/20 border border-emerald-100 rounded-[2rem] text-sm font-black outline-none" value={form.dischargeDate} onChange={e => setForm({...form, dischargeDate: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Motivo del Egreso</label>
                   <select 
                     className="w-full p-6 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase outline-none shadow-xl"
                     value={form.dischargeReason}
                     onChange={e => setForm({...form, dischargeReason: e.target.value})}
                   >
                      <option>Mejoría</option>
                      <option>Curación</option>
                      <option>Traslado a otra unidad</option>
                      <option>Defunción</option>
                      <option>Alta Voluntaria</option>
                      <option>Fuga</option>
                   </select>
                </div>
             </div>

             {/* Diagnósticos y Resumen */}
             <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 text-emerald-700 border-b border-emerald-50 pb-4">
                   <ClipboardCheck size={24} />
                   <h3 className="text-sm font-black uppercase tracking-widest">II. Diagnósticos Finales y Evolución</h3>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Diagnósticos Finales (CIE-10)</label>
                   <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-24 text-sm font-black uppercase outline-none" value={form.finalDiagnosis} onChange={e => setForm({...form, finalDiagnosis: e.target.value})} placeholder="Especifique códigos y descripciones finales..." />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Resumen de la Evolución y Estado Actual</label>
                   <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-48 text-sm outline-none shadow-inner italic leading-relaxed" value={form.evolutionSummary} onChange={e => setForm({...form, evolutionSummary: e.target.value})} placeholder="Resuma el curso clínico durante la estancia..." />
                </div>
             </div>

             {/* Manejo y Pendientes */}
             <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 text-indigo-700 border-b border-indigo-50 pb-4">
                   <Stethoscope size={24} />
                   <h3 className="text-sm font-black uppercase tracking-widest">III. Manejo Hospitalario y Pendientes</h3>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Manejo durante la Estancia Hospitalaria</label>
                   <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-32 text-sm outline-none font-bold" value={form.stayManagement} onChange={e => setForm({...form, stayManagement: e.target.value})} placeholder="Terapéutica, procedimientos y estudios realizados..." />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest block ml-2 flex items-center"><AlertTriangle size={14} className="mr-2" /> Problemas Clínicos Pendientes</label>
                   <textarea className="w-full p-6 bg-rose-50/10 border border-rose-100 rounded-[2rem] h-24 text-sm font-black outline-none" value={form.pendingProblems} onChange={e => setForm({...form, pendingProblems: e.target.value})} />
                </div>
             </div>

             {/* Plan y Signos de Alarma */}
             <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-10">
                <div className="flex items-center gap-4 text-blue-400 border-b border-white/10 pb-4">
                   <Info size={24} />
                   <h3 className="text-sm font-black uppercase tracking-widest">IV. Plan de Egreso y Vigilancia Amb.</h3>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-2">Plan de Manejo y Recomendaciones</label>
                   <textarea className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] h-40 text-sm outline-none focus:bg-white/10 transition-all shadow-inner" value={form.dischargePlan} onChange={e => setForm({...form, dischargePlan: e.target.value})} />
                </div>
                <div className="p-8 bg-rose-900/50 border border-rose-500/30 rounded-[2rem] space-y-4">
                   <label className="text-[10px] font-black text-rose-200 uppercase tracking-widest block ml-2 flex items-center"><AlertOctagon size={16} className="mr-2" /> Signos de Alarma para Acudir a Urgencias</label>
                   <textarea className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-xs font-black h-24 outline-none focus:bg-white/10" value={form.alarmSigns} onChange={e => setForm({...form, alarmSigns: e.target.value})} />
                </div>
             </div>
          </div>

          {/* Receta de Egreso */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center">
                  <Pill className="w-6 h-6 mr-3 text-emerald-600" /> Prescripción Médica de Alta
                </h3>
                <div className="relative w-full md:w-96">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none" placeholder="Añadir medicamento de alta..." value={searchTerm} onChange={e => handleSearchMed(e.target.value)} />
                   </div>
                   {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                         {suggestions.map(med => (
                            <button key={med.id} onClick={() => selectMedFromDB(med)} className="w-full text-left p-4 hover:bg-emerald-50 border-b border-slate-50 last:border-0">
                               <p className="text-[10px] font-black uppercase">{med.name}</p>
                               <p className="text-[8px] text-slate-400 font-bold uppercase">{med.genericName}</p>
                            </button>
                         ))}
                      </div>
                   )}
                </div>
             </div>

             <div className="space-y-6">
                {prescriptions.map((med) => (
                   <div key={med.id} className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-6">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg"><Pill size={20} /></div>
                            <p className="text-sm font-black text-slate-900 uppercase">{med.name}</p>
                         </div>
                         <button onClick={() => setPrescriptions(prev => prev.filter(m => m.id !== med.id))} className="text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={20} /></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                         {['dosage', 'frequency', 'duration', 'route'].map(f => (
                           <div key={f} className="space-y-2">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">{f}</label>
                              <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase" value={(med as any)[f]} onChange={e => setPrescriptions(prescriptions.map(m => m.id === med.id ? { ...m, [f]: e.target.value } : m))} />
                           </div>
                         ))}
                      </div>
                   </div>
                ))}
                {prescriptions.length === 0 && (
                  <p className="text-center py-10 text-slate-300 font-black uppercase text-[10px] border-2 border-dashed border-slate-100 rounded-[2.5rem]">Sin medicamentos prescritos para el alta</p>
                )}
             </div>
          </div>
        </div>

        {/* Barra Lateral: Validación y Cierre */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Protocolo de Egreso</h3></div>
              <div className="space-y-4">
                 {[
                    { l: 'Hoja de Egreso Voluntario', checked: false },
                    { l: 'Certificado de Defunción', checked: false },
                    { l: 'Cita de Seguimiento Generada', checked: true },
                    { l: 'Receta Médica Impresa', checked: true }
                 ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <span className="text-[10px] font-black uppercase text-slate-600 leading-tight pr-4">{item.l}</span>
                       <input type="checkbox" className="w-5 h-5 accent-emerald-600 flex-shrink-0" defaultChecked={item.checked} />
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pronóstico al Egreso</h3></div>
              {[
                { label: 'Vida', key: 'prognosisLife', icon: <Heart size={14} className="text-rose-500" /> },
                { label: 'Función', key: 'prognosisFunction', icon: <Dna size={14} className="text-blue-500" /> }
              ].map(p => (
                <div key={p.key} className="space-y-4">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{p.icon} <span className="ml-2">{p.label}</span></label>
                   <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase outline-none" value={(form as any)[p.key]} onChange={e => setForm({...form, [p.key]: e.target.value})}>
                      <option>Bueno</option><option>Reservado</option><option>Malo</option>
                   </select>
                </div>
              ))}
           </div>

           <button 
              onClick={() => setIsSigning(true)}
              disabled={!form.finalDiagnosis || !form.evolutionSummary}
              className={`w-full py-6 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group bg-emerald-600 shadow-emerald-100`}
            >
               <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> Certificar Egreso del Paciente
            </button>
        </div>
      </div>

      {isSigning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white rounded-[4rem] p-16 max-w-xl w-full text-center space-y-12 shadow-2xl border-4 border-emerald-600">
              <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Certificación de Alta</h2>
              <p className="text-slate-500 text-sm font-medium uppercase leading-relaxed">Al firmar esta nota, usted certifica el cierre oficial del episodio hospitalario. Se generará el resumen clínico de egreso inmutable conforme a la NOM-004.</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsSigning(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px]">Revisar Datos</button>
                 <button onClick={saveNote} className="flex-2 px-10 py-5 bg-emerald-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl">Confirmar, Sellar y Cerrar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
