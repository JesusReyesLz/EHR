
export enum ModuleType {
  OUTPATIENT = 'Consulta Externa',
  EMERGENCY = 'Urgencias',
  HOSPITALIZATION = 'Hospitalización',
  AUXILIARY = 'Auxiliares',
  ADMIN = 'Gestión y Normatividad',
  INVENTORY = 'Inventario Farmacéutico'
}

export enum PatientStatus {
  TRIAGE = 'Triage',
  WAITING = 'En espera',
  IN_CONSULTATION = 'En consulta',
  ADMITTED = 'Ingresado',
  ATTENDED = 'Atendido'
}

export enum MedicationCategory {
  GENERAL = 'General',
  ANTIBIOTIC = 'Antibiótico',
  CONTROLLED = 'Controlado'
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

export interface MedicationPrescription {
  id: string;
  name: string;
  // Añadiendo campos para compatibilidad con vademécum en recetas
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
  lastVisit: string;
  reason: string;
  chronicDiseases: string[];
  assignedModule: ModuleType;
  currentVitals?: Vitals;
  vitalsHistory?: Vitals[];
  attachments?: Attachment[];
  history?: any;
  bedNumber?: string;
  appointmentTime?: string;
  birthDate?: string;
  birthPlace?: string;
  phone?: string;
  address?: string;
  civilStatus?: string;
  occupation?: string;
  religion?: string;
  education?: string;
  // Fix: added missing properties to support NewPatient form and resolve residence property error
  residence?: string;
  ethnicGroup?: string;
  indigenousLanguage?: boolean;
  medicalInsurance?: string;
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
    prognosisLife?: string;
    prognosisFunction?: string;
    prognosisRecovery?: string;
    vitals?: Vitals;
    prescriptions?: MedicationPrescription[];
    // Campos quirúrgicos
    operationPlanned?: string;
    operationRealized?: string;
    technique?: string;
    findings?: string;
    gasasCount?: boolean;
    bleeding?: string;
    incidentes?: string;
    participants?: string;
    // Campos Urgencias/Egreso
    triage?: string;
    mentalState?: string;
    dischargeReason?: string;
    pendingProblems?: string;
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
