
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  Repeat,
  Info,
  Globe,
  Image as ImageIcon,
  Plus,
  Trash2,
  MessageSquare,
  Star,
  ThumbsUp,
  ToggleLeft,
  ToggleRight,
  Server,
  Briefcase
} from 'lucide-react';
import { DoctorInfo } from '../types';

interface SettingsProps {
  doctorInfo: DoctorInfo;
  onUpdateDoctor: (info: DoctorInfo) => void;
}

// Mock Reviews Data
const MOCK_REVIEWS = [
    { id: 1, patient: 'Ana G.', date: 'Hace 2 días', rating: 5, text: 'Excelente atención del Dr. Reyes, muy profesional y atento. Resolvió todas mis dudas con paciencia.' },
    { id: 2, patient: 'Carlos M.', date: 'Hace 1 semana', rating: 4, text: 'Buena consulta, el diagnóstico fue acertado. La espera fue un poco larga, pero valió la pena.' },
    { id: 3, patient: 'Luis R.', date: 'Hace 2 semanas', rating: 5, text: 'Instalaciones impecables y el doctor tiene un trato muy humano. Altamente recomendado.' },
    { id: 4, patient: 'María F.', date: 'Hace 1 mes', rating: 5, text: 'Me ayudó mucho con el control de mi diabetes. Explicaciones muy claras.' }
];

