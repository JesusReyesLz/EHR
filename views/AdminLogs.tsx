
import React, { useState, useEffect } from 'react';
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
  Printer
} from 'lucide-react';
import { BITACORAS, PROTOCOLOS } from '../constants';

const AdminLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bitacoras' | 'protocolos'>('bitacoras');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Estado persistente para las entradas de las bitácoras
  const [logEntries, setLogEntries] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem('med_admin_logs_v1');
    return saved ? JSON.parse(saved) : {
      refrig: [
        { date: '29 Oct 08:00 AM', min: '3.2', max: '5.8', current: '4.5', user: 'Enf. Marina Solis' },
        { date: '28 Oct 08:00 PM', min: '2.8', max: '6.1', current: '5.2', user: 'Enf. Ricardo Luna' }
      ],
      cloro: [
        { date: '29 Oct 07:30 AM', cloro: '1.2', ph: '7.4', user: 'Lic. Martha Ruiz' },
        { date: '28 Oct 07:30 AM', cloro: '1.1', ph: '7.5', user: 'Lic. Martha Ruiz' }
      ],
      rpbi: [
        { date: '25 Oct 2023', type: 'Punzocortantes', weight: '2.5', externalDate: '26 Oct 2023', user: 'Dr. Alejandro M.' }
      ],
      limpieza: [
        { date: '29 Oct 06:00 AM', area: 'Consultorio 1', type: 'Exhaustiva', user: 'Sr. Pedro Díaz' }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('med_admin_logs_v1', JSON.stringify(logEntries));
  }, [logEntries]);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Thermometer': return <Thermometer className="w-7 h-7" />;
      case 'Pill': return <Pill className="w-7 h-7" />;
      case 'Sparkles': return <Sparkles className="w-7 h-7" />;
      case 'Trash2': return <Trash2 className="w-7 h-7" />;
      case 'Droplets': return <Droplets className="w-7 h-7" />;
      default: return <FileText className="w-7 h-7" />;
    }
  };

  const handleAddEntry = (bitacoraId: string, entry: any) => {
    // Generación automática de fecha y hora del sistema
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) + ' ' + 
                          now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    const newEntry = {
      date: formattedDate,
      ...entry,
      user: 'Dr. Alejandro Méndez' // Asumimos usuario actual
    };

    setLogEntries(prev => ({
      ...prev,
      [bitacoraId]: [newEntry, ...prev[bitacoraId]]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestión Administrativa y Normativa</h1>
          <p className="text-slate-500 text-sm font-medium">Control sanitario de la unidad médica conforme a COFEPRIS.</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          <button onClick={() => setActiveTab('bitacoras')} className={`px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === 'bitacoras' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Bitácoras Sanitarias</button>
          <button onClick={() => setActiveTab('protocolos')} className={`px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === 'protocolos' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Repositorio Documental</button>
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
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {getIcon(b.icon)}
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Auditado</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">{b.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{logEntries[b.id].length} Registros</p>
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Ver Detalles</span>
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
             <h3 className="text-xl font-black text-slate-900 flex items-center uppercase tracking-tight mb-6">
                <BookOpen className="w-6 h-6 mr-3 text-blue-600" /> Protocolos y Manuales Vigentes
             </h3>
             {PROTOCOLOS.map(p => (
               <div key={p} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-all shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-4"><FileText className="w-5 h-5 text-slate-400" /></div>
                    <div><p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Versión 2024.1</p></div>
                  </div>
                  <button className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Download className="w-5 h-5" /></button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* MODAL DE RED DE FRÍO */}
      <BitacoraModal 
        isOpen={activeModal === 'refrig'} 
        onClose={() => setActiveModal(null)}
        title="Red de Frío (Vacunas)"
        icon={<Thermometer className="text-blue-600" />}
        norms="NOM-036-SSA2-2012"
        columns={['Fecha / Hora', 'Mín (°C)', 'Máx (°C)', 'Actual (°C)', 'Responsable', 'Estatus']}
        entries={logEntries['refrig']}
        renderAddForm={(onClose) => <RefrigeradorForm onAdd={(entry) => { handleAddEntry('refrig', entry); onClose(); }} />}
      />

      {/* MODAL DE CLORACIÓN */}
      <BitacoraModal 
        isOpen={activeModal === 'cloro'} 
        onClose={() => setActiveModal(null)}
        title="Cloración de Agua"
        icon={<Droplets className="text-cyan-600" />}
        norms="NOM-127-SSA1-1994"
        columns={['Fecha / Hora', 'Cloro (ppm)', 'pH', 'Responsable', 'Estatus']}
        entries={logEntries['cloro']}
        renderAddForm={(onClose) => <CloroForm onAdd={(entry) => { handleAddEntry('cloro', entry); onClose(); }} />}
      />

      {/* MODAL DE RPBI */}
      <BitacoraModal 
        isOpen={activeModal === 'rpbi'} 
        onClose={() => setActiveModal(null)}
        title="Manejo de RPBI"
        icon={<Trash2 className="text-rose-600" />}
        norms="NOM-087-SEMARNAT-SSA1-2002"
        columns={['Fecha Gen.', 'Residuo', 'Peso (kg)', 'R. Ext.', 'Responsable', 'Estatus']}
        entries={logEntries['rpbi']}
        renderAddForm={(onClose) => <RPBIForm onAdd={(entry) => { handleAddEntry('rpbi', entry); onClose(); }} />}
      />

      {/* MODAL DE LIMPIEZA */}
      <BitacoraModal 
        isOpen={activeModal === 'limpieza'} 
        onClose={() => setActiveModal(null)}
        title="Limpieza y Sanitización"
        icon={<Sparkles className="text-indigo-600" />}
        norms="Manual de Limpieza Hosp."
        columns={['Fecha / Hora', 'Área', 'Tipo', 'Responsable', 'Sello']}
        entries={logEntries['limpieza']}
        renderAddForm={(onClose) => <LimpiezaForm onAdd={(entry) => { handleAddEntry('limpieza', entry); onClose(); }} />}
      />
    </div>
  );
};

// Componente genérico para modales de bitácora
const BitacoraModal = ({ isOpen, onClose, title, icon, norms, columns, entries, renderAddForm }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
               {icon}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{norms}</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => window.print()} className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-blue-600">
                <Printer size={16} className="mr-2" /> Imprimir Reporte
             </button>
             <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-slate-900">
                <Plus size={16} className="mr-2" /> {showAddForm ? 'Cerrar Registro' : 'Nuevo Registro'}
             </button>
             <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all border border-slate-200">
               <X size={24} className="text-slate-500" />
             </button>
          </div>
        </div>

        {/* CONTENIDO PARA IMPRESIÓN (OCULTO EN WEB) */}
        <div className="hidden print:block p-10 space-y-6">
           <div className="flex justify-between border-b-2 border-slate-900 pb-6">
              <div>
                 <h1 className="text-2xl font-black uppercase">BITÁCORA TÉCNICA SANITARIA</h1>
                 <p className="text-sm font-bold">{title} • {norms}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase">Folio de Control Interno: {(Math.random()*10000).toFixed(0)}</p>
                 <p className="text-sm font-bold">Unidad Médica San Rafael</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                {entries.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-all">
                    {Object.values(row).map((val: any, idx: number) => (
                      <td key={idx} className="px-8 py-4 uppercase text-[10px]">
                        {val}
                      </td>
                    ))}
                    <td className="px-8 py-4 no-print">
                       <div className="flex items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
                          <UserCheck className="w-3.5 h-3.5 mr-2" /> Validado
                       </div>
                    </td>
                    <td className="hidden print:table-cell px-8 py-4">________________</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Formularios específicos
const RefrigeradorForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ min: '3.0', max: '6.0', current: '4.5' });
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Temp Mínima</label>
             <input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-lg shadow-sm" value={data.min} onChange={e => setData({...data, min: e.target.value})} />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Temp Máxima</label>
             <input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-lg shadow-sm" value={data.max} onChange={e => setData({...data, max: e.target.value})} />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-blue-600">Temp Actual</label>
             <input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-xl shadow-lg ring-2 ring-blue-400" value={data.current} onChange={e => setData({...data, current: e.target.value})} />
          </div>
          <div className="flex items-end">
             <button onClick={() => onAdd(data)} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Firmar y Guardar
             </button>
          </div>
       </div>
    </div>
  );
};

const CloroForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ cloro: '1.2', ph: '7.4' });
  return (
    <div className="bg-cyan-50 border border-cyan-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Cloro Residual (ppm)</label>
             <input type="number" step="0.1" className="w-full p-5 rounded-2xl font-black text-xl shadow-sm" value={data.cloro} onChange={e => setData({...data, cloro: e.target.value})} />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Potencial de Hidrógeno (pH)</label>
             <input type="number" step="0.1" className="w-full p-5 rounded-2xl font-black text-xl shadow-sm" value={data.ph} onChange={e => setData({...data, ph: e.target.value})} />
          </div>
          <div className="flex items-end">
             <button onClick={() => onAdd(data)} className="w-full bg-cyan-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Registrar Medición
             </button>
          </div>
       </div>
    </div>
  );
};

const RPBIForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ type: 'Punzocortantes', weight: '1.0', externalDate: 'Pendiente' });
  return (
    <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Tipo de Residuo</label>
             <select className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.type} onChange={e => setData({...data, type: e.target.value})}>
                <option>Punzocortantes</option><option>Sangre y Líquidos</option><option>Patológicos</option>
             </select>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Peso Total (kg)</label>
             <input type="number" step="0.1" className="w-full p-4 rounded-xl font-black text-lg shadow-sm" value={data.weight} onChange={e => setData({...data, weight: e.target.value})} />
          </div>
          <div className="flex items-end">
             <button onClick={() => onAdd(data)} className="w-full bg-rose-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl">Guardar Generación</button>
          </div>
       </div>
    </div>
  );
};

const LimpiezaForm = ({ onAdd }: any) => {
  const [data, setData] = useState({ area: 'Consultorio 1', type: 'Rutinaria' });
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4 no-print">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Área de la Unidad</label>
             <input type="text" className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.area} onChange={e => setData({...data, area: e.target.value})} />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400">Tipo Limpieza</label>
             <select className="w-full p-4 rounded-xl font-black text-xs uppercase shadow-sm" value={data.type} onChange={e => setData({...data, type: e.target.value})}>
                <option>Rutinaria</option><option>Exhaustiva</option>
             </select>
          </div>
          <div className="flex items-end">
             <button onClick={() => onAdd(data)} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl">Firmar Tarea</button>
          </div>
       </div>
    </div>
  );
};

export default AdminLogs;
