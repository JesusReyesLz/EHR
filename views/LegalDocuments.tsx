import React, { useState } from 'react';
import { Briefcase, FileText, Printer, ArrowLeft } from 'lucide-react';
import { DoctorInfo } from '../types';

interface LegalDocumentsProps {
  doctorInfo: DoctorInfo;
}

const PARAGRAPH_CLASS = "text-xs mb-3 text-justify leading-relaxed";
const BOLD_CLASS = "font-bold";
const H3_CLASS = "font-black text-sm uppercase mb-4 mt-6 text-slate-800";

const AvisoPrivacidadIntegral = ({ info }: { info: DoctorInfo }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
      <h1 className="text-2xl font-black uppercase tracking-tight">{info.hospital || info.clinicName || 'CLÍNICA / HOSPITAL'}</h1>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 mt-2">Aviso de Privacidad Integral</h2>
    </div>

    <div className="text-slate-800">
      <p className={PARAGRAPH_CLASS}>En cumplimiento a lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento, <strong>{info.hospital || info.clinicName || 'La Clínica'}</strong>, con domicilio en <strong>{info.address || '[Dirección de la clínica]'}</strong> (en adelante "El Responsable"), informa que es responsable de recabar sus datos personales, del uso que se le dé a los mismos y de su protección.</p>
      
      <h3 className={H3_CLASS}>1. Datos Personales Recabados</h3>
      <p className={PARAGRAPH_CLASS}>El Responsable recabará los siguientes datos personales y datos personales sensibles: nombre completo, fecha de nacimiento, edad, sexo, domicilio, teléfono, correo electrónico, estado civil, ocupación, antecedentes médicos (personales, patológicos y hereditarios), tipo de sangre, resultados de estudios de laboratorio y gabinete, diagnósticos, tratamientos médicos, y cualquier otro dato necesario para la adecuada prestación de servicios médicos.</p>

      <h3 className={H3_CLASS}>2. Finalidad del Tratamiento</h3>
      <p className={PARAGRAPH_CLASS}>Los datos personales recabados serán utilizados para las siguientes finalidades principales y necesarias para el servicio que solicita: Integración, conservación y actualización de su Expediente Clínico Electrónico conforme a la NOM-004-SSA3-2012; Prestación de servicios médicos, quirúrgicos, de diagnóstico y de tratamiento; Cumplimiento de obligaciones legales y requerimientos de autoridades sanitarias; Facturación y cobranza.</p>

      <h3 className={H3_CLASS}>3. Transferencia de Datos</h3>
      <p className={PARAGRAPH_CLASS}>Sus datos personales y sensibles pueden ser transferidos y tratados dentro y fuera del país, por personas distintas al Responsable. En ese sentido, su información puede ser compartida con médicos interconsultantes, laboratorios, clínicas de diagnóstico, hospitales y aseguradoras, siempre con el propósito de brindarle la atención médica solicitada.</p>

      <h3 className={H3_CLASS}>4. Derechos ARCO</h3>
      <p className={PARAGRAPH_CLASS}>Usted tiene derecho de Acceder, Rectificar y Cancelar sus datos personales, así como de Oponerse al tratamiento de los mismos (Derechos ARCO) o revocar el consentimiento que para tal fin nos haya otorgado. Para ejercer estos derechos, puede contactar a nuestro Departamento de Privacidad al correo <strong>{info.email || 'contacto@clinica.com'}</strong> o en el domicilio antes señalado.</p>

      <h3 className={H3_CLASS}>5. Modificaciones al Aviso de Privacidad</h3>
      <p className={PARAGRAPH_CLASS}>Nos reservamos el derecho de efectuar en cualquier momento modificaciones o actualizaciones al presente aviso de privacidad, para la atención de novedades legislativas, políticas internas o nuevos requerimientos para la prestación u ofrecimiento de nuestros servicios. Dichas modificaciones estarán disponibles a través de anuncios visibles en nuestras instalaciones o en nuestra página web.</p>
    </div>

    <div className="mt-16 pt-8 border-t border-slate-300 text-center">
      <div className="w-64 border-b border-slate-800 mx-auto mb-2"></div>
      <p className="text-xs font-bold uppercase">Firma del Titular / Paciente</p>
      <p className="text-[10px] text-slate-500 mt-4">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
    </div>
  </div>
);

