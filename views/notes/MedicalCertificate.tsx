
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Activity, HeartPulse, Eye,
  Thermometer, CheckCircle2, Lock, Droplet,
  Dumbbell, Briefcase, GraduationCap, Car, Plane,
  PenTool
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo, Vitals } from '../../types';

interface MedicalCertificateProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
  notes?: ClinicalNote[];
}

type CertificateType = 'Escolar' | 'Laboral' | 'Deportivo' | 'Licencia de Conducir' | 'Viaje' | 'General';

const MedicalCertificate: React.FC<MedicalCertificateProps> = ({ patients, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [certType, setCertType] = useState<CertificateType>('General');
  const [showPrintView, setShowPrintView] = useState(false);
  const [generatedNoteId, setGeneratedNoteId] = useState('');

  // Extended Vitals for Certificate
  const [vitals, setVitals] = useState<Vitals & { visualAcuityOD: string, visualAcuityOI: string, bloodType: string }>({
      bp: '', temp: 0, hr: 0, rr: 0, o2: 0, weight: 0, height: 0, bmi: 0, date: '',
      visualAcuityOD: '20/20', visualAcuityOI: '20/20', bloodType: ''
  });

  const [form, setForm] = useState({
    institution: doctorInfo?.hospital || 'Hospital General San Rafael',
    location: doctorInfo?.address || 'Ciudad de México',
    date: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
    
    // Evaluation
    pathologicalHistory: 'Negados',
    physicalExam: 'Paciente consciente, orientado, con buena coloración de tegumentos. Campos pulmonares bien ventilados, ruidos cardiacos rítmicos sin soplos. Abdomen blando, depresible, no doloroso. Extremidades íntegras y funcionales.',
    mentalStatus: 'Alerta y orientado en sus tres esferas.',
    skinStatus: 'Sin datos de micosis, pediculosis o enfermedades infectocontagiosas visibles.',
    musculoskeletal: 'Arcos de movilidad completos, fuerza muscular 5/5, sin limitaciones funcionales.',
    
    // Conclusion
    conclusion: 'CLÍNICAMENTE SANO AL MOMENTO DE LA EXPLORACIÓN.',
    specificClause: '', // E.g., "Apto para natación", "Apto para laborar"
    validity: '30 días',
    
    // Doctor
    doctorName: doctorInfo?.name || '',
    cedula: doctorInfo?.cedula || ''
  });

  useEffect(() => {
     if (patient) {
         if (patient.currentVitals) {
             setVitals(prev => ({...prev, ...patient.currentVitals}));
         }
         if (patient.bloodType) {
             setVitals(prev => ({...prev, bloodType: patient.bloodType}));
         }
         
         // Auto-fill history if available
         const historyText = patient.allergies.length > 0 
            ? `Alergias: ${patient.allergies.join(', ')}. ` 
            : 'Alergias Negadas. ';
         const chronicText = patient.chronicDiseases.length > 0
            ? `Antecedentes: ${patient.chronicDiseases.join(', ')} (Controlados).`
            : 'Enfermedades crónico-degenerativas negadas.';
         
         setForm(prev => ({
             ...prev,
             pathologicalHistory: historyText + chronicText
         }));
     }
  }, [patient]);

  // Update specific clause based on type
  useEffect(() => {
      let clause = '';
      switch(certType) {
          case 'Escolar': clause = 'APTO para realizar actividades escolares y educación física.'; break;
          case 'Laboral': clause = 'APTO para desempeñar sus funciones laborales sin limitaciones físicas aparentes.'; break;
          case 'Deportivo': clause = 'APTO para la práctica deportiva y uso de instalaciones (Natación/Gimnasio). No presenta micosis ni enfermedades de la piel.'; break;
          case 'Licencia de Conducir': clause = 'Cuenta con agudeza visual, auditiva y motora adecuada para la conducción de vehículos automotores.'; break;
          case 'Viaje': clause = 'FIT TO FLY / APTO PARA VIAJAR. No presenta síntomas de enfermedades infectocontagiosas agudas.'; break;
          default: clause = '';
      }
      setForm(prev => ({...prev, specificClause: clause}));
  }, [certType]);

  if (!patient) return null;

  const handleSave = () => {
    if (!form.physicalExam || !form.conclusion) {
      alert("La exploración física y la conclusión son obligatorias.");
      return;
    }

    const currentNoteId = `CERT-MED-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient.id,
      type: `Certificado Médico (${certType})`,
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorName,
      content: { ...form, vitals, certType },
      isSigned: true,
      hash: `CERT-SHA256-${Math.random().toString(36).substr(2, 12).toUpperCase()}`
    };
    
    onSaveNote(newNote);
    setGeneratedNoteId(currentNoteId);
    setShowPrintView(true);
  };

  if (showPrintView) {
      return (
        <div className="min-h-screen bg-slate-100 flex justify-center p-8 animate-in fade-in">
           <div className="w-full max-w-[215mm] bg-white shadow-2xl overflow-hidden flex flex-col relative print:shadow-none print:w-full print:p-0 print:m-0">
               {/* Toolbar */}
               <div className="bg-slate-900 p-4 flex justify-between items-center no-print sticky top-0 z-50">
                  <div className="flex items-center gap-4 text-white">
                      <ShieldCheck className="text-emerald-400" />
                      <div>
                          <p className="text-xs font-black uppercase tracking-widest">Certificado Oficial</p>
                          <p className="text-[10px] text-slate-400">Folio: {generatedNoteId}</p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 flex items-center gap-2"><Printer size={16}/> Imprimir</button>
                      <button onClick={() => navigate(`/patient/${id}`)} className="px-6 py-2 bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600">Cerrar</button>
                  </div>
              </div>

              {/* Print Content */}
              <div className="p-[25mm] space-y-10 text-slate-900 leading-relaxed text-justify relative">
                  
                  {/* Header */}
                  <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6">
                      <div>
                          <h1 className="text-3xl font-black uppercase tracking-tighter">{form.institution}</h1>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Servicios Médicos Integrales</p>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-bold uppercase">{form.location}</p>
                          <p className="text-xs font-medium uppercase text-slate-500">{form.date}</p>
                      </div>
                  </div>

                  <div className="text-center py-6">
                      <h2 className="text-2xl font-black uppercase tracking-[0.2em] underline decoration-4 decoration-slate-200 underline-offset-8">Certificado Médico</h2>
                  </div>

                  {/* Body Text */}
                  <div className="text-sm space-y-6">
                      <p>
                          A QUIEN CORRESPONDA:
                      </p>
                      <p>
                          El que suscribe, <strong>{form.doctorName}</strong>, Médico Cirujano legalmente autorizado para ejercer la profesión, con Cédula Profesional <strong>{form.cedula}</strong>, certifica haber examinado a:
                      </p>
                      
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                          <p className="text-lg font-black uppercase text-center mb-2">{patient.name}</p>
                          <div className="flex justify-center gap-8 text-xs font-bold uppercase text-slate-600">
                              <span>Edad: {patient.age} Años</span>
                              <span>Sexo: {patient.sex}</span>
                              <span>CURP: {patient.curp}</span>
                          </div>
                      </div>

                      <p>
                          Encontrando al momento de la exploración los siguientes signos vitales y somatometría:
                      </p>

                      <div className="grid grid-cols-4 gap-4 text-center text-xs border-y-2 border-slate-100 py-4">
                          <div>
                              <p className="font-bold text-slate-500">Peso</p>
                              <p className="font-black">{vitals.weight} kg</p>
                          </div>
                          <div>
                              <p className="font-bold text-slate-500">Talla</p>
                              <p className="font-black">{vitals.height} cm</p>
                          </div>
                          <div>
                              <p className="font-bold text-slate-500">T.A.</p>
                              <p className="font-black">{vitals.bp} mmHg</p>
                          </div>
                          <div>
                              <p className="font-bold text-slate-500">F.C.</p>
                              <p className="font-black">{vitals.hr} lpm</p>
                          </div>
                          <div>
                              <p className="font-bold text-slate-500">Tipo Sangre</p>
                              <p className="font-black">{vitals.bloodType || 'N/D'}</p>
                          </div>
                          <div>
                              <p className="font-bold text-slate-500">Agudeza Visual</p>
                              <p className="font-black">OD: {vitals.visualAcuityOD} | OI: {vitals.visualAcuityOI}</p>
                          </div>
                      </div>

                      <p>
                          <strong>EXPLORACIÓN FÍSICA:</strong> {form.physicalExam}
                      </p>
                      
                      {(certType === 'Deportivo' || certType === 'Escolar') && (
                          <p>
                              <strong>ESTADO DÉRMICO Y MÚSCULO-ESQUELÉTICO:</strong> {form.skinStatus} {form.musculoskeletal}
                          </p>
                      )}

                      <div className="my-8">
                          <p className="font-black uppercase mb-2">CONCLUSIÓN MÉDICA:</p>
                          <p className="text-base font-bold italic">{form.conclusion}</p>
                          <p className="text-base font-bold italic mt-2">{form.specificClause}</p>
                      </div>

                      <p>
                          Se extiende el presente certificado a petición del interesado para los fines legales y administrativos que a este convengan (vigencia sugerida de {form.validity}).
                      </p>
                  </div>

                  {/* Signatures */}
                  <div className="mt-20 flex flex-col items-center justify-center text-center space-y-2">
                       <div className="w-64 border-b-2 border-slate-900 mb-2"></div>
                       <p className="font-black uppercase text-sm">{form.doctorName}</p>
                       <p className="text-xs font-bold text-slate-500 uppercase">Cédula Prof. {form.cedula}</p>
                       <p className="text-[10px] text-slate-400 uppercase">Firma del Médico Responsable</p>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="absolute bottom-[10mm] right-[10mm] opacity-50">
                      <div className="w-24 h-24 bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                          <span className="text-[8px] font-mono text-center">VALIDACIÓN<br/>DIGITAL</span>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Certificado Médico</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500"/> Documento Legal
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
            {['General', 'Escolar', 'Laboral', 'Deportivo', 'Licencia de Conducir'].map(type => (
                <button 
                    key={type}
                    onClick={() => setCertType(type as any)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${certType === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    {type}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: VITALES COMPLETOS */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-emerald-400"/> Signos y Somatometría
                </h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><HeartPulse size={10}/> T.A.</label>
                            <input className="w-full bg-transparent text-sm font-black text-white outline-none" placeholder="120/80" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} />
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Thermometer size={10}/> Temp</label>
                            <input className="w-full bg-transparent text-sm font-black text-white outline-none" placeholder="36.5" value={vitals.temp} onChange={e => setVitals({...vitals, temp: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">Peso (kg)</label>
                            <input className="w-full bg-transparent text-sm font-black text-white outline-none" placeholder="70" value={vitals.weight} onChange={e => setVitals({...vitals, weight: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/5 space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">Talla (cm)</label>
                            <input className="w-full bg-transparent text-sm font-black text-white outline-none" placeholder="170" value={vitals.height} onChange={e => setVitals({...vitals, height: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10 space-y-3">
                        <div className="space-y-1">
                             <label className="text-[9px] font-bold text-blue-400 uppercase ml-1 flex items-center gap-1"><Droplet size={10}/> Grupo Sanguíneo</label>
                             <select 
                                className="w-full p-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white outline-none"
                                value={vitals.bloodType}
                                onChange={e => setVitals({...vitals, bloodType: e.target.value})}
                             >
                                 <option value="">Desconocido</option>
                                 <option value="O+">O Positivo</option>
                                 <option value="O-">O Negativo</option>
                                 <option value="A+">A Positivo</option>
                                 <option value="A-">A Negativo</option>
                                 <option value="B+">B Positivo</option>
                                 <option value="B-">B Negativo</option>
                                 <option value="AB+">AB Positivo</option>
                                 <option value="AB-">AB Negativo</option>
                             </select>
                        </div>
                        <div className="space-y-1">
                             <label className="text-[9px] font-bold text-blue-400 uppercase ml-1 flex items-center gap-1"><Eye size={10}/> Agudeza Visual (Snellen)</label>
                             <div className="flex gap-2">
                                <input className="w-full p-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white text-center" placeholder="OD 20/20" value={vitals.visualAcuityOD} onChange={e => setVitals({...vitals, visualAcuityOD: e.target.value})} />
                                <input className="w-full p-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white text-center" placeholder="OI 20/20" value={vitals.visualAcuityOI} onChange={e => setVitals({...vitals, visualAcuityOI: e.target.value})} />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Datos del Certificante</h3>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Médico</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Cédula</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: EVALUACIÓN Y CONCLUSIÓN */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                
                {/* 1. ANTECEDENTES Y EXPLORACIÓN */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Antecedentes Importantes</label>
                        <textarea 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none outline-none"
                            value={form.pathologicalHistory}
                            onChange={e => setForm({...form, pathologicalHistory: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Exploración Física General</label>
                        <textarea 
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-32 text-sm font-medium text-slate-700 outline-none shadow-inner leading-relaxed"
                            value={form.physicalExam}
                            onChange={e => setForm({...form, physicalExam: e.target.value})}
                        />
                    </div>
                </div>

                {/* 2. CAMPOS ESPECÍFICOS SEGÚN TIPO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Activity size={12}/> Estado Mental / Neurológico</label>
                        <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl h-20 text-xs font-medium resize-none outline-none" value={form.mentalStatus} onChange={e => setForm({...form, mentalStatus: e.target.value})} />
                    </div>
                    {(certType === 'Deportivo' || certType === 'Escolar') && (
                        <div className="space-y-2 animate-in slide-in-from-right-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Dumbbell size={12}/> Piel y Musculoesquelético</label>
                            <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl h-20 text-xs font-medium resize-none outline-none" value={form.skinStatus} onChange={e => setForm({...form, skinStatus: e.target.value})} placeholder="Descartar micosis, piojos, limitaciones..." />
                        </div>
                    )}
                    {certType === 'Licencia de Conducir' && (
                        <div className="space-y-2 animate-in slide-in-from-right-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Car size={12}/> Aptitud Motora y Reflejos</label>
                            <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl h-20 text-xs font-medium resize-none outline-none" value={form.musculoskeletal} onChange={e => setForm({...form, musculoskeletal: e.target.value})} />
                        </div>
                    )}
                </div>

                {/* 3. CONCLUSIÓN */}
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-2">Conclusión Médica</label>
                        <input className="w-full p-4 bg-white border border-emerald-200 rounded-xl text-sm font-black text-emerald-900 uppercase outline-none" value={form.conclusion} onChange={e => setForm({...form, conclusion: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-2">Cláusula Específica (Aptitud)</label>
                        <textarea className="w-full p-4 bg-white border border-emerald-200 rounded-xl h-20 text-xs font-bold text-emerald-800 uppercase resize-none outline-none" value={form.specificClause} onChange={e => setForm({...form, specificClause: e.target.value})} />
                     </div>
                </div>

            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-4">
                    <PenTool size={20} /> Generar Certificado
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalCertificate;
