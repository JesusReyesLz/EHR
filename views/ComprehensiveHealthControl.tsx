
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Activity, Baby, Heart, ShieldCheck, Ruler, Scale, 
  Syringe, FlaskConical, Calendar, User, Eye, Ear, Smile, Brain,
  Save, CheckCircle2, Clock, Info, Check, Plus, Lock, AlertTriangle,
  ClipboardList, BookOpen, MessageSquare, HeartHandshake, Leaf, Apple,
  Thermometer, FileText
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Patient, ClinicalNote, HealthControlRecord, PreventiveVisit, VaccineRecord, ScreeningRecord, PromotionTopic } from '../types';

// CONFIGURACIÓN MAESTRA DE ETAPAS DE VIDA Y ACCIONES (INCLUYE PROMOCIÓN)
const LIFE_STAGES_CONFIG: Record<string, {
    color: string;
    icon: any;
    vaccines: { name: string, age: string, doses: string[] }[];
    screenings: { name: string, cat: string, freq: string, gender?: 'M'|'F' }[];
    promotion: string[]; // Temas educativos obligatorios
}> = {
    'Recién Nacido': { // 0-28 días
        color: 'bg-pink-100 text-pink-700 border-pink-200',
        icon: <Baby size={24}/>,
        vaccines: [
            { name: 'BCG', age: 'Al Nacer', doses: ['Única'] },
            { name: 'Hepatitis B', age: 'Al Nacer', doses: ['1a'] }
        ],
        screenings: [
            { name: 'Tamiz Metabólico Neonatal', cat: 'Metabólico', freq: '3-5 días' },
            { name: 'Tamiz Auditivo', cat: 'Auditivo', freq: 'Antes de 1 mes' },
            { name: 'Tamiz Cardiaco', cat: 'Cardiológico', freq: 'Antes del alta' }
        ],
        promotion: [
            'Lactancia Materna Exclusiva',
            'Cuidados del Cordón Umbilical',
            'Prevención de Muerte Súbita (Sueño Seguro)',
            'Baño y Cuidado de la Piel',
            'Signos de Alarma Neonatal'
        ]
    },
    'Lactante': { // 1 mes - 2 años
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Baby size={24}/>,
        vaccines: [
            { name: 'Hexavalente', age: '2, 4, 6, 18m', doses: ['1a', '2a', '3a', 'Ref'] },
            { name: 'Rotavirus', age: '2, 4m', doses: ['1a', '2a'] },
            { name: 'Neumococo Conjugada', age: '2, 4, 12m', doses: ['1a', '2a', 'Ref'] },
            { name: 'Influenza', age: '6, 7m, Anual', doses: ['1a', '2a', 'Anual'] },
            { name: 'SRP (Triple Viral)', age: '12m, 18m', doses: ['1a', '2a'] }
        ],
        screenings: [
            { name: 'Evaluación Desarrollo Psicomotor', cat: 'Desarrollo', freq: 'Mensual' },
            { name: 'Suplementación Vitamina A', cat: 'Nutrición', freq: 'Semestral (6m-5a)' },
            { name: 'Tamiz Visual (Reflejo Rojo)', cat: 'Visual', freq: '6 meses' }
        ],
        promotion: [
            'Ablactación y Alimentación Complementaria',
            'Estimulación Temprana',
            'Prevención de Accidentes en el Hogar',
            'Higiene Bucal (Primeros Dientes)',
            'Esquema de Vacunación Completo'
        ]
    },
    'Preescolar': { // 2-5 años
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <Smile size={24}/>,
        vaccines: [
             { name: 'DPT', age: '4 años', doses: ['Refuerzo'] },
             { name: 'Influenza', age: 'Anual', doses: ['Anual'] }
        ],
        screenings: [
            { name: 'Agudeza Visual', cat: 'Visual', freq: 'Anual' },
            { name: 'Salud Bucal', cat: 'Dental', freq: 'Semestral' },
            { name: 'Desparasitación Intestinal', cat: 'Preventivo', freq: 'Semestral' }
        ],
        promotion: [
            'Plato del Bien Comer',
            'Higiene Personal y Lavado de Manos',
            'Prevención de Violencia Infantil',
            'Actividad Física y Juego',
            'Control de Esfínteres'
        ]
    },
    'Escolar': { // 6-9 años
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <User size={24}/>,
        vaccines: [
             { name: 'Influenza', age: 'Anual', doses: ['Anual'] },
             { name: 'VPH', age: '9-11 años', doses: ['1a', '2a'] } 
        ],
        screenings: [
            { name: 'Agudeza Visual', cat: 'Visual', freq: 'Anual' },
            { name: 'Estado Nutricional (IMC)', cat: 'Nutrición', freq: 'Semestral' },
            { name: 'Higiene Postural', cat: 'Ortopedia', freq: 'Anual' }
        ],
        promotion: [
            'Prevención de Obesidad Infantil',
            'Salud Mental y Autoestima',
            'Prevención de Bullying',
            'Seguridad Vial y Peatonal',
            'Higiene Dental (Técnica de Cepillado)'
        ]
    },
    'Adolescente': { // 10-19 años
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: <User size={24}/>,
        vaccines: [
             { name: 'VPH', age: '10-14 años (si falta)', doses: ['1a', '2a'] },
             { name: 'Td (Tétanos/Difteria)', age: '15 años', doses: ['Refuerzo'] },
             { name: 'Influenza', age: 'Anual', doses: ['Anual'] }
        ],
        screenings: [
            { name: 'Salud Sexual y Reproductiva', cat: 'Consejería', freq: 'Anual' },
            { name: 'Detección Adicciones/Violencia', cat: 'Mental', freq: 'Anual' },
            { name: 'Salud Bucal', cat: 'Dental', freq: 'Anual' }
        ],
        promotion: [
            'Salud Sexual y Anticoncepción',
            'Prevención de Adicciones (Alcohol, Tabaco, Drogas)',
            'Nutrición y Trastornos Alimenticios',
            'Salud Mental y Prevención del Suicidio',
            'Violencia en el Noviazgo'
        ]
    },
    'Adulto Joven': { // 20-39 años
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <User size={24}/>,
        vaccines: [
             { name: 'SR (Sarampión/Rubéola)', age: 'Si no tiene esquema', doses: ['Dosis Única'] },
             { name: 'Td', age: 'Cada 10 años', doses: ['Refuerzo'] },
             { name: 'Influenza', age: 'Anual (Riesgo)', doses: ['Anual'] }
        ],
        screenings: [
             { name: 'Papanicolau / VPH', cat: 'Cáncer', freq: 'Anual/Trienal', gender: 'F' },
             { name: 'Exploración Mamaria', cat: 'Cáncer', freq: 'Anual', gender: 'F' },
             { name: 'Perfil de Lípidos / Glucosa', cat: 'Metabólico', freq: 'Trienal (si sano)' }
        ],
        promotion: [
            'Planificación Familiar',
            'Estilos de Vida Saludables',
            'Prevención de Enfermedades Crónicas',
            'Salud Laboral y Ergonomía',
            'Salud Mental y Manejo del Estrés'
        ]
    },
    'Adulto': { // 40-59 años
        color: 'bg-slate-200 text-slate-800 border-slate-300',
        icon: <User size={24}/>,
        vaccines: [
            { name: 'Td', age: 'Cada 10 años', doses: ['Refuerzo'] },
            { name: 'Influenza', age: 'Anual', doses: ['Anual'] }
        ],
        screenings: [
             { name: 'Mastografía', cat: 'Cáncer', freq: 'Bi-Anual (40-49), Anual (50+)', gender: 'F' },
             { name: 'Antígeno Prostático (APE)', cat: 'Cáncer', freq: 'Anual', gender: 'M' },
             { name: 'Detección Diabetes/Hipertensión', cat: 'Metabólico', freq: 'Anual' },
             { name: 'Electrocardiograma', cat: 'Cardiológico', freq: 'Anual (Riesgo)' }
        ],
        promotion: [
            'Climaterio y Menopausia / Andropausia',
            'Prevención de Cáncer (Mama, Cervicouterino, Próstata)',
            'Actividad Física en el Adulto',
            'Alimentación Cardiosaludable',
            'Higiene del Sueño'
        ]
    },
    'Adulto Mayor': { // 60+ años
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <User size={24}/>,
        vaccines: [
            { name: 'Neumococo Polivalente', age: '60/65 años', doses: ['Única'] },
            { name: 'Influenza', age: 'Anual', doses: ['Anual'] },
            { name: 'Herpes Zóster', age: '60 años', doses: ['Única/Doble'] },
            { name: 'Td', age: 'Cada 10 años', doses: ['Refuerzo'] }
        ],
        screenings: [
             { name: 'Evaluación Cognitiva (Mini-Mental)', cat: 'Neurológico', freq: 'Anual' },
             { name: 'Densitometría Ósea', cat: 'Osteoporosis', freq: 'Anual/Bi-Anual', gender: 'F' },
             { name: 'Agudeza Visual/Auditiva', cat: 'Sensorial', freq: 'Anual' },
             { name: 'Prevención de Caídas', cat: 'Funcional', freq: 'En cada visita' }
        ],
        promotion: [
            'Envejecimiento Saludable y Activo',
            'Prevención de Caídas y Accidentes',
            'Uso Correcto de Medicamentos (Polifarmacia)',
            'Salud Mental y Depresión en el Adulto Mayor',
            'Nutrición Geriátrica e Hidratación'
        ]
    }
};

