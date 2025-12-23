
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
  Fingerprint
} from 'lucide-react';
import { Patient, PatientStatus, ModuleType } from '../types';

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
    chronicDiseases: []
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
      lastVisit: isEditing ? (existingPatient?.lastVisit || '') : 'Registro Inicial',
      reason: form.reason || 'Ingreso a sistema'
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
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Teléfono de Contacto</label>
                <input 
                  type="tel" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
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

          {/* SECCIÓN 2: LOCALIZACIÓN Y SOCIAL */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600" /> 2. Localización y Nivel Socioeconómico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Domicilio Actual (Calle, Número, Localidad)</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.address} onChange={e => setForm({...form, address: e.target.value})}/>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Lugar de Nacimiento</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.birthPlace} onChange={e => setForm({...form, birthPlace: e.target.value})}/>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Municipio de Residencia Actual</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.residence} onChange={e => setForm({...form, residence: e.target.value})}/>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Estado Civil</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.civilStatus} onChange={e => setForm({...form, civilStatus: e.target.value})}>
                  <option>Soltero(a)</option>
                  <option>Casado(a)</option>
                  <option>Unión Libre</option>
                  <option>Divorciado(a)</option>
                  <option>Viudo(a)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Ocupación</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})}/>
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
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Unidad de Atención Asignada</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-blue-400"
                    value={form.assignedModule}
                    onChange={e => setForm({...form, assignedModule: e.target.value as ModuleType})}
                  >
                    {Object.values(ModuleType).filter(m => m !== ModuleType.ADMIN).map(m => (
                      <option key={m} value={m} className="text-slate-900">{m}</option>
                    ))}
                  </select>
                </div>
             </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex items-start">
            <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-[10px] font-black text-amber-900 uppercase">Validación Normativa</p>
              <p className="text-[10px] text-amber-700 mt-1 font-medium leading-relaxed">
                Asegúrese de que el nombre coincida exactamente con la identificación oficial del paciente para evitar duplicidad en la base de datos SUIVE.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-8 flex items-start">
            <ShieldCheck className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-[10px] font-black text-blue-900 uppercase">Seguridad de Datos</p>
              <p className="text-[10px] text-blue-700 mt-1 font-medium leading-relaxed">
                Este registro cumple con el Aviso de Privacidad Integral conforme a la LFPDPPP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPatient;
