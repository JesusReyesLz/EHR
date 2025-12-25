
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Activity, Pill, Droplets, Trash2, Plus, 
  Clock, Save, User, X, FlaskConical, HeartPulse, FileText, CheckCircle2, 
  Thermometer, Wind, Droplet, Scale, Ruler, History, AlertTriangle, Check, XCircle
} from 'lucide-react';
import { Patient, ClinicalNote, MedicationLog, LiquidEntry, Vitals } from '../types';

const NursingSheet: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [sheetDate, setSheetDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('Matutino');
  const [nurseName, setNurseName] = useState('Enf. Lucía Rodríguez');

  // Modal para añadir toma de signos
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [newVitals, setNewVitals] = useState<Vitals>({
    bp: '120/80', temp: 36.5, hr: 72, rr: 18, o2: 98, weight: 82, height: 175, bmi: 26.8, date: ''
  });

  // Modal para medicamentos
  const [showMedModal, setShowMedModal] = useState(false);
  const [medForm, setMedForm] = useState({ 
    id: '', 
    name: '', 
    dosage: '', 
    status: 'Aplicado' as 'Aplicado' | 'No Aplicado', 
    time: new Date().toLocaleTimeString('es-MX', {hour12:false, hour:'2-digit', minute:'2-digit'}) 
  });

  // Modal para líquidos
  const [showLiquidModal, setShowLiquidModal] = useState(false);
  const [liquidForm, setLiquidForm] = useState({ id: '', concept: 'SOLUCIÓN FISIOLÓGICA 0.9%', amount: 250, type: 'Ingreso' as 'Ingreso' | 'Egreso' });

  // Calcular IMC automáticamente
  useEffect(() => {
    if (newVitals.weight > 0 && newVitals.height > 0) {
      const hM = newVitals.height / 100;
      const calculatedBmi = parseFloat((newVitals.weight / (hM * hM)).toFixed(1));
      if (calculatedBmi !== newVitals.bmi) {
        setNewVitals(prev => ({ ...prev, bmi: calculatedBmi }));
      }
    }
  }, [newVitals.weight, newVitals.height]);

  const medLogs = useMemo(() => (patient?.medicationLogs || []).filter(l => l.date === sheetDate), [patient?.medicationLogs, sheetDate]);
  const liquidsForDay = useMemo(() => (patient?.liquidHistory || []).filter(l => l.date === sheetDate), [patient?.liquidHistory, sheetDate]);
  const totalIngresos = useMemo(() => liquidsForDay.filter(l => l.type === 'Ingreso').reduce((a,b) => a + b.amount, 0), [liquidsForDay]);
  const totalEgresos = useMemo(() => liquidsForDay.filter(l => l.type === 'Egreso').reduce((a,b) => a + b.amount, 0), [liquidsForDay]);

  const handleRegisterVitals = () => {
    if (!patient) return;
    const timestamp = new Date().toLocaleString('es-MX');
    const entry = { ...newVitals, date: timestamp };
    
    // Actualizamos el paciente global para que la ficha y la gráfica vean los mismos datos
    onUpdatePatient({ 
      ...patient, 
      currentVitals: entry, 
      vitalsHistory: [entry, ...(patient.vitalsHistory || [])] 
    });
    setShowVitalsModal(false);
  };

  const handleSaveMed = () => {
    if (!medForm.name || !patient) return;
    const newLogs = [...(patient.medicationLogs || [])];
    const log: MedicationLog = { 
      id: Date.now().toString(), 
      medName: medForm.name.toUpperCase(), 
      dosage: medForm.dosage, 
      time: medForm.time, 
      status: medForm.status as any, 
      nurse: nurseName, 
      date: sheetDate 
    };
    newLogs.unshift(log);
    onUpdatePatient({ ...patient, medicationLogs: newLogs });
    setShowMedModal(false);
    setMedForm({ ...medForm, name: '', dosage: '' });
  };

  const handleSaveLiquid = () => {
    if (!liquidForm.concept || !patient) return;
    const newHistory = [...(patient.liquidHistory || [])];
    const entry: LiquidEntry = { 
      id: Date.now().toString(), 
      type: liquidForm.type, 
      concept: liquidForm.concept.toUpperCase(), 
      amount: liquidForm.amount, 
      time: new Date().toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit', hour12:false}), 
      date: sheetDate 
    };
    newHistory.unshift(entry);
    onUpdatePatient({ ...patient, liquidHistory: newHistory });
    setShowLiquidModal(false);
  };

  const handleFinalSave = () => {
    onSaveNote({
      id: `ENF-${Date.now()}`,
      patientId: patient!.id,
      type: 'Hoja de Enfermería Certificada',
      date: new Date().toLocaleString('es-MX'),
      author: nurseName,
      content: { 
        shift, 
        nurse: nurseName, 
        meds: medLogs, 
        balance: totalIngresos - totalEgresos, 
        vitalsSummary: patient?.vitalsHistory?.slice(0, 5) 
      },
      isSigned: true,
      hash: `CERT-ENF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    navigate(`/patient/${id}`);
  };

  if (!patient) return null;

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in space-y-10">
      
      {/* TOOLBAR */}
      <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-xl flex flex-wrap items-center justify-between gap-6 no-print">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg"><ChevronLeft size={20}/></button>
            <div>
               <h1 className="text-xl font-black text-slate-900 uppercase">Hoja de Enfermería</h1>
               <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Registros de Turno • {sheetDate}</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <input type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black" value={sheetDate} onChange={e => setSheetDate(e.target.value)} />
            <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase" value={shift} onChange={e => setShift(e.target.value)}>
               <option>Matutino</option><option>Vespertino</option><option>Nocturno</option>
            </select>
         </div>
      </div>

      {/* HEADER DE PACIENTE */}
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-8">
        <div className="flex items-center gap-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl">
            {patient.name.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PACIENTE</p>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{patient.name}</h2>
            <div className="flex gap-10 mt-4">
              <div><p className="text-[10px] font-black text-slate-300 uppercase">EDAD</p><p className="font-black text-slate-700">{patient.age}A</p></div>
              <div><p className="text-[10px] font-black text-slate-300 uppercase">SEXO</p><p className="font-black text-slate-700">{patient.sex}</p></div>
              <div><p className="text-[10px] font-black text-slate-300 uppercase">CAMA</p><p className="font-black text-slate-700">{patient.bedNumber || 'BOX-01'}</p></div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">ALERGIAS</p>
          <p className="text-2xl font-black text-rose-600 uppercase tracking-tighter">
            {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'NEGADAS'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-8">
          
          {/* CONTROL DE SIGNOS VITALES (SÁBANA) */}
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden">
             <div className="p-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Activity className="text-emerald-600" />
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">CONTROL DE SIGNOS VITALES (SÁBANA)</h3>
                </div>
                <button 
                  onClick={() => setShowVitalsModal(true)}
                  className="flex items-center px-8 py-3 bg-[#059669] hover:bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
                >
                  <Plus className="mr-2" size={18} /> AÑADIR TOMA
                </button>
             </div>
             
             <div className="overflow-x-auto px-10 pb-10">
                <table className="w-full text-center border-separate border-spacing-y-4">
                   <thead>
                      <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="pb-4">HORARIO</th>
                         <th className="pb-4">TEMP (°C)</th>
                         <th className="pb-4">F.C. (LPM)</th>
                         <th className="pb-4">F.R. (RPM)</th>
                         <th className="pb-4">T.A. (MMHG)</th>
                         <th className="pb-4">SAT O2 (%)</th>
                      </tr>
                   </thead>
                   <tbody>
                      {patient.vitalsHistory?.map((v, i) => (
                         <tr key={i} className="hover:bg-slate-50 transition-all">
                            <td className="p-4 bg-slate-50 rounded-l-2xl flex items-center justify-center gap-2">
                               <span className="font-black text-slate-900">{v.date.split(', ')[1]}</span>
                               <Clock size={14} className="text-slate-400" />
                            </td>
                            <td className="p-4 font-black text-emerald-600 text-sm">{v.temp}</td>
                            <td className="p-4 font-black text-slate-700 text-sm">{v.hr}</td>
                            <td className="p-4 font-black text-slate-700 text-sm">{v.rr}</td>
                            <td className="p-4 font-black text-slate-700 text-sm">{v.bp}</td>
                            <td className="p-4 bg-slate-50 rounded-r-2xl font-black text-blue-600 text-sm">{v.o2}</td>
                         </tr>
                      ))}
                      {(!patient.vitalsHistory || patient.vitalsHistory.length === 0) && (
                        <tr><td colSpan={6} className="py-20 text-center opacity-20 font-black uppercase text-[10px]">Sin registros en este turno</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* REGISTRO DE MEDICAMENTOS */}
            <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex flex-col">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-[10px] font-black uppercase flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-600" /> Administración Farmacológica
                  </h3>
                  <button 
                    onClick={() => setShowMedModal(true)} 
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-slate-900 transition-all"
                  >
                    + Registrar Aplicación
                  </button>
               </div>
               <div className="divide-y divide-slate-50 flex-1 min-h-[300px]">
                  {medLogs.map((m) => (
                     <div key={m.id} className="p-6 flex items-center justify-between group hover:bg-blue-50/20 transition-all">
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${m.status === 'Aplicado' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {m.status === 'Aplicado' ? <Check size={20} /> : <XCircle size={20} />}
                           </div>
                           <div>
                              <p className="text-sm font-black uppercase text-slate-900">{m.medName}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic">{m.time} hrs • {m.dosage} • {m.status} • Por: {m.nurse}</p>
                           </div>
                        </div>
                        <button onClick={() => onUpdatePatient({...patient, medicationLogs: patient.medicationLogs?.filter(l => l.id !== m.id)})} className="opacity-0 group-hover:opacity-100 text-rose-300 p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"><Trash2 size={18}/></button>
                     </div>
                  ))}
                  {medLogs.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Ningún fármaco administrado</div>}
               </div>
            </div>

            {/* BALANCE HÍDRICO */}
            <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-[10px] font-black uppercase flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" /> Control Hídrico
                  </h3>
                  <div className="flex gap-2">
                     <button onClick={() => { setLiquidForm({id:'', concept:'SOLUCIÓN FISIOLÓGICA 0.9%', amount:250, type:'Ingreso'}); setShowLiquidModal(true); }} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase">+ Ingreso</button>
                     <button onClick={() => { setLiquidForm({id:'', concept:'DIURESIS', amount:250, type:'Egreso'}); setShowLiquidModal(true); }} className="px-5 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase">+ Egreso</button>
                  </div>
               </div>
               <div className="grid grid-cols-2 divide-x border-b border-slate-100 min-h-[200px]">
                  <div className="p-6 space-y-3 bg-blue-50/20">
                     {liquidsForDay.filter(l => l.type === 'Ingreso').map(l => <div key={l.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-blue-100 shadow-sm"><span className="text-[10px] font-black uppercase">{l.concept}</span><span className="text-sm font-black text-blue-700">{l.amount} ml</span></div>)}
                  </div>
                  <div className="p-6 space-y-3 bg-rose-50/20">
                     {liquidsForDay.filter(l => l.type === 'Egreso').map(l => <div key={l.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-rose-100 shadow-sm"><span className="text-[10px] font-black uppercase">{l.concept}</span><span className="text-sm font-black text-rose-700">{l.amount} ml</span></div>)}
                  </div>
               </div>
               <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                  <p className="text-[11px] font-black uppercase text-blue-400 tracking-[0.3em]">Balance Final:</p>
                  <p className={`text-4xl font-black ${totalIngresos - totalEgresos < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{totalIngresos - totalEgresos} <span className="text-xs uppercase">ml</span></p>
               </div>
            </div>
          </div>

          {/* VALIDACIÓN Y CERTIFICACIÓN */}
          <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 border-b-[10px] border-emerald-600">
             <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-emerald-400 shadow-inner"><ShieldCheck size={32} /></div>
                <div>
                   <h4 className="text-xl font-black uppercase tracking-tight">Certificación de Turno</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">NOM-004-SSA3 • INTEGRIDAD CLÍNICA</p>
                </div>
             </div>
             <div className="flex-1 max-w-xl">
                <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase mb-4 focus:bg-white/10 outline-none" value={nurseName} onChange={e => setNurseName(e.target.value)} placeholder="Responsable del Turno" />
                <textarea className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-[11px] h-24 italic" defaultValue="Paciente hemodinámicamente estable. Se entrega turno sin eventualidades." />
             </div>
             <button onClick={handleFinalSave} className="px-12 py-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">
                Cerrar y Sellar Hoja
             </button>
          </div>
        </div>
      </div>

      {/* MODAL SIGNOS VITALES */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-3xl rounded-[4rem] shadow-2xl p-14 space-y-12 border border-white/20">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white"><HeartPulse size={28}/></div>
                    <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Nueva Toma de Signos</h3>
                 </div>
                 <button onClick={() => setShowVitalsModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl"><X size={32} /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { l: 'T.A.', k: 'bp', i: <Activity className="text-blue-500" />, u: 'mmHg' },
                  { l: 'F.C.', k: 'hr', i: <HeartPulse className="text-rose-500" />, u: 'lpm' },
                  { l: 'F.R.', k: 'rr', i: <Wind className="text-emerald-500" />, u: 'rpm' },
                  { l: 'TEMP', k: 'temp', i: <Thermometer className="text-amber-500" />, u: '°C' },
                  { l: 'SATO2', k: 'o2', i: <Droplet className="text-cyan-500" />, u: '%' },
                  { l: 'PESO', k: 'weight', i: <Scale className="text-indigo-500" />, u: 'kg' },
                  { l: 'TALLA', k: 'height', i: <Ruler className="text-violet-500" />, u: 'cm' },
                  { l: 'IMC', k: 'bmi', i: <Activity className="text-slate-400" />, u: '' }
                ].map(v => (
                  <div key={v.k} className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">{v.i} {v.l}</label>
                    <div className="relative">
                      <input 
                        type={v.k === 'bp' ? 'text' : 'number'}
                        className={`w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-black text-center focus:border-emerald-500 transition-all outline-none ${v.k === 'bmi' ? 'opacity-50' : ''}`}
                        value={(newVitals as any)[v.k]}
                        readOnly={v.k === 'bmi'}
                        onChange={e => setNewVitals({...newVitals, [v.k]: v.k === 'bp' ? e.target.value : parseFloat(e.target.value) || 0})}
                      />
                      <span className="absolute right-4 bottom-2 text-[7px] font-black text-slate-300">{v.u}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleRegisterVitals}
                className="w-full py-8 bg-[#059669] text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4"
              >
                <Save size={24} /> REGISTRAR EN SÁBANA
              </button>
           </div>
        </div>
      )}

      {/* MODAL MEDICAMENTOS */}
      {showMedModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-14 space-y-10 border border-white/20">
              <div className="flex justify-between items-center"><h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Administración</h3><button onClick={() => setShowMedModal(false)}><X size={32}/></button></div>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Medicamento Administrado</label>
                    <input className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-black uppercase outline-none focus:bg-white text-lg transition-all" placeholder="Escriba el nombre..." value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Dosis</label>
                      <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase text-sm" placeholder="Ej: 500mg" value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado de Aplicación</label>
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-[10px] outline-none" value={medForm.status} onChange={e => setMedForm({...medForm, status: e.target.value as any})}>
                        <option>Aplicado</option>
                        <option>No Aplicado</option>
                      </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora de Aplicación</label>
                    <input type="time" className="w-full p-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-center text-3xl outline-none shadow-2xl" value={medForm.time} onChange={e => setMedForm({...medForm, time: e.target.value})} />
                 </div>
                 <button onClick={handleSaveMed} className="w-full py-8 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl transition-all hover:bg-emerald-600 active:scale-95">Registrar en Hoja</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL LÍQUIDOS */}
      {showLiquidModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 space-y-10 border border-white/20">
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Registro de {liquidForm.type}</h3>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccione Concepto</label>
                    <select className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-black uppercase outline-none" value={liquidForm.concept} onChange={e => setLiquidForm({...liquidForm, concept: e.target.value})}>
                       {liquidForm.type === 'Ingreso' ? (
                          <><option>SOLUCIÓN FISIOLÓGICA 0.9%</option><option>SOLUCIÓN HARTMANN</option><option>GLUCOSA AL 5%</option><option>DIETA POLIMÉRICA</option><option>SANGRE TOTAL</option></>
                       ) : (
                          <><option>DIURESIS</option><option>VÓMITO</option><option>EVACUACIÓN LÍQUIDA</option><option>SANGRADO</option><option>DRENAJE</option></>
                       )}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Volumen (ml)</label>
                    <input type="number" className="w-full p-8 bg-slate-50 rounded-[2rem] font-black text-indigo-600 text-5xl text-center outline-none" value={liquidForm.amount} onChange={e => setLiquidForm({...liquidForm, amount: parseInt(e.target.value) || 0})} />
                 </div>
                 <button onClick={handleSaveLiquid} className={`w-full py-6 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all ${liquidForm.type === 'Ingreso' ? 'bg-blue-600' : 'bg-rose-600'}`}>Guardar Registro</button>
                 <button onClick={() => setShowLiquidModal(false)} className="w-full text-slate-400 font-black uppercase text-[10px]">Cerrar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NursingSheet;
