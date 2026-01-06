
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, ChevronLeft, Save, Plus, Heart, Scale, 
  TrendingUp, ClipboardList, AlertTriangle, CheckCircle2, 
  Thermometer, Droplet, Archive, ArrowRight, Utensils, 
  Footprints, Brain, Calendar, Info, Target, ChevronDown, Check,
  Pill, AlertOctagon, History, Trash2, Edit2, ChevronRight, X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart 
} from 'recharts';
import { Patient, ClinicalNote, ChronicDiseaseRecord, ChronicVisit, TreatmentPlan } from '../types';

const ChronicDiseaseControl: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'visits' | 'meds' | 'goals' | 'education'>('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  // States for new record/visit/meds/diagnosis
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [isAddingDiagnosis, setIsAddingDiagnosis] = useState(false); // New state for adding diagnosis

  // Forms
  const [newRecordForm, setNewRecordForm] = useState({
      diagnosis: [] as string[],
      startDate: new Date().toISOString().split('T')[0],
      initialWeight: 0,
      initialBp: '',
      initialA1c: 0,
  });

  const [visitForm, setVisitForm] = useState<Partial<ChronicVisit> & { checkupsPerformed: string[] }>({
      weight: 0, bp: '', glucose: 0, hba1c: 0, waistCircumference: 0, 
      ldl: 0, hdl: 0, triglycerides: 0, totalCholesterol: 0,
      adherenceToMeds: 'Buena', adherenceToDiet: 'Regular',
      notes: '', medicationAdjustments: '', nextAppointment: '',
      checkupsPerformed: []
  });

  const [medForm, setMedForm] = useState<Partial<TreatmentPlan>>({
      drug: '', dose: '', frequency: '', active: true
  });

  // Derived State
  const activeRecord = useMemo(() => {
      return patient?.chronicHistory?.find(r => r.status === 'Active') || null;
  }, [patient?.chronicHistory]);

  const currentRecord = useMemo(() => {
      return patient?.chronicHistory?.find(r => r.id === selectedRecordId) || activeRecord;
  }, [patient?.chronicHistory, selectedRecordId, activeRecord]);

  useEffect(() => {
      if (activeRecord && !selectedRecordId) setSelectedRecordId(activeRecord.id);
      else if (!selectedRecordId && patient?.chronicHistory?.length) setSelectedRecordId(patient.chronicHistory[0].id);
  }, [activeRecord, patient?.chronicHistory]);

  const isEditingActive = currentRecord?.status === 'Active';

  // --- LOGIC: RISK CALCULATION (ASCVD Simplified) ---
  const calculateDetailedCVRisk = () => {
      if (!patient || !currentRecord) return { level: 'Bajo', score: 0 };
      
      const lastVisit = currentRecord.visits[0];
      const baseline = currentRecord.baseline;
      
      // Use last visit data if available, otherwise baseline
      const bp = lastVisit?.bp || baseline.bp || '120/80';
      const sbp = parseInt(bp.split('/')[0] || '120');
      const totalChol = lastVisit?.totalCholesterol || 180;
      const hdl = lastVisit?.hdl || 50;
      const smoker = patient.chronicDiseases?.includes('Tabaquismo');
      const diabetic = currentRecord.diagnosis.includes('Diabetes Mellitus');
      const hypertensive = currentRecord.diagnosis.includes('Hipertensión Arterial');
      
      let riskPoints = 0;
      
      // Age & Sex Base
      if (patient.sex === 'M') {
          if (patient.age > 45) riskPoints += 2;
          if (patient.age > 55) riskPoints += 2;
      } else {
           if (patient.age > 55) riskPoints += 2;
           if (patient.age > 65) riskPoints += 2;
      }

      // Comorbidities
      if (diabetic) riskPoints += 4;
      if (smoker) riskPoints += 3;
      if (hypertensive) riskPoints += 2;

      // Clinical Values
      if (sbp >= 140) riskPoints += 2;
      if (sbp >= 160) riskPoints += 2; // Cumulative
      
      if (totalChol >= 240) riskPoints += 2;
      if (hdl < 40) riskPoints += 1;
      
      let level: 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto' = 'Bajo';
      
      if (riskPoints >= 10 || (diabetic && riskPoints >= 6)) level = 'Muy Alto';
      else if (riskPoints >= 6) level = 'Alto';
      else if (riskPoints >= 3) level = 'Moderado';
      
      return { level, score: riskPoints };
  };

  const riskResult = calculateDetailedCVRisk();
  const riskLevel = riskResult.level;

  // --- ACTIONS ---
  const handleStartControl = () => {
      if (newRecordForm.diagnosis.length === 0) return alert("Seleccione al menos un diagnóstico.");
      
      const newRecord: ChronicDiseaseRecord = {
          id: `CHRON-${Date.now()}`,
          status: 'Active',
          startDate: newRecordForm.startDate,
          diagnosis: newRecordForm.diagnosis,
          cardiovascularRisk: 'Moderado', // Initial default
          baseline: {
              weight: Number(newRecordForm.initialWeight),
              bp: newRecordForm.initialBp,
              hba1c: Number(newRecordForm.initialA1c)
          },
          goals: {
              hba1cTarget: 7.0, // Default NOM-015
              bpTargetSystolic: 130, // Default NOM-030
              bpTargetDiastolic: 80,
              ldlTarget: 100, // Ajustar según riesgo
              bmiTarget: 25,
              waistTarget: patient!.sex === 'M' ? 90 : 80
          },
          visits: [],
          currentMedications: [],
          nutritionPlan: 'Dieta DASH / Mediterránea hiposódica.',
          annualCheckups: {
              ophthalmology: '', dental: '', footExam: '', 
              cardiology: '', nephrology: '', nutrition: ''
          }
      };

      const updatedHistory = [newRecord, ...(patient?.chronicHistory || [])];
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
      setSelectedRecordId(newRecord.id);
      setShowNewRecordModal(false);
  };

  const handleAddDiagnosis = (dx: string) => {
      if (!activeRecord) return;
      if (activeRecord.diagnosis.includes(dx)) return; // Avoid duplicates

      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              return { ...rec, diagnosis: [...rec.diagnosis, dx] };
          }
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
      setIsAddingDiagnosis(false);
  };

  const handleRemoveDiagnosis = (dx: string) => {
      if (!activeRecord) return;
      if (!confirm(`¿Eliminar diagnóstico ${dx} de este control?`)) return;

      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              return { ...rec, diagnosis: rec.diagnosis.filter(d => d !== dx) };
          }
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
  };

  const handleAddVisit = () => {
      if (!visitForm.weight || !visitForm.bp) return alert("Peso y T/A son obligatorios para el seguimiento.");
      if (!activeRecord) return;

      // Construct Treatment Snapshot String
      const treatmentSnapshot = activeRecord.currentMedications
          .filter(m => m.active)
          .map(m => `${m.drug} ${m.dose} ${m.frequency}`)
          .join(', ') || 'Sin medicación activa';

      const newVisit: ChronicVisit = {
          id: `VIS-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          weight: Number(visitForm.weight),
          bp: visitForm.bp || '',
          glucose: Number(visitForm.glucose),
          hba1c: Number(visitForm.hba1c) || undefined,
          waistCircumference: Number(visitForm.waistCircumference) || undefined,
          ldl: Number(visitForm.ldl) || undefined,
          hdl: Number(visitForm.hdl) || undefined,
          triglycerides: Number(visitForm.triglycerides) || undefined,
          totalCholesterol: Number(visitForm.totalCholesterol) || undefined,
          
          adherenceToMeds: visitForm.adherenceToMeds || 'Buena',
          adherenceToDiet: visitForm.adherenceToDiet || 'Regular',
          
          notes: visitForm.notes || '',
          medicationAdjustments: visitForm.medicationAdjustments || 'Continuar mismo esquema',
          nextAppointment: visitForm.nextAppointment || '',
          treatmentSnapshot: treatmentSnapshot,
          checkupsPerformed: visitForm.checkupsPerformed
      };

      // Update History (Add Visit AND Update Annual Checkups Dates if any selected)
      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              // Update Checkup Dates if marked in this visit
              const updatedCheckups = { ...rec.annualCheckups };
              visitForm.checkupsPerformed?.forEach(key => {
                  (updatedCheckups as any)[key] = newVisit.date;
              });

              return { 
                  ...rec, 
                  visits: [newVisit, ...rec.visits], // Newest first
                  annualCheckups: updatedCheckups
              }; 
          }
          return rec;
      });

      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
      setShowVisitModal(false);
      setVisitForm({ adherenceToMeds: 'Buena', adherenceToDiet: 'Regular', checkupsPerformed: [] });

      // Generate Note
      const note: ClinicalNote = {
          id: `NOTE-CRON-${Date.now()}`,
          patientId: patient!.id,
          type: 'Control de Enfermedades Crónicas',
          date: new Date().toLocaleString('es-MX'),
          author: 'Dr. Tratante',
          content: {
              diagnosis: currentRecord?.diagnosis.join(', '),
              visitData: newVisit,
              currentTreatment: treatmentSnapshot,
              checkupsDoneToday: visitForm.checkupsPerformed?.join(', ') || 'Ninguna',
              analysis: `Paciente en control. Riesgo CV: ${riskLevel}. Adherencia tx: ${newVisit.adherenceToMeds}. Metas: ${newVisit.bp}/${activeRecord.goals.bpTargetSystolic}mmHg.`,
              plan: `Próxima cita: ${newVisit.nextAppointment}. Ajustes: ${newVisit.medicationAdjustments}`
          },
          isSigned: true
      };
      onSaveNote(note);
  };

  const handleAddMed = () => {
      if (!medForm.drug || !activeRecord) return;
      const newMed: TreatmentPlan = {
          id: `DRUG-${Date.now()}`,
          drug: medForm.drug || '',
          dose: medForm.dose || '',
          frequency: medForm.frequency || '',
          active: true
      };
      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              return { ...rec, currentMedications: [...rec.currentMedications, newMed] };
          }
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
      setMedForm({ drug: '', dose: '', frequency: '', active: true });
      setShowMedModal(false);
  };

  const toggleMedStatus = (medId: string) => {
      if (!activeRecord) return;
      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              const updatedMeds = rec.currentMedications.map(m => 
                  m.id === medId ? { ...m, active: !m.active } : m
              );
              return { ...rec, currentMedications: updatedMeds };
          }
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
  };

  const handleArchiveControl = () => {
      if (!activeRecord) return;
      if (!confirm("¿Desea cerrar el ciclo de control actual? Esto archivará el registro para iniciar uno nuevo si es necesario (ej. cambio de adscripción o reinicio de metas).")) return;
      
      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              return { ...rec, status: 'Archived' as const, endDate: new Date().toISOString().split('T')[0] };
          }
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
      setSelectedRecordId(null); // Return to selection screen
  };

  const updateGoal = (key: keyof ChronicDiseaseRecord['goals'], val: number) => {
      if (!activeRecord) return;
      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              return { ...rec, goals: { ...rec.goals, [key]: val } };
          }
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
  };

  const updateNutrition = (text: string) => {
      if (!activeRecord) return;
      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) return { ...rec, nutritionPlan: text };
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
  };

  const toggleCheckup = (key: keyof ChronicDiseaseRecord['annualCheckups']) => {
      if (!activeRecord) return;
      // Logic: If already has date (true-ish), clear it. If empty/null, set today's date.
      const updatedHistory = patient!.chronicHistory!.map(rec => {
          if (rec.id === activeRecord.id) {
              const currentVal = rec.annualCheckups[key];
              const newVal = currentVal ? '' : new Date().toISOString().split('T')[0];
              
              // If trying to clear an existing date, confirm first
              if (currentVal && !confirm(`¿Desea borrar la fecha de revisión (${currentVal})?`)) {
                  return rec;
              }

              return { ...rec, annualCheckups: { ...rec.annualCheckups, [key]: newVal } };
          }
          return rec;
      });
      onUpdatePatient({ ...patient!, chronicHistory: updatedHistory });
  };

  if (!patient) return null;

  // --- RENDER HELPERS ---
  const getTrafficLight = (val: number, target: number, type: 'lower' | 'higher' | 'range' = 'lower') => {
      if (!val) return 'bg-slate-300';
      if (type === 'lower') return val <= target ? 'bg-emerald-500' : 'bg-rose-500';
      return 'bg-slate-300';
  };

  // Prepare chart data (reverse for chronological order left-to-right)
  const chartData = [...(currentRecord?.visits || [])].reverse();
  const bpChartData = chartData.map(v => {
      const [s,d] = v.bp.split('/').map(Number);
      return { ...v, sys: s || 0, dia: d || 0 };
  });

  const PATOLOGIES = ['Diabetes Mellitus', 'Hipertensión Arterial', 'Obesidad', 'Dislipidemia', 'Síndrome Metabólico', 'Enfermedad Renal Crónica', 'Insuficiencia Cardiaca'];

  if (!currentRecord && !showNewRecordModal) {
      return (
          <div className="max-w-4xl mx-auto py-20 px-4 animate-in fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-8 border border-slate-200">
                  <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Centro de Control Metabólico</h2>
                  <p className="text-slate-500 max-w-lg mx-auto">Gestión integral para Diabetes, Hipertensión, Obesidad y Dislipidemias. Inicie una nueva tarjeta de control para el seguimiento longitudinal y establecimiento de metas.</p>
                  
                  {patient.chronicHistory && patient.chronicHistory.length > 0 && (
                      <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left mb-6">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Historial de Controles Previos</p>
                          <div className="space-y-2">
                              {patient.chronicHistory.map(rec => (
                                  <button key={rec.id} onClick={() => setSelectedRecordId(rec.id)} className="w-full flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-all group">
                                      <div>
                                          <p className="text-xs font-black text-slate-700 uppercase">{rec.diagnosis.join(', ')}</p>
                                          <p className="text-[10px] text-slate-400">{rec.startDate} - {rec.endDate || 'Actual'}</p>
                                      </div>
                                      <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500"/>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  <button onClick={() => setShowNewRecordModal(true)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all">
                      Iniciar Nuevo Protocolo
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
        
        {/* MODAL NUEVO CONTROL */}
        {showNewRecordModal && (
            <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Nuevo Control de Crónicos</h3>
                    
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patologías a Controlar (Selección Múltiple)</label>
                            <div className="grid grid-cols-2 gap-3">
                                {PATOLOGIES.map(d => (
                                    <button 
                                        key={d}
                                        onClick={() => {
                                            const current = newRecordForm.diagnosis;
                                            if (current.includes(d)) setNewRecordForm({...newRecordForm, diagnosis: current.filter(x => x !== d)});
                                            else setNewRecordForm({...newRecordForm, diagnosis: [...current, d]});
                                        }}
                                        className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${newRecordForm.diagnosis.includes(d) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Fecha Inicio</label>
                                <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newRecordForm.startDate} onChange={e => setNewRecordForm({...newRecordForm, startDate: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Peso Inicial (kg)</label>
                                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newRecordForm.initialWeight} onChange={e => setNewRecordForm({...newRecordForm, initialWeight: parseFloat(e.target.value)})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">T/A Basal</label>
                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newRecordForm.initialBp} onChange={e => setNewRecordForm({...newRecordForm, initialBp: e.target.value})} placeholder="120/80" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">HbA1c Inicial (%)</label>
                                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newRecordForm.initialA1c} onChange={e => setNewRecordForm({...newRecordForm, initialA1c: parseFloat(e.target.value)})} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button onClick={() => setShowNewRecordModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleStartControl} className="flex-[2] py-4 bg-emerald-600 rounded-2xl font-black text-xs uppercase text-white shadow-xl hover:bg-emerald-700">Iniciar Control</button>
                    </div>
                </div>
            </div>
        )}

        {/* HEADER PRINCIPAL */}
        {currentRecord && (
        <>
            <div className={`text-white p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-8 no-print sticky top-4 z-40 border-b-8 transition-colors ${isEditingActive ? 'bg-slate-900 border-slate-700' : 'bg-slate-600 border-slate-500'}`}>
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all backdrop-blur-sm">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">Control de Crónicos</h1>
                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {currentRecord.diagnosis.map(d => (
                                <span key={d} className="bg-white/20 px-3 py-1 rounded-lg text-[9px] font-bold uppercase backdrop-blur-sm flex items-center gap-2 group">
                                    {d}
                                    {isEditingActive && <button onClick={() => handleRemoveDiagnosis(d)} className="hover:text-rose-400"><X size={10}/></button>}
                                </span>
                            ))}
                            {isEditingActive && (
                                <div className="relative">
                                    <button onClick={() => setIsAddingDiagnosis(!isAddingDiagnosis)} className="bg-emerald-500 text-white p-1 rounded-full hover:bg-emerald-400 transition-all">
                                        <Plus size={12} />
                                    </button>
                                    {isAddingDiagnosis && (
                                        <div className="absolute top-full left-0 mt-2 bg-white text-slate-900 p-2 rounded-xl shadow-xl z-50 w-48 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 px-2">Agregar Diagnóstico</p>
                                            {PATOLOGIES.filter(p => !currentRecord.diagnosis.includes(p)).map(p => (
                                                <button key={p} onClick={() => handleAddDiagnosis(p)} className="block w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded text-[10px] font-bold uppercase truncate">{p}</button>
                                            ))}
                                            <button onClick={() => setIsAddingDiagnosis(false)} className="w-full text-center text-[9px] text-rose-500 mt-2 hover:underline uppercase font-bold">Cancelar</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase ml-2 shadow-sm">{isEditingActive ? 'ACTIVO' : 'ARCHIVO'}</span>
                        </div>
                        {/* Selector de Histórico */}
                        <div className="relative group mt-2 inline-block">
                             <button className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase hover:text-white transition-colors">
                                 Ver Historiales Anteriores <ChevronDown size={10}/>
                             </button>
                             <div className="absolute top-full left-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50 border border-slate-200">
                                 {patient.chronicHistory?.map(rec => (
                                     <button 
                                        key={rec.id} 
                                        onClick={() => setSelectedRecordId(rec.id)}
                                        className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 border-b border-slate-50 flex justify-between ${rec.id === currentRecord.id ? 'bg-slate-100' : ''}`}
                                     >
                                         <span>{rec.status}</span>
                                         <span className="opacity-50">{rec.startDate}</span>
                                     </button>
                                 ))}
                                 {!activeRecord && (
                                     <button onClick={() => setShowNewRecordModal(true)} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-emerald-50 text-emerald-600 border-t border-slate-50">
                                         + Nuevo Control
                                     </button>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 text-center">
                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Última HbA1c</p>
                        <p className="text-3xl font-black">{currentRecord.visits[0]?.hba1c || currentRecord.baseline.hba1c}%</p>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl border backdrop-blur-sm flex flex-col justify-center ${riskLevel === 'Bajo' ? 'bg-emerald-500/20 border-emerald-500/50' : riskLevel === 'Moderado' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-rose-500/20 border-rose-500/50'}`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/80">Riesgo CV (ASCVD)</p>
                        <p className="text-xl font-black uppercase flex items-center justify-center gap-2">
                            {riskLevel === 'Muy Alto' && <AlertTriangle size={18} className="animate-pulse"/>}
                            {riskLevel}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-xl overflow-hidden min-h-[800px] flex flex-col">
                {/* TABS */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'dashboard', label: 'Tablero de Control', icon: <Target size={18}/> },
                        { id: 'visits', label: 'Bitácora de Consultas', icon: <ClipboardList size={18}/> },
                        { id: 'meds', label: 'Tratamiento y Adherencia', icon: <Pill size={18}/> },
                        { id: 'goals', label: 'Metas Terapéuticas', icon: <TrendingUp size={18}/> },
                        { id: 'education', label: 'Educación y Prevención', icon: <Brain size={18}/> },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-10 flex-1 bg-white">
                    
                    {/* --- TAB DASHBOARD --- */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10 animate-in slide-in-from-left-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* CARD HbA1c */}
                                <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><Droplet size={14} className="text-rose-500"/> Control Glucémico</p>
                                    <div className="flex items-end justify-between">
                                        <p className="text-4xl font-black text-slate-900">{currentRecord.visits[0]?.hba1c || '--'}%</p>
                                        <div className={`h-3 w-3 rounded-full ${getTrafficLight(currentRecord.visits[0]?.hba1c || 0, currentRecord.goals.hba1cTarget)}`}></div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold mt-2">Meta: &lt; {currentRecord.goals.hba1cTarget}%</p>
                                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-50 rounded-full blur-2xl"></div>
                                </div>
                                {/* CARD BP */}
                                <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><Heart size={14} className="text-rose-600"/> Presión Arterial</p>
                                    <div className="flex items-end justify-between">
                                        <p className="text-4xl font-black text-slate-900">{currentRecord.visits[0]?.bp || '--'}</p>
                                        {/* Simple check based on Systolic */}
                                        <div className={`h-3 w-3 rounded-full ${getTrafficLight(parseInt(currentRecord.visits[0]?.bp.split('/')[0] || '0'), currentRecord.goals.bpTargetSystolic)}`}></div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold mt-2">Meta: &lt; {currentRecord.goals.bpTargetSystolic}/{currentRecord.goals.bpTargetDiastolic}</p>
                                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50 rounded-full blur-2xl"></div>
                                </div>
                                {/* CARD CINTURA */}
                                <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><Scale size={14} className="text-indigo-500"/> Cintura Abdominal</p>
                                    <div className="flex items-end justify-between">
                                        <p className="text-4xl font-black text-slate-900">{currentRecord.visits[0]?.waistCircumference || '--'} <span className="text-sm text-slate-400">cm</span></p>
                                        <div className={`h-3 w-3 rounded-full ${getTrafficLight(currentRecord.visits[0]?.waistCircumference || 0, currentRecord.goals.waistTarget)}`}></div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold mt-2">Meta: &lt; {currentRecord.goals.waistTarget} cm</p>
                                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-50 rounded-full blur-2xl"></div>
                                </div>
                                {/* CARD RISK */}
                                <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden text-white flex flex-col justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={14} className="text-emerald-400"/> Score Riesgo</p>
                                    <p className="text-2xl font-black uppercase leading-tight">{riskLevel}</p>
                                    <p className="text-[8px] opacity-70 font-bold uppercase mt-2">Basado en edad, sexo, TA, Lípidos y Tabaquismo.</p>
                                </div>
                            </div>
                            
                            {/* NEW: LIPID PROFILE SECTION */}
                            <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-8">
                                <h3 className="text-xs font-black uppercase text-amber-800 tracking-widest mb-6 flex items-center gap-2"><Droplet size={14}/> Perfil de Lípidos (Última Toma)</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-amber-600 uppercase">Colesterol Total</p>
                                        <p className="text-2xl font-black text-slate-900">{currentRecord.visits[0]?.totalCholesterol || '--'}</p>
                                        <p className="text-[8px] text-slate-400">mg/dL</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-amber-600 uppercase">LDL (Malo)</p>
                                        <p className="text-2xl font-black text-slate-900">{currentRecord.visits[0]?.ldl || '--'}</p>
                                        <p className="text-[8px] text-slate-400">Meta: &lt;{currentRecord.goals.ldlTarget}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-amber-600 uppercase">HDL (Bueno)</p>
                                        <p className="text-2xl font-black text-slate-900">{currentRecord.visits[0]?.hdl || '--'}</p>
                                        <p className="text-[8px] text-slate-400">Meta: &gt;40</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-amber-600 uppercase">Triglicéridos</p>
                                        <p className="text-2xl font-black text-slate-900">{currentRecord.visits[0]?.triglycerides || '--'}</p>
                                        <p className="text-[8px] text-slate-400">Meta: &lt;150</p>
                                    </div>
                                </div>
                            </div>

                            {/* GRÁFICAS MEJORADAS */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Glucosa vs HbA1c</h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={chartData} margin={{top:5, right:5, bottom:5, left:-20}}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                                <XAxis dataKey="date" fontSize={8} tickFormatter={(v)=>new Date(v).toLocaleDateString()}/>
                                                <YAxis yAxisId="left" fontSize={8} domain={[0, 300]}/>
                                                <YAxis yAxisId="right" orientation="right" fontSize={8} domain={[0, 14]}/>
                                                <Tooltip contentStyle={{borderRadius:'12px', border:'none', fontSize:'10px'}}/>
                                                <Line yAxisId="left" type="monotone" dataKey="glucose" stroke="#3b82f6" strokeWidth={2} dot={{r:2}} />
                                                <Line yAxisId="right" type="monotone" dataKey="hba1c" stroke="#ec4899" strokeWidth={2} dot={{r:2}} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Tensión Arterial</h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={bpChartData} margin={{top:5, right:5, bottom:5, left:-20}}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                                <XAxis dataKey="date" fontSize={8} tickFormatter={(v)=>new Date(v).toLocaleDateString()}/>
                                                <YAxis fontSize={8} domain={[40, 200]}/>
                                                <Tooltip contentStyle={{borderRadius:'12px', border:'none', fontSize:'10px'}}/>
                                                <Line type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2} dot={{r:2}} />
                                                <Line type="monotone" dataKey="dia" stroke="#f59e0b" strokeWidth={2} dot={{r:2}} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Perfil Lipídico</h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{top:5, right:5, bottom:5, left:-20}}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                                <XAxis dataKey="date" fontSize={8} tickFormatter={(v)=>new Date(v).toLocaleDateString()}/>
                                                <YAxis fontSize={8} domain={[0, 400]}/>
                                                <Tooltip contentStyle={{borderRadius:'12px', border:'none', fontSize:'10px'}}/>
                                                <Line type="monotone" dataKey="totalCholesterol" stroke="#6366f1" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="triglycerides" stroke="#10b981" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="ldl" stroke="#f43f5e" strokeWidth={2} dot={{r:2}} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB VISITS --- */}
                    {activeTab === 'visits' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-900 uppercase">Bitácora de Consultas</h3>
                                <div className="flex gap-4">
                                    {isEditingActive && (
                                        <>
                                        <button onClick={handleArchiveControl} className="px-6 py-3 bg-white border border-slate-200 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2">
                                            <Archive size={16}/> Cerrar Control
                                        </button>
                                        <button onClick={() => setShowVisitModal(true)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                                            <Plus size={16}/> Registrar Consulta
                                        </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                        <tr>
                                            <th className="p-5">Fecha</th>
                                            <th className="p-5 text-center">Peso / Cintura</th>
                                            <th className="p-5 text-center">T/A</th>
                                            <th className="p-5 text-center">Glucosa / HbA1c</th>
                                            <th className="p-5">Tratamiento Asignado</th>
                                            <th className="p-5 text-center">Adherencia</th>
                                            <th className="p-5">Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                        {currentRecord.visits.map((v, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-all">
                                                <td className="p-5 font-mono text-slate-500">{v.date}</td>
                                                <td className="p-5 text-center">
                                                    <p>{v.weight} kg</p>
                                                    <p className="text-[9px] text-slate-400 font-normal">{v.waistCircumference ? `${v.waistCircumference} cm` : ''}</p>
                                                </td>
                                                <td className="p-5 text-center font-black">{v.bp}</td>
                                                <td className="p-5 text-center">
                                                    <p>{v.glucose} mg/dL</p>
                                                    {v.hba1c && <p className="text-[9px] text-rose-600 font-bold">{v.hba1c}% A1c</p>}
                                                </td>
                                                <td className="p-5 text-[10px] uppercase text-slate-600 font-medium">
                                                    {v.treatmentSnapshot || v.medicationAdjustments}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.adherenceToMeds === 'Buena' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                        {v.adherenceToMeds}
                                                    </span>
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

                    {/* --- TAB MEDS (Treatment & Adherence) --- */}
                    {activeTab === 'meds' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase">Esquema Farmacológico Actual</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tratamiento activo y cumplimiento</p>
                                </div>
                                {isEditingActive && (
                                    <button onClick={() => setShowMedModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                                        <Plus size={16}/> Agregar Fármaco
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Lista de Medicamentos Activos */}
                                <div className="space-y-4">
                                    {currentRecord.currentMedications.map((med, i) => (
                                        <div key={i} className={`p-5 rounded-3xl border-2 transition-all ${med.active ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase">{med.drug}</h4>
                                                    <p className="text-xs font-bold text-slate-500 mt-1">{med.dose} • {med.frequency}</p>
                                                </div>
                                                {isEditingActive && (
                                                    <button onClick={() => toggleMedStatus(med.id)} className={`p-2 rounded-xl transition-all ${med.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                        {med.active ? <Check size={16}/> : <Trash2 size={16}/>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {currentRecord.currentMedications.length === 0 && (
                                        <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                            <Pill className="mx-auto text-slate-300 mb-2" size={32}/>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Sin medicamentos activos</p>
                                        </div>
                                    )}
                                </div>

                                {/* Plan Nutricional */}
                                <div className="bg-emerald-50 border border-emerald-100 rounded-[3rem] p-8 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                                        <Utensils size={16}/> Plan Nutricional
                                    </h3>
                                    <textarea 
                                        className="w-full h-48 bg-white/50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-900 outline-none resize-none font-medium leading-relaxed"
                                        value={currentRecord.nutritionPlan}
                                        onChange={e => updateNutrition(e.target.value)}
                                        disabled={!isEditingActive}
                                    />
                                    <div className="flex gap-2">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase bg-white px-3 py-1 rounded-full border border-emerald-200">Hiposódica</span>
                                        <span className="text-[9px] font-black text-emerald-600 uppercase bg-white px-3 py-1 rounded-full border border-emerald-200">Baja en Carbos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB GOALS --- */}
                    {activeTab === 'goals' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4">
                            <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                    <Target size={16} className="text-blue-600"/> Metas Terapéuticas Individualizadas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta HbA1c (%)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-center text-lg" 
                                            value={currentRecord.goals.hba1cTarget} 
                                            onChange={(e) => updateGoal('hba1cTarget', parseFloat(e.target.value))}
                                            disabled={!isEditingActive}
                                        />
                                        <p className="text-[9px] text-slate-400 text-center">Norma: &lt; 7.0% (Adultos sanos)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta T.A. Sistólica</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-center text-lg" 
                                            value={currentRecord.goals.bpTargetSystolic} 
                                            onChange={(e) => updateGoal('bpTargetSystolic', parseFloat(e.target.value))}
                                            disabled={!isEditingActive}
                                        />
                                        <p className="text-[9px] text-slate-400 text-center">Norma: &lt; 130 mmHg</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta LDL (mg/dL)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-center text-lg" 
                                            value={currentRecord.goals.ldlTarget} 
                                            onChange={(e) => updateGoal('ldlTarget', parseFloat(e.target.value))}
                                            disabled={!isEditingActive}
                                        />
                                        <p className="text-[9px] text-slate-400 text-center">Riesgo Alto: &lt; 70 mg/dL</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Cintura (cm)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-center text-lg" 
                                            value={currentRecord.goals.waistTarget} 
                                            onChange={(e) => updateGoal('waistTarget', parseFloat(e.target.value))}
                                            disabled={!isEditingActive}
                                        />
                                        <p className="text-[9px] text-slate-400 text-center">H: &lt;90, M: &lt;80</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB EDUCATION / CHECKLIST --- */}
                    {activeTab === 'education' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-6">
                                        <CheckCircle2 size={16} className="text-emerald-600"/> Revisiones Anuales Obligatorias
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { k: 'ophthalmology', l: 'Valoración Oftalmológica (Fondo de Ojo)' },
                                            { k: 'dental', l: 'Valoración Dental / Periodontal' },
                                            { k: 'footExam', l: 'Revisión de Pies (Sensibilidad/Pulsos)' },
                                            { k: 'cardiology', l: 'Valoración Cardiológica (EKG)' },
                                            { k: 'nephrology', l: 'Valoración Renal (TFG/Microalbuminuria)' },
                                            { k: 'nutrition', l: 'Consulta de Nutrición' }
                                        ].map(item => {
                                            const dateDone = currentRecord.annualCheckups[item.k as keyof typeof currentRecord.annualCheckups];
                                            return (
                                                <button 
                                                    key={item.k}
                                                    onClick={() => toggleCheckup(item.k as any)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${dateDone ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                                    disabled={!isEditingActive}
                                                >
                                                    <span className="text-[10px] font-black uppercase text-left">{item.l}</span>
                                                    {dateDone ? (
                                                        <span className="text-[9px] font-bold">{dateDone}</span>
                                                    ) : (
                                                        <span className="text-[9px] italic">Pendiente</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100">
                                        <h4 className="text-[10px] font-black uppercase text-amber-700 tracking-widest flex items-center gap-2 mb-2">
                                            <AlertTriangle size={14}/> Datos de Alarma
                                        </h4>
                                        <p className="text-xs text-amber-900 font-medium leading-relaxed">
                                            Instruir al paciente acudir a Urgencias si presenta:
                                            <ul className="list-disc ml-4 mt-2 space-y-1">
                                                <li>Glucosa {'>'} 250 mg/dL con cetonas o {'>'} 600 mg/dL (Estado Hiperosmolar)</li>
                                                <li>Hipoglucemia {'<'} 70 mg/dL que no responde a ingesta</li>
                                                <li>Dolor torácico, disnea o déficit neurológico (ACV)</li>
                                                <li>Lesiones en pies con cambio de coloración o infección</li>
                                                <li>Presión Arterial {'>'} 180/110 mmHg con síntomas</li>
                                            </ul>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
        )}

        {/* MODAL NUEVA CONSULTA */}
        {showVisitModal && (
            <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Registrar Seguimiento</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Peso (kg)</label>
                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" value={visitForm.weight || ''} onChange={e => setVisitForm({...visitForm, weight: parseFloat(e.target.value)})} autoFocus/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tensión Arterial</label>
                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="120/80" value={visitForm.bp} onChange={e => setVisitForm({...visitForm, bp: e.target.value})}/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Glucosa (mg/dL)</label>
                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" value={visitForm.glucose || ''} onChange={e => setVisitForm({...visitForm, glucose: parseFloat(e.target.value)})}/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Cintura (cm)</label>
                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" value={visitForm.waistCircumference || ''} onChange={e => setVisitForm({...visitForm, waistCircumference: parseFloat(e.target.value)})} placeholder="Opcional"/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">HbA1c (%)</label>
                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center text-rose-500" value={visitForm.hba1c || ''} onChange={e => setVisitForm({...visitForm, hba1c: parseFloat(e.target.value)})} placeholder="Opcional"/>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-6 space-y-4">
                        <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Perfil de Lípidos (Si Aplica)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Colesterol Total</label>
                                <input type="number" className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-center" value={visitForm.totalCholesterol || ''} onChange={e => setVisitForm({...visitForm, totalCholesterol: parseFloat(e.target.value)})} placeholder="mg/dL" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">LDL (Malo)</label>
                                <input type="number" className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-center" value={visitForm.ldl || ''} onChange={e => setVisitForm({...visitForm, ldl: parseFloat(e.target.value)})} placeholder="mg/dL" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">HDL (Bueno)</label>
                                <input type="number" className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-center" value={visitForm.hdl || ''} onChange={e => setVisitForm({...visitForm, hdl: parseFloat(e.target.value)})} placeholder="mg/dL" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Triglicéridos</label>
                                <input type="number" className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-center" value={visitForm.triglycerides || ''} onChange={e => setVisitForm({...visitForm, triglycerides: parseFloat(e.target.value)})} placeholder="mg/dL" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 mb-6">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Adherencia al Tratamiento</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">Medicamentos</span>
                            <div className="flex gap-2">
                                {['Buena', 'Regular', 'Mala'].map(opt => (
                                    <button 
                                        key={opt} 
                                        onClick={() => setVisitForm({...visitForm, adherenceToMeds: opt as any})}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${visitForm.adherenceToMeds === opt ? (opt === 'Buena' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white') : 'bg-white border text-slate-400'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">Dieta/Ejercicio</span>
                            <div className="flex gap-2">
                                {['Buena', 'Regular', 'Mala'].map(opt => (
                                    <button 
                                        key={opt} 
                                        onClick={() => setVisitForm({...visitForm, adherenceToDiet: opt as any})}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${visitForm.adherenceToDiet === opt ? (opt === 'Buena' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white') : 'bg-white border text-slate-400'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* NEW SECTION: Annual Checkups during this visit */}
                    <div className="space-y-2 mb-6">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Revisiones Anuales Realizadas Hoy</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { k: 'ophthalmology', l: 'Oftalmología' },
                                { k: 'dental', l: 'Dental' },
                                { k: 'footExam', l: 'Revisión Pies' },
                                { k: 'cardiology', l: 'Cardiología/EKG' },
                                { k: 'nephrology', l: 'Renal' },
                                { k: 'nutrition', l: 'Nutrición' }
                            ].map(item => {
                                const isSelected = visitForm.checkupsPerformed?.includes(item.k);
                                return (
                                    <button 
                                        key={item.k}
                                        onClick={() => {
                                            const current = visitForm.checkupsPerformed || [];
                                            const updated = isSelected 
                                                ? current.filter(c => c !== item.k) 
                                                : [...current, item.k];
                                            setVisitForm({...visitForm, checkupsPerformed: updated});
                                        }}
                                        className={`p-2 rounded-lg text-[9px] font-bold uppercase border transition-all text-left ${isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'}`}
                                    >
                                        {isSelected ? '✓ ' : ''}{item.l}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Ajustes al Tratamiento</label>
                            <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-sm font-medium resize-none outline-none" placeholder="Cambios en dosis, nuevos fármacos..." value={visitForm.medicationAdjustments} onChange={e => setVisitForm({...visitForm, medicationAdjustments: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Notas de Evolución</label>
                            <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium resize-none outline-none" placeholder="Síntomas, adherencia a dieta..." value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Próxima Cita</label>
                            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={visitForm.nextAppointment} onChange={e => setVisitForm({...visitForm, nextAppointment: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setShowVisitModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleAddVisit} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-600">Guardar Registro</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL AGREGAR MEDICAMENTO */}
        {showMedModal && (
            <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Nuevo Medicamento</h3>
                    <div className="space-y-4 mb-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Fármaco</label>
                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" value={medForm.drug} onChange={e => setMedForm({...medForm, drug: e.target.value})} placeholder="Nombre genérico/comercial" autoFocus/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Dosis</label>
                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={medForm.dose} onChange={e => setMedForm({...medForm, dose: e.target.value})} placeholder="Ej: 500 mg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Frecuencia</label>
                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={medForm.frequency} onChange={e => setMedForm({...medForm, frequency: e.target.value})} placeholder="Ej: Cada 8 horas" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowMedModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-xs uppercase text-slate-500">Cancelar</button>
                        <button onClick={handleAddMed} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-700">Agregar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ChronicDiseaseControl;
