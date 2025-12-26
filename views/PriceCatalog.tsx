
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Save, Tag, DollarSign, FileText, 
  Printer, Trash2, Edit2, Package, Archive, RefreshCw, X, ChevronDown, Check,
  Landmark, FileBadge
} from 'lucide-react';
import { PriceItem, PriceType, MedicationStock } from '../types';
import { INITIAL_PRICES } from '../constants';

const PriceCatalog: React.FC = () => {
  const [prices, setPrices] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  // Inventario para vinculación
  const [inventory] = useState<MedicationStock[]>(() => 
    JSON.parse(localStorage.getItem('med_inventory_v6') || '[]')
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'products'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // Formulario
  const [form, setForm] = useState<Partial<PriceItem>>({
    id: '', code: '', name: '', type: PriceType.SERVICE, category: 'General', price: 0, taxPercent: 16, linkedInventoryId: ''
  });

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

  const handleEdit = (item: PriceItem) => {
    setForm(item);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Eliminar este ítem del catálogo?')) {
      setPrices(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (!form.name || !form.price) {
      alert("Nombre y Precio son obligatorios");
      return;
    }

    const newItem: PriceItem = {
      id: form.id || `PRICE-${Date.now()}`,
      code: form.code || `SKU-${Date.now().toString().slice(-6)}`,
      name: form.name,
      type: form.type || PriceType.SERVICE,
      category: form.category || 'General',
      price: Number(form.price),
      taxPercent: Number(form.taxPercent),
      linkedInventoryId: form.linkedInventoryId || undefined
    };

    setPrices(prev => {
      const exists = prev.findIndex(p => p.id === newItem.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = newItem;
        return updated;
      }
      return [newItem, ...prev];
    });

    setShowModal(false);
    setForm({ id: '', code: '', name: '', type: PriceType.SERVICE, category: 'General', price: 0, taxPercent: 16, linkedInventoryId: '' });
  };

  // Helper para buscar nombre del producto vinculado
  const getLinkedProductName = (id?: string) => {
    if (!id) return null;
    const prod = inventory.find(i => i.id === id);
    return prod ? `${prod.name} (${prod.genericName})` : 'Producto no encontrado';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase">Catálogo Maestro de Precios</h1>
          <p className="text-slate-500 text-sm font-bold uppercase mt-1">Gestión de Tarifas y Servicios</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
              <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
              <button onClick={() => setActiveTab('services')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Servicios</button>
              <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Productos</button>
           </div>
           <button onClick={() => setShowPrintPreview(true)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2"><Printer size={20}/></button>
           <button onClick={() => { setForm({ id: '', code: '', name: '', type: PriceType.SERVICE, category: 'General', price: 0, taxPercent: 16 }); setShowModal(true); }} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
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
                     <th className="px-4 py-4">Descripción / Concepto</th>
                     <th className="px-4 py-4">Categoría</th>
                     <th className="px-4 py-4 text-center">Tipo</th>
                     <th className="px-4 py-4 text-right">Precio Público</th>
                     <th className="px-4 py-4 text-right">IVA</th>
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
                                 <Package size={10} /> Vinculado a Inventario
                              </p>
                           )}
                        </td>
                        <td className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase">{item.category}</td>
                        <td className="px-4 py-4 text-center">
                           <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${item.type === PriceType.SERVICE ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {item.type === PriceType.SERVICE ? 'Servicio' : 'Producto'}
                           </span>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">
                           ${item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-right text-xs font-bold text-slate-400">
                           {item.taxPercent}%
                        </td>
                        <td className="px-8 py-4 text-right no-print">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(item)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"><Edit2 size={14}/></button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"><Trash2 size={14}/></button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
         <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
               <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-slate-900 uppercase">{form.id ? 'Editar Precio' : 'Nuevo Ítem de Catálogo'}</h3>
                  <button onClick={() => setShowModal(false)}><X size={24} className="text-slate-400 hover:text-rose-500" /></button>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Descripción / Concepto</label>
                     <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:border-indigo-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: CONSULTA GENERAL" />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Código Interno / SKU</label>
                     <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold uppercase" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tipo de Ítem</label>
                     <div className="flex gap-2">
                        <button onClick={() => setForm({...form, type: PriceType.SERVICE})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border transition-all ${form.type === PriceType.SERVICE ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}>Servicio</button>
                        <button onClick={() => setForm({...form, type: PriceType.PRODUCT})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border transition-all ${form.type === PriceType.PRODUCT ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-500'}`}>Producto</button>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Precio Público</label>
                     <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="number" className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Impuesto (%)</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: parseFloat(e.target.value) || 0})} />
                  </div>

                  <div className="col-span-2 space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Categoría</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        <option>General</option>
                        <option>Consulta Externa</option>
                        <option>Urgencias</option>
                        <option>Hospitalización</option>
                        <option>Farmacia</option>
                        <option>Laboratorio</option>
                        <option>Imagenología</option>
                        <option>Material de Curación</option>
                        <option>Paquetes Qx</option>
                     </select>
                  </div>

                  {/* Vinculación con Inventario (Solo si es Producto) */}
                  {form.type === PriceType.PRODUCT && (
                     <div className="col-span-2 space-y-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <label className="text-[9px] font-black uppercase text-emerald-700 ml-2 flex items-center gap-2"><Package size={12}/> Vincular con Stock Físico</label>
                        <select 
                           className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-[10px] font-bold uppercase outline-none" 
                           value={form.linkedInventoryId || ''} 
                           onChange={e => setForm({...form, linkedInventoryId: e.target.value})}
                        >
                           <option value="">-- Sin vinculación --</option>
                           {inventory.map(inv => (
                              <option key={inv.id} value={inv.id}>{inv.name} - {inv.genericName}</option>
                           ))}
                        </select>
                        <p className="text-[8px] text-emerald-600 px-2 italic">Al seleccionar un ítem del inventario, la venta en caja descontará automáticamente las existencias.</p>
                     </div>
                  )}
               </div>

               <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl hover:bg-indigo-700">Guardar Precio</button>
               </div>
            </div>
         </div>
      )}

      {/* PRINT PREVIEW OVERLAY */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col items-center p-10 overflow-y-auto animate-in fade-in no-print">
           <div className="bg-slate-800 p-4 rounded-full shadow-2xl flex gap-6 mb-8 border border-white/10 sticky top-4 z-[210]">
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg"
              >
                <Printer size={18}/> Imprimir Lista
              </button>
              <button 
                onClick={() => setShowPrintPreview(false)} 
                className="flex items-center gap-3 px-8 py-3 bg-slate-700 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg"
              >
                <X size={18}/> Cerrar
              </button>
           </div>

           <div className="bg-white w-full max-w-[215.9mm] min-h-[279.4mm] shadow-2xl p-[15mm] text-slate-900 print:shadow-none print:m-0">
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                 <div className="space-y-3">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Hospital General San Rafael</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Lista Oficial de Precios al Público</p>
                 </div>
                 <div className="text-right">
                    <Landmark size={48} className="ml-auto mb-2 text-slate-900" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Vigencia: {new Date().getFullYear()}</p>
                 </div>
              </div>

              {/* Agrupar por categoría */}
              {['Consulta Externa', 'Urgencias', 'Hospitalización', 'Farmacia', 'Laboratorio', 'Imagenología', 'Material de Curación', 'General'].map(cat => {
                 const catItems = prices.filter(p => p.category === cat);
                 if (catItems.length === 0) return null;
                 
                 return (
                    <div key={cat} className="mb-8 break-inside-avoid">
                       <h3 className="text-sm font-black uppercase bg-slate-100 p-2 border-l-4 border-slate-900 mb-4">{cat}</h3>
                       <table className="w-full border-collapse">
                          <thead>
                             <tr className="border-b-2 border-slate-200">
                                <th className="text-left text-[9px] font-bold uppercase p-2 w-24">Código</th>
                                <th className="text-left text-[9px] font-bold uppercase p-2">Descripción</th>
                                <th className="text-right text-[9px] font-bold uppercase p-2 w-24">Precio</th>
                                <th className="text-right text-[9px] font-bold uppercase p-2 w-16">IVA</th>
                                <th className="text-right text-[9px] font-bold uppercase p-2 w-24">Total</th>
                             </tr>
                          </thead>
                          <tbody>
                             {catItems.map(item => {
                                const total = item.price * (1 + item.taxPercent/100);
                                return (
                                   <tr key={item.id} className="border-b border-slate-100">
                                      <td className="p-2 text-[10px] font-mono">{item.code}</td>
                                      <td className="p-2 text-[10px] font-bold uppercase">{item.name}</td>
                                      <td className="p-2 text-[10px] text-right">${item.price.toFixed(2)}</td>
                                      <td className="p-2 text-[10px] text-right">{item.taxPercent}%</td>
                                      <td className="p-2 text-[10px] font-black text-right">${total.toFixed(2)}</td>
                                   </tr>
                                );
                             })}
                          </tbody>
                       </table>
                    </div>
                 );
              })}

              <div className="pt-12 text-center text-[8px] font-bold uppercase text-slate-400 border-t border-slate-200 mt-auto">
                 Precios sujetos a cambio sin previo aviso • Documento informativo • {new Date().toLocaleDateString()}
              </div>
           </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          .no-print, nav, aside, button, select, input { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-[215.9mm] { max-width: 100% !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .bg-slate-100 { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
          .border-slate-900 { border-color: #000 !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default PriceCatalog;
