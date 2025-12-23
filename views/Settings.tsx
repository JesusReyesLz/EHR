
import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Database, 
  Monitor,
  PenTool,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  Building2,
  Phone,
  GraduationCap
} from 'lucide-react';

const SettingsView: React.FC = () => {
  const [profile, setProfile] = useState({
    name: 'ALEJANDRO MÉNDEZ',
    cedula: '12345678',
    cedulaEspecialidad: '99887766',
    institucion: 'Universidad Nacional Autónoma de México',
    specialty: 'Endocrinología',
    email: 'dr.mendez@medexpediente.mx',
    hospital: 'Hospital General San Rafael',
    direccionConsultorio: 'Av. Insurgentes Sur 123, Col. Juárez, CP 06600, CDMX',
    telefono: '55 1234 5678'
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Configuración de Emisor</h1>
          <p className="text-slate-500 text-sm font-medium">Datos obligatorios para Recetario y Expediente conforme a COFEPRIS</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center px-8 py-3 rounded-2xl font-black text-sm shadow-xl transition-all ${
            saveStatus === 'saving' ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-slate-900 text-white'
          }`}
        >
          {saveStatus === 'saving' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saveStatus === 'saving' ? 'Sincronizando...' : 'Guardar Datos Legales'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Identidad Médica', icon: <User className="w-4 h-4" /> },
            { id: 'clinic', label: 'Consultorio', icon: <Building2 className="w-4 h-4" /> },
            { id: 'security', label: 'e.firma / SAT', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'display', label: 'Interfaz', icon: <Monitor className="w-4 h-4" /> },
          ].map(item => (
            <button
              key={item.id}
              className={`w-full flex items-center px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                item.id === 'profile' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-500 hover:bg-white hover:text-blue-600'
              }`}
            >
              <span className="mr-4">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nombre Completo (como aparece en título)</label>
                <input type="text" name="name" value={profile.name} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </div>
              <div className="col-span-full">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center"><GraduationCap className="w-3.5 h-3.5 mr-2" /> Institución que expidió el título</label>
                <input type="text" name="institucion" value={profile.institucion} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cédula Profesional (General)</label>
                <input type="text" name="cedula" value={profile.cedula} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cédula Especialidad</label>
                <input type="text" name="cedulaEspecialidad" value={profile.cedulaEspecialidad} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-10">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center text-blue-600">
               <Building2 className="w-5 h-5 mr-3" /> Datos del Establecimiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Domicilio del Consultorio / Clínica</label>
                <input type="text" name="direccionConsultorio" value={profile.direccionConsultorio} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center"><Phone className="w-3.5 h-3.5 mr-2" /> Teléfono de contacto</label>
                <input type="text" name="telefono" value={profile.telefono} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden group">
            <Key className="absolute -right-8 -bottom-8 w-48 h-48 text-white opacity-5 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xl font-black text-white flex items-center uppercase tracking-tight">
                <ShieldCheck className="w-6 h-6 mr-3 text-emerald-400" /> Firma Electrónica SAT (e.firma)
              </h3>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400">
                <PenTool className="w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm font-bold text-white uppercase tracking-tight">Estatus de Sello Digital</p>
                <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mt-1">Válido para recetas controladas</p>
              </div>
              <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Renovar e.firma</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
