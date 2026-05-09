import React from 'react';
import { Vitals } from '../../types';

export const MedicalCertificateView = ({ content, patientName, patientAge, patientSex, patientCurp }: { content: any, patientName: string, patientAge: string, patientSex: string, patientCurp: string }) => {
  const vitals = content.vitals || {};
  return (
    <div className="space-y-10 font-sans print:space-y-6 text-slate-900 border border-slate-200 p-8 print:border-none print:p-0">
      <div className="text-center py-6 print:py-4 border-b border-slate-200 print:border-none">
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] underline decoration-4 decoration-slate-200 underline-offset-8 print:text-xl">Certificado Médico {content.certType ? `(${content.certType})` : ''}</h2>
      </div>

      <div className="text-sm space-y-6 print:text-xs print:space-y-4">
          <p>A QUIEN CORRESPONDA:</p>
          <p>
              El que suscribe, <strong>{content.doctorName}</strong>, Médico legalmente autorizado para ejercer la profesión, con Cédula Profesional <strong>{content.cedula}</strong>, certifica haber examinado a <strong>{patientName}</strong>, encontrando al momento de la exploración los siguientes signos vitales y somatometría:
          </p>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-4 text-center text-xs border-y-2 border-slate-100 py-4 print:py-2">
              <div><p className="font-bold text-slate-500">Peso</p><p className="font-black">{vitals.weight || '--'} kg</p></div>
              <div><p className="font-bold text-slate-500">Talla</p><p className="font-black">{vitals.height || '--'} cm</p></div>
              <div><p className="font-bold text-slate-500">T.A.</p><p className="font-black">{vitals.bp || '--'} mmHg</p></div>
              <div><p className="font-bold text-slate-500">F.C.</p><p className="font-black">{vitals.hr || '--'} lpm</p></div>
              <div><p className="font-bold text-slate-500">Tipo Sangre</p><p className="font-black">{vitals.bloodType || 'N/D'}</p></div>
              <div><p className="font-bold text-slate-500">A.Visual</p><p className="font-black text-[10px]">OD:{vitals.visualAcuityOD||'--'} OI:{vitals.visualAcuityOI||'--'}</p></div>
          </div>

          <p><strong>ANTECEDENTES:</strong> {content.pathologicalHistory}</p>
          <p><strong>EXPLORACIÓN FÍSICA:</strong> {content.physicalExam}</p>
          <p><strong>ESTADO MENTAL / NEUROLÓGICO:</strong> {content.mentalStatus}</p>
          
          {(content.certType === 'Deportivo' || content.certType === 'Escolar') && (
              <p><strong>ESTADO DÉRMICO Y MÚSCULO-ESQUELÉTICO:</strong> {content.skinStatus} {content.musculoskeletal}</p>
          )}
          
          {content.certType === 'Licencia de Conducir' && (
              <p><strong>APTITUD MOTORA Y REFLEJOS:</strong> {content.musculoskeletal}</p>
          )}

          <div className="my-8 print:my-4">
              <p className="font-black uppercase mb-2">CONCLUSIÓN MÉDICA:</p>
              <p className="text-base font-bold italic print:text-sm">{content.conclusion}</p>
              {content.specificClause && <p className="text-base font-bold italic mt-2 print:text-sm">{content.specificClause}</p>}
          </div>

          <p className="text-xs print:text-[10px]">
              Se extiende el presente certificado a petición del interesado para los fines legales y administrativos que a este convengan (vigencia sugerida de {content.validity || 'indefinida'}).
          </p>
      </div>
    </div>
  );
};
