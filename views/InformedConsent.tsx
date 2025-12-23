
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Users, AlertTriangle, CheckCircle2,
  Lock, PenTool, ClipboardCheck, Info, Calendar
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface InformedConsentProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const InformedConsent: React.FC<InformedConsentProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    documentTitle: 'Consentimiento Informado para Procedimiento Quirúrgico e Invasivo',
    institution: 'Hospital General San Rafael / MedExpediente MX',
    location: 'Ciudad de México, México',
    date: new Date().toISOString().split('T')[0],
    authorizedAct: '',
    risks: '',
    benefits: '',
    contingencyAuth: true,
    witness1Name: '',
    witness1Address: '',
    witness2Name: '',
    witness2Address: '',
    responsibleLegal: '', // En caso de que el paciente no firme
    doctorInforming: 'Dr. Alejandro Méndez',
    cedulaInforming: '12345678'
  });

  const [isSigned, setIsSigned] = useState({
    patient: false,
    doctor: true,
    witness1: false,
    witness2: false
  });

  if (!patient) return null;

  const handleSave = () => {
    if (!form.authorizedAct || !form.risks || !isSigned.patient) {
      alert("Faltan campos obligatorios o firmas para legalizar el consentimiento.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `CONS-${Date.now()}`,
      patientId: patient.id,
      type: 'Carta de Consentimiento Informado',
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorInforming,
      content: { ...form },
      isSigned: true,
      hash: `CERT-CONS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consentimiento Informado</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-004-SSA3-2012 • Numeral 10.1
            </p>
          </div>
        </div>
        <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm"><Printer size={20} /></button>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        {/* Document Header (Formal) */}
        <div className="p-16 border-b border-slate-100 bg-slate-50/30 space-y-10">
           <div className="flex justify-between items-start">
              <div className="space-y-4">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter max-w-xl leading-none">{form.documentTitle}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{form.institution}</p>
              </div>
              <div className="text-right space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio de Expediente</p>
                 <p className="text-lg font-black text-blue-600">{patient.id}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lugar y Fecha</label>
                 <div className="flex gap-4">
                    <input className="flex-1 p-4 bg-white border border-slate-200 rounded-xl outline-none" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                    <input type="date" className="p-4 bg-white border border-slate-200 rounded-xl outline-none font-bold" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</label>
                 <p className="p-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-tight">{patient.name}</p>
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-16 space-y-16">
           <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Lock size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest">I. Acto Autorizado</h3>
              </div>
              <textarea 
                className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-32 text-sm outline-none font-bold uppercase focus:ring-4 focus:ring-blue-50 transition-all leading-relaxed"
                placeholder="Describa el procedimiento quirúrgico o intervención..."
                value={form.authorizedAct}
                onChange={e => setForm({...form, authorizedAct: e.target.value})}
              />
           </section>

           <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><AlertTriangle size={20} /></div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest">II. Riesgos y Complicaciones</h3>
                 </div>
                 <textarea 
                   className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-48 text-sm outline-none italic leading-relaxed"
                   placeholder="Mencione posibles riesgos y secuelas en lenguaje sencillo..."
                   value={form.risks}
                   onChange={e => setForm({...form, risks: e.target.value})}
                 />
              </div>
              <div className="space-y-6">
                 <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} /></div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest">III. Beneficios Esperados</h3>
                 </div>
                 <textarea 
                   className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-48 text-sm outline-none italic leading-relaxed"
                   placeholder="Objetivos de la intervención..."
                   value={form.benefits}
                   onChange={e => setForm({...form, benefits: e.target.value})}
                 />
              </div>
           </section>

           <section className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Info size={24} className="text-blue-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest">IV. Autorización para Atención de Contingencias</h3>
                 </div>
                 <button 
                   onClick={() => setForm({...form, contingencyAuth: !form.contingencyAuth})}
                   className={`w-14 h-8 rounded-full transition-all relative ${form.contingencyAuth ? 'bg-emerald-600' : 'bg-slate-700'}`}
                 >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${form.contingencyAuth ? 'left-7' : 'left-1'}`}></div>
                 </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                 "Autorizo al personal médico para que, en caso de presentarse una contingencia o emergencia durante el acto autorizado, realicen los procedimientos necesarios para preservar mi vida o integridad física, informando posteriormente a mis familiares."
              </p>
           </section>

           {/* Testigos Section */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><Users size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest">V. Testigos de la Autorización</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Testigo 1</p>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" placeholder="Nombre completo" value={form.witness1Name} onChange={e => setForm({...form, witness1Name: e.target.value})} />
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs" placeholder="Dirección completa" value={form.witness1Address} onChange={e => setForm({...form, witness1Address: e.target.value})} />
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Testigo 2</p>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" placeholder="Nombre completo" value={form.witness2Name} onChange={e => setForm({...form, witness2Name: e.target.value})} />
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs" placeholder="Dirección completa" value={form.witness2Address} onChange={e => setForm({...form, witness2Address: e.target.value})} />
                 </div>
              </div>
           </section>

           {/* Digital Signatures Pad */}
           <section className="pt-20 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-16 no-print">
              <div className="space-y-6 text-center">
                 <div 
                   onClick={() => setIsSigned({...isSigned, patient: true})}
                   className={`h-40 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all ${isSigned.patient ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-blue-600 group'}`}
                 >
                    {isSigned.patient ? (
                       <div className="text-emerald-600 space-y-2">
                          <CheckCircle2 size={40} className="mx-auto" />
                          <p className="text-[9px] font-black uppercase">Firmado por Paciente</p>
                       </div>
                    ) : (
                       <div className="text-slate-400 group-hover:text-blue-600">
                          <PenTool size={32} className="mx-auto" />
                          <p className="text-[9px] font-black uppercase mt-2">Sellar Firma Paciente</p>
                       </div>
                    )}
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{patient.name}</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paciente / Responsable Legal</p>
              </div>

              <div className="space-y-6 text-center">
                 <div className="h-40 bg-blue-50/30 border-2 border-blue-600 rounded-[2.5rem] flex items-center justify-center">
                    <div className="text-blue-600 space-y-2">
                       <ShieldCheck size={40} className="mx-auto" />
                       <p className="text-[9px] font-black uppercase">Validado e.firma Médico</p>
                    </div>
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{form.doctorInforming}</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Médico que informa • Céd. {form.cedulaInforming}</p>
              </div>
           </section>

           {/* Print Signatures (Simplified) */}
           <section className="hidden print:grid grid-cols-2 gap-20 pt-20">
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">{patient.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Firma del Paciente / Tutor</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">{form.doctorInforming}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nombre y Firma del Médico</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-xs font-black uppercase">{form.witness1Name || '____________________'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Firma Testigo 1</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-xs font-black uppercase">{form.witness2Name || '____________________'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Firma Testigo 2</p>
                 </div>
              </div>
           </section>
        </div>

        <div className="p-10 bg-slate-900 text-white flex justify-between items-center no-print">
           <div className="flex items-center gap-4">
              <Lock size={20} className="text-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Certificación NOM-024 • Hash: {Math.random().toString(36).substr(2, 12).toUpperCase()}</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Descartar</button>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3"
              >
                 <Save size={18} /> Legalizar Consentimiento
              </button>
           </div>
        </div>
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 p-8 rounded-[2.5rem] flex items-start no-print">
         <Info size={24} className="text-blue-600 mt-1 flex-shrink-0" />
         <div className="ml-6 space-y-2">
            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Aviso Legal Sanitario</p>
            <p className="text-xs text-blue-700 font-medium leading-relaxed italic">
               "El consentimiento informado es un proceso continuo, no solo un documento. Asegúrese de que el paciente haya comprendido perfectamente el alcance de la intervención antes de proceder a la firma digital."
            </p>
         </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 2rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-5xl { max-width: 100% !important; }
          .bg-slate-50 { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #e2e8f0 !important; }
          .shadow-2xl, .shadow-xl { box-shadow: none !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default InformedConsent;
