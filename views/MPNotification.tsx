
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Gavel, 
  Save, User, Landmark, AlertTriangle, CheckCircle2,
  Lock, PenTool, ShieldAlert, Info, Clock, Scale,
  FileText, Siren, Ambulance, Fingerprint, FolderInput
} from 'lucide-react';
/* Added DoctorInfo to imports */
import { Patient, ClinicalNote, DoctorInfo } from '../types';

interface MPNotificationProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
  /* Added doctorInfo to props interface */
  doctorInfo?: DoctorInfo;
}

const MPNotification: React.FC<MPNotificationProps> = ({ patients, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // Fecha y hora actuales para defaults
  const now = new Date();

  const [form, setForm] = useState({
    // Datos del Establecimiento (Notificador)
    institution: 'Hospital General San Rafael / MedExpediente MX',
    address: 'Av. Insurgentes Sur 123, Ciudad de México',
    clues: 'DFSSA001234', // Clave Única de Establecimientos de Salud
    
    // Tiempos
    reportDate: now.toISOString().split('T')[0],
    reportTime: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    
    // Acto Notificado (Hechos)
    incidentDate: now.toISOString().split('T')[0],
    incidentTime: '',
    incidentLocation: '', // Lugar donde ocurrieron los hechos (Vía pública, domicilio, etc.)
    narrativePatient: '', // Lo que refiere el paciente (Interrogatorio)
    
    // Clasificación del Caso Probable
    probableCrimeType: 'Lesiones Dolosas', // Lesiones, Violencia Familiar, Sexual, Homicidio, etc.
    injuryMechanism: 'Arma de Fuego', // Arma blanca, Contundente, Fuego, Químico...

    // Reporte de Lesiones (Hallazgos Médicos)
    injuryDescription: '', // Descripción topográfica y morfológica
    
    // Clasificación Médico-Legal (Crucial para MP)
    healingTime: 'Tardan más de 15 días en sanar',
    lifeRisk: 'SI Ponen en peligro la vida',
    functionalConsequence: 'Pueden dejar cicatriz en cara o secuela funcional',

    // Cadena de Custodia / Evidencia
    evidencePreserved: false,
    evidenceDetails: '', // Ropa, proyectil, muestras biológicas
    
    // Datos del Acompañante / Quien presenta
    companionName: '',
    companionRelation: '',
    
    // Agencia Receptora
    mpAgency: 'Fiscalía Desconcentrada de Investigación',
    reportMethod: 'Comparecencia Institucional', // Telefónica, Portal Web, Presencial
    reportFolio: '', // NUC, Carpeta o Folio de llamada
    officerName: '', // Agente que recibe
    
    // Médico Notificante
    doctorNotifying: 'Dr. Alejandro Méndez',
    cedulaNotifying: '12345678',
    specialty: 'Urgenciólogo'
  });

  const [isSigned, setIsSigned] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  /* Added useEffect to sync doctorInfo with the form */
  useEffect(() => {
    if (doctorInfo) {
      setForm(prev => ({
        ...prev,
        doctorNotifying: doctorInfo.name,
        cedulaNotifying: doctorInfo.cedula,
        institution: `${doctorInfo.hospital} / MedExpediente MX`,
        address: doctorInfo.address,
      }));
    }
  }, [doctorInfo]);

  if (!patient) return null;

  const handleSave = () => {
    // Validaciones legales críticas
    if (!form.narrativePatient || !form.injuryDescription || !form.mpAgency) {
      alert("Para fines legales, es obligatorio describir la narrativa de hechos, las lesiones encontradas y la agencia a la que se notifica.");
      return;
    }
    
    if (!isSigned) {
        alert("El documento debe ser firmado digitalmente por el médico notificante.");
        return;
    }

    const newNote: ClinicalNote = {
      id: `MP-${Date.now()}`,
      patientId: patient.id,
      type: 'Aviso al Ministerio Público',
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorNotifying,
      content: { ...form },
      isSigned: true,
      hash: `LEGAL-MP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    
    onSaveNote(newNote);
    setShowPrintPreview(true); // Ir a vista de impresión
  };

  if (showPrintPreview) {
      return (
          <div className="min-h-screen bg-slate-100 flex justify-center p-8 animate-in fade-in">
              <div className="w-full max-w-[215mm] bg-white shadow-2xl p-[20mm] text-slate-900 print:shadow-none print:w-full print:p-0 print:m-0">
                  
                  {/* HEADER LEGAL */}
                  <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
                      <div className="space-y-2">
                          <h1 className="text-xl font-black uppercase tracking-tight">Aviso al Ministerio Público</h1>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notificación de Casos Médico-Legales</p>
                          <p className="text-[10px] uppercase">NOM-004-SSA3-2012 / NOM-046-SSA2-2005</p>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-black uppercase">{form.institution}</p>
                          <p className="text-[10px] font-bold uppercase text-slate-500">CLUES: {form.clues}</p>
                          <p className="text-xs font-bold mt-2">{form.reportDate} {form.reportTime}</p>
                      </div>
                  </div>

                  <div className="space-y-6 text-xs font-medium uppercase text-justify leading-relaxed">
                      
                      {/* DESTINATARIO */}
                      <div className="space-y-1">
                          <p className="font-black">C. AGENTE DEL MINISTERIO PÚBLICO EN TURNO</p>
                          <p className="font-bold text-slate-600">{form.mpAgency}</p>
                          <p>PRESENTE.</p>
                      </div>

                      <p>
                          Quien suscribe, Médico Cirujano legalmente autorizado para ejercer la profesión, adscrito a esta unidad médica, 
                          hace de su conocimiento el ingreso/atención del siguiente paciente por hechos probablemente constitutivos de delito, 
                          en cumplimiento a lo dispuesto por la Ley General de Salud y Códigos Penales vigentes.
                      </p>

                      {/* 1. IDENTIFICACIÓN */}
                      <div className="border border-slate-300 rounded p-4">
                          <p className="font-black border-b border-slate-200 mb-2 pb-1">1. IDENTIFICACIÓN DEL PACIENTE</p>
                          <div className="grid grid-cols-2 gap-4">
                              <p><strong>Nombre:</strong> {patient.name}</p>
                              <p><strong>Edad/Sexo:</strong> {patient.age} Años / {patient.sex}</p>
                              <p><strong>CURP:</strong> {patient.curp}</p>
                              <p><strong>Expediente:</strong> {patient.id}</p>
                          </div>
                      </div>

                      {/* 2. HECHOS Y NARRATIVA */}
                      <div className="border border-slate-300 rounded p-4">
                          <p className="font-black border-b border-slate-200 mb-2 pb-1">2. NARRATIVA DE LOS HECHOS (Interrogatorio)</p>
                          <p className="mb-2"><strong>Refiere el paciente/acompañante que:</strong></p>
                          <p className="italic bg-slate-50 p-2 border border-slate-100">{form.narrativePatient}</p>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                              <p><strong>Lugar de Hechos:</strong> {form.incidentLocation}</p>
                              <p><strong>Fecha/Hora Hechos:</strong> {form.incidentDate} {form.incidentTime}</p>
                          </div>
                      </div>

                      {/* 3. REPORTE DE LESIONES (CORE) */}
                      <div className="border border-slate-300 rounded p-4">
                          <p className="font-black border-b border-slate-200 mb-2 pb-1">3. DESCRIPCIÓN Y CLASIFICACIÓN DE LESIONES</p>
                          <p className="mb-2"><strong>Mecanismo Probable:</strong> {form.injuryMechanism}</p>
                          <p className="mb-2"><strong>Descripción Médica:</strong> {form.injuryDescription}</p>
                          
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center font-bold bg-slate-100 p-2 rounded">
                              <div className="border-r border-slate-300 px-2">
                                  <p className="text-[9px] text-slate-500">TIEMPO EN SANAR</p>
                                  <p>{form.healingTime}</p>
                              </div>
                              <div className="border-r border-slate-300 px-2">
                                  <p className="text-[9px] text-slate-500">PELIGRO DE VIDA</p>
                                  <p>{form.lifeRisk}</p>
                              </div>
                              <div className="px-2">
                                  <p className="text-[9px] text-slate-500">SECUELAS</p>
                                  <p>{form.functionalConsequence}</p>
                              </div>
                          </div>
                      </div>

                      {/* 4. EVIDENCIA Y RECEPCIÓN */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="border border-slate-300 rounded p-4">
                              <p className="font-black border-b border-slate-200 mb-2 pb-1">4. EVIDENCIA / CUSTODIA</p>
                              <p><strong>Se preserva evidencia:</strong> {form.evidencePreserved ? 'SÍ' : 'NO'}</p>
                              {form.evidencePreserved && <p className="mt-1 text-[10px]">{form.evidenceDetails}</p>}
                          </div>
                          <div className="border border-slate-300 rounded p-4">
                              <p className="font-black border-b border-slate-200 mb-2 pb-1">5. DATOS DEL RECEPTOR</p>
                              <p><strong>Vía:</strong> {form.reportMethod}</p>
                              <p><strong>Folio/NUC:</strong> {form.reportFolio || 'Pendiente'}</p>
                              <p><strong>Agente:</strong> {form.officerName || 'Quien corresponda'}</p>
                          </div>
                      </div>
                  </div>

                  {/* SIGNATURES */}
                  <div className="mt-auto pt-20 pb-10 px-[20mm] grid grid-cols-2 gap-16 text-center text-xs uppercase text-slate-900">
                      <div>
                          <div className="border-b-2 border-slate-900 mb-2"></div>
                          <p className="font-black">{form.doctorNotifying}</p>
                          <p className="text-[9px]">Médico Notificante • Céd. {form.cedulaNotifying}</p>
                      </div>
                      <div>
                          <div className="border-b-2 border-slate-900 mb-2"></div>
                          <p className="font-black">SELLO DE RECIBIDO MP</p>
                          <p className="text-[9px]">Nombre, Fecha y Hora</p>
                      </div>
                  </div>

                  {/* ACTION BUTTONS (NO PRINT) */}
                  <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 flex justify-center gap-4 no-print">
                      <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs flex items-center gap-2"><Printer size={16}/> Imprimir</button>
                      <button onClick={() => navigate(`/patient/${id}`)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs">Cerrar</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-700 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Aviso al Ministerio Público</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> Obligatorio en casos médico-legales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-rose-50 text-rose-700 px-6 py-2 rounded-2xl border border-rose-100">
            <Siren size={20} className="animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest">Notificación Inmediata</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        
        {/* Warning Banner */}
        <div className="p-8 bg-amber-50 border-b border-amber-100 flex items-start gap-5">
           <AlertTriangle className="w-10 h-10 text-amber-600 flex-shrink-0" />
           <div>
               <h3 className="text-sm font-black text-amber-900 uppercase">Obligación Legal</h3>
               <p className="text-[11px] text-amber-800 font-medium uppercase leading-relaxed mt-1">
                 "El personal de salud que atienda lesiones presumiblemente delictivas debe dar aviso inmediato al Ministerio Público. La omisión puede constituir un delito de encubrimiento."
               </p>
           </div>
        </div>

        {/* Content Form */}
        <div className="p-16 space-y-16">
           
           {/* 1. DATOS DEL HECHO */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">I. Cronología y Lugar de los Hechos</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Lugar de Ocurrencia (Según Paciente)</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:bg-white focus:border-slate-400" placeholder="Ej: Vía pública, domicilio, trabajo..." value={form.incidentLocation} onChange={e => setForm({...form, incidentLocation: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha del Incidente</label>
                       <input type="date" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.incidentDate} onChange={e => setForm({...form, incidentDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora Aproximada</label>
                       <input type="time" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.incidentTime} onChange={e => setForm({...form, incidentTime: e.target.value})} />
                    </div>
                 </div>
              </div>
              
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Narrativa de Hechos (Interrogatorio)</label>
                 <textarea 
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-32 text-sm font-medium italic outline-none resize-none focus:bg-white focus:border-slate-400"
                    placeholder="Describa lo que el paciente o acompañante relata sobre cómo ocurrieron las lesiones..."
                    value={form.narrativePatient}
                    onChange={e => setForm({...form, narrativePatient: e.target.value})}
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre del Acompañante / Testigo</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.companionName} onChange={e => setForm({...form, companionName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Parentesco / Relación</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.companionRelation} onChange={e => setForm({...form, companionRelation: e.target.value})} />
                  </div>
              </div>
           </section>

           {/* 2. REPORTE MÉDICO-LEGAL */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><Gavel size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-900">II. Clasificación de Lesiones</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Probable Delito / Causa</label>
                    <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none" value={form.probableCrimeType} onChange={e => setForm({...form, probableCrimeType: e.target.value})}>
                        <option>Lesiones Dolosas (Riña/Agresión)</option>
                        <option>Violencia Familiar</option>
                        <option>Violencia Sexual</option>
                        <option>Accidente de Tránsito</option>
                        <option>Herida por Arma de Fuego</option>
                        <option>Herida por Arma Blanca</option>
                        <option>Maltrato Infantil</option>
                        <option>Intento de Suicidio</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Mecanismo de Lesión</label>
                    <input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold uppercase" value={form.injuryMechanism} onChange={e => setForm({...form, injuryMechanism: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Descripción Médica de Lesiones</label>
                 <textarea 
                    className="w-full p-6 bg-rose-50/20 border-2 border-rose-100 rounded-[2rem] h-40 text-sm font-medium outline-none resize-none focus:border-rose-300"
                    placeholder="Describa tipo, forma, dimensiones, coloración y ubicación anatómica precisa de cada lesión..."
                    value={form.injuryDescription}
                    onChange={e => setForm({...form, injuryDescription: e.target.value})}
                 />
              </div>

              {/* CLASIFICACIÓN LEGAL (SEMÁFORO) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tiempo en Sanar</label>
                    <select className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase" value={form.healingTime} onChange={e => setForm({...form, healingTime: e.target.value})}>
                        <option>Tardan MENOS de 15 días</option>
                        <option>Tardan MÁS de 15 días</option>
                        <option>No aplica (Sin lesiones visibles)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Peligro de Vida</label>
                    <select className={`w-full p-4 border rounded-xl text-[10px] font-black uppercase ${form.lifeRisk.includes('NO') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`} value={form.lifeRisk} onChange={e => setForm({...form, lifeRisk: e.target.value})}>
                        <option>NO Ponen en peligro la vida</option>
                        <option>SI Ponen en peligro la vida</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Secuelas Funcionales</label>
                    <select className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase" value={form.functionalConsequence} onChange={e => setForm({...form, functionalConsequence: e.target.value})}>
                        <option>Sin secuelas probables</option>
                        <option>Posible cicatriz en cara perpetua</option>
                        <option>Posible disminución de función</option>
                        <option>Pérdida de función/miembro</option>
                    </select>
                 </div>
              </div>

              <div 
                 onClick={() => setForm({...form, evidencePreserved: !form.evidencePreserved})}
                 className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col md:flex-row gap-4 items-center justify-between ${form.evidencePreserved ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'}`}
              >
                  <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.evidencePreserved ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <FolderInput size={24}/>
                      </div>
                      <div>
                          <p className={`text-sm font-black uppercase ${form.evidencePreserved ? 'text-amber-900' : 'text-slate-500'}`}>Cadena de Custodia / Evidencia</p>
                          <p className="text-[9px] font-medium opacity-70">¿Se resguardaron ropas, objetos, balas o muestras biológicas?</p>
                      </div>
                  </div>
                  {form.evidencePreserved && (
                      <input 
                         className="flex-1 p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold uppercase outline-none"
                         placeholder="Describa la evidencia resguardada..."
                         value={form.evidenceDetails}
                         onChange={e => setForm({...form, evidenceDetails: e.target.value})}
                         onClick={e => e.stopPropagation()}
                      />
                  )}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.evidencePreserved ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>
                      {form.evidencePreserved && <CheckCircle2 size={16}/>}
                  </div>
              </div>
           </section>

           {/* 3. DATOS DE NOTIFICACIÓN */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><Landmark size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">III. Autoridad Receptora</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fiscalía / Agencia MP</label>
                    <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.mpAgency} onChange={e => setForm({...form, mpAgency: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medio de Notificación</label>
                    <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.reportMethod} onChange={e => setForm({...form, reportMethod: e.target.value})}>
                        <option>Comparecencia Institucional (Agente en Hospital)</option>
                        <option>Vía Telefónica</option>
                        <option>Portal Web Fiscalía</option>
                        <option>Escrito Entregado</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Agente / Receptor</label>
                    <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.officerName} onChange={e => setForm({...form, officerName: e.target.value})} placeholder="Nombre y Placa/Cargo" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Carpeta / Folio / NUC</label>
                    <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.reportFolio} onChange={e => setForm({...form, reportFolio: e.target.value})} placeholder="Si se proporciona al momento" />
                 </div>
              </div>
           </section>

           {/* FIRMA */}
           <section className="pt-20 border-t border-slate-100 no-print">
              <div className="max-w-md mx-auto space-y-6 text-center">
                 <div 
                   onClick={() => setIsSigned(!isSigned)}
                   className={`h-40 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all ${isSigned ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-slate-50 border-slate-200 hover:border-slate-400 group'}`}
                 >
                    {isSigned ? (
                       <div className="text-white space-y-2">
                          <Fingerprint size={48} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Firmado Digitalmente</p>
                       </div>
                    ) : (
                       <div className="text-slate-400 group-hover:text-slate-600">
                          <PenTool size={40} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase mt-3">Click para Sellar Documento</p>
                       </div>
                    )}
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase text-slate-900 tracking-tight">{form.doctorNotifying}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{form.specialty} • Céd. {form.cedulaNotifying}</p>
                 </div>
              </div>
           </section>
        </div>

        <div className="p-10 bg-slate-900 text-white flex justify-between items-center no-print">
           <div className="flex items-center gap-4">
              <Lock size={20} className="text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Documento Médico-Legal</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3"
              >
                 <Save size={18} /> Generar Aviso Legal
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MPNotification;
