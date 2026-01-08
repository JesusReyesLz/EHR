
export enum ModuleType {
  OUTPATIENT = 'Consulta Externa',
  EMERGENCY = 'Urgencias',
  HOSPITALIZATION = 'Hospitalización',
  AUXILIARY = 'Auxiliares',
  ADMIN = 'Gestión y Normatividad',
  INVENTORY = 'Inventario Farmacéutico',
  MONITOR = 'Monitor Hospitalario',
  BILLING = 'Caja y Facturación', 
  PRICING = 'Catálogo de Precios',
  FINANCE = 'Finanzas y Compras',
  STAFF = 'Personal y Turnos',
  TELEMEDICINE = 'Telemedicina',
  HOME_SERVICES = 'Servicios a Domicilio' // Nuevo Módulo
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
  SCHEDULED = 'Programado',
  
  // TELEMEDICINE STATES
  ONLINE_WAITING = 'En Sala Virtual', // Esperando a su médico específico (Cita)
  ONLINE_QUEUE = 'En Bolsa General', // Espera rápida (Cualquier médico)
  ONLINE_REVIEWING = 'Médico Revisando Historial', // Médico aceptó y lee antes de llamar
  ONLINE_IN_CALL = 'En Videoconsulta'
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

export enum SupplyType {
  MEDICATION = 'Medicamento',
  SOLUTION = 'Solución / Suero',
  HEALING_MATERIAL = 'Material de Curación',
  SURGICAL = 'Instrumental / Quirúrgico',
  EQUIPMENT = 'Equipo Médico',
  OTHER = 'Diverso'
}

// --- STAFF MANAGEMENT TYPES ---
export type StaffRole = 
  | 'Médico Especialista' 
  | 'Médico General' 
  | 'Enfermería' 
  | 'Químico / Laboratorio' 
  | 'Radiólogo / Imagen' 
  | 'Camillero' 
  | 'Limpieza / Intendencia' 
  | 'Caja / Admisión' 
  | 'Administrativo / RRHH'
  | 'Farmacia'
  | 'Repartidor / Chofer'; // Added for Home Delivery

export type ShiftType = 'Matutino' | 'Vespertino' | 'Nocturno A' | 'Nocturno B' | 'Guardia' | 'Jornada Acumulada' | 'Personalizado';

export interface StaffMember {
  id: string;
  clinicId?: string; // ID de la Clínica (Tenant) para separar bases de datos
  name: string;
  role: StaffRole;
  specialty?: string; 
  cedula?: string;
  email?: string;
  phone?: string;
  status: 'Activo' | 'Inactivo' | 'Vacaciones' | 'Incapacidad';
  assignedArea?: string[]; 
  
  // Platform Integration Flags (Vínculos)
  isTelemedicineEnabled?: boolean; // Puede dar consulta online
  isHomeServiceEnabled?: boolean; // Puede ser asignado a rutas (Enfermería/Labs/Chofer)
  mobileAppAccess?: boolean; // Tiene acceso a la App ECE Móvil
  
  // Payroll Data
  salaryDaily: number; 
  paymentPeriod: 'Quincenal' | 'Mensual' | 'Semanal';
  bankAccount?: string;
  rfc?: string;
  curp?: string;
  joinDate?: string;

  // Access Control
  allowedModules: ModuleType[]; 
  
  // Financials for Staff
  walletBalance?: number; // Saldo disponible para retiro (Comisiones)
}

export interface WorkShift {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  area: string; 
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  
  // Time Tracking
  scheduledStartTime: string; // HH:MM
  scheduledEndTime: string;   // HH:MM
  checkIn?: string; 
  checkOut?: string; 
  
  attendanceStatus: 'Pendiente' | 'Asistió' | 'Falta' | 'Retardo' | 'Justificado';
  
  // Computed for Payroll
  workedHours?: number; // Horas reales trabajadas
  overtimeHours?: number; // Total horas extra
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  generationDate: string;
  status: 'Borrador' | 'Pagado';
  totalPaid: number;
  configUsed: {
    weeklyHours: number; // 48 or 40
  };
  details: PayrollDetail[];
}

export interface PayrollDetail {
  staffId: string;
  staffName: string;
  daysWorked: number;
  totalWorkedHours: number;
  
