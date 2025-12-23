
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ClipboardCheck, Stethoscope, Activity, Heart, User, AlertCircle, 
  History, BookOpen, Home, Cigarette, Droplets, Microscope, Pill, Award
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

const MedicalHistory: React.FC<{ patients: Patient[], onUpdatePatient: (p: Patient) => void, onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onUpdatePatient, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);
  const [activeStep, setActiveStep] = useState(0);

  const [form, setForm] = useState({
    // Ficha de Identificación Extendida
    identification: {
      religion: patient?.religion || '',
      escolaridad: patient?.education || '',
      contactoEmergencia: '',
      ocupacion: patient?.occupation || '',
      domicilioCompleto: patient?.address || ''
    },
    // Antecedentes
    hereditary: { diabetes: false, hypertension: false, cancer: false, cardiac: false, note: '' },
    personalPathological: { surgery: false, allergies: false, chronic: false, transfusions: false, note: '' },
    nonPathological: { housing: 'Urbana con todos los servicios', smoking: 'Negado', alcohol: 'Negado', drugAbuse: 'Negado', nutrition: 'Balanceada', note: '' },
    // Clínica
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
    // Resultados y Terapéutica (NOM-004)
    resultadosEstudios: '',
    terapeuticaPrevia: '',
    diagnosticoCIE10: '',
    pronostico: 'Bueno para la vida y la función.'
  });

  const steps = [
    { title: 'Identificación', icon: <User className="w-4 h-4" /> },
    { title: 'Antecedentes', icon: <History className="w-4 h-4" /> },
    { title: 'Interrogatorio', icon: <Stethoscope className="w-4 h-4" /> },
    { title: 'Exploración Física', icon: <Activity className="w-4 h-4" /> },
    { title: 'Diagnóstico y Plan', icon: <Award className="w-4 h-4" /> },
    { title: 'Certificación', icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  if (!patient) return null;

  const handleFinish = () => {
    const newNote: ClinicalNote = {
      id: `NOTE-HC-${Date.now()}`,
      patientId: patient.id,
      type: 'Historia Clínica Medica',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: true,
      hash: `CERT-HC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 animate-in fade-in">
      {/* Header Fijo de la Historia Clínica */}
      <div className="bg-white border-b-8 border-blue-600 p-10 rounded-t-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
            <ClipboardCheck size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Historia Clínica Integral</h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-3 flex items-center">
              <User size={12} className="mr-2" /> {patient.name} • {patient.age} años • CURP: {patient.curp}
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-2 rounded-2xl gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${activeStep >= i ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
          ))}
        </div>
      </div>

      {/* Navegación por pasos */}
      <div className="flex bg-white border-b border-slate-100 p-2 gap-2 overflow-x-auto no-scrollbar">
        {steps.map((step, i) => (
          <button 
            key={i} 
            onClick={() => setActiveStep(i)}
            className={`flex-shrink-0 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeStep === i ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {step.icon} {step.title}
          </button>
        ))}
      </div>

      <div className="bg-white p-12 shadow-2xl min-h-[600px] border-x border-slate-100">
        
        {/* PASO 0: IDENTIFICACIÓN EXTENDIDA */}
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

        {/* PASO 1: ANTECEDENTES */}
        {activeStep === 1 && (
          <div className="space-y-12 animate-in slide-in-from-right-4">
             <section className="space-y-6">
                <div className="flex items-center gap-4 text-blue-600 border-b border-blue-50 pb-4">
                  <Heart size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Heredofamiliares y Personales Patológicos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {['diabetes', 'hypertension', 'cancer', 'cardiac'].map(key => (
                      <button 
                        key={key} 
                        onClick={() => setForm({...form, hereditary: {...form.hereditary, [key]: !(form.hereditary as any)[key]}})}
                        className={`p-5 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${(form.hereditary as any)[key] ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                      >
                         {key}
                      </button>
                   ))}
                </div>
                <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm" value={form.personalPathological.note} onChange={e => setForm({...form, personalPathological: {...form.personalPathological, note: e.target.value}})} placeholder="Especifique cirugías, traumatismos, alergias o transfusiones..." />
             </section>

             <section className="space-y-6">
                <div className="flex items-center gap-4 text-indigo-600 border-b border-indigo-50 pb-4">
                  <Home size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Personales No Patológicos (Estilo de Vida)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Vivienda e Higiene</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.nonPathological.housing} onChange={e => setForm({...form, nonPathological: {...form.nonPathological, housing: e.target.value}})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Hábitos (Tabaquismo/Alcohol/Drogas)</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-rose-700" value={`${form.nonPathological.smoking} / ${form.nonPathological.alcohol}`} onChange={e => setForm({...form, nonPathological: {...form.nonPathological, smoking: e.target.value}})} />
                   </div>
                </div>
             </section>
          </div>
        )}

        {/* PASO 2: INTERROGATORIO */}
        {activeStep === 2 && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Stethoscope size={16} className="text-blue-600 mr-3" /> Padecimiento Actual (Semiología)</label>
                <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 text-sm outline-none shadow-inner" value={form.padecimientoActual} onChange={e => setForm({...form, padecimientoActual: e.target.value})} placeholder="Motivo de consulta, evolución, síntomas..." />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><BookOpen size={16} className="text-emerald-600 mr-3" /> Interrogatorio por Aparatos y Sistemas</label>
                <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 text-sm outline-none shadow-inner" value={form.interrogatorioSistemas} onChange={e => setForm({...form, interrogatorioSistemas: e.target.value})} placeholder="Respiratorio, Cardiovascular, Digestivo, Genitourinario..." />
              </div>
           </div>
        )}

        {/* PASO 3: EXPLORACIÓN FÍSICA SEGMENTADA */}
        {activeStep === 3 && (
           <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Habitus Exterior</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-24" value={form.exploracionFisica.habitusExterior} onChange={e => setForm({...form, exploracionFisica: {...form.exploracionFisica, habitusExterior: e.target.value}})} placeholder="Estado de conciencia, marcha, facies..." />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Cabeza y Cuello</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-24" value={form.exploracionFisica.cabezaCuello} onChange={e => setForm({...form, exploracionFisica: {...form.exploracionFisica, cabezaCuello: e.target.value}})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Tórax y Abdomen</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-24" value={form.exploracionFisica.torax} onChange={e => setForm({...form, exploracionFisica: {...form.exploracionFisica, torax: e.target.value}})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Extremidades y Genitales</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-24" value={form.exploracionFisica.miembros} onChange={e => setForm({...form, exploracionFisica: {...form.exploracionFisica, miembros: e.target.value}})} />
                 </div>
              </div>
           </div>
        )}

        {/* PASO 4: RESULTADOS, TERAPÉUTICA Y DIAGNÓSTICOS */}
        {activeStep === 4 && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Microscope size={16} className="text-blue-600 mr-3" /> Resultados de Estudios (Laboratorio/Gabinete)</label>
                   <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm italic" value={form.resultadosEstudios} onChange={e => setForm({...form, resultadosEstudios: e.target.value})} placeholder="Incluya interpretaciones de estudios previos y actuales..." />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Pill size={16} className="text-amber-600 mr-3" /> Terapéutica Empleada Anteriormente</label>
                   <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm" value={form.terapeuticaPrevia} onChange={e => setForm({...form, terapeuticaPrevia: e.target.value})} placeholder="Fármacos utilizados anteriormente y resultados obtenidos..." />
                </div>
             </div>
             <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-xl space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-2">Diagnóstico o Problemas Clínicos (CIE-10)</label>
                   <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-black uppercase" value={form.diagnosticoCIE10} onChange={e => setForm({...form, diagnosticoCIE10: e.target.value})} placeholder="Código o descripción diagnóstica..." />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-2">Pronóstico Sanitario</label>
                   <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-bold" value={form.pronostico} onChange={e => setForm({...form, pronostico: e.target.value})} />
                </div>
             </div>
          </div>
        )}

        {/* PASO 5: CERTIFICACIÓN */}
        {activeStep === 5 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-12 animate-in zoom-in-95">
             <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-xl border border-blue-100">
                <ShieldCheck size={64} />
             </div>
             <div className="text-center space-y-4">
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Certificación de Expediente</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm font-medium uppercase leading-relaxed">Este documento se guardará como la base legal inmutable del expediente clínico conforme a la NOM-004-SSA3-2012.</p>
             </div>
             <div className="w-full max-w-sm pt-10 border-t border-slate-100 text-center">
                <div className="w-64 h-24 border-b-2 border-slate-900 mb-4 flex items-center justify-center mx-auto text-blue-100 italic text-2xl">Sello Electrónico SAT</div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Dr. Alejandro Méndez</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Cédula Prof. Especialidad 12345678</p>
             </div>
          </div>
        )}
      </div>

      {/* Footer de navegación de pasos */}
      <div className="p-12 bg-slate-50 rounded-b-[3rem] border border-slate-100 flex justify-between items-center shadow-inner">
         <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} className="px-12 py-5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Anterior</button>
         <button onClick={() => activeStep < 5 ? setActiveStep(prev => prev + 1) : handleFinish()} className="px-16 py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3">
           {activeStep < 5 ? 'Siguiente Sección' : 'Finalizar y Certificar Historia'}
         </button>
      </div>
    </div>
  );
};

export default MedicalHistory;
