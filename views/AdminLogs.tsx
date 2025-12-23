
import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { BITACORAS, PROTOCOLOS } from '../constants';

const AdminLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bitacoras' | 'protocolos'>('bitacoras');
  const [activeModal, setActiveModal] = useState<string | null>(null);

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

  const handleOpenModal = (id: string) => {
    setActiveModal(id);
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
              onClick={() => handleOpenModal(b.id)}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {getIcon(b.icon)}
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Cumplimiento OK</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">{b.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Responsable de Turno</p>
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Actualizado hoy</span>
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
                    <div><p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sello Digital: CERT-{(Math.random()*1000).toFixed(0)}</p></div>
                  </div>
                  <button className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Download className="w-5 h-5" /></button>
               </div>
             ))}
          </div>
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <ShieldCheck className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter text-blue-400">Licencias y Dictámenes</h3>
            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-8">Esta unidad médica cuenta con los dictámenes de seguridad estructural y licencias sanitarias vigentes emitidas por la Jurisdicción Sanitaria.</p>
            <div className="space-y-4">
               <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex justify-between items-center">
                  <div><p className="text-[10px] font-black uppercase text-slate-400">Aviso de Responsable Sanitario</p><p className="text-sm font-black tracking-widest mt-1">FOLIO: MX-RS-2023-456</p></div>
                  <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">Ver Licencia</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES DE BITÁCORAS */}
      <BitacoraModal 
        id="refrig" 
        isOpen={activeModal === 'refrig'} 
        onClose={() => setActiveModal(null)}
        title="Red de Frío (Vacunas)"
        icon={<Thermometer className="w-7 h-7 text-blue-600" />}
        norms="NOM-036-SSA2-2012"
        columns={['Fecha / Hora', 'Mín (°C)', 'Máx (°C)', 'Actual (°C)', 'Firma']}
        entries={[
          { date: '29 Oct 08:00 AM', min: '3.2', max: '5.8', current: '4.5', user: 'Enf. Marina Solis' },
          { date: '28 Oct 08:00 PM', min: '2.8', max: '6.1', current: '5.2', user: 'Enf. Ricardo Luna' }
        ]}
        renderAddForm={(onAdd) => <RefrigeradorForm onAdd={onAdd} />}
      />

      <BitacoraModal 
        id="cloro" 
        isOpen={activeModal === 'cloro'} 
        onClose={() => setActiveModal(null)}
        title="Cloración de Agua"
        icon={<Droplets className="w-7 h-7 text-cyan-600" />}
        norms="NOM-127-SSA1-1994"
        columns={['Fecha / Hora', 'Cloro Residual (ppm)', 'pH', 'Responsable', 'Validación']}
        entries={[
          { date: '29 Oct 07:30 AM', cloro: '1.2', ph: '7.4', user: 'Lic. Martha Ruiz' },
          { date: '28 Oct 07:30 AM', cloro: '1.1', ph: '7.5', user: 'Lic. Martha Ruiz' }
        ]}
        renderAddForm={(onAdd) => <CloroForm onAdd={onAdd} />}
      />

      <BitacoraModal 
        id="rpbi" 
        isOpen={activeModal === 'rpbi'} 
        onClose={() => setActiveModal(null)}
        title="Control de RPBI"
        icon={<Trash2 className="w-7 h-7 text-rose-600" />}
        norms="NOM-087-SEMARNAT-SSA1-2002"
        columns={['Fecha Gen.', 'Tipo Residuo', 'Peso (kg)', 'Recolección Ext.', 'Firma']}
        entries={[
          { date: '25 Oct 2023', type: 'Punzocortantes', weight: '2.5', externalDate: '26 Oct 2023', user: 'Dr. Alejandro M.' },
          { date: '22 Oct 2023', type: 'Patológicos', weight: '4.8', externalDate: '26 Oct 2023', user: 'Dr. Alejandro M.' }
        ]}
        renderAddForm={(onAdd) => <RPBIForm onAdd={onAdd} />}
      />

      <BitacoraModal 
        id="limpieza" 
        isOpen={activeModal === 'limpieza'} 
        onClose={() => setActiveModal(null)}
        title="Limpieza y Sanitización"
        icon={<Sparkles className="w-7 h-7 text-indigo-600" />}
        norms="Manual de Limpieza Hospitalaria"
        columns={['Fecha / Hora', 'Área', 'Tipo de Limpieza', 'Responsable', 'Sello']}
        entries={[
          { date: '29 Oct 06:00 AM', area: 'Consultorio 1', type: 'Exhaustiva', user: 'Sr. Pedro Díaz' },
          { date: '29 Oct 14:00 PM', area: 'Sala de Espera', type: 'Rutinaria', user: 'Sra. Rosa Isela' }
        ]}
        renderAddForm={(onAdd) => <LimpiezaForm onAdd={onAdd} />}
      />
    </div>
  );
};