  // Salary Parts
  grossSalary: number; // Sueldo Base por días
  
  // Overtime Breakdown (LFT Mexico)
  overtimeDoubleHours: number; // Primeras 9 hrs extra
  overtimeTripleHours: number; // Excedente de 9 hrs
  overtimeAmount: number; // $ Total Extra
  
  bonuses: number; 
  deductions: number; // ISR, IMSS
  netSalary: number; // A pagar
  notes?: string;
}
// -----------------------------

export interface Expense {
  id: string;
  date: string;
  category: 'Compra Medicamento' | 'Servicios' | 'Nómina' | 'Mantenimiento' | 'Otro';
  concept: string;
  amount: number;
  supplier?: string;
  paymentMethod: 'Efectivo Caja' | 'Transferencia Bancaria' | 'Tarjeta Corporativa';
  status: 'Pagado' | 'Pendiente';
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  category?: string;
}

export interface PurchaseOrderItem {
  inventoryId?: string; // Opcional para items no registrados
  name: string;
  quantity: number;
  unitCost: number;
  taxPercent?: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  time: string; // Hora de emisión
  supplierId?: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Borrador' | 'Enviada' | 'Recibida' | 'Cancelada' | 'Pagada';
}

// Interfaz interna de finanzas para márgenes
export interface FinancialSupply {
  inventoryId: string;
  name: string;
  lastPurchaseCost: number;
  currentSalePrice: number;
  targetMargin?: number;
}

export enum PriceType {
  SERVICE = 'Servicio / Honorario',
  PRODUCT = 'Producto / Insumo',
  PACKAGE = 'Paquete'
}

export interface LinkedSupply {
  inventoryId: string;
  quantity: number;
  name?: string; // Optional for display
}

export interface PriceItem {
  id: string;
  code: string;
  name: string;
  type: PriceType;
  category: string;
  price: number;
  taxPercent: number;
  linkedInventoryId?: string; // Para productos 1:1
  linkedSupplies?: LinkedSupply[]; // Para procedimientos con insumos (1:N)
  cost?: number; // Costo operativo manual para servicios
}

export interface ChargeItem {
  id: string;
  date: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  originalCost?: number; // Costo unitario al momento de la venta
  tax: number;
  total: number;
  type: 'Farmacia' | 'Honorarios' | 'Hospitalizacion' | 'Estudios' | 'Otro' | 'Material';
  status: 'Pendiente' | 'Pagado' | 'Cancelada' | 'Reembolsado';
  linkedInventoryId?: string;
  linkedSupplies?: LinkedSupply[];
}

export interface PaymentDetail {
  method: 'Efectivo' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Transferencia' | 'Seguro' | 'Cheque';
  amount: number;
  reference?: string;
}

export interface Transaction {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  items: ChargeItem[];
  subtotal: number;
  taxes: number;
  discountTotal: number;
  total: number;
  payments: PaymentDetail[];
  change: number;
  status: 'Completada' | 'Cancelada' | 'Reembolsada Parcial';
  cashier: string;
  shiftId: string;
  notes?: string;
  category?: 'VENTA' | 'MOVIMIENTO' | 'TURNO';
}

export interface CashShift {
  id: string;
  status: 'Abierto' | 'Cerrado';
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  finalCashCount?: number;
  amountLeftForNextShift?: number;
  isVerified?: boolean; 
  verifiedBy?: string;
  systemTotals: {
    cash: number;
    debitCard: number; 
    creditCard: number; 
    transfer: number; 
    other: number;
    total: number;
    totalCost?: number; // Costo total de lo vendido en el turno
    grossProfit?: number; // Ganancia bruta (Total - Costo)
    netCashExpected: number; 
    totalSalesCount: number;
  };
  discrepancy?: number;
}

export interface MedicationBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  currentStock: number;
}

export interface MedicationStock {
  id: string;
  name: string;
  genericName: string;
  presentation: string;
  concentration: string;
  batches: MedicationBatch[]; 
  minStock: number;
  idealStock?: number;
  unit: string;
  supplier: string;
  registroCofepris: string;
  category: MedicationCategory;
  supplyType: SupplyType; 
  lastCost?: number; // Costo de última compra
}

