
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Users, AlertTriangle, CheckCircle2,
  Lock, PenTool, Info, Search, AlertOctagon, MapPin,
  BookOpen, FileSignature
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../types';

interface InformedConsentProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

const InformedConsent: React.FC<InformedConsentProps> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [isSigned, setIsSigned] = useState(false);
  const [form, setForm] = useState({
    authorizedAct: 'PROCEDIMIENTO GENERAL',
    risks: 'Infección, sangrado, complicaciones anestésicas.',
    benefits: 'Mejoría del estado de salud actual.',
    contingencyAuth: true
  });

  if (!patient) return null;

  const handleSave = () => {
    if (!isSigned) return alert("Debe sellar el documento para continuar.");
    const newNote: ClinicalNote = {
      id: `CONS-${Date.now()}`,
      patientId: patient.id,
      type: 'Carta de Consentimiento Informado',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo?.name || 'Dr. Alejandro Méndez',
      content: { ...form },
      isSigned: true,
      hash: `CERT-CONS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in duration-500">
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex justify-between items-center no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-slate-900 uppercase">Consentimiento Informado</h1>
        </div>
      </div>

      <div className="bg-white p-16 rounded-[3rem] shadow-sm space-y-12">
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
              <p className="text-xs text-slate-600 font-medium leading-relaxed uppercase italic">
                  "Confirmo que he sido informado de los riesgos y beneficios del acto médico y autorizo voluntariamente su realización."
              </p>
          </div>
          
          <div 
             onClick={() => setIsSigned(!isSigned)}
             className={`h-48 border-4 border-dashed rounded-[3rem] flex items-center justify-center cursor-pointer transition-all ${isSigned ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-blue-600 group'}`}
          >
             {isSigned ? <CheckCircle2 size={48} className="text-emerald-600" /> : <FileSignature size={48} className="text-slate-300" />}
          </div>

          <button onClick={handleSave} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-emerald-600 transition-all">Certificar Consentimiento</button>
      </div>
    </div>
  );
};

export default InformedConsent;
