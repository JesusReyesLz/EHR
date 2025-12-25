
import React, { useState, useRef } from 'react';
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
  GraduationCap,
  Upload,
  FileText,
  X,
  Eye,
  Camera,
  // Added Repeat and Info imports to fix "Cannot find name" errors
  Repeat,
  Info
} from 'lucide-react';
import { DoctorInfo } from '../types';

interface SettingsProps {
  doctorInfo: DoctorInfo;
  onUpdateDoctor: (info: DoctorInfo) => void;
}

const SettingsView: React.FC<SettingsProps> = ({ doctorInfo, onUpdateDoctor }) => {
  const [profile, setProfile] = useState<DoctorInfo>(doctorInfo);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'docs' | 'security'>('profile');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'title' | 'cedula' | null>(null);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      onUpdateDoctor(profile);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (uploadType === 'title') setProfile({...profile, titleUrl: url});
      if (uploadType === 'cedula') setProfile({...profile, cedulaUrl: url});
      setUploadType(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Configuración de Identidad</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Gestione sus credenciales legales para firmas, recetas y notas médicas.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all ${
            saveStatus === 'saving' ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-slate-900 text-white'
          }`}
        >
          {saveStatus === 'saving' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
          ) : (
            <Save className="w-4 h-4 mr-3" />
          )}
          {saveStatus === 'saving' ? 'Sincronizando...' : 'Guardar Datos Legales'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-3">
          {[
            { id: 'profile', label: 'Identidad Médica', icon: <User className="w-4 h-4" /> },
            { id: 'clinic', label: 'Establecimiento', icon: <Building2 className="w-4 h-4" /> },
            { id: 'docs', label: 'Documentación Escaneada', icon: <FileText className="w-4 h-4" /> },
            { id: 'security', label: 'Seguridad y e.firma', icon: <ShieldCheck className="w-4 h-4" /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'text-slate-500 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-100'
              }`}
            >
              <span className={`mr-4 ${activeTab === item.id ? 'text-blue-400' : ''}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-12 animate-in slide-in-from-right-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center">
                 <GraduationCap className="w-5 h-5 mr-3" /> Credenciales Académicas y Legales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="col-span-full space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo (como aparece en su Cédula)</label>
                  <input type="text" name="name" value={profile.name} onChange={handleInputChange} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-black text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 uppercase" />
                </div>
                <div className="col-span-full space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center">Institución Egresada</label>
                  <input type="text" name="institution" value={profile.institution} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-700 uppercase" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Cédula Profesional Federal</label>
                  <input type="text" name="cedula" value={profile.cedula} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-mono font-black text-blue-600" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Especialidad (si aplica)</label>
                  <input type="text" name="specialty" value={profile.specialty} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-700 uppercase" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinic' && (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-12 animate-in slide-in-from-right-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center">
                 <Building2 className="w-5 h-5 mr-3" /> Datos del Establecimiento Médico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="col-span-full space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre de la Clínica / Hospital</label>
                  <input type="text" name="hospital" value={profile.hospital} onChange={handleInputChange} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-black text-slate-800 uppercase" />
                </div>
                <div className="col-span-full space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Dirección Fiscal / Operativa (Aparecerá en Recetas)</label>
                  <input type="text" name="address" value={profile.address} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium uppercase" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center"><Phone className="w-3.5 h-3.5 mr-2" /> Teléfono de Urgencias / Citas</label>
                  <input type="text" name="phone" value={profile.phone} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-black text-slate-700" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center"><Bell className="w-3.5 h-3.5 mr-2" /> Email Profesional</label>
                  <input type="email" name="email" value={profile.email} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-700" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-12 animate-in slide-in-from-right-4">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center">
                 <FileText className="w-5 h-5 mr-3" /> Respaldo de Documentación Oficial
               </h3>

               <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Título Profesional Escaneado</p>
                     <div 
                        onClick={() => { setUploadType('title'); fileInputRef.current?.click(); }}
                        className={`aspect-[4/3] border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${profile.titleUrl ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-blue-300'}`}
                     >
                        {profile.titleUrl ? (
                           <div className="relative w-full h-full group">
                              <img src={profile.titleUrl} alt="Titulo" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                 <Repeat size={32} className="text-white" />
                              </div>
                           </div>
                        ) : (
                           <div className="text-center space-y-3">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm"><Camera className="text-slate-300" /></div>
                              <p className="text-[10px) font-black text-slate-400 uppercase">Click para cargar Título</p>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Cédula Profesional Escaneada</p>
                     <div 
                        onClick={() => { setUploadType('cedula'); fileInputRef.current?.click(); }}
                        className={`aspect-[4/3] border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${profile.cedulaUrl ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-emerald-300'}`}
                     >
                        {profile.cedulaUrl ? (
                           <div className="relative w-full h-full group">
                              <img src={profile.cedulaUrl} alt="Cedula" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                 <Repeat size={32} className="text-white" />
                              </div>
                           </div>
                        ) : (
                           <div className="text-center space-y-3">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm"><Camera className="text-slate-300" /></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">Click para cargar Cédula</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
               
               <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center gap-6">
                  <Info className="text-blue-600 flex-shrink-0" />
                  <p className="text-[10px] text-blue-900 font-bold uppercase tracking-tight leading-relaxed">
                    "Los documentos escaneados se utilizan únicamente para validación en interconsultas y procesos de auditoría sanitaria. Su información está cifrada."
                  </p>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl space-y-10 relative overflow-hidden group animate-in slide-in-from-right-4">
              <Key className="absolute -right-8 -bottom-8 w-48 h-48 text-white opacity-5 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-2xl font-black text-white flex items-center uppercase tracking-tight">
                  <ShieldCheck className="w-7 h-7 mr-4 text-emerald-400" /> Firma Electrónica (e.firma)
                </h3>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-400 shadow-inner">
                  <PenTool className="w-10 h-10" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <p className="text-lg font-black text-white uppercase tracking-tight">Sello Digital Vigente</p>
                  <p className="text-[11px] text-emerald-400 uppercase font-black tracking-[0.2em]">Habilitado para Recetas de Medicamentos Controlados</p>
                </div>
                <button className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">Actualizar Certificado</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
