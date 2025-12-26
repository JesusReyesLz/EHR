
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Settings, ShieldCheck, LogOut, ClipboardList,
  FileSpreadsheet, Package, Monitor as MonitorIcon, History, FileText,
  Activity, FlaskConical, HeartPulse, Bed, ShoppingBag, Tag
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
import HistoryRegistries from './views/HistoryRegistries';
import EvolutionNote from './views/notes/EvolutionNote';
import EmergencyNote from './views/notes/EmergencyNote';
import SurgicalNote from './views/notes/SurgicalNote';
import DischargeNote from './views/notes/DischargeNote';
import InterconsultaNote from './views/notes/InterconsultaNote';
import ESAVINote from './views/notes/ESAVINote';
import InformedConsent from './views/InformedConsent';
import VoluntaryDischarge from './views/VoluntaryDischarge';
import MPNotification from './views/MPNotification';
import DeathCertificate from './views/DeathCertificate';
import TransfusionRegistry from './views/TransfusionRegistry';
import SocialWorkSheet from './views/SocialWorkSheet';
import StomatologyExpedient from './views/StomatologyExpedient';
import EpidemiologyStudy from './views/EpidemiologyStudy';
import TelemedicineConsent from './views/TelemedicineConsent';
import HospitalMonitor from './views/HospitalMonitor';
import Billing from './views/Billing';
import PriceCatalog from './views/PriceCatalog';
import { ModuleType, Patient, ClinicalNote, PatientStatus, PriorityLevel, DoctorInfo, AgendaStatus } from './types';
import { INITIAL_PATIENTS } from './constants';

