
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Users, AlertOctagon, CheckCircle2,
  Lock, PenTool, ShieldAlert, Info, Clock, LogOut,
  FileSignature, AlertTriangle, Syringe, Activity
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../types';

interface VoluntaryDischargeProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

const VoluntaryDischarge: React.FC<VoluntaryDischargeProps> = ({ patients, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [form, setForm] = useState({
    // Datos del Establecimiento
    institution: doctorInfo?.hospital || 'Hospital General San Rafael',
    address: doctorInfo?.address || 'Av. Insurgentes Sur 123, Ciudad de México',
    
    // Tiempo
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    
    // 1. Solicitante (Responsable Legal / Familiar / Paciente)
    isPatientApplicant: false,
    applicantName: '',
    applicantAge: '',
    applicantRelation: '',
    applicantAddress: '', // Domicilio completo del solicitante
    applicantPhone: '',

    // 2. Motivo y Destino
    dischargeReason: '', // Razón clara del egreso (disconformidad, traslado propio, etc)
    dischargeDestination: 'Domicilio', // O nombre del otro establecimiento
    destinationAddress: '',
    
    // 3. Resumen Clínico (Requisito Normativo)
    admissionReason: '', // Motivo de envío/recepción
    clinicalSummary: '', // Resumen evolución
    diagnoses: '', // Impresión diagnóstica
    substanceAbuseHistory: 'Negados', // Alcoholismo, tabaquismo, toxicomanías (Requerido explícitamente)
    therapeuticsUsed: '', // Terapéutica empleada
    
    // 4. Riesgos y Recomendaciones
    risksExplained: 'Se explican riesgos de: Complicación del estado actual, infección, sangrado, progresión de la enfermedad, secuelas permanentes y muerte.',
    recommendations: '', // Medidas recomendadas para protección de la salud
    
    // 5. Participantes y Testigos (Requisito: 2 testigos)
    doctorInforming: doctorInfo?.name || '',
    cedulaInforming: doctorInfo?.cedula || '',
    witness1Name: '', // Testigo Institucional
    witness1Relation: 'Personal de Salud / Administrativo',
    witness2Name: '', // Testigo del Usuario
    witness2Relation: 'Familiar / Acompañante'
  });

  const [isSigned, setIsSigned] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
     if (patient) {
         setForm(prev => ({
             ...prev,
             admissionReason: patient.reason || '',
             // Precargar datos si el paciente es el solicitante por defecto, pero dejar editable
             applicantAddress: patient.address || ''
         }));
     }
  }, [patient]);

  // Update form if doctorInfo changes or wasn't available at mount
  useEffect(() => {
    if (doctorInfo) {
      setForm(prev => ({
        ...prev,
        institution: doctorInfo.hospital || prev.institution,
        address: doctorInfo.address || prev.address,
        doctorInforming: prev.doctorInforming || doctorInfo.name, // Only set if empty to allow manual edits? Or just reset?
        cedulaInforming: prev.cedulaInforming || doctorInfo.cedula
      }));
    }
  }, [doctorInfo]);

  if (!patient) return null;

  const handleSave = () => {
    // Validaciones estrictas según norma
    if (!form.applicantName || !form.dischargeReason || !form.risksExplained) {
      alert("Faltan datos mandatorios: Nombre del solicitante, Motivo del egreso o Explicación de riesgos.");
      return;
    }
    if (!form.witness1Name || !form.witness2Name) {
        alert("Es obligatorio registrar dos testigos (uno institucional y uno del usuario) para la validez legal del documento.");
        return;
    }
    if (!form.doctorInforming) {
        alert("Debe especificar el nombre del médico responsable.");
        return;
    }
    if (!isSigned) {
        alert("Debe sellar digitalmente el documento para confirmar la aceptación de responsabilidad.");
        return;
    }

    const newNote: ClinicalNote = {
      id: `EV-${Date.now()}`,
      patientId: patient.id,
      type: 'Hoja de Egreso Voluntario',
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorInforming,
      content: { ...form },
      isSigned: true,
      hash: `CERT-EV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    // Ir a vista previa de impresión
    setShowPrintPreview(true);
  };

  const togglePatientAsApplicant = () => {
      if (!form.isPatientApplicant) {
          setForm(prev => ({
              ...prev,
              isPatientApplicant: true,
              applicantName: patient.name,
              applicantAge: patient.age.toString(),
              applicantRelation: 'PACIENTE (MISMO)',
              applicantAddress: patient.address || ''
          }));
      } else {
          setForm(prev => ({
              ...prev,
              isPatientApplicant: false,
              applicantName: '',
              applicantAge: '',
              applicantRelation: '',
              applicantAddress: ''
          }));
      }
  };

  if (showPrintPreview) {
      return (
          <div className="min-h-screen bg-slate-100 flex justify-center p-8 animate-in fade-in">
              <div className="w-full max-w-[215mm] bg-white shadow-2xl p-[20mm] text-slate-900 print:shadow-none print:w-full print:p-0 print:m-0">
                  
                  {/* PRINT HEADER */}
                  <div className="border-b-4 border-slate-900 pb-4 mb-8 flex justify-between items-start">
                      <div>
                          <h1 className="text-2xl font-black uppercase tracking-tighter">Hoja de Egreso Voluntario</h1>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{form.institution}</p>
                          <p className="text-[10px] font-medium text-slate-400">{form.address}</p>
                      </div>
                      <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase">Expediente</p>
                           <p className="text-lg font-black">{patient.id}</p>
                           <p className="text-[10px] font-bold uppercase mt-1">{form.date} {form.time}</p>
                      </div>
                  </div>

                  {/* LEGAL BODY */}
                  <div className="space-y-6 text-xs text-justify font-medium leading-relaxed uppercase">
                      
                      {/* IDENTIFICACIÓN */}
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
                          <p className="mb-2"><span className="font-black">PACIENTE:</span> {patient.name} &nbsp;&nbsp;|&nbsp;&nbsp; <span className="font-black">EDAD:</span> {patient.age} &nbsp;&nbsp;|&nbsp;&nbsp; <span className="font-black">SEXO:</span> {patient.sex}</p>
                          <p><span className="font-black">SOLICITANTE DEL EGRESO:</span> {form.applicantName} ({form.applicantRelation})</p>
                          <p><span className="font-black">DOMICILIO:</span> {form.applicantAddress}</p>
                      </div>

                      <p>
                          Por medio del presente documento, el suscrito solicita el <strong>EGRESO VOLUNTARIO</strong> del paciente arriba mencionado, con pleno uso de sus facultades mentales y en ejercicio de sus derechos, 
                          liberando de toda responsabilidad legal, médica y administrativa a esta institución, así como al personal médico y de enfermería tratante, 
                          por las consecuencias, complicaciones, agravamiento del estado de salud o incluso la muerte que pudieran derivarse de esta decisión.
                      </p>

                      <div className="border-l-4 border-slate-900 pl-4 py-2 my-4">
                          <p className="font-black mb-1">MOTIVO DEL EGRESO EXPRESADO POR EL SOLICITANTE:</p>
                          <p className="italic">"{form.dischargeReason}"</p>
                          <p className="mt-2"><span className="font-black">DESTINO:</span> {form.dischargeDestination}</p>
                      </div>

                      {/* RESUMEN CLÍNICO */}
                      <div className="space-y-2 border-t border-b border-slate-200 py-4">
                          <p className="font-black text-[10px] text-slate-500 tracking-widest text-center mb-2">RESUMEN CLÍNICO (NOM-004-SSA3-2012)</p>
                          <p><span className="font-bold">MOTIVO DE INGRESO:</span> {form.admissionReason}</p>
                          <p><span className="font-bold">DIAGNÓSTICOS:</span> {form.diagnoses}</p>
                          <p><span className="font-bold">ANTECEDENTES TOXICOMANÍAS:</span> {form.substanceAbuseHistory}</p>
                          <p><span className="font-bold">TERAPÉUTICA EMPLEADA:</span> {form.therapeuticsUsed}</p>
                          <p><span className="font-bold">RESUMEN EVOLUCIÓN:</span> {form.clinicalSummary}</p>
                      </div>

                      {/* RIESGOS */}
                      <div className="bg-slate-100 p-4 border border-slate-300 rounded-lg">
                          <p className="font-black text-center mb-2">RIESGOS ADVERTIDOS Y MEDIDAS RECOMENDADAS</p>
                          <p><span className="font-bold">RIESGOS EXPLICADOS:</span> {form.risksExplained}</p>
                          <p className="mt-2"><span className="font-bold">MEDIDAS RECOMENDADAS:</span> {form.recommendations}</p>
                      </div>

                      <p className="text-center font-bold mt-4">
                          HABIENDO SIDO INFORMADO DETALLADAMENTE DE LO ANTERIOR Y COMPRENDIENDO EL ALCANCE LEGAL DE ESTE DOCUMENTO, FIRMO DE CONFORMIDAD.
                      </p>

                      {/* FIRMAS */}
                      <div className="grid grid-cols-2 gap-16 pt-12">
                           <div className="text-center">
                               <div className="border-b border-slate-900 mb-2 h-8"></div>
                               <p className="font-black">{form.applicantName}</p>
                               <p className="text-[9px]">NOMBRE Y FIRMA DE QUIEN SOLICITA EL EGRESO</p>
                           </div>
                           <div className="text-center">
                               <div className="border-b border-slate-900 mb-2 h-8"></div>
                               <p className="font-black">{form.doctorInforming}</p>
                               <p className="text-[9px]">NOMBRE Y FIRMA DEL MÉDICO QUE OTORGA LA RESPONSIVA</p>
                               <p className="text-[8px]">CÉDULA: {form.cedulaInforming}</p>
                           </div>
                           <div className="text-center">
                               <div className="border-b border-slate-900 mb-2 h-8"></div>
                               <p className="font-black">{form.witness1Name}</p>
                               <p className="text-[9px]">TESTIGO 1 (INSTITUCIONAL)</p>
                           </div>
                           <div className="text-center">
                               <div className="border-b border-slate-900 mb-2 h-8"></div>
                               <p className="font-black">{form.witness2Name}</p>
                               <p className="text-[9px]">TESTIGO 2 (DEL USUARIO)</p>
                           </div>
                      </div>
                  </div>

                  <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-slate-200 flex justify-center gap-4 no-print">
                      <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs">Imprimir</button>
                      <button onClick={() => navigate(`/patient/${id}`)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs">Cerrar</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-rose-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Egreso Voluntario</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-004-SSA3-2012 • Numeral 10.2
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        {/* Warning Banner */}
        <div className="p-8 bg-rose-50 border-b border-rose-100 flex items-start gap-6">
           <AlertOctagon className="w-10 h-10 text-rose-600 flex-shrink-0" />
           <div className="space-y-1">
              <h3 className="text-sm font-black text-rose-800 uppercase">Documento Médico-Legal de Alto Impacto</h3>
              <p className="text-[11px] text-rose-900 font-medium uppercase leading-relaxed tracking-tight italic">
                "Este formulario libera de responsabilidad al equipo médico y al establecimiento. Debe llenarse con total veracidad, especificando claramente los riesgos y siendo firmado obligatoriamente por el solicitante y dos testigos."
              </p>
           </div>
        </div>

        {/* Form Content */}
        <div className="p-16 space-y-16">
           
           {/* Section 1: Applicant Data */}
           <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><User size={20} /></div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">I. Datos del Solicitante del Egreso</h3>
                 </div>
                 <button 
                    onClick={togglePatientAsApplicant}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${form.isPatientApplicant ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}
                 >
                    El paciente solicita personalmente
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="col-span-full md:col-span-1 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo del Solicitante</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" value={form.applicantName} onChange={e => setForm({...form, applicantName: e.target.value})} placeholder="Nombre de quien firma el alta..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edad</label>
                        <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.applicantAge} onChange={e => setForm({...form, applicantAge: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parentesco</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" value={form.applicantRelation} onChange={e => setForm({...form, applicantRelation: e.target.value})} placeholder="Ej: Esposo, Madre, Hijo..." />
                     </div>
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Domicilio y Teléfono del Solicitante</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium uppercase outline-none" value={form.applicantAddress} onChange={e => setForm({...form, applicantAddress: e.target.value})} placeholder="Dirección completa y número de contacto..." />
                 </div>
              </div>
           </section>

           {/* Section 2: Clinical Summary & Diagnoses */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-900">II. Resumen Clínico (Estado del Paciente)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Motivo de Envío / Ingreso</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" value={form.admissionReason} onChange={e => setForm({...form, admissionReason: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnósticos e Impresión Diagnóstica</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-black uppercase resize-none outline-none" value={form.diagnoses} onChange={e => setForm({...form, diagnoses: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Resumen de Evolución</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" value={form.clinicalSummary} onChange={e => setForm({...form, clinicalSummary: e.target.value})} placeholder="Evolución clínica relevante durante la estancia..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Terapéutica Empleada</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" value={form.therapeuticsUsed} onChange={e => setForm({...form, therapeuticsUsed: e.target.value})} placeholder="Tratamientos, cirugías o procedimientos realizados..." />
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2 flex items-center gap-1"><AlertTriangle size={12}/> Abuso y Dependencia (Alcohol, Tabaco, Drogas)</label>
                    <input className="w-full p-5 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-800 uppercase outline-none" value={form.substanceAbuseHistory} onChange={e => setForm({...form, substanceAbuseHistory: e.target.value})} placeholder="Especifique o escriba 'Negados'..." />
                 </div>
              </div>
           </section>

           {/* Section 3: Reason & Risks */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><AlertOctagon size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-900">III. Motivo, Riesgos y Medidas</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Razones del Egreso (Expresadas por el solicitante)</label>
                    <textarea 
                        className="w-full p-6 bg-amber-50/30 border border-amber-200 rounded-2xl h-24 text-sm font-bold text-amber-900 uppercase italic outline-none" 
                        value={form.dischargeReason}
                        onChange={e => setForm({...form, dischargeReason: e.target.value})}
                        placeholder="Escriba textualmente el motivo expresado por el paciente/familiar..."
                    />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Destino / Establecimiento</label>
                        <input className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-xs font-medium uppercase outline-none" value={form.dischargeDestination} onChange={e => setForm({...form, dischargeDestination: e.target.value})} placeholder="Domicilio u Hospital Receptor" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Medidas Recomendadas</label>
                        <textarea className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none" value={form.recommendations} onChange={e => setForm({...form, recommendations: e.target.value})} placeholder="Plan de protección a la salud (acudir a urgencias si..., medicamentos...)" />
                     </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">Riesgos y Consecuencias Explicadas</label>
                    <textarea 
                        className="w-full p-6 bg-rose-50 border border-rose-200 rounded-2xl h-28 text-xs font-medium text-rose-900 outline-none leading-relaxed" 
                        value={form.risksExplained}
                        onChange={e => setForm({...form, risksExplained: e.target.value})}
                    />
                 </div>
              </div>
           </section>

           {/* Section 4: Witnesses */}
           <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Users size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">IV. Testigos (Obligatorio)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Testigo 1 (Institucional)</p>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" placeholder="Nombre completo..." value={form.witness1Name} onChange={e => setForm({...form, witness1Name: e.target.value})} />
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium uppercase outline-none" placeholder="Cargo / Relación" value={form.witness1Relation} onChange={e => setForm({...form, witness1Relation: e.target.value})} />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Testigo 2 (Del Usuario)</p>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" placeholder="Nombre completo..." value={form.witness2Name} onChange={e => setForm({...form, witness2Name: e.target.value})} />
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium uppercase outline-none" placeholder="Parentesco" value={form.witness2Relation} onChange={e => setForm({...form, witness2Relation: e.target.value})} />
                  </div>
              </div>
           </section>

           {/* Signatures Pad */}
           <section className="pt-20 border-t border-slate-100 no-print">
              <div className="space-y-6 text-center max-w-lg mx-auto">
                 <div 
                   onClick={() => setIsSigned(!isSigned)}
                   className={`h-40 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all ${isSigned ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-slate-200 hover:border-rose-600 group'}`}
                 >
                    {isSigned ? (
                       <div className="text-rose-600 space-y-2">
                          <CheckCircle2 size={40} className="mx-auto" />
                          <p className="text-[9px] font-black uppercase">Firma Digital Estampada</p>
                       </div>
                    ) : (
                       <div className="text-slate-400 group-hover:text-rose-600">
                          <FileSignature size={32} className="mx-auto" />
                          <p className="text-[9px] font-black uppercase mt-2">Click para Sellar Documento</p>
                       </div>
                    )}
                 </div>
                 
                 <div className="space-y-2">
                   <input 
                      className="text-[10px] font-black uppercase text-slate-900 tracking-tight text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-slate-900 pb-1"
                      value={form.doctorInforming}
                      onChange={e => setForm({...form, doctorInforming: e.target.value})}
                      placeholder="Nombre del Médico Responsable"
                   />
                   <div className="flex justify-center items-center gap-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cédula:</span>
                      <input 
                        className="text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-slate-900 pb-1 w-24 text-center"
                        value={form.cedulaInforming}
                        onChange={e => setForm({...form, cedulaInforming: e.target.value})}
                        placeholder="0000000"
                      />
                   </div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Otorgo la responsiva médica</p>
                 </div>
              </div>
           </section>
        </div>

        <div className="p-10 bg-slate-900 text-white flex justify-between items-center no-print">
           <div className="flex items-center gap-4">
              <Lock size={20} className="text-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Certificación Legal NOM-004</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center gap-3"
              >
                 <Save size={18} /> Generar Hoja para Firma
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VoluntaryDischarge;
