
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, UserPlus, Calendar, Clock, CheckCircle2, XCircle, Search, 
  Filter, Edit2, Trash2, Save, User, ShieldCheck, MapPin, 
  Stethoscope, FlaskConical, Activity, Heart, DollarSign, Wallet, Users,
  ChevronLeft, ChevronRight, Plus, AlertCircle, Check, Phone, Mail, 
  Banknote, Copy, FileText, Timer, Printer, Layers, ArrowRight, Coins,
  Lock, Unlock, Repeat, CalendarDays, Zap, RotateCw, LayoutGrid, Sun, Moon,
  HelpCircle, Calculator, Sparkles, GripVertical, MousePointerClick, Move,
  Wifi, Ambulance, Smartphone, FileSpreadsheet, UserCheck, AlertTriangle
} from 'lucide-react';
import { StaffMember, StaffRole, WorkShift, ShiftType, PayrollRecord, PayrollDetail, Expense, ModuleType } from '../types';
import { INITIAL_STAFF } from '../constants';

const StaffManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'roster' | 'attendance' | 'payroll'>('directory');
  
  // --- STATE ---
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('med_staff_v2');
    let data = saved ? JSON.parse(saved) : INITIAL_STAFF;
    if (data.length > 0) {
        data = data.map((s: any) => {
            let updated = { ...s };
            if (!s.assignedArea) updated.assignedArea = [];
            else if (typeof s.assignedArea === 'string') updated.assignedArea = [s.assignedArea];
            
            if (s.salaryDaily === undefined) updated.salaryDaily = s.salaryBase || 500;
            if (!s.allowedModules) {
                const allModules = Object.values(ModuleType);
                updated.allowedModules = s.role.includes('Médico') || s.role.includes('Admin') ? allModules : [ModuleType.MONITOR];
            }
            return updated;
        });
    }
    return data;
  });

  const [shifts, setShifts] = useState<WorkShift[]>(() => {
    const saved = localStorage.getItem('med_work_shifts_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('med_payrolls_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
      const saved = localStorage.getItem('med_expenses_v1');
      return saved ? JSON.parse(saved) : [];
  });

  // Filters & UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');
  
  // Roster View State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedArea, setSelectedArea] = useState<string>('TODAS');
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false); 
  const [isOverTrash, setIsOverTrash] = useState(false); 

  // Modal States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  
  const [staffForm, setStaffForm] = useState<Partial<StaffMember>>({
    name: '', role: 'Médico General', status: 'Activo', assignedArea: [], cedula: '', email: '', phone: '', salaryDaily: 0, paymentPeriod: 'Quincenal', allowedModules: [],
    isTelemedicineEnabled: false, isHomeServiceEnabled: false, mobileAppAccess: false
  });

  // --- SHIFT GENERATOR STATE ---
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftGenMode, setShiftGenMode] = useState<'single' | 'builder'>('single');
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  
  const [shiftConfig, setShiftConfig] = useState({
      staffId: '',
      area: '', 
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      shiftType: 'Matutino' as ShiftType,
      startTime: '07:00',
      endTime: '15:00',
      sequence: [] as { type: ShiftType | 'Descanso', label: string, color: string }[]
  });

  const [previewShifts, setPreviewShifts] = useState<WorkShift[]>([]);

  // Payroll Generator Modal
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollPeriod, setPayrollPeriod] = useState({ start: '', end: '' });
  const [legalWeeklyHours, setLegalWeeklyHours] = useState<number>(48); 
  const [generatedPayroll, setGeneratedPayroll] = useState<PayrollRecord | null>(null);

  // Persist Data
  useEffect(() => { localStorage.setItem('med_staff_v2', JSON.stringify(staffList)); }, [staffList]);
  useEffect(() => { localStorage.setItem('med_work_shifts_v2', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('med_payrolls_v1', JSON.stringify(payrolls)); }, [payrolls]);
  useEffect(() => { localStorage.setItem('med_expenses_v1', JSON.stringify(expenses)); }, [expenses]);

  // --- HELPERS ---
  const generateId = () => `STF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  
  const roles: StaffRole[] = ['Médico Especialista', 'Médico General', 'Enfermería', 'Químico / Laboratorio', 'Radiólogo / Imagen', 'Camillero', 'Limpieza / Intendencia', 'Caja / Admisión', 'Administrativo / RRHH', 'Farmacia'];
  const areas = ['Urgencias', 'Hospitalización', 'UCI', 'Quirófano', 'Consulta Externa', 'Laboratorio', 'Imagenología', 'Farmacia', 'Caja', 'Recepción', 'Limpieza General'];
  const shiftTypes: ShiftType[] = ['Matutino', 'Vespertino', 'Nocturno A', 'Nocturno B', 'Guardia', 'Jornada Acumulada', 'Personalizado'];
  const allModulesList = Object.values(ModuleType);

  const getShiftColor = (type: string) => {
      switch(type) {
          case 'Matutino': return 'bg-amber-100 border-amber-200 text-amber-800';
          case 'Vespertino': return 'bg-sky-100 border-sky-200 text-sky-800';
          case 'Nocturno A': 
          case 'Nocturno B': return 'bg-slate-800 border-slate-900 text-slate-100';
          case 'Guardia': return 'bg-rose-100 border-rose-200 text-rose-800';
          default: return 'bg-slate-50 border-slate-200 text-slate-600';
      }
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.cedula?.includes(searchTerm);
      const matchesRole = roleFilter === 'TODOS' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchTerm, roleFilter]);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStaffStart = (e: React.DragEvent, staff: StaffMember) => {
      e.dataTransfer.setData('type', 'staff-new');
      e.dataTransfer.setData('staffId', staff.id);
      setIsDragging(true);
  };

  const handleDragShiftStart = (e: React.DragEvent, shift: WorkShift) => {
      e.dataTransfer.setData('type', 'shift-move');
      e.dataTransfer.setData('shiftId', shift.id);
      setIsDragging(true);
  };

  const handleDragEnd = () => {
      setIsDragging(false);
      setIsOverTrash(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
  };

  const handleDragOverTrash = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOverTrash(true);
  };

  const handleDragLeaveTrash = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOverTrash(false);
  };

  const handleDropOnTrash = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const type = e.dataTransfer.getData('type');
      const shiftId = e.dataTransfer.getData('shiftId');

      if (type === 'shift-move' && shiftId) {
          removeShift(shiftId, undefined, true); 
      }
      
      setIsDragging(false);
      setIsOverTrash(false);
  };

  const handleDropOnArea = (e: React.DragEvent, areaName: string) => {
      e.preventDefault();
      setIsDragging(false);
      
      const type = e.dataTransfer.getData('type');

      if (type === 'staff-new') {
          const staffId = e.dataTransfer.getData('staffId');
          if (staffId) {
              setShiftConfig({
                  staffId,
                  area: areaName,
                  startDate: selectedDate,
                  endDate: selectedDate,
                  shiftType: 'Matutino',
                  startTime: '07:00',
                  endTime: '15:00',
                  sequence: []
              });
              setShiftGenMode('single');
              setEditingShiftId(null);
              setShowShiftModal(true);
          }
      } else if (type === 'shift-move') {
          const shiftId = e.dataTransfer.getData('shiftId');
          if (shiftId) {
              setShifts(prev => prev.map(s => {
                  if (s.id === shiftId) {
                      return { ...s, area: areaName }; 
                  }
                  return s;
              }));
          }
      }
  };

  // --- SHIFT GENERATOR ENGINE ---
  useEffect(() => {
      if (showShiftModal && shiftConfig.staffId) {
          generatePreview();
      }
  }, [shiftConfig, shiftGenMode, showShiftModal]);

  const addToSequence = (type: ShiftType | 'Descanso') => {
      let label = type === 'Descanso' ? 'D' : type.charAt(0);
      let color = 'bg-slate-100 text-slate-500';
      if (type === 'Matutino') { label = 'M'; color = 'bg-amber-100 text-amber-700'; }
      if (type === 'Vespertino') { label = 'V'; color = 'bg-sky-100 text-sky-700'; }
      if (type.includes('Nocturno')) { label = 'N'; color = 'bg-indigo-100 text-indigo-700'; }
      if (type === 'Guardia') { label = 'G'; color = 'bg-rose-100 text-rose-700'; }
      setShiftConfig(prev => ({
          ...prev,
          sequence: [...prev.sequence, { type, label, color }]
      }));
  };

  const getHoursForShift = (type: string) => {
      if (type === 'Matutino') return { start: '07:00', end: '15:00' };
      if (type === 'Vespertino') return { start: '14:00', end: '21:30' };
      if (type.includes('Nocturno')) return { start: '20:00', end: '08:00' };
      if (type === 'Guardia') return { start: '08:00', end: '08:00' };
      return { start: '09:00', end: '17:00' };
  };

  const generatePreview = () => {
      const staff = staffList.find(s => s.id === shiftConfig.staffId);
      if (!staff) return;

      const generated: WorkShift[] = [];
      const start = new Date(shiftConfig.startDate);
      const end = shiftGenMode === 'single' ? new Date(shiftConfig.startDate) : new Date(shiftConfig.endDate);
      
      if (end < start) return;

      const timeDiff = Math.abs(end.getTime() - start.getTime());
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

      for (let i = 0; i <= dayDiff; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          
          let shouldAdd = false;
          let currentShiftType = shiftConfig.shiftType;
          let currentStart = shiftConfig.startTime;
          let currentEnd = shiftConfig.endTime;

          if (shiftGenMode === 'single') {
              if (i === 0) shouldAdd = true;
          } 
          else if (shiftGenMode === 'builder') {
              if (shiftConfig.sequence.length === 0) continue;
              const step = shiftConfig.sequence[i % shiftConfig.sequence.length];
              if (step.type !== 'Descanso') {
                  shouldAdd = true;
                  currentShiftType = step.type as ShiftType;
                  const times = getHoursForShift(step.type);
                  currentStart = times.start;
                  currentEnd = times.end;
              }
          }

          if (shouldAdd) {
              generated.push({
                  id: `SH-${Date.now()}-${generated.length}-${Math.random().toString(36).substr(2, 5)}`,
                  staffId: staff.id,
                  staffName: staff.name,
                  role: staff.role,
                  area: shiftConfig.area || staff.assignedArea?.[0] || 'General',
                  date: dateStr,
                  shiftType: currentShiftType,
                  scheduledStartTime: currentStart,
                  scheduledEndTime: currentEnd,
                  attendanceStatus: 'Pendiente'
              });
          }
      }
      setPreviewShifts(generated);
  };

  // --- FIXED: EDIT LOGIC ---
  const handleEditShift = (shift: WorkShift, e?: React.MouseEvent) => {
      e?.stopPropagation(); // CRUCIAL: Prevent drag start
      
      setShiftConfig({
          staffId: shift.staffId,
          area: shift.area,
          startDate: shift.date,
          endDate: shift.date, // Force single day range
          shiftType: shift.shiftType,
          startTime: shift.scheduledStartTime,
          endTime: shift.scheduledEndTime,
          sequence: []
      });
      setShiftGenMode('single');
      setEditingShiftId(shift.id);
      setShowShiftModal(true);
  };

  // --- FIXED: DELETE LOGIC ---
  const removeShift = (shiftId: string, e?: React.MouseEvent, skipConfirm: boolean = false) => {
    e?.stopPropagation(); // CRUCIAL
    if(skipConfirm || window.confirm("¿Está seguro de eliminar esta asignación de turno?")) {
      setShifts(prev => prev.filter(s => s.id !== shiftId));
    }
  };

  const commitShifts = () => {
      if (previewShifts.length === 0) return alert("No hay turnos válidos para guardar");
      
      if (editingShiftId) {
          // UPDATE MODE
          const updatedData = previewShifts[0]; // Generator creates 1 shift in single mode
          if (!updatedData) return;

          setShifts(prev => prev.map(s => {
              if (s.id === editingShiftId) {
                  // Keep ID, update data
                  return { 
                      ...s, 
                      staffId: updatedData.staffId,
                      staffName: updatedData.staffName, // Update name in case staff changed
                      role: updatedData.role,
                      area: updatedData.area,
                      date: updatedData.date,
                      shiftType: updatedData.shiftType,
                      scheduledStartTime: updatedData.scheduledStartTime,
                      scheduledEndTime: updatedData.scheduledEndTime
                  };
              }
              return s;
          }));
          
          setEditingShiftId(null);
          setShowShiftModal(false);
      } else {
          // CREATE MODE
          const existingKeys = new Set(shifts.map(s => `${s.staffId}-${s.date}-${s.area}`));
          const nonDuplicateShifts = previewShifts.filter(s => !existingKeys.has(`${s.staffId}-${s.date}-${s.area}`));
          const skipped = previewShifts.length - nonDuplicateShifts.length;
          
          setShifts([...shifts, ...nonDuplicateShifts]);
          setShowShiftModal(false);
          
          let msg = `Se asignaron ${nonDuplicateShifts.length} turnos exitosamente.`;
          if (skipped > 0) msg += ` (Se omitieron ${skipped} duplicados).`;
          alert(msg);
      }
  };

  const autoFillFromDirectory = () => {
      const generated: WorkShift[] = [];
      const existingKeys = new Set(shifts.map(s => `${s.staffId}-${s.date}-${s.area}`));
      
      staffList.forEach(staff => {
          if (staff.status === 'Activo' && staff.assignedArea && staff.assignedArea.length > 0) {
              staff.assignedArea.forEach(area => {
                  const key = `${staff.id}-${selectedDate}-${area}`;
                  if (!existingKeys.has(key)) {
                      const times = getHoursForShift('Matutino'); 
                      generated.push({
                          id: `AUTO-SH-${Date.now()}-${generated.length}-${Math.random().toString(36).substr(2, 5)}`,
                          staffId: staff.id,
                          staffName: staff.name,
                          role: staff.role,
                          area: area,
                          date: selectedDate,
                          shiftType: 'Matutino',
                          scheduledStartTime: times.start,
                          scheduledEndTime: times.end,
                          attendanceStatus: 'Pendiente'
                      });
                  }
              });
          }
      });

      if (generated.length === 0) {
          alert("No se encontraron asignaciones pendientes para hoy.");
          return;
      }

      setShifts([...shifts, ...generated]);
      alert(`Se generaron ${generated.length} turnos automáticamente.`);
  };

  // --- UI ACTIONS ---
  const handleSaveStaff = () => {
    if (!staffForm.name || !staffForm.role) return alert("Nombre y Rol son obligatorios");
    
    const finalModules = (staffForm.allowedModules && staffForm.allowedModules.length > 0) 
        ? staffForm.allowedModules 
        : [ModuleType.MONITOR];

    const finalAreas = staffForm.assignedArea || [];

    if (editingStaffId) {
      setStaffList(prev => prev.map(s => s.id === editingStaffId ? { ...s, ...staffForm, allowedModules: finalModules, assignedArea: finalAreas } as StaffMember : s));
    } else {
      const newStaff: StaffMember = {
        id: generateId(),
        name: staffForm.name!.toUpperCase(),
        role: staffForm.role as StaffRole,
        status: staffForm.status as any || 'Activo',
        assignedArea: finalAreas,
        cedula: staffForm.cedula,
        specialty: staffForm.specialty,
        email: staffForm.email,
        phone: staffForm.phone,
        salaryDaily: Number(staffForm.salaryDaily) || 0,
        paymentPeriod: staffForm.paymentPeriod || 'Quincenal',
        rfc: staffForm.rfc,
        bankAccount: staffForm.bankAccount,
        joinDate: new Date().toISOString().split('T')[0],
        allowedModules: finalModules,
        isTelemedicineEnabled: staffForm.isTelemedicineEnabled,
        isHomeServiceEnabled: staffForm.isHomeServiceEnabled,
        mobileAppAccess: staffForm.mobileAppAccess
      };
      setStaffList(prev => [...prev, newStaff]);
    }
    setShowStaffModal(false);
    setEditingStaffId(null);
    setStaffForm({ name: '', role: 'Médico General', status: 'Activo', salaryDaily: 0, allowedModules: [], assignedArea: [], isTelemedicineEnabled: false, isHomeServiceEnabled: false, mobileAppAccess: false });
  };

  const openNewStaff = () => {
    setStaffForm({ name: '', role: 'Médico General', status: 'Activo', assignedArea: [], cedula: '', email: '', phone: '', salaryDaily: 0, paymentPeriod: 'Quincenal', allowedModules: [ModuleType.MONITOR], isTelemedicineEnabled: false, isHomeServiceEnabled: false, mobileAppAccess: false });
    setEditingStaffId(null);
    setShowStaffModal(true);
  };

  const openEditStaff = (staff: StaffMember) => {
    setStaffForm({ ...staff, assignedArea: staff.assignedArea || [] }); 
    setEditingStaffId(staff.id);
    setShowStaffModal(true);
  };

  const handleDeleteStaff = (id: string) => {
    if(window.confirm('¿Está seguro de eliminar este registro de personal?')) {
        setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleModulePermission = (mod: ModuleType) => {
      const current = staffForm.allowedModules || [];
      if (current.includes(mod)) {
          setStaffForm({ ...staffForm, allowedModules: current.filter(m => m !== mod) });
      } else {
          setStaffForm({ ...staffForm, allowedModules: [...current, mod] });
      }
  };

  const toggleAreaAssignment = (area: string) => {
      const current = staffForm.assignedArea || [];
      if (current.includes(area)) {
          setStaffForm({ ...staffForm, assignedArea: current.filter(a => a !== area) });
      } else {
          setStaffForm({ ...staffForm, assignedArea: [...current, area] });
      }
  };

  const toggleAllModules = (enable: boolean) => {
      setStaffForm({ ...staffForm, allowedModules: enable ? allModulesList : [] });
  };

  const getShiftsForDay = (date: string) => {
    return shifts.filter(s => s.date === date && (selectedArea === 'TODAS' || s.area === selectedArea));
  };

  const todayShifts = useMemo(() => shifts.filter(s => s.date === selectedDate), [shifts, selectedDate]);

  const handleCheckIn = (shiftId: string) => {
      const now = new Date().toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
      setShifts(prev => prev.map(s => {
          if (s.id === shiftId) {
              const scheduled = s.scheduledStartTime;
              const [schH, schM] = scheduled.split(':').map(Number);
              const [nowH, nowM] = now.split(':').map(Number);
              const schMins = schH * 60 + schM;
              const nowMins = nowH * 60 + nowM;
              
              const status = nowMins > (schMins + 15) ? 'Retardo' : 'Asistió';
              return { ...s, checkIn: now, attendanceStatus: status };
          }
          return s;
      }));
  };

  const handleCheckOut = (shiftId: string) => {
      const now = new Date().toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
      setShifts(prev => prev.map(s => {
          if (s.id === shiftId) {
              return { ...s, checkOut: now };
          }
          return s;
      }));
  };

  const calculateWorkedHours = (checkIn?: string, checkOut?: string) => {
      if (!checkIn || !checkOut) return 0;
      
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      
      let duration = (outH + outM/60) - (inH + inM/60);
      if (duration < 0) duration += 24; 
      
      return parseFloat(duration.toFixed(2));
  };

  const getRoleIcon = (role: StaffRole) => {
    if (role.includes('Médico')) return <Stethoscope size={16} className="text-blue-600"/>;
    if (role.includes('Enfermería')) return <Activity size={16} className="text-rose-600"/>;
    return <Briefcase size={16} className="text-slate-500"/>;
  };

  const getStaffAssignedAreas = () => {
      const s = staffList.find(st => st.id === shiftConfig.staffId);
      if (!s) return [];
      return s.assignedArea || [];
  };

  const generatePayrollPreview = () => {
      if (!payrollPeriod.start || !payrollPeriod.end) return alert("Seleccione el periodo");
      
      const start = new Date(payrollPeriod.start);
      const end = new Date(payrollPeriod.end);
      
      const details: PayrollDetail[] = staffList.map(staff => {
          const staffShifts = shifts.filter(s => {
              // Convert shift date string to Date object for comparison
              // Assuming s.date is YYYY-MM-DD
              const dStr = s.date;
              return s.staffId === staff.id && dStr >= payrollPeriod.start && dStr <= payrollPeriod.end;
          });

          if (staffShifts.length === 0) return null;

          const daysWorked = staffShifts.length;
          let totalHours = 0;
          
          staffShifts.forEach(s => {
             const startT = s.checkIn || s.scheduledStartTime;
             const endT = s.checkOut || s.scheduledEndTime;
             totalHours += calculateWorkedHours(startT, endT);
          });

          const grossSalary = daysWorked * staff.salaryDaily;
          
          return {
              staffId: staff.id,
              staffName: staff.name,
              daysWorked,
              totalWorkedHours: parseFloat(totalHours.toFixed(2)),
              grossSalary,
              overtimeDoubleHours: 0, 
              overtimeTripleHours: 0, 
              overtimeAmount: 0,
              bonuses: 0,
              deductions: 0,
              netSalary: grossSalary
          };
      }).filter((d): d is PayrollDetail => d !== null);

      const totalPaid = details.reduce((acc, d) => acc + d.netSalary, 0);

      const record: PayrollRecord = {
          id: `PAY-${Date.now()}`,
          periodStart: payrollPeriod.start,
          periodEnd: payrollPeriod.end,
          generationDate: new Date().toISOString(),
          status: 'Borrador',
          totalPaid,
          configUsed: { weeklyHours: legalWeeklyHours },
          details
      };

      setPayrolls(prev => [record, ...prev]);
      setShowPayrollModal(false);
      alert(`Prenómina generada para ${details.length} empleados.`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
             <Briefcase size={16} className="text-blue-600"/>
             <span>Capital Humano y Nómina</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Gestión de Personal</h1>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
           <button onClick={() => setActiveTab('directory')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Directorio</button>
           <button onClick={() => setActiveTab('roster')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Turnos y Roles</button>
           <button onClick={() => setActiveTab('attendance')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'attendance' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Reloj Checador</button>
           <button onClick={() => setActiveTab('payroll')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Nómina / Pagos</button>
        </div>
      </div>

      {/* --- DIRECTORIO --- */}
      {activeTab === 'directory' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           {/* ... Filtros y Botón Nuevo ... */}
           <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 flex-1">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none uppercase placeholder-slate-300"
                      placeholder="Buscar empleado..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <select 
                    className="p-3 bg-slate-50 rounded-2xl text-xs font-black uppercase outline-none border-none text-slate-600"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                 >
                    <option value="TODOS">Todos los Roles</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
              </div>
              <button 
                onClick={openNewStaff}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
              >
                 <UserPlus size={16}/> Alta de Personal
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map(s => (
                 <div key={s.id} draggable onDragStart={(e) => handleDragStaffStart(e, s)} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-move active:cursor-grabbing">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                        <button onClick={() => openEditStaff(s)} className="p-2 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl text-slate-400 transition-colors"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteStaff(s.id)} className="p-2 bg-slate-100 hover:bg-rose-600 hover:text-white rounded-xl text-slate-400 transition-colors"><Trash2 size={14}/></button>
                    </div>
                    
                    <div className="flex items-start gap-4 mb-4">
                       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ${s.role.includes('Médico') ? 'bg-blue-600' : s.role.includes('Enfermería') ? 'bg-rose-500' : 'bg-slate-800'}`}>
                          {s.name.charAt(0)}
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase leading-tight max-w-[180px]">{s.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             {getRoleIcon(s.role)}
                             <p className="text-[9px] font-bold text-slate-500 uppercase">{s.role}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                              {s.assignedArea && s.assignedArea.length > 0 ? s.assignedArea.map(a => (
                                  <span key={a} className="text-[7px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase font-black">{a}</span>
                              )) : (
                                  <span className="text-[7px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded border border-slate-200 uppercase font-bold">Rotativo / Sin Área Fija</span>
                              )}
                          </div>
                          <p className="text-[9px] text-emerald-600 font-black mt-2">${s.salaryDaily.toLocaleString()}/día</p>
                       </div>
                    </div>
                    
                    <div className="border-t border-slate-50 pt-4 mt-2 space-y-2">
                        {/* Status Badges for Integration */}
                        <div className="flex gap-2">
                            {s.isTelemedicineEnabled && (
                                <span className="bg-violet-100 text-violet-700 text-[8px] font-black uppercase px-2 py-1 rounded flex items-center gap-1 border border-violet-200">
                                    <Wifi size={8} /> Telemedicina
                                </span>
                            )}
                            {s.isHomeServiceEnabled && (
                                <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-1 rounded flex items-center gap-1 border border-amber-200">
                                    <Ambulance size={8} /> Domiciliario
                                </span>
                            )}
                            {s.mobileAppAccess && (
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-2 py-1 rounded flex items-center gap-1 border border-emerald-200">
                                    <Smartphone size={8} /> App Móvil
                                </span>
                            )}
                        </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* --- TURNOS (ROSTER) --- */}
      {activeTab === 'roster' && (
          <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-in fade-in">
              {/* Sidebar (List of Staff to Drag) */}
              <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col">
                  <div className="mb-6 space-y-4">
                      <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                          <Users size={16}/> Personal Disponible
                      </h3>
                      <input 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" 
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                      {filteredStaff.map(s => (
                          <div 
                              key={s.id} 
                              draggable
                              onDragStart={(e) => handleDragStaffStart(e, s)}
                              className="p-4 bg-slate-50 border border-slate-100 hover:border-blue-300 rounded-2xl cursor-move hover:shadow-md transition-all active:scale-95"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-600 shadow-sm border border-slate-200">
                                      {s.name.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-black uppercase text-slate-900 leading-tight">{s.name}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">{s.role}</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Drop Zone for Trash */}
                  <div 
                      onDragOver={handleDragOverTrash}
                      onDragLeave={handleDragLeaveTrash}
                      onDrop={handleDropOnTrash}
                      className={`mt-4 p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all ${isOverTrash ? 'bg-rose-100 border-rose-400 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  >
                      <Trash2 size={24} className={isOverTrash ? 'animate-bounce' : ''}/>
                      <p className="text-[9px] font-black uppercase mt-2">Arrastre aquí para eliminar turno</p>
                  </div>
              </div>

              {/* Main Calendar / Grid Area */}
              <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                  {/* Toolbar */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <input type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/>
                          <button onClick={autoFillFromDirectory} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase hover:bg-blue-100 transition-all flex items-center gap-2">
                              <Sparkles size={12}/> Autollenar
                          </button>
                      </div>
                      <div className="flex gap-2">
                          {['Matutino', 'Vespertino', 'Nocturno A'].map(t => (
                              <div key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                  <div className={`w-2 h-2 rounded-full ${t === 'Matutino' ? 'bg-amber-400' : t === 'Vespertino' ? 'bg-sky-400' : 'bg-indigo-400'}`}></div>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">{t}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Kanban Board by Area */}
                  <div className="flex-1 overflow-x-auto p-6 flex gap-6 custom-scrollbar">
                      {areas.map(area => (
                          <div 
                              key={area}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDropOnArea(e, area)}
                              className="w-72 flex-shrink-0 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col"
                          >
                              <div className="p-4 border-b border-slate-200 bg-white rounded-t-[2rem]">
                                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-center">{area}</h4>
                              </div>
                              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                  {getShiftsForDay(selectedDate).filter(s => s.area === area).map(shift => (
                                      <div 
                                          key={shift.id}
                                          draggable
                                          onDragStart={(e) => handleDragShiftStart(e, shift)}
                                          onClick={(e) => handleEditShift(shift, e)}
                                          className={`p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${getShiftColor(shift.shiftType)}`}
                                      >
                                          <div className="flex justify-between items-start mb-2">
                                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border bg-white/50 border-black/5`}>
                                                  {shift.shiftType}
                                              </span>
                                              <span className="text-[9px] font-bold opacity-60">{shift.scheduledStartTime} - {shift.scheduledEndTime}</span>
                                          </div>
                                          <p className="text-[10px] font-black uppercase leading-tight mb-1">{shift.staffName}</p>
                                          <p className="text-[8px] font-bold opacity-70 uppercase">{shift.role}</p>
                                          
                                          {/* Action Buttons on Hover */}
                                          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button 
                                                onClick={(e) => handleEditShift(shift, e)}
                                                className="p-1 bg-white/50 hover:bg-white rounded border border-black/10 shadow-sm"
                                              >
                                                <Edit2 size={12}/>
                                              </button>
                                              <button 
                                                onClick={(e) => removeShift(shift.id, e)}
                                                className="p-1 bg-white/50 hover:bg-rose-500 hover:text-white rounded border border-black/10 shadow-sm"
                                              >
                                                <Trash2 size={12}/>
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                                  {getShiftsForDay(selectedDate).filter(s => s.area === area).length === 0 && (
                                      <div className="h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                                          <p className="text-[9px] font-black uppercase">Arrastrar aquí</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- ATTENDANCE TAB --- */}
      {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase">Reloj Checador Digital</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {new Date().toLocaleDateString('es-MX', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
                      </p>
                  </div>
                  <div className="text-right">
                      <p className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">
                          {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                  </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                              <tr>
                                  <th className="px-8 py-5">Personal</th>
                                  <th className="px-6 py-5">Turno / Área</th>
                                  <th className="px-6 py-5 text-center">Horario</th>
                                  <th className="px-6 py-5 text-center">Entrada</th>
                                  <th className="px-6 py-5 text-center">Salida</th>
                                  <th className="px-6 py-5 text-right">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {todayShifts.map(shift => (
                                  <tr key={shift.id} className="hover:bg-slate-50 transition-all">
                                      <td className="px-8 py-4">
                                          <p className="text-xs font-black text-slate-900 uppercase">{shift.staffName}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase">{shift.role}</p>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border w-fit ${getShiftColor(shift.shiftType)}`}>{shift.shiftType}</span>
                                              <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">{shift.area}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <span className="font-mono text-xs font-bold text-slate-600">{shift.scheduledStartTime} - {shift.scheduledEndTime}</span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          {shift.checkIn ? (
                                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${shift.attendanceStatus === 'Retardo' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                  {shift.checkIn}
                                              </span>
                                          ) : <span className="text-slate-300">-</span>}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          {shift.checkOut ? (
                                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{shift.checkOut}</span>
                                          ) : <span className="text-slate-300">-</span>}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          {!shift.checkIn ? (
                                              <button onClick={() => handleCheckIn(shift.id)} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md">
                                                  Registrar Entrada
                                              </button>
                                          ) : !shift.checkOut ? (
                                              <button onClick={() => handleCheckOut(shift.id)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 transition-all shadow-md">
                                                  Registrar Salida
                                              </button>
                                          ) : (
                                              <span className="text-[9px] font-black text-slate-400 uppercase">Jornada Finalizada</span>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                              {todayShifts.length === 0 && (
                                  <tr>
                                      <td colSpan={6} className="py-20 text-center opacity-30">
                                          <Clock size={48} className="mx-auto mb-4 text-slate-400"/>
                                          <p className="text-xs font-black uppercase text-slate-400">No hay turnos programados para hoy</p>
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- PAYROLL TAB --- */}
      {activeTab === 'payroll' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase">Nómina y Pagos</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Historial de Dispersiones</p>
                  </div>
                  <button onClick={() => setShowPayrollModal(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                      <Calculator size={16}/> Nueva Nómina
                  </button>
              </div>
              {/* List of Payrolls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {payrolls.map(pay => (
                      <div key={pay.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  <FileText size={24}/>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${pay.status === 'Pagado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                  {pay.status}
                              </span>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 uppercase">Periodo: {new Date(pay.periodStart).toLocaleDateString()} - {new Date(pay.periodEnd).toLocaleDateString()}</h4>
                          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">${pay.totalPaid.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Dispersado</p>
                      </div>
                  ))}
                  {payrolls.length === 0 && (
                      <div className="col-span-full py-20 text-center opacity-30 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                          <Banknote size={48} className="mx-auto mb-4 text-slate-400"/>
                          <p className="text-xs font-black uppercase text-slate-400">Sin historial de nóminas</p>
                      </div>
                  )}
              </div>
          </div>
      )}
      
      {/* MODAL ALTA PERSONAL */}
      {showStaffModal && (
         <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] p-12 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/20">
               <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingStaffId ? 'Editar Perfil' : 'Contratación'}</h3>
                  <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><XCircle size={24}/></button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-2 space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                     <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Rol / Puesto</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value as StaffRole})}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Áreas Asignadas (Base)</label>
                     <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-2 min-h-[60px]">
                        {areas.map(a => {
                            const isAssigned = staffForm.assignedArea?.includes(a);
                            return (
                                <button
                                    key={a}
                                    onClick={() => toggleAreaAssignment(a)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border ${isAssigned ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    {a}
                                </button>
                            );
                        })}
                     </div>
                  </div>
               </div>

               <div className="pt-6 flex gap-4">
                  <button onClick={() => setShowStaffModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                  <button onClick={handleSaveStaff} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all mt-0">
                     Guardar Ficha
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* SHIFT MODAL - WITH FIX FOR UPDATE */}
      {showShiftModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl flex flex-col max-h-[95vh] border border-white/20">
                  <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                      <div>
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingShiftId ? 'Editar Asignación de Turno' : 'Constructor de Roles'}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{editingShiftId ? 'Modificar Detalles Existentes' : 'Asignación Inteligente y Patrones de Guardia'}</p>
                      </div>
                      <button onClick={() => { setShowShiftModal(false); setEditingShiftId(null); }} className="p-2 hover:bg-slate-100 rounded-xl"><XCircle size={24}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 py-6">
                      
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Personal</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" 
                                value={shiftConfig.staffId} 
                                onChange={e => {
                                    setShiftConfig({...shiftConfig, staffId: e.target.value});
                                    const staff = staffList.find(s => s.id === e.target.value);
                                    if (staff && staff.assignedArea && staff.assignedArea.length > 0) {
                                        setShiftConfig(prev => ({ ...prev, area: staff.assignedArea![0] }));
                                    }
                                }}
                              >
                                  <option value="">Seleccione...</option>
                                  {staffList.filter(s => s.status === 'Activo').map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Área Asignada</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none" 
                                value={shiftConfig.area} 
                                onChange={e => setShiftConfig({...shiftConfig, area: e.target.value})}
                              >
                                  <option value="">Seleccione...</option>
                                  {/* Prioritize assigned areas */}
                                  {getStaffAssignedAreas().length > 0 && <optgroup label="Áreas Asignadas">
                                      {getStaffAssignedAreas().map(a => <option key={a} value={a}>{a}</option>)}
                                  </optgroup>}
                                  <optgroup label="Otras Áreas">
                                      {areas.filter(a => !getStaffAssignedAreas().includes(a)).map(a => <option key={a} value={a}>{a}</option>)}
                                  </optgroup>
                              </select>
                          </div>
                      </div>

                      <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Inicio</label>
                                  <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={shiftConfig.startDate} onChange={e => setShiftConfig({...shiftConfig, startDate: e.target.value})} disabled={!!editingShiftId} />
                              </div>
                              {shiftGenMode !== 'single' && (
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta Fecha</label>
                                      <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={shiftConfig.endDate} onChange={e => setShiftConfig({...shiftConfig, endDate: e.target.value})} />
                                  </div>
                              )}
                          </div>

                          {shiftGenMode === 'single' && (
                              <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Turno Base</label>
                                      <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={shiftConfig.shiftType} onChange={e => setShiftConfig({...shiftConfig, shiftType: e.target.value as any})}>
                                          {shiftTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Entrada</label>
                                      <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={shiftConfig.startTime} onChange={e => setShiftConfig({...shiftConfig, startTime: e.target.value})} />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Salida</label>
                                      <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={shiftConfig.endTime} onChange={e => setShiftConfig({...shiftConfig, endTime: e.target.value})} />
                                  </div>
                              </div>
                          )}

                          {shiftGenMode === 'builder' && (
                              <div className="space-y-6">
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Construir Secuencia de Repetición</label>
                                      <div className="flex flex-wrap gap-2">
                                          <button onClick={() => addToSequence('Matutino')} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-amber-200 hover:bg-amber-200"><Sun size={14}/> + Matutino</button>
                                          <button onClick={() => addToSequence('Vespertino')} className="px-4 py-2 bg-sky-100 text-sky-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-sky-200 hover:bg-sky-200"><Sun size={14}/> + Vespertino</button>
                                          <button onClick={() => addToSequence('Nocturno A')} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-indigo-200 hover:bg-indigo-200"><Moon size={14}/> + Nocturno A</button>
                                          <button onClick={() => addToSequence('Nocturno B')} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-indigo-200 hover:bg-indigo-200"><Moon size={14}/> + Nocturno B</button>
                                          <button onClick={() => addToSequence('Guardia')} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-rose-200 hover:bg-rose-200"><ShieldCheck size={14}/> + Guardia 24h</button>
                                          <button onClick={() => addToSequence('Descanso')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-slate-200 hover:bg-slate-200"><XCircle size={14}/> + Descanso</button>
                                      </div>
                                  </div>

                                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[80px]">
                                      <div className="flex flex-wrap gap-2">
                                          {shiftConfig.sequence.map((step, i) => (
                                              <div key={i} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase border flex items-center gap-2 ${step.color}`}>
                                                  <span className="opacity-50 mr-1">{i+1}.</span> {step.type}
                                                  <button onClick={() => setShiftConfig(p => ({...p, sequence: p.sequence.filter((_, idx) => idx !== i)}))} className="hover:text-red-600"><XCircle size={10}/></button>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="flex justify-end">
                                      <button onClick={() => setShiftConfig(p => ({...p, sequence: []}))} className="text-xs text-rose-500 font-bold underline">Limpiar Secuencia</button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                      <button onClick={() => { setShowShiftModal(false); setEditingShiftId(null); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                      <button 
                        onClick={commitShifts}
                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                      >
                          <Check size={16}/> {editingShiftId ? 'Actualizar Turno' : 'Confirmar y Generar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL GENERAR NOMINA */}
      {showPayrollModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase">Generar Prenómina</h3>
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Inicio Periodo</label>
                          <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={payrollPeriod.start} onChange={e => setPayrollPeriod({...payrollPeriod, start: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Fin Periodo</label>
                          <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={payrollPeriod.end} onChange={e => setPayrollPeriod({...payrollPeriod, end: e.target.value})} />
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                          <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                              <Calculator size={12}/> Horas Semanales (Ley Federal)
                          </label>
                          <div className="relative">
                              <input 
                                type="number" 
                                className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-center" 
                                value={legalWeeklyHours} 
                                onChange={e => setLegalWeeklyHours(parseInt(e.target.value) || 0)} 
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400">HRS</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                      <button onClick={() => setShowPayrollModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500">Cancelar</button>
                      <button onClick={generatePayrollPreview} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Calcular</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StaffManagement;
