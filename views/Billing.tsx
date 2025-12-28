
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Trash2, ShoppingCart, Lock, Unlock, ShoppingBag, 
  History, DollarSign, User, Plus, FileText, CreditCard, 
  RefreshCw, Save, Printer, ArrowRight, X, AlertTriangle, 
  Banknote, Coins, Wallet, ArrowLeftRight, Package, Calculator,
  Minus, Edit3, FileCheck, LogOut, CheckCircle2, Tag,
  PieChart, Calendar, Filter, ChevronDown, ListPlus, Stethoscope, FlaskConical
} from 'lucide-react';
import { 
  Patient, ChargeItem, PriceItem, ClinicalNote, Transaction, 
  CashShift, PaymentDetail, StockMovement, MedicationStock, PriceType,
  ModuleType, PatientStatus
} from '../types';
import { INITIAL_PRICES, INITIAL_STOCK } from '../constants';

const Billing: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient?: (p: Patient) => void }> = ({ patients, notes, onUpdatePatient }) => {
  const navigate = useNavigate();

  // --- CORE DATA ---
  const [prices, setPrices] = useState<PriceItem[]>(() => JSON.parse(localStorage.getItem('med_price_catalog_v1') || JSON.stringify(INITIAL_PRICES)));
  const [shifts, setShifts] = useState<CashShift[]>(() => JSON.parse(localStorage.getItem('med_shifts_v1') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('med_transactions_v1') || '[]'));
  const [inventory, setInventory] = useState<MedicationStock[]>(() => JSON.parse(localStorage.getItem('med_inventory_v6') || JSON.stringify(INITIAL_STOCK)));
  const [movements, setMovements] = useState<StockMovement[]>(() => JSON.parse(localStorage.getItem('med_movements_v6') || '[]'));

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  
  // History Filters
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'VENTA' | 'MOVIMIENTO' | 'CORTE'>('ALL');

  // --- TRANSACTION STATE ---
  const [cart, setCart] = useState<ChargeItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0); 
  const [saleNotes, setSaleNotes] = useState('');
  
  // --- MODALS STATE ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false); 
  const [showMovementModal, setShowMovementModal] = useState(false); 
  const [showManualItemModal, setShowManualItemModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // --- FORMS & LOGIC ---
  const [paymentMethods, setPaymentMethods] = useState<PaymentDetail[]>([]);
  const [currentMethod, setCurrentMethod] = useState<'Efectivo' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Transferencia'>('Efectivo');
  const [amountInput, setAmountInput] = useState('');

  const currentShift = useMemo(() => shifts.find(s => s.status === 'Abierto'), [shifts]);
  const [shiftForm, setShiftForm] = useState({ initialCash: 0, declaredCash: 0, leaveForNext: 0, comments: '' });
  const [movementForm, setMovementForm] = useState({ type: 'RETIRO', amount: '', reason: '' });
  const [manualItemForm, setManualItemForm] = useState({ description: '', price: '', tax: 16 });

  // Items detectados para importar
  const [potentialCharges, setPotentialCharges] = useState<any[]>([]);
  const [selectedImportItems, setSelectedImportItems] = useState<string[]>([]);

  // Persistence
  useEffect(() => { localStorage.setItem('med_shifts_v1', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('med_transactions_v1', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('med_inventory_v6', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('med_movements_v6', JSON.stringify(movements)); }, [movements]);

  // --- CALCULATIONS ---
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const cartTax = cart.reduce((acc, item) => acc + (item.tax * item.quantity), 0);
  const discountVal = (cartSubtotal * globalDiscount) / 100;
  const cartTotal = (cartSubtotal - discountVal) + cartTax;
  
  const totalPaid = paymentMethods.reduce((acc, p) => acc + p.amount, 0);
  const change = totalPaid - cartTotal;
  const remaining = cartTotal - totalPaid;

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // --- LOGIC: INTELLIGENT CHARGE DETECTION ---
  useEffect(() => {
    if (selectedPatient) {
      const today = new Date().toLocaleDateString('es-MX');
      const charges: any[] = [];

      // 1. Detectar Notas Clínicas del día (Consulta Médica)
      const todaysNotes = notes.filter(n => n.patientId === selectedPatient.id && n.date.includes(today));
      if (todaysNotes.length > 0) {
          // Buscar si hay una "Consulta" en el catálogo de precios para sugerirla
          const consultationPrice = prices.find(p => p.name.includes('Consulta') && p.type === PriceType.SERVICE);
          
          // Solo agregar si no hemos cobrado ya una consulta hoy (simulado verificando carrito)
          charges.push({
              uniqueId: `CONS-${today}`,
              source: `Atención Médica (${todaysNotes[0].type})`,
              name: consultationPrice ? consultationPrice.name : 'Consulta Médica General',
              type: 'Honorarios',
              price: consultationPrice ? consultationPrice.price : 0, // Si no está en catálogo, sale 0 para editar
              originalData: {}
          });
      }

      // 2. Detectar Insumos y Procedimientos de Notas Recientes
      const patientNotes = notes.filter(n => n.patientId === selectedPatient.id);
      patientNotes.forEach(note => {
         if (note.content.meds) {
            note.content.meds.forEach((m: any, idx: number) => {
               charges.push({
                  uniqueId: `${note.id}-MED-${idx}`,
                  source: `Receta ${note.date.split(',')[0]}`,
                  name: m.name,
                  type: 'Farmacia',
                  originalData: m
               });
            });
         }
         if (note.content.procedures) {
            note.content.procedures.forEach((p: any, idx: number) => {
               charges.push({
                  uniqueId: `${note.id}-PROC-${idx}`,
                  source: `Nota ${note.date.split(',')[0]}`,
                  name: p.name,
                  type: 'Servicio',
                  price: p.price,
                  originalData: p
               });
            });
         }
      });
      setPotentialCharges(charges);
    } else {
      setPotentialCharges([]);
    }
  }, [selectedPatient, notes, prices]);

  const handleImportSelected = () => {
     const itemsToAdd = potentialCharges.filter(p => selectedImportItems.includes(p.uniqueId));
     
     itemsToAdd.forEach(item => {
        // LÓGICA DE VINCULACIÓN INTELIGENTE (FARMACIA -> PRECIOS)
        // 1. Intentar buscar por coincidencia exacta o parcial de nombre en el catálogo de precios
        const catalogMatch = prices.find(p => 
            p.name.toUpperCase() === item.name.toUpperCase() || 
            p.name.toUpperCase().includes(item.name.toUpperCase()) ||
            (p.linkedInventoryId && inventory.find(i => i.id === p.linkedInventoryId)?.name === item.name)
        );

        // Si encontramos match en catálogo, usamos su precio. Si no, usamos el que traiga el item o 0.
        const price = catalogMatch ? catalogMatch.price : (item.price || 0);
        const tax = catalogMatch ? (price * catalogMatch.taxPercent)/100 : 0;

        addToCart({
            id: catalogMatch?.id || generateId('IMP'),
            code: catalogMatch?.code || 'IMP',
            name: item.name,
            price: price,
            type: item.type === 'Farmacia' ? PriceType.PRODUCT : PriceType.SERVICE,
            category: item.type,
            taxPercent: catalogMatch?.taxPercent || 0,
            linkedInventoryId: catalogMatch?.linkedInventoryId
        }, 1, true); // Force add
     });
     
     setShowImportModal(false);
     setSelectedImportItems([]);
  };

  // --- CART ACTIONS ---
  const addToCart = (item: PriceItem, qty: number = 1, forceNew: boolean = false) => {
    if (!currentShift) return alert("CAJA CERRADA: Debe abrir un turno para agregar ítems.");

    if (item.linkedInventoryId) {
        const stockItem = inventory.find(i => i.id === item.linkedInventoryId);
        if (stockItem) {
            const currentStock = stockItem.batches ? stockItem.batches.reduce((a,b) => a + b.currentStock, 0) : 0;
            const inCart = cart.find(c => c.linkedInventoryId === item.linkedInventoryId)?.quantity || 0;
            if (currentStock < (inCart + qty)) {
                alert(`Stock insuficiente. Disponible: ${currentStock}`);
                return;
            }
        }
    }

    const existingIndex = forceNew ? -1 : cart.findIndex(c => c.concept === item.name && c.unitPrice === item.price);
    
    if (existingIndex >= 0) {
        const updatedCart = [...cart];
        updatedCart[existingIndex].quantity += qty;
        updatedCart[existingIndex].total = (updatedCart[existingIndex].unitPrice * updatedCart[existingIndex].quantity) + (updatedCart[existingIndex].tax * updatedCart[existingIndex].quantity);
        setCart(updatedCart);
    } else {
        const taxAmount = (item.price * item.taxPercent) / 100;
        const newItem: ChargeItem = {
            id: generateId('ITM'),
            date: new Date().toISOString(),
            concept: item.name,
            quantity: qty,
            unitPrice: item.price,
            tax: taxAmount,
            total: (item.price + taxAmount) * qty,
            type: item.category === 'Laboratorio' || item.category === 'Imagenología' ? 'Estudios' : item.type === PriceType.PRODUCT ? 'Farmacia' : 'Honorarios',
            status: 'Pendiente',
            linkedInventoryId: item.linkedInventoryId
        };
        setCart([...cart, newItem]);
    }
  };

  const addManualItem = () => {
      if (!currentShift) return alert("CAJA CERRADA.");
      if (!manualItemForm.description || !manualItemForm.price) return;

      const price = parseFloat(manualItemForm.price);
      const taxPercent = parseFloat(manualItemForm.tax as any) || 0;
      const taxAmount = (price * taxPercent) / 100;

      const newItem: ChargeItem = {
          id: generateId('MAN'),
          date: new Date().toISOString(),
          concept: manualItemForm.description.toUpperCase(),
          quantity: 1,
          unitPrice: price,
          tax: taxAmount,
          total: price + taxAmount,
          type: 'Otro',
          status: 'Pendiente'
      };
      setCart([...cart, newItem]);
      setManualItemForm({ description: '', price: '', tax: 16 });
      setShowManualItemModal(false);
  };

  const updateCartItem = (index: number, field: keyof ChargeItem | 'taxPercent', value: number) => {
      const updatedCart = [...cart];
      const item = updatedCart[index];

      if (field === 'quantity') {
          item.quantity = value;
      } else if (field === 'unitPrice') {
          item.unitPrice = value;
          const currentTaxRate = item.unitPrice > 0 ? (item.tax / item.unitPrice) : 0.16; 
          item.tax = value * currentTaxRate; 
      } else if (field === 'taxPercent') {
          item.tax = (item.unitPrice * value) / 100;
      }

      item.total = (item.unitPrice * item.quantity) + (item.tax * item.quantity);
      setCart(updatedCart);
  };

  const removeCartItem = (index: number) => {
      const updatedCart = [...cart];
      updatedCart.splice(index, 1);
      setCart(updatedCart);
  };

  // --- SALE PROCESSING ---
  const handleAddPayment = () => {
      const amount = parseFloat(amountInput);
      if (!amount || amount <= 0) return;
      setPaymentMethods([...paymentMethods, { method: currentMethod as any, amount }]);
      setAmountInput('');
  };

  const processSale = () => {
      if (!currentShift) return;

      // 1. Inventory Deduction
      const updatedInventory = [...inventory];
      const newMovements = [...movements];

      cart.forEach(item => {
          if (item.linkedInventoryId) {
              const productIndex = updatedInventory.findIndex(p => p.id === item.linkedInventoryId);
              if (productIndex >= 0) {
                  const product = updatedInventory[productIndex];
                  let qtyToDeduct = item.quantity;
                  const updatedBatches = product.batches?.map(b => {
                      if (qtyToDeduct > 0 && b.currentStock > 0) {
                          const take = Math.min(b.currentStock, qtyToDeduct);
                          qtyToDeduct -= take;
                          return { ...b, currentStock: b.currentStock - take };
                      }
                      return b;
                  });
                  if (updatedBatches) {
                      updatedInventory[productIndex] = { ...product, batches: updatedBatches };
                      newMovements.push({
                          id: generateId('MOV'),
                          medicationId: product.id,
                          medicationName: product.name,
                          batch: 'VENTA-POS',
                          type: 'OUT',
                          quantity: item.quantity,
                          date: new Date().toLocaleString(),
                          reason: `Ticket #${transactions.length + 1}`,
                          responsible: currentShift.openedBy
                      });
                  }
              }
          }
      });

      setInventory(updatedInventory);
      setMovements(newMovements);

      // 2. LOGIC: AUTO-MOVE TO AUXILIARIES
      // Check if cart contains studies (Lab/Imaging)
      const labStudies = cart.filter(i => i.type === 'Estudios' || i.concept.toLowerCase().includes('biometria') || i.concept.toLowerCase().includes('quimica') || i.concept.toLowerCase().includes('rayos x'));
      
      if (labStudies.length > 0 && selectedPatient && onUpdatePatient) {
          // Actualizar paciente para moverlo a Auxiliares
          const updatedPatient: Patient = {
              ...selectedPatient,
              assignedModule: ModuleType.AUXILIARY,
              status: PatientStatus.WAITING_FOR_SAMPLES,
              reason: labStudies.map(s => s.concept).join(', '), // Lista de estudios pagados
              lastVisit: new Date().toISOString().split('T')[0]
          };
          onUpdatePatient(updatedPatient);
          
          // Opcional: Feedback visual
          const toast = document.createElement('div');
          toast.className = 'fixed top-10 right-10 bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[500] animate-in slide-in-from-right font-bold uppercase text-xs';
          toast.innerHTML = `<p>Paciente enviado a Sala de Toma</p><p class="text-[9px] mt-1 opacity-80">Estudios Pagados: ${labStudies.length}</p>`;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 4000);
      }

      // 3. Create Transaction
      const newTx: Transaction = {
          id: generateId('TKT'),
          date: new Date().toISOString(),
          patientId: selectedPatient ? selectedPatient.id : 'WALK-IN',
          patientName: selectedPatient ? selectedPatient.name : 'Venta de Mostrador',
          items: cart,
          subtotal: cartSubtotal,
          taxes: cartTax,
          discountTotal: discountVal,
          total: cartTotal,
          payments: paymentMethods,
          change: change > 0 ? change : 0,
          status: 'Completada',
          cashier: currentShift.openedBy,
          shiftId: currentShift.id,
          category: 'VENTA',
          notes: saleNotes
      };

      setTransactions([newTx, ...transactions]);

      // 4. Reset UI
      setCart([]);
      setSelectedPatient(null);
      setPaymentMethods([]);
      setGlobalDiscount(0);
      setSaleNotes('');
      setShowPaymentModal(false);
  };

  // --- SHIFT MANAGEMENT ---
  const handleOpenShift = () => {
      const newShift: CashShift = {
          id: generateId('SHIFT'),
          status: 'Abierto',
          openedAt: new Date().toISOString(),
          openedBy: 'Cajero Principal',
          initialCash: Number(shiftForm.initialCash),
          systemTotals: { cash: 0, card: 0, transfer: 0, other: 0, total: 0, cashIn: 0, cashOut: 0, netCash: Number(shiftForm.initialCash), totalSales: 0 },
          movements: []
      };
      setShifts([...shifts, newShift]);
      setShowShiftModal(false);
      setShiftForm({ initialCash: 0, declaredCash: 0, leaveForNext: 0, comments: '' });
  };

  const handleCloseShift = () => {
      if (!currentShift) return;

      // Calcular totales del turno actual
      const shiftTx = transactions.filter(t => t.shiftId === currentShift.id && t.status === 'Completada');
      const cashSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Efectivo').reduce((s, p) => s + p.amount, 0), 0) - shiftTx.reduce((acc, t) => acc + t.change, 0);
      const cardSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method.includes('Tarjeta')).reduce((s, p) => s + p.amount, 0), 0);
      const transferSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Transferencia').reduce((s, p) => s + p.amount, 0), 0);
      
      const cashIn = (currentShift.movements || []).filter(m => m.type === 'INGRESO').reduce((a, b) => a + b.amount, 0);
      const cashOut = (currentShift.movements || []).filter(m => m.type === 'RETIRO').reduce((a, b) => a + b.amount, 0);

      const expectedCash = currentShift.initialCash + cashSales + cashIn - cashOut;
      const declared = Number(shiftForm.declaredCash);
      
      const closedShift: CashShift = {
          ...currentShift,
          status: 'Cerrado',
          closedAt: new Date().toISOString(),
          closedBy: 'Cajero Principal',
          finalCashCount: declared,
          amountLeftForNextShift: Number(shiftForm.leaveForNext),
          discrepancy: declared - expectedCash,
          systemTotals: {
              cash: cashSales,
              card: cardSales,
              transfer: transferSales,
              other: 0,
              total: cashSales + cardSales + transferSales, // Total Ventas Brutas
              cashIn,
              cashOut,
              netCash: expectedCash, // Efectivo Teórico en Caja
              totalSales: shiftTx.length
          }
      };

      setShifts(shifts.map(s => s.id === currentShift.id ? closedShift : s));
      setShowShiftModal(false);
  };

  const handleCashMovement = () => {
      if (!currentShift) return;
      const amount = parseFloat(movementForm.amount);
      if (!amount) return;

      const newMov: any = {
          id: generateId('MOV'),
          type: movementForm.type as any,
          amount,
          reason: movementForm.reason,
          date: new Date().toISOString(),
          user: currentShift.openedBy
      };

      const updatedShift = {
          ...currentShift,
          movements: [...(currentShift.movements || []), newMov]
      };
      setShifts(shifts.map(s => s.id === currentShift.id ? updatedShift : s));
      setShowMovementModal(false);
      setMovementForm({ type: 'RETIRO', amount: '', reason: '' });
  };

  // --- FILTERED LISTS ---
  const filteredCatalog = useMemo(() => {
      if (!itemSearchTerm) return prices;
      const term = itemSearchTerm.toLowerCase();
      return prices.filter(p => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term));
  }, [prices, itemSearchTerm]);

  const filteredPatients = useMemo(() => {
      if (!patientSearchTerm) return [];
      const term = patientSearchTerm.toLowerCase();
      return patients.filter(p => !p.id.startsWith('OLD-') && (p.name.toLowerCase().includes(term) || p.curp.toLowerCase().includes(term)));
  }, [patients, patientSearchTerm]);

  // HISTORIAL GLOBAL UNIFICADO (Con Detalle de Cortes)
  const globalHistory = useMemo(() => {
      const startOfDay = new Date(historyDate).getTime();
      const endOfDay = startOfDay + 86400000;

      // Tickets
      const txs = transactions.map(t => ({
          ...t, 
          type: 'VENTA' as const, 
          timestamp: new Date(t.date).getTime()
      }));

      // Cortes de Caja (Shift Logs) - Expandido
      const shiftLogs = shifts.map(s => [
          { ...s, type: 'CORTE' as const, subType: 'APERTURA', timestamp: new Date(s.openedAt).getTime() },
          ...(s.closedAt ? [{ ...s, type: 'CORTE' as const, subType: 'CIERRE', timestamp: new Date(s.closedAt).getTime() }] : [])
      ]).flat();

      // Movimientos de efectivo
      const cashMoves = shifts.flatMap(s => (s.movements || []).map(m => ({
          ...m, 
          type: 'MOVIMIENTO' as const, 
          timestamp: new Date(m.date).getTime() 
      })));

      const all = [...txs, ...shiftLogs, ...cashMoves];

      // Filtros
      return all
        .filter(item => item.timestamp >= startOfDay && item.timestamp < endOfDay)
        .filter(item => historyFilter === 'ALL' || item.type === historyFilter)
        .sort((a,b) => b.timestamp - a.timestamp);

  }, [transactions, shifts, historyDate, historyFilter]);


  return (
    <div className="max-w-[98%] mx-auto pb-20 animate-in fade-in space-y-4">
       
       {/* 1. TOP BAR: GLOBAL CONTROL */}
       <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex justify-between items-center no-print">
          <div className="flex items-center gap-6">
             <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${currentShift ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-rose-500/20 border-rose-500/50'}`}>
                {currentShift ? <Unlock size={18} className="text-emerald-400"/> : <Lock size={18} className="text-rose-400"/>}
                <div className="leading-tight">
                    <p className="text-[10px] font-black uppercase tracking-widest">{currentShift ? 'Turno Abierto' : 'Caja Cerrada'}</p>
                    <p className="text-[9px] opacity-60 font-bold">{currentShift ? `#${currentShift.id.slice(-6)} • ${currentShift.openedBy}` : 'Requiere Apertura'}</p>
                </div>
             </div>
             <button onClick={() => navigate('/finance')} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-xl transition-all group">
                <PieChart size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Ir a Finanzas</span>
             </button>
          </div>
          <div className="flex gap-3">
             <div className="flex bg-slate-800 p-1 rounded-xl">
                <button onClick={() => setActiveTab('pos')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'pos' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Terminal Punto de Venta</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Historial Global</button>
             </div>
             <button onClick={() => setShowShiftModal(true)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${currentShift ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {currentShift ? 'Corte de Caja' : 'Abrir Caja'}
             </button>
             {currentShift && (
                 <button onClick={() => setShowMovementModal(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ArrowLeftRight size={14} /> Retiros
                 </button>
             )}
          </div>
       </div>

       {/* MAIN WORKSPACE */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          
          {/* LEFT COL: CART & PATIENT (Always Visible) */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full">
             
             {/* Patient Selector */}
             <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm relative z-20">
                <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-400"/>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente / Paciente</p>
                </div>
                {selectedPatient ? (
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in fade-in">
                        <div>
                            <p className="text-xs font-black text-blue-900 uppercase">{selectedPatient.name}</p>
                            <p className="text-[9px] text-blue-600">{selectedPatient.id}</p>
                        </div>
                        <div className="flex gap-2">
                            {potentialCharges.length > 0 && (
                                <button onClick={() => setShowImportModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shadow-md hover:bg-indigo-700 transition-all flex items-center gap-1">
                                    <ListPlus size={12}/> Detectar Cargos ({potentialCharges.length})
                                </button>
                            )}
                            <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-white rounded-lg text-blue-400"><X size={16}/></button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-100"
                            placeholder="Buscar paciente (Nombre / CURP)..."
                            value={patientSearchTerm}
                            onChange={e => setPatientSearchTerm(e.target.value)}
                        />
                        {filteredPatients.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
                                {filteredPatients.map(p => (
                                    <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearchTerm(''); }} className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 text-[10px] font-bold uppercase">
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
             </div>

             {/* Cart Items */}
             <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><ShoppingCart size={14}/> Ticket Actual</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[9px] font-bold">{cart.length} Ítems</span>
                </div>
                <div className={`flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar ${!currentShift ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    {cart.map((item, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[11px] font-black text-slate-800 uppercase leading-tight w-3/4">{item.concept}</p>
                                <button onClick={() => removeCartItem(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* QTY CONTROL */}
                                <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                                    <button onClick={() => updateCartItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="p-1 hover:bg-slate-200 rounded-l-lg"><Minus size={12}/></button>
                                    <input 
                                        type="number" 
                                        className="w-8 text-center bg-transparent text-[10px] font-black outline-none" 
                                        value={item.quantity} 
                                        onChange={e => updateCartItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                    <button onClick={() => updateCartItem(idx, 'quantity', item.quantity + 1)} className="p-1 hover:bg-slate-200 rounded-r-lg"><Plus size={12}/></button>
                                </div>
                                
                                {/* PRICE EDIT */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        className="w-16 p-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-right outline-none focus:border-blue-400"
                                        value={item.unitPrice}
                                        onChange={e => updateCartItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="flex-1 text-right">
                                    <p className="text-xs font-black text-slate-900">${item.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                            <ShoppingBag size={48} className="mb-2"/>
                            <p className="text-xs font-black uppercase">Carrito Vacío</p>
                        </div>
                    )}
                </div>

                {/* TOTALS & PAY */}
                <div className={`p-5 bg-slate-50 border-t border-slate-200 space-y-3 ${!currentShift ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Impuestos</span><span>${cartTax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase items-center">
                        <span>Descuento Global (%)</span>
                        <input type="number" className="w-12 p-1 bg-white border border-slate-200 rounded text-center" value={globalDiscount} onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="flex justify-between text-2xl font-black text-slate-900 uppercase pt-2 border-t border-slate-200"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
                    
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setShowManualItemModal(true)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase hover:bg-slate-100 transition-all">+ Manual</button>
                        <button 
                            onClick={() => setShowPaymentModal(true)} 
                            disabled={cart.length === 0}
                            className="flex-[2] py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <DollarSign size={14} /> COBRAR
                        </button>
                    </div>
                </div>
             </div>
          </div>

          {/* RIGHT COL: DYNAMIC CONTENT (CATALOG OR HISTORY) */}
          <div className="lg:col-span-7 flex flex-col gap-4 h-full">
             
             {/* CATALOG VIEW */}
             {activeTab === 'pos' && (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-blue-400 transition-all"
                                placeholder="Buscar producto o servicio..."
                                value={itemSearchTerm}
                                onChange={e => setItemSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredCatalog.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => addToCart(item)}
                                    className="text-left p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between min-h-[100px]"
                                >
                                    <div>
                                        <p className="text-[10px] font-black text-slate-800 uppercase leading-tight group-hover:text-blue-700 line-clamp-2">{item.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{item.code}</p>
                                    </div>
                                    <div className="mt-3 flex justify-between items-end">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${item.type === 'Producto / Insumo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                            {item.type === 'Producto / Insumo' ? 'Prod' : 'Serv'}
                                        </span>
                                        <span className="text-sm font-black text-slate-900">${item.price}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             )}

             {/* GLOBAL HISTORY VIEW (ENHANCED FOR SHIFT AUDIT) */}
             {activeTab === 'history' && (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm flex-1 flex flex-col overflow-hidden animate-in fade-in">
                    <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
                        <input 
                           type="date" 
                           className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none shadow-sm"
                           value={historyDate}
                           onChange={e => setHistoryDate(e.target.value)}
                        />
                        <div className="flex bg-slate-200 p-1 rounded-xl">
                           {['ALL', 'VENTA', 'MOVIMIENTO', 'CORTE'].map(f => (
                              <button 
                                key={f} 
                                onClick={() => setHistoryFilter(f as any)} 
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${historyFilter === f ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                              >
                                 {f}
                              </button>
                           ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {globalHistory.map((item: any) => (
                            <div key={item.id} className={`p-4 border rounded-2xl transition-all ${item.type === 'VENTA' ? 'bg-white border-slate-100 hover:border-blue-200' : item.type === 'CORTE' ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                item.type === 'VENTA' ? 'bg-blue-100 text-blue-700' : 
                                                item.type === 'CORTE' ? 'bg-purple-100 text-purple-700' : 
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {item.type === 'CORTE' ? `${item.type} (${item.subType})` : item.type}
                                            </span>
                                            <p className="text-[10px] font-black text-slate-900 uppercase">
                                                {new Date(item.timestamp).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'})} • ID: {item.id}
                                            </p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 pl-1">
                                            {item.type === 'VENTA' ? item.patientName : item.reason || `Responsable: ${item.openedBy || item.user}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {item.type === 'CORTE' && item.subType === 'CIERRE' ? (
                                            <div className="text-[9px] text-right space-y-1">
                                                <p><span className="text-slate-400">Ventas:</span> <b>${item.systemTotals.total.toFixed(2)}</b></p>
                                                <p><span className="text-slate-400">En Caja:</span> <b>${item.finalCashCount?.toFixed(2)}</b></p>
                                                <p><span className="text-slate-400">Ganancia Turno:</span> <b className="text-emerald-600">${item.systemTotals.total.toFixed(2)}</b></p>
                                            </div>
                                        ) : (
                                            <p className={`text-sm font-black ${item.type === 'MOVIMIENTO' && item.typeMov === 'RETIRO' ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {item.type === 'MOVIMIENTO' && item.typeMov === 'RETIRO' ? '-' : ''}${item.amount || item.total?.toFixed(2) || item.initialCash?.toFixed(2)}
                                            </p>
                                        )}
                                        {item.type === 'VENTA' && (
                                            <button className="text-[8px] font-black text-blue-600 hover:underline uppercase bg-blue-50 px-2 py-0.5 rounded mt-1">Imprimir</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {globalHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                               <History size={32} className="mb-2 opacity-50"/>
                               <p className="text-[10px] font-black uppercase tracking-widest">Sin registros en esta fecha</p>
                            </div>
                        )}
                    </div>
                </div>
             )}
          </div>
       </div>

       {/* MODAL: MANUAL ITEM */}
       {showManualItemModal && (
           <div className="fixed inset-0 z-[400] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-6">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <h3 className="text-xl font-black text-slate-900 uppercase">Agregar Ítem Manual</h3>
                       <button onClick={() => setShowManualItemModal(false)}><X className="text-slate-400" /></button>
                   </div>
                   <div className="space-y-4">
                       <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Descripción / Concepto</label>
                           <input autoFocus className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-blue-500" value={manualItemForm.description} onChange={e => setManualItemForm({...manualItemForm, description: e.target.value})} placeholder="Ej: Consulta de urgencia..." />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Precio Unitario ($)</label>
                               <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center outline-none focus:border-blue-500" value={manualItemForm.price} onChange={e => setManualItemForm({...manualItemForm, price: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase ml-2">IVA (%)</label>
                               <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center outline-none focus:border-blue-500" value={manualItemForm.tax} onChange={e => setManualItemForm({...manualItemForm, tax: parseFloat(e.target.value) || 0})} />
                           </div>
                       </div>
                   </div>
                   <div className="flex gap-4 pt-4">
                       <button onClick={() => setShowManualItemModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                       <button onClick={addManualItem} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-slate-800 transition-all">Agregar al Carrito</button>
                   </div>
               </div>
           </div>
       )}

       {/* MODAL: IMPORT CHARGES */}
       {showImportModal && (
           <div className="fixed inset-0 z-[400] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 space-y-6 flex flex-col max-h-[80vh]">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <div>
                           <h3 className="text-xl font-black text-slate-900 uppercase">Cargos Detectados</h3>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Seleccione los ítems a cobrar</p>
                       </div>
                       <button onClick={() => setShowImportModal(false)}><X className="text-slate-400" /></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                       {potentialCharges.length > 0 ? potentialCharges.map((item: any) => (
                           <label key={item.uniqueId} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedImportItems.includes(item.uniqueId) ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                               <input 
                                   type="checkbox" 
                                   checked={selectedImportItems.includes(item.uniqueId)} 
                                   onChange={(e) => {
                                       if(e.target.checked) setSelectedImportItems([...selectedImportItems, item.uniqueId]);
                                       else setSelectedImportItems(selectedImportItems.filter(id => id !== item.uniqueId));
                                   }}
                                   className="w-5 h-5 accent-indigo-600"
                               />
                               <div className="flex-1">
                                   <p className="text-xs font-black uppercase text-slate-800">{item.name}</p>
                                   <div className="flex justify-between mt-1">
                                       <span className={`text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 w-fit`}>
                                           {item.type === 'Honorarios' && <Stethoscope size={10}/>}
                                           {item.type === 'Farmacia' && <Package size={10}/>}
                                           {item.type === 'Servicio' && <FlaskConical size={10}/>}
                                           {item.type}
                                       </span>
                                       <span className="text-[9px] font-bold text-slate-400 uppercase">{item.source}</span>
                                   </div>
                               </div>
                           </label>
                       )) : (
                           <p className="text-center text-slate-400 text-xs font-bold uppercase py-10">No se encontraron ítems pendientes en las notas recientes.</p>
                       )}
                   </div>

                   <div className="flex gap-4 pt-4 border-t border-slate-100">
                       <button onClick={() => setShowImportModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                       <button onClick={handleImportSelected} disabled={selectedImportItems.length === 0} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                           Importar Seleccionados ({selectedImportItems.length})
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* MODAL: SHIFT & PAYMENT (Reuse existing structure with updated state) */}
       {showShiftModal && (
          <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase text-center">{currentShift ? 'Corte de Caja (Cierre)' : 'Apertura de Turno'}</h3>
                
                {!currentShift ? (
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fondo Inicial en Caja</label>
                         <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-center outline-none focus:ring-2 focus:ring-blue-500" value={shiftForm.initialCash} onChange={e => setShiftForm({...shiftForm, initialCash: parseFloat(e.target.value)})} autoFocus />
                      </div>
                      <button onClick={handleOpenShift} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">Iniciar Operaciones</button>
                   </div>
                ) : (
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Ventas Efvo.</p>
                              <p className="text-lg font-black text-slate-900">${(transactions.filter(t => t.shiftId === currentShift.id).reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Efectivo').reduce((s, p) => s + p.amount, 0), 0) - transactions.filter(t => t.shiftId === currentShift.id).reduce((acc, t) => acc + t.change, 0)).toFixed(2)}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Fondo Inicial</p>
                              <p className="text-lg font-black text-slate-900">${currentShift.initialCash.toFixed(2)}</p>
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Efectivo Real (Conteo Físico)</label>
                         <input type="number" className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl text-xl font-black text-center text-blue-600 outline-none focus:border-blue-500" value={shiftForm.declaredCash} onChange={e => setShiftForm({...shiftForm, declaredCash: parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dejar para Sig. Turno</label>
                         <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={shiftForm.leaveForNext} onChange={e => setShiftForm({...shiftForm, leaveForNext: parseFloat(e.target.value)})} />
                      </div>
                      
                      <div className="flex gap-4 pt-4 border-t border-slate-100">
                         <div className="flex-1 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Retiro (Bóveda)</p>
                            <p className="text-lg font-black text-slate-900">${(Math.max(0, shiftForm.declaredCash - shiftForm.leaveForNext)).toFixed(2)}</p>
                         </div>
                         <div className="flex-1 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Diferencia</p>
                            {/* Calculation: Declared - (Initial + Sales + In - Out) */}
                            <p className={`text-lg font-black ${shiftForm.declaredCash - (currentShift.initialCash + (transactions.filter(t => t.shiftId === currentShift.id).reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Efectivo').reduce((s, p) => s + p.amount, 0), 0) - transactions.filter(t => t.shiftId === currentShift.id).reduce((acc, t) => acc + t.change, 0)) + (currentShift.movements?.filter(m => m.type === 'INGRESO').reduce((a,b)=>a+b.amount,0)||0) - (currentShift.movements?.filter(m => m.type === 'RETIRO').reduce((a,b)=>a+b.amount,0)||0)) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                               ${(shiftForm.declaredCash - (currentShift.initialCash + (transactions.filter(t => t.shiftId === currentShift.id).reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Efectivo').reduce((s, p) => s + p.amount, 0), 0) - transactions.filter(t => t.shiftId === currentShift.id).reduce((acc, t) => acc + t.change, 0)) + (currentShift.movements?.filter(m => m.type === 'INGRESO').reduce((a,b)=>a+b.amount,0)||0) - (currentShift.movements?.filter(m => m.type === 'RETIRO').reduce((a,b)=>a+b.amount,0)||0))).toFixed(2)}
                            </p>
                         </div>
                      </div>
                      <button onClick={handleCloseShift} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all">Ejecutar Corte Z</button>
                   </div>
                )}
                <button onClick={() => setShowShiftModal(false)} className="w-full text-slate-400 font-bold text-xs uppercase hover:text-slate-600">Cancelar</button>
             </div>
          </div>
       )}

       {showPaymentModal && (
          <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-10 flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-6">
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Caja / Cobro</h3>
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total a Pagar</p>
                      <p className="text-5xl font-black text-slate-900 tracking-tighter">${cartTotal.toFixed(2)}</p>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="flex gap-2">
                         {['Efectivo', 'Tarjeta Crédito', 'Tarjeta Débito', 'Transferencia'].map(m => (
                            <button key={m} onClick={() => setCurrentMethod(m as any)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${currentMethod === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                               {m}
                            </button>
                         ))}
                      </div>
                      <div className="flex gap-4">
                         <div className="relative flex-1">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="number" 
                              className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500" 
                              placeholder="Monto" 
                              value={amountInput} 
                              onChange={e => setAmountInput(e.target.value)}
                              autoFocus 
                              onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                            />
                         </div>
                         <button onClick={handleAddPayment} className="px-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition-all">Agregar Pago</button>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Notas del Ticket</label>
                      <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none resize-none h-20" value={saleNotes} onChange={e => setSaleNotes(e.target.value)} placeholder="Ej: Descuento autorizado por Gerencia..." />
                   </div>
                </div>

                <div className="lg:w-80 bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Desglose</p>
                      {paymentMethods.map((p, i) => (
                         <div key={i} className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-2">
                            <span>{p.method}</span>
                            <span>${p.amount.toFixed(2)}</span>
                         </div>
                      ))}
                      <div className="pt-4 border-t border-white/20">
                         <div className="flex justify-between text-xs font-black uppercase"><span>Pagado</span><span className="text-emerald-400">${totalPaid.toFixed(2)}</span></div>
                         <div className="flex justify-between text-xs font-black uppercase mt-2"><span>Restante</span><span className="text-rose-400">${Math.max(0, remaining).toFixed(2)}</span></div>
                         <div className="flex justify-between text-2xl font-black uppercase mt-6 pt-6 border-t border-white/20"><span>Cambio</span><span className="text-blue-400">${Math.max(0, change).toFixed(2)}</span></div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col gap-3 mt-8">
                      <button 
                        onClick={processSale} 
                        disabled={remaining > 0.01} 
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                         Confirmar Venta
                      </button>
                      <button onClick={() => setShowPaymentModal(false)} className="w-full py-3 text-slate-400 font-black text-[10px] uppercase hover:text-white transition-all">Cancelar</button>
                   </div>
                </div>
             </div>
          </div>
       )}

       {/* MODAL: MOVEMENTS (Retiros/Ingresos) */}
       {showMovementModal && (
          <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6">
                <h3 className="text-xl font-black text-slate-900 uppercase text-center">Movimiento de Efectivo</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                   <button onClick={() => setMovementForm({...movementForm, type: 'RETIRO'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${movementForm.type === 'RETIRO' ? 'bg-rose-500 text-white shadow' : 'text-slate-500'}`}>Retiro / Gasto</button>
                   <button onClick={() => setMovementForm({...movementForm, type: 'INGRESO'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${movementForm.type === 'INGRESO' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'}`}>Ingreso / Cambio</button>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Monto</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={movementForm.amount} onChange={e => setMovementForm({...movementForm, amount: e.target.value})} autoFocus />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Concepto / Razón</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})} placeholder="Ej: Compra de agua, Pago proveedor..." />
                   </div>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setShowMovementModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                   <button onClick={handleCashMovement} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-slate-800">Registrar</button>
                </div>
             </div>
          </div>
       )}

    </div>
  );
};

export default Billing;
