
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, VideoOff, Mic, MicOff, ShieldCheck, MessageSquare, PhoneOff, 
  ChevronLeft, Clock, FileText, User, Send, X, Minimize2, Share, 
  MoreVertical, Paperclip, Smile, Maximize2, Layout, Save, Stethoscope, Activity, ClipboardList, PenTool, CheckCircle2,
  History, Ambulance, MapPin, FlaskConical, Plus, AlertTriangle, Watch, Map, Siren
} from 'lucide-react';
import { Patient, ClinicalNote, PatientStatus, HomeServiceRequest, Vitals } from '../types';
import { LAB_CATALOG } from '../constants';

interface TelemedicineProps {
  patients?: Patient[]; 
  notes?: ClinicalNote[]; 
  onSaveNote?: (note: ClinicalNote) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onAddHomeRequest?: (req: HomeServiceRequest) => void; 
}

const Telemedicine: React.FC<TelemedicineProps> = ({ patients = [], notes = [], onSaveNote, onUpdatePatient, onAddHomeRequest }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const patient = patients.find(p => p.id === id);
  const patientHistory = notes.filter(n => n.patientId === id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'notes' | 'history' | 'lab'>('notes'); 
  const [elapsedTime, setElapsedTime] = useState(0);
  const [chatMessage, setChatMessage] = useState('');

  // IoT Simulation State
  const [isIoTConnected, setIsIoTConnected] = useState(false);
  const [iotData, setIotData] = useState<Partial<Vitals>>({});

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

  const handleConnectIoT = () => {
      setIsIoTConnected(true);
      // Simulate data fetch
      setTimeout(() => {
          const newData = {
              hr: Math.floor(Math.random() * (90 - 60 + 1) + 60),
              o2: Math.floor(Math.random() * (100 - 95 + 1) + 95),
              temp: 36.6
          };
          setIotData(newData);
          setClinicalNote(prev => ({
              ...prev,
              objectiveVitals: { ...prev.objectiveVitals, hr: newData.hr.toString(), o2: newData.o2.toString(), temp: newData.temp.toString() }
          }));
          alert("Dispositivo Wearable Vinculado Exitosamente.");
      }, 1500);
  };

  const handlePanicButton = () => {
      if(confirm("¿ACTIVAR PROTOCOLO DE EMERGENCIA?\n\nSe enviará la ubicación del paciente a servicios de urgencia locales y se notificará a contactos de emergencia.")) {
          alert("ALERTA ENVIADA. Servicios de emergencia notificados con coordenadas GPS.");
          // In a real app, this would trigger backend logic.
      }
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
              objective: `Signos Vitales (IoT/Reportados): T:${clinicalNote.objectiveVitals.temp}, FC:${clinicalNote.objectiveVitals.hr}, FR:${clinicalNote.objectiveVitals.rr}, SatO2:${clinicalNote.objectiveVitals.o2}, TA:${clinicalNote.objectiveVitals.bp}.\n\nExploración (Video): ${clinicalNote.objectiveExam}`,
              analysis: clinicalNote.analysis,
              plan: clinicalNote.plan,
              duration: formatTime(elapsedTime)
          },
          isSigned: true,
          hash: `CERT-TELE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          origin: 'Telemedicine' 
      };

      onSaveNote(newNote);
      alert('Nota de evolución guardada y firmada digitalmente.');
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
      if (window.confirm("¿Finalizar consulta y cerrar sesión? Se generará el Resumen Clínico para el paciente.")) {
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
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start pointer-events-none">
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
            
            <button onClick={handlePanicButton} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-lg border border-rose-500 animate-pulse">
                <Siren size={16}/> <span className="text-[10px] font-black uppercase">S.O.S.</span>
            </button>
          </div>
          
          <div className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4 flex items-center gap-4 shadow-lg">
             <div className="text-right">
                <p className="text-white font-black text-xs uppercase tracking-wide">{patient.name}</p>
                <p className="text-slate-400 text-[9px] font-bold uppercase">{patient.age} Años • {patient.sex}</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0057B8] to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner border border-white/10">
                {patient.name.charAt(0)}
             </div>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA (SPLIT SCREEN) --- */}
      <div className="flex-1 flex relative">
          
          {/* LEFT: MAIN VIDEO (PATIENT) */}
          <div className={`flex-1 bg-slate-900 flex items-center justify-center relative transition-all duration-300 ${activeSidePanel !== 'notes' ? 'w-full' : 'w-1/2'}`}>
              {/* Simulated Video Feed */}
              <div className="relative w-full h-full flex items-center justify-center bg-slate-800">
                  <div className="text-center opacity-40 animate-pulse">
                    <div className="w-48 h-48 bg-slate-700 rounded-full flex items-center justify-center text-6xl font-black text-slate-500 mx-auto mb-6 border-4 border-slate-600 shadow-2xl">
                      {patient.name.charAt(0)}
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Señal de Video Encriptada</p>
                  </div>
                  
                  {/* IoT Overlay */}
                  {isIoTConnected && (
                      <div className="absolute top-24 left-6 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 text-emerald-400 shadow-2xl animate-in slide-in-from-left-4">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                              <Watch size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Apple Watch Series 8</span>
                          </div>
                          <div className="space-y-1">
                              <p className="text-xs font-bold">FC: <span className="text-lg font-black text-white">{iotData.hr}</span> lpm</p>
                              <p className="text-xs font-bold">SpO2: <span className="text-lg font-black text-white">{iotData.o2}</span> %</p>
                          </div>
                      </div>
                  )}
              </div>

              {/* SELF VIEW (PiP) */}
              <div className="absolute bottom-24 left-6 w-48 aspect-video bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-20 group hover:border-blue-500/50 transition-all">
                 {isVideoOn ? (
                     <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Dr. Méndez</span>
                        {!isMicOn && <div className="absolute top-2 left-2 p-1 bg-rose-500 rounded-md"><MicOff size={10} className="text-white"/></div>}
                     </div>
                 ) : (
                     <div className="w-full h-full bg-slate-900 flex items-center justify-center flex-col gap-2">
                        <VideoOff size={18} className="text-rose-500"/>
                     </div>
                 )}
              </div>
          </div>

          {/* RIGHT: SOAP EDITOR / TOOLS (The "Split Screen") */}
          <div className="w-[500px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50">
                  <button onClick={() => setActiveSidePanel('notes')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeSidePanel === 'notes' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Nota SOAP</button>
                  <button onClick={() => setActiveSidePanel('history')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeSidePanel === 'history' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Historial</button>
                  <button onClick={() => setActiveSidePanel('lab')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeSidePanel === 'lab' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Estudios</button>
                  <button onClick={() => setActiveSidePanel('chat')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeSidePanel === 'chat' ? 'bg-white text-[#0057B8] border-b-2 border-[#0057B8]' : 'text-slate-400'}`}>Chat</button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
                  {activeSidePanel === 'notes' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><FileText size={14}/> Nota Clínica (En Vivo)</h3>
                              {!isIoTConnected && (
                                  <button onClick={handleConnectIoT} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-600 transition-all flex items-center gap-2">
                                      <Watch size={12}/> Vincular IoT
                                  </button>
                              )}
                          </div>
                          
                          <div className="space-y-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">(S) Subjetivo</label>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-24 resize-none outline-none focus:border-blue-400 transition-all" value={clinicalNote.subjective} onChange={e => setClinicalNote({...clinicalNote, subjective: e.target.value})} placeholder="Síntomas referidos..." />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">(O) Objetivo / Vitales</label>
                                  <div className="grid grid-cols-3 gap-2 mb-2">
                                      <input className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] text-center font-bold" placeholder="FC" value={clinicalNote.objectiveVitals.hr} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, hr: e.target.value}})} />
                                      <input className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] text-center font-bold" placeholder="SpO2" value={clinicalNote.objectiveVitals.o2} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, o2: e.target.value}})} />
                                      <input className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] text-center font-bold" placeholder="Temp" value={clinicalNote.objectiveVitals.temp} onChange={e => setClinicalNote({...clinicalNote, objectiveVitals: {...clinicalNote.objectiveVitals, temp: e.target.value}})} />
                                  </div>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-16 resize-none outline-none focus:border-blue-400 transition-all" value={clinicalNote.objectiveExam} onChange={e => setClinicalNote({...clinicalNote, objectiveExam: e.target.value})} placeholder="Hallazgos visuales..." />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">(A) Análisis / Diagnóstico</label>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-20 resize-none outline-none focus:border-blue-400 transition-all" value={clinicalNote.analysis} onChange={e => setClinicalNote({...clinicalNote, analysis: e.target.value})} placeholder="Impresión diagnóstica..." />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">(P) Plan / Tratamiento</label>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium h-24 resize-none outline-none focus:border-blue-400 transition-all" value={clinicalNote.plan} onChange={e => setClinicalNote({...clinicalNote, plan: e.target.value})} placeholder="Medicamentos y medidas..." />
                              </div>
                          </div>
                      </div>
                  )}

                  {activeSidePanel === 'history' && (
                      <div className="space-y-4">
                           {patientHistory.map((note) => (
                              <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                      <span className="text-[9px] font-black uppercase text-slate-400">{note.date}</span>
                                      <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">{note.type}</span>
                                  </div>
                                  {note.content.diagnosis && <p className="text-xs font-medium text-slate-700">{note.content.diagnosis}</p>}
                              </div>
                           ))}
                      </div>
                  )}

                  {activeSidePanel === 'lab' && (
                       <div className="space-y-4">
                           <div className="bg-white p-4 rounded-xl border border-slate-200">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dirección de Toma</label>
                               <textarea className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" value={labAddress} onChange={e => setLabAddress(e.target.value)} />
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                               {LAB_CATALOG.map((lab) => (
                                   <button key={lab.name} onClick={() => setLabSelection(prev => prev.includes(lab.name) ? prev.filter(l => l !== lab.name) : [...prev, lab.name])} className={`p-3 rounded-xl border text-left text-[10px] font-bold uppercase ${labSelection.includes(lab.name) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                       {lab.name}
                                   </button>
                               ))}
                           </div>
                           <button onClick={handleSubmitHomeLab} className="w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-rose-700">Solicitar Unidad Móvil</button>
                       </div>
                  )}
                  
                  {activeSidePanel === 'chat' && (
                      <div className="flex flex-col h-full">
                          <div className="flex-1 space-y-3 mb-4">
                              {messages.map((m, i) => (
                                  <div key={i} className={`flex flex-col ${m.isSystem ? 'items-center' : m.sender.includes('Dr') ? 'items-end' : 'items-start'}`}>
                                      <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${m.isSystem ? 'bg-slate-100 text-slate-500 text-[9px] uppercase font-bold' : m.sender.includes('Dr') ? 'bg-[#0057B8] text-white' : 'bg-white border border-slate-200'}`}>
                                          {m.text}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                              <input className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                              <button type="submit" className="p-3 bg-[#0057B8] text-white rounded-xl"><Send size={14}/></button>
                          </form>
                      </div>
                  )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
                  <button onClick={handleSaveNote} className="py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                      <Save size={14}/> Guardar
                  </button>
                  <button onClick={handleEndCall} className="py-3 bg-[#0057B8] text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2">
                      <PhoneOff size={14}/> Finalizar
                  </button>
              </div>
          </div>
      </div>

      {/* --- BOTTOM CONTROL BAR (VIDEO) --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transform -translate-x-[250px]">
          <div className="flex items-center gap-4 p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
              <button onClick={() => setIsMicOn(!isMicOn)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white'}`}>
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={() => setIsVideoOn(!isVideoOn)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white'}`}>
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                <Share size={20} />
              </button>
          </div>
      </div>

    </div>
  );
};

export default Telemedicine;
