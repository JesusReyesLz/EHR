
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Ambulance, Hospital, 
  FileText, Activity, AlertTriangle, User, Phone, MapPin,
  Stethoscope, Clock, Siren, Pill, FileOutput, Lock, Printer, CheckCircle2
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

const ReferralNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void, doctorInfo?: DoctorInfo }> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [vitals, setVitals] = useState<Vitals>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: ''
  });

  const [form, setForm] = useState({
    // Logística
    sendingUnit: doctorInfo ? `${doctorInfo.hospital} - ${doctorInfo.address}` : 'Hospital General San Rafael', // Valor por defecto vinculado
    receivingUnit: '',
    receivingService: '',
    receivingDoctor: '', // Médico que acepta/recibe
    acceptanceCode: '', // Folio de aceptación
    transportType: 'Ambulancia Terrestre de Urgencias Avanzadas',
    transportUnitId: '',
    paramedicName: '',
    
    // Resumen Clínico
    clinicalSummary: '', // PA, Evolución
    relevantHistory: '', // Antecedentes patológicos
    
    // Toxicomanías (Específico Normativo)
    substanceAbuse: {
        alcohol: false,
        tobacco: false,
        drugs: false,
        details: 'Negados'
    },

    // Diagnóstico y Tratamiento
    diagnosticImpression: '', // Dx de envío
    treatmentsApplied: '', // Terapéutica empleada antes y durante traslado
    labResults: '', // Resumen de labs/gabinete
    
    // Justificación
    referralReason: '', // Motivo de envío (falta de equipo, especialista, UCI, etc.)
    prognosis: 'Reservado a evolución',
    
    // Administrativo
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    responsibleDoctor: doctorInfo?.name || 'Dr. Alejandro Méndez'
  });

  const [showPrintView, setShowPrintView] = useState(false);
  const [generatedNoteId, setGeneratedNoteId] = useState('');

  // Efecto para actualizar la unidad emisora si cambia la configuración
  useEffect(() => {
    if (doctorInfo && !noteId) { // Solo si es nueva nota, si es edición respetamos lo guardado
        setForm(prev => ({
            ...prev,
            sendingUnit: `${doctorInfo.hospital} (${doctorInfo.address})`,
            responsibleDoctor: doctorInfo.name
        }));
    }
  }, [doctorInfo, noteId]);

  useEffect(() => {
    if (patient && !noteId) {
        if (patient.currentVitals) setVitals(patient.currentVitals);
    }
    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setShowPrintView(true); // Si ya estaba firmada, mostrar vista de impresión directo
        setForm(noteToEdit.content as any);
        if (noteToEdit.content.vitals) setVitals(noteToEdit.content.vitals);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  const handleSave = (finalize: boolean) => {
    if (!form.receivingUnit || !form.referralReason || !form.diagnosticImpression) {
      alert("Campos obligatorios: Unidad Receptora, Motivo de Envío y Diagnóstico.");
      return;
    }

    if (finalize) {
      if (!window.confirm("¿Confirmar traslado? Al finalizar, se generará la hoja legal para impresión.")) return;
    }

    const currentNoteId = noteId || `REF-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Referencia y Traslado',
      date: new Date().toLocaleString('es-MX'),
      author: form.responsibleDoctor,
      content: { ...form, vitals },
      isSigned: finalize,
      hash: finalize ? `CERT-REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
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
                              <p className="text-xs font-black uppercase tracking-widest">Documento Guardado</p>
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
                              <h1 className="text-2xl font-black uppercase tracking-tighter">Hoja de Referencia y Traslado</h1>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Sistema Nacional de Salud</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-2">NOM-004-SSA3-2012</p>
                          </div>
                          <div className="text-right">
                              <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 inline-block mb-2">
                                  <p className="text-[10px] font-black uppercase text-slate-500">Urgencia / Prioridad</p>
                                  <p className="text-lg font-black text-rose-600 uppercase">TRASLADO ACTIVO</p>
                              </div>
                              <p className="text-xs font-bold uppercase">{form.departureDate} • {form.departureTime}</p>
                          </div>
                      </div>

                      {/* 1. FICHA DE IDENTIFICACIÓN */}
                      <div className="grid grid-cols-12 gap-4 border border-slate-300 p-4 rounded-lg">
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
                              <p className="text-[9px] text-slate-500 uppercase">Edad</p>
                              <p className="text-xs font-bold uppercase">{patient.age} Años</p>
                          </div>
                          <div className="col-span-3">
                              <p className="text-[9px] text-slate-500 uppercase">Sexo</p>
                              <p className="text-xs font-bold uppercase">{patient.sex}</p>
                          </div>
                          <div className="col-span-6">
                              <p className="text-[9px] text-slate-500 uppercase">CURP</p>
                              <p className="text-xs font-bold uppercase">{patient.curp}</p>
                          </div>
                      </div>

                      {/* 2. DATOS DE REFERENCIA */}
                      <div className="grid grid-cols-2 gap-6">
                          <div className="border border-slate-300 p-4 rounded-lg">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-200 pb-1">2. Unidad que Envía</p>
                              <p className="text-xs font-black uppercase">{form.sendingUnit}</p>
                              <p className="text-[10px] uppercase mt-1">Médico Resp: {form.responsibleDoctor}</p>
                          </div>
                          <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 print:bg-white">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-200 pb-1">3. Unidad Receptora</p>
                              <p className="text-xs font-black uppercase">{form.receivingUnit}</p>
                              <p className="text-[10px] uppercase mt-1">Médico Aceptante: {form.receivingDoctor}</p>
                              {form.acceptanceCode && <p className="text-[10px] font-bold uppercase mt-1">Folio Aceptación: {form.acceptanceCode}</p>}
                          </div>
                      </div>

                      {/* 4. RESUMEN CLÍNICO */}
                      <div className="space-y-4">
                          <div className="border-b-2 border-slate-200 pb-1">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-900">4. Resumen Clínico del Padecimiento</p>
                          </div>
                          <div className="text-xs font-medium text-justify leading-relaxed uppercase space-y-4">
                              <div>
                                  <span className="font-black block text-slate-500 text-[10px] mb-1">Motivo de Envío (Justificación):</span>
                                  {form.referralReason}
                              </div>
                              <div>
                                  <span className="font-black block text-slate-500 text-[10px] mb-1">Evolución y Padecimiento Actual:</span>
                                  {form.clinicalSummary}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-50 p-2 border border-slate-200 print:border-slate-300">
                                      <span className="font-black block text-slate-500 text-[10px] mb-1">Diagnósticos de Envío:</span>
                                      {form.diagnosticImpression}
                                  </div>
                                  <div className="bg-slate-50 p-2 border border-slate-200 print:border-slate-300">
                                      <span className="font-black block text-slate-500 text-[10px] mb-1">Terapéutica Empleada:</span>
                                      {form.treatmentsApplied}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* 5. SIGNOS VITALES AL TRASLADO */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                          <div className="bg-slate-100 p-2 border-b border-slate-300">
                              <p className="text-[10px] font-black uppercase text-center tracking-widest">5. Signos Vitales (Salida)</p>
                          </div>
                          <div className="flex divide-x divide-slate-300">
                              <div className="flex-1 p-2 text-center">
                                  <p className="text-[9px] text-slate-500 uppercase">T.A.</p>
                                  <p className="text-sm font-black">{vitals.bp}</p>
                              </div>
                              <div className="flex-1 p-2 text-center">
                                  <p className="text-[9px] text-slate-500 uppercase">F.C.</p>
                                  <p className="text-sm font-black">{vitals.hr}</p>
                              </div>
                              <div className="flex-1 p-2 text-center">
                                  <p className="text-[9px] text-slate-500 uppercase">F.R.</p>
                                  <p className="text-sm font-black">{vitals.rr}</p>
                              </div>
                              <div className="flex-1 p-2 text-center">
                                  <p className="text-[9px] text-slate-500 uppercase">Temp</p>
                                  <p className="text-sm font-black">{vitals.temp}°C</p>
                              </div>
                              <div className="flex-1 p-2 text-center">
                                  <p className="text-[9px] text-slate-500 uppercase">SatO2</p>
                                  <p className="text-sm font-black">{vitals.o2}%</p>
                              </div>
                          </div>
                      </div>

                      {/* 6. TOXICOMANÍAS (REQUERIDO) */}
                      <div className="text-xs uppercase border border-slate-300 p-3 rounded-lg">
                          <span className="font-black text-slate-500 mr-2">Antecedentes de Toxicomanías:</span>
                          {form.substanceAbuse.alcohol ? 'ALCOHOLISMO (+), ' : 'ALCOHOLISMO (-), '}
                          {form.substanceAbuse.tobacco ? 'TABAQUISMO (+), ' : 'TABAQUISMO (-), '}
                          {form.substanceAbuse.drugs ? 'DROGAS (+), ' : 'DROGAS (-), '}
                          <span className="italic">{form.substanceAbuse.details}</span>
                      </div>

                      {/* 7. TRASLADO Y FIRMAS */}
                      <div className="mt-8 pt-8 border-t-2 border-slate-900">
                           <div className="mb-8">
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Unidad de Transporte</p>
                               <p className="text-sm font-bold uppercase">{form.transportType} — {form.transportUnitId}</p>
                           </div>

                           <div className="grid grid-cols-3 gap-8 mt-12">
                               <div className="text-center">
                                   <div className="border-b border-slate-900 mb-2"></div>
                                   <p className="text-[10px] font-black uppercase">{form.responsibleDoctor}</p>
                                   <p className="text-[8px] text-slate-500 uppercase">Médico que Envía</p>
                               </div>
                               <div className="text-center">
                                   <div className="border-b border-slate-900 mb-2"></div>
                                   <p className="text-[10px] font-black uppercase">Nombre y Firma</p>
                                   <p className="text-[8px] text-slate-500 uppercase">Responsable de Ambulancia</p>
                               </div>
                               <div className="text-center">
                                   <div className="border-b border-slate-900 mb-2"></div>
                                   <p className="text-[10px] font-black uppercase">Nombre y Firma</p>
                                   <p className="text-[8px] text-slate-500 uppercase">Médico que Recibe</p>
                               </div>
                           </div>
                      </div>

                  </div>
              </div>
          </div>
      );
  }

  // VISTA DE EDICIÓN (FORMULARIO)
  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white border-b-8 border-rose-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Referencia y Traslado</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500"/> NOM-004-SSA3-2012
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 text-rose-700">
            <Ambulance size={24} />
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest">Estatus de Traslado</p>
                <p className="text-sm font-black uppercase">{form.transportType}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: LOGÍSTICA Y SIGNOS */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Hospital size={14}/> Datos de Referencia
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Establecimiento que Envía</label>
                        <input 
                            className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-500 cursor-not-allowed" 
                            value={form.sendingUnit} 
                            disabled 
                            title="Vinculado a Configuración del Establecimiento"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Establecimiento Receptor</label>
                        <input className="w-full p-4 bg-white border-2 border-rose-100 rounded-xl text-sm font-black uppercase outline-none focus:border-rose-500" placeholder="Hospital destino..." value={form.receivingUnit} onChange={e => setForm({...form, receivingUnit: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Médico que Recibe (Urgencias)</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" placeholder="Nombre del médico receptor..." value={form.receivingDoctor} onChange={e => setForm({...form, receivingDoctor: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Folio Aceptación</label>
                            <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-emerald-600" placeholder="Opcional" value={form.acceptanceCode} onChange={e => setForm({...form, acceptanceCode: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Hora Salida</label>
                            <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400"/> Signos Vitales (Salida)
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { l: 'T.A.', v: vitals.bp, u: 'mmHg' },
                        { l: 'F.C.', v: vitals.hr, u: 'lpm' },
                        { l: 'F.R.', v: vitals.rr, u: 'rpm' },
                        { l: 'SatO2', v: vitals.o2, u: '%' }
                    ].map(item => (
                        <div key={item.l} className="bg-white/10 p-3 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{item.l}</p>
                            <input 
                                className="w-full bg-transparent text-lg font-black text-white outline-none" 
                                value={item.v}
                                onChange={e => setVitals({...vitals, [item.l === 'T.A.' ? 'bp' : item.l === 'F.C.' ? 'hr' : item.l === 'F.R.' ? 'rr' : 'o2']: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* COLUMNA CENTRAL: RESUMEN CLÍNICO */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <FileText size={14} className="text-blue-600"/> Resumen Clínico (Padecimiento Actual)
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner" 
                            value={form.clinicalSummary} 
                            onChange={e => setForm({...form, clinicalSummary: e.target.value})} 
                            placeholder="Evolución del padecimiento, estado actual y justificación clínica..."
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Stethoscope size={14} className="text-indigo-600"/> Diagnósticos de Envío
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-black uppercase text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner" 
                            value={form.diagnosticImpression} 
                            onChange={e => setForm({...form, diagnosticImpression: e.target.value})} 
                            placeholder="Impresión diagnóstica principal y secundarios..."
                        />
                    </div>
                </div>

                {/* SECCIÓN TOXICOMANÍAS Y ABUSO DE SUSTANCIAS */}
                <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} /> Antecedentes de Abuso y Dependencia (Requerido)
                    </h4>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer">
                            <input type="checkbox" checked={form.substanceAbuse.alcohol} onChange={e => setForm({...form, substanceAbuse: {...form.substanceAbuse, alcohol: e.target.checked}})} className="accent-amber-600 w-4 h-4"/>
                            <span className="text-[10px] font-bold uppercase text-slate-600">Alcoholismo</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer">
                            <input type="checkbox" checked={form.substanceAbuse.tobacco} onChange={e => setForm({...form, substanceAbuse: {...form.substanceAbuse, tobacco: e.target.checked}})} className="accent-amber-600 w-4 h-4"/>
                            <span className="text-[10px] font-bold uppercase text-slate-600">Tabaquismo</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer">
                            <input type="checkbox" checked={form.substanceAbuse.drugs} onChange={e => setForm({...form, substanceAbuse: {...form.substanceAbuse, drugs: e.target.checked}})} className="accent-amber-600 w-4 h-4"/>
                            <span className="text-[10px] font-bold uppercase text-slate-600">Otras Toxicomanías</span>
                        </label>
                        <input 
                            className="flex-1 p-3 bg-white border border-amber-200 rounded-xl text-xs font-medium outline-none placeholder:text-slate-400"
                            placeholder="Detalles adicionales (tiempo, frecuencia, última ingesta)..."
                            value={form.substanceAbuse.details}
                            onChange={e => setForm({...form, substanceAbuse: {...form.substanceAbuse, details: e.target.value}})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Pill size={14}/> Terapéutica Empleada
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-28 text-sm outline-none" 
                            value={form.treatmentsApplied} 
                            onChange={e => setForm({...form, treatmentsApplied: e.target.value})} 
                            placeholder="Medicamentos administrados, soluciones, procedimientos previos al traslado..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={14}/> Estudios Realizados
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-28 text-sm outline-none" 
                            value={form.labResults} 
                            onChange={e => setForm({...form, labResults: e.target.value})} 
                            placeholder="Laboratorio y Gabinete relevantes para el traslado..."
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN JUSTIFICACIÓN */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-[3rem] p-10 shadow-sm space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-700 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Siren size={14}/> Motivo de Envío (Justificación)
                    </label>
                    <textarea 
                        className="w-full p-6 bg-white border border-rose-200 rounded-2xl h-24 text-sm font-bold text-rose-900 outline-none" 
                        value={form.referralReason} 
                        onChange={e => setForm({...form, referralReason: e.target.value})} 
                        placeholder="Ej: Requiere Unidad de Cuidados Intensivos, Valoración por Neurocirugía, Falta de equipamiento..."
                    />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pronóstico</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium" value={form.prognosis} onChange={e => setForm({...form, prognosis: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Unidad de Transporte</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium uppercase" placeholder="Ej: Ambulancia Alfa-01" value={form.transportUnitId} onChange={e => setForm({...form, transportUnitId: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4">
                    <FileOutput size={20} /> Generar Hoja de Traslado
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralNote;
