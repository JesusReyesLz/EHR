
export enum ModuleType {
  OUTPATIENT = 'Consulta Externa',
  EMERGENCY = 'Urgencias',
  HOSPITALIZATION = 'Hospitalización',
  AUXILIARY = 'Auxiliares',
  ADMIN = 'Gestión y Normatividad',
  INVENTORY = 'Inventario Farmacéutico',
  MONITOR = 'Monitor Hospitalario'
}

export enum PatientStatus {
  TRIAGE = 'En Triage',
  WAITING = 'En sala de espera',
  IN_ROOM = 'En sala (Listo)',
  IN_CONSULTATION = 'En consulta',
  PROCEDURE = 'En procedimiento',
  RECOVERY = 'En recuperación',
  ADMITTED = 'Ingresado',
  ATTENDED = 'Atendido',
  WAITING_FOR_SAMPLES = 'En Sala de Toma',
  TAKING_SAMPLES = 'En Toma de Muestra',
  PROCESSING_RESULTS = 'En Procesamiento',
  READY_RESULTS = 'Resultados Listos',
  TRANSIT = 'En camino a sala',
  SCHEDULED = 'Programado'
}

export enum AgendaStatus {
  PENDING = 'Pendiente',
  ARRIVED_ON_TIME = 'Llegó a tiempo',
  ARRIVED_LATE = 'Llegó tarde',
  NO_SHOW = 'No asistió',
  RESCHEDULED = 'Reagendada',
  CANCELLED = 'Cancelada'
}

export enum PriorityLevel {
  NONE = '0 - Sin Clasificar (Triage Pendiente)',
  CRITICAL = '1 - Crítico (Rojo)',
  HIGH = '2 - Emergencia (Naranja)',
  MEDIUM = '3 - Urgencia (Amarillo)',
  LOW = '4 - No Urgente (Verde)',
  ROUTINE = '5 - Rutina (Azul)'
}

export enum MedicationCategory {
  GENERAL = 'General',
  ANTIBIOTIC = 'Antibiótico',
  CONTROLLED = 'Controlado'
}

export interface DoctorInfo {
  name: string;
  cedula: string;
  specialtyCedula?: string;
  institution: string;
  specialty: string;
  email: string;
  address: string;
  phone: string;
  hospital: string;
  titleUrl?: string;
  cedulaUrl?: string;
}

export interface Vitals {
  bp: string;
  temp: number;
  hr: number;
  rr: number;
  o2: number;
  weight: number;
  height: number;
  bmi: number;
  waist?: number;
  hip?: number;
  date: string;
}

export interface DiuresisEntry {
  id: string;
  date: string;
  time: string;
  amount: number;
  characteristics: string;
  color: string;
}

export interface MedicationPrescription {
  id: string;
  name: string;
  genericName?: string;
  presentation?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface Attachment {
  id: string;
  type: 'Laboratory' | 'Imaging' | 'Photo' | 'ExternalPDF';
  title: string;
  date: string;
  url: string; 
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  curp: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  bloodType: string;
  allergies: string[];
  status: PatientStatus;
  priority: PriorityLevel;
  lastVisit: string;
  scheduledDate?: string; 
  reason: string;
  chronicDiseases: string[];
  assignedModule: ModuleType;
  currentVitals?: Vitals;
  vitalsHistory?: Vitals[];
  diuresisHistory?: DiuresisEntry[];
  attachments?: Attachment[];
  history?: any;
  bedNumber?: string;
  appointmentTime?: string;
  agendaStatus?: AgendaStatus;
  waitingStartTime?: string;
  birthDate?: string;
  birthPlace?: string;
  phone?: string;
  email?: string;
  address?: string;
  civilStatus?: string;
  occupation?: string;
  religion?: string;
  education?: string;
  residence?: string;
  ethnicGroup?: string;
  indigenousLanguage?: boolean;
  medicalInsurance?: string;
  triageLevel?: 'Rojo' | 'Amarillo' | 'Verde'; 
  modifiedBy?: string; 
  originalDate?: string; 
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  type: string;
  date: string;
  author: string;
  content: {
    subjective?: string;
    objective?: string;
    analysis?: string;
    plan?: string;
    diagnosis?: string;
    vitals?: Vitals;
    prescriptions?: MedicationPrescription[];
    [key: string]: any;
  };
  attachments?: Attachment[];
  isSigned: boolean;
  hash?: string;
}

export interface ConsultationRecord {
  id: string;
  date: string;
  patientName: string;
  curp: string;
  sex: string;
  age: number;
  diagnosis: string;
  treatment: string;
  module: ModuleType;
}

export interface MedicationStock {
  id: string;
  name: string;
  genericName: string;
  presentation: string;
  concentration: string;
  batch: string;
  expiryDate: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier: string;
  registroCofepris: string;
  category: MedicationCategory;
}

export interface StockMovement {
  id: string;
  medicationId: string;
  medicationName: string;
  batch: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  reason: string;
  responsible: string;
}