// Componente genérico para modales de bitácora
const BitacoraModal = ({ id, isOpen, onClose, title, icon, norms, columns, entries, renderAddForm }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
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
             <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-slate-900">
                <Plus size={16} className="mr-2" /> {showAddForm ? 'Cancelar' : 'Nuevo Registro'}
             </button>
             <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all border border-slate-200">
               <X size={24} className="text-slate-500" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          {showAddForm && renderAddForm(() => setShowAddForm(false))}

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mt-6 shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  {columns.map((col: string) => <th key={col} className="px-8 py-4">{col}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                {entries.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-8 py-4 text-[10px] font-mono">{row.date}</td>
                    {Object.values(row).slice(1).map((val: any, idx: number) => (
                      <td key={idx} className="px-8 py-4 uppercase text-[10px]">
                        {idx === 0 && id === 'refrig' ? (
                           <span className={parseFloat(val) < 2 || parseFloat(val) > 8 ? 'text-rose-600 font-black' : 'text-blue-600'}>{val}°C</span>
                        ) : val}
                      </td>
                    ))}
                    <td className="px-8 py-4">
                       <div className="flex items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
                          <UserCheck className="w-3.5 h-3.5 mr-2" /> Validado
                       </div>
                    </td>
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

// Formularios específicos para cada bitácora
const RefrigeradorForm = ({ onAdd }: any) => (
  <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Temp Mínima</label>
           <input type="number" step="0.1" className="w-full p-4 rounded-xl border-none font-black text-lg shadow-sm" defaultValue="3.2" />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Temp Máxima</label>
           <input type="number" step="0.1" className="w-full p-4 rounded-xl border-none font-black text-lg shadow-sm" defaultValue="6.1" />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-blue-600">Temp Actual</label>
           <input type="number" step="0.1" className="w-full p-4 rounded-xl border-none font-black text-xl shadow-lg ring-2 ring-blue-400" defaultValue="4.5" />
        </div>
        <div className="flex items-end">
           <button onClick={onAdd} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all">Firmar y Guardar</button>
        </div>
     </div>
     <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl">
        <Info className="text-blue-600 w-5 h-5" />
        <p className="text-[10px] font-bold text-blue-900 uppercase">La temperatura de red de frío debe mantenerse estrictamente entre +2°C y +8°C.</p>
     </div>
  </div>
);

const CloroForm = ({ onAdd }: any) => (
  <div className="bg-cyan-50 border border-cyan-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4">
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Cloro Residual (ppm)</label>
           <input type="number" step="0.1" className="w-full p-5 rounded-2xl border-none font-black text-xl shadow-sm" placeholder="0.2 - 1.5" />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Potencial de Hidrógeno (pH)</label>
           <input type="number" step="0.1" className="w-full p-5 rounded-2xl border-none font-black text-xl shadow-sm" placeholder="6.5 - 8.5" />
        </div>
        <div className="flex items-end">
           <button onClick={onAdd} className="w-full bg-cyan-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all">Registrar Medición</button>
        </div>
     </div>
  </div>
);

const RPBIForm = ({ onAdd }: any) => (
  <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4">
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Tipo de Residuo</label>
           <select className="w-full p-4 rounded-xl border-none font-black text-xs uppercase shadow-sm">
              <option>Punzocortantes</option>
              <option>Sangre y Líquidos</option>
              <option>Patológicos</option>
              <option>No Anatómicos</option>
              <option>Cultivos y Cepas</option>
           </select>
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Peso Total (kg)</label>
           <div className="flex items-center">
              <input type="number" step="0.1" className="w-full p-4 rounded-l-xl border-none font-black text-lg shadow-sm" placeholder="0.0" />
              <div className="bg-slate-200 p-4 rounded-r-xl font-black text-xs">KG</div>
           </div>
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Fecha de Generación</label>
           <input type="date" className="w-full p-4 rounded-xl border-none font-black text-xs shadow-sm" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="flex items-end">
           <button onClick={onAdd} className="w-full bg-rose-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all">Guardar Generación</button>
        </div>
     </div>
  </div>
);

const LimpiezaForm = ({ onAdd }: any) => (
  <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-10 mb-10 space-y-8 animate-in slide-in-from-top-4">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2 col-span-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Área de la Unidad</label>
           <input type="text" className="w-full p-4 rounded-xl border-none font-black text-xs uppercase shadow-sm" placeholder="Ej: Consultorio 1, Quirófano..." />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400">Tipo Limpieza</label>
           <select className="w-full p-4 rounded-xl border-none font-black text-xs uppercase shadow-sm">
              <option>Rutinaria</option>
              <option>Exhaustiva</option>
              <option>Sanitización Especial</option>
           </select>
        </div>
        <div className="flex items-end">
           <button onClick={onAdd} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-900 transition-all">Firmar Tarea</button>
        </div>
     </div>
  </div>
);

export default AdminLogs;
