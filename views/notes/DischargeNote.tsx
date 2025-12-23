
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, LogOut, Calendar, 
  AlertTriangle, Info, ClipboardCheck, Lock
} from 'lucide-react';
import { Patient, ClinicalNote } from '../../types';

const DischargeNote: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    admissionDate: new Date(Date.now() - 604800000).toISOString().split('T')[0],
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeReason: 'Mejoría',
    finalDiagnosis: '',
    evolutionSummary: '',
    stayManagement: '',
    pendingProblems: 'Ninguno.',
    alarmSigns: 'Fiebre, dolor intenso, sangrado, dificultad respiratoria.',
    dischargePlan: ''
  });

  useEffect(() => {
    if (noteId) {
      const savedNotes = JSON.parse(localStorage.getItem('med_notes_v5') || '[]');
      const noteToEdit = savedNotes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) setForm(noteToEdit.content);
    }
  }, [noteId]);

  if (!patient) return null;

  const handleSave = () => {
    if (!form.finalDiagnosis || !form.evolutionSummary || !form.dischargePlan) {
      alert("Para la Nota de Egreso son obligatorios: Diagnósticos Finales, Resumen de Evolución y Plan de Manejo.");
      return;
    }

    const newNote: ClinicalNote = {
      id: noteId || `EGR-${Date.now()}`,
      patientId: patient.id,
      type: 'Nota de Egreso / Alta',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: true,
      hash: `CERT-EGR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in">
      <div className="bg-white border-b-8 border-emerald-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
               {noteId ? 'Editando Nota de Egreso' : 'Nota de Egreso / Alta'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Numeral 8.9 NOM-004</p>
          </div>
        </div>
        <LogOut className="text-emerald-600" size={32} />
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Fecha Ingreso</label>
              <input type="date" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.admissionDate} onChange={e => setForm({...form, admissionDate: e.target.value})} />
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block ml-2">Fecha Egreso</label>
              <input type="date" className="w-full p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm font-black" value={form.dischargeDate} onChange={e => setForm({...form, dischargeDate: e.target.value})} />
           </div>
        </div>

        <div className="space-y-4">
           <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest block ml-2 flex items-center gap-2">
              <ClipboardCheck size={14} className="text-emerald-600" /> Diagnósticos Finales
           </label>
           <textarea className="w-full p-6 bg-slate-900 text-white rounded-2xl h-24 text-xs font-black uppercase outline-none" value={form.finalDiagnosis} onChange={e => setForm({...form, finalDiagnosis: e.target.value})} placeholder="Diagnósticos CIE-10..." />
        </div>

        <div className="space-y-4">
           <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest block ml-2">Evolución y Estado Actual</label>
           <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-40 text-sm font-medium outline-none italic" value={form.evolutionSummary} onChange={e => setForm({...form, evolutionSummary: e.target.value})} />
        </div>

        <div className="pt-10 border-t border-slate-100 flex justify-end">
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button onClick={handleSave} className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4">
                 <Save size={20} /> Guardar Egreso
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DischargeNote;
