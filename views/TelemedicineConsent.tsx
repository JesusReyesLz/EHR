import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Video, 
  Save, Monitor, CheckCircle2,
  Lock, PenTool, Info, Wifi, Camera, ShieldAlert,
  FileSignature, FlaskConical, FileText
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../types';

interface TelemedicineConsentProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
  onUpdatePatient?: (patient: Patient) => void; 
  doctorInfo?: DoctorInfo;
}

const TelemedicineConsent: React.FC<TelemedicineConsentProps> = ({ patients, onSaveNote, onUpdatePatient, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [acceptedTerms, setAcceptedTerms] = useState({
    remoteNature: false,
    physicalLimitation: false,
    techRisks: false,
    dataAuthorization: false,
    privacyNotice: false,
    // New Clauses
    electronicPrescription: false,
    remoteLabOrders: false
  });

  const [isSigned, setIsSigned] = useState(false);

  if (!patient) return null;

  const handleSave = () => {
    const allAccepted = Object.values(acceptedTerms).every(v => v);
    if (!allAccepted || !isSigned) {
      alert("Es obligatorio aceptar todos los puntos del consentimiento y firmar digitalmente.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `TCONS-${Date.now()}`,
      patientId: patient.id,
      type: 'Consentimiento para Telemedicina y Servicios Digitales',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo?.name || 'Dr. Alejandro Méndez',
      content: { ...acceptedTerms, location: 'Teleconsulta remota' },
      isSigned: true,
      hash: `CERT-TELE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      origin: 'Physical' 
    };
    onSaveNote(newNote);

    if (onUpdatePatient) {
        onUpdatePatient({ ...patient, hasTelemedicineConsent: true });
    }

    navigate(`/patient/${id}`);
  };

  const toggleTerm = (key: keyof typeof acceptedTerms) => {
    setAcceptedTerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-blue-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consentimiento Telemedicina</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> Servicios de Salud Digitales
            </p>
          </div>
        </div>
        <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm"><Printer size={20} /></button>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        {/* Establishment Info */}
        <div className="p-12 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <Video size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hospital General San Rafael</h2>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unidad de Teleconsulta Médica Segura</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
              <p className="text-sm font-black text-slate-900 uppercase">{patient.name}</p>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-12 space-y-10">
           <div className="p-8 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-6">
              <Info size={28} className="text-blue-600 flex-shrink-0" />
              <div className="space-y-2">
                 <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Declaración de Entendimiento</h3>
                 <p className="text-xs text-blue-800 font-medium leading-relaxed italic">
                    "Autorizo el uso de tecnologías de la información para la prestación de servicios médicos, incluyendo consulta, prescripción y solicitud de estudios a distancia."
                 </p>
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4">Aceptación de Riesgos y Alcance</h3>
              
              <div className="grid grid-cols-1 gap-4">
                 {[
                    { key: 'remoteNature', label: 'Naturaleza de la Consulta', desc: 'Entiendo que la evaluación se realiza sin contacto físico directo.', icon: <Monitor size={18} /> },
                    { key: 'physicalLimitation', label: 'Limitación de Evaluación', desc: 'Reconozco que la falta de exploración física presencial puede limitar la precisión diagnóstica.', icon: <Camera size={18} /> },
                    { key: 'techRisks', label: 'Riesgos Tecnológicos', desc: 'Acepto la posibilidad de fallos en la conexión a internet o fallas en el hardware/software.', icon: <Wifi size={18} /> },
                    { key: 'dataAuthorization', label: 'Autorización de Transmisión', desc: 'Autorizo la transmisión cifrada de mis datos, audio y video para este acto médico.', icon: <ShieldAlert size={18} /> },
                    { key: 'privacyNotice', label: 'Protección de Datos (LFPDPPP)', desc: 'He leído y acepto el aviso de privacidad para el manejo de mis datos personales sensibles.', icon: <Lock size={18} /> },
                    { key: 'electronicPrescription', label: 'Receta Electrónica', desc: 'Acepto recibir recetas médicas firmadas digitalmente y entiendo su validez legal.', icon: <FileText size={18} /> },
                    { key: 'remoteLabOrders', label: 'Estudios de Laboratorio', desc: 'Autorizo la generación de órdenes de estudios auxiliares digitales y la recepción de resultados por medios electrónicos.', icon: <FlaskConical size={18} /> }
                 ].map(item => (
                    <button 
                       key={item.key}
                       onClick={() => toggleTerm(item.key as any)}
                       className={`flex items-center gap-6 p-6 rounded-[1.5rem] border-2 transition-all text-left group ${acceptedTerms[item.key as keyof typeof acceptedTerms] ? 'bg-blue-50 border-blue-600 shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}
                    >
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${acceptedTerms[item.key as keyof typeof acceptedTerms] ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 group-hover:text-blue-600'}`}>
                          {item.icon}
                       </div>
                       <div className="flex-1">
                          <p className={`text-[10px] font-black uppercase tracking-tight ${acceptedTerms[item.key as keyof typeof acceptedTerms] ? 'text-blue-900' : 'text-slate-700'}`}>{item.label}</p>
                          <p className={`text-[9px] font-medium leading-relaxed ${acceptedTerms[item.key as keyof typeof acceptedTerms] ? 'text-blue-700' : 'text-slate-500'}`}>{item.desc}</p>
                       </div>
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${acceptedTerms[item.key as keyof typeof acceptedTerms] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
                          {acceptedTerms[item.key as keyof typeof acceptedTerms] && <CheckCircle2 size={16} />}
                       </div>
                    </button>
                 ))}
              </div>
           </div>

           {/* Digital Signature Pad */}
           <div className="pt-12 border-t border-slate-100 no-print">
              <div className="max-w-md mx-auto space-y-6 text-center">
                 <div 
                   onClick={() => setIsSigned(true)}
                   className={`h-48 border-2 border-dashed rounded-[3rem] flex items-center justify-center cursor-pointer transition-all ${isSigned ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-blue-600 group'}`}
                 >
                    {isSigned ? (
                       <div className="text-emerald-600 space-y-2">
                          <CheckCircle2 size={48} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Firmado Digitalmente</p>
                       </div>
                    ) : (
                       <div className="text-slate-400 group-hover:text-blue-600">
                          <PenTool size={40} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase mt-3">Click para Sellar Consentimiento</p>
                       </div>
                    )}
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase text-slate-900 tracking-tight">{patient.name}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Nombre y Firma del Paciente / Responsable</p>
                 </div>
              </div>
           </div>

           {/* Print Signatures */}
           <div className="hidden print:grid grid-cols-2 gap-20 pt-40">
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">{patient.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma del Paciente</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">{doctorInfo?.name || 'Dr. Alejandro Méndez'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre y Firma del Médico</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="p-10 bg-slate-900 text-white flex justify-between items-center no-print relative overflow-hidden">
           <div className="absolute right-0 top-0 h-full w-48 bg-blue-600/10 -skew-x-12 translate-x-24"></div>
           <div className="flex items-center gap-4 relative z-10">
              <Lock size={20} className="text-blue-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Certificación NOM-024 • ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
           </div>
           <div className="flex gap-4 relative z-10">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3"
              >
                 <FileSignature size={18} /> Validar Consentimiento
              </button>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 1cm !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-4xl { max-width: 100% !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .bg-blue-600 { background: #2563eb !important; -webkit-print-color-adjust: exact; }
          .border { border: 1px solid #000 !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default TelemedicineConsent;