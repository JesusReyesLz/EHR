
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Users, AlertOctagon, CheckCircle2,
  Lock, PenTool, ShieldAlert, Info, Clock, LogOut
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface VoluntaryDischargeProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const VoluntaryDischarge: React.FC<VoluntaryDischargeProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    institution: 'Hospital General San Rafael / MedExpediente MX',
    address: 'Av. Insurgentes Sur 123, Ciudad de México',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    applicantName: patient?.name || '',
    applicantAge: patient?.age || '',
    relationship: 'PACIENTE (MISMO)',
    applicantAddress: patient?.address || '',
    clinicalSummary: '',
    diagnoses: '',
    suggestedMeasures: 'Continuar tratamiento ambulatorio, acudir a revisión externa, vigilar signos de alarma (fiebre, dolor intenso, hemorragia).',
    doctorInforming: 'Dr. Alejandro Méndez',
    cedulaInforming: '12345678'
  });

  const [isSigned, setIsSigned] = useState({
    applicant: false,
    doctor: true,
    witness1: false,
    witness2: false
  });

  if (!patient) return null;

  const handleSave = () => {
    if (!form.diagnoses || !isSigned.applicant) {
      alert("La firma del solicitante y los diagnósticos son obligatorios para este trámite legal.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `EV-${Date.now()}`,
      patientId: patient.id,
      type: 'Hoja de Egreso Voluntario',
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorInforming,
      content: { ...form },
      isSigned: true,
      hash: `CERT-EV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-rose-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Egreso Voluntario</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-004-SSA3-2012 • Numeral 10.2
            </p>
          </div>
        </div>
        <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 shadow-sm"><Printer size={20} /></button>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        {/* Establishment Info */}
        <div className="p-16 border-b border-slate-100 bg-slate-50/30 space-y-10">
           <div className="flex justify-between items-start">
              <div className="space-y-4">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Hospital General San Rafael</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{form.address}</p>
              </div>
              <div className="text-right">
                 <div className="bg-rose-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                    <LogOut size={16} /> Egreso No Programado
                 </div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora del Alta</p>
                 <p className="text-lg font-black text-slate-900 uppercase">{form.date} • {form.time} hrs</p>
              </div>
           </div>

           <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-6">
              <AlertOctagon className="w-10 h-10 text-rose-600 flex-shrink-0" />
              <p className="text-[11px] text-rose-900 font-black uppercase leading-relaxed tracking-tight italic">
                "AVISO: EL SIGUIENTE DOCUMENTO FORMALIZA LA SALIDA DEL PACIENTE CONTRA CONSEJO MÉDICO. EL SOLICITANTE ASUME TOTAL RESPONSABILIDAD DE LOS RIESGOS INHERENTES A ESTA DECISIÓN."
              </p>
           </div>
        </div>

        {/* Form Content */}
        <div className="p-16 space-y-16">
           {/* Section 1: Applicant Data */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><User size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">I. Datos del Solicitante</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" value={form.applicantName} onChange={e => setForm({...form, applicantName: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edad</label>
                       <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.applicantAge} onChange={e => setForm({...form, applicantAge: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parentesco</label>
                       <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" value={form.relationship} onChange={e => setForm({...form, relationship: e.target.value})} />
                    </div>
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Domicilio Completo</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium" value={form.applicantAddress} onChange={e => setForm({...form, applicantAddress: e.target.value})} />
                 </div>
              </div>
           </section>

           {/* Section 2: Clinical Data */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-900">II. Resumen Clínico y Diagnósticos</h3>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Diagnósticos de Ingreso y Actuales</label>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-24 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                      placeholder="CIE-10 o descripción detallada de padecimientos..."
                      value={form.diagnoses}
                      onChange={e => setForm({...form, diagnoses: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Estado Actual al Egreso</label>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-24 text-sm font-medium outline-none italic leading-relaxed"
                      placeholder="Resumen de la evolución y condiciones físicas del paciente..."
                      value={form.clinicalSummary}
                      onChange={e => setForm({...form, clinicalSummary: e.target.value})}
                    />
                 </div>
              </div>
           </section>

           {/* Section 3: Recommendations */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Info size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-900">III. Medidas Recomendadas (Tratamiento Externo)</h3>
              </div>
              <textarea 
                className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-32 text-sm outline-none font-bold focus:ring-4 focus:ring-emerald-50 transition-all leading-relaxed"
                value={form.suggestedMeasures}
                onChange={e => setForm({...form, suggestedMeasures: e.target.value})}
              />
           </section>

           {/* Legal Declaration */}
           <section className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl space-y-8 border-4 border-rose-500/20">
              <div className="flex items-center gap-6">
                 <ShieldAlert size={40} className="text-rose-500 animate-pulse" />
                 <h3 className="text-lg font-black uppercase tracking-tighter">Declaración Expresa de Deslinde de Responsabilidad</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed italic border-l-4 border-rose-600 pl-8">
                "Por medio de la presente, declaro que he sido informado ampliamente sobre los riesgos que implica el egreso del paciente en las condiciones actuales. Es mi voluntad y decisión solicitar el alta voluntaria, asumiendo todas las consecuencias que de esto pudieran derivarse, incluyendo el agravamiento del estado de salud o la muerte. Libero a esta institución y al personal médico tratante de cualquier responsabilidad civil, penal o administrativa relacionada con esta decisión."
              </p>
           </section>

           {/* Signatures Pad */}
           <section className="pt-20 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-16 no-print">
              <div className="space-y-6 text-center">
                 <div 
                   onClick={() => setIsSigned({...isSigned, applicant: true})}
                   className={`h-40 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all ${isSigned.applicant ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-slate-200 hover:border-rose-600 group'}`}
                 >
                    {isSigned.applicant ? (
                       <div className="text-rose-600 space-y-2">
                          <CheckCircle2 size={40} className="mx-auto" />
                          <p className="text-[9px] font-black uppercase">Firmado por Solicitante</p>
                       </div>
                    ) : (
                       <div className="text-slate-400 group-hover:text-rose-600">
                          <PenTool size={32} className="mx-auto" />
                          <p className="text-[9px] font-black uppercase mt-2">Sellar Firma Solicitante</p>
                       </div>
                    )}
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{form.applicantName || 'Paciente / Responsable'}</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Solicitante del Egreso</p>
              </div>

              <div className="space-y-6 text-center">
                 <div className="h-40 bg-blue-50/30 border-2 border-blue-600 rounded-[2.5rem] flex items-center justify-center">
                    <div className="text-blue-600 space-y-2">
                       <ShieldCheck size={40} className="mx-auto" />
                       <p className="text-[9px] font-black uppercase">Validado por Médico Tratante</p>
                    </div>
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{form.doctorInforming}</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Médico que autoriza • Céd. {form.cedulaInforming}</p>
              </div>
           </section>

           {/* Print Area Signatures */}
           <section className="hidden print:grid grid-cols-2 gap-20 pt-20">
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-xs font-black uppercase">{form.applicantName}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Firma del Solicitante</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-xs font-black uppercase">{form.doctorInforming}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre y Firma del Médico</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Firma de Testigo 1</p>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Firma de Testigo 2</p>
              </div>
           </section>
        </div>

        <div className="p-10 bg-slate-900 text-white flex justify-between items-center no-print">
           <div className="flex items-center gap-4">
              <Lock size={20} className="text-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Legalización Digital NOM-024 • ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center gap-3"
              >
                 <Save size={18} /> Finalizar Trámite de Egreso
              </button>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 2rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-5xl { max-width: 100% !important; }
          .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-rose-600 { background: #e11d48 !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #e2e8f0 !important; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </div>
  );
};

export default VoluntaryDischarge;