const ContratoPrestacionServicios = ({ info }: { info: DoctorInfo }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
      <h1 className="text-2xl font-black uppercase tracking-tight">{info.hospital || info.clinicName || 'CLÍNICA / HOSPITAL'}</h1>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 mt-2">Contrato de Prestación de Servicios Médicos</h2>
    </div>

    <div className="text-slate-800">
      <p className={PARAGRAPH_CLASS}>Que celebran por una parte <strong>{info.hospital || info.clinicName || 'El Establecimiento'}</strong> a quien en lo sucesivo se le denominará "El Prestador", representado por el Médico Tratante <strong>{info.name}</strong> con Cédula Profesional {info.cedula}, y por la otra parte el paciente o su representante legal, a quien en lo sucesivo se le denominará "El Paciente", al tenor de las siguientes cláusulas:</p>
      
      <h3 className={H3_CLASS}>PRIMERA: Objeto</h3>
      <p className={PARAGRAPH_CLASS}>"El Prestador" se obliga a brindar a "El Paciente" los servicios de atención médica, diagnóstico, tratamiento, y en su caso, hospitalización, de acuerdo con los estándares y protocolos médicos vigentes, utilizando para ello los recursos materiales, humanos y tecnológicos disponibles en sus instalaciones.</p>

      <h3 className={H3_CLASS}>SEGUNDA: Consentimiento Informado</h3>
      <p className={PARAGRAPH_CLASS}>"El Paciente" declara haber sido informado de manera clara y comprensible sobre su diagnóstico, pronóstico, tratamiento y los riesgos inherentes al mismo, otorgando su consentimiento de manera libre y voluntaria para la realización de los procedimientos médicos necesarios.</p>

      <h3 className={H3_CLASS}>TERCERA: Honorarios y Formas de Pago</h3>
      <p className={PARAGRAPH_CLASS}>"El Paciente" se obliga a cubrir los honorarios médicos, gastos de hospitalización, estudios de laboratorio y gabinete, medicamentos y demás insumos generados durante su atención, conforme al tabulador vigente de "El Prestador". El pago deberá realizarse en la forma y términos acordados en el área de caja.</p>

      <h3 className={H3_CLASS}>CUARTA: Obligaciones del Paciente</h3>
      <p className={PARAGRAPH_CLASS}>"El Paciente" se compromete a proporcionar información veraz y completa sobre sus antecedentes médicos, seguir puntualmente las indicaciones médicas, tratar con respeto al personal de la salud y cumplir con el reglamento interno de la institución.</p>

      <h3 className={H3_CLASS}>QUINTA: Confidencialidad</h3>
      <p className={PARAGRAPH_CLASS}>Ambas partes guardarán estricta confidencialidad respecto a la información médica y personal derivada de la prestación de estos servicios, rigiéndose la misma por el Aviso de Privacidad de la institución y por la Ley General de Salud, integrándose estrictamente al Expediente Clínico (NOM-004-SSA3-2012).</p>
    </div>

    <div className="grid grid-cols-2 gap-12 mt-20 pt-10 border-t border-slate-300">
      <div className="text-center">
        <div className="w-full border-b border-slate-800 mb-2"></div>
        <p className="text-xs font-bold uppercase">Por "El Prestador"</p>
        <p className="text-[10px] text-slate-500">{info.name}</p>
        <p className="text-[10px] text-slate-500">Cédula: {info.cedula}</p>
      </div>
      <div className="text-center">
        <div className="w-full border-b border-slate-800 mb-2"></div>
        <p className="text-xs font-bold uppercase">Por "El Paciente"</p>
        <p className="text-[10px] text-slate-500">Nombre, Firma o Huella</p>
      </div>
    </div>
  </div>
);

