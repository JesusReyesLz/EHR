
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ShieldCheck, 
  User, 
  MapPin, 
  Briefcase, 
  Book, 
  Heart, 
  Save,
  AlertTriangle,
  Fingerprint,
  AlertCircle,
  // Fix: Added missing CheckCircle2 import
  CheckCircle2
} from 'lucide-react';
import { Patient, PatientStatus, ModuleType, PriorityLevel } from '../types';

interface NewPatientProps {
  onAdd: (p: Patient) => void;
  patients: Patient[];
}

const NewPatient: React.FC<NewPatientProps> = ({ onAdd, patients }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const existingPatient = patients.find(p => p.id === id);

  const [form, setForm] = useState<Partial<Patient>>({
    name: '',
    curp: '',
    age: 0,
    sex: 'M',
    bloodType: 'O+',
    allergies: [],
    status: PatientStatus.WAITING,
    priority: PriorityLevel.MEDIUM,
    assignedModule: ModuleType.OUTPATIENT,
    phone: '',
    birthDate: '',
    birthPlace: '',
    residence: '',
    address: '',
    civilStatus: 'Soltero(a)',
    occupation: '',
    education: '',
    religion: '',
    ethnicGroup: '',
    indigenousLanguage: false,
    medicalInsurance: '',
    chronicDiseases: [],
    reason: ''
  });

  useEffect(() => {
    if (existingPatient) {
      setForm(existingPatient);
    }
  }, [existingPatient]);

  const handleSave = () => {
    if (!form.name || !form.curp) {
      alert("Nombre y CURP son campos obligatorios.");
      return;
    }

    const patientData: Patient = {
      ...form as Patient,
      id: isEditing ? (id as string) : Math.random().toString(36).substr(2, 7).toUpperCase(),
      name: form.name?.toUpperCase() || '',
      curp: form.curp?.toUpperCase() || '',
      lastVisit: isEditing ? (existingPatient?.lastVisit || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      reason: form.reason || 'Ingreso a sistema',
      priority: form.priority || PriorityLevel.MEDIUM
    };

    onAdd(patientData);
    navigate(isEditing ? `/patient/${id}` : '/');
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {isEditing ? 'Edición de Expediente' : 'Alta de Paciente en Base de Datos'}
            </h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">Ficha de Identificación NOM-004-SSA3-2012</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3"
        >
          <Save className="w-5 h-5" /> {isEditing ? 'Actualizar Base de Datos' : 'Guardar en Sistema'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" /> 1. Datos Personales y Filiación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nombre Completo (Apellidos y Nombres)</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-black uppercase text-sm"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">CURP</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono uppercase text-sm"
                  value={form.curp}
                  onChange={e => setForm({...form, curp: e.target.value})}
                  maxLength={18}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Motivo de Atención / Ingreso</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold"
                  value={form.reason}
                  onChange={e => setForm({...form, reason: e.target.value})}
                  placeholder="Ej: Control prenatal, Dolor agudo..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Edad</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.age} onChange={e => setForm({...form, age: parseInt(e.target.value)})}/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Sexo</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={form.sex} onChange={e => setForm({...form, sex: e.target.value as any})}>
                    <option value="M">MASCULINO</option>
                    <option value="F">FEMENINO</option>
                    <option value="O">OTRO</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Fecha de Nacimiento</label>
                <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})}/>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PRIORIDAD Y CLASIFICACIÓN */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600" /> 2. Clasificación Médica (Triage)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nivel de Prioridad</label>
                  <div className="grid grid-cols-1 gap-2">
                     {Object.values(PriorityLevel).map(lvl => (
                        <button 
                           key={lvl}
                           onClick={() => setForm({...form, priority: lvl})}
                           className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase text-left transition-all flex items-center justify-between ${form.priority === lvl ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-300'}`}
                        >
                           {lvl}
                           {form.priority === lvl && <CheckCircle2 size={16} />}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Módulo Destino</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-600"
                    value={form.assignedModule}
                    onChange={e => setForm({...form, assignedModule: e.target.value as ModuleType})}
                  >
                    {Object.values(ModuleType).filter(m => m !== ModuleType.ADMIN && m !== ModuleType.MONITOR).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl mt-4">
                     <p className="text-[9px] text-blue-800 font-bold uppercase leading-relaxed">
                        * La prioridad determina el orden de visualización en el centro de mando y las alertas de tiempo de espera.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* SECCIÓN 3: DATOS CLÍNICOS CRÍTICOS */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform">
                <Heart className="w-48 h-48" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-3 text-blue-400">
               <Fingerprint className="w-5 h-5" /> 3. Perfil Clínico Vital
             </h3>
             <div className="space-y-6 relative z-10">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Grupo y Rh Sanguíneo</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.bloodType}
                    onChange={e => setForm({...form, bloodType: e.target.value})}
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t} className="text-slate-900">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Alergias (Separadas por comas)</label>
                  <textarea 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-rose-500 h-24"
                    value={form.allergies?.join(', ')}
                    onChange={e => setForm({...form, allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                  />
                </div>
             </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex items-start">
            <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-[10px] font-black text-amber-900 uppercase">Validación Normativa</p>
              <p className="text-[10px] text-amber-700 mt-1 font-medium leading-relaxed">
                Asegúrese de que el nombre coincida exactamente con la identificación oficial del paciente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPatient;
