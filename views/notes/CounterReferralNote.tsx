
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Hospital, 
  FileText, Activity, User, Calendar,
  Stethoscope, Clock, CheckCircle2, FileOutput, Lock, Printer,
  ArrowRightLeft, ClipboardList, AlertCircle
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

const CounterReferralNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void, doctorInfo?: DoctorInfo }> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    // Logística de Contrarreferencia
    sendingUnit: doctorInfo ? `${doctorInfo.hospital} (${doctorInfo.address})` : 'Hospital General San Rafael (Segundo Nivel)', // Valor por defecto vinculado
    receivingUnit: '', // Unidad de Primer Nivel o la que refirió
    serviceUnit: 'Medicina Interna',
    
    // Fechas y Estancia
    admissionDate: '',
    dischargeDate: new Date().toISOString().split('T')[0],
    hospitalStayDays: 0,
    
    // Diagnósticos (Comparativa)
    admissionDiagnosis: '',
    dischargeDiagnosis: '',
    
    // Resumen de Atención
    clinicalSummary: '', // Evolución intra-hospitalaria
    diagnosticResults: '', // Labs, Rayos X relevantes
    proceduresPerformed: '', // Terapéutica empleada (Qx, Farmacológica)
    
    // Continuidad
    patientCondition: 'Mejoría', // Curación, Mejoría, Voluntario, Defunción, Incurabilidad
    pendingProblems: '', // Problemas clínicos pendientes
    recommendations: '', // Plan para el médico receptor (Manejo farmacológico, curaciones, etc.)
    warningSigns: '', // Datos de alarma para reingreso
    
    // Administrativo
    responsibleDoctor: doctorInfo?.name || 'Dr. Alejandro Méndez',
    cedulaDoctor: doctorInfo?.cedula || '12345678',
    date: new Date().toLocaleString('es-MX')
  });

  const [showPrintView, setShowPrintView] = useState(false);
  const [generatedNoteId, setGeneratedNoteId] = useState('');

  // Efecto para actualizar la unidad si cambia la configuración
  useEffect(() => {
    if (doctorInfo && !noteId) { // Solo si es nueva nota
        setForm(prev => ({
            ...prev,
            sendingUnit: `${doctorInfo.hospital} (${doctorInfo.address})`,
            responsibleDoctor: doctorInfo.name,
            cedulaDoctor: doctorInfo.cedula
        }));
    }
  }, [doctorInfo, noteId]);

  // Auto-calcular días de estancia
  useEffect(() => {
    if (form.admissionDate && form.dischargeDate) {
        const start = new Date(form.admissionDate);
        const end = new Date(form.dischargeDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        setForm(prev => ({ ...prev, hospitalStayDays: diffDays }));
    }
  }, [form.admissionDate, form.dischargeDate]);

  useEffect(() => {
    if (patient && !noteId) {
        // Intentar pre-llenar fecha de ingreso si existe en historial
        // En un caso real, esto vendría de un campo 'admissionDate' en el objeto Patient
        setForm(prev => ({ ...prev, admissionDate: patient.lastVisit })); 
    }
    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setShowPrintView(true);
        setForm(noteToEdit.content as any);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  const handleSave = (finalize: boolean) => {
    if (!form.receivingUnit || !form.dischargeDiagnosis || !form.recommendations) {
      alert("Campos obligatorios: Unidad Receptora, Diagnóstico de Egreso y Recomendaciones de Manejo.");
      return;
    }

    if (finalize) {
      if (!window.confirm("¿Certificar Nota de Contrarreferencia? Al finalizar, se generará el documento legal para el retorno del paciente.")) return;
    }

    const currentNoteId = noteId || `CONT-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Contrarreferencia',
      date: new Date().toLocaleString('es-MX'),
      author: form.responsibleDoctor,
      content: { ...form },
      isSigned: finalize,
      hash: finalize ? `CERT-CONT-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
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
                          <CheckCircle2 className="text-cyan-400" />
                          <div>
                              <p className="text-xs font-black uppercase tracking-widest">Documento Certificado</p>
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
                  <div className="p-[20mm] space-y-6 text-slate-900">
                      
                      {/* HEADER */}
                      <div className="border-b-4 border-slate-900 pb-6 flex justify-between items-start">
                          <div>
                              <h1 className="text-2xl font-black uppercase tracking-tighter">Nota de Contrarreferencia</h1>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Sistema de Referencia y Contrarreferencia</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-2">NOM-004-SSA3-2012</p>
                          </div>
                          <div className="text-right">
                              <div className="bg-cyan-50 px-4 py-2 rounded-lg border border-cyan-100 inline-block mb-2">
                                  <p className="text-[10px] font-black uppercase text-cyan-800">Estatus de Egreso</p>
                                  <p className="text-lg font-black text-cyan-600 uppercase">{form.patientCondition}</p>
                              </div>
                              <p className="text-xs font-bold uppercase">{form.date}</p>
                          </div>
                      </div>

                      {/* 1. FICHA DE IDENTIFICACIÓN */}
                      <div className="grid grid-cols-12 gap-4 border border-slate-300 p-4 rounded-lg bg-slate-50 print:bg-white">
                          <div className="col-span-12 border-b border-slate-200 pb-1 mb-1">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Identificación y Origen</p>
                          </div>
                          <div className="col-span-8">
                              <p className="text-[9px] text-slate-500 uppercase">Paciente</p>
                              <p className="text-sm font-black uppercase">{patient.name}</p>
                          </div>
                          <div className="col-span-4">
                              <p className="text-[9px] text-slate-500 uppercase">Expediente / CURP</p>
                              <p className="text-sm font-black uppercase">{patient.id} / {patient.curp}</p>
                          </div>
                          <div className="col-span-6">
                              <p className="text-[9px] text-slate-500 uppercase">Unidad que Contrarrefiere (Envía)</p>
                              <p className="text-xs font-bold uppercase">{form.sendingUnit}</p>
                          </div>
                          <div className="col-span-6">
                              <p className="text-[9px] text-slate-500 uppercase">Unidad Receptora (Destino)</p>
                              <p className="text-xs font-bold uppercase">{form.receivingUnit}</p>
                          </div>
                      </div>

                      {/* 2. RESUMEN DE ESTANCIA */}
                      <div className="grid grid-cols-3 gap-4 border border-slate-300 p-4 rounded-lg">
                          <div className="text-center border-r border-slate-200">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Fecha Ingreso</p>
                             <p className="text-sm font-black">{form.admissionDate || 'N/D'}</p>
                          </div>
                          <div className="text-center border-r border-slate-200">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Fecha Egreso</p>
                             <p className="text-sm font-black">{form.dischargeDate}</p>
                          </div>
                          <div className="text-center">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Días Estancia</p>
                             <p className="text-sm font-black">{form.hospitalStayDays}</p>
                          </div>
                      </div>

                      {/* 3. DIAGNÓSTICOS */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="border border-slate-300 p-3 rounded-lg">
                              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Diagnóstico de Ingreso</p>
                              <p className="text-xs font-bold uppercase">{form.admissionDiagnosis}</p>
                          </div>
                          <div className="border border-slate-300 p-3 rounded-lg bg-cyan-50 print:bg-white">
                              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Diagnóstico de Egreso</p>
                              <p className="text-xs font-black uppercase">{form.dischargeDiagnosis}</p>
                          </div>
                      </div>

                      {/* 4. RESUMEN CLÍNICO */}
                      <div className="space-y-4">
                          <div className="border-b-2 border-slate-200 pb-1">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-900">4. Resumen Clínico y Evolución</p>
                          </div>
                          <div className="text-xs font-medium text-justify leading-relaxed uppercase space-y-4">
                              <div>
                                  <span className="font-black block text-slate-500 text-[10px] mb-1">Resumen de Evolución y Manejo:</span>
                                  {form.clinicalSummary}
                              </div>
                              <div>
                                  <span className="font-black block text-slate-500 text-[10px] mb-1">Terapéutica Empleada (Procedimientos/Fármacos):</span>
                                  {form.proceduresPerformed}
                              </div>
                              <div>
                                  <span className="font-black block text-slate-500 text-[10px] mb-1">Resultados Relevantes de Auxiliares:</span>
                                  {form.diagnosticResults}
                              </div>
                          </div>
                      </div>

                      {/* 5. PLAN DE MANEJO */}
                      <div className="border border-slate-900 rounded-lg overflow-hidden">
                          <div className="bg-slate-900 p-2 text-white">
                              <p className="text-[10px] font-black uppercase text-center tracking-widest">5. Plan de Manejo y Recomendaciones (Contrarreferencia)</p>
                          </div>
                          <div className="p-4 space-y-4 text-xs font-medium uppercase">
                              <div>
                                  <span className="font-black block text-slate-900 text-[10px] mb-1">Problemas Clínicos Pendientes:</span>
                                  {form.pendingProblems || 'NINGUNO'}
                              </div>
                              <div>
                                  <span className="font-black block text-slate-900 text-[10px] mb-1">Recomendaciones para Unidad Receptora:</span>
                                  {form.recommendations}
                              </div>
                              {form.warningSigns && (
                                  <div className="mt-2 text-rose-700 font-bold">
                                      <span className="text-[10px] text-rose-500 block">Datos de Alarma (Reingreso):</span>
                                      {form.warningSigns}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* 6. FIRMAS */}
                      <div className="mt-8 pt-8 border-t-2 border-slate-900">
                           <div className="grid grid-cols-2 gap-20 mt-8">
                               <div className="text-center">
                                   <div className="border-b border-slate-900 mb-2"></div>
                                   <p className="text-[10px] font-black uppercase">{form.responsibleDoctor}</p>
                                   <p className="text-[8px] text-slate-500 uppercase">Médico que Contrarrefiere</p>
                                   <p className="text-[8px] text-slate-400 uppercase">Cédula: {form.cedulaDoctor}</p>
                               </div>
                               <div className="text-center">
                                   <div className="border-b border-slate-900 mb-2"></div>
                                   <p className="text-[10px] font-black uppercase">Sello de la Unidad</p>
                                   <p className="text-[8px] text-slate-500 uppercase">{form.sendingUnit}</p>
                               </div>
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
      <div className="bg-white border-b-8 border-cyan-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-cyan-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nota de Contrarreferencia</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ArrowRightLeft size={12} className="text-cyan-500"/> Retorno de Paciente / Alta a Primer Nivel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cyan-50 px-6 py-3 rounded-2xl border border-cyan-100 text-cyan-700">
            <Hospital size={24} />
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest">Días Estancia</p>
                <p className="text-sm font-black uppercase">{form.hospitalStayDays} Días</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: LOGÍSTICA */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Hospital size={14}/> Unidades Médicas
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Unidad que Contrarrefiere (Aquí)</label>
                        <input 
                            className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-500 cursor-not-allowed" 
                            value={form.sendingUnit} 
                            disabled 
                            title="Vinculado a Configuración del Establecimiento"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Unidad Receptora (Destino)</label>
                        <input className="w-full p-4 bg-white border-2 border-cyan-100 rounded-xl text-sm font-black uppercase outline-none focus:border-cyan-500" placeholder="Centro de Salud / Unidad..." value={form.receivingUnit} onChange={e => setForm({...form, receivingUnit: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Servicio Tratante</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.serviceUnit} onChange={e => setForm({...form, serviceUnit: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Calendar size={14}/> Estancia Hospitalaria
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Fecha Ingreso</label>
                        <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.admissionDate} onChange={e => setForm({...form, admissionDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Fecha Egreso</label>
                        <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.dischargeDate} onChange={e => setForm({...form, dischargeDate: e.target.value})} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Motivo del Egreso/Retorno</label>
                    <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" value={form.patientCondition} onChange={e => setForm({...form, patientCondition: e.target.value})}>
                        <option>Curación</option>
                        <option>Mejoría</option>
                        <option>Máximo Beneficio Hospitalario</option>
                        <option>Voluntario</option>
                        <option>Defunción</option>
                        <option>Traslado a Tercer Nivel</option>
                    </select>
                </div>
            </div>
        </div>

        {/* COLUMNA CENTRAL: RESUMEN Y PLAN */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                {/* Diagnósticos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico de Ingreso</label>
                        <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-20 resize-none outline-none" value={form.admissionDiagnosis} onChange={e => setForm({...form, admissionDiagnosis: e.target.value})} placeholder="Dx al llegar..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico de Egreso (Final)</label>
                        <textarea className="w-full p-3 bg-white border-2 border-cyan-100 rounded-xl text-xs font-black uppercase h-20 resize-none outline-none focus:border-cyan-400 transition-all" value={form.dischargeDiagnosis} onChange={e => setForm({...form, dischargeDiagnosis: e.target.value})} placeholder="Dx al salir..." />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <FileText size={14} className="text-blue-600"/> Resumen Clínico (Evolución Intra-hospitalaria)
                    </label>
                    <textarea 
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-40 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner" 
                        value={form.clinicalSummary} 
                        onChange={e => setForm({...form, clinicalSummary: e.target.value})} 
                        placeholder="Describa la evolución del paciente durante su estancia..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Activity size={14} className="text-purple-600"/> Resultados Relevantes (Auxiliares)
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-sm font-medium outline-none" 
                            value={form.diagnosticResults} 
                            onChange={e => setForm({...form, diagnosticResults: e.target.value})} 
                            placeholder="Laboratorio, Gabinete..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Stethoscope size={14} className="text-indigo-600"/> Terapéutica Empleada
                        </label>
                        <textarea 
                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-32 text-sm font-medium outline-none" 
                            value={form.proceduresPerformed} 
                            onChange={e => setForm({...form, proceduresPerformed: e.target.value})} 
                            placeholder="Procedimientos, fármacos administrados..."
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN RECOMENDACIONES (PLAN) */}
            <div className="bg-cyan-50/50 border border-cyan-100 rounded-[3rem] p-10 shadow-sm space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-cyan-700 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <ClipboardList size={14}/> Recomendaciones y Manejo (Para Unidad Receptora)
                    </label>
                    <textarea 
                        className="w-full p-6 bg-white border border-cyan-200 rounded-2xl h-32 text-sm font-bold text-cyan-900 outline-none" 
                        value={form.recommendations} 
                        onChange={e => setForm({...form, recommendations: e.target.value})} 
                        placeholder="Plan de manejo sugerido para el médico de primer nivel..."
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Problemas Clínicos Pendientes</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium" value={form.pendingProblems} onChange={e => setForm({...form, pendingProblems: e.target.value})} placeholder="Ninguno" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2 flex items-center gap-1"><AlertCircle size={10}/> Signos de Alarma</label>
                        <input className="w-full p-4 bg-white border border-rose-200 rounded-xl text-sm font-medium" placeholder="Fiebre, dolor intenso..." value={form.warningSigns} onChange={e => setForm({...form, warningSigns: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className="px-12 py-5 bg-cyan-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4">
                    <FileOutput size={20} /> Generar Contrarreferencia
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CounterReferralNote;
