
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Settings, ShieldCheck, LogOut, ClipboardList,
  FileSpreadsheet, Package, Monitor as MonitorIcon, History, FileText,
  Activity, FlaskConical, HeartPulse, Bed, ShoppingBag, Tag, PieChart, Briefcase, Wifi, Ambulance
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import PatientProfile from './views/PatientProfile';
import AdminLogs from './views/AdminLogs';
import Telemedicine from './views/Telemedicine';
import TelemedicineDashboard from './views/TelemedicineDashboard'; // Nuevo Dashboard
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
import HomeServices from './views/HomeServices'; // Nuevo View
import { ModuleType, Patient, ClinicalNote, PatientStatus, PriorityLevel, DoctorInfo, AgendaStatus, HomeServiceRequest, StaffMember } from './types';
import { INITIAL_PATIENTS, INITIAL_STAFF, MOCK_DOCTORS } from './constants';

function Layout({ children, currentModule, onModuleChange, doctorInfo, currentUserPermissions }: any) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const patientMatch = location.pathname.match(/\/patient\/([^/]+)/);
  const currentPatientId = patientMatch ? patientMatch[1] : null;

  const allMenuItems = [
    { icon: <Users className="w-4 h-4" />, label: 'Monitor Activo', path: '/', module: ModuleType.MONITOR },
    { icon: <MonitorIcon className="w-4 h-4" />, label: 'Centro de Mando', path: '/monitor', module: ModuleType.HOSPITALIZATION },
    { icon: <Briefcase className="w-4 h-4" />, label: 'Personal y Turnos', path: '/staff', module: ModuleType.STAFF },
    { icon: <Wifi className="w-4 h-4" />, label: 'Telemedicina', path: '/telemedicine', module: ModuleType.TELEMEDICINE },
    { icon: <Ambulance className="w-4 h-4" />, label: 'Servicios Domicilio', path: '/home-services', module: ModuleType.HOME_SERVICES }, // Nuevo Item
    { icon: <ShoppingBag className="w-4 h-4" />, label: 'Caja / Tickets', path: '/billing', module: ModuleType.BILLING, state: currentPatientId ? { patientId: currentPatientId } : undefined },
    { icon: <PieChart className="w-4 h-4" />, label: 'Finanzas', path: '/finance', module: ModuleType.FINANCE },
    { icon: <History className="w-4 h-4" />, label: 'Archivo Histórico', path: '/history-registry', module: ModuleType.ADMIN },
    { icon: <Calendar className="w-4 h-4" />, label: 'Agenda Operativa', path: '/agenda', module: ModuleType.OUTPATIENT },
    { icon: <Package className="w-4 h-4" />, label: 'Farmacia / Stock', path: '/inventory', module: ModuleType.INVENTORY },
    { icon: <Tag className="w-4 h-4" />, label: 'Catálogo Precios', path: '/prices', module: ModuleType.PRICING },
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Hoja Diaria (SUIVE)', path: '/daily-report', module: ModuleType.ADMIN },
    { icon: <ClipboardList className="w-4 h-4" />, label: 'Bitácoras', path: '/logs', module: ModuleType.ADMIN },
    { icon: <Settings className="w-4 h-4" />, label: 'Configuración', path: '/settings', module: ModuleType.ADMIN },
  ];

  const filteredMenu = useMemo(() => {
      if (!currentUserPermissions) return allMenuItems;
      return allMenuItems.filter(item => 
          item.module === ModuleType.MONITOR || currentUserPermissions.includes(item.module)
      );
  }, [currentUserPermissions]);

  const topBarModules = [
    ModuleType.OUTPATIENT, 
    ModuleType.EMERGENCY, 
    ModuleType.HOSPITALIZATION, 
    ModuleType.AUXILIARY,
    ModuleType.BILLING,
    ModuleType.FINANCE,
    ModuleType.TELEMEDICINE 
  ].filter(mod => !currentUserPermissions || currentUserPermissions.includes(mod));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm no-print">
        <div className="max-w-full px-2 lg:px-6 flex justify-between h-16 items-center gap-2">
          <div className="flex items-center gap-4 flex-1 min-w-0"> 
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><ShieldCheck className="text-white w-5 h-5 lg:w-6 lg:h-6" /></div>
              <span className="text-xl font-black tracking-tighter uppercase block">MedExpediente <span className="text-blue-600">MX</span></span>
            </div>
            <div className="hidden xl:flex items-center bg-slate-100 rounded-xl p-1 gap-1 overflow-x-auto no-scrollbar">
              {topBarModules.map((mod) => (
                <button
                  key={mod}
                  onClick={() => {
                      if (mod === ModuleType.TELEMEDICINE) navigate('/telemedicine');
                      else {
                        if (location.pathname !== '/') navigate('/');
                        onModuleChange(mod);
                      }
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentModule === mod && location.pathname === '/' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : location.pathname.includes('telemedicine') && mod === ModuleType.TELEMEDICINE ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                  {mod === ModuleType.BILLING ? 'Caja / Tickets' : mod === ModuleType.FINANCE ? 'Finanzas' : mod === ModuleType.TELEMEDICINE ? 'Telemedicina' : mod}
                </button>
              ))}
            </div>
          </div>
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
        <aside className="w-16 lg:w-60 bg-white border-r border-slate-200 fixed left-0 top-16 h-full z-50 no-print flex flex-col transition-all duration-300">
          <div className="flex-1 py-2 lg:py-4 px-2 lg:px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {filteredMenu.map((item) => (
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
        
        <main className="flex-1 ml-16 lg:ml-60 p-4 lg:p-8 overflow-y-auto transition-all duration-300 w-full">{children}</main>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.OUTPATIENT);
  
  // Estado inicial del médico con datos de perfil público
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({ 
      name: 'JESUS REYES LOZANO', 
      cedula: '12840177', 
      institution: 'UNAM', 
      specialty: 'Médico Cirujano', 
      email: 'dr.reyes@medexpediente.mx', 
      address: 'AV. PASEO DE LOS LEONES 2345, MONTERREY', 
      phone: '81 1234 5678', 
      hospital: 'CENTRO MÉDICO SAN FRANCISCO',
      biography: 'Especialista comprometido con la salud integral, con más de 10 años de experiencia en el manejo de enfermedades crónico-degenerativas y cirugía de mínima invasión.',
      services: ['Consulta General', 'Control de Diabetes', 'Cirugía Menor', 'Certificados Médicos', 'Telemedicina'],
      languages: ['Español', 'Inglés'],
      gallery: [],
      walletBalance: 2450.00
  });

  // Lista global de médicos para compartir disponibilidad
  const [doctorsList, setDoctorsList] = useState<DoctorInfo[]>(() => {
     // En una app real esto vendría de BD. Aquí inicializamos con Mock y agregamos el usuario actual.
     const list = [...MOCK_DOCTORS];
     // Simular que el usuario actual es uno de ellos o agregarlo
     if (!list.find(d => d.cedula === '12840177')) {
         list.unshift({ ...doctorInfo, isOnline: false }); // Start offline
     }
     return list;
  });

  const updateDoctorStatus = (cedula: string, isOnline: boolean) => {
      setDoctorsList(prev => prev.map(d => d.cedula === cedula ? { ...d, isOnline } : d));
      if (cedula === doctorInfo.cedula) {
          setDoctorInfo(prev => ({ ...prev, isOnline }));
      }
  };
  
  const [patients, setPatients] = useState<Patient[]>(() => JSON.parse(localStorage.getItem('med_patients_v6') || JSON.stringify(INITIAL_PATIENTS)));
  const [notes, setNotes] = useState<ClinicalNote[]>(() => JSON.parse(localStorage.getItem('med_notes_v6') || '[]'));
  // Estado para solicitudes a domicilio
  const [homeRequests, setHomeRequests] = useState<HomeServiceRequest[]>(() => JSON.parse(localStorage.getItem('med_home_req_v1') || '[]'));
  // Estado para el Personal (cargado para pasarlo a HomeServices)
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
      const saved = localStorage.getItem('med_staff_v2');
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });
  
  const [currentUserPermissions, setCurrentUserPermissions] = useState<ModuleType[] | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('med_patients_v6', JSON.stringify(patients));
    localStorage.setItem('med_notes_v6', JSON.stringify(notes));
    localStorage.setItem('med_home_req_v1', JSON.stringify(homeRequests));
  }, [patients, notes, homeRequests]);

  const updatePatient = (updated: Patient) => setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
  
  const updatePatientStatus = (id: string, status: PatientStatus, agendaStatus?: AgendaStatus) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status, agendaStatus: agendaStatus || p.agendaStatus } : p));
  };

  const updatePatientPriority = (id: string, priority: PriorityLevel) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, priority } : p));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

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

  const addHomeRequest = (req: HomeServiceRequest) => setHomeRequests(prev => [req, ...prev]);
  const updateHomeRequest = (req: HomeServiceRequest) => setHomeRequests(prev => prev.map(r => r.id === req.id ? req : r));

  return (
    <Router>
      <Layout 
        currentModule={currentModule} 
        onModuleChange={setCurrentModule} 
        doctorInfo={doctorInfo}
        currentUserPermissions={currentUserPermissions}
      >
        <Routes>
          <Route path="/" element={<Dashboard module={currentModule} patients={patients} notes={notes} onUpdateStatus={updatePatientStatus} onUpdatePriority={updatePatientPriority} onModuleChange={setCurrentModule} onUpdatePatient={updatePatient} onDeletePatient={deletePatient} doctorInfo={doctorInfo} />} />
          <Route path="/billing" element={<Billing patients={patients} notes={notes} onUpdatePatient={updatePatient} />} />
          <Route path="/prices" element={<PriceCatalog />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/telemedicine" element={<TelemedicineDashboard patients={patients} onUpdateStatus={updatePatientStatus} onAddPatient={handleSavePatient} onAddHomeRequest={addHomeRequest} doctorsList={doctorsList} onDoctorStatusChange={updateDoctorStatus} currentUser={doctorInfo} notes={notes} />} />
          <Route path="/telemedicine/:id" element={<Telemedicine patients={patients} notes={notes} onSaveNote={addNote} onUpdatePatient={updatePatient} onAddHomeRequest={addHomeRequest} />} />
          <Route path="/home-services" element={<HomeServices requests={homeRequests} onUpdateRequest={updateHomeRequest} staffList={staffList} currentUser={doctorInfo} />} />
          
          <Route path="/patient/:id" element={<PatientProfile patients={patients} notes={notes} onUpdatePatient={updatePatient} onSaveNote={addNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/nursing-sheet" element={<NursingSheet patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />
          <Route path="/patient/:id/auxiliary-report" element={<AuxiliaryReport patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />
          <Route path="/patient/:id/auxiliary-order" element={<AuxiliaryOrder patients={patients} onSaveNote={addNote} />} />
          <Route path="/auxiliary-intake" element={<AuxiliaryIntake patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} onAddPatient={handleSavePatient} />} />
          <Route path="/patient/:id/note/evolution" element={<EvolutionNote patients={patients} notes={notes} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />
          <Route path="/patient/:id/note/emergency" element={<EmergencyNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/surgical" element={<SurgicalNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/interconsulta" element={<InterconsultaNote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/note/esavi" element={<ESAVINote patients={patients} notes={notes} onSaveNote={addNote} />} />
          <Route path="/patient/:id/history" element={<MedicalHistory patients={patients} notes={notes} onUpdatePatient={updatePatient} onSaveNote={addNote} />} />
          <Route path="/patient/:id/prescription" element={<Prescription patients={patients} doctorInfo={doctorInfo} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />
          <Route path="/patient/:id/consent" element={<InformedConsent patients={patients} onSaveNote={addNote} />} />
          <Route path="/patient/:id/telemedicine-consent" element={<TelemedicineConsent patients={patients} onSaveNote={addNote} onUpdatePatient={updatePatient} />} />
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
