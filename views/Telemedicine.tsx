
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, VideoOff, Mic, MicOff, ShieldCheck, MessageSquare, PhoneOff, 
  ChevronLeft, Clock, FileText, User, Send, X, Minimize2, Share, 
  MoreVertical, Paperclip, Smile, Maximize2, Layout, Save, Stethoscope, Activity, ClipboardList, PenTool, CheckCircle2,
  History, Ambulance, MapPin, FlaskConical, Plus
} from 'lucide-react';
import { Patient, ClinicalNote, PatientStatus, HomeServiceRequest } from '../types';
import { LAB_CATALOG } from '../constants';

interface TelemedicineProps {
  patients?: Patient[]; 
  notes?: ClinicalNote[]; 
  onSaveNote?: (note: ClinicalNote) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onAddHomeRequest?: (req: HomeServiceRequest) => void; // New Prop
}

const Telemedicine: React.FC<TelemedicineProps> = ({ patients = [], notes = [], onSaveNote, onUpdatePatient, onAddHomeRequest }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const patient = patients.find(p => p.id === id);
  const patientHistory = notes.filter(n => n.patientId === id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [activeSidePanel, setActiveSidePanel] = useState<'none' | 'chat' | 'notes' | 'history' | 'lab'>('notes'); 
  const [elapsedTime, setElapsedTime] = useState(0);
  const [chatMessage, setChatMessage] = useState('');

  // Lab Request State
  const [labSelection, setLabSelection] = useState<string[]>([]);
  const [labAddress, setLabAddress] = useState(patient?.address || '');
  
  const [messages, setMessages] = useState<{sender: string, text: string, time: string, isSystem?: boolean}[]>([
      {sender: 'Sistema', text: 'Conexión cifrada E2EE establecida (AES-256).', time: '10:00', isSystem: true},
      {sender: 'Sistema', text: 'El paciente ha ingresado a la sala virtual.', time: '10:01', isSystem: true},
      {sender: 'Paciente', text: 'Buenos días doctor, ¿me escucha bien?', time: '10:02', isSystem: false}
  ]);

  // PSOAP State
  const [clinicalNote, setClinicalNote] = useState({
      subjective: '', 
      objectiveVitals: { temp: '', hr: '', rr: '', o2: '', bp: '' }, 
      objectiveExam: '', 
      analysis: '', 
      plan: '' 
  });

  // Pre-fill triage data if available
  useEffect(() => {
     if (patient?.teleIntake) {
         setClinicalNote(prev => ({
             ...prev,
             subjective: `MOTIVO TRIAGE: ${patient.teleIntake?.mainSymptom}\nINICIO: ${patient.teleIntake?.onsetDuration}\nDOLOR: ${patient.teleIntake?.painLevel}/10\n\n`
         }));
     }
  }, [patient]);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
      e?.preventDefault();
      if(!chatMessage.trim()) return;
      setMessages([...messages, {
          sender: 'Dr. Méndez',
          text: chatMessage,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          isSystem: false
      }]);
      setChatMessage('');
  };

  const handleSaveNote = () => {
      if (!onSaveNote || !patient) return;
      
      const newNote: ClinicalNote = {
          id: `TELE-${Date.now()}`,
          patientId: patient.id,
          type: 'Nota de Teleconsulta (Evolución)',
          date: new Date().toLocaleString('es-MX'),
          author: 'Dr. Alejandro Méndez', 
          content: {
              subjective: clinicalNote.subjective,
              objective: `Signos Vitales Reportados: T:${clinicalNote.objectiveVitals.temp}, FC:${clinicalNote.objectiveVitals.hr}, FR:${clinicalNote.objectiveVitals.rr}, SatO2:${clinicalNote.objectiveVitals.o2}, TA:${clinicalNote.objectiveVitals.bp}.\n\nExploración (Video): ${clinicalNote.objectiveExam}`,
              analysis: clinicalNote.analysis,
              plan: clinicalNote.plan,
              duration: formatTime(elapsedTime)
          },
          isSigned: true,
          hash: `CERT-TELE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          origin: 'Telemedicine' 
      };

      onSaveNote(newNote);
      alert('Nota de evolución guardada en el expediente.');
  };

  const handleSubmitHomeLab = () => {
      if (labSelection.length === 0 || !labAddress) return alert("Seleccione estudios y confirme dirección.");
      
      const req: HomeServiceRequest = {
          id: `HOME-${Date.now()}`,
          patientId: patient!.id,
          patientName: patient!.name,
          patientAddress: labAddress,
          requestedBy: 'Dr. Alejandro Méndez',
          requestedDate: new Date().toISOString(),
          status: 'Pendiente',
          studies: labSelection
      };

      if (onAddHomeRequest) onAddHomeRequest(req);
      
      alert("Solicitud de unidad móvil generada exitosamente. El equipo de enfermería ha sido notificado.");
      setLabSelection([]);
      setActiveSidePanel('notes');
  };

  const handleEndCall = () => {
      if (window.confirm("¿Finalizar consulta y cerrar sesión? Se recomienda guardar la nota primero.")) {
          if (onUpdatePatient && patient) {
              onUpdatePatient({ ...patient, status: PatientStatus.ATTENDED });
          }
          navigate('/telemedicine');
      }
  };

  if (!patient) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Paciente no encontrado</div>;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-500">
      
      {/* --- TOP BAR (FLOATING) --- */}
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-start pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button 
              onClick={() => {
                  if(window.confirm("¿Salir de la sala? La llamada continuará en segundo plano.")) navigate('/telemedicine');
              }}
              className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-2.5 shadow-lg">
               <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
               <span className="text-white font-mono font-bold text-sm tracking-wider">{formatTime(elapsedTime)}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Canal Seguro HIPAA
              </span>
            </div>
          </div>
          
          <div className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4 flex items-center gap-4 shadow-lg">
             <div className="text-right">
                <p className="text-white font-black text-xs uppercase tracking-wide">{patient.name}</p>
                <p className="text-slate-400 text-[9px] font-bold uppercase">{patient.age} Años • {patient.sex}</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-inner border border-white/10">
                {patient.name.charAt(0)}
             </div>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex relative">
          
          {/* MAIN VIDEO (PATIENT) */}
          <div className={`flex-1 bg-slate-900 flex items-center justify-center relative transition-all duration-300 ${activeSidePanel !== 'none' ? 'mr-96' : ''}`}>
              {/* Simulated Video Feed */}
              <div className="relative w-full h-full flex items-center justify-center">
                  <div className="text-center opacity-40 animate-pulse">
                    <div className="w-48 h-48 bg-slate-800 rounded-full flex items-center justify-center text-6xl font-black text-slate-600 mx-auto mb-6 border-4 border-slate-700/50 shadow-2xl">
                      {patient.name.charAt(0)}
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Señal de Video Remota</p>
                  </div>
                  
                  {/* Connection Quality Indicator */}
                  <div className="absolute top-1/2 right-10 flex flex-col gap-1 opacity-50">
                      <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                      <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                      <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                      <div className="w-1 h-6 bg-slate-600 rounded-full"></div>
                  </div>
              </div>

              {/* SELF VIEW (PiP) - DRAGGABLE CONCEPT */}
              <div className="absolute bottom-24 right-6 w-64 aspect-video bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-20 group cursor-move hover:border-violet-500/50 transition-all">
                 {isVideoOn ? (
                     <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cámara Local</span>
                        {!isMicOn && <div className="absolute top-2 left-2 p-1.5 bg-rose-500 rounded-lg"><MicOff size={12} className="text-white"/></div>}
                     </div>
                 ) : (
                     <div className="w-full h-full bg-slate-900 flex items-center justify-center flex-col gap-2">
                        <VideoOff size={24} className="text-rose-500"/>
                        <span className="text-[8px] font-bold text-rose-500 uppercase">Cámara Desactivada</span>
                     </div>
                 )}
                 <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-white/20">
                    <Minimize2 size={12} className="text-white"/>
                 </div>
              </div>
          </div>

          {/* --- SIDE PANEL (CHAT / NOTES / HISTORY / LAB) --- */}
          <div className={`fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 z-40 flex flex-col ${activeSidePanel !== 'none' ? 'translate-x-0' : 'translate-x-full'}`}>
              
              {/* Header Panel */}
              <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                      {activeSidePanel === 'chat' && <><MessageSquare size={16} className="text-blue-600"/> Chat Seguro</>}
                      {activeSidePanel === 'notes' && <><FileText size={16} className="text-emerald-600"/> Nota de Evolución</>}
                      {activeSidePanel === 'history' && <><History size={16} className="text-violet-600"/> Historial Clínico</>}
                      {activeSidePanel === 'lab' && <><Ambulance size={16} className="text-rose-600"/> Lab. a Domicilio</>}
                  </h3>
                  <button onClick={() => setActiveSidePanel('none')} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>

              {/* CONTENT: CHAT */}
              {activeSidePanel === 'chat' && (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.isSystem ? 'items-center my-4' : m.sender === 'Dr. Méndez' ? 'items-end' : 'items-start'}`}>
                                {m.isSystem ? (
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">{m.text}</span>
                                ) : (
                                    <>
                                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${m.sender === 'Dr. Méndez' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                                            {m.text}
                                        </div>
                                        <span className="text-[9px] text-slate-300 font-bold mt-1 px-1">{m.time}</span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
                        <div className="relative flex items-center gap-2">
                            <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"><Paperclip size={18}/></button>
                            <input 
                                className="flex-1 pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:bg-white transition-all placeholder:text-slate-300"
                                placeholder="Escribir mensaje..."
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                            />
                            <button type="submit" className="p-2 bg-violet-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md"><Send size={16}/></button>
                        </div>
                    </form>
                  </>
              )}

              {/* CONTENT: HOME LAB REQUEST */}
              {activeSidePanel === 'lab' && (
                  <div className="flex-1 flex flex-col p-6 bg-slate-50/50 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><MapPin size={10}/> Dirección de Toma</label>
                          <textarea 
                             className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium"
                             rows={3}
                             value={labAddress}
                             onChange={e => setLabAddress(e.target.value)}
                          />
                      </div>
                      
                      <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1"><FlaskConical size={10}/> Selección de Estudios</label>
                          <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                              {LAB_CATALOG.map((lab) => {
                                  const isSelected = labSelection.includes(lab.name);
                                  return (
                                      <button 
                                        key={lab.name}
                                        onClick={() => setLabSelection(prev => isSelected ? prev.filter(l => l !== lab.name) : [...prev, lab.name])}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                      >
                                          <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-rose-700' : 'text-slate-600'}`}>{lab.name}</span>
                                          {isSelected ? <CheckCircle2 size={14} className="text-rose-600"/> : <Plus size={14} className="text-slate-300"/>}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      <div className="mt-auto pt-4">
                          <button 
                            onClick={handleSubmitHomeLab}
                            className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                          >
                             <Ambulance size={16}/> Solicitar Unidad Móvil
                          </button>
                      </div>
                  </div>
              )}

              {/* CONTENT: HISTORY */}
              {activeSidePanel === 'history' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 custom-scrollbar">
                      {patientHistory.length > 0 ? patientHistory.map((note) => (
                          <div key={note.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${note.origin === 'Telemedicine' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'}`}>
                                      {note.origin === 'Telemedicine' ? 'Telemedicina' : 'Presencial'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold">{note.date}</span>
                              </div>
                              <h4 className="text-xs font-black uppercase text-slate-900">{note.type}</h4>
                              {note.content.diagnosis && <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 italic">Dx: {note.content.diagnosis}</p>}
                              <div className="mt-3 pt-3 border-t border-slate-50 text-right">
                                  <button className="text-[9px] font-bold text-blue-600 hover:underline">Ver Detalles</button>
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-10 opacity-40">
                              <p className="text-xs font-black text-slate-400 uppercase">Sin historial previo</p>
                          </div>
                      )}
                  </div>
              )}

              {/* CONTENT: PSOAP NOTES */}
              {activeSidePanel === 'notes' && (
                  <div className="flex-1 flex flex-col">
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                          {/* S: SUBJETIVO */}
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} className="text-blue-500"/> (S) Subjetivo</label>
                              <textarea 
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-blue-400 transition-all h-24 resize-none text-slate-700 shadow-sm" 
                                placeholder="Motivo de consulta, sintomatología referida por el paciente..." 
                                value={clinicalNote.subjective}
                                onChange={e => setClinicalNote({...clinicalNote, subjective: e.target.value})}
                              />
                          </div>

                          {/* O: OBJETIVO (VITALES & EXAMEN) */}
                          <div className="space-y-3">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="text-emerald-500"/> (O) Objetivo - Signos Vitales</label>
                              <div className="grid grid-cols-3 gap-2">
                                  <input className="p-2 text-center rounded-xl border border-slate-200 text-[10px] font-bold outline-none" placeholder="T.A." value={clinicalNote.objectiveVitals.bp} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, bp: e.target.value}})} />
                                  <input className="p-2 text-center rounded-xl border border-slate-200 text-[10px] font-bold outline-none" placeholder="F.C." value={clinicalNote.objectiveVitals.hr} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, hr: e.target.value}})} />
                                  <input className="p-2 text-center rounded-xl border border-slate-200 text-[10px] font-bold outline-none" placeholder="F.R." value={clinicalNote.objectiveVitals.rr} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, rr: e.target.value}})} />
                                  <input className="p-2 text-center rounded-xl border border-slate-200 text-[10px] font-bold outline-none" placeholder="Temp" value={clinicalNote.objectiveVitals.temp} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, temp: e.target.value}})} />
                                  <input className="p-2 text-center rounded-xl border border-slate-200 text-[10px] font-bold outline-none" placeholder="SatO2" value={clinicalNote.objectiveVitals.o2} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, o2: e.target.value}})} />
                              </div>
                              <textarea 
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-emerald-400 transition-all h-20 resize-none text-slate-700 shadow-sm mt-2" 
                                placeholder="Exploración física observacional (video)..." 
                                value={clinicalNote.objectiveExam}
                                onChange={e => setClinicalNote({...clinicalNote, objectiveExam: e.target.value})}
                              />
                          </div>

                          {/* A: ANÁLISIS */}
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Stethoscope size={12} className="text-amber-500"/> (A) Análisis / Diagnóstico</label>
                              <textarea 
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-amber-400 transition-all h-24 resize-none text-slate-700 shadow-sm" 
                                placeholder="Impresión diagnóstica y análisis clínico..." 
                                value={clinicalNote.analysis}
                                onChange={e => setClinicalNote({...clinicalNote, analysis: e.target.value})}
                              />
                          </div>

                          {/* P: PLAN */}
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={12} className="text-indigo-500"/> (P) Plan de Tratamiento</label>
                              <textarea 
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-400 transition-all h-24 resize-none text-slate-700 shadow-sm" 
                                placeholder="Medicamentos, indicaciones, estudios, alarma..." 
                                value={clinicalNote.plan}
                                onChange={e => setClinicalNote({...clinicalNote, plan: e.target.value})}
                              />
                          </div>
                      </div>
                      <div className="p-6 border-t border-slate-100 bg-white">
                          <button onClick={handleSaveNote} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                              <Save size={14}/> Guardar Nota en Expediente
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* --- BOTTOM CONTROL BAR --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
              <button 
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)]'}`}
                title={isMicOn ? "Silenciar" : "Activar Micrófono"}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              
              <button 
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)]'}`}
                title={isVideoOn ? "Apagar Cámara" : "Encender Cámara"}
              >
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <div className="w-px h-8 bg-white/10 mx-1"></div>

              <button className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all" title="Compartir Pantalla">
                <Share size={20} />
              </button>

              <button 
                onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? 'none' : 'chat')} 
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all relative ${activeSidePanel === 'chat' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title="Chat"
              >
                <MessageSquare size={20} />
                {!activeSidePanel && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-black"></span>}
              </button>

              <button 
                onClick={() => setActiveSidePanel(activeSidePanel === 'history' ? 'none' : 'history')} 
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all relative ${activeSidePanel === 'history' ? 'bg-violet-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title="Ver Expediente"
              >
                <History size={20} />
              </button>
              
              <button 
                onClick={() => setActiveSidePanel(activeSidePanel === 'lab' ? 'none' : 'lab')} 
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all relative ${activeSidePanel === 'lab' ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title="Solicitar Lab. Domicilio"
              >
                <Ambulance size={20} />
              </button>

              <button 
                onClick={() => setActiveSidePanel(activeSidePanel === 'notes' ? 'none' : 'notes')} 
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeSidePanel === 'notes' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title="Nota de Evolución"
              >
                <PenTool size={20} />
              </button>

              <div className="w-px h-8 bg-white/10 mx-1"></div>

              <button 
                onClick={handleEndCall}
                className="h-14 px-8 rounded-[1.5rem] bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all font-black text-xs uppercase tracking-widest shadow-xl"
              >
                <PhoneOff size={20} className="mr-2" /> Finalizar
              </button>
          </div>
      </div>

    </div>
  );
};

export default Telemedicine;