const ConsentimientoInformadoGeneral = ({ info }: { info: DoctorInfo }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
      <h1 className="text-2xl font-black uppercase tracking-tight">{info.hospital || info.clinicName || 'CLÍNICA / HOSPITAL'}</h1>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 mt-2">Carta de Consentimiento Informado General</h2>
      <p className="text-xs text-slate-500 mt-1 uppercase">Para Atención e Ingreso a la Unidad de Atención Médica</p>
    </div>

    <div className="text-slate-800">
      <p className={PARAGRAPH_CLASS}>En la ciudad de <strong>{info.address || '____________________'}</strong>, a {new Date().toLocaleDateString('es-MX')}, yo <strong>___________________________________________________</strong> (Nombre del Paciente), autorizo de manera libre y voluntaria al personal médico, de enfermería y técnico de esta institución, a brindar la atención médica y los cuidados que requiera mi estado de salud.</p>
      
      <p className={PARAGRAPH_CLASS}>Dicha atención médica incluye, pero no se limita a, la exploración física, obtención de muestras de sangre u otros fluidos para análisis clínico, aplicación de medicamentos por cualquier vía, la realización de radiografías, ultrasonidos y cualquier otro estudio de diagnóstico que el médico tratante <strong>{info.name}</strong>, y su equipo médico recomienden para el diagnóstico y tratamiento de mi padecimiento.</p>
      
      <p className={PARAGRAPH_CLASS}>Se me ha explicado claramente cuáles son las opciones de tratamiento, las probabilidades de éxito, los riesgos y complicaciones probables que conlleva mi atención médica (incluyendo los riesgos de la aplicación de medicamentos o el traslado e interconsulta de otros especialistas u hospitales). Comprendo que la práctica de la medicina no es una ciencia exacta y, por lo tanto, no se me pueden dar garantías sobre el resultado de mi tratamiento.</p>

      <p className={PARAGRAPH_CLASS}>Autorizo expresamente la integración, manejo, conservación y almacenamiento de mis datos en mi Expediente Clínico de acuerdo con la NOM-004-SSA3-2012.</p>
    </div>

    <div className="mt-16 pt-8 border-t border-slate-300 text-center">
      <div className="grid grid-cols-2 gap-12 mt-4">
        <div className="text-center">
            <div className="w-full border-b border-slate-800 mb-2"></div>
            <p className="text-xs font-bold uppercase">Nombre y Firma del Paciente / Responsable</p>
        </div>
        <div className="text-center">
            <div className="w-full border-b border-slate-800 mb-2"></div>
            <p className="text-xs font-bold uppercase">Nombre, Firma y Matrícula del Médico Tratante</p>
            <p className="text-[10px] text-slate-500">{info.name} - Cédula: {info.cedula}</p>
        </div>
        <div className="text-center col-span-2">
            <div className="w-64 border-b border-slate-800 mb-2 mx-auto mt-8"></div>
            <p className="text-xs font-bold uppercase">Firma del Testigo</p>
        </div>
      </div>
    </div>
  </div>
);

