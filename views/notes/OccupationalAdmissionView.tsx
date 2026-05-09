import React from 'react';

export const OccupationalAdmissionView = ({ content }: { content: any }) => {
  const getArr = (key: string) => content[key] || [];
  const getVal = (key: string, defaultVal: any = '') => content[key] || defaultVal;
  
  return (
    <div className="space-y-8 font-sans print:space-y-4">
      <div className="border border-slate-300 p-6 print:border-none print:p-0 print:mb-6">
         <h4 className="font-black text-sm uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">I. Historial Ocupacional Previo</h4>
         <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="font-bold text-slate-500 uppercase">Puesto anterior:</span> <span className="font-black uppercase">{getVal('prevJob', 'N/A')}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Empresa:</span> <span className="font-black uppercase">{getVal('prevCompany', 'N/A')}</span></div>
            <div className="col-span-2"><span className="font-bold text-slate-500 uppercase">Exposición Previa:</span> <span className="font-black uppercase">{getArr('prevExposure').join(', ') || 'NINGUNA'}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Accidentes Previos:</span> <span className="font-black uppercase">{getVal('hadAccident')} {getVal('hadAccident') === 'Sí' ? `- ${getVal('accidentDetail')}` : ''}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Secuelas de Accidentes:</span> <span className="font-black uppercase">{getVal('hadSequels')} {getVal('hadSequels') === 'Sí' ? `- ${getVal('sequelsDetail')}` : ''}</span></div>
         </div>
      </div>

      <div className="border border-slate-300 p-6 print:border-none print:p-0 print:mb-6">
         <h4 className="font-black text-sm uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">II. Cuestionario de Riesgo (APP) y Alertas Críticas</h4>
         <div className="grid grid-cols-2 gap-4 text-xs mb-4">
            <div><span className="font-bold text-slate-500 uppercase">Diabetes Mellitus:</span> <span className="font-black uppercase">{getVal('hasDM', false) ? `SÍ - ${getVal('dmControl')}` : 'NO'}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Hipertensión:</span> <span className="font-black uppercase">{getVal('hasHTN', false) ? `SÍ - ${getVal('htnControl')}` : 'NO'}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Cirugías:</span> <span className="font-black uppercase">{getVal('hasSurgeries', false) ? `SÍ - ${getVal('surgeriesDetail')}` : 'NO'}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Alergias:</span> <span className="font-black uppercase">{getVal('hasAllergies', false) ? `SÍ - ${getVal('allergiesDetail')}` : 'NO'}</span></div>
         </div>
         <div className="bg-slate-100 p-4 border border-slate-200">
            <h5 className="font-black text-xs uppercase mb-2">Respuestas a Interrogatorio Dirigido:</h5>
            <ul className="list-disc pl-5 text-xs font-bold uppercase space-y-1">
               {getVal('alertConvulsiones') === 'Sí' && <li>Convulsiones/Epilepsia reportada.</li>}
               {getVal('alertMareos') === 'Sí' && <li>Mareos/Vértigo reportado.</li>}
               {getVal('alertHernias') === 'Sí' && <li>Hernias reportadas.</li>}
               {getVal('alertLumbalgia') === 'Sí' && <li>Lumbalgia reportada.</li>}
               {getVal('alertAsma') === 'Sí' && <li>Asma reportada.</li>}
               {getVal('alertMedsSleep') === 'Sí' && <li>Toma medicamentos que causan sueño: {getVal('alertMedsSleepDetail')}.</li>}
               {[getVal('alertConvulsiones'), getVal('alertMareos'), getVal('alertHernias'), getVal('alertLumbalgia'), getVal('alertAsma'), getVal('alertMedsSleep')].every(v => v !== 'Sí') && <li>Negadas.</li>}
            </ul>
         </div>
         {getVal('additionalAPP') && (
            <div className="mt-4 pt-4 border-t border-slate-200">
               <p className="font-bold text-slate-500 uppercase text-xs mb-1">Otros Antecedentes / Observaciones (APP adicionales)</p>
               <p className="font-black uppercase text-xs whitespace-pre-wrap">{getVal('additionalAPP')}</p>
            </div>
         )}
      </div>

      <div className="border border-slate-300 p-6 print:border-none print:p-0 print:mb-6">
         <h4 className="font-black text-sm uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">IV. Agudeza Visual y Auditiva</h4>
         <div className="grid grid-cols-3 gap-6 text-xs">
            <div>
               <p className="font-bold text-slate-500 uppercase mb-1">Agudeza Visual</p>
               <p className="font-black uppercase">Usa Lentes: {getVal('usesGlasses')}</p>
               <p className="font-black uppercase">OD: 20/{getVal('visionOD', '--')} | OI: 20/{getVal('visionOI', '--')}</p>
            </div>
            <div>
               <p className="font-bold text-slate-500 uppercase mb-1">Visión de Colores</p>
               <p className="font-black uppercase">{getVal('ishihara', 'No Evaluado')}</p>
            </div>
            <div>
               <p className="font-bold text-slate-500 uppercase mb-1">Agudeza Auditiva</p>
               <p className="font-black uppercase">{getVal('hearing', 'No Evaluado')}</p>
            </div>
         </div>
      </div>

      <div className="border border-slate-300 p-6 print:border-none print:p-0 print:mb-6">
         <h4 className="font-black text-sm uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">V & VI. Exploración Física y Musculoesquelética</h4>
         <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="font-bold text-slate-500 uppercase">Habitus/Marcha:</span> <span className="font-black uppercase">{getVal('habitus', '--')}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Alineación Columna:</span> <span className="font-black uppercase">{getVal('spineAlignment', '--')}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Cardiopulmonar:</span> <span className="font-black uppercase">{getVal('cardiopulm', '--')} {getVal('cardiopulm') === 'Alterado' ? `(${getVal('cardiopulmDetail')})` : ''}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Movilidad Articular:</span> <span className="font-black uppercase">{getVal('jointMobility', '--')} {getVal('jointMobility') === 'Limitada' ? `(${getVal('jointMobilityDetail')})` : ''}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Abdomen (Hernias):</span> <span className="font-black uppercase">{getVal('abdomen', '--')}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Fuerza Muscular:</span> <span className="font-black uppercase">{getVal('muscleStrength', '--')}</span></div>
         </div>
         
         <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
            <div><span className="font-bold text-slate-500 uppercase">Gangliones/Quistes:</span> <span className="font-black uppercase">{getVal('ganglions', '--')} {getVal('ganglions') === 'Positivo' ? `(${getVal('ganglionsDetail')})` : ''}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Onicomicosis:</span> <span className="font-black uppercase">{getVal('onychomycosis', '--')}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Derm/Amputaciones:</span> <span className="font-black uppercase">{getVal('dermAmputations', '--')} {getVal('dermAmputations') === 'Sí' ? `(${getVal('dermAmputationsDetail')})` : ''}</span></div>
            <div className="col-span-2"><span className="font-bold text-slate-500 uppercase">Tatuajes/Cicatrices:</span> <span className="font-black uppercase">{getVal('tattoosScars', 'Ninguno reportado')}</span></div>
         </div>

         {getVal('includeSpecialManeuvers') === true && (
           <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div><span className="font-bold text-slate-500 uppercase">Lasegue/Bragard:</span> <span className="font-black uppercase">{getVal('lasegue', '--')}</span></div>
              <div><span className="font-bold text-slate-500 uppercase">Phalen/Tinel:</span> <span className="font-black uppercase">{getVal('phalen', '--')}</span></div>
           </div>
         )}

         {getVal('additionalPhysical') && (
            <div className="mt-4 pt-4 border-t border-slate-200">
               <p className="font-bold text-slate-500 uppercase text-xs mb-1">Observaciones Adicionales de Exploración Física</p>
               <p className="font-black uppercase text-xs whitespace-pre-wrap">{getVal('additionalPhysical')}</p>
            </div>
         )}
      </div>

      <div className="border border-slate-300 p-6 print:border-none print:p-0 print:mb-6">
         <h4 className="font-black text-sm uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">VII. Laboratorio y Gabinete</h4>
         <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="font-bold text-slate-500 uppercase">Tipo de Sangre y Rh:</span> <span className="font-black uppercase">{getVal('bloodType', 'No evaluado')}</span></div>
            <div><span className="font-bold text-slate-500 uppercase">Antidoping:</span> <span className="font-black uppercase">{getVal('antidoping', 'N/A')} {getVal('antidoping') === 'Positivo' ? `(${getVal('antidopingDetail')})` : ''}</span></div>
            <div className="col-span-2"><span className="font-bold text-slate-500 uppercase">Otros Estudios (Rx, etc.):</span> <p className="font-black uppercase mt-1 whitespace-pre-wrap">{getVal('otherLabs', 'Ninguno')}</p></div>
         </div>
      </div>

      <div className={`border-4 p-8 print:border-2 print:p-4 ${getVal('dictamen') === 'APTO' ? 'border-emerald-500' : getVal('dictamen') === 'APTO CONDICIONADO' ? 'border-amber-500' : 'border-rose-500'}`}>
         <h4 className="font-black text-2xl print:text-lg uppercase tracking-tighter mb-4 pb-2 border-b-2 border-slate-200">
            DICTAMEN MÉDICO: <span className={getVal('dictamen') === 'APTO' ? 'text-emerald-600' : getVal('dictamen') === 'APTO CONDICIONADO' ? 'text-amber-600' : 'text-rose-600'}>{getVal('dictamen', 'PENDIENTE')}</span>
         </h4>
         
         <div className="space-y-4 text-sm mt-6">
            <div>
               <span className="font-black text-slate-500 uppercase text-xs">Diagnósticos Encontrados (CIE-10):</span>
               <p className="font-bold uppercase mt-1 print:whitespace-pre-wrap">{getVal('admissionDiagnoses', 'Ninguno reportado.')}</p>
            </div>
            
            {getVal('dictamen') === 'APTO CONDICIONADO' && getArr('dictamenRestrictions').length > 0 && (
               <div>
                  <span className="font-black text-slate-500 uppercase text-xs">Restricciones:</span>
                  <ul className="list-disc pl-5 mt-1 font-bold text-amber-700 uppercase">
                     {getArr('dictamenRestrictions').map((r: string) => <li key={r}>{r}</li>)}
                     {getVal('otherRestriction') && <li>{getVal('otherRestriction')}</li>}
                  </ul>
               </div>
            )}

            {getVal('businessObservations') && (
               <div>
                  <span className="font-black text-slate-500 uppercase text-xs">Observaciones para la Empresa:</span>
                  <p className="font-bold uppercase mt-1 italic print:whitespace-pre-wrap">{getVal('businessObservations')}</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