function Layout({ children, currentModule, onModuleChange, doctorInfo }: any) {
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = [
    { icon: <Users className="w-5 h-5" />, label: 'Monitor Activo', path: '/' },
    { icon: <MonitorIcon className="w-5 h-5" />, label: 'Centro de Mando', path: '/monitor' },
    { icon: <ShoppingBag className="w-5 h-5" />, label: 'Caja', path: '/billing' },
    { icon: <History className="w-5 h-5" />, label: 'Archivo Histórico', path: '/history-registry' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Agenda Operativa', path: '/agenda' },
    { icon: <Package className="w-5 h-5" />, label: 'Farmacia / Stock', path: '/inventory' },
    { icon: <Tag className="w-5 h-5" />, label: 'Catálogo Precios', path: '/prices' },
    { icon: <FileSpreadsheet className="w-5 h-5" />, label: 'Hoja Diaria (SUIVE)', path: '/daily-report' },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Bitácoras', path: '/logs' },
    { icon: <Settings className="w-5 h-5" />, label: 'Configuración', path: '/settings' },
  ];

  const modules = [ModuleType.OUTPATIENT, ModuleType.EMERGENCY, ModuleType.HOSPITALIZATION, ModuleType.AUXILIARY];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm no-print">
        <div className="max-w-full px-6 flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><ShieldCheck className="text-white w-6 h-6" /></div>
              <span className="text-xl font-black tracking-tighter uppercase hidden md:block">MedExpediente <span className="text-blue-600">MX</span></span>
            </div>
            <div className="hidden lg:flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              {modules.map((mod) => (
                <button
                  key={mod}
                  onClick={() => {
                    onModuleChange(mod);
                    if (location.pathname !== '/') navigate('/');
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentModule === mod && location.pathname === '/' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                  {mod}
                </button>
              ))}
              <button
                onClick={() => navigate('/billing')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === '/billing' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
              >
                Caja
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black uppercase tracking-tighter">Dr. {doctorInfo?.name}</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase">Cédula: {doctorInfo?.cedula}</p>
            </div>
            <button className="p-2.5 text-slate-500 hover:text-red-600 bg-slate-50 rounded-xl border border-slate-100"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 fixed left-0 top-16 h-full z-50 no-print flex flex-col">
          <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <Link key={item.label} to={item.path} className={`flex items-center px-4 py-3.5 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-slate-50'}`}>
                <div className={location.pathname === item.path ? 'text-blue-400' : 'text-slate-500'}>{item.icon}</div>
                <span className="ml-4 font-black text-xs uppercase tracking-widest hidden lg:block">{item.label}</span>
              </Link>
            ))}
          </div>
        </aside>
        <main className="flex-1 ml-20 lg:ml-72 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.OUTPATIENT);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({ name: 'JESUS REYES LOZANO', cedula: '12840177', institution: 'UNAM', specialty: 'Médico Cirujano', email: 'dr.reyes@medexpediente.mx', address: 'AV. PASEO DE LOS LEONES 2345, MONTERREY', phone: '81 1234 5678', hospital: 'CENTRO MÉDICO SAN FRANCISCO' });
  const [patients, setPatients] = useState<Patient[]>(() => JSON.parse(localStorage.getItem('med_patients_v6') || JSON.stringify(INITIAL_PATIENTS)));
  const [notes, setNotes] = useState<ClinicalNote[]>(() => JSON.parse(localStorage.getItem('med_notes_v6') || '[]'));

  useEffect(() => {
    localStorage.setItem('med_patients_v6', JSON.stringify(patients));
    localStorage.setItem('med_notes_v6', JSON.stringify(notes));
  }, [patients, notes]);

  const updatePatient = (updated: Patient) => setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
  
  const updatePatientStatus = (id: string, status: PatientStatus, agendaStatus?: AgendaStatus) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status, agendaStatus: agendaStatus || p.agendaStatus } : p));
  };

  const updatePatientPriority = (id: string, priority: PriorityLevel) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, priority } : p));
  };

  // Función inteligente para guardar (nuevo) o actualizar (existente) paciente
  const handleSavePatient = (p: Patient) => {
    setPatients(prev => {
      const index = prev.findIndex(item => item.id === p.id);
      if (index >= 0) {
        const newPatients = [...prev];
        newPatients[index] = p;
        return newPatients;
      }
      return [...prev, p];
    });
  };

  const addNote = (newNote: ClinicalNote) => setNotes(prev => [newNote, ...prev]);

  return (
    <Router>
      <Layout currentModule={currentModule} onModuleChange={setCurrentModule} doctorInfo={doctorInfo}>
        <Routes>
          <Route path="/" element={<Dashboard module={currentModule} patients={patients} onUpdateStatus={updatePatientStatus} onUpdatePriority={updatePatientPriority} onModuleChange={setCurrentModule} onUpdatePatient={updatePatient} doctorInfo={doctorInfo} />} />
          <Route path="/billing" element={<Billing patients={patients} notes={notes} />} />
          <Route path="/prices" element={<PriceCatalog />} />
          <Route path="/patient/:id" element={<PatientProfile patients={patients} notes={notes} onUpdatePatient={updatePatient} onSaveNote={addNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/nursing-sheet" element={<NursingSheet patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />
          <Route path="/patient/:id/auxiliary-report" element={<AuxiliaryReport patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />
          <Route path="/patient/:id/auxiliary-order" element={<AuxiliaryOrder patients={patients} onSaveNote={addNote} />} />
          <Route path="/auxiliary-intake" element={<AuxiliaryIntake patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} onAddPatient={handleSavePatient} />} />
          <Route path="/patient/:id/note/evolution" element={<EvolutionNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/emergency" element={<EmergencyNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/surgical" element={<SurgicalNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/interconsulta" element={<InterconsultaNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/esavi" element={<ESAVINote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/history" element={<MedicalHistory patients={patients} notes={notes} onUpdatePatient={updatePatient} onSaveNote={addNote} />} />
          <Route path="/patient/:id/prescription" element={<Prescription patients={patients} doctorInfo={doctorInfo} onSaveNote={addNote} />} />
          <Route path="/patient/:id/consent" element={<InformedConsent patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/telemedicine-consent" element={<TelemedicineConsent patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/voluntary-discharge" element={<VoluntaryDischarge patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/mp-notification" element={<MPNotification patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/death-certificate" element={<DeathCertificate patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/transfusion" element={<TransfusionRegistry patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/social-work" element={<SocialWorkSheet patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/stomatology" element={<StomatologyExpedient patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/epidemiology" element={<EpidemiologyStudy patients={patients} onSaveNote={addNote} />} />
          <Route path="/monitor" element={<HospitalMonitor patients={patients} onUpdatePatient={updatePatient} />} />
          <Route path="/history-registry" element={<HistoryRegistries patients={patients} notes={notes} />} />
          <Route path="/agenda" element={<Agenda onUpdateStatus={updatePatientStatus} patients={patients} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/logs" element={<AdminLogs />} />
          <Route path="/daily-report" element={<DailyReport patients={patients} notes={notes} />} />
          <Route path="/settings" element={<SettingsView doctorInfo={doctorInfo} onUpdateDoctor={setDoctorInfo} />} />
          <Route path="/new-patient" element={<NewPatient onAdd={handleSavePatient} patients={patients} />} />
          <Route path="/edit-patient/:id" element={<NewPatient onAdd={handleSavePatient} patients={patients} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
