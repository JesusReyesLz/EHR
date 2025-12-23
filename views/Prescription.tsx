
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Printer, QrCode, Plus, Trash2, Eye, 
  ArrowLeft, ShieldCheck, Stethoscope, Search,
  MapPin, GraduationCap, Heart, Pill, ClipboardList
} from 'lucide-react';
import { Patient, MedicationPrescription, MedicationStock } from '../types';
import { VADEMECUM_DB } from '../constants';

const Prescription: React.FC<{ patients: Patient[] }> = ({ patients }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const patient = patients.find(p => p.id === id);

  const [isPreview, setIsPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<MedicationStock[]>([]);
  
  const noteData = location.state as { 
    diagnosis?: string; 
    indicaciones?: string 
  } | null;

  const [medications, setMedications] = useState<MedicationPrescription[]>([]);

  const [prescriptionData, setPrescriptionData] = useState({
    diagnostico: noteData?.diagnosis || '',
    indicaciones: noteData?.indicaciones || '',
    folio: `REC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
    fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
    emisor: {
      institucion: 'U.N.A.M. / Facultad de Medicina',
      cedulaGral: '12345678',
      cedulaEsp: '99887766',
      direccion: 'Av. Insurgentes Sur 123, Col. Juárez, CP 06600, CDMX',
      telefono: '55 1234 5678'
    }
  });

  const handleSearchMed = (val: string) => {
    setSearchTerm(val);
    if (val.length > 1) {
      const filtered = VADEMECUM_DB.filter(m => 
        m.name.toLowerCase().includes(val.toLowerCase()) || 
        m.genericName.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const addMedicationManual = () => {
    const newMed: MedicationPrescription = {
      id: `MED-MAN-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      genericName: '',
      presentation: 'Tabletas',
      dosage: '',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      route: 'Oral',
      instructions: ''
    };
    setMedications(prev => [...prev, newMed]);
  };

  const selectMedFromDB = (med: MedicationStock) => {
    const newMed: MedicationPrescription = {
      id: `MED-DB-${Date.now()}`,
      name: med.name,
      genericName: med.genericName,
      presentation: med.presentation,
      dosage: med.concentration || '',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      route: med.presentation.toLowerCase().includes('inyectable') ? 'Intramuscular' : 'Oral',
      instructions: ''
    };
    setMedications(prev => [...prev, newMed]);
    setSearchTerm('');
    setSuggestions([]);
  };

  const updateMedication = useCallback((medId: string, field: keyof MedicationPrescription, value: string) => {
    setMedications(prev => prev.map(m => m.id === medId ? { ...m, [field]: value } : m));
  }, []);

  const removeMedication = (medId: string) => {
    setMedications(prev => prev.filter(m => m.id !== medId));
  };

  if (!patient) return <div className="p-20 text-center font-black text-slate-300 uppercase">Paciente no encontrado</div>;

  return (
    <div className="max-w-5xl mx-auto pb-32 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 no-print bg-white p-8 rounded-[3rem] border border-slate-200 shadow-2xl sticky top-20 z-[60] gap-4">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recetario Médico</h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Atención: {patient.name}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {!isPreview && (
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                   <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                        placeholder="Buscar en Vademécum..." 
                        value={searchTerm} 
                        onChange={e => handleSearchMed(e.target.value)} 
                      />
                   </div>
                   {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95">
                         {suggestions.map(med => (
                            <button key={med.id} onClick={() => selectMedFromDB(med)} className="w-full text-left p-5 hover:bg-blue-50 border-b border-slate-50 last:border-0 group transition-all">
                               <p className="text-xs font-black uppercase group-hover:text-blue-700">{med.genericName}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{med.name} • {med.presentation}</p>
                            </button>
                         ))}
                      </div>
                   )}
                </div>
                <button onClick={addMedicationManual} className="p-4 bg-blue-600 text-white rounded-3xl hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center group" title="Agregar Manualmente">
                   <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
           )}
           <button 
             onClick={() => setIsPreview(!isPreview)} 
             className={`flex items-center px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${isPreview ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white hover:bg-slate-900'}`}
           >
              {isPreview ? <ArrowLeft size={16} className="mr-3" /> : <Eye size={16} className="mr-3" />} 
              {isPreview ? 'Volver a Editar' : 'Vista de Impresión'}
           </button>
           {isPreview && (
             <button onClick={() => window.print()} className="p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-slate-900 transition-all">
                <Printer size={20} />
             </button>
           )}
        </div>
      </div>

      <div className={`bg-white shadow-2xl rounded-[4rem] overflow-hidden flex flex-col transition-all duration-700 ${isPreview ? 'scale-[1.01]' : 'border border-slate-200'} print:shadow-none print:scale-100 print:rounded-none`}>
        <PrescriptionDocument 
          patient={patient} 
          medications={medications} 
          prescriptionData={prescriptionData} 
          updateMedication={updateMedication}
          removeMedication={removeMedication}
          addMedicationManual={addMedicationManual}
          setPrescriptionData={(newData: any) => setPrescriptionData(prev => ({...prev, ...newData}))}
          isPreview={isPreview}
          label="ORIGINAL"
        />
        
        <div className="h-20 bg-slate-50 flex items-center justify-center overflow-hidden no-print relative">
           <div className="w-full border-t-4 border-dotted border-slate-300"></div>
           <div className="absolute px-12 py-3 bg-white border-2 border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] shadow-sm">Línea de Corte Normativo</div>
        </div>

        <div className="hidden print:block border-t-2 border-dashed border-slate-300 w-full h-0 my-4"></div>
        
        <PrescriptionDocument 
          patient={patient} 
          medications={medications} 
          prescriptionData={prescriptionData} 
          updateMedication={updateMedication}
          removeMedication={removeMedication}
          addMedicationManual={addMedicationManual}
          setPrescriptionData={(newData: any) => setPrescriptionData(prev => ({...prev, ...newData}))}
          isPreview={isPreview}
          label="COPIA EXPEDIENTE"
        />
      </div>

      <style>{`
        @media print {
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          nav, aside, header, .no-print, .sticky { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; left: 0 !important; top: 0 !important; position: static !important; }
          .max-w-5xl { max-width: 100% !important; margin: 0 !important; }
          .bg-white { box-shadow: none !important; border: none !important; }
          @page { margin: 0.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
};

const PrescriptionDocument = ({ patient, medications, prescriptionData, updateMedication, removeMedication, addMedicationManual, setPrescriptionData, isPreview, label }: any) => (
  <div className="relative bg-white p-12 overflow-hidden flex flex-col border-b border-slate-100 last:border-b-0">
    <div className="relative z-10 flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-8">
      <div className="flex gap-8">
        <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-blue-400 shadow-2xl shrink-0">
           <Heart size={48} />
        </div>
        <div className="space-y-3">
           <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Dr. Alejandro Méndez</h2>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-2 flex items-center">
                 <GraduationCap size={12} className="mr-2" /> {prescriptionData.emisor.institucion}
              </p>
           </div>
           <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Ced. Gral: <span className="text-slate-900">{prescriptionData.emisor.cedulaGral}</span></p>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Ced. Esp: <span className="text-slate-900">{prescriptionData.emisor.cedulaEsp}</span></p>
              <p className="text-[8px] font-bold text-slate-400 uppercase col-span-full mt-1 flex items-center"><MapPin size={10} className="mr-1.5" /> {prescriptionData.emisor.direccion}</p>
           </div>
        </div>
      </div>
      <div className="text-right">
         <QrCode size={64} className="text-slate-900 mb-2 inline-block" />
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Validación COFEPRIS</p>
         <p className="text-xl font-black text-blue-600 tracking-tighter mt-1">{prescriptionData.folio}</p>
      </div>
    </div>

    <div className="relative z-10 grid grid-cols-4 gap-6 bg-slate-50 p-8 rounded-[2.5rem] mb-10 border border-slate-100">
      <div className="col-span-3">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre del Paciente</label>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{patient.name}</p>
      </div>
      <div className="text-right">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha Emisión</label>
        <p className="text-sm font-black text-slate-700 uppercase">{prescriptionData.fecha}</p>
      </div>
      <div className="col-span-full h-px bg-slate-200"></div>
      <div className="grid grid-cols-4 gap-4 col-span-full">
         <div><label className="text-[8px] font-black text-slate-400 uppercase block">Edad / Sexo</label><p className="text-[10px] font-bold">{patient.age} Años / {patient.sex}</p></div>
         <div><label className="text-[8px] font-black text-slate-400 uppercase block">Peso / Talla</label><p className="text-[10px] font-bold">{patient.currentVitals?.weight || '--'} kg / {patient.currentVitals?.height || '--'} cm</p></div>
         <div className="col-span-2">
            <label className="text-[8px] font-black text-slate-400 uppercase block">Diagnóstico Presuntivo</label>
            {!isPreview ? (
              <input 
                className="w-full bg-transparent text-[10px] font-bold border-b border-slate-200 outline-none focus:border-blue-600" 
                value={prescriptionData.diagnostico} 
                onChange={e => setPrescriptionData({ diagnostico: e.target.value })}
                placeholder="Escriba el diagnóstico..."
              />
            ) : (
              <p className="text-[10px] font-bold text-slate-800 uppercase italic truncate">"{prescriptionData.diagnostico}"</p>
            )}
         </div>
      </div>
    </div>

    <div className="relative z-10 space-y-10 flex-1 min-h-[400px]">
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center">
               <Stethoscope size={16} className="text-blue-600 mr-2" /> Tratamiento Farmacológico (Rp.)
            </label>
            {!isPreview && medications.length > 0 && (
               <button onClick={addMedicationManual} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase hover:bg-blue-600 transition-all">
                  <Plus size={12} /> Agregar Otro
               </button>
            )}
         </div>
         
         <div className="space-y-8">
            {medications.map((med: any, idx: number) => (
               <div key={med.id} className="relative pl-12 group animate-in slide-in-from-left-2">
                  <div className="absolute left-0 top-0 text-xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">{idx + 1}.</div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-start">
                        <div className="flex-1 mr-4">
                           {!isPreview ? (
                              <div className="flex gap-3">
                                <input 
                                  className="flex-[2] bg-slate-100 border-b-2 border-slate-200 p-3 text-xs font-black uppercase outline-none focus:bg-blue-50 focus:border-blue-600 transition-all" 
                                  placeholder="Nombre del Medicamento (Genérico / Comercial)" 
                                  value={med.genericName || med.name} 
                                  onChange={e => updateMedication(med.id, 'genericName', e.target.value)} 
                                />
                                <input 
                                  className="flex-1 bg-slate-100 border-b-2 border-slate-200 p-3 text-xs font-bold outline-none focus:bg-blue-50 focus:border-blue-600 transition-all" 
                                  placeholder="Presentación" 
                                  value={med.presentation} 
                                  onChange={e => updateMedication(med.id, 'presentation', e.target.value)} 
                                />
                              </div>
                           ) : (
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                {med.genericName || med.name} <span className="text-slate-400 font-bold ml-2">({med.presentation})</span>
                              </p>
                           )}
                        </div>
                        {!isPreview && (
                           <button onClick={() => removeMedication(med.id)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors"><Trash2 size={18} /></button>
                        )}
                     </div>
                     
                     <div className="grid grid-cols-4 gap-6">
                        <div className="col-span-2">
                           <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Dosis y Frecuencia</label>
                           {!isPreview ? (
                              <div className="flex gap-2">
                                <input className="w-full bg-slate-50 border-b border-slate-200 p-2 text-[10px] font-bold outline-none focus:border-blue-600" value={med.dosage} onChange={e => updateMedication(med.id, 'dosage', e.target.value)} placeholder="Ej: 500mg" />
                                <input className="w-full bg-slate-50 border-b border-slate-200 p-2 text-[10px] font-bold outline-none focus:border-blue-600" value={med.frequency} onChange={e => updateMedication(med.id, 'frequency', e.target.value)} placeholder="Frecuencia..." />
                              </div>
                           ) : (
                              <p className="text-[10px] font-black text-slate-800 uppercase">{med.dosage} — {med.frequency}</p>
                           )}
                        </div>
                        <div>
                           <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Duración</label>
                           {!isPreview ? (
                              <input className="w-full bg-slate-50 border-b border-slate-200 p-2 text-[10px] font-bold outline-none focus:border-blue-600" value={med.duration} onChange={e => updateMedication(med.id, 'duration', e.target.value)} placeholder="Ej: 7 días" />
                           ) : (
                              <p className="text-[10px] font-black text-slate-800 uppercase">{med.duration}</p>
                           )}
                        </div>
                        <div>
                           <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Vía</label>
                           {!isPreview ? (
                              <input className="w-full bg-slate-50 border-b border-slate-200 p-2 text-[10px] font-bold outline-none focus:border-blue-600" value={med.route} onChange={e => updateMedication(med.id, 'route', e.target.value)} />
                           ) : (
                              <p className="text-[10px] font-black text-slate-800 uppercase">{med.route}</p>
                           )}
                        </div>
                     </div>
                     
                     <div className="pt-1">
                        <label className="text-[8px] font-black text-blue-600 uppercase block mb-1">Indicaciones Adicionales</label>
                        {!isPreview ? (
                           <input 
                              className="w-full bg-transparent border-b border-dashed border-slate-200 p-2 text-[10px] font-medium italic text-slate-600 outline-none focus:border-blue-400" 
                              value={med.instructions} 
                              onChange={e => updateMedication(med.id, 'instructions', e.target.value)} 
                              placeholder="Ej: Tomar después de alimentos..." 
                           />
                        ) : (
                           <p className="text-[10px] font-medium italic text-slate-600 border-l-2 border-slate-100 pl-4">{med.instructions || 'Sin instrucciones adicionales'}</p>
                        )}
                     </div>
                  </div>
               </div>
            ))}
            {!isPreview && medications.length === 0 && (
               <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 space-y-4">
                  <Pill size={32} className="opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No hay medicamentos en la receta</p>
                  <button onClick={addMedicationManual} className="text-[9px] font-black text-blue-600 hover:underline uppercase">Comenzar a agregar</button>
               </div>
            )}
         </div>
      </div>

      <div className="space-y-4 mt-12 border-t border-slate-100 pt-8">
         <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center">
            <ClipboardList size={16} className="text-emerald-600 mr-2" /> Recomendaciones Generales e Higiene
         </label>
         <textarea 
            disabled={isPreview}
            className="w-full text-[11px] font-medium p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-32 outline-none focus:bg-white focus:border-emerald-400 transition-all resize-none italic leading-relaxed disabled:bg-transparent disabled:border-none disabled:p-0" 
            value={prescriptionData.indicaciones} 
            onChange={e => setPrescriptionData({ indicaciones: e.target.value })} 
            placeholder="Especifique dieta, reposo, signos de alarma o cuidados generales..." 
         />
      </div>
    </div>

    <div className="mt-20 pt-10 border-t-2 border-slate-900 flex justify-between items-end relative z-10">
       <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
          <ShieldCheck size={18} className="text-emerald-400" /> Firma Electrónica Avanzada Activa
       </div>
       <div className="flex flex-col items-center">
          <div className="w-72 h-24 border-b-2 border-slate-900 mb-3 flex items-center justify-center italic text-blue-100/50 text-2xl font-serif">Firma Digitalizada</div>
          <p className="text-sm font-black text-slate-900 uppercase">Dr. Alejandro Méndez</p>
          <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Cédula Profesional: {prescriptionData.emisor.cedulaGral}</p>
          <p className="text-[8px] font-black text-blue-600 mt-3 uppercase border-2 border-blue-600 px-5 py-1.5 rounded-lg tracking-widest">{label}</p>
       </div>
    </div>
  </div>
);

export default Prescription;
