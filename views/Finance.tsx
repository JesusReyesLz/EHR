
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, TrendingUp, TrendingDown, DollarSign, Calendar, 
  Plus, Search, FileText, ShoppingCart, Trash2, Save, Printer, 
  ArrowRight, CheckCircle2, X, Briefcase, FilePlus2, 
  CreditCard, Truck, Package, Archive, Filter, BarChart3,
  CalendarDays, Download, Landmark, Wallet, AlertCircle, Coins, ShieldCheck
} from 'lucide-react';
import { Expense, PurchaseOrder, PurchaseOrderItem, MedicationStock, Transaction, CashShift, PatientAccount } from '../types';
import { INITIAL_STOCK } from '../constants';

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expenses' | 'receivables' | 'payables' | 'audit'>('dashboard');
  
  // --- CARGA DE DATOS (Simulación de Base de Datos Global) ---
  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(localStorage.getItem('med_expenses_v1') || '[]'));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => JSON.parse(localStorage.getItem('med_purchase_orders_v1') || '[]'));
  const [transactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('med_transactions_v1') || '[]'));
  const [shifts] = useState<CashShift[]>(() => JSON.parse(localStorage.getItem('med_shifts_v1') || '[]'));
  const [accounts] = useState<PatientAccount[]>(() => JSON.parse(localStorage.getItem('med_accounts_v1') || '[]'));
  const [inventory] = useState<MedicationStock[]>(() => JSON.parse(localStorage.getItem('med_inventory_v6') || JSON.stringify(INITIAL_STOCK)));

  // --- FILTROS DE TIEMPO ---
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Primer día del mes actual
    end: new Date().toISOString().split('T')[0], // Hoy
    label: 'Este Mes'
  });

  // --- UI STATES ---
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Forms
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    category: 'Compra Medicamento', paymentMethod: 'Efectivo Caja', date: new Date().toISOString().split('T')[0], amount: 0, concept: '', supplier: '', status: 'Pagado'
  });
  const [orderForm, setOrderForm] = useState<Partial<PurchaseOrder>>({
    supplier: '', date: new Date().toISOString().split('T')[0], items: [], status: 'Borrador'
  });
  const [orderItemSearch, setOrderItemSearch] = useState('');
  const [tempOrderItems, setTempOrderItems] = useState<PurchaseOrderItem[]>([]);

  // Persistencia Local
  useEffect(() => { localStorage.setItem('med_expenses_v1', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('med_purchase_orders_v1', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);

  // --- MOTOR DE ANÁLISIS FINANCIERO ---
  
  const setPeriod = (period: 'today' | 'week' | 'month' | 'last_month' | 'year') => {
      const today = new Date();
      let start = new Date();
      let end = new Date();
      let label = '';

      switch (period) {
          case 'today':
              start = today;
              label = 'Hoy';
              break;
          case 'week':
              const day = today.getDay();
              const diff = today.getDate() - day + (day === 0 ? -6 : 1);
              start = new Date(today.setDate(diff));
              label = 'Esta Semana';
              break;
          case 'month':
              start = new Date(today.getFullYear(), today.getMonth(), 1);
              label = 'Este Mes';
              break;
          case 'last_month':
              start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              end = new Date(today.getFullYear(), today.getMonth(), 0);
              label = 'Mes Anterior';
              break;
          case 'year':
              start = new Date(today.getFullYear(), 0, 1);
              label = 'Año Fiscal';
              break;
      }
      setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label });
  };

  // Filtrado de Datos por Fecha
  const filteredData = useMemo(() => {
      const start = new Date(dateRange.start + 'T00:00:00').getTime();
      const end = new Date(dateRange.end + 'T23:59:59').getTime();

      const isInRange = (dateStr: string) => {
          const d = new Date(dateStr).getTime();
          return d >= start && d <= end;
      };

      return {
          sales: transactions.filter(t => t.status === 'Completada' && t.category === 'VENTA' && isInRange(t.date)),
          expenses: expenses.filter(e => isInRange(e.date)),
          orders: purchaseOrders.filter(o => isInRange(o.date)),
          shifts: shifts.filter(s => s.closedAt && isInRange(s.closedAt)) // Solo turnos cerrados
      };
  }, [transactions, expenses, purchaseOrders, shifts, dateRange]);

  // KPIs Financieros
  const kpis = useMemo(() => {
      const grossIncome = filteredData.sales.reduce((acc, t) => acc + t.total, 0);
      const totalExpenses = filteredData.expenses.reduce((acc, e) => acc + e.amount, 0);
      const netProfit = grossIncome - totalExpenses;
      const profitMargin = grossIncome > 0 ? (netProfit / grossIncome) * 100 : 0;
      
      // Desglose por método de pago
      const incomeByMethod = {
          cash: filteredData.sales.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Efectivo').reduce((s, p) => s + p.amount, 0), 0),
          card: filteredData.sales.reduce((acc, t) => acc + t.payments.filter(p => p.method.includes('Tarjeta')).reduce((s, p) => s + p.amount, 0), 0),
          transfer: filteredData.sales.reduce((acc, t) => acc + t.payments.filter(p => p.method === 'Transferencia').reduce((s, p) => s + p.amount, 0), 0),
      };

      // Cuentas por Cobrar (Saldos pendientes totales, no filtrados por fecha, es deuda viva)
      const receivables = accounts.reduce((acc, a) => {
          const pending = a.charges.filter(c => c.status === 'Pendiente').reduce((s, c) => s + c.total, 0);
          return acc + pending; // + a.balance si se usara logica de abonos parciales
      }, 0);

      // Cuentas por Pagar (Ordenes no pagadas)
      const payables = purchaseOrders.filter(o => o.status === 'Enviada' || o.status === 'Recibida').reduce((acc, o) => acc + o.total, 0);

      return { grossIncome, totalExpenses, netProfit, profitMargin, incomeByMethod, receivables, payables };
  }, [filteredData, accounts, purchaseOrders]);

  // --- RENDERIZADO DE GRÁFICAS MANUALES (SVG) ---
  const renderTrendChart = () => {
      // Agrupar por día
      const daysMap = new Map<string, {income: number, expense: number}>();
      // Rellenar días en el rango (aprox)
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          daysMap.set(d.toISOString().split('T')[0], { income: 0, expense: 0 });
      }

      filteredData.sales.forEach(t => {
          const d = t.date.split(',')[0].split('/').reverse().join('-'); // Ajuste formato fecha si es local
          // Fallback simple por si el formato de fecha varía
          const dateKey = t.date.includes('/') ? new Date(t.date).toISOString().split('T')[0] : t.date.split('T')[0];
          if(daysMap.has(dateKey)) {
              daysMap.get(dateKey)!.income += t.total;
          }
      });
      filteredData.expenses.forEach(e => {
          const dateKey = e.date.split('T')[0];
          if(daysMap.has(dateKey)) {
              daysMap.get(dateKey)!.expense += e.amount;
          }
      });

      const dataPoints = Array.from(daysMap.entries()).map(([date, val]) => ({ date, ...val }));
      if (dataPoints.length === 0) return null;

      const maxVal = Math.max(...dataPoints.map(d => Math.max(d.income, d.expense)), 100);
      const height = 150;
      const width = 100; // porcentaje
      const stepX = 100 / (dataPoints.length - 1 || 1);

      const incomePoints = dataPoints.map((d, i) => `${i * stepX},${height - (d.income / maxVal) * height}`).join(' ');
      const expensePoints = dataPoints.map((d, i) => `${i * stepX},${height - (d.expense / maxVal) * height}`).join(' ');

      return (
          <div className="h-48 w-full relative">
              <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1={height} x2="100" y2={height} stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1={height/2} x2="100" y2={height/2} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  
                  {/* Areas */}
                  <path d={`M0,${height} ${incomePoints} L100,${height} Z`} fill="url(#gradIncome)" opacity="0.2" />
                  
                  {/* Lines */}
                  <polyline points={incomePoints} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <polyline points={expensePoints} fill="none" stroke="#f43f5e" strokeWidth="2" vectorEffect="non-scaling-stroke" />

                  <defs>
                      <linearGradient id="gradIncome" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                  </defs>
              </svg>
              {/* Labels (Simplified) */}
              <div className="absolute bottom-0 w-full flex justify-between text-[8px] text-slate-400 font-bold uppercase mt-2">
                  <span>{dateRange.start}</span>
                  <span>{dateRange.end}</span>
              </div>
          </div>
      );
  };

  // --- HANDLERS (CRUD) ---
  const handleSaveExpense = () => {
    if (!expenseForm.concept || !expenseForm.amount) return alert("Concepto y Monto requeridos");
    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      date: expenseForm.date || new Date().toISOString(),
      category: expenseForm.category as any,
      concept: expenseForm.concept,
      amount: Number(expenseForm.amount),
      supplier: expenseForm.supplier,
      paymentMethod: expenseForm.paymentMethod as any,
      status: expenseForm.status as any,
      ticketReference: expenseForm.ticketReference
    };
    setExpenses([newExpense, ...expenses]);
    setShowExpenseModal(false);
    setExpenseForm({ category: 'Compra Medicamento', paymentMethod: 'Efectivo Caja', date: new Date().toISOString().split('T')[0], amount: 0, concept: '', supplier: '', status: 'Pagado' });
  };

  const handleSaveOrder = () => {
    if (!orderForm.supplier || tempOrderItems.length === 0) return alert("Datos incompletos");
    const subtotal = tempOrderItems.reduce((acc, i) => acc + i.total, 0);
    const tax = subtotal * 0.16;
    const newOrder: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-6)}`,
      date: orderForm.date || new Date().toISOString(),
      supplier: orderForm.supplier,
      items: tempOrderItems,
      subtotal, tax, total: subtotal + tax, status: 'Enviada'
    };
    setPurchaseOrders([newOrder, ...purchaseOrders]);
    setShowOrderModal(false);
    setOrderForm({ supplier: '', date: new Date().toISOString().split('T')[0], items: [], status: 'Borrador' });
    setTempOrderItems([]);
  };

  const handleAddOrderItem = (invItem: MedicationStock) => {
    const existing = tempOrderItems.find(i => i.inventoryId === invItem.id);
    if (existing) setTempOrderItems(tempOrderItems.map(i => i.inventoryId === invItem.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitCost } : i));
    else setTempOrderItems([...tempOrderItems, { inventoryId: invItem.id, name: invItem.name, quantity: 1, unitCost: 0, total: 0 }]);
    setOrderItemSearch('');
  };

  const updateOrderItem = (invId: string, field: 'quantity' | 'unitCost', value: number) => {
    setTempOrderItems(prev => prev.map(item => {
      if (item.inventoryId === invId) {
        const qty = field === 'quantity' ? value : item.quantity;
        const cost = field === 'unitCost' ? value : item.unitCost;
        return { ...item, quantity: qty, unitCost: cost, total: qty * cost };
      }
      return item;
    }));
  };

  const removeOrderItem = (invId: string) => {
    setTempOrderItems(prev => prev.filter(item => item.inventoryId !== invId));
  };

  const filteredInventory = useMemo(() => {
    if (!orderItemSearch) return [];
    return inventory.filter(i => i.name.toLowerCase().includes(orderItemSearch.toLowerCase()));
  }, [orderItemSearch, inventory]);

  return (
    <div className="max-w-[95%] mx-auto pb-20 animate-in fade-in space-y-8">
      {/* 1. TOP BAR: CONTROLES DE FECHA Y NAVEGACIÓN */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-6 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm sticky top-20 z-30 no-print">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><PieChart size={24}/></div>
            <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Suite Financiera</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Contabilidad y Control de Gestión</p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {['today', 'week', 'month', 'last_month', 'year'].map((p: any) => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${dateRange.label === (p === 'today' ? 'Hoy' : p === 'week' ? 'Esta Semana' : p === 'month' ? 'Este Mes' : p === 'last_month' ? 'Mes Anterior' : 'Año Fiscal') ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes Actual' : p === 'last_month' ? 'Mes Ant.' : 'Año'}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                <Calendar size={14} className="text-slate-400"/>
                <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value, label: 'Personalizado'})} className="bg-transparent text-[10px] font-bold outline-none uppercase w-24" />
                <span className="text-slate-300">al</span>
                <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value, label: 'Personalizado'})} className="bg-transparent text-[10px] font-bold outline-none uppercase w-24" />
            </div>
            <button className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-blue-600 transition-all" onClick={() => window.print()}><Printer size={18}/></button>
        </div>
      </div>

      {/* 2. TABLERO DE CONTROL (KPIs y Gráficas) */}
      {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
              {/* Tarjetas KPI */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-all transform group-hover:scale-110"><TrendingUp size={80}/></div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><DollarSign size={12}/> Ingresos Brutos</p>
                      <div>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">${kpis.grossIncome.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Periodo: {dateRange.label}</p>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-all transform group-hover:scale-110 text-rose-600"><TrendingDown size={80}/></div>
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2"><ArrowRight size={12} className="rotate-45"/> Gastos Operativos</p>
                      <div>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">${kpis.totalExpenses.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Compras + Gastos</p>
                      </div>
                  </div>
                  <div className={`p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between h-40 relative overflow-hidden ${kpis.netProfit >= 0 ? 'bg-slate-900' : 'bg-rose-600'}`}>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2"><Landmark size={12}/> Utilidad Neta</p>
                      <div>
                          <p className="text-3xl font-black tracking-tighter">${kpis.netProfit.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                          <p className="text-[9px] font-bold text-white/60 mt-1 uppercase">Margen: {kpis.profitMargin.toFixed(1)}%</p>
                      </div>
                  </div>
                  <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm flex flex-col justify-between h-40">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Wallet size={12}/> Por Cobrar (CxC)</p>
                      <div>
                          <p className="text-3xl font-black text-indigo-900 tracking-tighter">${kpis.receivables.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                          <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Crédito a Pacientes</p>
                      </div>
                  </div>
              </div>

              {/* Gráfica Principal y Desgloses */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={16} className="text-blue-600"/> Flujo de Efectivo</h3>
                          <div className="flex gap-4 text-[9px] font-black uppercase">
                              <span className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Ingresos</span>
                              <span className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Egresos</span>
                          </div>
                      </div>
                      {renderTrendChart()}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2"><CreditCard size={16} className="text-indigo-600"/> Métodos de Ingreso</h3>
                      <div className="space-y-4 flex-1">
                          {[
                              { label: 'Efectivo', amount: kpis.incomeByMethod.cash, color: 'bg-emerald-500', text: 'text-emerald-700' },
                              { label: 'Tarjetas', amount: kpis.incomeByMethod.card, color: 'bg-blue-500', text: 'text-blue-700' },
                              { label: 'Transferencia', amount: kpis.incomeByMethod.transfer, color: 'bg-indigo-500', text: 'text-indigo-700' },
                          ].map(m => (
                              <div key={m.label} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                                      <span>{m.label}</span>
                                      <span>${m.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full ${m.color}`} style={{ width: `${kpis.grossIncome > 0 ? (m.amount / kpis.grossIncome) * 100 : 0}%` }}></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Estado de Resultados (Simplificado)</p>
                          <div className="mt-4 space-y-2 text-xs font-bold uppercase">
                              <div className="flex justify-between text-emerald-700"><span>(+) Ventas</span><span>${kpis.grossIncome.toLocaleString()}</span></div>
                              <div className="flex justify-between text-rose-600"><span>(-) Gastos</span><span>-${kpis.totalExpenses.toLocaleString()}</span></div>
                              <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-black"><span>(=) Utilidad</span><span>${kpis.netProfit.toLocaleString()}</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 3. BARRA DE NAVEGACIÓN INTERNA */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar no-print">
          {[
              { id: 'dashboard', label: 'Visión General', icon: <PieChart size={16}/> },
              { id: 'income', label: 'Ingresos (Ventas)', icon: <TrendingUp size={16}/> },
              { id: 'expenses', label: 'Egresos (Gastos)', icon: <TrendingDown size={16}/> },
              { id: 'receivables', label: 'Cuentas x Cobrar', icon: <Wallet size={16}/> },
              { id: 'payables', label: 'Cuentas x Pagar', icon: <Truck size={16}/> },
              { id: 'audit', label: 'Auditoría Caja', icon: <ShieldCheck size={16}/> },
          ].map(tab => (
              <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-3 transition-all border ${activeTab === tab.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                  {tab.icon} {tab.label}
              </button>
          ))}
      </div>

      {/* 4. VISTAS DETALLADAS (LIBROS) */}
      
      {/* VISTA INGRESOS */}
      {activeTab === 'income' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900 uppercase">Libro de Ventas</h3>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Periodo</p>
                      <p className="text-xl font-black text-emerald-600">${filteredData.sales.reduce((a,b)=>a+b.total,0).toLocaleString()}</p>
                  </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <tr><th className="px-8 py-4">Folio</th><th className="px-4 py-4">Fecha</th><th className="px-4 py-4">Cliente</th><th className="px-4 py-4 text-center">Método</th><th className="px-4 py-4 text-center">Cajero</th><th className="px-8 py-4 text-right">Monto Total</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                          {filteredData.sales.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50">
                                  <td className="px-8 py-4 font-mono text-[10px]">{t.id}</td>
                                  <td className="px-4 py-4">{t.date}</td>
                                  <td className="px-4 py-4 uppercase text-slate-900">{t.patientName}</td>
                                  <td className="px-4 py-4 text-center">{t.payments.map(p=>p.method).join(', ')}</td>
                                  <td className="px-4 py-4 text-center uppercase text-[10px]">{t.cashier}</td>
                                  <td className="px-8 py-4 text-right font-black text-emerald-700">${t.total.toFixed(2)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* VISTA EGRESOS */}
      {activeTab === 'expenses' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-black text-slate-900 uppercase">Control de Gastos</h3>
                  <button onClick={() => setShowExpenseModal(true)} className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center gap-2">
                      <Plus size={14}/> Nuevo Gasto
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <tr><th className="px-8 py-4">Fecha</th><th className="px-4 py-4">Concepto</th><th className="px-4 py-4">Categoría</th><th className="px-4 py-4">Proveedor</th><th className="px-4 py-4 text-center">Forma Pago</th><th className="px-8 py-4 text-right">Monto</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                          {filteredData.expenses.map(e => (
                              <tr key={e.id} className="hover:bg-slate-50">
                                  <td className="px-8 py-4 text-[10px]">{e.date}</td>
                                  <td className="px-4 py-4 uppercase text-slate-900">{e.concept}</td>
                                  <td className="px-4 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black uppercase">{e.category}</span></td>
                                  <td className="px-4 py-4 uppercase text-[10px]">{e.supplier || '-'}</td>
                                  <td className="px-4 py-4 text-center uppercase text-[10px]">{e.paymentMethod}</td>
                                  <td className="px-8 py-4 text-right font-black text-rose-600">-${e.amount.toFixed(2)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* VISTA CUENTAS POR COBRAR */}
      {activeTab === 'receivables' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-8 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 uppercase">Cuentas por Cobrar (Saldos Pacientes)</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <tr><th className="px-8 py-4">Paciente</th><th className="px-4 py-4">Detalle Cargos Pendientes</th><th className="px-8 py-4 text-right">Saldo Deudor</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                          {accounts.filter(a => a.charges.some(c => c.status === 'Pendiente')).map((acc, i) => {
                              const pendingTotal = acc.charges.filter(c => c.status === 'Pendiente').reduce((s, c) => s + c.total, 0);
                              return (
                                  <tr key={i} className="hover:bg-slate-50">
                                      <td className="px-8 py-4 uppercase text-indigo-900 font-black">Paciente ID: {acc.patientId}</td>
                                      <td className="px-4 py-4">
                                          <div className="space-y-1">
                                              {acc.charges.filter(c => c.status === 'Pendiente').map(c => (
                                                  <div key={c.id} className="flex justify-between text-[10px] text-slate-500 uppercase border-b border-dashed border-slate-100 pb-1">
                                                      <span>{c.date.split(',')[0]} - {c.concept}</span>
                                                      <span>${c.total.toFixed(2)}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      </td>
                                      <td className="px-8 py-4 text-right font-black text-indigo-600 text-lg">${pendingTotal.toFixed(2)}</td>
                                  </tr>
                              );
                          })}
                          {accounts.filter(a => a.charges.some(c => c.status === 'Pendiente')).length === 0 && (
                              <tr><td colSpan={3} className="py-20 text-center opacity-30 font-black uppercase text-slate-400">No hay deudas pendientes</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* VISTA CUENTAS POR PAGAR (ORDENES DE COMPRA) */}
      {activeTab === 'payables' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-black text-slate-900 uppercase">Cuentas por Pagar (Proveedores)</h3>
                  <button onClick={() => setShowOrderModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                      <FilePlus2 size={14}/> Crear Orden
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                  {purchaseOrders.map(order => (
                      <div key={order.id} className="border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl transition-all group bg-white flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors"><ShoppingCart className="text-slate-400 group-hover:text-blue-600"/></div>
                                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${order.status === 'Pagada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{order.status}</span>
                              </div>
                              <h4 className="text-sm font-black text-slate-900 uppercase">{order.supplier}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{order.date} • Folio: {order.id}</p>
                              <div className="mt-4 space-y-1 border-t border-slate-50 pt-2">
                                  {order.items.slice(0,3).map((item, i) => (
                                      <p key={i} className="text-[9px] text-slate-500 uppercase truncate flex justify-between"><span>{item.name}</span><span>x{item.quantity}</span></p>
                                  ))}
                              </div>
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                              <p className="text-xl font-black text-slate-900">${order.total.toFixed(2)}</p>
                              {order.status !== 'Pagada' && <button className="text-[9px] font-black text-blue-600 hover:underline uppercase bg-blue-50 px-3 py-1 rounded-lg">Registrar Pago</button>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* VISTA AUDITORÍA DE CAJA (UPDATED WITH DETAILS) */}
      {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-8 border-b border-slate-100"><h3 className="text-lg font-black text-slate-900 uppercase">Auditoría Financiera de Turnos (Cortes Z)</h3></div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <tr>
                              <th className="px-8 py-4">ID Turno</th>
                              <th className="px-4 py-4">Horario</th>
                              <th className="px-4 py-4 text-center">Responsable</th>
                              <th className="px-4 py-4 text-right text-blue-600">Inicial</th>
                              <th className="px-4 py-4 text-right text-emerald-600">Ventas</th>
                              <th className="px-4 py-4 text-right text-amber-600">Mov. Caja</th>
                              <th className="px-4 py-4 text-right">Final Real</th>
                              <th className="px-4 py-4 text-center">Diferencia</th>
                              <th className="px-8 py-4 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                          {filteredData.shifts.slice().reverse().map(s => {
                              const cashIn = s.systemTotals.cashIn || 0;
                              const cashOut = s.systemTotals.cashOut || 0;
                              const netMovement = cashIn - cashOut;
                              
                              return (
                                  <tr key={s.id} className="hover:bg-slate-50">
                                      <td className="px-8 py-4 font-mono text-[10px]">{s.id.slice(-8)}</td>
                                      <td className="px-4 py-4 text-[10px]"><p>IN: {new Date(s.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p><p className="text-slate-400">OUT: {new Date(s.closedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></td>
                                      <td className="px-4 py-4 text-center uppercase text-[10px]">{s.openedBy}</td>
                                      <td className="px-4 py-4 text-right">${s.initialCash.toFixed(2)}</td>
                                      <td className="px-4 py-4 text-right text-emerald-700 font-black">${s.systemTotals.total.toFixed(2)}</td>
                                      <td className={`px-4 py-4 text-right font-bold ${netMovement < 0 ? 'text-rose-500' : 'text-slate-500'}`}>{netMovement < 0 ? '-' : '+'}${Math.abs(netMovement).toFixed(2)}</td>
                                      <td className="px-4 py-4 text-right font-black text-slate-900">${s.finalCashCount?.toFixed(2) || '-'}</td>
                                      <td className="px-4 py-4 text-center">
                                          <span className={`px-2 py-1 rounded text-[9px] font-black ${s.discrepancy === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                              {s.discrepancy ? `$${s.discrepancy.toFixed(2)}` : 'OK'}
                                          </span>
                                      </td>
                                      <td className="px-8 py-4 text-center"><span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[9px] font-black uppercase">Cerrado</span></td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* MODALES CRUD (GASTO Y ORDEN) - Se mantienen igual que en la versión anterior por funcionalidad */}
      {showExpenseModal && (
         <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 animate-in zoom-in-95">
               <div className="flex justify-between items-center border-b border-slate-100 pb-4"><h3 className="text-xl font-black uppercase text-slate-900">Registrar Gasto</h3><button onClick={() => setShowExpenseModal(false)}><X className="text-slate-400 hover:text-rose-500"/></button></div>
               <div className="space-y-4">
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Concepto</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" value={expenseForm.concept} onChange={e => setExpenseForm({...expenseForm, concept: e.target.value})} placeholder="Ej: Renta Consultorio" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Monto ($)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-rose-600" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value)})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Categoría</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})}><option>Compra Medicamento</option><option>Servicios</option><option>Nómina</option><option>Mantenimiento</option><option>Otro</option></select></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Método de Pago</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" value={expenseForm.paymentMethod} onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value as any})}><option>Efectivo Caja</option><option>Transferencia Bancaria</option><option>Tarjeta Corporativa</option></select></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Proveedor / Beneficiario</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" value={expenseForm.supplier} onChange={e => setExpenseForm({...expenseForm, supplier: e.target.value})} /></div>
               </div>
               <button onClick={handleSaveExpense} className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-900 transition-all">Guardar Gasto</button>
            </div>
         </div>
      )}

      {showOrderModal && (
         <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-10 space-y-6 animate-in zoom-in-95 h-[80vh] flex flex-col">
               <div className="flex justify-between items-center border-b border-slate-100 pb-4"><h3 className="text-xl font-black uppercase text-slate-900">Nueva Orden de Compra</h3><button onClick={() => setShowOrderModal(false)}><X className="text-slate-400 hover:text-rose-500"/></button></div>
               <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Proveedor</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" value={orderForm.supplier} onChange={e => setOrderForm({...orderForm, supplier: e.target.value})} placeholder="Nombre del Proveedor" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Fecha Orden</label><input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={orderForm.date} onChange={e => setOrderForm({...orderForm, date: e.target.value})} /></div>
                  <div className="space-y-1 relative">
                      <label className="text-[9px] font-black uppercase text-slate-400">Agregar Ítem del Inventario</label>
                      <input className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" placeholder="Buscar producto..." value={orderItemSearch} onChange={e => setOrderItemSearch(e.target.value)} />
                      {inventory.filter(i => i.name.toLowerCase().includes(orderItemSearch.toLowerCase()) && orderItemSearch).length > 0 && (
                          <div className="absolute top-full left-0 w-full bg-white border border-blue-100 shadow-xl rounded-xl mt-1 max-h-40 overflow-y-auto z-10">
                              {inventory.filter(i => i.name.toLowerCase().includes(orderItemSearch.toLowerCase())).map(i => (
                                  <button key={i.id} onClick={() => { handleAddOrderItem(i); setOrderItemSearch(''); }} className="w-full text-left p-2 text-[10px] font-bold uppercase hover:bg-blue-50 border-b border-slate-50 truncate">{i.name}</button>
                              ))}
                          </div>
                      )}
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 sticky top-0">
                          <tr><th className="p-3">Producto</th><th className="p-3 text-center w-20">Cant.</th><th className="p-3 text-center w-24">Costo U.</th><th className="p-3 text-right">Total</th><th className="p-3"></th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {tempOrderItems.map(item => (
                              <tr key={item.inventoryId}>
                                  <td className="p-3 text-[10px] font-bold uppercase">{item.name}</td>
                                  <td className="p-3"><input type="number" className="w-full bg-slate-50 rounded p-1 text-center text-xs font-bold" value={item.quantity} onChange={e => updateOrderItem(item.inventoryId, 'quantity', parseInt(e.target.value))} /></td>
                                  <td className="p-3"><input type="number" className="w-full bg-slate-50 rounded p-1 text-center text-xs font-bold" value={item.unitCost} onChange={e => updateOrderItem(item.inventoryId, 'unitCost', parseFloat(e.target.value))} /></td>
                                  <td className="p-3 text-right text-xs font-black">${item.total.toFixed(2)}</td>
                                  <td className="p-3 text-right"><button onClick={() => removeOrderItem(item.inventoryId)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>
               <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                   <div className="text-right w-full">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Total Estimado</p>
                       <p className="text-3xl font-black text-slate-900">${tempOrderItems.reduce((acc, i) => acc + i.total, 0).toFixed(2)}</p>
                   </div>
               </div>
               <div className="flex gap-4">
                   <button onClick={() => setShowOrderModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-xs text-slate-500 hover:bg-slate-200">Cancelar</button>
                   <button onClick={handleSaveOrder} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-900 transition-all">Generar Orden</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Finance;