const ComprehensiveHealthControl: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'vaccines' | 'screenings' | 'growth' | 'promotion'>('dashboard');
  const [showVisitModal, setShowVisitModal] = useState(false);
  
  // Determinación de Etapa de Vida
  const currentStage = useMemo(() => {
      if (!patient) return 'Adulto';
      const age = patient.age;
      if (age < 1) return 'Lactante'; // Simplificado
      if (age >= 1 && age <= 2) return 'Lactante';
      if (age >= 3 && age <= 5) return 'Preescolar';
      if (age >= 6 && age <= 9) return 'Escolar';
      if (age >= 10 && age <= 19) return 'Adolescente';
      if (age >= 20 && age <= 39) return 'Adulto Joven';
      if (age >= 40 && age <= 59) return 'Adulto';
      if (age >= 60) return 'Adulto Mayor';
      return 'Adulto';
  }, [patient]);

  const stageConfig = LIFE_STAGES_CONFIG[currentStage];

  // Inicializar registro de salud si no existe
  useEffect(() => {
      if (patient && !patient.healthControl) {
          const newRecord: HealthControlRecord = {
              id: `HC-${Date.now()}`,
              patientId: patient.id,
              lifeStage: currentStage as any,
              vaccines: [],
              screenings: [],
              visits: [],
              healthPromotion: [] // Initialize empty
          };
          onUpdatePatient({ ...patient, healthControl: newRecord });
      }
  }, [patient, currentStage]);

  // --- FORMULARIO INTEGRAL DE VISITA ---
  // Este estado maneja todos los datos temporales del modal antes de guardar
  const [visitForm, setVisitForm] = useState({
      // Somatometría
      weight: 0, height: 0, headCircumference: 0, bmi: 0,
      bp: '', temp: 36.5,
      // Desarrollo
      developmentMilestones: '', nutritionAssessment: '', physicalActivity: '', notes: '',
      // Acciones Realizadas HOY (Checklists)
      appliedVaccines: [] as { name: string, dose: string }[],
      performedScreenings: [] as { name: string, category: string, status: 'Normal' | 'Anormal' }[],
      topicsDiscussed: [] as string[],
      // Cita
      nextAppointment: ''
  });
  
  // Tab interno del modal
  const [modalTab, setModalTab] = useState<'somatometry' | 'vaccines' | 'screenings' | 'promotion' | 'notes'>('somatometry');

  if (!patient || !patient.healthControl) return null;

  const healthRecord = patient.healthControl;

  // --- ACTIONS ---
  
  const handleAddVisit = () => {
      if (!visitForm.weight || !visitForm.height) {
          alert("Peso y Talla son obligatorios para el registro de crecimiento.");
          return;
      }
      
      const heightM = (visitForm.height || 100) / 100;
      const bmi = parseFloat(( (visitForm.weight || 1) / (heightM * heightM) ).toFixed(1));

      // 1. Crear registro de Visita
      const newVisit: PreventiveVisit = {
          id: `VIS-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          ageGroup: currentStage,
          weight: Number(visitForm.weight),
          height: Number(visitForm.height),
          bmi: bmi,
          headCircumference: Number(visitForm.headCircumference),
          developmentMilestones: visitForm.developmentMilestones,
          nutritionAssessment: visitForm.nutritionAssessment,
          notes: visitForm.notes || ''
      };

      // 2. Actualizar Vacunas (Agregar las nuevas)
      const newVaccineRecords: VaccineRecord[] = visitForm.appliedVaccines.map(v => ({
          id: `VAC-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
          name: v.name,
          doseNumber: v.dose,
          targetAge: currentStage,
          applicationDate: new Date().toISOString().split('T')[0],
          notes: 'Aplicada en consulta de control'
      }));

      // 3. Actualizar Tamizajes (Upsert: Actualizar si existe, agregar si no)
      let updatedScreenings = [...healthRecord.screenings];
      visitForm.performedScreenings.forEach(scr => {
          const index = updatedScreenings.findIndex(s => s.name === scr.name);
          const newRecord: ScreeningRecord = {
              id: index >= 0 ? updatedScreenings[index].id : `SCR-${Date.now()}-${Math.random()}`,
              name: scr.name,
              category: scr.category as any,
              targetPopulation: currentStage,
              status: scr.status,
              lastDate: new Date().toISOString().split('T')[0],
              nextDueDate: '', // Podría calcularse
              resultSummary: `Evaluado en consulta: ${scr.status}`
          };
          if (index >= 0) updatedScreenings[index] = newRecord;
          else updatedScreenings.push(newRecord);
      });

      // 4. Actualizar Promoción (Agregar temas)
      let updatedPromotion = [...(healthRecord.healthPromotion || [])];
      visitForm.topicsDiscussed.forEach(topic => {
          // Si ya existe el tema, actualizamos la fecha (reforzamiento), si no, agregamos
          const index = updatedPromotion.findIndex(t => t.topic === topic);
          if (index >= 0) {
              updatedPromotion[index] = { ...updatedPromotion[index], date: new Date().toISOString().split('T')[0] };
          } else {
              updatedPromotion.push({ topic, date: new Date().toISOString().split('T')[0] });
          }
      });

      // CONSOLIDAR TODO
      const updatedRecord = { 
          ...healthRecord, 
          visits: [...healthRecord.visits, newVisit],
          vaccines: [...healthRecord.vaccines, ...newVaccineRecords],
          screenings: updatedScreenings,
          healthPromotion: updatedPromotion
      };

      onUpdatePatient({ ...patient, healthControl: updatedRecord });
      setShowVisitModal(false);
      
      // Reset Form
      setVisitForm({
        weight: 0, height: 0, headCircumference: 0, bmi: 0, bp: '', temp: 36.5,
        developmentMilestones: '', nutritionAssessment: '', physicalActivity: '', notes: '',
        appliedVaccines: [], performedScreenings: [], topicsDiscussed: [], nextAppointment: ''
      });
      setModalTab('somatometry'); // Reset tab
      
      // Nota automática
      const noteSummary = `
          Se realiza Control Integral de Salud (${currentStage}).
          Somatometría: Peso ${newVisit.weight}kg, Talla ${newVisit.height}cm, IMC ${bmi}.
          Vacunas aplicadas: ${visitForm.appliedVaccines.map(v => `${v.name} (${v.dose})`).join(', ') || 'Ninguna'}.
          Tamizajes: ${visitForm.performedScreenings.map(s => `${s.name}: ${s.status}`).join(', ') || 'Ninguno'}.
          Educación: ${visitForm.topicsDiscussed.length} temas abordados.
      `;

      const note: ClinicalNote = {
          id: `NOTE-PREV-${Date.now()}`,
          patientId: patient.id,
          type: `Control de Salud Integral (${currentStage})`,
          date: new Date().toLocaleString('es-MX'),
          author: 'Medicina Preventiva',
          content: {
              ...newVisit,
              analysis: `Paciente en etapa ${currentStage} acude a control de salud.`,
              plan: `Continuar esquema de prevención. Próxima cita: ${visitForm.nextAppointment}.`,
              summary: noteSummary
          },
          isSigned: true
      };
      onSaveNote(note);
  };

  // Toggle Helpers for Modal
  const toggleModalVaccine = (name: string, dose: string) => {
      const exists = visitForm.appliedVaccines.find(v => v.name === name && v.dose === dose);
      if (exists) {
          setVisitForm(prev => ({...prev, appliedVaccines: prev.appliedVaccines.filter(v => v !== exists)}));
      } else {
          setVisitForm(prev => ({...prev, appliedVaccines: [...prev.appliedVaccines, {name, dose}]}));
      }
  };

  const setModalScreening = (name: string, category: string, status: 'Normal' | 'Anormal' | null) => {
      // Remove existing entry for this screening first
      const cleanList = visitForm.performedScreenings.filter(s => s.name !== name);
      if (status) {
          setVisitForm(prev => ({...prev, performedScreenings: [...cleanList, {name, category, status}]}));
      } else {
          setVisitForm(prev => ({...prev, performedScreenings: cleanList}));
      }
  };

  const toggleModalTopic = (topic: string) => {
      const exists = visitForm.topicsDiscussed.includes(topic);
      if (exists) {
          setVisitForm(prev => ({...prev, topicsDiscussed: prev.topicsDiscussed.filter(t => t !== topic)}));
      } else {
          setVisitForm(prev => ({...prev, topicsDiscussed: [...prev.topicsDiscussed, topic]}));
      }
  };

  // Actions for Dashboard Toggles (Direct Updates)
  const toggleVaccineDirect = (vaccineName: string, dose: string) => {
      const existingIndex = healthRecord.vaccines.findIndex(v => v.name === vaccineName && v.doseNumber === dose);
      let newVaccines = [...healthRecord.vaccines];
      if (existingIndex >= 0) {
          newVaccines.splice(existingIndex, 1);
      } else {
          newVaccines.push({
              id: `VAC-${Date.now()}`, name: vaccineName, doseNumber: dose, targetAge: currentStage, applicationDate: new Date().toISOString().split('T')[0]
          });
      }
      onUpdatePatient({ ...patient, healthControl: { ...healthRecord, vaccines: newVaccines } });
  };

  const updateScreeningDirect = (name: string, cat: string, status: ScreeningRecord['status']) => {
      const existingIndex = healthRecord.screenings.findIndex(s => s.name === name);
      let newScreenings = [...healthRecord.screenings];
      const record: ScreeningRecord = {
          id: existingIndex >= 0 ? newScreenings[existingIndex].id : `SCR-${Date.now()}`,
          name, category: cat as any, targetPopulation: currentStage, status, lastDate: new Date().toISOString().split('T')[0], nextDueDate: ''
      };
      if (existingIndex >= 0) newScreenings[existingIndex] = record;
      else newScreenings.push(record);
      onUpdatePatient({ ...patient, healthControl: { ...healthRecord, screenings: newScreenings } });
  };

  const togglePromotionTopicDirect = (topic: string) => {
      const existingIndex = healthRecord.healthPromotion?.findIndex(t => t.topic === topic);
      let newTopics = [...(healthRecord.healthPromotion || [])];
      if (existingIndex !== undefined && existingIndex >= 0) {
           newTopics.splice(existingIndex, 1);
      } else {
          newTopics.push({ topic, date: new Date().toISOString().split('T')[0] });
      }
       onUpdatePatient({ ...patient, healthControl: { ...healthRecord, healthPromotion: newTopics } });
  };

  // --- CHARTS DATA ---
  const growthData = healthRecord.visits.map(v => ({
      date: v.date,
      weight: v.weight,
      height: v.height,
      bmi: v.bmi
  }));

  // Calculate Progress
  const vaccineProgress = Math.round((healthRecord.vaccines.length / stageConfig.vaccines.reduce((acc, v) => acc + v.doses.length, 0)) * 100) || 0;
  const promotionProgress = Math.round(((healthRecord.healthPromotion?.length || 0) / stageConfig.promotion.length) * 100) || 0;

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
        
        {/* HEADER */}
        <div className={`p-8 rounded-t-[3.5rem] shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-8 border-b-8 transition-colors ${stageConfig.color.replace('bg-', 'bg-slate-900 border-')}`}>
            <div className="flex items-center gap-6 text-white">
                <button onClick={() => navigate(-1)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all backdrop-blur-sm">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Carnet de Salud Integral</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-white/20 text-white border border-white/30`}>
                            {currentStage}
                        </span>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Prevención y Promoción</p>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-4">
                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 text-white text-center backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Vacunación</p>
                    <p className="text-2xl font-black">{vaccineProgress}%</p>
                </div>
                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 text-white text-center backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Educación</p>
                    <p className="text-2xl font-black">{promotionProgress}%</p>
                </div>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-xl overflow-hidden min-h-[800px] flex flex-col">
            {/* TABS */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'dashboard', label: 'Resumen', icon: <Activity size={18}/> },
                    { id: 'vaccines', label: 'Esquema de Vacunación', icon: <Syringe size={18}/> },
                    { id: 'screenings', label: 'Tamizajes y Chequeos', icon: <FlaskConical size={18}/> },
                    { id: 'promotion', label: 'Promoción de la Salud', icon: <BookOpen size={18}/> },
                    { id: 'growth', label: 'Crecimiento y Desarrollo', icon: <Ruler size={18}/> },
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
                
                {/* --- TAB: DASHBOARD --- */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in slide-in-from-left-4">
                        <div className={`p-8 rounded-[2.5rem] border-2 flex items-center gap-6 ${stageConfig.color.replace('text-', 'text-slate-900 bg-opacity-20 ')}`}>
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-current">
                                {stageConfig.icon}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black uppercase">Etapa: {currentStage}</h3>
                                <p className="text-xs font-medium opacity-80 max-w-2xl">
                                    Enfoque preventivo: Detección oportuna de enfermedades, completitud de esquema de vacunación y educación para la salud específica para la edad y género.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                 <h3 className="text-xs font-black uppercase text-slate-500 mb-6 flex items-center gap-2"><Clock size={16}/> Acciones Pendientes</h3>
                                 <div className="space-y-3">
                                     {stageConfig.vaccines.slice(0, 2).map((vac, i) => (
                                         <div key={`vac-${i}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                             <div className="flex items-center gap-3">
                                                 <Syringe size={14} className="text-blue-500"/>
                                                 <span className="text-[10px] font-black uppercase text-slate-700">{vac.name}</span>
                                             </div>
                                             <span className="text-[9px] font-bold text-slate-400">{vac.age}</span>
                                         </div>
                                     ))}
                                     {stageConfig.promotion.slice(0, 3).map((topic, i) => {
                                         const done = healthRecord.healthPromotion?.some(t => t.topic === topic);
                                         if (done) return null;
                                         return (
                                            <div key={`promo-${i}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <BookOpen size={14} className="text-emerald-500"/>
                                                    <span className="text-[10px] font-black uppercase text-slate-700 truncate">{topic}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400">Plática</span>
                                            </div>
                                         );
                                     })}
                                 </div>
                             </div>

                             <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between">
                                 <div>
                                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Última Visita</h3>
                                     <p className="text-3xl font-black">{healthRecord.visits.length > 0 ? healthRecord.visits[healthRecord.visits.length-1].date : 'Sin Registro'}</p>
                                 </div>
                                 <button onClick={() => setShowVisitModal(true)} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg">
                                     <Plus size={16}/> Registrar Control
                                 </button>
                             </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: VACCINES --- */}
                {activeTab === 'vaccines' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black uppercase text-slate-900 flex items-center gap-2"><Syringe size={20} className="text-blue-600"/> Cartilla de Vacunación</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {stageConfig.vaccines.map((vac, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-black uppercase text-slate-800">{vac.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Edad: {vac.age}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {vac.doses.map((dose) => {
                                            const applied = healthRecord.vaccines.find(v => v.name === vac.name && v.doseNumber === dose);
                                            return (
                                                <button 
                                                    key={dose}
                                                    onClick={() => toggleVaccineDirect(vac.name, dose)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all flex items-center gap-2 ${applied ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                                >
                                                    {dose} {applied && <CheckCircle2 size={12}/>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TAB: PROMOTION (NEW) --- */}
                {activeTab === 'promotion' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-8">
                            <h3 className="text-lg font-black uppercase text-emerald-800 flex items-center gap-3">
                                <HeartHandshake size={24} /> Promoción de la Salud y Educación
                            </h3>
                            <p className="text-xs text-emerald-700 mt-2 font-medium">Temas obligatorios a cubrir durante la consulta para la etapa: {currentStage}.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stageConfig.promotion.map((topic, idx) => {
                                const record = healthRecord.healthPromotion?.find(t => t.topic === topic);
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => togglePromotionTopicDirect(topic)}
                                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${record ? 'bg-white border-emerald-400 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-300'}`}>
                                                {record ? <CheckCircle2 size={20}/> : <BookOpen size={20}/>}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase ${record ? 'text-slate-900' : 'text-slate-500'}`}>{topic}</p>
                                                {record && <p className="text-[9px] font-bold text-emerald-600">Impartida: {record.date}</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="flex gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl items-start">
                            <Info className="text-blue-500 flex-shrink-0" size={20}/>
                            <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                                <strong>Nota:</strong> Las pláticas preventivas deben registrarse cada vez que se imparten. El objetivo es empoderar al paciente sobre el autocuidado de su salud de acuerdo a su edad y sexo.
                            </p>
                        </div>
                    </div>
                )}

                {/* --- TAB: SCREENINGS --- */}
                {activeTab === 'screenings' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <h3 className="text-lg font-black uppercase text-slate-900 flex items-center gap-2"><FlaskConical size={20} className="text-purple-600"/> Tamizajes y Detecciones</h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {stageConfig.screenings.map((scr, idx) => {
                                if (scr.gender && scr.gender !== patient.sex) return null;
                                const record = healthRecord.screenings.find(s => s.name === scr.name);
                                
                                return (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase">{scr.cat}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{scr.freq}</span>
                                            </div>
                                            <h4 className="text-sm font-black uppercase text-slate-800">{scr.name}</h4>
                                            {record && <p className="text-[10px] text-slate-500 mt-1 italic">Último: {record.lastDate} • Res: {record.resultSummary || 'S/D'}</p>}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {['Normal', 'Anormal', 'Pendiente'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => updateScreeningDirect(scr.name, scr.cat, status as any)}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${
                                                        record?.status === status 
                                                            ? (status === 'Normal' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : status === 'Anormal' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-200 text-slate-600 border-slate-300')
                                                            : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- TAB: GROWTH --- */}
                {activeTab === 'growth' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-80">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Peso (kg)</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <LineChart data={growthData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                        <XAxis dataKey="date" fontSize={10} tickFormatter={v => new Date(v).toLocaleDateString()}/>
                                        <YAxis fontSize={10} domain={['auto', 'auto']}/>
                                        <Tooltip contentStyle={{borderRadius:'12px', border:'none', fontSize:'12px'}}/>
                                        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r:4}}/>
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-80">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Talla (cm)</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <LineChart data={growthData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                        <XAxis dataKey="date" fontSize={10} tickFormatter={v => new Date(v).toLocaleDateString()}/>
                                        <YAxis fontSize={10} domain={['auto', 'auto']}/>
                                        <Tooltip contentStyle={{borderRadius:'12px', border:'none', fontSize:'12px'}}/>
                                        <Line type="monotone" dataKey="height" stroke="#10b981" strokeWidth={3} dot={{r:4}}/>
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                             <div className="flex items-center gap-3 mb-4">
                                 <ClipboardList className="text-slate-400"/>
                                 <h4 className="text-xs font-black uppercase text-slate-700">Historial de Visitas</h4>
                             </div>
                             <div className="space-y-3">
                                 {healthRecord.visits.length > 0 ? [...healthRecord.visits].reverse().map(visit => (
                                     <div key={visit.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                         <div>
                                             <p className="text-[10px] font-black uppercase text-slate-900">{visit.date}</p>
                                             <p className="text-[9px] text-slate-400 font-bold uppercase">{visit.ageGroup}</p>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-[10px] font-medium text-slate-600">P: {visit.weight}kg | T: {visit.height}cm</p>
                                             {visit.notes && <p className="text-[9px] text-slate-400 italic truncate max-w-xs">{visit.notes}</p>}
                                         </div>
                                     </div>
                                 )) : (
                                     <p className="text-center text-[10px] text-slate-400 font-black uppercase py-4">Sin registros</p>
                                 )}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* MODAL INTEGRAL DE VISITA / CAPTURA COMPLETA */}
        {showVisitModal && (
            <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[95vh] border border-white/20">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-6 mb-6">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registro de Control Integral</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{currentStage} • Fecha: {new Date().toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => setShowVisitModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><Clock size={24} className="text-slate-300 hover:text-rose-500"/></button>
                    </div>

                    {/* MODAL TABS */}
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6 shadow-inner">
                        {[
                            { id: 'somatometry', label: 'Somatometría', icon: <Ruler size={14}/> },
                            { id: 'vaccines', label: 'Vacunación', icon: <Syringe size={14}/> },
                            { id: 'screenings', label: 'Tamizajes', icon: <FlaskConical size={14}/> },
                            { id: 'promotion', label: 'Promoción', icon: <BookOpen size={14}/> },
                            { id: 'notes', label: 'Notas', icon: <FileText size={14}/> }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setModalTab(t.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${modalTab === t.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        {modalTab === 'somatometry' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Peso (kg)</label>
                                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={visitForm.weight || ''} onChange={e => setVisitForm({...visitForm, weight: parseFloat(e.target.value)})} autoFocus/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Talla (cm)</label>
                                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={visitForm.height || ''} onChange={e => setVisitForm({...visitForm, height: parseFloat(e.target.value)})}/>
                                    </div>
                                    {['Recién Nacido', 'Lactante'].includes(currentStage) && (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">P. Cefálico (cm)</label>
                                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={visitForm.headCircumference || ''} onChange={e => setVisitForm({...visitForm, headCircumference: parseFloat(e.target.value)})}/>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-blue-400 ml-1">Temp (°C)</label>
                                        <input type="number" className="w-full p-2 bg-white rounded-xl text-center font-bold text-sm" value={visitForm.temp} onChange={e => setVisitForm({...visitForm, temp: parseFloat(e.target.value)})}/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-blue-400 ml-1">T.A.</label>
                                        <input className="w-full p-2 bg-white rounded-xl text-center font-bold text-sm" placeholder="120/80" value={visitForm.bp} onChange={e => setVisitForm({...visitForm, bp: e.target.value})}/>
                                    </div>
                                </div>
                            </div>
                        )}

                        {modalTab === 'vaccines' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Marque las vacunas aplicadas hoy:</p>
                                {stageConfig.vaccines.map((v, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <p className="text-xs font-black text-slate-900 uppercase mb-2">{v.name} <span className="text-[9px] text-slate-400 font-bold ml-1">({v.age})</span></p>
                                        <div className="flex flex-wrap gap-2">
                                            {v.doses.map(dose => {
                                                const isSelected = visitForm.appliedVaccines.some(av => av.name === v.name && av.dose === dose);
                                                // Check if already in history to disable
                                                const inHistory = healthRecord.vaccines.some(hv => hv.name === v.name && hv.doseNumber === dose);
                                                
                                                if (inHistory) return null; // Don't show already applied

                                                return (
                                                    <button 
                                                        key={dose}
                                                        onClick={() => toggleModalVaccine(v.name, dose)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-2 ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        {dose} {isSelected && <Check size={12}/>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[9px] text-slate-400 italic text-center mt-4">Solo se muestran dosis pendientes o de refuerzo.</p>
                            </div>
                        )}

                        {modalTab === 'screenings' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Evaluación de Tamizajes:</p>
                                {stageConfig.screenings.map((s, i) => {
                                    if (s.gender && s.gender !== patient.sex) return null;
                                    const currentSelection = visitForm.performedScreenings.find(ps => ps.name === s.name);
                                    
                                    return (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase">{s.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{s.cat} • {s.freq}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setModalScreening(s.name, s.cat, currentSelection?.status === 'Normal' ? null : 'Normal')}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${currentSelection?.status === 'Normal' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200'}`}
                                                >
                                                    Normal
                                                </button>
                                                <button 
                                                    onClick={() => setModalScreening(s.name, s.cat, currentSelection?.status === 'Anormal' ? null : 'Anormal')}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${currentSelection?.status === 'Anormal' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-200'}`}
                                                >
                                                    Anormal
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {modalTab === 'promotion' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Temas Educativos Abordados:</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {stageConfig.promotion.map((topic, i) => {
                                        const isSelected = visitForm.topicsDiscussed.includes(topic);
                                        return (
                                            <button 
                                                key={i}
                                                onClick={() => toggleModalTopic(topic)}
                                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                            >
                                                <span className={`text-xs font-bold uppercase ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{topic}</span>
                                                {isSelected && <CheckCircle2 size={16} className="text-indigo-600"/>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {modalTab === 'notes' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Desarrollo / Hitos</label>
                                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-sm font-medium resize-none outline-none" placeholder="Lenguaje, motor, social..." value={visitForm.developmentMilestones} onChange={e => setVisitForm({...visitForm, developmentMilestones: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Notas Clínicas</label>
                                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium resize-none outline-none" value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Próxima Cita</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={visitForm.nextAppointment} onChange={e => setVisitForm({...visitForm, nextAppointment: e.target.value})} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button onClick={() => setShowVisitModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleAddVisit} className="flex-[2] py-4 bg-slate-900 rounded-2xl font-black text-xs uppercase text-white shadow-xl hover:bg-blue-600">
                            Guardar Control Completo
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ComprehensiveHealthControl;
