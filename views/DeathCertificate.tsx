
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Landmark, AlertTriangle, CheckCircle2,
  Lock, PenTool, ClipboardCheck, Info, Clock, Skull,
  Calendar, MapPin, Briefcase, GraduationCap
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface DeathCertificateProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const DeathCertificate: React.FC<DeathCertificateProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    documentType: 'Certificado de Defunción', // o 'Certificado de Muerte Fetal'
    institution: 'Hospital General San Rafael / MedExpediente MX',
    folio: `DEF-MX-${Math.floor(Math.random() * 9000000) + 1000000}`,
    dateOfDeath: new Date().toISOString().split('T')[0],
    timeOfDeath: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    placeOfDeath: 'Hospitalario (Unidad Médica)',
    addressOfDeath: 'Av. Insurgentes Sur 123, Ciudad de México',
    medicalAttentionBefore: true,
    
    // Causas de Muerte (CIE-10)
    causePart1A: '', // Causa Directa
    causePart1B: '', // Causa Intermedia
    causePart1C: '', // Causa Antecedente
    causePart1D: '', // Causa Básica
    causePart2: '',  // Otros estados morbosos significativos
    
    // Datos demográficos heredados/ampliados
    nationality: 'MEXICANA',
    education: patient?.education || 'Secundaria',
    occupation: patient?.occupation || 'Empleado',
    civilStatus: patient?.civilStatus || 'Soltero(a)',
    
    // Certificante
    certifierName: 'Dr. Alejandro Méndez',
    certifierId: '12345678',
    certifierType: 'Médico Tratante'
  });

  const [isSigned, setIsSigned] = useState(false);

  if (!patient) return null;

  const handleSave = () => {
    if (!form.causePart1A || !form.causePart1D || !isSigned) {
      alert("Es obligatorio registrar al menos la causa directa, la causa básica y firmar el certificado legalmente.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `DEF-${Date.now()}`,
      patientId: patient.id,
      type: form.documentType,
      date: new Date().toLocaleString('es-MX'),
      author: form.certifierName,
      content: { ...form },
      isSigned: true,
      hash: `CERT-SHA256-DEATH-${Math.random().toString(36).substr(2, 12).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Certificación de Defunción</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> Modelos SS/INEGI 2022+ • NOM-004
            </p>
          </div>
        </div>
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-2">
           {['Certificado de Defunción', 'Certificado de Muerte Fetal'].map(type => (
             <button 
                key={type}
                onClick={() => setForm({...form, documentType: type})}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.documentType === type ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
             >
                {type.split(' ')[2]}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-[#fdfcf8] border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none relative">
        {/* Marca de agua institucional simulada */}
        <Skull className="absolute inset-0 m-auto w-96 h-96 text-slate-900/[0.02] pointer-events-none" />

        {/* Document Header (Style Certificate) */}
        <div className="p-16 border-b-2 border-slate-900/10 space-y-10 relative z-10">
           <div className="flex justify-between items-start">
              <div className="space-y-4">
                 <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{form.documentType}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">{form.institution}</p>
                 <div className="inline-flex px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Sistema Nacional de Información en Salud
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Folio Único Federal</p>
                 <p className="text-2xl font-black text-blue-600 tracking-tighter">{form.folio}</p>
              </div>
           </div>
        </div>

        {/* Content Form */}
        <div className="p-16 space-y-16 relative z-10">
           
           {/* Section 1: Data of the Deceased */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-900/10 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">1</div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Datos de la Persona Fallecida</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nombre Completo</label>
                    <p className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase shadow-sm">{patient.name}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">CURP</label>
                       <p className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-mono font-bold shadow-sm">{patient.curp}</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Sexo / Edad</label>
                       <p className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm">{patient.sex} / {patient.age} Años</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center"><Briefcase size={12} className="mr-2" /> Ocupación</label>
                    <input className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase shadow-sm outline-none" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center"><GraduationCap size={12} className="mr-2" /> Escolaridad</label>
                    <select className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase shadow-sm outline-none" value={form.education} onChange={e => setForm({...form, education: e.target.value})}>
                       <option>Ninguna</option>
                       <option>Primaria</option>
                       <option>Secundaria</option>
                       <option>Preparatoria</option>
                       <option>Licenciatura</option>
                       <option>Posgrado</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nacionalidad</label>
                    <input className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase shadow-sm outline-none" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} />
                 </div>
              </div>
           </section>

           {/* Section 2: Details of Death */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-900/10 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">2</div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Datos de la Defunción</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Fecha</label>
                       <input type="date" className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-black shadow-sm outline-none" value={form.dateOfDeath} onChange={e => setForm({...form, dateOfDeath: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Hora</label>
                       <input type="time" className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-black shadow-sm outline-none" value={form.timeOfDeath} onChange={e => setForm({...form, timeOfDeath: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Sitio de Ocurrencia</label>
                    <select className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase shadow-sm outline-none" value={form.placeOfDeath} onChange={e => setForm({...form, placeOfDeath: e.target.value})}>
                       <option>Hospitalario (Unidad Médica)</option>
                       <option>Domicilio Particular</option>
                       <option>Vía Pública</option>
                       <option>Otro lugar (especifique en dirección)</option>
                    </select>
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center"><MapPin size={12} className="mr-2" /> Dirección del Fallecimiento</label>
                    <input className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm outline-none" value={form.addressOfDeath} onChange={e => setForm({...form, addressOfDeath: e.target.value})} />
                 </div>
              </div>
           </section>

           {/* Section 3: Causes of Death (CRITICAL) */}
           <section className="space-y-10">
              <div className="flex items-center gap-4 border-b border-slate-900/10 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">3</div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Causas de la Defunción (CIE-10)</h3>
              </div>

              <div className="p-8 bg-amber-50/50 border border-amber-100 rounded-3xl space-y-8">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-4">Parte I: Enfermedades que condujeron directamente a la muerte</p>
                    <div className="space-y-4">
                       <div className="flex gap-4">
                          <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">A</span>
                          <div className="flex-1 space-y-2">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Causa Directa</label>
                             <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-50" placeholder="Ej: Choque Séptico" value={form.causePart1A} onChange={e => setForm({...form, causePart1A: e.target.value})} />
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <span className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">B</span>
                          <div className="flex-1 space-y-2">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Causa Intermedia</label>
                             <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold uppercase outline-none" placeholder="Debida a (o como consecuencia de)..." value={form.causePart1B} onChange={e => setForm({...form, causePart1B: e.target.value})} />
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">C</span>
                          <div className="flex-1 space-y-2">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Causa Básica / Original</label>
                             <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-50" placeholder="Enfermedad que inició la cadena de eventos" value={form.causePart1D} onChange={e => setForm({...form, causePart1D: e.target.value})} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="h-px bg-amber-100"></div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Parte II: Otros estados morbosos significativos</p>
                    <textarea className="w-full p-6 bg-white border border-slate-200 rounded-2xl h-24 text-sm font-medium italic outline-none shadow-inner" placeholder="Padecimientos que contribuyeron a la muerte pero no relacionados con la cadena de la Parte I..." value={form.causePart2} onChange={e => setForm({...form, causePart2: e.target.value})} />
                 </div>
              </div>
           </section>

           {/* Section 4: Certifier */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-900/10 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">4</div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Datos del Médico Certificante</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nombre Completo</label>
                    <p className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase shadow-sm">{form.certifierName}</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cédula Profesional</label>
                    <p className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm">{form.certifierId}</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tipo de Certificante</label>
                    <p className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase shadow-sm">{form.certifierType}</p>
                 </div>
              </div>
           </section>

           {/* Digital Signature Pad */}
           <section className="pt-20 border-t-2 border-slate-900/10 no-print">
              <div className="max-w-md mx-auto space-y-6 text-center">
                 <div 
                   onClick={() => setIsSigned(true)}
                   className={`h-48 border-4 border-dashed rounded-[3rem] flex items-center justify-center cursor-pointer transition-all ${isSigned ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-900 group shadow-xl'}`}
                 >
                    {isSigned ? (
                       <div className="text-emerald-600 space-y-3">
                          <CheckCircle2 size={56} className="mx-auto" />
                          <p className="text-xs font-black uppercase tracking-[0.2em]">Firma Certificada Digitalmente</p>
                       </div>
                    ) : (
                       <div className="text-slate-300 group-hover:text-slate-900 transition-colors">
                          <PenTool size={48} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase mt-4 tracking-widest">Sellar Certificado Legal</p>
                       </div>
                    )}
                 </div>
                 <div>
                    <p className="text-sm font-black text-slate-900 uppercase">{form.certifierName}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Cédula Prof: {form.certifierId}</p>
                 </div>
              </div>
           </section>

           {/* Print Only Signatures */}
           <section className="hidden print:grid grid-cols-2 gap-20 pt-40">
              <div className="space-y-16 text-center">
                 <div className="w-full border-b-2 border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">{form.certifierName}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Nombre y Firma del Médico Informante</p>
                 </div>
              </div>
              <div className="space-y-16 text-center">
                 <div className="w-full border-b-2 border-slate-900 h-1"></div>
                 <div>
                    <p className="text-sm font-black uppercase">____________________</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Sello del Establecimiento de Salud</p>
                 </div>
              </div>
           </section>
        </div>

        <div className="p-12 bg-slate-900 text-white flex justify-between items-center no-print relative overflow-hidden">
           <div className="absolute right-0 top-0 h-full w-64 bg-blue-600/20 -skew-x-12 translate-x-32"></div>
           <div className="flex items-center gap-6 relative z-10">
              <Lock size={24} className="text-blue-400" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Certificación Electrónica de Defunción</p>
                 <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Validación ante Registro Civil y Secretaría de Salud</p>
              </div>
           </div>
           <div className="flex gap-6 relative z-10">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-white transition-colors">Cancelar Trámite</button>
              <button 
                onClick={handleSave}
                className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4"
              >
                 <Save size={20} /> Emitir Certificado Final
              </button>
           </div>
        </div>
      </div>

      <div className="mt-12 p-10 bg-slate-900 rounded-[3rem] shadow-2xl space-y-6 no-print">
         <div className="flex items-center gap-4 text-blue-400">
            <Info size={24} />
            <h3 className="text-sm font-black uppercase tracking-widest">Importante: Flujo de Información</h3>
         </div>
         <p className="text-xs text-slate-400 font-medium leading-relaxed italic border-l-4 border-blue-600 pl-8">
            "Este documento genera una notificación automática al Sistema Estadístico y Epidemiológico de Defunciones (SEED). Verifique cuidadosamente las causas de muerte (CIE-10) antes de sellar el documento, ya que una vez firmado, cualquier corrección requiere un trámite administrativo presencial."
         </p>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0.5rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-5xl { max-width: 100% !important; }
          .bg-[#fdfcf8] { background: #fff !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .bg-amber-50\/50 { background: #fefce8 !important; border: 1px solid #000 !important; }
          .border-slate-900\/10 { border-bottom: 2px solid #000 !important; }
          @page { margin: 0; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default DeathCertificate;