const AltaVoluntaria = ({ info }: { info: DoctorInfo }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
      <h1 className="text-2xl font-black uppercase tracking-tight">{info.hospital || info.clinicName || 'CLÍNICA / HOSPITAL'}</h1>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 mt-2">Documento de Alta Voluntaria</h2>
      <p className="text-xs text-slate-500 mt-1 uppercase">(Egreso contra indicación médica)</p>
    </div>

    <div className="text-slate-800">
      <p className={PARAGRAPH_CLASS}>Por este conducto, yo <strong>___________________________________________________</strong> (Paciente o Responsable legal), exijo el alta médica / egreso de las instalaciones de <strong>{info.hospital || info.clinicName || 'La Clínica'}</strong> del paciente <strong>___________________________________________________</strong> a mi propio riesgo y responsabilidad.</p>
      
      <p className={PARAGRAPH_CLASS}>Hago constar que el médico tratante <strong>{info.name}</strong>, y el equipo médico de esta institución, me han explicado detalladamente mi estado de salud o el del paciente, el diagnóstico, y me han advertido clara y expresamente sobre la necesidad de continuar hospitalizado(a) o bajo tratamiento médico. Me han sido explicados también los graves riesgos, daños y consecuencias que podrían derivarse al abandonar las instalaciones y suspender o no iniciar el tratamiento médico, las cuales incluyen complicaciones serias que pueden poner en riesgo la integridad física o incluso resultar en la muerte.</p>

      <p className={PARAGRAPH_CLASS}>A pesar de la información médica recibida, persisto en mi decisión de solicitar el Egreso Voluntario y eximo absoluta e irrevocablemente de toda responsabilidad presente y civil, médica, penal o laboral al médico tratante, personal de enfermería y a la institución <strong>{info.hospital || info.clinicName || 'La Clínica'}</strong>.</p>
    </div>

    <div className="mt-16 pt-8 border-t border-slate-300">
      <div className="grid grid-cols-2 gap-12 mt-4">
        <div className="text-center">
            <div className="w-full border-b border-slate-800 mb-2"></div>
            <p className="text-xs font-bold uppercase">Firma del Paciente o Familiar Responsable</p>
            <p className="text-[10px] text-slate-500">Nombre y Parentesco</p>
        </div>
        <div className="text-center">
            <div className="w-full border-b border-slate-800 mb-2"></div>
            <p className="text-xs font-bold uppercase">Firme del Médico que Autoriza</p>
            <p className="text-[10px] text-slate-500">{info.name}</p>
        </div>
        <div className="text-center">
            <div className="w-full border-b border-slate-800 mb-2 mt-8"></div>
            <p className="text-xs font-bold uppercase">Testigo 1</p>
        </div>
        <div className="text-center">
            <div className="w-full border-b border-slate-800 mb-2 mt-8"></div>
            <p className="text-xs font-bold uppercase">Testigo 2</p>
        </div>
      </div>
    </div>
  </div>
);

const PagareMedico = ({ info }: { info: DoctorInfo }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">Pagaré / Reconocimiento de Adeudo</h1>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Convenio de Pago por Servicios Médicos</p>
    </div>

    <div className="text-slate-800 leading-relaxed text-justify mb-8">
        <div className="flex justify-between font-bold text-sm mb-6">
            <p><strong>BUENO POR:</strong> $_________________ MN</p>
            <p><strong>LUGAR Y FECHA:</strong> {info.address || '_________________'}, a {new Date().toLocaleDateString('es-MX')}</p>
        </div>
      <p className={PARAGRAPH_CLASS}>Debo(emos) y pagaré(emos) incondicionalmente por este Pagaré a la orden de <strong>{info.hospital || info.clinicName || info.name}</strong>, en su establecimiento en la fecha ____________________________, la cantidad principal de: $_________________ (cantidad con letra: ____________________________________________________________________), por concepto de servicios médicos, tratamientos, honorarios o medicamentos brindados a entera satisfacción de manera parcial o total según nota de cargo/factura nro ____________.</p>
      
      <p className={PARAGRAPH_CLASS}>En caso de falta de pago oportuno, a partir de la fecha de vencimiento este importe causará intereses moratorios a razón del ______% (____ por ciento) mensual. Este documento mercantil está regido por la Ley General de Títulos y Operaciones de Crédito. La falta de pago autoriza al beneficiario para exigir mediante procedimiento ejecutivo mercantil la cantidad antes mencionada.</p>
    </div>

    <div className="mt-16 border border-slate-400 p-6 rounded bg-slate-50/50">
        <h3 className="text-sm font-black mb-4">DATOS DEL SUSCRIPTOR (DEUDOR PRINCIPAL)</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
            <div><p><strong>Nombre:</strong> ____________________________________</p></div>
            <div><p><strong>Identificación (INE):</strong> ______________________</p></div>
            <div className="col-span-2"><p><strong>Domicilio Completo:</strong> __________________________________________________________________________</p></div>
            <div><p><strong>Teléfono:</strong> _________________________</p></div>
        </div>
        
        <div className="w-64 border-b border-slate-800 mx-auto mb-2 mt-16 text-center"></div>
        <p className="text-xs font-bold uppercase text-center">Firma del Suscriptor</p>
    </div>
  </div>
);

