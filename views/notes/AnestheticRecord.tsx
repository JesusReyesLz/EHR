
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Clock, 
  Droplets, Syringe, Zap, Brain, Wind, Lock, 
  Plus, Trash2, FileText, AlertTriangle, Monitor
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals } from '../../types';

interface VitalLog {
  time: string;
  bp: string;
  hr: string;
  spo2: string;
  etco2: string;
  temp: string;
}

interface MedLog {
  time: string;
  drug: string;
  dose: string;
  route: string;
}

const AnestheticRecord: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // Estados para listas dinámicas
  const [monitoringLogs, setMonitoringLogs] = useState<VitalLog[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedLog[]>([]);
  const [newVital, setNewVital] = useState<VitalLog>({ time: '', bp: '', hr: '', spo2: '', etco2: '', temp: '' });
  const [newMed, setNewMed] = useState<MedLog>({ time: '', drug: '', dose: '', route: 'IV' });

  const [form, setForm] = useState({
    // Encabezado
    anesthesiologist: 'Dr. Roberto Cruz',
    surgeon: '',
    surgeryDate: new Date().toISOString().split('T')[0],
    procedure: '',
    
    // Tiempos Críticos
    anesthesiaStartTime: '',
    anesthesiaEndTime: '',
    surgeryStartTime: '',
    surgeryEndTime: '',
    
    // Técnica
    techniqueType: 'General Balanceada', // General, Regional, Sedación, Mixta
    airwayDevice: 'Tubo Endotraqueal', // Mascarilla Laringea, Puntas, etc.
    monitoringType: 'Tipo I + Capnografía + Relax. Muscular',
    patientPosition: 'Decúbito Dorsal',
    
    // Bloqueo Regional (Condicional)
    blockSite: '', // Epidural, Subaracnoideo, Plexo
    needleType: 'Touhy 17G',
    approach: 'Medial',
    levelPuncture: 'L2-L3',
    techniqueLocation: 'Pérdida de Resistencia', // Parestesia, Neuroestimulación, Eco
    catheter: 'No',
    levelSensory: '',
    levelMotor: '',
    
    // Balance Hídrico
    inCrystalloids: 0,
    inColloids: 0,
    inBloodProducts: 0,
    outBleeding: 0, // Sangrado estimado
    outUrine: 0,
    outEmesis: 0,
    
    // Cierre
    incidents: 'Sin incidentes ni accidentes.',
    exitStatus: 'Despierto, extubado, pasa a recuperación.',
    aldreteExit: '9', // Escala al salir de sala
    transportTo: 'UCPA (Recuperación)',
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  // Auto-cálculos
  const totalInput = useMemo(() => (Number(form.inCrystalloids)||0) + (Number(form.inColloids)||0) + (Number(form.inBloodProducts)||0), [form]);
  const totalOutput = useMemo(() => (Number(form.outBleeding)||0) + (Number(form.outUrine)||0) + (Number(form.outEmesis)||0), [form]);
  const balanceTotal = totalInput - totalOutput;

  useEffect(() => {
    if (patient && !noteId) {
       // Inicializar hora actual para log
       const now = new Date();
       setNewVital(prev => ({ ...prev, time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }));
       setNewMed(prev => ({ ...prev, time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }));
    }

    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content.formData);
        setMonitoringLogs(noteToEdit.content.monitoringLogs || []);
        setMedicationLogs(noteToEdit.content.medicationLogs || []);
      }
    }
  }, [noteId, notes, patient]);

  const addVitalLog = () => {
      if(!newVital.time || !newVital.bp) return;
      setMonitoringLogs([...monitoringLogs, newVital]);
      // Auto-increment time by 15 mins for next entry suggestion could be added here
      setNewVital({ ...newVital, bp: '', hr: '', spo2: '', etco2: '', temp: '' }); 
  };

  const addMedLog = () => {
      if(!newMed.drug || !newMed.dose) return;
      setMedicationLogs([...medicationLogs, newMed]);
      setNewMed({ ...newMed, drug: '', dose: '' });
  };

  const removeVital = (idx: number) => setMonitoringLogs(monitoringLogs.filter((_, i) => i !== idx));
  const removeMed = (idx: number) => setMedicationLogs(medicationLogs.filter((_, i) => i !== idx));

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.anesthesiaStartTime || !form.anesthesiaEndTime || monitoringLogs.length === 0) {
            alert("Debe registrar al menos los tiempos de anestesia y un registro de signos vitales.");
            return;
        }
        if (!window.confirm("¿Cerrar Hoja de Registro Anestésico? Esta acción finalizará la documentación del acto quirúrgico.")) return;
    }

    const currentNoteId = noteId || `ANEST-REC-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient!.id,
      type: 'Hoja de Registro Anestésico',
      date: new Date().toLocaleString('es-MX'),
      author: form.anesthesiologist,
      content: { formData: form, monitoringLogs, medicationLogs, balanceTotal },
      isSigned: finalize,
      hash: finalize ? `CERT-INTRAOP-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  if (!patient) return null;
  
  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6 animate-in fade-in">
       <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-2xl">
          <Lock className="w-10 h-10 text-emerald-400" />
       </div>
       <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Registro Transanestésico Cerrado</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">La bitácora de eventos y monitorización ha sido sellada y archivada.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-indigo-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registro Anestésico</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> NOM-006-SSA3-2011 • Transanestésico
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 text-indigo-700">
             <Clock size={20} />
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Duración Actual</p>
                 <p className="text-sm font-black uppercase">En Curso</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: TIEMPOS, TÉCNICA Y BALANCE */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* TIEMPOS */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Clock size={14}/> Cronometría
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Anestesia (Inicio / Fin)</label>
                        <div className="flex gap-2">
                            <input type="time" className="flex-1 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-900" value={form.anesthesiaStartTime} onChange={e => setForm({...form, anesthesiaStartTime: e.target.value})} />
                            <input type="time" className="flex-1 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-900" value={form.anesthesiaEndTime} onChange={e => setForm({...form, anesthesiaEndTime: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Cirugía (Inicio / Fin)</label>
                        <div className="flex gap-2">
                            <input type="time" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.surgeryStartTime} onChange={e => setForm({...form, surgeryStartTime: e.target.value})} />
                            <input type="time" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.surgeryEndTime} onChange={e => setForm({...form, surgeryEndTime: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* TÉCNICA */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Brain size={14}/> Técnica Anestésica
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo Principal</label>
                        <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.techniqueType} onChange={e => setForm({...form, techniqueType: e.target.value})}>
                            <option>General Balanceada</option>
                            <option>General TIVA</option>
                            <option>Bloqueo Neuraxial (Raquídeo/Epidural)</option>
                            <option>Bloqueo Regional Periférico</option>
                            <option>Sedación + Local</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Manejo Vía Aérea</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.airwayDevice} onChange={e => setForm({...form, airwayDevice: e.target.value})} />
                    </div>
                    
                    {/* CAMPOS ESPECÍFICOS DE BLOQUEO */}
                    {(form.techniqueType.includes('Bloqueo') || form.techniqueType.includes('Regional')) && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Detalle Regional</p>
                            <div className="grid grid-cols-2 gap-2">
                                <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="Sitio (L2-L3)" value={form.levelPuncture} onChange={e => setForm({...form, levelPuncture: e.target.value})} />
                                <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="Aguja (Touhy)" value={form.needleType} onChange={e => setForm({...form, needleType: e.target.value})} />
                                <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="Abordaje" value={form.approach} onChange={e => setForm({...form, approach: e.target.value})} />
                                <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="Técnica (Pérdida R.)" value={form.techniqueLocation} onChange={e => setForm({...form, techniqueLocation: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase">Nivel Alcanzado (Sens/Mot)</label>
                                <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="T4 / Bromage 3" value={form.levelSensory} onChange={e => setForm({...form, levelSensory: e.target.value})} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* BALANCE HÍDRICO */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Droplets size={14} className="text-cyan-400"/> Balance Hídrico
                    </h3>
                    <p className={`text-lg font-black ${balanceTotal > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{balanceTotal > 0 ? '+' : ''}{balanceTotal} ml</p>
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
        </div>

        {/* COLUMNA DERECHA: BITÁCORAS DE TIEMPO Y FÁRMACOS */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. SIGNOS VITALES (TIMELINE) */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Monitor size={14} className="text-blue-600"/> Monitoreo Transanestésico
                    </h4>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="p-3">Hora</th>
                                    <th className="p-3">T.A. (mmHg)</th>
                                    <th className="p-3">F.C. (lpm)</th>
                                    <th className="p-3">SpO2 (%)</th>
                                    <th className="p-3">EtCO2</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                                {monitoringLogs.map((log, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 font-mono">{log.time}</td>
                                        <td className="p-3">{log.bp}</td>
                                        <td className="p-3 text-rose-600">{log.hr}</td>
                                        <td className="p-3 text-blue-600">{log.spo2}</td>
                                        <td className="p-3 text-amber-600">{log.etco2}</td>
                                        <td className="p-3 text-right"><button onClick={() => removeVital(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button></td>
                                    </tr>
                                ))}
                                {/* Input Row */}
                                <tr className="bg-blue-50/30">
                                    <td className="p-2"><input type="time" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] text-center" value={newVital.time} onChange={e => setNewVital({...newVital, time: e.target.value})}/></td>
                                    <td className="p-2"><input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] text-center" placeholder="120/80" value={newVital.bp} onChange={e => setNewVital({...newVital, bp: e.target.value})}/></td>
                                    <td className="p-2"><input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] text-center" placeholder="72" value={newVital.hr} onChange={e => setNewVital({...newVital, hr: e.target.value})}/></td>
                                    <td className="p-2"><input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] text-center" placeholder="99" value={newVital.spo2} onChange={e => setNewVital({...newVital, spo2: e.target.value})}/></td>
                                    <td className="p-2"><input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] text-center" placeholder="35" value={newVital.etco2} onChange={e => setNewVital({...newVital, etco2: e.target.value})}/></td>
                                    <td className="p-2 text-right"><button onClick={addVitalLog} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"><Plus size={14}/></button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. MEDICAMENTOS Y AGENTES */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Syringe size={14} className="text-indigo-600"/> Medicamentos y Agentes Administrados
                    </h4>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="p-3">Hora</th>
                                    <th className="p-3">Fármaco / Agente</th>
                                    <th className="p-3">Dosis / Tasa</th>
                                    <th className="p-3">Vía</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                                {medicationLogs.map((log, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 font-mono">{log.time}</td>
                                        <td className="p-3 uppercase text-indigo-900">{log.drug}</td>
                                        <td className="p-3">{log.dose}</td>
                                        <td className="p-3 text-slate-500">{log.route}</td>
                                        <td className="p-3 text-right"><button onClick={() => removeMed(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button></td>
                                    </tr>
                                ))}
                                {/* Input Row */}
                                <tr className="bg-indigo-50/30">
                                    <td className="p-2"><input type="time" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] text-center" value={newMed.time} onChange={e => setNewMed({...newMed, time: e.target.value})}/></td>
                                    <td className="p-2"><input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] uppercase" placeholder="Fentanilo..." value={newMed.drug} onChange={e => setNewMed({...newMed, drug: e.target.value})}/></td>
                                    <td className="p-2"><input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px]" placeholder="100 mcg" value={newMed.dose} onChange={e => setNewMed({...newMed, dose: e.target.value})}/></td>
                                    <td className="p-2">
                                        <select className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px]" value={newMed.route} onChange={e => setNewMed({...newMed, route: e.target.value})}>
                                            <option>IV</option><option>Inhalada</option><option>Epidural</option><option>Subcutánea</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-right"><button onClick={addMedLog} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"><Plus size={14}/></button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. EVENTOS Y CIERRE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-600"/> Contingencias / Accidentes
                        </label>
                        <textarea 
                            className="w-full p-4 bg-amber-50/30 border border-amber-100 rounded-2xl h-24 text-xs font-medium resize-none outline-none text-amber-900" 
                            value={form.incidents} 
                            onChange={e => setForm({...form, incidents: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Wind size={14} className="text-emerald-600"/> Estado al Egreso de Sala
                        </label>
                        <textarea 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" 
                            value={form.exitStatus} 
                            onChange={e => setForm({...form, exitStatus: e.target.value})} 
                        />
                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Parcial
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4">
                    <Save size={20} /> Finalizar Registro
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnestheticRecord;
