
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Stethoscope, BookOpen, UserCheck, Lock, Pill
} from 'lucide-react';
import { Patient, ClinicalNote } from '../../types';

const EvolutionNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    subjective: '',
    objective: '',
    analysis: '',
    diagnosis: '',
    plan: '',
    prognosisLife: 'Bueno',
    prognosisFunction: 'Bueno'
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (noteId) {
      const existing = notes.find(n => n.id === noteId);
      if (existing) {
        if (existing.isSigned) setIsNoteFinalized(true);
        // Fix: Cast existing.content to any to fix property mismatch with evolution form state
        setForm(existing.content as any);
      }
    }
  }, [noteId, notes]);

  if (!patient) return null;
  
  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6">
       <Lock className="w-16 h-16 text-rose-600 mx-auto" />
       <h2 className="text-2xl font-black uppercase">Nota Sellada e Inmutable</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium">Esta nota ya ha sido certificada conforme a la NOM-004 y no permite ediciones.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Volver al Perfil</button>
    </div>
  );

  const handleSave = (finalize: boolean = false, goToPrescription: boolean = false) => {
    if (!form.subjective || !form.objective || !form.diagnosis) {
      alert("Los campos SOAP (Subjetivo, Objetivo, Diagnóstico) son obligatorios.");
      return;
    }

    if (finalize) {
      const legalMsg = "¿Desea finalizar la nota y generar el documento ahora o seguir editando?\n\n(Al finalizar, el registro será inmutable conforme a la NOM-004)";
      if (!window.confirm(legalMsg)) return;
    }

    const currentNoteId = noteId || `EVO-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: 'Nota de Evolución (SOAP)',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: finalize,
      hash: finalize ? `CERT-EVO-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);

    if (goToPrescription) {
      // Navegación inmediata a receta con diagnóstico
      navigate(`/patient/${id}/prescription`, { 
        state: { 
          diagnosis: form.diagnosis, 
          indicaciones: form.plan 
        } 
      });
    } else {
      // Navegación inmediata al perfil y apertura del visor si está finalizada
      navigate(`/patient/${id}`, { 
        state: finalize ? { openNoteId: currentNoteId } : {} 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in">
      <div className="bg-white border-b-8 border-blue-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {noteId ? 'Editando Nota' : 'Nueva Nota de Evolución'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Formato SOAP • NOM-004</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-12 space-y-10">
        <div className="space-y-6">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <UserCheck className="text-blue-600 w-4 h-4" /> (S) Subjetivo
              </label>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none italic focus:bg-white" value={form.subjective} onChange={e => setForm({...form, subjective: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <Activity className="text-blue-600 w-4 h-4" /> (O) Objetivo
              </label>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none italic focus:bg-white" value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <BookOpen className="text-blue-600 w-4 h-4" /> (A) Análisis y Diagnóstico
              </label>
              <textarea className="w-full p-6 bg-slate-900 text-white rounded-2xl h-24 text-xs font-black uppercase outline-none shadow-xl" value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <Stethoscope className="text-blue-600 w-4 h-4" /> (P) Plan Terapéutico
              </label>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm outline-none focus:bg-white" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} />
           </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
           <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
           <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <button onClick={() => handleSave(false, false)} className="px-8 py-5 bg-slate-100 text-slate-900 border border-slate-200 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3">
                 <Save size={16} /> Guardar Borrador
              </button>
              <button onClick={() => handleSave(true, false)} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3">
                 <ShieldCheck size={18} /> Finalizar y Sellar Nota
              </button>
              <button onClick={() => handleSave(true, true)} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-3">
                 <Pill size={18} /> Sellar y Generar Receta
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionNote;