const SettingsView: React.FC<SettingsProps> = ({ doctorInfo, onUpdateDoctor }) => {
  const location = useLocation();
  const [profile, setProfile] = useState<DoctorInfo>({
      ...doctorInfo,
      allowReviews: doctorInfo.allowReviews !== undefined ? doctorInfo.allowReviews : true // Default to true if undefined
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'docs' | 'security' | 'public_profile'>('profile');

  // New state for public profile
  const [newService, setNewService] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'title' | 'cedula' | 'cover' | 'avatar' | 'gallery' | null>(null);

  useEffect(() => {
      if (location.state && (location.state as any).initialTab) {
          setActiveTab((location.state as any).initialTab);
      }
  }, [location.state]);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      onUpdateDoctor(profile);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      if (uploadType === 'title') setProfile({...profile, titleUrl: url});
      if (uploadType === 'cedula') setProfile({...profile, cedulaUrl: url});
      if (uploadType === 'cover') setProfile({...profile, coverUrl: url});
      if (uploadType === 'avatar') setProfile({...profile, avatarUrl: url});
      if (uploadType === 'gallery') {
          setProfile({...profile, gallery: [...(profile.gallery || []), url]});
      }
      
      setUploadType(null);
    }
  };

  const addService = () => {
      if (!newService.trim()) return;
      setProfile(prev => ({
          ...prev,
          services: [...(prev.services || []), newService.trim()]
      }));
      setNewService('');
  };

  const removeService = (index: number) => {
      setProfile(prev => ({
          ...prev,
          services: (prev.services || []).filter((_, i) => i !== index)
      }));
  };

  const renderStars = (rating: number) => {
      return Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
      ));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Configuración de Identidad</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Gestione sus credenciales legales, integración multi-clínica y su perfil público.</p>
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
          {saveStatus === 'saving' ? 'Sincronizando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-3">
          {[
            { id: 'profile', label: 'Identidad Médica', icon: <User className="w-4 h-4" /> },
            { id: 'clinic', label: 'Práctica / Establecimiento', icon: <Briefcase className="w-4 h-4" /> },
            { id: 'docs', label: 'Documentación Legal', icon: <FileText className="w-4 h-4" /> },
            { id: 'public_profile', label: 'Perfil Público / Muro', icon: <Globe className="w-4 h-4" /> },
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
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />

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
                 <Building2 className="w-5 h-5 mr-3" /> Datos de Práctica / Establecimiento
              </h3>

              {/* Mode Toggle */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Briefcase size={24}/></div>
                      <div>
                          <p className="text-sm font-black text-slate-900 uppercase">Modalidad de Ejercicio</p>
                          <p className="text-[10px] text-slate-500 font-medium">Defina si opera bajo una clínica o de forma independiente.</p>
                      </div>
                  </div>
                  <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                      <button 
                          className="px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all bg-slate-900 text-white shadow-md"
                      >
                          Institucional / Clínica
                      </button>
                      <button 
                          className="px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all text-slate-400 hover:text-slate-600"
                      >
                          Independiente / Freelance
                      </button>
                  </div>
              </div>
              
              {/* Tenant Configuration */}
              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                      <Server className="text-indigo-600" size={20}/>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">ID de Clínica / Tenant (Base de Datos)</p>
                          <p className="text-[9px] text-slate-400">Este identificador separa sus pacientes de otras clínicas en la red.</p>
                      </div>
                  </div>
                  <input 
                    type="text" 
                    name="clinicId" 
                    value={profile.clinicId || 'CLINIC-001'} 
                    onChange={handleInputChange} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-black uppercase text-indigo-600 tracking-wider" 
                    placeholder="EJ: CLINIC-001"
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="col-span-full space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Comercial / Clínica</label>
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

          {/* ... Rest of tabs (docs, public_profile, security) remain the same ... */}
          {activeTab === 'docs' && (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-12 animate-in slide-in-from-right-4">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center">
                 <FileText className="w-5 h-5 mr-3" /> Respaldo de Documentación Oficial
               </h3>

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
                              <p className="text-[10px] font-black text-slate-400 uppercase">Click para cargar Título</p>
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

          {activeTab === 'public_profile' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                  {/* SECCIÓN 1: DISEÑO DEL PERFIL */}
                  <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
                      {/* HERO BANNER EDITABLE */}
                      <div className="relative h-64 bg-slate-100 group cursor-pointer" onClick={() => { setUploadType('cover'); fileInputRef.current?.click(); }}>
                          {profile.coverUrl ? (
                              <img src={profile.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                  <ImageIcon size={48} className="mb-2"/>
                                  <p className="text-[10px] font-black uppercase tracking-widest">Click para subir portada</p>
                              </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <Camera className="text-white" size={32} />
                          </div>
                      </div>

                      <div className="px-12 pb-12">
                          <div className="relative -mt-16 mb-8 flex justify-between items-end">
                              <div className="relative group cursor-pointer" onClick={() => { setUploadType('avatar'); fileInputRef.current?.click(); }}>
                                  <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-2xl">
                                      {profile.avatarUrl ? (
                                          <img src={profile.avatarUrl} className="w-full h-full object-cover rounded-[1.2rem]" alt="Avatar" />
                                      ) : (
                                          <div className="w-full h-full bg-slate-200 rounded-[1.2rem] flex items-center justify-center text-slate-400 font-black text-4xl uppercase">
                                              {profile.name.charAt(0)}
                                          </div>
                                      )}
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-3xl transition-all">
                                      <Camera className="text-white" size={24} />
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Acerca de Mí (Biografía)</label>
                                      <textarea 
                                          name="biography"
                                          className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-48 text-sm outline-none resize-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                                          placeholder="Describa su experiencia, filosofía de trabajo y enfoque médico para sus pacientes..."
                                          value={profile.biography || ''}
                                          onChange={handleInputChange}
                                      />
                                  </div>
                                  <div className="space-y-6">
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Servicios Ofrecidos (Etiquetas)</label>
                                          <div className="flex gap-2">
                                              <input 
                                                  className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none"
                                                  placeholder="Ej: Cirugía Laparoscópica"
                                                  value={newService}
                                                  onChange={(e) => setNewService(e.target.value)}
                                                  onKeyDown={(e) => e.key === 'Enter' && addService()}
                                              />
                                              <button onClick={addService} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg"><Plus size={18}/></button>
                                          </div>
                                          <div className="flex flex-wrap gap-2 pt-2">
                                              {profile.services?.map((svc, idx) => (
                                                  <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-blue-100">
                                                      {svc}
                                                      <button onClick={() => removeService(idx)} className="hover:text-red-500"><X size={12}/></button>
                                                  </span>
                                              ))}
                                              {(!profile.services || profile.services.length === 0) && <p className="text-[10px] text-slate-400 italic ml-2">Sin servicios listados</p>}
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Galería (Certificados / Instalaciones)</label>
                                      <button onClick={() => { setUploadType('gallery'); fileInputRef.current?.click(); }} className="text-[10px] font-bold text-blue-600 hover:underline uppercase flex items-center gap-1"><Plus size={12}/> Agregar Imagen</button>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {profile.gallery?.map((img, idx) => (
                                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm">
                                              <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                                              <button 
                                                  onClick={() => {
                                                      const newGallery = profile.gallery?.filter((_, i) => i !== idx);
                                                      setProfile({...profile, gallery: newGallery});
                                                  }}
                                                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                              >
                                                  <Trash2 size={12} />
                                              </button>
                                          </div>
                                      ))}
                                      {(!profile.gallery || profile.gallery.length === 0) && (
                                          <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-300 text-xs font-black uppercase">
                                              Galería Vacía
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* SECCIÓN 2: REPUTACIÓN Y RESEÑAS */}
                  <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm p-12 space-y-10 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                  <MessageSquare size={20} className="text-amber-500" /> Reputación y Reseñas
                              </h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de la opinión pública de pacientes</p>
                          </div>
                          
                          {/* TOGGLE HABILITAR COMENTARIOS */}
                          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${profile.allowReviews ? 'text-slate-900' : 'text-slate-400'}`}>
                                  {profile.allowReviews ? 'Comentarios Habilitados' : 'Solo Calificación (Estrellas)'}
                              </span>
                              <button 
                                  onClick={() => setProfile({...profile, allowReviews: !profile.allowReviews})}
                                  className={`transition-colors ${profile.allowReviews ? 'text-emerald-500' : 'text-slate-300'}`}
                              >
                                  {profile.allowReviews ? <ToggleRight size={32} strokeWidth={2.5}/> : <ToggleLeft size={32} strokeWidth={2.5}/>}
                              </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {/* RESUMEN DE CALIFICACIÓN - SIEMPRE VISIBLE */}
                          <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 text-center flex flex-col items-center justify-center space-y-2 h-full">
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Calificación Promedio</p>
                              <div className="flex items-center gap-2">
                                  <span className="text-5xl font-black text-slate-900">{profile.rating || 4.9}</span>
                                  <Star size={32} className="fill-amber-400 text-amber-400" />
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase">{profile.reviewCount || 120} Evaluaciones</p>
                              <p className="text-[9px] text-slate-400 mt-4 leading-tight px-4">La calificación por estrellas siempre es visible en su perfil público.</p>
                          </div>

                          {/* LISTA DE COMENTARIOS (CONTROLADA POR EL TOGGLE) */}
                          <div className="md:col-span-2 relative">
                               <div className={`space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 transition-all duration-300 ${!profile.allowReviews ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                                  {MOCK_REVIEWS.map(review => (
                                      <div key={review.id} className="p-5 border border-slate-100 rounded-3xl bg-white hover:shadow-md transition-all">
                                          <div className="flex justify-between items-start mb-2">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                      {review.patient.charAt(0)}
                                                  </div>
                                                  <div>
                                                      <p className="text-xs font-black text-slate-900 uppercase">{review.patient}</p>
                                                      <div className="flex gap-1">
                                                          {renderStars(review.rating)}
                                                      </div>
                                                  </div>
                                              </div>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase">{review.date}</span>
                                          </div>
                                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">"{review.text}"</p>
                                          <div className="mt-3 flex justify-end">
                                              <button className="text-[9px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1">
                                                  <ThumbsUp size={12}/> Es útil
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              
                              {!profile.allowReviews && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                      <div className="bg-white/90 p-6 rounded-2xl shadow-xl border border-slate-200 text-center backdrop-blur-sm">
                                          <ShieldCheck size={32} className="mx-auto text-slate-400 mb-2"/>
                                          <p className="text-xs font-black text-slate-900 uppercase">Comentarios Desactivados</p>
                                          <p className="text-[9px] text-slate-500 mt-1 max-w-xs">Los pacientes pueden calificar con estrellas, pero no pueden escribir ni leer reseñas detalladas.</p>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
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
