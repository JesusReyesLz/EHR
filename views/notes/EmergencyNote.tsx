
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, AlertTriangle, Activity, Stethoscope, 
  HeartPulse, Clock, Lock, Thermometer, Wind, Droplet, Brain, Siren,
  Bone, FileText, Syringe, Ambulance, Scale, Printer
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, DoctorInfo } from '../../types';

import PDFViewer from '../../src/components/PDFViewer';

const EmergencyNotePrint: React.FC<{ 
  data: any, 
  vitals: any, 
  patient: Patient, 
  doctor: DoctorInfo, 
  noteId: string,
  onClose: () => void
}> = ({ data, vitals, patient, doctor, noteId, onClose }) => {
  return (
    <PDFViewer filename={`Nota_Urgencias_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`} onClose={onClose}>
      <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[10mm] flex flex-col relative text-[10px]">
        
        {/* HEADER: IDENTIFICACIÓN DEL PACIENTE */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="bg-rose-600 text-white px-3 py-1 inline-block font-bold uppercase tracking-widest text-xs mb-2 shadow-sm">
              IDENTIFICACIÓN DEL PACIENTE
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
              <div className="col-span-2"><span className="text-slate-500">Nombre:</span> <span className="font-bold">{patient.name}</span></div>
              <div><span className="text-slate-500">Fecha de nacimiento:</span> <span className="font-bold">{patient.birthDate || '--'}</span></div>
              <div><span className="text-slate-500">Edad:</span> <span className="font-bold">{patient.age} {patient.ageUnit || 'Años'}</span></div>
              <div className="col-span-2"><span className="text-slate-500">Alergias:</span> <span className="font-bold text-rose-600">{patient.allergies?.join(', ') || 'Negadas'}</span></div>
              <div><span className="text-slate-500">Grupo y Rh sanguíneo:</span> <span className="font-bold">{patient.bloodType || '--'}</span></div>
            </div>
          </div>
          
          {/* LOGO CLINICA */}
          <div className="w-24 h-24 flex items-center justify-center mx-4">
            <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center text-white font-black text-2xl">
              {doctor.hospital ? doctor.hospital.charAt(0) : 'C'}
            </div>
          </div>

          <div className="flex-1 text-right">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-left ml-auto w-fit">
              <div><span className="font-bold">Fecha:</span> {new Date().toLocaleDateString('es-MX')}</div>
              <div><span className="font-bold">Hora:</span> {new Date().toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'})}</div>
              <div><span className="text-slate-500">CURP:</span> <span className="font-bold">{patient.curp || '--'}</span></div>
              <div><span className="text-slate-500">N° de expediente:</span> <span className="font-bold">{patient.id.slice(0,8)}</span></div>
              <div><span className="text-slate-500">Sexo:</span> <span className="font-bold">{patient.sex}</span></div>
              <div><span className="text-slate-500">N° de cama:</span> <span className="font-bold">{patient.bedNumber || '--'}</span></div>
              <div className="col-span-2"><span className="text-slate-500">Teléfono:</span> <span className="font-bold">{patient.phone || '--'}</span></div>
            </div>
          </div>
        </div>

        {/* TITLE */}
        <div className="flex justify-center mb-6 relative">
          <div className="bg-rose-700 text-white px-8 py-2 text-lg font-black uppercase tracking-[0.2em] shadow-md transform -skew-x-12">
            <div className="transform skew-x-12">NOTA INICIAL DE URGENCIAS</div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex gap-6 flex-1">
          
          {/* LEFT SIDEBAR (Signos Vitales, etc) */}
          <div className="w-40 flex-shrink-0 space-y-4">
            {/* Triage */}
            <div>
              <div className={`text-white px-2 py-1 font-bold uppercase text-[9px] mb-2 ${data.triageLevel === 'Rojo' ? 'bg-rose-600' : data.triageLevel === 'Naranja' ? 'bg-orange-500' : data.triageLevel === 'Amarillo' ? 'bg-amber-400' : data.triageLevel === 'Verde' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                Nivel de Triage
              </div>
              <p className="text-center font-black text-lg uppercase">{data.triageLevel || 'No Asignado'}</p>
            </div>

            {/* Signos Vitales */}
            <div>
              <div className="bg-rose-600 text-white px-2 py-1 font-bold uppercase text-[9px] mb-2">Signos vitales</div>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="font-bold">TA</span> <span>{vitals?.bp || '--'} mmHg</span></div>
                <div className="flex justify-between"><span className="font-bold">FC</span> <span>{vitals?.hr || '--'} Lpm</span></div>
                <div className="flex justify-between"><span className="font-bold">FR</span> <span>{vitals?.rr || '--'} Rpm</span></div>
                <div className="flex justify-between"><span className="font-bold">Temp.</span> <span>{vitals?.temp || '--'} °C</span></div>
                <div className="flex justify-between"><span className="font-bold">Sat O2</span> <span>{vitals?.o2 || '--'} %</span></div>
                <div className="flex justify-between"><span className="font-bold">Glucosa</span> <span>{vitals?.glucose || '--'} mg/dL</span></div>
                <div className="flex justify-between"><span className="font-bold">Glasgow</span> <span>{vitals?.glasgow || '15'}/15</span></div>
              </div>
            </div>

            {/* Ingreso */}
            <div>
              <div className="bg-rose-600 text-white px-2 py-1 font-bold uppercase text-[9px] mb-2">Ingreso</div>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="font-bold">Fecha</span> <span>{data.admissionDate || '--'}</span></div>
                <div className="flex justify-between"><span className="font-bold">Hora</span> <span>{data.admissionTime || '--'}</span></div>
                <div className="flex justify-between"><span className="font-bold">Tipo</span> <span>{data.accidentType || '--'}</span></div>
              </div>
            </div>

          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 space-y-4 relative">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
               <div className="w-64 h-64 bg-rose-600 rounded-full flex items-center justify-center text-white font-black text-9xl">
                 {doctor.hospital ? doctor.hospital.charAt(0) : 'C'}
               </div>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Motivo de Atención:</div>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200">{data.motivoAtencion || 'No especificado.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Padecimiento Actual:</div>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200">{data.padecimientoActual || 'No especificado.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Antecedentes (AHFM, APP, APNP):</div>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200"><span className="font-bold">AHFM:</span> {data.ahfm || 'Negados.'}</p>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200"><span className="font-bold">APP:</span> {data.app || 'Negados.'}</p>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200"><span className="font-bold">APNP:</span> {data.apnp || 'Negados.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">IPAYS:</div>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200">{data.ipays || 'Interrogatorio por aparatos y sistemas sin alteraciones.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Exploración Física y Estado Mental:</div>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200"><span className="font-bold">Estado Mental:</span> {data.estadoMental || 'Consciente, orientado.'}</p>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200 mt-1"><span className="font-bold">Exploración:</span> {data.exploracionFisica || 'No especificado.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Pruebas y Procedimientos:</div>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200"><span className="font-bold">Pruebas:</span> {data.pruebasRealizadas || 'No se realizaron.'}</p>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200 mt-1"><span className="font-bold">Procedimientos:</span> {data.procedimientosRealizados || 'No se realizaron.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Diagnóstico Inicial:</div>
              <p className="text-slate-800 font-bold pl-2 border-l-2 border-rose-200">{data.diagnosticoInicial || 'No especificado.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Plan de Tratamiento:</div>
              <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l-2 border-rose-200">{data.planTratamiento || 'No especificado.'}</p>
            </div>

            <div className="relative z-10">
              <div className="bg-rose-600/80 text-white px-2 py-0.5 font-bold uppercase text-[10px] inline-block mb-1">Destino del Paciente:</div>
              <p className="text-slate-800 font-bold pl-2 border-l-2 border-rose-200">{data.destino || 'Observación.'}</p>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-auto pt-4 border-t border-slate-300">
          <div className="flex justify-between items-end mb-4">
            {/* Firmas */}
            <div className="flex gap-4 items-end">
              <div className="w-12 h-16 border border-slate-300 flex items-center justify-center text-[8px] text-center text-slate-400">Logo Univ.</div>
              <div className="text-center">
                <div className="w-48 border-b border-slate-800 mb-1"></div>
                <p className="font-bold">{doctor.name}</p>
                <p className="text-[9px]">{doctor.specialty || 'Médico Cirujano'}</p>
                <p className="text-[9px]">Ced. Prof. {doctor.cedula}</p>
              </div>
              <div className="w-12 h-16 border border-slate-300 flex items-center justify-center text-[8px] text-center text-slate-400">Sello</div>
            </div>

            {/* Pronósticos */}
            <div className="text-right space-y-1">
              <div className="flex gap-4 justify-end text-[9px]">
                <div><span className="bg-rose-600/80 text-white px-1 font-bold">Pronóstico:</span> <span className="font-bold text-orange-600">{data.pronostico || 'Reservado'}</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[8px] text-slate-500 border-t border-slate-200 pt-1">
            <p>Nombre del médico quien elabora: <span className="font-bold text-slate-800">{doctor.name}</span></p>
            <p>Cédula profesional: <span className="font-bold text-slate-800">{doctor.cedula}</span></p>
            <p>Cédula de especialidad: <span className="font-bold text-slate-800">--</span></p>
            <p>Matrícula: <span className="font-bold text-slate-800">--</span></p>
          </div>
          <div className="text-[8px] text-slate-500 mt-1">
            <p>Teléfono de la unidad: <span className="font-bold text-slate-800">{doctor.phone || '--'}</span> Dirección de la unidad de salud: <span className="font-bold text-slate-800">{doctor.address || '--'}</span></p>
          </div>
        </div>

      </div>
    </PDFViewer>
  );
};

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

  if (isNoteFinalized) {
      const displayDoctor = doctorInfo || { 
          name: 'Dr. No Identificado', 
          hospital: 'Clínica', 
          cedula: '', 
          specialty: '',
          email: '', address: '', phone: '' 
      };
      return (
          <EmergencyNotePrint 
              data={{...form, triageLevel}} 
              vitals={vitals} 
              patient={patient} 
              doctor={displayDoctor} 
              noteId={noteId || 'BORRADOR'}
              onClose={() => navigate(`/patient/${id}`)}
          />
      );
  }

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
      author: doctorInfo?.name || 'Dr. Médico',
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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Motivo de Atención</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.motivoAtencion || ''} onChange={e => setForm({...form, motivoAtencion: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Padecimiento Actual</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.padecimientoActual || ''} onChange={e => setForm({...form, padecimientoActual: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">AHFM</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.ahfm || ''} onChange={e => setForm({...form, ahfm: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">APP</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.app || ''} onChange={e => setForm({...form, app: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">APNP</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.apnp || ''} onChange={e => setForm({...form, apnp: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">IPAYS</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.ipays || ''} onChange={e => setForm({...form, ipays: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Exploración Física</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.exploracionFisica || ''} onChange={e => setForm({...form, exploracionFisica: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Estado Mental</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.estadoMental || ''} onChange={e => setForm({...form, estadoMental: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Pruebas Realizadas</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.pruebasRealizadas || ''} onChange={e => setForm({...form, pruebasRealizadas: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Diagnóstico Inicial</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.diagnosticoInicial || ''} onChange={e => setForm({...form, diagnosticoInicial: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Plan de Tratamiento</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.planTratamiento || ''} onChange={e => setForm({...form, planTratamiento: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Procedimientos Realizados</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 text-sm font-bold uppercase outline-none focus:bg-white" value={form.procedimientosRealizados || ''} onChange={e => setForm({...form, procedimientosRealizados: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Pronóstico</label>
                 <input className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold uppercase outline-none focus:bg-white" value={form.pronostico || ''} onChange={e => setForm({...form, pronostico: e.target.value})} />
             </div>
             <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400">Destino</label>
                 <input className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold uppercase outline-none focus:bg-white" value={form.destino || ''} onChange={e => setForm({...form, destino: e.target.value})} />
             </div>
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
