
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Printer, ShieldCheck, FileText, 
  Save, User, Users, AlertTriangle, CheckCircle2,
  Lock, PenTool, ClipboardCheck, Info, Calendar, 
  Stethoscope, Activity, Skull, Search, Plus, AlertOctagon, MapPin,
  FlaskConical, ImageIcon, Syringe, Pill, Eye, Scissors, Baby, BookOpen
} from 'lucide-react';
import { Patient, ClinicalNote, DoctorInfo } from '../types';

interface InformedConsentProps {
  patients: Patient[];
  onSaveNote: (note: ClinicalNote) => void;
  doctorInfo?: DoctorInfo;
}

// --- CATALOGO MAESTRO DE PROCEDIMIENTOS (LENGUAJE CLARO PARA PACIENTES) ---
const PROCEDURE_CATALOG: Record<string, {
    name: string;
    category: string;
    description: string; // NUEVO CAMPO: Descripción del Procedimiento paso a paso
    indications: string;
    contraindications: string;
    risks: string;
    benefits: string;
    preCare: string;
    postCare: string;
}> = {
    // --- GESTIÓN Y ADMINISTRATIVO ---
    'apertura_expediente': {
        name: 'Apertura de Expediente e Ingreso a Control Médico',
        category: 'Administrativo / Legal',
        description: 'Se realizará una entrevista detallada para recabar sus datos personales y antecedentes de salud. Posteriormente, se llevará a cabo una exploración física completa (toma de signos vitales, peso, talla, revisión general). Toda la información se registrará digitalmente bajo estrictas normas de confidencialidad.',
        indications: 'Se requiere para iniciar cualquier relación médico-paciente, permitiendo el registro histórico de su salud, enfermedades previas y tratamientos.',
        contraindications: 'Negativa del paciente a proporcionar identificación o datos veraces.',
        risks: 'Riesgos mínimos relacionados con la privacidad de datos (mitigados por nuestro Aviso de Privacidad y confidencialidad médica estricta).',
        benefits: 'Permite al equipo médico conocer su historia completa para evitar errores, detectar riesgos a tiempo y ofrecer diagnósticos precisos. Garantiza su seguridad legal y sanitaria.',
        preCare: 'Presentar identificación oficial (INE/Pasaporte) y proporcionar datos verdaderos.',
        postCare: 'Mantener sus datos de contacto actualizados y acudir a sus citas de seguimiento.'
    },
    'telemedicina': {
        name: 'Teleconsulta Médica (Atención a Distancia)',
        category: 'Telemedicina',
        description: 'Se establecerá una conexión de video/audio segura. El médico realizará un interrogatorio clínico detallado sobre sus síntomas actuales y antecedentes. De ser posible, se le pedirá que realice ciertas maniobras frente a la cámara (ej. mostrar garganta, mover extremidades). Al finalizar, recibirá su receta y órdenes de estudio por correo o mensaje.',
        indications: 'Seguimiento, padecimientos no urgentes, revisión de estudios o asesoría médica remota.',
        contraindications: 'Urgencias graves (infarto, dificultad respiratoria severa), necesidad absoluta de tocar/palpar al paciente para diagnóstico.',
        risks: 'Fallo de conexión a internet, diagnóstico limitado por la imposibilidad de exploración física directa.',
        benefits: 'Acceso a especialistas sin necesidad de viajar, mayor comodidad, menor riesgo de contagio de infecciones en salas de espera.',
        preCare: 'Contar con buena conexión a internet y un lugar iluminado y privado.',
        postCare: 'Recepción de receta digital y seguimiento de instrucciones enviadas.'
    },
    
    // --- PLANIFICACIÓN FAMILIAR ---
    'implante_subdermico': {
        name: 'Colocación de Implante Subdérmico (Implanon/Jadelle)',
        category: 'Planificación Familiar',
        description: 'Se limpia el brazo (cara interna) con antiséptico. Se aplica anestesia local inyectada para adormecer la piel. Mediante un aplicador especial (trocar), se inserta la varilla flexible justo debajo de la piel. Se verifica su posición al tacto y se coloca un vendaje compresivo.',
        indications: 'Método anticonceptivo hormonal de larga duración (3 a 5 años) para mujeres que desean evitar un embarazo temporalmente.',
        contraindications: 'Embarazo sospechado o confirmado, trombosis o coágulos activos, enfermedad hepática grave, cáncer de mama, sangrado vaginal sin causa explicada.',
        risks: 'Moretón o dolor en el brazo, infección leve en el sitio. EFECTOS HORMONALES POSIBLES: Cambios en el patrón de sangrado (ausencia de regla o manchado irregular), dolor de cabeza, cambios de humor, acné o leve aumento de peso.',
        benefits: 'Protección anticonceptiva superior al 99% sin necesidad de recordar pastillas diarias. Es reversible (la fertilidad regresa al retirarlo), discreto y de larga duración.',
        preCare: 'Prueba de embarazo negativa obligatoria. Idealmente aplicarse durante la menstruación.',
        postCare: 'Mantener el vendaje compresivo 24 horas. No mojar la zona 3 días. Palpar el implante ocasionalmente para verificar su ubicación.'
    },
    'inyectable_hormonal': {
        name: 'Aplicación de Anticonceptivo Inyectable (Mensual/Trimestral)',
        category: 'Planificación Familiar',
        description: 'Se realiza asepsia (limpieza) en la región glútea o deltoidea. Se prepara la jeringa con la suspensión hormonal homogénea. Se inyecta profundamente en el músculo (intramuscular) de forma lenta y segura. Se retira la aguja y se presiona suavemente sin masajear.',
        indications: 'Prevención temporal del embarazo mediante hormonas inyectables.',
        contraindications: 'Embarazo, hipertensión descontrolada, antecedentes de coágulos (trombosis), cáncer de mama o hígado.',
        risks: 'Irregularidades menstruales (manchado o ausencia de regla), dolor de cabeza, sensibilidad mamaria. La inyección trimestral puede demorar el retorno a la fertilidad hasta 10 meses tras suspenderla.',
        benefits: 'Alta eficacia anticonceptiva, privacidad de uso (nadie nota que lo usa), reduce cólicos menstruales en algunas pacientes.',
        preCare: 'Aplicar preferentemente en los primeros 5 días del ciclo menstrual o tener prueba de embarazo negativa.',
        postCare: 'No dar masaje en la zona de inyección (glúteo/brazo) para no alterar la absorción.'
    },
    'diu_cobre': {
        name: 'Inserción de Dispositivo Intrauterino (DIU T de Cobre)',
        category: 'Planificación Familiar',
        description: 'Se coloca un espejo vaginal para visualizar el cuello uterino. Se realiza limpieza con antiséptico. Se mide la profundidad del útero con un histerómetro. Se introduce el DIU mediante un tubo delgado aplicador hasta el fondo uterino. Se retira el tubo y se recortan los hilos guía.',
        indications: 'Anticoncepción libre de hormonas a largo plazo (hasta 10 años).',
        contraindications: 'Embarazo, infección pélvica o uterina activa, anatomía uterina que impida la colocación, alergia al cobre.',
        risks: 'Dolor tipo cólico durante la colocación, perforación uterina (muy raro <1/1000), expulsión espontánea del dispositivo, aumento en la cantidad y duración del sangrado menstrual.',
        benefits: 'Protección anticonceptiva altamente efectiva y duradera sin hormonas. No altera el peso ni el humor. La fertilidad regresa inmediatamente al retirarlo.',
        preCare: 'Acudir preferentemente durante la menstruación (el cuello uterino está más abierto). Haber comido algo ligero antes.',
        postCare: 'Revisión de hilos al mes y posteriormente cada año. Tomar analgésico si hay cólicos.'
    },
    'diu_mirena': {
        name: 'Inserción de SIU Medicado (Mirena/Kyleena)',
        category: 'Planificación Familiar',
        description: 'Procedimiento similar al DIU de cobre: Visualización del cérvix con espejo vaginal, asepsia, medición uterina e inserción del sistema hormonal mediante un aplicador delgado especial. Se liberan las ramas del dispositivo dentro del útero y se cortan los hilos.',
        indications: 'Anticoncepción y tratamiento para sangrados menstruales abundantes.',
        contraindications: 'Embarazo, cáncer de mama o cérvix, infección pélvica activa.',
        risks: 'Perforación uterina (muy raro), expulsión. EFECTOS: Puede causar ausencia total de menstruación (amenorrea), quistes ováricos benignos transitorios o acné leve.',
        benefits: 'Disminuye drásticamente el sangrado y dolor menstrual. Protección por 5 años. Menor carga hormonal sistémica que las pastillas.',
        preCare: 'Prueba de embarazo negativa. Acudir durante la menstruación.',
        postCare: 'Vigilancia anual. Esperar manchado irregular los primeros 3-6 meses (adaptación).'
    },
    'vasectomia': {
        name: 'Vasectomía Sin Bisturí',
        category: 'Planificación Familiar',
        description: 'Previa asepsia local, se aplica anestesia local en la piel del escroto. Se realiza una punción diminuta para localizar los conductos deferentes (que transportan esperma). Se ligan, cortan y cauterizan los extremos de los conductos. No requiere puntos de sutura en la piel.',
        indications: 'Método definitivo de control natal para hombres que ya no desean hijos.',
        contraindications: 'Infección local en escroto, dudas sobre la decisión (debe estar seguro).',
        risks: 'Hematoma (moretón) en escroto, dolor leve, infección, recanalización espontánea (muy raro).',
        benefits: 'Anticoncepción permanente segura, sencilla y rápida. No afecta el desempeño sexual ni la masculinidad.',
        preCare: 'Rasurado de la zona, baño previo, suspender aspirina días antes.',
        postCare: 'Hielo local, uso de suspensorio o ropa interior ajustada. Usar otro método 3 meses hasta confirmar conteo de espermas a cero.'
    },

    // --- LABORATORIO Y TOMA DE MUESTRAS ---
    'venopuncion': {
        name: 'Venopunción para Toma de Muestras Sanguíneas',
        category: 'Servicios Auxiliares (Lab/Imagen)',
        description: 'Se coloca un torniquete en el brazo para resaltar las venas. Se limpia el sitio con alcohol. Se introduce una aguja estéril conectada a tubos de vacío para recolectar la sangre necesaria. Al finalizar, se retira la aguja y se aplica presión con una torunda seca.',
        indications: 'Obtención de sangre para análisis clínicos necesarios para su diagnóstico.',
        contraindications: 'Infección severa en el sitio de punción, fístula arteriovenosa en ese brazo (pacientes renales).',
        risks: 'Dolor leve, moretón (hematoma), desmayo por impresión (reacción vagal), inflamación de la vena (flebitis), lesión nerviosa transitoria (hormigueo).',
        benefits: 'Permite analizar su estado de salud interno (anemia, infección, azúcar, colesterol, función de órganos) para darle el tratamiento correcto.',
        preCare: 'Ayuno según las indicaciones del estudio (generalmente 8 a 12 horas). Mantenerse hidratado con agua simple.',
        postCare: 'Presionar el sitio de punción 5 minutos sin doblar el brazo. No cargar objetos pesados con ese brazo por 1 hora.'
    },
    'gasometria': {
        name: 'Gasometría Arterial (Punción en la muñeca)',
        category: 'Servicios Auxiliares (Lab/Imagen)',
        description: 'Se realiza primero el Test de Allen para verificar circulación. Se limpia la zona de la muñeca donde se siente el pulso. Se introduce una aguja fina directamente en la arteria para extraer sangre oxigenada. Se retira y se aplica presión firme inmediata.',
        indications: 'Medir con exactitud el oxígeno y dióxido de carbono en sangre, así como la acidez (pH), para evaluar problemas respiratorios o metabólicos graves.',
        contraindications: 'Mala circulación en la mano (Test de Allen negativo), infección en el sitio de punción, uso de anticoagulantes en dosis altas (relativo).',
        risks: 'Dolor intenso y breve durante la punción, espasmo de la arteria, moretón, formación de un coágulo (trombosis, raro).',
        benefits: 'Información vital inmediata para ajustar oxígeno, ventiladores o medicamentos en situaciones críticas.',
        preCare: 'Se realizará una prueba de circulación en la mano antes de picar.',
        postCare: 'Presión firme y constante por 5 a 10 minutos para evitar sangrado intenso.'
    },
    'hisopado': {
        name: 'Toma de Muestra Nasofaríngea / Orofaríngea (Hisopado)',
        category: 'Servicios Auxiliares (Lab/Imagen)',
        description: 'Se inclina ligeramente la cabeza hacia atrás. Se introduce un hisopo flexible estéril por la fosa nasal hasta llegar a la parte posterior de la garganta (nasofaringe) o por la boca (orofaringe). Se gira suavemente unos segundos para recolectar células y secreciones.',
        indications: 'Detección de virus o bacterias respiratorias (COVID-19, Influenza, Estreptococo).',
        contraindications: 'Cirugía nasal reciente o trauma facial severo (avisar al tomador).',
        risks: 'Molestia o sensación de ardor momentáneo, estornudos, lagrimeo, sangrado nasal leve (epistaxis).',
        benefits: 'Identificar exactamente qué microbio causa su enfermedad para saber si requiere aislamiento o antibióticos específicos.',
        preCare: 'No usar aerosoles nasales o enjuagues bucales 2 horas antes.',
        postCare: 'Si hay sangrado leve, presionar la nariz. Cubrirse al estornudar.'
    },
    'biopsia_piel': {
        name: 'Toma de Biopsia de Piel / Tejidos Blandos',
        category: 'Procedimiento Ambulatorio',
        description: 'Se limpia la zona y se aplica anestesia local inyectada. Dependiendo del tipo, se usa un bisturí o un sacabocados (punch) para extraer un fragmento de la lesión o piel. Se coloca un punto de sutura si es necesario y se cubre con un vendaje.',
        indications: 'Análisis de lunares, verrugas, quistes o lesiones sospechosas.',
        contraindications: 'Infección activa en el sitio (salvo que se busque diagnosticar la infección), problemas graves de coagulación.',
        risks: 'Sangrado, dolor local, infección de la herida, cicatriz visible (posiblemente queloide según cicatrización del paciente).',
        benefits: 'Permite saber con certeza si una lesión es benigna o maligna (cáncer), guiando el tratamiento definitivo.',
        preCare: 'Informar si toma anticoagulantes. Aseo de la zona.',
        postCare: 'Mantener la herida seca 24 horas. Limpieza diaria y retiro de puntos en 7-14 días.'
    },

    // --- IMAGENOLOGÍA ---
    'rayos_x': {
        name: 'Estudio de Rayos X (Radiografía Simple)',
        category: 'Imagenología',
        description: 'Se le pedirá que se coloque en una posición específica frente o sobre el detector de rayos X. Deberá permanecer inmóvil y contener la respiración unos segundos mientras se toma la imagen. El proceso dura apenas unos minutos.',
        indications: 'Evaluar huesos (fracturas), pulmones (neumonía) o abdomen.',
        contraindications: 'Embarazo (especialmente primer trimestre) salvo urgencia vital estricta.',
        risks: 'Exposición baja a radiación ionizante. El riesgo de daño celular es mínimo con las dosis diagnósticas modernas.',
        benefits: 'Diagnóstico rápido y no invasivo de fracturas, infecciones pulmonares o problemas intestinales.',
        preCare: 'Retirar objetos metálicos (collares, broches) de la zona a radiografiar. Informar si existe posibilidad de embarazo.',
        postCare: 'Ninguno. Puede retomar actividades normales.'
    },
    'tac_simple': {
        name: 'Tomografía Axial Computarizada (TAC) Simple',
        category: 'Imagenología',
        description: 'Se acostará en una mesa motorizada que se desliza dentro de un anillo grande (tomógrafo). El equipo girará a su alrededor tomando múltiples imágenes por rayos X. Debe permanecer inmóvil. El estudio es rápido e indoloro.',
        indications: 'Evaluación rápida de trauma craneal, dolor abdominal, cálculos renales o problemas pulmonares.',
        contraindications: 'Embarazo (riesgo de radiación al feto).',
        risks: 'Exposición a radiación (mayor que una radiografía común).',
        benefits: 'Imágenes detalladas en cortes transversales que permiten ver órganos internos y huesos con gran claridad en segundos.',
        preCare: 'Retirar objetos metálicos.',
        postCare: 'Ninguno.'
    },
    'tac_contraste': {
        name: 'Tomografía (TAC) con Medio de Contraste IV',
        category: 'Imagenología',
        description: 'Se canaliza una vena para inyectar un medio de contraste yodado. Al inyectarse, puede sentir calor en el cuerpo. Se realiza el escaneo en el tomógrafo mientras el contraste resalta vasos sanguíneos y órganos.',
        indications: 'Visualización detallada de tumores, vasos sanguíneos, infecciones profundas o daño a órganos internos.',
        contraindications: 'Alergia al Yodo, insuficiencia renal (riñones no filtran bien), embarazo.',
        risks: 'Daño renal por el contraste, reacción alérgica (desde ronchas hasta dificultad respiratoria grave), sensación de calor al inyectar.',
        benefits: 'Imágenes de altísima precisión que permiten detectar problemas que no se ven en radiografías simples, cruciales para decisiones quirúrgicas o tratamientos de cáncer.',
        preCare: 'Ayuno de 4 a 6 horas. Examen de Creatinina reciente (función renal). Hidratación previa.',
        postCare: 'Tomar 2 litros de agua las siguientes 24 horas para eliminar el contraste por la orina.'
    },
    'resonancia': {
        name: 'Resonancia Magnética Nuclear (RMN)',
        category: 'Imagenología',
        description: 'Se introduce en un tubo largo que contiene un imán potente. Escuchará ruidos fuertes y repetitivos (se le darán audífonos). El estudio utiliza ondas magnéticas para crear imágenes, no radiación. Dura entre 20 y 45 minutos.',
        indications: 'Problemas de cerebro, médula espinal, articulaciones (rodilla, hombro), y tejidos blandos.',
        contraindications: 'Marcapasos cardiacos antiguos, clips metálicos en cerebro, esquirlas metálicas en ojos, claustrofobia severa.',
        risks: 'Calentamiento de tejidos (raro), desplazamiento de objetos metálicos si no se reportan. El ruido fuerte puede molestar.',
        benefits: 'La mejor calidad de imagen para tejidos blandos sin usar radiación dañina.',
        preCare: 'Retirar TODO objeto metálico, tarjetas de crédito, joyas. Informar si tiene tatuajes recientes.',
        postCare: 'Ninguno.'
    },

    // --- PROCEDIMIENTOS DE CONSULTORIO ---
    'inyeccion_im': {
        name: 'Aplicación de Inyección Intramuscular',
        category: 'Procedimiento Ambulatorio',
        description: 'Se selecciona el sitio de inyección (glúteo o deltoides) y se limpia con alcohol. Se introduce la aguja en el músculo en un ángulo de 90 grados. Se aspira para asegurar no estar en vaso sanguíneo y se inyecta el medicamento lentamente.',
        indications: 'Administración de medicamentos que requieren absorción rápida o no se pueden tomar oralmente.',
        contraindications: 'Alergia conocida al medicamento. Infección en el sitio de inyección.',
        risks: 'Dolor en el sitio, moretón, endurecimiento, lesión del nervio ciático (raro), reacción alérgica al fármaco.',
        benefits: 'Efecto rápido del medicamento para aliviar dolor, infección o controlar síntomas agudos.',
        preCare: 'Informar alergias a medicamentos. Relajar el músculo.',
        postCare: 'Vigilar reacciones en la piel o dificultad para respirar.'
    },
    'curacion_heridas': {
        name: 'Curación de Heridas / Quemaduras Leves',
        category: 'Procedimiento Ambulatorio',
        description: 'Se retiran vendajes previos. Se lava la herida con solución estéril y jabón quirúrgico para remover tejido muerto, bacterias y suciedad. Se aplica antiséptico o medicamento tópico y se cubre con un vendaje limpio.',
        indications: 'Heridas quirúrgicas, úlceras, raspones o quemaduras que requieren limpieza.',
        contraindications: 'Heridas que requieren cirugía mayor para limpieza profunda.',
        risks: 'Dolor durante el procedimiento, sangrado leve. Si no se cuida, riesgo de reinfección.',
        benefits: 'Acelera la cicatrización, previene infecciones graves y complicaciones, mejora el aspecto estético final de la herida.',
        preCare: 'Tomar analgésico previo si la herida es muy dolorosa.',
        postCare: 'Mantener el vendaje limpio y seco. Vigilar si hay pus, calor o enrojecimiento excesivo.'
    },
    'sutura': {
        name: 'Sutura de Heridas (Cierre con Puntos)',
        category: 'Procedimiento Ambulatorio',
        description: 'Se realiza asepsia exhaustiva de la herida. Se infiltra anestesia local en los bordes. Una vez dormida la zona, se unen los bordes de la piel utilizando hilo quirúrgico y aguja, realizando nudos para mantenerla cerrada.',
        indications: 'Cortes profundos que no cierran por sí solos y requieren afrontamiento de bordes.',
        contraindications: 'Heridas muy sucias, infectadas o con mucho tiempo de evolución (riesgo de atrapar bacterias).',
        risks: 'Infección, apertura de la herida (dehiscencia), cicatriz visible o abultada, dolor.',
        benefits: 'Detiene el sangrado, acelera la curación, reduce el riesgo de infección y mejora el resultado estético de la cicatriz.',
        preCare: 'Informar si es alérgico a la anestesia local (lidocaína).',
        postCare: 'No mojar la herida 24 horas. Limpieza diaria suave. Retiro de puntos en 7-10 días.'
    },
    'retiro_puntos': {
        name: 'Retiro de Puntos de Sutura',
        category: 'Procedimiento Ambulatorio',
        description: 'Se limpia la cicatriz con antiséptico. Se corta cada hilo de sutura cerca de la piel y se jala suavemente para extraerlo. Se verifica que la herida esté bien cerrada.',
        indications: 'Herida ya cicatrizada (generalmente 7-14 días después de la sutura).',
        contraindications: 'Herida abierta, infectada o que no ha cerrado bien (dehiscencia).',
        risks: 'Pequeña molestia, que la herida se abra si no estaba lista (raro).',
        benefits: 'Evita que el material de sutura se encarne, reduce marcas en la piel y completa el proceso de curación.',
        preCare: 'Mantener la zona limpia.',
        postCare: 'Hidratar la piel, usar protector solar en la cicatriz para que no se oscurezca.'
    },
    'lavado_otico': {
        name: 'Lavado Ótico (Extracción de Cerumen)',
        category: 'Procedimiento Ambulatorio',
        description: 'Se utiliza una jeringa especial con agua tibia. Se irriga el conducto auditivo suavemente para desalojar y extraer el tapón de cerumen por flujo de agua. Se revisa el oído al final para asegurar limpieza.',
        indications: 'Tapón de cerumen que causa sordera, dolor o zumbido.',
        contraindications: 'Perforación del tímpano (conocida o sospechada), dolor severo o infección activa (otitis).',
        risks: 'Mareo o vértigo temporal (por cambio de temperatura), dolor leve, otitis externa (infección por humedad), perforación (muy raro).',
        benefits: 'Recuperación inmediata de la audición y alivio de la sensación de oído tapado.',
        preCare: 'Haber aplicado gotas ablandadoras días previos facilita el procedimiento.',
        postCare: 'Mantener el oído seco. No introducir cotonetes ni objetos.'
    },
    'lavado_oftalmico': {
        name: 'Lavado Oftálmico / Retiro de Cuerpo Extraño',
        category: 'Procedimiento Ambulatorio',
        description: 'Se aplican gotas de anestesia local en el ojo. Se irriga con solución fisiológica estéril o se utiliza un hisopo/aguja estéril para retirar con precisión el objeto extraño de la superficie del ojo bajo magnificación.',
        indications: 'Basura, polvo, químico o rebaba superficial en el ojo.',
        contraindications: 'Herida penetrante en el globo ocular (requiere cirugía mayor).',
        risks: 'Raspón en la córnea (úlcera) que requiere parche, infección si no se usan gotas.',
        benefits: 'Alivio inmediato del dolor y prevención de daño permanente a la visión por químicos o rasguños.',
        preCare: 'Se aplicarán gotas de anestesia para quitar el dolor.',
        postCare: 'Usar parche o lentes oscuros y antibiótico según receta. No tallarse el ojo.'
    },
    'onice_ctomia': {
        name: 'Matricectomía / Retiro de Uña Encarnada',
        category: 'Procedimiento Ambulatorio',
        description: 'Se aplica anestesia local en la base del dedo (bloqueo digital). Se corta y extrae la porción de uña enterrada en la piel. Puede aplicarse un químico en la raíz para evitar que esa parte vuelva a crecer (matricectomía).',
        indications: 'Uña enterrada recurrente con dolor o infección que no mejora.',
        contraindications: 'Mala circulación severa en el pie (pie diabético descontrolado) requiere valoración especial.',
        risks: 'Dolor al pasar la anestesia, infección, que la uña vuelva a crecer (recurrencia), deformidad estética de la uña.',
        benefits: 'Alivio definitivo del dolor e infección crónica. Permite usar calzado cómodamente y caminar sin dolor.',
        preCare: 'Se aplicará anestesia local en el dedo (bloqueo).',
        postCare: 'Reposo relativo del pie, usar sandalias, analgésicos y antibióticos según receta.'
    },
    'sonda_vesical': {
        name: 'Colocación de Sonda Vesical (Foley)',
        category: 'Procedimiento Ambulatorio',
        description: 'Previo aseo genital estéril y uso de gel lubricante anestésico, se introduce una sonda flexible a través de la uretra hasta la vejiga. Se infla un pequeño globo interno para fijarla y se conecta a una bolsa recolectora.',
        indications: 'Imposibilidad para orinar (retención), control estricto de líquidos, cirugías.',
        contraindications: 'Golpe o trauma en la uretra con sangrado.',
        risks: 'Infección urinaria, molestia o ardor, lesión de la uretra (sangrado leve).',
        benefits: 'Vacia la vejiga aliviando el dolor por retención. Permite medir exactamente la función renal.',
        preCare: 'Aseo genital.',
        postCare: 'Mantener la bolsa colectora siempre por debajo de la cintura para evitar reflujo de orina.'
    },
    'sonda_nasogastrica': {
        name: 'Colocación de Sonda Nasogástrica',
        category: 'Procedimiento Ambulatorio',
        description: 'Se lubrica una sonda delgada y se introduce por la nariz. Se le pedirá que trague agua para facilitar el paso hacia el esófago y estómago. Se verifica su posición aspirando contenido gástrico.',
        indications: 'Vaciar el estómago por intoxicación, obstrucción intestinal, o para alimentar a pacientes que no pueden tragar.',
        contraindications: 'Fractura de nariz o base de cráneo, varices en el esófago con riesgo de sangrado.',
        risks: 'Sangrado nasal (epistaxis), sensación de ahogo o vómito al colocarla, colocación en pulmón (se verifica para evitarlo).',
        benefits: 'Alivia la distensión abdominal, previene vómito peligroso o permite nutrición esencial.',
        preCare: 'Explicación del procedimiento (es molesto pero rápido).',
        postCare: 'Fijación en la nariz. No jalar la sonda.'
    },
    'drenaje_absceso': {
        name: 'Drenaje de Absceso (Colección de Pus)',
        category: 'Procedimiento Ambulatorio',
        description: 'Se realiza asepsia y se infiltra anestesia local (o sedación si es grande). Se realiza una incisión con bisturí sobre la zona fluctuante para permitir la salida de pus. Se lava la cavidad y se deja un drenaje o mecha si es necesario.',
        indications: 'Infección acumulada bajo la piel que duele y tiene pus.',
        contraindications: 'Abscesos muy profundos o cerca de estructuras vitales (cuello/cara) pueden requerir quirófano.',
        risks: 'Dolor al aplicar anestesia (el ácido de la infección bloquea el efecto), sangrado, que se vuelva a llenar.',
        benefits: 'Alivio inmediato de la presión y dolor. Permite que los antibióticos funcionen y cure la infección.',
        preCare: 'Anestesia local.',
        postCare: 'Lavados diarios de la herida abierta para que cierre de adentro hacia afuera.'
    },
    'extraccion_dental': {
        name: 'Extracción Dental Simple',
        category: 'Procedimiento Ambulatorio',
        description: 'Se aplica anestesia local. Se utiliza instrumental para aflojar el diente de la encía y hueso. Se extrae el diente con fórceps. Se coloca una gasa para detener el sangrado.',
        indications: 'Diente con caries muy extensa, movilidad por enfermedad de encías, indicación de ortodoncia.',
        contraindications: 'Infección aguda severa (absceso no controlado), problemas de coagulación, radioterapia reciente en mandíbula.',
        risks: 'Dolor, inflamación, alveolitis (dolor seco si se pierde el coágulo), daño a dientes vecinos.',
        benefits: 'Elimina foco de infección y dolor crónico.',
        preCare: 'Comer bien antes (no podrá comer bien después).',
        postCare: 'Morder gasa 30 min. Dieta fría y blanda. No usar popote/pajilla ni escupir.'
    },

    // --- PROCEDIMIENTOS INVASIVOS (ENDOSCOPIA) ---
    'endoscopia': {
        name: 'Panendoscopia Oral (Endoscopia Digestiva Alta)',
        category: 'Procedimiento Invasivo',
        description: 'Bajo sedación (dormido), se introduce un tubo flexible con cámara por la boca. Se revisa esófago, estómago y duodeno. Se pueden tomar biopsias si se encuentran lesiones.',
        indications: 'Gastritis severa, reflujo, sospecha de úlceras o cáncer, sangrado digestivo.',
        contraindications: 'Perforación intestinal conocida, infarto reciente, crisis respiratoria.',
        risks: 'Dolor de garganta, perforación (muy raro), sangrado si se toma biopsia, reacción a la sedación.',
        benefits: 'Permite VER directamente el esófago y estómago para un diagnóstico exacto. Permite tomar muestras (biopsias) o detener sangrados sin cirugía abierta.',
        preCare: 'Ayuno absoluto de 8 horas (ni agua). Ir acompañado.',
        postCare: 'No conducir ni operar maquinaria por 12 horas (efecto sedante). Dieta blanda fría.'
    },
    'colonoscopia': {
        name: 'Colonoscopia Total',
        category: 'Procedimiento Invasivo',
        description: 'Bajo sedación, se introduce un tubo flexible con cámara por el recto para revisar todo el intestino grueso (colon). Se infla con aire para visualizar mejor. Si hay pólipos, se pueden retirar en el momento.',
        indications: 'Sangrado rectal, diarrea crónica, prevención de cáncer de colon (pólipos).',
        contraindications: 'Perforación intestinal, ataque cardiaco reciente, diverticulitis aguda grave.',
        risks: 'Perforación del intestino (raro), sangrado si se quitan pólipos, reacción a la sedación.',
        benefits: 'Es el mejor método para detectar y prevenir cáncer de colon al quitar lesiones antes de que se vuelvan malignas.',
        preCare: 'Limpieza intestinal completa con laxantes el día anterior (dieta líquida).',
        postCare: 'Gases y cólicos leves. No conducir por 12 horas.'
    },
    
    // --- CIRUGÍA MAYOR Y HOSPITALIZACIÓN ---
    'ingreso_hospitalario': {
        name: 'Consentimiento de Ingreso Hospitalario',
        category: 'Ingreso Hospitalario',
        description: 'Implica su admisión en una cama hospitalaria para monitoreo continuo, administración de medicamentos intravenosos y cuidados de enfermería especializados las 24 horas.',
        indications: 'Su condición de salud requiere vigilancia continua, medicamentos por vena o procedimientos que no pueden hacerse en casa.',
        contraindications: 'Padecimientos que pueden tratarse de forma segura en casa.',
        risks: 'Infecciones intrahospitalarias, caídas, úlceras por estar en cama, estrés.',
        benefits: 'Atención profesional 24/7, respuesta inmediata ante complicaciones, administración de tratamientos potentes para recuperar la salud.',
        preCare: 'Registro administrativo y colocación de brazalete de identificación.',
        postCare: 'Plan de alta y cuidados en domicilio al mejorar.'
    },
    'anestesia_general': {
        name: 'Anestesia General',
        category: 'Anestesia (General/Regional)',
        description: 'Se administran medicamentos por la vena y gases inhalados para inducir un estado de sueño profundo e inconsciencia. Se coloca un tubo respiratorio para asegurar su respiración durante la cirugía. Usted no sentirá ni recordará nada.',
        indications: 'Cirugías mayores donde se requiere que el paciente esté totalmente dormido y sin dolor.',
        contraindications: 'Problemas graves de vía aérea no previstos, alergia a anestésicos.',
        risks: 'Náusea/vómito al despertar, dolor de garganta, daño dental (raro), complicaciones cardiacas o respiratorias.',
        benefits: 'Permite realizar cirugías complejas sin que usted sienta dolor ni recuerde el procedimiento, garantizando su inmovilidad y seguridad.',
        preCare: 'Ayuno estricto (la comida en el estómago puede irse a los pulmones). Retirar dentaduras postizas.',
        postCare: 'Vigilancia en sala de recuperación hasta que despierte completamente.'
    },
    'bloqueo_regional': {
        name: 'Bloqueo Regional (Raquídea/Epidural)',
        category: 'Anestesia (General/Regional)',
        description: 'Se limpia la espalda y se aplica anestesia local. Se introduce una aguja fina entre las vértebras lumbares para depositar anestésico cerca de los nervios. Esto adormece de la cintura para abajo temporalmente. Usted permanecerá despierto pero sin dolor.',
        indications: 'Cirugías de piernas, cadera, hernias, cesáreas, parto.',
        contraindications: 'Infección en la espalda, problemas de coagulación, tatuaje reciente en sitio de punción.',
        risks: 'Dolor de cabeza intenso (cefalea post-punción), bajada de presión arterial, dolor de espalda temporal.',
        benefits: 'Permite estar despierto sin dolor, evita riesgos de anestesia general en pulmones, excelente control del dolor post-cirugía.',
        preCare: 'Hidratación por vena.',
        postCare: 'Recuperar movilidad de piernas poco a poco. Orinar antes de ir a casa.'
    },
    'apendicectomia': {
        name: 'Apendicectomía (Extracción de Apéndice)',
        category: 'Cirugía Mayor / Invasiva',
        description: 'Bajo anestesia, se realiza una incisión en el abdomen (o pequeñas incisiones si es laparoscopía). Se localiza el apéndice inflamado, se liga su base y se extrae. Se lava la cavidad y se cierra la herida.',
        indications: 'Apendicitis aguda (infección del apéndice).',
        contraindications: 'Rara vez, si hay un absceso plastronado se prefiere antibiótico primero.',
        risks: 'Infección de la herida, absceso dentro del abdomen, neumonía, riesgos generales de anestesia.',
        benefits: 'Cura la enfermedad y evita que el apéndice se reviente (peritonitis), lo cual es mortal.',
        preCare: 'Ayuno, antibióticos.',
        postCare: 'Caminar pronto, dieta progresiva.'
    },
    'cesarea': {
        name: 'Cesárea (Operación Cesárea)',
        category: 'Cirugía Mayor / Invasiva',
        description: 'Bajo bloqueo regional (epidural/raquídeo), se realiza una incisión en el abdomen inferior y en el útero. Se extrae al bebé y la placenta. Se revisa y cierra el útero y la pared abdominal por capas.',
        indications: 'Cuando el parto natural no es posible o seguro para la madre o el bebé.',
        contraindications: 'Cuando el parto vaginal es más seguro y no hay indicación médica.',
        risks: 'Sangrado mayor que en parto, infección de la herida, lesión a vejiga/intestino, coágulos en piernas, recuperación más lenta.',
        benefits: 'Salvar la vida o salud del bebé y la madre ante complicaciones. Nacimiento controlado.',
        preCare: 'Ayuno, rasurado de la zona incisional, colocación de sonda urinaria.',
        postCare: 'Caminar lo antes posible para evitar coágulos. Cuidado de la herida quirúrgica.'
    },
    'parto': {
        name: 'Atención de Parto Vaginal',
        category: 'Cirugía Mayor / Invasiva',
        description: 'Asistencia médica durante el trabajo de parto. Se monitorea al bebé y las contracciones. Se asiste la salida del bebé y la placenta. De ser necesario, se realiza un corte pequeño (episiotomía) que luego se sutura.',
        indications: 'Embarazo a término en trabajo de parto.',
        contraindications: 'Placenta previa, bebé en posición transversa, sufrimiento fetal agudo.',
        risks: 'Desgarros vaginales, hemorragia, necesidad de fórceps o cesárea de emergencia.',
        benefits: 'Recuperación más rápida que la cesárea, menor riesgo de infección y complicaciones respiratorias para el bebé.',
        preCare: 'Vigilancia de contracciones.',
        postCare: 'Vigilancia de sangrado y útero.'
    },
    'legrado': {
        name: 'Legrado Uterino Instrumentado (LUI)',
        category: 'Cirugía Mayor / Invasiva',
        description: 'Bajo sedación o bloqueo, se dilata el cuello del útero y se introduce una legra (instrumento en forma de cuchara) para raspar y limpiar suavemente el interior del útero, removiendo tejido remanente.',
        indications: 'Hemorragia uterina, aborto incompleto, toma de muestras del útero.',
        contraindications: 'Infección pélvica activa, embarazo deseado viable.',
        risks: 'Perforación del útero, sangrado, infección, cicatrices internas (Síndrome de Asherman).',
        benefits: 'Detiene el sangrado peligroso, limpia el útero para prevenir infecciones graves, ayuda al diagnóstico.',
        preCare: 'Ayuno.',
        postCare: 'Reposo relativo, no relaciones sexuales por un tiempo, vigilar fiebre o mal olor.'
    },
    'catarata': {
        name: 'Cirugía de Catarata (Facoemulsificación)',
        category: 'Cirugía Mayor / Invasiva',
        description: 'Se anestesia el ojo con gotas. Se realiza una microincisión. Se utiliza ultrasonido para disolver y aspirar el lente opaco (catarata). Se introduce un lente intraocular artificial transparente. Generalmente no requiere puntos.',
        indications: 'Visión borrosa por opacidad del lente natural del ojo.',
        contraindications: 'Infección ocular activa.',
        risks: 'Infección dentro del ojo (endoftalmitis - grave pero raro), desprendimiento de retina, necesidad de lentes posteriores.',
        benefits: 'Recuperación de la visión clara y colores vivos. Procedimiento rápido y ambulatorio.',
        preCare: 'Gotas antibióticas previas.',
        postCare: 'Uso de gotas por varias semanas, no cargar peso, no tallar el ojo.'
    },
    'salpingoclasia': {
        name: 'Salpingoclasia (Ligadura de Trompas)',
        category: 'Salpingoclasia / Vasectomía',
        description: 'Bajo anestesia, se accede a las trompas de Falopio (por el ombligo tras el parto o por incisión pequeña). Se cortan, ligan o cauterizan ambas trompas para impedir el encuentro entre óvulo y espermatozoide.',
        indications: 'Mujeres que están seguras de no querer tener más hijos (Anticoncepción definitiva).',
        contraindications: 'Duda sobre el deseo futuro de embarazo. Embarazo actual no resuelto.',
        risks: 'Arrepentimiento futuro, fallo del método (embarazo ectópico o normal, muy raro), riesgos quirúrgicos generales.',
        benefits: 'Anticoncepción permanente y muy efectiva. Elimina la preocupación por embarazos no deseados. No afecta las hormonas ni la menstruación.',
        preCare: 'Ayuno y firma de consentimiento con periodo de reflexión.',
        postCare: 'Reposo relativo una semana. Cuidado de la herida.'
    },
    'amputacion': {
        name: 'Amputación de Extremidad',
        category: 'Amputación / Mutilación',
        description: 'Bajo anestesia general o regional, se realiza una incisión quirúrgica para remover la parte del cuerpo afectada (dedo, pie, pierna). Se corta hueso y tejido, se controlan los vasos sanguíneos y se forma un muñón con músculo y piel para futura prótesis.',
        indications: 'Tejido muerto (gangrena), infección incontrolable que amenaza la vida, trauma severo no reconstruible, cáncer.',
        contraindications: 'Si existe posibilidad real de salvar la extremidad y su función.',
        risks: 'Infección del muñón, dolor fantasma (sentir la parte que ya no está), depresión, problemas de cicatrización.',
        benefits: 'Salvar la vida del paciente al eliminar una fuente de infección letal o cáncer. Aliviar dolor intratable de un miembro sin función.',
        preCare: 'Valoración psicológica y antibióticos.',
        postCare: 'Rehabilitación física y uso de prótesis cuando sea posible.'
    },
    'transfusion': {
        name: 'Transfusión Sanguínea',
        category: 'Procedimiento Alto Riesgo',
        description: 'Se coloca un acceso venoso seguro. Se verifica la compatibilidad de la sangre donada con la suya. Se administra la sangre lentamente al inicio bajo vigilancia estricta para detectar reacciones, luego se pasa el resto de la unidad.',
        indications: 'Anemia grave, pérdida de sangre por cirugía o accidente, problemas de coagulación.',
        contraindications: 'Rechazo por motivos religiosos (Testigos de Jehová), salvo orden judicial en menores.',
        risks: 'Reacción alérgica (fiebre, ronchas), sobrecarga de líquidos, infección (riesgo extremadamente bajo hoy día).',
        benefits: 'Salva la vida al reponer la sangre necesaria para llevar oxígeno al cerebro y corazón.',
        preCare: 'Pruebas de cruce para asegurar compatibilidad.',
        postCare: 'Vigilancia de temperatura y presión arterial.'
    }
};

