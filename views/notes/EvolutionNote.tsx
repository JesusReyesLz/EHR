
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, Save, Activity, Stethoscope, BookOpen, 
  Lock, Pill, HeartPulse, Droplet, Thermometer, Wind,
  ClipboardList, Calendar, MessageSquare, AlertCircle, Info, 
  Search, Trash2, PlusCircle, Quote, FlaskConical, Zap, Repeat, ShieldAlert,
  Clock, Clipboard, X, Heart, AlertTriangle, CheckCircle2, Maximize2, Scale, Ruler
} from 'lucide-react';
import { Patient, ClinicalNote, Vitals, MedicationPrescription, MedicationStock, PriceItem, PriceType } from '../../types';
import { VADEMECUM_DB, INITIAL_STOCK, INITIAL_PRICES } from '../../constants';

const EvolutionNote: React.FC<{ patients: Patient[], notes: ClinicalNote[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, notes, onSaveNote }) => {
  const { id, noteId } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // Cargar inventario real
  const inventory: MedicationStock[] = useMemo(() => {
    const saved = localStorage.getItem('med_inventory_v6');
    let data = saved ? JSON.parse(saved) : INITIAL_STOCK;
    if (data.length > 0 && !data[0].batches) {
        data = data.map((item: any) => ({
            ...item,
            batches: [{ id: `BATCH-${Date.now()}`, batchNumber: item.batch || 'S/L', expiryDate: item.expiryDate || '', currentStock: item.currentStock || 0 }]
        }));
    }
    return data;
  }, []);

  const prices: PriceItem[] = useMemo(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  }, []);

  const [form, setForm] = useState({
    mainProblem: '',
    secondaryProblems: '',
    cieCode: 'CIE-11: ',
    subjectiveNarrative: '', 
    objectivePhysical: '', 
    objectiveResults: '', 
    vitalsInterpretation: 'Estable / Sin eventualidades',
    analysisReasoning: '', 
    differentialDiagnosis: '', 
    pronosticoVida: 'Bueno',
    pronosticoFuncion: 'Bueno',
    pronosticoRecuperacion: 'Bueno',
    nursingInstructions: '',
    nonPharmaPlan: '',
    medConciliation: '',
    pharmacovigilance: 'Vigilar reacciones adversas comunes.',
    seguimiento: 'Cita de control en 7 días.',
  });

  const [medications, setMedications] = useState<MedicationPrescription[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<(MedicationStock & { inStock: number })[]>([]);
  const [procSuggestions, setProcSuggestions] = useState<PriceItem[]>([]);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  
  // Toggle para buscar fármacos o procedimientos
  const [searchType, setSearchType] = useState<'med' | 'proc'>('med');
  
  // Estado para secciones expandidas
  const [fullScreenSection, setFullScreenSection] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setVitals(patient.currentVitals || null);
      if (noteId) {
        const existing = notes.find(n => n.id === noteId);
        if (existing) {
          setForm(existing.content as any);
          setMedications(existing.content.prescriptions || []);
          setSelectedProcedures(existing.content.procedures || []);
        }
      }
    }
  }, [patient, noteId, notes]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    if (val.length <= 1) {
       setSuggestions([]);
       setProcSuggestions([]);
       return;
    }

    const term = val.toLowerCase();

    if (searchType === 'med') {
      const stockMatches = inventory.filter(i => 
        i.name.toLowerCase().includes(term) || i.genericName.toLowerCase().includes(term)
      ).map(i => ({ ...i, inStock: (i.batches || []).reduce((acc, b) => acc + b.currentStock, 0) }));

      const catalogMatches = VADEMECUM_DB.filter(v => 
        (v.name.toLowerCase().includes(term) || v.genericName.toLowerCase().includes(term)) &&
        !stockMatches.some(s => s.name === v.name)
      ).map(v => ({ ...v, inStock: 0 }));

      setSuggestions([...stockMatches, ...catalogMatches]);
    } else {
      // Buscar Procedimientos
      const serviceMatches = prices.filter(p => 
         p.type === PriceType.SERVICE && 
         (p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
      );
      setProcSuggestions(serviceMatches);
    }
  };

  const addMed = (med?: MedicationStock & { inStock?: number }) => {
    if (med && (med.inStock === undefined || med.inStock <= 0)) {
      if (!window.confirm(`⚠️ STOCK AGOTADO: El medicamento ${med.name} no tiene existencias.\n\n¿Desea agregarlo al plan terapéutico para compra externa?`)) return;
    }

    const newMed: MedicationPrescription = {
      id: `MED-${Date.now()}`,
      name: med?.name || 'NUEVO FÁRMACO / INSUMO',
      genericName: med?.genericName || '',
      dosage: med?.concentration || '',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      route: 'Oral',
      instructions: ''
    };
    setMedications([...medications, newMed]);
    setSearchTerm('');
    setSuggestions([]);
  };

  const addProcedure = (proc: PriceItem) => {
     setSelectedProcedures([...selectedProcedures, proc]);
     setSearchTerm('');
     setProcSuggestions([]);
  };

  const removeMed = (mid: string) => setMedications(medications.filter(m => m.id !== mid));
  const removeProc = (pid: string) => setSelectedProcedures(selectedProcedures.filter(p => p.id !== pid));

  const updateMed = (mid: string, field: keyof MedicationPrescription, value: string) => {
    setMedications(medications.map(m => m.id === mid ? { ...m, [field]: value } : m));
  };

  const handleSave = (finalize: boolean = false, goToPrescription: boolean = false) => {
    if (!form.mainProblem || !form.analysisReasoning) {
      alert("Diagnóstico Principal y Análisis Clínico son obligatorios.");
      return;
    }

    const currentNoteId = noteId || `EVO-${Date.now()}`;
    const newNote: ClinicalNote = {
      id: currentNoteId,
      patientId: patient?.id || '',
      type: 'Nota de Evolución PSOAP',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { 
         ...form, 
         vitals, 
         prescriptions: medications, 
         procedures: selectedProcedures // Guardamos procedimientos
      },
      isSigned: finalize,
      hash: finalize ? `CERT-EVO-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
    };
    
    onSaveNote(newNote);

    if (goToPrescription) {
      navigate(`/patient/${id}/prescription`, { 
        state: { 
          diagnosis: form.mainProblem, 
          meds: medications,
          generalPlan: form.nonPharmaPlan,
          cieCode: form.cieCode
        } 
      });
    } else {
      navigate(`/patient/${id}`, { state: finalize ? { openNoteId: currentNoteId } : {} });
    }
  };

  const SectionHeader = ({ title, icon, onExpand }: { title: string, icon: React.ReactNode, onExpand?: () => void }) => (
    <div className="flex justify-between items-center mb-2">
      <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
         {icon} {title}
      </label>
      {onExpand && (
        <button onClick={onExpand} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Expandir sección">
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );

  const FullScreenModal = ({ title, value, onChange, onClose }: any) => (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
        <button onClick={onClose} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={24} /></button>
      </div>
      <textarea 
        className="flex-1 w-full p-6 text-lg font-medium leading-relaxed bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 resize-none shadow-inner text-slate-900"
        value={value}
        onChange={onChange}
        autoFocus
        placeholder="Escriba detalladamente..."
      />
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-sm shadow-lg hover:bg-blue-600 transition-all">Guardar y Cerrar</button>
      </div>
    </div>
  );

  if (!patient) return null;

  return (
    <div className="max-w-full mx-auto pb-20 animate-in fade-in duration-500 text-slate-900">
      {/* Header Compacto Profesional */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm mb-6 flex justify-between items-center no-print sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Nota de Evolución</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">PSOAP</span>
               <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">NOM-004-SSA3</span>
            </div>
          </div>
        </div>
        <div className="text-right">
           <p className="text-sm font-black text-slate-900 uppercase leading-none">{patient.name}</p>
           <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Exp: {patient.id}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-xl rounded-[2rem] overflow-hidden flex flex-col lg:flex-row print:border-none print:shadow-none print:rounded-none">
        
        {/* SIDEBAR IZQUIERDO: VITALES Y SEGURIDAD (Sin cambios importantes, se mantiene igual) */}
        <div className="w-full lg:w-80 bg-slate-50 border-r border-slate-200 flex flex-col print:hidden shrink-0">
           {/* ... Vitales y Seguridad ... */}
           <div className="p-6 border-b border-slate-200">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                 <Activity size={14} className="text-slate-900" /> Signos Vitales
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { l: 'T.A.', v: vitals?.bp || '--', u: 'mmHg', icon: <Activity size={12} className="text-blue-500" /> },
                   { l: 'F.C.', v: vitals?.hr || '--', u: 'lpm', icon: <HeartPulse size={12} className="text-rose-500" /> },
                   { l: 'F.R.', v: vitals?.rr || '--', u: 'rpm', icon: <Wind size={12} className="text-emerald-500" /> },
                   { l: 'Temp', v: vitals?.temp || '--', u: '°C', icon: <Thermometer size={12} className="text-amber-500" /> },
                   { l: 'SatO2', v: vitals?.o2 || '--', u: '%', icon: <Droplet size={12} className="text-cyan-500" /> },
                   { l: 'Peso', v: vitals?.weight || '--', u: 'kg', icon: <Scale size={12} className="text-indigo-500" /> },
                   { l: 'Talla', v: vitals?.height || '--', u: 'cm', icon: <Ruler size={12} className="text-violet-500" /> },
                   { l: 'IMC', v: vitals?.bmi || '--', u: '', icon: <Activity size={12} className="text-slate-400" /> }
                 ].map(item => (
                   <div key={item.l} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-1">
                         {item.icon}
                         <span className="text-[8px] font-black text-slate-400 uppercase">{item.l}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-none">
                        {item.v} <span className="text-[8px] text-slate-400 font-medium">{item.u}</span>
                      </p>
                   </div>
                 ))}
              </div>
           </div>
           {/* ... Resto del Sidebar ... */}
        </div>

        {/* CUERPO CENTRAL PSOAP */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden print:overflow-visible">
           <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 no-scrollbar print:p-0 print:overflow-visible">
              
              {/* P, S, O, A Sections (se mantienen igual) */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 print:bg-white print:border-none print:p-0">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-9 space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Diagnóstico Principal</label>
                       <input 
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-black uppercase outline-none focus:border-blue-500 shadow-sm transition-all text-slate-900" 
                          placeholder="Escriba el diagnóstico..." 
                          value={form.mainProblem} 
                          onChange={e => setForm({...form, mainProblem: e.target.value})} 
                       />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CIE-11 / CIE-10</label>
                       <input 
                          className="w-full p-3 bg-slate-900 text-white border-none rounded-xl text-xs font-black uppercase outline-none text-center shadow-md" 
                          placeholder="CÓDIGO" 
                          value={form.cieCode} 
                          onChange={e => setForm({...form, cieCode: e.target.value})} 
                       />
                    </div>
                 </div>
                 {/* ... Secondary problems ... */}
              </div>

              {/* ... S, O, A textareas ... */}
              <div>
                 <SectionHeader 
                    title="A: Análisis y Juicio Clínico" 
                    icon={<BookOpen size={16} className="text-amber-600" />} 
                    onExpand={() => setFullScreenSection('A')}
                 />
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-amber-300 transition-colors focus-within:bg-white focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-50">
                    <textarea 
                        className="w-full p-5 text-sm font-medium leading-relaxed outline-none h-32 resize-none text-slate-900 bg-white placeholder-slate-400" 
                        placeholder="Integración diagnóstica, justificación terapéutica..." 
                        value={form.analysisReasoning} 
                        onChange={e => setForm({...form, analysisReasoning: e.target.value})} 
                    />
                 </div>
              </div>

              {/* P: PLAN (Rp.) - MODIFICADO CON PROCEDIMIENTOS */}
              <div className="pt-6 border-t-2 border-slate-100">
                 <div className="flex justify-between items-center mb-4">
                    <label className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                       <Pill size={16} /> P: Plan Terapéutico (Rp.)
                    </label>
                    <div className="flex gap-2">
                       <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                          <button onClick={() => setSearchType('med')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${searchType === 'med' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Fármacos</button>
                          <button onClick={() => setSearchType('proc')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${searchType === 'proc' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Proc.</button>
                       </div>
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                          <input 
                            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-blue-400 w-64 shadow-sm transition-all"
                            placeholder={searchType === 'med' ? "Buscar Fármaco..." : "Buscar Procedimiento..."}
                            value={searchTerm}
                            onChange={e => handleSearch(e.target.value)}
                          />
                          {/* Resultados de búsqueda */}
                          {(suggestions.length > 0 || procSuggestions.length > 0) && (
                            <div className="absolute top-full right-0 w-80 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
                               {searchType === 'med' ? suggestions.map(s => (
                                  <button key={s.id} onClick={() => addMed(s)} className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group">
                                     <div>
                                        <p className="text-[10px] font-black uppercase text-slate-900">{s.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{s.genericName}</p>
                                     </div>
                                     <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${s.inStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {s.inStock > 0 ? `Stock: ${s.inStock}` : 'Agotado'}
                                     </span>
                                  </button>
                               )) : procSuggestions.map(p => (
                                  <button key={p.id} onClick={() => addProcedure(p)} className="w-full text-left p-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group">
                                     <div>
                                        <p className="text-[10px] font-black uppercase text-indigo-900">{p.name}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase">{p.category}</p>
                                     </div>
                                     <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[9px] font-black text-slate-700">${p.price}</span>
                                  </button>
                               ))}
                            </div>
                          )}
                       </div>
                       {searchType === 'med' && (
                         <button onClick={() => addMed()} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                            <PlusCircle size={14} /> Libre
                         </button>
                       )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    {/* Lista de Medicamentos */}
                    {medications.map((m, idx) => (
                       <div key={m.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group hover:shadow-md transition-all">
                          <div className="flex justify-between items-center">
                             <div className="flex-1 flex items-center gap-3">
                                <span className="w-6 h-6 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center font-black text-[10px]">{idx + 1}</span>
                                <input className="bg-transparent border-none p-0 text-sm font-black text-slate-900 uppercase w-full outline-none focus:ring-0" value={m.name} onChange={e => updateMed(m.id, 'name', e.target.value.toUpperCase())} />
                             </div>
                             <button onClick={() => removeMed(m.id)} className="text-slate-300 hover:text-rose-600 transition-colors p-2"><X size={16} /></button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {['dosage', 'frequency', 'route', 'duration'].map(f => (
                               <div key={f} className="space-y-1">
                                  <label className="text-[8px] text-slate-400 font-black uppercase block ml-1">{f === 'dosage' ? 'Dosis' : f === 'frequency' ? 'Frecuencia' : f === 'route' ? 'Vía' : 'Duración'}</label>
                                  <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-blue-400 shadow-sm text-slate-900" value={(m as any)[f]} onChange={e => updateMed(m.id, f as any, e.target.value)} />
                               </div>
                             ))}
                          </div>
                          <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-medium italic outline-none focus:border-emerald-300 shadow-sm text-slate-600" placeholder="Instrucciones adicionales..." value={m.instructions} onChange={e => updateMed(m.id, 'instructions', e.target.value)} />
                       </div>
                    ))}

                    {/* Lista de Procedimientos Agregados */}
                    {selectedProcedures.length > 0 && (
                       <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-slate-200">
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-2">Procedimientos Realizados / Agendados</p>
                          {selectedProcedures.map((proc, i) => (
                             <div key={i} className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <span className="text-[10px] font-bold text-indigo-900 uppercase">{proc.name}</span>
                                <div className="flex items-center gap-4">
                                   <span className="text-[10px] font-black text-indigo-700">${proc.price}</span>
                                   <button onClick={() => removeProc(proc.id)} className="text-indigo-400 hover:text-rose-500"><X size={14}/></button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                       {/* ... Non pharma plan ... */}
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2"><ClipboardList size={14} /> Plan No Farmacológico</label>
                          <textarea className="w-full p-4 text-[11px] bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24 resize-none focus:bg-white focus:border-blue-400 transition-all text-slate-900 bg-white" placeholder="Dieta, medidas generales..." value={form.nonPharmaPlan} onChange={e => setForm({...form, nonPharmaPlan: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Clock size={14} /> Pronóstico y Seguimiento</label>
                          <textarea className="w-full p-4 text-[11px] bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24 resize-none focus:bg-white focus:border-blue-400 transition-all text-slate-900 bg-white" value={form.seguimiento} onChange={e => setForm({...form, seguimiento: e.target.value})} />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* ACCIONES FINALES */}
           <div className="p-6 bg-white border-t border-slate-100 flex flex-wrap justify-between items-center gap-4 no-print sticky bottom-0 z-30">
              <div className="flex gap-3">
                 <button onClick={() => handleSave(false, false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Guardar Borrador</button>
                 <button onClick={() => handleSave(true, false)} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Certificar Nota</button>
              </div>
              <button 
                onClick={() => handleSave(true, true)} 
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3"
              >
                 <Pill size={18} /> Finalizar y Recetar
              </button>
           </div>
        </div>
      </div>

      {/* MODALES DE PANTALLA COMPLETA */}
      {fullScreenSection && (
        <FullScreenModal 
          title={fullScreenSection === 'S' ? 'Subjetivo' : fullScreenSection === 'O1' ? 'Exploración Física' : fullScreenSection === 'O2' ? 'Resultados' : 'Análisis Clínico'}
          value={
            fullScreenSection === 'S' ? form.subjectiveNarrative : 
            fullScreenSection === 'O1' ? form.objectivePhysical : 
            fullScreenSection === 'O2' ? form.objectiveResults : 
            form.analysisReasoning
          }
          onChange={(e: any) => {
             if (fullScreenSection === 'S') setForm({...form, subjectiveNarrative: e.target.value});
             if (fullScreenSection === 'O1') setForm({...form, objectivePhysical: e.target.value});
             if (fullScreenSection === 'O2') setForm({...form, objectiveResults: e.target.value});
             if (fullScreenSection === 'A') setForm({...form, analysisReasoning: e.target.value});
          }}
          onClose={() => setFullScreenSection(null)}
        />
      )}
    </div>
  );
};

export default EvolutionNote;
