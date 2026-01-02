
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, Microscope, ImageIcon, 
  Save, User, AlertTriangle, CheckCircle2, FlaskConical,
  X, Search, Info, Plus, Trash2, ClipboardList, Zap, ArrowLeft, Eye, FileText
} from 'lucide-react';
import { Patient, ClinicalNote, PriceItem } from '../types';
import { LAB_CATALOG, IMAGING_CATALOG, INITIAL_PRICES } from '../constants';

const AuxiliaryOrder: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void }> = ({ patients, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [isPreview, setIsPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'lab' | 'imaging'>('lab');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    labStudies: [] as string[],
    imagingStudies: [] as string[],
    clinicalJustification: '',
    urgency: 'Rutina',
    doctorInstructions: '',
    date: new Date().toLocaleDateString('es-MX')
  });

  // Load dynamic prices from storage
  const prices: PriceItem[] = useMemo(() => {
    const saved = localStorage.getItem('med_price_catalog_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  }, []);

  // Merge static and dynamic catalogs
  const mergedLabCatalog = useMemo(() => {
      const dynamicLabs = prices.filter(p => p.category === 'Estudios / Auxiliares' && !p.code.startsWith('IMG')).map(p => ({
          name: p.name,
          preparation: 'Consultar indicaciones',
          indications: 'Estudio de Laboratorio'
      }));
      const combined = [...LAB_CATALOG, ...dynamicLabs];
      return Array.from(new Map(combined.map(item => [item.name, item])).values());
  }, [prices]);

  const mergedImagingCatalog = useMemo(() => {
      const dynamicImg = prices.filter(p => p.category === 'Estudios / Auxiliares' && (p.code.startsWith('IMG') || p.name.includes('Rayos') || p.name.includes('Tomografía') || p.name.includes('Ultrasonido'))).map(p => ({
          name: p.name,
          preparation: 'Consultar indicaciones',
          indications: 'Estudio de Gabinete'
      }));
      const combined = [...IMAGING_CATALOG, ...dynamicImg];
      return Array.from(new Map(combined.map(item => [item.name, item])).values());
  }, [prices]);

  if (!patient) return <div className="p-20 text-center uppercase font-black text-slate-300">Paciente no encontrado</div>;

  const toggleStudy = (studyName: string, type: 'lab' | 'imaging') => {
    const key = type === 'lab' ? 'labStudies' : 'imagingStudies';
    const current = [...form[key]];
    if (current.includes(studyName)) {
      setForm({ ...form, [key]: current.filter(s => s !== studyName) });
    } else {
      setForm({ ...form, [key]: [...current, studyName] });
    }
  };

  const selectedMetadata = useMemo(() => {
    return [
      ...mergedLabCatalog.filter(s => form.labStudies.includes(s.name)),
      ...mergedImagingCatalog.filter(s => form.imagingStudies.includes(s.name))
    ];
  }, [form.labStudies, form.imagingStudies, mergedLabCatalog, mergedImagingCatalog]);

  const handleSave = () => {
    if (form.labStudies.length === 0 && form.imagingStudies.length === 0) {
      alert("Seleccione al menos un estudio.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `ORDER-${Date.now()}`,
      patientId: patient.id,
      type: 'Solicitud de Estudios Auxiliares',
      date: new Date().toLocaleString('es-MX'),
      author: 'Dr. Alejandro Méndez',
      content: { ...form, metadata: selectedMetadata },
      isSigned: true,
      hash: `ORDER-SHA-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  const filteredCatalog = (activeTab === 'lab' ? mergedLabCatalog : mergedImagingCatalog).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-40 animate-in fade-in duration-500">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-2xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-20 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => isPreview ? setIsPreview(false) : navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            {isPreview ? <ArrowLeft size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Solicitud de Estudios</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">NOM-004-SSA3 • Auxiliares de Diagnóstico</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {!isPreview && (
             <button 
              onClick={() => setIsPreview(true)}
              disabled={form.labStudies.length === 0 && form.imagingStudies.length === 0}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center gap-3 disabled:opacity-30"
             >
                <Eye size={16} /> Vista de Impresión
             </button>
           )}
           {isPreview && (
             <button onClick={() => window.print()} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-all"><Printer size={20} /></button>
           )}
        </div>
      </div>

      {!isPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* CATALOG SELECTION */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
                      <Microscope className="text-blue-600" /> 1. Selección de Estudios
                   </h3>
                   <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
                      <button onClick={() => setActiveTab('lab')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Laboratorio</button>
                      <button onClick={() => setActiveTab('imaging')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'imaging' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500'}`}>Imagenología</button>
                   </div>
                </div>

                <div className="relative">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                     placeholder={`Buscar en ${activeTab === 'lab' ? 'Laboratorio' : 'Imagen'}...`}
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                   {filteredCatalog.map(study => {
                      const isSelected = (activeTab === 'lab' ? form.labStudies : form.imagingStudies).includes(study.name);
                      return (
                        <button 
                          key={study.name}
                          onClick={() => toggleStudy(study.name, activeTab)}
                          className={`text-left p-6 rounded-[2rem] border-2 transition-all group flex flex-col gap-2 ${isSelected ? 'bg-indigo-50 border-indigo-600 shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                        >
                           <div className="flex justify-between items-start">
                              <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{study.name}</span>
                              {isSelected ? <CheckCircle2 className="text-indigo-600" /> : <Plus className="text-slate-200 group-hover:text-indigo-400" />}
                           </div>
                           <p className={`text-[9px] font-medium leading-relaxed ${isSelected ? 'text-indigo-700' : 'text-slate-400'}`}>{study.preparation}</p>
                        </button>
                      );
                   })}
                </div>
             </div>
          </div>

          {/* JUSTIFICATION & ACTIONS */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl space-y-8 sticky top-32">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-3">
                   <Zap size={18} /> Justificación Clínica
                </h3>
                <div className="space-y-6">
                   <textarea 
                      className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-xs outline-none h-32 italic leading-relaxed focus:bg-white/10"
                      placeholder="Describa el motivo médico de la solicitud conforme a la NOM-004..."
                      value={form.clinicalJustification}
                      onChange={e => setForm({...form, clinicalJustification: e.target.value})}
                   />
                   <div className="p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resumen de Orden</p>
                      <div className="space-y-2">
                         {[...form.labStudies, ...form.imagingStudies].map(s => (
                            <div key={s} className="flex justify-between items-center text-[10px] font-bold">
                               <span className="uppercase text-slate-300">• {s.length > 25 ? s.substr(0, 22) + '...' : s}</span>
                               <button onClick={() => {
                                  if (form.labStudies.includes(s)) setForm({...form, labStudies: form.labStudies.filter(i => i !== s)});
                                  else setForm({...form, imagingStudies: form.imagingStudies.filter(i => i !== s)});
                               }} className="text-rose-400"><X size={14} /></button>
                            </div>
                         ))}
                         {[...form.labStudies, ...form.imagingStudies].length === 0 && <p className="text-[10px] text-slate-600 font-black italic">Sin estudios seleccionados</p>}
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={form.labStudies.length === 0 && form.imagingStudies.length === 0}
                  className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 disabled:opacity-20"
                >
                   <Save size={20} /> Guardar y Sellar Orden
                </button>
             </div>
          </div>
        </div>
      ) : (
        /* VISTA DE IMPRESIÓN (RECETA DE ESTUDIOS) */
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 space-y-12 animate-in zoom-in-95 print:shadow-none print:border-none print:p-0">
           <div className="flex justify-between border-b-2 border-slate-900 pb-10">
              <div className="space-y-4">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Hospital General San Rafael</h2>
                 <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight">Dr. Alejandro Méndez</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cédula Profesional: 12345678</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-sm font-black text-slate-900 uppercase">{form.date}</p>
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Folio de Orden: {Date.now().toString().substr(-6)}</p>
              </div>
           </div>

           <div className="p-8 bg-slate-50 rounded-3xl space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase">Paciente</p>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{patient.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{patient.curp} • {patient.age} Años</p>
           </div>

           <div className="space-y-10">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-blue-600 pl-4">Estudios Solicitados e Instrucciones de Preparación</h4>
              <div className="grid grid-cols-1 gap-6">
                 {selectedMetadata.map((study, idx) => (
                    <div key={idx} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group">
                       <div className="space-y-3 relative z-10">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs">{idx + 1}</div>
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{study.name}</p>
                          </div>
                          <div className="pl-11 space-y-2">
                             <p className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2"><Info size={12} /> Preparación:</p>
                             <p className="text-xs text-slate-600 font-medium italic leading-relaxed">"{study.preparation}"</p>
                          </div>
                       </div>
                       <div className="md:w-64 p-6 bg-slate-50 rounded-2xl flex flex-col justify-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Observación Técnica</p>
                          <p className="text-[10px] text-slate-700 font-bold">{study.indications}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
              <div className="space-y-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Justificación Médica (Criterio NOM-004)</p>
                 <p className="text-xs text-slate-800 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-6">"{form.clinicalJustification || 'Se solicitan auxiliares para confirmar sospecha diagnóstica y normar conducta terapéutica.'}"</p>
              </div>
              <div className="text-center space-y-4 pt-10">
                 <div className="w-64 h-24 border-b-2 border-slate-900 mx-auto flex items-center justify-center italic text-slate-200 text-2xl font-serif">Firma Digitalizada</div>
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Firma del Médico Tratante</p>
              </div>
           </div>

           <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-center gap-6">
              <ShieldCheck className="text-blue-600 w-10 h-10 flex-shrink-0" />
              <p className="text-[9px] text-blue-900 font-black leading-relaxed uppercase">
                 "Documento digital con validez normativa. El paciente debe presentarse con esta hoja impresa o en formato digital al área de Admisión de Auxiliares."
              </p>
           </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 1.5cm !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-6xl { max-width: 100% !important; }
          .bg-slate-50 { background: #f8fafc !important; }
          .border-slate-900 { border-color: #000 !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default AuxiliaryOrder;
