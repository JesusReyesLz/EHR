import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Settings, ShieldCheck, LogOut, ClipboardList,
  FileSpreadsheet, Package, Monitor as MonitorIcon, History, FileText,
  Activity, FlaskConical, HeartPulse, Bed, ShoppingBag, Tag, PieChart
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
import Finance from './views/Finance';
import StaffManagement from './views/StaffManagement';
import TelemedicineDashboard from './views/TelemedicineDashboard';
import HomeServices from './views/HomeServices';
import { ModuleType, Patient, ClinicalNote, PatientStatus, PriorityLevel, DoctorInfo, AgendaStatus, HomeServiceRequest, StaffMember } from './types';
import { INITIAL_PATIENTS, MOCK_DOCTORS, INITIAL_STAFF } from './constants';

function Layout({ children, currentModule, onModuleChange, doctorInfo }: any) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detectar si estamos en un perfil de paciente para mantener el contexto
  const patientMatch = location.pathname.match(/\/patient\/([^/]+)/);
  const currentPatientId = patientMatch ? patientMatch[1] : null;

  const menuItems = [
    { icon: <Users className="w-4 h-4" />, label: 'Monitor Activo', path: '/' },
    { icon: <MonitorIcon className="w-4 h-4" />, label: 'Centro de Mando', path: '/monitor' },
    // Accesos directos a Finanzas y Caja
    { icon: <ShoppingBag className="w-4 h-4" />, label: 'Caja / Tickets', path: '/billing', state: currentPatientId ? { patientId: currentPatientId } : undefined },
    { icon: <PieChart className="w-4 h-4" />, label: 'Finanzas', path: '/finance' },
    // Fin Módulos Financieros
    { icon: <History className="w-4 h-4" />, label: 'Archivo Histórico', path: '/history-registry' },
    { icon: <Calendar className="w-4 h-4" />, label: 'Agenda Operativa', path: '/agenda' },
    { icon: <Package className="w-4 h-4" />, label: 'Farmacia / Stock', path: '/inventory' },
    { icon: <Tag className="w-4 h-4" />, label: 'Catálogo Precios', path: '/prices' },
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Hoja Diaria (SUIVE)', path: '/daily-report' },
    { icon: <ClipboardList className="w-4 h-4" />, label: 'Bitácoras', path: '/logs' },
    { icon: <Settings className="w-4 h-4" />, label: 'Configuración', path: '/settings' },
  ];

  // AGREGADOS BILLING Y FINANCE AL TOP BAR PARA ACCESO RÁPIDO
  const modules = [
    ModuleType.OUTPATIENT, 
    ModuleType.EMERGENCY, 
    ModuleType.HOSPITALIZATION, 
    ModuleType.AUXILIARY, 
    ModuleType.BILLING,
    ModuleType.FINANCE,
    ModuleType.STAFF,
    ModuleType.TELEMEDICINE,
    ModuleType.HOME_SERVICES
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm no-print">
        <div className="max-w-full px-2 lg:px-6 flex justify-between h-16 items-center gap-2">
          {/* Left Section: Logo */}
          <div className="flex items-center gap-4 flex-1 min-w-0"> 
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><ShieldCheck className="text-white w-5 h-5 lg:w-6 lg:h-6" /></div>
              <span className="text-xl font-black tracking-tighter uppercase block">MedExpediente <span className="text-blue-600">MX</span></span>
            </div>
            <div className="hidden xl:flex items-center bg-slate-100 rounded-xl p-1 gap-1 overflow-x-auto no-scrollbar">
              {modules.map((mod) => (
                <button
                  key={mod}
                  onClick={() => {
                      if (mod === ModuleType.HOME_SERVICES) navigate('/home-services');
                      else if (mod === ModuleType.TELEMEDICINE) navigate('/telemedicine');
                      else if (mod === ModuleType.STAFF) navigate('/staff');
                      else {
                        if (location.pathname !== '/') navigate('/');
                        onModuleChange(mod);
                      }
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentModule === mod ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                  {mod === ModuleType.BILLING ? 'Caja / Tickets' : mod === ModuleType.FINANCE ? 'Finanzas' : mod === ModuleType.STAFF ? 'RRHH' : mod === ModuleType.TELEMEDICINE ? 'Telemedicina' : mod === ModuleType.HOME_SERVICES ? 'Domiciliario' : mod}
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Section: User Info & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-xs font-black uppercase tracking-tighter">Dr. {doctorInfo?.name}</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase">Cédula: {doctorInfo?.cedula}</p>
            </div>
            <button className="p-2 lg:p-2.5 text-slate-500 hover:text-red-600 bg-slate-50 rounded-xl border border-slate-100"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-16 lg:w-60 bg-white border-r border-slate-200 fixed left-0 top-16 h-full z-50 no-print flex flex-col transition-all duration-300">
          <div className="flex-1 py-2 lg:py-4 px-2 lg:px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <Link 
                key={item.label} 
                to={item.path} 
                state={(item as any).state}
                title={item.label}
                className={`flex items-center justify-center lg:justify-start px-0 lg:px-3 py-2.5 rounded-xl transition-all group ${location.pathname === item.path ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className={`shrink-0 ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-500'}`}>{item.icon}</div>
                <span className="ml-3 font-black text-[10px] uppercase tracking-widest hidden lg:block whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              </Link>
            ))}
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 ml-16 lg:ml-60 p-4 lg:p-8 overflow-y-auto transition-all duration-300 w-full">{children}</main>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.OUTPATIENT);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>(MOCK_DOCTORS[0]);
  
  // Safe Initialization with Try-Catch
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('med_patients_v6');
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch { return INITIAL_PATIENTS; }
  });
  
  const [notes, setNotes] = useState<ClinicalNote[]>(() => {
    try {
      const saved = localStorage.getItem('med_notes_v6');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('med_staff_v2');
      let data = saved ? JSON.parse(saved) : INITIAL_STAFF;
      if (!Array.isArray(data)) return INITIAL_STAFF;
      return data;
    } catch { return INITIAL_STAFF; }
  });

  const [homeRequests, setHomeRequests] = useState<HomeServiceRequest[]>(() => {
    try {
      const saved = localStorage.getItem('med_home_requests_v1');
      const data = saved ? JSON.parse(saved) : [];
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  });

  const [doctorsList, setDoctorsList] = useState<DoctorInfo[]>(() => {
    try {
      const saved = localStorage.getItem('med_doctors_v1');
      return saved ? JSON.parse(saved) : MOCK_DOCTORS;
    } catch { return MOCK_DOCTORS; }
  });

  // Effects for Persistence
  useEffect(() => { localStorage.setItem('med_patients_v6', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('med_notes_v6', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('med_staff_v2', JSON.stringify(staffList)); }, [staffList]);
  useEffect(() => { localStorage.setItem('med_home_requests_v1', JSON.stringify(homeRequests)); }, [homeRequests]);
  useEffect(() => { localStorage.setItem('med_doctors_v1', JSON.stringify(doctorsList)); }, [doctorsList]);

  const handleUpdatePatient = (p: Patient) => {
    setPatients(prev => prev.map(pat => pat.id === p.id ? p : pat));
  };
  const handleAddPatient = (p: Patient) => {
    setPatients(prev => [...prev, p]);
  };
  const handleDeletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };
  const handleUpdateStatus = (id: string, status: PatientStatus, agendaStatus?: AgendaStatus) => {
     setPatients(prev => prev.map(p => p.id === id ? { ...p, status, agendaStatus: agendaStatus || p.agendaStatus } : p));
  };
  const handleUpdatePriority = (id: string, priority: PriorityLevel) => {
     setPatients(prev => prev.map(p => p.id === id ? { ...p, priority } : p));
  };
  const handleSaveNote = (note: ClinicalNote) => {
    setNotes(prev => [note, ...prev]);
  };
  const handleUpdateStaffList = (newStaffList: StaffMember[]) => {
    setStaffList(newStaffList);
  };
  const handleAddHomeRequest = (req: HomeServiceRequest) => {
    setHomeRequests(prev => [...prev, req]);
  };
  const handleUpdateHomeRequest = (req: HomeServiceRequest) => {
    setHomeRequests(prev => prev.map(r => r.id === req.id ? req : r));
  };

  return (
    <Router>
      <Layout currentModule={currentModule} onModuleChange={setCurrentModule} doctorInfo={doctorInfo}>
        <Routes>
          <Route path="/" element={
            <Dashboard 
               module={currentModule} 
               patients={patients} 
               notes={notes}
               onUpdateStatus={handleUpdateStatus} 
               onUpdatePriority={handleUpdatePriority}
               onModuleChange={setCurrentModule}
               onUpdatePatient={handleUpdatePatient}
               onDeletePatient={handleDeletePatient}
               doctorInfo={doctorInfo}
               staffList={staffList}
               onUpdateStaffList={handleUpdateStaffList}
               doctorsList={doctorsList}
               homeRequests={homeRequests}
               onAddHomeRequest={handleAddHomeRequest}
               onAddPatient={handleAddPatient}
            />
          } />
          <Route path="/monitor" element={<HospitalMonitor patients={patients} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/patient/:id" element={<PatientProfile patients={patients} notes={notes} onUpdatePatient={handleUpdatePatient} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/billing" element={<Billing patients={patients} notes={notes} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/agenda" element={<Agenda patients={patients} onUpdateStatus={handleUpdateStatus} />} />
          <Route path="/new-patient" element={<NewPatient onAdd={handleAddPatient} patients={patients} />} />
          <Route path="/edit-patient/:id" element={<NewPatient onAdd={handleUpdatePatient} patients={patients} />} />
          <Route path="/telemedicine" element={
            <TelemedicineDashboard 
              patients={patients} 
              onUpdateStatus={handleUpdateStatus} 
              onAddPatient={handleAddPatient} 
              onAddHomeRequest={handleAddHomeRequest} 
              onUpdateHomeRequest={handleUpdateHomeRequest} // Passed prop
              doctorsList={doctorsList} 
              currentUser={doctorInfo} 
              notes={notes} 
              homeRequests={homeRequests}
              staffList={staffList} // Passed prop
            />
          } />
          <Route path="/telemedicine/:id" element={<Telemedicine patients={patients} notes={notes} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} onAddHomeRequest={handleAddHomeRequest} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/staff" element={<StaffManagement staffList={staffList} onUpdateStaffList={handleUpdateStaffList} />} />
          <Route path="/settings" element={<SettingsView doctorInfo={doctorInfo} onUpdateDoctor={setDoctorInfo} />} />
          <Route path="/daily-report" element={<DailyReport patients={patients} notes={notes} />} />
          <Route path="/patient/:id/history" element={<MedicalHistory patients={patients} notes={notes} onUpdatePatient={handleUpdatePatient} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/prescription" element={<Prescription patients={patients} doctorInfo={doctorInfo} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/patient/:id/note/evolution" element={<EvolutionNote patients={patients} notes={notes} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/patient/:id/note/emergency" element={<EmergencyNote patients={patients} notes={notes} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/note/surgical" element={<SurgicalNote patients={patients} notes={notes} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/note/discharge" element={<DischargeNote patients={patients} notes={notes} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/note/interconsulta" element={<InterconsultaNote patients={patients} notes={notes} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/note/esavi" element={<ESAVINote patients={patients} notes={notes} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/nursing-sheet" element={<NursingSheet patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/patient/:id/auxiliary-order" element={<AuxiliaryOrder patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/auxiliary-report" element={<AuxiliaryReport patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/auxiliary-intake" element={<AuxiliaryIntake patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} onAddPatient={handleAddPatient} />} />
          <Route path="/patient/:id/consent" element={<InformedConsent patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/voluntary-discharge" element={<VoluntaryDischarge patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/mp-notification" element={<MPNotification patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/death-certificate" element={<DeathCertificate patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/transfusion" element={<TransfusionRegistry patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/social-work" element={<SocialWorkSheet patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/stomatology" element={<StomatologyExpedient patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/epidemiology" element={<EpidemiologyStudy patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/telemedicine-consent" element={<TelemedicineConsent patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/history-registry" element={<HistoryRegistries patients={patients} notes={notes} />} />
          <Route path="/logs" element={<AdminLogs />} />
          <Route path="/prices" element={<PriceCatalog />} />
          <Route path="/home-services" element={<HomeServices requests={homeRequests} onUpdateRequest={handleUpdateHomeRequest} staffList={staffList} currentUser={doctorInfo} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;