
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Gavel, 
  Save, User, Landmark, AlertTriangle, CheckCircle2,
  Lock, PenTool, ShieldAlert, Info, Clock, Scale
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface MPNotificationProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const MPNotification: React.FC<MPNotificationProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    institution: 'Hospital General San Rafael / MedExpediente MX',
    address: 'Av. Insurgentes Sur 123, Ciudad de México',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    notifiedAct: '',
    injuryType: 'Herida por arma de fuego',
    injuryLocation: '',
    mpAgency: 'Agencia del Ministerio Público Especializada en Delitos contra la Vida',
    notifiedVia: 'Telefónica y Sistema ECE',
    officerName: '',
    doctorNotifying: 'Dr. Alejandro Méndez',
    cedulaNotifying: '12345678'
  });

  const [isSigned, setIsSigned] = useState(false);

  if (!patient) return null;

  const handleSave = () => {
    if (!form.notifiedAct || !form.injuryLocation || !isSigned) {
      alert("Es obligatorio completar la descripción del acto y firmar digitalmente la notificación legal.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `MP-${Date.now()}`,
      patientId: patient.id,
      type: 'Hoja de Notificación al Ministerio Público',
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorNotifying,
      content: { ...form },
      isSigned: true,
      hash: `CERT-MP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Notificación al Ministerio Público</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-004-SSA3-2012 • Numeral 10.3
            </p>
          </div>
        </div>
        <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm"><Printer size={20} /></button>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        {/* Document Header */}
        <div className="p-16 border-b border-slate-100 bg-slate-50/30 space-y-10">
           <div className="flex justify-between items-start">
              <div className="space-y-4">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Hospital General San Rafael</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Establecimiento de Salud de Segundo Nivel<br/>{form.address}</p>
              </div>
              <div className="text-right">
                 <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Gavel size={16} className="text-blue-400" /> Aviso Legal Sanitario
                 </div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha de Elaboración</p>
                 <p className="text-lg font-black text-slate-900 uppercase">{form.date} • {form.time} hrs</p>
              </div>
           </div>

           <div className="p-8 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-6">
              <AlertTriangle className="w-10 h-10 text-amber-600 flex-shrink-0" />
              <p className="text-[11px] text-amber-900 font-black uppercase leading-relaxed tracking-tight">
                "AVISO: EL MÉDICO TRATANTE TIENE LA OBLIGACIÓN LEGAL DE NOTIFICAR LOS CASOS EN QUE SE PRESUMAN LESIONES POR VIOLENCIA O ACTOS DELICTIVOS CONFORME A LA LEY GENERAL DE SALUD."
              </p>
           </div>
        </div>

        {/* Content Form */}
        <div className="p-16 space-y-16">
           {/* Section 1: Patient ID */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><User size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">I. Identificación del Paciente</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                    <p className="w-full p-5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black uppercase">{patient.name}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edad</label>
                       <p className="w-full p-5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold">{patient.age} Años</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sexo</label>
                       <p className="w-full p-5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold">{patient.sex}</p>
                    </div>
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CURP</label>
                    <p className="w-full p-5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-mono">{patient.curp}</p>
                 </div>
              </div>
           </section>

           {/* Section 2: Act Notified */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Scale size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-900">II. Acto Notificado y Descripción de Lesiones</h3>
              </div>
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Lesión Presunta</label>
                       <select 
                         className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase"
                         value={form.injuryType}
                         onChange={e => setForm({...form, injuryType: e.target.value})}
                       >
                          <option>Herida por arma de fuego</option>
                          <option>Herida por arma blanca</option>
                          <option>Contusiones por agresión física</option>
                          <option>Intoxicación sospechosa</option>
                          <option>Violencia sexual</option>
                          <option>Maltrato infantil</option>
                          <option>Otro tipo de violencia</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localización Anatómica</label>
                       <input 
                         className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" 
                         placeholder="Ej: Región torácica anterior, flanco izquierdo..."
                         value={form.injuryLocation}
                         onChange={e => setForm({...form, injuryLocation: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Descripción Detallada de la Situación</label>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-40 text-sm font-medium outline-none italic leading-relaxed focus:ring-4 focus:ring-indigo-50 transition-all"
                      placeholder="Describa el estado del paciente, el tipo de herida y cualquier información relevante para la autoridad judicial..."
                      value={form.notifiedAct}
                      onChange={e => setForm({...form, notifiedAct: e.target.value})}
                    />
                 </div>
              </div>
           </section>

           {/* Section 3: Legal Destination */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><Landmark size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">III. Datos de la Agencia Notificada</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agencia del Ministerio Público</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.mpAgency} onChange={e => setForm({...form, mpAgency: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vía de Notificación</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.notifiedVia} onChange={e => setForm({...form, notifiedVia: e.target.value})} />
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Oficial/Agente que recibe (si aplica)</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.officerName} onChange={e => setForm({...form, officerName: e.target.value})} placeholder="Opcional" />
                 </div>
              </div>
           </section>

           {/* Digital Signature Pad */}
           <section className="pt-20 border-t border-slate-100 no-print">
              <div className="max-w-md mx-auto space-y-6 text-center">
                 <div 
                   onClick={() => setIsSigned(true)}
                   className={`h-48 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all ${isSigned ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-600 group'}`}
                 >
                    {isSigned ? (
                       <div className="text-indigo-600 space-y-2">
                          <CheckCircle2 size={48} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Notificación Firmada Digitalmente</p>
                       </div>
                    ) : (
                       <div className="text-slate-400 group-hover:text-indigo-600">
                          <PenTool size={40} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase mt-3">Sellar y Firmar como Notificante</p>
                       </div>
                    )}
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase text-slate-900 tracking-tight">{form.doctorNotifying}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Médico que Notifica • Céd. {form.cedulaNotifying}</p>
                 </div>
              </div>
           </section>

           {/* Print Signatures Area */}
           <section className="hidden print:grid grid-cols-2 gap-20 pt-40">
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">{form.doctorNotifying}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nombre y Firma del Médico Informante</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">____________________</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sello del Establecimiento</p>
                 </div>
              </div>
           </section>
        </div>

        <div className="p-10 bg-slate-900 text-white flex justify-between items-center no-print">
           <div className="flex items-center gap-4">
              <Lock size={20} className="text-indigo-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Certificación de Aviso Legal • UUID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"
              >
                 <Save size={18} /> Emitir Notificación Legal
              </button>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 1.5rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-5xl { max-width: 100% !important; }
          .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-indigo-600 { background: #4f46e5 !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #e2e8f0 !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default MPNotification;
