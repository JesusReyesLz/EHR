
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Printer, QrCode, Plus, Trash2, Eye, 
  ShieldCheck, Search, Heart, Pill, ClipboardList, Activity, 
  Droplet, Thermometer, Wind, Save, PlusCircle, AlertCircle,
  MapPin, Phone, User, Landmark,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  X,
  Calendar,
  AlertOctagon,
  Scale
} from 'lucide-react';
import { Patient, MedicationPrescription, MedicationStock, Vitals, DoctorInfo, ClinicalNote, PriceItem, PriceType, ChargeItem } from '../types';
import { VADEMECUM_DB, INITIAL_STOCK, INITIAL_PRICES } from '../constants';

const Prescription: React.FC<{ patients: Patient[], doctorInfo: DoctorInfo, onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, doctorInfo, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const patient = patients.find(p => p.id === id);

  const [isPreview, setIsPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el tipo de búsqueda (Fármaco o Procedimiento)
  const [searchType, setSearchType] = useState<'med' | 'proc'>('med');

  // Modificado: Ahora las sugerencias incluyen el dato de stock total
  const [suggestions, setSuggestions] = useState<(MedicationStock & { totalStock: number })[]>([]);
  const [procSuggestions, setProcSuggestions] = useState<PriceItem[]>([]);
  
  // Lista de Procedimientos seleccionados (sencilla, solo para cobro/info)
  const [selectedProcedures, setSelectedProcedures] = useState<PriceItem[]>([]);

  // Cargar inventario real desde LocalStorage O usar INITIAL_STOCK por defecto
  const inventory: MedicationStock[] = useMemo(() => {
    const saved = localStorage.getItem('med_inventory_v6');
    let data = saved ? JSON.parse(saved) : INITIAL_STOCK;
    
    // Asegurar estructura de lotes si es legacy
    if (data.length > 0 && !data[0].batches) {
        data = data.map((item: any) => ({
            ...item,
            batches: [{ id: 'LEGACY', batchNumber: item.batch || 'N/A', expiryDate: item.expiryDate, currentStock: item.currentStock || 0 }]
        }));
    }
    return data;
  }, []);

  const prices: PriceItem[] = useMemo(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  }, []);
  
  const dataFromNote = location.state as { diagnosis?: string, meds?: MedicationPrescription[], generalPlan?: string, cieCode?: string } | null;

  // Extended Medication Type for UI (includes Pharma Form)
  interface ExtendedMedication extends MedicationPrescription {
      pharmaceuticalForm?: string; // Tableta, Jarabe, Solución, etc.
  }

  const [medications, setMedications] = useState<ExtendedMedication[]>(dataFromNote?.meds || []);
  const [prescriptionData, setPrescriptionData] = useState({
    diagnostico: dataFromNote?.diagnosis || '',
    cieCode: dataFromNote?.cieCode || '',
    indicaciones: dataFromNote?.generalPlan || '',
    alarmSigns: '', // Signos de alarma
    nextAppointment: '', // Próxima Cita
    folio: `REC-MX-${Date.now().toString().slice(-8)}`,
    fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  });

  const [vitals, setVitals] = useState<Vitals | null>(null);

  useEffect(() => {
    if (patient) setVitals(patient.currentVitals || null);
  }, [patient]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    if (val.length <= 1) {
       setSuggestions([]);
       setProcSuggestions([]);
       return;
    }

    const term = val.toLowerCase();

    if (searchType === 'med') {
      // 1. Buscar en INVENTARIO REAL (Suma de lotes)
      const stockMatches = inventory.filter(i => 
        i.name.toLowerCase().includes(term) || 
        i.genericName.toLowerCase().includes(term)
      ).map(i => ({ 
        ...i, 
        totalStock: i.batches ? i.batches.reduce((acc, b) => acc + b.currentStock, 0) : 0
      }));

      // 2. Buscar en VADEMECUM (Catálogo global) lo que NO esté en inventario
      const catalogMatches = VADEMECUM_DB.filter(v => 
        (v.name.toLowerCase().includes(term) || v.genericName.toLowerCase().includes(term)) &&
        !stockMatches.some(s => s.name === v.name) 
      ).map(v => ({ 
        ...v, 
        batches: [],
        totalStock: 0 
      }));

      setSuggestions([...stockMatches, ...catalogMatches]);
    } else {
      // Buscar en Catálogo de Servicios
      const serviceMatches = prices.filter(p => 
         p.type === PriceType.SERVICE && 
         (p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
      );
      setProcSuggestions(serviceMatches);
    }
  };

  const selectMedFromDB = (med: MedicationStock & { totalStock: number }) => {
    const newMed: ExtendedMedication = {
      id: `MED-${Date.now()}`,
      name: med.name, // Comercial
      genericName: med.genericName,
      presentation: med.presentation, // Caja c/X
      pharmaceuticalForm: med.presentation.split(' ')[0] || 'Tableta', // Heurística simple, editable
      dosage: med.concentration || '',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      route: 'Oral',
      instructions: ''
    };
    setMedications([...medications, newMed]);
    setSearchTerm('');
    setSuggestions([]);
  };

  const selectProcedure = (proc: PriceItem) => {
     setSelectedProcedures([...selectedProcedures, proc]);
     setSearchTerm('');
     setProcSuggestions([]);
  };

  const addManualTreatment = () => {
    const newMed: ExtendedMedication = {
      id: `TRAT-${Date.now()}`,
      name: 'NUEVO TRATAMIENTO',
      genericName: '',
      pharmaceuticalForm: 'Tableta',
      dosage: '',
      frequency: '',
      duration: '',
      route: 'Oral',
      instructions: '',
      presentation: 'Caja'
    };
    setMedications([...medications, newMed]);
  };

  const updateMed = (mid: string, field: keyof ExtendedMedication, value: string) => {
    setMedications(medications.map(m => m.id === mid ? { ...m, [field]: value } : m));
  };

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const handleSaveToExpedient = () => {
    if (medications.length === 0 && selectedProcedures.length === 0) {
      alert("Debe agregar al menos un medicamento o procedimiento para guardar.");
      return;
    }
    
    if(!prescriptionData.diagnostico) {
        alert("El diagnóstico es obligatorio por ley.");
        return;
    }

    const newNote: ClinicalNote = {
      id: `RECETA-${Date.now()}`,
      patientId: patient!.id,
      type: 'Receta Médica Electrónica',
      date: new Date().toLocaleString('es-MX'),
      author: doctorInfo.name,
      content: {
        diagnosis: prescriptionData.diagnostico,
        cieCode: prescriptionData.cieCode,
        meds: medications,
        procedures: selectedProcedures,
        instructions: prescriptionData.indicaciones,
        alarmSigns: prescriptionData.alarmSigns,
        nextAppointment: prescriptionData.nextAppointment,
        folio: prescriptionData.folio,
        vitals: vitals
      },
      isSigned: true,
      hash: `CERT-REC-${Math.random().toString(36).substr(2, 10).toUpperCase()}`
    };

    onSaveNote(newNote);

    // GENERAR CARGOS PENDIENTES AUTOMÁTICOS
    if (patient && onUpdatePatient) {
        const pendingCharges: ChargeItem[] = [];
        
        // Procesar medicamentos
        medications.forEach(med => {
            const priceItem = prices.find(p => p.name === med.name || p.name.includes(med.name));
            const unitPrice = priceItem ? priceItem.price : 0;
            const tax = priceItem ? (unitPrice * priceItem.taxPercent / 100) : 0;
            
            pendingCharges.push({
                id: generateId('CHG'),
                date: new Date().toISOString(),
                concept: med.name,
                quantity: 1, 
                unitPrice: unitPrice,
                tax: tax,
                total: unitPrice + tax,
                type: 'Farmacia',
                status: 'Pendiente',
                linkedInventoryId: priceItem?.linkedInventoryId
            });
        });

        // Procesar Procedimientos
        selectedProcedures.forEach(proc => {
            const tax = proc.price * proc.taxPercent / 100;
            pendingCharges.push({
                id: generateId('CHG'),
                date: new Date().toISOString(),
                concept: proc.name,
                quantity: 1,
                unitPrice: proc.price,
                tax: tax,
                total: proc.price + tax,
                type: 'Honorarios',
                status: 'Pendiente',
                linkedSupplies: proc.linkedSupplies
            });
        });

        // Actualizar paciente con cargos pendientes si hay
        if (pendingCharges.length > 0) {
            onUpdatePatient({
                ...patient,
                paymentStatus: 'Pendiente', // Bloquear auxiliares si es necesario
                pendingCharges: [...(patient.pendingCharges || []), ...pendingCharges]
            });
        }
    }

    setIsSaved(true);
    setIsPreview(true);
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl z-[300] animate-in slide-in-from-bottom-4';
    toast.innerHTML = 'Receta certificada y cargos generados en caja';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  if (!patient) return null;

  return (
    <div className="max-w-7xl mx-auto pb-32 animate-in fade-in">
      {/* TOOLBAR */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-2xl mb-8 flex flex-wrap items-center justify-between gap-4 no-print sticky top-20 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => isSaved ? navigate(`/patient/${id}`) : navigate(-1)} 
            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl"
          >
            <ChevronLeft size={20}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Recetario Médico Profesional</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Cumplimiento NOM-024 / COFEPRIS</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
           {!isPreview && !isSaved && (
             <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                   <button onClick={() => setSearchType('med')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${searchType === 'med' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Fármacos</button>
                   <button onClick={() => setSearchType('proc')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${searchType === 'proc' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Procedimientos</button>
                </div>
                <div className="relative">
                   <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                   <input 
                     className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white w-64 shadow-sm transition-all focus:ring-2 focus:ring-blue-100" 
                     placeholder={searchType === 'med' ? "Buscar fármaco..." : "Buscar servicio/procedimiento..."}
                     value={searchTerm} 
                     onChange={e => handleSearch(e.target.value)} 
                   />
                   
                   {/* Resultados de búsqueda */}
                   {(suggestions.length > 0 || procSuggestions.length > 0) && (
                     <div className="absolute top-full left-0 w-96 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in zoom-in-95 max-h-80 overflow-y-auto custom-scrollbar">
                        {searchType === 'med' ? suggestions.map(s => (
                          <button key={s.id} onClick={() => selectMedFromDB(s)} className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group">
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-900">{s.name}</p>
                               <p className="text-[8px] text-slate-400 font-bold uppercase">{s.genericName}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${s.totalStock > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                               {s.totalStock > 0 ? `Stock: ${s.totalStock}` : 'Agotado (Ext.)'}
                            </div>
                          </button>
                        )) : procSuggestions.map(p => (
                          <button key={p.id} onClick={() => selectProcedure(p)} className="w-full text-left p-4 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group">
                            <div>
                               <p className="text-[10px] font-black uppercase text-indigo-900">{p.name}</p>
                               <p className="text-[8px] text-slate-400 font-bold uppercase">{p.category}</p>
                            </div>
                            <div className="text-[9px] font-black text-indigo-600">${p.price}</div>
                          </button>
                        ))}
                     </div>
                   )}
                </div>
                {searchType === 'med' && <button onClick={addManualTreatment} className="px-5 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-black text-[9px] uppercase hover:bg-white transition-all">+ Manual</button>}
             </div>
           )}
           
           {!isSaved ? (
              <button 
                onClick={handleSaveToExpedient}
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 transition-all flex items-center gap-3"
              >
                <FileCheck size={18} /> Certificar Receta
              </button>
           ) : (
              <button 
                onClick={() => navigate(`/patient/${id}`)}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 transition-all flex items-center gap-3"
              >
                Finalizar y Salir <ArrowRight size={18} />
              </button>
           )}

           {isSaved && (
             <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-blue-600 transition-all">
                <Printer size={20}/>
             </button>
           )}
        </div>
      </div>

      {!isPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            {/* ALERTA DE ALERGIAS */}
            <div className={`p-4 rounded-[2rem] border-2 flex items-center gap-4 ${patient.allergies.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`p-2 rounded-xl ${patient.allergies.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-400'}`}>
                    <AlertOctagon size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alergias Registradas</p>
                    <p className={`text-sm font-black uppercase ${patient.allergies.length > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                        {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Negadas'}
                    </p>
                </div>
            </div>

            {/* BARRA DE VITALES RAPIDA */}
            <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-lg flex justify-between items-center overflow-x-auto no-scrollbar gap-4">
                {[
                   { l: 'Peso', v: vitals?.weight + ' kg', i: <Scale size={14}/> },
                   { l: 'Talla', v: vitals?.height + ' cm', i: <Activity size={14}/> },
                   { l: 'IMC', v: vitals?.bmi, i: <Activity size={14}/> },
                   { l: 'Temp', v: vitals?.temp + '°C', i: <Thermometer size={14}/> },
                   { l: 'T.A.', v: vitals?.bp, i: <Heart size={14}/> },
                ].map(v => (
                    <div key={v.l} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/5 min-w-[100px]">
                        {v.i}
                        <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{v.l}</p>
                            <p className="text-xs font-black">{v.v || '--'}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Pill size={24} /></div>
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Manejo Terapéutico (Rp.)</h3>
              </div>
              
              <div className="space-y-4">
                {medications.map((m, idx) => (
                  <div key={m.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-5 group animate-in slide-in-from-right-2">
                    <div className="flex justify-between items-center">
                       <div className="flex-1 space-y-2">
                           <div className="flex gap-2">
                               <span className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px] mt-1">{idx + 1}</span>
                               <div className="flex-1">
                                   <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Nombre Comercial</label>
                                   <input className="bg-transparent border-b border-slate-300 p-1 text-[13px] font-black text-slate-900 uppercase w-full outline-none focus:border-blue-500" value={m.name} onChange={e => updateMed(m.id, 'name', e.target.value.toUpperCase())} placeholder="Nombre Comercial" />
                               </div>
                           </div>
                           <div className="ml-8">
                                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Sustancia Activa (Genérico)</label>
                                <input className="bg-transparent border-b border-slate-300 p-1 text-xs font-bold text-slate-600 uppercase w-full outline-none focus:border-blue-500" value={m.genericName} onChange={e => updateMed(m.id, 'genericName', e.target.value.toUpperCase())} placeholder="Nombre Genérico" />
                           </div>
                       </div>
                       <button onClick={() => setMedications(medications.filter(med => med.id !== m.id))} className="text-slate-300 hover:text-rose-600 transition-all p-3"><Trash2 size={18} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                       {[
                         { f: 'pharmaceuticalForm', l: 'Forma Farm.', p: 'Tableta, Jarabe' },
                         { f: 'dosage', l: 'Dosis / Conc.', p: '500 mg' },
                         { f: 'presentation', l: 'Presentación', p: 'Caja c/30' },
                         { f: 'route', l: 'Vía Admin.', p: 'Oral' },
                         { f: 'duration', l: 'Duración', p: '7 días' }
                       ].map(item => (
                         <div key={item.f} className="space-y-1.5">
                            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block ml-1">{item.l}</label>
                            {item.f === 'route' ? (
                                <select 
                                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-blue-600 shadow-sm"
                                    value={(m as any)[item.f]} 
                                    onChange={e => updateMed(m.id, item.f as any, e.target.value)}
                                >
                                    <option>Oral</option><option>Intramuscular</option><option>Intravenosa</option><option>Subcutánea</option><option>Tópica</option><option>Oftálmica</option><option>Ótica</option><option>Nasal</option><option>Rectal</option><option>Vaginal</option>
                                </select>
                            ) : (
                                <input 
                                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-blue-600 shadow-sm" 
                                    value={(m as any)[item.f]} 
                                    onChange={e => updateMed(m.id, item.f as any, e.target.value)} 
                                    placeholder={item.p}
                                />
                            )}
                         </div>
                       ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block ml-1">Frecuencia (Cada cuánto)</label>
                           <input className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-emerald-300 shadow-sm" placeholder="Ej: Cada 8 horas" value={m.frequency} onChange={e => updateMed(m.id, 'frequency', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block ml-1">Instrucciones Específicas</label>
                           <input className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-medium italic outline-none focus:border-emerald-300 shadow-sm" placeholder="Ej: Tomar con alimentos..." value={m.instructions} onChange={e => updateMed(m.id, 'instructions', e.target.value)} />
                        </div>
                    </div>
                  </div>
                ))}
                
                {/* LISTA DE PROCEDIMIENTOS SELECCIONADOS (SUTIL) */}
                {selectedProcedures.length > 0 && (
                   <div className="space-y-2 pt-4">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-2 flex items-center gap-1"><Stethoscope size={10}/> Procedimientos / Servicios Adicionales</p>
                      {selectedProcedures.map((proc, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <span className="text-[10px] font-bold text-indigo-900 uppercase">{proc.name}</span>
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] font-black text-indigo-700">${proc.price}</span>
                               <button onClick={() => setSelectedProcedures(selectedProcedures.filter((_, idx) => idx !== i))} className="text-indigo-400 hover:text-rose-500"><X size={14}/></button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}

                {medications.length === 0 && selectedProcedures.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                        <Pill size={48} className="mx-auto mb-4 text-slate-400" />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Utilice el buscador superior para agregar fármacos o procedimientos</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm space-y-6 sticky top-32">
               <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-3">
                  <ClipboardList size={18} /> Datos de la Receta
               </h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Diagnóstico (CIE-10)</label>
                     <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none h-24 focus:bg-white focus:border-blue-300 resize-none" value={prescriptionData.diagnostico} onChange={e => setPrescriptionData({...prescriptionData, diagnostico: e.target.value})} placeholder="Diagnóstico principal..." />
                     <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-mono uppercase outline-none" value={prescriptionData.cieCode} onChange={e => setPrescriptionData({...prescriptionData, cieCode: e.target.value})} placeholder="Código CIE-10 (Opcional)" />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Medidas Generales y Dieta</label>
                     <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-medium uppercase outline-none h-32 focus:bg-white focus:border-blue-300 resize-none" value={prescriptionData.indicaciones} onChange={e => setPrescriptionData({...prescriptionData, indicaciones: e.target.value})} placeholder="Dieta, cuidados generales, ejercicio..." />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1"><AlertCircle size={10}/> Signos de Alarma</label>
                     <textarea className="w-full bg-rose-50 border border-rose-100 p-4 rounded-2xl text-[11px] font-medium uppercase outline-none h-20 resize-none text-rose-900 placeholder:text-rose-300" value={prescriptionData.alarmSigns} onChange={e => setPrescriptionData({...prescriptionData, alarmSigns: e.target.value})} placeholder="Acudir a urgencias si presenta..." />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1"><Calendar size={10}/> Próxima Cita</label>
                     <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold uppercase outline-none" value={prescriptionData.nextAppointment} onChange={e => setPrescriptionData({...prescriptionData, nextAppointment: e.target.value})} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-2xl rounded-[3.5rem] overflow-hidden flex flex-col print:shadow-none print:rounded-none">
           {/* El componente de impresión PrescriptionDoc se reutiliza aquí */}
           <PrescriptionDoc patient={patient} vitals={vitals} meds={medications} procedures={selectedProcedures} data={prescriptionData} doctor={doctorInfo} label="ORIGINAL - FARMACIA / PACIENTE" />
           <div className="h-12 bg-slate-50 flex items-center justify-center no-print border-y border-slate-100 relative">
              <div className="w-full border-t-2 border-dashed border-slate-300 mx-10"></div>
              <span className="absolute px-8 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <Landmark size={12} /> Copia Expediente
              </span>
           </div>
           <PrescriptionDoc patient={patient} vitals={vitals} meds={medications} procedures={selectedProcedures} data={prescriptionData} doctor={doctorInfo} label="COPIA - EXPEDIENTE" />
        </div>
      )}
    </div>
  );
};

const PrescriptionDoc = ({ patient, vitals, meds, procedures, data, doctor, label }: any) => (
  <div className="relative p-12 bg-white flex flex-col border-b border-slate-100 last:border-b-0 print:p-10 print:h-[50vh] print:border-none">
     {/* HEADER LEGAL (DOCTOR INFO) */}
     <div className="flex justify-between border-b-4 border-slate-900 pb-6 mb-6">
        <div className="flex gap-6">
           <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg print:border print:border-black print:text-black print:bg-transparent"><Heart size={32} /></div>
           <div className="space-y-0.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{doctor.name}</h2>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{doctor.specialty}</p>
              <div className="pt-2 text-[8px] font-medium text-slate-600 uppercase leading-tight space-y-0.5">
                 <p><span className="font-bold">Cédula Prof:</span> {doctor.cedula}</p>
                 <p><span className="font-bold">Título expedido por:</span> {doctor.institution}</p>
                 <p><span className="font-bold">Dirección:</span> {doctor.address} • Tel: {doctor.phone}</p>
              </div>
           </div>
        </div>
        <div className="text-right flex flex-col justify-between items-end">
           <QrCode size={48} className="text-slate-900 opacity-90" />
           <div className="mt-2 text-right">
              <p className="text-[11px] font-black text-slate-900 tracking-tighter uppercase leading-none">FOLIO: {data.folio}</p>
              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{data.fecha}</p>
           </div>
        </div>
     </div>

     {/* PATIENT DATA & SOMATOMETRY */}
     <div className="mb-6 border border-slate-300 rounded-xl p-3 flex flex-wrap gap-y-2 text-[9px] uppercase">
        <div className="w-full flex justify-between border-b border-slate-200 pb-2 mb-2">
            <div><span className="font-bold text-slate-500">Paciente:</span> <span className="font-black text-slate-900 text-sm ml-1">{patient.name}</span></div>
            <div><span className="font-bold text-slate-500">Edad:</span> <span className="font-black ml-1">{patient.age} Años</span></div>
            <div><span className="font-bold text-slate-500">Sexo:</span> <span className="font-black ml-1">{patient.sex}</span></div>
        </div>
        
        {/* Vitales Inline */}
        <div className="flex gap-4 w-full">
            <span><b className="text-slate-500">Peso:</b> {vitals?.weight} kg</span>
            <span><b className="text-slate-500">Talla:</b> {vitals?.height} cm</span>
            <span><b className="text-slate-500">IMC:</b> {vitals?.bmi}</span>
            <span><b className="text-slate-500">Temp:</b> {vitals?.temp}°C</span>
            <span><b className="text-slate-500">T.A.:</b> {vitals?.bp}</span>
            <span><b className="text-slate-500">SatO2:</b> {vitals?.o2}%</span>
        </div>
        
        {/* Alergias Warning */}
        <div className="w-full mt-2 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-500">Alergias:</span> <span className="font-black text-rose-600">{patient.allergies?.join(', ') || 'NEGADAS'}</span>
        </div>

        {/* Diagnóstico */}
        <div className="w-full mt-1">
            <span className="font-bold text-slate-500">Diagnóstico (CIE-10):</span> <span className="font-black ml-1">{data.diagnostico} {data.cieCode ? `(${data.cieCode})` : ''}</span>
        </div>
     </div>

     <div className="flex-1 flex gap-8">
        <div className="flex-1 space-y-6">
           {/* BODY: MEDICATIONS */}
           <div className="space-y-4 min-h-[150px]">
              <div className="flex items-center gap-3 mb-2">
                 <span className="text-[24px] font-black text-slate-900 italic font-serif">Rx.</span>
              </div>
              <div className="space-y-5">
                 {meds.map((m: any, idx: number) => (
                    <div key={m.id} className="relative pl-6 border-l-2 border-slate-200">
                       <span className="absolute -left-[9px] top-0 font-black text-slate-400 text-xs bg-white py-1">{idx + 1}</span>
                       <div className="text-[11px] font-black text-slate-900 uppercase leading-snug">
                          {m.genericName} <span className="font-medium text-slate-600">({m.name})</span>
                       </div>
                       <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                          {m.pharmaceuticalForm} • {m.dosage} • {m.presentation}
                       </div>
                       <div className="text-[10px] font-black text-slate-800 uppercase mt-1 bg-slate-50 p-2 rounded border border-slate-100 print:bg-transparent print:border-none print:p-0 print:mt-0.5">
                         {m.dosage} VIA {m.route}, {m.frequency} DURANTE {m.duration}.
                       </div>
                       {m.instructions && <p className="text-[9px] text-slate-600 italic mt-0.5 leading-tight">Nota: {m.instructions}</p>}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: INDICATIONS & APPOINTMENT */}
        <div className="w-1/3 border-l border-slate-200 pl-8 flex flex-col justify-between">
             <div className="space-y-6">
                 {data.indicaciones && (
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Medidas Generales / Dieta</p>
                        <p className="text-[9px] font-medium text-slate-800 uppercase leading-relaxed">{data.indicaciones}</p>
                     </div>
                 )}
                 {data.alarmSigns && (
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Signos de Alarma</p>
                        <p className="text-[9px] font-bold text-slate-800 uppercase leading-relaxed">{data.alarmSigns}</p>
                     </div>
                 )}
                 {procedures && procedures.length > 0 && (
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Procedimientos Realizados</p>
                        {procedures.map((p: any, i: number) => (
                           <p key={i} className="text-[9px] font-bold text-slate-700 uppercase">• {p.name}</p>
                        ))}
                    </div>
                 )}
             </div>

             <div className="mt-8 pt-4 border-t border-slate-200">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Próxima Cita</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{data.nextAppointment || 'Abierta / PRN'}</p>
             </div>
        </div>
     </div>

     <div className="mt-auto pt-8 flex justify-between items-end">
        <div className="space-y-2">
           <div className="px-4 py-1 bg-slate-100 text-slate-600 rounded text-[7px] font-black uppercase tracking-widest w-fit border border-slate-200">
              Receta Médica Privada
           </div>
           <p className="text-[8px] font-black text-slate-300 uppercase">{label}</p>
        </div>
        <div className="text-center space-y-1">
           <div className="w-48 h-[1px] bg-slate-900 mx-auto"></div>
           <p className="text-[10px] font-black text-slate-900 uppercase leading-none mt-2">Firma del Médico</p>
        </div>
     </div>
  </div>
);

export default Prescription;
