
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

export interface StudyMetadata {
  name: string;
  preparation: string;
  indications: string;
}

export const LAB_CATALOG: StudyMetadata[] = [
  { name: 'Biometría Hemática Completa', preparation: 'Ayuno mínimo de 4 horas.', indications: 'Muestra de sangre venosa.' },
  { name: 'Química Sanguínea (6 elementos)', preparation: 'Ayuno estricto de 8 a 12 horas.', indications: 'No ingerir alcohol 24 horas antes.' },
  { name: 'Examen General de Orina (EGO)', preparation: 'Aseo previo de zona genital.', indications: 'Recolectar el primer chorro de la primera orina de la mañana.' },
  { name: 'Perfil de Lípidos', preparation: 'Ayuno estricto de 12 horas.', indications: 'Cena ligera libre de grasas el día anterior.' },
  { name: 'Glucosa en ayuno', preparation: 'Ayuno de 8 a 10 horas.', indications: 'No realizar ejercicio intenso antes de la toma.' },
  { name: 'Tiempos de Coagulación (TP, TPT)', preparation: 'Ayuno mínimo de 4 horas.', indications: 'Informar si toma anticoagulantes.' },
  { name: 'Grupo Sanguíneo y Factor Rh', preparation: 'No requiere ayuno.', indications: 'Identificación oficial requerida.' },
  { name: 'Hemoglobina Glicosilada (HbA1c)', preparation: 'No requiere ayuno.', indications: 'Útil para control de diabetes.' }
];

export const IMAGING_CATALOG: StudyMetadata[] = [
  { name: 'Radiografía de Tórax', preparation: 'Retirar objetos metálicos del cuello y tórax.', indications: 'No apto para pacientes con sospecha de embarazo.' },
  { name: 'Ultrasonido Abdominal Integral', preparation: 'Ayuno de 6 a 8 horas. Beber 1 litro de agua 1 hora antes.', indications: 'No orinar hasta terminar el estudio.' },
  { name: 'Mastografía Bilateral', preparation: 'No aplicar desodorante, talco o perfume en axilas.', indications: 'Recomendado del día 7 al 10 del ciclo menstrual.' },
  { name: 'Tomografía (TAC) con Contraste', preparation: 'Ayuno de 6 horas. Traer estudios de Creatinina recientes.', indications: 'Informar sobre alergias al yodo o mariscos.' },
  { name: 'Resonancia Magnética (RMN)', preparation: 'Sin objetos metálicos, marcapasos o prótesis ferrosas.', indications: 'Llegar 20 minutos antes para cuestionario de seguridad.' },
  { name: 'Electrocardiograma (EKG)', preparation: 'Piel limpia, sin cremas o aceites.', indications: 'Reposo de 5 minutos previo a la toma.' }
];

export const LAB_STUDIES = LAB_CATALOG.map(s => s.name);
export const IMAGING_STUDIES = IMAGING_CATALOG.map(s => s.name);

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
    title: 'Auxiliares y Órdenes',
    notes: [
      'Solicitud de Estudios Auxiliares',
      'Reporte de Resultados Lab/Imagen',
      'Hoja de Enfermería',
      'Consentimiento Informado',
      'Receta Médica'
    ]
  }
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
