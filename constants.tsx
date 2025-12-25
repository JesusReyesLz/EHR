
import { Patient, PatientStatus, ModuleType, MedicationStock, MedicationCategory, PriorityLevel, AgendaStatus } from './types';

// Helper local para asegurar consistencia en fechas de demo
const getLocalToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const todayStr = getLocalToday();

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'JUAN PÉREZ GARCÍA',
    curp: 'PEGJ850101HDFRRN01',
    age: 38,
    sex: 'M',
    bloodType: 'O+',
    allergies: ['PENICILINA'],
    status: PatientStatus.IN_CONSULTATION,
    priority: PriorityLevel.MEDIUM,
    lastVisit: todayStr,
    scheduledDate: todayStr,
    agendaStatus: AgendaStatus.ARRIVED_ON_TIME,
    reason: 'Control de Diabetes Tipo 2',
    chronicDiseases: ['Diabetes Mellitus 2'],
    assignedModule: ModuleType.OUTPATIENT,
    appointmentTime: '10:30',
    waitingStartTime: `${todayStr} 10:15:00`,
    email: 'juan.perez@email.com',
    currentVitals: { bp: '125/82', temp: 36.6, hr: 72, rr: 16, o2: 98, weight: 82, height: 175, bmi: 26.8, date: `${todayStr} 10:45:12` }
  },
  {
    id: '2',
    name: 'MARÍA RODRÍGUEZ LÓPEZ',
    curp: 'ROLM920512MDFXYZ02',
    age: 31,
    sex: 'F',
    bloodType: 'A+',
    allergies: [],
    status: PatientStatus.WAITING,
    priority: PriorityLevel.CRITICAL,
    lastVisit: todayStr,
    scheduledDate: todayStr,
    agendaStatus: AgendaStatus.PENDING,
    reason: 'Dolor precordial intenso',
    chronicDiseases: [],
    assignedModule: ModuleType.EMERGENCY,
    bedNumber: 'BOX-04',
    appointmentTime: '09:00',
    email: 'maria.rodriguez@email.com',
    waitingStartTime: new Date().toLocaleString()
  }
];

export const DEFAULT_INFRASTRUCTURE = {
  outpatient: Array.from({ length: 8 }, (_, i) => `C-${(i+1).toString().padStart(2, '0')}`),
  emergency: Array.from({ length: 10 }, (_, i) => `BOX-${(i+1).toString().padStart(2, '0')}`),
  hospitalization: {
    'Medicina Interna': Array.from({ length: 6 }, (_, i) => `MI-${(i+1).toString().padStart(2, '0')}`),
    'Cirugía': Array.from({ length: 6 }, (_, i) => `CX-${(i+1).toString().padStart(2, '0')}`),
    'Obstetricia': Array.from({ length: 4 }, (_, i) => `OB-${(i+1).toString().padStart(2, '0')}`),
    'Pediatría': Array.from({ length: 4 }, (_, i) => `PD-${(i+1).toString().padStart(2, '0')}`),
    'UCI': Array.from({ length: 4 }, (_, i) => `ICU-${(i+1).toString().padStart(2, '0')}`)
  }
};

export const LAB_STUDIES = [
  'Biometría Hemática Completa',
  'Química Sanguínea (6 elementos)',
  'Examen General de Orina (EGO)',
  'Perfil de Lípidos',
  'Glucosa en ayuno',
  'Tiempos de Coagulación (TP, TPT)',
  'Grupo Sanguíneo y Factor Rh',
  'Hemoglobina Glicosilada (HbA1c)'
];

export const IMAGING_STUDIES = [
  'Radiografía de Tórax',
  'Ultrasonido Abdominal Integral',
  'Mastografía Bilateral',
  'Tomografía (TAC) con Contraste',
  'Resonancia Magnética (RMN)',
  'Electrocardiograma (EKG)'
];

export const LAB_CATALOG = LAB_STUDIES.map(s => ({ name: s, preparation: 'Ayuno requerido.', indications: 'Muestra venosa.' }));
export const IMAGING_CATALOG = IMAGING_STUDIES.map(s => ({ name: s, preparation: 'Consultar indicaciones.', indications: 'Gabinete.' }));

export const VADEMECUM_DB: MedicationStock[] = [
  {
    id: 'DB-001',
    name: 'TEMPRA (PARACETAMOL)',
    genericName: 'PARACETAMOL',
    presentation: 'Tabletas',
    concentration: '500mg',
    batch: 'N/A',
    expiryDate: '2030-01-01',
    currentStock: 999,
    minStock: 0,
    unit: 'Tabletas',
    supplier: 'Genérico',
    registroCofepris: 'N/A',
    category: MedicationCategory.GENERAL
  }
];

export const INITIAL_STOCK: MedicationStock[] = [
  {
    id: 'S-001',
    name: 'TEMPRA (PARACETAMOL)',
    genericName: 'PARACETAMOL',
    presentation: 'Tabletas',
    concentration: '500mg',
    batch: '23K098',
    expiryDate: '2025-10-25',
    currentStock: 45,
    minStock: 10,
    unit: 'Cajas',
    supplier: 'Genérico Pharma',
    registroCofepris: '123M2015 SSA',
    category: MedicationCategory.GENERAL
  }
];

export const NOTE_CATEGORIES = [
  {
    title: 'Evaluación y Seguimiento',
    notes: [
      'Historia Clínica Medica',
      'Nota de Evolución',
      'Resumen Clínico',
      'Nota Inicial de Urgencias',
      'Nota de Egreso / Alta'
    ]
  }
];

export const BITACORAS = [
  { id: 'refrig', name: 'Control de Temperatura (Red de Frío)', icon: 'Thermometer' },
  { id: 'cloro', name: 'Bitácora de Cloración de Agua', icon: 'Droplets' },
  { id: 'rpbi', name: 'Manejo de RPBI', icon: 'Trash2' },
  { id: 'extintores', name: 'Revisión de Extintores', icon: 'Flame' },
  { id: 'limpieza', name: 'Bitácora de Limpieza y Sanitización', icon: 'Sparkles' }
];

export const PROTOCOLOS = [
  'Protocolo de Cloración de Agua',
  'Manual de Manejo de RPBI',
  'Plan de Contingencia y Evacuación',
  'Protocolo de Seguridad Sanitaria'
];

export const FORMATOS_VIGENTES = [
  { id: 'f-hc', name: 'Formato: Historia Clínica (Anverso/Reverso)', category: 'Clínico', norm: 'NOM-004' },
  { id: 'f-enf', name: 'Formato: Hoja de Enfermería (Sábana)', category: 'Clínico', norm: 'NOM-004' },
  { id: 'f-cons', name: 'Carta de Consentimiento Informado', category: 'Legal', norm: 'NOM-004' },
  { id: 'f-ref', name: 'Hoja de Referencia y Contrarreferencia', category: 'Administrativo', norm: 'Regulatorio' },
  { id: 'f-suive', name: 'Formulario SUIVE-1 (Semanal)', category: 'Epidemiología', norm: 'NOM-017' }
];
