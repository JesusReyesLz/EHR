
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Tag, DollarSign, 
  Printer, Trash2, Edit2, Package, X,
  Link as LinkIcon, Syringe, CalendarOff, Calendar,
  FlaskConical, Beaker, Pill, Droplets, Info,
  Save, Activity, CheckCircle2, ArrowRight, Layers,
  Laptop, Armchair, Box, Monitor, Scissors, Stethoscope,
  Microscope, ImageIcon
} from 'lucide-react';
import { PriceItem, PriceType, MedicationStock, MedicationCategory, SupplyType, MedicationBatch, LinkedSupply } from '../types';
import { INITIAL_PRICES, INITIAL_STOCK } from '../constants';

const PriceCatalog: React.FC = () => {
  const [prices, setPrices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  const [inventory, setInventory] = useState<MedicationStock[]>(() => {
    const saved = localStorage.getItem('med_inventory_v6');
    let data = saved ? JSON.parse(saved) : INITIAL_STOCK;
    if (data.length > 0 && !data[0].batches) {
        data = data.map((item: any) => ({
            ...item,
            batches: [{ id: `B-${Date.now()}`, batchNumber: item.batch || 'S/L', expiryDate: item.expiryDate || '', currentStock: item.currentStock || 0 }]
        }));
    }
    return data;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'products' | 'studies'>('all');
  
  const [catalogItemToEdit, setCatalogItemToEdit] = useState<PriceItem | null>(null);
  const [showNewCatalogItemModal, setShowNewCatalogItemModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('med_price_catalog_v1', JSON.stringify(prices));
  }, [prices]);

  useEffect(() => {
    localStorage.setItem('med_inventory_v6', JSON.stringify(inventory));
  }, [inventory]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return prices.filter(p => {
      const matchText = p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
      let matchTab = true;
      if (activeTab === 'services') matchTab = p.type === PriceType.SERVICE && p.category !== 'Estudios / Auxiliares';
      if (activeTab === 'products') matchTab = p.type === PriceType.PRODUCT;
      if (activeTab === 'studies') matchTab = p.category === 'Estudios / Auxiliares';
      return matchText && matchTab;
    });
  }, [prices, searchTerm, activeTab]);

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este ítem del catálogo?')) {
      setPrices(prev => prev.filter(p => p.id !== id));
    }
  };

  const NewCatalogItemModal = () => {
      const [form, setForm] = useState<Partial<PriceItem>>(() => {
          if (catalogItemToEdit) return { ...catalogItemToEdit };
          return { name: '', code: '', price: 0, cost: 0, taxPercent: 16, category: 'General', type: PriceType.SERVICE, linkedSupplies: [] };
      });
      
      // Inventory Creation State
      const [createInventory, setCreateInventory] = useState(false);
      const [invForm, setInvForm] = useState({ 
          genericName: '', concentration: '', presentation: 'Unidad', supplyType: SupplyType.MEDICATION,
          unit: 'Pieza', minStock: 10, idealStock: 50, batchNumber: '', expiryDate: '', initialStock: 0, noExpiry: false
      });

      // Procedure Linking State
      const [supplySearch, setSupplySearch] = useState('');
      const [linkedSuppliesList, setLinkedSuppliesList] = useState<LinkedSupply[]>(form.linkedSupplies || []);

      // Estado auxiliar para definir subtipo de estudio (Lab vs Imagen)
      const [auxType, setAuxType] = useState<'LAB' | 'IMG'>(
          form.code?.startsWith('IMG') ? 'IMG' : 'LAB'
      );

      // Efecto para actualizar el código SKU automáticamente cuando cambia el subtipo de auxiliar
      useEffect(() => {
          if (form.category === 'Estudios / Auxiliares' && !catalogItemToEdit) {
              const prefix = auxType === 'LAB' ? 'LAB-' : 'IMG-';
              // Solo actualizamos si no tiene ya un código personalizado o si es el default
              if (!form.code || form.code.startsWith('LAB-') || form.code.startsWith('IMG-')) {
                  setForm(f => ({ ...f, code: `${prefix}${Date.now().toString().slice(-6)}` }));
              }
          }
      }, [auxType, form.category, catalogItemToEdit]);

      const inventoryMatches = useMemo(() => {
          if (supplySearch.length < 2) return [];
          return inventory.filter(i => i.name.toLowerCase().includes(supplySearch.toLowerCase()));
      }, [supplySearch]);

      const addLinkedSupply = (item: MedicationStock) => {
          if (linkedSuppliesList.find(s => s.inventoryId === item.id)) return;
          setLinkedSuppliesList([...linkedSuppliesList, { inventoryId: item.id, quantity: 1, name: item.name }]);
          setSupplySearch('');
      };

      const updateLinkedQty = (id: string, qty: number) => {
          setLinkedSuppliesList(linkedSuppliesList.map(s => s.inventoryId === id ? { ...s, quantity: qty } : s));
      };

      const removeLinkedSupply = (id: string) => {
          setLinkedSuppliesList(linkedSuppliesList.filter(s => s.inventoryId !== id));
      };
      
      const handleSaveNewItem = () => {
          if (!form.name || !form.price) return alert("Nombre y Precio son obligatorios");
          
          let linkedInvId = catalogItemToEdit?.linkedInventoryId;

          // Case 1: Create a completely new Product linked to new Inventory
          if (createInventory && form.type === PriceType.PRODUCT) {
              const newMedId = `MED-CAT-${Date.now()}`;
              const newMed: MedicationStock = {
                  id: newMedId,
                  name: form.name!.toUpperCase(),
                  genericName: invForm.genericName.toUpperCase() || form.name!.toUpperCase(),
                  presentation: invForm.presentation,
                  concentration: invForm.concentration,
                  unit: invForm.unit,
                  supplier: 'Proveedor Directo',
                  registroCofepris: 'EN TRÁMITE',
                  category: MedicationCategory.GENERAL,
                  supplyType: invForm.supplyType,
                  minStock: Number(invForm.minStock),
                  idealStock: Number(invForm.idealStock),
                  batches: [{
                      id: `B-${Date.now()}`,
                      batchNumber: invForm.batchNumber.toUpperCase() || 'S/L',
                      expiryDate: invForm.noExpiry ? 'N/A' : (invForm.expiryDate || 'N/A'),
                      currentStock: Number(invForm.initialStock)
                  }]
              };

              setInventory(prev => [newMed, ...prev]);
              linkedInvId = newMedId;

              // Log initial movement
              const savedMovements = JSON.parse(localStorage.getItem('med_movements_v6') || '[]');
              if (newMed.batches[0].currentStock > 0) {
                  localStorage.setItem('med_movements_v6', JSON.stringify([{
                      id: `MOV-${Date.now()}`, medicationId: newMedId, medicationName: newMed.name,
                      batch: newMed.batches[0].batchNumber, type: 'IN', quantity: newMed.batches[0].currentStock,
                      date: new Date().toLocaleString('es-MX'), reason: 'Alta desde Catálogo de Precios Maestro', responsible: 'Admin'
                  }, ...savedMovements]));
              }
          }

          const newItem: PriceItem = {
              ...form as PriceItem,
              id: catalogItemToEdit ? catalogItemToEdit.id : `PRICE-${Date.now()}`,
              code: form.code || `SKU-${Date.now().toString().slice(-4)}`,
              name: form.name!,
              price: Number(form.price),
              taxPercent: Number(form.taxPercent),
              category: form.category || 'General',
              type: form.type || PriceType.SERVICE,
              linkedInventoryId: linkedInvId,
              linkedSupplies: linkedSuppliesList,
              cost: Number(form.cost) || 0 // Save the operational cost
          };

          if (catalogItemToEdit) {
              setPrices(prev => prev.map(p => p.id === catalogItemToEdit.id ? newItem : p));
          } else {
              setPrices(prev => [newItem, ...prev]);
          }
          
          setShowNewCatalogItemModal(false);
      };

      return (
        <div className="fixed inset-0 z-[260] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 space-y-10 max-h-[95vh] overflow-y-auto custom-scrollbar border border-white/20">
                <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Tag size={28}/></div>
                        <div>
                            <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">{catalogItemToEdit ? 'Editar Concepto' : 'Alta Maestra Unificada'}</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Configuración Comercial y Operativa Integrada</p>
                        </div>
                    </div>
                    <button onClick={() => { setCatalogItemToEdit(null); setShowNewCatalogItemModal(false); }} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={32} className="text-slate-400" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* PARTE COMERCIAL */}
                    <div className="md:col-span-5 space-y-8">
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-indigo-600 border-b-2 border-indigo-100 pb-2 flex items-center gap-3"><DollarSign size={16}/> Configuración de Venta</h4>
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre Comercial del Concepto</label>
                                <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl font-black uppercase outline-none focus:border-indigo-500 shadow-inner text-lg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="EJ: CONSULTA, BIOMETRÍA, RADIOGRAFÍA" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Precio de Venta ($)</label>
                                    <input type="number" className="w-full p-5 bg-slate-900 text-white border-none rounded-3xl font-black text-2xl text-center outline-none shadow-xl" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">IVA (%)</label>
                                    <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl font-black text-center" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tipo de Activo</label>
                                    <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-3xl font-black uppercase text-[10px] outline-none shadow-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                                        <option value={PriceType.SERVICE}>Servicio / Procedimiento</option>
                                        <option value={PriceType.PRODUCT}>Producto / Insumo Físico</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Categoría</label>
                                    <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-3xl font-black uppercase text-[10px] outline-none shadow-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                        <option>General</option>
                                        <option>Procedimientos</option>
                                        <option>Honorarios</option>
                                        <option>Farmacia</option>
                                        <option>Insumos Médicos</option>
                                        <option>Estudios / Auxiliares</option>
                                    </select>
                                </div>
                            </div>

                            {/* SELECTOR ESPECÍFICO PARA TIPO DE ESTUDIO (LAB vs IMAGEN) */}
                            {form.category === 'Estudios / Auxiliares' && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-top-2">
                                    <label className="text-[9px] font-black uppercase text-blue-600 block mb-2">Clasificación del Estudio</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setAuxType('LAB')}
                                            className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${auxType === 'LAB' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-blue-100'}`}
                                        >
                                            <Microscope size={14}/> Laboratorio
                                        </button>
                                        <button 
                                            onClick={() => setAuxType('IMG')}
                                            className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${auxType === 'IMG' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-blue-100'}`}
                                        >
                                            <ImageIcon size={14}/> Imagenología
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-blue-400 mt-2 font-bold text-center">
                                        Se asignará prefijo {auxType === 'LAB' ? 'LAB-' : 'IMG-'} para correcta clasificación en módulo de Auxiliares.
                                    </p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">SKU / Código Interno</label>
                                    <input className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-mono font-black text-center uppercase" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="AUTO" />
                                </div>
                                {/* NEW: Operational Cost Field for Services */}
                                {form.type === PriceType.SERVICE && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Costo Base Operativo</label>
                                        <input type="number" className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-black text-center text-amber-800 outline-none" value={form.cost} onChange={e => setForm({...form, cost: parseFloat(e.target.value)})} placeholder="0.00" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PARTE INVENTARIO / VINCULACIÓN */}
                    <div className="md:col-span-7">
                        {form.type === PriceType.PRODUCT ? (
                            <div className="bg-emerald-50/50 p-10 rounded-[3.5rem] border border-emerald-100 space-y-8 h-full flex flex-col shadow-inner">
                                <div className="flex justify-between items-center border-b border-emerald-100 pb-4">
                                    <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-3">
                                        <Package size={20}/> Trazabilidad y Control de Stock
                                    </h4>
                                    <button onClick={() => setCreateInventory(!createInventory)} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase transition-all shadow-md ${createInventory ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-400 border border-emerald-100'}`}>
                                        {createInventory ? 'Controlar Existencias' : 'Solo Venta'}
                                    </button>
                                </div>

                                {createInventory ? (
                                    <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-emerald-600 ml-1">Clasificación de Inventario</label>
                                                <select className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-[11px] font-black uppercase outline-none" value={invForm.supplyType} onChange={e => setInvForm({...invForm, supplyType: e.target.value as any})}>
                                                    <option value={SupplyType.MEDICATION}>Medicamento</option>
                                                    <option value={SupplyType.HEALING_MATERIAL}>Material de Curación</option>
                                                    <option value={SupplyType.SURGICAL}>Instrumental</option>
                                                    <option value={SupplyType.EQUIPMENT}>Equipo Médico</option>
                                                    <option value={SupplyType.OTHER}>Mobiliario / Otros</option>
                                                </select>
                                            </div>
                                            {(invForm.supplyType === SupplyType.MEDICATION) ? (
                                                <div className="space-y-1.5 animate-in slide-in-from-right-2">
                                                    <label className="text-[8px] font-black uppercase text-emerald-600 ml-1">Sustancia (Genérico)</label>
                                                    <input className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-[11px] font-bold uppercase outline-none" value={invForm.genericName} onChange={e => setInvForm({...invForm, genericName: e.target.value})} placeholder="EJ: PARACETAMOL" />
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-emerald-600 ml-1">Concentración / Marca</label>
                                                <input className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-[11px] font-bold outline-none" value={invForm.concentration} onChange={e => setInvForm({...invForm, concentration: e.target.value})} placeholder="EJ: 500 MG, HP, LENOVO" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-emerald-600 ml-1">Stock Mínimo</label>
                                                <input type="number" className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-center font-black text-xs" value={invForm.minStock} onChange={e => setInvForm({...invForm, minStock: parseInt(e.target.value)})} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-emerald-600 ml-1">Unidad</label>
                                                <input className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-[11px] font-bold uppercase text-center" value={invForm.unit} onChange={e => setInvForm({...invForm, unit: e.target.value})} placeholder="PIEZA" />
                                            </div>
                                        </div>

                                        <div className="bg-white/40 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6">
                                            <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest flex items-center gap-3"><Layers size={16}/> Registro de Lote Inicial</p>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black uppercase text-slate-400">Num. Lote / Serie</label>
                                                    <input className="w-full p-4 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-black uppercase text-center shadow-sm" value={invForm.batchNumber} onChange={e => setInvForm({...invForm, batchNumber: e.target.value})} placeholder="S/L" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black uppercase text-slate-400">Existencia</label>
                                                    <input type="number" className="w-full p-4 bg-white border border-emerald-200 rounded-xl text-lg font-black text-center shadow-sm" value={invForm.initialStock} onChange={e => setInvForm({...invForm, initialStock: parseInt(e.target.value) || 0})} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black uppercase text-slate-400">Caducidad</label>
                                                    <div className="flex gap-2">
                                                        {!invForm.noExpiry ? (
                                                            <input type="date" className="flex-1 p-4 bg-white border border-emerald-200 rounded-xl text-[10px] shadow-sm font-bold" value={invForm.expiryDate} onChange={e => setInvForm({...invForm, expiryDate: e.target.value})} />
                                                        ) : (
                                                            <div className="flex-1 p-4 bg-slate-100 rounded-xl text-[9px] font-black text-slate-400 text-center flex items-center justify-center uppercase">No Perecedero</div>
                                                        )}
                                                        <button onClick={() => setInvForm({...invForm, noExpiry: !invForm.noExpiry})} className={`p-4 rounded-xl transition-all ${invForm.noExpiry ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-emerald-100 text-emerald-600'}`}><CalendarOff size={18}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50 space-y-6">
                                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-400"><Tag size={40} /></div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black uppercase text-emerald-900">Venta sin Control de Existencias</p>
                                            <p className="text-xs text-emerald-700 max-w-xs leading-relaxed uppercase font-medium">El ítem estará en el menú de cobro pero no se vinculará a ningún almacén físico ni se descontarán lotes.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* SECCIÓN DE VINCULACIÓN DE INSUMOS PARA PROCEDIMIENTOS */
                            <div className="bg-indigo-50/30 p-10 rounded-[3.5rem] border border-indigo-100 h-full flex flex-col shadow-inner">
                                <div className="border-b border-indigo-100 pb-6 mb-6">
                                    <h4 className="text-[12px] font-black uppercase text-indigo-800 flex items-center gap-3">
                                        <Stethoscope size={20}/> Insumos Incluidos (Kit de Procedimiento)
                                    </h4>
                                    <p className="text-[9px] text-indigo-500 mt-2 font-medium">
                                        Seleccione los materiales que se descontarán automáticamente del inventario al realizar este procedimiento.
                                    </p>
                                </div>

                                <div className="space-y-6 flex-1 flex flex-col">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-100 uppercase"
                                            placeholder="Buscar Insumo para vincular..."
                                            value={supplySearch}
                                            onChange={e => setSupplySearch(e.target.value)}
                                        />
                                        {inventoryMatches.length > 0 && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto">
                                                {inventoryMatches.map(item => (
                                                    <button 
                                                        key={item.id} 
                                                        onClick={() => addLinkedSupply(item)}
                                                        className="w-full text-left p-3 hover:bg-indigo-50 text-[10px] font-black uppercase border-b border-slate-50 last:border-0 flex justify-between"
                                                    >
                                                        <span>{item.name}</span>
                                                        <span className="text-slate-400">{item.batches?.reduce((a,b)=>a+b.currentStock,0) || 0} disp.</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar bg-white/50 rounded-2xl p-4 border border-slate-100">
                                        {linkedSuppliesList.map(supply => {
                                            const originalItem = inventory.find(i => i.id === supply.inventoryId);
                                            return (
                                                <div key={supply.inventoryId} className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-xl shadow-sm animate-in slide-in-from-left-2">
                                                    <div className="flex-1">
                                                        <p className="text-[9px] font-black uppercase text-indigo-900">{originalItem?.name || supply.name || 'Item'}</p>
                                                        <p className="text-[7px] font-bold text-slate-400 uppercase">{originalItem?.unit}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="number" 
                                                            className="w-12 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-black"
                                                            value={supply.quantity}
                                                            onChange={e => updateLinkedQty(supply.inventoryId, Math.max(1, parseInt(e.target.value) || 1))}
                                                        />
                                                        <button onClick={() => removeLinkedSupply(supply.inventoryId)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {linkedSuppliesList.length === 0 && (
                                            <div className="py-12 text-center opacity-30">
                                                <Box size={32} className="mx-auto mb-2 text-indigo-300"/>
                                                <p className="text-[9px] font-black uppercase text-indigo-300">Sin insumos vinculados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-10 border-t border-slate-100">
                    <button onClick={() => { setCatalogItemToEdit(null); setShowNewCatalogItemModal(false); }} className="flex-1 py-6 bg-slate-100 rounded-[2rem] font-black text-xs uppercase text-slate-500 hover:bg-slate-200 transition-all">Cancelar</button>
                    <button onClick={handleSaveNewItem} className="flex-[2.5] py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                        <Save size={24} /> {catalogItemToEdit ? 'Actualizar Registro Integral' : 'Certificar Nuevo Concepto Maestro'}
                    </button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-indigo-600">
             <DollarSign size={24} />
             <p className="text-[11px] font-black uppercase tracking-[0.4em]">ADMINISTRACIÓN FINANCIERA</p>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Catálogo Maestro</h1>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-200">
              <button onClick={() => setActiveTab('all')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
              <button onClick={() => setActiveTab('services')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'services' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>Servicios</button>
              <button onClick={() => setActiveTab('products')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>Farmacia/Insumos</button>
           </div>
           <button onClick={() => { setCatalogItemToEdit(null); setShowNewCatalogItemModal(true); }} className="px-10 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95">
              <Plus size={20} /> Nuevo Concepto
           </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3.5rem] shadow-sm overflow-hidden min-h-[600px]">
         <div className="p-10 border-b border-slate-100 flex items-center gap-8 bg-slate-50/30">
            <div className="relative flex-1">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
               <input className="w-full pl-16 pr-8 py-6 bg-white border border-slate-200 rounded-[2rem] text-sm font-black uppercase outline-none focus:border-indigo-500 transition-all shadow-inner" placeholder="Buscar por código, descripción o medicamento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="p-6 bg-white border border-slate-200 text-slate-400 rounded-[1.5rem] hover:text-slate-900 shadow-sm transition-all"><Printer size={24}/></button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-[0.25em] border-b">
                     <th className="px-10 py-8">Identificación Comercial</th>
                     <th className="px-6 py-8">Clasificación</th>
                     <th className="px-6 py-8 text-center">Tipo Activo</th>
                     <th className="px-6 py-8 text-center">Vínculo Stock</th>
                     <th className="px-6 py-8 text-right">Precio Público</th>
                     <th className="px-10 py-8 text-right no-print">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                     <tr key={item.id} className="hover:bg-indigo-50/10 transition-all group">
                        <td className="px-10 py-8">
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{item.name}</p>
                           <p className="text-[10px] font-mono font-bold text-slate-400 mt-2 uppercase tracking-widest">SKU: {item.code}</p>
                        </td>
                        <td className="px-6 py-8">
                           <span className="text-[9px] font-black uppercase text-slate-500 px-4 py-1.5 bg-slate-100 rounded-xl border border-slate-200">{item.category}</span>
                        </td>
                        <td className="px-6 py-8 text-center">
                           <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl border text-[9px] font-black uppercase ${item.type === PriceType.SERVICE ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                              {item.type === PriceType.SERVICE ? <Activity size={12}/> : <Package size={12}/>}
                              {item.type === PriceType.SERVICE ? 'Servicio' : 'Producto'}
                           </div>
                        </td>
                        <td className="px-6 py-8 text-center">
                           {item.linkedInventoryId ? (
                              <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase">
                                 <CheckCircle2 size={14} className="animate-in zoom-in" /> Conectado a Almacén
                              </div>
                           ) : item.linkedSupplies && item.linkedSupplies.length > 0 ? (
                              <div className="inline-flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase">
                                 <Layers size={14} /> Kit ({item.linkedSupplies.length})
                              </div>
                           ) : item.type === PriceType.PRODUCT ? (
                              <div className="text-[9px] font-black text-rose-400 uppercase italic">Desvinculado</div>
                           ) : (
                              <span className="text-[9px] text-slate-300 font-black uppercase opacity-30">---</span>
                           )}
                        </td>
                        <td className="px-6 py-8 text-right">
                           <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">${item.price.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">IVA {item.taxPercent}% INCL.</p>
                        </td>
                        <td className="px-10 py-8 text-right no-print">
                           <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setCatalogItemToEdit(item); setShowNewCatalogItemModal(true); }} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-xl transition-all"><Edit2 size={16}/></button>
                              <button onClick={() => handleDelete(item.id)} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 hover:shadow-xl transition-all"><Trash2 size={16}/></button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {showNewCatalogItemModal && <NewCatalogItemModal />}
    </div>
  );
};

export default PriceCatalog;
