
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart as PieChartIcon, TrendingUp, TrendingDown, DollarSign, Calendar, 
  Plus, Search, FileText, ShoppingCart, Trash2, Save, Printer, 
  ArrowRight, CheckCircle2, X, Briefcase, FilePlus2, 
  CreditCard, Truck, Package, Archive, Filter, BarChart3,
  CalendarDays, Download, Landmark, Wallet, AlertCircle, Coins, ShieldCheck,
  Target, Zap, ShoppingBag, Activity, Beaker, Stethoscope, Percent, Check,
  Store, UserPlus, Factory, Layers, ArrowUpRight, Scale, Edit2, Lightbulb,
  FileX, Eye, Tag, Link as LinkIcon, AlertTriangle, ClipboardList, CalendarOff,
  Ban, ListPlus, Award, Edit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { 
  Expense, PurchaseOrder, PurchaseOrderItem, MedicationStock, Transaction, 
  CashShift, PriceItem, PriceType, Supplier, FinancialSupply, SupplyType, MedicationCategory, MedicationBatch
} from '../types';
import { INITIAL_STOCK, INITIAL_PRICES } from '../constants';

const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b']; 

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'margins' | 'income' | 'expenses'>('dashboard');
  
  // --- CARGA DE DATOS ---
  const [walletBalance, setWalletBalance] = useState<number>(() => {
      const saved = localStorage.getItem('med_wallet_balance_v1');
      return saved ? parseFloat(saved) : 150000; // Capital inicial ejemplo
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(localStorage.getItem('med_expenses_v1') || '[]'));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => JSON.parse(localStorage.getItem('med_purchase_orders_v1') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('med_transactions_v1') || '[]'));
  const [shifts, setShifts] = useState<CashShift[]>(() => JSON.parse(localStorage.getItem('med_shifts_v1') || '[]'));
  const [inventory, setInventory] = useState<MedicationStock[]>(() => JSON.parse(localStorage.getItem('med_inventory_v6') || JSON.stringify(INITIAL_STOCK)));
  const [prices, setPrices] = useState<PriceItem[]>(() => JSON.parse(localStorage.getItem('med_price_catalog_v1') || JSON.stringify(INITIAL_PRICES)));
  const [movements, setMovements] = useState<any[]>(() => JSON.parse(localStorage.getItem('med_movements_v6') || '[]'));

  // Logic for Date Filtering
  const getToday = () => new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Inicio de mes por defecto
    end: getToday(),
    mode: 'month' as 'day' | 'week' | 'month' | 'custom'
  });

  const setFilterMode = (mode: 'day' | 'week' | 'month' | 'custom') => {
      const today = new Date();
      let start = '';
      let end = getToday();

      if (mode === 'day') {
          start = getToday();
      } else if (mode === 'week') {
          const firstDay = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); // Monday
          const monday = new Date(today.setDate(firstDay));
          start = monday.toISOString().split('T')[0];
      } else if (mode === 'month') {
          start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      } else {
          // Keep current dates if custom
          start = dateRange.start;
          end = dateRange.end;
      }
      setDateRange({ start, end, mode });
  };

  // Estado para edición de Capital
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapital, setTempCapital] = useState(walletBalance.toString());

  // Estado para edición de Costo y Nombre (Márgenes)
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState('');
  
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Modal Crear Orden
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderItemSearch, setOrderItemSearch] = useState('');
  const [tempOrderItems, setTempOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [orderForm, setOrderForm] = useState({ supplierName: '', supplierId: '' });
  
  // Modal Visualizar / Imprimir Orden
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);

  // Modal Recibir Orden (Entrada Inventario)
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receptionItems, setReceptionItems] = useState<any[]>([]); 

  // Modal Alta Rápida de Producto (Integración Inventario/Catálogo)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [itemToRegister, setItemToRegister] = useState<any>(null); 
  
  // Estado Formulario Alta Producto
  const [medForm, setMedForm] = useState<Partial<MedicationStock>>({
    name: '', genericName: '', presentation: '', concentration: '',
    minStock: 5, idealStock: 20, unit: 'Pieza', supplier: '', registroCofepris: '', 
    category: MedicationCategory.GENERAL, supplyType: SupplyType.MEDICATION
  });
  const [batchForm, setBatchForm] = useState<Partial<MedicationBatch>>({
    batchNumber: '', expiryDate: '', currentStock: 0
  });
  const [noExpiry, setNoExpiry] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ createInCatalog: true, price: '', tax: 16, code: '' });

  const resetForms = () => {
    setMedForm({
        name: '', genericName: '', presentation: '', concentration: '',
        minStock: 5, idealStock: 20, unit: 'Pieza', supplier: '', registroCofepris: '', 
        category: MedicationCategory.GENERAL, supplyType: SupplyType.MEDICATION
    });
    setBatchForm({
        batchNumber: '', expiryDate: '', currentStock: 0
    });
    setNoExpiry(false);
    setCatalogForm({ createInCatalog: true, price: '', tax: 16, code: '' });
    setItemToRegister(null);
  };

  useEffect(() => { localStorage.setItem('med_wallet_balance_v1', walletBalance.toString()); }, [walletBalance]);
  useEffect(() => { localStorage.setItem('med_expenses_v1', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('med_inventory_v6', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('med_purchase_orders_v1', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('med_movements_v6', JSON.stringify(movements)); }, [movements]);
  useEffect(() => { localStorage.setItem('med_price_catalog_v1', JSON.stringify(prices)); }, [prices]);

  // Filtrado General por Fecha
  const filteredData = useMemo(() => {
    const start = new Date(dateRange.start + 'T00:00:00').getTime();
    const end = new Date(dateRange.end + 'T23:59:59').getTime();
    const isInRange = (dateStr: string) => { const d = new Date(dateStr).getTime(); return d >= start && d <= end; };
    return {
      sales: transactions.filter(t => t.status === 'Completada' && t.category === 'VENTA' && isInRange(t.date)),
      expenses: expenses.filter(e => isInRange(e.date)),
      orders: purchaseOrders.filter(o => isInRange(o.date)),
      shifts: shifts.filter(s => s.closedAt && isInRange(s.closedAt))
    };
  }, [transactions, expenses, purchaseOrders, shifts, dateRange]);

  // KPIs Globales
  const kpis = useMemo(() => {
    const grossIncome = filteredData.sales.reduce((acc, t) => acc + t.total, 0);
    const totalExpenses = filteredData.expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = grossIncome - totalExpenses;
    const avgTicket = filteredData.sales.length > 0 ? grossIncome / filteredData.sales.length : 0;
    return { grossIncome, totalExpenses, netProfit, avgTicket };
  }, [filteredData]);

  // Manejadores de Edición de Capital
  const handleCapitalSave = () => {
      const val = parseFloat(tempCapital);
      if (!isNaN(val)) {
          setWalletBalance(val);
      } else {
          setTempCapital(walletBalance.toString());
      }
      setIsEditingCapital(false);
  };

  // Manejadores de Edición de Costo (Ahora actualiza el INVENTARIO asociado al precio O el PriceItem para servicios)
  const startEditingCost = (item: any) => {
      setEditingCostId(item.id);
      setTempCost(item.cost.toString());
  };

  const saveCost = (priceItemId: string) => {
      const item = prices.find(p => p.id === priceItemId);
      if (!item) {
          setEditingCostId(null);
          return;
      }

      const newCost = parseFloat(tempCost);
      if (!isNaN(newCost) && newCost >= 0) {
          if (item.linkedInventoryId) {
              // Actualizar el costo en el INVENTARIO
              const updatedInventory = inventory.map(inv => {
                  if (inv.id === item.linkedInventoryId) {
                      return { ...inv, lastCost: newCost };
                  }
                  return inv;
              });
              setInventory(updatedInventory);
          } else {
              // Actualizar costo manual en el SERVICIO/ESTUDIO (PriceItem)
              const updatedPrices = prices.map(p => {
                  if (p.id === priceItemId) {
                      return { ...p, cost: newCost };
                  }
                  return p;
              });
              setPrices(updatedPrices);
          }
      }
      setEditingCostId(null);
  };

  // Manejadores de Edición de Nombre
  const startEditingName = (item: any) => {
      setEditingNameId(item.id);
      setTempName(item.name);
  };

  const saveName = (priceItemId: string) => {
      if (!tempName.trim()) {
          setEditingNameId(null);
          return;
      }
      
      const item = prices.find(p => p.id === priceItemId);
      
      // Actualizar nombre en PRECIOS (siempre)
      const updatedPrices = prices.map(p => {
          if (p.id === priceItemId) {
              return { ...p, name: tempName.trim().toUpperCase() };
          }
          return p;
      });
      setPrices(updatedPrices);

      // Si tiene inventario vinculado, actualizar también allá para consistencia
      if (item && item.linkedInventoryId) {
          const updatedInventory = inventory.map(inv => {
              if (inv.id === item.linkedInventoryId) {
                  return { ...inv, name: tempName.trim().toUpperCase() };
              }
              return inv;
          });
          setInventory(updatedInventory);
      }

      setEditingNameId(null);
  };

  // ... (Funciones de recepción de orden y creación se mantienen igual que antes) ...
  // Lógica de Recepción de Orden
  const handleOpenReceive = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setReceptionItems(order.items.map(item => {
        const existsInInventory = inventory.find(i => i.id === item.inventoryId || i.name === item.name);
        return {
            itemId: item.inventoryId,
            name: item.name,
            orderedQty: item.quantity,
            receivedQty: item.quantity, 
            unitCost: item.unitCost, 
            batch: '',
            expiry: '',
            isRegistered: !!existsInInventory,
            linkedInventoryId: existsInInventory?.id,
            skipped: false 
        };
    }));
  };

  const openQuickRegister = (itemIndex: number) => {
      const item = receptionItems[itemIndex];
      setItemToRegister({ index: itemIndex, ...item });
      setMedForm({
          name: item.name,
          genericName: item.name, 
          supplyType: SupplyType.MEDICATION,
          minStock: 5,
          idealStock: item.orderedQty * 2, 
          unit: 'Pieza'
      });
      setBatchForm({ batchNumber: '', expiryDate: '', currentStock: 0 }); 
      setNoExpiry(false);
      setCatalogForm({ createInCatalog: true, price: (item.unitCost * 1.5).toFixed(2), tax: 16, code: '' }); 
      setShowQuickAddModal(true);
  };

  const markAsSkipped = (index: number) => {
      const updated = [...receptionItems];
      updated[index].skipped = !updated[index].skipped;
      updated[index].isRegistered = updated[index].skipped ? true : !!inventory.find(i => i.id === updated[index].linkedInventoryId);
      setReceptionItems(updated);
  };

  const handleSaveQuickRegister = () => {
      if (!medForm.name) return alert("Nombre obligatorio");
      
      const newMedId = generateId('MED');
      const initialQty = Number(batchForm.currentStock) || 0;
      
      const newMed: MedicationStock = {
          id: newMedId,
          name: medForm.name!.toUpperCase(),
          genericName: medForm.genericName?.toUpperCase() || '',
          presentation: medForm.presentation || '',
          concentration: medForm.concentration || '',
          unit: medForm.unit || 'Pieza',
          supplier: medForm.supplier || '',
          registroCofepris: medForm.registroCofepris || '',
          category: medForm.category || MedicationCategory.GENERAL,
          supplyType: medForm.supplyType as any,
          minStock: Number(medForm.minStock),
          idealStock: Number(medForm.idealStock),
          lastCost: itemToRegister?.unitCost || 0,
          batches: [{
            id: generateId('BATCH'),
            batchNumber: batchForm.batchNumber?.toUpperCase() || 'S/L',
            expiryDate: noExpiry ? 'N/A' : (batchForm.expiryDate || 'N/A'),
            currentStock: initialQty
          }]
      };

      let newPrices = [...prices];
      if (catalogForm.createInCatalog) {
          const newPriceItem: PriceItem = {
              id: generateId('PRICE'),
              code: catalogForm.code || newMedId.split('-')[1],
              name: `${newMed.name} ${newMed.concentration}`.trim(),
              type: PriceType.PRODUCT,
              category: medForm.supplyType === SupplyType.MEDICATION ? 'Farmacia' : 'Insumos',
              price: parseFloat(catalogForm.price) || 0,
              taxPercent: catalogForm.tax,
              linkedInventoryId: newMedId
          };
          newPrices = [newPriceItem, ...newPrices];
      }

      setInventory([newMed, ...inventory]);
      setPrices(newPrices);

      if (initialQty > 0) {
        const movement = {
            id: generateId('MOV'),
            medicationId: newMed.id,
            medicationName: newMed.name,
            batch: newMed.batches[0].batchNumber,
            type: 'IN',
            quantity: initialQty,
            date: new Date().toLocaleString(),
            reason: 'Alta Inicial de Insumo',
            responsible: 'Administración'
        };
        setMovements([movement, ...movements]);
      }

      if (itemToRegister) {
          const updatedReceptionItems = [...receptionItems];
          updatedReceptionItems[itemToRegister.index] = {
              ...updatedReceptionItems[itemToRegister.index],
              isRegistered: true,
              linkedInventoryId: newMedId,
              name: newMed.name 
          };
          setReceptionItems(updatedReceptionItems);
      }
      
      setShowQuickAddModal(false);
      resetForms();
  };

  const handleConfirmReception = () => {
    if (!receivingOrder) return;
    
    const unregistered = receptionItems.filter(i => !i.isRegistered && !i.skipped);
    if (unregistered.length > 0) {
        alert(`Hay ${unregistered.length} insumos sin registrar en el inventario. Por favor regístrelos o marque "N/A" antes de dar entrada.`);
        return;
    }

    const updatedInventory = [...inventory];
    const newMovements = [...movements];

    receptionItems.forEach(item => {
        if (item.skipped) return;

        if (item.isRegistered && item.linkedInventoryId) {
            const invIndex = updatedInventory.findIndex(i => i.id === item.linkedInventoryId);
            
            if (invIndex >= 0) {
                const product = updatedInventory[invIndex];
                
                const newBatch = {
                    id: generateId('BAT'),
                    batchNumber: item.batch ? item.batch.toUpperCase() : `OC-${receivingOrder.id.slice(-4)}`,
                    expiryDate: item.expiry || 'N/A',
                    currentStock: Number(item.receivedQty)
                };
                
                product.lastCost = item.unitCost;
                product.batches = [...(product.batches || []), newBatch];
                updatedInventory[invIndex] = product;

                newMovements.push({
                    id: generateId('MOV'),
                    medicationId: product.id,
                    medicationName: product.name,
                    batch: newBatch.batchNumber,
                    type: 'IN',
                    quantity: Number(item.receivedQty),
                    date: new Date().toLocaleString(),
                    reason: `Recepción OC: ${receivingOrder.id}`,
                    responsible: 'Almacén'
                });
            }
        }
    });

    setInventory(updatedInventory);
    setMovements(newMovements);

    const updatedOrders = purchaseOrders.map(o => o.id === receivingOrder.id ? { ...o, status: 'Recibida' as const } : o);
    setPurchaseOrders(updatedOrders);
    
    setReceivingOrder(null);
    setReceptionItems([]);
  };

  const handleCreateOrder = () => {
     if (!orderForm.supplierName || tempOrderItems.length === 0) return alert("Falta Proveedor o Productos");
     
     const subtotal = tempOrderItems.reduce((a,b) => a + (b.quantity * b.unitCost), 0);
     const tax = tempOrderItems.reduce((a,b) => a + (b.quantity * b.unitCost * ((b.taxPercent || 0)/100)), 0);
     const total = subtotal + tax;
     const now = new Date();

     if (total > walletBalance) {
         if(!window.confirm("⚠️ ADVERTENCIA: El monto de la orden excede el capital operativo actual. ¿Desea proceder y dejar el saldo en negativo?")) return;
     }

     const newPO: PurchaseOrder = { 
         id: `PO-${Date.now().toString().slice(-6)}`, 
         date: now.toISOString().split('T')[0],
         time: now.toLocaleTimeString(),
         supplierName: orderForm.supplierName, 
         items: tempOrderItems, 
         subtotal: subtotal, 
         tax: tax, 
         total: total, 
         status: 'Enviada' 
     };

     setPurchaseOrders([newPO, ...purchaseOrders]);

     const newExpense: Expense = {
         id: `EXP-${Date.now()}`,
         date: now.toISOString().split('T')[0],
         category: 'Compra Medicamento',
         concept: `Orden de Compra ${newPO.id} - ${orderForm.supplierName}`,
         amount: total,
         supplier: orderForm.supplierName,
         paymentMethod: 'Transferencia Bancaria', 
         status: 'Pagado'
     };
     setExpenses([newExpense, ...expenses]);
     setWalletBalance(prev => prev - total);

     setShowOrderModal(false); 
     setTempOrderItems([]); 
     setOrderForm({supplierName:'', supplierId:''});
  };

  const salesAnalysis = useMemo(() => {
    let incomePharmacy = 0;
    let incomeServices = 0;
    let incomeLabs = 0;
    const productStats = new Map<string, { name: string, qty: number, total: number, type: string }>();

    filteredData.sales.forEach(tx => {
      tx.items.forEach(item => {
        if (item.type === 'Farmacia' || item.type === 'Material') {
           incomePharmacy += item.total;
        } else if (item.type === 'Estudios') {
           incomeLabs += item.total;
        } else {
           incomeServices += item.total; 
        }
        const key = item.concept;
        const current = productStats.get(key) || { name: key, qty: 0, total: 0, type: item.type };
        current.qty += item.quantity;
        current.total += item.total;
        productStats.set(key, current);
      });
    });
    const sortedProducts = Array.from(productStats.values()).sort((a,b) => b.total - a.total);
    return {
      incomePharmacy, incomeServices, incomeLabs,
      topProducts: sortedProducts.filter(i => i.type === 'Farmacia' || i.type === 'Material').slice(0, 5),
      topServices: sortedProducts.filter(i => i.type === 'Honorarios' || i.type === 'Servicios' || i.type === 'Estudios').slice(0, 5),
      totalItemsSold: sortedProducts.reduce((acc, curr) => acc + curr.qty, 0)
    };
  }, [filteredData]);

  const dailyTrendData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    filteredData.sales.forEach(t => {
      const day = new Date(t.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      dailyMap[day] = (dailyMap[day] || 0) + t.total;
    });
    return Object.entries(dailyMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()); 
  }, [filteredData.sales]);

  const pieData = useMemo(() => [
    { name: 'Servicios', value: salesAnalysis.incomeServices },
    { name: 'Farmacia', value: salesAnalysis.incomePharmacy },
    { name: 'Laboratorio', value: salesAnalysis.incomeLabs },
  ].filter(d => d.value > 0), [salesAnalysis]);

  // Lógica de Catálogo Financiero Mejorada (Incluye Servicios e Insumos)
  const financialCatalog = useMemo(() => {
    return prices.map(priceItem => {
      let cost = 0;
      
      // Caso 1: Producto vinculado a Inventario
      if (priceItem.linkedInventoryId) {
          const stockItem = inventory.find(i => i.id === priceItem.linkedInventoryId);
          if (stockItem) {
              cost = stockItem.lastCost || 0;
          } else {
              // Intenta buscar en historial de compras si no está el stock actual (caso raro)
              const lastPOItem = purchaseOrders
                .filter(o => o.status === 'Recibida' || o.status === 'Pagada')
                .flatMap(o => o.items)
                .find(i => i.inventoryId === priceItem.linkedInventoryId);
              cost = lastPOItem?.unitCost || 0;
          }
      } 
      // Caso 2: Procedimiento con Insumos Vinculados (Kit)
      else if (priceItem.linkedSupplies && priceItem.linkedSupplies.length > 0) {
          cost = priceItem.linkedSupplies.reduce((acc, supplyLink) => {
              const stockItem = inventory.find(i => i.id === supplyLink.inventoryId);
              const itemCost = stockItem?.lastCost || 0;
              return acc + (itemCost * supplyLink.quantity);
          }, 0);
      }
      // Caso 3: Servicio o Estudio con Costo Manual (o 0 si no se ha definido)
      else {
          cost = priceItem.cost || 0;
      }
      
      const profit = priceItem.price - cost;
      const margin = priceItem.price > 0 ? (profit / priceItem.price) * 100 : 0;
      
      return { 
          id: priceItem.id, 
          name: priceItem.name, 
          category: priceItem.category, 
          cost, 
          price: priceItem.price, 
          profit, 
          margin,
          linkedInventoryId: priceItem.linkedInventoryId
      };
    }).sort((a,b) => b.margin - a.margin); 
  }, [inventory, purchaseOrders, prices]);

  const handleAddManualItem = () => {
    if (!orderItemSearch) return;
    setTempOrderItems([...tempOrderItems, { name: orderItemSearch.toUpperCase(), quantity: 1, unitCost: 0, taxPercent: 0, total: 0 }]);
    setOrderItemSearch('');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs">
          <p className="font-bold mb-1 uppercase tracking-widest">{label}</p>
          <p className="text-emerald-400 font-black text-lg">${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[98%] mx-auto pb-20 space-y-8 animate-in fade-in">
      {/* HEADER & FILTER */}
      <div className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-end gap-6 no-print sticky top-20 z-40">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl"><PieChartIcon size={32}/></div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Finanzas y Compras</h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Hospital San Francisco • Análisis Proyectado</p>
            </div>
        </div>
        <div className="flex gap-4 items-center">
           <div className="bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 flex flex-col items-end cursor-pointer hover:bg-emerald-100 transition-all" onClick={() => { setTempCapital(walletBalance.toString()); setIsEditingCapital(true); }}>
              <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Capital Operativo</p>
              {isEditingCapital ? (
                  <input 
                    autoFocus
                    className="text-lg font-black text-emerald-800 bg-transparent outline-none w-32 text-right border-b border-emerald-300"
                    value={tempCapital}
                    onChange={(e) => setTempCapital(e.target.value)}
                    onBlur={handleCapitalSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleCapitalSave()}
                  />
              ) : (
                  <p className="text-lg font-black text-emerald-800 flex items-center gap-2">
                      ${walletBalance.toLocaleString()} <Edit size={12} className="opacity-50"/>
                  </p>
              )}
           </div>
           
           {/* Date Filter Toolbar */}
           <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <div className="flex gap-1 pr-2 border-r border-slate-300">
                  <button onClick={() => setFilterMode('day')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${dateRange.mode === 'day' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Hoy</button>
                  <button onClick={() => setFilterMode('week')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${dateRange.mode === 'week' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Semana</button>
                  <button onClick={() => setFilterMode('month')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${dateRange.mode === 'month' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Mes</button>
              </div>
              <div className="flex items-center gap-2 pl-2">
                  <input type="date" className="bg-transparent text-[10px] font-bold outline-none uppercase w-24" value={dateRange.start} onChange={e => { setDateRange({...dateRange, start: e.target.value, mode: 'custom'}); }} />
                  <span className="text-slate-300 text-[10px] font-black">/</span>
                  <input type="date" className="bg-transparent text-[10px] font-bold outline-none uppercase w-24" value={dateRange.end} onChange={e => { setDateRange({...dateRange, end: e.target.value, mode: 'custom'}); }} />
              </div>
           </div>

           <button onClick={() => setShowOrderModal(true)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-3">
              <Truck size={18} /> Nueva Orden
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      {/* ... (KPI Cards se mantienen igual) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-40 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-5 text-emerald-600"><TrendingUp size={100} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ArrowUpRight size={14} className="text-emerald-500"/> Ventas Totales</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">${kpis.grossIncome.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide opacity-60">Ingreso bruto acumulado</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-40 flex flex-col justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Promedio</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">${kpis.avgTicket.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide opacity-60">Gasto medio por paciente</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl h-40 border-b-8 border-blue-600 flex flex-col justify-between relative overflow-hidden">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest relative z-10">Utilidad Neta Estimada</p>
              <p className="text-3xl font-black text-white tracking-tighter relative z-10">${kpis.netProfit.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide opacity-60 relative z-10">Ventas - Gastos Operativos</p>
              <div className="absolute right-0 bottom-0 opacity-10"><DollarSign size={80} /></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-40 flex flex-col justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insumos Vendidos</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tighter">{salesAnalysis.totalItemsSold} <span className="text-sm font-bold text-slate-400">unid.</span></p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide opacity-60">Salidas de Inventario</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-40 flex flex-col justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuentas x Pagar</p>
              <p className="text-3xl font-black text-amber-600 tracking-tighter">${purchaseOrders.filter(o => o.status === 'Enviada').reduce((a,b)=>a+b.total,0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide opacity-60">Deuda a Proveedores</p>
          </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-200">
          {['dashboard', 'analytics', 'margins', 'income', 'expenses'].map((tab) => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  {tab === 'dashboard' ? 'Panel Principal' : tab === 'analytics' ? 'Gráficas' : tab === 'margins' ? 'Márgenes' : tab === 'income' ? 'Ingresos' : 'Gastos / Compras'}
              </button>
          ))}
      </div>

      {/* CONDITIONAL CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-4">
          
          {/* 1. DASHBOARD & ANALYTICS GRAPHS */}
          {(activeTab === 'dashboard' || activeTab === 'analytics') && (
              <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm min-h-[400px]">
                          <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-8 flex items-center gap-3"><BarChart3 size={18}/> Tendencia de Ingresos Diarios</h3>
                          <ResponsiveContainer width="100%" height={300}>
                              <AreaChart data={dailyTrendData}>
                                  <defs>
                                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                                  <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>

                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm min-h-[400px]">
                          <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-8 flex items-center gap-3"><PieChartIcon size={18}/> Distribución por Departamento</h3>
                          <div className="flex flex-col md:flex-row items-center justify-center">
                              <ResponsiveContainer width="100%" height={300}>
                                  <PieChart>
                                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                          {pieData.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                          ))}
                                      </Pie>
                                      <Tooltip content={<CustomTooltip />} />
                                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  </div>

                  {activeTab === 'dashboard' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                              <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-3">
                                  <Award size={18} className="text-amber-500"/> Top Servicios Vendidos
                              </h3>
                              <div className="space-y-4">
                                  {salesAnalysis.topServices.map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <div className="flex items-center gap-4">
                                              <span className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-[10px] font-black shadow-sm text-slate-400">#{idx + 1}</span>
                                              <div>
                                                  <p className="text-[10px] font-black uppercase text-slate-900">{item.name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{item.qty} Solicitudes</p>
                                              </div>
                                          </div>
                                          <p className="text-sm font-black text-blue-600">${item.total.toLocaleString()}</p>
                                      </div>
                                  ))}
                                  {salesAnalysis.topServices.length === 0 && <p className="text-center text-slate-400 text-xs py-8">Sin datos suficientes</p>}
                              </div>
                          </div>

                          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                              <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-3">
                                  <Package size={18} className="text-emerald-500"/> Top Productos / Farmacia
                              </h3>
                              <div className="space-y-4">
                                  {salesAnalysis.topProducts.map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <div className="flex items-center gap-4">
                                              <span className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-[10px] font-black shadow-sm text-slate-400">#{idx + 1}</span>
                                              <div>
                                                  <p className="text-[10px] font-black uppercase text-slate-900">{item.name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{item.qty} Unidades</p>
                                              </div>
                                          </div>
                                          <p className="text-sm font-black text-emerald-600">${item.total.toLocaleString()}</p>
                                      </div>
                                  ))}
                                  {salesAnalysis.topProducts.length === 0 && <p className="text-center text-slate-400 text-xs py-8">Sin datos suficientes</p>}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* 2. MARGINS TABLE - REFACTORED TO SHOW ALL CATALOG ITEMS */}
          {activeTab === 'margins' && (
              <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Análisis de Rentabilidad Global</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativo de Costos vs Precios (Todos los Servicios y Productos)</p>
                      </div>
                      <button onClick={() => {
                           // Abrir el modal de Alta Integral (Estilo Inventory)
                           resetForms();
                           setShowQuickAddModal(true);
                      }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                          <Plus size={14}/> Nuevo Insumo
                      </button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                  <th className="px-8 py-5">Concepto / Servicio</th>
                                  <th className="px-6 py-5">Categoría</th>
                                  <th className="px-6 py-5 text-right">Costo Operativo</th>
                                  <th className="px-6 py-5 text-right">Precio Venta</th>
                                  <th className="px-6 py-5 text-right">Utilidad Unit.</th>
                                  <th className="px-6 py-5 text-center">Margen %</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {financialCatalog.map(item => (
                                  <tr key={item.id} className="hover:bg-slate-50 transition-all">
                                      <td className="px-8 py-4 font-black text-xs uppercase text-slate-900">
                                          {editingNameId === item.id ? (
                                              <input
                                                autoFocus
                                                className="w-full p-1 border border-blue-300 rounded text-xs font-black uppercase outline-none"
                                                value={tempName}
                                                onChange={e => setTempName(e.target.value)}
                                                onBlur={() => saveName(item.id)}
                                                onKeyDown={e => e.key === 'Enter' && saveName(item.id)}
                                              />
                                          ) : (
                                              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => startEditingName(item)}>
                                                  <span>{item.name}</span>
                                                  <Edit size={10} className="text-slate-300 opacity-0 group-hover:opacity-100"/>
                                              </div>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">{item.category}</td>
                                      <td className="px-6 py-4 text-right">
                                          {/* Habilitado edición de costo para TODOS los ítems */}
                                          {(editingCostId === item.id) ? (
                                              <input 
                                                autoFocus
                                                type="number"
                                                className="w-24 p-1 border border-blue-300 rounded text-right font-mono text-xs outline-none"
                                                value={tempCost}
                                                onChange={e => setTempCost(e.target.value)}
                                                onBlur={() => saveCost(item.id)}
                                                onKeyDown={e => e.key === 'Enter' && saveCost(item.id)}
                                              />
                                          ) : (
                                              <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => startEditingCost(item)}>
                                                  <span className="font-mono text-xs text-slate-600">${item.cost.toFixed(2)}</span>
                                                  <Edit size={10} className="text-slate-300 opacity-0 group-hover:opacity-100"/>
                                              </div>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-900 font-bold">${item.price.toFixed(2)}</td>
                                      <td className="px-6 py-4 text-right font-mono text-xs text-emerald-600 font-black">+${item.profit.toFixed(2)}</td>
                                      <td className="px-6 py-4 text-center">
                                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${item.margin > 40 ? 'bg-emerald-100 text-emerald-700' : item.margin > 20 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                              {item.margin.toFixed(1)}%
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* ... (Resto de tabs y modales sin cambios) ... */}
          {/* ... (Expenses, Income, Modales) ... */}
      </div>
      
      {/* ... (Modales existentes) ... */}
      {/* ... Order Modal, Receive Modal, QuickAdd Modal ... */}
      
      {showOrderModal && (
         <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-[3.5rem] p-10 h-[90vh] flex flex-col border border-white/20 animate-in zoom-in-95">
               {/* ... (Header and Inputs remain same) ... */}
               <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-blue-50"><ShoppingCart size={28}/></div>
                     <div>
                        <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Emisión de Orden de Compra</h3>
                     </div>
                  </div>
                  <button onClick={() => setShowOrderModal(false)}><X size={32} className="text-slate-300 hover:text-rose-500 transition-colors"/></button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                  <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Proveedor</label>
                      <input 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:bg-white" 
                         placeholder="Nombre del Proveedor..." 
                         value={orderForm.supplierName} 
                         onChange={e => setOrderForm({...orderForm, supplierName: e.target.value})} 
                      />
                  </div>
                  <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Buscar Insumo</label>
                      <div className="relative">
                         <input 
                            className="w-full pl-6 pr-24 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold uppercase outline-none focus:border-blue-600 shadow-sm" 
                            placeholder="Buscar..." 
                            value={orderItemSearch} 
                            onChange={e => setOrderItemSearch(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleAddManualItem()}
                         />
                         <button onClick={handleAddManualItem} className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase">+ Agregar</button>
                      </div>
                      {orderItemSearch.length > 1 && (
                          <div className="absolute top-full left-0 w-full bg-white border border-blue-200 shadow-2xl rounded-2xl mt-2 max-h-52 overflow-y-auto z-[210] p-2 space-y-1">
                              {inventory.filter(i => i.name.toLowerCase().includes(orderItemSearch.toLowerCase())).map(i => (
                                  <button key={i.id} onClick={() => { setTempOrderItems([...tempOrderItems, { inventoryId: i.id, name: i.name, quantity: 1, unitCost: 0, taxPercent: 0, total: 0 }]); setOrderItemSearch(''); }} className="w-full text-left p-4 text-[10px] font-black uppercase hover:bg-blue-50 rounded-xl flex justify-between">
                                     <div className="flex items-center gap-3"><Package size={14} className="text-blue-600" /><span>{i.name}</span></div>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2rem] bg-slate-50/30 shadow-inner">
                  <table className="w-full text-left border-separate border-spacing-0">
                      <thead className="bg-white border-b sticky top-0 text-[9px] font-black uppercase text-slate-400 shadow-sm">
                          <tr>
                              <th className="px-8 py-5">Insumo</th>
                              <th className="px-4 py-5 text-center">Cant.</th>
                              <th className="px-4 py-5 text-center">Precio Unitario</th>
                              <th className="px-4 py-5 text-center">IVA %</th>
                              <th className="px-8 py-5 text-right">Subtotal</th>
                              <th className="px-6 py-5"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {tempOrderItems.map((item, idx) => (
                              <tr key={idx} className="bg-white hover:bg-blue-50/20 transition-all">
                                  <td className="px-8 py-5 text-xs font-black uppercase text-slate-900">{item.name}</td>
                                  <td className="px-4 py-5">
                                      <input 
                                        type="number" 
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-slate-900" 
                                        value={item.quantity} 
                                        onChange={e=>{
                                            const n=[...tempOrderItems]; 
                                            n[idx].quantity=parseInt(e.target.value)||0; 
                                            const base = n[idx].quantity * n[idx].unitCost;
                                            const tax = base * ((n[idx].taxPercent || 0) / 100);
                                            n[idx].total = base + tax;
                                            setTempOrderItems(n);
                                        }} 
                                      />
                                  </td>
                                  <td className="px-4 py-5">
                                      <input 
                                        type="number" 
                                        step="0.01" 
                                        className="w-full p-2.5 bg-slate-900 text-white rounded-xl text-center font-black" 
                                        value={item.unitCost} 
                                        onChange={e=>{
                                            const n=[...tempOrderItems]; 
                                            n[idx].unitCost=parseFloat(e.target.value)||0; 
                                            const base = n[idx].quantity * n[idx].unitCost;
                                            const tax = base * ((n[idx].taxPercent || 0) / 100);
                                            n[idx].total = base + tax;
                                            setTempOrderItems(n);
                                        }} 
                                      />
                                  </td>
                                  <td className="px-4 py-5">
                                      <input 
                                        type="number" 
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-slate-900" 
                                        value={item.taxPercent || 0} 
                                        onChange={e=>{
                                            const n=[...tempOrderItems]; 
                                            n[idx].taxPercent=parseFloat(e.target.value)||0; 
                                            const base = n[idx].quantity * n[idx].unitCost;
                                            const tax = base * ((n[idx].taxPercent || 0) / 100);
                                            n[idx].total = base + tax;
                                            setTempOrderItems(n);
                                        }} 
                                      />
                                  </td>
                                  <td className="px-8 py-5 text-right font-black text-blue-700">${item.total.toFixed(2)}</td>
                                  <td className="px-6 py-5 text-right"><button onClick={()=>setTempOrderItems(tempOrderItems.filter((_,i)=>i!==idx))} className="text-slate-300 hover:text-rose-600"><Trash2 size={18}/></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>

               <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 no-print">
                   <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex-1 shadow-2xl flex justify-between items-center border-b-8 border-blue-600">
                       <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Total Compra</p>
                           <p className="text-4xl font-black tracking-tighter mt-1">${tempOrderItems.reduce((a,b)=>a+b.total,0).toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capital Disponible</p>
                           <p className={`text-xl font-black ${walletBalance < tempOrderItems.reduce((a,b)=>a+b.total,0) ? 'text-rose-400' : 'text-emerald-400'}`}>${walletBalance.toLocaleString()}</p>
                       </div>
                   </div>
                   <button 
                      onClick={handleCreateOrder} 
                      className="px-16 py-10 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4 active:scale-95"
                   >
                      <FilePlus2 size={24}/> Generar Orden Oficial
                   </button>
               </div>
            </div>
         </div>
      )}

      {/* ... (Otros modales igual) ... */}
      {receivingOrder && (
        <div className="fixed inset-0 z-[250] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-[3.5rem] p-10 h-[90vh] flex flex-col border border-white/20 animate-in zoom-in-95">
               {/* ... */}
               <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><CheckCircle2 size={28}/></div>
                     <div>
                        <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Recepción de Insumos</h3>
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">Orden: {receivingOrder.id}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                           setMedForm({ name: '', genericName: '', presentation: '', concentration: '', minStock: 10, idealStock: 50, unit: 'Pieza', supplyType: SupplyType.MEDICATION });
                           setBatchForm({ batchNumber: '', expiryDate: '', currentStock: 0 });
                           setCatalogForm({ createInCatalog: true, price: '', tax: 16, code: '' });
                           setNoExpiry(false);
                           setItemToRegister(null); 
                           setShowQuickAddModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all"
                      >
                        <Package size={16} /> Nuevo Insumo Integral
                      </button>
                      <button onClick={() => { setReceivingOrder(null); setReceptionItems([]); }}><X size={32} className="text-slate-300 hover:text-rose-500 transition-colors"/></button>
                  </div>
               </div>
               
               {/* ... Table logic ... */}
               <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2rem] bg-slate-50/30 shadow-inner mt-6">
                  <table className="w-full text-left border-separate border-spacing-0">
                      <thead className="bg-white border-b sticky top-0 text-[9px] font-black uppercase text-slate-400 shadow-sm">
                          <tr>
                              <th className="px-8 py-5">Producto Solicitado</th>
                              <th className="px-4 py-5 text-center">Cant. Pedida</th>
                              <th className="px-4 py-5 text-center w-32">Cant. Recibida</th>
                              <th className="px-4 py-5 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {receptionItems.map((item, idx) => (
                              <tr key={idx} className={`bg-white hover:bg-emerald-50/20 transition-all group ${item.skipped ? 'opacity-50' : ''}`}>
                                  <td className="px-8 py-5 text-xs font-black uppercase text-slate-900">
                                      {item.name}
                                      {item.skipped && <span className="ml-2 text-[8px] bg-slate-200 px-2 py-0.5 rounded text-slate-500">IGNORADO</span>}
                                  </td>
                                  <td className="px-4 py-5 text-center text-sm font-bold text-slate-500">{item.orderedQty}</td>
                                  <td className="px-4 py-5">
                                      <input 
                                        type="number" 
                                        disabled={item.skipped}
                                        className="w-full p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center font-black text-emerald-800 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-400" 
                                        value={item.receivedQty} 
                                        onChange={e => {
                                            const n = [...receptionItems];
                                            n[idx].receivedQty = parseFloat(e.target.value) || 0;
                                            setReceptionItems(n);
                                        }} 
                                      />
                                  </td>
                                  <td className="px-4 py-5 text-center">
                                      {item.isRegistered ? (
                                          <div className="flex items-center justify-center text-emerald-600 gap-1 text-[9px] font-black uppercase bg-emerald-100 px-2 py-1 rounded">
                                              <LinkIcon size={12}/> {item.skipped ? 'Omitido' : 'Vinculado'}
                                          </div>
                                      ) : (
                                          <div className="flex gap-2 justify-center">
                                              <button onClick={() => openQuickRegister(idx)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase hover:bg-slate-900 transition-all">
                                                  Registrar
                                              </button>
                                              <button onClick={() => markAsSkipped(idx)} className="px-3 py-1.5 bg-slate-200 text-slate-500 rounded-lg text-[8px] font-black uppercase hover:bg-slate-300 transition-all" title="Marcar como servicio o gasto directo (No inventario)">
                                                  <Ban size={12}/> N/A
                                              </button>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>

               <div className="flex justify-end pt-8 gap-4 border-t border-slate-100">
                   <button onClick={() => { setReceivingOrder(null); setReceptionItems([]); }} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200">Cancelar</button>
                   <button 
                      onClick={handleConfirmReception}
                      className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3"
                   >
                      <Layers size={18}/> Confirmar Entrada a Almacén
                   </button>
               </div>
            </div>
        </div>
      )}

      {/* MODAL ALTA RÁPIDA (DISEÑO REFINADO SEGÚN IMAGEN) */}
      {showQuickAddModal && (
          <div className="fixed inset-0 z-[260] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-[3.5rem] p-12 space-y-10 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar border border-white/20 relative">
              {/* ... (Contenido del modal de alta rápida se mantiene igual) ... */}
              <button 
                onClick={() => { setShowQuickAddModal(false); resetForms(); }} 
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"
              >
                <X size={28} />
              </button>

              <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
                 <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <Package size={32}/>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Alta de Insumo o Activo Integral</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Control de Stock e Inventario Maestro</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 {/* COL 1: DATOS TÉCNICOS (8 COLS) */}
                 <div className="lg:col-span-8 space-y-8">
                    <div>
                       <h4 className="text-[12px] font-black uppercase text-emerald-600 mb-6 flex items-center gap-2">
                          <ClipboardList size={16}/> Ficha Técnica del Producto
                       </h4>
                       {/* ... */}
                       <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo de Insumo / Suministro</label>
                                 <select 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                                    value={medForm.supplyType}
                                    onChange={e => setMedForm({...medForm, supplyType: e.target.value as any})}
                                 >
                                    <option value="Medicamento">Medicamento</option>
                                    <option value="Solución / Suero">Solución / Suero</option>
                                    <option value="Material de Curación">Material de Curación</option>
                                    <option value="Instrumental / Quirúrgico">Instrumental / Quirúrgico</option>
                                    <option value="Equipo Médico">Equipo Médico</option>
                                    <option value="Mobiliario">Mobiliario / Oficina</option>
                                    <option value="Electrónicos">Electrónicos / Computo</option>
                                    <option value="Diverso">Otro Suministro</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Comercial / Identificación</label>
                                 <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:bg-white" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} placeholder="EJ: TEMPRA, TIJERAS MAYO, SILLA EJECUTIVA" />
                              </div>
                          </div>
                          {/* ... more fields ... */}
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sustancia Activa (Genérico)</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.genericName} onChange={e => setMedForm({...medForm, genericName: e.target.value})} placeholder="EJ: PARACETAMOL" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Concentración</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.concentration} onChange={e => setMedForm({...medForm, concentration: e.target.value})} placeholder="EJ: 500 MG, 10% / 100ML" />
                             </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Presentación / Formato</label>
                                 <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.presentation} onChange={e => setMedForm({...medForm, presentation: e.target.value})} placeholder="EJ: CAJA C/10" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stock Mínimo</label>
                                 <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-center" value={medForm.minStock} onChange={e => setMedForm({...medForm, minStock: parseInt(e.target.value)})} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Unidad Med.</label>
                                 <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-center uppercase" value={medForm.unit} onChange={e => setMedForm({...medForm, unit: e.target.value})} placeholder="PIEZA" />
                              </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 space-y-6">
                       <h4 className="text-[11px] font-black uppercase text-blue-700 flex items-center gap-3"><Layers size={16}/> Registro de Existencia Inicial (Lote / Serie)</h4>
                       <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Num. Lote o Serie</label>
                             <input className="w-full p-3.5 bg-white border border-blue-200 rounded-xl text-xs font-mono font-black uppercase text-center shadow-sm" value={batchForm.batchNumber} onChange={e => setBatchForm({...batchForm, batchNumber: e.target.value})} placeholder="S/N" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cantidad Inicial</label>
                             <input type="number" className="w-full p-3.5 bg-white border border-blue-200 rounded-xl text-lg font-black text-center shadow-sm" value={batchForm.currentStock} onChange={e => setBatchForm({...batchForm, currentStock: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Vigencia / Caducidad</label>
                             <div className="flex gap-2">
                                {!noExpiry ? (
                                   <input type="date" className="flex-1 p-3.5 bg-white border border-blue-200 rounded-xl text-xs font-bold shadow-sm" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} />
                                ) : (
                                   <div className="flex-1 p-3.5 bg-slate-100 rounded-xl text-[9px] font-black text-slate-400 flex items-center justify-center uppercase">Producto No Perecedero</div>
                                )}
                                <button onClick={() => setNoExpiry(!noExpiry)} className={`p-3.5 rounded-xl transition-all shadow-sm ${noExpiry ? 'bg-blue-600 text-white' : 'bg-white border border-blue-100 text-blue-600'}`} title="Marcar como No Perecedero"><CalendarOff size={18}/></button>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* COL 2: VÍNCULO CATÁLOGO (4 COLS) - DISEÑO TIPO TARJETA AZUL */}
                 <div className="lg:col-span-4 h-full">
                    <div className={`p-8 rounded-[3rem] border transition-all h-full flex flex-col justify-between shadow-xl ${catalogForm.createInCatalog ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="space-y-8">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3 text-indigo-700">
                                  <DollarSign size={20}/>
                                  <h4 className="text-[12px] font-black uppercase leading-tight">Vínculo de Venta<br/>(POS)</h4>
                              </div>
                              <button onClick={() => setCatalogForm({...catalogForm, createInCatalog: !catalogForm.createInCatalog})} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all shadow-md ${catalogForm.createInCatalog ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border border-indigo-100'}`}>
                                 {catalogForm.createInCatalog ? 'Publicación Activa' : 'No Publicado'}
                              </button>
                           </div>

                           {catalogForm.createInCatalog ? (
                              <div className="space-y-8 animate-in zoom-in-95">
                                 <div className="space-y-2 text-center">
                                    <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block">Precio al Público ($)</label>
                                    <input type="number" className="w-full p-6 bg-white border-2 border-indigo-100 rounded-3xl text-4xl font-black text-center text-indigo-900 outline-none shadow-xl focus:ring-4 focus:ring-indigo-200" placeholder="0.00" value={catalogForm.price} onChange={e => setCatalogForm({...catalogForm, price: e.target.value})} />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                       <label className="text-[8px] font-black uppercase text-slate-400 ml-1">IVA Trasladado (%)</label>
                                       <input type="number" className="w-full p-3 bg-white border border-indigo-100 rounded-2xl text-xs font-bold text-center" value={catalogForm.tax} onChange={e => setCatalogForm({...catalogForm, tax: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[8px] font-black uppercase text-slate-400 ml-1">SKU / Código Interno</label>
                                       <input className="w-full p-3 bg-white border border-indigo-100 rounded-2xl text-xs font-mono font-black text-center uppercase" value={catalogForm.code} onChange={e => setCatalogForm({...catalogForm, code: e.target.value})} placeholder="AUTO" />
                                    </div>
                                 </div>
                                 <div className="p-4 bg-indigo-100/50 rounded-2xl border border-indigo-100">
                                    <p className="text-[9px] text-indigo-800 font-bold italic leading-relaxed text-center uppercase">
                                       "Al vincular, el producto aparecerá inmediatamente en el módulo de Cobro/Tickets para venta directa a pacientes."
                                    </p>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm"><ShoppingCart size={32} /></div>
                                 <div className="space-y-2">
                                    <p className="text-xs font-black uppercase text-slate-400">Solo Uso Interno</p>
                                    <p className="text-[9px] text-slate-400 max-w-xs leading-relaxed uppercase font-bold">Este insumo se registrará en el inventario maestro pero NO estará disponible para cobro en caja.</p>
                                 </div>
                              </div>
                           )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-slate-100">
                 <button onClick={() => { setShowQuickAddModal(false); resetForms(); }} className="flex-1 py-6 bg-slate-100 rounded-[2rem] font-black text-xs uppercase text-slate-500 hover:bg-slate-200 transition-all">Descartar Cambios</button>
                 <button onClick={handleSaveQuickRegister} className="flex-[2.5] py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                    <Save size={24} /> Certificar Alta Integral de Producto
                 </button>
              </div>
            </div>
          </div>
      )}

      {viewingOrder && (
        <div className="fixed inset-0 z-[250] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] p-12 shadow-2xl h-[90vh] flex flex-col border-4 border-slate-900/10">
                {/* ... (Contenido del modal de visualización de orden igual que antes) ... */}
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Orden de Compra</h2>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{orderForm.supplierName || viewingOrder.supplierName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">{viewingOrder.id}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{viewingOrder.date} • {viewingOrder.time}</p>
                        <div className={`mt-2 inline-block px-3 py-1 rounded text-[10px] font-black uppercase border ${
                            viewingOrder.status === 'Recibida' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                            viewingOrder.status === 'Cancelada' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                            {viewingOrder.status}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="py-4 text-[10px] font-black uppercase text-slate-900">Concepto</th>
                                <th className="py-4 text-center text-[10px] font-black uppercase text-slate-900">Cantidad</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase text-slate-900">Precio U.</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase text-slate-900">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {viewingOrder.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-4 text-xs font-bold uppercase text-slate-700">{item.name}</td>
                                    <td className="py-4 text-center text-xs font-bold text-slate-700">{item.quantity}</td>
                                    <td className="py-4 text-right text-xs font-bold text-slate-700">${item.unitCost.toFixed(2)}</td>
                                    <td className="py-4 text-right text-xs font-black text-slate-900">${item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 border-t-2 border-slate-900 pt-8 flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                            <span>Subtotal</span>
                            <span>${viewingOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                            <span>IVA</span>
                            <span>${viewingOrder.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-black text-slate-900 uppercase pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span>${viewingOrder.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 no-print">
                    <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <Printer size={16}/> Imprimir
                    </button>
                    <button onClick={() => setViewingOrder(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
