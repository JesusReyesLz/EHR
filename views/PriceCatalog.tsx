
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Tag, DollarSign, 
  Printer, Trash2, Edit2, Package, X,
  Link as LinkIcon, Syringe, CalendarOff, Calendar
} from 'lucide-react';
import { PriceItem, PriceType, MedicationStock, MedicationCategory, SupplyType } from '../types';
import { INITIAL_PRICES } from '../constants';

const PriceCatalog: React.FC = () => {
  const [prices, setPrices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  const [inventory, setInventory] = useState<MedicationStock[]>(() => 
    JSON.parse(localStorage.getItem('med_inventory_v6') || '[]')
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'products'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // New Item / Edit States
  const [catalogItemToEdit, setCatalogItemToEdit] = useState<PriceItem | null>(null);
  const [showNewCatalogItemModal, setShowNewCatalogItemModal] = useState(false);

  // Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('med_price_catalog_v1', JSON.stringify(prices));
  }, [prices]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return prices.filter(p => {
      const matchText = p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
      const matchType = activeTab === 'all' ? true : 
                        activeTab === 'services' ? p.type === PriceType.SERVICE : 
                        p.type === PriceType.PRODUCT;
      return matchText && matchType;
    });
  }, [prices, searchTerm, activeTab]);

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este ítem del catálogo?\nEsta acción no se puede deshacer.')) {
      setPrices(prev => prev.filter(p => p.id !== id));
    }
  };

  const openLinkModal = (item: PriceItem) => {
      setLinkTargetId(item.id);
      setShowLinkModal(true);
  };

  const confirmLink = (invId: string) => {
      setPrices(prev => prev.map(p => p.id === linkTargetId ? { ...p, linkedInventoryId: invId } : p));
      setShowLinkModal(false);
      setLinkTargetId(null);
  };

  // --- SUBCOMPONENT: NewCatalogItemModal ---
  const NewCatalogItemModal = () => {
      const [form, setForm] = useState<Partial<PriceItem>>(() => {
          if (catalogItemToEdit) return { ...catalogItemToEdit };
          return { name: '', code: '', price: 0, taxPercent: 16, category: 'General', type: PriceType.SERVICE, consumables: [] };
      });
      const [createInventory, setCreateInventory] = useState(false);
      const [invForm, setInvForm] = useState({ batch: '', expiry: '', stock: 0, noExpiry: false, concentration: '', presentation: '', supplyType: SupplyType.MEDICATION as SupplyType });
      
      const handleSaveNewItem = () => {
          if (!form.name || !form.price) return alert("Nombre y Precio obligatorios");
          
          if (catalogItemToEdit) {
              setPrices(prev => prev.map(p => p.id === catalogItemToEdit.id ? { ...p, ...form } as PriceItem : p));
              setCatalogItemToEdit(null);
              setShowNewCatalogItemModal(false);
              return;
          }

          let linkedInvId = undefined;
          if (createInventory && form.type === PriceType.PRODUCT) {
              if(!invForm.batch && !invForm.noExpiry) return alert("El número de lote es obligatorio.");
              const newMedId = `MED-${Date.now()}`;
              const newMed: MedicationStock = {
                  id: newMedId, name: form.name!.toUpperCase(), genericName: form.name!.toUpperCase(), presentation: invForm.presentation || 'Unidad', concentration: invForm.concentration || '', unit: 'Pza', supplier: 'General', registroCofepris: '', category: MedicationCategory.GENERAL, supplyType: invForm.supplyType, minStock: 5, idealStock: 50,
                  batches: [{ id: `BATCH-${Date.now()}`, batchNumber: invForm.batch.toUpperCase(), expiryDate: invForm.noExpiry ? 'N/A' : invForm.expiry, currentStock: Number(invForm.stock) }]
              };
              setInventory(prev => [newMed, ...prev]);
              localStorage.setItem('med_inventory_v6', JSON.stringify([newMed, ...inventory]));
              linkedInvId = newMedId;
          }
          const newItem: PriceItem = {
              id: `PRICE-${Date.now()}`, code: form.code || `SKU-${Date.now().toString().slice(-4)}`, name: form.name!, price: Number(form.price), taxPercent: Number(form.taxPercent), category: form.category || 'General', type: form.type || PriceType.SERVICE, consumables: form.consumables, linkedInventoryId: linkedInvId
          };
          setPrices(prev => [newItem, ...prev]);
          setShowNewCatalogItemModal(false);
      };

      return (
        <div className="fixed inset-0 z-[260] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 space-y-6 max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black uppercase text-slate-900">{catalogItemToEdit ? 'Editar Concepto' : 'Nuevo Concepto en Catálogo'}</h3>
                    <button onClick={() => { setCatalogItemToEdit(null); setShowNewCatalogItemModal(false); }}><X className="text-slate-400 hover:text-rose-500" /></button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Nombre del Concepto</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: CURACIÓN MAYOR" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Precio Público</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Impuesto IVA (%)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: parseFloat(e.target.value)})} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Código / SKU</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-xs" value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Tipo</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-xs outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}><option value={PriceType.SERVICE}>Servicio</option><option value={PriceType.PRODUCT}>Producto</option></select></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Categoría</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-xs outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>General</option><option>Consulta Externa</option><option>Urgencias</option><option>Farmacia</option><option>Procedimientos</option></select></div>
                </div>
                
                {form.type === PriceType.PRODUCT && !catalogItemToEdit && (
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-2"><Package size={14}/> Alta de Insumo en Inventario</label>
                            <button onClick={() => setCreateInventory(!createInventory)} className={`w-10 h-6 rounded-full transition-all relative ${createInventory ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${createInventory ? 'left-5' : 'left-1'}`}></div>
                            </button>
                        </div>
                        {createInventory && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[8px] font-black uppercase text-emerald-600">Lote Inicial</label><input className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs" value={invForm.batch} onChange={e => setInvForm({...invForm, batch: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black uppercase text-emerald-600">Cantidad</label><input type="number" className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs" value={invForm.stock} onChange={e => setInvForm({...invForm, stock: parseInt(e.target.value)})} /></div>
                                <div className="col-span-2 flex items-center gap-2">
                                    {!invForm.noExpiry ? <input type="date" className="flex-1 p-2 bg-white border border-emerald-200 rounded-lg text-xs" value={invForm.expiry} onChange={e => setInvForm({...invForm, expiry: e.target.value})} /> : <div className="flex-1 p-2 bg-emerald-100/50 rounded-lg text-center text-xs font-bold text-emerald-600">NO CADUCA</div>}
                                    <button onClick={() => setInvForm({...invForm, noExpiry: !invForm.noExpiry})} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">{invForm.noExpiry ? <CalendarOff size={16}/> : <Calendar size={16}/>}</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button onClick={() => { setCatalogItemToEdit(null); setShowNewCatalogItemModal(false); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                    <button onClick={handleSaveNewItem} className="flex-[2] py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl hover:bg-indigo-700">Guardar</button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase">Catálogo Maestro</h1>
          <p className="text-slate-500 text-sm font-bold uppercase mt-1">Lista de Precios y Servicios</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
              <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
              <button onClick={() => setActiveTab('services')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Servicios</button>
              <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Productos</button>
           </div>
           <button onClick={() => { setCatalogItemToEdit(null); setShowNewCatalogItemModal(true); }} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Plus size={16} /> Nuevo Ítem
           </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px]">
         <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <Search className="text-slate-400" />
            <input 
              className="flex-1 bg-transparent text-sm font-bold outline-none uppercase placeholder-slate-300" 
              placeholder="Buscar servicio, medicamento o insumo..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                     <th className="px-8 py-4">Código</th>
                     <th className="px-4 py-4">Descripción</th>
                     <th className="px-4 py-4">Categoría</th>
                     <th className="px-4 py-4 text-center">Tipo</th>
                     <th className="px-4 py-4 text-right">Precio</th>
                     <th className="px-8 py-4 text-right no-print">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredItems.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                        <td className="px-8 py-4 font-mono text-xs font-bold text-slate-500">{item.code}</td>
                        <td className="px-4 py-4">
                           <p className="text-sm font-black text-slate-900 uppercase">{item.name}</p>
                           {item.linkedInventoryId && (
                              <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                                 <Package size={10} /> Stock Vinculado
                              </p>
                           )}
                           {item.type === PriceType.PRODUCT && !item.linkedInventoryId && (
                              <button onClick={() => openLinkModal(item)} className="text-[9px] text-amber-500 font-bold flex items-center gap-1 mt-1 hover:underline"><LinkIcon size={10}/> Vincular Stock</button>
                           )}
                        </td>
                        <td className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase">{item.category}</td>
                        <td className="px-4 py-4 text-center">
                           <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${item.type === PriceType.SERVICE ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {item.type === PriceType.SERVICE ? 'Servicio' : 'Producto'}
                           </span>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">${item.price.toFixed(2)}</td>
                        <td className="px-8 py-4 text-right no-print">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { setCatalogItemToEdit(item); setShowNewCatalogItemModal(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-all"><Edit2 size={14}/></button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {showNewCatalogItemModal && <NewCatalogItemModal />}

      {showLinkModal && (
          <div className="fixed inset-0 z-[210] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-lg font-black uppercase text-slate-900 border-b border-slate-100 pb-4">Vincular con Inventario</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {inventory.map(inv => (
                          <button key={inv.id} onClick={() => confirmLink(inv.id)} className="w-full text-left p-3 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group">
                              <p className="text-xs font-black text-slate-800 uppercase group-hover:text-blue-700">{inv.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{inv.genericName}</p>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setShowLinkModal(false)} className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase">Cancelar</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default PriceCatalog;
