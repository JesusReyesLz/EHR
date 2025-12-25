
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
  Calendar
} from 'lucide-react';
import { Patient, PatientStatus, ClinicalNote } from '../types';

interface DailyReportProps {
  patients: Patient[];
  notes: ClinicalNote[];
}

const DailyReport: React.FC<DailyReportProps> = ({ patients, notes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('TODOS');
  const [viewMode, setViewMode] = useState<'daily' | 'suive1'>('daily');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  const doctorsList = useMemo(() => {
    const doctors = new Set<string>();
    // Collect doctors from notes and discharge data
    notes.forEach(n => { if(n.author) doctors.add(n.author); });
    patients.forEach(p => { if(p.history?.dischargeData?.medico) doctors.add(p.history.dischargeData.medico) });
    return ['TODOS', ...Array.from(doctors)];
  }, [notes, patients]);

  const attendedByDate = useMemo(() => {
    return patients.filter(p => p.status === PatientStatus.ATTENDED && p.lastVisit === reportDate);
  }, [patients, reportDate]);

  const filtered = useMemo(() => {
    return attendedByDate.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.curp.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDoctor = true;
      if (doctorFilter !== 'TODOS') {
        const dischargeDoc = p.history?.dischargeData?.medico;
        const noteDoc = notes.some(n => n.patientId === p.id && n.author === doctorFilter);
        matchesDoctor = dischargeDoc === doctorFilter || noteDoc;
      }

      return matchesSearch && matchesDoctor;
    });
  }, [attendedByDate, searchTerm, doctorFilter, notes]);

  const getHojaDiariaData = (patient: Patient) => {
    return patient.history?.dischargeData;
  };

  const suiveData = useMemo(() => {
    return [
      { code: 'A00.0', disease: 'Cólera', m_under1: 0, f_under1: 0, m_1_4: 0, f_1_4: 0, total: 0 },
      { code: 'A09', disease: 'Infecciones Intestinales', m_under1: 2, f_under1: 1, m_1_4: 3, f_1_4: 2, total: 8 },
      { code: 'J00-J06', disease: 'Infecciones Respiratorias Agudas', m_under1: 5, f_under1: 4, m_1_4: 10, f_1_4: 12, total: 31 },
      { code: 'E10-E14', disease: 'Diabetes Mellitus', m_under1: 0, f_under1: 0, m_1_4: 0, f_1_4: 0, total: 12 }, 
      { code: 'I10-I15', disease: 'Hipertensión Arterial', m_under1: 0, f_under1: 0, m_1_4: 0, f_1_4: 0, total: 15 },
    ];
  }, []);

  const displayDate = new Date(reportDate + 'T12:00:00').toLocaleDateString('es-MX', {day:'2-digit', month:'long', year:'numeric'});

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em] mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Control Administrativo y Epidemiológico</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
             {viewMode === 'daily' ? 'Hoja Diaria de Atenciones' : 'Informe Semanal SUIVE-1'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">Resumen consolidado para validación <span className="text-blue-600 font-bold uppercase">SUIVE / SINAVE</span>.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm mr-4">
             <button onClick={() => setViewMode('daily')} className={`px-5 py-2 text-[9px] font-black rounded-xl uppercase transition-all ${viewMode === 'daily' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Diario</button>
             <button onClick={() => setViewMode('suive1')} className={`px-5 py-2 text-[9px] font-black rounded-xl uppercase transition-all ${viewMode === 'suive1' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>SUIVE-1</button>
          </div>
          <button onClick={() => setShowPrintPreview(true)} className="flex items-center px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all text-xs">
            <Eye className="w-4 h-4 mr-2.5 text-blue-600" /> Previsualizar Hoja
          </button>
          <button className="flex items-center px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all text-xs">
            <Download className="w-4 h-4 mr-2.5 text-blue-400" /> Exportar SINAVE
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-6 text-slate-100 pointer-events-none group-hover:scale-110 transition-transform">
                  <Users className="w-24 h-24" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Altas del Día</p>
               <p className="text-4xl font-black text-slate-900 mb-4">{attendedByDate.length}</p>
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="text-emerald-600 font-black mr-2">PRODUCTIVIDAD</span> Hospitalaria Activa
               </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm no-print">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Filtro por Médico Tratante</p>
               <div className="relative">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 w-4 h-4" />
                  <select 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100"
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                  >
                     {doctorsList.map(doc => <option key={doc} value={doc}>{doc}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden no-print">
               <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
               <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Consolidado Histórico</p>
               <p className="text-xl font-bold">REGISTRO INTEGRAL</p>
               <p className="text-xs text-blue-100 opacity-80 mt-1">Conforme a NOM-004-SSA3-2012</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Calendar size={14} className="text-blue-600" /> Fecha de Reporte:
                </span>
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm hover:border-blue-300"
                />
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar por Paciente o CURP..." 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    <th className="px-6 py-5">Identificación</th>
                    <th className="px-6 py-5 text-center">S/E</th>
                    <th className="px-6 py-5">Diagnósticos (CIE-10)</th>
                    <th className="px-6 py-5">Programa / Detalles</th>
                    <th className="px-6 py-5 text-right">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length > 0 ? (
                    filtered.map((p) => {
                      const hojaData = getHojaDiariaData(p);
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="px-6 py-5">
                            <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-700 transition-all">{p.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono tracking-tighter mt-0.5">{p.curp}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                              {p.sex} / {p.age}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {hojaData?.diagnosticos && hojaData.diagnosticos.length > 0 ? (
                                <div className="space-y-1">
                                    {hojaData.diagnosticos.map((d: any, i: number) => (
                                        <div key={i} className="flex gap-2 text-[9px]">
                                            <span className="font-bold text-slate-900 uppercase">• {d.name}</span>
                                            <span className="text-slate-400 italic">({d.status})</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-400 italic uppercase">{p.reason}</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-[10px] font-black text-blue-600 uppercase">{hojaData?.program || 'NO REGISTRADO'}</p>
                            {hojaData?.programDetails && (
                                <div className="text-[8px] text-slate-500 uppercase mt-1">
                                    {Object.entries(hojaData.programDetails).map(([k, v]) => (
                                        <span key={k} className="mr-2 block">{k}: <b>{v as any}</b></span>
                                    ))}
                                </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-[9px] font-black uppercase tracking-widest shadow-sm">
                              <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Validado
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-32 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                          <FileSpreadsheet className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-900 font-black uppercase tracking-tight">No hay altas para la fecha: {reportDate}</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase">Seleccione otra fecha en el calendario superior.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
           {/* ... (SUIVE Section remains same structure, just re-rendered) */}
           <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-64 bg-blue-600/10 -skew-x-12 translate-x-32"></div>
              <div className="relative z-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Semana Epidemiológica #43</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conteo consolidado de morbilidad por NOM-017</p>
              </div>
              <div className="flex gap-4 relative z-10">
                 <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <p className="text-[8px] font-black uppercase text-slate-400">Padecimientos Activos</p>
                    <p className="text-xl font-black">156</p>
                 </div>
                 <div className="px-6 py-3 bg-emerald-600 rounded-2xl text-center shadow-lg">
                    <p className="text-[8px] font-black uppercase text-emerald-100">Estado Notificación</p>
                    <p className="text-xl font-black">LISTO</p>
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                 <thead>
                    <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                       <th className="px-8 py-6 border-b border-slate-100 sticky left-0 bg-slate-50 z-10">Enfermedad (Grupo)</th>
                       <th className="px-4 py-6 border-b border-slate-100 text-center">CIE-10</th>
                       <th className="px-4 py-6 border-b border-slate-100 text-center bg-blue-50/30">&lt;1 M</th>
                       <th className="px-4 py-6 border-b border-slate-100 text-center bg-blue-50/30">&lt;1 F</th>
                       <th className="px-4 py-6 border-b border-slate-100 text-center">1-4 M</th>
                       <th className="px-4 py-6 border-b border-slate-100 text-center">1-4 F</th>
                       <th className="px-4 py-6 border-b border-slate-100 text-center bg-slate-100">TOTAL</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {suiveData.map((s, idx) => (
                       <tr key={idx} className="hover:bg-slate-50 group">
                          <td className="px-8 py-5 text-xs font-black text-slate-800 uppercase tracking-tight sticky left-0 bg-white group-hover:bg-slate-50 z-10">{s.disease}</td>
                          <td className="px-4 py-5 text-center"><span className="px-2 py-1 bg-slate-100 rounded-lg font-mono text-[10px] font-bold">{s.code}</span></td>
                          <td className="px-4 py-5 text-center font-bold text-slate-400">{s.m_under1 || '-'}</td>
                          <td className="px-4 py-5 text-center font-bold text-slate-400">{s.f_under1 || '-'}</td>
                          <td className="px-4 py-5 text-center font-bold text-slate-900">{s.m_1_4 || '-'}</td>
                          <td className="px-4 py-5 text-center font-bold text-slate-900">{s.f_1_4 || '-'}</td>
                          <td className="px-4 py-5 text-center bg-slate-50/50 font-black text-blue-600">{s.total || '-'}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <div className="p-8 bg-blue-50/30 border-t border-slate-100 flex items-center gap-6">
              <Info className="text-blue-600 w-8 h-8 shrink-0" />
              <p className="text-[10px] text-blue-900 font-medium leading-relaxed uppercase">
                 "El SUIVE-1 consolida los casos nuevos detectados durante la consulta. Las enfermedades de notificación obligatoria marcadas con asterisco (*) en el manual de procedimientos requieren adicionalmente el llenado del Estudio Epidemiológico de Caso."
              </p>
           </div>
        </div>
      )}

      {showPrintPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center p-10 overflow-y-auto animate-in fade-in no-print">
           <div className="bg-slate-800 p-4 rounded-full shadow-2xl flex gap-6 mb-8 border border-white/10 sticky top-4 z-[210]">
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg"
              >
                <Printer size={18}/> Imprimir Hoja Diaria
              </button>
              <button 
                onClick={() => setShowPrintPreview(false)} 
                className="flex items-center gap-3 px-8 py-3 bg-slate-700 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg"
              >
                <X size={18}/> Salir
              </button>
           </div>

           <div className="bg-white w-full max-w-[215.9mm] min-h-[279.4mm] shadow-2xl p-[20mm] text-slate-900 print:shadow-none print:m-0">
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
                 <div className="space-y-4">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Hospital San Francisco</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Hoja Diaria de Productividad Médica</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase">Filtro Médico: {doctorFilter}</p>
                 </div>
                 <div className="text-right">
                    <FileBadge size={60} className="ml-auto mb-4 text-slate-900" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">{displayDate}</p>
                 </div>
              </div>

              <table className="w-full border-collapse border-2 border-slate-900">
                 <thead>
                    <tr className="bg-slate-100 border-2 border-slate-900">
                       <th className="p-3 text-[10px] font-black uppercase border-2 border-slate-900 text-left">Folio</th>
                       <th className="p-3 text-[10px] font-black uppercase border-2 border-slate-900 text-left">Paciente</th>
                       <th className="p-3 text-[10px] font-black uppercase border-2 border-slate-900 text-center">Edad/Sexo</th>
                       <th className="p-3 text-[10px] font-black uppercase border-2 border-slate-900 text-left">Diagnósticos</th>
                       <th className="p-3 text-[10px] font-black uppercase border-2 border-slate-900 text-center">Programa</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filtered.map(p => {
                       const hojaData = getHojaDiariaData(p);
                       return (
                       <tr key={p.id} className="border-2 border-slate-900">
                          <td className="p-3 text-[11px] font-bold border-2 border-slate-900 text-slate-900">{p.id}</td>
                          <td className="p-3 text-[11px] font-black uppercase border-2 border-slate-900 text-slate-900">{p.name}</td>
                          <td className="p-3 text-[11px] font-bold text-center border-2 border-slate-900 text-slate-900">{p.sex} / {p.age}</td>
                          <td className="p-3 text-[10px] font-bold border-2 border-slate-900 text-slate-900">
                             {hojaData?.diagnosticos?.map((d: any) => d.name).join(', ') || p.reason}
                          </td>
                          <td className="p-3 text-[10px] font-bold text-center border-2 border-slate-900 text-slate-900">{hojaData?.program || '-'}</td>
                       </tr>
                       );
                    })}
                 </tbody>
              </table>

              <div className="mt-16 border-t-2 border-slate-900 pt-8 grid grid-cols-2 gap-20">
                 <div className="text-center space-y-2">
                    <div className="w-full border-b-2 border-slate-900 h-1"></div>
                    <p className="text-[10px] font-black uppercase">Firma del Responsable de Estadística</p>
                 </div>
                 <div className="text-center space-y-2">
                    <div className="w-full border-b-2 border-slate-900 h-1"></div>
                    <p className="text-[10px] font-black uppercase">Visto Bueno Dirección Médica</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-[215.9mm] { max-width: 100% !important; margin: 0 !important; }
          .bg-slate-900 { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
          .border-slate-900 { border-color: #000 !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default DailyReport;
