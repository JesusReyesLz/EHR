
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, FlaskConical, ImageIcon, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Patient, ClinicalNote, PatientStatus } from '../types';

const AuxiliaryReport: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [reportType, setReportType] = useState<'Laboratorio' | 'Imagenología'>('Laboratorio');
  const [labResults, setLabResults] = useState([
    { analyte: 'Glucosa en ayuno', value: '', unit: 'mg/dL', refRange: '70-100', status: 'Normal' },
    { analyte: 'Creatinina sérica', value: '', unit: 'mg/dL', refRange: '0.6-1.2', status: 'Normal' },
    { analyte: 'Urea', value: '', unit: 'mg/dL', refRange: '10-50', status: 'Normal' }
  ]);
  const [findings, setFindings] = useState('');

  if (!patient) return null;

  const handleSave = () => {
    const newNoteId = `RES-${Date.now()}`;
    onSaveNote({
      id: newNoteId,
      patientId: patient.id,
      type: `Reporte de ${reportType}`,
      date: new Date().toLocaleString('es-MX'),
      author: 'Q.F.B. Beatriz Mendoza',
      content: { reportType, labResults: reportType === 'Laboratorio' ? labResults : undefined, findings },
      isSigned: true,
      hash: `CERT-AUX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    });
    onUpdatePatient({ ...patient, status: PatientStatus.READY_RESULTS });
    navigate(`/patient/${patient.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
      <div className="bg-white border-b-8 border-indigo-600 p-10 rounded-t-[3.5rem] shadow-2xl mb-10 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl"><ChevronLeft size={24} /></button>
          <h1 className="text-3xl font-black uppercase">Captura de Resultados</h1>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
           <button onClick={() => setReportType('Laboratorio')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${reportType === 'Laboratorio' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Laboratorio</button>
           <button onClick={() => setReportType('Imagenología')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${reportType === 'Imagenología' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Imagenología</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           {reportType === 'Laboratorio' ? (
             <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-2xl overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr><th className="px-8 py-5">Analito</th><th className="px-4 py-5 text-center">Valor</th><th className="px-4 py-5 text-center">Ref.</th><th className="px-8 py-5 text-center">Estatus</th></tr>
                   </thead>
                   <tbody className="divide-y">
                      {labResults.map((r, i) => (
                         <tr key={i} className="hover:bg-indigo-50/20 transition-all">
                            <td className="px-8 py-4 text-[11px] font-black uppercase">{r.analyte}</td>
                            <td className="px-4 py-4"><input className="w-24 mx-auto block bg-white border-2 border-slate-200 p-3 rounded-xl font-black text-center text-indigo-700" value={r.value} onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, value: e.target.value} : lr))} /></td>
                            <td className="px-4 py-4 text-center text-[10px] font-bold text-slate-400">{r.refRange}</td>
                            <td className="px-8 py-4 text-center">
                               <select className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase text-white ${r.status === 'Normal' ? 'bg-emerald-500' : 'bg-rose-600'}`} value={r.status} onChange={e => setLabResults(labResults.map((lr, idx) => idx === i ? {...lr, status: e.target.value} : lr))}>
                                  <option>Normal</option><option>Alto</option><option>Bajo</option>
                               </select>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[3.5rem] p-12 space-y-8">
                <label className="text-[10px] font-black uppercase tracking-widest block ml-2">Descripción de Hallazgos Radiológicos</label>
                <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-64 text-sm font-medium italic outline-none shadow-inner focus:bg-white" value={findings} onChange={e => setFindings(e.target.value)} />
             </div>
           )}
        </div>
        <div className="lg:col-span-4">
           <div className="bg-slate-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-10 border border-white/10">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-4">Validación Técnica</h3>
              <button onClick={handleSave} className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-5"><Save size={24} /> Finalizar y Sellar</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryReport;
