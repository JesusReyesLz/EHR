
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Search, Plus, Printer, FileText, DollarSign, 
  UserCheck, Calendar, Clock, Trash2, CheckCircle2, AlertTriangle,
  Download, Receipt, LayoutList, RefreshCw, X, ShoppingCart, Store, ChevronRight,
  PenTool, ChevronLeft, Wallet
} from 'lucide-react';
import { Patient, PatientAccount, ChargeItem, PriceItem, ClinicalNote, PriceType } from '../types';
import { INITIAL_PRICES } from '../constants';

const Billing: React.FC<{ patients: Patient[], notes: ClinicalNote[] }> = ({ patients, notes }) => {
  const navigate = useNavigate();
  
  // Estado local para cuentas
  const [accounts, setAccounts] = useState<PatientAccount[]>(() => {
    const saved = localStorage.getItem('med_accounts_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [prices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Estado para impresión
  const [printMode, setPrintMode] = useState<'none' | 'ticket' | 'invoice'>('none');

  useEffect(() => {
    localStorage.setItem('med_accounts_v1', JSON.stringify(accounts));
  }, [accounts]);

  // Obtener cuenta del paciente seleccionado o crear una temporal si no existe
  const activeAccount = useMemo(() => {
    if (!selectedPatientId) return null;
    let acc = accounts.find(a => a.patientId === selectedPatientId && a.status === 'Abierta');
    if (!acc) {
      // Crear estructura base si no existe cuenta abierta
      return { patientId: selectedPatientId, charges: [], payments: [], balance: 0, status: 'Abierta' } as PatientAccount;
    }
    return acc;
  }, [accounts, selectedPatientId]);

  const patient = patients.find(p => p.id === selectedPatientId);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.curp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ACCIONES DE CUENTA ---

  const handleCreateOrUpdateAccount = (updatedAccount: PatientAccount) => {
    setAccounts(prev => {
      const idx = prev.findIndex(a => a.patientId === updatedAccount.patientId && a.status === 'Abierta');
      if (idx >= 0) {
        const newAccounts = [...prev];
        newAccounts[idx] = updatedAccount;
        return newAccounts;
      }
      return [...prev, updatedAccount];
    });
  };

  const addCharge = (charge: ChargeItem) => {
    if (!activeAccount) return;
    const updatedCharges = [...activeAccount.charges, charge];
    const newBalance = updatedCharges.reduce((sum, c) => sum + (c.status !== 'Cancelado' ? c.total : 0), 0) - 
                       activeAccount.payments.reduce((sum, p) => sum + p.amount, 0);
    
    handleCreateOrUpdateAccount({
      ...activeAccount,
      charges: updatedCharges,
      balance: newBalance
    });
  };

  const addPayment = (amount: number, method: any, reference?: string) => {
    if (!activeAccount) return;
    const newPayment = {
      id: `PAY-${Date.now()}`,
      date: new Date().toLocaleString('es-MX'),
      amount,
      method,
      reference
    };
    const updatedPayments = [...activeAccount.payments, newPayment];
    const chargesTotal = activeAccount.charges.reduce((sum, c) => sum + (c.status !== 'Cancelado' ? c.total : 0), 0);
    const paymentsTotal = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    handleCreateOrUpdateAccount({
      ...activeAccount,
      payments: updatedPayments,
      balance: chargesTotal - paymentsTotal
    });
    setShowPaymentModal(false);
  };

  const syncFromNotes = () => {
    if (!selectedPatientId || !activeAccount) return;
    
    const patientNotes = notes.filter(n => n.patientId === selectedPatientId);
    let newChargesCount = 0;

    patientNotes.forEach(note => {
      const exists = activeAccount.charges.some(c => c.sourceId === note.id);
      if (exists) return;

      let priceCode = '';
      if (note.type.includes('Consulta')) priceCode = 'CON-GEN';
      if (note.type.includes('Urgencias')) priceCode = 'URG-BAS';
      if (note.type.includes('Especialidad') || note.type.includes('Interconsulta')) priceCode = 'CON-ESP';

      const priceItem = prices.find(p => p.code === priceCode);
      
      if (priceItem) {
        addCharge({
          id: `CHG-${Date.now()}-${Math.random()}`,
          date: note.date,
          concept: `Honorarios: ${note.type} - ${note.author}`,
          quantity: 1,
          unitPrice: priceItem.price,
          total: priceItem.price,
          type: 'Honorarios',
          status: 'Pendiente',
          sourceId: note.id
        });
        newChargesCount++;
      }
    });

    if (newChargesCount > 0) alert(`Se sincronizaron ${newChargesCount} cargos desde el expediente clínico.`);
    else alert("No se encontraron nuevos cargos pendientes de sincronizar.");
  };

  const closeAccount = () => {
    if (!activeAccount) return;
    if (activeAccount.balance > 0) {
      alert("No se puede cerrar la cuenta con saldo pendiente. Registre el pago completo primero.");
      return;
    }
    if (window.confirm("¿Confirmar el cierre de caja para este paciente? La cuenta pasará a histórico.")) {
      handleCreateOrUpdateAccount({ ...activeAccount, status: 'Cerrada' });
      setSelectedPatientId(null);
    }
  };

  // --- COMPONENTES UI ---

  const AddChargeModal = () => {
    const [searchItem, setSearchItem] = useState('');
    const [selectedPrice, setSelectedPrice] = useState<PriceItem | null>(null);
    const [qty, setQty] = useState(1);
    
    // Estado para cargo manual
    const [isManual, setIsManual] = useState(false);
    const [manualData, setManualData] = useState({ name: '', price: 0, tax: 16 });

    const filteredPrices = prices.filter(p => p.name.toLowerCase().includes(searchItem.toLowerCase()) || p.code.toLowerCase().includes(searchItem.toLowerCase()));

    const submit = () => {
      if (isManual) {
         if (!manualData.name || manualData.price <= 0) {
            alert("Ingrese un nombre y precio válido.");
            return;
         }
         const total = manualData.price * qty * (1 + manualData.tax / 100);
         addCharge({
            id: `CHG-${Date.now()}`,
            date: new Date().toLocaleString('es-MX'),
            concept: manualData.name.toUpperCase() + ' (MANUAL)',
            quantity: qty,
            unitPrice: manualData.price,
            total: parseFloat(total.toFixed(2)),
            type: 'Otro',
            status: 'Pendiente'
         });
      } else if (selectedPrice) {
         const total = selectedPrice.price * qty * (1 + selectedPrice.taxPercent / 100);
         addCharge({
            id: `CHG-${Date.now()}`,
            date: new Date().toLocaleString('es-MX'),
            concept: selectedPrice.name,
            quantity: qty,
            unitPrice: selectedPrice.price,
            total: parseFloat(total.toFixed(2)),
            type: selectedPrice.category as any || 'Otro',
            status: 'Pendiente'
         });
      }
      setShowChargeModal(false);
    };

    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black uppercase text-slate-900">Agregar Cargo</h3>
             <button onClick={() => setShowChargeModal(false)}><X size={24} className="text-slate-400 hover:text-rose-500" /></button>
          </div>
          
          {!selectedPrice && !isManual ? (
            <div className="space-y-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <input 
                   autoFocus
                   className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase font-bold text-sm focus:border-blue-500 focus:bg-white transition-all"
                   placeholder="Buscar servicio o producto..."
                   value={searchItem}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredPrices.map(p => (
                  <button key={p.id} onClick={() => setSelectedPrice(p)} className="w-full text-left p-3 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl flex justify-between group transition-all">
                    <div>
                       <span className="text-xs font-black uppercase text-slate-700 block">{p.name}</span>
                       <span className="text-[10px] text-slate-400 uppercase font-bold">{p.category}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 group-hover:text-blue-600">${p.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => { setIsManual(true); setManualData({...manualData, name: searchItem.toUpperCase()}); }}
                className="w-full py-3 bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2"
              >
                 <PenTool size={14} /> Item no encontrado - Agregar Manualmente
              </button>
            </div>
          ) : isManual ? (
             <div className="space-y-6">
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Concepto / Descripción</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-sm outline-none focus:border-indigo-500" 
                        value={manualData.name} 
                        onChange={e => setManualData({...manualData, name: e.target.value})} 
                        placeholder="Descripción del cargo..."
                        autoFocus
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400">Precio Unitario</label>
                         <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none" value={manualData.price} onChange={e => setManualData({...manualData, price: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400">IVA %</label>
                         <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none" value={manualData.tax} onChange={e => setManualData({...manualData, tax: parseFloat(e.target.value) || 0})} />
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-center gap-6">
                   <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 font-black text-xl transition-all">-</button>
                   <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CANTIDAD</p>
                      <input type="number" className="w-20 text-center text-3xl font-black bg-transparent outline-none" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} />
                   </div>
                   <button onClick={() => setQty(qty + 1)} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 font-black text-xl transition-all">+</button>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Estimado</p>
                   <p className="text-2xl font-black text-indigo-900">${(manualData.price * qty * (1 + manualData.tax / 100)).toFixed(2)}</p>
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setIsManual(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all">Cancelar</button>
                   <button onClick={submit} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-indigo-700 transition-all">Agregar Manual</button>
                </div>
             </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                <p className="text-sm font-black uppercase text-blue-900">{selectedPrice?.name}</p>
                <p className="text-2xl font-black text-blue-600 mt-2">${selectedPrice?.price.toFixed(2)}</p>
                <p className="text-[10px] text-blue-400 uppercase font-bold mt-1">+ IVA ({selectedPrice?.taxPercent}%)</p>
              </div>
              
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 font-black text-xl transition-all">-</button>
                <div className="text-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CANTIDAD</p>
                   <input type="number" className="w-20 text-center text-3xl font-black bg-transparent outline-none" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} />
                </div>
                <button onClick={() => setQty(qty + 1)} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 font-black text-xl transition-all">+</button>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setSelectedPrice(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all">Atrás</button>
                <button onClick={submit} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-600 transition-all">Confirmar Cargo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PaymentModal = () => {
    const [amount, setAmount] = useState(activeAccount?.balance || 0);
    const [method, setMethod] = useState('Efectivo');
    
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black uppercase text-slate-900">Cobrar Cuenta</h3>
             <button onClick={() => setShowPaymentModal(false)}><X size={24} className="text-slate-400" /></button>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
             <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Saldo Pendiente</p>
             <p className="text-4xl font-black text-emerald-800 tracking-tighter">${activeAccount?.balance.toFixed(2)}</p>
          </div>

          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Monto a Recibir</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input type="number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} autoFocus />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Método de Pago</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-emerald-500" value={method} onChange={e => setMethod(e.target.value)}>
                   <option>Efectivo</option>
                   <option>Tarjeta Crédito/Débito</option>
                   <option>Transferencia</option>
                   <option>Seguro de Gastos Médicos</option>
                </select>
             </div>
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-xs text-slate-500 hover:bg-slate-200 transition-all">Cancelar</button>
             <button onClick={() => addPayment(amount, method as any)} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all">Procesar Pago</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
             <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase">Caja</h1>
            <p className="text-slate-500 text-sm font-bold uppercase mt-1">Terminal de Cobro y Facturación</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
           <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
              <Store size={14} /> Caja Abierta
           </div>
           <div className="px-4 py-2 text-slate-400 text-[10px] font-bold uppercase">
              {new Date().toLocaleDateString()}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* SIDEBAR LISTA PACIENTES (SELECTOR) */}
         <div className="lg:col-span-4 space-y-6 no-print">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm min-h-[600px] flex flex-col">
               <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                    placeholder="Buscar paciente para cobro..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredPatients.map(p => {
                     // Buscar si tiene saldo pendiente
                     const acc = accounts.find(a => a.patientId === p.id && a.status === 'Abierta');
                     const hasDebt = acc && acc.balance > 0;
                     return (
                        <button 
                           key={p.id} 
                           onClick={() => setSelectedPatientId(p.id)}
                           className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group ${selectedPatientId === p.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}
                        >
                           <div>
                              <p className="text-xs font-black uppercase tracking-tight">{p.name}</p>
                              <p className={`text-[9px] font-bold uppercase mt-1 ${selectedPatientId === p.id ? 'text-slate-400' : 'text-slate-400'}`}>ID: {p.id}</p>
                           </div>
                           {hasDebt ? (
                              <div className="px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded-lg shadow-sm animate-pulse">
                                 ${acc.balance}
                              </div>
                           ) : (
                              <ChevronRight size={16} className={`text-slate-300 ${selectedPatientId === p.id ? 'text-white' : 'group-hover:text-blue-500'}`} />
                           )}
                        </button>
                     );
                  })}
               </div>
            </div>
         </div>

         {/* DETALLE DE CUENTA / POS */}
         <div className="lg:col-span-8 space-y-6">
            {activeAccount && patient ? (
               <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm h-full flex flex-col relative overflow-hidden">
                  
                  {/* MODAL DE IMPRESIÓN (TICKET/FACTURA) */}
                  {printMode !== 'none' && (
                     <div className="absolute inset-0 bg-slate-900/95 z-50 p-10 overflow-y-auto flex justify-center animate-in fade-in">
                        <div className="bg-white w-full max-w-md h-fit p-8 shadow-2xl relative font-mono text-sm">
                           <div className="text-center space-y-2 mb-6 border-b-2 border-dashed border-slate-300 pb-6">
                              <h2 className="text-xl font-bold uppercase">Hospital San Rafael</h2>
                              <p className="text-xs">RFC: HSR900101XYZ</p>
                              <p className="text-xs">Av. Insurgentes 123, CDMX</p>
                              <p className="text-[10px] mt-2">{new Date().toLocaleString()}</p>
                              <p className="font-bold mt-2">{printMode === 'invoice' ? 'FACTURA ELECTRÓNICA' : 'NOTA DE VENTA'}</p>
                           </div>
                           
                           <div className="text-xs mb-6 space-y-1">
                              <p>CLIENTE: {patient.name}</p>
                              <p>FOLIO: {Math.floor(Math.random()*100000)}</p>
                           </div>

                           <div className="mb-6">
                              {activeAccount.charges.filter(c => c.status !== 'Cancelado').map(c => (
                                 <div key={c.id} className="flex justify-between mb-1">
                                    <span>{c.quantity} x {c.concept.substr(0, 20)}</span>
                                    <span>${c.total.toFixed(2)}</span>
                                 </div>
                              ))}
                           </div>

                           <div className="border-t-2 border-dashed border-slate-300 pt-4 mb-8">
                              <div className="flex justify-between font-bold text-lg">
                                 <span>TOTAL</span>
                                 <span>${activeAccount.charges.reduce((s,c)=>s+(c.status!=='Cancelado'?c.total:0),0).toFixed(2)}</span>
                              </div>
                              <div className="text-[10px] text-right mt-1">IVA INCLUIDO</div>
                           </div>

                           <div className="text-center space-y-2 no-print">
                              <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 text-white font-bold uppercase rounded hover:bg-blue-600">Imprimir</button>
                              <button onClick={() => setPrintMode('none')} className="w-full py-3 bg-slate-100 text-slate-900 font-bold uppercase rounded hover:bg-slate-200">Cerrar</button>
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 no-print">
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{patient.name}</h2>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-500 shadow-sm">{activeAccount.status}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Folio Cuenta: #{activeAccount.patientId.substr(0,6)}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por Pagar</p>
                        <p className={`text-5xl font-black tracking-tighter ${activeAccount.balance > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>
                           ${activeAccount.balance.toFixed(2)}
                        </p>
                     </div>
                  </div>

                  <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 border-b border-slate-100 bg-white no-print">
                     <button onClick={() => setShowChargeModal(true)} className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-600 transition-all active:scale-95">
                        <Plus size={16}/> Cobrar Servicio
                     </button>
                     <button onClick={syncFromNotes} className="flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all border border-indigo-100">
                        <RefreshCw size={16}/> Sincronizar Notas
                     </button>
                     <button onClick={() => setPrintMode('ticket')} className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm">
                        <Receipt size={16}/> Ticket
                     </button>
                     <button onClick={() => setPrintMode('invoice')} className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm">
                        <FileText size={16}/> Factura
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto no-print bg-white p-2">
                     <table className="w-full text-left border-collapse">
                        <thead className="text-[9px] font-black uppercase text-slate-400 sticky top-0 bg-white z-10 shadow-sm">
                           <tr>
                              <th className="px-6 py-4 rounded-l-xl">Concepto</th>
                              <th className="px-4 py-4 text-center">Cant</th>
                              <th className="px-4 py-4 text-right">Precio U.</th>
                              <th className="px-6 py-4 text-right rounded-r-xl">Total</th>
                           </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-slate-600">
                           {activeAccount.charges.length === 0 && activeAccount.payments.length === 0 && (
                              <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Cuenta sin movimientos</td></tr>
                           )}
                           
                           {activeAccount.charges.map(c => (
                              <tr key={c.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${c.status === 'Cancelado' ? 'opacity-40 line-through' : ''}`}>
                                 <td className="px-6 py-4">
                                    <p className="text-slate-900">{c.concept}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">{c.date} • {c.type}</p>
                                 </td>
                                 <td className="px-4 py-4 text-center">{c.quantity}</td>
                                 <td className="px-4 py-4 text-right">${c.unitPrice.toFixed(2)}</td>
                                 <td className="px-6 py-4 text-right font-black text-slate-900">${c.total.toFixed(2)}</td>
                              </tr>
                           ))}
                           
                           {activeAccount.payments.map(p => (
                              <tr key={p.id} className="bg-emerald-50/50 border-b border-emerald-100">
                                 <td className="px-6 py-4">
                                    <p className="text-emerald-700 font-black flex items-center gap-2"><CheckCircle2 size={12}/> PAGO RECIBIDO</p>
                                    <p className="text-[9px] text-emerald-600 mt-0.5">{p.date} • {p.method}</p>
                                 </td>
                                 <td className="px-4 py-4 text-center">-</td>
                                 <td className="px-4 py-4 text-right text-emerald-600 font-bold">ABONO</td>
                                 <td className="px-6 py-4 text-right text-emerald-700 font-black">-${p.amount.toFixed(2)}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50 no-print flex justify-end gap-4">
                     {activeAccount.balance > 0 ? (
                        <button 
                           onClick={() => setShowPaymentModal(true)}
                           className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95"
                        >
                           <CreditCard size={20} /> Cobrar ${activeAccount.balance.toFixed(2)}
                        </button>
                     ) : (
                        <button 
                           onClick={closeAccount}
                           className="px-10 py-5 bg-slate-200 text-slate-500 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-300 transition-all flex items-center gap-3"
                        >
                           <CheckCircle2 size={18} /> Cerrar Caja
                        </button>
                     )}
                  </div>
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
                  <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mb-6">
                     <ShoppingCart size={40} className="text-slate-200" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest">Seleccione un paciente para iniciar cobro</p>
               </div>
            )}
         </div>
      </div>

      {showChargeModal && <AddChargeModal />}
      {showPaymentModal && <PaymentModal />}
    </div>
  );
};

export default Billing;
