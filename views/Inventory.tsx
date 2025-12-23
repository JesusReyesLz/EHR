
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown,
  Info,
  Filter,
  CheckCircle2,
  X,
  Save,
  Truck,
  FileBadge,
  ShieldCheck,
  History,
  ArrowRight,
  Database,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { MedicationStock, StockMovement, MedicationCategory } from '../types';
import { INITIAL_STOCK } from '../constants';

const Inventory: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [stock, setStock] = useState<MedicationStock[]>(() => {
    const saved = localStorage.getItem('med_inventory_v6');
    return saved ? JSON.parse(saved) : INITIAL_STOCK.map(s => ({ ...s, category: MedicationCategory.GENERAL }));
  });
  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('med_movements_v6');
    return saved ? JSON.parse(saved) : [];
  });

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationStock | null>(null);
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | null>(null);
  const [movementQty, setMovementQty] = useState(0);
  const [movementReason, setMovementReason] = useState('');

  // Estado para nuevo medicamento
  const [newMed, setNewMed] = useState<Partial<MedicationStock>>({
    name: '',
    genericName: '',
    presentation: 'Tabletas',
    concentration: '',
    batch: '',
    expiryDate: '',
    currentStock: 0,
    minStock: 10,
    unit: 'Cajas',
    supplier: '',
    registroCofepris: '',
    category: MedicationCategory.GENERAL
  });

  // Persistencia
  useEffect(() => {
    localStorage.setItem('med_inventory_v6', JSON.stringify(stock));
    localStorage.setItem('med_movements_v6', JSON.stringify(movements));
  }, [stock, movements]);

  // Filtrado de stock
  const filteredStock = useMemo(() => {
    return stock.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (m.genericName && m.genericName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.batch.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stock, searchTerm]);

  // Alertas
  const lowStockCount = stock.filter(m => m.currentStock <= m.minStock).length;
  const expiredCount = stock.filter(m => new Date(m.expiryDate) < new Date()).length;

  const getExpiryStatus = (dateStr: string) => {
    const expiry = new Date(dateStr);
    const now = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(now.getMonth() + 3);

    if (expiry < now) return { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'CADUCADO' };
    if (expiry <= threeMonths) return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'PRÓXIMO A VENCER' };
    return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'VIGENTE' };
  };

  const addMovement = (medId: string, medName: string, batch: string, type: 'IN' | 'OUT', qty: number, reason: string) => {
    const newMove: StockMovement = {
      id: `MOV-${Date.now()}`,
      medicationId: medId,
      medicationName: medName,
      batch: batch,
      type,
      quantity: qty,
      date: new Date().toLocaleString('es-MX'),
      reason: reason || (type === 'IN' ? 'Entrada manual' : 'Salida manual'),
      responsible: 'Dr. Alejandro Méndez'
    };
    setMovements(prev => [newMove, ...prev]);
  };

  const handleStockUpdate = () => {
    if (!selectedMed || !movementType || movementQty <= 0) return;

    if (movementType === 'OUT' && movementQty > selectedMed.currentStock) {
      alert('Error: No hay suficiente stock disponible para realizar esta salida.');
      return;
    }

    setStock(prev => prev.map(m => {
      if (m.id === selectedMed.id) {
        const newQty = movementType === 'IN' 
          ? m.currentStock + movementQty 
          : m.currentStock - movementQty;
        return { ...m, currentStock: newQty };
      }
      return m;
    }));

    addMovement(selectedMed.id, selectedMed.name, selectedMed.batch, movementType, movementQty, movementReason);
    
    // Reset
    setSelectedMed(null);
    setMovementType(null);
    setMovementQty(0);
    setMovementReason('');
  };

  const handleRegisterNewMed = () => {
    // Validación robusta
    if (!newMed.name?.trim() || !newMed.batch?.trim() || !newMed.expiryDate) {
      alert('Por favor complete los campos obligatorios: Nombre, Lote y Fecha de Caducidad.');
      return;
    }

    const medToAdd: MedicationStock = {
      id: `MED-${Date.now()}`,
      name: newMed.name.trim().toUpperCase(),
      genericName: (newMed.genericName || '').trim().toUpperCase(),
      presentation: newMed.presentation || 'Tabletas',
      concentration: newMed.concentration || '',
      batch: newMed.batch.trim().toUpperCase(),
      expiryDate: newMed.expiryDate,
      currentStock: Number(newMed.currentStock) || 0,
      minStock: Number(newMed.minStock) || 10,
      unit: newMed.unit || 'Cajas',
      supplier: newMed.supplier || 'N/A',
      registroCofepris: newMed.registroCofepris || 'N/A',
      category: newMed.category || MedicationCategory.GENERAL
    };

    setStock(prev => [medToAdd, ...prev]);
    
    if (medToAdd.currentStock > 0) {
      addMovement(medToAdd.id, medToAdd.name, medToAdd.batch, 'IN', medToAdd.currentStock, 'Inventario Inicial (Alta)');
    }
    
    setShowAddModal(false);
    setSearchTerm(''); // Limpiamos búsqueda para que el nuevo item sea visible
    
    // Reset form con todos los campos para evitar undefined futuros
    setNewMed({
      name: '', genericName: '', presentation: 'Tabletas', concentration: '',
      batch: '', expiryDate: '', currentStock: 0, minStock: 10, unit: 'Cajas',
      supplier: '', registroCofepris: '', category: MedicationCategory.GENERAL
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] mb-2">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Gestión de Farmacia Hospitalaria</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Control de Inventario</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Cumplimiento con NOM-059-SSA1 y NOM-072-SSA1.</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-3xl shadow-sm self-start">
          <button 
            onClick={() => setActiveTab('stock')}
            className={`flex items-center px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package className="w-4 h-4 mr-2" /> Stock Actual
          </button>
          <button 
            onClick={() => setActiveTab('movements')}
            className={`flex items-center px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'movements' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History className="w-4 h-4 mr-2" /> Movimientos
          </button>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-slate-900 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-3" /> Registrar Nuevo Insumo
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-sm flex items-center space-x-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insumos Registrados</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stock.length}</p>
              </div>
            </div>

            <div className={`bg-white border rounded-[2.5rem] p-7 shadow-sm flex items-center space-x-5 transition-all ${lowStockCount > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${lowStockCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertas de Stock</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{lowStockCount}</p>
              </div>
            </div>

            <div className={`bg-white border rounded-[2.5rem] p-7 shadow-sm flex items-center space-x-5 transition-all ${expiredCount > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${expiredCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-300'}`}>
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caducados</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{expiredCount}</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-7 text-white shadow-xl shadow-slate-200 flex items-center space-x-5 relative overflow-hidden group">
              <CheckCircle2 className="absolute -right-2 -bottom-2 w-20 h-20 opacity-10 group-hover:scale-110 transition-transform" />
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner relative z-10">
                <ShieldCheck className="w-7 h-7 text-blue-400" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus Normativo</p>
                <p className="text-xl font-black uppercase mt-1">Auditado OK</p>
              </div>
            </div>
          </div>

          {/* Buscador y Filtros */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-5 items-center justify-between">
              <div className="relative flex-1 max-w-xl w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar por Nombre, Sustancia Activa o Lote..."
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-200 outline-none transition-all text-sm font-bold shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-10 py-6">Medicamento / Sustancia Activa</th>
                    <th className="px-10 py-6">Clasificación Sanitaria</th>
                    <th className="px-10 py-6 text-center">Lote</th>
                    <th className="px-10 py-6">Control de Caducidad</th>
                    <th className="px-10 py-6 text-center">Stock</th>
                    <th className="px-10 py-6 text-right">Manejo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStock.map((med) => {
                    const exp = getExpiryStatus(med.expiryDate);
                    const isLow = med.currentStock <= med.minStock;

                    return (
                      <tr key={med.id} className="hover:bg-blue-50/20 transition-all group">
                        <td className="px-10 py-8">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{med.name}</p>
                          <div className="flex items-center mt-1.5">
                             <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{med.genericName}</p>
                             <span className="mx-2 text-slate-300">•</span>
                             <p className="text-[10px] text-slate-400 font-medium uppercase">{med.presentation} {med.concentration}</p>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                           <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest ${
                             med.category === MedicationCategory.ANTIBIOTIC ? 'bg-amber-50 text-amber-700 border-amber-200' :
                             med.category === MedicationCategory.CONTROLLED ? 'bg-rose-50 text-rose-700 border-rose-200' :
                             'bg-slate-100 text-slate-600 border-slate-200'
                           }`}>
                             {med.category || 'General'}
                           </span>
                        </td>
                        <td className="px-10 py-8 text-center">
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-mono font-black border border-slate-200 shadow-sm">
                            {med.batch}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-2xl text-[9px] font-black border uppercase tracking-widest inline-flex items-center ${exp.color}`}>
                            <Calendar className="w-3.5 h-3.5 mr-2 opacity-50" />
                            {med.expiryDate} • {exp.label}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                          <div className={`inline-flex flex-col items-center justify-center min-w-[70px] px-4 py-2.5 rounded-2xl border ${isLow ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                            <span className="text-xl font-black leading-none">{med.currentStock}</span>
                            <span className="text-[8px] font-black uppercase mt-1 opacity-60">{med.unit}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => { setSelectedMed(med); setMovementType('IN'); }}
                              className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm group/btn"
                              title="Entrada de Stock"
                            >
                              <TrendingUp className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={() => { setSelectedMed(med); setMovementType('OUT'); }}
                              className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                              title="Salida / Dispensación"
                            >
                              <TrendingDown className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-32 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                          <Package className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-900 font-black uppercase tracking-tight">No se encontraron insumos</p>
                        <p className="text-sm text-slate-400 mt-2">Ajuste los filtros o registre un nuevo medicamento.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registro de Movimientos (Auditoría)</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bitácora obligatoria para trazabilidad sanitaria</p>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-10 py-5">Fecha / Hora</th>
                    <th className="px-10 py-5">Concepto / Medicamento</th>
                    <th className="px-10 py-5 text-center">Lote</th>
                    <th className="px-10 py-5 text-center">Tipo</th>
                    <th className="px-10 py-5 text-center">Cantidad</th>
                    <th className="px-10 py-5">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50 transition-all">
                       <td className="px-10 py-6 text-[10px] font-mono font-bold text-slate-500">{mov.date}</td>
                       <td className="px-10 py-6">
                          <p className="text-xs font-black text-slate-900 uppercase">{mov.medicationName}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">{mov.reason}</p>
                       </td>
                       <td className="px-10 py-6 text-center">
                          <span className="text-[10px] font-mono font-black text-slate-600">{mov.batch}</span>
                       </td>
                       <td className="px-10 py-6 text-center">
                          {mov.type === 'IN' ? (
                            <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase border border-emerald-100">
                               <ArrowUpRight className="w-3 h-3 mr-1" /> Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100">
                               <ArrowDownLeft className="w-3 h-3 mr-1" /> Salida
                            </span>
                          )}
                       </td>
                       <td className="px-10 py-6 text-center font-black text-slate-900">{mov.quantity}</td>
                       <td className="px-10 py-6 text-[10px] font-black uppercase text-slate-500">{mov.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODAL MOVIMIENTO (IN/OUT) */}
      {selectedMed && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12 flex flex-col space-y-10 border border-white/20">
            <div className="flex justify-between items-center">
               <div className="flex items-center space-x-5">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl ${movementType === 'IN' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    {movementType === 'IN' ? <TrendingUp size={30} /> : <TrendingDown size={30} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{movementType === 'IN' ? 'Entrada de Insumo' : 'Dispensación / Salida'}</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedMed.name} • LOTE: {selectedMed.batch}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedMed(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200"><X size={24} className="text-slate-400" /></button>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
               <div className="grid grid-cols-2 gap-10">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Cantidad en {selectedMed.unit}</label>
                    <input 
                      type="number" 
                      className="w-full p-5 bg-white border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                      value={movementQty}
                      onChange={(e) => setMovementQty(parseInt(e.target.value) || 0)}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col justify-center border-l border-slate-200 pl-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Final</p>
                    <p className={`text-4xl font-black ${movementType === 'OUT' && (selectedMed.currentStock - movementQty < 0) ? 'text-rose-600' : 'text-slate-900'}`}>
                      {movementType === 'IN' ? selectedMed.currentStock + movementQty : selectedMed.currentStock - movementQty}
                    </p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Observaciones / Motivo</label>
               <input 
                 type="text" 
                 placeholder="Ej: Suministro a Piso de Hospitalización, Compra Factura #123..."
                 className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all"
                 value={movementReason}
                 onChange={(e) => setMovementReason(e.target.value)}
               />
            </div>

            <div className="flex gap-4">
               <button onClick={() => setSelectedMed(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-200">Cancelar</button>
               <button 
                 onClick={handleStockUpdate}
                 className={`flex-[2] py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${movementType === 'IN' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
               >
                 Confirmar y Sellar Movimiento
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA NUEVO MEDICAMENTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl p-14 flex flex-col space-y-12 max-h-[95vh] overflow-y-auto border-4 border-blue-50/50">
            <div className="flex justify-between items-center">
               <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-blue-400 shadow-2xl ring-4 ring-blue-50">
                    <Plus size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Alta de Insumo Sanitario</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Registro técnico bajo normas COFEPRIS</p>
                  </div>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-4 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200"><X size={32} className="text-slate-400" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               {/* Columna 1 */}
               <div className="space-y-8">
                  <div className="flex items-center space-x-3 text-blue-600 border-b-2 border-blue-100 pb-3 mb-2">
                     <ClipboardList size={20} />
                     <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Identificación del Fármaco</h3>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Nombre Comercial *</label>
                     <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase focus:ring-4 focus:ring-blue-100 transition-all outline-none" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} placeholder="Ej: TEMPRA" />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Sustancia Activa (Genérico)</label>
                     <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase focus:ring-4 focus:ring-blue-100 transition-all outline-none" value={newMed.genericName} onChange={e => setNewMed({...newMed, genericName: e.target.value})} placeholder="Ej: PARACETAMOL" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Concentración</label>
                       <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={newMed.concentration} onChange={e => setNewMed({...newMed, concentration: e.target.value})} placeholder="500mg" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Categoría COFEPRIS</label>
                       <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none" value={newMed.category} onChange={e => setNewMed({...newMed, category: e.target.value as MedicationCategory})}>
                          {Object.values(MedicationCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                    </div>
                  </div>
               </div>

               {/* Columna 2 */}
               <div className="space-y-8">
                  <div className="flex items-center space-x-3 text-amber-600 border-b-2 border-amber-100 pb-3 mb-2">
                     <FileBadge size={20} />
                     <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Datos de Lote y Trazabilidad</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Número de Lote *</label>
                       <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black uppercase outline-none" value={newMed.batch} onChange={e => setNewMed({...newMed, batch: e.target.value})} placeholder="LOT-000" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Fecha Caducidad *</label>
                       <input type="date" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newMed.expiryDate} onChange={e => setNewMed({...newMed, expiryDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Stock Inicial</label>
                       <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newMed.currentStock} onChange={e => setNewMed({...newMed, currentStock: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Min. Alerta</label>
                       <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newMed.minStock} onChange={e => setNewMed({...newMed, minStock: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Registro Sanitario COFEPRIS</label>
                     <div className="relative">
                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none" value={newMed.registroCofepris} onChange={e => setNewMed({...newMed, registroCofepris: e.target.value})} placeholder="Ej: 123M2015 SSA" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-blue-50/50 border-2 border-dashed border-blue-200 p-10 rounded-[3rem] flex items-center shadow-inner">
               <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mr-8 shadow-xl">
                  <ShieldCheck size={32} />
               </div>
               <p className="text-[11px] font-bold text-blue-900 uppercase leading-relaxed max-w-2xl">
                 Al registrar este medicamento, el sistema activará automáticamente las reglas de <span className="font-black">semaforización de caducidad</span> y alertas de <span className="font-black">stock mínimo</span>. Toda la información será persistida en el servidor seguro de la unidad médica.
               </p>
            </div>

            <div className="flex gap-6">
               <button onClick={() => setShowAddModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-[2rem] hover:bg-slate-200 transition-all">Cancelar Registro</button>
               <button 
                 onClick={handleRegisterNewMed}
                 className="flex-[2] py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] hover:bg-blue-600 transition-all flex items-center justify-center gap-4 group"
               >
                  <Save className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                  Confirmar Alta en Inventario
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
