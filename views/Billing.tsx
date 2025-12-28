
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Trash2, ShoppingCart, Lock, Unlock, History, DollarSign, 
  User, Plus, FileText, CreditCard, RefreshCw, Save, Printer, 
  ArrowRight, X, AlertTriangle, Banknote, Landmark, Smartphone,
  CheckCircle2, Receipt, Minus, Tag, Percent, Info, FileX, Eye, ShieldCheck, QrCode,
  Calendar, MessageSquare, ListPlus, Wallet, CreditCard as CardIcon, ArrowDownLeft,
  TrendingUp, TrendingDown, Coins, FileInput, LogOut
} from 'lucide-react';
import { 
  Patient, ChargeItem, PriceItem, ClinicalNote, Transaction, 
  CashShift, PaymentDetail, StockMovement, MedicationStock, PriceType,
  ModuleType, PatientStatus
} from '../types';
import { INITIAL_PRICES, INITIAL_STOCK } from '../constants';

const Billing: React.FC<{ patients: Patient[], notes: ClinicalNote[], onUpdatePatient?: (p: Patient) => void }> = ({ patients, notes, onUpdatePatient }) => {
  const navigate = useNavigate();

  const [prices] = useState<PriceItem[]>(() => JSON.parse(localStorage.getItem('med_price_catalog_v1') || JSON.stringify(INITIAL_PRICES)));
  const [shifts, setShifts] = useState<CashShift[]>(() => JSON.parse(localStorage.getItem('med_shifts_v1') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('med_transactions_v1') || '[]'));
  const [inventory, setInventory] = useState<MedicationStock[]>(() => JSON.parse(localStorage.getItem('med_inventory_v6') || JSON.stringify(INITIAL_STOCK)));
  const [movements, setMovements] = useState<StockMovement[]>(() => JSON.parse(localStorage.getItem('med_movements_v6') || '[]'));

  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado del Ticket Actual
  const [cart, setCart] = useState<ChargeItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');

  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  
  // Modales
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false); 
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Transaction | null>(null);
  const [viewingShift, setViewingShift] = useState<CashShift | null>(null);
  
  // Lógica de Pago Mixto
  const [paymentMethods, setPaymentMethods] = useState<PaymentDetail[]>([]);
  const [currentMethod, setCurrentMethod] = useState<'Efectivo' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Transferencia'>('Efectivo');
  const [amountInput, setAmountInput] = useState('');

  const currentShift = useMemo(() => shifts.find(s => s.status === 'Abierto'), [shifts]);
  const lastClosedShift = useMemo(() => shifts.slice().reverse().find(s => s.status === 'Cerrado'), [shifts]);
  
  const [shiftForm, setShiftForm] = useState({ 
    initialCash: lastClosedShift?.amountLeftForNextShift || 250, 
    declaredCash: 0, 
    leaveForNext: 0 
  });

  useEffect(() => { localStorage.setItem('med_shifts_v1', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('med_transactions_v1', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('med_inventory_v6', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('med_movements_v6', JSON.stringify(movements)); }, [movements]);

  // Cálculos del Carrito
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const cartTax = cart.reduce((acc, item) => acc + (item.tax * item.quantity), 0);
  const discountAmount = (cartSubtotal * globalDiscount) / 100;
  const cartTotal = (cartSubtotal - discountAmount) + cartTax;
  
  // Cálculos de Pagos
  const totalPaid = paymentMethods.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, cartTotal - totalPaid);
  const change = totalPaid - cartTotal;

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const getProductCost = (invId?: string) => {
      if (!invId) return 0;
      const product = inventory.find(i => i.id === invId);
      return product?.lastCost || 0;
  };

  const addToCart = (item: PriceItem, qty: number = 1) => {
    if (!currentShift) return alert("CAJA CERRADA: Debe abrir un turno para agregar ítems.");
    const taxAmount = (item.price * item.taxPercent) / 100;
    
    // Calcular costo actual
    let unitCost = 0;
    if (item.linkedInventoryId) {
        unitCost = getProductCost(item.linkedInventoryId);
    } else if (item.linkedSupplies && item.linkedSupplies.length > 0) {
        // Sumar el costo de todos los insumos vinculados
        unitCost = item.linkedSupplies.reduce((acc, supply) => {
            return acc + (getProductCost(supply.inventoryId) * supply.quantity);
        }, 0);
    }

    const newItem: ChargeItem = {
        id: generateId('ITM'),
        date: new Date().toISOString(),
        concept: item.name,
        quantity: qty,
        unitPrice: item.price,
        originalCost: unitCost, // Guardar el costo histórico en el momento de la venta
        tax: taxAmount,
        total: (item.price + taxAmount) * qty,
        type: item.type === PriceType.PRODUCT 
          ? (['Material', 'Insumos Médicos', 'Material de Oficina'].includes(item.category) ? 'Material' : 'Farmacia') 
          : item.category.includes('Estudios') ? 'Estudios' : 'Honorarios', 
        status: 'Pendiente',
        linkedInventoryId: item.linkedInventoryId,
        linkedSupplies: item.linkedSupplies
    };
    setCart([...cart, newItem]);
  };

  const handleImportPendingCharges = () => {
      if (selectedPatient && selectedPatient.pendingCharges && selectedPatient.pendingCharges.length > 0) {
          if (!currentShift) return alert("CAJA CERRADA: Debe abrir un turno para agregar ítems.");
          setCart([...cart, ...selectedPatient.pendingCharges]);
      }
  };

  const handleAddPayment = () => {
      const amount = parseFloat(amountInput);
      if (!amount || amount <= 0) return;
      
      // Validar si excede el restante (solo si es el último pago, aunque permitimos cambio en efectivo)
      if (amount > remaining && currentMethod !== 'Efectivo') {
          if (!window.confirm("El monto excede el restante. ¿Desea registrarlo de todas formas?")) return;
      }

      setPaymentMethods([...paymentMethods, { method: currentMethod, amount }]);
      setAmountInput('');
  };

  const handleRemovePayment = (index: number) => {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const processSale = () => {
      if (!currentShift) return;
      const newTx: Transaction = {
          id: generateId('TKT'),
          date: new Date().toISOString(),
          patientId: selectedPatient ? selectedPatient.id : 'WALK-IN',
          patientName: selectedPatient ? selectedPatient.name : 'Venta de Mostrador',
          items: [...cart],
          subtotal: cartSubtotal,
          taxes: cartTax,
          discountTotal: discountAmount,
          total: cartTotal,
          payments: [...paymentMethods],
          change: change > 0 ? change : 0,
          status: 'Completada',
          cashier: currentShift.openedBy,
          shiftId: currentShift.id,
          category: 'VENTA',
          notes: saleNotes
      };

      // Descontar inventario
      const updatedInventory = [...inventory];
      const newMovements = [...movements];

      const deductStock = (invId: string, quantity: number, reason: string) => {
          const productIndex = updatedInventory.findIndex(p => p.id === invId);
          if (productIndex >= 0) {
              const product = updatedInventory[productIndex];
              let qtyToDeduct = quantity;
              // FIFO Logic
              const updatedBatches = product.batches?.map(b => {
                  if (qtyToDeduct > 0 && b.currentStock > 0) {
                      const take = Math.min(b.currentStock, qtyToDeduct);
                      qtyToDeduct -= take;
                      return { ...b, currentStock: b.currentStock - take };
                  }
                  return b;
              });
              updatedInventory[productIndex] = { ...product, batches: updatedBatches };
              newMovements.push({
                  id: generateId('MOV'), medicationId: product.id, medicationName: product.name,
                  batch: 'VENTA-TPV', type: 'OUT', quantity: quantity,
                  date: new Date().toLocaleString(), reason: reason, responsible: currentShift.openedBy
              });
          }
      };

      cart.forEach(item => {
          // Caso 1: Producto Directo (1:1)
          if (item.linkedInventoryId) {
              deductStock(item.linkedInventoryId, item.quantity, `Ticket ${newTx.id}`);
          }
          
          // Caso 2: Procedimiento con Insumos Vinculados (1:N)
          if (item.linkedSupplies && item.linkedSupplies.length > 0) {
              item.linkedSupplies.forEach(supply => {
                  deductStock(supply.inventoryId, supply.quantity * item.quantity, `Uso en ${item.concept} - Ticket ${newTx.id}`);
              });
          }
      });

      // --- ACTUALIZACIÓN CRÍTICA DEL PACIENTE ---
      // Al procesar el pago, actualizamos su estatus a "Pagado" para desbloquear Auxiliares
      if (selectedPatient && onUpdatePatient) {
          const updatedPatient = {
              ...selectedPatient,
              paymentStatus: 'Pagado' as const, 
              pendingCharges: [] // Limpiar cargos pendientes pues ya se pagaron
          };
          onUpdatePatient(updatedPatient);
          
          // Actualizamos la referencia local para que la UI responda inmediatamente si no se desmonta
          // Esto es redundante si onUpdatePatient actualiza el estado global de App, pero asegura consistencia local inmediata
          setSelectedPatient(updatedPatient);
      }

      setInventory(updatedInventory);
      setMovements(newMovements);
      setTransactions([newTx, ...transactions]);
      setLastTransaction(newTx);
      setShowTicketModal(true);
      
      // Reset
      setCart([]);
      setSelectedPatient(null);
      setPaymentMethods([]);
      setGlobalDiscount(0);
      setSaleNotes('');
      setShowPaymentModal(false);
  };

  const handleCancelTicket = (ticket: Transaction) => {
    if (!window.confirm(`¿Seguro que desea CANCELAR el ticket ${ticket.id}?`)) return;
    const updatedTxs = transactions.map(t => t.id === ticket.id ? { ...t, status: 'Cancelada' as any } : t);
    
    // Retornar Inventario (Simplificado - devuelve al primer lote disponible)
    const updatedInventory = [...inventory];
    const newMovements = [...movements];

    const returnStock = (invId: string, quantity: number, reason: string) => {
        const productIndex = updatedInventory.findIndex(p => p.id === invId);
        if (productIndex >= 0) {
            const product = updatedInventory[productIndex];
            if (product.batches && product.batches.length > 0) {
                product.batches[0].currentStock += quantity;
                newMovements.push({
                    id: generateId('MOV'), medicationId: product.id, medicationName: product.name,
                    batch: product.batches[0].batchNumber, type: 'IN', quantity: quantity,
                    date: new Date().toLocaleString(), reason: reason, responsible: 'Auditoría'
                });
            }
        }
    };

    ticket.items.forEach(item => {
        if (item.linkedInventoryId) {
            returnStock(item.linkedInventoryId, item.quantity, `Cancelación Folio ${ticket.id}`);
        }
        if (item.linkedSupplies) {
            item.linkedSupplies.forEach(supply => {
                returnStock(supply.inventoryId, supply.quantity * item.quantity, `Cancelación Procedimiento ${ticket.id}`);
            });
        }
    });

    setTransactions(updatedTxs);
    setInventory(updatedInventory);
    setMovements(newMovements);
    setSelectedTicket(null);
  };

  const handleOpenShift = () => {
      const newShift: CashShift = {
          id: generateId('SHIFT'), status: 'Abierto', openedAt: new Date().toISOString(),
          openedBy: 'Dr. Jesus Reyes', initialCash: Number(shiftForm.initialCash),
          systemTotals: { cash: 0, debitCard: 0, creditCard: 0, transfer: 0, other: 0, total: 0, totalCost: 0, grossProfit: 0, netCashExpected: Number(shiftForm.initialCash), totalSalesCount: 0 }
      };
      setShifts([...shifts, newShift]);
      setShowShiftModal(false);
  };

  const handleCloseShift = () => {
      if (!currentShift) return;
      const shiftTx = transactions.filter(t => t.shiftId === currentShift.id && t.status === 'Completada');
      const cashSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Efectivo').reduce((s, p) => s + p.amount, 0), 0) - shiftTx.reduce((acc, t) => acc + t.change, 0);
      const debitSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Tarjeta Débito').reduce((s, p) => s + p.amount, 0), 0);
      const creditSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Tarjeta Crédito').reduce((s, p) => s + p.amount, 0), 0);
      const transferSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Transferencia').reduce((s, p) => s + p.amount, 0), 0);
      
      const totalSales = cashSales + debitSales + creditSales + transferSales;
      const expectedCash = currentShift.initialCash + cashSales;
      const declared = Number(shiftForm.declaredCash);
      
      const closedShift: CashShift = {
          ...currentShift, status: 'Cerrado', closedAt: new Date().toISOString(),
          finalCashCount: declared, amountLeftForNextShift: Number(shiftForm.leaveForNext),
          discrepancy: declared - expectedCash,
          systemTotals: {
              cash: cashSales, debitCard: debitSales, creditCard: creditSales, transfer: transferSales, other: 0,
              total: totalSales,
              totalCost: 0,
              grossProfit: 0,
              netCashExpected: expectedCash, totalSalesCount: shiftTx.length
          }
      };
      setShifts(shifts.map(s => s.id === currentShift.id ? closedShift : s));
      setShiftForm({ initialCash: closedShift.amountLeftForNextShift || 250, declaredCash: 0, leaveForNext: 0 });
      setShowShiftModal(false);
  };

  // Reconstrucción del Libro Diario con Aperturas y Cierres explícitos
  const globalHistory = useMemo(() => {
      const startOfDay = new Date(historyDate).getTime();
      const endOfDay = startOfDay + 86400000;
      
      const sales = transactions.map(t => ({ ...t, timestamp: new Date(t.date).getTime(), type: 'SALE' }));
      
      // Crear eventos de APERTURA
      const opens = shifts.map(s => ({
          id: `OPEN-${s.id}`,
          date: s.openedAt,
          timestamp: new Date(s.openedAt).getTime(),
          type: 'OPEN',
          total: s.initialCash,
          patientName: `APERTURA DE CAJA`,
          details: `Fondo Inicial: $${s.initialCash}`,
          shiftId: s.id
      }));

      // Crear eventos de CIERRE (CORTE Z)
      const closes = shifts.filter(s => s.closedAt).map(s => ({
          id: `CLOSE-${s.id}`,
          date: s.closedAt!,
          timestamp: new Date(s.closedAt!).getTime(),
          type: 'CLOSE',
          total: s.finalCashCount,
          patientName: `CORTE Z (CIERRE)`,
          details: `Declarado: $${s.finalCashCount} | Sistema: $${s.systemTotals.netCashExpected}`,
          rawShift: s
      }));

      return [...sales, ...opens, ...closes]
       .filter(item => item.timestamp >= startOfDay && item.timestamp < endOfDay)
       .sort((a,b) => b.timestamp - a.timestamp);
  }, [transactions, shifts, historyDate]);

  const getCurrentShiftStats = () => {
      if(!currentShift) return null;
      const shiftTx = transactions.filter(t => t.shiftId === currentShift.id && t.status === 'Completada');
      const totalRevenue = shiftTx.reduce((acc, t) => acc + t.total, 0); // Venta con IVA
      const cashSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Efectivo').reduce((s, p) => s + p.amount, 0), 0) - shiftTx.reduce((acc, t) => acc + t.change, 0);
      const cardSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method.includes('Tarjeta')).reduce((s, p) => s + p.amount, 0), 0);
      const transferSales = shiftTx.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Transferencia').reduce((s, p) => s + p.amount, 0), 0);
      
      return { totalRevenue, cashSales, cardSales, transferSales };
  };

  const activeStats = getCurrentShiftStats();

  return (
    <div className="max-w-[98%] mx-auto space-y-4 animate-in fade-in">
       {/* HEADER SUPERIOR */}
       <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg flex justify-between items-center no-print border-b-4 border-blue-600">
          <div className="flex items-center gap-6">
             <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${currentShift ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/20 border-rose-500/50 text-rose-400'}`}>
                {currentShift ? <Unlock size={18}/> : <Lock size={18}/>}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">{currentShift ? 'Turno Abierto' : 'Caja Cerrada'}</p>
                    <p className="text-[9px] opacity-60 font-bold mt-1">{currentShift ? `#${currentShift.id.slice(-6)}` : 'Requiere Apertura'}</p>
                </div>
             </div>
             <div className="flex bg-slate-800 p-1 rounded-2xl shadow-inner">
                <button onClick={() => setActiveTab('pos')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'pos' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>TPV Cobro</button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>Libro Diario</button>
             </div>
          </div>
          <button onClick={() => { if(!currentShift) setShiftForm({...shiftForm, initialCash: lastClosedShift?.amountLeftForNextShift || 250}); setShowShiftModal(true); }} className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${currentShift ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
             {currentShift ? 'Realizar Corte (Z)' : 'Abrir Turno'}
          </button>
       </div>

       {/* ... GRID PRINCIPAL SE MANTIENE IGUAL ... */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[75vh]">
          {/* PANEL IZQUIERDO: TICKET / INFO PACIENTE */}
          <div className="lg:col-span-5 flex flex-col gap-4">
             {/* Búsqueda de Paciente */}
             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4"><User size={14} className="text-slate-400"/><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atención a:</p></div>
                {selectedPatient ? (
                    <div className="flex justify-between items-center bg-blue-50 p-5 rounded-2xl border border-blue-100 animate-in slide-in-from-left-4">
                        <div>
                            <p className="text-sm font-black text-blue-900 uppercase">{selectedPatient.name}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[9px] text-blue-600 font-bold uppercase">Exp: {selectedPatient.id}</span>
                                {selectedPatient.paymentStatus === 'Pendiente' && <span className="text-[9px] text-amber-600 font-black uppercase bg-amber-100 px-2 rounded">Pago Pendiente</span>}
                            </div>
                        </div>
                        <button onClick={() => setSelectedPatient(null)} className="p-2.5 bg-white text-slate-400 rounded-xl hover:text-rose-500 shadow-sm transition-all"><X size={18}/></button>
                    </div>
                ) : (
                    <div className="relative">
                        <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-500 transition-all shadow-inner" placeholder="Buscar paciente por nombre o folio..." value={patientSearchTerm} onChange={e => setPatientSearchTerm(e.target.value)} />
                        {patientSearchTerm.length > 2 && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] max-h-40 overflow-y-auto p-2 space-y-1">
                                {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p => (
                                    <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearchTerm(''); }} className="w-full text-left p-3 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase">{p.name}</button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* BOTÓN IMPORTAR CUENTAS PENDIENTES */}
                {selectedPatient && selectedPatient.pendingCharges && selectedPatient.pendingCharges.length > 0 && (
                    <button 
                        onClick={handleImportPendingCharges}
                        className="w-full mt-3 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-amber-600 transition-all flex items-center justify-center gap-2 animate-pulse"
                    >
                        <FileInput size={14}/> Importar {selectedPatient.pendingCharges.length} Cargos Pendientes
                    </button>
                )}
             </div>

             {/* TICKET ACTUAL */}
             <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] shadow-sm flex flex-col overflow-hidden">
                {/* ... Ticket Content ... */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><ShoppingCart size={16}/> TICKET ACTUAL</h3>
                    <button onClick={() => setCart([])} className="text-[9px] font-black text-rose-500 hover:underline uppercase">Vaciar</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.map((item, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-400 transition-all group shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-[11px] font-black text-slate-800 uppercase leading-snug w-3/4">{item.concept}</p>
                                <button onClick={() => setCart(cart.filter((_,i)=>i!==idx))} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-1">
                                        <button onClick={() => { const n=[...cart]; n[idx].quantity=Math.max(1,n[idx].quantity-1); setCart(n); }} className="p-1 hover:bg-white rounded-lg transition-all"><Minus size={12}/></button>
                                        <span className="w-8 text-center text-[11px] font-black">{item.quantity}</span>
                                        <button onClick={() => { const n=[...cart]; n[idx].quantity+=1; setCart(n); }} className="p-1 hover:bg-white rounded-lg transition-all"><Plus size={12}/></button>
                                    </div>
                                    {(item.linkedSupplies && item.linkedSupplies.length > 0) && (
                                        <div className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                            {item.linkedSupplies.length} Insumos Incl.
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex-1">
                                    <p className="text-xs font-black text-slate-900">${(item.unitPrice + item.tax).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div className="py-20 text-center opacity-10"><ShoppingCart size={48} className="mx-auto" /></div>}
                </div>

                {/* AREA DE DESCUENTOS Y NOTAS */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Percent size={10} /> Descuento (%)</label>
                            <input 
                                type="number" 
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-blue-600 outline-none"
                                value={globalDiscount}
                                onChange={e => setGlobalDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-[2] space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MessageSquare size={10} /> Notas Internas</label>
                            <input 
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none"
                                value={saleNotes}
                                onChange={e => setSaleNotes(e.target.value)}
                                placeholder="Ref..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-100 border-t border-slate-200 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-black text-rose-500 uppercase">
                            <span>Descuento</span><span>-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Impuestos</span><span>${cartTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                        <span className="text-sm font-black uppercase text-slate-900">Total a Cobrar</span>
                        <span className="text-4xl font-black text-blue-600 tracking-tighter">${cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => setShowPaymentModal(true)} 
                        disabled={cart.length === 0} 
                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-20 active:scale-95"
                    >
                        <DollarSign size={18}/> PROCESAR PAGO
                    </button>
                </div>
             </div>
          </div>

          {/* PANEL DERECHO: CATÁLOGO / HISTORIAL */}
          <div className="lg:col-span-7 flex flex-col gap-4">
             {activeTab === 'pos' ? (
                <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-500 shadow-sm" placeholder="Buscar por código o descripción..." value={itemSearchTerm} onChange={e => setItemSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {prices.filter(p => p.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).map(item => (
                                <button key={item.id} onClick={() => addToCart(item)} className="text-left p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-400 hover:shadow-xl transition-all group flex flex-col justify-between h-40 relative overflow-hidden">
                                    <div className="space-y-1 relative z-10">
                                        <p className="text-[11px] font-black text-slate-800 uppercase leading-snug line-clamp-2">{item.name}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{item.category}</p>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-slate-50 pt-4 relative z-10">
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">${item.price}</p>
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Plus size={16}/></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             ) : (
                <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
                        <Calendar size={18} className="text-slate-400"/>
                        <input type="date" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none" value={historyDate} onChange={e => setHistoryDate(e.target.value)} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {globalHistory.map((item: any) => (
                            <div key={item.id} className={`p-5 border rounded-3xl transition-all shadow-sm ${
                                item.type === 'OPEN' ? 'bg-emerald-50 border-emerald-100' :
                                item.type === 'CLOSE' ? 'bg-rose-50 border-rose-100' :
                                'bg-white border-slate-100 hover:border-blue-400'
                            }`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                            item.type === 'OPEN' ? 'bg-emerald-600 text-white' :
                                            item.type === 'CLOSE' ? 'bg-rose-600 text-white' :
                                            item.status === 'Cancelada' ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'
                                        }`}>
                                            {item.type === 'OPEN' ? <Unlock size={24}/> :
                                             item.type === 'CLOSE' ? <Lock size={24}/> :
                                             <Receipt size={24}/>}
                                        </div>
                                        <div>
                                            <p className={`text-[11px] font-black uppercase ${item.status === 'Cancelada' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.patientName}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(item.timestamp).toLocaleTimeString()} • {item.type === 'SALE' ? `Folio: ${item.id.slice(-8)}` : item.details}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-4">
                                            <p className={`text-lg font-black tracking-tighter ${item.type === 'OPEN' ? 'text-emerald-700' : item.type === 'CLOSE' ? 'text-rose-700' : (item.status === 'Cancelada' ? 'text-slate-300 line-through' : 'text-blue-700')}`}>${(item.total || 0).toFixed(2)}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{item.type === 'SALE' ? 'VENTA' : item.type === 'OPEN' ? 'APERTURA' : 'CIERRE'}</p>
                                        </div>
                                        {item.type === 'SALE' ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => { setSelectedTicket(item); setShowTicketModal(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all" title="Ver/Reimprimir"><Eye size={16}/></button>
                                                {item.status !== 'Cancelada' && <button onClick={() => handleCancelTicket(item)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all" title="Cancelar"><FileX size={16}/></button>}
                                            </div>
                                        ) : item.type === 'CLOSE' && (
                                            <button onClick={() => { setViewingShift(item.rawShift); setShowShiftModal(true); }} className="px-4 py-2 bg-white/50 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2">
                                                <ListPlus size={14}/> Ver Detalles
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </div>
       </div>

       {/* MODAL COBRO ... (Sin cambios) */}
       {showPaymentModal && (
          <div className="fixed inset-0 z-[400] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
             {/* ... (Contenido del modal de cobro se mantiene igual) ... */}
             <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl p-12 h-[90vh] flex flex-col md:flex-row gap-12 border border-white/20">
                <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Procesar Pago</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccione método y confirme monto</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia'].map(m => (
                                <button key={m} onClick={() => { setCurrentMethod(m as any); }} className={`p-6 rounded-3xl border-2 transition-all font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 ${currentMethod === m ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                                   {m === 'Efectivo' ? <Banknote size={24}/> : m.includes('Tarjeta') ? <CardIcon size={24}/> : <Landmark size={24}/>}
                                   {m}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Monto a abonar en {currentMethod}</label>
                            <div className="relative">
                                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                <input 
                                    type="number" 
                                    autoFocus
                                    className="w-full pl-14 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-3xl font-black text-slate-900 outline-none focus:border-blue-500 transition-all shadow-inner"
                                    placeholder="0.00"
                                    value={amountInput}
                                    onChange={e => setAmountInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                                />
                                {remaining > 0 && (
                                    <button 
                                        onClick={() => setAmountInput(remaining.toFixed(2))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[9px] font-black uppercase hover:bg-blue-200 transition-all flex items-center gap-2"
                                    >
                                        <ArrowDownLeft size={12}/> Restante: ${remaining.toFixed(2)}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleAddPayment} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95 mt-auto">
                        <Plus size={20}/> Registrar Pago
                    </button>
                </div>
                <div className="w-full md:w-96 bg-slate-50 rounded-[3rem] p-10 border border-slate-200 flex flex-col shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Wallet size={14}/> Resumen de Transacción</h4>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-6 custom-scrollbar pr-2">
                        {paymentMethods.map((p, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-right-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        {p.method === 'Efectivo' ? <Banknote size={14}/> : <CardIcon size={14}/>}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-900">{p.method}</p>
                                        <p className="text-[9px] font-bold text-emerald-600">+ ${p.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemovePayment(i)} className="text-rose-300 hover:text-rose-600 p-2"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {paymentMethods.length === 0 && <div className="text-center py-20 opacity-20 text-[10px] font-black uppercase border-2 border-dashed border-slate-200 rounded-3xl">Esperando pagos...</div>}
                    </div>
                    <div className="space-y-4 pt-6 border-t border-slate-200">
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                            <span>Total Ticket</span><span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase">
                            <span>Total Pagado</span><span>${totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400">{remaining > 0 ? 'Faltante' : 'Cambio'}</span>
                            <span className={`text-xl font-black ${remaining > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                ${remaining > 0 ? remaining.toFixed(2) : Math.abs(change).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button onClick={() => { setShowPaymentModal(false); setPaymentMethods([]); }} className="py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[9px] uppercase hover:bg-slate-100 transition-all">Cancelar</button>
                        <button 
                            onClick={processSale} 
                            disabled={remaining > 0.05} 
                            className="py-5 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase shadow-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={16}/> Finalizar
                        </button>
                    </div>
                </div>
             </div>
          </div>
       )}

       {/* MODAL CORTE Z SIMPLIFICADO */}
       {showShiftModal && (
          <div className="fixed inset-0 z-[500] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl p-12 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="text-center space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        {viewingShift ? 'Resumen de Corte Z' : (currentShift ? 'Arqueo de Caja' : 'Apertura de Turno')}
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {viewingShift ? `${new Date(viewingShift.closedAt!).toLocaleString()}` : 'Cierre Operativo Simplificado'}
                    </p>
                </div>

                {/* LOGICA SIMPLIFICADA DE ARQUEO */}
                {viewingShift || (currentShift && activeStats) ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                            {/* 1. FLUJO DE EFECTIVO */}
                            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fondo Inicial en Caja</span>
                                <span className="text-xl font-black text-slate-900">+ ${(viewingShift ? viewingShift.initialCash : currentShift!.initialCash).toFixed(2)}</span>
                            </div>
                            
                            {/* 2. VENTAS */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShoppingCart size={12}/> Ventas del Turno</p>
                                <div className="flex justify-between items-center pl-4 border-l-2 border-emerald-200">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Efectivo</span>
                                    <span className="text-lg font-black text-emerald-600">+ ${(viewingShift ? viewingShift.systemTotals.cash : activeStats!.cashSales).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pl-4 border-l-2 border-blue-200">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tarjeta (T.C./T.D.)</span>
                                    <span className="text-lg font-black text-blue-600">${(viewingShift ? (viewingShift.systemTotals.creditCard + viewingShift.systemTotals.debitCard) : activeStats!.cardSales).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pl-4 border-l-2 border-indigo-200">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Transferencia</span>
                                    <span className="text-lg font-black text-indigo-600">${(viewingShift ? viewingShift.systemTotals.transfer : activeStats!.transferSales).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t-2 border-slate-200 pt-4">
                                <span className="text-xs font-black text-slate-900 uppercase">Total Vendido</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight">${(viewingShift ? viewingShift.systemTotals.total : activeStats!.totalRevenue).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 3. INPUT RETIRO (SOLO AL CERRAR) */}
                        {!viewingShift ? (
                            <div className="bg-slate-900 text-white p-8 rounded-[3rem] space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Efectivo Total en Caja (Teórico)</label>
                                        <span className="text-2xl font-black">${((currentShift!.initialCash) + (activeStats!.cashSales)).toFixed(2)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Fondo para Siguiente Turno</label>
                                        <input 
                                            type="number" 
                                            autoFocus
                                            className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-2xl font-black text-center text-white outline-none focus:bg-white/20"
                                            value={shiftForm.leaveForNext} 
                                            onChange={e => setShiftForm({...shiftForm, leaveForNext: parseFloat(e.target.value) || 0})} 
                                        />
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/20 pt-4">
                                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Retiro de Efectivo (Corte)</label>
                                        <span className="text-3xl font-black text-white tracking-tight">
                                            ${Math.max(0, ((currentShift!.initialCash) + (activeStats!.cashSales)) - shiftForm.leaveForNext).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={handleCloseShift} className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3">
                                    <LogOut size={16}/> Confirmar Cierre
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fondo Dejado</span>
                                <span className="text-xl font-black text-slate-900">${viewingShift.amountLeftForNextShift?.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    // VISTA DE APERTURA (Solo si no hay turno abierto)
                    !currentShift && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fondo Inicial para Cambio</label>
                                <input type="number" className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-4xl font-black text-center outline-none focus:border-blue-500 shadow-inner" value={shiftForm.initialCash} onChange={e => setShiftForm({...shiftForm, initialCash: parseFloat(e.target.value) || 0})} />
                            </div>
                            <button onClick={handleOpenShift} className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-all">INICIAR TURNO</button>
                        </div>
                    )
                )}
                
                <button onClick={() => { setShowShiftModal(false); setViewingShift(null); }} className="w-full text-slate-300 hover:text-slate-500 font-black text-[10px] uppercase tracking-widest">Cerrar Ventana</button>
             </div>
          </div>
       )}

       {/* MODAL TICKET / REIMPRESIÓN ... (Sin cambios) */}
       {showTicketModal && (lastTransaction || selectedTicket) && (
          <div className="fixed inset-0 z-[600] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in no-print">
             <div className="bg-white w-[80mm] rounded-[2rem] shadow-2xl p-8 flex flex-col items-center border border-white/20">
                <ShieldCheck size={48} className="text-slate-900 mb-4" />
                <h4 className="text-lg font-black uppercase tracking-tight">MedExpediente MX</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-6 tracking-widest">Comprobante Digital</p>
                <div className="w-full border-y border-dashed border-slate-200 py-4 mb-6 space-y-2 font-mono text-[9px] uppercase">
                    <div className="flex justify-between"><span>Folio:</span><span className="font-black">{(lastTransaction || selectedTicket)?.id}</span></div>
                    <div className="flex justify-between"><span>Fecha:</span><span>{new Date((lastTransaction || selectedTicket)!.date).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-slate-100 pt-2"><span>Atendió:</span><span className="font-bold truncate max-w-[120px]">{(lastTransaction || selectedTicket)?.cashier}</span></div>
                    <div className="flex justify-between"><span>Paciente:</span><span className="font-bold truncate max-w-[120px]">{(lastTransaction || selectedTicket)?.patientName}</span></div>
                </div>
                <div className="w-full space-y-2 mb-6 max-h-32 overflow-y-auto no-scrollbar">
                    {(lastTransaction || selectedTicket)?.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-[9px] uppercase font-mono"><span className="flex-1 pr-4">{item.quantity} x {item.concept}</span><span className="font-black text-right">${item.total.toFixed(2)}</span></div>
                    ))}
                </div>
                <div className="w-full border-t-2 border-slate-900 pt-4 space-y-1 font-mono">
                    <div className="flex justify-between text-[11px] font-black uppercase"><span>Total</span><span>${(lastTransaction || selectedTicket)?.total.toFixed(2)}</span></div>
                    {(lastTransaction || selectedTicket)?.change! > 0 && <div className="flex justify-between text-[9px]"><span>Cambio</span><span>${(lastTransaction || selectedTicket)?.change.toFixed(2)}</span></div>}
                </div>
                {(lastTransaction || selectedTicket)?.notes && <div className="w-full mt-4 p-2 bg-slate-50 text-[8px] font-medium uppercase text-center italic border border-slate-100 rounded-lg">{(lastTransaction || selectedTicket)?.notes}</div>}
                <div className="mt-8 flex flex-col items-center opacity-30"><QrCode size={64} /><p className="text-[7px] font-black uppercase mt-4">Gracias por su preferencia</p></div>
                <div className="grid grid-cols-2 gap-3 w-full mt-10">
                    <button onClick={() => window.print()} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"><Printer size={14}/> Imprimir</button>
                    <button onClick={() => { setShowTicketModal(false); setLastTransaction(null); setSelectedTicket(null); }} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all hover:bg-slate-200">Cerrar</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default Billing;