export interface StockMovement {
  id: string;
  medicationId: string;
  medicationName: string;
  batch: string;
  type: 'IN' | 'OUT' | 'UPDATE';
  quantity: number;
  date: string;
  reason: string;
  responsible: string;
}

export interface ClinicDocument {
  id: string;
  name: string; // "Licencia Sanitaria", "Aviso de Funcionamiento", etc.
  url: string;
  uploadDate: string;
}

export interface DoctorSchedule {
    days: number[]; // 0=Sunday, 1=Monday, etc.
    startHour: string; // "09:00"
    endHour: string; // "17:00"
    slotDuration: number; // minutes
}

export interface DoctorInfo {
  // Clinic / Multi-Tenant Data
  id?: string; // Added ID for matching
  clinicId?: string; 
  clinicName?: string;
  // Personal Data
  name: string;
  cedula: string;
  university?: string; // NEW
  institution: string; // Hospital de egreso/especialidad
  specialty: string;
  email: string;
  address: string;
  phone: string;
  hospital: string;
  titleUrl?: string;
  cedulaUrl?: string;
  // SaaS Features
  isPremium?: boolean;
  isVerified?: boolean; // NEW: Sello de validación
  rating?: number;
  reviewCount?: number;
  price?: number;
  availableFrom?: string;
  avatarUrl?: string;
  // Public Profile Fields
  biography?: string;
  services?: string[];
  languages?: string[];
  coverUrl?: string;
  gallery?: string[];
  allowReviews?: boolean; // Toggle para habilitar/deshabilitar comentarios
  reviews?: { user: string; date: string; rating: number; text: string }[]; // Added Reviews
  
  // Real-time Status
  isOnline?: boolean; // Available for Telemedicine
  walletBalance?: number; // Saldo acumulado por consultas

  // Scheduling
  schedule?: DoctorSchedule;

  // Clinic Documents
  clinicDocuments?: ClinicDocument[];
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
  date: string;
  
  // IoT Extensions
  source?: 'Manual' | 'Apple Health' | 'Google Fit' | 'IoT Device';
  glucose?: number;
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
  instructions?: string;
}

export interface MedicationLog {
  id: string;
  medName: string;
  dosage: string;
  time: string;
  status: 'Aplicado' | 'No Aplicado';
  nurse: string;
  date: string;
}

export interface LiquidEntry {
  id: string;
  type: 'Ingreso' | 'Egreso';
  concept: string;
  amount: number;
  time: string;
  date: string;
}

// --- NEW TYPES FOR TELEMEDICINE INTAKE ---
export interface TeleIntakeForm {
    mainSymptom: string;
    onsetDuration: string; // e.g. "2 days ago"
    painLevel: number; // 0-10
    chronicConditions: string[]; // Selected from list
    allergies: string;
    currentMedication: string;
    notes: string;
    submittedAt: string;
}

export interface HomeServiceRequest {
    id: string;
    patientId: string;
    patientName: string;
    patientAddress: string;
    patientPhone?: string;
    requestedBy: string; // Doctor Name
    requestedDate: string;
    status: 'Pendiente' | 'Asignado' | 'En Camino' | 'En Proceso' | 'Recolectado' | 'Finalizado';
    assignedUnit?: string; // e.g., "Unidad Móvil 01"
    assignedStaff?: string; // e.g., "Enf. Juan Perez"
    studies: string[]; // List of study names
    notes?: string;
    coordinates?: { lat: number, lng: number }; // Ubicación en mapa
    acceptedAt?: string; // Timestamp de cuando el enfermero aceptó el trabajo
    completedAt?: string; // Timestamp de finalización
    commission?: number; // Monto ganado por el servicio
    
    // Mixed Service Flags
    hasDoctorVisit?: boolean;
    hasLabCollection?: boolean;
    hasPharmacyDelivery?: boolean;
}

// --- PERINATAL & PREGNANCY TYPES ---
export interface PerinatalVisit {
  id: string;
  date: string;
  gestationalAge: number; // Semanas
  weight: number;
  bp: string; // Tensión Arterial
  fundalHeight: number; // cm
  fetalHeartRate: number; // lpm
  fetalPosition: string; // Cefálico, Pélvico, Transverso
  edema: string; // +, ++, +++, Neg
  alarmSigns: boolean;
  notes: string;
  nextAppointment: string;
}

