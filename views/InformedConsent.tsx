
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Users, AlertTriangle, CheckCircle2,
  Lock, PenTool, Info, Search, AlertOctagon, MapPin,
  BookOpen, FileSignature, Stethoscope, Activity,
  ClipboardList, ChevronDown, Check, X, Gavel, UserCheck,
  ThumbsUp, ThumbsDown, Filter
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../types';

interface InformedConsentProps {
  patients: Patient[];
  notes: ClinicalNote[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

// --- BASE DE DATOS DE PLANTILLAS DE PROCEDIMIENTOS (EXPANDIDA Y DETALLADA) ---
interface ProcedureTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  indications: string;
  contraindications: string;
  risks: string;
  benefits: string;
  care: string;
}

const PROCEDURE_TEMPLATES: ProcedureTemplate[] = [
  // --- ADMINISTRATIVO / LEGAL ---
  {
    id: 'ADM-EXP',
    category: 'Legal / Administrativo',
    name: 'APERTURA DE EXPEDIENTE E INGRESO A CONTROL',
    description: 'Proceso médico-administrativo que formaliza la relación médico-paciente. Implica la recopilación detallada de datos personales, antecedentes heredo-familiares, patológicos y no patológicos, así como la realización de una exploración física completa para integrar la Historia Clínica conforme a la NOM-004-SSA3-2012.',
    indications: 'Todo paciente que solicita atención médica por primera vez o reingreso tras un periodo prolongado, para establecer un diagnóstico basal y plan de manejo.',
    contraindications: 'Negativa del paciente a proporcionar información veraz o firmar el aviso de privacidad.',
    risks: 'Riesgo mínimo. Posible incomodidad por preguntas sensibles necesarias para el diagnóstico. Brecha de confidencialidad informática (mitigada por secreto profesional y sistemas seguros).',
    benefits: 'Atención médica personalizada, diagnóstico certero, detección temprana de factores de riesgo y cumplimiento normativo legal para la protección del paciente.',
    care: 'Proporcionar información veraz y completa. Notificar cambios en datos de contacto o estado de salud.'
  },
  {
    id: 'ALTA-VOL',
    category: 'Legal / Administrativo',
    name: 'ALTA VOLUNTARIA',
    description: 'Acto mediante el cual el paciente (o su representante legal) decide finalizar la atención médica y abandonar las instalaciones en contra de la recomendación explícita del médico tratante, asumiendo la total responsabilidad de las consecuencias.',
    indications: 'Deseo expreso del paciente de interrumpir el tratamiento o trasladarse por sus propios medios a otra unidad.',
    contraindications: 'Pacientes con alteración del estado de conciencia, menores sin tutor, o urgencias psiquiátricas con riesgo inminente de auto/heteroagresión o enfermedades de salud pública cuarentenables.',
    risks: 'Agravamiento severo de la enfermedad, complicaciones irreversibles, pérdida de la oportunidad terapéutica, progresión de infecciones/hemorragias, discapacidad permanente y muerte.',
    benefits: 'Respeto al principio bioético de autonomía del paciente y su derecho a la libre elección.',
    care: 'Acudir inmediatamente a otro servicio médico. Se entregan recomendaciones por escrito sobre signos de alarma.'
  },
  {
    id: 'RECHAZO-TX',
    category: 'Legal / Administrativo',
    name: 'RECHAZO TERAPÉUTICO',
    description: 'Documento donde el paciente acepta la atención general pero rechaza una intervención específica (ej. transfusión, cirugía, intubación, amputación) tras haber sido informado ampliamente de su necesidad crítica.',
    indications: 'Discrepancia entre la indicación médica y los valores, creencias religiosas o preferencias personales del paciente competente.',
    contraindications: 'Incapacidad mental temporal o permanente para tomar decisiones sin un representante legal disponible en urgencia calificada.',
    risks: 'Fallo en el tratamiento de soporte, progresión de la patología, daño orgánico irreversible, choque, sepsis y fallecimiento.',
    benefits: 'Respeto a la integridad moral, religiosa y autonomía del paciente.',
    care: 'Vigilancia continua y reevaluación periódica de la decisión.'
  },

  // --- ENFERMERÍA Y RUTINA ---
  {
    id: 'VENO-PUNC',
    category: 'Enfermería',
    name: 'VENOPUNCIÓN Y TOMA DE MUESTRAS',
    description: 'Inserción de una aguja estéril en una vena periférica para la extracción de sangre con fines diagnósticos. Procedimiento invasivo rutinario realizado bajo técnica aséptica.',
    indications: 'Necesidad de análisis de laboratorio (biometría, química, tiempos de coagulación) para diagnóstico o monitoreo.',
    contraindications: 'Infección/Celulitis en el sitio de punción, fístula arteriovenosa en la extremidad, linfedema ipsilateral, trombosis venosa profunda en el sitio.',
    risks: 'Hematoma (moretón), dolor local, flebitis, síncope vasovagal (desmayo), lesión nerviosa periférica (hormigueo transitorio), sangrado persistente en pacientes anticoagulados.',
    benefits: 'Obtención de información vital sobre el estado hematológico, metabólico e infeccioso para guiar el tratamiento.',
    care: 'Presión firme en el sitio por 3-5 minutos sin doblar el brazo. Vigilar aumento de volumen o dolor intenso.'
  },
  {
    id: 'IM-INJ',
    category: 'Enfermería',
    name: 'APLICACIÓN DE INYECCIÓN INTRAMUSCULAR',
    description: 'Introducción de una sustancia medicamentosa en el tejido muscular profundo (glúteo, deltoides) mediante aguja y jeringa estéril para su absorción sistémica.',
    indications: 'Administración de vacunas, analgésicos, antibióticos o antiinflamatorios cuando la vía oral no es adecuada o se requiere efecto más rápido.',
    contraindications: 'Coagulopatía severa, tratamiento anticoagulante, infección en el sitio, alergia al fármaco, masa muscular insuficiente.',
    risks: 'Dolor, induración, eritema, absceso estéril o séptico, hematoma, lesión del nervio ciático (dolor neuropático), reacción anafiláctica.',
    benefits: 'Absorción rápida y eficaz del medicamento, efecto terapéutico sistémico.',
    care: 'No masajear enérgicamente. Vigilar reacciones alérgicas (ronchas, falta de aire) en los 30 min posteriores.'
  },
  {
    id: 'VENOCLISIS',
    category: 'Enfermería',
    name: 'INSTALACIÓN DE VENOCLISIS (ACCESO VENOSO PERIFÉRICO)',
    description: 'Cateterización de una vena periférica mediante un punzocatéter flexible para la administración continua de fluidos y fármacos directo al torrente sanguíneo.',
    indications: 'Reposición de líquidos, administración de medicamentos IV, transfusiones, manejo de urgencias.',
    contraindications: 'Venas esclerosadas, quemaduras o infección en el sitio, extremidad con fístula AV o vaciamiento ganglionar.',
    risks: 'Infiltración (líquido fuera de vena), flebitis (inflamación), infección del sitio, hematoma, embolismo aéreo (raro), sobrecarga de volumen.',
    benefits: 'Acceso inmediato para tratamiento rápido y efectivo. Vía permeable para emergencias.',
    care: 'Mantener seco el vendaje. No manipular el equipo. Avisar si hay dolor, ardor o hinchazón inmediato.'
  },
  {
    id: 'MEDS-IV',
    category: 'Enfermería',
    name: 'ADMINISTRACIÓN DE MEDICAMENTOS INTRAVENOSOS',
    description: 'Introducción directa de fármacos al torrente sanguíneo a través de un acceso venoso establecido.',
    indications: 'Tratamiento de infecciones graves, dolor severo, deshidratación, control hemodinámico.',
    contraindications: 'Alergia conocida al fármaco, incompatibilidad con otros medicamentos, acceso venoso no funcional.',
    risks: 'Reacción anafiláctica inmediata (choque alérgico), flebitis química, hipotensión, taquicardia, efectos adversos específicos del fármaco.',
    benefits: 'Efecto terapéutico inmediato (biodisponibilidad del 100%).',
    care: 'Reportar inmediatamente sensación de calor, picazón, falta de aire o mareo durante la administración.'
  },
  {
    id: 'NEBULIZACION',
    category: 'Enfermería',
    name: 'NEBULIZACIÓN / MICRONEBULIZACIÓN',
    description: 'Administración de fármacos en forma de aerosol fino para inhalación directa a las vías respiratorias.',
    indications: 'Broncoespasmo, asma, EPOC, laringotraqueítis, manejo de secreciones espesas.',
    contraindications: 'Hipersensibilidad al fármaco. Precaución en taquicardia severa (si se usan beta-agonistas).',
    risks: 'Taquicardia, temblor fino distal, resequedad de mucosas, broncoespasmo paradójico, irritación ocular.',
    benefits: 'Alivio rápido de la dificultad respiratoria, fluidificación de secreciones.',
    care: 'Enjuague bucal posterior. Mantener posición sentada durante el procedimiento.'
  },

  // --- PROCEDIMIENTOS INVASIVOS DE ENFERMERÍA ---
  {
    id: 'SONDA-NG',
    category: 'Procedimiento Invasivo',
    name: 'COLOCACIÓN DE SONDA NASOGÁSTRICA',
    description: 'Introducción de un tubo flexible a través de la fosa nasal hasta el estómago con fines diagnósticos o terapéuticos.',
    indications: 'Descompresión gástrica (íleo, obstrucción), lavado gástrico, nutrición enteral, administración de carbón activado.',
    contraindications: 'Fractura de base de cráneo, trauma facial severo, varices esofágicas con riesgo de sangrado, cirugía gástrica reciente, coagulopatía.',
    risks: 'Epistaxis (sangrado nasal), colocación en vía aérea (neumonía), perforación esofágica, náuseas, vómito, sinusitis.',
    benefits: 'Alivio de la distensión abdominal, prevención de broncoaspiración, vía de alimentación segura.',
    care: 'Mantener la sonda fijada. Posición semi-fowler (30-45°). No retirar sin indicación.'
  },
  {
    id: 'LAVADO-GASTRICO',
    category: 'Urgencias',
    name: 'LAVADO GÁSTRICO',
    description: 'Procedimiento de urgencia que consiste en la instilación y aspiración secuencial de líquidos a través de una sonda gástrica para evacuar tóxicos.',
    indications: 'Ingesta reciente (<1-2h) de tóxicos o fármacos en dosis letales.',
    contraindications: 'Ingesta de cáusticos (ácidos/álcalis), hidrocarburos, vía aérea no protegida en paciente inconsciente, riesgo de perforación.',
    risks: 'Broncoaspiración (neumonitis química), laringoespasmo, perforación esofágica/gástrica, desequilibrio hidroelectrolítico, hipotermia.',
    benefits: 'Disminución de la absorción del tóxico, salvamento de vida.',
    care: 'Vigilancia estrecha respiratoria y neurológica. Monitoreo cardiaco.'
  },
  {
    id: 'SONDA-VES',
    category: 'Procedimiento Invasivo',
    name: 'COLOCACIÓN DE SONDA VESICAL (FOLEY)',
    description: 'Inserción de una sonda estéril a través de la uretra hasta la vejiga para el drenaje continuo de orina.',
    indications: 'Retención urinaria aguda, control estricto de líquidos, cirugía urológica/pélvica, incontinencia con heridas sacras.',
    contraindications: 'Sospecha de trauma uretral (sangre en meato), estenosis uretral severa, prostatitis aguda severa.',
    risks: 'Infección de vías urinarias (asociada a catéter), trauma uretral (falsa vía, sangrado), espasmos vesicales, parafimosis.',
    benefits: 'Alivio inmediato de la retención, monitoreo preciso de la función renal.',
    care: 'Mantener bolsa colectora por debajo del nivel de la vejiga. Higiene diaria del meato.'
  },
  {
    id: 'ASPIRACION',
    category: 'Enfermería',
    name: 'ASPIRACIÓN DE SECRECIONES',
    description: 'Extracción mecánica de secreciones de la vía aérea (oral, nasal o traqueal) mediante una sonda de succión.',
    indications: 'Incapacidad para toser o movilizar secreciones, paciente intubado o con traqueostomía, acúmulo de secreciones.',
    contraindications: 'Epiglotitis, laringoespasmo, trastornos hemorrágicos severos (relativa).',
    risks: 'Hipoxia, arritmias, trauma de mucosa, sangrado, broncoespasmo, aumento de presión intracraneal.',
    benefits: 'Mantenimiento de la vía aérea permeable, mejora de la oxigenación.',
    care: 'Oxigenación previa. Técnica estéril.'
  },

  // --- HERIDAS Y CIRUGÍA MENOR ---
  {
    id: 'CURACION',
    category: 'Cirugía Menor',
    name: 'CURACIÓN DE HERIDAS',
    description: 'Procedimiento de limpieza, desinfección y protección de una herida para favorecer su cicatrización y prevenir infección.',
    indications: 'Heridas quirúrgicas, traumáticas, úlceras por presión o vasculares, quemaduras leves.',
    contraindications: 'Ninguna absoluta. Precaución en heridas que requieren desbridamiento quirúrgico mayor.',
    risks: 'Dolor durante el procedimiento, sangrado leve, reacción a antisépticos.',
    benefits: 'Prevención de infecciones, promoción de tejido de granulación, cierre de la herida.',
    care: 'Mantener el apósito limpio y seco. No mojar. Acudir a citas de revisión.'
  },
  {
    id: 'SUTURA',
    category: 'Cirugía Menor',
    name: 'SUTURA DE HERIDAS / REMODELADO',
    description: 'Afrontamiento de los bordes de una herida mediante material de sutura estéril, previa asepsia y anestesia local, para cierre primario.',
    indications: 'Heridas cortantes profundas recientes (<6-8h) que afectan dermis.',
    contraindications: 'Heridas con alto riesgo de infección (mordeduras tardías), pérdida extensa de tejido, heridas muy contaminadas.',
    risks: 'Infección, dehiscencia (apertura), cicatrización hipertrófica/queloide, necrosis de bordes, lesión nerviosa/tendinosa subyacente.',
    benefits: 'Restauración de la integridad cutánea, hemostasia, mejor resultado estético y funcional.',
    care: 'Mantener limpia y seca. Aseo diario con agua y jabón neutro sin tallar. Retiro de puntos en 7-14 días.'
  },
  {
    id: 'RETIRO-PUNTOS',
    category: 'Cirugía Menor',
    name: 'RETIRO DE PUNTOS DE SUTURA',
    description: 'Extracción del material de sutura una vez que la herida ha cicatrizado lo suficiente para mantenerse unida.',
    indications: 'Heridas suturadas con tiempo de cicatrización cumplido (cara 5-7 días, cuerpo 7-14 días).',
    contraindications: 'Herida con dehiscencia, infección activa o cicatrización incompleta.',
    risks: 'Apertura de la herida (dehiscencia), infección, dolor leve.',
    benefits: 'Prevención de marcas de sutura, cuerpo extraño o infección por hilo.',
    care: 'Protección solar de la cicatriz. Hidratación de la piel.'
  },
  {
    id: 'DESBRID-HERIDA',
    category: 'Cirugía Menor',
    name: 'DESBRIDACIÓN DE HERIDAS CONTUSO CORTANTES',
    description: 'Eliminación de tejido desvitalizado, necrótico o cuerpos extraños de una herida para permitir su cierre o cicatrización.',
    indications: 'Heridas con bordes irregulares, macerados o necróticos; presencia de suciedad o cuerpos extraños.',
    contraindications: 'Necesidad de desbridamiento extenso en quirófano, compromiso vascular severo.',
    risks: 'Sangrado, dolor, infección, necesidad de ampliación de la herida.',
    benefits: 'Reducción de carga bacteriana, conversión a herida limpia para cierre, mejor cicatrización.',
    care: 'Manejo como herida suturada o abierta según el caso. Antibióticos si se indican.'
  },
  {
    id: 'DESBRID-QUEM',
    category: 'Cirugía Menor',
    name: 'DESBRIDAMIENTO DE QUEMADURAS',
    description: 'Retiro de flictenas (ampollas) rotas y tejido quemado superficial, limpieza con antisépticos y colocación de apósitos.',
    indications: 'Quemaduras de segundo grado superficial o profundo con ampollas o tejido desvitalizado.',
    contraindications: 'Quemaduras extensas (>10% SCT) o de tercer grado que requieren manejo en unidad de quemados.',
    risks: 'Dolor intenso, sangrado, infección, profundización de la lesión si hay infección.',
    benefits: 'Prevención de infección, preparación del lecho para epitelización.',
    care: 'Control del dolor, hidratación, movilización temprana para evitar retracciones.'
  },
  {
    id: 'DRENAJE-ABSCESO',
    category: 'Cirugía Menor',
    name: 'DRENAJE DE ABSCESO DE TEJIDOS BLANDOS',
    description: 'Incisión quirúrgica de una colección purulenta para evacuar el contenido, lavar la cavidad y permitir drenaje continuo.',
    indications: 'Abscesos cutáneos fluctuantes no resueltos con antibióticos.',
    contraindications: 'Celulitis difusa sin colección, abscesos en "triángulo de la muerte" facial (manejo especializado).',
    risks: 'Dolor, sangrado, bacteriemia transitoria, recurrencia, fístula, cicatriz.',
    benefits: 'Alivio inmediato del dolor y presión, resolución de la infección.',
    care: 'Curaciones diarias para mantener herida abierta y drenando. Completar antibiótico.'
  },
  {
    id: 'DRENAJE-HEMATOMA',
    category: 'Cirugía Menor',
    name: 'DRENAJE DE HEMATOMA SUBUNGUEAL',
    description: 'Perforación de la uña (fenestración) para evacuar sangre acumulada bajo presión tras un traumatismo.',
    indications: 'Hematoma subungueal agudo doloroso que ocupa >25% de la uña, con uña intacta.',
    contraindications: 'Hematoma no doloroso, fractura de falange distal expuesta (requiere otro manejo), uña rota.',
    risks: 'Infección (onixis), pérdida de la uña, deformidad ungueal futura.',
    benefits: 'Alivio inmediato del dolor pulsátil y preservación de la uña.',
    care: 'Mantener limpio y seco. Vigilar signos de infección.'
  },
  {
    id: 'EXTRA-CE',
    category: 'Urgencias',
    name: 'EXTRACCIÓN DE OBJETO EXTRAÑO',
    description: 'Remoción instrumental de cuerpos extraños alojados en tejidos blandos, oído, nariz o piel.',
    indications: 'Presencia de cuerpo extraño causando dolor, infección o disfunción.',
    contraindications: 'Objetos profundos cerca de vasos/nervios vitales (quirófano). En oído: insectos vivos (matar primero).',
    risks: 'Sangrado, infección, daño a estructuras vecinas, migración del objeto.',
    benefits: 'Resolución del problema, prevención de infección y granulomas.',
    care: 'Vigilancia de infección. Aseo de la zona.'
  },
  {
    id: 'MATRICECTOMIA',
    category: 'Cirugía Menor',
    name: 'MATRICECTOMÍA (UÑA ENCARNADA)',
    description: 'Resección parcial o total de la lámina ungueal y destrucción química/quirúrgica de la matriz para evitar recrecimiento.',
    indications: 'Onicocriptosis recurrente, infección crónica, dolor incapacitante.',
    contraindications: 'Insuficiencia arterial severa (pie isquémico), infección aguda extensa (celulitis).',
    risks: 'Dolor postoperatorio, infección, sangrado, recidiva (recrecimiento de espícula), deformidad estética.',
    benefits: 'Cura definitiva del dolor e infección recurrente.',
    care: 'Pie elevado 24h. Analgesia. Calzado abierto. Curaciones diarias.'
  },
  {
    id: 'EXTRA-UÑA',
    category: 'Cirugía Menor',
    name: 'RETIRO O EXTRACCIÓN DE UÑA (AVULSIÓN)',
    description: 'Extracción completa de la lámina ungueal bajo bloqueo anestésico digital.',
    indications: 'Traumatismo severo con avulsión parcial, infección micótica severa (previa a tratamiento), hematoma extenso.',
    contraindications: 'Coagulopatía, isquemia digital severa.',
    risks: 'Dolor, sangrado, infección del lecho, daño a la matriz (deformidad futura).',
    benefits: 'Alivio del dolor, limpieza del lecho ungueal.',
    care: 'Vendaje compresivo 24h. Limpieza diaria.'
  },
  {
    id: 'BIOPSIA',
    category: 'Dermatología',
    name: 'BIOPSIA DE PIEL O TEJIDOS',
    description: 'Toma de una muestra de tejido (punch, incisional, escisional) para estudio histopatológico.',
    indications: 'Lesiones sospechosas de malignidad, dermatosis de difícil diagnóstico, confirmación diagnóstica.',
    contraindications: 'Infección activa en el sitio (si no es el objetivo), coagulopatía.',
    risks: 'Sangrado, infección, cicatriz, dehiscencia, diagnóstico no concluyente.',
    benefits: 'Diagnóstico definitivo para normar conducta terapéutica.',
    care: 'Cuidado de herida. Retiro de puntos si aplica. Esperar resultado patología.'
  },
  {
    id: 'CAUTERIZACION',
    category: 'Dermatología',
    name: 'CAUTERIZACIÓN O ELECTROFULGURACIÓN',
    description: 'Destrucción de tejido patológico mediante calor (electrocauterio) o químicos.',
    indications: 'Verrugas vulgares, condilomas, queratosis seborreicas, fibromas blandos (acrocordones), hemostasia.',
    contraindications: 'Lesiones sospechosas de melanoma (requieren biopsia completa), marcapasos (para electrocauterio monopolar).',
    risks: 'Dolor, quemadura de tejido sano, cicatriz hipo/hipertrófica, hipo/hiperpigmentación, infección, recidiva.',
    benefits: 'Eliminación estética y funcional de lesiones benignas.',
    care: 'Protección solar estricta. Uso de cremas reparadoras. No arrancar costras.'
  },
  {
    id: 'QUISTE-SEB',
    category: 'Cirugía Menor',
    name: 'INCISIÓN Y DRENAJE / EXTIRPACIÓN DE QUISTE SEBÁCEO',
    description: 'Procedimiento para retirar un quiste epidérmico y su cápsula.',
    indications: 'Quistes dolorosos, infectados o estéticamente molestos.',
    contraindications: 'Infección aguda (se prefiere drenaje inicial y diferir cápsula).',
    risks: 'Infección, sangrado, hematoma, recurrencia (si queda cápsula), cicatriz.',
    benefits: 'Eliminación de la masa y prevención de inflamación recurrente.',
    care: 'Vigilancia de la herida, retiro de puntos.'
  },
  {
    id: 'INFILTRACION',
    category: 'Traumatología',
    name: 'INFILTRACIÓN ARTICULAR O DE TEJIDOS BLANDOS',
    description: 'Inyección de medicamentos (corticoides, anestésicos, visco-suplementos) en una articulación o tejido periarticular.',
    indications: 'Osteoartrosis, bursitis, tendinitis, epicondilitis, fascitis plantar.',
    contraindications: 'Infección sistémica o en el sitio de punción, fractura intraarticular, inestabilidad articular, coagulopatía.',
    risks: 'Infección (artritis séptica - grave), dolor post-inyección (flare), despigmentación o atrofia cutánea, ruptura tendinosa, reacción vagal.',
    benefits: 'Alivio rápido del dolor e inflamación, mejoría de la movilidad.',
    care: 'Reposo relativo de la articulación 24-48h. Hielo local. Vigilar fiebre o enrojecimiento.'
  },

  // --- OFTALMOLOGÍA Y OTORRINO ---
  {
    id: 'LAVADO-OFT',
    category: 'Procedimientos',
    name: 'LAVADO OFTÁLMICO Y RETIRO DE REBABAS',
    description: 'Irrigación ocular profusa o extracción mecánica de cuerpos extraños superficiales (rebabas) de la córnea/conjuntiva.',
    indications: 'Salpicadura de químicos, presencia de cuerpos extraños superficiales, conjuntivitis purulenta abundante.',
    contraindications: 'Trauma ocular penetrante o perforante (globo abierto) - REQUIERE OFTALMÓLOGO URGENTE.',
    risks: 'Abrasión corneal residual, infección, úlcera corneal, perforación (raro), dolor persistente.',
    benefits: 'Eliminación del agente agresor, prevención de daño químico permanente o infección.',
    care: 'Uso de antibiótico oftálmico y oclusión según indicación. No tallar el ojo. Control en 24h.'
  },
  {
    id: 'LAVADO-OTICO',
    category: 'Procedimientos',
    name: 'LAVADO ÓTICO',
    description: 'Irrigación del conducto auditivo externo con agua tibia para remover cerumen u objetos.',
    indications: 'Tapón de cerumen impactado que causa hipoacusia, dolor o tinnitus.',
    contraindications: 'Perforación timpánica conocida o sospechada, historia de cirugía de oído, otitis media aguda, cuerpo extraño vegetal (se hincha).',
    risks: 'Dolor, mareo/vértigo (por temperatura), otitis externa, perforación timpánica, trauma del conducto.',
    benefits: 'Recuperación inmediata de la audición, alivio de molestias.',
    care: 'Mantener oído seco. No introducir hisopos.'
  },

  // --- GINECOLOGÍA, OBSTETRICIA Y PLANIFICACIÓN ---
  {
    id: 'PAP',
    category: 'Ginecología',
    name: 'TOMA DE CITOLOGÍA CERVICAL (PAPANICOLAOU)',
    description: 'Obtención de células del cuello uterino mediante cepillo/espátula para análisis microscópico. Procedimiento ginecológico básico.',
    indications: 'Tamizaje de cáncer cervicouterino y VPH en mujeres con vida sexual activa o >21-25 años.',
    contraindications: 'Menstruación activa abundante (relativa), histerectomía total previa por causa benigna (discutible).',
    risks: 'Molestia leve, sangrado escaso (manchado) post-procedimiento, infección (muy raro).',
    benefits: 'Detección temprana de lesiones precancerosas y cáncer, permitiendo tratamiento curativo.',
    care: 'Abstinencia sexual 24-48h previa. Recoger resultados.'
  },
  {
    id: 'EXPLORA-MAMA',
    category: 'Ginecología',
    name: 'EXPLORACIÓN GINECOLÓGICA / MAMARIA',
    description: 'Examen físico sistemático de mamas y región pélvica para detectar anomalías.',
    indications: 'Control anual de salud, detección de masas, dolor, secreciones o cambios en piel.',
    contraindications: 'Rechazo de la paciente.',
    risks: 'Incomodidad física o pudor. Falsos positivos que generen ansiedad.',
    benefits: 'Detección temprana de cáncer de mama y patología pélvica.',
    care: 'Autoexploración mensual. Mastografía según edad.'
  },
  {
    id: 'PLAN-FAM',
    category: 'Planificación Familiar',
    name: 'CONSEJERÍA EN PLANIFICACIÓN FAMILIAR',
    description: 'Sesión educativa para informar sobre métodos anticonceptivos, eficacia, riesgos y elección informada.',
    indications: 'Personas en edad reproductiva que desean controlar su fertilidad.',
    contraindications: 'Ninguna.',
    risks: 'Ninguno físico. Riesgo de elección inadecuada si la información no es clara.',
    benefits: 'Prevención de embarazo no deseado e ITS. Empoderamiento reproductivo.',
    care: 'Seguimiento del método elegido.'
  },
  {
    id: 'DIU-COL',
    category: 'Planificación Familiar',
    name: 'COLOCACIÓN DE DISPOSITIVO INTRAUTERINO (DIU)',
    description: 'Inserción transvaginal de un dispositivo (T Cobre/Hormonal) en la cavidad uterina.',
    indications: 'Anticoncepción de larga duración reversible.',
    contraindications: 'Embarazo, infección pélvica activa, cáncer cervicouterino/endometrial, anomalías uterinas.',
    risks: 'Dolor, sangrado, perforación uterina (1/1000), expulsión, infección pélvica (primeras semanas).',
    benefits: 'Alta eficacia anticonceptiva (>99%), larga duración, no interfiere con el coito.',
    care: 'Revisión de hilos post-menstruación. Eco de control.'
  },
  {
    id: 'DIU-RET',
    category: 'Planificación Familiar',
    name: 'RETIRO DE DISPOSITIVO INTRAUTERINO (DIU)',
    description: 'Extracción del DIU mediante tracción de los hilos guía a través del cérvix.',
    indications: 'Deseo de embarazo, caducidad del dispositivo, complicaciones (dolor/sangrado/infección), menopausia.',
    contraindications: 'Embarazo con DIU in situ (requiere valoración especialista de alto riesgo).',
    risks: 'Dolor, sangrado leve, ruptura de hilos, necesidad de retiro instrumentado o quirúrgico si está traslocado.',
    benefits: 'Retorno inmediato a la fertilidad o resolución de complicaciones.',
    care: 'Anticoncepción alternativa si no desea embarazo.'
  },
  {
    id: 'IMPLANTE-COL',
    category: 'Planificación Familiar',
    name: 'COLOCACIÓN DE IMPLANTE SUBDÉRMICO',
    description: 'Inserción de varilla(s) hormonal(es) en la cara interna del brazo bajo anestesia local.',
    indications: 'Anticoncepción hormonal de larga duración (3-5 años).',
    contraindications: 'Embarazo, trombosis activa, enfermedad hepática severa, cáncer de mama.',
    risks: 'Hematoma, dolor, infección, migración, cambios en patrón menstrual, cefalea.',
    benefits: 'Alta eficacia, discreto, larga duración.',
    care: 'Vendaje compresivo 24h. Palpar periódicamente.'
  },
  {
    id: 'IMPLANTE-RET',
    category: 'Planificación Familiar',
    name: 'RETIRO DE IMPLANTE SUBDÉRMICO',
    description: 'Extracción de la varilla del implante mediante pequeña incisión y anestesia local.',
    indications: 'Deseo de embarazo, caducidad, efectos adversos intolerables.',
    contraindications: 'Ninguna absoluta (salvo infección activa en sitio).',
    risks: 'Dolor, hematoma, cicatriz, dificultad para localizar/extraer (si migró o se encapsuló), infección.',
    benefits: 'Retorno a la fertilidad.',
    care: 'Curación de herida, vendaje compresivo.'
  },

  // --- CONTROL Y SEGUIMIENTO ---
  {
    id: 'CRONICOS',
    category: 'Medicina Preventiva',
    name: 'SEGUIMIENTO Y VIGILANCIA DE ENFERMEDADES CRÓNICAS',
    description: 'Consulta médica periódica para ajuste de tratamiento, revisión de metas (glucosa, TA, lípidos) y detección de complicaciones.',
    indications: 'Pacientes con Diabetes, Hipertensión, Obesidad, Dislipidemia, Síndrome Metabólico.',
    contraindications: 'Ninguna.',
    risks: 'Efectos adversos de fármacos ajustados. Hipoglucemia/Hipotensión por ajuste intensivo.',
    benefits: 'Prevención de complicaciones a largo plazo (infarto, EVC, insuficiencia renal, ceguera), mejora de calidad de vida.',
    care: 'Adherencia al tratamiento y estilo de vida. Asistir a citas.'
  },

  // --- LABORATORIO Y PRUEBAS RÁPIDAS ---
  {
    id: 'PRUEBA-VIH',
    category: 'Laboratorio',
    name: 'PRUEBA RÁPIDA DE VIH / SÍFILIS',
    description: 'Toma de muestra capilar o venosa para detección de anticuerpos. Requiere consejería pre y post prueba.',
    indications: 'Tamizaje en población general, embarazadas, conductas de riesgo, exposición accidental.',
    contraindications: 'Rechazo del paciente.',
    risks: 'Falsos positivos/negativos (periodo de ventana), impacto emocional del resultado.',
    benefits: 'Detección temprana y acceso a tratamiento oportuno.',
    care: 'Confidencialidad estricta. Prueba confirmatoria si reactiva.'
  },
  {
    id: 'ANTIDOPING',
    category: 'Laboratorio',
    name: 'PRUEBA TOXICOLÓGICA (ANTIDOPING)',
    description: 'Recolección de orina para detección cualitativa de metabolitos de drogas de abuso.',
    indications: 'Requisito laboral, sospecha de intoxicación, seguimiento de adicciones, medicina legal.',
    contraindications: 'Ninguna médica.',
    risks: 'Implicaciones legales/laborales del resultado positivo.',
    benefits: 'Diagnóstico de consumo.',
    care: 'Cadena de custodia si es legal. Evitar dilución de muestra.'
  },
  
  // --- PROCEDIMIENTOS MAYORES Y HOSPITALARIOS (Referencias) ---
  {
    id: 'TRANS-SANG',
    category: 'Hospitalario',
    name: 'TRANSFUSIÓN DE HEMODERIVADOS',
    description: 'Administración IV de sangre o componentes (paquete globular, plasma, plaquetas). Procedimiento de alto riesgo.',
    indications: 'Anemia severa sintomática, hemorragia aguda, coagulopatías.',
    contraindications: 'Rechazo religioso (Testigos de Jehová), reacciones previas severas, riesgo > beneficio.',
    risks: 'Reacción transfusional (febril, alérgica, hemolítica grave), TRALI (daño pulmonar), sobrecarga de volumen, transmisión de infecciones (bajo riesgo).',
    benefits: 'Restauración de capacidad de transporte de oxígeno y volumen, salvamento de vida.',
    care: 'Vigilancia estricta de signos vitales. Detener ante cualquier síntoma adverso.'
  }
];

const InformedConsent: React.FC<InformedConsentProps> = ({ patients, notes, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'print'>('edit');
  const [activeTab, setActiveTab] = useState<'clinical' | 'legal'>('clinical');

  const [form, setForm] = useState({
    // Header
    institution: doctorInfo?.hospital || 'Hospital General San Rafael',
    location: doctorInfo?.address || 'Ciudad de México',
    date: new Date().toISOString().split('T')[0],
    
    // Procedure Info
    diagnosis: '',     
    authorizedAct: '', 
    description: '',   
    indications: '',   
    contraindications: '', 
    risks: '',         
    benefits: '',      
    generalCare: '',   
    
    // Prognosis
    prognosisLife: 'Bueno para la vida',
    prognosisFunction: 'Bueno para la función',
    prognosisRecovery: 'Recuperación ad integrum esperada',

    // Legal Clauses
    emergencyAuth: true, 
    anesthesiaAuth: false, 
    transfusionAuth: false, 
    teachingAuth: false, 
    
    consentStatus: 'accepted' as 'accepted' | 'refused',

    // Signatures
    signerType: 'patient' as 'patient' | 'representative',
    patientName: patient?.name || '',
    patientAge: patient?.age || 0,
    representativeName: '',
    representativeRelation: '',
    doctorName: doctorInfo?.name || '',
    doctorCedula: doctorInfo?.cedula || '',
    witness1: '',
    witness2: ''
  });

  const [isSigned, setIsSigned] = useState(false);

  // Extract unique categories for filter
  const categories = useMemo(() => {
      const cats = new Set(PROCEDURE_TEMPLATES.map(t => t.category));
      return ['TODAS', ...Array.from(cats).sort()];
  }, []);

  // Filter Logic
  const filteredTemplates = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      return PROCEDURE_TEMPLATES.filter(t => {
          const matchesTerm = term === '' || t.name.toLowerCase().includes(term) || t.description.toLowerCase().includes(term);
          const matchesCategory = categoryFilter === 'TODAS' || t.category === categoryFilter;
          return matchesTerm && matchesCategory;
      });
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
     if (patient && !form.diagnosis && patient.reason) {
         setForm(prev => ({...prev, diagnosis: patient.reason || ''}));
     }
  }, [patient]);

