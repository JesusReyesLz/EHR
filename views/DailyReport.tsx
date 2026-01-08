
import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Search,
  ShieldCheck,
  TrendingUp,
  Filter,
  Users,
  Activity,
  Table,
  CheckCircle2,
  Info,
  UserCheck,
  X,
  Eye,
  FileBadge,
  Calendar,
  AlertTriangle,
  ClipboardList,
  Baby,
  Stethoscope,
  PieChart,
  ExternalLink
} from 'lucide-react';
import { Patient, PatientStatus, ClinicalNote, ModuleType } from '../types';

interface DailyReportProps {
  patients: Patient[];
  notes: ClinicalNote[];
}

// Helper para fecha local correcta (Evita desfase de zona horaria)
const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

// Catálogo simplificado de Grupos SUIVE para mapeo automático
const SUIVE_GROUPS = [
    { id: 'IRAS', label: 'Infecciones Respiratorias Agudas (J00-J06, J20-J22)', keywords: ['respiratoria', 'faringitis', 'amigdalitis', 'rinofaringitis', 'bronquitis', 'gripe', 'catarro', 'j00', 'j01', 'j02', 'j03', 'j04', 'j05', 'j06'] },
    { id: 'EDAS', label: 'Infecciones Intestinales (A00-A09)', keywords: ['diarrea', 'gastroenteritis', 'salmonella', 'tifoidea', 'intestinal', 'colera', 'a00', 'a01', 'a02', 'a03', 'a04', 'a05', 'a06', 'a07', 'a08', 'a09'] },
    { id: 'DM', label: 'Diabetes Mellitus (E10-E14)', keywords: ['diabetes', 'mellitus', 'dm2', 'dm1', 'e10', 'e11', 'e12', 'e13', 'e14'] },
    { id: 'HAS', label: 'Hipertensión Arterial (I10-I15)', keywords: ['hipertension', 'arterial', 'has', 'presion alta', 'i10', 'i11', 'i12', 'i13', 'i14', 'i15'] },
    { id: 'COVID', label: 'COVID-19 (U07)', keywords: ['covid', 'sars-cov-2', 'coronavirus', 'u07'] },
    { id: 'URIN', label: 'Infección de Vías Urinarias (N30, N39)', keywords: ['urinaria', 'cistitis', 'ivu', 'n30', 'n39'] },
    { id: 'EMB', label: 'Supervisión de Embarazo (Z34-Z35)', keywords: ['embarazo', 'prenatal', 'gestacion', 'z34', 'z35'] },
    { id: 'OBE', label: 'Obesidad (E66)', keywords: ['obesidad', 'sobrepeso', 'e66'] },
];

const MANDATORY_NOTIFICATION = ['DENGUE', 'ZIKA', 'CHIKUNGUNYA', 'SARAMPION', 'RUBEOLA', 'TOSFERINA', 'COLERA', 'RABIA', 'MENINGITIS', 'MORDEDURA', 'VIOLENCIA'];

