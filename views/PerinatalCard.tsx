
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Baby, ChevronLeft, Calendar, Save, Activity, 
  Ruler, Scale, AlertTriangle, Heart, FileText, 
  CheckCircle2, Plus, Calculator, Pill, Syringe,
  TrendingUp, Info, AlertOctagon, Printer, ShieldCheck, 
  Clock, Archive, Check, ChevronDown, ChevronRight, ClipboardList
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { Patient, ClinicalNote, PerinatalVisit, PregnancyRecord } from '../types';

// --- DATA: CÉDULA DE RIESGO OBSTÉTRICO ---
const RISK_SCORE_DATA = [
    {
        category: 'I. Factores Sociodemográficos',
        items: [
            { id: 'age_risk', label: 'Edad < 17 o > 35 años', points: 1 },
            { id: 'literacy', label: 'Analfabetismo / Baja escolaridad', points: 1 },
            { id: 'single_mother', label: 'Soltera / Sin apoyo familiar', points: 1 },
            { id: 'poverty', label: 'Pobreza extrema / Zona marginada', points: 1 },
            { id: 'work_risk', label: 'Trabajo físico pesado / Estrés', points: 1 },
            { id: 'addictions', label: 'Tabaquismo / Alcoholismo / Drogas', points: 2 }
        ]
    },
    {
        category: 'II. Antecedentes Obstétricos',
        items: [
            { id: 'nullipara_multipara', label: 'Primigesta o Multigesta (>4)', points: 1 },
            { id: 'infertility', label: 'Infertilidad tratada previa', points: 1 },
            { id: 'prev_abortion', label: 'Aborto habitual / Recurrente', points: 2 },
            { id: 'prev_perinatal_death', label: 'Muerte perinatal previa', points: 3 },
            { id: 'prev_csection', label: 'Cesárea previa', points: 2 },
            { id: 'prev_preeclampsia', label: 'Antecedente Preeclampsia/Eclampsia', points: 3 },
            { id: 'prev_hemorrhage', label: 'Hemorragia obstétrica previa', points: 2 },
            { id: 'low_birth_weight', label: 'Recién nacido < 2500g previo', points: 1 }
        ]
    },
    {
        category: 'III. Embarazo Actual',
        items: [
            { id: 'hypertension', label: 'Hipertensión Arterial / Preeclampsia', points: 3 },
            { id: 'diabetes', label: 'Diabetes Gestacional / Pre-gestacional', points: 3 },
            { id: 'anemia', label: 'Anemia (Hb < 10 mg/dL)', points: 1 },
            { id: 'infection', label: 'Infección Urinaria / Vaginal recurrente', points: 1 },
            { id: 'bleeding_current', label: 'Hemorragia / Amenaza de aborto', points: 3 },
            { id: 'multiple_pregnancy', label: 'Embarazo Múltiple', points: 3 },
            { id: 'malpresentation', label: 'Presentación no cefálica (>36 sem)', points: 2 },
            { id: 'membrane_rupture', label: 'Ruptura prematura de membranas', points: 3 },
            { id: 'isoimmunization', label: 'Isoinmunización Rh (-)', points: 2 }
        ]
    }
];