  if (!patient) return null;

  const getLegalDeclaration = () => {
      return `Expreso mi libre voluntad para autorizar o no el procedimiento o intervención quirúrgica señalada en este documento después de haberme proporcionado la información completa sobre mi enfermedad y estado actual, la cual fue realizada en forma amplia, precisa y suficiente en un lenguaje claro y sencillo, informándome sobre los posibles riesgos, complicaciones y secuelas, de igual forma los beneficios.
      
      El médico me informó la existencia de procedimientos alternativos, el derecho a cambiar mi decisión en cualquier momento y manifestarla antes del procedimiento o intervención. Con el propósito de que mi atención sea adecuada, me comprometo a proporcionar información completa y veraz, así como seguir las indicaciones médicas.
      
      Otorgo mi autorización al personal de salud para la atención de contingencias y urgencias derivadas del acto médico señalado, atendiendo al principio de libertad prescriptiva.`;
  };

  const applyTemplate = (template: ProcedureTemplate) => {
    setForm(prev => ({
      ...prev,
      authorizedAct: template.name,
      description: template.description,
      indications: template.indications,
      contraindications: template.contraindications,
      risks: template.risks,
      benefits: template.benefits,
      generalCare: template.care,
      anesthesiaAuth: template.category.includes('Cirugía') || template.category.includes('Invasivo') || template.category === 'Planificación Familiar'
    }));
    setShowTemplateSelector(false);
  };

