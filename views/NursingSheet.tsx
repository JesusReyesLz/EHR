
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, HeartPulse, Pill, Droplets, 
  Trash2, Plus, Clock, Save, User, Activity, Thermometer, Wind,
  ClipboardList, AlertTriangle, CheckCircle2, UserCheck
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface NursingSheetProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const NursingSheet: React.FC<NursingSheetProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [shift, setShift] = useState('Matutino');
  const [vitalsGrid, setVitalsGrid] = useState([
    { time: '08:00', temp: 36.5, hr: 72, rr: 18, bp: '120/80', o2: 98 },
    { time: '10:00', temp: 36.7, hr: 75, rr: 16, bp: '115/75', o2: 99 },
    { time: '12:00', temp: 36.6, hr: 70, rr: 16, bp: '120/80', o2: 98 },
  ]);

  const [medications, setMedications] = useState([
    { id: '1', med: 'Metformina 850mg', time: '08:00', route: 'Oral', status: 'Aplicado', nurse: 'Enf. Lucía R.' },
    { id: '2', med: 'Omeprazol 40mg', time: '07:00', route: 'IV', status: 'Aplicado', nurse: 'Enf. Lucía R.' }
  ]);

  const [fluids, setFluids] = useState({
    in: [
      { id: '1', type: 'Hartman 1000ml', qty: 500, time: '08:00' }
    ],
    out: [
      { id: '1', type: 'Diuresis', qty: 250, time: '10:00' }
    ]
  });

  const [form, setForm] = useState({
    habitus: 'Consciente, orientado, hidratado, sin facies dolorosa.',
    pain: '2/10',
    fallRisk: 'Bajo (Escala Downton)',
    procedures: 'Curación de herida quirúrgica en abdomen inferior. Sin signos de infección.',
    observations: 'Paciente tolera vía oral. Sin incidentes en el turno.'
  });

  if (!patient) return null;

  const handleSave = () => {
    const newNote: ClinicalNote = {
      id: `ENF-${Date.now()}`,
      patientId: patient.id,
      type: 'Hoja de Enfermería',
      date: new Date().toLocaleString('es-MX'),
      author: 'Enf. Lucía Rodríguez',
      content: { ...form, vitalsGrid, medications, fluids, shift },
      isSigned: true,
      hash: `CERT-ENF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-emerald-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Hoja de Enfermería</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-004-SSA3-2012 • Numeral 9.1
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <select 
             className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm"
             value={shift}
             onChange={e => setShift(e.target.value)}
           >
              <option>Matutino</option>
              <option>Vespertino</option>
              <option>Nocturno</option>
           </select>
           <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 shadow-sm"><Printer size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Ficha de Identificación Sábana */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">{patient.name.charAt(0)}</div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{patient.name}</h3>
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Edad</p><p className="text-xs font-black">{patient.age}A</p></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Sexo</p><p className="text-xs font-black">{patient.sex}</p></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Cama</p><p className="text-xs font-black">{patient.bedNumber || '01-H'}</p></div>
                <div><p className="text-[8px] font-black text-rose-500 uppercase">Alergias</p><p className="text-xs font-black text-rose-600 truncate max-w-[100px]">{patient.allergies[0] || 'N/A'}</p></div>
             </div>
          </div>

          {/* Gráfica y Signos Vitales (La Sábana) */}
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                  <Activity className="w-5 h-5 mr-3 text-emerald-600" /> Control de Signos Vitales por Horario
                </h3>
                <button 
                  onClick={() => setVitalsGrid([...vitalsGrid, { time: '14:00', temp: 36.5, hr: 70, rr: 18, bp: '120/80', o2: 98 }])}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all"
                >
                   <Plus size={14} /> Añadir Toma
                </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-center">
                   <thead>
                      <tr className="bg-white text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                         <th className="px-6 py-4">HORARIO</th>
                         <th className="px-6 py-4">TEMP (°C)</th>
                         <th className="px-6 py-4">F.C. (LPM)</th>
                         <th className="px-6 py-4">F.R. (RPM)</th>
                         <th className="px-6 py-4">T.A. (mmHg)</th>
                         <th className="px-6 py-4">SAT O2 (%)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-black text-xs text-slate-700">
                      {vitalsGrid.map((v, i) => (
                         <tr key={i} className="hover:bg-emerald-50/30">
                            <td className="px-6 py-4 bg-slate-50/50"><input type="time" defaultValue={v.time} className="bg-transparent text-center font-black outline-none w-16" /></td>
                            <td className="px-6 py-4"><input type="number" step="0.1" defaultValue={v.temp} className="bg-transparent text-center outline-none w-12 text-emerald-700" /></td>
                            <td className="px-6 py-4"><input type="number" defaultValue={v.hr} className="bg-transparent text-center outline-none w-12" /></td>
                            <td className="px-6 py-4"><input type="number" defaultValue={v.rr} className="bg-transparent text-center outline-none w-12" /></td>
                            <td className="px-6 py-4"><input type="text" defaultValue={v.bp} className="bg-transparent text-center outline-none w-16" /></td>
                            <td className="px-6 py-4"><input type="number" defaultValue={v.o2} className="bg-transparent text-center outline-none w-12 text-blue-600" /></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Ministración de Medicamentos */}
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                  <Pill className="w-5 h-5 mr-3 text-blue-600" /> Registro de Medicación del Turno
                </h3>
             </div>
             <div className="divide-y divide-slate-50">
                {medications.map((m) => (
                   <div key={m.id} className="p-6 flex items-center justify-between hover:bg-blue-50/20 transition-all">
                      <div className="flex items-center gap-6">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black"><Clock size={18} /></div>
                         <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{m.med}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{m.time} • {m.route} • {m.nurse}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase border border-emerald-100 flex items-center">
                            <UserCheck size={12} className="mr-2" /> {m.status}
                         </span>
                         <button onClick={() => setMedications(medications.filter(med => med.id !== m.id))} className="text-slate-200 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                   </div>
                ))}
             </div>
             <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Registrar administración</button>
             </div>
          </div>

          {/* Balance de Líquidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
                <div className="p-6 bg-emerald-50 text-emerald-700 border-b border-emerald-100 font-black text-[10px] uppercase tracking-widest flex items-center justify-between">
                   <div className="flex items-center"><Droplets size={16} className="mr-3" /> Ingresos (Soluciones/Oral)</div>
                   <button onClick={() => setFluids({...fluids, in: [...fluids.in, { id: Date.now().toString(), type: 'Nueva Solución', qty: 0, time: '12:00' }]})} className="hover:scale-110 transition-transform"><Plus size={16} /></button>
                </div>
                <div className="p-4 space-y-3">
                   {fluids.in.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex flex-col">
                            <input className="text-[9px] font-black uppercase bg-transparent outline-none" defaultValue={f.type} />
                            <span className="text-[8px] text-slate-400">{f.time}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <input className="w-12 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-black" defaultValue={f.qty} />
                            <span className="text-[8px] font-black uppercase">ml</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
                <div className="p-6 bg-rose-50 text-rose-700 border-b border-rose-100 font-black text-[10px] uppercase tracking-widest flex items-center justify-between">
                   <div className="flex items-center"><Droplets size={16} className="mr-3" /> Egresos (Diuresis/Vómito/Drenes)</div>
                   <button onClick={() => setFluids({...fluids, out: [...fluids.out, { id: Date.now().toString(), type: 'Evacuación', qty: 0, time: '12:00' }]})} className="hover:scale-110 transition-transform"><Plus size={16} /></button>
                </div>
                <div className="p-4 space-y-3">
                   {fluids.out.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex flex-col">
                            <input className="text-[9px] font-black uppercase bg-transparent outline-none" defaultValue={f.type} />
                            <span className="text-[8px] text-slate-400">{f.time}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <input className="w-12 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-black" defaultValue={f.qty} />
                            <span className="text-[8px] font-black uppercase">ml</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Valoración */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
           {/* Valoración y Riesgos */}
           <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center">
                 <ClipboardList className="w-5 h-5 mr-3" /> Valoración de Enfermería
              </h3>

              <div className="space-y-4">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Habitus Exterior</label>
                 <textarea 
                   className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] h-24 text-[10px] font-medium outline-none focus:bg-white/10 italic leading-relaxed"
                   value={form.habitus}
                   onChange={e => setForm({...form, habitus: e.target.value})}
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase block ml-2">Dolor (EVA)</label>
                    <select className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black outline-none" value={form.pain} onChange={e => setForm({...form, pain: e.target.value})}>
                       {[0,1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={`${v}/10`} className="text-slate-900">{v}/10</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase block ml-2">Riesgo Caídas</label>
                    <select className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black outline-none" value={form.fallRisk} onChange={e => setForm({...form, fallRisk: e.target.value})}>
                       <option className="text-slate-900">Bajo</option>
                       <option className="text-slate-900">Medio</option>
                       <option className="text-slate-900">Alto</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Procedimientos Realizados</label>
                 <textarea 
                   className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] h-28 text-[10px] font-medium outline-none focus:bg-white/10 leading-relaxed"
                   value={form.procedures}
                   onChange={e => setForm({...form, procedures: e.target.value})}
                 />
              </div>
           </div>

           {/* Alertas Críticas */}
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                 <AlertTriangle className="w-5 h-5 mr-3 text-rose-500" /> Notas de Valoración
              </h3>
              <textarea 
                 className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 text-[10px] font-bold outline-none italic leading-relaxed"
                 value={form.observations}
                 onChange={e => setForm({...form, observations: e.target.value})}
                 placeholder="Observaciones de vigilancia especial..."
              />
           </div>

           <button 
             onClick={handleSave}
             className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 group"
           >
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> Certificar Hoja Turno
           </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 2rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-7xl { max-width: 100% !important; }
          .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #e2e8f0 !important; }
          .shadow-2xl, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          input, textarea { border: none !important; background: transparent !important; }
        }
      `}</style>
    </div>
  );
};

export default NursingSheet;
