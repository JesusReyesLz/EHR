
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './contexts/AuthContext';
import Login from './views/Login';
import Landing from './views/Landing';
import PatientLogin from './views/portal/PatientLogin';
import PatientRegister from './views/portal/PatientRegister';
import PatientVerify from './views/portal/PatientVerify';
import PatientActivate from './views/portal/PatientActivate';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import { 
  // Rename Settings icon to avoid collision with the Settings view component
  Users, Calendar, Settings as SettingsIcon, ShieldCheck, LogOut, ClipboardList,
  FileSpreadsheet, Package, Monitor as MonitorIcon, History, FileText,
  Activity, FlaskConical, HeartPulse, Bed, ShoppingBag, Tag, PieChart, Smartphone, Shield, Briefcase
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import PatientProfile from './views/PatientProfile';
import AdminLogs from './views/AdminLogs';
import Admin from './views/Admin';
import Telemedicine from './views/Telemedicine';
import Prescription from './views/Prescription';
import NewPatient from './views/NewPatient';
import Agenda from './views/Agenda';
import Settings from './views/Settings';
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
import HospitalAdmissionNote from './views/notes/HospitalAdmissionNote';
import PreoperativeNote from './views/notes/PreoperativeNote';
import PreAnestheticNote from './views/notes/PreAnestheticNote';
import AnestheticRecord from './views/notes/AnestheticRecord'; 
import PostAnestheticNote from './views/notes/PostAnestheticNote'; 
import RecoveryDischargeNote from './views/notes/RecoveryDischargeNote'; 
import PostOperativeNote from './views/notes/PostOperativeNote';
import SurgicalNote from './views/notes/SurgicalNote'; 
import DischargeNote from './views/notes/DischargeNote';
import InterconsultaNote from './views/notes/InterconsultaNote';
import ReferralNote from './views/notes/ReferralNote';
import CounterReferralNote from './views/notes/CounterReferralNote';
import ClinicalSummaryNote from './views/notes/ClinicalSummaryNote';
import ESAVINote from './views/notes/ESAVINote';
import EpiDeathReport from './views/notes/EpiDeathReport';
import MedicalCertificate from './views/notes/MedicalCertificate'; 
import PerinatalCard from './views/PerinatalCard'; 
import ChronicDiseaseControl from './views/ChronicDiseaseControl'; 
import ComprehensiveHealthControl from './views/ComprehensiveHealthControl'; // NEW IMPORT
import InformedConsent from './views/InformedConsent';
import VoluntaryDischarge from './views/VoluntaryDischarge';
import MPNotification from './views/MPNotification';
import DeathCertificate from './views/DeathCertificate';
import TransfusionRegistry from './views/TransfusionRegistry';
import SocialWorkSheet from './views/SocialWorkSheet';
import StomatologyExpedient from './views/StomatologyExpedient';
import EpidemiologyStudy from './views/EpidemiologyStudy';
import TelemedicineConsent from './views/TelemedicineConsent';
import LegalDocuments from './views/LegalDocuments';
import HospitalMonitor from './views/HospitalMonitor';
import Billing from './views/Billing';
import NoteEditor from './views/NoteEditor';
import PriceCatalog from './views/PriceCatalog';
import Finance from './views/Finance';
import StaffManagement from './views/StaffManagement';
import TelemedicineDashboard from './views/TelemedicineDashboard';
import HomeServices from './views/HomeServices';
import PatientPortal from './views/PatientPortal';
import { ModuleType, Patient, ClinicalNote, PatientStatus, PriorityLevel, DoctorInfo, AgendaStatus, HomeServiceRequest, StaffMember } from './types';
import { INITIAL_PATIENTS, MOCK_DOCTORS, INITIAL_STAFF } from './constants';

function Layout({ children, currentModule, onModuleChange, doctorInfo }: any) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, globalSettings } = useAuth();
  
  const isStandalone = new URLSearchParams(location.search).get('standalone') === 'true';

  const patientMatch = location.pathname.match(/\/patient\/([^/]+)/);
  const currentPatientId = patientMatch ? patientMatch[1] : null;

  const userType = user?.role || 'MEDICO';

  const allMenuItems = [
    { icon: <Users className="w-4 h-4" />, label: 'Monitor Activo', path: '/', module: ModuleType.OUTPATIENT },
    { icon: <MonitorIcon className="w-4 h-4" />, label: 'Monitor Hospitalario', path: '/monitor', module: ModuleType.HOSPITALIZATION },
    { icon: <ShoppingBag className="w-4 h-4" />, label: 'Caja, Tickets y Facturación', path: '/billing', state: currentPatientId ? { patientId: currentPatientId } : undefined, module: ModuleType.BILLING },
    { icon: <PieChart className="w-4 h-4" />, label: 'Finanzas y Compras', path: '/finance', module: ModuleType.FINANCE },
    { icon: <History className="w-4 h-4" />, label: 'Archivo Histórico', path: '/history-registry', module: ModuleType.OUTPATIENT },
    { icon: <Calendar className="w-4 h-4" />, label: 'Agenda Operativa', path: '/agenda', module: ModuleType.OUTPATIENT },
    { icon: <Package className="w-4 h-4" />, label: 'Farmacia e Inventario', path: '/inventory', module: ModuleType.INVENTORY },
    { icon: <Tag className="w-4 h-4" />, label: 'Catálogo de Precios', path: '/prices', module: ModuleType.PRICING },
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Hoja Diaria (SUIVE)', path: '/daily-report', module: ModuleType.OUTPATIENT },
    { icon: <ClipboardList className="w-4 h-4" />, label: 'Bitácoras', path: '/logs', module: ModuleType.OUTPATIENT },
    { icon: <Users className="w-4 h-4" />, label: 'Personal y Turnos', path: '/staff', module: ModuleType.STAFF },
    { icon: <Smartphone className="w-4 h-4" />, label: 'Telemedicina', path: '/telemedicine', module: ModuleType.TELEMEDICINE },
    { icon: <Activity className="w-4 h-4" />, label: 'Servicios a Domicilio', path: '/home-services', module: ModuleType.HOME_SERVICES },
    { icon: <Shield className="w-4 h-4" />, label: 'Gestión y Normatividad', path: '/admin', module: ModuleType.ADMIN },
    { icon: <Briefcase className="w-4 h-4" />, label: 'Docs Legales', path: '/legal-documents', module: ModuleType.OUTPATIENT },
    { icon: <SettingsIcon className="w-4 h-4" />, label: 'Configuración', path: '/settings' },
  ];

  const allModules = Object.values(ModuleType);

  let menuItems = [...allMenuItems];
  let modules = [...allModules];

  if (user?.allowedModules && user.allowedModules.length > 0) {
    modules = user.allowedModules as ModuleType[];
    if (userType === 'SUPER_ADMIN') {
      menuItems = [{ icon: <Shield className="w-4 h-4" />, label: 'Super Admin', path: '/super-admin' }, ...allMenuItems];
    } else {
      menuItems = [...allMenuItems];
    }
  } else {
    switch (userType) {
      case 'SUPER_ADMIN':
        menuItems = [{ icon: <Shield className="w-4 h-4" />, label: 'Super Admin', path: '/super-admin' }, ...allMenuItems];
        break;
      case 'ADMIN':
      case 'ADMIN CLINICA':
      case 'admin clinica':
        // Admin has access to everything except Super Admin dashboard
        break;
      case 'MEDICO':
        modules = [ModuleType.OUTPATIENT, ModuleType.EMERGENCY, ModuleType.HOSPITALIZATION, ModuleType.AUXILIARY, ModuleType.TELEMEDICINE, ModuleType.HOME_SERVICES];
        menuItems = allMenuItems.filter(item => ['Monitor Activo', 'Monitor Hospitalario', 'Archivo Histórico', 'Agenda Operativa', 'Hoja Diaria (SUIVE)', 'Bitácoras', 'Docs Legales', 'Telemedicina', 'Servicios a Domicilio', 'Configuración'].includes(item.label));
        break;
      case 'ENFERMERIA':
        modules = [ModuleType.OUTPATIENT, ModuleType.EMERGENCY, ModuleType.HOSPITALIZATION];
        menuItems = allMenuItems.filter(item => ['Monitor Activo', 'Monitor Hospitalario', 'Archivo Histórico', 'Agenda Operativa', 'Configuración'].includes(item.label));
        break;
      case 'RECEPCION':
        modules = [ModuleType.OUTPATIENT, ModuleType.TELEMEDICINE, ModuleType.HOME_SERVICES, ModuleType.BILLING];
        menuItems = allMenuItems.filter(item => ['Monitor Activo', 'Agenda Operativa', 'Caja, Tickets y Facturación', 'Telemedicina', 'Servicios a Domicilio', 'Configuración'].includes(item.label));
        break;
      case 'CAJA':
      case 'FINANZAS':
        modules = [ModuleType.BILLING, ModuleType.FINANCE];
        menuItems = allMenuItems.filter(item => ['Caja, Tickets y Facturación', 'Catálogo de Precios', 'Finanzas y Compras', 'Configuración'].includes(item.label));
        break;
      case 'FARMACIA':
        modules = [ModuleType.AUXILIARY];
        menuItems = allMenuItems.filter(item => ['Farmacia e Inventario', 'Catálogo de Precios', 'Configuración'].includes(item.label));
        break;
      case 'RAYOS X':
      case 'LABORATORIO':
        modules = [ModuleType.AUXILIARY];
        menuItems = allMenuItems.filter(item => ['Monitor Activo', 'Farmacia e Inventario', 'Configuración'].includes(item.label));
        break;
      case 'RRHH':
        modules = [ModuleType.STAFF];
        menuItems = allMenuItems.filter(item => ['Personal y Turnos', 'Configuración'].includes(item.label));
        break;
      case 'PACIENTE':
        menuItems = [
          { icon: <ShieldCheck className="w-4 h-4" />, label: 'Mi Portal', path: '/' },
          { icon: <Smartphone className="w-4 h-4" />, label: 'Telemedicina', path: '/telemedicine' },
          { icon: <SettingsIcon className="w-4 h-4" />, label: 'Configuración', path: '/settings' },
        ];
        modules = [];
        break;
      default:
        // Fallback for unknown roles
        break;
    }
  }

  // Filter modules based on global SaaS settings
  if (globalSettings && globalSettings.activeModules && globalSettings.activeModules.length > 0) {
    modules = modules.filter(m => globalSettings.activeModules.includes(m));
  }

  // Filter menu items based on active modules
  menuItems = menuItems.filter(item => !item.module || modules.includes(item.module));

  if (isStandalone) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 z-[100] rounded-lg font-bold">
          Saltar al contenido principal
        </a>
        <main id="main-content" role="main" className="flex-1 overflow-auto custom-scrollbar" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 z-[100] rounded-lg font-bold">
        Saltar al contenido principal
      </a>
      <header role="banner" className="bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm no-print">
        <div className="max-w-full px-2 lg:px-6 flex justify-between h-16 items-center gap-2">
          <div className="flex items-center gap-4 flex-1 min-w-0"> 
            <div className="flex items-center gap-3 shrink-0">
              {globalSettings?.logoUrl ? (
                <img src={globalSettings.logoUrl} alt="Logo de la clínica" className="w-8 h-8 lg:w-10 lg:h-10 object-contain rounded-xl shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg" aria-hidden="true"><ShieldCheck className="text-white w-5 h-5 lg:w-6 lg:h-6" /></div>
              )}
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase block leading-none">MedExpediente <span className="text-blue-600">MX</span></h1>
                {globalSettings?.clinicName && (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">{globalSettings.clinicName}</span>
                )}
              </div>
            </div>
            <nav aria-label="Módulos principales" className="hidden xl:flex items-center bg-slate-100 rounded-xl p-1 gap-1 overflow-x-auto no-scrollbar">
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
                  aria-current={currentModule === mod ? 'page' : undefined}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentModule === mod ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                  {mod === ModuleType.BILLING ? 'Caja / Tickets' : mod === ModuleType.FINANCE ? 'Finanzas' : mod === ModuleType.STAFF ? 'RRHH' : mod === ModuleType.TELEMEDICINE ? 'Telemedicina' : mod === ModuleType.HOME_SERVICES ? 'Domiciliario' : mod}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-xs font-black uppercase tracking-tighter">{user?.name}</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase">{user?.role} {user?.cedula ? `| Cédula: ${user.cedula}` : ''}</p>
            </div>
            <button onClick={logout} aria-label="Cerrar sesión" className="p-2 lg:p-2.5 text-slate-500 hover:text-red-600 bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"><LogOut className="w-5 h-5" aria-hidden="true" /></button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside role="navigation" aria-label="Menú lateral" className="w-16 lg:w-60 bg-white border-r border-slate-200 fixed left-0 top-16 h-full z-50 no-print flex flex-col transition-all duration-300">
          <div className="flex-1 py-2 lg:py-4 px-2 lg:px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <Link 
                key={item.label} 
                to={item.path} 
                state={(item as any).state}
                title={item.label}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                className={`flex items-center justify-center lg:justify-start px-0 lg:px-3 py-2.5 rounded-xl transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 ${location.pathname === item.path ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className={`shrink-0 ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-500'}`} aria-hidden="true">{item.icon}</div>
                <span className="ml-3 font-black text-[10px] uppercase tracking-widest hidden lg:block whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              </Link>
            ))}
          </div>
        </aside>
        <main id="main-content" role="main" className="flex-1 ml-16 lg:ml-60 p-4 lg:p-8 overflow-y-auto transition-all duration-300 w-full" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const { isAuthenticated, user, globalSettings } = useAuth();
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.OUTPATIENT);
  
  // Convert AuthContext user to DoctorInfo format for legacy components
  const doctorInfo: DoctorInfo = {
    id: user?.id || '1',
    name: user?.name || 'Dr. Default',
    specialty: 'Medicina General',
    cedula: user?.cedula || '1234567',
    institution: globalSettings?.clinicName || 'Clínica / Consultorio',
    email: user?.email || '',
    address: globalSettings?.address || 'Dirección no registrada',
    phone: globalSettings?.phone || 'Teléfono no registrado',
    hospital: globalSettings?.clinicName || 'Clínica / Consultorio',
    userType: user?.role === 'PACIENTE' ? 'Paciente' : ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') ? 'Administrador' : user?.role === 'ENFERMERIA' ? 'Enfermería' : 'Médico'
  } as DoctorInfo;
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);

  // Fetch patients and notes from Firestore
  useEffect(() => {
    if (!user?.clinicId) return;

    // Seed test clinic if needed
    if (user.clinicId === 'test-clinic') {
      const seedTestClinic = async () => {
        try {
          const { getDoc } = await import('firebase/firestore');
          const clinicDoc = await getDoc(doc(db, 'clinics', 'test-clinic'));
          const data = clinicDoc.data();
          if (!clinicDoc.exists() || !data?.activeModules || data.activeModules.includes("Pacientes")) {
            await setDoc(doc(db, 'clinics', 'test-clinic'), {
              name: "Clínica de Prueba",
              activeModules: Object.values(ModuleType),
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (e) {
          console.error("Error seeding test clinic", e);
        }
      };
      seedTestClinic();
    }

    // Listen to patients
    const qPatients = query(collection(db, 'patients'), where('clinicId', '==', user.clinicId));
    const unsubscribePatients = onSnapshot(qPatients, async (snapshot) => {
      const pts: Patient[] = [];
      snapshot.forEach(doc => {
        pts.push({ id: doc.id, ...doc.data() } as Patient);
      });
      
      // Seed test-clinic if empty
      if (user.clinicId === 'test-clinic' && pts.length === 0) {
        console.log("Seeding test-clinic with mock data...");
        for (const p of INITIAL_PATIENTS) {
          try {
            const cleanData = cleanUndefined({ ...p, clinicId: 'test-clinic' });
            await setDoc(doc(db, 'patients', p.id), cleanData, { merge: true });
          } catch (e) {
            console.error("Failed to seed patient", e);
          }
        }
      } else {
        setPatients(pts);
      }
    }, (error) => {
      console.error("Error fetching patients:", error);
    });

    // Listen to clinical notes
    const qNotes = query(collection(db, 'clinicalNotes'), where('clinicId', '==', user.clinicId));
    const unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
      const nts: ClinicalNote[] = [];
      snapshot.forEach(doc => {
        nts.push({ id: doc.id, ...doc.data() } as ClinicalNote);
      });
      setNotes(nts);
    }, (error) => {
      console.error("Error fetching notes:", error);
    });

    return () => {
      unsubscribePatients();
      unsubscribeNotes();
    };
  }, [user?.clinicId]);

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

  useEffect(() => { localStorage.setItem('med_staff_v2', JSON.stringify(staffList)); }, [staffList]);
  useEffect(() => { localStorage.setItem('med_home_requests_v1', JSON.stringify(homeRequests)); }, [homeRequests]);
  useEffect(() => { localStorage.setItem('med_doctors_v1', JSON.stringify(doctorsList)); }, [doctorsList]);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'med_home_requests_v1') {
        try { setHomeRequests(JSON.parse(e.newValue || '[]')); } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [dbRoles, setDbRoles] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.clinicId) return;
    const unsub = onSnapshot(query(collection(db, 'roles'), where('clinicId', '==', user.clinicId)), snap => {
       setDbRoles(snap.docs.map(d => ({id: d.id, ...(d.data() as any)})));
    });
    return unsub;
  }, [user?.clinicId]);

  useEffect(() => {
    if (!user?.clinicId) return;
    const unsub = onSnapshot(query(collection(db, 'users'), where('clinicId', '==', user.clinicId)), snap => {
       const platformUsers = snap.docs.map(d => ({id: d.id, ...(d.data() as any)}));
       setStaffList(prev => {
          let updated = [...prev];
          let changed = false;

          platformUsers.forEach(pu => {
             const existingIdx = updated.findIndex(s => s.email === pu.email || (pu.staffId && s.id === pu.staffId));
             const roleObj = dbRoles.find(r => r.id === pu.roleId);
             const roleName = roleObj ? roleObj.name : (pu.roleId || 'Médico General');

             if (existingIdx !== -1) {
                if (updated[existingIdx].name !== pu.name || updated[existingIdx].role !== roleName || updated[existingIdx].email !== pu.email) {
                   updated[existingIdx] = {
                       ...updated[existingIdx],
                       name: pu.name,
                       role: roleName as any,
                       email: pu.email
                   };
                   changed = true;
                }
             } else {
                 updated.push({
                     id: pu.staffId || `STF-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
                     name: (pu.name || 'Usuario').toUpperCase(),
                     role: roleName as any,
                     status: 'Activo',
                     assignedArea: [],
                     cedula: pu.cedula || '',
                     email: pu.email,
                     salaryDaily: 0,
                     paymentPeriod: 'Quincenal',
                     allowedModules: pu.customModules ? JSON.parse(pu.customModules) : [ModuleType.MONITOR],
                 } as StaffMember);
                 changed = true;
             }
          });

          return changed ? updated : prev;
       });
    });
    return unsub;
  }, [user?.clinicId, dbRoles]);

  const cleanUndefined = (obj: any, inArray: boolean = false): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.filter(v => v !== undefined).map(v => cleanUndefined(v, true));
    
    if (inArray) {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, cleanUndefined(v, true)])
      );
    }
    
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, v === undefined ? deleteField() : cleanUndefined(v, false)])
    );
  };

  const handleUpdatePatient = async (p: Patient) => {
    if (!user?.clinicId) return;
    try {
      const cleanData = cleanUndefined({ ...p, clinicId: user.clinicId });
      await setDoc(doc(db, 'patients', p.id), cleanData, { merge: true });
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };
  const handleAddPatient = async (p: Patient) => {
    if (!user?.clinicId) return;
    try {
      const cleanData = cleanUndefined({ ...p, clinicId: user.clinicId });
      await setDoc(doc(db, 'patients', p.id), cleanData, { merge: true });
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };
  const handleDeletePatient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'patients', id));
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };
  const handleUpdateStatus = async (id: string, status: PatientStatus, agendaStatus?: AgendaStatus) => {
    try {
      const updateData: any = { status };
      if (agendaStatus) updateData.agendaStatus = agendaStatus;
      const cleanData = cleanUndefined(updateData);
      await setDoc(doc(db, 'patients', id), cleanData, { merge: true });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  const handleUpdatePriority = async (id: string, priority: PriorityLevel) => {
    try {
      await setDoc(doc(db, 'patients', id), { priority }, { merge: true });
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };
  
  const handleSaveNote = async (note: ClinicalNote) => {
    if (!user?.clinicId) return;
    try {
      const cleanData = cleanUndefined({ ...note, clinicId: user.clinicId });
      await setDoc(doc(db, 'clinicalNotes', note.id), cleanData, { merge: true });
    } catch (error) {
      console.error("Error saving note:", error);
    }
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

  if (!isAuthenticated) {
    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/portal/login" element={<PatientLogin />} />
          <Route path="/portal/register" element={<PatientRegister />} />
          <Route path="/portal/verify" element={<PatientVerify />} />
          <Route path="/portal/activate" element={<PatientActivate />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout currentModule={currentModule} onModuleChange={setCurrentModule} doctorInfo={doctorInfo}>
        <Routes>
          {user?.role === 'SUPER_ADMIN' && (
            <Route path="/super-admin" element={<SuperAdminDashboard staffList={staffList} onUpdateStaffList={handleUpdateStaffList} />} />
          )}
          <Route path="/" element={
            user?.role === 'PACIENTE' ? (
              <PatientPortal 
                patient={patients.find(p => p.id === doctorInfo.id) || patients[0]} 
                appointments={patients.filter(p => p.name === user?.name || p.id === user?.id)}
                notes={notes} 
                doctors={doctorsList} 
                onUpdatePatient={handleUpdatePatient}
                onSaveNote={handleSaveNote}
              />
            ) : user?.role === 'SUPER_ADMIN' ? (
              <Navigate to="/super-admin" replace />
            ) : (
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
                 onUpdateHomeRequest={handleUpdateHomeRequest}
                 onAddPatient={handleAddPatient}
              />
            )
          } />
          <Route path="/monitor" element={
            <HospitalMonitor 
              patients={patients} 
              onUpdatePatient={handleUpdatePatient}
              staffList={staffList}
              onUpdateStaffList={handleUpdateStaffList}
            />
          } />
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
              onUpdateHomeRequest={handleUpdateHomeRequest}
              doctorsList={doctorsList} 
              currentUser={doctorInfo} 
              notes={notes} 
              homeRequests={homeRequests}
              staffList={staffList}
            />
          } />
          <Route path="/telemedicine/:id" element={<Telemedicine patients={patients} notes={notes} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} onAddHomeRequest={handleAddHomeRequest} currentUser={doctorInfo} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/staff" element={<StaffManagement staffList={staffList} onUpdateStaffList={handleUpdateStaffList} />} />
          <Route path="/legal-documents" element={<LegalDocuments doctorInfo={doctorInfo} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings doctorInfo={doctorInfo} onUpdateDoctor={(newInfo) => {
            // Settings update logic
          }} />} />
          <Route path="/daily-report" element={<DailyReport patients={patients} notes={notes} />} />
          <Route path="/patient/:id/history" element={<MedicalHistory patients={patients} notes={notes} onUpdatePatient={handleUpdatePatient} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/prescription" element={<Prescription patients={patients} doctorInfo={doctorInfo} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          
          {/* Clinical Notes Routes - Passing doctorInfo */}
          <Route path="/patient/:id/note/evolution/:noteId?" element={<EvolutionNote patients={patients} notes={notes} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/emergency/:noteId?" element={<EmergencyNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/admission/:noteId?" element={<HospitalAdmissionNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/preoperative/:noteId?" element={<PreoperativeNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} /> 
          <Route path="/patient/:id/note/preanesthetic/:noteId?" element={<PreAnestheticNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/anesthetic-record/:noteId?" element={<AnestheticRecord patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/postanesthetic/:noteId?" element={<PostAnestheticNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} /> 
          <Route path="/patient/:id/note/recovery-discharge/:noteId?" element={<RecoveryDischargeNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/surgical/:noteId?" element={<SurgicalNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/postoperative/:noteId?" element={<PostOperativeNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/discharge/:noteId?" element={<DischargeNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/interconsulta/:noteId?" element={<InterconsultaNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/referral/:noteId?" element={<ReferralNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/counter-referral/:noteId?" element={<CounterReferralNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/summary/:noteId?" element={<ClinicalSummaryNote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/esavi/:noteId?" element={<ESAVINote patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/generic/:noteType/:noteId?" element={<NoteEditor onSave={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/epi-death/:noteId?" element={<EpiDeathReport patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/note/medical-certificate/:noteId?" element={<MedicalCertificate patients={patients} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} notes={notes} />} />
          <Route path="/patient/:id/perinatal-card/:noteId?" element={<PerinatalCard patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/patient/:id/chronic-card/:noteId?" element={<ChronicDiseaseControl patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          
          {/* New Route for Comprehensive Health Control */}
          <Route path="/patient/:id/health-control" element={<ComprehensiveHealthControl patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />

          {/* Other Documents */}
          <Route path="/patient/:id/nursing-sheet/:noteId?" element={<NursingSheet patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} notes={notes} />} />
          <Route path="/patient/:id/auxiliary-order" element={<AuxiliaryOrder patients={patients} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/auxiliary-report" element={<AuxiliaryReport patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} />} />
          <Route path="/auxiliary-intake" element={<AuxiliaryIntake patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} onAddPatient={handleAddPatient} />} />
          <Route path="/patient/:id/consent" element={<InformedConsent patients={patients} notes={notes} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/voluntary-discharge" element={<VoluntaryDischarge patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/mp-notification" element={<MPNotification patients={patients} onSaveNote={handleSaveNote} doctorInfo={doctorInfo} />} />
          <Route path="/patient/:id/death-certificate" element={<DeathCertificate patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/transfusion" element={<TransfusionRegistry patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/social-work" element={<SocialWorkSheet patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/stomatology" element={<StomatologyExpedient patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/epidemiology" element={<EpidemiologyStudy patients={patients} onSaveNote={handleSaveNote} />} />
          <Route path="/patient/:id/telemedicine-consent" element={<TelemedicineConsent patients={patients} onSaveNote={handleSaveNote} onUpdatePatient={handleUpdatePatient} doctorInfo={doctorInfo} />} />
          
          <Route path="/history-registry" element={<HistoryRegistries patients={patients} notes={notes} onUpdatePatient={handleUpdatePatient} />} />
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
