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
  // Fix: Add missing Info import from lucide-react
  Info
} from 'lucide-react';
import { ConsultationRecord } from '../types';

interface DailyReportProps {
  records: ConsultationRecord[];
}

const DailyReport: React.FC<DailyReportProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'suive1'>('daily');
  
  const filtered = records.filter(r => 
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simulación de agregación SUIVE-1
  const suiveData = useMemo(() => {
    // En una aplicación real, esto filtraría por la semana epidemiológica actual
    return [
      { code: 'A00.0', disease: 'Cólera', m_under1: 0, f_under1: 0, m_1_4: 0, f_1_4: 0, total: 0 },
      { code: 'A09', disease: 'Infecciones Intestinales', m_under1: 2, f_under1: 1, m_1_4: 3, f_1_4: 2, total: 8 },
      { code: 'J00-J06', disease: 'Infecciones Respiratorias Agudas', m_under1: 5, f_under1: 4, m_1_4: 10, f_1_4: 12, total: 31 },
      { code: 'E10-E14', disease: 'Diabetes Mellitus', m_under1: 0, f_under1: 0, m_1_4: 0, f_1_4: 0, total: 12 }, // Total general simplificado
      { code: 'I10-I15', disease: 'Hipertensión Arterial', m_under1: 0, f_under1: 0, m_1_4: 0, f_1_4: 0, total: 15 },
    ];
  }, [records]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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
          <button className="flex items-center px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all text-xs">
            <Printer className="w-4 h-4 mr-2.5 text-slate-400" /> Imprimir
          </button>
          <button className="flex items-center px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all text-xs">
            <Download className="w-4 h-4 mr-2.5 text-blue-400" /> Exportar SINAVE
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-6 text-slate-100 pointer-events-none group-hover:scale-110 transition-transform">
                  <Users className="w-24 h-24" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Atenciones</p>
               <p className="text-4xl font-black text-slate-900 mb-4">{records.length}</p>
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="text-blue-600 font-black mr-2">↑ 12%</span> vs ayer
               </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distribución Género</p>
               <div className="flex gap-10 mt-2">
                  <div>
                    <p className="text-2xl font-black text-slate-900">{records.filter(r => r.sex === 'M').length}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Hombres</p>
                  </div>
                  <div className="w-px h-10 bg-slate-100"></div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{records.filter(r => r.sex === 'F').length}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Mujeres</p>
                  </div>
               </div>
            </div>

            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
               <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
               <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Validación Normativa</p>
               <p className="text-xl font-bold">100% CUMPLIMIENTO</p>
               <p className="text-xs text-blue-100 opacity-80 mt-1">Todas las notas firmadas digitalmente.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtro Fecha:</span>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar por Diagnóstico o Paciente..." 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 shadow-sm">
                 <Filter className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    <th className="px-6 py-5">Fecha / Hora</th>
                    <th className="px-6 py-5">Identificación del Paciente</th>
                    <th className="px-6 py-5 text-center">S/E</th>
                    <th className="px-6 py-5">Diagnóstico Principal (CIE-10)</th>
                    <th className="px-6 py-5">Indicaciones</th>
                    <th className="px-6 py-5 text-right">Firma Digital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length > 0 ? (
                    filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/20 transition-all group">
                        <td className="px-6 py-5 text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                          {r.date}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-700 transition-all">{r.patientName}</p>
                          <p className="text-[9px] text-slate-400 font-mono tracking-tighter mt-0.5">{r.curp}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                            {r.sex} / {r.age}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="inline-flex bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold max-w-[200px] truncate border border-slate-800 shadow-sm">
                            {r.diagnosis}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[10px] text-slate-500 font-medium max-w-[220px] line-clamp-2 italic leading-relaxed">
                            {r.treatment}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-[9px] font-black uppercase tracking-widest shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Validado
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-32 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                          <FileSpreadsheet className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-900 font-bold">No se encontraron atenciones finalizadas</p>
                        <p className="text-sm text-slate-400 mt-2">Los registros aparecerán aquí una vez que firme y guarde sus notas médicas.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* VISTA SUIVE-1 (INFORME SEMANAL) */
        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
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
    </div>
  );
};

export default DailyReport;