const AvisoPrivacidadEmpleados = ({ info }: { info: DoctorInfo }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
      <h1 className="text-2xl font-black uppercase tracking-tight">{info.hospital || info.clinicName || 'CLÍNICA / HOSPITAL'}</h1>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 mt-2">Aviso de Privacidad para Empleados y Personal Médico</h2>
    </div>

    <div className="text-slate-800">
      <p className={PARAGRAPH_CLASS}>En cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, <strong>{info.hospital || info.clinicName || 'La empresa/Clínica'}</strong> (en adelante "El Responsable"), informa a sus empleados, trabajadores, médicos, enfermeras y prestadores de servicios profesionales sobre el tratamiento de sus datos personales.</p>
      
      <h3 className={H3_CLASS}>1. Finalidad del Tratamiento</h3>
      <p className={PARAGRAPH_CLASS}>Sus datos personales, incluyendo datos sensibles (estado de salud, cuentas bancarias, etc.), serán utilizados para: Selección, reclutamiento y contratación; Integración de su expediente laboral; Elaboración y pago de nóminas, comisiones u honorarios; Cumplimiento de obligaciones fiscales y de seguridad social (IMSS, INFONAVIT, SAT); Capacitación; Prestación de beneficios adicionales; y contacto institucional.</p>

      <h3 className={H3_CLASS}>2. Transferencias de Datos</h3>
      <p className={PARAGRAPH_CLASS}>Le informamos que sus datos personales no serán transferidos ni tratados por personas distintas al Responsable y su personal de Recursos Humanos o Contabilidad, salvo requerimiento de autoridades competentes (SAT, Secretaría del Trabajo, IMSS, etc.).</p>

      <h3 className={H3_CLASS}>3. Derechos ARCO</h3>
      <p className={PARAGRAPH_CLASS}>Usted tiene derecho de acceder, rectificar y cancelar sus datos personales, así como de oponerse al tratamiento de los mismos. Para ejercer sus derechos ARCO, deberá enviar una solicitud por escrito al departamento de Recursos Humanos o al correo electrónico {info.email || 'rh@clinica.com'}.</p>
    </div>

    <div className="mt-16 pt-8 border-t border-slate-300 text-center">
      <div className="w-64 border-b border-slate-800 mx-auto mb-2"></div>
      <p className="text-xs font-bold uppercase">Nombre y Firma de Conformidad</p>
      <p className="text-[10px] text-slate-500 mt-4">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
    </div>
  </div>
);


