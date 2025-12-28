
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, Plus, AlertTriangle, Calendar, ClipboardList, TrendingUp, TrendingDown, 
  Info, Filter, CheckCircle2, X, Save, Truck, FileBadge, ShieldCheck, History, ArrowRight, 
  Database, ArrowUpRight, ArrowDownLeft, Printer, FileText, QrCode, User, Pill, ShoppingBag, 
  Clock, ChevronLeft, Stethoscope, Archive, ExternalLink, RefreshCw, UserMinus, ShoppingCart, 
  Trash2, Edit, Copy, AlertOctagon, ChevronDown, ChevronRight, Layers, ChevronUp,
  Droplet, Scissors, Monitor, Box, CalendarOff, Maximize, FileSpreadsheet,
  AlertCircle, Receipt, Tag, DollarSign, Laptop, Armchair, Edit2, MinusCircle, PlusCircle
} from 'lucide-react';
import { MedicationStock, StockMovement, MedicationCategory, ClinicalNote, Patient, MedicationBatch, SupplyType, PriceItem, PriceType } from '../types';
import { INITIAL_STOCK, INITIAL_PRICES } from '../constants';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'replenish'>('stock');
  
  const [stock, setStock] = useState<MedicationStock[]>(() => {
    const saved = localStorage.getItem('med_inventory_v6');
    let data = saved ? JSON.parse(saved) : INITIAL_STOCK;
    if (data.length > 0 && !data[0].batches) {
        data = data.map((item: any) => ({
            ...item,
            batches: [{ id: generateId('BATCH'), batchNumber: item.batch || 'S/L', expiryDate: item.expiryDate || '', currentStock: item.currentStock || 0 }]
        }));
    }
    return data;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('med_movements_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [prices, setPrices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Estado para filas expandidas
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Estado para Edición / Gestión de Lotes
  const [isEditingMed, setIsEditingMed] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  
  const [noExpiry, setNoExpiry] = useState(false);

  // Formulario Unificado
  const [medForm, setMedForm] = useState<Partial<MedicationStock>>({
    name: '', genericName: '', presentation: '', concentration: '',
    minStock: 10, idealStock: 50, unit: 'Pieza', supplier: '', registroCofepris: '', 
    category: MedicationCategory.GENERAL, supplyType: SupplyType.MEDICATION
  });
  
  const [batchForm, setBatchForm] = useState<Partial<MedicationBatch>>({
    batchNumber: '', expiryDate: '', currentStock: 0
  });

  // Estado para Modal de Movimiento Rápido
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementConfig, setMovementConfig] = useState<{
      type: 'IN' | 'OUT';
      medId: string;
      batchId?: string; // Opcional, si es nuevo lote
      batchNumber?: string;
      currentStock?: number;
      medName: string;
  } | null>(null);
  
  const [movementForm, setMovementForm] = useState({
      quantity: 0,
      reason: '',
      newBatchNumber: '',
      newExpiryDate: ''
  });

  const [createInCatalog, setCreateInCatalog] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ price: '', tax: 16, code: '' });

  useEffect(() => {
    localStorage.setItem('med_inventory_v6', JSON.stringify(stock));
    localStorage.setItem('med_movements_v6', JSON.stringify(movements));
  }, [stock, movements]);

  useEffect(() => {
    localStorage.setItem('med_price_catalog_v1', JSON.stringify(prices));
  }, [prices]);

  const getTotalStock = (med: MedicationStock) => med.batches ? med.batches.reduce((acc, b) => acc + b.currentStock, 0) : 0;
  
  const getNextExpiry = (med: MedicationStock) => {
      if (!med.batches || med.batches.length === 0) return null;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Medicamento': return <Pill size={16} className="text-blue-500" />;
      case 'Solución / Suero': return <Droplet size={16} className="text-cyan-500" />;
      case 'Instrumental / Quirúrgico': return <Scissors size={16} className="text-slate-500" />;
      case 'Equipo Médico': return <Monitor size={16} className="text-indigo-500" />;
      case 'Material de Curación': return <Box size={16} className="text-emerald-500" />;
      case 'Mobiliario': return <Armchair size={16} className="text-amber-600" />;
      case 'Electrónicos': return <Laptop size={16} className="text-slate-700" />;
      default: return <Package size={16} className="text-slate-400" />;
    }
  };

  // --- ACTIONS ---

  const handleCreateMed = () => {
    if (!medForm.name) return alert("El nombre es obligatorio");
    
    if (isEditingMed && selectedMedId) {
        setStock(prev => prev.map(item => item.id === selectedMedId ? { ...item, ...medForm } as MedicationStock : item));
        setShowAddModal(false);
        resetForms();
        return;
    }

    const newMedId = generateId('MED');
    const initialQty = Number(batchForm.currentStock) || 0;

    const newMed: MedicationStock = {
        id: newMedId,
        name: medForm.name!.toUpperCase(),
        genericName: medForm.genericName?.toUpperCase() || '',
        presentation: medForm.presentation || 'N/A',
        concentration: medForm.concentration || '',
        unit: medForm.unit || 'Pieza',
        supplier: medForm.supplier || '',
        registroCofepris: medForm.registroCofepris || '',
        category: medForm.category || MedicationCategory.GENERAL,
        supplyType: medForm.supplyType as any || SupplyType.OTHER,
        minStock: Number(medForm.minStock) || 0,
        idealStock: Number(medForm.idealStock) || 0,
        batches: [{
            id: generateId('BATCH'),
            batchNumber: batchForm.batchNumber?.toUpperCase() || 'S/L',
            expiryDate: noExpiry ? 'N/A' : (batchForm.expiryDate || 'N/A'),
            currentStock: initialQty
        }]
    };

    setStock([newMed, ...stock]);
    
    if (initialQty > 0) {
        setMovements(prev => [{
            id: generateId('MOV'),
            medicationId: newMed.id, medicationName: newMed.name,
            batch: newMed.batches[0].batchNumber, type: 'IN', quantity: initialQty, 
            reason: 'Alta Inicial de Insumo Integral', date: new Date().toLocaleString('es-MX'), responsible: 'Inventarios'
        }, ...prev]);
    }

    // LÓGICA DE VINCULACIÓN AL CATÁLOGO DE PRECIOS
    if (createInCatalog && catalogForm.price) {
        const newPriceItem: PriceItem = {
            id: generateId('PRICE'),
            code: catalogForm.code || newMedId.split('-')[1],
            name: `${newMed.name} ${newMed.concentration}`.trim(),
            type: PriceType.PRODUCT,
            category: medForm.supplyType === 'Medicamento' ? 'Farmacia' : 'Insumos',
            price: parseFloat(catalogForm.price),
            taxPercent: catalogForm.tax,
            linkedInventoryId: newMedId
        };
        setPrices(prev => [newPriceItem, ...prev]);
    }

    setShowAddModal(false);
    resetForms();
  };

  const handleOpenMovement = (type: 'IN' | 'OUT', med: MedicationStock, batch?: MedicationBatch) => {
      setMovementConfig({
          type,
          medId: med.id,
          medName: med.name,
          batchId: batch?.id, // Si es undefined, es IN a nuevo lote
          batchNumber: batch?.batchNumber,
          currentStock: batch?.currentStock || 0
      });
      setMovementForm({ quantity: 0, reason: '', newBatchNumber: '', newExpiryDate: '' });
      setNoExpiry(false); // Resetear estado de caducidad
      setShowMovementModal(true);
  };

  const confirmMovement = () => {
      if (!movementConfig) return;
      const qty = Number(movementForm.quantity);
      if (qty <= 0) return alert("Cantidad inválida");

      if (movementConfig.type === 'OUT' && qty > (movementConfig.currentStock || 0)) {
          return alert("Stock insuficiente para esta salida");
      }

      const updatedStock = [...stock];
      const medIndex = updatedStock.findIndex(s => s.id === movementConfig.medId);
      if (medIndex === -1) return;

      const med = updatedStock[medIndex];
      let batchNumber = movementConfig.batchNumber;

      // CASO 1: SALIDA O ENTRADA A LOTE EXISTENTE
      if (movementConfig.batchId) {
          const batchIndex = med.batches.findIndex(b => b.id === movementConfig.batchId);
          if (batchIndex !== -1) {
              const current = med.batches[batchIndex].currentStock;
              med.batches[batchIndex].currentStock = movementConfig.type === 'IN' ? current + qty : current - qty;
          }
      } 
      // CASO 2: ENTRADA A NUEVO LOTE
      else if (movementConfig.type === 'IN' && !movementConfig.batchId) {
          if (!movementForm.newBatchNumber) return alert("Ingrese número de lote");
          batchNumber = movementForm.newBatchNumber.toUpperCase();
          const newBatch: MedicationBatch = {
              id: generateId('BATCH'),
              batchNumber: batchNumber,
              expiryDate: noExpiry ? 'N/A' : (movementForm.newExpiryDate || 'N/A'),
              currentStock: qty
          };
          med.batches.push(newBatch);
      }

      updatedStock[medIndex] = med;
      setStock(updatedStock);

      // Registrar movimiento
      setMovements(prev => [{
          id: generateId('MOV'),
          medicationId: med.id, medicationName: med.name,
          batch: batchNumber || 'N/A', 
          type: movementConfig.type, 
          quantity: qty,
          reason: movementForm.reason || (movementConfig.type === 'IN' ? 'Entrada/Compra' : 'Salida/Ajuste'), 
          date: new Date().toLocaleString('es-MX'), responsible: 'Usuario'
      }, ...prev]);

      setShowMovementModal(false);
  };

  const handleDeleteItem = (id: string) => {
      if(window.confirm("¿Está seguro de eliminar este insumo y todo su historial de lotes? Esta acción no se puede deshacer.")) {
          setStock(prev => prev.filter(item => item.id !== id));
      }
  };

  const handleEditItem = (item: MedicationStock) => {
      setSelectedMedId(item.id);
      setMedForm(item);
      setIsEditingMed(true);
      setShowAddModal(true);
  };

  const toggleExpand = (id: string) => {
      setExpandedRowId(expandedRowId === id ? null : id);
  };

  const resetForms = () => {
    setMedForm({ name: '', genericName: '', presentation: '', concentration: '', minStock: 10, idealStock: 50, supplyType: SupplyType.MEDICATION });
    setBatchForm({ batchNumber: '', expiryDate: '', currentStock: 0 });
    setCatalogForm({ price: '', tax: 16, code: '' });
    setCreateInCatalog(false);
    setNoExpiry(false);
    setIsEditingMed(false);
    setSelectedMedId(null);
  };

  const filteredStock = useMemo(() => {
    if (!searchTerm) return stock;
    const term = searchTerm.toLowerCase();
    return stock.filter(s => s.name.toLowerCase().includes(term) || s.genericName.toLowerCase().includes(term) || s.supplyType.toLowerCase().includes(term));
  }, [stock, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Gestión de Activos e Insumos</h1>
          <p className="text-slate-500 text-sm font-bold uppercase">Control de Existencias e Inventario Físico Integral</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
              <button onClick={() => setActiveTab('stock')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Existencias</button>
              <button onClick={() => setActiveTab('movements')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'movements' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Historial (Kardex)</button>
           </div>
           <button onClick={() => { setIsEditingMed(false); resetForms(); setShowAddModal(true); }} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Plus size={16} /> Nuevo Insumo Integral
           </button>
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] animate-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-slate-100 flex items-center gap-6 bg-slate-50/50">
                <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none uppercase placeholder-slate-300 shadow-sm focus:ring-4 focus:ring-emerald-50 focus:border-emerald-200 transition-all" placeholder="Buscar medicamento, equipo, mobiliario o activo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 transition-all"><Printer size={20}/></button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                        <th className="px-8 py-5">Descripción del Activo/Insumo</th>
                        <th className="px-4 py-5">Tipo</th>
                        <th className="px-4 py-5 text-center">Stock Actual</th>
                        <th className="px-4 py-5 text-center">Caducidad Prox.</th>
                        <th className="px-4 py-5 text-center">Vínculo Venta</th>
                        <th className="px-8 py-5 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredStock.map(item => {
                        const total = getTotalStock(item);
                        const nextExp = getNextExpiry(item);
                        const expStatus = getExpiryStatus(nextExp || '');
                        const isForSale = prices.some(p => p.linkedInventoryId === item.id);
                        const isExpanded = expandedRowId === item.id;
                        
                        // Lista resumida de lotes
                        const batchesSummary = item.batches && item.batches.length > 0 
                            ? `${item.batches.length} Lote(s) Activo(s)`
                            : 'Sin Lotes';

                        return (
                            <React.Fragment key={item.id}>
                                <tr 
                                    className={`transition-all group cursor-pointer ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'}`}
                                    onClick={() => toggleExpand(item.id)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">{getTypeIcon(item.supplyType)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{item.name}</p>
                                                    {isExpanded ? <ChevronUp size={14} className="text-blue-500"/> : <ChevronDown size={14} className="text-slate-300"/>}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.genericName || 'SIN GENÉRICO'} • {item.concentration || 'SIN CONC.'}</p>
                                                <p className="text-[9px] text-blue-600 font-mono mt-1 flex items-center gap-1"><Layers size={10}/> {batchesSummary}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{item.supplyType}</span>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <p className={`text-sm font-black ${total <= item.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{total}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.unit}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border ${expStatus.color}`}>{nextExp || 'N/A'}</span>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        {isForSale ? <div className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase"><CheckCircle2 size={14}/> Activo</div> : <div className="text-slate-300 font-black text-[9px] uppercase">No Publicado</div>}
                                    </td>
                                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenMovement('IN', item)} className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Entrada Rápida"><Plus size={16}/></button>
                                            <button onClick={() => handleEditItem(item)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteItem(item.id)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-blue-50/30">
                                        <td colSpan={6} className="p-0">
                                            <div className="px-12 py-6 animate-in slide-in-from-top-2">
                                                <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="text-xs font-black uppercase text-blue-800 tracking-widest flex items-center gap-2">
                                                            <Layers size={14}/> Detalle de Lotes Activos
                                                        </h4>
                                                        <button 
                                                            onClick={() => handleOpenMovement('IN', item)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-all shadow-md"
                                                        >
                                                            <PlusCircle size={12}/> Registrar Nuevo Lote
                                                        </button>
                                                    </div>
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                            <tr>
                                                                <th className="p-3 pl-4 rounded-l-xl">Lote / Serie</th>
                                                                <th className="p-3">Caducidad</th>
                                                                <th className="p-3 text-center">Existencia</th>
                                                                <th className="p-3 text-right rounded-r-xl">Control Rápido</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-[10px] font-bold text-slate-600">
                                                            {item.batches && item.batches.length > 0 ? item.batches.map(batch => (
                                                                <tr key={batch.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all">
                                                                    <td className="p-4 font-mono text-slate-900">{batch.batchNumber}</td>
                                                                    <td className="p-4">
                                                                        <span className={`px-2 py-1 rounded border ${getExpiryStatus(batch.expiryDate).color}`}>
                                                                            {batch.expiryDate}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 text-center text-sm font-black text-slate-800">{batch.currentStock}</td>
                                                                    <td className="p-4 text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button 
                                                                                onClick={() => handleOpenMovement('IN', item, batch)} 
                                                                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100" 
                                                                                title="Agregar a este Lote"
                                                                            >
                                                                                <Plus size={14}/>
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleOpenMovement('OUT', item, batch)} 
                                                                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100" 
                                                                                title="Salida / Merma"
                                                                            >
                                                                                <MinusCircle size={14}/>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )) : (
                                                                <tr><td colSpan={4} className="p-6 text-center italic opacity-50">Sin lotes registrados</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
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

      {/* HISTORIAL (KARDEX) - Sin cambios mayores, solo visualización */}
      {activeTab === 'movements' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] animate-in slide-in-from-bottom-4">
              {/* ... (Contenido del Kardex igual al anterior) ... */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><History size={20}/> Kardex de Movimientos</h3>
                  <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"><Printer size={18} className="text-slate-500"/></button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                              <th className="px-8 py-5">Fecha</th>
                              <th className="px-6 py-5">Insumo</th>
                              <th className="px-6 py-5 text-center">Lote Afectado</th>
                              <th className="px-6 py-5 text-center">Tipo Movimiento</th>
                              <th className="px-6 py-5 text-center">Cantidad</th>
                              <th className="px-6 py-5">Concepto / Responsable</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {movements.length > 0 ? movements.map(mov => (
                              <tr key={mov.id} className="hover:bg-slate-50 transition-all">
                                  <td className="px-8 py-4">
                                      <p className="text-[10px] font-bold text-slate-900">{mov.date.split(' ')[0]}</p>
                                      <p className="text-[9px] text-slate-400">{mov.date.split(' ')[1]}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                      <p className="text-[10px] font-black uppercase text-slate-800">{mov.medicationName}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{mov.batch || 'N/A'}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                                          mov.type === 'IN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                          mov.type === 'OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                          'bg-amber-50 text-amber-600 border-amber-100'
                                      }`}>
                                          {mov.type === 'IN' ? 'Entrada' : mov.type === 'OUT' ? 'Salida' : 'Ajuste'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <p className={`text-sm font-black ${mov.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>{mov.type === 'IN' ? '+' : '-'}{mov.quantity}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                      <p className="text-[9px] font-bold text-slate-600 uppercase">{mov.reason}</p>
                                      <p className="text-[8px] text-slate-400 uppercase mt-0.5">Resp: {mov.responsible}</p>
                                  </td>
                              </tr>
                          )) : (
                              <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">Sin movimientos registrados</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* MODAL DE MOVIMIENTO RÁPIDO */}
      {showMovementModal && movementConfig && (
          <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                  <div className="text-center space-y-2">
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg ${movementConfig.type === 'IN' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                          {movementConfig.type === 'IN' ? <Plus size={32}/> : <MinusCircle size={32}/>}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{movementConfig.type === 'IN' ? 'Entrada de Stock' : 'Salida de Stock'}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{movementConfig.medName}</p>
                  </div>

                  <div className="space-y-4">
                      {/* Si es un lote existente */}
                      {movementConfig.batchId ? (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lote Seleccionado</p>
                              <p className="text-lg font-black text-slate-900 font-mono mt-1">{movementConfig.batchNumber}</p>
                              <p className="text-[9px] text-slate-500 mt-1">Disponible: <b>{movementConfig.currentStock}</b></p>
                          </div>
                      ) : (
                          // Si es entrada a NUEVO lote
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nuevo Lote</label>
                                  <input autoFocus className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-center uppercase" value={movementForm.newBatchNumber} onChange={e => setMovementForm({...movementForm, newBatchNumber: e.target.value})} placeholder="S/N" />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Caducidad</label>
                                  <div className="flex gap-2">
                                      {!noExpiry ? (
                                          <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={movementForm.newExpiryDate} onChange={e => setMovementForm({...movementForm, newExpiryDate: e.target.value})} />
                                      ) : (
                                          <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-black text-slate-400 flex items-center justify-center uppercase">No Aplica</div>
                                      )}
                                      <button onClick={() => setNoExpiry(!noExpiry)} className={`p-3 rounded-xl transition-all shadow-sm ${noExpiry ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-blue-600'}`} title="No Perecedero">
                                          <CalendarOff size={16}/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}

                      <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cantidad</label>
                          <input type="number" autoFocus={!!movementConfig.batchId} className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl text-3xl font-black text-center outline-none focus:border-blue-500 transition-all shadow-inner" placeholder="0" value={movementForm.quantity || ''} onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value)})} />
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Motivo / Referencia</label>
                          <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" placeholder={movementConfig.type === 'IN' ? 'Ej: Compra Fact. 123' : 'Ej: Consumo Interno / Merma'} value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})} />
                      </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setShowMovementModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                      <button onClick={confirmMovement} className={`flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${movementConfig.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL ALTA / EDICIÓN INTEGRAL (Se mantiene igual pero invocado con setShowAddModal) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[260] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl rounded-[3.5rem] p-12 space-y-10 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar border border-white/20 relative">
              <button 
                onClick={() => { setShowAddModal(false); resetForms(); }} 
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"
              >
                <X size={28} />
              </button>

              <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
                 <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <Package size={32}/>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{isEditingMed ? 'Gestión de Insumo' : 'Alta de Insumo o Activo Integral'}</h3>
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
                    <div className={`p-8 rounded-[3rem] border transition-all h-full flex flex-col justify-between shadow-xl ${createInCatalog ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="space-y-8">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3 text-indigo-700">
                                  <DollarSign size={20}/>
                                  <h4 className="text-[12px] font-black uppercase leading-tight">Vínculo de Venta<br/>(POS)</h4>
                              </div>
                              <button onClick={() => setCreateInCatalog(!createInCatalog)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all shadow-md ${createInCatalog ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border border-indigo-100'}`}>
                                 {createInCatalog ? 'Publicación Activa' : 'No Publicado'}
                              </button>
                           </div>

                           {createInCatalog ? (
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
                 <button onClick={() => { setShowAddModal(false); resetForms(); }} className="flex-1 py-6 bg-slate-100 rounded-[2rem] font-black text-xs uppercase text-slate-500 hover:bg-slate-200 transition-all">Cancelar</button>
                 <button onClick={handleCreateMed} className="flex-[2.5] py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                    <Save size={24} /> {isEditingMed ? 'Guardar Cambios de Ficha' : 'Certificar Alta Integral de Producto'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
