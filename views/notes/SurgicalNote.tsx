
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Scissors, Activity, HeartPulse, ClipboardCheck, Info, Droplets, UserCheck, Lock
} from 'lucide-react';
import { Patient, ClinicalNote } from '../../types';

// Fix: Add notes to props interface to match routing in App.tsx
const SurgicalNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);
  const type = location.state?.noteType || 'Nota Post-operatoria';

  const isPost = type.includes('Post');
  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  const [form, setForm] = useState({
    diagnosisPre: '',
    diagnosisPost: '',
    operationPlanned: '',
    operationRealized: '',
    findings: '',
    gasasCount: true,
    bleeding: 'Sin sangrado importante',
    incidentes: 'Sin incidentes',
    surgeon: 'Dr. Alejandro Méndez',
    anesthesiologist: 'Dr. Roberto Cruz',
    surgicalRisk: 'ASA I',
    technique: ''
  });

  // Fix: Use notes prop instead of direct localStorage to resolve note to edit
  useEffect(() => {
    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content as any);
      }
    }
  }, [noteId, notes]);

  if (!patient) return null;
  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6">
       <Lock className="w-16 h-16 text-rose-600 mx-auto" />
       <h2 className="text-2xl font-black uppercase">Registro Quirúrgico Inmutable</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium">Este documento ya ha sido sellado legalmente y forma parte inalterable del expediente clínico.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Cerrar</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
      const legalMsg = "Atención: Al finalizar este registro médico quirúrgico, se integrará de forma permanente al expediente clínico conforme a la NOM-004-SSA3-2012. Una vez certificado, NO podrá ser editado ni eliminado. ¿Desea proceder?";
      if (!window.confirm(legalMsg)) return;
    }

    const currentNoteId = noteId || `SURG-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: type,
      date: new Date().toLocaleString('es-MX'),
      author: form.surgeon,
      content: { ...form },
      isSigned: finalize,
      hash: finalize ? `CERT-SURG-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in">
      <div className="bg-white border-b-8 border-indigo-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
               {noteId ? `Editando ${type}` : type}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Numeral 8.7 y 8.8 NOM-004-SSA3</p>
          </div>
        </div>
        <Scissors className="text-indigo-600" size={32} />
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-12 space-y-10">
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico Pre-operatorio</label>
                 <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-bold" value={form.diagnosisPre} onChange={e => setForm({...form, diagnosisPre: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Operación Realizada / Técnica</label>
                 <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-bold" value={form.operationRealized} onChange={e => setForm({...form, operationRealized: e.target.value})} />
              </div>
           </div>

           {isPost && (
             <>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-2">Hallazgos Quirúrgicos</label>
                  <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-32 text-sm italic" value={form.findings} onChange={e => setForm({...form, findings: e.target.value})} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase">Gasas/Compresas Ok</span>
                     <input type="checkbox" checked={form.gasasCount} onChange={e => setForm({...form, gasasCount: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Sangrado</label>
                     <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={form.bleeding} onChange={e => setForm({...form, bleeding: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Riesgo ASA</label>
                     <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={form.surgicalRisk} onChange={e => setForm({...form, surgicalRisk: e.target.value})} />
                  </div>
               </div>
             </>
           )}
        </div>

        <div className="pt-10 border-t border-slate-100 flex justify-end gap-4">
            <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Descartar</button>
            <button onClick={() => handleSave(false)} className="px-10 py-5 bg-slate-100 text-slate-900 border border-slate-200 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">
               <Save size={18} className="inline mr-2" /> Guardar Avance
            </button>
            <button onClick={() => handleSave(true)} className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4">
               <ShieldCheck size={20} /> Certificar y Finalizar
            </button>
        </div>
      </div>
    </div>
  );
};

export default SurgicalNote;
