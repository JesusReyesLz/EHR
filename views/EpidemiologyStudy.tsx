
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Activity, 
  Save, AlertTriangle, CheckCircle2,
  Lock, PenTool, ClipboardCheck, Info,
  MapPin, Microscope, Plane, Syringe, Calendar
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

const EpidemiologyStudy: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [activeTab, setActiveTab] = useState<'clinical' | 'exposure' | 'samples'>('clinical');

  const [form, setForm] = useState({
    diseaseUnderSurveillance: 'Dengue con signos de alarma',
    symptomsOnset: new Date().toISOString().split('T')[0],
    fever: true,
    rash: false,
    myalgia: true,
    arthralgia: true,
    headache: true,
    // Fix: rename bleeding to hasBleedingSymptom to avoid type conflict with ClinicalNote['content']['bleeding'] (string)
    hasBleedingSymptom: false,
    abdominalPain: true,
    otherSymptoms: '',
    travelHistory: 'Negado',
    recentTripDestination: '',
    exposureToKnownCase: false,
    vaccinationHistory: 'Esquema Completo (Pentavalente, Triple Viral)',
    sampleDate: '',
    sampleType: 'Suero / Sangre',
    labName: 'Laboratorio Estatal de Salud Pública (LESP)',
    caseClassification: 'Probable', // Probable, Confirmado, Descartado
    epiObservations: 'Paciente reside en zona con alta densidad de vectores. Se indica cerco epidemiológico en domicilio.'
  });

  if (!patient) return null;

  const handleSave = () => {
    if (!form.diseaseUnderSurveillance || !form.symptomsOnset) {
      alert("Es obligatorio registrar la enfermedad y la fecha de inicio de síntomas.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `EPI-${Date.now()}`,
      patientId: patient.id,
      type: 'Estudio Epidemiológico de Caso',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: true,
      hash: `CERT-NOM017-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-rose-900 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-900 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Estudio Epidemiológico</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-017-SSA2-2012 • Vigilancia Epidemiológica
            </p>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-sm">
           {[
             { id: 'clinical', label: 'Cuadro Clínico', icon: <Activity size={14} /> },
             { id: 'exposure', label: 'Exposición', icon: <Plane size={14} /> },
             { id: 'samples', label: 'Laboratorio', icon: <Microscope size={14} /> }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-rose-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
             >
               {tab.icon} {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        
        <div className="p-16 space-y-12">
           
           {/* TAB 1: CUADRO CLÍNICO */}
           {activeTab === 'clinical' && (
             <div className="space-y-12 animate-in slide-in-from-left-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Enfermedad Sujeta a Vigilancia</label>
                      <input 
                        className="w-full p-5 bg-rose-50/30 border-2 border-rose-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-rose-900 transition-all"
                        value={form.diseaseUnderSurveillance}
                        onChange={e => setForm({...form, diseaseUnderSurveillance: e.target.value})}
                        placeholder="Ej: Dengue, Sarampión, Tosferina..."
                      />
                   </div>
                   <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Fecha de Inicio de Síntomas</label>
                      <input 
                        type="date"
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none"
                        value={form.symptomsOnset}
                        onChange={e => setForm({...form, symptomsOnset: e.target.value})}
                      />
                   </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 space-y-8">
                   <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center">
                      <Info size={16} className="text-rose-900 mr-3" /> Sintomatología Presente (Checklist Epidemiológico)
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { key: 'fever', label: 'Fiebre' },
                        { key: 'rash', label: 'Exantema' },
                        { key: 'myalgia', label: 'Mialgias' },
                        { key: 'arthralgia', label: 'Artralgias' },
                        { key: 'headache', label: 'Cefalea' },
                        { key: 'hasBleedingSymptom', label: 'Hemorragia' },
                        { key: 'abdominalPain', label: 'Dolor Abdominal' }
                      ].map(item => (
                        <button 
                           key={item.key}
                           onClick={() => setForm({...form, [item.key]: !(form as any)[item.key]})}
                           className={`p-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${ (form as any)[item.key] ? 'bg-rose-900 text-white border-rose-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                           {item.label}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {/* TAB 2: ANTECEDENTES DE EXPOSICIÓN */}
           {activeTab === 'exposure' && (
             <div className="space-y-12 animate-in zoom-in-95">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 text-rose-900 border-b border-rose-50 pb-4">
                         <Plane size={24} className="text-rose-900" />
                         <h3 className="text-sm font-black uppercase tracking-widest">Historial de Viajes (15 días previos)</h3>
                      </div>
                      <select 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase"
                        value={form.travelHistory}
                        onChange={e => setForm({...form, travelHistory: e.target.value})}
                      >
                         <option>Negado</option>
                         <option>Nacional (Área endémica)</option>
                         <option>Internacional</option>
                         <option>Ignorado</option>
                      </select>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 text-rose-900 border-b border-rose-50 pb-4">
                         <Syringe size={24} className="text-blue-600" />
                         <h3 className="text-sm font-black uppercase tracking-widest">Antecedentes de Vacunación</h3>
                      </div>
                      <input 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold"
                        value={form.vaccinationHistory}
                        onChange={e => setForm({...form, vaccinationHistory: e.target.value})}
                        placeholder="Especifique biológicos..."
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">¿Contacto con casos similares o confirmados?</label>
                   <div className="flex gap-4">
                      <button onClick={() => setForm({...form, exposureToKnownCase: true})} className={`flex-1 p-5 rounded-2xl font-black text-xs uppercase border-2 transition-all ${form.exposureToKnownCase ? 'bg-rose-900 text-white border-rose-900' : 'bg-slate-50 text-slate-400 border-transparent'}`}>Sí</button>
                      <button onClick={() => setForm({...form, exposureToKnownCase: false})} className={`flex-1 p-5 rounded-2xl font-black text-xs uppercase border-2 transition-all ${!form.exposureToKnownCase ? 'bg-rose-900 text-white border-rose-900' : 'bg-slate-50 text-slate-400 border-transparent'}`}>No / Desconocido</button>
                   </div>
                </div>
             </div>
           )}

           {/* TAB 3: LABORATORIO Y LABORATORIO */}
           {activeTab === 'samples' && (
             <div className="space-y-10 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4 text-rose-900 border-b border-rose-50 pb-4">
                   <Microscope size={24} className="text-rose-900" />
                   <h3 className="text-sm font-black uppercase tracking-widest">Toma de Muestras y Laboratorio de Referencia</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Tipo de Muestra Enviada</label>
                      <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none" value={form.sampleType} onChange={e => setForm({...form, sampleType: e.target.value})} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-rose-900 uppercase tracking-widest block ml-2">Clasificación Inicial del Caso</label>
                      <select className="w-full p-5 bg-rose-900 text-white border-none rounded-2xl text-sm font-black uppercase outline-none shadow-xl" value={form.caseClassification} onChange={e => setForm({...form, caseClassification: e.target.value})}>
                         <option>Probable</option>
                         <option>Sospechoso</option>
                         <option>Confirmado</option>
                         <option>Descartado</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Observaciones Epidemiológicas y Acciones Realizadas</label>
                   <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-40 text-sm font-medium outline-none italic leading-relaxed" value={form.epiObservations} onChange={e => setForm({...form, epiObservations: e.target.value})} placeholder="Bloqueo vacunal, búsqueda intencionada de casos, etc..." />
                </div>
             </div>
           )}
        </div>

        {/* Footer Acciones y Firma Digital */}
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center no-print overflow-hidden relative">
           <div className="absolute right-0 top-0 h-full w-64 bg-rose-900/20 -skew-x-12 translate-x-32"></div>
           <div className="flex items-center gap-6 relative z-10">
              <Lock size={24} className="text-rose-400" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Validación SINAVE / NOM-017</p>
                 <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Certificación de Notificación Inmediata</p>
              </div>
           </div>
           <div className="flex gap-4 relative z-10">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-white transition-colors">Descartar</button>
              <button 
                onClick={handleSave}
                className="px-12 py-5 bg-rose-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4"
              >
                 <Save size={20} /> Guardar y Notificar Caso
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
          .bg-rose-900 { background: #4c0519 !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #000 !important; }
          @page { margin: 0.5cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default EpidemiologyStudy;
