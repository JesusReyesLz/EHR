import React, { useState } from 'react';
import { Shield, FileText, CheckCircle, AlertTriangle, FileSpreadsheet, Lock, Plus, Upload, Save, X, Edit3, Trash2, Search, Filter } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('docs'); // docs, privacy, audit, risks, access
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [isAddingNorm, setIsAddingNorm] = useState(false);
  
  // Mock states for interactive features
  const [privacyText, setPrivacyText] = useState('La clínica protege los datos de los pacientes conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares...');
  
  const [auditChecks, setAuditChecks] = useState([
    { id: 1, norm: 'NOM-004-SSA3-2012', desc: 'Del expediente clínico', status: true },
    { id: 2, norm: 'NOM-024-SSA3-2012', desc: 'Sistemas de Información de Registro Electrónico para la Salud', status: false },
    { id: 3, norm: 'NOM-087-SEMARNAT-SSA1-2002', desc: 'Residuos peligrosos biológico-infecciosos (RPBI)', status: true },
    { id: 4, norm: 'NOM-016-SSA3-2012', desc: 'Características mínimas de infraestructura y equipamiento', status: true },
  ]);

  const [risks, setRisks] = useState([
    { id: 1, date: '10/May/2026', type: 'Infraestructura', desc: 'Corte de luz, falla de planta de emergencia', status: 'Resuelto', severity: 'Alta' },
    { id: 2, date: '08/May/2026', type: 'Sistemas', desc: 'Caída de red local por 20 minutos', status: 'En revisión', severity: 'Media' }
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. Roberto Mendoza', email: 'roberto@clinica.com', role: 'Médico Especialista', status: 'Activo' },
    { id: 2, name: 'Enf. Carmen Sánchez', email: 'carmen@clinica.com', role: 'Enfermería', status: 'Activo' },
    { id: 3, name: 'Lic. Admin. Arturo', email: 'arturo@clinica.com', role: 'Admin', status: 'Activo' }
  ]);

  const [docs, setDocs] = useState([
    { id: 1, title: 'Aviso de Funcionamiento COFEPRIS', status: 'Vigente', date: '12/Ene/2024', warning: false },
    { id: 2, title: 'Aviso de Responsable Sanitario', status: 'Vigente', date: '04/May/2023', warning: false },
    { id: 3, title: 'Manual de Procedimientos Normativos', status: 'Requiere Revisión', date: '---', warning: true },
    { id: 4, title: 'Registro de Protección Civil', status: 'Vigente', date: '11/Ago/2023', warning: false },
  ]);

  const toggleAudit = (id: number) => {
    setAuditChecks(prev => prev.map(c => c.id === id ? { ...c, status: !c.status } : c));
  };

  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc = {
      id: Date.now(),
      title: 'Nuevo Documento Regulatorio',
      status: 'Recién Subido',
      date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      warning: false
    };
    setDocs([newDoc, ...docs]);
    setIsUploading(false);
  };

  const handleAddRisk = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRisk = {
      id: Date.now(),
      date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: formData.get('type') as string,
      desc: formData.get('desc') as string,
      status: 'En revisión',
      severity: formData.get('severity') as string,
    };
    setRisks([newRisk, ...risks]);
    setIsAddingRisk(false);
  };

  const handleAddNorm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newNorm = {
      id: Date.now(),
      norm: formData.get('norm') as string,
      desc: formData.get('desc') as string,
      status: false,
    };
    setAuditChecks([newNorm, ...auditChecks]);
    setIsAddingNorm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Gestión y Normatividad</h2>
        <p className="text-slate-500 text-sm mt-1">
          Panel de control de políticas, seguridad y cumplimiento normativo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'privacy', icon: FileText, title: 'Avisos Privacidad', sub: 'Actualizados y vigentes', tag: 'Al Día', color: 'green', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { id: 'audit', icon: Shield, title: 'Auditoría NORMA', sub: 'Norma Oficial Mexicana', tag: 'Progreso', color: 'blue', bg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
          { id: 'risks', icon: AlertTriangle, title: 'Riesgos & Reportes', sub: 'Incidentes registrados', tag: `${risks.length} Detecciones`, color: 'orange', bg: 'bg-orange-50', iconColor: 'text-orange-600' },
          { id: 'access', icon: Lock, title: 'Accesos y Permisos', sub: 'Control de roles', tag: 'Gestionar', color: 'slate', bg: 'bg-slate-50', iconColor: 'text-slate-600' },
        ].map((card) => (
          <button 
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            className={`p-6 rounded-2xl border text-left transition-all ${
              activeTab === card.id 
                ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100' 
                : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            } flex items-start gap-4`}
          >
            <div className={`p-3 ${card.bg} ${card.iconColor} rounded-xl`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{card.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
              <span className={`inline-flex mt-2 items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold
                ${card.color === 'green' ? 'bg-green-50 text-green-700' : ''}
                ${card.color === 'blue' ? 'bg-blue-50 text-blue-700' : ''}
                ${card.color === 'orange' ? 'bg-orange-50 text-orange-700' : ''}
                ${card.color === 'slate' ? 'bg-slate-100 text-slate-600' : ''}
              `}>
                {card.color === 'green' && <CheckCircle className="w-3 h-3" />}
                {card.tag}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-1">
          <div className="border-b border-slate-100 p-4 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              Documentos Regulatorios
            </h3>
            <button 
              onClick={() => { setActiveTab('docs'); setIsUploading(true); }}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Añadir Nuevo
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {docs.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="font-bold text-sm text-slate-900">{doc.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Última actualización: {doc.date}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${doc.warning ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 min-h-[500px]">
          {isUploading && activeTab === 'docs' ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b-2 border-blue-500 pb-1 inline-flex">
                   <Upload className="w-5 h-5 text-blue-600" />
                   Subir Nuevo Documento
                 </h3>
                 <button onClick={() => setIsUploading(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                   <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>
              <form onSubmit={handleDocUpload} className="flex-1 flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título del Documento</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Aviso de Responsable Sanitario 2026" required />
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-slate-400 mb-4" />
                  <p className="font-bold text-slate-700">Haz clic para seleccionar o arrastra el archivo aquí</p>
                  <p className="text-xs text-slate-500 mt-2">PDF, DOCX, JPG (Máx. 10MB)</p>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsUploading(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> Guardar Documento
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'docs' ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Repositorio Regulatorio</h3>
              <p className="text-slate-500 max-w-md mt-2">
                Selecciona un documento de la lista para ver sus detalles o añade uno nuevo para mantener el cumplimiento normativo al día.
              </p>
              <button 
                onClick={() => setIsUploading(true)}
                className="mt-6 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Subir Documento
              </button>
            </div>
          ) : activeTab === 'privacy' ? (
            <div className="h-full flex flex-col">
               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b-2 border-blue-500 pb-1 inline-flex mb-6">
                 <FileText className="w-5 h-5 text-blue-600" />
                 Gestión de Avisos de Privacidad
               </h3>
               <div className="flex-1 flex flex-col gap-4">
                 <div>
                   <label className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                     Aviso de Privacidad Integral
                     <span className="text-xs font-normal text-slate-500">Última edición: hace 2 días</span>
                   </label>
                   <textarea 
                     className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-sans"
                     value={privacyText}
                     onChange={(e) => setPrivacyText(e.target.value)}
                   />
                 </div>
                 <div className="flex justify-end">
                   <button onClick={() => alert('¡Aviso de privacidad guardado con éxito!')} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2">
                     <Save className="w-4 h-4" /> Guardar Cambios
                   </button>
                 </div>
               </div>
            </div>
          ) : activeTab === 'audit' ? (
             <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b-2 border-blue-500 pb-1 inline-flex">
                   <Shield className="w-5 h-5 text-blue-600" />
                   Lista de Verificación NOM
                 </h3>
                 <div className="flex gap-2">
                   <button className="text-sm font-bold text-blue-600 hover:underline">Reporte PDF</button>
                   {!isAddingNorm && (
                     <button onClick={() => setIsAddingNorm(true)} className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                       <Plus className="w-4 h-4" /> Añadir Norma
                     </button>
                   )}
                 </div>
               </div>
               
               {isAddingNorm ? (
                 <form onSubmit={handleAddNorm} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col gap-4 mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <h4 className="font-bold text-slate-900">Configurar Nueva Norma a Auditar</h4>
                     <button type="button" onClick={() => setIsAddingNorm(false)} className="text-slate-400 hover:text-slate-600">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Clave de Norma</label>
                       <input name="norm" required placeholder="Ej: NOM-XXX-SSA3" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Descripción corta</label>
                       <input name="desc" required placeholder="Motivo o área de la norma" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                     </div>
                   </div>
                   <div className="flex justify-end pt-2">
                     <button type="submit" className="bg-indigo-600 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                       <Save className="w-4 h-4"/> Guardar Norma
                     </button>
                   </div>
                 </form>
               ) : (
                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                   <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
                     <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(auditChecks.filter(c => c.status).length / auditChecks.length) * 100}%` }}></div>
                   </div>
                   <p className="text-sm text-slate-600 font-medium">Cumplimiento actual: {Math.round((auditChecks.filter(c => c.status).length / auditChecks.length) * 100)}%</p>
                 </div>
               )}
               
               <div className="mt-6 flex-1 overflow-y-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-slate-200 text-sm text-slate-500">
                       <th className="pb-3 font-semibold">Norma</th>
                       <th className="pb-3 font-semibold">Descripción</th>
                       <th className="pb-3 font-semibold text-center">Cumplimiento</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {auditChecks.map(check => (
                       <tr key={check.id} className="hover:bg-slate-50">
                         <td className="py-4 font-mono text-xs text-slate-900 font-bold">{check.norm}</td>
                         <td className="py-4 text-sm text-slate-600">{check.desc}</td>
                         <td className="py-4 text-center">
                           <button 
                             onClick={() => toggleAudit(check.id)}
                             className={`w-6 h-6 rounded border flex items-center justify-center mx-auto transition-colors ${check.status ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white text-transparent'}`}
                           >
                             <CheckCircle className="w-4 h-4" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          ) : activeTab === 'risks' ? (
             <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b-2 border-blue-500 pb-1 inline-flex">
                   <AlertTriangle className="w-5 h-5 text-blue-600" />
                   Registro de Incidentes y Riesgos
                 </h3>
                 {!isAddingRisk && (
                   <button onClick={() => setIsAddingRisk(true)} className="text-sm font-bold text-white bg-orange-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors">
                     <Plus className="w-4 h-4" /> Registrar Incidente
                   </button>
                 )}
               </div>
               
               {isAddingRisk && (
                 <form onSubmit={handleAddRisk} className="bg-orange-50/50 p-6 rounded-xl border border-orange-200 flex flex-col gap-4 mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <h4 className="font-bold text-slate-900">Detalles del Nuevo Incidente</h4>
                     <button type="button" onClick={() => setIsAddingRisk(false)} className="text-slate-400 hover:text-slate-600">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                       <select name="type" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                         <option value="Infraestructura">Infraestructura</option>
                         <option value="Sistemas">Sistemas / IT</option>
                         <option value="Pacientes / Operación">Pacientes / Operación</option>
                         <option value="Bioseguridad">Bioseguridad</option>
                         <option value="Otros">Otros</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Severidad Inicial</label>
                       <select name="severity" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                         <option value="Baja">Baja</option>
                         <option value="Media">Media</option>
                         <option value="Alta">Alta</option>
                         <option value="Crítica">Crítica</option>
                       </select>
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-sm font-bold text-slate-700 mb-1">Descripción del suceso</label>
                       <textarea name="desc" required placeholder="Relato descriptivo del incidente que ocurrió..." className="w-full h-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none" />
                     </div>
                   </div>
                   <div className="flex justify-end pt-2">
                     <button type="submit" className="bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
                       <Save className="w-4 h-4"/> Registrar y Notificar
                     </button>
                   </div>
                 </form>
               )}
               
               <div className="flex-1 overflow-y-auto">
                 <div className="space-y-4">
                   {risks.map(risk => (
                     <div key={risk.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${risk.severity === 'Alta' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                             Severidad {risk.severity}
                           </span>
                           <span className="text-xs text-slate-500 font-mono">{risk.date}</span>
                         </div>
                         <h4 className="font-bold text-slate-900">{risk.type}</h4>
                         <p className="text-sm text-slate-600 mt-1">{risk.desc}</p>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${risk.status === 'Resuelto' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                           {risk.status}
                         </span>
                         <div className="flex gap-2">
                           <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          ) : (
            <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b-2 border-blue-500 pb-1 inline-flex">
                   <Lock className="w-5 h-5 text-blue-600" />
                   Control de Accesos
                 </h3>
                 <div className="flex gap-2">
                   <div className="relative">
                     <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                     <input type="text" placeholder="Buscar usuario..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                   </div>
                   <button className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"><Filter className="w-4 h-4" /></button>
                 </div>
               </div>
               <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[500px]">
                   <thead>
                     <tr className="border-b border-slate-200 text-sm text-slate-500">
                       <th className="pb-3 font-semibold">Usuario</th>
                       <th className="pb-3 font-semibold">Email</th>
                       <th className="pb-3 font-semibold">Rol Actual</th>
                       <th className="pb-3 font-semibold text-right">Acción</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {users.map(user => (
                       <tr key={user.id} className="hover:bg-slate-50 group">
                         <td className="py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                               {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                             </div>
                             <span className="font-bold text-sm text-slate-900">{user.name}</span>
                           </div>
                         </td>
                         <td className="py-4 text-sm text-slate-600">{user.email}</td>
                         <td className="py-4">
                           <select defaultValue={user.role} className="text-sm border border-slate-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                             <option value={user.role}>{user.role}</option>
                             <option value="Admin">Admin</option>
                             <option value="Médico">Médico</option>
                             <option value="Recepción">Recepción</option>
                           </select>
                         </td>
                         <td className="py-4 text-right">
                           <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
