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
  X
} from 'lucide-react';
import { Patient, MedicationPrescription, MedicationStock, Vitals, DoctorInfo, ClinicalNote, PriceItem, PriceType } from '../types';
import { VADEMECUM_DB, INITIAL_STOCK, INITIAL_PRICES } from '../constants';

const Prescription: React.FC<{ patients: Patient[], doctorInfo: DoctorInfo, onSaveNote: (n: ClinicalNote) => void }> = ({ patients, doctorInfo, onSaveNote }) => {
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

  const [medications, setMedications] = useState<MedicationPrescription[]>(dataFromNote?.meds || []);
  const [prescriptionData, setPrescriptionData] = useState({
    diagnostico: dataFromNote?.diagnosis || '',
    cieCode: dataFromNote?.cieCode || '',
    indicaciones: dataFromNote?.generalPlan || '',
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
    const newMed: MedicationPrescription = {
      id: `MED-${Date.now()}`,
      name: med.name,
      genericName: med.genericName,
      presentation: med.presentation,
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
    const newMed: MedicationPrescription = {
      id: `TRAT-${Date.now()}`,
      name: 'NUEVO TRATAMIENTO / INSUMO',
      genericName: '',
      dosage: '',
      frequency: '',
      duration: '',
      route: 'N/A',
      instructions: ''
    };
    setMedications([...medications, newMed]);
  };

  const updateMed = (mid: string, field: keyof MedicationPrescription, value: string) => {
    setMedications(medications.map(m => m.id === mid ? { ...m, [field]: value } : m));
  };

  const handleSaveToExpedient = () => {
    if (medications.length === 0 && selectedProcedures.length === 0) {
      alert("Debe agregar al menos un medicamento o procedimiento para guardar.");
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
        procedures: selectedProcedures, // Guardamos procedimientos
        instructions: prescriptionData.indicaciones,
        folio: prescriptionData.folio,
        vitals: vitals
      },
      isSigned: true,
      hash: `CERT-REC-${Math.random().toString(36).substr(2, 10).toUpperCase()}`
    };

    onSaveNote(newNote);
    setIsSaved(true);
    setIsPreview(true);
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl z-[300] animate-in slide-in-from-bottom-4';
    toast.innerHTML = 'Receta registrada en el Historial del Paciente';
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
                <FileCheck size={18} /> Guardar en Expediente
              </button>
           ) : (
              <button 
                onClick={() => navigate(`/patient/${id}`)}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 transition-all flex items-center gap-3"
              >
                Finalizar y Ver Expediente <ArrowRight size={18} />
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
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Pill size={24} /></div>
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Manejo Terapéutico (Rp.)</h3>
              </div>
              
              <div className="space-y-4">
                {medications.map((m, idx) => (
                  <div key={m.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-5 group animate-in slide-in-from-right-2">
                    <div className="flex justify-between items-center">
                       <div className="flex-1 flex items-center gap-4">
                          <span className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">{idx + 1}</span>
                          <input className="bg-transparent border-none p-0 text-[13px] font-black text-slate-900 uppercase w-full outline-none focus:ring-0" value={m.name} onChange={e => updateMed(m.id, 'name', e.target.value.toUpperCase())} />
                       </div>
                       <button onClick={() => setMedications(medications.filter(med => med.id !== m.id))} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {[
                         { f: 'dosage', l: 'Dosis' },
                         { f: 'frequency', l: 'Frecuencia' },
                         { f: 'route', l: 'Vía' },
                         { f: 'duration', l: 'Duración' }
                       ].map(item => (
                         <div key={item.f} className="space-y-1.5">
                            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block ml-1">{item.l}</label>
                            <input className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-blue-600 shadow-sm" value={(m as any)[item.f]} onChange={e => updateMed(m.id, item.f as any, e.target.value)} />
                         </div>
                       ))}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block ml-1">Instrucciones precisas</label>
                       <input className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-medium italic outline-none focus:border-emerald-300 shadow-sm" placeholder="Instrucciones..." value={m.instructions} onChange={e => updateMed(m.id, 'instructions', e.target.value)} />
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
            <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-8 sticky top-32 border-b-[10px] border-blue-600">
               <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-3">
                  <ClipboardList size={18} /> Datos de Receta
               </h3>
               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Diagnóstico (CIE-11)</label>
                     <textarea className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[11px] font-black uppercase outline-none h-20 focus:bg-white/10" value={prescriptionData.diagnostico} onChange={e => setPrescriptionData({...prescriptionData, diagnostico: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Indicaciones Generales</label>
                     <textarea className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[11px] font-medium italic outline-none h-36 focus:bg-white/10" value={prescriptionData.indicaciones} onChange={e => setPrescriptionData({...prescriptionData, indicaciones: e.target.value})} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-2xl rounded-[3.5rem] overflow-hidden flex flex-col print:shadow-none print:rounded-none">
           {/* El componente de impresión PrescriptionDoc se reutiliza aquí */}
           <PrescriptionDoc patient={patient} vitals={vitals} meds={medications} procedures={selectedProcedures} data={prescriptionData} doctor={doctorInfo} label="ORIGINAL - EXPEDIENTE" />
           <div className="h-12 bg-slate-50 flex items-center justify-center no-print border-y border-slate-100 relative">
              <div className="w-full border-t-2 border-dashed border-slate-300 mx-10"></div>
              <span className="absolute px-8 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <Landmark size={12} /> Copia Paciente / Farmacia
              </span>
           </div>
           <PrescriptionDoc patient={patient} vitals={vitals} meds={medications} procedures={selectedProcedures} data={prescriptionData} doctor={doctorInfo} label="COPIA - PACIENTE" />
        </div>
      )}
    </div>
  );
};

const PrescriptionDoc = ({ patient, vitals, meds, procedures, data, doctor, label }: any) => (
  <div className="relative p-12 bg-white flex flex-col border-b border-slate-100 last:border-b-0 print:p-10 print:h-[50vh]">
     <div className="flex justify-between border-b-4 border-slate-900 pb-6 mb-8">
        <div className="flex gap-6">
           <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><Heart size={32} /></div>
           <div className="space-y-0.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{doctor.hospital}</h2>
              <p className="text-[8px] font-bold text-slate-500 uppercase">{doctor.address} • Tel: {doctor.phone}</p>
              <div className="pt-2">
                 <p className="text-[13px] font-black text-slate-900 uppercase leading-none">Dr. {doctor.name}</p>
                 <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">{doctor.specialty} • Cédula Prof: {doctor.cedula} • {doctor.institution}</p>
              </div>
           </div>
        </div>
        <div className="text-right flex flex-col justify-between items-end">
           <QrCode size={48} className="text-slate-900 opacity-90" />
           <div className="mt-2">
              <p className="text-[11px] font-black text-slate-900 tracking-tighter uppercase leading-none">FOLIO: {data.folio}</p>
              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{data.fecha}</p>
           </div>
        </div>
     </div>

     <div className="flex gap-10">
        <div className="w-24 bg-slate-50 border border-slate-200 rounded-[2rem] p-4 space-y-4 shrink-0 h-fit">
           <p className="text-[7px] font-black text-slate-400 uppercase text-center border-b border-slate-200 pb-2">Somatometría</p>
           {[
             { l: 'T.A.', v: vitals?.bp || '--/--' },
             { l: 'F.C.', v: vitals?.hr || '--' },
             { l: 'T°', v: vitals?.temp || '--' },
             { l: 'SpO2', v: vitals?.o2 || '--' }
           ].map(v => (
             <div key={v.l} className="text-center">
                <span className="text-[6px] font-black text-slate-400 uppercase block leading-none">{v.l}</span>
                <p className="text-[12px] font-black text-slate-900">{v.v}</p>
             </div>
           ))}
        </div>

        <div className="flex-1 space-y-6">
           <div className="grid grid-cols-3 gap-6 border-b border-slate-100 pb-4">
              <div className="col-span-2 space-y-1">
                 <label className="text-[7px] font-black text-slate-400 uppercase block">Paciente</label>
                 <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{patient.name}</p>
              </div>
              <div className="text-right space-y-1">
                 <label className="text-[7px] font-black text-slate-400 uppercase block">Edad / Sexo</label>
                 <p className="text-[12px] font-bold text-slate-700 uppercase">{patient.age} AÑOS / {patient.sex}</p>
              </div>
           </div>

           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnóstico Médico</p>
              <p className="text-[10px] font-black text-slate-900 uppercase leading-snug">
                 {data.diagnostico || 'DIAGNÓSTICO RESERVADO'}
              </p>
           </div>

           <div className="space-y-5 min-h-[150px]">
              <div className="flex items-center gap-3 mb-4">
                 <span className="text-[18px] font-black text-slate-900 italic">Rp.</span>
                 <div className="h-[2px] flex-1 bg-slate-900/5"></div>
              </div>
              <div className="space-y-6">
                 {meds.map((m: any, idx: number) => (
                    <div key={m.id} className="relative pl-8">
                       <span className="absolute left-0 top-0 font-black text-slate-200 text-2xl">{idx + 1}</span>
                       <p className="text-[12px] font-black text-slate-900 uppercase leading-none">
                          {m.genericName || m.name} <span className="text-[9px] text-slate-500 font-bold italic">({m.name})</span>
                       </p>
                       <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                         {m.dosage} {m.frequency} VÍA {m.route} DURANTE {m.duration}.
                       </p>
                       {m.instructions && <p className="text-[9px] text-blue-700 italic font-bold mt-1 leading-none">{m.instructions}</p>}
                    </div>
                 ))}
              </div>
           </div>
           
           {/* Sección de Procedimientos en Impresión */}
           {procedures && procedures.length > 0 && (
              <div className="space-y-3 pt-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Procedimientos Realizados / Solicitados</p>
                 <div className="space-y-1">
                    {procedures.map((p: any, i: number) => (
                       <p key={i} className="text-[10px] font-bold text-slate-700 uppercase">• {p.name}</p>
                    ))}
                 </div>
              </div>
           )}

           <div className="pt-4 border-t-2 border-slate-100">
              <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                 <ClipboardList size={10} className="text-blue-600" /> Indicaciones
              </h4>
              <p className="text-[10px] text-slate-600 italic font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 uppercase">
                 "{data.indicaciones || 'Vigilancia estrecha de síntomas.'}"
              </p>
           </div>
        </div>
     </div>

     <div className="mt-auto pt-6 border-t-2 border-slate-900 flex justify-between items-end">
        <div className="space-y-3">
           <div className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[7px] font-black uppercase tracking-[0.2em] flex items-center gap-3 w-fit">
              <ShieldCheck size={14} className="text-blue-400" /> Receta Certificada digitalmente
           </div>
           <p className="text-[8px] font-black text-slate-400 uppercase">{label}</p>
        </div>
        <div className="text-center space-y-1">
           <div className="w-56 h-[1px] bg-slate-900 mx-auto"></div>
           <p className="text-[12px] font-black text-slate-900 uppercase leading-none mt-1">Dr. {doctor.name}</p>
           <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Firma Médica Autorizada</p>
        </div>
     </div>
  </div>
);

export default Prescription;