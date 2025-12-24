
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ClipboardCheck, Stethoscope, Activity, Heart, User, 
  History, Home, Award, Save, Eye, Microscope, ClipboardList
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

const MedicalHistory: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient: (p: Patient) => void, onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onUpdatePatient, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);
  const [activeStep, setActiveStep] = useState(0);
  const [noteId] = useState(`NOTE-HC-${id}-${Date.now()}`);

  const [form, setForm] = useState({
    identification: {
      religion: patient?.religion || '',
      escolaridad: patient?.education || '',
      contactoEmergencia: '',
      ocupacion: patient?.occupation || '',
      domicilioCompleto: patient?.address || ''
    },
    hereditary: { diabetes: false, hypertension: false, cancer: false, cardiac: false, note: '' },
    personalPathological: { surgery: false, allergies: false, chronic: false, transfusions: false, note: '' },
    nonPathological: { housing: 'Urbana con todos los servicios', smoking: 'Negado', alcohol: 'Negado', drugAbuse: 'Negado', nutrition: 'Balanceada', note: '' },
    padecimientoActual: '',
    interrogatorioSistemas: '',
    exploracionFisica: {
      habitusExterior: '',
      cabezaCuello: '',
      torax: '',
      abdomen: '',
      miembros: '',
      genitales: ''
    },
    resultadosEstudios: '',
    terapeuticaPrevia: '',
    diagnosticoCIE10: '',
    planTratamiento: '',
    seguimiento: '',
    pronostico: 'Bueno para la vida y la función.'
  });

  const steps = [
    { title: 'Identificación', icon: <User className="w-4 h-4" /> },
    { title: 'Antecedentes', icon: <History className="w-4 h-4" /> },
    { title: 'Interrogatorio', icon: <Stethoscope className="w-4 h-4" /> },
    { title: 'Exploración Física', icon: <Activity className="w-4 h-4" /> },
    { title: 'Plan y Tratamiento', icon: <ClipboardList className="w-4 h-4" /> },
    { title: 'Certificación', icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  useEffect(() => {
    // Si la nota ya existe y está firmada, bloqueamos edición
    const existing = notes.find(n => n.patientId === id && n.type.includes('Historia'));
    if (existing?.isSigned) {
       navigate(`/patient/${id}`, { state: { openNoteId: existing.id } });
    } else if (existing) {
       // Fix: Cast existing.content to any to fix property mismatch with complex state object
       setForm(existing.content as any);
    }
  }, [id, notes, navigate]);

  if (!patient) return null;

  const handlePreSave = () => {
    const draftNote: ClinicalNote = {
      id: noteId, 
      patientId: patient.id,
      type: 'Historia Clínica Medica',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form, isDraft: true },
      isSigned: false,
      hash: 'REVISIÓN-EN-PROCESO'
    };
    onSaveNote(draftNote);
    navigate(`/patient/${id}`, { state: { openNoteId: noteId } });
  };

  const handleFinish = () => {
    const legalMsg = "¿Desea finalizar la nota y generar el documento ahora o seguir editando?\n\n(Al finalizar, el registro será inmutable conforme a la NOM-004)";
    
    if (window.confirm(legalMsg)) {
      const finalNote: ClinicalNote = {
        id: noteId, 
        patientId: patient.id,
        type: 'Historia Clínica Medica',
        date: new Date().toLocaleString('es-MX'),
        author: 'Dr. Alejandro Méndez',
        content: { ...form, isDraft: false },
        isSigned: true,
        hash: `CERT-HC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };
      onSaveNote(finalNote);
      navigate(`/patient/${id}`, { state: { openNoteId: noteId, isNewHC: true } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 animate-in fade-in">
      <div className="bg-white border-b-8 border-blue-600 p-10 rounded-t-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
            <ClipboardCheck size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Historia Clínica Integral</h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-3 flex items-center">
              <User size={12} className="mr-2" /> {patient.name} • {patient.age} años
            </p>
          </div>
        </div>
        <div className="flex gap-4">
           <button onClick={handlePreSave} className="px-8 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-3 border border-slate-200">
              <Save size={16} className="text-blue-600" /> Guardar Avance
           </button>
           <div className="flex bg-slate-100 p-2 rounded-2xl gap-1 items-center">
             {steps.map((_, i) => (
               <div key={i} className={`w-3 h-3 rounded-full transition-all ${activeStep >= i ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
             ))}
           </div>
        </div>
      </div>

      <div className="flex bg-white border-b border-slate-100 p-2 gap-2 overflow-x-auto no-scrollbar">
        {steps.map((step, i) => (
          <button key={i} onClick={() => setActiveStep(i)} className={`flex-shrink-0 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeStep === i ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
            {step.icon} {step.title}
          </button>
        ))}
      </div>

      <div className="bg-white p-12 shadow-2xl min-h-[600px] border-x border-slate-100">
        {activeStep === 0 && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Religión</label>
                  <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.identification.religion} onChange={e => setForm({...form, identification: {...form.identification, religion: e.target.value}})} />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Escolaridad</label>
                  <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.identification.escolaridad} onChange={e => setForm({...form, identification: {...form.identification, escolaridad: e.target.value}})} />
               </div>
               <div className="col-span-full space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2 text-rose-600">Contacto de Emergencia (Nombre y Teléfono)</label>
                  <input className="w-full p-5 bg-slate-50 border border-rose-100 rounded-2xl text-sm font-black uppercase" value={form.identification.contactoEmergencia} onChange={e => setForm({...form, identification: {...form.identification, contactoEmergencia: e.target.value}})} />
               </div>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div className="space-y-12 animate-in slide-in-from-right-4">
             <section className="space-y-6">
                <div className="flex items-center gap-4 text-blue-600 border-b border-blue-50 pb-4">
                  <Heart size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Heredofamiliares y Personales Patológicos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {['diabetes', 'hypertension', 'cancer', 'cardiac'].map(key => (
                      <button key={key} onClick={() => setForm({...form, hereditary: {...form.hereditary, [key]: !(form.hereditary as any)[key]}})} className={`p-5 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${(form.hereditary as any)[key] ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                         {key}
                      </button>
                   ))}
                </div>
                <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm" value={form.personalPathological.note} onChange={e => setForm({...form, personalPathological: {...form.personalPathological, note: e.target.value}})} placeholder="Especifique cirugías, alergias, transfusiones..." />
             </section>
             <section className="space-y-6">
                <div className="flex items-center gap-4 text-indigo-600 border-b border-indigo-50 pb-4">
                  <Home size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Personales No Patológicos</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Vivienda</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.nonPathological.housing} onChange={e => setForm({...form, nonPathological: {...form.nonPathological, housing: e.target.value}})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Hábitos</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={`${form.nonPathological.smoking} / ${form.nonPathological.alcohol}`} onChange={e => setForm({...form, nonPathological: {...form.nonPathological, smoking: e.target.value}})} />
                   </div>
                </div>
             </section>
          </div>
        )}

        {activeStep === 2 && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Stethoscope size={16} className="text-blue-600 mr-3" /> Padecimiento Actual</label>
                <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 text-sm outline-none shadow-inner" value={form.padecimientoActual} onChange={e => setForm({...form, padecimientoActual: e.target.value})} placeholder="Interrogatorio libre sobre síntomas y cronología..." />
              </div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Interrogatorio por Aparatos y Sistemas</label>
                <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm outline-none" value={form.interrogatorioSistemas} onChange={e => setForm({...form, interrogatorioSistemas: e.target.value})} placeholder="Respiratorio, cardiovascular, digestivo..." />
              </div>
           </div>
        )}

        {activeStep === 3 && (
           <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { label: 'Habitus Exterior', key: 'habitusExterior' },
                   { label: 'Cabeza y Cuello', key: 'cabezaCuello' },
                   { label: 'Tórax (Precordio, Campos Pulmonares)', key: 'torax' },
                   { label: 'Abdomen (Blando, Depresible, Peristalsis)', key: 'abdomen' },
                   { label: 'Miembros / Extremidades', key: 'miembros' },
                   { label: 'Genitales (si aplica)', key: 'genitales' }
                 ].map(item => (
                    <div key={item.key} className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">{item.label}</label>
                       <textarea 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-24 focus:bg-white focus:border-blue-400 transition-all outline-none" 
                        value={(form.exploracionFisica as any)[item.key]} 
                        onChange={e => setForm({...form, exploracionFisica: {...form.exploracionFisica, [item.key]: e.target.value}})} 
                       />
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="space-y-6">
                <div className="flex items-center gap-4 text-emerald-700 border-b border-emerald-50 pb-4">
                   <Microscope size={20} />
                   <h3 className="text-[10px] font-black uppercase tracking-widest">Resultados de Estudios Previos</h3>
                </div>
                <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none" value={form.resultadosEstudios} onChange={e => setForm({...form, resultadosEstudios: e.target.value})} placeholder="Laboratorio, Gabinete..." />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2 flex items-center gap-2">
                      <Award className="text-blue-600 w-4 h-4" /> Diagnóstico (CIE-10)
                   </label>
                   <textarea className="w-full p-6 bg-slate-900 text-white rounded-2xl h-32 text-xs font-black uppercase outline-none shadow-xl" value={form.diagnosticoCIE10} onChange={e => setForm({...form, diagnosticoCIE10: e.target.value})} />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block ml-2 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Plan de Tratamiento y Seguimiento
                   </label>
                   <textarea className="w-full p-6 bg-blue-50/30 border border-blue-200 rounded-2xl h-32 text-sm font-bold outline-none" value={form.planTratamiento} onChange={e => setForm({...form, planTratamiento: e.target.value})} placeholder="Medicamentos, dosis, citas de control..." />
                </div>
             </div>
          </div>
        )}

        {activeStep === 5 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-12 animate-in zoom-in-95">
             <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-xl border border-blue-100">
                <ShieldCheck size={64} />
             </div>
             <div className="text-center space-y-4">
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Certificación de Expediente</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm font-medium uppercase leading-relaxed italic">"Al certificar, el documento quedará sellado digitalmente y se integrará al expediente clínico en orden cronológico."</p>
             </div>
          </div>
        )}
      </div>

      <div className="p-12 bg-slate-50 rounded-b-[3rem] border border-slate-100 flex justify-between items-center shadow-inner">
         <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} className="px-12 py-5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Anterior</button>
         <div className="flex gap-4">
            <button onClick={handlePreSave} className="px-10 py-5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-3">
               <Eye size={18} /> Previsualizar
            </button>
            <button 
              onClick={() => activeStep < 5 ? setActiveStep(prev => prev + 1) : handleFinish()} 
              className="px-16 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3"
            >
              {activeStep < 5 ? 'Siguiente Sección' : 'Finalizar y Certificar Historia'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
