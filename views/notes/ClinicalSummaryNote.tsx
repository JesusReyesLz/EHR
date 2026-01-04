
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, FileText, Activity, 
  AlertTriangle, User, Stethoscope, Microscope, 
  ClipboardList, Pill, Printer, CheckCircle2, AlertOctagon, HeartPulse
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

const ClinicalSummaryNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void, doctorInfo?: DoctorInfo }> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [form, setForm] = useState({
    // General
    attentionReason: '', // Motivo de la atención
    admissionDate: '',   // Fecha de inicio del padecimiento o ingreso
    
    // Antecedentes (Toxicomanías Detalladas)
    substanceAbuse: {
        alcohol: false,
        tobacco: false,
        drugs: false,
        details: 'Negados',
        frequency: ''
    },
    relevantHistory: '', // Antecedentes patológicos y no patológicos relevantes
    allergies: '', // Se precarga del paciente

    // Cuadro Clínico
    clinicalEvolution: '', // Evolución del padecimiento
    physicalExplorationSummary: '', // Resumen de exploración física
    
    // Diagnóstico
    diagnosticImpression: '', // Dx's (Impresión diagnóstica)
    labAndCabinetResults: '', // Resultados de estudios de laboratorio y gabinete
    
    // Terapéutica
    therapeuticEmployed: '', // Terapéutica empleada (Medicamentos, procedimientos)
    proceduresPerformed: '', // Procedimientos específicos realizados
    
    // Pronóstico y Estado
    patientStatus: 'Estable',
    prognosis: 'Reservado a evolución',
    recommendations: '',
    
    // Administrativo
    emissionDate: new Date().toLocaleString('es-MX'),
    responsibleDoctor: doctorInfo?.name || 'Dr. Alejandro Méndez',
    cedula: doctorInfo?.cedula || ''
  });

  const [showPrintView, setShowPrintView] = useState(false);
  const [generatedNoteId, setGeneratedNoteId] = useState('');

  // Precarga de datos
  useEffect(() => {
    if (patient && !noteId) {
        if (patient.currentVitals) setVitals(patient.currentVitals);
        setForm(prev => ({
            ...prev,
            allergies: patient.allergies?.join(', ') || 'Negadas',
            relevantHistory: patient.chronicDiseases?.join(', ') || '',
            admissionDate: patient.lastVisit || new Date().toISOString().split('T')[0]
        }));
    }
    
    if (doctorInfo && !noteId) {
         setForm(prev => ({
            ...prev,
            responsibleDoctor: doctorInfo.name,
            cedula: doctorInfo.cedula
         }));
    }

    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setShowPrintView(true);
        setForm(noteToEdit.content as any);
        if (noteToEdit.content.vitals) setVitals(noteToEdit.content.vitals);
      }
    }
  }, [noteId, notes, patient, doctorInfo]);

  if (!patient) return null;

  const handleSave = (finalize: boolean) => {
    if (!form.attentionReason || !form.diagnosticImpression || !form.clinicalEvolution) {
      alert("Campos obligatorios: Motivo de Atención, Diagnóstico y Evolución.");
      return;
    }

    if (finalize) {
      if (!window.confirm("¿Certificar Resumen Clínico? El documento se sellará digitalmente.")) return;
    }

    const currentNoteId = noteId || `RES-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Resumen Clínico',
      date: new Date().toLocaleString('es-MX'),
      author: form.responsibleDoctor,
      content: { ...form, vitals },
      isSigned: finalize,
      hash: finalize ? `CERT-RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    
    if (finalize) {
        setGeneratedNoteId(currentNoteId);
        setShowPrintView(true);
    } else {
        navigate(`/patient/${id}`);
    }
  };

  if (showPrintView) {
      return (
          <div className="min-h-screen bg-slate-100 flex justify-center p-8 animate-in fade-in">
              <div className="w-full max-w-[215mm] bg-white shadow-2xl overflow-hidden flex flex-col relative print:shadow-none print:w-full">
                  
                  {/* BARRA DE HERRAMIENTAS (NO IMPRIMIR) */}
                  <div className="bg-slate-900 p-4 flex justify-between items-center no-print sticky top-0 z-50">
                      <div className="flex items-center gap-4 text-white">
                          <CheckCircle2 className="text-emerald-400" />
                          <div>
                              <p className="text-xs font-black uppercase tracking-widest">Resumen Certificado</p>
                              <p className="text-[10px] text-slate-400">Folio: {generatedNoteId || noteId}</p>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2">
                              <Printer size={16}/> Imprimir
                          </button>
                          <button onClick={() => navigate(`/patient/${id}`)} className="px-6 py-2 bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all">
                              Cerrar
                          </button>
                      </div>
                  </div>

                  {/* FORMATO DE IMPRESIÓN */}
                  <div className="p-[20mm] space-y-8 text-slate-900">
                      
                      {/* HEADER */}
                      <div className="border-b-4 border-slate-900 pb-6 flex justify-between items-start">
                          <div>
                              <h1 className="text-2xl font-black uppercase tracking-tighter">Resumen Clínico</h1>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">{doctorInfo?.hospital || 'Hospital General'}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-2">NOM-004-SSA3-2012</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-black uppercase">Fecha de Emisión</p>
                              <p className="text-sm font-medium uppercase">{form.emissionDate}</p>
                          </div>
                      </div>

                      {/* 1. FICHA DE IDENTIFICACIÓN */}
                      <div className="grid grid-cols-12 gap-4 border border-slate-300 p-4 rounded-lg bg-slate-50 print:bg-white">
                          <div className="col-span-12 border-b border-slate-200 pb-2 mb-2">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Identificación del Paciente</p>
                          </div>
                          <div className="col-span-8">
                              <p className="text-[9px] text-slate-500 uppercase">Nombre Completo</p>
                              <p className="text-sm font-black uppercase">{patient.name}</p>
                          </div>
                          <div className="col-span-4">
                              <p className="text-[9px] text-slate-500 uppercase">Expediente</p>
                              <p className="text-sm font-black uppercase">{patient.id}</p>
                          </div>
                          <div className="col-span-3">
                              <p className="text-[9px] text-slate-500 uppercase">Edad / Sexo</p>
                              <p className="text-xs font-bold uppercase">{patient.age} Años / {patient.sex}</p>
                          </div>
                          <div className="col-span-4">
                              <p className="text-[9px] text-slate-500 uppercase">CURP</p>
                              <p className="text-xs font-bold uppercase">{patient.curp}</p>
                          </div>
                          <div className="col-span-5">
                              <p className="text-[9px] text-slate-500 uppercase">Fecha de Inicio / Ingreso</p>
                              <p className="text-xs font-bold uppercase">{form.admissionDate}</p>
                          </div>
                      </div>

                      {/* 2. SIGNOS VITALES (Resumen) */}
                      <div className="border border-slate-300 rounded-lg p-3 flex justify-between text-center">
                          <div><p className="text-[8px] text-slate-500 uppercase">T.A.</p><p className="text-xs font-black">{vitals.bp}</p></div>
                          <div><p className="text-[8px] text-slate-500 uppercase">F.C.</p><p className="text-xs font-black">{vitals.hr}</p></div>
                          <div><p className="text-[8px] text-slate-500 uppercase">F.R.</p><p className="text-xs font-black">{vitals.rr}</p></div>
                          <div><p className="text-[8px] text-slate-500 uppercase">Temp</p><p className="text-xs font-black">{vitals.temp}°C</p></div>
                          <div><p className="text-[8px] text-slate-500 uppercase">SatO2</p><p className="text-xs font-black">{vitals.o2}%</p></div>
                          <div><p className="text-[8px] text-slate-500 uppercase">Peso</p><p className="text-xs font-black">{vitals.weight}kg</p></div>
                          <div><p className="text-[8px] text-slate-500 uppercase">Talla</p><p className="text-xs font-black">{vitals.height}cm</p></div>
                      </div>

                      {/* 3. CONTENIDO CLÍNICO */}
                      <div className="space-y-6">
                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 mb-2">2. Motivo de Atención</p>
                              <p className="text-xs text-justify uppercase leading-relaxed">{form.attentionReason}</p>
                          </div>

                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 mb-2">3. Antecedentes Relevantes y Toxicomanías</p>
                              <div className="text-xs text-justify uppercase leading-relaxed mb-2">
                                  <span className="font-bold">Patológicos: </span> {form.relevantHistory || 'Negados'} <br/>
                                  <span className="font-bold">Alergias: </span> {form.allergies}
                              </div>
                              <div className="text-xs uppercase bg-slate-50 p-2 rounded border border-slate-200 print:border-slate-300">
                                  <span className="font-bold">Toxicomanías: </span>
                                  {form.substanceAbuse.alcohol ? 'Alcohol (+) ' : ''}
                                  {form.substanceAbuse.tobacco ? 'Tabaco (+) ' : ''}
                                  {form.substanceAbuse.drugs ? 'Drogas (+) ' : ''}
                                  {!form.substanceAbuse.alcohol && !form.substanceAbuse.tobacco && !form.substanceAbuse.drugs ? 'Negadas. ' : ''}
                                  <span className="italic">({form.substanceAbuse.details} - {form.substanceAbuse.frequency})</span>
                              </div>
                          </div>

                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 mb-2">4. Resumen de Evolución y Exploración Física</p>
                              <p className="text-xs text-justify uppercase leading-relaxed whitespace-pre-wrap">{form.clinicalEvolution}</p>
                              <p className="text-xs text-justify uppercase leading-relaxed mt-2 text-slate-600 italic">{form.physicalExplorationSummary}</p>
                          </div>

                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 mb-2">5. Auxiliares de Diagnóstico (Laboratorio y Gabinete)</p>
                              <p className="text-xs text-justify uppercase leading-relaxed">{form.labAndCabinetResults || 'No se realizaron estudios complementarios.'}</p>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300">
                              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">6. Diagnósticos (Impresión Diagnóstica)</p>
                              <p className="text-sm font-bold uppercase">{form.diagnosticImpression}</p>
                          </div>

                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 mb-2">7. Terapéutica Empleada</p>
                              <p className="text-xs text-justify uppercase leading-relaxed">{form.therapeuticEmployed}</p>
                              {form.proceduresPerformed && (
                                  <p className="text-xs text-justify uppercase leading-relaxed mt-1 font-bold">Procedimientos: {form.proceduresPerformed}</p>
                              )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <p className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 mb-2">8. Pronóstico</p>
                                  <p className="text-xs uppercase font-bold">{form.prognosis}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 mb-2">9. Estado Actual</p>
                                  <p className="text-xs uppercase font-bold">{form.patientStatus}</p>
                              </div>
                          </div>
                      </div>

                      {/* FIRMAS */}
                      <div className="mt-12 pt-12 border-t-2 border-slate-900">
                           <div className="grid grid-cols-2 gap-20">
                               <div className="text-center">
                                   <div className="border-b border-slate-900 mb-2"></div>
                                   <p className="text-[10px] font-black uppercase">{form.responsibleDoctor}</p>
                                   <p className="text-[8px] text-slate-500 uppercase">Médico Tratante</p>
                                   <p className="text-[8px] text-slate-400 uppercase">Cédula: {form.cedula}</p>
                               </div>
                               <div className="text-center">
                                   <div className="border-b border-slate-900 mb-2"></div>
                                   <p className="text-[10px] font-black uppercase">{doctorInfo?.hospital}</p>
                                   <p className="text-[8px] text-slate-500 uppercase">Sello de la Institución</p>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // VISTA DE EDICIÓN
  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-700 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Resumen Clínico</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500"/> NOM-004-SSA3-2012
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200">
            <User size={20} className="text-slate-400" />
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
                <p className="text-sm font-black text-slate-900 uppercase">{patient.name}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: VITALES Y ANTECEDENTES */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400"/> Signos Vitales (Actuales)
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { l: 'T.A.', v: vitals.bp, u: 'mmHg' },
                        { l: 'F.C.', v: vitals.hr, u: 'lpm' },
                        { l: 'F.R.', v: vitals.rr, u: 'rpm' },
                        { l: 'Temp', v: vitals.temp, u: '°C' },
                        { l: 'SatO2', v: vitals.o2, u: '%' },
                        { l: 'Peso', v: vitals.weight, u: 'kg' }
                    ].map(item => (
                        <div key={item.l} className="bg-white/10 p-3 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{item.l}</p>
                            <input 
                                className="w-full bg-transparent text-lg font-black text-white outline-none" 
                                value={item.v}
                                onChange={e => setVitals({...vitals, [item.l === 'T.A.' ? 'bp' : item.l === 'F.C.' ? 'hr' : item.l === 'F.R.' ? 'rr' : item.l === 'Temp' ? 'temp' : item.l === 'SatO2' ? 'o2' : 'weight']: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <AlertTriangle size={14}/> Toxicomanías y Abuso
                </h3>
                <div className="space-y-4">
                     <div className="flex gap-2">
                        <button 
                            onClick={() => setForm({...form, substanceAbuse: {...form.substanceAbuse, alcohol: !form.substanceAbuse.alcohol}})}
                            className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase ${form.substanceAbuse.alcohol ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                            Alcohol
                        </button>
                        <button 
                            onClick={() => setForm({...form, substanceAbuse: {...form.substanceAbuse, tobacco: !form.substanceAbuse.tobacco}})}
                            className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase ${form.substanceAbuse.tobacco ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                            Tabaco
                        </button>
                        <button 
                            onClick={() => setForm({...form, substanceAbuse: {...form.substanceAbuse, drugs: !form.substanceAbuse.drugs}})}
                            className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase ${form.substanceAbuse.drugs ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                            Drogas
                        </button>
                     </div>
                     <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Detalles / Frecuencia</label>
                         <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" placeholder="Ej: Social, Crónico, 5 cig/día..." value={form.substanceAbuse.details} onChange={e => setForm({...form, substanceAbuse: {...form.substanceAbuse, details: e.target.value}})} />
                     </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Alergias</label>
                        <input className="w-full p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 uppercase" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Antecedentes Patológicos</label>
                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium h-24 resize-none" value={form.relevantHistory} onChange={e => setForm({...form, relevantHistory: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: CONTENIDO CLÍNICO */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. MOTIVO Y EVOLUCIÓN */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <HeartPulse size={14} className="text-blue-600"/> Motivo de Atención
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner" 
                            value={form.attentionReason} 
                            onChange={e => setForm({...form, attentionReason: e.target.value})} 
                            placeholder="Razón principal de la consulta o ingreso..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={14} className="text-blue-600"/> Evolución del Padecimiento y Exploración
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner" 
                            value={form.clinicalEvolution} 
                            onChange={e => setForm({...form, clinicalEvolution: e.target.value})} 
                            placeholder="Descripción detallada de la evolución clínica..."
                        />
                    </div>
                </div>

                {/* 2. DIAGNÓSTICO Y AUXILIARES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Stethoscope size={14} className="text-emerald-600"/> Diagnósticos (CIE-10)
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-sm font-bold uppercase outline-none focus:border-emerald-400 transition-all" 
                            value={form.diagnosticImpression} 
                            onChange={e => setForm({...form, diagnosticImpression: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Microscope size={14} className="text-purple-600"/> Resultados Laboratorio/Gabinete
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-sm font-medium outline-none focus:border-purple-400 transition-all" 
                            value={form.labAndCabinetResults} 
                            onChange={e => setForm({...form, labAndCabinetResults: e.target.value})} 
                            placeholder="Resumen de hallazgos relevantes..."
                        />
                    </div>
                </div>

                {/* 3. TERAPÉUTICA Y PRONÓSTICO */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Pill size={14} className="text-indigo-600"/> Terapéutica Empleada
                        </label>
                        <textarea 
                            className="w-full p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl h-32 text-sm font-medium outline-none" 
                            value={form.therapeuticEmployed} 
                            onChange={e => setForm({...form, therapeuticEmployed: e.target.value})} 
                            placeholder="Medicamentos administrados, dosis, vía..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pronóstico</label>
                            <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium" value={form.prognosis} onChange={e => setForm({...form, prognosis: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado Actual</label>
                            <select className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none" value={form.patientStatus} onChange={e => setForm({...form, patientStatus: e.target.value})}>
                                <option>Estable</option>
                                <option>Delicado</option>
                                <option>Grave</option>
                                <option>Muy Grave</option>
                                <option>Defunción</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                    <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                    <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        Guardar Borrador
                    </button>
                    <button onClick={() => handleSave(true)} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-4">
                        <FileText size={20} /> Generar Resumen
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalSummaryNote;
