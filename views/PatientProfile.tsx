
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, History, Activity, Droplet, AlertTriangle, FileSearch, X, ArrowLeft, 
  User, ShieldCheck, ClipboardList, Edit2, ChevronRight, Clock, Stethoscope,
  HeartPulse, Scale, Thermometer, FileBadge, AlertCircle, FileEdit, Printer,
  Eye, FileText, Image as ImageIcon, LayoutGrid
} from 'lucide-react';
import { NOTE_CATEGORIES } from '../constants';
import { Patient, ClinicalNote, Vitals } from '../types';

interface ProfileProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onUpdatePatient: (p: Patient) => void;
}

const PatientProfile: React.FC<ProfileProps> = ({ patients, notes, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  
  const patient = patients.find(p => p.id === id);
  const patientNotes = notes.filter(n => n.patientId === id);

  if (!patient) return <div className="p-32 text-center font-black text-slate-400 uppercase tracking-widest">Paciente No Localizado</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-black border-2 border-white shadow-xl">{patient.name.charAt(0)}</div>
          <div className="ml-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{patient.name}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{patient.curp} • {patient.age} Años • {patient.sex}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/edit-patient/${patient.id}`)}
            className="flex items-center px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all"
          >
             <FileEdit className="w-4 h-4 mr-2.5 text-blue-600" /> Editar Ficha
          </button>
          <button onClick={() => navigate('/')} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all border border-slate-200 shadow-sm"><X size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between px-4">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
                <History className="w-6 h-6 mr-3 text-blue-600" /> Línea de Tiempo Clínica
             </h3>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[2.25rem] before:w-px before:bg-slate-200">
            {patientNotes.map((note) => (
              <div key={note.id} className="relative pl-20 group">
                <div className="absolute left-4 top-2 w-10 h-10 rounded-xl bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center z-10 group-hover:border-blue-600 group-hover:text-blue-600 transition-all shadow-sm">
                   <ClipboardList className="w-5 h-5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group-hover:shadow-xl transition-all border-l-4 border-l-blue-600">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-50">
                    <div>
                      <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">{note.type}</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest flex items-center">
                        <Clock className="w-3 h-3 mr-1.5" /> {note.date} • {note.author}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                       <button 
                         onClick={() => {
                            const typeMap: Record<string, string> = {
                              'Nota de Evolución (SOAP)': 'evolution',
                              'Nota Inicial de Urgencias': 'emergency',
                              'Nota de Egreso / Alta': 'discharge',
                              'Nota de Interconsulta': 'interconsulta',
                              'Reporte de ESAVI (Vacunas)': 'esavi',
                              'Nota Pre-operatoria': 'surgical',
                              'Nota Post-operatoria': 'surgical',
                            };
                            const typeKey = typeMap[note.type];
                            if (typeKey) {
                              navigate(`/patient/${id}/note/${typeKey}/${note.id}`);
                            } else {
                              alert("Este tipo de nota solo permite visualización.");
                            }
                         }} 
                         className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                       >
                          <Edit2 size={16} /> Editar
                       </button>
                       <button onClick={() => setSelectedNote(note)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                          <Eye size={16} /> Ver Completo
                       </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico Principal</p>
                        <p className="text-xs font-black text-slate-900 uppercase">{note.content.diagnosis || note.content.finalDiagnosis || 'Pendiente'}</p>
                     </div>
                  </div>
                </div>
              </div>
            ))}
            {patientNotes.length === 0 && (
              <div className="py-24 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-black uppercase tracking-widest">Expediente vacío</div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl">
             <h3 className="text-lg font-black mb-8 flex items-center uppercase tracking-tight text-blue-400">
                <ImageIcon className="w-6 h-6 mr-3" /> Gabinete Digital
             </h3>
             <div className="space-y-4">
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group">
                   <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 transition-all"><FileText size={20} /></div>
                   <div>
                      <p className="text-[10px] font-black uppercase">Química Sanguínea</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PDF • 15 Oct 2023</p>
                   </div>
                </div>
             </div>
             <button className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-white hover:text-slate-900 transition-all">Sincronizar PACS/RIS</button>
          </div>
        </div>
      </div>

      {/* MODAL CATÁLOGO DE DOCUMENTOS (REDESIGN) */}
      <div className="fixed bottom-12 right-12 z-[100]">
        <button 
          onClick={() => setShowMenu(true)} 
          className="w-20 h-20 rounded-[2.5rem] bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-slate-900 transition-all hover:scale-110 group ring-8 ring-blue-50"
        >
          <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {showMenu && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
            {/* Modal Header */}
            <div className="p-8 md:p-10 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-blue-200">
                  <LayoutGrid size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Catálogo de Registros NOM-004</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Seleccione el tipo de documento a generar</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMenu(false)} 
                className="p-4 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-[1.5rem] border border-slate-200 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-[#fcfdfe]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {NOTE_CATEGORIES.map(cat => (
                  <div key={cat.title} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                       <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                       <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">{cat.title}</h5>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {cat.notes.map(note => (
                        <button 
                          key={note} 
                          onClick={() => {
                             const typeMap: Record<string, string> = {
                                'Historia Clínica Medica': `/patient/${id}/history`,
                                'Nota de Evolución': `/patient/${id}/note/evolution`,
                                'Resumen Clínico': `/patient/${id}/note/evolution`,
                                'Nota Inicial de Urgencias': `/patient/${id}/note/emergency`,
                                'Nota de Egreso / Alta': `/patient/${id}/note/discharge`,
                                'Nota Pre-operatoria': `/patient/${id}/note/surgical`,
                                'Nota Post-operatoria': `/patient/${id}/note/surgical`,
                                'Nota Pre-anestésica': `/patient/${id}/note/surgical`,
                                'Nota Post-anestésica': `/patient/${id}/note/surgical`,
                                'Reporte de ESAVI (Vacunas)': `/patient/${id}/note/esavi`,
                                'Nota de Interconsulta': `/patient/${id}/note/interconsulta`,
                                'Hoja de Enfermería': `/patient/${id}/nursing-sheet`,
                                'Reporte de Auxiliares (Lab/Imagen)': `/patient/${id}/auxiliary-report`,
                                'Consentimiento Informado': `/patient/${id}/consent`,
                                'Consentimiento Telemedicina': `/patient/${id}/telemedicine-consent`,
                                'Hoja de Egreso Voluntario': `/patient/${id}/voluntary-discharge`,
                                'Notificación Ministerio Público': `/patient/${id}/mp-notification`,
                                'Certificado de Defunción': `/patient/${id}/death-certificate`,
                                'Registro de Transfusión': `/patient/${id}/transfusion`,
                                'Hoja de Trabajo Social': `/patient/${id}/social-work`,
                                'Expediente Estomatológico (Odontograma)': `/patient/${id}/stomatology`,
                                'Estudio Epidemiológico de Caso': `/patient/${id}/epi-study`,
                                'Receta Médica': `/patient/${id}/prescription`,
                             };

                             const route = typeMap[note];
                             if (route) {
                                navigate(route, { state: { noteType: note } });
                             } else {
                                navigate(`/patient/${id}/new-note/${encodeURIComponent(note)}`);
                             }
                             setShowMenu(false);
                          }} 
                          className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-tight hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm group relative overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="truncate pr-2">{note}</span>
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-emerald-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Validación de Firma Electrónica Activa</p>
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Sistema de Expediente Clínico Electrónico Certificado</p>
            </div>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400"><FileText /></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase">{selectedNote.type}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Registro: {selectedNote.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg"><Printer size={16} /> Imprimir</button>
                    <button onClick={() => setSelectedNote(null)} className="p-3 bg-white rounded-2xl border border-slate-200"><X /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-16 bg-white space-y-10 custom-scrollbar">
                 <div className="flex justify-between border-b-2 border-slate-100 pb-10">
                    <div className="space-y-1">
                       <h4 className="text-2xl font-black text-slate-900 uppercase">Hospital General San Rafael</h4>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">DR. ALEJANDRO MÉNDEZ • CED. 12345678</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Emisión</p>
                       <p className="text-sm font-black text-slate-900 uppercase">{selectedNote.date}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm">
                    <div className="space-y-4">
                       <h5 className="text-[11px] font-black uppercase text-blue-600 tracking-widest">Detalle Clínico</h5>
                       {Object.entries(selectedNote.content).map(([key, val]) => {
                          if (typeof val === 'string' && val.length > 0 && key !== 'hash') {
                             return <div key={key} className="mb-4">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{key}</p>
                                <p className="text-slate-700 leading-relaxed italic border-l-2 border-slate-100 pl-4">"{val}"</p>
                             </div>
                          }
                          return null;
                       })}
                    </div>
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner">
                          <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-widest mb-4">Dictamen Final</h5>
                          <p className="text-xs font-black text-blue-800 uppercase mb-2">DX: {selectedNote.content.diagnosis || selectedNote.content.finalDiagnosis || 'Sin registro'}</p>
                       </div>
                    </div>
                 </div>
                 <div className="pt-20 text-center space-y-4">
                    <div className="w-64 h-px bg-slate-900 mx-auto opacity-20"></div>
                    <p className="text-sm font-black text-slate-900 uppercase">Dr. Alejandro Méndez</p>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Firma Electrónica Avanzada • {selectedNote.hash}</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @media print {
          .no-print, nav, aside, button, .fab-container { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .bg-white { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PatientProfile;
