
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Save, Info, AlertOctagon, 
  Syringe, Clock, Calendar, CheckCircle2, Lock, User
} from 'lucide-react';
import { Patient, ClinicalNote } from '../../types';

const ESAVINote: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    vaccineName: '',
    batch: '',
    manufacturer: '',
    doseNumber: '1a Dosis',
    applicationSite: 'Deltoides Brazo Izquierdo',
    applicationDate: new Date().toISOString().split('T')[0],
    applicationTime: '09:00',
    symptomsOnsetDate: new Date().toISOString().split('T')[0],
    symptomsStartTime: '09:30',
    clinicalDescription: '',
    severity: 'No Grave',
    management: '',
    outcome: 'En recuperación'
  });

  if (!patient) return null;

  const handleSave = () => {
    if (!form.vaccineName || !form.batch || !form.clinicalDescription) {
      alert("La trazabilidad del biológico y la descripción clínica son obligatorias para el reporte de ESAVI.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `ESAVI-${Date.now()}`,
      patientId: patient.id,
      type: 'Reporte de ESAVI (Vacunas)',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: true,
      hash: `CERT-ESAVI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in">
      <div className="bg-white border-b-8 border-amber-500 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex justify-between items-center no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reporte de ESAVI</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Manual de Procedimientos SINAVE / NOM-017</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
           <Syringe size={24} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden p-12 space-y-12">
        {/* I. Datos del Biológico */}
        <section className="space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4">
              <Info className="text-amber-600" /> I. Trazabilidad del Biológico
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Vacuna Aplicada</label>
                 <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-amber-50" placeholder="Ej: Pfizer, AstraZeneca..." value={form.vaccineName} onChange={e => setForm({...form, vaccineName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Lote</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold uppercase" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Dosis</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={form.doseNumber} onChange={e => setForm({...form, doseNumber: e.target.value})} />
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha y Hora de Aplicación</label>
                 <div className="flex gap-2">
                    <input type="date" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs" value={form.applicationDate} onChange={e => setForm({...form, applicationDate: e.target.value})} />
                    <input type="time" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs" value={form.applicationTime} onChange={e => setForm({...form, applicationTime: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Sitio de Aplicación</label>
                 <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={form.applicationSite} onChange={e => setForm({...form, applicationSite: e.target.value})} />
              </div>
           </div>
        </section>

        {/* II. Descripción de la Reacción */}
        <section className="space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4">
              <AlertOctagon className="text-rose-600" /> II. Manifestación Clínica del ESAVI
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio de Síntomas (Fecha/Hora)</label>
                 <div className="flex gap-2">
                    <input type="date" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs" value={form.symptomsOnsetDate} onChange={e => setForm({...form, symptomsOnsetDate: e.target.value})} />
                    <input type="time" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs" value={form.symptomsStartTime} onChange={e => setForm({...form, symptomsStartTime: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Clasificación de Gravedad</label>
                 <select className="w-full p-5 bg-rose-900 text-white rounded-2xl text-xs font-black uppercase outline-none shadow-xl" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                    <option>No Grave</option>
                    <option>Grave (Requiere Hospitalización)</option>
                    <option>Defunción</option>
                 </select>
              </div>
           </div>
           <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest block ml-2">Descripción Detallada de los Síntomas</label>
              <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-40 text-sm font-medium outline-none italic leading-relaxed shadow-inner" placeholder="Especifique: Fiebre, exantema, anafilaxia, etc..." value={form.clinicalDescription} onChange={e => setForm({...form, clinicalDescription: e.target.value})} />
           </div>
        </section>

        {/* Footer Acciones */}
        <div className="pt-10 border-t border-slate-100 flex justify-between items-center no-print">
           <div className="flex items-center gap-4">
              <Lock size={20} className="text-slate-400" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validación NOM-017 / SINAVE</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleSave}
                className="px-12 py-5 bg-amber-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4"
              >
                 <Save size={20} /> Certificar Reporte
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ESAVINote;