const DailyReport: React.FC<DailyReportProps> = ({ patients, notes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('TODOS');
  const [programFilter, setProgramFilter] = useState('TODOS');
  const [viewMode, setViewMode] = useState<'daily' | 'suive1'>('daily');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // Usar fecha local para evitar que salga "mañana" por UTC
  const [reportDate, setReportDate] = useState(getLocalToday());
  
  // FILTRADO PRINCIPAL: Basado en NOTAS, no en Pacientes, para permitir múltiples visitas
  const dailyRecords = useMemo(() => {
    // Filtrar notas tipo SUIVE generadas en la fecha seleccionada
    // Formato de fecha en notas es usually LocaleString (dd/mm/yyyy...), así que comparamos substring o parseamos
    // Para simplificar, asumimos que 'date' en nota es 'YYYY-MM-DD' o DD/MM/YYYY
    
    return notes.filter(n => {
        // Normalizar fecha de la nota
        let noteDateStr = '';
        if (n.date.includes('/')) {
             const parts = n.date.split(',')[0].split('/');
             // Asumiendo DD/MM/YYYY
             if (parts.length === 3) {
                 noteDateStr = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`; // YYYY-MM-DD
             }
        } else {
             noteDateStr = n.date.split('T')[0];
        }
        
        return n.type === 'Cierre de Consulta (SUIVE)' && noteDateStr === reportDate;
    }).map(note => {
        // Enriquecer nota con datos del paciente
        const patient = patients.find(p => p.id === note.patientId);
        return {
            noteId: note.id,
            patientId: note.patientId,
            patientName: patient?.name || 'Desconocido',
            curp: patient?.curp || '',
            age: patient?.age || 0,
            sex: patient?.sex || '',
            dischargeData: note.content // El contenido de la nota SUIVE es el dischargeData
        };
    });
  }, [notes, patients, reportDate]);

  const doctorsList = useMemo(() => {
    const doctors = new Set<string>();
    dailyRecords.forEach(r => { if(r.dischargeData?.medico) doctors.add(r.dischargeData.medico) });
    return ['TODOS', ...Array.from(doctors)];
  }, [dailyRecords]);

  const programsList = useMemo(() => {
      const progs = new Set<string>();
      dailyRecords.forEach(r => { if(r.dischargeData?.program) progs.add(r.dischargeData.program) });
      return ['TODOS', ...Array.from(progs)];
  }, [dailyRecords]);

  // Filtrado Avanzado sobre los registros diarios
  const filteredData = useMemo(() => {
    return dailyRecords.filter(r => {
      const discharge = r.dischargeData;
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = r.patientName.toLowerCase().includes(search) || 
                          r.curp.toLowerCase().includes(search) ||
                          (discharge?.diagnosticos?.[0]?.name || '').toLowerCase().includes(search);
      
      const matchesDoctor = doctorFilter === 'TODOS' || discharge?.medico === doctorFilter;
      const matchesProgram = programFilter === 'TODOS' || discharge?.program === programFilter;

      return matchesSearch && matchesDoctor && matchesProgram;
    });
  }, [dailyRecords, searchTerm, doctorFilter, programFilter]);

  // Estadísticas Rápidas
  const stats = useMemo(() => {
      let firstTime = 0;
      let subsequent = 0;
      let referrals = 0;
      let indigenous = 0;

      filteredData.forEach(r => {
          const details = r.dischargeData?.programDetails;
          if (details?.consultationType === '1a Vez') firstTime++; else subsequent++;
          if (details?.referral && details.referral !== 'Ninguna') referrals++;
          if (details?.isIndigenous) indigenous++;
      });

      return { firstTime, subsequent, referrals, indigenous, total: filteredData.length };
  }, [filteredData]);

  // Lógica SUIVE-1 Dinámica (Basada en registros diarios)
  const suiveStats = useMemo(() => {
      // Inicializar contadores por grupo
      const matrix = SUIVE_GROUPS.map(g => ({ ...g, m: 0, f: 0, total: 0 }));
      const others = { id: 'OTROS', label: 'Otras Causas (No SUIVE)', m: 0, f: 0, total: 0 };
      
      // Procesar solo casos marcados como 1a Vez en la nota
      const newCases = dailyRecords.filter(r => 
          r.dischargeData?.programDetails?.consultationType === '1a Vez'
      );

      newCases.forEach(r => {
          const dx = (r.dischargeData?.diagnosticos?.[0]?.name || '').toLowerCase();
          let matched = false;

          for (const group of matrix) {
              if (group.keywords.some(k => dx.includes(k))) {
                  if (r.sex === 'M') group.m++; else group.f++;
                  group.total++;
                  matched = true;
                  break;
              }
          }
          if (!matched) {
              if (r.sex === 'M') others.m++; else others.f++;
              others.total++;
          }
      });

      return [...matrix, others].filter(g => g.total > 0);
  }, [dailyRecords]);

  const isMandatoryNotification = (dx: string) => {
      if(!dx) return false;
      return MANDATORY_NOTIFICATION.some(k => dx.toUpperCase().includes(k));
  };

  const renderSpecifics = (specifics: any) => {
      if (!specifics || Object.keys(specifics).length === 0) return '-';
      const entries = Object.entries(specifics);
      return (
          <div className="text-[8px] uppercase text-slate-500 leading-tight">
              {entries.map(([key, val]) => {
                  if (typeof val === 'boolean') {
                      return val ? <span key={key} className="block">• {key}</span> : null;
                  }
                  return <span key={key} className="block">• {key}: <b>{String(val)}</b></span>;
              })}
          </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-600 uppercase text-[10px] font-black tracking-[0.3em]">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sistema de Información en Salud (SIS)</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
             {viewMode === 'daily' ? 'Hoja Diaria de Consulta' : 'Concentrado SUIVE-1'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
              Reporte estadístico y epidemiológico correspondiente al <span className="text-slate-900 font-bold">{new Date(reportDate + 'T12:00:00').toLocaleDateString('es-MX', {dateStyle: 'full'})}</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
            {/* DATE PICKER */}
            <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
                <Calendar className="text-slate-400 ml-2 mr-2" size={16}/>
                <input 
                    type="date" 
                    className="bg-transparent text-xs font-black uppercase outline-none text-slate-700"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                />
            </div>

            {/* VIEW SWITCHER */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button onClick={() => setViewMode('daily')} className={`px-4 py-2 text-[10px] font-black rounded-xl uppercase transition-all ${viewMode === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Hoja Diaria</button>
                <button onClick={() => setViewMode('suive1')} className={`px-4 py-2 text-[10px] font-black rounded-xl uppercase transition-all ${viewMode === 'suive1' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>SUIVE-1</button>
            </div>

            <button onClick={() => setShowPrintPreview(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center gap-2">
                <Printer size={16} /> Imprimir Informe
            </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
             <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Consultas</p>
                 <p className="text-3xl font-black text-slate-900">{stats.total}</p>
             </div>
             <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Primera Vez</p>
                 <p className="text-3xl font-black text-blue-600">{stats.firstTime}</p>
             </div>
             <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Subsecuentes</p>
                 <p className="text-3xl font-black text-emerald-600">{stats.subsequent}</p>
             </div>
             <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Referencias</p>
                 <p className="text-3xl font-black text-rose-600">{stats.referrals}</p>
             </div>
          </div>

          {/* MAIN TABLE */}
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
             {/* FILTERS TOOLBAR */}
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between no-print">
                 <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                        placeholder="Filtrar por paciente, diagnóstico o folio..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <select 
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 outline-none uppercase"
                    value={programFilter}
                    onChange={e => setProgramFilter(e.target.value)}
                 >
                    <option value="TODOS">Todos los Programas</option>
                    {programsList.filter(p => p !== 'TODOS').map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <select 
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 outline-none uppercase"
                    value={doctorFilter}
                    onChange={e => setDoctorFilter(e.target.value)}
                 >
                    <option value="TODOS">Todos los Médicos</option>
                    {doctorsList.filter(d => d !== 'TODOS').map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
             </div>

             {/* TABLE */}
             <div className="flex-1 overflow-auto">
                 <table className="w-full text-left border-collapse">
                     <thead className="bg-white sticky top-0 z-10 shadow-sm text-[9px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                             <th className="p-6 border-b border-slate-100">Paciente / CURP</th>
                             <th className="p-6 border-b border-slate-100 text-center">Edad / Sexo</th>
                             <th className="p-6 border-b border-slate-100">Diagnóstico (CIE-10)</th>
                             <th className="p-6 border-b border-slate-100 text-center">Tipo</th>
                             <th className="p-6 border-b border-slate-100">Programa / Detalles</th>
                             <th className="p-6 border-b border-slate-100 text-center">Referencia</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                         {filteredData.map(r => {
                             const data = r.dischargeData;
                             const dxName = data?.diagnosticos?.[0]?.name || 'Sin Diagnóstico';
                             const isNotifiable = isMandatoryNotification(dxName);
                             
                             return (
                                 <tr key={r.noteId} className={`hover:bg-slate-50 transition-colors ${isNotifiable ? 'bg-rose-50/30' : ''}`}>
                                     <td className="p-6">
                                         <p className="text-slate-900 font-black uppercase">{r.patientName}</p>
                                         <p className="text-[9px] font-mono text-slate-400 mt-1">{r.curp}</p>
                                         <div className="flex gap-2 mt-1">
                                             {data?.programDetails?.isIndigenous && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[7px] font-black uppercase">Indígena</span>}
                                             {data?.programDetails?.isDisability && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[7px] font-black uppercase">Discapacidad</span>}
                                             {data?.programDetails?.isMigrant && <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[7px] font-black uppercase">Migrante</span>}
                                         </div>
                                     </td>
                                     <td className="p-6 text-center">
                                         <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 border border-slate-200">
                                             {r.age} A / {r.sex}
                                         </span>
                                     </td>
                                     <td className="p-6 max-w-xs">
                                         <div className="flex items-start gap-2">
                                             {isNotifiable && <div title="Notificación Obligatoria"><AlertTriangle size={14} className="text-rose-500 flex-shrink-0 animate-pulse" /></div>}
                                             <p className={`uppercase leading-tight ${isNotifiable ? 'text-rose-700 font-black' : ''}`}>{dxName}</p>
                                         </div>
                                     </td>
                                     <td className="p-6 text-center">
                                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${data?.programDetails?.consultationType === '1a Vez' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                             {data?.programDetails?.consultationType || 'Subs.'}
                                         </span>
                                     </td>
                                     <td className="p-6">
                                         <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{data?.program}</p>
                                         {renderSpecifics(data?.programDetails?.specifics)}
                                     </td>
                                     <td className="p-6 text-center text-[10px] uppercase font-bold text-slate-500">
                                         {data?.programDetails?.referral !== 'Ninguna' ? (
                                             <span className="text-rose-600 flex items-center justify-center gap-1"><ExternalLink size={12}/> {data?.programDetails?.referral}</span>
                                         ) : '-'}
                                     </td>
                                 </tr>
                             );
                         })}
                         {filteredData.length === 0 && (
                             <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Sin registros para la fecha seleccionada</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
          </div>
        </>
      ) : (
        /* VISTA SUIVE-1 (ESTADÍSTICA) */
        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden animate-in slide-in-from-right-4">
            <div className="bg-slate-900 text-white p-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-64 bg-emerald-600/10 -skew-x-12 translate-x-32"></div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight">Informe Semanal de Casos Nuevos</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500"/> SUIVE-1 • Vigilancia Epidemiológica
                    </p>
                </div>
                <div className="flex gap-4 relative z-10">
                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Casos Nuevos</p>
                        <p className="text-2xl font-black">{suiveStats.reduce((a,b)=>a+b.total,0)}</p>
                    </div>
                </div>
            </div>

            <div className="p-10">
                <div className="overflow-x-auto rounded-[2rem] border border-slate-200">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="p-5">Grupo Epidemiológico (CIE-10)</th>
                                <th className="p-5 text-center bg-blue-50/50 text-blue-600">Masculino</th>
                                <th className="p-5 text-center bg-pink-50/50 text-pink-600">Femenino</th>
                                <th className="p-5 text-center bg-slate-100 text-slate-600">Total</th>
                                <th className="p-5 text-center">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                            {suiveStats.map(stat => (
                                <tr key={stat.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-5">
                                        <p className="uppercase font-black text-slate-900">{stat.label}</p>
                                    </td>
                                    <td className="p-5 text-center bg-blue-50/20 font-mono text-slate-500">{stat.m}</td>
                                    <td className="p-5 text-center bg-pink-50/20 font-mono text-slate-500">{stat.f}</td>
                                    <td className="p-5 text-center bg-slate-50 font-black text-slate-900">{stat.total}</td>
                                    <td className="p-5 text-center">
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">Validado</span>
                                    </td>
                                </tr>
                            ))}
                            {suiveStats.length === 0 && (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No hay casos de 1a vez registrados hoy</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-8 flex gap-4 p-6 bg-amber-50 border border-amber-100 rounded-3xl">
                     <Info className="text-amber-600 flex-shrink-0" />
                     <p className="text-xs text-amber-900 font-medium leading-relaxed">
                         <strong>Nota:</strong> Este concentrado se genera automáticamente basándose en los diagnósticos de los pacientes marcados como "1a Vez" en el cierre de la nota médica. Los padecimientos marcados como de notificación inmediata deben reportarse adicionalmente por los canales de Jurisdicción Sanitaria.
                     </p>
                </div>
            </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL */}
      {showPrintPreview && (
          <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur flex items-center justify-center p-8 animate-in fade-in no-print">
              <div className="bg-white w-full max-w-[215mm] h-full overflow-y-auto rounded-none shadow-none print:w-full print:h-auto print:overflow-visible">
                  
                  {/* PRINT TOOLBAR */}
                  <div className="sticky top-0 left-0 right-0 bg-slate-800 p-4 flex justify-between items-center no-print z-50 shadow-md">
                      <p className="text-white text-xs font-black uppercase tracking-widest">Vista Previa de Impresión (Hoja Oficial)</p>
                      <div className="flex gap-4">
                          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-blue-500 flex items-center gap-2"><Printer size={14}/> Imprimir</button>
                          <button onClick={() => setShowPrintPreview(false)} className="px-6 py-2 bg-slate-700 text-white rounded-lg text-xs font-bold uppercase hover:bg-rose-600">Cerrar</button>
                      </div>
                  </div>

                  {/* PRINT CONTENT - SIS-01-P LAYOUT REPLICA */}
                  <div className="p-[10mm] text-black">
                      {/* Header Institucional */}
                      <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4">
                          <div>
                              <h1 className="text-lg font-bold uppercase">Secretaría de Salud</h1>
                              <h2 className="text-sm font-bold uppercase">Hoja Diaria de Consulta Externa (SIS-SS-01-P)</h2>
                          </div>
                          <div className="text-right text-xs">
                              <p><span className="font-bold">CLUES:</span> DFSSA001234</p>
                              <p><span className="font-bold">FECHA:</span> {new Date(reportDate + 'T12:00:00').toLocaleDateString('es-MX')}</p>
                              <p><span className="font-bold">HOJA:</span> 1 DE 1</p>
                          </div>
                      </div>

                      {/* Tabla Compacta para Impresión */}
                      <table className="w-full border-collapse border border-black text-[9px] uppercase">
                          <thead>
                              <tr className="bg-gray-100">
                                  <th className="border border-black p-1 w-8">No.</th>
                                  <th className="border border-black p-1">Nombre del Paciente / CURP</th>
                                  <th className="border border-black p-1 w-10 text-center">Edad</th>
                                  <th className="border border-black p-1 w-8 text-center">Sex</th>
                                  <th className="border border-black p-1 w-12 text-center">Seguro</th>
                                  <th className="border border-black p-1">Diagnóstico Principal (CIE-10)</th>
                                  <th className="border border-black p-1 w-12 text-center">1a Vez</th>
                                  <th className="border border-black p-1 w-12 text-center">Subs.</th>
                                  <th className="border border-black p-1">Programa / Acciones</th>
                              </tr>
                          </thead>
                          <tbody>
                              {filteredData.map((r, i) => {
                                  const d = r.dischargeData;
                                  const isFirst = d?.programDetails?.consultationType === '1a Vez';
                                  return (
                                      <tr key={r.noteId}>
                                          <td className="border border-black p-1 text-center">{i + 1}</td>
                                          <td className="border border-black p-1">
                                              <div className="font-bold">{r.patientName}</div>
                                              <div>{r.curp}</div>
                                          </td>
                                          <td className="border border-black p-1 text-center">{r.age}</td>
                                          <td className="border border-black p-1 text-center">{r.sex}</td>
                                          <td className="border border-black p-1 text-center">Ninguno</td> {/* Campo placeholder */}
                                          <td className="border border-black p-1 font-bold">{d?.diagnosticos?.[0]?.name || 'Sin Dx'}</td>
                                          <td className="border border-black p-1 text-center">{isFirst ? 'X' : ''}</td>
                                          <td className="border border-black p-1 text-center">{!isFirst ? 'X' : ''}</td>
                                          <td className="border border-black p-1">
                                              {d?.program}<br/>
                                              <span className="italic">{d?.programDetails?.referral !== 'Ninguna' ? `Ref: ${d?.programDetails?.referral}` : ''}</span>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {/* Rellenar filas vacías para completar hoja si es necesario */}
                              {Array.from({ length: Math.max(0, 15 - filteredData.length) }).map((_, i) => (
                                  <tr key={`empty-${i}`} className="h-8">
                                      <td className="border border-black p-1 text-center">{filteredData.length + i + 1}</td>
                                      <td className="border border-black"></td>
                                      <td className="border border-black"></td>
                                      <td className="border border-black"></td>
                                      <td className="border border-black"></td>
                                      <td className="border border-black"></td>
                                      <td className="border border-black"></td>
                                      <td className="border border-black"></td>
                                      <td className="border border-black"></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      {/* Footer Firmas */}
                      <div className="flex justify-between mt-12 pt-8">
                          <div className="text-center w-1/3">
                              <div className="border-b border-black mb-1 h-1"></div>
                              <p className="font-bold text-[10px]">NOMBRE Y FIRMA DEL MÉDICO</p>
                          </div>
                          <div className="text-center w-1/3">
                              <div className="border-b border-black mb-1 h-1"></div>
                              <p className="font-bold text-[10px]">SELLO DE LA UNIDAD</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @media print {
          .no-print, nav, aside, button, select, input[type="date"], input[type="text"] { display: none !important; }
          body { background: white !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-7xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          /* Ocultar elementos de UI no deseados */
          .shadow-xl, .shadow-2xl, .shadow-sm { box-shadow: none !important; }
          .rounded-\[3rem\] { border-radius: 0 !important; }
          /* Forzar estilos de tabla para impresión nítida */
          table { width: 100% !important; border-collapse: collapse !important; font-size: 9pt !important; }
          th, td { border: 1px solid #000 !important; padding: 4px !important; color: #000 !important; }
          @page { margin: 1cm; size: letter landscape; }
        }
      `}</style>
    </div>
  );
};

export default DailyReport;
