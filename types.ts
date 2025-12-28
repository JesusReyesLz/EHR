
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
  FINANCE = 'Finanzas y Compras' // NUEVO
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

// --- TIPOS FINANCIEROS Y DE COMPRAS ---

export interface Expense {
  id: string;
  date: string;
  category: 'Compra Medicamento' | 'Servicios' | 'Nómina' | 'Mantenimiento' | 'Otro';
  concept: string;
  amount: number;
  supplier?: string;
  paymentMethod: 'Efectivo Caja' | 'Transferencia Bancaria' | 'Tarjeta Corporativa';
  status: 'Pagado' | 'Pendiente';
  ticketReference?: string;
}

export interface PurchaseOrderItem {
  inventoryId: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Borrador' | 'Enviada' | 'Recibida' | 'Cancelada' | 'Pagada';
  expectedDelivery?: string;
  notes?: string;
}

// --- NUEVOS TIPOS PARA FACTURACIÓN Y PRECIOS ---

export enum PriceType {
  SERVICE = 'Servicio / Honorario',
  PRODUCT = 'Producto / Insumo',
  PACKAGE = 'Paquete'
}

export interface PriceItem {
  id: string;
  code: string; // SKU o Código Interno
  name: string;
  type: PriceType;
  category: string; // Consulta, Farmacia, Lab, etc.
  price: number;
  taxPercent: number; // IVA
  linkedInventoryId?: string; // Para venta directa de producto (1 a 1)
  consumables?: { // Para servicios que consumen stock (ej. Sutura consume hilo + gasas)
      inventoryId: string;
      quantity: number;
      nameReference?: string; // Solo visual
  }[];
}

export interface ChargeItem {
  id: string;
  date: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // Monto descuento
  tax: number;
  total: number;
  type: 'Farmacia' | 'Honorarios' | 'Hospitalizacion' | 'Estudios' | 'Otro';
  status: 'Pendiente' | 'Pagado' | 'Cancelado' | 'Reembolsado';
  sourceId?: string; // ID de la nota, receta o venta de farmacia que generó el cargo
  linkedInventoryId?: string; // ID del producto en inventario para reversión directa
  consumables?: { // Copia de los consumibles del PriceItem al momento de la venta
      inventoryId: string;
      quantity: number;
  }[];
}

export interface PaymentDetail {
  method: 'Efectivo' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Transferencia' | 'Seguro' | 'Cheque';
  amount: number;
  reference?: string; // Voucher o Folio
}

export interface Transaction {
  id: string; // Folio de Ticket
  date: string;
  patientId: string;
  patientName: string;
  items: ChargeItem[];
  subtotal: number;
  taxes: number;
  discountTotal: number;
  total: number;
  payments: PaymentDetail[];
  change: number; // Cambio entregado
  status: 'Completada' | 'Cancelada' | 'Reembolsada Parcial';
  cashier: string;
  shiftId: string; // Vinculo al corte de caja
  notes?: string; // Observaciones internas (ej. motivo de descuento)
  // NUEVOS CAMPOS PARA HISTORIAL UNIFICADO
  category?: 'VENTA' | 'MOVIMIENTO' | 'TURNO'; 
  movementType?: 'INGRESO' | 'RETIRO' | 'APERTURA' | 'CIERRE';
}

export interface CashMovement {
  id: string;
  type: 'INGRESO' | 'RETIRO'; // Vales
  amount: number;
  reason: string;
  date: string;
  user: string;
}

export interface CashShift {
  id: string;
  status: 'Abierto' | 'Cerrado';
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  finalCashCount?: number; // Lo que contó el cajero
  amountLeftForNextShift?: number; // NUEVO: Monto dejado en caja para el siguiente turno
  movements?: CashMovement[]; // Vales y retiros
  systemTotals: {
    cash: number;
    card: number;
    transfer: number;
    other: number;
    total: number;
    // Campos extendidos para reporte detallado
    cashSales?: number;
    cashIn?: number;
    cashOut?: number;
    netCash?: number;
    totalSales?: number;
  };
  discrepancy?: number; // Sobrante o Faltante
}

export interface PatientAccount {
  patientId: string;
  charges: ChargeItem[]; // Cargos PENDIENTES por pagar
  // payments: Payment[]; // DEPRECATED: Usar Transaction para historial
  balance: number;
  status: 'Abierta' | 'Cerrada';
}

export interface Payment { // Legacy support
  id: string;
  date: string;
  amount: number;
  method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Seguro';
  reference?: string;
}

// --- FIN NUEVOS TIPOS ---

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

export interface LiquidEntry {
  id: string;
  type: 'Ingreso' | 'Egreso';
  concept: string; // Solución, Dieta, Diuresis, Sangrado, etc.
  amount: number;
  time: string;
  date: string;
}

export interface MedicationLog {
  id: string;
  medName: string;
  dosage: string;
  time: string;
  status: 'Aplicado' | 'No Aplicado' | 'Pendiente';
  nurse: string;
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
  liquidHistory?: LiquidEntry[];
  medicationLogs?: MedicationLog[];
  attachments?: Attachment[];
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
  idealStock?: number; // NUEVO: Para análisis de reposición
  unit: string;
  supplier: string;
  registroCofepris: string;
  category: MedicationCategory;
  supplyType: SupplyType; 
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
