import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Shield, Building2, Plus, Edit, X, Check, Filter, Settings } from 'lucide-react';
import { ModuleType, StaffMember, StaffRole } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, getDocs } from 'firebase/firestore';

const ALL_MODULES = Object.values(ModuleType);

interface SuperAdminDashboardProps {
  staffList: StaffMember[];
  onUpdateStaffList: (staff: StaffMember[]) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ staffList, onUpdateStaffList }) => {
  const { user, globalSettings, refreshSettings } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'saas'>('users');

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Form states
  const [newUser, setNewUser] = useState({ email: '', name: '', roleId: '', cedula: '' });
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  
  // SaaS Settings State
  const [saasSettings, setSaasSettings] = useState({
    clinicName: '',
    logoUrl: '',
    address: '',
    phone: '',
    email: '',
    activeModules: [] as string[]
  });

  // Modals
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  useEffect(() => {
    if (!user?.clinicId) return;

    setLoading(true);

    // Listen to Users
    const qUsers = query(collection(db, 'users'), where('clinicId', '==', user.clinicId));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });

    // Listen to Roles
    const qRoles = query(collection(db, 'roles'), where('clinicId', '==', user.clinicId));
    const unsubRoles = onSnapshot(qRoles, (snapshot) => {
      const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoles(rolesData);
    });

    // Listen to Departments
    const qDepts = query(collection(db, 'departments'), where('clinicId', '==', user.clinicId));
    const unsubDepts = onSnapshot(qDepts, (snapshot) => {
      const deptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(deptsData);
    });

    // Load Settings
    if (globalSettings) {
      setSaasSettings({
        clinicName: globalSettings.clinicName || '',
        logoUrl: globalSettings.logoUrl || '',
        address: globalSettings.address || '',
        phone: globalSettings.phone || '',
        email: globalSettings.email || '',
        activeModules: globalSettings.activeModules || []
      });
    }

    setLoading(false);

    return () => {
      unsubUsers();
      unsubRoles();
      unsubDepts();
    };
  }, [user?.clinicId, globalSettings]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clinicId) return;
    try {
      // Note: In a real app, you'd use Firebase Admin SDK to create the Auth user.
      // Since we can't do that from the client easily without logging the current user out,
      // we just create the Firestore document. The user will need to sign in with Google using this email.
      const userId = newUser.email.toLowerCase().replace(/[^a-z0-9]/g, ''); // Simple ID generation for demo
      
      const staffId = `STF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      
      await setDoc(doc(db, 'users', userId), {
        email: newUser.email,
        name: newUser.name,
        roleId: newUser.roleId,
        cedula: newUser.cedula,
        clinicId: user.clinicId,
        isActive: true,
        customModules: JSON.stringify([]),
        staffId: staffId
      });

      // Find the role name from the roleId
      const selectedRole = roles.find(r => r.id === newUser.roleId);
      const roleName = selectedRole ? selectedRole.name : 'Médico General';

      // Add to staffList
      const newStaff: StaffMember = {
        id: staffId,
        name: newUser.name.toUpperCase(),
        role: roleName as StaffRole,
        status: 'Activo',
        assignedArea: [],
        cedula: newUser.cedula,
        email: newUser.email,
        salaryDaily: 0,
        paymentPeriod: 'Quincenal',
        allowedModules: selectedRole?.defaultModules ? JSON.parse(selectedRole.defaultModules) : [ModuleType.MONITOR],
        isTelemedicineEnabled: false,
        isHomeServiceEnabled: false,
        mobileAppAccess: false
      };
      onUpdateStaffList([...staffList, newStaff]);

      setNewUser({ email: '', name: '', roleId: '', cedula: '' });
      alert("Usuario creado. Pídale que inicie sesión con Google usando ese correo.");
    } catch (error) {
      console.error(error);
      alert("Error creando usuario");
    }
  };

  const handleSeedRoles = async () => {
    if (!user?.clinicId) return;
    setLoading(true);
    try {
      const predefinedRoles = [
        { name: 'SUPER_ADMIN', description: 'Acceso total al sistema', defaultModules: JSON.stringify(ALL_MODULES) },
        { name: 'ADMIN', description: 'Administración de la clínica', defaultModules: JSON.stringify(ALL_MODULES) },
        { name: 'ADMIN CLINICA', description: 'Administración de la clínica', defaultModules: JSON.stringify(ALL_MODULES) },
        { name: 'MEDICO', description: 'Consulta, Expediente, Recetas', defaultModules: JSON.stringify([ModuleType.OUTPATIENT, ModuleType.EMERGENCY, ModuleType.HOSPITALIZATION, ModuleType.AUXILIARY, ModuleType.TELEMEDICINE, ModuleType.HOME_SERVICES]) },
        { name: 'ENFERMERIA', description: 'Signos vitales, Notas de enfermería', defaultModules: JSON.stringify([ModuleType.OUTPATIENT, ModuleType.EMERGENCY, ModuleType.HOSPITALIZATION]) },
        { name: 'RECEPCION', description: 'Agenda, Ingreso de pacientes', defaultModules: JSON.stringify([ModuleType.OUTPATIENT, ModuleType.TELEMEDICINE, ModuleType.HOME_SERVICES, ModuleType.BILLING]) },
        { name: 'CAJA', description: 'Cobros, Facturación', defaultModules: JSON.stringify([ModuleType.BILLING, ModuleType.FINANCE, ModuleType.PRICING]) },
        { name: 'FARMACIA', description: 'Inventario, Surtido de recetas', defaultModules: JSON.stringify([ModuleType.INVENTORY, ModuleType.PRICING]) },
        { name: 'RRHH', description: 'Personal, Turnos', defaultModules: JSON.stringify([ModuleType.STAFF]) },
        { name: 'RAYOS X', description: 'Estudios de imagenología', defaultModules: JSON.stringify([ModuleType.AUXILIARY]) },
        { name: 'LABORATORIO', description: 'Estudios de laboratorio', defaultModules: JSON.stringify([ModuleType.AUXILIARY]) },
      ];

      for (const role of predefinedRoles) {
        const roleId = role.name.toLowerCase();
        await setDoc(doc(db, 'roles', roleId), {
          ...role,
          clinicId: user.clinicId,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      alert("Roles predeterminados creados correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error creando roles predeterminados");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clinicId) return;
    try {
      const deptRef = doc(collection(db, 'departments'));
      await setDoc(deptRef, {
        name: newDept.name,
        description: newDept.description,
        clinicId: user.clinicId
      });
      setNewDept({ name: '', description: '' });
    } catch (error) {
      console.error(error);
      alert("Error creando departamento");
    }
  };

  const handleSaveUserModules = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        customModules: JSON.stringify(editingUser.customModules)
      });
      
      if (editingUser.staffId) {
        onUpdateStaffList(staffList.map(s => s.id === editingUser.staffId ? { ...s, allowedModules: editingUser.customModules } : s));
      }

      setEditingUser(null);
    } catch (error) {
      console.error(error);
      alert("Error actualizando módulos del usuario");
    }
  };

  const handleSaveRole = async () => {
    if (!editingRole || !user?.clinicId) return;
    try {
      if (isCreatingRole) {
        const roleRef = doc(collection(db, 'roles'));
        await setDoc(roleRef, {
          name: editingRole.name,
          description: editingRole.description,
          defaultModules: editingRole.defaultModules,
          clinicId: user.clinicId
        });
      } else {
        await updateDoc(doc(db, 'roles', editingRole.id), {
          name: editingRole.name,
          description: editingRole.description,
          defaultModules: editingRole.defaultModules
        });
      }
      setEditingRole(null);
      setIsCreatingRole(false);
    } catch (error) {
      console.error(error);
      alert("Error guardando rol");
    }
  };

  const handleSaveSaasSettings = async () => {
    if (!user?.clinicId) return;
    try {
      await updateDoc(doc(db, 'clinics', user.clinicId), {
        name: saasSettings.clinicName,
        logoUrl: saasSettings.logoUrl,
        address: saasSettings.address,
        phone: saasSettings.phone,
        email: saasSettings.email,
        activeModules: saasSettings.activeModules
      });
      alert("Configuración SaaS guardada correctamente.");
      refreshSettings();
    } catch (error) {
      console.error(error);
      alert("Error guardando configuración SaaS");
    }
  };

  const toggleUserModule = (moduleName: string) => {
    if (!editingUser) return;
    const current = editingUser.customModules || [];
    const updated = current.includes(moduleName) 
      ? current.filter((m: string) => m !== moduleName)
      : [...current, moduleName];
    setEditingUser({ ...editingUser, customModules: updated });
  };

  const toggleRoleModule = (moduleName: string) => {
    if (!editingRole) return;
    const current = editingRole.defaultModules || [];
    const updated = current.includes(moduleName) 
      ? current.filter((m: string) => m !== moduleName)
      : [...current, moduleName];
    setEditingRole({ ...editingRole, defaultModules: updated });
  };

  const toggleSaasModule = (moduleName: string) => {
    const current = saasSettings.activeModules;
    const updated = current.includes(moduleName)
      ? current.filter(m => m !== moduleName)
      : [...current, moduleName];
    setSaasSettings({ ...saasSettings, activeModules: updated });
  };

  const filteredUsers = roleFilter ? users.filter(u => u.roleId === roleFilter) : users;

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Cargando panel de administración...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Panel Super Admin</h1>
          <p className="text-sm text-slate-500 font-medium">Gestión global de usuarios, roles y áreas del hospital.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Usuarios y Roles
          </button>
          <button 
            onClick={() => setActiveTab('saas')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'saas' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Configuración SaaS
          </button>
        </div>
      </div>

      {activeTab === 'saas' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="font-black text-slate-800 uppercase tracking-wide">Configuración Global de la Clínica (SaaS)</h2>
              <p className="text-xs text-slate-500 mt-1">Activa o desactiva módulos para toda la clínica. Los módulos desactivados no aparecerán para ningún usuario, sin importar su rol.</p>
              <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest">Esta información aparecerá en las recetas médicas y documentos oficiales.</p>
            </div>
          </div>
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Nombre de la Clínica / Hospital</label>
                <input 
                  type="text" 
                  value={saasSettings.clinicName} 
                  onChange={e => setSaasSettings({...saasSettings, clinicName: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                  placeholder="Ej: Hospital San José"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">URL del Logo de la Clínica</label>
                <input 
                  type="text" 
                  value={saasSettings.logoUrl} 
                  onChange={e => setSaasSettings({...saasSettings, logoUrl: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Dirección Fiscal / Operativa</label>
                <input 
                  type="text" 
                  value={saasSettings.address} 
                  onChange={e => setSaasSettings({...saasSettings, address: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                  placeholder="Calle, Número, Colonia, Ciudad..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Teléfono</label>
                  <input 
                    type="text" 
                    value={saasSettings.phone} 
                    onChange={e => setSaasSettings({...saasSettings, phone: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                    placeholder="Ej: 55 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Email</label>
                  <input 
                    type="email" 
                    value={saasSettings.email} 
                    onChange={e => setSaasSettings({...saasSettings, email: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                    placeholder="contacto@clinica.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-3">Módulos Activos (Suscripción)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ALL_MODULES.map(mod => {
                  const isSelected = saasSettings.activeModules.includes(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => toggleSaasModule(mod)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-100'}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                      <span className={`text-xs font-bold uppercase ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>{mod}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSaveSaasSettings}
                className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl text-sm uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-md"
              >
                Guardar Configuración Global
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Users List */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Usuarios del Sistema</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select 
                    className="text-xs font-bold uppercase border border-slate-200 rounded-lg px-2 py-1 outline-none"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                  >
                    <option value="">Todos los Roles</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Rol Base</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const customCount = user.customModules ? JSON.parse(user.customModules).length : 0;
                      return (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {user.name}
                            {user.cedula && <span className="block text-[10px] text-slate-400 font-mono">Cédula: {user.cedula}</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              {roles.find(r => r.id === user.roleId)?.name || user.roleId}
                            </span>
                            {customCount > 0 && (
                              <span className="ml-2 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                +{customCount} Módulos
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => setEditingUser({
                                ...user, 
                                customModules: user.customModules ? JSON.parse(user.customModules) : []
                              })}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"
                              title="Editar Módulos"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-slate-400 font-bold uppercase text-xs">
                    No hay usuarios para este filtro.
                  </div>
                )}
              </div>
            </div>

            {/* Create User Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Nuevo Usuario</h2>
              </div>
              <form onSubmit={handleCreateUser} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo</label>
                  <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rol Base</label>
                  <select required value={newUser.roleId} onChange={e => setNewUser({...newUser, roleId: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Seleccionar Rol...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cédula (Opcional)</label>
                  <input type="text" value={newUser.cedula} onChange={e => setNewUser({...newUser, cedula: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-sm uppercase tracking-wider hover:bg-blue-700 transition-colors">
                  Crear Usuario
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Roles */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Roles del Sistema (RBAC)</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSeedRoles}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-lg hover:bg-blue-200 flex items-center gap-1"
                    title="Cargar roles predeterminados"
                  >
                    Cargar Roles
                  </button>
                  <button 
                    onClick={() => {
                      setEditingRole({ name: '', description: '', defaultModules: [] });
                      setIsCreatingRole(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Nuevo Rol
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  {roles.map(r => {
                    const defaultMods = r.defaultModules ? JSON.parse(r.defaultModules) : [];
                    return (
                      <div key={r.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-black text-slate-800 text-sm">{r.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{r.description || 'Sin descripción'}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {defaultMods.slice(0, 3).map((m: string) => (
                              <span key={m} className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase">{m}</span>
                            ))}
                            {defaultMods.length > 3 && <span className="text-[9px] font-bold text-slate-400">+{defaultMods.length - 3} más</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setEditingRole({ ...r, defaultModules: defaultMods });
                            setIsCreatingRole(false);
                          }}
                          className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Departamentos / Áreas</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h3 className="text-xs font-black text-blue-800 uppercase mb-1">¿Qué son los Departamentos/Áreas?</h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Los departamentos representan las áreas físicas o lógicas de la clínica (ej. Urgencias, Quirófano, Piso 1). 
                    Sirven para el <strong>Control de Acceso Basado en Atributos (ABAC)</strong>. 
                    Si un usuario es asignado a un departamento, solo podrá ver los pacientes y datos relacionados con esa área específica durante su turno.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {departments.map(d => (
                    <span key={d.id} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                      {d.name}
                    </span>
                  ))}
                </div>
                <form onSubmit={handleCreateDept} className="flex gap-2 pt-2">
                  <input type="text" required placeholder="Nuevo departamento..." value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" />
                  <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800">Agregar</button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL: EDITAR MÓDULOS DE USUARIO */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Permisos de Usuario</h3>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">Usuario: {editingUser.name} • Rol: {roles.find(r => r.id === editingUser.roleId)?.name || editingUser.roleId}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Selecciona los módulos a los que este usuario tendrá acceso. Esto <strong>sobrescribe</strong> los módulos por defecto de su rol.
                Si dejas todo desmarcado, se usarán los módulos de su rol base.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-1">
                {ALL_MODULES.map(mod => {
                  const isSelected = editingUser.customModules?.includes(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => toggleUserModule(mod)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                      <span className="text-xs font-bold uppercase">{mod}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSaveUserModules} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md">Guardar Permisos</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR/EDITAR ROL */}
      {editingRole && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">{isCreatingRole ? 'Crear Nuevo Rol' : 'Editar Rol'}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">Configuración de Rol Base (RBAC)</p>
              </div>
              <button onClick={() => setEditingRole(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Nombre del Rol</label>
                  <input 
                    type="text" 
                    value={editingRole.name} 
                    onChange={e => setEditingRole({...editingRole, name: e.target.value.toUpperCase()})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase outline-none focus:border-blue-500"
                    placeholder="Ej: LABORATORIO"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Descripción</label>
                  <input 
                    type="text" 
                    value={editingRole.description} 
                    onChange={e => setEditingRole({...editingRole, description: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    placeholder="Breve descripción..."
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Módulos por Defecto</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto p-1">
                  {ALL_MODULES.map(mod => {
                    const isSelected = editingRole.defaultModules?.includes(mod);
                    return (
                      <button
                        key={mod}
                        onClick={() => toggleRoleModule(mod)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <Check size={14} />}
                        </div>
                        <span className="text-xs font-bold uppercase">{mod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEditingRole(null)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSaveRole} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-md">Guardar Rol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
