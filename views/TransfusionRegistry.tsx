
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Droplet, 
  Save, User, Landmark, AlertTriangle, CheckCircle2,
  Lock, PenTool, ClipboardCheck, Info, Clock, HeartPulse,
  Thermometer, Activity, Wind, UserCheck, AlertCircle
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface TransfusionRegistryProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const TransfusionRegistry: React.FC<TransfusionRegistryProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    hemocomponentType: 'Paquete Globular',
    volume: '250',
    unitId: '', // ID de Trazabilidad Obligatorio
    unitGroup: 'O',
    unitRh: '+',
    startTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    endTime: '',
    date: new Date().toISOString().split('T')[0],
    incidents: 'Sin incidentes reportados.',
    hasAdverseReaction: false,
    reactionType: '',
    reactionManagement: '',
    indicatedBy: 'Dr. Alejandro Méndez',
    performedBy: 'Enf. Lucía Rodríguez',
  });

  const [vitals, setVitals] = useState([
    { stage: 'Basal', time: '', bp: '', hr: '', temp: '', rr: '', o2: '' },
    { stage: '15 min (Crítica)', time: '', bp: '', hr: '', temp: '', rr: '', o2: '' },
    { stage: 'Trans-transfusión', time: '', bp: '', hr: '', temp: '', rr: '', o2: '' },
    { stage: 'Post-transfusión', time: '', bp: '', hr: '', temp: '', rr: '', o2: '' },
  ]);

  const [verification, setVerification] = useState({
    nameCorrect: false,
    groupRhMatch: false,
    unitIntegrity: false,
    expirationValid: false
  });

  if (!patient) return null;

  const handleSave = () => {
    if (!form.unitId || !verification.groupRhMatch || !verification.nameCorrect) {
      alert("Es obligatorio registrar el ID de la unidad y realizar la verificación de seguridad (Checklist) para proceder.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `TRANS-${Date.now()}`,
      patientId: patient.id,
      type: 'Registro de Transfusión Sanguínea',
      date: new Date().toLocaleString('es-MX'),
      author: form.performedBy,
      // Fix: Rename vitals to monitoringVitals to avoid type conflict with ClinicalNote['content']['vitals'] which expects a Vitals object
      content: { ...form, monitoringVitals: vitals, verification },
      isSigned: true,
      hash: `CERT-NOM253-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  const updateVital = (index: number, field: string, value: string) => {
    const newVitals = [...vitals];
    (newVitals[index] as any)[field] = value;
    setVitals(newVitals);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-rose-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registro de Transfusión</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-253-SSA1-2012 • Trazabilidad Biológica
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-6 py-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
              <Droplet size={20} className="text-rose-600 animate-pulse" />
              <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Paciente: {patient.bloodType}</p>
           </div>
           <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 shadow-sm transition-all"><Printer size={20} /></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        
        {/* Section 1: Pre-Transfusion Checklist (CRITICAL) */}
        <div className="p-16 border-b border-slate-100 bg-slate-50/30 space-y-8">
           <div className="flex items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
              <ClipboardCheck size={24} className="text-rose-600" />
              <h3 className="text-sm font-black uppercase tracking-widest">I. Protocolo de Seguridad (Doble Verificación)</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'nameCorrect', label: 'Identidad del receptor correcta (Nombre/Expediente)' },
                { key: 'groupRhMatch', label: 'Grupo y Rh de la unidad compatible con el receptor' },
                { key: 'unitIntegrity', label: 'Unidad con sello íntegro y sin hemólisis visible' },
                { key: 'expirationValid', label: 'Vigencia de la unidad confirmada' }
              ].map(item => (
                <button 
                  key={item.key}
                  onClick={() => setVerification({...verification, [item.key]: !(verification as any)[item.key]})}
                  className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${
                    (verification as any)[item.key] 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-lg' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-rose-400'
                  }`}
                >
                   <span className="text-[10px] font-black uppercase tracking-tight leading-none text-left pr-4">{item.label}</span>
                   {(verification as any)[item.key] ? <CheckCircle2 size={24} /> : <AlertCircle size={24} className="opacity-30" />}
                </button>
              ))}
           </div>
        </div>

        {/* Section 2: Unit Data */}
        <div className="p-16 space-y-12">
           <div className="flex items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
              <Droplet size={24} className="text-rose-600" />
              <h3 className="text-sm font-black uppercase tracking-widest">II. Datos del Hemocomponente y Unidad</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">ID Único de Unidad (Etiq. Banco)</label>
                 <input 
                   className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black uppercase tracking-widest focus:ring-4 focus:ring-rose-50 outline-none"
                   placeholder="Escriba el Folio..."
                   value={form.unitId}
                   onChange={e => setForm({...form, unitId: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de Componente</label>
                 <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none" value={form.hemocomponentType} onChange={e => setForm({...form, hemocomponentType: e.target.value})}>
                    <option>Paquete Globular</option>
                    <option>Plasma Fresco Congelado</option>
                    <option>Concentrado Plaquetario</option>
                    <option>Crioprecipitado</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Volumen (ml)</label>
                 <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black" value={form.volume} onChange={e => setForm({...form, volume: e.target.value})} />
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Grupo Unidad</label>
                 <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black uppercase" value={form.unitGroup} onChange={e => setForm({...form, unitGroup: e.target.value})}>
                    <option>O</option><option>A</option><option>B</option><option>AB</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Rh Unidad</label>
                 <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black uppercase" value={form.unitRh} onChange={e => setForm({...form, unitRh: e.target.value})}>
                    <option>+</option><option>-</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora Inicio</label>
                 <input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora Término</label>
                 <input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
              </div>
           </div>
        </div>

        {/* Section 3: Vital Signs Monitoring */}
        <div className="p-16 bg-slate-50/50 space-y-10">
           <div className="flex items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
              <HeartPulse size={24} className="text-blue-600" />
              <h3 className="text-sm font-black uppercase tracking-widest">III. Monitoreo de Signos Vitales (NOM-253)</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-2">
                 <thead>
                    <tr className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                       <th className="px-4 py-2">Momento</th>
                       <th className="px-4 py-2">Hora</th>
                       <th className="px-4 py-2">T.A.</th>
                       <th className="px-4 py-2">F.C.</th>
                       <th className="px-4 py-2">Temp.</th>
                       <th className="px-4 py-2">F.R.</th>
                       <th className="px-4 py-2">SatO2</th>
                    </tr>
                 </thead>
                 <tbody>
                    {vitals.map((v, i) => (
                       <tr key={i} className="group">
                          <td className="p-4 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-700">{v.stage}</td>
                          <td className="p-2"><input type="time" className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-center" value={v.time} onChange={e => updateVital(i, 'time', e.target.value)} /></td>
                          <td className="p-2"><input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-center" placeholder="120/80" value={v.bp} onChange={e => updateVital(i, 'bp', e.target.value)} /></td>
                          <td className="p-2"><input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-center" placeholder="72" value={v.hr} onChange={e => updateVital(i, 'hr', e.target.value)} /></td>
                          <td className="p-2"><input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-center" placeholder="36.5" value={v.temp} onChange={e => updateVital(i, 'temp', e.target.value)} /></td>
                          <td className="p-2"><input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-center" placeholder="18" value={v.rr} onChange={e => updateVital(i, 'rr', e.target.value)} /></td>
                          <td className="p-2"><input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-center" placeholder="98" value={v.o2} onChange={e => updateVital(i, 'o2', e.target.value)} /></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Section 4: Reactions and Management */}
        <div className="p-16 space-y-12">
           <div className="flex items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
              <AlertTriangle size={24} className="text-amber-600" />
              <h3 className="text-sm font-black uppercase tracking-widest">IV. Reacciones Adversas e Incidentes</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <button 
                   onClick={() => setForm({...form, hasAdverseReaction: !form.hasAdverseReaction})}
                   className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${form.hasAdverseReaction ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                 >
                    <span className="text-[10px] font-black uppercase">¿Presentó Reacción Adversa Inmediata?</span>
                    {form.hasAdverseReaction ? <AlertCircle size={24} /> : <div className="w-6 h-6 border-2 border-slate-200 rounded-full"></div>}
                 </button>
                 {form.hasAdverseReaction && (
                    <div className="space-y-4 animate-in slide-in-from-top-4">
                       <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest ml-2">Tipo de Reacción (Fiebre, Rash, Choque...)</label>
                       <input className="w-full p-5 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-black" value={form.reactionType} onChange={e => setForm({...form, reactionType: e.target.value})} />
                    </div>
                 )}
              </div>
              <div className="space-y-4">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Manejo y Observaciones Finales</label>
                 <textarea 
                   className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-40 text-sm outline-none font-medium italic leading-relaxed"
                   value={form.reactionManagement || form.incidents}
                   onChange={e => setForm({...form, incidents: e.target.value})}
                 />
              </div>
           </div>
        </div>

        {/* Digital Signatures Pad */}
        <div className="p-16 bg-slate-900 text-white rounded-b-[3rem] space-y-12 no-print relative overflow-hidden">
           <Droplet className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-5" />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
              <div className="space-y-8 text-center">
                 <div className="h-48 border-2 border-dashed border-white/20 rounded-[3rem] flex flex-col items-center justify-center bg-white/5">
                    <ShieldCheck size={48} className="text-blue-400" />
                    <p className="text-[10px] font-black uppercase mt-4">Validado por Médico Indicante</p>
                    <p className="text-[8px] opacity-40 uppercase mt-1 tracking-widest">e.firma SAT Activa</p>
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase tracking-tight">{form.indicatedBy}</p>
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Médico Tratante • Ced. 12345678</p>
                 </div>
              </div>

              <div className="space-y-8 text-center">
                 <div className="h-48 border-2 border-dashed border-emerald-500/50 rounded-[3rem] flex flex-col items-center justify-center bg-emerald-50/5">
                    <UserCheck size={48} className="text-emerald-400" />
                    <p className="text-[10px] font-black uppercase mt-4 text-emerald-400">Firmado por Responsable de Turno</p>
                    <p className="text-[8px] text-emerald-500/50 uppercase mt-1 tracking-widest">Procedimiento Ejecutado</p>
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase tracking-tight">{form.performedBy}</p>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Personal que transfundió</p>
                 </div>
              </div>
           </div>

           <div className="pt-10 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <Lock size={20} className="text-blue-400" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Validación Electrónica NOM-024 • Cert: {(Math.random() * 1000000).toFixed(0)}</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-white transition-all">Descartar</button>
                 <button 
                   onClick={handleSave}
                   className="px-12 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-700 transition-all flex items-center gap-4"
                 >
                    <Save size={20} /> Certificar Registro Final
                 </button>
              </div>
           </div>
        </div>

        {/* Print Signatures Area */}
        <div className="hidden print:grid grid-cols-2 gap-20 p-20 pt-40">
           <div className="space-y-16 text-center">
              <div className="w-full border-b border-slate-900 h-1"></div>
              <div>
                 <p className="text-xs font-black uppercase">{form.indicatedBy}</p>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Firma del Médico que indicó</p>
              </div>
           </div>
           <div className="space-y-16 text-center">
              <div className="w-full border-b border-slate-900 h-1"></div>
              <div>
                 <p className="text-xs font-black uppercase">{form.performedBy}</p>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Firma de quien transfundió</p>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 1rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-6xl { max-width: 100% !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .bg-slate-50\/50 { background: #f8fafc !important; }
          .border { border: 1px solid #000 !important; }
          input, textarea { border-bottom: 1px solid #000 !important; background: transparent !important; border-radius: 0 !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default TransfusionRegistry;
