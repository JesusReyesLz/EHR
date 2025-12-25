
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Activity, Pill, Droplets, 
  Trash2, Plus, Clock, Save, User, UserCheck, X, ClipboardList,
  AlertTriangle, CheckCircle2, Timer, Check, XCircle
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DiuresisEntry, MedicationLog } from '../types';

interface NursingSheetProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
  onUpdatePatient: (p: Patient) => void;
}

const NursingSheet: React.FC<NursingSheetProps> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const patient = patients.find(p => p.id === id);

  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [sheetDate, setSheetDate] = useState(location.state?.trendDate || getLocalDateString());
  const [shift, setShift] = useState('Matutino');

  // FILTRADO DE DATOS VINCULADOS (Mesa de Control)
  const vitalsForDay = useMemo(() => {
    if (!patient?.vitalsHistory) return [];
    const [y, m, d] = sheetDate.split('-');
    const pattern = `${parseInt(d)}/${parseInt(m)}/${y}`; 
    return patient.vitalsHistory.filter(v => v.date.startsWith(pattern) || v.date.includes(sheetDate));
  }, [patient, sheetDate]);

  const diuresisForDay = useMemo(() => {
    if (!patient?.diuresisHistory) return [];
    return patient.diuresisHistory.filter(d => d.date === sheetDate);
  }, [patient, sheetDate]);

  // MEDICACIÓN DEL TURNO
  const [medLogs, setMedLogs] = useState<MedicationLog[]>(patient?.medicationLogs?.filter(l => l.date === sheetDate) || []);

  const [form, setForm] = useState({
    habitus: 'Consciente, orientado, hidratado.',
    fallRisk: 'Bajo',
    evolution: 'Evolución estable en el turno.',
    observations: ''
  });

  const handleAddMed = () => {
    const name = prompt("Nombre del Medicamento:");
    if (!name) return;
    const newLog: MedicationLog = {
      id: Date.now().toString(),
      medName: name,
      dosage: '1 dosis',
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'Pendiente',
      nurse: 'Enf. Lucía R.',
      date: sheetDate
    };
    const updated = [newLog, ...medLogs];
    setMedLogs(updated);
    if (patient && onUpdatePatient) {
       onUpdatePatient({ ...patient, medicationLogs: [newLog, ...(patient.medicationLogs || [])] });
    }
  };

  const updateMedStatus = (logId: string, status: MedicationLog['status']) => {
    const updated = medLogs.map(l => l.id === logId ? { ...l, status } : l);
    setMedLogs(updated);
    if (patient && onUpdatePatient) {
       onUpdatePatient({ 
          ...patient, 
          medicationLogs: patient.medicationLogs?.map(l => l.id === logId ? { ...l, status } : l) || [] 
       });
    }
  };

  if (!patient) return null;

  const handleFinalSave = () => {
    if (vitalsForDay.length === 0) {
      alert("No se puede sellar la hoja sin registros de signos vitales para este día.");
      return;
    }

    const newNoteId = `ENF-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: patient.id,
      type: 'Hoja de Enfermería (Sábana de Control)',
      date: new Date().toLocaleString('es-MX'),
      author: 'Enf. Lucía Rodríguez',
      content: { 
        ...form, 
        vitalsList: vitalsForDay, 
        diuresisList: diuresisForDay, 
        medications: medLogs,
        shift, 
        sheetDate,
        summary: `Turno ${shift} finalizado. ${vitalsForDay.length} tomas registradas.`
      },
      isSigned: true,
      hash: `CERT-ENF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: { openNoteId: newNoteId } });
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-emerald-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 shadow-xl"><ChevronLeft size={20} /></button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Hoja de Enfermería</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">NOM-004-SSA3-2012 • Mesa de Control Técnico</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-4">
              <Calendar size={16} className="text-slate-400" />
              <input type="date" className="bg-transparent text-xs font-black outline-none" value={sheetDate} onChange={e => setSheetDate(e.target.value)} />
           </div>
           <select className="bg-emerald-600 text-white p-4 rounded-2xl text-[10px] font-black uppercase outline-none shadow-lg" value={shift} onChange={e => setShift(e.target.value)}>
              <option>Matutino</option><option>Vespertino</option><option>Nocturno</option>
           </select>
           <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 shadow-sm"><Printer size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">{patient.name.charAt(0)}</div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente Vinculado</p><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{patient.name}</h3></div>
             </div>
             <div className="grid grid-cols-3 gap-8">
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Cama</p><p className="text-xs font-black">{patient.bedNumber || 'BOX-01'}</p></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Edad</p><p className="text-xs font-black">{patient.age}A</p></div>
                <div><p className="text-[8px] font-black text-rose-500 uppercase">Alergias</p><p className="text-xs font-black text-rose-600 truncate">{patient.allergies[0] || 'NEGADAS'}</p></div>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Activity className="w-5 h-5 mr-3 text-emerald-600" /> Sábana de Signos Vitales (Hoy)</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-center">
                   <thead className="bg-white text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                      <tr><th className="p-4">HORARIO</th><th className="p-4">TEMP</th><th className="p-4">F.C.</th><th className="p-4">F.R.</th><th className="p-4">T.A.</th><th className="p-4">SAT O2</th><th className="p-4">PESO</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-black text-xs text-slate-700">
                      {vitalsForDay.map((v, i) => (
                         <tr key={i} className="hover:bg-emerald-50/30">
                            <td className="p-4 bg-slate-50/50">{v.date.split(', ')[1]}</td>
                            <td className="p-4 text-emerald-700">{v.temp}°C</td>
                            <td className="p-4">{v.hr}</td>
                            <td className="p-4">{v.rr}</td>
                            <td className="p-4 font-black">{v.bp}</td>
                            <td className="p-4 text-blue-600">{v.o2}%</td>
                            <td className="p-4 text-slate-400">{v.weight}kg</td>
                         </tr>
                      ))}
                      {vitalsForDay.length === 0 && (
                        <tr><td colSpan={7} className="p-12 text-center text-slate-300 font-black uppercase text-[10px]">Sin tomas registradas en la ficha para hoy</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Pill className="w-5 h-5 mr-3 text-blue-600" /> Control de Medicación por Turno</h3>
                <button onClick={handleAddMed} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-slate-900 transition-all">+ Aplicar Nuevo</button>
             </div>
             <div className="divide-y divide-slate-50">
                {medLogs.map((m) => (
                   <div key={m.id} className="p-6 flex items-center justify-between hover:bg-blue-50/20 transition-all">
                      <div className="flex items-center gap-6">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${m.status === 'Aplicado' ? 'bg-emerald-100 text-emerald-600' : m.status === 'No Aplicado' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}><Clock size={18} /></div>
                         <div><p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{m.medName}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{m.time} • {m.nurse}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={() => updateMedStatus(m.id, 'Aplicado')} className={`p-3 rounded-xl transition-all ${m.status === 'Aplicado' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-emerald-50'}`}><Check size={16} /></button>
                         <button onClick={() => updateMedStatus(m.id, 'No Aplicado')} className={`p-3 rounded-xl transition-all ${m.status === 'No Aplicado' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-rose-50'}`}><X size={16} /></button>
                         <button onClick={() => setMedLogs(medLogs.filter(l => l.id !== m.id))} className="p-3 text-slate-200 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                   </div>
                ))}
                {medLogs.length === 0 && <div className="p-10 text-center text-slate-300 uppercase font-black text-[9px]">Sin medicamentos registrados en este turno</div>}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-24">
           <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 border-4 border-white/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center"><ClipboardList size={18} className="mr-3" /> Observaciones Turno</h3>
              <div className="space-y-6">
                 <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Habitus y Estado Mental</label><textarea className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none h-20" value={form.habitus} onChange={e => setForm({...form, habitus: e.target.value})} /></div>
                 <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Evolución Enfermería</label><textarea className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none h-32 italic" value={form.evolution} onChange={e => setForm({...form, evolution: e.target.value})} /></div>
              </div>
              <div className="p-6 bg-blue-600/20 border border-blue-500/30 rounded-2xl space-y-3">
                 <div className="flex justify-between items-center"><p className="text-[8px] font-black text-blue-400 uppercase">Eliminación Total (24h)</p><p className="text-sm font-black">{dailyDiuresis.reduce((a,b)=>a+b.amount,0)} ml</p></div>
              </div>
              <button onClick={handleFinalSave} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-white hover:text-emerald-700 transition-all flex items-center justify-center gap-3"><ShieldCheck size={20} /> Certificar y Guardar Hoja</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NursingSheet;