export interface PregnancyRecord {
   id: string;
   status: 'Active' | 'Finished';
   startDate: string; // Usually FUM date or creation date
   endDate?: string;
   outcome?: 'Parto' | 'Cesárea' | 'Aborto' | 'Ectópico' | 'Otro';
   
   // Obstetric Data Snapshot
   fum: string;
   fpp: string;
   ultrasoundDate: string;
   ultrasoundWeeks: number;
   
   gesta: number;
   para: number;
   cesarean: number;
   abortions: number;
   
   riskFactors: string[];
   vaccines: {
        tdpa: boolean;
        influenza: boolean;
        covid: boolean;
        hepatitisB: boolean;
   };
   supplements: {
        folicAcid: boolean;
        iron: boolean;
        calcium: boolean;
        multivitamin: boolean;
   };
   
   visits: PerinatalVisit[];
}

// --- CHRONIC DISEASE TYPES ---
export interface TreatmentPlan {
    id: string;
    drug: string;
    dose: string;
    frequency: string;
    active: boolean;
}

export interface ChronicVisit {
    id: string;
    date: string;
    weight: number;
    bp: string;
    glucose: number; // mg/dL
    
    // Extended Lipid Profile
    totalCholesterol?: number; // mg/dL
    hdl?: number; // mg/dL
    ldl?: number; // mg/dL
    triglycerides?: number; // mg/dL

    hba1c?: number; // %
    waistCircumference?: number; // cm
    
    // Adherence Check
    adherenceToMeds: 'Buena' | 'Regular' | 'Mala';
    adherenceToDiet: 'Buena' | 'Regular' | 'Mala';
    
    notes: string;
    medicationAdjustments?: string;
    nextAppointment: string;
    labResults?: string; // Resumen de labs traídos
    
    // Treatment Snapshot (Lo que se indicó en esa visita)
    treatmentSnapshot?: string; 
    // Checkups performed during this visit (e.g., 'ophthalmology', 'dental')
    checkupsPerformed?: string[];
}

export interface ChronicDiseaseRecord {
    id: string;
    status: 'Active' | 'Archived';
    startDate: string;
    endDate?: string;
    diagnosis: string[]; // ['Diabetes', 'Hipertensión', 'Obesidad', 'Dislipidemia']
    
    // Risk Stratification
    cardiovascularRisk: 'Bajo' | 'Moderado' | 'Alto' | 'Muy Alto';
    
    // Goals (Metas Terapéuticas)
    goals: {
        hba1cTarget: number; // < 7% generally
        bpTargetSystolic: number; // < 130
        bpTargetDiastolic: number; // < 80
        ldlTarget: number; // < 100 or < 70 depending on risk
        bmiTarget: number;
        waistTarget: number; // < 90/80 cm
    };
    
    // Baseline (Valores Iniciales)
    baseline: {
        weight: number;
        hba1c: number;
        bp: string;
        lipidProfile?: string; // Texto resumen
    };
    
    // Active Medication List
    currentMedications: TreatmentPlan[];
    nutritionPlan: string; // Texto libre dieta

    visits: ChronicVisit[];
    
    // Checklists - Stores DATE string of last checkup or EMPTY string if not done
    annualCheckups: {
        ophthalmology: string; // Date or ''
        dental: string;
        footExam: string;
        cardiology: string;
        nephrology: string;
        nutrition: string;
    };
}

// --- PREVENTIVE HEALTH / HEALTHY CHILD TYPES ---

export interface VaccineRecord {
    id: string;
    name: string;
    doseNumber: string; // 1a, 2a, Refuerzo
    targetAge: string; // e.g. "Al nacer", "2 meses", "Anual"
    applicationDate: string; // Date or ''
    batch?: string;
    notes?: string;
}

export interface ScreeningRecord {
    id: string;
    name: string;
    category: 'Metabólico' | 'Visual' | 'Auditivo' | 'Cáncer' | 'Desarrollo' | 'Geriátrico';
    targetPopulation: string; // e.g., "Mujeres > 25", "Recién Nacido"
    status: 'Pendiente' | 'Realizado' | 'Normal' | 'Anormal';
    lastDate: string;
    nextDueDate: string;
    resultSummary?: string;
}

