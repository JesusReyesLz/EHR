
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, Activity, ShieldCheck, HeartPulse, Scale, Thermometer,
  FileText, Search, Heart, Dna, Printer, Plus, Pill, AlertCircle,
  Stethoscope, Droplets, BookOpen, UserCheck, AlertTriangle, Trash2, Microscope,
  Send, MessageCircle, ClipboardCheck, UserPlus, Truck, MapPinned, Building2,
  Repeat, CheckCircle, Lightbulb, Zap, Brain, Clipboard, Scissors, Clock, 
  Calendar as CalendarIcon, Timer, Wind, Droplet, Users, ShieldAlert, Check,
  LogOut, Info, AlertOctagon, ChevronLeft, Save
} from 'lucide-react';
import { ClinicalNote, Vitals, MedicationPrescription, MedicationStock } from '../types';
import { VADEMECUM_DB } from '../constants';

interface NoteEditorProps {
  onSave: (note: ClinicalNote) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ onSave }) => {
  const { id, noteType } = useParams();
  const navigate = useNavigate();
  const type = decodeURIComponent(noteType || 'Nota Clínica');

  const isEvolution = type.toLowerCase().includes('evolución');
  const isPostOp = type.toLowerCase().includes('post-operatoria') || type.toLowerCase().includes('operatoria post');
  const isPreOp = type.toLowerCase().includes('pre-operatoria') || type.toLowerCase().includes('operatoria pre');
  const isAnesthesia = type.toLowerCase().includes('anestésica') || type.toLowerCase().includes('anestesia');
  const isDischarge = type.toLowerCase().includes('egreso') || type.toLowerCase().includes('alta');
  const isEmergency = type.toLowerCase().includes('urgencias');

  const [form, setForm] = useState({
    subjective: '', 
    objective: '',  
    diagnosis: '',  
    plan: '',       
    interpretacionEstudios: '', 
    cuidadosGenerales: 'Control de signos vitales cada 15 min por 2 horas, luego cada hora. Vigilar sangrado.',
    prognosisLife: 'Bueno',
    prognosisFunction: 'Bueno',
    // Campos Quirúrgicos
    diagnosisPre: '',
    diagnosisPost: '',
    operationPlanned: '',
    operationRealized: '',
    technique: '',
    findings: '',
    incidentes: 'Sin incidentes reportados.',
    bleeding: 'Mínimo',
    // Campos Anestesia
    airwayEval: 'Mallampati I',
    anesthesiaProposed: 'General Balanceada',
    // Campos Egreso
    admissionDate: new Date().toISOString().split('T')[0],
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeReason: 'Mejoría',
    finalDiagnosis: '',
    evolutionSummary: '',
  });

  const [vitals, setVitals] = useState<Vitals>({
    bp: '120/80', temp: 36.6, hr: 72, rr: 18, o2: 98, weight: 70, height: 170, bmi: 24.2, date: new Date().toISOString()
  });

  const [isSigning, setIsSigning] = useState(false);

  const saveNote = () => {
    const newNoteId = `NOTE-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: newNoteId,
      patientId: id || '',
      type: type,
      date: new Date().toLocaleString('es-MX'),
      author: 'JESUS REYES LOZANO',
      content: { ...form, vitals },
      isSigned: true,
      hash: `CERT-SHA256-${Math.random().toString(36).substr(2, 12).toUpperCase()}`
    };
    onSave(newNote);
    navigate(`/patient/${id}`, { state: { openNoteId: newNoteId } });
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{type}</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Cumplimiento NOM-004-SSA3</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
        <div className="space-y-10">
          
          <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border-4 border-white/5">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center text-blue-400 mb-10">
              <HeartPulse className="w-6 h-6 mr-4" /> Signos Vitales Asociados a la Nota
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {[
                { label: 'Tensión Art.', key: 'bp', icon: <Droplets size={12} /> },
                { label: 'Temp °C', key: 'temp', icon: <Thermometer size={12} /> },
                { label: 'Frec. Card.', key: 'hr', icon: <Activity size={12} /> },
                { label: 'SatO2 %', key: 'o2', icon: <Wind size={12} /> }
              ].map(v => (
                <div key={v.key} className="space-y-3">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center">{v.icon} <span className="ml-2">{v.label}</span></label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-black text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={(vitals as any)[v.key]}
                    onChange={e => setVitals({...vitals, [v.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[3.5rem] p-12 shadow-sm space-y-8">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-900 uppercase block ml-2">Diagnóstico / Resumen del caso</label>
                   <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-black uppercase outline-none focus:bg-white" value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} />
                </div>
                {isAnesthesia && (
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-600 uppercase block ml-2">Evaluación de Vía Aérea</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={form.airwayEval} onChange={e => setForm({...form, airwayEval: e.target.value})} />
                   </div>
                )}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-900 uppercase block ml-2">Descripción Clínica / Hallazgos</label>
                   <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-64 text-sm font-medium italic leading-relaxed outline-none shadow-inner" value={form.subjective} onChange={e => setForm({...form, subjective: e.target.value})} />
                </div>
             </div>
          </div>

          <button 
             onClick={() => setIsSigning(true)}
             className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-5"
          >
             <ShieldCheck size={24} /> Firmar y Certificar Documento
          </button>
        </div>
      </div>

      {isSigning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white rounded-[4rem] p-16 max-w-xl w-full text-center space-y-12 shadow-2xl border-4 border-blue-600">
              <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto" />
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Certificación Digital</h2>
              <p className="text-slate-500 text-sm font-medium uppercase leading-relaxed">Al firmar esta nota, usted certifica la veracidad de los datos y se integrará de forma inmutable al expediente conforme a la NOM-004.</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsSigning(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px]">Revisar</button>
                 <button onClick={saveNote} className="flex-2 px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl">Confirmar y Sellar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
