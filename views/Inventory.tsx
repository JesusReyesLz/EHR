
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, Plus, AlertTriangle, Calendar, ClipboardList, TrendingUp, TrendingDown, 
  Info, Filter, CheckCircle2, X, Save, Truck, FileBadge, ShieldCheck, History, ArrowRight, 
  Database, ArrowUpRight, ArrowDownLeft, Printer, FileText, QrCode, User, Pill, ShoppingBag, 
  Clock, ChevronLeft, Stethoscope, Archive, ExternalLink, RefreshCw, UserMinus, ShoppingCart, 
  Trash2, Edit, Copy, AlertOctagon, ChevronDown, ChevronRight, Layers,
  Droplet, Scissors, Monitor, Box, CalendarOff, Maximize, FileSpreadsheet,
  AlertCircle, Receipt, Tag, DollarSign
} from 'lucide-react';
import { MedicationStock, StockMovement, MedicationCategory, ClinicalNote, Patient, MedicationBatch, SupplyType, PriceItem, PriceType } from '../types';
import { INITIAL_STOCK, INITIAL_PRICES } from '../constants';

// Helper para generar IDs únicos
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'replenish'>('stock');
  
  // Estado de inventario
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

  // Estado del catálogo de precios (para vinculación)
  const [prices, setPrices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [kardexSearch, setKardexSearch] = useState('');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showAddToCatalogModal, setShowAddToCatalogModal] = useState(false); // NUEVO MODAL
  const [isEditingMed, setIsEditingMed] = useState(false);

  // Estados para manejo de "No Caduca"
  const [noExpiry, setNoExpiry] = useState(false);

  // Selección
  const [selectedMed, setSelectedMed] = useState<MedicationStock | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Forms
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | null>(null);
  const [movementQty, setMovementQty] = useState(0);
  const [movementReason, setMovementReason] = useState('');
  const [outReasonCategory, setOutReasonCategory] = useState('Merma / Daño'); 

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

  // NUEVO: Formulario para crear precio automáticamente en catálogo
  const [createInCatalog, setCreateInCatalog] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
      price: '',
      tax: 16,
      code: ''
  });

  // Persistencia
  useEffect(() => {
    localStorage.setItem('med_inventory_v6', JSON.stringify(stock));
    localStorage.setItem('med_movements_v6', JSON.stringify(movements));
  }, [stock, movements]);

  // Persistencia de Precios (Solo cuando se actualiza desde aquí)
  useEffect(() => {
    localStorage.setItem('med_price_catalog_v1', JSON.stringify(prices));
  }, [prices]);

  // --- HELPERS ---
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

  const isLinkedToCatalog = (medId: string) => {
      return prices.some(p => p.linkedInventoryId === medId);
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
        idealStock: Number(medForm.idealStock) || 50,
        batches: [{
            id: newBatchId,
            batchNumber: batchForm.batchNumber!.toUpperCase(),
            expiryDate: noExpiry ? 'N/A' : batchForm.expiryDate!,
            currentStock: initialQty
        }]
    };

    // Agregar al Inventario
    setStock([newMed, ...stock]);
    if (initialQty > 0) {
        addLog(newMed.id, newMed.name, newMed.batches[0].batchNumber, 'IN', initialQty, 'Alta Inicial de Insumo');
    }

    // LÓGICA DE VINCULACIÓN CON CATÁLOGO
    if (createInCatalog && catalogForm.price) {
        const newPriceItem: PriceItem = {
            id: `PRICE-${Date.now()}`,
            code: catalogForm.code || newMedId.split('-')[1], // Fallback code
            name: `${newMed.name} ${newMed.concentration} (${newMed.presentation})`,
            type: PriceType.PRODUCT,
            category: 'Farmacia', // Default
            price: parseFloat(catalogForm.price),
            taxPercent: catalogForm.tax,
            linkedInventoryId: newMedId // VINCULACIÓN AUTOMÁTICA
        };
        setPrices(prev => [newPriceItem, ...prev]);
        alert("Ítem creado en Inventario y agregado al Catálogo de Precios correctamente.");
    }

    setShowAddModal(false);
    resetForms();
  };

  const handleLinkToCatalog = () => {
      if (!selectedMed || !catalogForm.price) return;

      const newPriceItem: PriceItem = {
          id: `PRICE-${Date.now()}`,
          code: catalogForm.code || `SKU-${Date.now().toString().slice(-4)}`,
          name: `${selectedMed.name} ${selectedMed.concentration} (${selectedMed.presentation})`.trim(),
          type: PriceType.PRODUCT,
          category: 'Farmacia',
          price: parseFloat(catalogForm.price),
          taxPercent: catalogForm.tax,
          linkedInventoryId: selectedMed.id
      };

      setPrices(prev => [newPriceItem, ...prev]);
      setShowAddToCatalogModal(false);
      resetForms();
      alert("Insumo vinculado exitosamente al Catálogo de Precios.");
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
          idealStock: Number(medForm.idealStock) || 50
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
      setCatalogForm({ price: '', tax: 16, code: '' });
      setCreateInCatalog(false);
      setMovementQty(0);
      setMovementReason('');
      setSelectedMed(null);
      setSelectedBatchId(null);
      setNoExpiry(false);
  };

  const filteredStock = useMemo(() => {
      if (!searchTerm) return stock;
      const term = searchTerm.toLowerCase();
      return stock.filter(s => s.name.toLowerCase().includes(term) || s.genericName.toLowerCase().includes(term));
  }, [stock, searchTerm]);

  // UI Render (Restoring the missing UI part)
  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase">Gestión de Inventarios</h1>
          <p className="text-slate-500 text-sm font-bold uppercase mt-1">Farmacia Intrahospitalaria y Suministros</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
              <button onClick={() => setActiveTab('stock')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Existencias</button>
              <button onClick={() => setActiveTab('movements')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'movements' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Kardex</button>
              <button onClick={() => setActiveTab('replenish')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'replenish' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Reabastecer</button>
           </div>
           <button onClick={() => setShowAddModal(true)} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Plus size={16} /> Nuevo Insumo
           </button>
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px]">
           <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <Search className="text-slate-400" />
              <input 
                className="flex-1 bg-transparent text-sm font-bold outline-none uppercase placeholder-slate-300" 
                placeholder="Buscar medicamento, activo o insumo..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                       <th className="px-8 py-4">Insumo / Descripción</th>
                       <th className="px-4 py-4 text-center">Tipo</th>
                       <th className="px-4 py-4 text-center">Total Stock</th>
                       <th className="px-4 py-4 text-center">Lotes</th>
                       <th className="px-4 py-4 text-center">Próx. Caducidad</th>
                       <th className="px-8 py-4 text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredStock.map(item => {
                       const total = getTotalStock(item);
                       const nextExp = getNextExpiry(item);
                       const expStatus = getExpiryStatus(nextExp || '');
                       
                       return (
                          <React.Fragment key={item.id}>
                             <tr className="hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => setExpandedMedId(expandedMedId === item.id ? null : item.id)}>
                                <td className="px-8 py-4">
                                   <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-100 rounded-lg">{getTypeIcon(item.supplyType)}</div>
                                      <div>
                                         <p className="text-sm font-black text-slate-900 uppercase">{item.name}</p>
                                         <p className="text-[10px] text-slate-500 font-bold uppercase">{item.genericName} • {item.presentation} {item.concentration}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-4 py-4 text-center text-[10px] font-bold text-slate-500 uppercase">{item.category}</td>
                                <td className="px-4 py-4 text-center">
                                   <span className={`px-3 py-1 rounded-lg text-xs font-black ${total <= item.minStock ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                      {total} {item.unit}
                                   </span>
                                </td>
                                <td className="px-4 py-4 text-center text-[10px] font-bold text-slate-500">{item.batches?.length || 0}</td>
                                <td className="px-4 py-4 text-center">
                                   <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${expStatus.color}`}>
                                      {nextExp || 'N/A'}
                                   </span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                   <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => { setSelectedMed(item); setMovementType('IN'); setShowMovementModal(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all" title="Entrada"><ArrowDownLeft size={16}/></button>
                                      <button onClick={() => { setSelectedMed(item); setMovementType('OUT'); setShowMovementModal(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all" title="Salida"><ArrowUpRight size={16}/></button>
                                      <button onClick={() => { setSelectedMed(item); setMedForm(item); setIsEditingMed(true); setShowAddModal(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all" title="Editar"><Edit size={16}/></button>
                                      <button onClick={() => handleDeleteMed(item)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all" title="Eliminar"><Trash2 size={16}/></button>
                                   </div>
                                </td>
                             </tr>
                             {expandedMedId === item.id && (
                                <tr className="bg-slate-50/50">
                                   <td colSpan={6} className="px-8 py-4">
                                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                                         <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalle de Lotes</p>
                                            <div className="flex gap-2">
                                                {!isLinkedToCatalog(item.id) && (
                                                    <button onClick={() => { setSelectedMed(item); setCatalogForm({...catalogForm, code: item.id.split('-')[1]}); setShowAddToCatalogModal(true); }} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-100 border border-indigo-100">
                                                        + Vincular a Precios
                                                    </button>
                                                )}
                                                <button onClick={() => { setSelectedMed(item); setShowBatchModal(true); }} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 border border-blue-100">
                                                    + Nuevo Lote
                                                </button>
                                            </div>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {item.batches?.map(batch => (
                                               <div key={batch.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <div>
                                                     <p className="text-[10px] font-black text-slate-700 uppercase">Lote: {batch.batchNumber}</p>
                                                     <p className="text-[9px] font-bold text-slate-400 uppercase">Cad: {batch.expiryDate}</p>
                                                  </div>
                                                  <div className="text-right">
                                                     <p className="text-sm font-black text-slate-900">{batch.currentStock}</p>
                                                     {batch.currentStock === 0 && (
                                                         <button onClick={() => handleDeleteBatch(item.id, batch.id, batch.currentStock, batch.batchNumber)} className="text-[8px] text-rose-500 hover:underline">Eliminar</button>
                                                     )}
                                                  </div>
                                               </div>
                                            ))}
                                            {(!item.batches || item.batches.length === 0) && <p className="text-[10px] italic text-slate-400">Sin lotes registrados.</p>}
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

      {/* Movement Modal etc. - Simulating standard implementation from existing context */}
      {/* ... (Implementation of modals follows the same pattern as defined in the helper functions) */}
      
      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                 <h3 className="text-2xl font-black text-slate-900 uppercase">{isEditingMed ? 'Editar Insumo' : 'Alta de Nuevo Insumo'}</h3>
                 <button onClick={() => { setShowAddModal(false); setIsEditingMed(false); resetForms(); }}><X size={24} className="text-slate-400 hover:text-rose-500" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nombre Comercial</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:border-indigo-500" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} placeholder="Ej: TEMPRA" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Sustancia Activa</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.genericName} onChange={e => setMedForm({...medForm, genericName: e.target.value})} placeholder="Ej: PARACETAMOL" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Presentación</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={medForm.presentation} onChange={e => setMedForm({...medForm, presentation: e.target.value})} placeholder="Ej: CAJA C/10 TABS" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tipo de Insumo</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none" value={medForm.supplyType} onChange={e => setMedForm({...medForm, supplyType: e.target.value as any})}>
                       <option value={SupplyType.MEDICATION}>Medicamento</option>
                       <option value={SupplyType.SOLUTION}>Solución</option>
                       <option value={SupplyType.HEALING_MATERIAL}>Material Curación</option>
                       <option value={SupplyType.SURGICAL}>Quirúrgico</option>
                       <option value={SupplyType.EQUIPMENT}>Equipo</option>
                       <option value={SupplyType.OTHER}>Otro</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Stock Mínimo</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={medForm.minStock} onChange={e => setMedForm({...medForm, minStock: parseInt(e.target.value)})} />
                 </div>
                 
                 {!isEditingMed && (
                    <div className="col-span-2 bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-4 space-y-4">
                       <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Datos del Primer Lote</p>
                       <div className="grid grid-cols-2 gap-4">
                          <input className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-mono uppercase" placeholder="Lote" value={batchForm.batchNumber} onChange={e => setBatchForm({...batchForm, batchNumber: e.target.value})} />
                          <input type="number" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs" placeholder="Cantidad Inicial" value={batchForm.currentStock} onChange={e => setBatchForm({...batchForm, currentStock: parseInt(e.target.value)})} />
                          <div className="col-span-2 flex items-center justify-between">
                             {!noExpiry ? (
                                <input type="date" className="flex-1 p-3 bg-white border border-blue-200 rounded-xl text-xs mr-4" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} />
                             ) : (
                                <div className="flex-1 p-3 bg-slate-100 rounded-xl text-xs text-center font-bold text-slate-400 mr-4">NO APLICA CADUCIDAD</div>
                             )}
                             <button onClick={() => setNoExpiry(!noExpiry)} className="text-[9px] font-bold text-blue-600 underline">
                                {noExpiry ? 'Asignar Fecha' : 'No Caduca'}
                             </button>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Opción para crear precio en catálogo automáticamente */}
                 {!isEditingMed && (
                     <div className="col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <input type="checkbox" checked={createInCatalog} onChange={e => setCreateInCatalog(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                             <label className="text-[10px] font-black text-indigo-800 uppercase">Crear también en Catálogo de Precios</label>
                         </div>
                         {createInCatalog && (
                             <input type="number" className="w-32 p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-center" placeholder="Precio ($)" value={catalogForm.price} onChange={e => setCatalogForm({...catalogForm, price: e.target.value})} />
                         )}
                     </div>
                 )}
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => { setShowAddModal(false); resetForms(); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                 <button onClick={isEditingMed ? handleUpdateMedMaster : handleCreateMed} className="flex-[2] py-4 bg-slate-900 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl hover:bg-emerald-600 transition-all">
                    {isEditingMed ? 'Guardar Cambios' : 'Registrar Insumo'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && selectedMed && (
         <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95">
               <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 uppercase">{movementType === 'IN' ? 'Entrada de Stock' : 'Salida de Stock'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-2">{selectedMed.name}</p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Seleccionar Lote</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none" onChange={e => setSelectedBatchId(e.target.value)}>
                        <option value="">-- Seleccione Lote --</option>
                        {selectedMed.batches.map(b => (
                           <option key={b.id} value={b.id}>{b.batchNumber} (Stock: {b.currentStock})</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Cantidad</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" value={movementQty} onChange={e => setMovementQty(parseInt(e.target.value))} />
                  </div>
                  
                  {movementType === 'OUT' && (
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Motivo de Salida</label>
                          <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none" value={outReasonCategory} onChange={e => setOutReasonCategory(e.target.value)}>
                              <option>Merma / Daño</option>
                              <option>Caducidad</option>
                              <option>Uso Interno / Consumo</option>
                              <option>Ajuste de Inventario</option>
                              <option>Donación</option>
                          </select>
                      </div>
                  )}

                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Notas / Referencia</label>
                     <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" placeholder="Ej: Factura 123 / Paciente X" value={movementReason} onChange={e => setMovementReason(e.target.value)} />
                  </div>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => { setShowMovementModal(false); resetForms(); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                  <button onClick={handleStockMovement} className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl transition-all ${movementType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                     Confirmar Movimiento
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && selectedMed && (
         <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95">
               <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 uppercase">Agregar Lote</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-2">{selectedMed.name}</p>
               </div>
               <div className="space-y-4">
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono uppercase" placeholder="Número de Lote" value={batchForm.batchNumber} onChange={e => setBatchForm({...batchForm, batchNumber: e.target.value})} />
                  
                  <div className="flex items-center gap-2">
                      {!noExpiry ? (
                          <input type="date" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} />
                      ) : (
                          <div className="flex-1 p-4 bg-slate-100 rounded-2xl text-xs font-bold text-center text-slate-400">SIN CADUCIDAD</div>
                      )}
                      <button onClick={() => setNoExpiry(!noExpiry)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                          {noExpiry ? <CalendarOff size={20}/> : <Calendar size={20}/>}
                      </button>
                  </div>

                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" placeholder="Cantidad Inicial" value={batchForm.currentStock} onChange={e => setBatchForm({...batchForm, currentStock: parseInt(e.target.value)})} />
               </div>
               <div className="flex gap-4">
                  <button onClick={() => { setShowBatchModal(false); resetForms(); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                  <button onClick={handleAddBatch} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-blue-700">Guardar Lote</button>
               </div>
            </div>
         </div>
      )}

      {/* Add to Catalog Modal */}
      {showAddToCatalogModal && selectedMed && (
          <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95">
                  <div className="text-center">
                      <h3 className="text-xl font-black text-slate-900 uppercase">Vincular a Precios</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase mt-2">Crear ítem de cobro para {selectedMed.name}</p>
                  </div>
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Precio Público</label>
                          <input type="number" autoFocus className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center" value={catalogForm.price} onChange={e => setCatalogForm({...catalogForm, price: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Código SKU (Opcional)</label>
                          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono uppercase" value={catalogForm.code} onChange={e => setCatalogForm({...catalogForm, code: e.target.value})} placeholder={selectedMed.id.split('-')[1]} />
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => { setShowAddToCatalogModal(false); resetForms(); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                      <button onClick={handleLinkToCatalog} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700">Crear Precio</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
