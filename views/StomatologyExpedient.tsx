
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Smile, 
  Save, AlertTriangle, CheckCircle2,
  Lock, PenTool, ClipboardCheck, Info,
  Search, Droplets, HeartPulse, Sparkles
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface ToothState {
  id: number;
  status: 'Sano' | 'Caries' | 'Ausente' | 'Obturado' | 'Protesis' | 'Endodoncia';
  notes?: string;
}

const StomatologyExpedient: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [activeTab, setActiveTab] = useState<'history' | 'odontogram' | 'treatment'>('history');

  // Inicialización de 32 dientes
  const [odontogram, setOdontogram] = useState<ToothState[]>(
    Array.from({ length: 32 }, (_, i) => ({ id: i + 1, status: 'Sano' }))
  );

  const [form, setForm] = useState({
    bleedingHistory: 'Negado',
    anestheticAllergy: 'Negado',
    brushingFrequency: '3 veces al día',
    lastDentalVisit: '',
    chiefComplaint: '',
    oralExam: 'Mucosas bien hidratadas, sin lesiones aparentes.',
    hygieneIndex: 'Buena',
    diagnosis: '',
    treatmentPlan: 'Limpieza profunda, aplicación de flúor, resina en O.D. 16.',
    doctor: 'Dra. Elena Castellanos',
    cedula: '87654321'
  });

  const getToothColor = (status: string) => {
    switch(status) {
      case 'Caries': return 'bg-rose-500 text-white';
      case 'Ausente': return 'bg-slate-200 text-slate-400';
      case 'Obturado': return 'bg-blue-500 text-white';
      case 'Protesis': return 'bg-indigo-600 text-white';
      case 'Endodoncia': return 'bg-amber-500 text-white';
      default: return 'bg-white border-2 border-slate-200 text-slate-600';
    }
  };

  const handleToothClick = (toothId: number) => {
    const statuses: ToothState['status'][] = ['Sano', 'Caries', 'Ausente', 'Obturado', 'Protesis', 'Endodoncia'];
    setOdontogram(prev => prev.map(t => {
      if (t.id === toothId) {
        const currentIndex = statuses.indexOf(t.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...t, status: statuses[nextIndex] };
      }
      return t;
    }));
  };

  if (!patient) return null;

  const handleSave = () => {
    const newNote: ClinicalNote = {
      id: `ESTO-${Date.now()}`,
      patientId: patient.id,
      type: 'Expediente Clínico Estomatológico',
      date: new Date().toLocaleString('es-MX'),
      author: form.doctor,
      content: { ...form, odontogram },
      isSigned: true,
      hash: `CERT-NOM013-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-cyan-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-cyan-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Expediente Estomatológico</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-013-SSA2-2015 • Salud Bucal
            </p>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-sm">
           {[
             { id: 'history', label: 'Antecedentes', icon: <ClipboardCheck size={14} /> },
             { id: 'odontogram', label: 'Odontograma', icon: <Smile size={14} /> },
             { id: 'treatment', label: 'Plan Dental', icon: <Sparkles size={14} /> }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
             >
               {tab.icon} {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        
        <div className="p-16 space-y-12">
           
           {/* TAB 1: ANTECEDENTES ESPECÍFICOS */}
           {activeTab === 'history' && (
             <div className="space-y-12 animate-in slide-in-from-left-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 text-cyan-700 border-b border-cyan-50 pb-4">
                         <Droplets size={24} className="text-rose-600" />
                         <h3 className="text-sm font-black uppercase tracking-widest">Antecedentes de Hemorragia</h3>
                      </div>
                      <select 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase"
                        value={form.bleedingHistory}
                        onChange={e => setForm({...form, bleedingHistory: e.target.value})}
                      >
                         <option>Negado</option>
                         <option>Posterior a extracción</option>
                         <option>Trastorno de coagulación conocido</option>
                         <option>Uso de anticoagulantes</option>
                      </select>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 text-cyan-700 border-b border-cyan-50 pb-4">
                         <AlertTriangle size={24} className="text-amber-600" />
                         <h3 className="text-sm font-black uppercase tracking-widest">Alergia a Anestésicos Locales</h3>
                      </div>
                      <select 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase"
                        value={form.anestheticAllergy}
                        onChange={e => setForm({...form, anestheticAllergy: e.target.value})}
                      >
                         <option>Negado</option>
                         <option>Confirmada (Lidocaína)</option>
                         <option>Confirmada (Mepivacaína)</option>
                         <option>Sospecha / Reacción previa</option>
                      </select>
                   </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 space-y-8">
                   <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center">
                      <Info size={16} className="text-cyan-600 mr-3" /> Hábitos de Higiene y Motivo de Consulta
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Frecuencia de Cepillado</label>
                         <input className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-bold" value={form.brushingFrequency} onChange={e => setForm({...form, brushingFrequency: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Índice de Higiene Bucal</label>
                         <select className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase" value={form.hygieneIndex} onChange={e => setForm({...form, hygieneIndex: e.target.value})}>
                            <option>Excelente</option><option>Buena</option><option>Regular</option><option>Mala</option>
                         </select>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Motivo de la Atención Estomatológica</label>
                      <textarea className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] h-24 text-sm font-medium outline-none italic" value={form.chiefComplaint} onChange={e => setForm({...form, chiefComplaint: e.target.value})} placeholder="Ej: Dolor agudo en molar inferior..." />
                   </div>
                </div>
             </div>
           )}

           {/* TAB 2: ODONTOGRAMA INTERACTIVO */}
           {activeTab === 'odontogram' && (
             <div className="space-y-12 animate-in zoom-in-95">
                <div className="flex justify-between items-end">
                   <div className="space-y-2">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Registro Gráfico (Odontograma Inicial)</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Haga clic en un diente para cambiar su estado clínico.</p>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      {['Caries', 'Ausente', 'Obturado', 'Protesis', 'Endodoncia'].map(s => (
                         <div key={s} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getToothColor(s)}`}></div>
                            <span className="text-[8px] font-black uppercase text-slate-400">{s}</span>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 space-y-12 overflow-x-auto no-scrollbar">
                   {/* Arcada Superior */}
                   <div className="flex justify-center gap-4">
                      {odontogram.slice(0, 16).map(tooth => (
                         <button 
                           key={tooth.id}
                           onClick={() => handleToothClick(tooth.id)}
                           className={`w-12 h-16 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-110 shadow-sm border border-slate-200 ${getToothColor(tooth.status)}`}
                         >
                            <span className="text-[9px] font-black">{tooth.id}</span>
                            <div className="w-6 h-6 border border-white/20 rounded-md bg-white/10"></div>
                         </button>
                      ))}
                   </div>
                   
                   {/* Arcada Inferior */}
                   <div className="flex justify-center gap-4">
                      {odontogram.slice(16, 32).map(tooth => (
                         <button 
                           key={tooth.id}
                           onClick={() => handleToothClick(tooth.id)}
                           className={`w-12 h-16 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-110 shadow-sm border border-slate-200 ${getToothColor(tooth.status)}`}
                         >
                            <div className="w-6 h-6 border border-white/20 rounded-md bg-white/10"></div>
                            <span className="text-[9px] font-black">{tooth.id}</span>
                         </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Exploración Física Oral y Tejidos Peri-bucales</label>
                   <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-32 text-sm font-medium outline-none italic leading-relaxed shadow-inner" value={form.oralExam} onChange={e => setForm({...form, oralExam: e.target.value})} />
                </div>
             </div>
           )}

           {/* TAB 3: DIAGNÓSTICO Y PLAN */}
           {activeTab === 'treatment' && (
             <div className="space-y-10 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4 text-cyan-700 border-b border-cyan-50 pb-4">
                   <HeartPulse size={24} className="text-cyan-600" />
                   <h3 className="text-sm font-black uppercase tracking-widest">Dictamen y Plan de Tratamiento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Diagnóstico Presuntivo / CIE-10</label>
                      <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-40 text-sm font-black uppercase outline-none focus:bg-white focus:border-cyan-400 transition-all" value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} placeholder="Ej: K02.1 Caries de la dentina..." />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest block ml-2">Plan de Tratamiento Integral</label>
                      <textarea className="w-full p-8 bg-cyan-50/20 border border-cyan-100 rounded-[2.5rem] h-40 text-sm font-bold outline-none" value={form.treatmentPlan} onChange={e => setForm({...form, treatmentPlan: e.target.value})} />
                   </div>
                </div>

                <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-cyan-400"><ClipboardCheck size={24} /></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Consentimiento Específico</p>
                         <p className="text-xs text-slate-400 mt-1">Se requiere firma de consentimiento para procedimientos quirúrgicos dentales.</p>
                      </div>
                   </div>
                   <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Ver Plantilla Dental</button>
                </div>
             </div>
           )}
        </div>

        {/* Footer Acciones y Firma Digital */}
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center no-print overflow-hidden relative">
           <div className="absolute right-0 top-0 h-full w-64 bg-cyan-600/20 -skew-x-12 translate-x-32"></div>
           <div className="flex items-center gap-6 relative z-10">
              <Lock size={24} className="text-cyan-400" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Validación Estomatológica NOM-013</p>
                 <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">{form.doctor} • Ced. {form.cedula}</p>
              </div>
           </div>
           <div className="flex gap-4 relative z-10">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-white transition-colors">Descartar</button>
              <button 
                onClick={handleSave}
                className="px-12 py-5 bg-cyan-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4"
              >
                 <Save size={20} /> Certificar Expediente Dental
              </button>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0.5rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-6xl { max-width: 100% !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .bg-cyan-600 { background: #0891b2 !important; -webkit-print-color-adjust: exact; }
          .bg-slate-50 { background: #fff !important; }
          .border { border: 1px solid #000 !important; }
          @page { margin: 0.5cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default StomatologyExpedient;