  const handleSave = () => {
    if (!form.authorizedAct || !form.risks || !form.benefits || !form.diagnosis) {
      alert("Campos obligatorios: Diagnóstico, Acto Autorizado, Riesgos y Beneficios.");
      return;
    }
    if (form.signerType === 'representative' && !form.representativeName) {
        alert("Si el firmante es un representante, debe escribir su nombre completo.");
        return;
    }
    if (!form.witness1 || !form.witness2) {
      alert("Es obligatorio registrar el nombre de dos testigos (NOM-004).");
      return;
    }
    if (!isSigned) {
      alert("Debe sellar/firmar el documento para validarlo.");
      return;
    }

    const newNote: ClinicalNote = {
      id: `CONS-${Date.now()}`,
      patientId: patient.id,
      type: `Consentimiento Informado: ${form.authorizedAct} (${form.consentStatus === 'accepted' ? 'ACEPTADO' : 'RECHAZADO'})`,
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorName,
      content: { ...form, declarationText: getLegalDeclaration() },
      isSigned: true,
      hash: `CERT-CONS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    setViewMode('print');
  };

  if (viewMode === 'print') {
      const legalText = getLegalDeclaration();
      return (
          <div className="min-h-screen bg-slate-100 flex justify-center p-8 animate-in fade-in">
              <div className="w-full max-w-[215mm] bg-white shadow-2xl p-[20mm] text-slate-900 print:shadow-none print:w-full print:p-0 print:m-0">
                  <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                      <h1 className="text-xl font-black uppercase tracking-tight">{form.institution}</h1>
                      <p className="text-sm font-bold uppercase text-slate-600">{form.location}</p>
                      <h2 className="text-2xl font-black uppercase mt-4 underline underline-offset-4">Carta de Consentimiento Informado</h2>
                  </div>

                  <div className="text-xs text-justify leading-relaxed space-y-4 font-medium uppercase">
                      <p>
                          LUGAR Y FECHA: <strong>{form.location}, A {new Date(form.date + 'T12:00:00').toLocaleDateString('es-MX', {dateStyle:'long'}).toUpperCase()}.</strong>
                      </p>
                      
                      <div className="border border-slate-300 p-3 rounded bg-slate-50 print:bg-white">
                          <p><span className="font-black">NOMBRE DEL PACIENTE:</span> {patient.name}</p>
                          <p><span className="font-black">EDAD:</span> {patient.age} AÑOS &nbsp;&nbsp; <span className="font-black">SEXO:</span> {patient.sex} &nbsp;&nbsp; <span className="font-black">EXPEDIENTE:</span> {patient.id}</p>
                      </div>

                      <div>
                          <p className="font-black bg-slate-100 p-1 mb-1 print:bg-transparent print:border-b print:border-slate-300">DIAGNÓSTICO PREVIO:</p>
                          <p className="pl-2 font-bold">{form.diagnosis}</p>
                      </div>

                      <div className="my-4 space-y-4">
                          <div>
                              <p className="font-black bg-slate-100 p-1 mb-1 print:bg-transparent print:border-b print:border-slate-300">1. ACTO MÉDICO AUTORIZADO (NOMBRE DEL PROCEDIMIENTO):</p>
                              <p className="pl-2 font-bold text-sm">{form.authorizedAct}</p>
                          </div>
                          
                          <div>
                              <p className="font-black bg-slate-100 p-1 mb-1 print:bg-transparent print:border-b print:border-slate-300">2. DESCRIPCIÓN Y OBJETIVO (¿EN QUÉ CONSISTE?):</p>
                              <p className="pl-2">{form.description}</p>
                              <p className="pl-2 mt-1"><span className="font-bold">INDICACIONES:</span> {form.indications}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <p className="font-black bg-slate-100 p-1 mb-1 print:bg-transparent print:border-b print:border-slate-300">3. BENEFICIOS ESPERADOS:</p>
                                  <p className="pl-2">{form.benefits}</p>
                              </div>
                              <div>
                                  <p className="font-black bg-slate-100 p-1 mb-1 print:bg-transparent print:border-b print:border-slate-300">4. RIESGOS FRECUENTES Y COMPLICACIONES:</p>
                                  <p className="pl-2">{form.risks}</p>
                              </div>
                          </div>

                          <div className="border border-slate-300 p-2">
                              <p className="font-black text-center mb-2">PRONÓSTICO</p>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                  <div><span className="font-bold block">PARA LA VIDA:</span> {form.prognosisLife}</div>
                                  <div><span className="font-bold block">PARA LA FUNCIÓN:</span> {form.prognosisFunction}</div>
                                  <div><span className="font-bold block">PARA LA RECUPERACIÓN:</span> {form.prognosisRecovery}</div>
                              </div>
                          </div>

                          <div>
                              <p className="font-black bg-slate-100 p-1 mb-1 print:bg-transparent print:border-b print:border-slate-300">CONTRAINDICACIONES Y CUIDADOS:</p>
                              <p className="pl-2">{form.generalCare} {form.contraindications ? `(Contraindicaciones: ${form.contraindications})` : ''}</p>
                          </div>
                      </div>

                      <div className="border-t-2 border-slate-900 pt-4 mt-6">
                          <p className="font-black text-center mb-4 text-sm">DECLARACIÓN DEL OTORGANTE</p>
                          <p className="p-4 border border-slate-300 rounded text-justify font-bold bg-slate-50 print:bg-white print:border-none print:p-0 leading-relaxed">"{legalText}"</p>
                      </div>
                      
                      <div className="flex justify-center gap-10 py-4 border-y border-slate-200 my-4">
                          <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 border-2 border-slate-900 flex items-center justify-center font-black ${form.consentStatus === 'accepted' ? 'bg-slate-900 text-white' : ''}`}>
                                  {form.consentStatus === 'accepted' ? 'X' : ''}
                              </div>
                              <span className="font-black text-sm">ACEPTO EL PROCEDIMIENTO</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 border-2 border-slate-900 flex items-center justify-center font-black ${form.consentStatus === 'refused' ? 'bg-slate-900 text-white' : ''}`}>
                                  {form.consentStatus === 'refused' ? 'X' : ''}
                              </div>
                              <span className="font-black text-sm">NO ACEPTO (REVOCACIÓN)</span>
                          </div>
                      </div>

                      <div className="space-y-1 mt-2 text-[10px]">
                          {form.emergencyAuth && <p><strong>• CLÁUSULA DE CONTINGENCIA:</strong> SE AUTORIZA LA ATENCIÓN DE URGENCIAS DERIVADAS.</p>}
                          {form.anesthesiaAuth && <p><strong>• CLÁUSULA DE ANESTESIA:</strong> SE AUTORIZA LA ADMINISTRACIÓN DE ANESTESIA/SEDACIÓN.</p>}
                          {form.transfusionAuth && <p><strong>• CLÁUSULA DE TRANSFUSIÓN:</strong> SE AUTORIZA LA TRANSFUSIÓN DE HEMODERIVADOS SI ES VITAL.</p>}
                      </div>

                      <div className="mt-12 pt-8 grid grid-cols-2 gap-x-12 gap-y-16 text-center">
                          <div>
                              <div className="border-b border-slate-900 mb-1 h-8"></div>
                              <p className="font-black">{form.signerType === 'patient' ? form.patientName : form.representativeName}</p>
                              <p className="text-[9px]">NOMBRE Y FIRMA DEL {form.signerType === 'patient' ? 'PACIENTE' : 'RESPONSABLE LEGAL'}</p>
                          </div>
                          <div>
                              <div className="border-b border-slate-900 mb-1 h-8"></div>
                              <p className="font-black">{form.doctorName}</p>
                              <p className="text-[9px]">NOMBRE Y FIRMA DEL MÉDICO TRATANTE</p>
                              <p className="text-[8px]">CÉDULA PROFESIONAL: {form.doctorCedula}</p>
                          </div>
                          <div>
                              <div className="border-b border-slate-900 mb-1 h-8"></div>
                              <p className="font-black">{form.witness1}</p>
                              <p className="text-[9px]">NOMBRE Y FIRMA TESTIGO 1</p>
                          </div>
                          <div>
                              <div className="border-b border-slate-900 mb-1 h-8"></div>
                              <p className="font-black">{form.witness2}</p>
                              <p className="text-[9px]">NOMBRE Y FIRMA TESTIGO 2</p>
                          </div>
                      </div>
                  </div>

                  <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 flex justify-center gap-4 no-print">
                      <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs flex items-center gap-2"><Printer size={16}/> Imprimir</button>
                      <button onClick={() => navigate(`/patient/${id}`)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs">Salir</button>
                  </div>
              </div>
          </div>
      );
  }

  // VISTA DE EDICIÓN
  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consentimiento Informado</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500"/> NOM-004-SSA3-2012 • Documento Legal
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setActiveTab('clinical')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'clinical' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>Datos Clínicos</button>
            <button onClick={() => setActiveTab('legal')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'legal' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>Datos Legales</button>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-200 space-y-10 min-h-[600px]">
          
          {/* TAB: DATOS CLÍNICOS */}
          {activeTab === 'clinical' && (
              <div className="space-y-6 animate-in slide-in-from-left-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                          <Info size={14}/> Datos del Acto Médico
                      </h3>
                      <button 
                            onClick={() => setShowTemplateSelector(true)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                        >
                            <BookOpen size={12}/> Cargar Plantilla
                        </button>
                  </div>
                  
                  <div className="space-y-4">
                      {/* NEW: DIAGNOSIS FIELD */}
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2">Diagnóstico Previo al Procedimiento <span className="text-rose-500">*</span></label>
                          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 uppercase outline-none focus:border-blue-500 transition-all" value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} placeholder="Ej: Apendicitis Aguda, Colelitiasis..." />
                      </div>

                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2">Acto Autorizado (Procedimiento) <span className="text-rose-500">*</span></label>
                          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 uppercase outline-none focus:border-blue-500 transition-all" value={form.authorizedAct} onChange={e => setForm({...form, authorizedAct: e.target.value})} placeholder="NOMBRE DEL PROCEDIMIENTO..." />
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Descripción (¿En qué consiste?)</label>
                          <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-blue-100" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Explicación clara y sencilla del procedimiento..." />
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Indicaciones Médicas (Justificación)</label>
                          <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-blue-100" value={form.indications} onChange={e => setForm({...form, indications: e.target.value})} placeholder="Razón médica para realizar el procedimiento..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-emerald-600 uppercase ml-2">Beneficios Esperados</label>
                              <textarea className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl h-32 text-xs font-medium resize-none outline-none" value={form.benefits} onChange={e => setForm({...form, benefits: e.target.value})} placeholder="Mejoría esperada..." />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-rose-600 uppercase ml-2">Riesgos Frecuentes y Complicaciones</label>
                              <textarea className="w-full p-4 bg-rose-50/30 border border-rose-100 rounded-2xl h-32 text-xs font-medium resize-none outline-none" value={form.risks} onChange={e => setForm({...form, risks: e.target.value})} placeholder="Riesgos típicos, infección, sangrado, muerte..." />
                          </div>
                      </div>

                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                           <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pronóstico</h4>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="space-y-1">
                                   <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Para la Vida</label>
                                   <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.prognosisLife} onChange={e => setForm({...form, prognosisLife: e.target.value})}>
                                       <option value="Bueno">Bueno</option><option value="Malo">Malo</option><option value="Reservado a evolución">Reservado a evolución</option><option value="Incierto">Incierto</option>
                                   </select>
                               </div>
                               <div className="space-y-1">
                                   <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Para la Función</label>
                                   <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.prognosisFunction} onChange={e => setForm({...form, prognosisFunction: e.target.value})}>
                                       <option value="Bueno">Bueno</option><option value="Limitado">Limitado</option><option value="Malo">Malo (Pérdida de función)</option><option value="Reservado a evolución">Reservado a evolución</option>
                                   </select>
                               </div>
                               <div className="space-y-1">
                                   <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Para la Recuperación</label>
                                   <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={form.prognosisRecovery} onChange={e => setForm({...form, prognosisRecovery: e.target.value})}>
                                       <option value="Rápida">Rápida</option><option value="Lenta/Tórpida">Lenta/Tórpida</option><option value="Ad Integrum (Completa)">Ad Integrum (Completa)</option><option value="Parcial">Parcial</option><option value="Reservado a evolución">Reservado a evolución</option>
                                   </select>
                               </div>
                           </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Contraindicaciones</label>
                          <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none outline-none" value={form.contraindications} onChange={e => setForm({...form, contraindications: e.target.value})} placeholder="Contraindicaciones del procedimiento..." />
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Cuidados Post-Procedimiento</label>
                          <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-20 text-xs font-medium resize-none outline-none" value={form.generalCare} onChange={e => setForm({...form, generalCare: e.target.value})} placeholder="Indicaciones posteriores..." />
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: DATOS LEGALES */}
          {activeTab === 'legal' && (
             <div className="space-y-8 animate-in slide-in-from-right-4">
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                          <UserCheck size={14}/> Datos del Otorgante (Quien firma)
                      </h3>
                      
                      <div className="flex gap-4">
                          <button onClick={() => setForm({...form, signerType: 'patient'})} className={`flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${form.signerType === 'patient' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>Paciente (Mayor de Edad)</button>
                          <button onClick={() => setForm({...form, signerType: 'representative'})} className={`flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${form.signerType === 'representative' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>Representante Legal / Tutor</button>
                      </div>

                      {form.signerType === 'representative' && (
                          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nombre del Representante</label>
                                  <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.representativeName} onChange={e => setForm({...form, representativeName: e.target.value})} placeholder="Nombre completo..." />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Parentesco / Relación</label>
                                  <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" value={form.representativeRelation} onChange={e => setForm({...form, representativeRelation: e.target.value})} placeholder="Ej: Madre, Padre, Tutor..." />
                              </div>
                          </div>
                      )}

                      <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Vista Previa de la Declaración Legal:</p>
                          <p className="text-[10px] font-bold text-slate-700 uppercase italic leading-relaxed">"{getLegalDeclaration()}"</p>
                      </div>
                  </div>

                  <div className="p-6 bg-slate-100 border border-slate-200 rounded-3xl space-y-4">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                          <Gavel size={14}/> Decisión del Paciente
                      </h3>
                      <div className="flex gap-4">
                          <button onClick={() => setForm({...form, consentStatus: 'accepted'})} className={`flex-1 p-5 rounded-2xl border-2 text-xs font-black uppercase transition-all flex flex-col items-center gap-2 ${form.consentStatus === 'accepted' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                             <ThumbsUp size={24} /> ACEPTO EL PROCEDIMIENTO
                          </button>
                          <button onClick={() => setForm({...form, consentStatus: 'refused'})} className={`flex-1 p-5 rounded-2xl border-2 text-xs font-black uppercase transition-all flex flex-col items-center gap-2 ${form.consentStatus === 'refused' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                             <ThumbsDown size={24} /> NO ACEPTO (REVOCACIÓN)
                          </button>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                          <ShieldCheck size={14}/> Cláusulas de Autorización
                      </h3>
                      <div onClick={() => setForm({...form, emergencyAuth: !form.emergencyAuth})} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${form.emergencyAuth ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                          <div><p className="text-[10px] font-black uppercase">Atención de Contingencias y Urgencias</p><p className="text-[9px] font-medium opacity-80">Autorizo al médico a resolver cualquier urgencia derivada del acto (Libertad Prescriptiva).</p></div>
                          {form.emergencyAuth ? <CheckCircle2 size={20} className="text-blue-600"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>}
                      </div>
                      <div onClick={() => setForm({...form, anesthesiaAuth: !form.anesthesiaAuth})} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${form.anesthesiaAuth ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                          <div><p className="text-[10px] font-black uppercase">Administración de Anestesia</p><p className="text-[9px] font-medium opacity-80">Autorizo procedimientos anestésicos necesarios para el acto médico.</p></div>
                          {form.anesthesiaAuth ? <CheckCircle2 size={20} className="text-indigo-600"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>}
                      </div>
                      <div onClick={() => setForm({...form, transfusionAuth: !form.transfusionAuth})} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${form.transfusionAuth ? 'bg-rose-50 border-rose-500 text-rose-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                          <div><p className="text-[10px] font-black uppercase">Transfusión Sanguínea (Si es vital)</p><p className="text-[9px] font-medium opacity-80">Autorizo la transfusión de hemoderivados en caso de urgencia vital.</p></div>
                          {form.transfusionAuth ? <CheckCircle2 size={20} className="text-rose-600"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>}
                      </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Users size={14}/> Testigos (Obligatorio)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Testigo 1 (Nombre Completo)</label><input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.witness1} onChange={e => setForm({...form, witness1: e.target.value})} placeholder="Testigo familiar/acompañante..." /></div>
                          <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Testigo 2 (Nombre Completo)</label><input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase" value={form.witness2} onChange={e => setForm({...form, witness2: e.target.value})} placeholder="Testigo institucional..." /></div>
                      </div>
                  </div>

                  <div className="pt-8 flex justify-center">
                       <div onClick={() => setIsSigned(!isSigned)} className={`w-full max-w-md h-32 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all ${isSigned ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-slate-400'}`}>
                          {isSigned ? (
                             <div className="text-emerald-600 text-center"><CheckCircle2 size={32} className="mx-auto mb-1"/><p className="text-xs font-black uppercase">Documento Sellado</p></div>
                          ) : (
                             <div className="text-slate-400 text-center"><PenTool size={32} className="mx-auto mb-1"/><p className="text-xs font-black uppercase">Click para firmar digitalmente</p></div>
                          )}
                       </div>
                  </div>
             </div>
          )}

          <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
              <button onClick={() => activeTab === 'clinical' ? setActiveTab('legal') : handleSave()} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-blue-600 transition-all">
                  {activeTab === 'clinical' ? 'Siguiente: Datos Legales' : 'Generar Documento Legal'}
              </button>
          </div>
      </div>

      {/* TEMPLATE MODAL */}
      {showTemplateSelector && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[85vh]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-slate-900 uppercase">Seleccionar Plantilla</h3>
                      <button onClick={() => setShowTemplateSelector(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                  </div>
                  
                  <div className="flex gap-4 mb-6">
                      <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-500"
                              placeholder="Buscar procedimiento..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              autoFocus
                          />
                      </div>
                      <div className="relative group">
                          <button className="h-full px-6 bg-slate-100 rounded-2xl text-slate-600 font-bold text-xs uppercase flex items-center gap-2 hover:bg-slate-200">
                              <Filter size={16}/> {categoryFilter === 'TODAS' ? 'Categorías' : categoryFilter}
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-xl rounded-2xl overflow-hidden hidden group-hover:block z-50 border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                              {categories.map(cat => (
                                  <button 
                                      key={cat} 
                                      onClick={() => setCategoryFilter(cat)}
                                      className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 border-b border-slate-50 last:border-0 ${categoryFilter === cat ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                                  >
                                      {cat}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                      {filteredTemplates.map(template => (
                          <button 
                              key={template.id}
                              onClick={() => applyTemplate(template)}
                              className="text-left p-5 bg-white border border-slate-100 hover:border-blue-500 hover:bg-blue-50 rounded-3xl transition-all group shadow-sm flex flex-col gap-2"
                          >
                              <div className="flex justify-between items-start">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase group-hover:bg-blue-200 group-hover:text-blue-800">{template.category}</span>
                              </div>
                              <p className="text-sm font-black text-slate-900 uppercase group-hover:text-blue-700">{template.name}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-2">{template.description}</p>
                          </button>
                      ))}
                      {filteredTemplates.length === 0 && (
                          <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase text-xs">No se encontraron plantillas</div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InformedConsent;
