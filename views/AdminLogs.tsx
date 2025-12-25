
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Thermometer, 
  ShieldCheck, 
  Plus, 
  Download, 
  BookOpen, 
  Clock, 
  UserCheck,
  AlertCircle,
  FileText,
  Save,
  Trash2,
  Sparkles,
  Pill,
  Droplets,
  X,
  MapPin,
  CheckCircle2,
  Info,
  Scale,
  Calendar,
  Printer,
  FileDown,
  Layout,
  Upload,
  Layers,
  FileUp,
  Flame,
  Search,
  Check,
  ChevronRight,
  Eye,
  FileBadge
} from 'lucide-react';
import { BITACORAS, PROTOCOLOS, FORMATOS_VIGENTES } from '../constants';

const AdminLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bitacoras' | 'protocolos'>('bitacoras');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<'protocol' | 'format' | null>(null);
  
  const [dynamicProtocols, setDynamicProtocols] = useState<string[]>(() => {
    const saved = localStorage.getItem('med_custom_protocols_v1');
    return saved ? JSON.parse(saved) : PROTOCOLOS;
  });

  const [dynamicFormats, setDynamicFormats] = useState<any[]>(() => {
    const saved = localStorage.getItem('med_custom_formats_v1');
    return saved ? JSON.parse(saved) : FORMATOS_VIGENTES;
  });

  const [logEntries, setLogEntries] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem('med_admin_logs_v1');
    return saved ? JSON.parse(saved) : {
      refrig: [
        { id: '1', timestamp: '2023-10-29T08:00:00', displayDate: '29 Oct 08:00 AM', min: '3.2', max: '5.8', current: '4.5', user: 'Enf. Marina Solis' }
      ],
      cloro: [
        { id: '2', timestamp: '2023-10-29T07:30:00', displayDate: '29 Oct 07:30 AM', cloro: '1.2', ph: '7.4', user: 'Lic. Martha Ruiz' }
      ],
      rpbi: [
        { id: '3', timestamp: '2023-10-25T12:00:00', displayDate: '25 Oct 2023', type: 'Punzocortantes', weight: '2.5', externalDate: '26 Oct 2023', user: 'Dr. Alejandro M.' }
      ],
      extintores: [
        { id: '4', timestamp: '2023-10-30T09:00:00', displayDate: '30 Oct 09:00 AM', extId: 'EXT-AD-01', location: 'PASILLO CONSULTORIOS', pressure: 'Correcta', seal: 'Íntegro', expiry: 'DIC 2025' }
      ],
      limpieza: [
        { id: '5', timestamp: '2023-10-29T06:00:00', displayDate: '29 Oct 06:00 AM', area: 'Consultorio 1', type: 'Exhaustiva', user: 'Sr. Pedro Díaz' }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('med_admin_logs_v1', JSON.stringify(logEntries));
    localStorage.setItem('med_custom_protocols_v1', JSON.stringify(dynamicProtocols));
    localStorage.setItem('med_custom_formats_v1', JSON.stringify(dynamicFormats));
  }, [logEntries, dynamicProtocols, dynamicFormats]);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Thermometer': return <Thermometer className="w-7 h-7" />;
      case 'Pill': return <Pill className="w-7 h-7" />;
      case 'Sparkles': return <Sparkles className="w-7 h-7" />;
      case 'Trash2': return <Trash2 className="w-7 h-7" />;
      case 'Droplets': return <Droplets className="w-7 h-7" />;
      case 'Flame': return <Flame className="w-7 h-7" />;
      default: return <FileText className="w-7 h-7" />;
    }
  };

  const handleAddEntry = (bitacoraId: string, entry: any) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) + ' ' + 
                          now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    const newEntry = {
      id: Date.now().toString(),
      timestamp: now.toISOString(),
      displayDate: formattedDate,
      ...entry,
      user: 'Dr. Alejandro Méndez'
    };

    setLogEntries(prev => ({
      ...prev,
      [bitacoraId]: [newEntry, ...(prev[bitacoraId] || [])]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestión de Control y Normatividad</h1>
          <p className="text-slate-500 text-sm font-medium">Cumplimiento sanitario integral y repositorio documental oficial.</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          <button onClick={() => setActiveTab('bitacoras')} className={`px-6 py-3 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === 'bitacoras' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Bitácoras Sanitarias</button>
          <button onClick={() => setActiveTab('protocolos')} className={`px-6 py-3 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === 'protocolos' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Repositorio Documental</button>
        </div>
      </div>

      {activeTab === 'bitacoras' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {BITACORAS.map((b) => (
            <div 
              key={b.id} 
              onClick={() => setActiveModal(b.id)}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${b.id === 'extintores' ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                  {getIcon(b.icon)}
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Auditado</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">{b.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(logEntries[b.id] || []).length} Registros</p>
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Abrir Bitácora</span>
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          <div className="space-y-6">
             <div className="flex items-center justify-between border-b-4 border-blue-600 pb-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manuales y Protocolos</h3>
                </div>
                <button onClick={() => setShowUploadModal('protocol')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"><Upload size={14} /> Subir Manual</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dynamicProtocols.map(p => (
                  <div key={p} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all group">
                     <div className="flex items-center"><div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-blue-50 transition-colors"><FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-600" /></div><div><p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p}</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">PDF • Oficial</p></div></div>
                     <div className="flex gap-2"><button className="p-4 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"><Download size={18} /></button></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* MODALES DE BITÁCORAS */}
      <BitacoraModal 
        isOpen={activeModal === 'refrig'} 
        onClose={() => setActiveModal(null)}
        title="Red de Frío (Vacunas)"
        icon={<Thermometer className="text-blue-600" />}
        norms="NOM-036-SSA2-2012"
        columns={['Fecha / Hora', 'Mín (°C)', 'Máx (°C)', 'Actual (°C)', 'Responsable']}
        fields={['displayDate', 'min', 'max', 'current', 'user']}
        entries={logEntries['refrig']}
        renderAddForm={(onClose: any) => <RefrigeradorForm onAdd={(entry: any) => { handleAddEntry('refrig', entry); onClose(); }} />}
      />

      <BitacoraModal 
        isOpen={activeModal === 'cloro'} 
        onClose={() => setActiveModal(null)}
        title="Cloración de Agua"
        icon={<Droplets className="text-cyan-600" />}
        norms="NOM-127-SSA1-1994"
        columns={['Fecha / Hora', 'Cloro (ppm)', 'pH', 'Responsable']}
        fields={['displayDate', 'cloro', 'ph', 'user']}
        entries={logEntries['cloro']}
        renderAddForm={(onClose: any) => <CloroForm onAdd={(entry: any) => { handleAddEntry('cloro', entry); onClose(); }} />}
      />

      <BitacoraModal 
        isOpen={activeModal === 'rpbi'} 
        onClose={() => setActiveModal(null)}
        title="Manejo de RPBI"
        icon={<Trash2 className="text-rose-600" />}
        norms="NOM-087-SEMARNAT-SSA1-2002"
        columns={['Fecha Gen.', 'Residuo', 'Peso (kg)', 'R. Ext.', 'Responsable']}
        fields={['displayDate', 'type', 'weight', 'externalDate', 'user']}
        entries={logEntries['rpbi']}
        renderAddForm={(onClose: any) => <RPBIForm onAdd={(entry: any) => { handleAddEntry('rpbi', entry); onClose(); }} />}
      />

      <BitacoraModal 
        isOpen={activeModal === 'extintores'} 
        onClose={() => setActiveModal(null)}
        title="Revisión de Extintores"
        icon={<Flame className="text-rose-600" />}
        norms="NOM-002-STPS-2010"
        columns={['Fecha / Hora', 'ID Equipo', 'Ubicación', 'Presión', 'Sello/Seguro', 'Vigencia']}
        fields={['displayDate', 'extId', 'location', 'pressure', 'seal', 'expiry']}
        entries={logEntries['extintores']}
        renderAddForm={(onClose: any) => <ExtintoresForm onAdd={(entry: any) => { handleAddEntry('extintores', entry); onClose(); }} />}
      />

      <BitacoraModal 
        isOpen={activeModal === 'limpieza'} 
        onClose={() => setActiveModal(null)}
        title="Limpieza y Sanitización"
        icon={<Sparkles className="text-indigo-600" />}
        norms="Manual de Limpieza Hosp."
        columns={['Fecha / Hora', 'Área', 'Tipo', 'Responsable']}
        fields={['displayDate', 'area', 'type', 'user']}
        entries={logEntries['limpieza']}
        renderAddForm={(onClose: any) => <LimpiezaForm onAdd={(entry: any) => { handleAddEntry('limpieza', entry); onClose(); }} />}
      />
    </div>
  );
};

// Componente genérico para modales de bitácora
const BitacoraModal = ({ isOpen, onClose, title, icon, norms, columns, fields, entries, renderAddForm }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // Estado para rango de fechas
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const filteredEntries = useMemo(() => {
    return (entries || []).filter((e: any) => {
      const entryDate = new Date(e.timestamp).getTime();
      const start = new Date(dateRange.start + 'T00:00:00').getTime();
      const end = new Date(dateRange.end + 'T23:59:59').getTime();
      return entryDate >= start && entryDate <= end;
    });
  }, [entries, dateRange]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-10 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">{icon}</div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{norms}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-2xl px-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Inicio:</span>
                    <input type="date" className="text-[10px] font-black outline-none bg-transparent" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                  </div>
                  <div className="w-px h-4 bg-slate-200 mx-2"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Fin:</span>
                    <input type="date" className="text-[10px] font-black outline-none bg-transparent" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                  </div>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setShowPrintPreview(true)} className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-blue-600"><Eye size={16} className="mr-2" /> Previsualizar</button>
                  <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-slate-900"><Plus size={16} className="mr-2" /> {showAddForm ? 'Cerrar' : 'Nuevo'}</button>
                  <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all border border-slate-200"><X size={24} className="text-slate-500" /></button>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 bg-white">
            {showAddForm && renderAddForm(() => setShowAddForm(false))}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    {columns.map((col: string) => <th key={col} className="px-8 py-5">{col}</th>)}
                    <th className="px-8 py-5 text-right no-print">Sello</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                  {filteredEntries.map((row: any, i: number) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-all animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 30}ms` }}>
                      {fields.map((field: string) => <td key={field} className="px-8 py-4 uppercase text-[10px]">{row[field]}</td>)}
                      <td className="px-8 py-4 text-right no-print"><div className="inline-flex items-center text-emerald-600 text-[8px] font-black uppercase bg-emerald-50 px-3 py-1 rounded-lg"><Check size={12} className="mr-1" /> Validado</div></td>
                    </tr>
                  ))}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 1} className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Sin registros para el rango seleccionado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showPrintPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center p-4 lg:p-10 no-print overflow-y-auto animate-in fade-in">
           {/* Barra de Herramientas Flotante Centrada */}
           <div className="bg-slate-800 p-4 rounded-full shadow-2xl flex gap-6 mb-8 border border-white/10 sticky top-4 z-[210]">
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95"
              >
                <Printer size={18}/> Imprimir Reporte
              </button>
              <button 
                onClick={() => setShowPrintPreview(false)} 
                className="flex items-center gap-3 px-8 py-3 bg-slate-700 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95"
              >
                <X size={18}/> Cerrar Vista
              </button>
           </div>

           {/* Documento Estilo Hoja Real */}
           <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-sm flex flex-col text-slate-900">
              <div className="p-[20mm] flex-1 flex flex-col space-y-12">
                 <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10">
                    <div className="space-y-3">
                       <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Hospital General San Rafael</h1>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unidad de Gestión y Normatividad Sanitaria</p>
                       <p className="text-[10px] text-slate-400 font-medium">Folio de Control Interno: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    </div>
                    <div className="text-right space-y-1">
                       <FileBadge size={60} className="ml-auto mb-4 text-slate-900" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Página 1 de 1</p>
                    </div>
                 </div>

                 <div className="flex justify-between items-end">
                    <div className="space-y-2">
                       <h2 className="text-2xl font-black uppercase tracking-tight text-blue-700">{title}</h2>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{norms}</p>
                    </div>
                    <div className="text-right p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Periodo del Reporte</p>
                       <p className="text-sm font-black uppercase text-slate-900">{dateRange.start} <span className="text-slate-300 mx-2">AL</span> {dateRange.end}</p>
                    </div>
                 </div>

                 <div className="flex-1 overflow-visible">
                    <table className="w-full border-collapse border-2 border-slate-900">
                       <thead>
                          <tr className="bg-slate-100 border-2 border-slate-900">
                             {columns.map((col: string) => <th key={col} className="p-4 text-[10px] font-black uppercase text-slate-900 border-2 border-slate-900 text-left">{col}</th>)}
                          </tr>
                       </thead>
                       <tbody className="text-slate-900">
                          {filteredEntries.map((row: any) => (
                             <tr key={row.id} className="border-2 border-slate-900">
                                {fields.map((field: string) => (
                                  <td key={field} className="p-4 text-[11px] font-bold uppercase border-2 border-slate-900 text-slate-900">
                                    {row[field]}
                                  </td>
                                ))}
                             </tr>
                          ))}
                          {filteredEntries.length === 0 && (
                            <tr>
                              <td colSpan={columns.length} className="p-20 text-center text-slate-400 font-black uppercase italic text-xs">Sin registros que reportar en el periodo solicitado</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 <div className="pt-24 border-t-2 border-slate-100 grid grid-cols-2 gap-24">
                    <div className="text-center space-y-16">
                       <div className="w-full border-b-2 border-slate-900"></div>
                       <div>
                          <p className="text-xs font-black uppercase tracking-tight text-slate-900">Dr. Alejandro Méndez</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Responsable Sanitario de la Unidad</p>
                          <p className="text-[8px] text-slate-400 mt-1 uppercase">Cédula Prof: 12345678</p>
                       </div>
                    </div>
                    <div className="text-center space-y-16">
                       <div className="w-full border-b-2 border-slate-900"></div>
                       <div>
                          <p className="text-xs font-black uppercase tracking-tight text-slate-900">Sello del Establecimiento</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Validación de Cumplimiento Legal</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Estilos para impresión real */}
      <style>{`
        @media print {
          .no-print, nav, aside, header, button, .modal-backdrop, .sidebar, [role="complementary"] { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; color: black !important; }
          #root { width: 100% !important; }
          .fixed { position: static !important; width: 100% !important; }
          .max-w-[210mm] { 
            max-width: 100% !important; 
            width: 100% !important; 
            box-shadow: none !important; 
            margin: 0 !important;
            border: none !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: black !important; }
          @page { margin: 15mm; size: letter portrait; }
        }
      `}</style>
    </>
  );
};

const RefrigeradorForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ min: '3.0', max: '6.0', current: '4.5' });
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Temp Mínima</label><input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-lg shadow-sm" value={data.min} onChange={e => setData({...data, min: e.target.value})} /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Temp Máxima</label><input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-lg shadow-sm" value={data.max} onChange={e => setData({...data, max: e.target.value})} /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-blue-600">Temp Actual</label><input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-xl shadow-lg ring-2 ring-blue-400" value={data.current} onChange={e => setData({...data, current: e.target.value})} /></div>
          <div className="flex items-end"><button onClick={() => onAdd(data)} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2"><ShieldCheck size={16} /> Firmar</button></div>
       </div>
    </div>
  );
};

const CloroForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ cloro: '1.2', ph: '7.4' });
  return (
    <div className="bg-cyan-50 border border-cyan-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Cloro Residual (ppm)</label><input type="number" step="0.1" className="w-full p-5 rounded-2xl font-black text-xl shadow-sm" value={data.cloro} onChange={e => setData({...data, cloro: e.target.value})} /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Potencial de Hidrógeno (pH)</label><input type="number" step="0.1" className="w-full p-5 rounded-2xl font-black text-xl shadow-sm" value={data.ph} onChange={e => setData({...data, ph: e.target.value})} /></div>
          <div className="flex items-end"><button onClick={() => onAdd(data)} className="w-full bg-cyan-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Registrar</button></div>
       </div>
    </div>
  );
};

const RPBIForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ type: 'Punzocortantes', weight: '1.0', externalDate: 'Pendiente' });
  return (
    <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Tipo de Residuo</label><select className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.type} onChange={e => setData({...data, type: e.target.value})}><option>Punzocortantes</option><option>Sangre y Líquidos</option><option>Patológicos</option></select></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Peso Total (kg)</label><input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-lg shadow-sm" value={data.weight} onChange={e => setData({...data, weight: e.target.value})} /></div>
          <div className="flex items-end"><button onClick={() => onAdd(data)} className="w-full bg-rose-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl">Guardar</button></div>
       </div>
    </div>
  );
};

const ExtintoresForm = ({ onAdd }: any) => {
  const [data, setData] = useState({
    extId: '',
    location: '',
    pressure: 'Correcta',
    seal: 'Íntegro',
    expiry: ''
  });

  const handleSubmit = () => {
    if (!data.extId || !data.location) return alert("Complete los campos de ID y Ubicación.");
    onAdd(data);
  };

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">ID Extintor</label><input className="w-full p-4 rounded-xl font-black text-sm uppercase shadow-sm outline-none focus:ring-2 focus:ring-rose-500" placeholder="Ej: EXT-01" value={data.extId} onChange={e => setData({...data, extId: e.target.value})} /></div>
          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Ubicación</label><input className="w-full p-4 rounded-xl font-black text-sm uppercase shadow-sm outline-none focus:ring-2 focus:ring-rose-500" placeholder="Ej: RECEPCIÓN" value={data.location} onChange={e => setData({...data, location: e.target.value})} /></div>
          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Manómetro (Presión)</label><select className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.pressure} onChange={e => setData({...data, pressure: e.target.value})}><option>Correcta</option><option>Baja</option><option>Sobrepresión</option></select></div>
          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Sello y Seguro</label><select className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.seal} onChange={e => setData({...data, seal: e.target.value})}><option>Íntegro</option><option>Vencido/Roto</option></select></div>
          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Próxima Recarga (Mes/Año)</label><input className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" placeholder="DIC 2025" value={data.expiry} onChange={e => setData({...data, expiry: e.target.value})} /></div>
       </div>
       <div className="flex justify-end"><button onClick={handleSubmit} className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all flex items-center gap-2"><Flame size={16} /> Certificar Revisión</button></div>
    </div>
  );
};

const LimpiezaForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ area: 'Consultorio 1', type: 'Rutinaria' });
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Área de la Unidad</label><input type="text" className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.area} onChange={e => setData({...data, area: e.target.value})} /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Tipo Limpieza</label><select className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.type} onChange={e => setData({...data, type: e.target.value})}><option>Rutinaria</option><option>Exhaustiva</option></select></div>
          <div className="flex items-end"><button onClick={() => onAdd(data)} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl">Firmar</button></div>
       </div>
    </div>
  );
};

export default AdminLogs;
