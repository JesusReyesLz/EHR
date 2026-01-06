
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Droplet, 
  Save, User, AlertTriangle, CheckCircle2,
  Lock, ClipboardCheck, Clock, HeartPulse,
  Thermometer, Activity, Wind, UserCheck, AlertCircle,
  FileWarning, Syringe, Ban
} from 'lucide-react';
import { Patient, ClinicalNote } from '../types';

interface TransfusionRegistryProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
}

const TransfusionRegistry: React.FC<TransfusionRegistryProps> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // --- ESTADOS DEL FORMULARIO ---
  const [form, setForm] = useState({
    // Datos de la Unidad
    hemocomponentType: 'Paquete Globular',
    volume: '',
    unitId: '', // ID de la bolsa (Trazabilidad)
    unitGroup: 'O',
    unitRh: '+',
    expirationDate: '',
    bloodBankOrigin: 'Banco de Sangre Institucional',
    
    // Tiempos
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    endTime: '',
    duration: '', // Calculado o manual
    
    // Acceso Vascular
    accessSite: 'Vena Cefálica Izquierda',
    catheterGauge: '18G', // Calibre

    // Reacciones Adversas
    hasAdverseReaction: false,
    reactionTime: '',
    reactionType: '', // Alérgica, Febril, Hemolítica, TRALI, TACO
    symptoms: '',
    management: '', // Medicamentos, suspensión, notificación
    bankNotified: false,
    
    // Responsables
    indicatedBy: 'Dr. Alejandro Méndez',
    performedBy: 'Enf. Lucía Rodríguez',
    witnessName: '' // Para doble verificación
  });

  // Tabla de Signos Vitales (Cronometría)
  const [vitalsLog, setVitalsLog] = useState([
    { stage: 'Basal (Pre-Transfusión)', time: '', bp: '', hr: '', temp: '', rr: '', o2: '', notes: '' },
    { stage: '15 Minutos (Crítico)', time: '', bp: '', hr: '', temp: '', rr: '', o2: '', notes: 'Descartar reacción inmediata' },
    { stage: 'Trans-transfusión (Media)', time: '', bp: '', hr: '', temp: '', rr: '', o2: '', notes: '' },
    { stage: 'Post-transfusión (Final)', time: '', bp: '', hr: '', temp: '', rr: '', o2: '', notes: '' },
  ]);

  // Checklist de Seguridad (Doble Chequeo Obligatorio)
  const [checklist, setChecklist] = useState({
    informedConsent: false,
    patientIdMatch: false, // Nombre y Exp en brazalete vs bolsa
    bloodGroupMatch: false, // Grupo y Rh compatible
    unitIntegrity: false, // Sin fugas, coloración adecuada, sin coágulos
    crossmatchVerified: false, // Pruebas cruzadas compatibles
    filterSetUsed: true // Equipo con filtro normado
  });

  const allChecksPassed = useMemo(() => Object.values(checklist).every(Boolean), [checklist]);

  if (!patient) return null;

  const handleSave = () => {
    // Validaciones de Seguridad
    if (!form.unitId) {
        alert("El Número de Identificación de la Unidad es obligatorio para la trazabilidad.");
        return;
    }
    if (!allChecksPassed) {
        alert("No se puede guardar el registro sin completar el Protocolo de Seguridad (Checklist de Doble Verificación).");
        return;
    }
    if (form.hasAdverseReaction && (!form.reactionType || !form.management)) {
        alert("Si reporta una reacción adversa, debe especificar el tipo y el manejo realizado.");
        return;
    }

    const newNote: ClinicalNote = {
      id: `TRANS-${Date.now()}`,
      patientId: patient.id,
      type: 'Registro de Transfusión Sanguínea',
      date: new Date().toLocaleString('es-MX'),
      author: form.performedBy,
      content: { 
          ...form, 
          monitoringVitals: vitalsLog, 
          safetyChecklist: checklist,
          patientData: { bloodType: patient.bloodType } // Snapshot del tipo de sangre del paciente
      },
      isSigned: true,
      hash: `CERT-NOM253-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  const updateVital = (index: number, field: string, value: string) => {
    const newVitals = [...vitalsLog];
    (newVitals[index] as any)[field] = value;
    setVitalsLog(newVitals);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-rose-600 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registro de Transfusión</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500"/> NOM-253-SSA1-2012 • Trazabilidad
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-6 py-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
              <Droplet size={20} className="text-rose-600 animate-pulse" />
              <div>
                  <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Grupo Paciente</p>
                  <p className="text-lg font-black text-rose-900 uppercase tracking-widest">{patient.bloodType}</p>
              </div>
           </div>
           <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 shadow-sm transition-all"><Printer size={20} /></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        
        {/* I. PROTOCOLO DE SEGURIDAD (CHECKLIST) */}
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 space-y-8">
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-4 text-slate-900">
                  <ClipboardCheck size={24} className="text-rose-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest">I. Protocolo de Seguridad (Doble Verificación)</h3>
               </div>
               {!allChecksPassed && <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 animate-pulse">Verificación Incompleta</span>}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'informedConsent', label: 'Consentimiento Informado Firmado' },
                { key: 'patientIdMatch', label: 'Identificación Correcta (Nombre/Exp)' },
                { key: 'bloodGroupMatch', label: 'Compatibilidad de Grupo y Rh' },
                { key: 'crossmatchVerified', label: 'Pruebas Cruzadas Compatibles' },
                { key: 'unitIntegrity', label: 'Integridad de la Unidad (Sin fugas/coágulos)' },
                { key: 'filterSetUsed', label: 'Equipo con Filtro Normado' }
              ].map(item => (
                <button 
                  key={item.key}
                  onClick={() => setChecklist({...checklist, [item.key]: !(checklist as any)[item.key]})}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group text-left ${
                    (checklist as any)[item.key] 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300'
                  }`}
                >
                   <span className="text-[9px] font-black uppercase pr-2">{item.label}</span>
                   {(checklist as any)[item.key] 
                        ? <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" /> 
                        : <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-rose-300 flex-shrink-0"></div>
                   }
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* II. DATOS DE LA UNIDAD (SIDEBAR) */}
            <div className="lg:col-span-4 p-10 bg-white border-r border-slate-100 space-y-8">
               <div className="flex items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
                  <Droplet size={24} className="text-rose-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest">II. Datos del Hemocomponente</h3>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">ID Unidad (Etiqueta)</label>
                     <input 
                       className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-black uppercase tracking-widest focus:border-rose-400 outline-none text-rose-900 text-center"
                       placeholder="EJ: 123456-A"
                       value={form.unitId}
                       onChange={e => setForm({...form, unitId: e.target.value})}
                     />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Componente</label>
                     <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={form.hemocomponentType} onChange={e => setForm({...form, hemocomponentType: e.target.value})}>
                        <option>Paquete Globular</option>
                        <option>Plasma Fresco Congelado</option>
                        <option>Concentrado Plaquetario</option>
                        <option>Crioprecipitado</option>
                        <option>Sangre Total</option>
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Grupo</label>
                         <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none" value={form.unitGroup} onChange={e => setForm({...form, unitGroup: e.target.value})}>
                            <option>O</option><option>A</option><option>B</option><option>AB</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Rh</label>
                         <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none" value={form.unitRh} onChange={e => setForm({...form, unitRh: e.target.value})}>
                            <option>POSITIVO (+)</option><option>NEGATIVO (-)</option>
                         </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Volumen (ml)</label>
                         <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black" value={form.volume} onChange={e => setForm({...form, volume: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Caducidad</label>
                         <input type="date" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold" value={form.expirationDate} onChange={e => setForm({...form, expirationDate: e.target.value})} />
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiempos de Infusión</p>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[8px] font-bold text-slate-400">Inicio</label>
                              <input type="time" className="w-full bg-white p-2 rounded-lg border border-slate-200 text-xs font-black" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[8px] font-bold text-slate-400">Término</label>
                              <input type="time" className="w-full bg-white p-2 rounded-lg border border-slate-200 text-xs font-black" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            {/* III. MONITOREO Y REACCIONES (MAIN CONTENT) */}
            <div className="lg:col-span-8 p-10 space-y-10">
               
               {/* SIGNOS VITALES */}
               <div className="space-y-6">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                      <HeartPulse size={16} className="text-blue-600"/> III. Monitoreo de Signos Vitales
                   </h3>
                   
                   <div className="overflow-x-auto rounded-[2rem] border border-slate-200 shadow-sm">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400 tracking-widest">
                            <tr>
                               <th className="p-4">Etapa</th>
                               <th className="p-4 w-20">Hora</th>
                               <th className="p-4 w-20 text-center">T.A.</th>
                               <th className="p-4 w-16 text-center">F.C.</th>
                               <th className="p-4 w-16 text-center">Temp</th>
                               <th className="p-4 w-16 text-center">SatO2</th>
                               <th className="p-4">Observaciones</th>
                            </tr>
                         </thead>
                         <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                            {vitalsLog.map((v, i) => (
                               <tr key={i} className={`group ${i === 1 ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}>
                                  <td className="p-4">
                                      <span className={`text-[9px] font-black uppercase ${i === 1 ? 'text-amber-700' : 'text-slate-500'}`}>{v.stage}</span>
                                  </td>
                                  <td className="p-2"><input type="time" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center" value={v.time} onChange={e => updateVital(i, 'time', e.target.value)} /></td>
                                  <td className="p-2"><input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center" placeholder="120/80" value={v.bp} onChange={e => updateVital(i, 'bp', e.target.value)} /></td>
                                  <td className="p-2"><input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center" placeholder="70" value={v.hr} onChange={e => updateVital(i, 'hr', e.target.value)} /></td>
                                  <td className="p-2"><input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center" placeholder="36.5" value={v.temp} onChange={e => updateVital(i, 'temp', e.target.value)} /></td>
                                  <td className="p-2"><input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center" placeholder="98%" value={v.o2} onChange={e => updateVital(i, 'o2', e.target.value)} /></td>
                                  <td className="p-2"><input className="w-full p-2 bg-white border border-slate-200 rounded-lg" placeholder="Sin cambios..." value={v.notes} onChange={e => updateVital(i, 'notes', e.target.value)} /></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
               </div>

               {/* REACCIONES ADVERSAS */}
               <div className={`rounded-[2.5rem] border-2 p-8 transition-all space-y-6 ${form.hasAdverseReaction ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                   <div className="flex justify-between items-center">
                        <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${form.hasAdverseReaction ? 'text-rose-700' : 'text-slate-500'}`}>
                            <AlertTriangle size={16} /> IV. Reacciones Adversas
                        </h3>
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                             <button onClick={() => setForm({...form, hasAdverseReaction: false})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${!form.hasAdverseReaction ? 'bg-emerald-500 text-white shadow' : 'text-slate-400'}`}>Negadas</button>
                             <button onClick={() => setForm({...form, hasAdverseReaction: true})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${form.hasAdverseReaction ? 'bg-rose-600 text-white shadow' : 'text-slate-400'}`}>Presentes</button>
                        </div>
                   </div>

                   {form.hasAdverseReaction && (
                       <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-top-4">
                           <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-2">
                                   <label className="text-[9px] font-black text-rose-500 uppercase ml-2">Tipo de Reacción</label>
                                   <select className="w-full p-4 bg-white border border-rose-200 rounded-2xl text-xs font-bold uppercase outline-none" value={form.reactionType} onChange={e => setForm({...form, reactionType: e.target.value})}>
                                       <option value="">Seleccione...</option>
                                       <option value="Reacción Febril No Hemolítica">Febril No Hemolítica</option>
                                       <option value="Reacción Alérgica / Urticaria">Alérgica / Urticaria</option>
                                       <option value="Reacción Hemolítica Aguda">Hemolítica Aguda (Grave)</option>
                                       <option value="Sobrecarga Circulatoria (TACO)">Sobrecarga (TACO)</option>
                                       <option value="Daño Pulmonar (TRALI)">Daño Pulmonar (TRALI)</option>
                                       <option value="Anafilaxia">Anafilaxia</option>
                                   </select>
                               </div>
                               <div className="space-y-2">
                                   <label className="text-[9px] font-black text-rose-500 uppercase ml-2">Hora de Inicio</label>
                                   <input type="time" className="w-full p-4 bg-white border border-rose-200 rounded-2xl text-xs font-bold" value={form.reactionTime} onChange={e => setForm({...form, reactionTime: e.target.value})} />
                               </div>
                           </div>
                           
                           <div className="space-y-2">
                               <label className="text-[9px] font-black text-rose-500 uppercase ml-2">Descripción de Síntomas</label>
                               <textarea className="w-full p-4 bg-white border border-rose-200 rounded-2xl h-20 text-xs font-medium resize-none outline-none" placeholder="Fiebre, escalofríos, dolor lumbar, hipotensión..." value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} />
                           </div>

                           <div className="space-y-2">
                               <label className="text-[9px] font-black text-rose-500 uppercase ml-2">Manejo y Tratamiento</label>
                               <textarea className="w-full p-4 bg-white border border-rose-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none" placeholder="Suspensión de transfusión, administración de antihistamínicos/esteroides, fluidos..." value={form.management} onChange={e => setForm({...form, management: e.target.value})} />
                           </div>

                           <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-rose-200">
                               <FileWarning className="text-rose-600" size={20} />
                               <div className="flex-1">
                                   <p className="text-[10px] font-black text-rose-800 uppercase">Notificación Obligatoria</p>
                                   <p className="text-[9px] text-rose-500">Se debe enviar la unidad remanente y muestra del paciente al Banco de Sangre.</p>
                               </div>
                               <div className="flex items-center gap-2">
                                   <span className="text-[9px] font-bold text-rose-700 uppercase">Banco Notificado:</span>
                                   <input type="checkbox" className="w-5 h-5 accent-rose-600" checked={form.bankNotified} onChange={e => setForm({...form, bankNotified: e.target.checked})} />
                               </div>
                           </div>
                       </div>
                   )}
               </div>
            </div>
        </div>

      </div>

      {/* Footer / Firmas */}
      <div className="mt-8 p-12 bg-slate-900 text-white rounded-[3rem] shadow-2xl overflow-hidden relative no-print">
          <div className="absolute right-0 top-0 h-full w-64 bg-rose-600/20 -skew-x-12 translate-x-32"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10">
              <div className="space-y-6">
                  <div className="flex items-center gap-3 text-blue-400">
                      <User size={18} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Médico que Indica</p>
                  </div>
                  <div className="space-y-2">
                      <input className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl text-xs font-bold uppercase text-white outline-none" value={form.indicatedBy} onChange={e => setForm({...form, indicatedBy: e.target.value})} />
                      <p className="text-[8px] text-slate-500 uppercase ml-2">Nombre y Firma</p>
                  </div>
              </div>

              <div className="space-y-6">
                  <div className="flex items-center gap-3 text-emerald-400">
                      <Syringe size={18} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Personal que Transfunde</p>
                  </div>
                  <div className="space-y-2">
                      <input className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl text-xs font-bold uppercase text-white outline-none" value={form.performedBy} onChange={e => setForm({...form, performedBy: e.target.value})} />
                      <p className="text-[8px] text-slate-500 uppercase ml-2">Nombre y Firma</p>
                  </div>
              </div>

              <div className="flex items-end justify-end">
                  <button 
                    onClick={handleSave}
                    className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                  >
                     <Save size={18} /> Certificar Registro
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default TransfusionRegistry;
