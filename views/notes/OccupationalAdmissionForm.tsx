import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckSquare, Square, Check, Info } from 'lucide-react';

export const OccupationalAdmissionForm = ({ form, setForm }: { form: any, setForm: any }) => {
  const updateForm = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: string, item: string) => {
    const current = form[key] || [];
    if (current.includes(item)) {
      updateForm(key, current.filter((i: string) => i !== item));
    } else {
      updateForm(key, [...current, item]);
    }
  };

  // Safe getter for form properties to prevent undefined
  const getVal = (key: string, defaultVal: any = '') => form[key] !== undefined ? form[key] : defaultVal;
  const getArr = (key: string) => form[key] || [];

  return (
    <div className="space-y-12">
      {/* Riesgos del Puesto */}
      <div className="bg-white border text-left border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
          <ShieldCheck className="w-5 h-5 mr-3 text-blue-600" />
          Riesgos Principales del Puesto
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {['Carga Manual', 'Alturas', 'Maquinaria Pesada', 'Químicos', 'Ruido', 'Bipedestación Prolongada'].map(risk => (
            <label key={risk} className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all font-bold text-xs text-slate-700">
              <input 
                type="checkbox" 
                checked={getArr('jobRisks').includes(risk)}
                onChange={() => toggleArrayItem('jobRisks', risk)}
                className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500" 
              />
              {risk}
            </label>
          ))}
        </div>
      </div>

      {/* Historial Ocupacional */}
      <div className="bg-slate-50 border text-left border-slate-200 rounded-[2.5rem] p-8 shadow-inner">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">
          I. Historial Ocupacional Previo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Puesto anterior</label>
            <input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm" value={getVal('prevJob')} onChange={(e) => updateForm('prevJob', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Empresa</label>
            <input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm" value={getVal('prevCompany')} onChange={(e) => updateForm('prevCompany', e.target.value)} />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-3">Exposición Previa</label>
          <div className="flex flex-wrap gap-4">
            {['Ruido', 'Polvos/Humos', 'Químicos', 'Cargas pesadas (>15kg)'].map(exp => (
              <label key={exp} className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                <input type="checkbox" checked={getArr('prevExposure').includes(exp)} onChange={() => toggleArrayItem('prevExposure', exp)} className="w-4 h-4 rounded text-blue-600" />
                {exp}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
             <label className="text-xs font-black text-slate-800 uppercase block mb-2">¿Ha sufrido Accidentes de Trabajo?</label>
             <div className="flex gap-4 mb-3">
               <label className="flex items-center gap-2 font-bold text-sm"><input type="radio" checked={getVal('hadAccident') === 'No'} onChange={() => updateForm('hadAccident', 'No')} /> No</label>
               <label className="flex items-center gap-2 font-bold text-sm"><input type="radio" checked={getVal('hadAccident') === 'Sí'} onChange={() => updateForm('hadAccident', 'Sí')} /> Sí</label>
             </div>
             {getVal('hadAccident') === 'Sí' && (
               <input type="text" placeholder="Especificar..." className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={getVal('accidentDetail')} onChange={(e) => updateForm('accidentDetail', e.target.value)} />
             )}
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
             <label className="text-xs font-black text-slate-800 uppercase block mb-2">¿Tiene secuelas de accidentes previos?</label>
             <div className="flex gap-4 mb-3">
               <label className="flex items-center gap-2 font-bold text-sm"><input type="radio" checked={getVal('hadSequels') === 'No'} onChange={() => updateForm('hadSequels', 'No')} /> No</label>
               <label className="flex items-center gap-2 font-bold text-sm"><input type="radio" checked={getVal('hadSequels') === 'Sí'} onChange={() => updateForm('hadSequels', 'Sí')} /> Sí</label>
             </div>
             {getVal('hadSequels') === 'Sí' && (
               <input type="text" placeholder="Especificar..." className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={getVal('sequelsDetail')} onChange={(e) => updateForm('sequelsDetail', e.target.value)} />
             )}
             <p className="text-[10px] text-amber-600 font-bold mt-2 italic">⚠️ Bandera Roja: Secuelas condicionan puestos de carga/bipedestación.</p>
          </div>
        </div>
      </div>

      {/* APP & Alertas Críticas */}
      <div className="bg-white border text-left border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">
          II. Cuestionario de Riesgo (APP) y Alertas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           {[
             { key: 'hasDM', label: 'Diabetes Mellitus', controlKey: 'dmControl' },
             { key: 'hasHTN', label: 'Hipertensión Arterial', controlKey: 'htnControl' },
             { key: 'hasSurgeries', label: 'Cirugías previas', controlKey: 'surgeriesDetail' },
             { key: 'hasAllergies', label: 'Alergias', controlKey: 'allergiesDetail' },
           ].map(app => (
             <div key={app.key} className="flex flex-col gap-2">
                <label className="flex items-center gap-2 font-black text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={getVal(app.key) === true} onChange={(e) => updateForm(app.key, e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                  {app.label}
                </label>
                {getVal(app.key) === true && (
                  <input type="text" placeholder="Tratamiento/Control/Especificar..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none ml-6" value={getVal(app.controlKey)} onChange={(e) => updateForm(app.controlKey, e.target.value)} />
                )}
             </div>
           ))}
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
           <h5 className="text-xs font-black text-rose-800 uppercase tracking-widest mb-4 flex items-center"><AlertOctagon className="w-4 h-4 mr-2" /> Alertas Críticas (Interrogatorio Dirigido)</h5>
           <div className="space-y-4">
              {[
                { key: 'alertConvulsiones', label: '¿Sufre o ha sufrido convulsiones/epilepsia?', restriction: 'No apto alturas/maquinaria' },
                { key: 'alertMareos', label: '¿Padece mareos, vértigo o desmayos?', restriction: 'No apto alturas' },
                { key: 'alertHernias', label: '¿Ha tenido hernias (inguinal/umbilical)?', restriction: 'No apto carga pesada' },
                { key: 'alertLumbalgia', label: '¿Sufre dolor de espalda crónico/lumbalgia?', restriction: 'No apto carga pesada' },
                { key: 'alertAsma', label: '¿Padece asma o falta de aire al esfuerzo?', restriction: 'Uso de mascarillas/esfuerzo' },
                { key: 'alertMedsSleep', label: '¿Toma medicamentos que causen sueño?', restriction: 'Maquinaria', needsDetail: true, detailKey: 'alertMedsSleepDetail' }
              ].map(alert => (
                 <div key={alert.key} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded-xl border border-rose-100 gap-4">
                    <span className="text-xs font-bold text-slate-700">{alert.label}</span>
                    <div className="flex items-center gap-4">
                       <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal(alert.key) === 'No'} onChange={() => updateForm(alert.key, 'No')} className="accent-rose-600" /> No</label>
                       <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal(alert.key) === 'Sí'} onChange={() => updateForm(alert.key, 'Sí')} className="accent-rose-600" /> Sí</label>
                       {getVal(alert.key) === 'Sí' && <span className="text-[9px] font-black text-rose-600 uppercase bg-rose-100 px-2 py-1 rounded">⚠️ RESTRICCIÓN: {alert.restriction}</span>}
                    </div>
                    {alert.needsDetail && getVal(alert.key) === 'Sí' && (
                       <input type="text" placeholder="Cuales..." className="p-2 bg-slate-50 rounded border border-slate-200 text-xs mt-2 md:mt-0" value={getVal(alert.detailKey)} onChange={(e) => updateForm(alert.detailKey, e.target.value)} />
                    )}
                 </div>
              ))}
           </div>
        </div>

        <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
           <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Otros Antecedentes / Observaciones (APP adicionales)</label>
           <textarea 
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium outline-none focus:border-blue-500" 
              placeholder="Ej. Transfusiones previas, tabaquismo, alcoholismo, sedentarismo, tatuajes de reciente desarrollo, etc..."
              value={getVal('additionalAPP')}
              onChange={(e) => updateForm('additionalAPP', e.target.value)}
           />
        </div>
      </div>

      {/* Agudeza Visual Acústica */}
      <div className="bg-white border text-left border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">
          IV. Agudeza Visual y Auditiva
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <div className="flex gap-4 mb-2">
                 <span className="text-xs font-bold text-slate-700 uppercase">Usa Lentes:</span>
                 <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('usesGlasses') === 'No'} onChange={() => updateForm('usesGlasses', 'No')} /> No</label>
                 <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('usesGlasses') === 'Sí'} onChange={() => updateForm('usesGlasses', 'Sí')} /> Sí</label>
              </div>
              <div className="flex items-center gap-4">
                 <label className="text-xs font-black text-slate-500">OD: 20 /</label>
                 <input type="number" className="w-20 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-center" value={getVal('visionOD')} onChange={(e) => updateForm('visionOD', e.target.value)} />
                 <label className="text-xs font-black text-slate-500">OI: 20 /</label>
                 <input type="number" className="w-20 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-center" value={getVal('visionOI')} onChange={(e) => updateForm('visionOI', e.target.value)} />
              </div>
              <p className="text-[10px] text-amber-600 font-bold italic">⚠️ Visión {'>'} 20/40 en el mejor ojo sin corrección = APTO CONDICIONADO.</p>
           </div>
           
           <div className="space-y-4">
              <div className="flex flex-col gap-2">
                 <span className="text-xs font-bold text-slate-700 uppercase">Visión de Colores (Ishihara):</span>
                 <div className="flex gap-4">
                   <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('ishihara') === 'Normal'} onChange={() => updateForm('ishihara', 'Normal')} /> Normal</label>
                   <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('ishihara') === 'Alterado'} onChange={() => updateForm('ishihara', 'Alterado')} /> Alterado</label>
                 </div>
                 {getVal('ishihara') === 'Alterado' && <p className="text-[10px] text-rose-600 font-bold italic">⚠️ RESTRICCIÓN: Manejo de cableado eléctrico / códigos visuales.</p>}
              </div>

              <div className="flex flex-col gap-2 pt-4">
                 <span className="text-xs font-bold text-slate-700 uppercase">Agudeza Auditiva (Cuchicheada):</span>
                 <div className="flex gap-4">
                   <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('hearing') === 'Normal'} onChange={() => updateForm('hearing', 'Normal')} /> Normal</label>
                   <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('hearing') === 'Hipoacusia aparente'} onChange={() => updateForm('hearing', 'Hipoacusia aparente')} /> Hipoacusia aparente</label>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Exploración Física V. & VI. */}
      <div className="bg-slate-50 border text-left border-slate-200 rounded-[2.5rem] p-8 shadow-inner">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">
          V & VI. Exploración Física y Musculoesquelética
        </h4>
        
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-white rounded-2xl border border-slate-200">
                 <label className="text-xs font-black text-slate-500 uppercase block mb-3">Habitus y Marcha</label>
                 <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold outline-none" value={getVal('habitus')} onChange={(e) => updateForm('habitus', e.target.value)}>
                    <option value="">Seleccione...</option>
                    <option value="Normal">Normal</option>
                    <option value="Alterada / Claudicante">Alterada / Claudicante</option>
                 </select>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-200">
                 <label className="text-xs font-black text-slate-500 uppercase block mb-3">Cardiopulmonar</label>
                 <div className="flex flex-col gap-2">
                   <label className="flex items-center gap-2 font-bold text-xs"><input type="radio" checked={getVal('cardiopulm') === 'Sin compromiso'} onChange={() => updateForm('cardiopulm', 'Sin compromiso')} /> Sin compromiso</label>
                   <div className="flex items-center gap-2">
                     <label className="flex items-center gap-2 font-bold text-xs"><input type="radio" checked={getVal('cardiopulm') === 'Alterado'} onChange={() => updateForm('cardiopulm', 'Alterado')} /> Alterado</label>
                     {getVal('cardiopulm') === 'Alterado' && <input type="text" placeholder="Soplos/Sibilancias..." className="flex-1 p-2 bg-slate-50 rounded border text-xs" value={getVal('cardiopulmDetail')} onChange={e => updateForm('cardiopulmDetail', e.target.value)} />}
                   </div>
                 </div>
              </div>
           </div>

           <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-500 uppercase block mb-3">Abdomen (Búsqueda intencionada hernias)</label>
              <div className="flex flex-wrap gap-4 items-center">
                 <label className="flex items-center gap-2 font-bold text-xs"><input type="radio" checked={getVal('abdomen') === 'Sin masas ni hernias'} onChange={() => updateForm('abdomen', 'Sin masas ni hernias')} /> Sin masas ni hernias</label>
                 <label className="flex items-center gap-2 font-bold text-xs"><input type="radio" checked={getVal('abdomen') === 'Hernia Umbilical'} onChange={() => updateForm('abdomen', 'Hernia Umbilical')} /> Hernia Umbilical</label>
                 <label className="flex items-center gap-2 font-bold text-xs"><input type="radio" checked={getVal('abdomen') === 'Hernia Inguinal'} onChange={() => updateForm('abdomen', 'Hernia Inguinal')} /> Hernia Inguinal</label>
                 {['Hernia Umbilical', 'Hernia Inguinal'].includes(getVal('abdomen')) && (
                   <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded ml-auto">⚠️ CRITERIO EXCLUSIÓN: Carga Física</span>
                 )}
              </div>
           </div>

           <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-500 uppercase block mb-4 border-b border-slate-100 pb-2">Columna y Musculoesquelético</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase">Alineación Columna</span>
                   <select className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none" value={getVal('spineAlignment')} onChange={(e) => updateForm('spineAlignment', e.target.value)}>
                     <option value="">Seleccione...</option>
                     <option value="Normal">Normal</option>
                     <option value="Escoliosis / Cifosis">Escoliosis / Cifosis</option>
                   </select>
                 </div>
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase">Movilidad Articular</span>
                   <select className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none" value={getVal('jointMobility')} onChange={(e) => updateForm('jointMobility', e.target.value)}>
                     <option value="">Seleccione...</option>
                     <option value="Completa">Completa</option>
                     <option value="Limitada">Limitada</option>
                   </select>
                   {getVal('jointMobility') === 'Limitada' && <input type="text" placeholder="Especificar..." className="w-full mt-2 p-2 text-xs border bg-white rounded shadow-sm" value={getVal('jointMobilityDetail')} onChange={e=>updateForm('jointMobilityDetail',e.target.value)}/>}
                 </div>
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase">Fuerza Muscular (Daniels)</span>
                   <select className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none" value={getVal('muscleStrength')} onChange={(e) => updateForm('muscleStrength', e.target.value)}>
                     <option value="">Seleccione...</option>
                     <option value="5/5 (Normal)">5/5 (Fuerza normal)</option>
                     <option value="&lt; 4/5 (Debilidad)">&lt; 4/5 (Debilidad ⚠️)</option>
                   </select>
                 </div>
              </div>
           </div>

           <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-500 uppercase block mb-4 border-b border-slate-100 pb-2">Piel, Anexos y Extremidades</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase">Gangliones / Quistes</span>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('ganglions') === 'Negativo'} onChange={() => updateForm('ganglions', 'Negativo')} /> Negativo</label>
                     <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('ganglions') === 'Positivo'} onChange={() => updateForm('ganglions', 'Positivo')} /> Positivo</label>
                   </div>
                   {getVal('ganglions') === 'Positivo' && <input type="text" placeholder="Especificar (ej. muñeca derecha)..." className="w-full mt-2 p-2 text-xs border bg-white rounded shadow-sm" value={getVal('ganglionsDetail')} onChange={e=>updateForm('ganglionsDetail',e.target.value)}/>}
                 </div>
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase">Onicomicosis (Uñas)</span>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('onychomycosis') === 'Negativo'} onChange={() => updateForm('onychomycosis', 'Negativo')} /> Negativo</label>
                     <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('onychomycosis') === 'Positivo'} onChange={() => updateForm('onychomycosis', 'Positivo')} /> Positivo ⚠️</label>
                   </div>
                 </div>
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase">Dermatosis / Amputaciones</span>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('dermAmputations') === 'No'} onChange={() => updateForm('dermAmputations', 'No')} /> No</label>
                     <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('dermAmputations') === 'Sí'} onChange={() => updateForm('dermAmputations', 'Sí')} /> Sí</label>
                   </div>
                   {getVal('dermAmputations') === 'Sí' && <input type="text" placeholder="Especificar..." className="w-full mt-2 p-2 text-xs border bg-white rounded shadow-sm" value={getVal('dermAmputationsDetail')} onChange={e=>updateForm('dermAmputationsDetail',e.target.value)}/>}
                 </div>
                 <div className="lg:col-span-3">
                   <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase">Tatuajes / Cicatrices Evidentes (Identificación)</span>
                   <input type="text" placeholder="Describir señas particulares..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-xs" value={getVal('tattoosScars')} onChange={e => updateForm('tattoosScars', e.target.value)} />
                 </div>
              </div>
           </div>

           <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2 cursor-pointer" onClick={() => updateForm('includeSpecialManeuvers', !getVal('includeSpecialManeuvers', true))}>
                 <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                    <input type="checkbox" checked={getVal('includeSpecialManeuvers', true)} readOnly className="w-4 h-4 rounded text-blue-600" />
                    Maniobras Especiales (Lasègue/Phalen)
                 </label>
                 <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold">Opcional para Impresión</span>
              </div>
              
              {getVal('includeSpecialManeuvers', true) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                       <span className="text-xs font-bold text-slate-700 block mb-2">Lasègue / Bragard (Lumbalgia):</span>
                       <div className="flex gap-4">
                         <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('lasegue') === 'Negativo'} onChange={() => updateForm('lasegue', 'Negativo')} /> Negativo</label>
                         <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('lasegue') === 'Positivo'} onChange={() => updateForm('lasegue', 'Positivo')} /> Positivo ⚠️</label>
                       </div>
                   </div>
                   <div>
                       <span className="text-xs font-bold text-slate-700 block mb-2">Phalen / Tinel (Túnel del Carpo):</span>
                       <div className="flex gap-4">
                         <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('phalen') === 'Negativo'} onChange={() => updateForm('phalen', 'Negativo')} /> Negativo</label>
                         <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('phalen') === 'Positivo'} onChange={() => updateForm('phalen', 'Positivo')} /> Positivo ⚠️</label>
                       </div>
                   </div>
                </div>
              )}
           </div>

           <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-3">Observaciones Adicionales de Exploración Física</label>
              <textarea 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-20 text-xs font-medium outline-none focus:border-blue-500" 
                 placeholder="Ej. Presencia de lunares sospechosos, vitíligo, deformidades menores no limitantes..."
                 value={getVal('additionalPhysical')}
                 onChange={(e) => updateForm('additionalPhysical', e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Laboratorios */}
      <div className="bg-slate-50 border text-left border-slate-200 rounded-[2.5rem] p-8 shadow-inner">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">
          VII. Resultados de Laboratorio y Gabinete
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div className="p-4 bg-white rounded-2xl border border-slate-200">
             <label className="text-xs font-black text-slate-500 uppercase block mb-3">Tipo de Sangre y Rh</label>
             <select className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none" value={getVal('bloodType')} onChange={(e) => updateForm('bloodType', e.target.value)}>
               <option value="">No Evaluado</option>
               <option value="A+">A+</option>
               <option value="A-">A-</option>
               <option value="B+">B+</option>
               <option value="B-">B-</option>
               <option value="AB+">AB+</option>
               <option value="AB-">AB-</option>
               <option value="O+">O+</option>
               <option value="O-">O-</option>
             </select>
           </div>
           <div className="p-4 bg-white rounded-2xl border border-slate-200">
             <label className="text-xs font-black text-slate-500 uppercase block mb-3">Antidoping (Drogas de Abuso)</label>
             <div className="flex gap-4">
               <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('antidoping') === 'No Solicitado'} onChange={() => updateForm('antidoping', 'No Solicitado')} /> N/A</label>
               <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('antidoping') === 'Negativo (5/5)'} onChange={() => updateForm('antidoping', 'Negativo (5/5)')} /> Negativo</label>
               <label className="flex items-center gap-1 font-bold text-xs"><input type="radio" checked={getVal('antidoping') === 'Positivo'} onChange={() => updateForm('antidoping', 'Positivo')} /> Positivo ⚠️</label>
             </div>
             {getVal('antidoping') === 'Positivo' && <input type="text" placeholder="Especificar sustancias positivas..." className="w-full mt-3 p-2 text-xs border bg-slate-50 rounded shadow-sm" value={getVal('antidopingDetail')} onChange={e=>updateForm('antidopingDetail',e.target.value)}/>}
           </div>
           <div className="md:col-span-2 p-4 bg-white rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-500 uppercase block mb-3">Otros Estudios (Rayos X, Audiometría, Espirometría, Embrazo)</label>
              <textarea 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-xs font-medium outline-none focus:border-blue-500" 
                 placeholder="Describir los hallazgos de otros estudios solicitados..."
                 value={getVal('otherLabs')}
                 onChange={(e) => updateForm('otherLabs', e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Dictamen / Diagnósticos */}
      <div className="bg-white border text-left border-blue-200 rounded-[2.5rem] p-8 shadow-xl">
        <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-6 border-b border-blue-100 pb-4">
          VIII. Conclusión y Dictamen Médico
        </h4>
        
        <div className="space-y-8">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Diagnósticos Encontrados (CIE-10)</label>
              <textarea 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-bold outline-none focus:border-blue-500" 
                 placeholder="Ej. Paciente sano, Obesidad Grado I, Astigmatismo no corregido..."
                 value={getVal('admissionDiagnoses')}
                 onChange={(e) => updateForm('admissionDiagnoses', e.target.value)}
              />
           </div>

           <div className="p-6 bg-slate-900 rounded-3xl text-white">
              <label className="text-xs font-black text-blue-400 uppercase block mb-4 tracking-widest">Dictamen Final Emitido</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <button onClick={() => updateForm('dictamen', 'APTO')} className={`p-4 rounded-2xl font-black uppercase text-sm border-2 transition-all ${getVal('dictamen') === 'APTO' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>APTO</button>
                 <button onClick={() => updateForm('dictamen', 'APTO CONDICIONADO')} className={`p-4 rounded-2xl font-black uppercase text-sm border-2 transition-all ${getVal('dictamen') === 'APTO CONDICIONADO' ? 'bg-amber-500 border-amber-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>APTO CONDICIONADO</button>
                 <button onClick={() => updateForm('dictamen', 'NO APTO')} className={`p-4 rounded-2xl font-black uppercase text-sm border-2 transition-all ${getVal('dictamen') === 'NO APTO' ? 'bg-rose-500 border-rose-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>NO APTO</button>
              </div>

              {getVal('dictamen') === 'APTO CONDICIONADO' && (
                 <div className="bg-white/10 p-5 rounded-2xl border border-white/20 mt-4 space-y-3">
                    <p className="text-[10px] uppercase font-bold text-amber-300">Seleccione las restricciones a aplicar:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {[
                         'Uso obligatorio de lentes graduados.',
                         'Restricción de carga manual (No mayor a 15kg).',
                         'Restricción para trabajos en alturas / espacios confinados.',
                         'Restricción para manejo de maquinaria móvil / montacargas.',
                         'Condicionado a presentar control de enfermedad crónica (DM2 / HAS).'
                       ].map(res => (
                          <label key={res} className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white">
                            <input type="checkbox" checked={getArr('dictamenRestrictions').includes(res)} onChange={() => toggleArrayItem('dictamenRestrictions', res)} className="w-4 h-4 rounded" />
                            {res}
                          </label>
                       ))}
                    </div>
                    <div className="mt-3">
                       <input type="text" placeholder="Otra restricción específica..." className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none" value={getVal('otherRestriction')} onChange={e => updateForm('otherRestriction', e.target.value)} />
                    </div>
                 </div>
              )}
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Observaciones / Condicionantes para la Empresa</label>
              <textarea 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium outline-none focus:border-blue-500" 
                 placeholder="Comentarios adicionales dirigidos a recursos humanos..."
                 value={getVal('businessObservations')}
                 onChange={(e) => updateForm('businessObservations', e.target.value)}
              />
           </div>
        </div>
      </div>
    </div>
  );
};
