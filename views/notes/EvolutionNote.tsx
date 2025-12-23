
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Save, Activity, Stethoscope, BookOpen, UserCheck, Lock, Pill
} from 'lucide-react';
import { Patient, ClinicalNote } from '../../types';

const EvolutionNote: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Cargar datos si estamos editando
  useEffect(() => {
    if (noteId) {
      const savedNotes = JSON.parse(localStorage.getItem('med_notes_v5') || '[]');
      const noteToEdit = savedNotes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        setForm(noteToEdit.content);
      }
    }
  }, [noteId]);

  if (!patient) return null;

  const handleSave = (goToPrescription: boolean = false) => {
    if (!form.subjective || !form.objective || !form.diagnosis) {
      alert("Los campos SOAP (Subjetivo, Objetivo, Diagnóstico) son requeridos conforme a NOM-004.");
      return;
    }

    const newNote: ClinicalNote = {
      id: noteId || `EVO-${Date.now()}`,
      patientId: patient.id,
      type: 'Nota de Evolución (SOAP)',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: true,
      hash: `CERT-EVO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    
    onSaveNote(newNote);

    if (goToPrescription) {
      // Navegar a receta pasando el diagnóstico y plan como estado inicial
      navigate(`/patient/${id}/prescription`, { 
        state: { 
          diagnosis: form.diagnosis,
          indicaciones: form.plan 
        } 
      });
    } else {
      navigate(`/patient/${id}`);
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
              {noteId ? 'Editando Nota de Evolución' : 'Nueva Nota de Evolución'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Formato SOAP • NOM-004-SSA3-2012</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-12 space-y-10">
        <div className="space-y-6">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <UserCheck className="text-blue-600 w-4 h-4" /> (S) Subjetivo
              </label>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium outline-none italic leading-relaxed focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="Estado general del paciente, cambios reportados..." value={form.subjective} onChange={e => setForm({...form, subjective: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <Activity className="text-blue-600 w-4 h-4" /> (O) Objetivo
              </label>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium outline-none italic leading-relaxed focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="Signos vitales, exploración física actual..." value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <BookOpen className="text-blue-600 w-4 h-4" /> (A) Análisis y Diagnóstico
              </label>
              <textarea className="w-full p-6 bg-slate-900 text-white rounded-2xl h-24 text-xs font-black uppercase outline-none shadow-xl focus:ring-4 focus:ring-blue-500/20" placeholder="Interpretación de evolución y códigos CIE-10..." value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                 <Stethoscope className="text-blue-600 w-4 h-4" /> (P) Plan Terapéutico
              </label>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium outline-none italic leading-relaxed focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="Modificaciones al tratamiento, estudios pendientes..." value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} />
           </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
           <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
           <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <button 
                onClick={() => handleSave(false)} 
                className="flex-1 md:flex-none px-12 py-5 bg-slate-100 text-slate-900 border border-slate-200 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-4"
              >
                 <Save size={20} /> Solo Guardar Nota
              </button>
              <button 
                onClick={() => handleSave(true)} 
                className="flex-1 md:flex-none px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4"
              >
                 <Pill size={20} /> Guardar y Generar Receta
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionNote;
