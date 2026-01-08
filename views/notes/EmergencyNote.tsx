
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, AlertTriangle, Activity, Stethoscope, 
  HeartPulse, Clock, Lock, Thermometer, Wind, Droplet, Brain, Siren,
  Bone, FileText, Syringe, Ambulance, Scale
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

interface EmergencyNoteProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

const EmergencyNote: React.FC<EmergencyNoteProps> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [triageLevel, setTriageLevel] = useState('Amarillo');
  const [vitals, setVitals] = useState<Vitals & { glucose: string, glasgow: string, pain: string }>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: '',
      glucose: '', glasgow: '15', pain: '0'
  });

  const [form, setForm] = useState({
    admissionDate: new Date().toISOString().split('T')[0],
    admissionTime: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}),
    accidentType: 'No aplica / Enfermedad General',
    motivoAtencion: '',
    ahfm: '', 
    app: '',  
    apnp: '', 
    padecimientoActual: '', 
    ipays: '', 
    exploracionFisica: '', 
    estadoMental: '', 
    pruebasRealizadas: '', 
    diagnosticoInicial: '',
    planTratamiento: '', 
    procedimientosRealizados: '', 
    pronostico: 'Reservado a evolución',
    destino: 'Observación Urgencias' 
  });

  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  useEffect(() => {
    if (patient && !noteId) {
       if (patient.currentVitals) {
           setVitals(prev => ({...prev, ...patient.currentVitals}));
       }
    }

    if (noteId) {
      const noteToEdit = notes.find((n: ClinicalNote) => n.id === noteId);
      if (noteToEdit) {
        if (noteToEdit.isSigned) setIsNoteFinalized(true);
        setForm(noteToEdit.content as any);
        if (noteToEdit.content.vitals) setVitals(noteToEdit.content.vitals);
        if (noteToEdit.content.triageLevel) setTriageLevel(noteToEdit.content.triageLevel);
      }
    }
  }, [noteId, notes, patient]);

  if (!patient) return null;

  if (isNoteFinalized) return (
    <div className="p-20 text-center space-y-6">
       <Lock className="w-16 h-16 text-rose-600 mx-auto" />
       <h2 className="text-3xl font-black uppercase text-slate-900">Nota de Urgencias Cerrada</h2>
       <p className="text-slate-500 max-w-md mx-auto font-medium">Registro médico legal inmutable.</p>
       <button onClick={() => navigate(`/patient/${id}`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Volver</button>
    </div>
  );

  const handleSave = (finalize: boolean) => {
    if (finalize) {
        if (!form.motivoAtencion || !form.diagnosticoInicial || !form.padecimientoActual) {
            alert("Campos obligatorios faltantes.");
            return;
        }
        if (!window.confirm("¿Certificar Nota de Urgencias?")) return;
    }

    const newNoteId = noteId || `URG-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: patient.id,
      type: 'Nota Inicial de Urgencias',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo?.name || 'Dr. Alejandro Méndez',
      content: { ...form, vitals, triageLevel },
      isSigned: finalize,
      hash: finalize ? `CERT-URG-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`, { state: finalize ? { openNoteId: newNoteId } : {} });
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header UI (igual al anterior) */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nota de Urgencias</h1>
        </div>
      </div>
      {/* Resto del formulario... */}
      <div className="bg-white p-12 rounded-[3rem] shadow-sm space-y-8">
         <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-slate-400">Motivo de Atención</label>
             <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.motivoAtencion} onChange={e => setForm({...form, motivoAtencion: e.target.value})} />
         </div>
         <div className="flex justify-end gap-4">
            <button onClick={() => handleSave(false)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs">Borrador</button>
            <button onClick={() => handleSave(true)} className="px-10 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-xs shadow-xl">Certificar Nota</button>
         </div>
      </div>
    </div>
  );
};

export default EmergencyNote;
