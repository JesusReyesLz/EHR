
import { Patient, PatientStatus, ModuleType, MedicationStock, MedicationCategory } from './types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'JUAN PÉREZ GARCÍA',
    curp: 'PEGJ850101HDFRRN01',
    age: 38,
    sex: 'M',
    bloodType: 'O+',
    allergies: ['PENICILINA', 'SULMAS'],
    status: PatientStatus.IN_CONSULTATION,
    lastVisit: '2023-10-25',
    reason: 'Control de Diabetes Tipo 2',
    chronicDiseases: ['Diabetes Mellitus 2'],
    assignedModule: ModuleType.OUTPATIENT,
    appointmentTime: '10:30 AM',
    currentVitals: { bp: '125/82', temp: 36.6, hr: 72, rr: 16, o2: 98, weight: 82, height: 175, bmi: 26.8, date: '2023-10-25 10:45:12' }
  }
];

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
  },
  {
    id: 'DB-002',
    name: 'GLAFORNIL (METFORMINA)',
    genericName: 'METFORMINA',
    presentation: 'Tabletas',
    concentration: '850mg',
    batch: 'N/A',
    expiryDate: '2030-01-01',
    currentStock: 999,
    minStock: 0,
    unit: 'Tabletas',
    supplier: 'Genérico',
    registroCofepris: 'N/A',
    category: MedicationCategory.GENERAL
  },
  {
    id: 'DB-003',
    name: 'AMOXIL (AMOXICILINA)',
    genericName: 'AMOXICILINA',
    presentation: 'Cápsulas',
    concentration: '500mg',
    batch: 'N/A',
    expiryDate: '2030-01-01',
    currentStock: 999,
    minStock: 0,
    unit: 'Cápsulas',
    supplier: 'Genérico',
    registroCofepris: 'N/A',
    category: MedicationCategory.ANTIBIOTIC
  }
];

// Initial stock for the inventory view
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
  },
  {
    id: 'S-002',
    name: 'GLAFORNIL (METFORMINA)',
    genericName: 'METFORMINA',
    presentation: 'Tabletas',
    concentration: '850mg',
    batch: 'XW-2023',
    expiryDate: '2024-12-12',
    currentStock: 8,
    minStock: 15,
    unit: 'Cajas',
    supplier: 'Sandoz',
    registroCofepris: '456M2018 SSA',
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
  },
  {
    title: 'Quirúrgico y Anestesia',
    notes: [
      'Nota Pre-operatoria',
      'Nota Post-operatoria',
      'Nota Pre-anestésica',
      'Nota Post-anestésica',
      'Lista de Verificación OMS'
    ]
  },
  {
    title: 'Vigilancia Epidemiológica',
    notes: [
      'Estudio Epidemiológico de Caso',
      'Notificación de Brote',
      'Reporte de ESAVI (Vacunas)'
    ]
  },
  {
    title: 'Especialidades',
    notes: [
      'Expediente Estomatológico (Odontograma)',
      'Nota de Nutrición',
      'Nota de Psicología'
    ]
  },
  {
    title: 'Enfermería y Otros',
    notes: [
      'Hoja de Enfermería',
      'Reporte de Auxiliares (Lab/Imagen)',
      'Hoja de Trabajo Social',
      'Consentimiento Informado',
      'Consentimiento Telemedicina',
      'Hoja de Egreso Voluntario',
      'Notificación Ministerio Público',
      'Certificado de Defunción',
      'Registro de Transfusión',
      'Receta Médica'
    ]
  }
];

export const APARATOS_SISTEMAS = [
  { id: 'general', name: 'Síntomas Generales', symptoms: ['Astenia', 'Adinamia', 'Fiebre', 'Pérdida de peso'] },
  { id: 'resp', name: 'Respiratorio', symptoms: ['Tos', 'Disnea', 'Dolor torácico'] },
  { id: 'digest', name: 'Digestivo', symptoms: ['Náusea', 'Vómito', 'Diarrea', 'Dolor abdominal'] },
  { id: 'cardio', name: 'Cardiovascular', symptoms: ['Palpitaciones', 'Edema', 'Síncope'] },
  { id: 'neuro', name: 'Neurológico', symptoms: ['Cefalea', 'Mareo', 'Convulsiones'] }
];

export const BITACORAS = [
  { id: 'refrig', name: 'Control de Temperatura (Red de Frío)', icon: 'Thermometer' },
  { id: 'cloro', name: 'Bitácora de Cloración de Agua', icon: 'Droplets' },
  { id: 'rpbi', name: 'Manejo de RPBI', icon: 'Trash2' },
  { id: 'limpieza', name: 'Bitácora de Limpieza y Sanitización', icon: 'Sparkles' }
];

export const PROTOCOLOS = [
  'Protocolo de Cloración de Agua',
  'Manual de Manejo de RPBI',
  'Plan de Contingencia y Evacuación',
  'Protocolo de Seguridad Sanitaria'
];
