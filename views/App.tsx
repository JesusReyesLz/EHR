
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  ClipboardList,
  FileSpreadsheet,
  Package,
  Monitor as MonitorIcon,
  Search,
  Layout as LayoutIcon
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import PatientProfile from './views/PatientProfile';
import AdminLogs from './views/AdminLogs';
import Telemedicine from './views/Telemedicine';
import Prescription from './views/Prescription';
import NewPatient from './views/NewPatient';
import Agenda from './views/Agenda';
import SettingsView from './views/Settings';
import DailyReport from './views/DailyReport';
import MedicalHistory from './views/MedicalHistory';
import Inventory from './views/Inventory';
import NursingSheet from './views/NursingSheet';
import AuxiliaryReport from './views/AuxiliaryReport';
import AuxiliaryOrder from './views/AuxiliaryOrder';
import AuxiliaryIntake from './views/AuxiliaryIntake';
import InformedConsent from './views/InformedConsent';
import TelemedicineConsent from './views/TelemedicineConsent';
import VoluntaryDischarge from './views/VoluntaryDischarge';
import MPNotification from './views/MPNotification';
import DeathCertificate from './views/DeathCertificate';
import TransfusionRegistry from './views/TransfusionRegistry';
import SocialWorkSheet from './views/SocialWorkSheet';
import StomatologyExpedient from './views/StomatologyExpedient';
import EpidemiologyStudy from './views/EpidemiologyStudy';
import HospitalMonitor from './views/HospitalMonitor';

// Editores Especializados
import EvolutionNote from './views/notes/EvolutionNote';
import EmergencyNote from './views/notes/EmergencyNote';
import SurgicalNote from './views/notes/SurgicalNote';
import ESAVINote from './views/notes/ESAVINote';
import DischargeNote from './views/notes/DischargeNote';
import InterconsultaNote from './views/notes/InterconsultaNote';

