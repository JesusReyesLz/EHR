
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, LogOut, Calendar, 
  AlertTriangle, ClipboardCheck, Lock, Skull, 
  Activity, FileText, AlertOctagon, Utensils, Droplet, 
  Syringe, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../../types';

const DischargeNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void, doctorInfo?: DoctorInfo }> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    // Logística
    admissionDate: '', // Se intentará llenar con patient.lastVisit
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeTime: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}),
    stayDays: 0,
    
    // Tipo de Egreso
    dischargeType: 'Por Mejoría', // Máximo Beneficio, Defunción, Voluntario, Traslado, Fuga
    isReadmission: false, // Reingreso por misma afección en el año
    
    // Diagnósticos
    admissionDiagnosis: '',
    principalDiagnosis: '', // Final
    secondaryDiagnoses: '',
    
    // Resumen Clínico
    evolutionSummary: '',
    hospitalManagement: '', // Manejo durante la estancia
    
    // Factores de Riesgo (Toxicomanías)
    riskFactors: {
        alcohol: false,
        tobacco: false,
        drugs: false,
        intervention: 'Se brindó consejería médica sobre estilo de vida.'
    },

    // Plan de Egreso
    pendingProblems: 'Ninguno',
    dischargePlan: '', // Medicamentos y tratamiento
    ambulatorySurveillance: 'Datos de alarma: Fiebre, dolor intenso, sangrado. Acudir a urgencias.',
    
    // Pronóstico
    prognosis: 'Reservado a evolución',
    
    // En caso de Defunción
    causeOfDeath: '',
    necropsyPerformed: false,
    necropsyReason: ''
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  // Auto-cálculo de días estancia
  useEffect(() => {
    if (form.admissionDate && form.dischargeDate) {
        const start = new Date(form.admissionDate);
        const end = new Date(form.dischargeDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        setForm(prev => ({ ...prev, stayDays: diffDays }));
    }
  }, [form.admissionDate, form.dischargeDate]);

  useEffect(() => {
    if (patient && !noteId) {
        // Intentar pre-llenar fecha ingreso y diagnóstico inicial
        setForm(prev => ({
            ...prev,
            admissionDate: patient.lastVisit || new Date().toISOString().split('T')[0],
            admissionDiagnosis: patient.reason || ''
        }));
    }

    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content as any);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6 animate-in fade-in">
       <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-2xl">
          <Lock className="w-10 h-10 text-emerald-400" />
       </div>
       <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Nota de Egreso Certificada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">El resumen clínico de egreso ha sido sellado legalmente y forma parte del expediente clínico.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Regresar al Expediente</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.principalDiagnosis || !form.evolutionSummary || !form.dischargePlan) {
            alert("Campos críticos faltantes: Diagnóstico Principal, Resumen de Evolución o Plan de Manejo.");
            return;
        }
        if (form.dischargeType === 'Defunción' && !form.causeOfDeath) {
            alert("Debe especificar la Causa de Muerte para un egreso por Defunción.");
            return;
        }
        if (!window.confirm("¿Certificar Nota de Egreso? Esta acción finalizará el episodio de hospitalización.")) return;
    }

    const currentNoteId = noteId || `EGR-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Egreso / Alta',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo?.name || 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: finalize,
      hash: finalize ? `CERT-EGR-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  const isDeath = form.dischargeType === 'Defunción';

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header */}
      <div className={`border-b-8 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40 ${isDeath ? 'bg-slate-900 border-slate-700' : 'bg-white border-emerald-600'}`}>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className={`p-4 rounded-2xl transition-all shadow-sm ${isDeath ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black uppercase tracking-tight ${isDeath ? 'text-white' : 'text-slate-900'}`}>
               {noteId ? 'Editando Egreso' : 'Nota de Egreso'}
            </h1>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2 ${isDeath ? 'text-slate-400' : 'text-slate-400'}`}>
                <ShieldCheck size={12} className={isDeath ? 'text-rose-500' : 'text-emerald-500'}/> NOM-004-SSA3-2012 • Resumen Clínico
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${isDeath ? 'bg-slate-800 border-slate-700 text-rose-500' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
             {isDeath ? <Skull size={20} /> : <LogOut size={20} />}
             <div>
                 <p className="text-[9px] font-black uppercase tracking-widest">Tipo de Egreso</p>
                 <p className="text-sm font-black uppercase">{form.dischargeType}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: LOGÍSTICA Y DIAGNÓSTICO */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* 1. TIPO DE EGRESO Y FECHAS */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Calendar size={14}/> Estancia y Motivo
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Motivo de Egreso</label>
                        <select 
                            className={`w-full p-4 border-2 rounded-xl text-xs font-black uppercase outline-none ${isDeath ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200'}`}
                            value={form.dischargeType} 
                            onChange={e => setForm({...form, dischargeType: e.target.value})}
                        >
                            <option>Por Mejoría</option>
                            <option>Por Máximo Beneficio</option>
                            <option>Voluntario / Alta Pedida</option>
                            <option>Traslado a otra Unidad</option>
                            <option>Defunción</option>
                            <option>Fuga</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Ingreso</label>
                            <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.admissionDate} onChange={e => setForm({...form, admissionDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Egreso</label>
                            <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={form.dischargeDate} onChange={e => setForm({...form, dischargeDate: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-500">Días Estancia</span>
                        <span className="text-xl font-black text-slate-900">{form.stayDays}</span>
                    </div>

                    <div 
                        onClick={() => setForm({...form, isReadmission: !form.isReadmission})}
                        className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${form.isReadmission ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                        <div className="flex items-center gap-2">
                             <AlertOctagon size={14} />
                             <span className="text-[9px] font-black uppercase">Reingreso (Mismo Año/Dx)</span>
                        </div>
                        {form.isReadmission && <CheckCircle2 size={16} />}
                    </div>
                </div>
            </div>

            {/* 2. DIAGNÓSTICOS */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <ClipboardCheck size={14}/> Diagnósticos Finales
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Diagnóstico de Ingreso</label>
                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none h-16 outline-none" value={form.admissionDiagnosis} onChange={e => setForm({...form, admissionDiagnosis: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-blue-600 uppercase ml-2">Diagnóstico Principal (Egreso)</label>
                        <textarea className="w-full p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black text-blue-900 resize-none h-20 outline-none uppercase" value={form.principalDiagnosis} onChange={e => setForm({...form, principalDiagnosis: e.target.value})} placeholder="CIE-10 Principal" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Diagnósticos Secundarios</label>
                        <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium resize-none h-20 outline-none" value={form.secondaryDiagnoses} onChange={e => setForm({...form, secondaryDiagnoses: e.target.value})} placeholder="Comorbilidades..." />
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN Y PLAN */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* SECCIÓN ESPECIAL DE DEFUNCIÓN */}
            {isDeath && (
                <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl border-l-8 border-rose-600 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-4 mb-6 text-rose-500 border-b border-white/10 pb-4">
                         <Skull size={24} />
                         <h3 className="text-lg font-black uppercase tracking-widest">Registro de Defunción (Exitus Letalis)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Causa Directa de Muerte (Certificado)</label>
                             <textarea 
                                className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-sm font-black text-white outline-none h-24 resize-none uppercase"
                                placeholder="Coincidir con Certificado de Defunción..."
                                value={form.causeOfDeath}
                                onChange={e => setForm({...form, causeOfDeath: e.target.value})}
                             />
                        </div>
                        <div className="space-y-4">
                             <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                                 <span className="text-xs font-bold uppercase">¿Se realizó Necropsia?</span>
                                 <div className="flex gap-2">
                                     <button onClick={() => setForm({...form, necropsyPerformed: true})} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${form.necropsyPerformed ? 'bg-rose-600 text-white' : 'bg-white/10 text-slate-400'}`}>Sí</button>
                                     <button onClick={() => setForm({...form, necropsyPerformed: false})} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!form.necropsyPerformed ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'}`}>No</button>
                                 </div>
                             </div>
                             {form.necropsyPerformed && (
                                <input 
                                   className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white outline-none"
                                   placeholder="Folio / Razón..."
                                   value={form.necropsyReason}
                                   onChange={e => setForm({...form, necropsyReason: e.target.value})}
                                />
                             )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. RESUMEN CLÍNICO */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 flex items-center gap-2">
                        <Activity size={14}/> Resumen de Evolución y Manejo
                    </h4>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Resumen de la Evolución y Estado Actual</label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner leading-relaxed" 
                            value={form.evolutionSummary} 
                            onChange={e => setForm({...form, evolutionSummary: e.target.value})} 
                            placeholder="Describa la evolución intrahospitalaria, complicaciones y resolución..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Manejo durante la Estancia (Procedimientos/Tratamientos)</label>
                        <textarea 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner" 
                            value={form.hospitalManagement} 
                            onChange={e => setForm({...form, hospitalManagement: e.target.value})} 
                            placeholder="Cirugías, esquema antibiótico, transfusiones..."
                        />
                    </div>
                </div>

                {/* 2. FACTORES DE RIESGO (TOXICOMANÍAS) */}
                <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} /> Factores de Riesgo (Atención a Adicciones)
                    </h4>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer">
                            <input type="checkbox" checked={form.riskFactors.alcohol} onChange={e => setForm({...form, riskFactors: {...form.riskFactors, alcohol: e.target.checked}})} className="accent-amber-600 w-4 h-4"/>
                            <span className="text-[10px] font-bold uppercase text-slate-600">Alcoholismo</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer">
                            <input type="checkbox" checked={form.riskFactors.tobacco} onChange={e => setForm({...form, riskFactors: {...form.riskFactors, tobacco: e.target.checked}})} className="accent-amber-600 w-4 h-4"/>
                            <span className="text-[10px] font-bold uppercase text-slate-600">Tabaquismo</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer">
                            <input type="checkbox" checked={form.riskFactors.drugs} onChange={e => setForm({...form, riskFactors: {...form.riskFactors, drugs: e.target.checked}})} className="accent-amber-600 w-4 h-4"/>
                            <span className="text-[10px] font-bold uppercase text-slate-600">Otras Drogas</span>
                        </label>
                    </div>
                    {(form.riskFactors.alcohol || form.riskFactors.tobacco || form.riskFactors.drugs) && (
                        <div className="space-y-1 animate-in slide-in-from-top-2">
                             <label className="text-[8px] font-black text-amber-600 uppercase ml-2">Intervención / Consejería Realizada</label>
                             <input className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-800 placeholder-amber-300 outline-none" value={form.riskFactors.intervention} onChange={e => setForm({...form, riskFactors: {...form.riskFactors, intervention: e.target.value}})} />
                        </div>
                    )}
                </div>

                {/* 3. PLAN DE EGRESO */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} /> Plan de Manejo y Tratamiento
                    </h4>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Recomendaciones para Vigilancia Ambulatoria</label>
                        <textarea 
                            className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl h-20 text-xs font-bold text-emerald-900 outline-none" 
                            value={form.ambulatorySurveillance} 
                            onChange={e => setForm({...form, ambulatorySurveillance: e.target.value})} 
                            placeholder="Datos de alarma, cuidados de herida..."
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Problemas Clínicos Pendientes</label>
                            <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium" value={form.pendingProblems} onChange={e => setForm({...form, pendingProblems: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pronóstico</label>
                            <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium" value={form.prognosis} onChange={e => setForm({...form, prognosis: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Plan Farmacológico y Terapéutico (Receta de Alta)</label>
                        <textarea 
                            className="w-full p-6 bg-white border border-slate-200 rounded-2xl h-32 text-sm font-medium outline-none resize-none" 
                            value={form.dischargePlan} 
                            onChange={e => setForm({...form, dischargePlan: e.target.value})} 
                            placeholder="Medicamentos, dosis, horario, duración, dieta, cita abierta..."
                        />
                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                    Guardar Borrador
                </button>
                <button onClick={() => handleSave(true)} className={`px-12 py-5 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-4 ${isDeath ? 'bg-slate-900 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    <LogOut size={20} /> Certificar Egreso
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DischargeNote;
