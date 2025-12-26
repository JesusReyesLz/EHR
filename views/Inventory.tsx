import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, Plus, AlertTriangle, Calendar, ClipboardList, TrendingUp, TrendingDown, 
  Info, Filter, CheckCircle2, X, Save, Truck, FileBadge, ShieldCheck, History, ArrowRight, 
  Database, ArrowUpRight, ArrowDownLeft, Printer, FileText, QrCode, User, Pill, ShoppingBag, 
  Clock, ChevronLeft, Stethoscope, Archive, ExternalLink, RefreshCw, UserMinus, ShoppingCart, 
  Trash2, Edit, Copy, AlertOctagon, ChevronDown, ChevronRight, Layers,
  Droplet, Scissors, Monitor, Box, CalendarOff, Maximize, FileSpreadsheet,
  AlertCircle, Receipt
} from 'lucide-react';
import { MedicationStock, StockMovement, MedicationCategory, ClinicalNote, Patient, MedicationBatch, SupplyType, PriceItem, PatientAccount } from '../types';
import { INITIAL_STOCK, INITIAL_PRICES } from '../constants';

// Interfaces locales para manejo de UI
interface CartItem {
  id: string; // unique ID for cart item
  medId: string;
  name: string;
  batch: string;
  quantity: number;
  isExtra: boolean;
  price?: number; // Precio unitario vinculado
}