import { ModuleType, Patient, ClinicalNote, ConsultationRecord, PatientStatus, PriorityLevel } from './types';
import { INITIAL_PATIENTS } from './constants';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(() => {
    const saved = localStorage.getItem('med_current_module_v5');
    return (saved as ModuleType) || ModuleType.OUTPATIENT;
  });
  
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('med_patients_v5');
    let parsed = saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    return parsed.map((p: any) => ({
      ...p,
      priority: p.priority || PriorityLevel.MEDIUM,
      status: p.status || PatientStatus.WAITING
    }));
  });
  
  const [notes, setNotes] = useState<ClinicalNote[]>(() => {
    const saved = localStorage.getItem('med_notes_v5');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [consultations, setConsultations] = useState<ConsultationRecord[]>(() => {
    const saved = localStorage.getItem('med_consultations_v5');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('med_patients_v5', JSON.stringify(patients));
    localStorage.setItem('med_notes_v5', JSON.stringify(notes));
    localStorage.setItem('med_consultations_v5', JSON.stringify(consultations));
    localStorage.setItem('med_current_module_v5', currentModule);
  }, [patients, notes, consultations, currentModule]);

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const addPatient = (newPatient: Patient) => {
    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatientStatus = (patientId: string, status: PatientStatus) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status } : p));
  };

  const updatePatientPriority = (patientId: string, priority: PriorityLevel) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, priority } : p));
  };

  const addNote = (newNote: ClinicalNote) => {
    setNotes(prev => {
      const index = prev.findIndex(n => n.id === newNote.id);
      if (index !== -1) {
        if (prev[index].isSigned) {
           console.error("Intento de editar una nota inmutable finalizada.");
           return prev;
        }
        const updated = [...prev];
        updated[index] = newNote;
        return updated;
      }
      return [newNote, ...prev];
    });
    
    if (newNote.isSigned) {
      const patient = patients.find(p => p.id === newNote.patientId);
      if (patient) {
        const record: ConsultationRecord = {
          id: `REC-${Date.now()}`,
          date: newNote.date,
          patientName: patient.name,
          curp: patient.curp,
          sex: patient.sex,
          age: patient.age,
          diagnosis: newNote.content.diagnosis || newNote.content.diagnosticoCIE10 || newNote.content.finalDiagnosis || 'Revisión Clínica',
          treatment: newNote.content.plan || newNote.content.planTratamiento || 'Ver expediente',
          module: patient.assignedModule
        };
        setConsultations(prev => [record, ...prev]);
        if (newNote.type.includes('Egreso') || newNote.type.includes('Alta') || newNote.type.includes('Defunción')) {
          updatePatientStatus(patient.id, PatientStatus.ATTENDED);
        }
      }
    }
  };

  return (
    <Router>
      <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
        <Routes>
          <Route path="/" element={<Dashboard module={currentModule} patients={patients} notes={notes} onUpdateStatus={updatePatientStatus} onUpdatePriority={updatePatientPriority} onModuleChange={setCurrentModule} />} />
          <Route path="/monitor" element={<HospitalMonitor patients={patients} onUpdatePatient={updatePatient} />} />
          <Route path="/new-patient" element={<NewPatient onAdd={addPatient} patients={patients} />} />
          <Route path="/edit-patient/:id" element={<NewPatient onAdd={updatePatient} patients={patients} />} />
          <Route path="/patient/:id" element={<PatientProfile patients={patients} notes={notes} onUpdatePatient={updatePatient} onSaveNote={addNote} />} />
          
          <Route path="/patient/:id/note/evolution" element={<EvolutionNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/evolution/:noteId" element={<EvolutionNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/emergency" element={<EmergencyNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/emergency/:noteId" element={<EmergencyNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/surgical" element={<SurgicalNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/surgical/:noteId" element={<SurgicalNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/esavi" element={<ESAVINote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/esavi/:noteId" element={<ESAVINote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/discharge" element={<DischargeNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/discharge/:noteId" element={<DischargeNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/interconsulta" element={<InterconsultaNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/interconsulta/:noteId" element={<InterconsultaNote patients={patients} notes={notes} onSaveNote={addNote} />} />

          <Route path="/patient/:id/history" element={<MedicalHistory patients={patients} notes={notes} onUpdatePatient={updatePatient} onSaveNote={addNote} />} />
          <Route path="/patient/:id/nursing-sheet" element={<NursingSheet patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/auxiliary-order" element={<AuxiliaryOrder patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/auxiliary-report" element={<AuxiliaryReport patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/auxiliary-report/:orderId" element={<AuxiliaryReport patients={patients} notes={notes} onSaveNote={addNote} />} />
          
          <Route path="/auxiliary-intake" element={<AuxiliaryIntake patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />

          <Route path="/patient/:id/consent" element={<InformedConsent patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/telemedicine-consent" element={<TelemedicineConsent patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/voluntary-discharge" element={<VoluntaryDischarge patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/mp-notification" element={<MPNotification patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/death-certificate" element={<DeathCertificate patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/transfusion" element={<TransfusionRegistry patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/social-work" element={<SocialWorkSheet patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/stomatology" element={<StomatologyExpedient patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/epi-study" element={<EpidemiologyStudy patients={patients} onSaveNote={addNote} />} />
          
          <Route path="/patient/:id/telemedicine" element={<Telemedicine />} />
          <Route path="/patient/:id/prescription" element={<Prescription patients={patients} />} />
          <Route path="/agenda" element={<Agenda onUpdateStatus={updatePatientStatus} patients={patients} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/logs" element={<AdminLogs />} />
          <Route path="/daily-report" element={<DailyReport records={consultations} />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const Layout = ({ children, currentModule, onModuleChange }: any) => {
  const location = useLocation();
  const menuItems = [
    { icon: <Users className="w-5 h-5" />, label: 'Pacientes', path: '/' },
    { icon: <MonitorIcon className="w-5 h-5" />, label: 'Centro de Mando', path: '/monitor' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Agenda', path: '/agenda' },
    { icon: <Package className="w-5 h-5" />, label: 'Farmacia / Stock', path: '/inventory' },
    { icon: <FileSpreadsheet className="w-5 h-5" />, label: 'Hoja Diaria (SUIVE)', path: '/daily-report' },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Bitácoras', path: '/logs' },
    { icon: <Settings className="w-5 h-5" />, label: 'Configuración', path: '/settings' },
  ];

  const modules = (Object.values(ModuleType) as ModuleType[]).filter(m => m !== ModuleType.ADMIN && m !== ModuleType.MONITOR);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm no-print">
        <div className="max-w-full px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <span className="ml-4 text-xl font-black tracking-tighter text-slate-900 hidden md:block uppercase">
                  MedExpediente <span className="text-blue-600">MX</span>
                </span>
              </div>
              
              <div className="hidden lg:flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                {modules.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => onModuleChange(mod)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      currentModule === mod 
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-4">
                 <div className="text-right">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tighter leading-none">Dr. Alejandro Méndez</p>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">Cédula Prof: 12345678</p>
                 </div>
                 <div className="w-11 h-11 rounded-xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden ring-1 ring-slate-100">
                    <img src="https://ui-avatars.com/api/?name=Alejandro+Mendez&background=0f172a&color=fff&bold=true" alt="Avatar" />
                 </div>
              </div>
              <button className="p-2.5 text-slate-500 hover:text-red-600 transition-colors bg-slate-50 rounded-xl border border-slate-100">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] z-50 no-print">
          <div className="flex-1 py-8 px-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all group ${
                  location.pathname === item.path
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <div className={`${location.pathname === item.path ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-600'}`}>
                  {item.icon}
                </div>
                <span className={`ml-4 font-black text-xs uppercase tracking-widest hidden lg:block ${location.pathname === item.path ? 'text-white' : 'text-slate-700'}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </aside>

        <main className="flex-1 ml-20 lg:ml-72 p-8 overflow-y-auto scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default App;
