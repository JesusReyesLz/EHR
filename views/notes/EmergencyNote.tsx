
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, AlertTriangle, Activity, Stethoscope, HeartPulse, Clock, Lock
} from 'lucide-react';
import { Patient, ClinicalNote } from '../../types';

// Fix: Add notes to props interface to match usage in App.tsx
const EmergencyNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    triage: 'Verde',
    motivoAtencion: '',
    antecedentesRelevantes: '',
    exploracionFisica: '',
    pruebasDiagnosticas: '',
    diagnosticoInicial: '',
    planUrgencias: '',
    pronostico: 'Reservado a evolución',
    destino: 'Hospitalización'
  });

  // Fix: Use notes prop instead of direct localStorage access for consistency
  useEffect(() => {
    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) setForm(noteToEdit.content as any);
    }
  }, [noteId, notes]);

  if (!patient) return null;

  const handleSave = () => {
    if (!form.motivoAtencion || !form.diagnosticoInicial) {
      alert("El motivo de atención y diagnóstico inicial son obligatorios en urgencias.");
      return;
    }

    const legalMsg = "Atención: Al guardar este registro de Urgencias, quedará integrado de forma permanente en el expediente clínico. ¿Desea proceder?";
    if (!window.confirm(legalMsg)) return;

    const newNoteId = noteId || `URG-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: patient.id,
      type: 'Nota Inicial de Urgencias',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: true,
      hash: `CERT-URG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: { openNoteId: newNoteId } });
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in">
      <div className="bg-white border-b-8 border-rose-600 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
               {noteId ? 'Editando Nota de Urgencias' : 'Nota Inicial Urgencias'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Protocolo Inicial NOM-004</p>
          </div>
        </div>
        <select 
          className={`p-4 rounded-xl text-white font-black text-xs uppercase shadow-lg border-none outline-none ${form.triage === 'Rojo' ? 'bg-rose-600' : form.triage === 'Amarillo' ? 'bg-amber-500' : 'bg-emerald-600'}`}
          value={form.triage}
          onChange={e => setForm({...form, triage: e.target.value})}
        >
          <option value="Verde">Verde (No Urgente)</option>
          <option value="Amarillo">Amarillo (Urgencia)</option>
          <option value="Rojo">Rojo (Emergencia)</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-12 space-y-10">
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Motivo de la Atención</label>
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-bold outline-none focus:bg-white transition-all" value={form.motivoAtencion} onChange={e => setForm({...form, motivoAtencion: e.target.value})} />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnóstico Inicial</label>
                 <textarea className="w-full p-5 bg-slate-900 text-white border-none rounded-2xl h-24 text-xs font-black uppercase outline-none" value={form.diagnosticoInicial} onChange={e => setForm({...form, diagnosticoInicial: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Plan y Tratamiento</label>
                 <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium outline-none focus:bg-white" value={form.planUrgencias} onChange={e => setForm({...form, planUrgencias: e.target.value})} />
              </div>
           </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex justify-end">
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button onClick={handleSave} className="px-12 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4">
                 <Save size={20} /> Firmar Nota de Urgencias
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyNote;
