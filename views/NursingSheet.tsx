
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Activity, Pill, Droplets, Trash2, Plus, 
  Clock, Save, User, X, FlaskConical, HeartPulse, FileText, CheckCircle2, 
  Thermometer, Wind, Droplet, Scale, Ruler, History, AlertTriangle, Check, XCircle,
  Eye, Syringe, Brain, AlertOctagon, ClipboardList, BedDouble
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Patient, ClinicalNote, MedicationLog, LiquidEntry, Vitals } from '../types';

interface ProcedureLog {
  id: string;
  time: string;
  procedure: string;
  notes: string;
  nurse: string;
}

const NursingSheet: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [sheetDate, setSheetDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('Matutino');
  const [nurseName, setNurseName] = useState('Enf. Lucía Rodríguez');

  // Datos Clínicos Adicionales
  const [habitus, setHabitus] = useState('Paciente consciente, orientado, con facies de dolor leve, coloración de tegumentos normal, bien hidratado.');
  const [observations, setObservations] = useState('');
  
  // Escalas y Riesgos
  const [painScale, setPainScale] = useState({ score: 0, location: 'Sin dolor' });
  const [fallRisk, setFallRisk] = useState<'Bajo' | 'Medio' | 'Alto'>('Bajo');
  const [ulcerRisk, setUlcerRisk] = useState<'Sin Riesgo' | 'Riesgo Moderado' | 'Alto Riesgo'>('Sin Riesgo');

  // Procedimientos
  const [procedures, setProcedures] = useState<ProcedureLog[]>([]);
  const [procForm, setProcForm] = useState({ name: '', notes: '', time: '' });
  const [showProcModal, setShowProcModal] = useState(false);

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

  // Preparar datos para gráfica
  const chartData = useMemo(() => {
    return (patient?.vitalsHistory || [])
      .slice(0, 10) // Últimos 10 registros
      .reverse()
      .map(v => {
        const [sys, dia] = v.bp.includes('/') ? v.bp.split('/').map(Number) : [0, 0];
        return {
          time: v.date.split(' ')[1]?.substring(0, 5) || '00:00',
          hr: v.hr,
          temp: v.temp,
          sys: sys || null,
          dia: dia || null
        };
      });
  }, [patient?.vitalsHistory]);

  const handleRegisterVitals = () => {
    if (!patient) return;
    const timestamp = new Date().toLocaleString('es-MX');
    const entry = { ...newVitals, date: timestamp };
    
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

  const handleSaveProcedure = () => {
      if (!procForm.name) return;
      const newProc: ProcedureLog = {
          id: Date.now().toString(),
          time: procForm.time || new Date().toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'}),
          procedure: procForm.name.toUpperCase(),
          notes: procForm.notes,
          nurse: nurseName
      };
      setProcedures([...procedures, newProc]);
      setShowProcModal(false);
      setProcForm({ name: '', notes: '', time: '' });
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
        procedures,
        habitus,
        observations,
        risks: { fall: fallRisk, ulcer: ulcerRisk, pain: painScale },
        balance: totalIngresos - totalEgresos, 
        vitalsSummary: patient?.vitalsHistory?.slice(0, 8) 
      },
      isSigned: true,
      hash: `CERT-ENF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    navigate(`/patient/${id}`);
  };

  const getRiskColor = (level: string) => {
      if (level.includes('Alto')) return 'bg-rose-500 text-white border-rose-600';
      if (level.includes('Medio') || level.includes('Moderado')) return 'bg-amber-400 text-amber-900 border-amber-500';
      return 'bg-emerald-500 text-white border-emerald-600';
  };

  const getPainColor = (score: number) => {
      if (score === 0) return 'bg-emerald-500';
      if (score <= 3) return 'bg-blue-400';
      if (score <= 6) return 'bg-amber-400';
      if (score <= 8) return 'bg-orange-500';
      return 'bg-rose-600';
  };

  if (!patient) return null;

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in space-y-8">
      
      {/* TOOLBAR */}
      <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-xl flex flex-wrap items-center justify-between gap-6 no-print">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg"><ChevronLeft size={20}/></button>
            <div>
               <h1 className="text-xl font-black text-slate-900 uppercase">Hoja de Enfermería</h1>
               <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Registros Clínicos • {sheetDate}</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <input type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black" value={sheetDate} onChange={e => setSheetDate(e.target.value)} />
            <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase" value={shift} onChange={e => setShift(e.target.value)}>
               <option>Matutino</option><option>Vespertino</option><option>Nocturno A</option><option>Nocturno B</option><option>Jornada Especial</option>
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
            <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest">Exp: {patient.id}</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">Cama: {patient.bedNumber || 'Sin Asignar'}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{patient.name}</h2>
            <div className="flex gap-6 mt-3 text-xs text-slate-500 font-bold uppercase">
               <span>Edad: {patient.age} Años</span>
               <span>Sexo: {patient.sex}</span>
               <span>Nac: {patient.curp.substring(4,10)}</span>
            </div>
          </div>
        </div>
        <div className="text-right space-y-2">
            <div className="flex items-center justify-end gap-2 text-rose-600">
                <AlertOctagon size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Alergias</p>
            </div>
            <p className="text-xl font-black text-rose-700 uppercase tracking-tight bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'NEGADAS'}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: GRÁFICAS Y SIGNOS */}
        <div className="lg:col-span-8 space-y-8">
          
           {/* HABITUS EXTERIOR */}
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                    <Eye size={14}/> Habitus Exterior / Valoración Inicial
                </h3>
                <textarea 
                    className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-medium text-slate-700 outline-none resize-none h-20 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    value={habitus}
                    onChange={e => setHabitus(e.target.value)}
                    placeholder="Descripción general del paciente al recibir turno..."
                />
           </div>

           {/* GRÁFICA DE SIGNOS VITALES */}
           <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden p-8">
               <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                        <Activity className="text-blue-600" size={18}/> Gráfica de Signos Vitales
                    </h3>
                    <button 
                      onClick={() => setShowVitalsModal(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md"
                    >
                        <Plus size={14}/> Nueva Toma
                    </button>
               </div>
               
               <div className="h-64 w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                />
                                <Line type="monotone" dataKey="sys" stroke="#3b82f6" strokeWidth={3} name="T.A. Sistólica" dot={{r: 4}} />
                                <Line type="monotone" dataKey="dia" stroke="#93c5fd" strokeWidth={3} name="T.A. Diastólica" dot={{r: 4}} />
                                <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={3} name="Frec. Cardiaca" dot={{r: 4}} />
                                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} name="Temp" dot={{r: 3}} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">
                            Sin datos para graficar
                        </div>
                    )}
               </div>

               <div className="mt-8 overflow-x-auto">
                    <table className="w-full text-center border-separate border-spacing-2">
                        <thead>
                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="pb-2">Hora</th>
                                <th className="pb-2">T.A.</th>
                                <th className="pb-2">F.C.</th>
                                <th className="pb-2">F.R.</th>
                                <th className="pb-2">Temp</th>
                                <th className="pb-2">SatO2</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patient.vitalsHistory?.slice(0, 6).map((v, i) => (
                                <tr key={i} className="group">
                                    <td className="bg-slate-50 rounded-lg p-2 text-[10px] font-bold">{v.date.split(' ')[1].substring(0,5)}</td>
                                    <td className="bg-blue-50 text-blue-700 rounded-lg p-2 text-[10px] font-black">{v.bp}</td>
                                    <td className="bg-rose-50 text-rose-700 rounded-lg p-2 text-[10px] font-black">{v.hr}</td>
                                    <td className="bg-emerald-50 text-emerald-700 rounded-lg p-2 text-[10px] font-black">{v.rr}</td>
                                    <td className="bg-amber-50 text-amber-700 rounded-lg p-2 text-[10px] font-black">{v.temp}°</td>
                                    <td className="bg-cyan-50 text-cyan-700 rounded-lg p-2 text-[10px] font-black">{v.o2}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
               </div>
           </div>
           
           {/* REGISTRO DE MEDICAMENTOS Y PROCEDIMIENTOS */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase flex items-center gap-2 text-slate-700">
                            <Pill className="w-4 h-4 text-purple-600" /> Medicamentos
                        </h3>
                        <button onClick={() => setShowMedModal(true)} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-600 hover:text-white transition-all"><Plus size={16}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-80 p-2 space-y-2 custom-scrollbar">
                        {medLogs.map((m) => (
                            <div key={m.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-start group hover:border-purple-200 transition-all">
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-800">{m.medName}</p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1">{m.dosage} • {m.time} hrs</p>
                                </div>
                                <div className={`p-1.5 rounded-lg ${m.status === 'Aplicado' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {m.status === 'Aplicado' ? <Check size={14}/> : <X size={14}/>}
                                </div>
                            </div>
                        ))}
                        {medLogs.length === 0 && <div className="text-center py-10 text-[9px] text-slate-400 font-bold uppercase opacity-50">Sin registros</div>}
                    </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase flex items-center gap-2 text-slate-700">
                            <ClipboardList className="w-4 h-4 text-blue-600" /> Procedimientos
                        </h3>
                        <button onClick={() => setShowProcModal(true)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Plus size={16}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-80 p-2 space-y-2 custom-scrollbar">
                        {procedures.map((p) => (
                            <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all">
                                <div className="flex justify-between items-start">
                                    <p className="text-xs font-black uppercase text-slate-800">{p.procedure}</p>
                                    <span className="text-[9px] font-mono font-bold text-slate-400">{p.time}</span>
                                </div>
                                {p.notes && <p className="text-[10px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg">"{p.notes}"</p>}
                            </div>
                        ))}
                        {procedures.length === 0 && <div className="text-center py-10 text-[9px] text-slate-400 font-bold uppercase opacity-50">Sin procedimientos</div>}
                    </div>
               </div>
           </div>
        </div>

        {/* COLUMNA DERECHA: RIESGOS, BALANCE Y CIERRE */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* SEMÁFORO DE RIESGOS */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ShieldCheck size={14}/> Valoración de Riesgos
                </h3>

                <div className="space-y-4">
                    {/* Riesgo Caídas */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500">
                            <span>Riesgo Caídas (Downton)</span>
                            <span>{fallRisk}</span>
                        </div>
                        <div className="flex gap-1">
                            {['Bajo', 'Medio', 'Alto'].map(lvl => (
                                <button 
                                    key={lvl} 
                                    onClick={() => setFallRisk(lvl as any)}
                                    className={`flex-1 h-3 rounded-full transition-all ${fallRisk === lvl ? getRiskColor(lvl) : 'bg-slate-100 hover:bg-slate-200'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Riesgo Úlceras */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500">
                            <span>Riesgo UPP (Braden)</span>
                            <span>{ulcerRisk}</span>
                        </div>
                        <div className="flex gap-1">
                            {['Sin Riesgo', 'Riesgo Moderado', 'Alto Riesgo'].map(lvl => (
                                <button 
                                    key={lvl} 
                                    onClick={() => setUlcerRisk(lvl as any)}
                                    className={`flex-1 h-3 rounded-full transition-all ${ulcerRisk === lvl ? getRiskColor(lvl) : 'bg-slate-100 hover:bg-slate-200'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Escala Dolor (EVA) */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex justify-between items-center">
                             <p className="text-[9px] font-black uppercase text-slate-500">Escala de Dolor (EVA)</p>
                             <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-white font-black text-sm ${getPainColor(painScale.score)}`}>{painScale.score}</span>
                        </div>
                        <input 
                            type="range" min="0" max="10" 
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                            value={painScale.score}
                            onChange={e => setPainScale({...painScale, score: parseInt(e.target.value)})}
                        />
                        <select 
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none"
                            value={painScale.location}
                            onChange={e => setPainScale({...painScale, location: e.target.value})}
                        >
                            <option>Sin dolor</option>
                            <option>Cefalea / Cabeza</option>
                            <option>Torácico / Precordial</option>
                            <option>Abdominal</option>
                            <option>Herida Quirúrgica</option>
                            <option>Extremidades</option>
                            <option>Generalizado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* BALANCE HÍDRICO */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center border-b border-white/10 pb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Droplets size={14} className="text-cyan-400"/> Balance de Líquidos
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => { setLiquidForm({id:'', concept:'SOLUCIÓN', amount:250, type:'Ingreso'}); setShowLiquidModal(true); }} className="p-1.5 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"><Plus size={14}/></button>
                        <button onClick={() => { setLiquidForm({id:'', concept:'URESIS', amount:250, type:'Egreso'}); setShowLiquidModal(true); }} className="p-1.5 bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors"><Plus size={14}/></button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 relative z-10 text-center">
                    <div className="bg-white/5 rounded-2xl p-4">
                        <p className="text-[9px] text-blue-300 uppercase tracking-widest mb-1">Ingresos</p>
                        <p className="text-2xl font-black">{totalIngresos}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                        <p className="text-[9px] text-rose-300 uppercase tracking-widest mb-1">Egresos</p>
                        <p className="text-2xl font-black">{totalEgresos}</p>
                    </div>
                </div>

                <div className="text-center relative z-10 pt-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Balance Total</p>
                    <p className={`text-4xl font-black tracking-tighter ${totalIngresos - totalEgresos > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalIngresos - totalEgresos > 0 ? '+' : ''}{totalIngresos - totalEgresos} <span className="text-sm text-white/50 font-bold">ml</span>
                    </p>
                </div>
            </div>

            {/* OBSERVACIONES */}
            <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-8 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase text-amber-800 tracking-widest flex items-center gap-2">
                    <FileText size={14}/> Observaciones de Enfermería
                </h3>
                <textarea 
                    className="w-full bg-white p-4 rounded-2xl text-xs font-medium text-slate-700 outline-none resize-none h-32 focus:ring-2 focus:ring-amber-200 transition-all border border-amber-100"
                    placeholder="Eventualidades, respuesta a tratamientos, pendientes..."
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                />
            </div>

            {/* CIERRE */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
                <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-center uppercase outline-none focus:bg-white transition-all"
                    value={nurseName}
                    onChange={e => setNurseName(e.target.value)}
                    placeholder="Nombre de la Enfermera(o)"
                />
                <button 
                    onClick={handleFinalSave}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={18}/> Cerrar Turno
                </button>
            </div>

        </div>
      </div>

      {/* MODALES REUTILIZABLES */}
      
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

      {/* MODAL PROCEDIMIENTOS */}
      {showProcModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-12 space-y-8">
                  <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-900 uppercase">Registrar Procedimiento</h3>
                      <button onClick={() => setShowProcModal(false)}><X size={24}/></button>
                  </div>
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nombre del Procedimiento</label>
                          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none" placeholder="Ej: Curación de herida, Sondaje..." value={procForm.name} onChange={e => setProcForm({...procForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Hora Realización</label>
                          <input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={procForm.time} onChange={e => setProcForm({...procForm, time: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Notas / Observaciones</label>
                          <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none resize-none h-24" placeholder="Detalles del procedimiento..." value={procForm.notes} onChange={e => setProcForm({...procForm, notes: e.target.value})} />
                      </div>
                      <button onClick={handleSaveProcedure} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all">Guardar</button>
                  </div>
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