const CONSENT_TYPES = [
    'Ingreso Hospitalario',
    'Cirugía Mayor / Invasiva',
    'Anestesia (General/Regional)',
    'Salpingoclasia / Vasectomía',
    'Donación de Órganos/Tejidos',
    'Investigación Clínica',
    'Necropsia Hospitalaria',
    'Procedimiento Alto Riesgo',
    'Amputación / Mutilación',
    'Teleconsulta Especializada',
    'Procedimiento Ambulatorio',
    'Servicios Auxiliares (Lab/Imagen)',
    'Planificación Familiar',
    'Administrativo / Legal',
    'Consulta Externa',
    'Imagenología',
    'Auxiliares Diagnósticos'
];

const InformedConsent: React.FC<InformedConsentProps> = ({ patients, onSaveNote, doctorInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // States
  const [templateSearch, setTemplateSearch] = useState('');
  const [isEmergencyContext, setIsEmergencyContext] = useState(false); 

  // Fecha Actual y Lugar Vinculado
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timeStr = today.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  
  // Construcción de la ubicación vinculada al establecimiento
  const establishmentLocation = doctorInfo 
    ? `${doctorInfo.hospital}, ${doctorInfo.address}` 
    : 'Hospital General San Rafael, Ciudad de México';

  const [form, setForm] = useState({
    consentType: 'Cirugía Mayor / Invasiva',
    institution: doctorInfo?.hospital || 'Hospital General San Rafael / MedExpediente MX',
    location: establishmentLocation,
    date: dateStr,
    time: timeStr,
    
    // El Acto Médico
    authorizedAct: '',
    procedureDescription: '', // Description field in form state
    indications: '',
    contraindications: '',
    
    // Riesgos y Beneficios
    risks: '',
    benefits: '',
    generalCare: '', 
    
    // Cláusulas Legales
    contingencyAuth: true, 
    tissueDisposalAuth: true, 
    teachingAuth: false, 
    
    // Participantes
    doctorInforming: doctorInfo?.name || 'Dr. Alejandro Méndez',
    cedulaInforming: doctorInfo?.cedula || '12345678',
    witness1Name: '',
    witness2Name: '',
    
    // En caso de Incapacidad (Emergency Mode)
    secondDoctorName: '', 
    secondDoctorCedula: '',
    responsibleName: '', 
    responsibleRelation: ''
  });

  const [isSigned, setIsSigned] = useState({
    patient: false, 
    doctor: true,
    secondDoctor: false, 
    witness1: false,
    witness2: false
  });

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
      const term = templateSearch.toLowerCase();
      return Object.entries(PROCEDURE_CATALOG).filter(([key, val]) => 
          val.name.toLowerCase().includes(term) || 
          val.category.toLowerCase().includes(term)
      );
  }, [templateSearch]);

  // Efecto para actualizar datos si doctorInfo cambia
  useEffect(() => {
      if (doctorInfo) {
          setForm(prev => ({
              ...prev,
              institution: doctorInfo.hospital,
              location: `${doctorInfo.hospital}, ${doctorInfo.address}`,
              doctorInforming: doctorInfo.name,
              cedulaInforming: doctorInfo.cedula
          }));
      }
  }, [doctorInfo]);

  useEffect(() => {
     if (patient && form.responsibleName === '') {
         setForm(prev => ({...prev, responsibleName: patient.name, responsibleRelation: 'PACIENTE (MISMO)'}));
     }
  }, [patient]);

  const loadProcedureTemplate = (key: string) => {
      const template = PROCEDURE_CATALOG[key];
      if (template) {
          setForm(prev => ({
              ...prev,
              consentType: template.category, // Auto-select category
              authorizedAct: template.name,
              procedureDescription: template.description, // Load description
              indications: template.indications,
              contraindications: template.contraindications,
              risks: template.risks,
              benefits: template.benefits,
              generalCare: `PREVIO: ${template.preCare}\nPOSTERIOR: ${template.postCare}`
          }));
          setTemplateSearch(''); // Clear search after selection
      }
  };

  const handleSave = () => {
    if (!form.authorizedAct || !form.risks || !form.benefits) {
      alert("Es obligatorio detallar el Acto Autorizado, sus Riesgos y Beneficios.");
      return;
    }

    if (isEmergencyContext) {
        if (!form.secondDoctorName && !form.responsibleName) {
             alert("En caso de incapacidad, se requiere la firma de un familiar responsable O de un segundo médico que avale la urgencia (Art. 81 LGS).");
             return;
        }
    } else {
        if (!isSigned.patient) {
            alert("Falta la firma del paciente o responsable legal.");
            return;
        }
    }

    const newNote: ClinicalNote = {
      id: `CONS-${Date.now()}`,
      patientId: patient!.id,
      type: `Consentimiento: ${form.consentType}`,
      date: new Date().toLocaleString('es-MX'),
      author: form.doctorInforming,
      content: { ...form, isEmergencyContext },
      isSigned: true,
      hash: `CERT-CONS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    onSaveNote(newNote);
    navigate(`/patient/${id}`);
  };

  if (!patient) return null;

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white border-b-8 border-slate-900 p-8 rounded-t-[3.5rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consentimiento Informado</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center">
               <ShieldCheck size={12} className="text-emerald-500 mr-2" /> NOM-004-SSA3-2012 • Legal
            </p>
          </div>
        </div>
        <div className="flex gap-2">
             <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm"><Printer size={20} /></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden print:shadow-none print:border-none">
        
        {/* Document Header (Formal) */}
        <div className="p-12 border-b border-slate-100 bg-slate-50/30 space-y-8">
           <div className="flex justify-between items-start">
              <div className="space-y-2">
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter max-w-xl">{form.institution}</h2>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Carta de Consentimiento Bajo Información</p>
              </div>
              <div className="text-right space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expediente</p>
                 <p className="text-lg font-black text-blue-600">{patient.id}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Tipo de Evento</label>
                  <select 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none"
                    value={form.consentType}
                    onChange={e => setForm({...form, consentType: e.target.value})}
                  >
                      {CONSENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase">Lugar y Fecha de Emisión</label>
                   <p className="p-3 bg-slate-100 rounded-xl text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                      <MapPin size={10} className="inline mr-1"/> {form.location} • {form.date} {form.time}
                   </p>
               </div>
               <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase">Paciente</label>
                   <p className="p-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase truncate">{patient.name}</p>
               </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-12 space-y-12">
           
           {/* SECTION 1: PROCEDIMIENTO Y CARGA RÁPIDA */}
           <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Activity size={16} /></div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">I. Acto Médico Autorizado</h3>
                 </div>
                 
                 {/* BUSCADOR DE PLANTILLAS MEJORADO */}
                 <div className="relative group no-print w-96">
                     <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                        <Search size={14} className="text-slate-400"/>
                        <input 
                            className="bg-transparent text-[10px] font-bold uppercase outline-none w-full placeholder:text-slate-400"
                            placeholder="Buscar Plantilla (ej. Implante, Sonda, Rayos X)..."
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                        />
                     </div>
                     {/* DROPDOWN RESULTS */}
                     <div className="absolute right-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 max-h-80 overflow-y-auto custom-scrollbar hidden group-focus-within:block hover:block">
                        {filteredTemplates.length > 0 ? filteredTemplates.map(([key, val]) => (
                            <button key={key} onClick={() => loadProcedureTemplate(key)} className="w-full text-left p-3 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase block border-b border-slate-50 last:border-0 group/item">
                                <span className="block truncate text-slate-800">{val.name}</span>
                                <span className="text-[8px] text-blue-400 font-medium">{val.category}</span>
                            </button>
                        )) : (
                            <div className="p-4 text-center text-[9px] text-slate-400 font-bold uppercase">No se encontraron plantillas</div>
                        )}
                     </div>
                 </div>
              </div>

              <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombre del Procedimiento / Intervención</label>
                     <input 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-blue-500 transition-all"
                        placeholder="Escriba el nombre técnico completo..."
                        value={form.authorizedAct}
                        onChange={e => setForm({...form, authorizedAct: e.target.value})}
                     />
                  </div>
                  
                  {/* NUEVA SECCIÓN DE DESCRIPCIÓN DEL PROCEDIMIENTO */}
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-indigo-600 uppercase ml-1 flex items-center gap-1">
                          <BookOpen size={10} /> Descripción del Procedimiento (¿En qué consiste?)
                      </label>
                      <textarea 
                         className="w-full p-6 bg-indigo-50/20 border border-indigo-100 rounded-2xl h-24 text-xs font-medium resize-none outline-none text-slate-700"
                         placeholder="Explique brevemente los pasos principales al paciente (ej. anestesia, incisión, cierre)..."
                         value={form.procedureDescription}
                         onChange={e => setForm({...form, procedureDescription: e.target.value})}
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Indicaciones (Justificación)</label>
                          <textarea 
                             className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none"
                             value={form.indications}
                             onChange={e => setForm({...form, indications: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Contraindicaciones Consideradas</label>
                          <textarea 
                             className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-24 text-xs font-medium resize-none outline-none"
                             value={form.contraindications}
                             onChange={e => setForm({...form, contraindications: e.target.value})}
                          />
                      </div>
                  </div>
              </div>
           </section>

           {/* SECTION 2: RIESGOS, BENEFICIOS Y CUIDADOS */}
           <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><AlertOctagon size={16} /></div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">II. Riesgos, Beneficios y Cuidados</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Riesgos y Complicaciones Potenciales</label>
                    <textarea 
                        className="w-full p-5 bg-amber-50/30 border border-amber-100 rounded-2xl h-32 text-xs font-medium text-slate-700 outline-none resize-none"
                        placeholder="Mencione riesgos típicos, atípicos y personalizados..."
                        value={form.risks}
                        onChange={e => setForm({...form, risks: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Beneficios Esperados</label>
                        <textarea 
                            className="w-full p-5 bg-emerald-50/30 border border-emerald-100 rounded-2xl h-24 text-xs font-medium resize-none outline-none"
                            value={form.benefits}
                            onChange={e => setForm({...form, benefits: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cuidados Generales (Pre y Post)</label>
                        <textarea 
                            className="w-full p-5 bg-blue-50/30 border border-blue-100 rounded-2xl h-24 text-xs font-medium resize-none outline-none"
                            value={form.generalCare}
                            onChange={e => setForm({...form, generalCare: e.target.value})}
                        />
                    </div>
                 </div>
              </div>
           </section>

           {/* SECTION 3: CLÁUSULAS LEGALES */}
           <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <Lock size={12}/> Declaraciones Legales
              </h4>
              <div className="space-y-4">
                  <label className="flex items-start gap-4 cursor-pointer group">
                      <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.contingencyAuth ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300'}`}>
                          {form.contingencyAuth && <CheckCircle2 size={14}/>}
                      </div>
                      <input type="checkbox" className="hidden" checked={form.contingencyAuth} onChange={() => setForm({...form, contingencyAuth: !form.contingencyAuth})} />
                      <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                          <strong>ATENCIÓN DE CONTINGENCIAS:</strong> Autorizo al equipo médico a atender cualquier contingencia o urgencia derivada del acto autorizado, realizando los procedimientos adicionales necesarios para preservar la vida o función, respetando el principio de libertad prescriptiva.
                      </p>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group">
                      <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.tissueDisposalAuth ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300'}`}>
                          {form.tissueDisposalAuth && <CheckCircle2 size={14}/>}
                      </div>
                      <input type="checkbox" className="hidden" checked={form.tissueDisposalAuth} onChange={() => setForm({...form, tissueDisposalAuth: !form.tissueDisposalAuth})} />
                      <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                          <strong>DISPOSICIÓN DE TEJIDOS:</strong> Autorizo al establecimiento para disponer de los tejidos, órganos o piezas anatómicas extraídas con fines de estudio histopatológico y su posterior disposición final conforme a la norma sanitaria.
                      </p>
                  </label>

                  {/* SPECIAL CLAUSE FOR AMPUTATION OR MUTILATION */}
                  {(form.authorizedAct.toLowerCase().includes('amputa') || form.consentType.includes('Mutilación')) && (
                      <div className="p-4 bg-rose-100 border border-rose-200 rounded-xl">
                          <p className="text-[10px] font-bold text-rose-800 uppercase text-justify">
                              <AlertTriangle className="inline mr-2" size={12}/>
                              CLÁUSULA ESPECIAL: Estoy plenamente consciente de que el procedimiento implica la pérdida permanente de una extremidad o parte del cuerpo (MUTILACIÓN), con las consecuencias funcionales y estéticas que ello conlleva.
                          </p>
                      </div>
                  )}
              </div>
           </section>

           {/* SECTION 4: FIRMAS Y TESTIGOS (CON MODO EMERGENCIA) */}
           <section className="pt-8 border-t border-slate-100 no-print">
              
              {/* EMERGENCY TOGGLE */}
              <div className="flex justify-end mb-8">
                  <button 
                    onClick={() => setIsEmergencyContext(!isEmergencyContext)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all ${isEmergencyContext ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                  >
                      {isEmergencyContext ? <AlertTriangle size={12}/> : <User size={12}/>}
                      {isEmergencyContext ? 'Modo Incapacidad / Urgencia (Art. 81 LGS)' : 'Consentimiento Estándar'}
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* FIRMA PACIENTE / RESPONSABLE */}
                  <div className="space-y-4 text-center">
                     <div 
                        onClick={() => setIsSigned({...isSigned, patient: !isSigned.patient})}
                        className={`h-32 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer transition-all ${isSigned.patient ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-blue-400'}`}
                     >
                        {isSigned.patient ? <CheckCircle2 size={32} className="text-emerald-600"/> : <PenTool size={24} className="text-slate-400"/>}
                     </div>
                     <div className="space-y-1">
                        <input 
                           className="w-full text-center bg-transparent border-b border-slate-200 text-xs font-black uppercase outline-none"
                           value={form.responsibleName}
                           onChange={e => setForm({...form, responsibleName: e.target.value})}
                           placeholder="Nombre del Paciente / Responsable"
                        />
                        <input 
                           className="w-full text-center bg-transparent border-none text-[9px] font-bold text-slate-400 uppercase outline-none"
                           value={form.responsibleRelation}
                           onChange={e => setForm({...form, responsibleRelation: e.target.value})}
                           placeholder="Parentesco (Si no es el paciente)"
                        />
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest pt-1">Autoriza el Procedimiento</p>
                     </div>
                  </div>

                  {/* FIRMA MÉDICO */}
                  <div className="space-y-4 text-center">
                     <div className="h-32 bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-slate-200">
                        <ShieldCheck size={32} className="text-slate-400"/>
                     </div>
                     <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-slate-900">{form.doctorInforming}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Cédula: {form.cedulaInforming}</p>
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest pt-1">Médico que Informa</p>
                     </div>
                  </div>
              </div>

              {/* TESTIGOS / SEGUNDO MÉDICO (SI EMERGENCIA) */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                  {isEmergencyContext ? (
                      <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 space-y-4">
                          <p className="text-[10px] font-black text-rose-800 uppercase text-center mb-4">
                              <AlertTriangle className="inline mr-2" size={12}/>
                              Validación por Segundo Médico (Ausencia de Responsable / Urgencia)
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                              <input className="w-full p-3 bg-white rounded-xl text-xs font-bold uppercase border border-rose-200" placeholder="Nombre 2do Médico" value={form.secondDoctorName} onChange={e => setForm({...form, secondDoctorName: e.target.value})} />
                              <input className="w-full p-3 bg-white rounded-xl text-xs font-bold uppercase border border-rose-200" placeholder="Cédula" value={form.secondDoctorCedula} onChange={e => setForm({...form, secondDoctorCedula: e.target.value})} />
                          </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase ml-2">Testigo 1</p>
                             <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs uppercase" placeholder="Nombre completo" value={form.witness1Name} onChange={e => setForm({...form, witness1Name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase ml-2">Testigo 2</p>
                             <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs uppercase" placeholder="Nombre completo" value={form.witness2Name} onChange={e => setForm({...form, witness2Name: e.target.value})} />
                          </div>
                      </div>
                  )}
              </div>
           </section>

           {/* PRINT SIGNATURES LAYOUT */}
           <section className="hidden print:block pt-10">
               <div className="grid grid-cols-2 gap-16 text-center mb-16">
                   <div>
                       <div className="border-b border-black mb-1"></div>
                       <p className="text-[10px] font-bold uppercase">{form.responsibleName}</p>
                       <p className="text-[8px] uppercase">{form.responsibleRelation}</p>
                   </div>
                   <div>
                       <div className="border-b border-black mb-1"></div>
                       <p className="text-[10px] font-bold uppercase">{form.doctorInforming}</p>
                       <p className="text-[8px] uppercase">Médico Tratante</p>
                   </div>
               </div>
               
               {isEmergencyContext ? (
                   <div className="text-center w-1/2 mx-auto">
                       <div className="border-b border-black mb-1"></div>
                       <p className="text-[10px] font-bold uppercase">{form.secondDoctorName}</p>
                       <p className="text-[8px] uppercase">Segundo Médico (Aval Urgencia)</p>
                   </div>
               ) : (
                   <div className="grid grid-cols-2 gap-16 text-center">
                       <div>
                           <div className="border-b border-black mb-1"></div>
                           <p className="text-[8px] uppercase">Testigo 1: {form.witness1Name}</p>
                       </div>
                       <div>
                           <div className="border-b border-black mb-1"></div>
                           <p className="text-[8px] uppercase">Testigo 2: {form.witness2Name}</p>
                       </div>
                   </div>
               )}
           </section>

        </div>

        {/* Footer Actions */}
        <div className="p-10 bg-slate-900 text-white flex justify-between items-center no-print">
           <div className="flex items-center gap-4">
              <Lock size={20} className="text-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Documento Médico Legal • NOM-004</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3"
              >
                 <Save size={18} /> Certificar Consentimiento
              </button>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, aside, button, select { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 2rem !important; width: 100% !important; left: 0 !important; top: 0 !important; }
          .max-w-5xl { max-width: 100% !important; }
          .bg-slate-50, .bg-slate-900 { background: #fff !important; color: #000 !important; }
          .border { border: 1px solid #000 !important; }
          input, textarea { border: none !important; border-bottom: 1px solid #000 !important; border-radius: 0 !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>
    </div>
  );
};

export default InformedConsent;