const PerinatalCard: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'risk' | 'charts' | 'plan'>('overview');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  
  // Estado para manejar el ID del embarazo seleccionado (Activo o Histórico)
  const [selectedPregnancyId, setSelectedPregnancyId] = useState<string | null>(null);

  // Estado del formulario para un nuevo embarazo (si no hay activo)
  const [newPregnancyForm, setNewPregnancyForm] = useState({
      fum: '',
      gesta: 0,
      para: 0,
      cesarean: 0,
      abortions: 0
  });

  // Estado del formulario de finalización
  const [finalizeForm, setFinalizeForm] = useState({
      outcome: 'Parto',
      date: new Date().toISOString().split('T')[0],
      notes: ''
  });

  // Formulario para nueva visita
  const [visitForm, setVisitForm] = useState<Partial<PerinatalVisit>>({
      weight: 0, bp: '', fundalHeight: 0, fetalHeartRate: 140, fetalPosition: 'Cefálico', edema: 'Negativo', alarmSigns: false, notes: ''
  });

  // --- DERIVED STATE ---
  // Obtener el registro de embarazo activo del paciente
  const activePregnancy = useMemo(() => {
      return patient?.pregnancyHistory?.find(p => p.status === 'Active') || null;
  }, [patient?.pregnancyHistory]);

  // Si se carga la página y hay un embarazo activo, seleccionarlo por defecto. Si no, seleccionar el último histórico.
  useEffect(() => {
      if (activePregnancy) {
          setSelectedPregnancyId(activePregnancy.id);
      } else if (patient?.pregnancyHistory && patient.pregnancyHistory.length > 0) {
          // Seleccionar el más reciente
          const sorted = [...patient.pregnancyHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          setSelectedPregnancyId(sorted[0].id);
      } else {
          setSelectedPregnancyId(null);
      }
  }, [patient?.pregnancyHistory, activePregnancy]);

  // Obtener el registro seleccionado actualmente para visualizar
  const currentRecord = useMemo(() => {
      return patient?.pregnancyHistory?.find(p => p.id === selectedPregnancyId) || null;
  }, [patient?.pregnancyHistory, selectedPregnancyId]);

  // Es el registro seleccionado el activo? (Para permitir edición)
  const isEditingActive = currentRecord?.status === 'Active';

  // --- CÁLCULOS AUTOMÁTICOS ---
  const calculatedWeeks = useMemo(() => {
      if (!currentRecord?.fum) return 0;
      const fumDate = new Date(currentRecord.fum);
      const today = new Date();
      // Si está finalizado, usar fecha fin, si no, hoy
      const endDate = currentRecord.status === 'Finished' && currentRecord.endDate ? new Date(currentRecord.endDate) : today;
      
      const diffTime = Math.abs(endDate.getTime() - fumDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.floor(diffDays / 7) + (diffDays % 7) / 7; // Semanas.días
  }, [currentRecord]);

  // Cálculo del Score de Riesgo
  const riskScore = useMemo(() => {
      if (!currentRecord) return 0;
      let score = 0;
      RISK_SCORE_DATA.forEach(group => {
          group.items.forEach(item => {
              if (currentRecord.riskFactors.includes(item.id)) {
                  score += item.points;
              }
          });
      });
      return score;
  }, [currentRecord]);

  const riskClassification = useMemo(() => {
      if (riskScore <= 2) return { level: 'BAJO RIESGO', color: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50', action: 'Atención en Primer Nivel' };
      if (riskScore <= 6) return { level: 'RIESGO MEDIO', color: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50', action: 'Referencia a Especialista (Ginecología)' };
      return { level: 'ALTO RIESGO', color: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200', bg: 'bg-rose-50', action: 'Atención en Segundo/Tercer Nivel (Hospital)' };
  }, [riskScore]);

  if (!patient) return null;

  // --- ACTIONS ---

  const handleStartNewPregnancy = () => {
      if (!newPregnancyForm.fum) return alert("Debe ingresar la Fecha de Última Menstruación (FUM).");
      
      // Calcular FPP
      const date = new Date(newPregnancyForm.fum);
      date.setDate(date.getDate() + 7);
      date.setMonth(date.getMonth() + 9);
      const fpp = date.toISOString().split('T')[0];

      const newRecord: PregnancyRecord = {
          id: `PREG-${Date.now()}`,
          status: 'Active',
          startDate: new Date().toISOString(),
          fum: newPregnancyForm.fum,
          fpp: fpp,
          ultrasoundDate: '',
          ultrasoundWeeks: 0,
          gesta: newPregnancyForm.gesta || (patient.pregnancyHistory?.length || 0) + 1,
          para: newPregnancyForm.para,
          cesarean: newPregnancyForm.cesarean,
          abortions: newPregnancyForm.abortions,
          riskFactors: [],
          vaccines: { tdpa: false, influenza: false, covid: false, hepatitisB: false },
          supplements: { folicAcid: true, iron: false, calcium: false, multivitamin: false },
          visits: []
      };

      const updatedHistory = [newRecord, ...(patient.pregnancyHistory || [])];
      onUpdatePatient({ ...patient, pregnancyHistory: updatedHistory });
      
      // Seleccionar el nuevo embarazo
      setSelectedPregnancyId(newRecord.id);
      
      // Reset form
      setNewPregnancyForm({ fum: '', gesta: 0, para: 0, cesarean: 0, abortions: 0 });
  };

  const handleAddVisit = () => {
     if (!visitForm.weight || !visitForm.bp) return alert("Peso y T/A son obligatorios");
     if (!activePregnancy) return;
     
     const newVisit: PerinatalVisit = {
         id: `VIS-${Date.now()}`,
         date: new Date().toISOString().split('T')[0],
         gestationalAge: parseFloat(calculatedWeeks.toFixed(1)),
         weight: Number(visitForm.weight),
         bp: visitForm.bp || '',
         fundalHeight: Number(visitForm.fundalHeight) || 0,
         fetalHeartRate: Number(visitForm.fetalHeartRate) || 0,
         fetalPosition: visitForm.fetalPosition || '',
         edema: visitForm.edema || 'Negativo',
         alarmSigns: visitForm.alarmSigns || false,
         notes: visitForm.notes || '',
         nextAppointment: visitForm.nextAppointment || ''
     };

     // Actualizar el registro de embarazo activo
     const updatedHistory = patient.pregnancyHistory!.map(rec => {
         if (rec.id === activePregnancy.id) {
             return { ...rec, visits: [...rec.visits, newVisit] };
         }
         return rec;
     });

     onUpdatePatient({ ...patient, pregnancyHistory: updatedHistory });
     setShowVisitModal(false);
     setVisitForm({}); // Clear form

     // Guardar Nota de Evolución Automática en el historial general
     const note: ClinicalNote = {
         id: `NOTE-PRENATAL-${Date.now()}`,
         patientId: patient.id,
         type: `Nota de Control Prenatal (${newVisit.gestationalAge} SDG)`,
         date: new Date().toLocaleString('es-MX'),
         author: 'Dr. Obstetra',
         content: {
             subjective: `Paciente acude a control prenatal. Refiere: ${newVisit.notes}. Signos de alarma: ${newVisit.alarmSigns ? 'PRESENTES' : 'Negados'}.`,
             objective: `Peso: ${newVisit.weight}kg, TA: ${newVisit.bp}, FCF: ${newVisit.fetalHeartRate} lpm, AU: ${newVisit.fundalHeight} cm. Edema: ${newVisit.edema}.`,
             analysis: `Embarazo de ${newVisit.gestationalAge} semanas de evolución normoevolutivo. Riesgo Obstétrico: ${riskClassification.level}.`,
             plan: `Cita abierta a urgencias si datos de alarma. Próxima cita: ${newVisit.nextAppointment}. Continuar suplementos.`,
             perinatalData: newVisit
         },
         isSigned: true,
         hash: `PRENATAL-${Math.random().toString(36).substr(2,8)}`
     };
     onSaveNote(note);
  };

  const handleFinalizePregnancy = () => {
      if (!activePregnancy) return;
      if (!confirm("¿Está seguro de finalizar el control prenatal actual? Esta acción archivará el carnet y permitirá iniciar uno nuevo.")) return;

      const updatedHistory = patient.pregnancyHistory!.map(rec => {
          if (rec.id === activePregnancy.id) {
              return { 
                  ...rec, 
                  status: 'Finished' as const, 
                  endDate: finalizeForm.date,
                  outcome: finalizeForm.outcome as any
              };
          }
          return rec;
      });

      onUpdatePatient({ ...patient, pregnancyHistory: updatedHistory });
      setShowFinalizeModal(false);
      setSelectedPregnancyId(null); // Fix: Deseleccionar para mostrar pantalla de creación/historial
      
      // Guardar nota de término
      const note: ClinicalNote = {
         id: `NOTE-TERM-${Date.now()}`,
         patientId: patient.id,
         type: `Término de Control Prenatal (${finalizeForm.outcome})`,
         date: new Date().toLocaleString('es-MX'),
         author: 'Dr. Obstetra',
         content: {
             summary: `Se finaliza control prenatal por ${finalizeForm.outcome}.`,
             notes: finalizeForm.notes,
             finalDate: finalizeForm.date
         },
         isSigned: true
      };
      onSaveNote(note);
  };

  const updateActiveRecordField = (field: keyof PregnancyRecord, value: any) => {
      if (!activePregnancy) return;
      const updatedHistory = patient.pregnancyHistory!.map(rec => {
          if (rec.id === activePregnancy.id) {
              return { ...rec, [field]: value };
          }
          return rec;
      });
      onUpdatePatient({ ...patient, pregnancyHistory: updatedHistory });
  };
  
  const updateActiveRecordNested = (parent: 'vaccines' | 'supplements', key: string, value: boolean) => {
      if (!activePregnancy) return;
      const updatedHistory = patient.pregnancyHistory!.map(rec => {
          if (rec.id === activePregnancy.id) {
              return { 
                  ...rec, 
                  [parent]: { ...rec[parent], [key]: value } 
              };
          }
          return rec;
      });
      onUpdatePatient({ ...patient, pregnancyHistory: updatedHistory });
  };

  // --- VISTA SIN EMBARAZO SELECCIONADO O MODO CREACIÓN ---
  if (!currentRecord && !activePregnancy) {
      return (
          <div className="max-w-4xl mx-auto py-20 px-4 animate-in fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-8 border border-slate-200">
                  <div className="w-24 h-24 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Baby size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Control Prenatal</h2>
                  <p className="text-slate-500 max-w-lg mx-auto">No hay un embarazo activo registrado para esta paciente. Inicie una nueva tarjeta de control prenatal para comenzar el seguimiento.</p>
                  
                  {/* Historial previo si existe */}
                  {patient.pregnancyHistory && patient.pregnancyHistory.length > 0 && (
                      <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Historial de Embarazos Previos</p>
                          <div className="space-y-2">
                              {patient.pregnancyHistory.map(rec => (
                                  <button key={rec.id} onClick={() => setSelectedPregnancyId(rec.id)} className="w-full flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 hover:border-pink-300 transition-all group">
                                      <div>
                                          <p className="text-xs font-black text-slate-700 uppercase">{rec.outcome || 'Finalizado'}</p>
                                          <p className="text-[10px] text-slate-400">{new Date(rec.startDate).toLocaleDateString()} - {rec.endDate ? new Date(rec.endDate).toLocaleDateString() : '?'}</p>
                                      </div>
                                      <ChevronRight size={16} className="text-slate-300 group-hover:text-pink-500"/>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="max-w-md mx-auto pt-8 border-t border-slate-100">
                      <h3 className="text-sm font-black text-slate-900 uppercase mb-4">Datos Iniciales Nuevo Embarazo</h3>
                      <div className="grid grid-cols-2 gap-4 text-left">
                          <div className="space-y-1 col-span-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">FUM (Fecha Última Regla)</label>
                              <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={newPregnancyForm.fum} onChange={e => setNewPregnancyForm({...newPregnancyForm, fum: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Gesta</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold" value={newPregnancyForm.gesta} onChange={e => setNewPregnancyForm({...newPregnancyForm, gesta: parseInt(e.target.value)})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Para</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold" value={newPregnancyForm.para} onChange={e => setNewPregnancyForm({...newPregnancyForm, para: parseInt(e.target.value)})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cesáreas</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold" value={newPregnancyForm.cesarean} onChange={e => setNewPregnancyForm({...newPregnancyForm, cesarean: parseInt(e.target.value)})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Abortos</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold" value={newPregnancyForm.abortions} onChange={e => setNewPregnancyForm({...newPregnancyForm, abortions: parseInt(e.target.value)})} />
                          </div>
                      </div>
                      <button onClick={handleStartNewPregnancy} className="w-full mt-6 py-4 bg-pink-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-pink-700 transition-all">
                          Iniciar Control Prenatal
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- VISTA DASHBOARD (ACTIVO O HISTÓRICO) ---
  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
       {/* HEADER DEL CARNET */}
       <div className={`text-white p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-8 no-print sticky top-4 z-40 border-b-8 transition-colors ${isEditingActive ? 'bg-pink-600 border-pink-800' : 'bg-slate-700 border-slate-900'}`}>
           <div className="flex items-center gap-6">
              <button onClick={() => navigate(-1)} className="p-4 bg-white/20 hover:bg-white/30 rounded-2xl transition-all backdrop-blur-sm">
                 <ChevronLeft size={24} />
              </button>
              <div>
                 <h1 className="text-3xl font-black uppercase tracking-tighter">
                     {isEditingActive ? 'Tarjeta de Control Prenatal' : `Histórico: ${currentRecord?.outcome || 'Finalizado'}`}
                 </h1>
                 <div className="flex items-center gap-3 mt-1">
                     <p className="text-white/80 font-bold uppercase text-[10px] tracking-[0.3em]">NOM-007 • {isEditingActive ? 'ACTIVO' : 'ARCHIVO'}</p>
                     
                     {/* Selector de Embarazo */}
                     <div className="relative group">
                         <button className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all">
                             Cambiar <ChevronDown size={10}/>
                         </button>
                         <div className="absolute top-full left-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                             {patient.pregnancyHistory?.map(rec => (
                                 <button 
                                    key={rec.id} 
                                    onClick={() => setSelectedPregnancyId(rec.id)}
                                    className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 border-b border-slate-50 flex justify-between ${rec.id === currentRecord?.id ? 'bg-pink-50 text-pink-600' : ''}`}
                                 >
                                     <span>{rec.status === 'Active' ? 'Actual' : rec.outcome}</span>
                                     <span className="opacity-50">{new Date(rec.startDate).getFullYear()}</span>
                                 </button>
                             ))}
                             {/* OPCIÓN PARA NUEVA GESTACIÓN SI NO HAY ACTIVA */}
                             {!activePregnancy && (
                                <button 
                                    onClick={() => setSelectedPregnancyId(null)}
                                    className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 border-t border-slate-50 text-blue-600 flex items-center gap-2"
                                >
                                    <Plus size={12} /> Nueva Gestación
                                </button>
                             )}
                         </div>
                     </div>
                 </div>
              </div>
           </div>
           
           <div className="flex gap-6 text-center">
               <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm">
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Edad Gestacional</p>
                   <p className="text-3xl font-black">{Math.floor(calculatedWeeks)}.<span className="text-base">{Math.round((calculatedWeeks % 1) * 7)}</span> <span className="text-xs font-bold">SDG</span></p>
               </div>
               <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm">
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Fecha Probable Parto</p>
                   <p className="text-2xl font-black">{currentRecord?.fpp || '--/--/----'}</p>
               </div>
               <div className={`px-6 py-3 rounded-2xl border backdrop-blur-sm flex flex-col justify-center transition-colors ${riskClassification.color.replace('bg-', 'bg-').replace('text-', 'border-')}`}>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/80">Clasificación</p>
                   <p className="text-xl font-black uppercase flex items-center justify-center gap-2">
                       {riskScore > 2 && <AlertTriangle size={18} className="animate-pulse"/>}
                       {riskClassification.level}
                   </p>
               </div>
           </div>
       </div>

       <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-xl overflow-hidden min-h-[800px] flex flex-col">
           {/* TABS DE NAVEGACIÓN */}
           <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto no-scrollbar">
               {[
                   { id: 'overview', label: 'Resumen Obstétrico', icon: <Baby size={18}/> },
                   { id: 'visits', label: 'Bitácora de Consultas', icon: <FileText size={18}/> },
                   { id: 'risk', label: 'Evaluación de Riesgo', icon: <ClipboardList size={18}/> },
                   { id: 'charts', label: 'Curvas de Crecimiento', icon: <TrendingUp size={18}/> },
                   { id: 'plan', label: 'Plan de Parto y Prevención', icon: <ShieldCheck size={18}/> },
               ].map(tab => (
                   <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as any)}
                       className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                   >
                       {tab.icon} {tab.label}
                   </button>
               ))}
           </div>

           <div className="p-10 flex-1 bg-white">
               
               {/* --- TAB 1: RESUMEN OBSTÉTRICO --- */}
               {activeTab === 'overview' && currentRecord && (
                   <div className="space-y-10 animate-in slide-in-from-left-4">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           {/* CALCULADORA */}
                           <div className="bg-pink-50 border border-pink-100 rounded-[2.5rem] p-8 space-y-6">
                               <h3 className="text-sm font-black uppercase text-pink-700 flex items-center gap-2">
                                   <Calculator size={16}/> Cronometría
                               </h3>
                               <div className="space-y-4">
                                   <div className="space-y-1">
                                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2">FUM (Ultima Regla)</label>
                                       <input 
                                            type="date" 
                                            className="w-full p-4 bg-white border border-pink-200 rounded-2xl text-sm font-black text-slate-800 outline-none" 
                                            value={currentRecord.fum} 
                                            onChange={e => isEditingActive && updateActiveRecordField('fum', e.target.value)} 
                                            disabled={!isEditingActive}
                                        />
                                   </div>
                                   <div className="space-y-1">
                                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Corrección por USG</label>
                                       <div className="flex gap-2">
                                           <input 
                                                type="date" 
                                                className="flex-1 p-3 bg-white border border-pink-200 rounded-2xl text-xs font-bold" 
                                                value={currentRecord.ultrasoundDate} 
                                                onChange={e => isEditingActive && updateActiveRecordField('ultrasoundDate', e.target.value)}
                                                disabled={!isEditingActive} 
                                            />
                                           <input 
                                                type="number" 
                                                className="w-20 p-3 bg-white border border-pink-200 rounded-2xl text-xs font-bold text-center" 
                                                placeholder="Sem." 
                                                value={currentRecord.ultrasoundWeeks || ''} 
                                                onChange={e => isEditingActive && updateActiveRecordField('ultrasoundWeeks', parseFloat(e.target.value))}
                                                disabled={!isEditingActive} 
                                            />
                                       </div>
                                   </div>
                               </div>
                           </div>

                           {/* HISTORIA OBSTÉTRICA */}
                           <div className="md:col-span-2 bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 space-y-6">
                               <h3 className="text-sm font-black uppercase text-slate-700 flex items-center gap-2">
                                   <Activity size={16}/> Antecedentes Obstétricos
                               </h3>
                               <div className="grid grid-cols-4 gap-4">
                                   {[
                                       { l: 'Gesta', k: 'gesta' }, { l: 'Para', k: 'para' }, 
                                       { l: 'Cesáreas', k: 'cesarean' }, { l: 'Abortos', k: 'abortions' }
                                   ].map(item => (
                                       <div key={item.k} className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                           <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{item.l}</p>
                                           <input 
                                                type="number" 
                                                className="w-full bg-transparent text-2xl font-black text-slate-900 text-center outline-none" 
                                                value={(currentRecord as any)[item.k]}
                                                onChange={e => isEditingActive && updateActiveRecordField(item.k as any, parseInt(e.target.value) || 0)}
                                                disabled={!isEditingActive}
                                           />
                                       </div>
                                   ))}
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-between">
                                       <span className="text-xs font-bold text-slate-500 uppercase">Grupo Sanguíneo</span>
                                       <span className="text-xl font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl">{patient.bloodType}</span>
                                   </div>
                                   <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-between">
                                       <span className="text-xs font-bold text-slate-500 uppercase">Edad Materna</span>
                                       <span className={`text-xl font-black ${patient.age < 18 || patient.age > 35 ? 'text-amber-500' : 'text-slate-700'}`}>{patient.age}</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               )}

               {/* --- TAB: EVALUACIÓN DE RIESGO --- */}
               {activeTab === 'risk' && currentRecord && (
                    <div className="space-y-10 animate-in slide-in-from-right-4">
                        <div className={`p-8 rounded-[3rem] border-4 flex flex-col md:flex-row items-center justify-between gap-8 ${riskClassification.bg} ${riskClassification.border}`}>
                            <div className="flex items-center gap-6">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl ${riskClassification.color}`}>
                                    {riskScore}
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-black uppercase tracking-tight ${riskClassification.text}`}>{riskClassification.level}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Puntaje Total Acumulado</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recomendación Clínica</p>
                                <p className="text-lg font-black text-slate-800 uppercase max-w-md">{riskClassification.action}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {RISK_SCORE_DATA.map((category, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 mb-4">{category.category}</h4>
                                    <div className="space-y-2 flex-1">
                                        {category.items.map(item => {
                                            const isSelected = currentRecord.riskFactors.includes(item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    disabled={!isEditingActive}
                                                    onClick={() => {
                                                        const newRisks = isSelected 
                                                            ? currentRecord.riskFactors.filter(r => r !== item.id)
                                                            : [...currentRecord.riskFactors, item.id];
                                                        updateActiveRecordField('riskFactors', newRisks);
                                                    }}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-50 text-slate-500 hover:border-slate-200'}`}
                                                >
                                                    <span className="text-[9px] font-bold uppercase pr-2">{item.label}</span>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-400'}`}>+{item.points}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
               )}

               {/* --- TAB 2: VISITAS --- */}
               {activeTab === 'visits' && currentRecord && (
                   <div className="space-y-6 animate-in slide-in-from-right-4">
                       <div className="flex justify-between items-center">
                           <h3 className="text-xl font-black text-slate-900 uppercase">Control de Consultas</h3>
                           <div className="flex gap-4">
                               {isEditingActive && (
                                   <>
                                   <button onClick={() => setShowFinalizeModal(true)} className="px-6 py-3 bg-white border border-slate-200 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2">
                                       <Archive size={16}/> Finalizar Embarazo
                                   </button>
                                   <button onClick={() => setShowVisitModal(true)} className="px-8 py-3 bg-pink-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-pink-700 transition-all flex items-center gap-2">
                                       <Plus size={16}/> Registrar Visita
                                   </button>
                                   </>
                               )}
                           </div>
                       </div>

                       <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 shadow-sm">
                           <table className="w-full text-left">
                               <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                   <tr>
                                       <th className="p-5">Fecha / SDG</th>
                                       <th className="p-5 text-center">Peso / T.A.</th>
                                       <th className="p-5 text-center">Alt. Uterina</th>
                                       <th className="p-5 text-center">FCF (lpm)</th>
                                       <th className="p-5 text-center">Posición</th>
                                       <th className="p-5 text-center">Edema / Alarma</th>
                                       <th className="p-5">Notas / Pendientes</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                   {currentRecord.visits.map((v, i) => (
                                       <tr key={i} className="hover:bg-pink-50/30 transition-all">
                                           <td className="p-5">
                                               <p>{v.date}</p>
                                               <p className="text-pink-600 font-black">{v.gestationalAge} SDG</p>
                                           </td>
                                           <td className="p-5 text-center">
                                               <p>{v.weight} kg</p>
                                               <p className="text-slate-400 font-normal">{v.bp}</p>
                                           </td>
                                           <td className="p-5 text-center">{v.fundalHeight} cm</td>
                                           <td className="p-5 text-center flex justify-center items-center gap-1">
                                               <Heart size={12} className="text-rose-500 fill-current"/> {v.fetalHeartRate}
                                           </td>
                                           <td className="p-5 text-center uppercase text-[10px]">{v.fetalPosition}</td>
                                           <td className="p-5 text-center">
                                               <p>{v.edema}</p>
                                               {v.alarmSigns && <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-black uppercase">! Alarma</span>}
                                           </td>
                                           <td className="p-5 text-[10px] uppercase text-slate-500 max-w-xs truncate">{v.notes}</td>
                                       </tr>
                                   ))}
                                   {currentRecord.visits.length === 0 && (
                                       <tr>
                                           <td colSpan={7} className="p-10 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Sin consultas registradas</td>
                                       </tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               )}

               {/* --- TAB 3: GRÁFICAS --- */}
               {activeTab === 'charts' && currentRecord && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in-95">
                       {/* GRÁFICA DE PESO */}
                       <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Scale size={16} className="text-blue-500"/> Ganancia de Peso Materno</h3>
                           <div className="h-64">
                               <ResponsiveContainer width="100%" height="100%">
                                   <LineChart data={currentRecord.visits} margin={{top:5, right:20, bottom:5, left:0}}>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                       <XAxis dataKey="gestationalAge" fontSize={10} tickFormatter={(v)=>`${v}w`}/>
                                       <YAxis domain={['dataMin - 2', 'dataMax + 2']} fontSize={10}/>
                                       <Tooltip contentStyle={{borderRadius:'16px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                                       <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} name="Peso (kg)"/>
                                   </LineChart>
                               </ResponsiveContainer>
                           </div>
                       </div>

                       {/* GRÁFICA DE ALTURA UTERINA */}
                       <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Ruler size={16} className="text-pink-500"/> Altura de Fondo Uterino (CLAP)</h3>
                           <div className="h-64">
                               <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={currentRecord.visits} margin={{top:5, right:20, bottom:5, left:0}}>
                                       <defs>
                                           <linearGradient id="colorFH" x1="0" y1="0" x2="0" y2="1">
                                               <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                                               <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                           </linearGradient>
                                       </defs>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                       <XAxis dataKey="gestationalAge" fontSize={10} tickFormatter={(v)=>`${v}w`}/>
                                       <YAxis domain={[10, 40]} fontSize={10}/>
                                       <Tooltip contentStyle={{borderRadius:'16px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                                       <Area type="monotone" dataKey="fundalHeight" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorFH)" name="Altura (cm)"/>
                                   </AreaChart>
                               </ResponsiveContainer>
                           </div>
                       </div>
                   </div>
               )}

               {/* --- TAB 4: PLAN Y PREVENCIÓN --- */}
               {activeTab === 'plan' && currentRecord && (
                   <div className="space-y-8 animate-in slide-in-from-right-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* VACUNACIÓN */}
                           <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8">
                               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Syringe size={16} className="text-indigo-600"/> Esquema de Vacunación</h3>
                               <div className="space-y-3">
                                   {[
                                       { k: 'tdpa', l: 'Tdap (Tétanos, Difteria, Tosferina) - Sem 20+' },
                                       { k: 'influenza', l: 'Influenza Estacional' },
                                       { k: 'covid', l: 'COVID-19 (Refuerzo)' },
                                       { k: 'hepatitisB', l: 'Hepatitis B (Si riesgo)' }
                                   ].map(v => (
                                       <div key={v.k} onClick={() => isEditingActive && updateActiveRecordNested('vaccines', v.k, !(currentRecord.vaccines as any)[v.k])} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${ (currentRecord.vaccines as any)[v.k] ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'}`}>
                                           <span className="text-[10px] font-black uppercase">{v.l}</span>
                                           {(currentRecord.vaccines as any)[v.k] ? <CheckCircle2 size={18} className="text-indigo-600"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                                       </div>
                                   ))}
                               </div>
                           </div>

                           {/* SUPLEMENTOS */}
                           <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8">
                               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Pill size={16} className="text-emerald-600"/> Suplementación</h3>
                               <div className="space-y-3">
                                   {[
                                       { k: 'folicAcid', l: 'Ácido Fólico (400mcg - 5mg)' },
                                       { k: 'iron', l: 'Hierro / Fumarato Ferroso' },
                                       { k: 'calcium', l: 'Calcio' },
                                       { k: 'multivitamin', l: 'Multivitamínico Prenatal' }
                                   ].map(v => (
                                       <div key={v.k} onClick={() => isEditingActive && updateActiveRecordNested('supplements', v.k, !(currentRecord.supplements as any)[v.k])} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${ (currentRecord.supplements as any)[v.k] ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}>
                                           <span className="text-[10px] font-black uppercase">{v.l}</span>
                                           {(currentRecord.supplements as any)[v.k] ? <CheckCircle2 size={18} className="text-emerald-600"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>

                       {/* SIGNOS DE ALARMA */}
                       <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex items-start gap-6">
                           <AlertOctagon size={32} className="text-rose-600 flex-shrink-0" />
                           <div className="space-y-2">
                               <h3 className="text-lg font-black text-rose-800 uppercase">Educación sobre Signos de Alarma</h3>
                               <p className="text-xs font-medium text-rose-700 uppercase leading-relaxed">
                                   Se ha instruido a la paciente a acudir INMEDIATAMENTE a urgencias en caso de:
                                   Sangrado vaginal, salida de líquido, dolor de cabeza intenso, zumbido de oídos, visión de luces, hinchazón de cara/manos, dolor en boca del estómago, fiebre o disminución de movimientos fetales.
                               </p>
                           </div>
                       </div>
                   </div>
               )}

           </div>
       </div>

       {/* MODAL NUEVA VISITA */}
       {showVisitModal && (
           <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                   <h3 className="text-2xl font-black text-pink-600 uppercase tracking-tight mb-8">Registrar Consulta Prenatal</h3>
                   
                   <div className="grid grid-cols-2 gap-6 mb-6">
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Peso (kg)</label>
                           <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" value={visitForm.weight || ''} onChange={e => setVisitForm({...visitForm, weight: parseFloat(e.target.value)})} autoFocus/>
                       </div>
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tensión Arterial</label>
                           <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="120/80" value={visitForm.bp} onChange={e => setVisitForm({...visitForm, bp: e.target.value})}/>
                       </div>
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fondo Uterino (cm)</label>
                           <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" value={visitForm.fundalHeight || ''} onChange={e => setVisitForm({...visitForm, fundalHeight: parseFloat(e.target.value)})}/>
                       </div>
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">FCF (lpm)</label>
                           <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center text-rose-500" value={visitForm.fetalHeartRate || ''} onChange={e => setVisitForm({...visitForm, fetalHeartRate: parseFloat(e.target.value)})}/>
                       </div>
                   </div>

                   <div className="space-y-6 mb-6">
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Posición Fetal</label>
                           <div className="flex gap-2">
                               {['Cefálico', 'Pélvico', 'Transverso', 'N/A'].map(pos => (
                                   <button key={pos} onClick={() => setVisitForm({...visitForm, fetalPosition: pos})} className={`flex-1 p-3 rounded-xl border text-[9px] font-black uppercase ${visitForm.fetalPosition === pos ? 'bg-pink-100 border-pink-500 text-pink-700' : 'bg-white text-slate-400'}`}>{pos}</button>
                               ))}
                           </div>
                       </div>
                       
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nota de Evolución</label>
                           <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium resize-none outline-none" placeholder="Síntomas, movimientos fetales, molestias..." value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} />
                       </div>

                       <div onClick={() => setVisitForm({...visitForm, alarmSigns: !visitForm.alarmSigns})} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${visitForm.alarmSigns ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                           <span className="font-black uppercase text-xs">¿Presenta Signos de Alarma?</span>
                           {visitForm.alarmSigns ? <AlertTriangle/> : <CheckCircle2/>}
                       </div>
                       
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Próxima Cita</label>
                           <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={visitForm.nextAppointment} onChange={e => setVisitForm({...visitForm, nextAppointment: e.target.value})} />
                       </div>
                   </div>

                   <div className="flex gap-4">
                       <button onClick={() => setShowVisitModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                       <button onClick={handleAddVisit} className="flex-[2] py-4 bg-pink-600 rounded-2xl font-black text-xs uppercase text-white shadow-xl hover:bg-pink-700">Guardar Visita</button>
                   </div>
               </div>
           </div>
       )}

       {/* MODAL FINALIZAR EMBARAZO */}
       {showFinalizeModal && (
           <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8">
                   <h3 className="text-2xl font-black text-slate-900 uppercase">Finalizar Embarazo</h3>
                   <div className="space-y-4">
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Resultado</label>
                           <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none" value={finalizeForm.outcome} onChange={e => setFinalizeForm({...finalizeForm, outcome: e.target.value})}>
                               <option>Parto</option>
                               <option>Cesárea</option>
                               <option>Aborto</option>
                               <option>Ectópico</option>
                               <option>Otro</option>
                           </select>
                       </div>
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fecha de Término</label>
                           <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={finalizeForm.date} onChange={e => setFinalizeForm({...finalizeForm, date: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Notas Finales</label>
                           <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium resize-none outline-none" placeholder="Complicaciones, estado del RN..." value={finalizeForm.notes} onChange={e => setFinalizeForm({...finalizeForm, notes: e.target.value})} />
                       </div>
                   </div>
                   <div className="flex gap-4">
                       <button onClick={() => setShowFinalizeModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                       <button onClick={handleFinalizePregnancy} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-slate-800">Confirmar Término</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default PerinatalCard;
