import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, ClipboardCheck, Stethoscope, Activity, Heart, User, 
  History, Home, Award, Save, Eye, Microscope, ClipboardList, Thermometer, Wind, Scale, Ruler, HeartPulse,
  RefreshCw, CalendarCheck, AlertCircle
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../types';

const MedicalHistory: React.FC<{ 
  patients: Patient[], 
  notes: ClinicalNote[], 
  onUpdatePatient: (p: Patient) => void, 
  onSaveNote: (n: ClinicalNote) => void,
  doctorInfo?: DoctorInfo 
}> = ({ patients, notes, onUpdatePatient, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const patient = patients.find(p => p.id === id);
  const [activeStep, setActiveStep] = useState(0);
  
  // Estado para manejar si los datos vienen de un historial previo
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [noteId, setNoteId] = useState(`NOTE-HC-${id}-${Date.now()}`);

  const [form, setForm] = useState({
    identification: {
      religion: patient?.religion || '',
      escolaridad: patient?.education || '',
      contactoEmergencia: '',
      ocupacion: patient?.occupation || '',
      domicilioCompleto: patient?.address || '',
      grupoEtnico: '' 
    },
    hereditary: { diabetes: false, hypertension: false, cancer: false, cardiac: false, note: '' },
    personalPathological: { surgery: false, allergies: false, chronic: false, transfusions: false, note: '' },
    nonPathological: { housing: 'Urbana con todos los servicios', smoking: 'Negado', alcohol: 'Negado', drugAbuse: 'Negado', nutrition: 'Balanceada', note: '' },
    padecimientoActual: '',
    terapeuticaPrevia: '', 
    interrogatorioSistemas: '',
    exploracionVitals: {
        temp: '', bp: '', hr: '', rr: '', weight: '', height: '', bmi: ''
    },
    exploracionFisica: {
      habitusExterior: '',
      cabezaCuello: '',
      torax: '',
      abdomen: '',
      miembros: '',
      genitales: ''
    },
    resultadosEstudios: '',
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
    if (!patient) return;

    // 1. Revisar si hay un ID de nota específica para editar (Borrador o revisión)
    const specificNoteId = (location.state as any)?.openNoteId;
    if (specificNoteId) {
        const existingNote = notes.find(n => n.id === specificNoteId);
        if (existingNote) {
            setForm(existingNote.content as any);
            setNoteId(existingNote.id); // Mantener el ID si estamos editando
            return; // Salir, ya cargamos lo específico
        }
    }

    // 2. Si no es edición específica, buscar la ÚLTIMA Historia Clínica FIRMADA para precargar (Clonación)
    const previousHistory = notes
        .filter(n => n.patientId === id && n.type.includes('Historia Clínica') && n.isSigned)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (previousHistory) {
        setPrefilledDate(previousHistory.date);
        
        // Mezclar datos: Traer antecedentes viejos pero intentar usar vitales nuevos
        setForm(prev => {
            // Intentar obtener vitales actuales del monitor, si no, usar los de la nota vieja
            const currentVitals = patient.currentVitals ? {
                temp: patient.currentVitals.temp.toString(),
                bp: patient.currentVitals.bp,
                hr: patient.currentVitals.hr.toString(),
                rr: patient.currentVitals.rr.toString(),
                weight: patient.currentVitals.weight.toString(),
                height: patient.currentVitals.height.toString(),
                bmi: patient.currentVitals.bmi.toString()
            } : (previousHistory.content as any).exploracionVitals;

            return {
                ...prev, // Default structure
                ...(previousHistory.content as any), // Overwrite with old history data
                exploracionVitals: currentVitals || prev.exploracionVitals, // Use fresh vitals if avaiable
                // Reset some fields that should typically be fresh in a new history
                padecimientoActual: (previousHistory.content as any).padecimientoActual || '', // Keep or clear? Usually keep for reference in subsequent notes
            };
        });
    } else {
        // Si no hay historia previa, al menos precargar vitales del monitor si existen
        if (patient.currentVitals) {
            setForm(prev => ({
                ...prev,
                exploracionVitals: {
                    temp: patient.currentVitals?.temp.toString() || '',
                    bp: patient.currentVitals?.bp || '',
                    hr: patient.currentVitals?.hr.toString() || '',
                    rr: patient.currentVitals?.rr.toString() || '',
                    weight: patient.currentVitals?.weight.toString() || '',
                    height: patient.currentVitals?.height.toString() || '',
                    bmi: patient.currentVitals?.bmi.toString() || ''
                }
            }));
        }
    }
  }, [id, notes, patient, location.state]);

  if (!patient) return null;

  const handlePreSave = () => {
    const draftNote: ClinicalNote = {
      id: noteId, 
      patientId: patient.id,
      type: 'Historia Clínica Medica',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo?.name || 'Dr. Alejandro Méndez', 
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
        author: doctorInfo?.name || 'Dr. Alejandro Méndez',
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
      
      {/* BANNER DE PRECARGA INTELIGENTE */}
      {prefilledDate && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center justify-between animate-in slide-in-from-top-2 no-print">
              <div className="flex items-center gap-3 text-amber-800">
                  <RefreshCw size={16} className="text-amber-600" />
                  <p className="text-xs font-bold uppercase tracking-wide">
                      Datos pre-llenados de Historia Clínica anterior ({prefilledDate}). <span className="font-normal opacity-80">Verifique cambios y actualice signos vitales.</span>
                  </p>
              </div>
              <button 
                onClick={() => setPrefilledDate(null)} // Visual dismiss only
                className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-900"
              >
                  Entendido
              </button>
          </div>
      )}

      <div className="bg-white border-b-8 border-blue-600 p-10 rounded-t-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
            <ClipboardCheck size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Historia Clínica Integral</h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-3 flex items-center">
              <User size={12} className="mr-2" /> {patient.name} • {patient.age} años • EXP: {patient.id}
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
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b pb-4">Ficha de Identificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Grupo Étnico</label>
                  <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" value={form.identification.grupoEtnico} onChange={e => setForm({...form, identification: {...form.identification, grupoEtnico: e.target.value}})} placeholder="Ej: Indígena, Mestizo, Otro..." />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Religión</label>
                  <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.identification.religion} onChange={e => setForm({...form, identification: {...form.identification, religion: e.target.value}})} />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Escolaridad</label>
                  <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.identification.escolaridad} onChange={e => setForm({...form, identification: {...form.identification, escolaridad: e.target.value}})} />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Ocupación</label>
                  <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" value={form.identification.ocupacion} onChange={e => setForm({...form, identification: {...form.identification, ocupacion: e.target.value}})} />
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
                
                {/* Botones de Selección Rápida */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {['diabetes', 'hypertension', 'cancer', 'cardiac'].map(key => (
                      <button key={key} onClick={() => setForm({...form, hereditary: {...form.hereditary, [key]: !(form.hereditary as any)[key]}})} className={`p-5 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${(form.hereditary as any)[key] ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                         {key}
                      </button>
                   ))}
                </div>

                {/* Otros Antecedentes Heredofamiliares */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Otros Antecedentes Heredofamiliares</label>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none resize-none focus:bg-white focus:border-blue-400 transition-all" 
                        value={form.hereditary.note} 
                        onChange={e => setForm({...form, hereditary: {...form.hereditary, note: e.target.value}})} 
                        placeholder="Especifique otros antecedentes familiares relevantes (ej. Enf. Tiroidea, Autoinmunes...)" 
                    />
                </div>

                {/* Antecedentes Personales Patológicos */}
                <div className="space-y-2 pt-4 border-t border-slate-50">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Antecedentes Personales Patológicos</label>
                    <textarea 
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm outline-none resize-none focus:bg-white focus:border-blue-400 transition-all" 
                        value={form.personalPathological.note} 
                        onChange={e => setForm({...form, personalPathological: {...form.personalPathological, note: e.target.value}})} 
                        placeholder="Especifique cirugías, alergias, transfusiones, fracturas, hospitalizaciones previas..." 
                    />
                </div>
             </section>
             
             <section className="space-y-6">
                <div className="flex items-center gap-4 text-indigo-600 border-b border-indigo-50 pb-4">
                  <Home size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Personales No Patológicos y Toxicomanías</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Vivienda</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.nonPathological.housing} onChange={e => setForm({...form, nonPathological: {...form.nonPathological, housing: e.target.value}})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Hábitos / Toxicomanías / Adicciones</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={`${form.nonPathological.smoking} / ${form.nonPathological.alcohol} / ${form.nonPathological.drugAbuse}`} onChange={e => setForm({...form, nonPathological: {...form.nonPathological, smoking: e.target.value}})} placeholder="Tabaco, Alcohol, Drogas..." />
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
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Activity size={16} className="text-emerald-600 mr-3" /> Terapéutica Previa</label>
                <textarea 
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none" 
                    value={form.terapeuticaPrevia} 
                    onChange={e => setForm({...form, terapeuticaPrevia: e.target.value})} 
                    placeholder="Describa tratamientos previos: Convencional (fármacos), Alternativo o Tradicional (herbolaria, etc.)" 
                />
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Interrogatorio por Aparatos y Sistemas</label>
                <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm outline-none" value={form.interrogatorioSistemas} onChange={e => setForm({...form, interrogatorioSistemas: e.target.value})} placeholder="Respiratorio, cardiovascular, digestivo, genitourinario, musculoesquelético, neurológico..." />
              </div>
           </div>
        )}

        {activeStep === 3 && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              
              {/* Sección de Signos Vitales */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Signos Vitales y Somatometría</h4>
                    {prefilledDate && (
                        <div className="flex items-center gap-2">
                             <CalendarCheck size={12} className="text-amber-500" />
                             <span className="text-[9px] font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">Valores Actuales / Monitor</span>
                        </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      {[
                          { l: 'Temp (°C)', k: 'temp', i: <Thermometer size={12}/> },
                          { l: 'T/A (mmHg)', k: 'bp', i: <Activity size={12}/> },
                          { l: 'F.C. (lpm)', k: 'hr', i: <HeartPulse size={12}/> },
                          { l: 'F.R. (rpm)', k: 'rr', i: <Wind size={12}/> },
                          { l: 'Peso (kg)', k: 'weight', i: <Scale size={12}/> },
                          { l: 'Talla (cm)', k: 'height', i: <Ruler size={12}/> },
                          { l: 'IMC', k: 'bmi', i: <Activity size={12}/> }
                      ].map(v => (
                          <div key={v.k} className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">{v.i} {v.l}</label>
                              <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                value={(form.exploracionVitals as any)[v.k]}
                                onChange={e => setForm({...form, exploracionVitals: {...form.exploracionVitals, [v.k]: e.target.value}})}
                              />
                          </div>
                      ))}
                  </div>
              </div>

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
                   <h3 className="text-[10px] font-black uppercase tracking-widest">Resultados de Estudios Previos y Actuales</h3>
                </div>
                <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none" value={form.resultadosEstudios} onChange={e => setForm({...form, resultadosEstudios: e.target.value})} placeholder="Laboratorio, Gabinete..." />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2 flex items-center gap-2">
                      <Award className="text-blue-600 w-4 h-4" /> Diagnóstico (CIE-10) o Problemas Clínicos
                   </label>
                   <textarea className="w-full p-6 bg-slate-900 text-white rounded-2xl h-32 text-xs font-black uppercase outline-none shadow-xl" value={form.diagnosticoCIE10} onChange={e => setForm({...form, diagnosticoCIE10: e.target.value})} />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block ml-2 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Indicación Terapéutica y Pronóstico
                   </label>
                   <textarea 
                     className="w-full p-6 bg-blue-50/30 border border-blue-200 rounded-2xl h-32 text-sm font-bold outline-none" 
                     value={form.planTratamiento} 
                     onChange={e => setForm({...form, planTratamiento: e.target.value})} 
                     placeholder="Medicamentos, dosis, plan de manejo..." 
                   />
                   <input 
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium mt-2" 
                      placeholder="Pronóstico..."
                      value={form.pronostico}
                      onChange={e => setForm({...form, pronostico: e.target.value})}
                   />
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
                <p className="text-slate-500 max-w-md mx-auto text-sm font-medium uppercase leading-relaxed italic">"Al certificar, el documento quedará sellado digitalmente con Nombre, Cédula y Firma del Médico."</p>
                <div className="bg-slate-50 p-6 rounded-2xl inline-block text-left mt-4 border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Médico Responsable</p>
                    <p className="text-lg font-black text-slate-900">{doctorInfo?.name}</p>
                    <p className="text-xs font-mono text-slate-500">Cédula Prof: {doctorInfo?.cedula}</p>
                </div>
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