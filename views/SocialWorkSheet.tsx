
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Users, Home, 
  Wallet, HeartHandshake, Save, Plus, Trash2, 
  MapPin, Info, CheckCircle2, UserPlus, ClipboardList
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  relationship: string;
  occupation: string;
  monthlyIncome: number;
}

const SocialWorkSheet: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [activeSection, setActiveSection] = useState<'family' | 'housing' | 'diagnosis'>('family');
  
  // Estado del formulario
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [housing, setHousing] = useState({
    type: 'Propia',
    rooms: 2,
    floorMaterial: 'Cemento / Firme',
    wallMaterial: 'Ladrillo / Block',
    roofMaterial: 'Concreto',
    services: {
      water: true, light: true, drainage: true, internet: false, phone: true
    }
  });
  const [socialData, setSocialData] = useState({
    totalIncome: 0,
    perCapitaIncome: 0,
    socialDiagnosis: '',
    interventionPlan: 'Gestión de condonación de servicios hospitalarios según tabulador de nivel socioeconómico. Apoyo con redes familiares para el cuidado post-operatorio.',
    supportNetwork: 'Hijos apoyan económicamente. Cuenta con seguro popular/IMSS-Bienestar.'
  });

  const totalFamilyIncome = useMemo(() => {
    return familyMembers.reduce((acc, curr) => acc + curr.monthlyIncome, 0);
  }, [familyMembers]);

  const perCapita = useMemo(() => {
    const totalPeople = familyMembers.length + 1; // Familiares + Paciente
    return totalFamilyIncome / totalPeople;
  }, [totalFamilyIncome, familyMembers]);

  if (!patient) return null;

  const addMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: '',
      age: 0,
      relationship: '',
      occupation: '',
      monthlyIncome: 0
    };
    setFamilyMembers([...familyMembers, newMember]);
  };

  const updateMember = (id: string, field: keyof FamilyMember, value: any) => {
    setFamilyMembers(familyMembers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSave = () => {
    if (!socialData.socialDiagnosis) {
      alert("El Diagnóstico Social es un campo obligatorio por norma.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `SW-${Date.now()}`,
      patientId: patient.id,
      type: 'Estudio Socioeconómico / Trabajo Social',
      date: new Date().toLocaleString('es-MX'),
      author: 'Lic. María Elena Rojas (Trabajo Social)',
      content: { ...housing, familyMembers, ...socialData, totalFamilyIncome, perCapita },
      isSigned: true,
      hash: `CERT-SW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Estilo Expediente */}
      <div className="bg-white border-b-8 border-indigo-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Estudio Socioeconómico</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-004-SSA3-2012 • Trabajo Social
            </p>
          </div>
        </div>
        <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><Printer size={20} /></button>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        
        {/* Navegación Secciones */}
        <div className="bg-slate-50 p-2 flex gap-2 no-print">
          {[
            { id: 'family', label: 'Estructura Familiar', icon: <Users size={16} /> },
            { id: 'housing', label: 'Condiciones de Vivienda', icon: <Home size={16} /> },
            { id: 'diagnosis', label: 'Dictamen y Plan Social', icon: <HeartHandshake size={16} /> }
          ].map(sec => (
            <button 
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === sec.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}
            >
              {sec.icon} {sec.label}
            </button>
          ))}
        </div>

        <div className="p-16 space-y-12">
          
          {/* SECCIÓN 1: FAMILIA */}
          {activeSection === 'family' && (
            <div className="space-y-10 animate-in slide-in-from-left-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
                    <Users className="text-indigo-600" /> Integración del Núcleo Familiar
                 </h3>
                 <button onClick={addMember} className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">
                    <Plus size={14} /> Añadir Familiar
                 </button>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                          <th className="px-4 py-4">Nombre Completo</th>
                          <th className="px-4 py-4 text-center w-20">Edad</th>
                          <th className="px-4 py-4">Parentesco</th>
                          <th className="px-4 py-4">Ocupación</th>
                          <th className="px-4 py-4 text-right">Ingreso Mens.</th>
                          <th className="px-4 py-4 text-right">Acción</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {familyMembers.map(m => (
                          <tr key={m.id} className="group">
                             <td className="px-4 py-3"><input className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold uppercase focus:bg-white focus:border-indigo-200 outline-none" value={m.name} onChange={e => updateMember(m.id, 'name', e.target.value)} placeholder="Nombre..." /></td>
                             <td className="px-4 py-3"><input type="number" className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs text-center font-bold focus:bg-white focus:border-indigo-200 outline-none" value={m.age} onChange={e => updateMember(m.id, 'age', parseInt(e.target.value))} /></td>
                             <td className="px-4 py-3"><input className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold uppercase focus:bg-white focus:border-indigo-200 outline-none" value={m.relationship} onChange={e => updateMember(m.id, 'relationship', e.target.value)} placeholder="Ej: Hijo" /></td>
                             <td className="px-4 py-3"><input className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold uppercase focus:bg-white focus:border-indigo-200 outline-none" value={m.occupation} onChange={e => updateMember(m.id, 'occupation', e.target.value)} placeholder="Ej: Estudiante" /></td>
                             <td className="px-4 py-3 text-right"><input type="number" className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs text-right font-black text-indigo-700 focus:bg-white focus:border-indigo-200 outline-none" value={m.monthlyIncome} onChange={e => updateMember(m.id, 'monthlyIncome', parseFloat(e.target.value))} /></td>
                             <td className="px-4 py-3 text-right"><button onClick={() => setFamilyMembers(familyMembers.filter(fam => fam.id !== m.id))} className="text-slate-200 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {familyMembers.length === 0 && (
                   <div className="p-12 text-center text-slate-300 font-black uppercase text-[10px] border-2 border-dashed border-slate-50 rounded-3xl">Registra los miembros del hogar para el cálculo socioeconómico</div>
                 )}
              </div>

              {/* Panel de Ingresos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                 <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl flex items-center justify-between overflow-hidden relative group">
                    <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                    <div>
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Ingreso Familiar Total</p>
                       <p className="text-4xl font-black tracking-tighter mt-1">${totalFamilyIncome.toLocaleString()}<span className="text-xs text-slate-500 font-bold ml-2">MXN/MES</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Per Cápita</p>
                       <p className="text-2xl font-black tracking-tighter">${perCapita.toFixed(2)}</p>
                    </div>
                 </div>
                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-center gap-6">
                    <Info className="text-blue-600 w-10 h-10 flex-shrink-0" />
                    <p className="text-[10px] text-blue-900 font-medium leading-relaxed uppercase tracking-tight">
                       "El cálculo per cápita permite determinar el nivel de clasificación socioeconómica para la aplicación de cuotas de recuperación."
                    </p>
                 </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: VIVIENDA */}
          {activeSection === 'housing' && (
            <div className="space-y-12 animate-in slide-in-from-right-4">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-6">
                  <Home className="text-indigo-600" /> Características de la Vivienda
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenencia</label>
                     <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-50" value={housing.type} onChange={e => setHousing({...housing, type: e.target.value})}>
                        <option>Propia</option><option>Rentada</option><option>Prestada</option><option>Invadida/Asentamiento</option>
                     </select>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material de Piso</label>
                     <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={housing.floorMaterial} onChange={e => setHousing({...housing, floorMaterial: e.target.value})}>
                        <option>Tierra</option><option>Cemento / Firme</option><option>Mosaico / Madera</option>
                     </select>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material de Techo</label>
                     <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={housing.roofMaterial} onChange={e => setHousing({...housing, roofMaterial: e.target.value})}>
                        <option>Lámina / Madera</option><option>Concreto</option><option>Teja</option>
                     </select>
                  </div>
               </div>

               <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-8">
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] flex items-center gap-3">
                     <ClipboardList size={16} /> Inventario de Servicios Básicos
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                     {Object.entries(housing.services).map(([key, val]) => (
                        <button 
                           key={key}
                           onClick={() => setHousing({...housing, services: {...housing.services, [key]: !val}})}
                           className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${val ? 'bg-white border-indigo-600 text-indigo-900 shadow-xl' : 'bg-slate-100 border-transparent text-slate-400'}`}
                        >
                           <div className={`w-3 h-3 rounded-full ${val ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`}></div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{key === 'water' ? 'Agua' : key === 'light' ? 'Luz' : key === 'drainage' ? 'Drenaje' : key}</span>
                        </button>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {/* SECCIÓN 3: DIAGNÓSTICO SOCIAL */}
          {activeSection === 'diagnosis' && (
            <div className="space-y-10 animate-in zoom-in-95">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-6">
                  <HeartHandshake className="text-indigo-600" /> Evaluación y Plan Social
               </h3>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-2">Diagnóstico Social (Dictamen Profesional)</label>
                  <textarea 
                     className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-48 text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner leading-relaxed" 
                     value={socialData.socialDiagnosis} 
                     onChange={e => setSocialData({...socialData, socialDiagnosis: e.target.value})} 
                     placeholder="Evaluación de la situación familiar, económica y de riesgo del paciente..."
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Redes de Apoyo</label>
                     <textarea className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] h-32 text-xs font-bold uppercase outline-none" value={socialData.supportNetwork} onChange={e => setSocialData({...socialData, supportNetwork: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Plan de Intervención</label>
                     <textarea className="w-full p-6 bg-indigo-50/30 border border-indigo-100 rounded-[2rem] h-32 text-xs font-bold uppercase outline-none" value={socialData.interventionPlan} onChange={e => setSocialData({...socialData, interventionPlan: e.target.value})} />
                  </div>
               </div>

               {/* Digital Signature */}
               <div className="pt-20 border-t border-slate-100 flex flex-col items-center no-print">
                  <div className="w-72 h-32 border-4 border-dashed border-slate-100 rounded-[3rem] flex items-center justify-center bg-slate-50/50 mb-6 group hover:border-indigo-600 transition-all cursor-pointer">
                     <div className="text-center">
                        <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Sello Profesional Activo</p>
                     </div>
                  </div>
                  <p className="text-sm font-black text-slate-900 uppercase">Lic. María Elena Rojas</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Cédula Prof. Trabajo Social 88776655</p>
               </div>
            </div>
          )}
        </div>

        {/* Footer Acciones */}
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center no-print overflow-hidden relative">
           <div className="absolute right-0 top-0 h-full w-64 bg-indigo-600/20 -skew-x-12 translate-x-32"></div>
           <div className="flex items-center gap-6 relative z-10">
              <ClipboardList size={24} className="text-indigo-400" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Certificación de Estudio Socioeconómico</p>
                 <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Validación Institucional • NOM-004-SSA3</p>
              </div>
           </div>
           <div className="flex gap-4 relative z-10">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-white transition-colors">Descartar</button>
              <button 
                onClick={handleSave}
                className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4"
              >
                 <Save size={20} /> Guardar Estudio Legal
              </button>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0.5rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-6xl { max-width: 100% !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .bg-slate-50 { background: #fff !important; }
          .border { border: 1px solid #000 !important; }
          input, textarea { border: none !important; border-bottom: 1px solid #000 !important; border-radius: 0 !important; }
          @page { margin: 0.5cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default SocialWorkSheet;
