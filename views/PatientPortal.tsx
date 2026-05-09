import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, FileText, Activity, Clock, Video, Pill, 
  ChevronRight, ShieldCheck, Download, AlertCircle, RefreshCw, Upload, HeartPulse, Stethoscope, Droplet, Target, Baby
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo, Vitals, ChronicVisit } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface PatientPortalProps {
  patient: Patient | null;
  appointments?: Patient[];
  notes: ClinicalNote[];
  doctors: DoctorInfo[];
  onUpdatePatient?: (patient: Patient) => void;
  onSaveNote?: (note: ClinicalNote) => void;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ patient, appointments = [], notes, doctors, onUpdatePatient, onSaveNote }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'resumen' | 'antecedentes' | 'salud' | 'expediente' | 'recetas' | 'citas'>('resumen');
  const [backgroundForm, setBackgroundForm] = useState(patient?.medicalBackground || {
    familyHistory: { diabetes: false, hypertension: false, cancer: false, cardiac: false, doctorNotes: '', patientNotes: '', lastUpdatedBy: null },
    pathological: { surgeries: false, allergies: false, chronicDiseases: false, transfusions: false, doctorNotes: '', patientNotes: '', lastUpdatedBy: null },
    nonPathological: { smoking: false, alcohol: false, drugs: false, doctorNotes: '', patientNotes: '', lastUpdatedBy: null },
    currentTreatments: { doctorNotes: '', patientNotes: '', lastUpdatedBy: null },
    lastSyncDate: null
  });
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, date: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [manualMetricType, setManualMetricType] = useState('Glucosa Capilar (mg/dL)');
  const [customMetricName, setCustomMetricName] = useState('');
  const [manualMetricValue, setManualMetricValue] = useState('');
  
  // Medications Form State
  const [medFormName, setMedFormName] = useState('');
  const [medFormBrand, setMedFormBrand] = useState('');
  const [medFormTimes, setMedFormTimes] = useState<string[]>([]);
  const [medFormNewTime, setMedFormNewTime] = useState('');
  const [medFormDuration, setMedFormDuration] = useState('');
  const [medFormDose, setMedFormDose] = useState('');
  const [medFormFrequencyType, setMedFormFrequencyType] = useState('Diario');
  const [medFormIsChronic, setMedFormIsChronic] = useState(false);
  const [medFormEditIdx, setMedFormEditIdx] = useState<number | null>(null);

  const handleSaveBackground = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      if (onUpdatePatient && patient) {
          onUpdatePatient({...patient, medicalBackground: backgroundForm});
      }
      try { if(typeof window !== undefined) { (window as any).__customAlert ? (window as any).__customAlert('Antecedentes guardados exitosamente. Esta información será visible para su médico.') : null; } } catch(e) {}
    }, 800);
  };

  const handleSaveMetric = () => {
      if (!manualMetricValue || !patient || !onUpdatePatient) return;
      if (manualMetricType === 'Otro...' && !customMetricName) {
          try { if (typeof window !== undefined) { (window as any).__customAlert ? (window as any).__customAlert('Por favor ingrese el nombre de la medida.') : null; } } catch(e) {}
          return;
      }

      const activeType = manualMetricType === 'Otro...' ? customMetricName : manualMetricType;
      const newVitalsHistory = [...(patient.vitalsHistory || [])];
      
      const newVital: Vitals = {
          date: new Date().toISOString(),
          source: 'Manual',
          bp: manualMetricType === 'Presión Arterial (mmHg)' ? manualMetricValue : '',
          glucose: manualMetricType === 'Glucosa Capilar (mg/dL)' ? Number(manualMetricValue) : undefined,
          weight: manualMetricType === 'Peso Actual (kg)' ? Number(manualMetricValue) : 0,
          height: 0,
          temp: 0,
          hr: 0,
          rr: 0,
          o2: 0,
          bmi: 0,
      };

      if (!['Glucosa Capilar (mg/dL)', 'Presión Arterial (mmHg)', 'Peso Actual (kg)'].includes(manualMetricType)) {
          newVital.customMetrics = { [activeType]: manualMetricValue };
      }
      
      newVitalsHistory.push(newVital);
      
      let updatedChronicHistory = patient.chronicHistory ? [...patient.chronicHistory] : [];
      let addedToChronic = false;
      if (updatedChronicHistory.length > 0) {
          const activeRecIdx = updatedChronicHistory.findIndex(r => r.status === 'Active');
          if (activeRecIdx >= 0) {
              const activeRec = updatedChronicHistory[activeRecIdx];
              const newChronicVisit: ChronicVisit = {
                  id: `VIS-PAT-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  weight: newVital.weight || (activeRec.visits.length > 0 ? activeRec.visits[0].weight : activeRec.baseline.weight),
                  bp: newVital.bp || (activeRec.visits.length > 0 ? activeRec.visits[0].bp : activeRec.baseline.bp),
                  glucose: newVital.glucose || 0,
                  adherenceToMeds: 'Buena', // Valor default paciente
                  adherenceToDiet: 'Buena', // Valor default paciente
                  notes: `Medición de ${activeType}: ${manualMetricValue}. (Paciente)`,
                  nextAppointment: '',
                  checkupsPerformed: []
              };
              updatedChronicHistory[activeRecIdx] = {
                  ...activeRec,
                  visits: [newChronicVisit, ...activeRec.visits]
              };
              addedToChronic = true;
          }
      }

      onUpdatePatient({
          ...patient,
          vitalsHistory: newVitalsHistory,
          chronicHistory: updatedChronicHistory,
          currentVitals: {
              ...(patient.currentVitals || { height: 0, temp: 0, hr: 0, rr: 0, o2: 0, bmi: 0, date: new Date().toISOString(), bp: '', weight: 0 }),
              ...newVital
          }
      });

      // bypassing standard alert because of iframes, fallback logic
      try {
          if (typeof window !== undefined) {
             (window as any).__customAlert ? (window as any).__customAlert(`Registro de ${activeType} guardado con éxito.`) : null;
          }
      } catch(e) {}
      setManualMetricValue('');
      setCustomMetricName('');
  };

  const vitalsChartData = useMemo(() => {
    if (!patient?.vitalsHistory || patient.vitalsHistory.length === 0) {
        return [
            { name: 'Ene', peso: 75, glucosa: 98 },
            { name: 'Feb', peso: 74.5, glucosa: 95 },
            { name: 'Mar', peso: 74, glucosa: 92 },
            { name: 'Abr', peso: parseFloat(patient?.currentVitals?.weight?.toString() || '74'), glucosa: 90 },
        ];
    }
    return patient.vitalsHistory.slice(-10).map(v => {
        let parsedDate = 'Fecha';
        try {
            parsedDate = new Date(v.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
        } catch(e) {}
        if(parsedDate === 'Invalid Date') {
           try{
               const tempDate = new Date(v.date + 'T00:00:00');
               parsedDate = tempDate.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
           } catch(e) {}
        }
        return {
            name: parsedDate,
            peso: v.weight || null,
            glucosa: v.glucose || null,
        }
    });
  }, [patient?.vitalsHistory, patient?.currentVitals]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6">
        <ShieldCheck className="w-16 h-16 text-blue-600 mb-4" />
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Portal del Paciente</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          Por favor, inicie sesión con su cuenta de paciente para acceder a su expediente clínico electrónico.
        </p>
      </div>
    );
  }

  const patientNotes = notes.filter(n => n.patientId === patient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const prescriptions = patientNotes.filter(n => n.type.includes('Receta Médica'));

  const upcomingAppointments = appointments.filter(a => 
    a.status !== 'Atendido' && 
    a.agendaStatus !== 'Cancelada'
  ).sort((a, b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime());

  const pastAppointments = appointments.filter(a => 
    a.status === 'Atendido' || 
    a.agendaStatus === 'Cancelada'
  ).sort((a, b) => new Date(b.scheduledDate || '').getTime() - new Date(a.scheduledDate || '').getTime());

  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Hola, {patient?.name?.split(' ')[0] || 'Paciente'}</h1>
            <p className="text-blue-100 font-medium flex items-center gap-2">
              <ShieldCheck size={16} /> Su expediente está protegido bajo la NOM-024-SSA3-2012
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/telemedicine')}
              className="bg-white text-blue-900 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
            >
              <Video size={16} /> Telemedicina
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        {[
          { id: 'resumen', label: 'Resumen', icon: <Activity size={16} /> },
          { id: 'antecedentes', label: 'Mis Antecedentes', icon: <ShieldCheck size={16} /> },
          { id: 'salud', label: 'Control de Salud', icon: <HeartPulse size={16} /> },
          { id: 'expediente', label: 'Mi Expediente', icon: <FileText size={16} /> },
          { id: 'recetas', label: 'Mis Recetas', icon: <Pill size={16} /> },
          { id: 'citas', label: 'Mis Citas', icon: <Calendar size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'resumen' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Datos Vitales Recientes</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-sm font-bold text-slate-600">Tipo de Sangre</span>
                      <span className="text-sm font-black text-rose-600">{patient.bloodType || 'No registrado'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-sm font-bold text-slate-600">Alergias</span>
                      <span className="text-sm font-black text-orange-600">{patient.allergies?.join(', ') || 'Ninguna'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">Condiciones Crónicas</span>
                      <span className="text-sm font-black text-blue-600">{patient.chronicDiseases?.join(', ') || 'Ninguna'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Próxima Cita</h3>
                  {nextAppointment ? (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md">
                        <span className="text-[10px] font-bold uppercase">
                          {new Date(nextAppointment.scheduledDate || new Date()).toLocaleString('es-MX', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {new Date(nextAppointment.scheduledDate || new Date()).getDate()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-indigo-900">{nextAppointment.reason || 'Consulta General'}</h4>
                        <p className="text-xs font-bold text-indigo-600/70 flex items-center gap-1 mt-1">
                          <Clock size={12} /> {nextAppointment.appointmentTime || 'Pendiente'} • {nextAppointment.assignedModule === 'Telemedicina' ? 'Videollamada' : 'Presencial'}
                        </p>
                        <button onClick={() => navigate('/telemedicine')} className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-all">
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Calendar size={24} className="text-indigo-300 mb-2" />
                      <p className="text-sm font-bold text-indigo-900">No hay citas próximas</p>
                      <button onClick={() => navigate('/telemedicine')} className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">
                        Agendar Cita
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Últimas Atenciones</h3>
                  <button onClick={() => setActiveTab('expediente')} className="text-xs font-bold text-blue-600 hover:underline">Ver todo</button>
                </div>
                <div className="space-y-3">
                  {patientNotes.slice(0, 3).map(note => (
                    <div key={note.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{note.type === 'Nota de Evolución PSOAP' ? 'Consulta' : note.type}</h4>
                          <p className="text-xs font-medium text-slate-500">{note.date} • {note.author}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  ))}
                  {patientNotes.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No hay atenciones recientes.</p>
                  )}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tratamientos Activos</h3>
                  <button onClick={() => setActiveTab('recetas')} className="text-xs font-bold text-emerald-600 hover:underline">Ver recetas</button>
                </div>
                <div className="space-y-3">
                  {prescriptions.length > 0 ? prescriptions[0].content?.meds?.map((m: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Pill size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase">{m.name} {m.dosage && `- ${m.dosage}`}</h4>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5">{m.instructions}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-4">No hay tratamientos activos.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'antecedentes' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" /> Perfil de Salud
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Por favor, llene esta información. Nos ayudará a brindarle una mejor atención en su próxima consulta. 
                  <span className="block mt-1 text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded-lg">
                    Esta información se sincronizará de forma segura con su médico.
                  </span>
                </p>
              </div>

              {/* Antecedentes Heredo-Familiares */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">1. Antecedentes Familiares</h4>
                <p className="text-xs text-slate-500">¿Alguien en su familia directa (padres, abuelos, hermanos) padece o padeció alguna de estas enfermedades?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'diabetes', label: 'Diabetes' },
                    { key: 'hypertension', label: 'Hipertensión' },
                    { key: 'cancer', label: 'Cáncer' },
                    { key: 'cardiac', label: 'Enf. del Corazón' }
                  ].map(item => (
                    <label key={item.key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${backgroundForm.familyHistory[item.key as keyof typeof backgroundForm.familyHistory] ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        checked={backgroundForm.familyHistory[item.key as keyof typeof backgroundForm.familyHistory] as boolean}
                        onChange={(e) => setBackgroundForm({
                          ...backgroundForm, 
                          familyHistory: { ...backgroundForm.familyHistory, [item.key]: e.target.checked }
                        })}
                      />
                      <span className="text-xs font-bold">{item.label}</span>
                    </label>
                  ))}
                </div>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Otras enfermedades familiares o detalles adicionales (Opcional)"
                  rows={2}
                  value={backgroundForm.familyHistory.patientNotes}
                  onChange={(e) => setBackgroundForm({...backgroundForm, familyHistory: {...backgroundForm.familyHistory, patientNotes: e.target.value}})}
                />
                {backgroundForm.familyHistory.doctorNotes && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs text-amber-800">
                    <span className="font-bold">Nota de su médico:</span> {backgroundForm.familyHistory.doctorNotes}
                  </div>
                )}
              </div>

              {/* Antecedentes Personales Patológicos */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">2. Historial Médico Personal</h4>
                <p className="text-xs text-slate-500">¿Usted padece o ha padecido alguna de las siguientes condiciones?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'surgeries', label: 'Cirugías Previas' },
                    { key: 'allergies', label: 'Alergias' },
                    { key: 'chronicDiseases', label: 'Enf. Crónicas' },
                    { key: 'transfusions', label: 'Transfusiones' }
                  ].map(item => (
                    <label key={item.key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${backgroundForm.pathological[item.key as keyof typeof backgroundForm.pathological] ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        checked={backgroundForm.pathological[item.key as keyof typeof backgroundForm.pathological] as boolean}
                        onChange={(e) => setBackgroundForm({
                          ...backgroundForm, 
                          pathological: { ...backgroundForm.pathological, [item.key]: e.target.checked }
                        })}
                      />
                      <span className="text-xs font-bold">{item.label}</span>
                    </label>
                  ))}
                </div>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Especifique sus cirugías, alergias o enfermedades crónicas (Opcional)"
                  rows={2}
                  value={backgroundForm.pathological.patientNotes}
                  onChange={(e) => setBackgroundForm({...backgroundForm, pathological: {...backgroundForm.pathological, patientNotes: e.target.value}})}
                />
                {backgroundForm.pathological.doctorNotes && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs text-amber-800">
                    <span className="font-bold">Nota de su médico:</span> {backgroundForm.pathological.doctorNotes}
                  </div>
                )}
              </div>

              {/* Antecedentes No Patológicos */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">3. Hábitos y Estilo de Vida</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'smoking', label: 'Tabaquismo (Fuma)' },
                    { key: 'alcohol', label: 'Bebe Alcohol' },
                    { key: 'drugs', label: 'Uso de Drogas' }
                  ].map(item => (
                    <label key={item.key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${backgroundForm.nonPathological[item.key as keyof typeof backgroundForm.nonPathological] ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        checked={backgroundForm.nonPathological[item.key as keyof typeof backgroundForm.nonPathological] as boolean}
                        onChange={(e) => setBackgroundForm({
                          ...backgroundForm, 
                          nonPathological: { ...backgroundForm.nonPathological, [item.key]: e.target.checked }
                        })}
                      />
                      <span className="text-xs font-bold">{item.label}</span>
                    </label>
                  ))}
                </div>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Detalles adicionales sobre su estilo de vida (ej. dieta, ejercicio)"
                  rows={2}
                  value={backgroundForm.nonPathological.patientNotes}
                  onChange={(e) => setBackgroundForm({...backgroundForm, nonPathological: {...backgroundForm.nonPathological, patientNotes: e.target.value}})}
                />
              </div>

              {/* Tratamientos Actuales */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">4. Tratamientos Actuales</h4>
                <p className="text-xs text-slate-500">¿Toma algún medicamento actualmente?</p>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Escriba los medicamentos, dosis y frecuencia (si los conoce)"
                  rows={3}
                  value={backgroundForm.currentTreatments.patientNotes}
                  onChange={(e) => setBackgroundForm({...backgroundForm, currentTreatments: {...backgroundForm.currentTreatments, patientNotes: e.target.value}})}
                />
                {backgroundForm.currentTreatments.doctorNotes && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs text-amber-800">
                    <span className="font-bold">Nota de su médico:</span> {backgroundForm.currentTreatments.doctorNotes}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSaveBackground}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                  {isSaving ? 'Guardando...' : 'Guardar Antecedentes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'salud' && (
            <div className="space-y-6">
              {/* Preventive care based on age/gender */}
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                       <ShieldCheck className="text-emerald-600" size={24} />
                       <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Medidas de Prevención y Tamizaje</h3>
                   </div>
                   <div className="flex gap-2">
                     {patient.sex === 'Femenino' && (
                        <button onClick={() => navigate(`/patient/${patient.id}/perinatal-card`)} className="bg-pink-100 text-pink-700 border border-pink-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-pink-200 transition shadow-sm">
                          <Baby size={14}/> Control Prenatal
                        </button>
                     )}
                     <button onClick={() => navigate(`/patient/${patient.id}/health-control`)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition shadow">
                        <Target size={14}/> Abrir Carnet Integral
                     </button>
                   </div>
                </div>
                <p className="text-xs text-emerald-700 mb-4">Acciones recomendadas de acuerdo a su perfil (Edad: {patient.age}, Sexo: {patient.sex}). Puede añadir sus vacunas y notas en su carnet.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {patient.age > 40 && patient.sex === 'Femenino' && (
                     <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                        <Activity className="text-emerald-500 mt-0.5" size={16} />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Mastografía Anual</p>
                          <p className="text-[10px] text-slate-500 mt-1">Recomendada para la detección oportuna. Consulte a su médico.</p>
                        </div>
                     </div>
                   )}
                   {patient.age > 45 && patient.sex === 'Masculino' && (
                     <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                        <Activity className="text-emerald-500 mt-0.5" size={16} />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Tamizaje de Próstata</p>
                          <p className="text-[10px] text-slate-500 mt-1">Antígeno prostático específico (PSA) y tacto rectal anual.</p>
                        </div>
                     </div>
                   )}
                   <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                      <Stethoscope className="text-emerald-500 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Desparasitación Anual</p>
                        <p className="text-[10px] text-slate-500 mt-1">Se recomienda profilaxis antiparasitaria cada 6 a 12 meses.</p>
                      </div>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                      <Droplet className="text-emerald-500 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Química Sanguínea (Anual)</p>
                        <p className="text-[10px] text-slate-500 mt-1">Para monitorear glucosa, colesterol y triglicéridos.</p>
                      </div>
                   </div>
                 </div>
               </div>
               
               {/* Vitals chart and Logger */}
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Métricas de Salud (Histórico Manual)</h3>
                     
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                           <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                               <tr>
                                   <th className="p-3">Fecha</th>
                                   <th className="p-3">Medida</th>
                                   <th className="p-3 text-right">Valor</th>
                                   <th className="p-3 text-center">Acción</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {(patient.vitalsHistory || []).filter(v => v.source === 'Manual').reverse().map((vital, idx) => {
                                   let typeName = 'Medición';
                                   let val = '';
                                   if (vital.customMetrics && Object.keys(vital.customMetrics).length > 0) {
                                       typeName = Object.keys(vital.customMetrics)[0];
                                       val = vital.customMetrics[typeName];
                                   } else if (vital.glucose) {
                                       typeName = 'Glucosa Capilar'; val = `${vital.glucose} mg/dL`;
                                   } else if (vital.bp) {
                                       typeName = 'Presión Arterial'; val = `${vital.bp} mmHg`;
                                   } else if (vital.weight) {
                                       typeName = 'Peso'; val = `${vital.weight} kg`;
                                   }

                                   let parsedDate = 'Fecha';
                                   try {
                                       parsedDate = new Date(vital.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                   } catch(e) {}
                                   
                                   return (
                                       <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                           <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{parsedDate}</td>
                                           <td className="p-3 font-bold text-slate-900">{typeName}</td>
                                           <td className="p-3 text-right text-blue-600 font-black">{val}</td>
                                           <td className="p-3 text-center">
                                               <button onClick={() => {
                                                   const newVitals = patient.vitalsHistory!.filter(v => v.date !== vital.date);
                                                   if (onUpdatePatient) onUpdatePatient({...patient, vitalsHistory: newVitals});
                                               }} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-[10px] uppercase">
                                                   Borrar
                                               </button>
                                           </td>
                                       </tr>
                                   )
                               })}
                               {(!patient.vitalsHistory || patient.vitalsHistory.filter(v => v.source === 'Manual').length === 0) && (
                                   <tr><td colSpan={4} className="p-6 text-center text-slate-400 font-medium">No hay registros manuales añadidos.</td></tr>
                               )}
                           </tbody>
                        </table>
                     </div>
                     <p className="text-[9px] text-slate-400 mt-4 text-center">Datos recopilados por el paciente en casa o mediciones informales.</p>
                 </div>
                 
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                     <div className="mb-4">
                        <h4 className="text-sm font-black text-slate-800 uppercase">Añadir Registro Manual</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Sus mediciones aparecerán en su expediente para que su médico las revise.</p>
                     </div>
                     <div className="space-y-3">
                         <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tipo de Medida</label>
                             <select value={manualMetricType} onChange={(e) => setManualMetricType(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500">
                                 <option value="Glucosa Capilar (mg/dL)">Glucosa Capilar (mg/dL)</option>
                                 <option value="Presión Arterial (mmHg)">Presión Arterial (mmHg)</option>
                                 <option value="Peso Actual (kg)">Peso Actual (kg)</option>
                                 <option value="Otro...">Otro...</option>
                             </select>
                         </div>
                         {manualMetricType === 'Otro...' && (
                             <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nombre de la Medida (Ej. Triglicéridos)</label>
                                 <input type="text" value={customMetricName} onChange={(e) => setCustomMetricName(e.target.value)} placeholder="Escriba el tipo" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-center outline-none focus:border-blue-500" />
                             </div>
                         )}
                         <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Valor Obtenido</label>
                             <input type="text" value={manualMetricValue} onChange={(e) => setManualMetricValue(e.target.value)} placeholder={manualMetricType.includes('Presión') ? 'Ej. 120/80' : 'Ej. 110'} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-center outline-none focus:border-blue-500" />
                         </div>
                         <button onClick={handleSaveMetric} className="w-full bg-blue-600 text-white p-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition">
                             Guardar Valor
                         </button>
                     </div>
                 </div>
              </div>

              {/* Chronic disease / Current treatments */}
              {patient.chronicDiseases && patient.chronicDiseases.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-bottom-8">
                   <div className="flex justify-between items-start mb-4">
                       <div>
                           <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Control de Enfermedades Crónicas</h3>
                           <p className="text-xs text-blue-700 mt-1">Monitoreo de sus padecimientos registrados: {patient.chronicDiseases.join(', ')}.</p>
                       </div>
                       <button onClick={() => navigate(`/patient/${patient.id}/chronic-card`)} className="bg-blue-600 text-white border border-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition shadow-sm shrink-0">
                          <HeartPulse size={14}/> Abrir Tarjeta de Control
                       </button>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-blue-100 flex flex-col gap-2">
                       <p className="text-xs font-bold text-slate-800 flex justify-between">Próxima toma de laboratorios recomendada: <span className="text-blue-600">En 2 meses</span></p>
                       <p className="text-xs font-bold text-slate-800 flex justify-between">Apego al tratamiento: <span className="text-emerald-600">Bueno</span></p>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'expediente' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Mi Expediente</h3>
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md">
                     <Upload size={14} /> Subir Resultados
                  </button>
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                      if(e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          setUploadedFiles([...uploadedFiles, { name: file.name, date: new Date().toLocaleDateString('es-MX') }]);
                          try { if(typeof window !== undefined) { (window as any).__customAlert ? (window as any).__customAlert(`Archivo "${file.name}" subido a su expediente con éxito.`) : null; } } catch(e) {}
                      }
                  }} />
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Estudios y Resultados (Subidos por Paciente)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={14} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500">{file.date}</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 p-2">
                           <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Historial de Atenciones Clínicas</h3>
                {patientNotes.map(note => (
                  <div key={note.id} className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-md mb-2">
                          {note.type === 'Nota de Evolución PSOAP' ? 'Consulta' : note.type}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">Atendido por: {note.author}</h4>
                        <p className="text-xs text-slate-500 mt-1">{note.date}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          Completada
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {patientNotes.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No hay atenciones registradas.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recetas' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <Pill className="text-blue-600" /> Agenda de Medicamentos Actuales
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Administre sus medicamentos actuales y configure recordatorios. Si termina su tratamiento, puede eliminarlo de la lista.</p>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 space-y-4">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">{medFormEditIdx !== null ? 'Editar Medicamento' : 'Añadir Medicamento a mi Agenda'}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="space-y-1 lg:col-span-2">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Medicamento / Compuesto</label>
                              <input value={medFormName} onChange={e => setMedFormName(e.target.value)} type="text" placeholder="Ej. Paracetamol 500mg" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Marca (Opcional)</label>
                              <input value={medFormBrand} onChange={e => setMedFormBrand(e.target.value)} type="text" placeholder="Ej. Tylenol" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Frecuencia de Tomas</label>
                              <select value={medFormFrequencyType} onChange={e => setMedFormFrequencyType(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500">
                                  <option value="Diario">Todos los días (Diario)</option>
                                  <option value="Cada 48 hrs">Cada 48 hrs (1 día sí, 1 no)</option>
                                  <option value="Cada 72 hrs">Cada 72 hrs (Cada 3 días)</option>
                                  <option value="1 vez a la semana">1 vez a la semana</option>
                                  <option value="1 vez al mes">1 vez al mes</option>
                                  <option value="A demanda (PRN)">A demanda (PRN) / Si hay dolor</option>
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Duración en Días</label>
                              <input disabled={medFormIsChronic} value={medFormDuration} onChange={e => setMedFormDuration(e.target.value)} type="number" placeholder="Ej. 5" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 disabled:opacity-50" />
                          </div>
                          <div className="lg:col-span-2 space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Dosis / Indicaciones</label>
                              <input value={medFormDose} onChange={e => setMedFormDose(e.target.value)} type="text" placeholder="Ej. 1 Tableta" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                          </div>
                          <div className="col-span-1 lg:col-span-5 bg-white border border-blue-100 p-5 rounded-2xl flex flex-col gap-4">
                              <label className="text-[10px] font-black uppercase text-slate-500">
                                  {medFormFrequencyType !== 'Diario' ? `⏰ Horarios para el día de toma (${medFormFrequencyType}) ` : '⏰ Horarios de Tomas al Día '}
                                  <span className="text-rose-500">* Obligatorio</span>
                              </label>
                              
                              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                  {/* Presets */}
                                  <div className="flex-1 space-y-2">
                                     <p className="text-[10px] uppercase font-bold text-slate-400">Generar horarios comunes:</p>
                                     <div className="flex flex-wrap gap-2">
                                         <button onClick={() => setMedFormTimes(['08:00'])} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-black transition">Cada 24 hrs</button>
                                         <button onClick={() => setMedFormTimes(['08:00', '20:00'])} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-black transition">Cada 12 hrs</button>
                                         <button onClick={() => setMedFormTimes(['08:00', '16:00', '23:59'])} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-black transition">Cada 8 hrs</button>
                                         <button onClick={() => setMedFormTimes(['06:00', '12:00', '18:00', '23:59'])} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-black transition">Cada 6 hrs</button>
                                     </div>
                                  </div>

                                  {/* Manual Input */}
                                  <div className="md:border-l md:border-slate-200 md:pl-4 space-y-2">
                                      <p className="text-[10px] uppercase font-bold text-slate-400">Añadir horario específico:</p>
                                      <div className="flex items-center gap-2">
                                          <input value={medFormNewTime} onChange={e => setMedFormNewTime(e.target.value)} type="time" className="p-2 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
                                          <button onClick={() => {
                                              if (medFormNewTime && !medFormTimes.includes(medFormNewTime)) {
                                                  setMedFormTimes([...medFormTimes, medFormNewTime].sort());
                                                  setMedFormNewTime('');
                                              }
                                          }} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap">Añadir</button>
                                          <span className="text-[10px] text-slate-400 italic ml-2 hidden md:inline"><input type="text" placeholder="Ej. 08:00, 16:00" className="opacity-0 w-0 h-0" onBlur={(e) => {
                                              const raw = e.target.value;
                                              if (raw) {
                                                  const newArr = raw.split(',').map(s=>s.trim()).filter(s=>s.match(/^\d{2}:\d{2}$/));
                                                  if (newArr.length > 0) setMedFormTimes([...medFormTimes, ...newArr].sort());
                                                  e.target.value = '';
                                              }
                                          }} /></span>
                                      </div>
                                  </div>
                              </div>

                              {/* Selected Times */}
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[60px] flex flex-wrap items-center gap-2">
                                  {medFormTimes.map((t, tid) => (
                                      <span key={tid} className="bg-white text-blue-700 px-3 py-1.5 rounded-lg text-xs font-black border border-blue-200 flex items-center gap-2 shadow-sm">
                                          <Clock size={14}/> {t}
                                          <button onClick={() => setMedFormTimes(medFormTimes.filter((_, i) => i !== tid))} className="text-slate-400 hover:text-red-500 ml-1 focus:outline-none"><AlertCircle size={14} className="rotate-45" /></button>
                                      </span>
                                  ))}
                                  {medFormTimes.length === 0 && <span className="text-xs text-slate-400 font-medium italic">No ha seleccionado ningún horario aún. Requiere al menos uno para guardar.</span>}
                              </div>
                          </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-slate-200 pt-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input checked={medFormIsChronic} type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" onChange={(e) => {
                                  setMedFormIsChronic(e.target.checked);
                                  if (e.target.checked) setMedFormDuration('');
                              }} />
                              <span className="text-xs font-bold text-slate-700">Tratamiento Crónico / Indefinido (Omite duración)</span>
                          </label>
                          <div className="flex items-center gap-2 w-full md:w-auto">
                              {medFormEditIdx !== null && (
                                  <button onClick={() => {
                                      setMedFormEditIdx(null);
                                      setMedFormName(''); setMedFormBrand(''); setMedFormTimes([]); setMedFormDuration(''); setMedFormDose(''); setMedFormIsChronic(false); setMedFormFrequencyType('Diario');
                                  }} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition shadow-sm">
                                      Cancelar
                                  </button>
                              )}
                              <button onClick={() => {
                                  if (!medFormName) {
                                      try { if(typeof window !== undefined) { (window as any).__customAlert ? (window as any).__customAlert('El nombre del medicamento es obligatorio.') : null; } } catch(e) {}
                                      return;
                                  }
                                  
                                  if (medFormTimes.length === 0) {
                                      try { if(typeof window !== undefined) { (window as any).__customAlert ? (window as any).__customAlert('Debe añadir al menos un horario de toma para guardar el medicamento.') : null; } } catch(e) {}
                                      return;
                                  }
                                  
                                  const durationDays = parseInt(medFormDuration);
                                  const startDT = new Date(); // If editing we ideally keep old startDT, to be improved.
                                  let endDT_string = 'Indefinido';
                                  
                                  const existingMed = medFormEditIdx !== null ? backgroundForm.currentTreatments.medicationsList![medFormEditIdx] : null;

                                  if (!medFormIsChronic && !isNaN(durationDays) && durationDays > 0) {
                                      const baseDate = existingMed ? new Date(existingMed.startDate) : startDT;
                                      const endDT = new Date(baseDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                                      endDT_string = endDT.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
                                  }

                                  const newMed = {
                                      drug: medFormName,
                                      brandName: medFormBrand,
                                      dose: medFormDose,
                                      frequency: medFormTimes.length > 0 ? `${medFormTimes.length} veces a la pauta` : '',
                                      frequencyText: medFormFrequencyType,
                                      startDate: existingMed ? existingMed.startDate : startDT.toISOString(),
                                      endDate: endDT_string, 
                                      isChronic: medFormIsChronic,
                                      indications: '',
                                      times: medFormTimes,
                                      durationDays: isNaN(durationDays) ? undefined : durationDays,
                                      dailyLogs: existingMed ? existingMed.dailyLogs : undefined
                                  };
                                  
                                  let updatedMedsList = [...(backgroundForm.currentTreatments.medicationsList || [])];
                                  if (medFormEditIdx !== null) {
                                      updatedMedsList[medFormEditIdx] = newMed;
                                  } else {
                                      updatedMedsList.push(newMed);
                                  }
                                  
                                  const updatedForm = {
                                      ...backgroundForm,
                                      currentTreatments: {
                                          ...backgroundForm.currentTreatments,
                                          medicationsList: updatedMedsList
                                      }
                                  };
                                  setBackgroundForm(updatedForm);
                                  
                                  if (onUpdatePatient && patient) {
                                      onUpdatePatient({...patient, medicalBackground: updatedForm});
                                  }
                                  
                                  setMedFormEditIdx(null);
                                  setMedFormName(''); setMedFormBrand(''); setMedFormTimes([]); setMedFormDuration(''); setMedFormDose(''); setMedFormIsChronic(false); setMedFormFrequencyType('Diario');
                                  
                              }} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition w-full md:w-auto shadow-sm">
                                  {medFormEditIdx !== null ? 'Guardar Cambios' : 'Guardar en mi Agenda'}
                              </button>
                          </div>
                      </div>
                  </div>
                  
                  <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Mis Tratamientos Activos</h4>
                      {backgroundForm.currentTreatments.medicationsList && backgroundForm.currentTreatments.medicationsList.length > 0 ? (
                          backgroundForm.currentTreatments.medicationsList.map((med, idx) => {
                              const start = new Date(med.startDate).getTime();
                              const now = new Date().getTime();
                              const diffInDays = Math.floor((now - start) / (1000 * 3600 * 24)) + 1;
                              const isFinished = !med.isChronic && med.durationDays && diffInDays > med.durationDays;
                              
                              return (
                              <div key={idx} className={`flex flex-col p-5 bg-white border ${isFinished ? 'border-slate-200 opacity-70 grayscale' : 'border-emerald-100 hover:border-emerald-300'} rounded-2xl shadow-sm transition-all gap-4`}>
                                  <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-4">
                                          <div className={`p-4 rounded-2xl ${med.isChronic ? 'bg-blue-100 text-blue-600' : (isFinished ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600')}`}>
                                              <Pill size={24} />
                                          </div>
                                          <div>
                                              <h4 className={`text-base font-black uppercase ${isFinished ? 'text-slate-600' : 'text-slate-800'}`}>{med.drug} {med.brandName && <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded ml-2">{med.brandName}</span>}</h4>
                                              <div className="flex flex-col gap-1 mt-1.5">
                                                {med.dose && <p className="text-[10px] font-bold text-slate-500 uppercase">Dosis: <span className="text-slate-700">{med.dose}</span></p>}
                                                {med.frequencyText && med.frequencyText !== 'Diario' && <p className="text-[10px] font-bold text-blue-500 uppercase">Pauta: <span className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">{med.frequencyText}</span></p>}
                                              </div>
                                              {med.times && med.times.length > 0 && !isFinished && (
                                                <div className="mt-3">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Tomas de Hoy:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {med.times.map((t, tid) => {
                                                            const todayStr = new Date().toISOString().split('T')[0];
                                                            const isTaken = med.dailyLogs && med.dailyLogs[todayStr] && med.dailyLogs[todayStr].includes(t);
                                                            return (
                                                                <button key={tid} onClick={() => {
                                                                    // Toggle log for this specific med and time
                                                                    const updatedMedsList = [...backgroundForm.currentTreatments.medicationsList!];
                                                                    const m = {...updatedMedsList[idx]};
                                                                    if (!m.dailyLogs) m.dailyLogs = {};
                                                                    if (!m.dailyLogs[todayStr]) m.dailyLogs[todayStr] = [];
                                                                    
                                                                    if (m.dailyLogs[todayStr].includes(t)) {
                                                                        m.dailyLogs[todayStr] = m.dailyLogs[todayStr].filter(x => x !== t);
                                                                    } else {
                                                                        m.dailyLogs[todayStr].push(t);
                                                                    }
                                                                    updatedMedsList[idx] = m;
                                                                    
                                                                    const updatedForm = {
                                                                        ...backgroundForm,
                                                                        currentTreatments: {
                                                                            ...backgroundForm.currentTreatments,
                                                                            medicationsList: updatedMedsList
                                                                        }
                                                                    };
                                                                    setBackgroundForm(updatedForm);
                                                                    if (onUpdatePatient && patient) onUpdatePatient({...patient, medicalBackground: updatedForm});
                                                                }} className={`text-xs px-3 py-1.5 rounded-lg font-black border flex items-center gap-1.5 transition-all outline-none ${isTaken ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                                                                    {isTaken ? <ShieldCheck size={12}/> : <Clock size={12}/>} {t}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                              )}
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                          <button onClick={() => {
                                              const updatedMedsList = backgroundForm.currentTreatments.medicationsList!.filter((_, i) => i !== idx);
                                              const updatedForm = { ...backgroundForm, currentTreatments: { ...backgroundForm.currentTreatments, medicationsList: updatedMedsList } };
                                              setBackgroundForm(updatedForm);
                                              if (onUpdatePatient && patient) onUpdatePatient({...patient, medicalBackground: updatedForm});
                                          }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest hidden md:block">
                                              {isFinished ? 'Remover' : 'Eliminar'}
                                          </button>
                                          <button onClick={() => {
                                              setMedFormEditIdx(idx);
                                              setMedFormName(med.drug);
                                              setMedFormBrand(med.brandName || '');
                                              setMedFormTimes(med.times || []);
                                              setMedFormFrequencyType(med.frequencyText || 'Diario');
                                              setMedFormDuration(med.durationDays ? med.durationDays.toString() : '');
                                              setMedFormDose(med.dose || '');
                                              setMedFormIsChronic(med.isChronic || false);
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }} className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all font-bold text-[10px] uppercase tracking-widest">
                                              Editar
                                          </button>
                                      </div>
                                  </div>
                                  
                                  {/* Progress Segment */}
                                  <div className="pl-16 pr-4">
                                      {med.isChronic ? (
                                          <span className="text-[10px] text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 font-extrabold uppercase mt-1 inline-block">
                                              Tratamiento Continuo (Día {diffInDays})
                                          </span>
                                      ) : med.durationDays ? (
                                          isFinished ? (
                                              <span className="text-[10px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-extrabold uppercase mt-1 inline-block">
                                                  Tratamiento Finalizado hace {diffInDays - med.durationDays} días
                                              </span>
                                          ) : (
                                              <div className="w-full max-w-sm mt-1">
                                                  <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold">
                                                      <span>Día {diffInDays} de {med.durationDays}</span>
                                                      <span className="text-emerald-600">Fin: {med.endDate}</span>
                                                  </div>
                                                  <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200 overflow-hidden">
                                                      <div className="bg-emerald-500 h-full transition-all duration-1000 ease-out" style={{width: `${Math.min(100, Math.round((diffInDays / med.durationDays) * 100))}%`}}></div>
                                                  </div>
                                              </div>
                                          )
                                      ) : null}
                                  </div>
                              </div>
                              )
                          })
                      ) : (
                          <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                              <p className="text-sm text-slate-500 font-medium">No tiene medicamentos registrados en su agenda.</p>
                          </div>
                      )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Historial de Recetas Médicas</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {prescriptions.map(note => (
                      <div key={note.id} className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Pill size={16} className="text-emerald-600" />
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Receta • {note.date}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 mb-1">Dr. {note.author}</p>
                          <p className="text-xs text-slate-600">{note.content?.meds?.length || 0} medicamentos recetados</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black uppercase hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-2">
                            <Download size={14} /> Descargar PDF
                          </button>
                        </div>
                      </div>
                    ))}
                    {prescriptions.length === 0 && (
                      <div className="text-center py-10">
                        <Pill size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500 font-medium">No tiene recetas emitidas.</p>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}

          {activeTab === 'citas' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mis Citas Programadas</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all flex items-center gap-2">
                  <Calendar size={14} /> Nueva Cita
                </button>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map(appt => (
                    <div key={appt.id} className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md">
                          <span className="text-[10px] font-bold uppercase">
                            {new Date(appt.scheduledDate || new Date()).toLocaleString('es-MX', { month: 'short' })}
                          </span>
                          <span className="text-lg font-black leading-none">
                            {new Date(appt.scheduledDate || new Date()).getDate()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-indigo-900">{appt.reason || 'Consulta General'}</h4>
                          <p className="text-xs font-bold text-indigo-600/70 flex items-center gap-1 mt-1">
                            <Clock size={12} /> {appt.appointmentTime || 'Pendiente'} • {appt.assignedModule === 'Telemedicina' ? 'Videollamada' : 'Presencial'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => navigate('/telemedicine')} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2">
                          <Video size={14} /> Entrar
                        </button>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-all shadow-sm">
                          Reprogramar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500 font-medium">No tiene citas programadas.</p>
                  </div>
                )}
                
                {/* Historial de citas pasadas */}
                <div className="mt-8">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Citas Anteriores</h4>
                  <div className="space-y-3">
                    {pastAppointments.length > 0 ? (
                      pastAppointments.map(appt => (
                        <div key={appt.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-700">{appt.reason || 'Consulta General'}</h4>
                              <p className="text-xs font-medium text-slate-500">
                                {new Date(appt.scheduledDate || new Date()).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} • {appt.assignedModule === 'Telemedicina' ? 'Videollamada' : 'Presencial'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                            appt.agendaStatus === 'Cancelada' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {appt.agendaStatus === 'Cancelada' ? 'Cancelada' : 'Completada'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-500 font-medium">No hay historial de citas.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/telemedicine')} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg"><Video size={16} className="text-white" /></div>
                  <span className="text-sm font-bold">Entrar a Telemedicina</span>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-white" />
              </button>
              <button onClick={() => navigate('/telemedicine')} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg"><Calendar size={16} className="text-white" /></div>
                  <span className="text-sm font-bold">Agendar Nueva Cita</span>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-white" />
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-orange-600 shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-sm font-black text-orange-900 uppercase">Aviso de Privacidad</h4>
                <p className="text-xs text-orange-800/80 mt-2 leading-relaxed font-medium">
                  Sus datos están protegidos según la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientPortal;
