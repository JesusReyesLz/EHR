
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Users, Stethoscope, 
  MessageSquare, BookOpen, Lock, PenTool
} from 'lucide-react';
import { Patient, ClinicalNote } from '../../types';

// Fix: Add notes to props interface to satisfy compiler requirements from App.tsx
const InterconsultaNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    requestedBy: '',
    serviceRequesting: '',
    consultReason: '',
    specialistCriterion: '',
    suggestedManagement: '',
    diagnosticCertainty: 'Presuntivo'
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  // Fix: Use notes prop instead of direct localStorage to find note to edit
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
       <h2 className="text-2xl font-black uppercase tracking-tight">Interconsulta Certificada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium">Este dictamen de especialista ha sido sellado y no puede ser modificado por normativa sanitaria.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Regresar</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (!form.consultReason || !form.specialistCriterion) {
      alert("El motivo de la interconsulta y el criterio del especialista son obligatorios.");
      return;
    }

    if (finalize) {
      const legalMsg = "Atención: Al finalizar este registro médico, se integrará de forma permanente al expediente clínico conforme a la NOM-004-SSA3-2012. Una vez certificado, NO podrá ser editado ni eliminado. ¿Desea proceder?";
      if (!window.confirm(legalMsg)) return;
    }

    const currentNoteId = noteId || `INT-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Interconsulta',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez (Especialista)',
      content: { ...form },
      isSigned: finalize,
      hash: finalize ? `CERT-INT-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
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
               {noteId ? 'Editando Interconsulta' : 'Nota de Interconsulta'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Numeral 8.6 NOM-004</p>
          </div>
        </div>
        <Users className="text-indigo-600" size={32} />
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-12 space-y-10">
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Médico que solicita</label>
              <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.requestedBy} onChange={e => setForm({...form, requestedBy: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest block ml-2">Motivo de la Interconsulta</label>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none italic" value={form.consultReason} onChange={e => setForm({...form, consultReason: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest block ml-2">Criterio Diagnóstico Specialist</label>
              <textarea className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] h-40 text-sm font-bold outline-none leading-relaxed" value={form.specialistCriterion} onChange={e => setForm({...form, specialistCriterion: e.target.value})} />
           </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex justify-end gap-4">
           <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
           <button onClick={() => handleSave(false)} className="px-10 py-5 bg-slate-50 text-slate-900 border border-slate-200 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">
              Guardar Avance
           </button>
           <button onClick={() => handleSave(true)} className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4">
              <Save size={20} /> Certificar Dictamen
           </button>
        </div>
      </div>
    </div>
  );
};

export default InterconsultaNote;
