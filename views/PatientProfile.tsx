
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, History, Activity, X, User, ShieldCheck, ClipboardList, 
  FileEdit, ChevronRight, Clock, Stethoscope, Microscope, Eye, 
  FileText, ImageIcon, LayoutGrid, Zap, FlaskConical, Download,
  Maximize2, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';
import { NOTE_CATEGORIES } from '../constants';
import { Patient, ClinicalNote, Vitals } from '../types';

interface ProfileProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onUpdatePatient: (p: Patient) => void;
  onSaveNote: (n: ClinicalNote) => void;
}

const PatientProfile: React.FC<ProfileProps> = ({ patients, notes, onUpdatePatient, onSaveNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const patient = patients.find(p => p.id === id);
  const patientNotes = useMemo(() => notes.filter(n => n.patientId === id), [notes, id]);

  const labReports = useMemo(() => patientNotes.filter(n => n.type.includes('Reporte') && n.type.includes('Laboratorio')), [patientNotes]);
  const imagingReports = useMemo(() => patientNotes.filter(n => n.type.includes('Reporte') && n.type.includes('Imagenología')), [patientNotes]);

  if (!patient) return <div className="p-32 text-center font-black text-slate-400 uppercase tracking-widest">Paciente No Localizado</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* Header Fijo Estilo NOM-004 */}
      <div className="sticky top-16 z-40 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden no-print">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-black border-2 border-white shadow-xl">{patient.name.charAt(0)}</div>
          <div className="ml-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{patient.name}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               {patient.curp} • {patient.age} Años • <span className="text-rose-600">Alergias: {patient.allergies.join(', ') || 'NEGADAS'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase border border-blue-100">Expediente: {patient.id}</div>
           <button onClick={() => navigate('/')} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-600 transition-all border border-slate-200 shadow-sm"><X size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* COLUMNA IZQUIERDA: TIMELINE Y RESULTADOS */}
        <div className="lg:col-span-3 space-y-12">
          
          {/* SECCIÓN DE RESULTADOS RÁPIDOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Laboratorios Recientes */}
             <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-3">
                   <FlaskConical className="text-indigo-600" /> Laboratorio Reciente
                </h3>
                <div className="space-y-4">
                   {labReports.length > 0 ? labReports.slice(0, 2).map(rep => (
                      <button key={rep.id} onClick={() => setSelectedNote(rep)} className="w-full text-left p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-400 transition-all group">
                         <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-slate-900">{rep.content.studyRequested}</p>
                            <span className="text-[8px] font-bold text-slate-400">{rep.date.split(',')[0]}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[7px] font-black uppercase">Validado</span>
                            <Eye size={12} className="text-slate-400 group-hover:text-indigo-600" />
                         </div>
                      </button>
                   )) : (
                     <div className="py-10 text-center opacity-20"><FlaskConical size={32} className="mx-auto" /></div>
                   )}
                </div>
             </div>

             {/* Imagenología / Placas */}
             <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-3">
                   <ImageIcon className="text-blue-600" /> Imagenología y Gabinete
                </h3>
                <div className="grid grid-cols-2 gap-4">
                   {imagingReports.length > 0 ? imagingReports.map(rep => (
                      <button 
                        key={rep.id} 
                        onClick={() => setSelectedNote(rep)}
                        className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden group border-2 border-transparent hover:border-blue-500 transition-all shadow-lg"
                      >
                         <img 
                           src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=200" 
                           className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all"
                           alt="Rayos X"
                         />
                         <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-slate-900 to-transparent">
                            <p className="text-[8px] font-black text-white uppercase truncate">{rep.content.studyRequested}</p>
                            <p className="text-[7px] font-bold text-blue-400 mt-1">{rep.date.split(',')[0]}</p>
                         </div>
                         <div className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={12} /></div>
                      </button>
                   )) : (
                     <div className="col-span-2 py-10 text-center opacity-20"><ImageIcon size={32} className="mx-auto" /></div>
                   )}
                </div>
             </div>
          </div>

          {/* LÍNEA DE TIEMPO CLÍNICA */}
          <div className="space-y-8">
             <div className="flex items-center justify-between px-4">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
                   <History className="w-6 h-6 mr-3 text-blue-600" /> Historial de Eventos Clínicos
                </h3>
             </div>
             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[2.25rem] before:w-px before:bg-slate-200">
               {patientNotes.length > 0 ? patientNotes.map((note) => (
                 <div key={note.id} className="relative pl-20 group">
                   <div className={`absolute left-4 top-2 w-10 h-10 rounded-xl bg-white border-2 text-slate-400 flex items-center justify-center z-10 transition-all shadow-sm ${note.type.includes('Reporte') ? 'border-indigo-600 text-indigo-600' : 'border-slate-200 group-hover:border-blue-600'}`}>
                      {note.type.includes('Reporte') ? <Microscope size={20} /> : note.type.includes('Ingreso') ? <Zap size={20} className="text-amber-500" /> : <ClipboardList size={20} />}
                   </div>
                   <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group-hover:shadow-xl transition-all border-l-4 border-l-slate-200">
                     <div className="flex justify-between items-start mb-6">
                       <div>
                         <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${note.isSigned ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>
                           {note.type}
                         </span>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest flex items-center">
                           <Clock className="w-3 h-3 mr-1.5" /> {note.date} • {note.author}
                         </p>
                       </div>
                       <button onClick={() => setSelectedNote(note)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Eye size={16} /></button>
                     </div>
                     <p className="text-xs font-black text-slate-900 uppercase">
                        {note.content.diagnosis || note.content.conclusion || note.content.studyRequested || 'Sin descripción detallada'}
                     </p>
                   </div>
                 </div>
               )) : (
                 <div className="py-20 text-center text-slate-300"><FileText size={48} className="mx-auto opacity-10" /><p className="text-[10px] font-black uppercase mt-4">Sin registros previos</p></div>
               )}
             </div>
          </div>
        </div>
        
        {/* COLUMNA DERECHA: ACCIONES Y SIGNOS */}
        <div className="space-y-8 no-print">
           <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
              <Activity className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-black mb-8 flex items-center uppercase tracking-tight text-blue-400 relative z-10">
                 <Activity size={20} className="mr-3" /> Últimos Vitales
              </h3>
              <div className="space-y-6 relative z-10">
                 {[
                   { l: 'B.P.', v: patient.currentVitals?.bp || '--/--', u: 'mmHg' },
                   { l: 'TEMP.', v: patient.currentVitals?.temp || '--', u: '°C' },
                   { l: 'F.C.', v: patient.currentVitals?.hr || '--', u: 'LPM' }
                 ].map(item => (
                    <div key={item.l} className="flex justify-between items-end border-b border-white/10 pb-4">
                       <span className="text-[9px] font-black text-slate-400 uppercase">{item.l}</span>
                       <p className="text-xl font-black leading-none">{item.v}<span className="text-[8px] text-blue-400 ml-1">{item.u}</span></p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-indigo-600 text-white rounded-[2.5rem] p-10 shadow-xl space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                 <Microscope size={18} /> Servicios Auxiliares
              </h3>
              <button 
                onClick={() => navigate(`/patient/${id}/auxiliary-order`)}
                className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3"
              >
                 <Plus size={16} /> Solicitar Estudios
              </button>
           </div>
        </div>
      </div>

      {/* Botón Flotante Global de Acción */}
      <div className="fixed bottom-12 right-12 z-[100] no-print">
        <button onClick={() => setShowMenu(true)} className="w-20 h-20 rounded-[2.5rem] bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-slate-900 transition-all hover:scale-110 group ring-8 ring-blue-50">
          <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* MENÚ DE CREACIÓN (MISMO QUE ANTERIOR) */}
      {showMenu && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-10 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-2xl font-black text-slate-900 uppercase">Documentación Clínica Normativa</h4>
              <button onClick={() => setShowMenu(false)} className="p-4 hover:bg-rose-50 text-slate-400 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-[#fcfdfe] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {NOTE_CATEGORIES.map(cat => (
                  <div key={cat.title} className="space-y-6">
                    <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">{cat.title}</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {cat.notes.map(note => (
                        <button key={note} onClick={() => {
                             const typeMap: Record<string, string> = {
                                'Historia Clínica Medica': `/patient/${id}/history`,
                                'Nota de Evolución': `/patient/${id}/note/evolution`,
                                'Nota Inicial de Urgencias': `/patient/${id}/note/emergency`,
                                'Solicitud de Estudios Auxiliares': `/patient/${id}/auxiliary-order`,
                                'Hoja de Enfermería': `/patient/${id}/nursing-sheet`
                             };
                             const route = typeMap[note];
                             if (route) navigate(route);
                             setShowMenu(false);
                          }} className="w-full text-left p-4 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          {note}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VISOR DE DOCUMENTO Y RESULTADOS */}
      {selectedNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400"><FileText /></div>
                    <div><h3 className="text-xl font-black text-slate-900 uppercase">{selectedNote.type}</h3><p className="text-[9px] font-bold text-slate-400 uppercase">Validez Digital NOM-024</p></div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-sm">Imprimir</button>
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-rose-50 transition-colors"><X /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-16 bg-white space-y-12">
                 {/* Visualizador DICOM (Simulado para Imagenología) */}
                 {selectedNote.type.includes('Imagenología') && (
                    <div className="space-y-6 animate-in zoom-in-95">
                       <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-4">PACS / Visualizador de Imágenes Web</h5>
                       <div className="relative aspect-video bg-black rounded-[3rem] overflow-hidden group shadow-2xl ring-4 ring-slate-100">
                          <img 
                             src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=1200" 
                             className="w-full h-full object-contain opacity-80"
                             alt="PACS Viewer"
                          />
                          <div className="absolute top-8 left-8 space-y-2 pointer-events-none">
                             <p className="text-[10px] text-white font-mono bg-black/40 px-2 py-1 rounded tracking-tighter">WL: 40 / WW: 400</p>
                             <p className="text-[10px] text-white font-mono bg-black/40 px-2 py-1 rounded tracking-tighter">MOD: CR</p>
                          </div>
                          <div className="absolute bottom-8 right-8 flex gap-4 bg-black/40 p-4 rounded-3xl backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-2 text-white hover:text-blue-400"><ZoomIn size={20} /></button>
                             <button className="p-2 text-white hover:text-blue-400"><ZoomOut size={20} /></button>
                             <button className="p-2 text-white hover:text-blue-400"><RotateCw size={20} /></button>
                             <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Full DICOM</button>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* TABLA DE ANALITOS (Para Laboratorio) */}
                 {selectedNote.content.labResults && (
                   <div className="space-y-8">
                      <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Resultados de Análisis Clínicos</h5>
                      <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                               <tr><th className="px-10 py-6">Analito</th><th className="px-6 py-6 text-center">Resultado</th><th className="px-6 py-6 text-center">Unidades</th><th className="px-10 py-6 text-center">Referencia</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {selectedNote.content.labResults.map((r: any, idx: number) => (
                                  <tr key={idx} className="text-sm">
                                     <td className="px-10 py-6 font-black text-slate-900 uppercase">{r.analyte}</td>
                                     <td className={`px-6 py-6 text-center font-black text-lg ${r.status !== 'Normal' ? 'text-rose-600' : 'text-indigo-600'}`}>{r.value}</td>
                                     <td className="px-6 py-6 text-center text-slate-400 font-bold">{r.unit}</td>
                                     <td className="px-10 py-6 text-center text-slate-500 italic font-medium">{r.refRange}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 )}

                 {/* CONCLUSIÓN Y HALLAZGOS */}
                 <div className="grid grid-cols-1 gap-10 text-sm">
                    {selectedNote.content.findings && (
                       <div className="space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción de Hallazgos</p>
                          <p className="text-slate-800 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-6">"{selectedNote.content.findings}"</p>
                       </div>
                    )}
                    {selectedNote.content.conclusion && (
                       <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-3 shadow-inner">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Interpretación Diagnóstica Final</p>
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedNote.content.conclusion}</p>
                       </div>
                    )}
                 </div>

                 {/* Firma Electrónica */}
                 <div className="pt-20 text-center border-t-2 border-slate-100">
                    <div className="w-80 h-24 border-b-2 border-slate-900 mx-auto flex items-center justify-center italic text-blue-50/50 text-2xl font-serif">Certificación Digital Sat</div>
                    <p className="text-sm font-black text-slate-900 uppercase mt-8 tracking-tighter">{selectedNote.author}</p>
                    <p className="text-[8px] font-black text-emerald-600 uppercase mt-1 tracking-widest">Documento Sello Digital Validado</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
