
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
  FINANCE = 'Finanzas y Compras'
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

export enum SupplyType {
  MEDICATION = 'Medicamento',
  SOLUTION = 'Solución / Suero',
  HEALING_MATERIAL = 'Material de Curación',
  SURGICAL = 'Instrumental / Quirúrgico',
  EQUIPMENT = 'Equipo Médico',
  OTHER = 'Diverso'
}

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

export interface DoctorInfo {
  name: string;
  cedula: string;
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
  date: string;
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
  history?: any;
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
}

export interface PatientAccount {
  patientId: string;
  charges: ChargeItem[]; 
  balance: number;
  status: 'Abierta' | 'Cerrada';
}