export interface PreventiveVisit {
    id: string;
    date: string;
    ageGroup: string; // "Lactante", "Escolar", "Adulto"
    weight: number;
    height: number;
    bmi?: number;
    headCircumference?: number; // Para niños < 2-3 años
    developmentMilestones?: string; // Hitos del desarrollo (se sentó, caminó, habla)
    physicalActivity?: string;
    nutritionAssessment?: string;
    notes: string;
}

// New Interface for Health Promotion
export interface PromotionTopic {
    topic: string;
    date: string;
    notes?: string;
}

// Geriatric Assessment Interface
export interface GeriatricAssessment {
    date: string;
    katzScore: number; // /6 ABVD
    lawtonScore: number; // /8 AIVD
    minimentalScore: number; // /30 Cognitivo
    depressionScale: number; // /15 Yesavage
    nutritionalScore: number; // MNA
    mobility: 'Normal' | 'Riesgo Caídas' | 'Frágil';
    notes: string;
}

// NEW: Adolescent Assessment
export interface AdolescentAssessment {
    date: string;
    tannerStage: string; // I, II, III, IV, V
    headssSummary: string; // Resumen psicosocial
    phq9Score: number; // Depresión
    gad7Score: number; // Ansiedad
    notes: string;
}

export interface HealthControlRecord {
    id: string;
    patientId: string;
    lifeStage: 'Recién Nacido' | 'Lactante' | 'Preescolar' | 'Escolar' | 'Adolescente' | 'Adulto Joven' | 'Adulto' | 'Adulto Mayor';
    
    vaccines: VaccineRecord[];
    screenings: ScreeningRecord[];
    visits: PreventiveVisit[];
    
    // NEW FIELD: Health Promotion Topics
    healthPromotion?: PromotionTopic[]; // Array of topics covered
    
    // NEW FIELD: Geriatric specific records
    geriatricAssessments?: GeriatricAssessment[];

    // NEW FIELD: Adolescent specific records
    adolescentAssessments?: AdolescentAssessment[];
}

// --- SUIVE / DISCHARGE DATA ---
export interface DischargeData {
    diagnosticos: { name: string; status: string }[];
    program: string;
    programDetails: {
        consultationType: '1a Vez' | 'Subsecuente';
        isIndigenous: boolean;
        isDisability: boolean;
        isMigrant?: boolean;
        referral: string;
        specifics?: Record<string, any>;
    };
    notes: string;
    medico: string;
    timestamp: string;
}

export interface Patient {
  id: string;
  clinicId?: string; // Link to Clinic DB
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
  history?: {
      dischargeData?: DischargeData; // Data for SUIVE
      [key: string]: any;
  };
  bedNumber?: string;
  transitTargetBed?: string;
  transitTargetModule?: ModuleType;
  appointmentTime?: string;
  agendaStatus?: AgendaStatus;
  waitingStartTime?: string;
  email?: string;
  phone?: string;
  modifiedBy?: string;
  religion?: string;
  education?: string;
  occupation?: string;
  address?: string;
  civilStatus?: string;
  medicationLogs?: MedicationLog[];
  liquidHistory?: LiquidEntry[];
  
  // New Fields for Billing Integration
  pendingCharges?: ChargeItem[];
  paymentStatus?: 'Pendiente' | 'Pagado' | 'N/A';
  
  // Telemedicine Specifics
  assignedDoctorId?: string; // ID del médico seleccionado en directorio
  assignedDoctorName?: string;
  hasTelemedicineConsent?: boolean; // Flag para consentimiento firmado
  teleIntake?: TeleIntakeForm; // Datos del cuestionario previo

  // Perinatal History (Multi-Pregnancy Support)
  pregnancyHistory?: PregnancyRecord[];

  // Chronic Disease Control (New)
  chronicHistory?: ChronicDiseaseRecord[];

  // Preventive Health Control (New)
  healthControl?: HealthControlRecord;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  type: string;
  date: string;
  author: string;
  content: {
    [key: string]: any;
  };
  isSigned: boolean;
  hash?: string;
  origin?: 'Physical' | 'Telemedicine'; // To distinguish note source
}

export interface PatientAccount {
  patientId: string;
  charges: ChargeItem[]; 
  balance: number;
  status: 'Abierta' | 'Cerrada';
}
