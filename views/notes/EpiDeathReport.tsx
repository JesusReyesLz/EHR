
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, AlertOctagon, Skull, Microscope, Calendar,
  Activity, Baby, Clock, CheckCircle2, AlertTriangle, Lock
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../../types';

interface EpiDeathReportProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

const EpiDeathReport: React.FC<EpiDeathReportProps> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    // General
    institution: doctorInfo?.hospital || 'Hospital General San Rafael',
    jurisdiction: 'Jurisdicción Sanitaria No. 1',
    reportDate: new Date().toISOString().split('T')[0],
    
    // Epidemiological Data
    conditionUnderSurveillance: '', // e.g. Dengue, Influenza
    caseClassification: 'Probable', // Sospechoso, Probable, Confirmado, Descartado
    
    // Dates
    symptomOnsetDate: '',
    hospitalAdmissionDate: patient?.lastVisit || '',
    deathDate: new Date().toISOString().split('T')[0],
    deathTime: '',

    // Causes (CIE-10 Style)
    causeDirect: '',
    causeAntecedent: '',
    causeBasic: '',
    contributingCauses: '',

    // Maternal Death Screen (Females 10-54)
    isMaternalDeathSuspected: false,
    pregnancyStatus: 'No aplica', // Embarazada, Puérpera, No embarazada
    
    // Samples & Confirmation
    samplesTaken: false,
    sampleType: '', // Biopsia, Suero, LCR
    labResults: 'Pendiente', 
    necropsyPerformed: false,
    necropsyFolio: '',

    // Reporting
    reportedToEpidemiology: false,
    epidemiologistName: '',
    
    // Doctor
    reportingDoctor: doctorInfo?.name || '',
    cedula: doctorInfo?.cedula || ''
  });

  const [showPrintView, setShowPrintView] = useState(false);
  const [generatedNoteId, setGeneratedNoteId] = useState('');

  // Determine if patient is female of reproductive age (WRA) roughly 10-54
  const isWRA = patient?.sex === 'F' && patient.age >= 10 && patient.age <= 54;

  useEffect(() => {
    if (doctorInfo && !noteId) {
        setForm(prev => ({ 
            ...prev, 
            reportingDoctor: doctorInfo.name,
            cedula: doctorInfo.cedula
        }));
    }

    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setShowPrintView(true);
        setForm(noteToEdit.content as any);
      }
    }
  }, [noteId, notes, doctorInfo]);

  if (!patient) return null;

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.conditionUnderSurveillance || !form.deathDate || !form.causeDirect || !form.causeBasic) {
            alert("Campos obligatorios: Padecimiento, Fecha Defunción y Causas (Directa/Básica).");
            return;
        }
        if (isWRA && form.pregnancyStatus === 'No aplica') {
             if(!window.confirm("Paciente femenina en edad fértil. ¿Seguro que el estado de embarazo es 'No aplica'? Se recomienda verificar para descartar Muerte Materna.")) return;
        }
        if (!window.confirm("¿Certificar Reporte Epidemiológico de Defunción?")) return;
    }

    const currentNoteId = noteId || `EPI-DEATH-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Reporte de Defunción (Vigilancia Epidemiológica)',
      date: new Date().toLocaleString('es-MX'),
      author: form.reportingDoctor,
      content: { ...form, isWRA },
      isSigned: finalize,
      hash: finalize ? `CERT-EPIDEATH-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
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
              {/* Toolbar */}
              <div className="bg-slate-900 p-4 flex justify-between items-center no-print sticky top-0 z-50">
                  <div className="flex items-center gap-4 text-white">
                      <Skull className="text-rose-500" />
                      <div>
                          <p className="text-xs font-black uppercase tracking-widest">Reporte Epidemiológico</p>
                          <p className="text-[10px] text-slate-400">Folio: {generatedNoteId || noteId}</p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 flex items-center gap-2"><Printer size={16}/> Imprimir</button>
                      <button onClick={() => navigate(`/patient/${id}`)} className="px-6 py-2 bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600">Cerrar</button>
                  </div>
              </div>

              {/* Print Content */}
              <div className="p-[15mm] space-y-6 text-slate-900 text-xs">
                  <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4">
                      <div>
                          <h1 className="text-xl font-black uppercase tracking-tight">Estudio Epidemiológico de Defunción</h1>
                          <p className="font-bold text-slate-500 uppercase tracking-widest">Sistema Nacional de Vigilancia Epidemiológica (SINAVE)</p>
                      </div>
                      <div className="text-right">
                          <p className="font-black uppercase">{form.institution}</p>
                          <p className="uppercase">{form.jurisdiction}</p>
                          <p className="font-bold text-rose-600 mt-1 uppercase">Clasificación: {form.caseClassification}</p>
                      </div>
                  </div>

                  {/* 1. Identification */}
                  <div className="border border-slate-300 rounded p-3 grid grid-cols-4 gap-4">
                      <div className="col-span-4 border-b border-slate-200 pb-1 mb-1 font-black uppercase tracking-widest text-[10px]">1. Identificación del Caso</div>
                      <div className="col-span-2">
                          <p className="text-[9px] text-slate-500 uppercase">Nombre</p>
                          <p className="font-bold uppercase">{patient.name}</p>
                      </div>
                      <div>
                          <p className="text-[9px] text-slate-500 uppercase">Edad/Sexo</p>
                          <p className="font-bold uppercase">{patient.age} Años / {patient.sex}</p>
                      </div>
                      <div>
                          <p className="text-[9px] text-slate-500 uppercase">Expediente</p>
                          <p className="font-bold uppercase">{patient.id}</p>
                      </div>
                      <div className="col-span-2">
                          <p className="text-[9px] text-slate-500 uppercase">Padecimiento Vigilado</p>
                          <p className="font-black uppercase text-sm">{form.conditionUnderSurveillance}</p>
                      </div>
                      <div className="col-span-2">
                          <p className="text-[9px] text-slate-500 uppercase">Lugar de Residencia</p>
                          <p className="font-bold uppercase">{patient.address || 'No registrado'}</p>
                      </div>
                  </div>

                  {/* 2. Chronology */}
                  <div className="grid grid-cols-3 gap-4 border border-slate-300 rounded p-3">
                      <div className="text-center">
                          <p className="text-[9px] text-slate-500 uppercase">Inicio Síntomas</p>
                          <p className="font-bold">{form.symptomOnsetDate || '--'}</p>
                      </div>
                      <div className="text-center">
                          <p className="text-[9px] text-slate-500 uppercase">Ingreso Hospitalario</p>
                          <p className="font-bold">{form.hospitalAdmissionDate || '--'}</p>
                      </div>
                      <div className="text-center bg-slate-100 rounded border border-slate-200">
                          <p className="text-[9px] text-slate-500 uppercase font-black">Fecha/Hora Defunción</p>
                          <p className="font-black text-rose-700">{form.deathDate} {form.deathTime}</p>
                      </div>
                  </div>

                  {/* 3. Causes (CIE-10 Logic) */}
                  <div className="border border-slate-300 rounded p-4 space-y-2">
                      <p className="font-black uppercase tracking-widest text-[10px] border-b border-slate-200 pb-1 mb-2">3. Causas de la Defunción (CIE-10)</p>
                      <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1 font-bold text-slate-400"> (a)</div>
                          <div className="col-span-11 border-b border-slate-200 uppercase font-bold">{form.causeDirect}</div>
                          
                          <div className="col-span-1 font-bold text-slate-400"> (b)</div>
                          <div className="col-span-11 border-b border-slate-200 uppercase">{form.causeAntecedent}</div>
                          
                          <div className="col-span-1 font-bold text-slate-400"> (c)</div>
                          <div className="col-span-11 border-b border-slate-200 uppercase font-black">{form.causeBasic} <span className="text-[9px] text-slate-400 font-normal ml-2">(Causa Básica)</span></div>
                          
                          <div className="col-span-1 font-bold text-slate-400"> II</div>
                          <div className="col-span-11 border-b border-slate-200 uppercase">{form.contributingCauses}</div>
                      </div>
                  </div>

                  {/* 4. Specific Modules */}
                  <div className="grid grid-cols-2 gap-4">
                      {/* Maternal */}
                      <div className={`border rounded p-3 ${isWRA ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}>
                          <p className="font-black uppercase tracking-widest text-[10px] mb-2">4. Muerte Materna</p>
                          <p className="uppercase"><span className="font-bold">¿Sospecha?</span> {form.isMaternalDeathSuspected ? 'SÍ' : 'NO'}</p>
                          <p className="uppercase"><span className="font-bold">Estado:</span> {form.pregnancyStatus}</p>
                      </div>
                      {/* Samples */}
                      <div className="border border-slate-300 rounded p-3">
                           <p className="font-black uppercase tracking-widest text-[10px] mb-2">5. Laboratorio / Patología</p>
                           <p className="uppercase"><span className="font-bold">Muestras:</span> {form.samplesTaken ? `SÍ (${form.sampleType})` : 'NO'}</p>
                           <p className="uppercase"><span className="font-bold">Necropsia:</span> {form.necropsyPerformed ? `SÍ (${form.necropsyFolio})` : 'NO'}</p>
                      </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-16 grid grid-cols-2 gap-16 text-center">
                      <div>
                          <div className="border-b border-slate-900 mb-1"></div>
                          <p className="font-bold uppercase">{form.reportingDoctor}</p>
                          <p className="text-[9px] uppercase">Médico Notificante</p>
                      </div>
                      <div>
                          <div className="border-b border-slate-900 mb-1"></div>
                          <p className="font-bold uppercase">Sello Epidemiología</p>
                          <p className="text-[9px] uppercase">Recepción Jurisdiccional</p>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-rose-900 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-800 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reporte de Defunción</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-rose-600"/> Vigilancia Epidemiológica (SINAVE)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 text-rose-900">
            <Skull size={24} />
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest">Estatus</p>
                <p className="text-sm font-black uppercase">Notificación Inmediata</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: CONTEXTO */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* CLASIFICACIÓN */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Activity size={14}/> Clasificación del Caso
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Padecimiento Sujeto a Vigilancia</label>
                        <input className="w-full p-4 bg-rose-50 border-2 border-rose-100 rounded-xl text-sm font-black text-rose-900 uppercase outline-none focus:border-rose-500" placeholder="Ej: Dengue, COVID-19, Rabia..." value={form.conditionUnderSurveillance} onChange={e => setForm({...form, conditionUnderSurveillance: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Clasificación Final</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" value={form.caseClassification} onChange={e => setForm({...form, caseClassification: e.target.value})}>
                            <option>Probable</option>
                            <option>Sospechoso</option>
                            <option>Confirmado por Laboratorio</option>
                            <option>Confirmado por Asociación Epi.</option>
                            <option>Descartado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* CRONOLOGÍA */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-rose-400"/> Cronología del Evento
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Inicio de Síntomas</label>
                        <input type="date" className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white outline-none" value={form.symptomOnsetDate} onChange={e => setForm({...form, symptomOnsetDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Ingreso Hospitalario</label>
                        <input type="date" className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white outline-none" value={form.hospitalAdmissionDate} onChange={e => setForm({...form, hospitalAdmissionDate: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-rose-400 uppercase ml-1">Fecha Defunción</label>
                            <input type="date" className="w-full p-3 bg-rose-900/50 border border-rose-800 rounded-xl text-xs font-bold text-white outline-none" value={form.deathDate} onChange={e => setForm({...form, deathDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-rose-400 uppercase ml-1">Hora</label>
                            <input type="time" className="w-full p-3 bg-rose-900/50 border border-rose-800 rounded-xl text-xs font-bold text-white outline-none" value={form.deathTime} onChange={e => setForm({...form, deathTime: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* SECCIÓN MATERNA (CONDICIONAL) */}
            {isWRA && (
                <div className="bg-pink-50 border border-pink-200 rounded-[2.5rem] p-8 shadow-sm space-y-4 animate-in slide-in-from-left-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-pink-700 flex items-center gap-2">
                        <Baby size={14}/> Vigilancia Muerte Materna
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-pink-100">
                             <span className="text-[9px] font-bold uppercase text-slate-600">¿Sospecha Muerte Materna?</span>
                             <input type="checkbox" checked={form.isMaternalDeathSuspected} onChange={e => setForm({...form, isMaternalDeathSuspected: e.target.checked})} className="accent-pink-600 w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Estado de Embarazo</label>
                            <select className="w-full p-3 bg-white border border-pink-100 rounded-xl text-xs font-bold uppercase outline-none" value={form.pregnancyStatus} onChange={e => setForm({...form, pregnancyStatus: e.target.value})}>
                                <option>No aplica</option>
                                <option>Embarazo actual</option>
                                <option>Parto/Aborto en ult. 42 días</option>
                                <option>Parto/Aborto hace 43 días - 11 meses</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* COLUMNA DERECHA: CAUSAS Y MUESTRAS */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. CAUSAS DE DEFUNCIÓN */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                        <FileText size={14}/> Causas de Defunción (CIE-10 / Certificado)
                    </h4>
                    
                    <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Causa Directa (a)</label>
                           <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase outline-none" value={form.causeDirect} onChange={e => setForm({...form, causeDirect: e.target.value})} placeholder="Enfermedad o condición final..." />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Causa Antecedente (b)</label>
                           <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium uppercase outline-none" value={form.causeAntecedent} onChange={e => setForm({...form, causeAntecedent: e.target.value})} placeholder="Debido a..." />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-rose-500 uppercase ml-2 flex items-center gap-1"><AlertTriangle size={10}/> Causa Básica (c)</label>
                           <input className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-sm font-black text-rose-900 uppercase outline-none focus:ring-2 focus:ring-rose-200" value={form.causeBasic} onChange={e => setForm({...form, causeBasic: e.target.value})} placeholder="Enfermedad inicial fundamental..." />
                        </div>
                        <div className="space-y-1 pt-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Otros estados patológicos (II)</label>
                           <textarea className="w-full p-4 bg-white border border-slate-200 rounded-xl h-20 text-xs font-medium resize-none uppercase outline-none" value={form.contributingCauses} onChange={e => setForm({...form, contributingCauses: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* 2. LABORATORIO Y MUESTRAS */}
                <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-6">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                        <Microscope size={14}/> Confirmación Diagnóstica Post-Mortem
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
                                 <span className="text-[9px] font-bold uppercase text-slate-600">¿Muestra biológica tomada?</span>
                                 <input type="checkbox" checked={form.samplesTaken} onChange={e => setForm({...form, samplesTaken: e.target.checked})} className="accent-blue-600 w-4 h-4" />
                            </div>
                            {form.samplesTaken && (
                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo de Muestra</label>
                                   <input className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-medium" value={form.sampleType} onChange={e => setForm({...form, sampleType: e.target.value})} placeholder="Biopsia, Suero, Hisopado..." />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
                                 <span className="text-[9px] font-bold uppercase text-slate-600">¿Necropsia Realizada?</span>
                                 <input type="checkbox" checked={form.necropsyPerformed} onChange={e => setForm({...form, necropsyPerformed: e.target.checked})} className="accent-blue-600 w-4 h-4" />
                            </div>
                            {form.necropsyPerformed && (
                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Folio / Patología</label>
                                   <input className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-medium" value={form.necropsyFolio} onChange={e => setForm({...form, necropsyFolio: e.target.value})} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. NOTIFICACIÓN */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600"/> Datos de Notificación</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Jurisdicción Sanitaria</label>
                             <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.jurisdiction} onChange={e => setForm({...form, jurisdiction: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Epidemiólogo Receptor</label>
                             <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.epidemiologistName} onChange={e => setForm({...form, epidemiologistName: e.target.value})} placeholder="Nombre de quien recibe" />
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-rose-700 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-800 transition-all flex items-center gap-4">
                    <Save size={20} /> Certificar Defunción
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EpiDeathReport;