const LegalDocuments: React.FC<LegalDocumentsProps> = ({ doctorInfo }) => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const documents = [
    { id: 'aviso_integral', title: 'Aviso de Privacidad (Integral)', desc: 'Documento completo obligatorio para pacientes de primera vez.' },
    { id: 'aviso_corto', title: 'Aviso de Privacidad (Corto)', desc: 'Para incorporar al pie de firmas de correo electrónico o en mostrador.' },
    { id: 'contrato_medico', title: 'Contrato de Servicios Médicos', desc: 'Acuerdo vinculante entre el paciente y la institución.' },
    { id: 'consentimiento_general', title: 'Consentimiento Informado General', desc: 'Autorización general para atención e ingreso a la unidad médica.' },
    { id: 'alta_voluntaria', title: 'Alta Voluntaria', desc: 'Formato de egreso bajo responsabilidad del paciente contra indicación.' },
    { id: 'pagare', title: 'Pagaré Médico / Carta de Adeudo', desc: 'Título de crédito para garantizar pagos pendientes de honorarios/hospital.' },
    { id: 'contrato_laboral', title: 'Contrato de Colaboración / Laboral', desc: 'Plantilla de convenio de asociación médica y honorarios.' },
    { id: 'aviso_empleados', title: 'Aviso de Privacidad (Personal)', desc: 'Formatos sobre el uso de datos para empleados y red médica.' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const renderSelectedDoc = () => {
    switch (selectedDoc) {
      case 'aviso_integral': return <AvisoPrivacidadIntegral info={doctorInfo} />;
      case 'contrato_medico': return <ContratoPrestacionServicios info={doctorInfo} />;
      case 'consentimiento_general': return <ConsentimientoInformadoGeneral info={doctorInfo} />;
      case 'alta_voluntaria': return <AltaVoluntaria info={doctorInfo} />;
      case 'pagare': return <PagareMedico info={doctorInfo} />;
      case 'aviso_empleados': return <AvisoPrivacidadEmpleados info={doctorInfo} />;
      case 'aviso_corto':
        return (
          <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
            <h1 className="text-xl font-black mb-4">Aviso de Privacidad (Resumido / Corto)</h1>
            <p className="text-sm text-justify"><strong>{doctorInfo.hospital || doctorInfo.clinicName || 'La Clínica'}</strong>, con domicilio en <strong>{doctorInfo.address || '[Dirección]'}</strong>, utilizará sus datos personales aquí recabados para la integración de su expediente clínico y la prestación de servicios médicos. Para mayor información sobre el tratamiento y los derechos ARCO que puede hacer valer, usted puede solicitar el aviso de privacidad integral en la recepción o solicitarlo vía correo electrónico a {doctorInfo.email}.</p>
          </div>
        );
      case 'contrato_laboral':
         return (
          <div className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-slate-200" id="print-area">
            <h1 className="text-2xl font-black text-center mb-8 uppercase">Contrato de Prestación de Servicios Profesionales Independientes</h1>
            <p className="text-xs text-justify mb-4">Que celebran por una parte <strong>{doctorInfo.hospital || 'CLÍNICA'}</strong>, en lo sucesivo "La Clínica", y por la otra el Médico Colegiado __________________________, en lo sucesivo "El Médico", quienes se sujetan a los términos pactados donde El Médico prestará sus servicios de consulta externa de manera independiente bajo el modelo de honorarios profesionales asimilables o participación por cuota, deslindando toda relación obrero-patronal tradicional.</p>
            <p className="text-xs text-justify mb-4">Ambas partes acuerdan la confidencialidad de la cartera de pacientes administrada mediante MedExpediente MX, así como el estricto apego a las Normas Oficiales Mexicanas relativas a la salud, expedientes y guías de práctica clínica.</p>
            {/* Template simplificado */}
          </div>
         );
      default: return null;
    }
  };

  if (selectedDoc) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8 no-print">
          <button onClick={() => setSelectedDoc(null)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
            <ArrowLeft size={16} /> Volver al catálogo
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-colors">
            <Printer size={16} /> Imprimir Documento
          </button>
        </div>

        {renderSelectedDoc()}

        <style>{`
          @media print {
            body { background: white !important; margin: 0 !important; }
            .no-print { display: none !important; }
            #main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in py-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
          <Briefcase className="text-blue-600 w-10 h-10" /> Documentos Legales Generales
        </h1>
        <p className="text-slate-500 font-medium mt-2">Formatos obligatorios adaptados con la información de tu Clínica/Establecimiento y tu Identidad Médica.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map(doc => (
          <div key={doc.id} onClick={() => setSelectedDoc(doc.id)} className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{doc.title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{doc.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegalDocuments;