// Helper para generar IDs únicos
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'dispense' | 'replenish'>('stock');
  
  // Cargar Precios y Cuentas para vinculación
  const [prices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  // Estado de inventario con migración de datos legacy
  const [stock, setStock] = useState<MedicationStock[]>(() => {
    const saved = localStorage.getItem('med_inventory_v6');
    let data = saved ? JSON.parse(saved) : INITIAL_STOCK;
    
    // Migración 1: Batches
    if (data.length > 0 && !data[0].batches) {
        data = data.map((item: any) => ({
            ...item,
            batches: [{
                id: generateId('BATCH'),
                batchNumber: item.batch || 'S/L',
                expiryDate: item.expiryDate || '',
                currentStock: item.currentStock || 0
            }]
        }));
    }
    // Migración 2: SupplyType
    if (data.length > 0 && !data[0].supplyType) {
        data = data.map((item: any) => ({
            ...item,
            supplyType: SupplyType.MEDICATION
        }));
    }
    return data;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('med_movements_v6');
    return saved ? JSON.parse(saved) : [];
  });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [kardexSearch, setKardexSearch] = useState('');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [isEditingMed, setIsEditingMed] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false); // Nuevo modal ticket

  // Estados para manejo de "No Caduca"
  const [noExpiry, setNoExpiry] = useState(false);

  // Selección
  const [selectedMed, setSelectedMed] = useState<MedicationStock | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Forms
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | null>(null);
  const [movementQty, setMovementQty] = useState(0);
  const [movementReason, setMovementReason] = useState('');
  const [outReasonCategory, setOutReasonCategory] = useState('Dispensación / Venta'); 

  // Formulario Nuevo Medicamento / Edición (AHORA CON IDEAL STOCK)
  const [medForm, setMedForm] = useState<Partial<MedicationStock>>({
    name: '', genericName: '', presentation: 'Unidad', concentration: '',
    minStock: 10, idealStock: 50, unit: 'Pieza', supplier: '', registroCofepris: '', 
    category: MedicationCategory.GENERAL, supplyType: SupplyType.MEDICATION
  });
  
  // Formulario Nuevo Lote
  const [batchForm, setBatchForm] = useState<Partial<MedicationBatch>>({
    batchNumber: '', expiryDate: '', currentStock: 0
  });

  // Prescriptions Logic
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [foundPrescription, setFoundPrescription] = useState<ClinicalNote | null>(null);
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, number>>({}); 
  
  // CARRITO DE SESIÓN (Para mostrar lo que se ha surtido/vendido antes de "Finalizar")
  const [sessionCart, setSessionCart] = useState<CartItem[]>([]);

  const [showAllHistory, setShowAllHistory] = useState(false);
  const [archivedPrescriptions, setArchivedPrescriptions] = useState<string[]>(() => JSON.parse(localStorage.getItem('med_pharmacy_archived_v1') || '[]'));
  const [isDirectSaleMode, setIsDirectSaleMode] = useState(false);
  const [directSalePatientName, setDirectSalePatientName] = useState('');
  const [directSaleSearch, setDirectSaleSearch] = useState('');
  const [patientsDB, setPatientsDB] = useState<Patient[]>([]);

  // Persistencia
  useEffect(() => {
    localStorage.setItem('med_inventory_v6', JSON.stringify(stock));
    localStorage.setItem('med_movements_v6', JSON.stringify(movements));
  }, [stock, movements]);

  useEffect(() => {
    localStorage.setItem('med_pharmacy_archived_v1', JSON.stringify(archivedPrescriptions));
  }, [archivedPrescriptions]);

  useEffect(() => {
    setPatientsDB(JSON.parse(localStorage.getItem('med_patients_v6') || '[]'));
  }, []);

  // --- HELPERS ---
  const getTotalStock = (med: MedicationStock) => med.batches ? med.batches.reduce((acc, b) => acc + b.currentStock, 0) : 0;
  
  const getNextExpiry = (med: MedicationStock) => {
      if (!med.batches || med.batches.length === 0) return null;
      // Filtrar los que son N/A para el ordenamiento, o ponerlos al final
      const validDates = med.batches.filter(b => b.expiryDate !== 'N/A' && b.expiryDate !== '');
      if (validDates.length === 0) return med.batches.some(b => b.expiryDate === 'N/A') ? 'N/A' : null;

      const sorted = [...validDates].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      return sorted[0].expiryDate;
  };

  const getExpiryStatus = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return { color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'NO CADUCA' };
    
    const expiry = new Date(dateStr);
    const now = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(now.getMonth() + 3);

    if (expiry < now) return { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'CADUCADO' };
    if (expiry <= threeMonths) return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'PRÓXIMO' };
    return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'VIGENTE' };
  };

  const getPatientName = (id: string) => {
    const p = patientsDB.find(pt => pt.id === id);
    return p ? p.name : id;
  };

  const getPatientInfo = (id: string) => {
     const p = patientsDB.find(pt => pt.id === id);
     return p ? p : null;
  };

  const getTypeIcon = (type: SupplyType) => {
    switch (type) {
      case SupplyType.MEDICATION: return <Pill size={16} className="text-blue-500" />;
      case SupplyType.SOLUTION: return <Droplet size={16} className="text-cyan-500" />;
      case SupplyType.SURGICAL: return <Scissors size={16} className="text-slate-500" />;
      case SupplyType.EQUIPMENT: return <Monitor size={16} className="text-indigo-500" />;
      case SupplyType.HEALING_MATERIAL: return <Box size={16} className="text-emerald-500" />;
      default: return <Package size={16} className="text-slate-400" />;
    }
  };

  // Helper para obtener precio del catálogo vinculado
  const getItemPrice = (inventoryId: string): number => {
    const priceItem = prices.find(p => p.linkedInventoryId === inventoryId);
    return priceItem ? priceItem.price * (1 + priceItem.taxPercent / 100) : 0;
  };

  // --- ACTIONS ---

  const handleCreateMed = () => {
    // Validación: Si noExpiry es true, no pedimos fecha. Si es false, sí la pedimos.
    if (!medForm.name || !batchForm.batchNumber || (!batchForm.expiryDate && !noExpiry)) {
        alert("Complete los datos obligatorios (Nombre, Lote Inicial, Caducidad).");
        return;
    }
    
    const newMedId = generateId('MED');
    const newBatchId = generateId('BATCH');
    const initialQty = Number(batchForm.currentStock) || 0;

    const newMed: MedicationStock = {
        id: newMedId,
        name: medForm.name!.toUpperCase(),
        genericName: medForm.genericName?.toUpperCase() || '',
        presentation: medForm.presentation || 'Unidad',
        concentration: medForm.concentration || '',
        unit: medForm.unit || 'Pieza',
        supplier: medForm.supplier || '',
        registroCofepris: medForm.registroCofepris || '',
        category: medForm.category || MedicationCategory.GENERAL,
        supplyType: medForm.supplyType || SupplyType.MEDICATION,
        minStock: Number(medForm.minStock) || 10,
        idealStock: Number(medForm.idealStock) || 50, // NUEVO
        batches: [{
            id: newBatchId,
            batchNumber: batchForm.batchNumber!.toUpperCase(),
            expiryDate: noExpiry ? 'N/A' : batchForm.expiryDate!,
            currentStock: initialQty
        }]
    };

    setStock([newMed, ...stock]);
    
    if (initialQty > 0) {
        addLog(newMed.id, newMed.name, newMed.batches[0].batchNumber, 'IN', initialQty, 'Alta Inicial de Insumo');
    }
    setShowAddModal(false);
    resetForms();
  };

  const handleUpdateMedMaster = () => {
      if (!selectedMed || !medForm.name) return;
      
      setStock(prev => prev.map(m => m.id === selectedMed.id ? {
          ...m,
          name: medForm.name!.toUpperCase(),
          genericName: medForm.genericName?.toUpperCase() || '',
          presentation: medForm.presentation || '',
          concentration: medForm.concentration || '',
          category: medForm.category || MedicationCategory.GENERAL,
          supplyType: medForm.supplyType || SupplyType.MEDICATION,
          minStock: Number(medForm.minStock) || 10,
          idealStock: Number(medForm.idealStock) || 50 // NUEVO
      } : m));

      addLog(selectedMed.id, selectedMed.name, 'N/A', 'UPDATE', 0, `Edición Maestro: ${movementReason}`);
      setIsEditingMed(false);
      resetForms();
  };

  const handleAddBatch = () => {
      if (!selectedMed || !batchForm.batchNumber || (!batchForm.expiryDate && !noExpiry)) return;
      
      const newBatch: MedicationBatch = {
          id: generateId('BATCH'),
          batchNumber: batchForm.batchNumber.toUpperCase(),
          expiryDate: noExpiry ? 'N/A' : batchForm.expiryDate!,
          currentStock: Number(batchForm.currentStock) || 0
      };

      setStock(prev => prev.map(m => m.id === selectedMed.id ? { ...m, batches: [...m.batches, newBatch] } : m));
      
      if (newBatch.currentStock > 0) {
          addLog(selectedMed.id, selectedMed.name, newBatch.batchNumber, 'IN', newBatch.currentStock, 'Nuevo Lote Agregado');
      }
      setShowBatchModal(false);
      resetForms();
  };

  const handleDeleteBatch = (medId: string, batchId: string, currentQty: number, batchNum: string) => {
      if (currentQty > 0) {
          if (!window.confirm(`El lote ${batchNum} tiene ${currentQty} unidades. ¿Desea darlo de baja como merma?`)) return;
          addLog(medId, 'BAJA DE LOTE', batchNum, 'OUT', currentQty, 'Eliminación de Lote / Caducidad');
      }
      
      setStock(prev => prev.map(m => {
          if (m.id === medId) {
              return { ...m, batches: m.batches.filter(b => b.id !== batchId) };
          }
          return m;
      }).filter(m => m.batches.length > 0));
  };

  // FUNCION CORREGIDA: Eliminación Total con Registro en Kardex
  const handleDeleteMed = (med: MedicationStock) => {
      const total = getTotalStock(med);
      
      // Siempre pedir confirmación, incluso si es 0
      if (!window.confirm(`ATENCIÓN: ¿Está seguro de eliminar el insumo "${med.name}" del catálogo?\n\n• Se darán de baja ${total} unidades del inventario.\n• Se registrará la eliminación en el Kardex.\n• Esta acción no se puede deshacer.`)) {
          return;
      }

      // Crear log de salida definitiva
      const deleteLog: StockMovement = {
          id: generateId('MOV-DEL'),
          medicationId: med.id,
          medicationName: med.name,
          batch: 'BAJA-CATALOGO',
          type: 'OUT',
          quantity: total,
          reason: 'Eliminación definitiva de registro / Depuración',
          date: new Date().toLocaleString('es-MX'),
          responsible: 'Administrador Farmacia'
      };

      setMovements(prev => [deleteLog, ...prev]);
      setStock(prev => prev.filter(m => m.id !== med.id));
  };

  const handleStockMovement = () => {
      if (!selectedMed || !selectedBatchId || !movementType) return;
      
      const batchNum = selectedMed.batches.find(b => b.id === selectedBatchId)?.batchNumber || '???';
      const reason = movementType === 'OUT' ? `${outReasonCategory}: ${movementReason}` : movementReason;

      setStock(prev => prev.map(m => {
          if (m.id === selectedMed.id) {
              return {
                  ...m,
                  batches: m.batches.map(b => {
                      if (b.id === selectedBatchId) {
                          const newStock = movementType === 'IN' ? b.currentStock + movementQty : b.currentStock - movementQty;
                          if (newStock < 0) {
                              alert("Stock insuficiente en este lote");
                              return b; // Prevent update if insufficient stock
                          }
                          // Only log if update is successful
                          addLog(selectedMed.id, selectedMed.name, batchNum, movementType, movementQty, reason);
                          return { ...b, currentStock: newStock };
                      }
                      return b;
                  })
              };
          }
          return m;
      }));
      
      setShowMovementModal(false);
      resetForms();
  };

  // Función corregida para agregar logs con ID único garantizado
  const addLog = (medId: string, name: string, batch: string, type: 'IN'|'OUT'|'UPDATE', qty: number, reason: string) => {
      setMovements(prev => [{
          id: generateId('MOV'),
          medicationId: medId,
          medicationName: name,
          batch, type, quantity: qty, reason,
          date: new Date().toLocaleString('es-MX'),
          responsible: 'Farmacia'
      }, ...prev]);
  };

  const resetForms = () => {
      setMedForm({ name: '', genericName: '', presentation: 'Unidad', concentration: '', minStock: 10, idealStock: 50, category: MedicationCategory.GENERAL, supplyType: SupplyType.MEDICATION });
      setBatchForm({ batchNumber: '', expiryDate: '', currentStock: 0 });
      setMovementQty(0);
      setMovementReason('');
      setSelectedMed(null);
      setSelectedBatchId(null);
      setNoExpiry(false);
  };

  // --- DISPENSING LOGIC (RESTORED) ---

  const allNotes: ClinicalNote[] = useMemo(() => {
    return JSON.parse(localStorage.getItem('med_notes_v6') || '[]');
  }, [activeTab]); 

  const recentPrescriptions = useMemo(() => {
    return allNotes
      .filter(n => n.type === 'Receta Médica Electrónica')
      .filter(n => !archivedPrescriptions.includes(n.id))
      .sort((a, b) => {
         const timeA = parseInt(a.id.split('-')[1] || '0');
         const timeB = parseInt(b.id.split('-')[1] || '0');
         return timeB - timeA;
      }); 
  }, [allNotes, archivedPrescriptions]);

  const filteredPrescriptionsQueue = useMemo(() => {
    let list = recentPrescriptions;
    if (!showAllHistory) {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        list = list.filter(n => {
            const timestamp = parseInt(n.id.split('-')[1] || '0'); 
            return timestamp > oneDayAgo;
        });
    }
    if (!prescriptionSearch) return list;
    const lowerSearch = prescriptionSearch.toLowerCase();
    return list.filter(n => 
      n.content.folio?.toLowerCase().includes(lowerSearch) ||
      n.patientId?.toLowerCase().includes(lowerSearch) ||
      getPatientName(n.patientId).toLowerCase().includes(lowerSearch)
    );
  }, [recentPrescriptions, prescriptionSearch, showAllHistory, patientsDB]);

  const stockSearchResults = useMemo(() => {
    if (!directSaleSearch) return [];
    const term = directSaleSearch.toLowerCase();
    return stock.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.genericName.toLowerCase().includes(term)
    );
  }, [stock, directSaleSearch]);

  const selectPrescriptionFromQueue = (note: ClinicalNote) => {
    setFoundPrescription(note);
    setDispenseQuantities({});
    setSessionCart([]); // Resetear carrito al cambiar receta
    setIsDirectSaleMode(false);
  };

  const archivePrescription = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (window.confirm("¿Archivar esta receta? Se marcará como 'Surtido Externo' y saldrá de la cola de pendientes.")) {
        setArchivedPrescriptions(prev => [...prev, noteId]);
    }
  };

  const checkAvailability = (meds: any[]) => {
    if (!meds || meds.length === 0) return 'Sin Items';
    let availableCount = 0;
    meds.forEach((med: any) => {
        const stockItem = stock.find(s => 
            s.name.toUpperCase() === med.name.toUpperCase() || 
            s.genericName.toUpperCase() === med.genericName?.toUpperCase()
        );
        if (stockItem && getTotalStock(stockItem) > 0) availableCount++;
    });
    
    if (availableCount === meds.length) return 'Disponible';
    if (availableCount === 0) return 'Sin Stock';
    return 'Parcial';
  };

  // Función modificada para añadir al carrito de sesión con TRANSACCIÓN ATÓMICA
  const handleDispenseItem = (medName: string, medGeneric: string, requestedId: string, isExtra: boolean = false, qtyOverride?: number) => {
    // Si se pasa override (desde venta directa), se usa ese. Si no, se busca en el estado (desde surtido receta)
    const qtyToDispense = qtyOverride !== undefined ? qtyOverride : (dispenseQuantities[requestedId] || 0);
    
    if (qtyToDispense <= 0) {
        alert("Ingrese una cantidad válida a surtir.");
        return;
    }

    const stockItemIndex = stock.findIndex(s => 
        s.name.toUpperCase() === medName.toUpperCase() || 
        s.genericName.toUpperCase() === medGeneric?.toUpperCase()
    );

    if (stockItemIndex === -1) {
        alert("Este medicamento no se encuentra registrado en el inventario.");
        return;
    }

    const med = stock[stockItemIndex];
    const totalAvailable = getTotalStock(med);

    if (totalAvailable < qtyToDispense) {
        alert(`Stock insuficiente. Solo hay ${totalAvailable} unidades disponibles (suma de todos los lotes).`);
        return;
    }

    // LÓGICA FEFO (First Expired First Out)
    const sortedBatches = [...med.batches].sort((a, b) => {
        if (a.expiryDate === 'N/A') return 1;
        if (b.expiryDate === 'N/A') return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    let remainingToDispense = qtyToDispense;
    
    // Arrays para acumular cambios antes de actualizar estado
    const newLogs: StockMovement[] = [];
    const newCartItems: CartItem[] = [];

    const updatedBatches = sortedBatches.map(batch => {
        if (remainingToDispense <= 0) return batch;
        
        if (batch.currentStock > 0) {
            const take = Math.min(remainingToDispense, batch.currentStock);
            remainingToDispense -= take;
            
            const patientName = isDirectSaleMode 
                ? (directSalePatientName || 'Venta Mostrador') 
                : getPatientName(foundPrescription?.patientId || '');
            const reasonPrefix = isDirectSaleMode ? "Venta Directa" : `Receta #${foundPrescription?.content.folio || 'S/F'}`;
            const extraLabel = isExtra ? " (Adicional)" : "";
            
            // Preparar Log con ID único garantizado
            newLogs.push({
                id: generateId('MOV'),
                medicationId: med.id,
                medicationName: med.name,
                batch: batch.batchNumber,
                type: 'OUT',
                quantity: take,
                reason: `${reasonPrefix} - Paciente: ${patientName}${extraLabel}`,
                date: new Date().toLocaleString('es-MX'),
                responsible: 'Farmacia'
            });
            
            // Preparar item para Carrito - AHORA CON PRECIO
            newCartItems.push({ 
                id: generateId('CART'), 
                medId: med.id, 
                name: med.name, 
                batch: batch.batchNumber, 
                quantity: take, 
                isExtra,
                price: getItemPrice(med.id) // Vinculación de precio
            });

            return { ...batch, currentStock: batch.currentStock - take };
        }
        return batch;
    });

    // Actualización de estado en BATCH para evitar condiciones de carrera
    const newStock = [...stock];
    newStock[stockItemIndex] = { ...med, batches: updatedBatches };
    
    setStock(newStock);
    setMovements(prev => [...newLogs, ...prev]); // IMPORTANTE: Agregar nuevos logs al inicio
    setSessionCart(prev => [...prev, ...newCartItems]);
    
    setDispenseQuantities(prev => ({ ...prev, [requestedId]: 0 }));
  };

  // Helper para obtener cantidad surtida en sesión actual de un medicamento específico
  const getSessionDispensedQty = (medId: string) => {
     return sessionCart.filter(item => item.medId === medId).reduce((acc, curr) => acc + curr.quantity, 0);
  };

  // NUEVO: Finalización correcta de transacción con TICKET y CUENTA
  const handleFinalizeTransaction = () => {
    if (sessionCart.length === 0) {
        setFoundPrescription(null);
        setIsDirectSaleMode(false);
        return;
    }
    
    // Si hay items, mostramos ticket
    setShowTicketModal(true);
  };

  // Función real de cierre tras ver ticket
  const confirmCloseTransaction = () => {
    // Si hay paciente identificado, agregar a su cuenta
    if (foundPrescription?.patientId) {
        const patientAccount = JSON.parse(localStorage.getItem('med_accounts_v1') || '[]') as PatientAccount[];
        let acc = patientAccount.find(a => a.patientId === foundPrescription.patientId && a.status === 'Abierta');
        
        // Crear items de cargo para la cuenta
        const newCharges = sessionCart.map(item => ({
            id: `CHG-${Date.now()}-${Math.random()}`,
            date: new Date().toLocaleString('es-MX'),
            concept: `${item.name} (${item.quantity})`,
            quantity: item.quantity,
            unitPrice: item.price || 0,
            total: (item.price || 0) * item.quantity,
            type: 'Farmacia',
            status: 'Pendiente'
        }));

        if (acc) {
            acc.charges.push(...newCharges as any);
            acc.balance += newCharges.reduce((s, c) => s + c.total, 0);
        } else {
            // Si no existe, crear (aunque Billing debería manejar esto, lo hacemos defensivo)
            acc = {
                patientId: foundPrescription.patientId,
                charges: newCharges as any,
                payments: [],
                balance: newCharges.reduce((s, c) => s + c.total, 0),
                status: 'Abierta'
            };
            patientAccount.push(acc);
        }
        localStorage.setItem('med_accounts_v1', JSON.stringify(patientAccount));
    }

    // Limpieza
    setShowTicketModal(false);
    setFoundPrescription(null);
    setIsDirectSaleMode(false);
    setSessionCart([]);
    setDirectSalePatientName('');
    setDispenseQuantities({});
  };

  // --- RENDER HELPERS ---
  const filteredStock = useMemo(() => {
      const term = searchTerm.toLowerCase();
      return stock.filter(m => m.name.toLowerCase().includes(term) || m.genericName.toLowerCase().includes(term));
  }, [stock, searchTerm]);

  // Filtro de Kardex
  const filteredMovements = useMemo(() => {
      if (!kardexSearch) return movements;
      const term = kardexSearch.toLowerCase();
      return movements.filter(m => 
          m.medicationName.toLowerCase().includes(term) || 
          m.reason.toLowerCase().includes(term) ||
          m.batch.toLowerCase().includes(term)
      );
  }, [movements, kardexSearch]);

  // Filtro de Reposición (Stock < Ideal)
  const replenishmentList = useMemo(() => {
      return stock.filter(m => {
          const total = getTotalStock(m);
          return total < (m.idealStock || m.minStock);
      });
  }, [stock]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in">
       {/* HEADER & TABS */}
       <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
          <div>
             <h1 className="text-4xl font-black text-slate-900 uppercase">Farmacia Central</h1>
             <p className="text-slate-500 text-sm font-bold uppercase mt-1">Gestión de Lotes e Insumos Médicos</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
             {['stock', 'dispense', 'movements', 'replenish'].map((t: any) => (
                <button key={t} onClick={() => { setActiveTab(t); setFoundPrescription(null); setIsDirectSaleMode(false); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                   {t === 'stock' ? 'Inventario' : t === 'dispense' ? 'Surtido' : t === 'movements' ? 'Kardex' : 'Reposición'}
                </button>
             ))}
          </div>
          <button onClick={() => { resetForms(); setShowAddModal(true); }} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-2">
             <Plus size={16} /> Nuevo Insumo
          </button>
       </div>

       {activeTab === 'stock' && (
         <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px]">
            <div className="p-8 border-b border-slate-100 flex items-center gap-4">
               <Search className="text-slate-400" />
               <input className="flex-1 bg-transparent text-sm font-bold outline-none uppercase placeholder-slate-300" placeholder="Buscar medicamento, material, solución..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                        <th className="px-8 py-4 w-10"></th>
                        <th className="px-4 py-4">Descripción</th>
                        <th className="px-4 py-4 text-center">Tipo</th>
                        <th className="px-4 py-4 text-center">Stock / Ideal</th>
                        <th className="px-4 py-4">Próx. Caducidad</th>
                        <th className="px-8 py-4 text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredStock.map(med => {
                        const total = getTotalStock(med);
                        const nextExp = getNextExpiry(med);
                        const expStatus = getExpiryStatus(nextExp || '');
                        const isExpanded = expandedMedId === med.id;

                        return (
                           <React.Fragment key={med.id}>
                              <tr className={`hover:bg-slate-50 transition-all cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`} onClick={() => setExpandedMedId(isExpanded ? null : med.id)}>
                                 <td className="px-8 py-6 text-slate-400"><ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90 text-blue-600' : ''}`} /></td>
                                 <td className="px-4 py-6">
                                    <p className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                                       {getTypeIcon(med.supplyType || SupplyType.MEDICATION)} {med.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{med.genericName} • {med.presentation}</p>
                                 </td>
                                 <td className="px-4 py-6 text-center">
                                    <span className="px-2 py-1 rounded bg-slate-100 text-[9px] font-bold uppercase text-slate-500 border border-slate-200">{med.supplyType || 'Medicamento'}</span>
                                 </td>
                                 <td className="px-4 py-6 text-center">
                                    <span className={`text-lg font-black ${total <= med.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{total}</span>
                                    <span className="text-slate-300 text-xs mx-1">/</span>
                                    <span className="text-xs font-bold text-emerald-600">{med.idealStock || 50}</span>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">{med.unit}</p>
                                 </td>
                                 <td className="px-4 py-6">
                                    {nextExp ? (
                                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase ${expStatus.color}`}>
                                          <Calendar size={10} /> {nextExp}
                                       </div>
                                    ) : <span className="text-[9px] text-slate-300 font-bold uppercase">Sin Lotes</span>}
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                       <button onClick={() => { setSelectedMed(med); setShowBatchModal(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all" title="Agregar Lote"><Layers size={16}/></button>
                                       <button onClick={() => { setSelectedMed(med); setMedForm(med); setIsEditingMed(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-all" title="Editar Maestro"><Edit size={16}/></button>
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteMed(med); }} 
                                          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-all" 
                                          title="Borrar Fármaco"
                                       >
                                          <Trash2 size={16}/>
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                              {isExpanded && (
                                 <tr className="bg-slate-50/50">
                                    <td colSpan={6} className="px-12 py-6">
                                       <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                          <table className="w-full text-left">
                                             <thead className="bg-slate-100 text-[8px] font-black text-slate-500 uppercase">
                                                <tr>
                                                   <th className="px-6 py-3">Lote</th>
                                                   <th className="px-6 py-3">Caducidad</th>
                                                   <th className="px-6 py-3 text-center">Stock Lote</th>
                                                   <th className="px-6 py-3 text-right">Gestión</th>
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-slate-100">
                                                {med.batches.map(b => (
                                                   <tr key={b.id}>
                                                      <td className="px-6 py-3 font-mono font-bold text-xs uppercase text-slate-700">{b.batchNumber}</td>
                                                      <td className="px-6 py-3 text-xs font-bold text-slate-600">{b.expiryDate === 'N/A' ? 'NO CADUCA' : b.expiryDate}</td>
                                                      <td className="px-6 py-3 text-center font-black text-slate-900">{b.currentStock}</td>
                                                      <td className="px-6 py-3 text-right flex justify-end gap-2">
                                                         <button onClick={() => { setSelectedMed(med); setSelectedBatchId(b.id); setMovementType('IN'); setShowMovementModal(true); }} className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"><ArrowUpRight size={12}/></button>
                                                         <button onClick={() => { setSelectedMed(med); setSelectedBatchId(b.id); setMovementType('OUT'); setShowMovementModal(true); }} className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"><ArrowDownLeft size={12}/></button>
                                                         <button onClick={() => handleDeleteBatch(med.id, b.id, b.currentStock, b.batchNumber)} className="p-1.5 rounded bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all ml-2"><Trash2 size={12}/></button>
                                                      </td>
                                                   </tr>
                                                ))}
                                                {med.batches.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-[10px] italic text-slate-400">No hay lotes activos. Agregue uno para iniciar stock.</td></tr>}
                                             </tbody>
                                          </table>
                                       </div>
                                    </td>
                                 </tr>
                              )}
                           </React.Fragment>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
       )}

       {/* KARDEX TAB */}
       {activeTab === 'movements' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] animate-in slide-in-from-right-4">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                   <FileSpreadsheet className="text-blue-600" />
                   <h3 className="text-xl font-black text-slate-900 uppercase">Bitácora de Movimientos</h3>
                </div>
                <div className="relative w-96">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none uppercase" 
                      placeholder="Buscar por insumo, lote o responsable..." 
                      value={kardexSearch}
                      onChange={e => setKardexSearch(e.target.value)}
                   />
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="px-8 py-5">Fecha / Hora</th>
                         <th className="px-6 py-5">Insumo</th>
                         <th className="px-4 py-5 text-center">Lote</th>
                         <th className="px-4 py-5 text-center">Movimiento</th>
                         <th className="px-4 py-5 text-center">Cantidad</th>
                         <th className="px-8 py-5">Motivo / Referencia</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredMovements.map((m) => (
                         <tr key={m.id} className="hover:bg-slate-50 transition-all group">
                            <td className="px-8 py-4">
                               <p className="text-[10px] font-bold text-slate-600">{m.date.split(',')[0]}</p>
                               <p className="text-[9px] font-mono text-slate-400">{m.date.split(',')[1]}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-xs font-black text-slate-900 uppercase">{m.medicationName}</p>
                            </td>
                            <td className="px-4 py-4 text-center text-[10px] font-mono font-bold text-slate-500">{m.batch}</td>
                            <td className="px-4 py-4 text-center">
                               <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${
                                  m.type === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                  m.type === 'OUT' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                               }`}>
                                  {m.type === 'IN' ? 'Entrada' : m.type === 'OUT' ? 'Salida' : 'Ajuste'}
                               </span>
                            </td>
                            <td className="px-4 py-4 text-center font-black text-slate-900 text-sm">{m.quantity}</td>
                            <td className="px-8 py-4 text-[10px] font-medium text-slate-600 uppercase max-w-xs truncate" title={m.reason}>
                               {m.reason}
                            </td>
                         </tr>
                      ))}
                      {filteredMovements.length === 0 && (
                         <tr><td colSpan={6} className="py-20 text-center opacity-30 text-xs font-black uppercase text-slate-400 tracking-widest">Sin movimientos registrados</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       )}

       {/* REPLENISHMENT REPORT (NUEVO) */}
       {activeTab === 'replenish' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] animate-in slide-in-from-right-4">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between gap-4 bg-amber-50/50">
                <div className="flex items-center gap-4 flex-1">
                   <Truck className="text-amber-600" />
                   <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase">Análisis de Reposición</h3>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Comparativa Stock Actual vs Ideal</p>
                   </div>
                </div>
                <button onClick={() => window.print()} className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-900 transition-all">
                   <Printer size={16} /> Imprimir Orden de Compra
                </button>
             </div>
             
             <div className="overflow-x-auto p-8">
                <table className="w-full text-left">
                   <thead className="bg-amber-100 text-[9px] font-black uppercase text-amber-800 tracking-widest rounded-xl">
                      <tr>
                         <th className="px-6 py-4 rounded-l-xl">Insumo / Descripción</th>
                         <th className="px-4 py-4 text-center">Stock Actual</th>
                         <th className="px-4 py-4 text-center">Stock Ideal</th>
                         <th className="px-4 py-4 text-center">Déficit</th>
                         <th className="px-4 py-4 text-center rounded-r-xl">Estado</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-amber-50">
                      {replenishmentList.map(med => {
                         const total = getTotalStock(med);
                         const ideal = med.idealStock || med.minStock || 50;
                         const deficit = ideal - total;
                         return (
                            <tr key={med.id} className="hover:bg-amber-50/30">
                               <td className="px-6 py-4">
                                  <p className="text-xs font-black text-slate-900 uppercase">{med.name}</p>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase">{med.genericName}</p>
                               </td>
                               <td className="px-4 py-4 text-center font-bold text-slate-700">{total}</td>
                               <td className="px-4 py-4 text-center font-bold text-blue-600">{ideal}</td>
                               <td className="px-4 py-4 text-center font-black text-rose-600 text-lg">{deficit}</td>
                               <td className="px-4 py-4 text-center">
                                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[8px] font-black uppercase border border-rose-200">
                                     Pedir Urgente
                                  </span>
                               </td>
                            </tr>
                         );
                      })}
                      {replenishmentList.length === 0 && (
                         <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase text-xs">Inventario saludable. No se requieren compras.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       )}

       {/* DISPENSE TAB (RESTORED UI) */}
       {activeTab === 'dispense' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right-4">
           {/* Panel de Surtido / Cola de Recetas */}
           {foundPrescription || isDirectSaleMode ? (
             <div className="lg:col-span-12">
               <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => { setFoundPrescription(null); setIsDirectSaleMode(false); setSessionCart([]); }} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all">
                     <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-xl font-black uppercase text-slate-900">
                     {isDirectSaleMode ? "Venta Directa / Sin Receta" : "Surtido de Receta"}
                  </h3>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* DETALLES DE LA RECETA / CARRITO / PACIENTE (IZQUIERDA) */}
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border-b-8 border-blue-500">
                        {isDirectSaleMode ? (
                           <div className="relative z-10 space-y-4">
                              <div>
                                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Nombre del Paciente (Opcional)</p>
                                 <input 
                                    className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-sm font-black uppercase text-white placeholder-white/30 outline-none mt-1"
                                    placeholder="CLIENTE MOSTRADOR"
                                    value={directSalePatientName}
                                    onChange={e => setDirectSalePatientName(e.target.value)}
                                 />
                              </div>
                              <div className="pt-2">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                                 <p className="text-sm font-bold uppercase">{new Date().toLocaleDateString()}</p>
                              </div>
                           </div>
                        ) : (
                           <div className="relative z-10 space-y-4">
                              <div>
                                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Paciente</p>
                                 <p className="text-xl font-black">{getPatientName(foundPrescription!.patientId)}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Folio Receta</p>
                                 <p className="text-sm font-bold uppercase">{foundPrescription!.content.folio}</p>
                              </div>
                              <div className="pt-4 border-t border-white/10">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} /> Fecha Emisión
                                 </p>
                                 <p className="text-sm font-bold uppercase">{foundPrescription!.date}</p>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Buscador de Insumos Adicionales / Venta Directa */}
                     <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <ShoppingCart size={14} className="text-blue-600" /> 
                           {isDirectSaleMode ? "Buscar Productos" : "Agregar Insumo Adicional"}
                        </label>
                        <div className="relative">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                           <input 
                              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-100"
                              placeholder="Buscar medicamento..."
                              value={directSaleSearch}
                              onChange={e => setDirectSaleSearch(e.target.value)}
                           />
                           {directSaleSearch && (
                              <button onClick={() => setDirectSaleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                                 <X size={14} />
                              </button>
                           )}
                        </div>
                        {stockSearchResults.length > 0 && (
                           <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                              {stockSearchResults.map(s => {
                                 const price = getItemPrice(s.id);
                                 return (
                                 <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 transition-all">
                                    <div>
                                       <p className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-1">
                                          {getTypeIcon(s.supplyType)} {s.name}
                                       </p>
                                       <p className="text-[8px] text-slate-500 font-bold uppercase">{s.genericName} • Stock: {getTotalStock(s)}</p>
                                       <p className="text-[9px] font-black text-blue-600">${price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <input 
                                          type="number" 
                                          min="1" 
                                          className="w-10 text-center bg-white border rounded text-xs" 
                                          defaultValue={1}
                                          id={`qty-${s.id}`}
                                       />
                                       <button 
                                          onClick={() => {
                                             const qtyInput = document.getElementById(`qty-${s.id}`) as HTMLInputElement;
                                             const qty = parseInt(qtyInput.value) || 1;
                                             handleDispenseItem(s.name, s.genericName, `EXTRA-${s.id}`, true, qty);
                                             setDirectSaleSearch('');
                                          }}
                                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-slate-900 transition-colors"
                                       >
                                          <Plus size={14} />
                                       </button>
                                    </div>
                                 </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>

                     {/* CARRITO DE SESIÓN (NUEVO) */}
                     {sessionCart.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-[2.5rem] p-6 shadow-sm space-y-4 animate-in slide-in-from-bottom-4">
                           <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-200 pb-2">
                              <ShoppingBag size={14} /> Resumen de Transacción / Carrito
                           </h4>
                           <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                              {sessionCart.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-[10px]">
                                    <div className="flex-1">
                                       <p className="font-bold text-emerald-900 uppercase">{item.name}</p>
                                       <p className="text-[8px] text-emerald-700">Lote: {item.batch}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="font-black text-emerald-800">{item.quantity} pzas</p>
                                       <p className="font-bold text-emerald-600">${((item.price || 0) * item.quantity).toFixed(2)}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <div className="pt-2 border-t border-emerald-200 flex justify-between items-end">
                              <p className="text-xs font-black text-emerald-900 uppercase">
                                 Total Ítems: {sessionCart.length}
                              </p>
                              <p className="text-lg font-black text-emerald-700">
                                 ${sessionCart.reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0).toFixed(2)}
                              </p>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* LISTA DE ITEMS (DERECHA) */}
                  <div className="lg:col-span-8 space-y-4">
                     {foundPrescription && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                           <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-lg font-black uppercase text-slate-900 tracking-tight flex items-center gap-3">
                                 <Pill className="text-emerald-600" /> Medicamentos Recetados
                              </h3>
                           </div>
                           <div className="divide-y divide-slate-50">
                              {foundPrescription.content.meds?.map((med: any, idx: number) => {
                                 const stockItem = stock.find(s => 
                                    s.name.toUpperCase() === med.name.toUpperCase() || 
                                    s.genericName.toUpperCase() === med.genericName?.toUpperCase()
                                 );
                                 const availableQty = stockItem ? getTotalStock(stockItem) : 0;
                                 const isAvailable = availableQty > 0;
                                 
                                 // Verificar si ya se surtió en esta sesión
                                 const dispensedInSession = getSessionDispensedQty(stockItem?.id || 'XX');

                                 return (
                                    <div key={idx} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${dispensedInSession > 0 ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}>
                                       <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-1">
                                             <span className="w-6 h-6 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                             <p className="text-sm font-black text-slate-900 uppercase">{med.name}</p>
                                             {dispensedInSession > 0 && (
                                                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded border border-emerald-200 flex items-center gap-1">
                                                   <CheckCircle2 size={10} /> Entregado: {dispensedInSession}
                                                </span>
                                             )}
                                          </div>
                                          <p className="text-[10px] text-slate-500 font-bold uppercase pl-9">{med.genericName} • {med.dosage}</p>
                                          <p className="text-[9px] text-blue-600 font-medium pl-9 mt-1 italic">"{med.instructions}"</p>
                                       </div>

                                       <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                          <div className="text-right px-2">
                                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Existencia</p>
                                             <p className={`text-lg font-black ${isAvailable ? 'text-slate-900' : 'text-rose-500'}`}>
                                                {availableQty}
                                             </p>
                                          </div>
                                          
                                          {stockItem ? (
                                             <div className="flex items-center gap-2">
                                                <div className="flex flex-col gap-1">
                                                   <input 
                                                      type="number" 
                                                      min="0"
                                                      max={availableQty}
                                                      className="w-16 p-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-sm outline-none"
                                                      placeholder="Cant."
                                                      value={dispenseQuantities[med.id] || ''}
                                                      onChange={(e) => setDispenseQuantities({...dispenseQuantities, [med.id]: parseInt(e.target.value)})}
                                                   />
                                                   <button 
                                                      onClick={() => setDispenseQuantities({...dispenseQuantities, [med.id]: availableQty})}
                                                      className="text-[8px] font-black text-blue-500 hover:text-blue-700 uppercase"
                                                   >
                                                      MÁX
                                                   </button>
                                                </div>
                                                <button 
                                                   onClick={() => handleDispenseItem(med.name, med.genericName, med.id)}
                                                   className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                   disabled={!isAvailable}
                                                   title="Confirmar Entrega"
                                                >
                                                   <CheckCircle2 size={18} />
                                                </button>
                                             </div>
                                          ) : (
                                             <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase">No Catalogado</span>
                                          )}
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}

                     {/* Boton Finalizar */}
                     <div className="flex justify-end pt-4">
                        <button 
                           onClick={handleFinalizeTransaction}
                           className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3"
                        >
                           <CheckCircle2 size={18} /> Finalizar Transacción
                        </button>
                     </div>
                  </div>
               </div>
             </div>
           ) : (
             // VISTA DE COLA DE RECETAS (DASHBOARD FARMACIA)
             <div className="lg:col-span-12 space-y-8">
               {/* ... (Resto de la vista igual) ... */}
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                     <ShoppingBag className="text-blue-600" /> Cola de Surtido
                  </h3>
                  
                  <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setIsDirectSaleMode(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                     >
                        <ShoppingCart size={16} /> Venta Mostrador / Sin Receta
                     </button>

                     {/* Toggle de Historial */}
                     <button 
                        onClick={() => setShowAllHistory(!showAllHistory)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${showAllHistory ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500'}`}
                     >
                        <RefreshCw size={14} /> {showAllHistory ? 'Viendo Historial Total' : 'Solo Recientes (24h)'}
                     </button>

                     <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                           className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                           placeholder="Buscar por Paciente o Folio..."
                           value={prescriptionSearch}
                           onChange={e => setPrescriptionSearch(e.target.value)}
                        />
                     </div>
                  </div>
               </div>

               {filteredPrescriptionsQueue.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredPrescriptionsQueue.map((note) => {
                        // Calcular estado de disponibilidad simple
                        const availability = checkAvailability(note.content.meds);
                        const isAvailable = availability === 'Disponible';
                        const patientInfo = getPatientInfo(note.patientId);
                        const patientName = patientInfo?.name || note.patientId;
                        
                        return (
                           <div 
                              key={note.id}
                              className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-blue-400 transition-all text-left flex flex-col justify-between h-72 group relative"
                           >
                              <div className="space-y-4 cursor-pointer" onClick={() => selectPrescriptionFromQueue(note)}>
                                 <div className="flex justify-between items-start">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                       <FileText size={20} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                          <Clock size={10} /> {note.date.split(',')[1]}
                                       </span>
                                       <span className="text-[8px] font-black text-slate-300 uppercase">{note.date.split(',')[0]}</span>
                                    </div>
                                 </div>
                                 
                                 <div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1 line-clamp-2 leading-tight">
                                       {patientName} 
                                    </h4>
                                    <div className="flex gap-2 mt-1">
                                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                                          {note.content.folio}
                                       </span>
                                       {patientInfo && (
                                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                                             {patientInfo.sex} • {patientInfo.age}A
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-3 pt-2 border-t border-slate-50">
                                 <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                    <span className="text-slate-500">{note.content.meds?.length || 0} Items</span>
                                    <span className={`px-3 py-1 rounded-lg border ${isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : availability === 'Parcial' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                       {availability}
                                    </span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <p className="text-[8px] font-bold text-slate-300 uppercase truncate max-w-[150px]">{note.author}</p>
                                    <div className="flex gap-2">
                                       <button 
                                          onClick={() => selectPrescriptionFromQueue(note)}
                                          className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-center text-[9px] font-black uppercase text-slate-400 hover:bg-slate-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                                       >
                                          Surtir
                                       </button>
                                       <button 
                                          onClick={(e) => archivePrescription(e, note.id)}
                                          className="w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                          title="Marcar como Surtido Externo / Archivar"
                                       >
                                          <Archive size={14} />
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                     <ShoppingBag size={64} className="text-slate-400 mb-4" />
                     <p className="text-lg font-black text-slate-400 uppercase tracking-widest">
                        {showAllHistory ? "No hay historial de recetas" : "Sin recetas pendientes recientes (24h)"}
                     </p>
                     {!showAllHistory && (
                        <button onClick={() => setShowAllHistory(true)} className="mt-4 text-xs font-bold text-blue-500 underline">
                           Ver historial completo
                        </button>
                     )}
                  </div>
               )}
             </div>
           )}
        </div>
       )}

       {/* MODALES SE MANTIENEN IGUAL PERO CON SUPPLY TYPE EN ADD MODAL */}
       {(showAddModal || isEditingMed) && (
          <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                   <h3 className="text-2xl font-black text-slate-900 uppercase">{isEditingMed ? 'Editar Ficha Maestra' : 'Alta de Nuevo Insumo'}</h3>
                   {isEditingMed && <div className="px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase">Modo Edición</div>}
                </div>
                
                {isEditingMed && (
                   <div className="space-y-2 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <label className="text-[9px] font-black uppercase text-amber-600">Motivo de la Edición (Auditoría)</label>
                      <input className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold" placeholder="Ej: Corrección ortográfica" value={movementReason} onChange={e => setMovementReason(e.target.value)} />
                   </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nombre Comercial / Descripción</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:border-blue-500" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} placeholder="Ej: PARACETAMOL / JERINGA 5ML" />
                   </div>
                   
                   {/* NUEVO: Selector de Tipo de Insumo */}
                   <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tipo de Insumo</label>
                      <div className="flex flex-wrap gap-2">
                         {Object.values(SupplyType).map((type) => (
                            <button 
                               key={type}
                               onClick={() => setMedForm({...medForm, supplyType: type})}
                               className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${medForm.supplyType === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                               {type}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Sustancia Activa / Especificación</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-blue-500" value={medForm.genericName} onChange={e => setMedForm({...medForm, genericName: e.target.value})} placeholder="Ej: PARACETAMOL / PLÁSTICO GRADO MÉDICO" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Presentación</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.presentation} onChange={e => setMedForm({...medForm, presentation: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Concentración / Medida</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.concentration} onChange={e => setMedForm({...medForm, concentration: e.target.value})} />
                   </div>
                   
                   {/* NUEVO CAMPO: Stock Ideal para reposición */}
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Stock Mínimo (Alerta)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.minStock} onChange={e => setMedForm({...medForm, minStock: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-blue-600 ml-2">Stock Ideal (Reposición)</label>
                      <input type="number" className="w-full p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold uppercase" value={medForm.idealStock} onChange={e => setMedForm({...medForm, idealStock: parseInt(e.target.value) || 0})} />
                   </div>
                </div>

                {!isEditingMed && (
                   <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 grid grid-cols-2 gap-4">
                      <div className="col-span-2 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-200 pb-2 mb-2">Datos del Primer Lote</div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black uppercase text-slate-400">Lote</label>
                         <input className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-mono font-bold uppercase" value={batchForm.batchNumber} onChange={e => setBatchForm({...batchForm, batchNumber: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between items-end">
                            <label className="text-[8px] font-black uppercase text-slate-400">Caducidad</label>
                            <button onClick={() => { setNoExpiry(!noExpiry); if(!noExpiry) setBatchForm({...batchForm, expiryDate: ''}); }} className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${noExpiry ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-300'}`}>
                               {noExpiry ? 'N/A' : 'Fecha'}
                            </button>
                         </div>
                         {noExpiry ? (
                            <div className="w-full p-3 bg-slate-200 border border-slate-300 rounded-xl text-xs font-black text-slate-500 text-center uppercase tracking-widest">No Caduca</div>
                         ) : (
                            <input type="date" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} />
                         )}
                      </div>
                      <div className="col-span-2 space-y-1">
                         <label className="text-[8px] font-black uppercase text-slate-400">Stock Inicial</label>
                         <input type="number" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-lg font-black text-center" value={batchForm.currentStock} onChange={e => setBatchForm({...batchForm, currentStock: parseInt(e.target.value) || 0})} />
                      </div>
                   </div>
                )}

                <div className="flex gap-4">
                   <button onClick={() => { setShowAddModal(false); setIsEditingMed(false); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                   <button onClick={isEditingMed ? handleUpdateMedMaster : handleCreateMed} className="flex-[2] py-4 bg-slate-900 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl hover:bg-blue-600">{isEditingMed ? 'Guardar Cambios' : 'Registrar Insumo'}</button>
                </div>
             </div>
          </div>
       )}

       {/* MODAL TICKET DE VENTA (NUEVO) */}
       {showTicketModal && (
          <div className="fixed inset-0 z-[400] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
             <div className="bg-white w-80 rounded-none shadow-2xl p-6 text-center animate-in zoom-in-95 font-mono">
                <div className="border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                   <h2 className="text-xl font-bold uppercase">Farmacia Central</h2>
                   <p className="text-xs uppercase">Hospital San Rafael</p>
                   <p className="text-[10px] mt-2">{new Date().toLocaleString()}</p>
                   {directSalePatientName && <p className="text-[10px] font-bold mt-1 uppercase">CLTE: {directSalePatientName}</p>}
                </div>
                
                <div className="text-left text-xs space-y-2 mb-4">
                   {sessionCart.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                         <span>{item.quantity} x {item.name.substr(0,15)}</span>
                         <span>${((item.price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                   ))}
                </div>

                <div className="border-t-2 border-dashed border-slate-300 pt-4 mb-6">
                   <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL</span>
                      <span>${sessionCart.reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0).toFixed(2)}</span>
                   </div>
                </div>

                <div className="space-y-2 no-print">
                   <button onClick={() => window.print()} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-xs font-bold uppercase rounded">Imprimir Ticket</button>
                   <button onClick={confirmCloseTransaction} className="w-full py-3 bg-slate-900 text-white hover:bg-blue-600 text-xs font-bold uppercase rounded">Cerrar Venta</button>
                </div>
             </div>
          </div>
       )}

       {/* MODAL AGREGAR LOTE */}
       {showBatchModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95">
                <h3 className="text-xl font-black text-slate-900 uppercase">Agregar Nuevo Lote</h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                   <p className="text-xs font-black uppercase text-slate-900">{selectedMed?.name}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedMed?.genericName}</p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Número de Lote</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black uppercase" value={batchForm.batchNumber} onChange={e => setBatchForm({...batchForm, batchNumber: e.target.value})} placeholder="LOTE-000" />
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-end px-2 mb-1">
                         <label className="text-[9px] font-black uppercase text-slate-400">Fecha Caducidad</label>
                         <button 
                           onClick={() => { setNoExpiry(!noExpiry); if(!noExpiry) setBatchForm({...batchForm, expiryDate: ''}); }} 
                           className={`flex items-center gap-1 text-[8px] font-bold uppercase px-3 py-1 rounded-lg border transition-all ${noExpiry ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}
                         >
                            <CalendarOff size={10} /> {noExpiry ? 'Sin Caducidad' : 'Aplica Caducidad'}
                         </button>
                      </div>
                      {noExpiry ? (
                         <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                            NO APLICA / NO CADUCA
                         </div>
                      ) : (
                         <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} />
                      )}
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Cantidad Recibida</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={batchForm.currentStock} onChange={e => setBatchForm({...batchForm, currentStock: parseInt(e.target.value) || 0})} />
                   </div>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setShowBatchModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                   <button onClick={handleAddBatch} className="flex-[2] py-4 bg-emerald-600 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl hover:bg-emerald-700">Ingresar Lote</button>
                </div>
             </div>
          </div>
       )}

       {/* MODAL MOVIMIENTOS STOCK (IN/OUT) */}
       {showMovementModal && selectedMed && selectedBatchId && (
          <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${movementType === 'IN' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {movementType === 'IN' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase">{movementType === 'IN' ? 'Entrada' : 'Salida'} de Stock</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Lote: {selectedMed.batches.find(b => b.id === selectedBatchId)?.batchNumber}</p>
                   </div>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Cantidad a {movementType === 'IN' ? 'Ingresar' : 'Retirar'}</p>
                   <input type="number" autoFocus className="w-full bg-transparent text-5xl font-black text-center text-slate-900 outline-none" value={movementQty} onChange={e => setMovementQty(parseInt(e.target.value) || 0)} />
                </div>

                <div className="space-y-4">
                   {movementType === 'OUT' && (
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Motivo de Salida</label>
                         <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={outReasonCategory} onChange={e => setOutReasonCategory(e.target.value)}>
                            <option>Dispensación / Venta</option>
                            <option>Caducidad Vencida</option>
                            <option>Merma / Daño</option>
                            <option>Robo / Extravío</option>
                            <option>Uso Interno</option>
                         </select>
                      </div>
                   )}
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Observaciones</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium" placeholder="Referencia o detalles..." value={movementReason} onChange={e => setMovementReason(e.target.value)} />
                   </div>
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setShowMovementModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                   <button onClick={handleStockMovement} className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl ${movementType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>Confirmar Movimiento</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default Inventory;