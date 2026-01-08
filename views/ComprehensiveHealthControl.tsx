import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Activity, Baby, Heart, ShieldCheck, Ruler, Scale, 
  Syringe, FlaskConical, Calendar, User, Eye, Ear, Smile, Brain,
  Save, CheckCircle2, Clock, Info, Check, Plus, Lock, AlertTriangle,
  ClipboardList, BookOpen, MessageSquare, HeartHandshake, Leaf, Apple,
  Thermometer, FileText, TrendingUp, Accessibility, Target, Calculator,
  ChevronDown, ChevronUp, AlertCircle, ChevronRight, X, History as HistoryIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Patient, ClinicalNote, HealthControlRecord, PreventiveVisit, VaccineRecord, ScreeningRecord, PromotionTopic, GeriatricAssessment, AdolescentAssessment } from '../types';

// --- INTERFACES PARA EL MOTOR DE ESCALAS ---
interface ScaleOption {
    label: string;
    points: number;
}
interface ScaleQuestion {
    id: string;
    text: string;
    options: ScaleOption[];
}
interface MedicalScale {
    id: string;
    title: string;
    description: string;
    questions: ScaleQuestion[];
    interpret: (score: number) => { classification: string; color: string; risk: 'Bajo' | 'Medio' | 'Alto' };
}

// --- BASE DE CONOCIMIENTOS DE ESCALAS CLÍNICAS ---
const MEDICAL_SCALES: Record<string, MedicalScale> = {
    // --- SALUD MENTAL ---
    'PHQ-9': {
        id: 'PHQ-9',
        title: 'Cuestionario de Salud del Paciente (PHQ-9)',
        description: 'Tamizaje de Depresión. Frecuencia de síntomas en las últimas 2 semanas.',
        questions: [
            { id: '1', text: 'Poco interés o placer en hacer cosas', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '2', text: 'Se ha sentido decaído(a), deprimido(a) o sin esperanzas', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '3', text: 'Dificultad para dormir o permanecer dormido(a)', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '4', text: 'Se ha sentido cansado(a) o con poca energía', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '5', text: 'Sin apetito o ha comido en exceso', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '6', text: 'Se ha sentido mal con usted mismo(a)', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '7', text: 'Dificultad para concentrarse', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '8', text: 'Se mueve o habla tan despacio que los demás lo notan', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
            { id: '9', text: 'Pensamientos de que estaría mejor muerto(a)', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos los días', points:3}] },
        ],
        interpret: (score) => {
            if (score <= 4) return { classification: 'Mínima o Ausente', color: 'text-emerald-600', risk: 'Bajo' };
            if (score <= 9) return { classification: 'Depresión Leve', color: 'text-blue-600', risk: 'Bajo' };
            if (score <= 14) return { classification: 'Depresión Moderada', color: 'text-amber-600', risk: 'Medio' };
            if (score <= 19) return { classification: 'Depresión Moderadamente Severa', color: 'text-orange-600', risk: 'Alto' };
            return { classification: 'Depresión Severa', color: 'text-rose-600', risk: 'Alto' };
        }
    },
    'GAD-7': {
        id: 'GAD-7',
        title: 'Escala de Ansiedad Generalizada (GAD-7)',
        description: 'Tamizaje de Ansiedad. Frecuencia de síntomas en las últimas 2 semanas.',
        questions: [
            { id: '1', text: 'Sentirse nervioso, ansioso o con los nervios de punta', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos', points:3}] },
            { id: '2', text: 'No poder dejar de preocuparse o controlar la preocupación', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos', points:3}] },
            { id: '3', text: 'Preocuparse demasiado por diferentes cosas', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos', points:3}] },
            { id: '4', text: 'Dificultad para relajarse', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos', points:3}] },
            { id: '5', text: 'Estar tan inquieto que es difícil permanecer sentado', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos', points:3}] },
            { id: '6', text: 'Molestarse o irritarse fácilmente', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos', points:3}] },
            { id: '7', text: 'Tener miedo de que algo terrible vaya a pasar', options: [{label:'Nunca', points:0}, {label:'Varios días', points:1}, {label:'Más de la mitad', points:2}, {label:'Casi todos', points:3}] },
        ],
        interpret: (score) => {
            if (score <= 4) return { classification: 'Ansiedad Mínima', color: 'text-emerald-600', risk: 'Bajo' };
            if (score <= 9) return { classification: 'Ansiedad Leve', color: 'text-blue-600', risk: 'Bajo' };
            if (score <= 14) return { classification: 'Ansiedad Moderada', color: 'text-amber-600', risk: 'Medio' };
            return { classification: 'Ansiedad Severa', color: 'text-rose-600', risk: 'Alto' };
        }
    },
    // --- GERIATRÍA ---
    'KATZ': {
        id: 'KATZ',
        title: 'Índice de Katz (ABVD)',
        description: 'Evaluación de Actividades Básicas de la Vida Diaria.',
        questions: [
            { id: '1', text: 'Baño (Esponja, regadera o tina)', options: [{label:'Independiente', points:1}, {label:'Dependiente', points:0}] },
            { id: '2', text: 'Vestido (Prendas y calzado)', options: [{label:'Independiente', points:1}, {label:'Dependiente', points:0}] },
            { id: '3', text: 'Uso del sanitario', options: [{label:'Independiente', points:1}, {label:'Dependiente', points:0}] },
            { id: '4', text: 'Movilidad (Levantarse y acostarse)', options: [{label:'Independiente', points:1}, {label:'Dependiente', points:0}] },
            { id: '5', text: 'Continencia (Esfínteres)', options: [{label:'Independiente', points:1}, {label:'Dependiente', points:0}] },
            { id: '6', text: 'Alimentación', options: [{label:'Independiente', points:1}, {label:'Dependiente', points:0}] }
        ],
        interpret: (score) => {
            if (score === 6) return { classification: 'Independencia Total', color: 'text-emerald-600', risk: 'Bajo' };
            if (score >= 4) return { classification: 'Dependencia Leve', color: 'text-blue-600', risk: 'Bajo' };
            if (score >= 2) return { classification: 'Dependencia Moderada', color: 'text-amber-600', risk: 'Medio' };
            return { classification: 'Dependencia Severa', color: 'text-rose-600', risk: 'Alto' };
        }
    },
    'YESAVAGE': {
        id: 'YESAVAGE',
        title: 'Escala de Depresión Geriátrica (GDS-15)',
        description: 'Tamizaje de depresión en el adulto mayor.',
        questions: [
            { id: '1', text: '¿Está satisfecho con su vida?', options: [{label:'Sí', points:0}, {label:'No', points:1}] },
            { id: '2', text: '¿Ha renunciado a muchas actividades?', options: [{label:'Sí', points:1}, {label:'No', points:0}] },
            { id: '3', text: '¿Siente que su vida está vacía?', options: [{label:'Sí', points:1}, {label:'No', points:0}] },
            { id: '4', text: '¿Se aburre a menudo?', options: [{label:'Sí', points:1}, {label:'No', points:0}] },
            { id: '5', text: '¿Está de buen ánimo la mayor parte del tiempo?', options: [{label:'Sí', points:0}, {label:'No', points:1}] },
        ],
        interpret: (score) => {
            if (score <= 1) return { classification: 'Normal', color: 'text-emerald-600', risk: 'Bajo' };
            return { classification: 'Probable Depresión', color: 'text-rose-600', risk: 'Alto' };
        }
    },
    // --- RIESGO METABÓLICO ---
    'FINDRISC': {
        id: 'FINDRISC',
        title: 'Test FINDRISC (Riesgo Diabetes)',
        description: 'Estimación del riesgo de desarrollar Diabetes Mellitus Tipo 2 en 10 años.',
        questions: [
            { id: '1', text: 'Edad', options: [{label:'<45', points:0}, {label:'45-54', points:2}, {label:'55-64', points:3}, {label:'>64', points:4}] },
            { id: '2', text: 'Índice de Masa Corporal', options: [{label:'<25', points:0}, {label:'25-30', points:1}, {label:'>30', points:3}] },
            { id: '3', text: 'Perímetro de cintura', options: [{label:'H<94 / M<80', points:0}, {label:'H 94-102 / M 80-88', points:3}, {label:'H>102 / M>88', points:4}] },
            { id: '4', text: 'Actividad física diaria (30 min)', options: [{label:'Sí', points:0}, {label:'No', points:2}] },
            { id: '5', text: '¿Come verduras/frutas a diario?', options: [{label:'Sí', points:0}, {label:'No', points:1}] },
            { id: '6', text: '¿Toma medicación para hipertensión?', options: [{label:'No', points:0}, {label:'Sí', points:2}] },
            { id: '7', text: 'Glucosa alta alguna vez', options: [{label:'No', points:0}, {label:'Sí', points:5}] },
            { id: '8', text: 'Familiares con Diabetes', options: [{label:'No', points:0}, {label:'Abuelos/Tíos/Primos', points:3}, {label:'Padres/Hermanos/Hijos', points:5}] }
        ],
        interpret: (score) => {
            if (score < 7) return { classification: 'Riesgo Bajo (1%)', color: 'text-emerald-600', risk: 'Bajo' };
            if (score <= 11) return { classification: 'Riesgo Ligeramente Elevado (4%)', color: 'text-blue-600', risk: 'Bajo' };
            if (score <= 14) return { classification: 'Riesgo Moderado (17%)', color: 'text-amber-600', risk: 'Medio' };
            if (score <= 20) return { classification: 'Riesgo Alto (33%)', color: 'text-orange-600', risk: 'Alto' };
            return { classification: 'Riesgo Muy Alto (50%)', color: 'text-rose-600', risk: 'Alto' };
        }
    },
    // --- DESARROLLO INFANTIL ---
    'EDI_2M': {
        id: 'EDI_2M',
        title: 'Evaluación Desarrollo Infantil (2 Meses)',
        description: 'Hitos del desarrollo esperados para la edad.',
        questions: [
            { id: '1', text: '¿Sigue con la mirada objetos en movimiento?', options: [{label:'Sí', points:1}, {label:'No', points:0}] },
            { id: '2', text: '¿Reacciona a sonidos fuertes?', options: [{label:'Sí', points:1}, {label:'No', points:0}] },
            { id: '3', text: '¿Sonríe cuando se le habla?', options: [{label:'Sí', points:1}, {label:'No', points:0}] },
            { id: '4', text: '¿Puede levantar la cabeza estando boca abajo?', options: [{label:'Sí', points:1}, {label:'No', points:0}] }
        ],
        interpret: (score) => {
            if (score === 4) return { classification: 'Desarrollo Normal', color: 'text-emerald-600', risk: 'Bajo' };
            return { classification: 'Rezago en el Desarrollo', color: 'text-rose-600', risk: 'Alto' };
        }
    }
};

// CONFIGURACIÓN MAESTRA DE ETAPAS DE VIDA Y ACCIONES (BASE DE CONOCIMIENTOS)
const LIFE_STAGES_CONFIG: Record<string, {
    color: string;
    icon: any;
    vaccines: { name: string, age: string, doses: string[] }[];
    screenings: { name: string, cat: string, freq: string, gender?: 'M'|'F' }[];
    promotion: string[]; 
    specificAssessmentLabel?: string; 
    availableScales: string[]; // IDs de las escalas disponibles
}> = {
    'Recién Nacido': { // 0-28 días
        color: 'bg-pink-100 text-pink-700 border-pink-200',
        icon: <Baby size={24}/>,
        vaccines: [
            { name: 'BCG', age: 'Al Nacer', doses: ['Única'] },
            { name: 'Hepatitis B', age: 'Al Nacer', doses: ['1a'] }
        ],
        screenings: [
            { name: 'Tamiz Metabólico Neonatal', cat: 'Metabólico', freq: '3-5 días' },
            { name: 'Tamiz Auditivo (TANU)', cat: 'Auditivo', freq: 'Antes de 1 mes (Meta 1-3-6)' },
            { name: 'Tamiz Cardiaco (Oximetría)', cat: 'Cardiológico', freq: 'Antes del alta' },
            { name: 'Tamiz Oftalmológico (Reflejo Rojo)', cat: 'Visual', freq: 'Antes del alta (Prueba Brückner)' }
        ],
        promotion: [
            'Lactancia Materna Exclusiva',
            'Cuidados del Cordón Umbilical',
            'Prevención de Muerte Súbita (Sueño Seguro)',
            'Baño y Cuidado de la Piel',
            'Signos de Alarma Neonatal (Ictericia, Fiebre)'
        ],
        availableScales: []
    },
    'Lactante': { // 1 mes - 2 años
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Baby size={24}/>,
        vaccines: [
            { name: 'Hexavalente', age: '2, 4, 6, 18m', doses: ['1a', '2a', '3a', 'Ref'] },
            { name: 'Rotavirus', age: '2, 4m', doses: ['1a', '2a'] },
            { name: 'Neumococo Conjugada', age: '2, 4, 12m', doses: ['1a', '2a', 'Ref'] },
            { name: 'Influenza', age: '6, 7m, Anual', doses: ['1a', '2a', 'Anual'] },
            { name: 'SRP (Triple Viral)', age: '12m, 18m', doses: ['1a', '2a'] }
        ],
        screenings: [
            { name: 'Evaluación Neurodesarrollo (EDI)', cat: 'Desarrollo', freq: 'Bimestral hasta 2 años' },
            { name: 'Suplementación Vitamina D/Hierro', cat: 'Nutrición', freq: 'Continua' },
            { name: 'Tamiz Visual (Reflejo Rojo)', cat: 'Visual', freq: '6 meses' },
            { name: 'Evaluación Anemia (Hb)', cat: 'Metabólico', freq: '9-12 meses' }
        ],
        promotion: [
            'Ablactación (6m) e Introducción de Hierro',
            'Estimulación Temprana (Motor/Lenguaje)',
            'Prevención de Accidentes en el Hogar',
            'Higiene Bucal (Primeros Dientes)',
            'Sueño y Rutinas'
        ],
        availableScales: ['EDI_2M']
    },
    'Preescolar': { // 2-5 años
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <Smile size={24}/>,
        vaccines: [
             { name: 'DPT', age: '4 años', doses: ['Refuerzo'] },
             { name: 'Influenza', age: 'Anual', doses: ['Anual'] }
        ],
        screenings: [
            { name: 'Agudeza Visual', cat: 'Visual', freq: 'Anual' },
            { name: 'Salud Bucal', cat: 'Dental', freq: 'Semestral' },
            { name: 'Evaluación Nutricional (IMC)', cat: 'Nutrición', freq: 'Anual (Percentil ≥85 Sobrepeso)' },
            { name: 'Desparasitación Intestinal', cat: 'Preventivo', freq: 'Semestral' }
        ],
        promotion: [
            'Plato del Bien Comer y Jarra del Buen Beber',
            'Higiene Personal y Lavado de Manos',
            'Prevención de Violencia Infantil',
            'Actividad Física y Juego',
            'Control de Esfínteres'
        ],
        availableScales: []
    },
    'Escolar': { // 6-9 años
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <User size={24}/>,
        vaccines: [
             { name: 'Influenza', age: 'Anual', doses: ['Anual'] },
             { name: 'VPH', age: '9-11 años', doses: ['1a', '2a'] } 
        ],
        screenings: [
            { name: 'Agudeza Visual', cat: 'Visual', freq: 'Anual' },
            { name: 'Estado Nutricional (IMC)', cat: 'Nutrición', freq: 'Semestral' },
            { name: 'Higiene Postural (Escoliosis)', cat: 'Ortopedia', freq: 'Anual' }
        ],
        promotion: [
            'Prevención de Obesidad Infantil',
            'Salud Mental y Autoestima',
            'Prevención de Bullying',
            'Seguridad Vial y Peatonal',
            'Higiene Dental (Técnica de Cepillado)'
        ],
        availableScales: []
    },
    'Adolescente': { // 10-19 años
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: <User size={24}/>,
        specificAssessmentLabel: 'Eval. Integral (HEADSS)',
        vaccines: [
             { name: 'VPH', age: '10-14 años (si falta)', doses: ['1a', '2a'] },
             { name: 'Tdpa (Tétanos/Difteria/Tosferina)', age: '11-12 años', doses: ['Refuerzo'] },
             { name: 'Meningococo (MenACWY)', age: '11-12, 16 años', doses: ['1a', 'Ref'] },
             { name: 'Influenza', age: 'Anual', doses: ['Anual'] }
        ],
        screenings: [
            { name: 'Tamizaje Psicosocial (HEADSS)', cat: 'Mental', freq: 'Anual' },
            { name: 'Depresión (PHQ-9) / Ansiedad (GAD-7)', cat: 'Mental', freq: 'Anual (12-18 años)' },
            { name: 'Salud Sexual (ITS/VIH)', cat: 'Infeccioso', freq: 'Anual (si riesgo)' },
            { name: 'Estadificación Tanner', cat: 'Crecimiento', freq: 'Anual' }
        ],
        promotion: [
            'Salud Sexual y Anticoncepción',
            'Prevención de Adicciones (Alcohol, Tabaco, Vapeo)',
            'Nutrición y Trastornos Alimenticios',
            'Salud Mental y Prevención del Suicidio',
            'Violencia en el Noviazgo'
        ],
        availableScales: ['PHQ-9', 'GAD-7']
    },
    'Adulto Joven': { // 20-39 años
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <User size={24}/>,
        vaccines: [
             { name: 'SR (Sarampión/Rubéola)', age: 'Si no tiene esquema', doses: ['Dosis Única'] },
             { name: 'Td', age: 'Cada 10 años', doses: ['Refuerzo'] },
             { name: 'Influenza', age: 'Anual (Riesgo)', doses: ['Anual'] }
        ],
        screenings: [
             { name: 'Papanicolau / VPH', cat: 'Cáncer', freq: '21-29a: Papanicolau 3a. 30+: Co-test 5a', gender: 'F' },
             { name: 'Exploración Mamaria', cat: 'Cáncer', freq: 'Anual', gender: 'F' },
             { name: 'Perfil de Lípidos', cat: 'Metabólico', freq: 'Cada 4-6 años (si bajo riesgo)' },
             { name: 'Presión Arterial', cat: 'Cardiovascular', freq: 'Cada 2 años (<120/80)' },
             { name: 'Glucosa Ayuno', cat: 'Metabólico', freq: 'Trienal (si sobrepeso + factor)' }
        ],
        promotion: [
            'Planificación Familiar',
            'Estilos de Vida Saludables (Ejercicio/Dieta)',
            'Prevención de Enfermedades Crónicas',
            'Salud Laboral y Ergonomía',
            'Salud Mental y Manejo del Estrés'
        ],
        availableScales: ['PHQ-9', 'GAD-7', 'FINDRISC']
    },
    'Adulto': { // 40-59 años
        color: 'bg-slate-200 text-slate-800 border-slate-300',
        icon: <User size={24}/>,
        vaccines: [
            { name: 'Td', age: 'Cada 10 años', doses: ['Refuerzo'] },
            { name: 'Influenza', age: 'Anual', doses: ['Anual'] }
        ],
        screenings: [
             { name: 'Mastografía', cat: 'Cáncer', freq: 'Bienal (40-74 años)', gender: 'F' },
             { name: 'Cáncer Colorrectal (FIT/Colono)', cat: 'Cáncer', freq: 'Inicio 45 años' },
             { name: 'Antígeno Prostático (APE)', cat: 'Cáncer', freq: 'Anual (55-69 años)', gender: 'M' },
             { name: 'Detección Diabetes/Hipertensión', cat: 'Metabólico', freq: 'Anual (o cada 3 años si sano)' },
             { name: 'Cáncer Pulmón (LDCT)', cat: 'Cáncer', freq: 'Anual (Fumadores 50+)' }
        ],
        promotion: [
            'Climaterio y Menopausia / Andropausia',
            'Prevención de Cáncer (Mama, Cervicouterino, Próstata, Colon)',
            'Actividad Física en el Adulto',
            'Alimentación Cardiosaludable',
            'Higiene del Sueño'
        ],
        availableScales: ['PHQ-9', 'GAD-7', 'FINDRISC']
    },
    'Adulto Mayor': { // 60+ años
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <User size={24}/>,
        specificAssessmentLabel: 'Valoración Geriátrica (VGI)',
        vaccines: [
            { name: 'Influenza (Alta Dosis)', age: 'Anual', doses: ['Anual'] },
            { name: 'Neumococo (PCV20 o secuencial)', age: '65 años', doses: ['Única'] },
            { name: 'Herpes Zóster (Shingrix)', age: '50+ años', doses: ['1a', '2a'] },
            { name: 'VSR', age: '60+ años', doses: ['Única (Compartida)'] },
            { name: 'Td', age: 'Cada 10 años', doses: ['Refuerzo'] }
        ],
        screenings: [
             { name: 'Evaluación Cognitiva (MMSE/MoCA)', cat: 'Neurológico', freq: 'Anual' },
             { name: 'Depresión Geriátrica (Yesavage)', cat: 'Mental', freq: 'Anual' },
             { name: 'Densitometría Ósea', cat: 'Osteoporosis', freq: 'Bienal (Mujeres 65+, Hombres 70+)' },
             { name: 'Riesgo de Caídas (Timmed Up & Go)', cat: 'Funcional', freq: 'Anual' },
             { name: 'Aneurisma Aorta Abdominal', cat: 'Vascular', freq: 'Única vez (Hombres fumadores 65-75)' }
        ],
        promotion: [
            'Envejecimiento Saludable y Activo',
            'Prevención de Caídas y Accidentes en Hogar',
            'Uso Correcto de Medicamentos (Polifarmacia)',
            'Nutrición Geriátrica (Proteína/Hidratación)',
            'Voluntad Anticipada y Cuidados'
        ],
        availableScales: ['KATZ', 'YESAVAGE', 'FINDRISC', 'PHQ-9']
    }
};

const ComprehensiveHealthControl: React.FC<{ patients: Patient[], onSaveNote: (n: ClinicalNote) => void, onUpdatePatient: (p: Patient) => void }> = ({ patients, onSaveNote, onUpdatePatient }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vaccines' | 'screenings' | 'growth' | 'promotion' | 'specifics'>('dashboard');
  const [showVisitModal, setShowVisitModal] = useState(false);
  
  // Interactive Scale State
  const [activeScaleId, setActiveScaleId] = useState<string | null>(null);
  const [scaleAnswers, setScaleAnswers] = useState<Record<string, number>>({});
  const [completedScales, setCompletedScales] = useState<Record<string, {score: number, interpretation: string, date: string}>>({});

  // Determinación de Etapa de Vida
  const currentStage = useMemo(() => {
      if (!patient) return 'Adulto';
      const age = patient.age;
      if (age < 1) return 'Lactante'; // Simplificado
      if (age >= 1 && age <= 2) return 'Lactante';
      if (age >= 3 && age <= 5) return 'Preescolar';
      if (age >= 6 && age <= 9) return 'Escolar';
      if (age >= 10 && age <= 19) return 'Adolescente';
      if (age >= 20 && age <= 39) return 'Adulto Joven';
      if (age >= 40 && age <= 59) return 'Adulto';
      if (age >= 60) return 'Adulto Mayor';
      return 'Adulto';
  }, [patient]);

  const stageConfig = LIFE_STAGES_CONFIG[currentStage];

  // Inicializar registro de salud si no existe
  useEffect(() => {
      if (patient && !patient.healthControl) {
          const newRecord: HealthControlRecord = {
              id: `HC-${Date.now()}`,
              patientId: patient.id,
              lifeStage: currentStage as any,
              vaccines: [],
              screenings: [],
              visits: [],
              healthPromotion: [],
              geriatricAssessments: [],
              adolescentAssessments: []
          };
          onUpdatePatient({ ...patient, healthControl: newRecord });
      }
  }, [patient, currentStage]);

  // --- FORMULARIO INTEGRAL DE VISITA ---
  const [visitForm, setVisitForm] = useState({
      weight: 0, height: 0, headCircumference: 0, bmi: 0,
      bp: '', temp: 36.5,
      developmentMilestones: '', nutritionAssessment: '', physicalActivity: '', notes: '',
      appliedVaccines: [] as { name: string, dose: string }[],
      performedScreenings: [] as { name: string, category: string, status: 'Normal' | 'Anormal' }[],
      topicsDiscussed: [] as string[],
      nextAppointment: ''
  });

  const [modalTab, setModalTab] = useState<'somatometry' | 'vaccines' | 'screenings' | 'promotion' | 'specifics' | 'notes'>('somatometry');

  if (!patient || !patient.healthControl) return null;

  const healthRecord = patient.healthControl;

  // --- SCALE ENGINE LOGIC ---
  const handleAnswer = (questionId: string, points: number) => {
      setScaleAnswers(prev => ({ ...prev, [questionId]: points }));
  };

  const finishScale = () => {
      if (!activeScaleId) return;
      const scale = MEDICAL_SCALES[activeScaleId];
      const score = (Object.values(scaleAnswers) as number[]).reduce((a, b) => a + b, 0);
      const result = scale.interpret(score);
      const interpretationText = `${result.classification} (${score} pts)`;
      
      setCompletedScales(prev => ({
          ...prev,
          [activeScaleId]: {
              score,
              interpretation: interpretationText,
              date: new Date().toISOString().split('T')[0]
          }
      }));

      // Add to visit form notes automatically
      setVisitForm(prev => ({
          ...prev,
          notes: prev.notes + `\n[${scale.title}]: ${interpretationText}.`
      }));

      setActiveScaleId(null);
      setScaleAnswers({});
  };

  // --- ACTIONS ---
  
  const handleAddVisit = () => {
      if (!visitForm.weight || !visitForm.height) {
          alert("Peso y Talla son obligatorios para el registro de crecimiento.");
          return;
      }
      
      const heightM = (visitForm.height || 100) / 100;
      const bmi = parseFloat(( (visitForm.weight || 1) / (heightM * heightM) ).toFixed(1));

      // 1. Crear registro de Visita
      const newVisit: PreventiveVisit = {
          id: `VIS-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          ageGroup: currentStage,
          weight: Number(visitForm.weight),
          height: Number(visitForm.height),
          bmi: bmi,
          headCircumference: Number(visitForm.headCircumference),
          developmentMilestones: visitForm.developmentMilestones,
          nutritionAssessment: visitForm.nutritionAssessment,
          notes: visitForm.notes || ''
      };

      // 2. Actualizar Vacunas
      const newVaccineRecords: VaccineRecord[] = visitForm.appliedVaccines.map(v => ({
          id: `VAC-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
          name: v.name,
          doseNumber: v.dose,
          targetAge: currentStage,
          applicationDate: new Date().toISOString().split('T')[0],
          notes: 'Aplicada en consulta de control'
      }));

      // 3. Actualizar Tamizajes
      let updatedScreenings = [...healthRecord.screenings];
      visitForm.performedScreenings.forEach(scr => {
          const index = updatedScreenings.findIndex(s => s.name === scr.name);
          const newRecord: ScreeningRecord = {
              id: index >= 0 ? updatedScreenings[index].id : `SCR-${Date.now()}-${Math.random()}`,
              name: scr.name,
              category: scr.category as any,
              targetPopulation: currentStage,
              status: scr.status,
              lastDate: new Date().toISOString().split('T')[0],
              nextDueDate: '', 
              resultSummary: `Evaluado en consulta: ${scr.status}`
          };
          if (index >= 0) updatedScreenings[index] = newRecord;
          else updatedScreenings.push(newRecord);
      });

      // 4. Actualizar Promoción
      let updatedPromotion = [...(healthRecord.healthPromotion || [])];
      visitForm.topicsDiscussed.forEach(topic => {
          const index = updatedPromotion.findIndex(t => t.topic === topic);
          if (index >= 0) {
              updatedPromotion[index] = { ...updatedPromotion[index], date: new Date().toISOString().split('T')[0] };
          } else {
              updatedPromotion.push({ topic, date: new Date().toISOString().split('T')[0] });
          }
      });

      // CONSOLIDAR TODO
      const updatedRecord = { 
          ...healthRecord, 
          visits: [...healthRecord.visits, newVisit],
          vaccines: [...healthRecord.vaccines, ...newVaccineRecords],
          screenings: updatedScreenings,
          healthPromotion: updatedPromotion
      };

      onUpdatePatient({ ...patient, healthControl: updatedRecord });
      setShowVisitModal(false);
      
      // Reset Form
      setVisitForm({
        weight: 0, height: 0, headCircumference: 0, bmi: 0, bp: '', temp: 36.5,
        developmentMilestones: '', nutritionAssessment: '', physicalActivity: '', notes: '',
        appliedVaccines: [], performedScreenings: [], topicsDiscussed: [], nextAppointment: ''
      });
      setCompletedScales({}); // Reset scales
      setModalTab('somatometry'); 
      
      // Nota automática
      const scalesSummary = Object.values(completedScales).map((s: {interpretation: string}) => s.interpretation).join(', ');
      
      const noteSummary = `
          Se realiza Control Integral de Salud (${currentStage}).
          Somatometría: Peso ${newVisit.weight}kg, Talla ${newVisit.height}cm, IMC ${bmi}.
          Vacunas aplicadas: ${visitForm.appliedVaccines.map(v => `${v.name} (${v.dose})`).join(', ') || 'Ninguna'}.
          Tamizajes: ${visitForm.performedScreenings.map(s => `${s.name}: ${s.status}`).join(', ') || 'Ninguno'}.
          Educación: ${visitForm.topicsDiscussed.length} temas abordados.
          Escalas Realizadas: ${scalesSummary || 'Ninguna'}
      `;

      const note: ClinicalNote = {
          id: `NOTE-PREV-${Date.now()}`,
          patientId: patient.id,
          type: `Control de Salud Integral (${currentStage})`,
          date: new Date().toLocaleString('es-MX'),
          author: 'Medicina Preventiva',
          content: {
              ...newVisit,
              analysis: `Paciente en etapa ${currentStage} acude a control de salud.`,
              plan: `Continuar esquema de prevención. Próxima cita: ${visitForm.nextAppointment}.`,
              summary: noteSummary
          },
          isSigned: true
      };
      onSaveNote(note);
  };

  // ... (Toggle Helpers similar to previous) ...
  const toggleModalVaccine = (name: string, dose: string) => {
      const exists = visitForm.appliedVaccines.find(v => v.name === name && v.dose === dose);
      if (exists) {
          setVisitForm(prev => ({...prev, appliedVaccines: prev.appliedVaccines.filter(v => v !== exists)}));
      } else {
          setVisitForm(prev => ({...prev, appliedVaccines: [...prev.appliedVaccines, {name, dose}]}));
      }
  };

  const setModalScreening = (name: string, category: string, status: 'Normal' | 'Anormal' | null) => {
      const cleanList = visitForm.performedScreenings.filter(s => s.name !== name);
      if (status) {
          setVisitForm(prev => ({...prev, performedScreenings: [...cleanList, {name, category, status}]}));
      } else {
          setVisitForm(prev => ({...prev, performedScreenings: cleanList}));
      }
  };

  const toggleModalTopic = (topic: string) => {
      const exists = visitForm.topicsDiscussed.includes(topic);
      if (exists) {
          setVisitForm(prev => ({...prev, topicsDiscussed: prev.topicsDiscussed.filter(t => t !== topic)}));
      } else {
          setVisitForm(prev => ({...prev, topicsDiscussed: [...prev.topicsDiscussed, topic]}));
      }
  };

  // Charts Data
  const growthData = healthRecord.visits.map(v => ({
      date: v.date,
      weight: v.weight,
      height: v.height,
      bmi: v.bmi
  }));

  // Progress Calculations
  const vaccineProgress = Math.round((healthRecord.vaccines.length / stageConfig.vaccines.reduce((acc, v) => acc + v.doses.length, 0)) * 100) || 0;
  const promotionProgress = Math.round(((healthRecord.healthPromotion?.length || 0) / stageConfig.promotion.length) * 100) || 0;

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in">
        
        {/* HEADER */}
        <div className={`p-8 rounded-t-[3.5rem] shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-8 border-b-8 transition-colors ${stageConfig.color.replace('bg-', 'bg-slate-900 border-')}`}>
            <div className="flex items-center gap-6 text-white">
                <button onClick={() => navigate(-1)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all backdrop-blur-sm">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Carnet de Salud Integral</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-white/20 text-white border border-white/30`}>
                            {currentStage}
                        </span>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Curso de Vida: Prevención y Promoción</p>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-4">
                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 text-white text-center backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Vacunación</p>
                    <p className="text-2xl font-black">{vaccineProgress}%</p>
                </div>
                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 text-white text-center backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Educación</p>
                    <p className="text-2xl font-black">{promotionProgress}%</p>
                </div>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-xl overflow-hidden min-h-[800px] flex flex-col">
            {/* TABS */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'dashboard', label: 'Resumen', icon: <Activity size={18}/> },
                    { id: 'vaccines', label: 'Esquema de Vacunación', icon: <Syringe size={18}/> },
                    { id: 'screenings', label: 'Tamizajes y Chequeos', icon: <FlaskConical size={18}/> },
                    { id: 'promotion', label: 'Promoción de la Salud', icon: <BookOpen size={18}/> },
                    { id: 'growth', label: 'Crecimiento y Desarrollo', icon: <Ruler size={18}/> },
                    // Conditional Specific Tab
                    stageConfig.availableScales.length > 0 ? { id: 'specifics', label: 'Escalas y Evaluaciones', icon: <Target size={18}/> } : null
                ].filter(Boolean).map(tab => tab && (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-10 flex-1 bg-white">
                
                {/* --- TAB: DASHBOARD --- */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in slide-in-from-left-4">
                        <div className={`p-8 rounded-[2.5rem] border-2 flex items-center gap-6 ${stageConfig.color.replace('text-', 'text-slate-900 bg-opacity-20 ')}`}>
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-current">
                                {stageConfig.icon}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black uppercase">Etapa: {currentStage}</h3>
                                <p className="text-xs font-medium opacity-80 max-w-2xl">
                                    Enfoque preventivo: Detección oportuna de enfermedades, completitud de esquema de vacunación y educación para la salud específica para la edad y género.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                 <h3 className="text-xs font-black uppercase text-slate-500 mb-6 flex items-center gap-2"><Clock size={16}/> Acciones Pendientes</h3>
                                 <div className="space-y-3">
                                     {stageConfig.vaccines.slice(0, 3).map((vac, i) => (
                                         <div key={`vac-${i}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                             <div className="flex items-center gap-3">
                                                 <Syringe size={14} className="text-blue-500"/>
                                                 <span className="text-[10px] font-black uppercase text-slate-700">{vac.name}</span>
                                             </div>
                                             <span className="text-[9px] font-bold text-slate-400">{vac.age}</span>
                                         </div>
                                     ))}
                                     {stageConfig.promotion.slice(0, 3).map((topic, i) => {
                                         const done = healthRecord.healthPromotion?.some(t => t.topic === topic);
                                         if (done) return null;
                                         return (
                                            <div key={`promo-${i}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <BookOpen size={14} className="text-emerald-500"/>
                                                    <span className="text-[10px] font-black uppercase text-slate-700 truncate">{topic}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400">Plática</span>
                                            </div>
                                         );
                                     })}
                                 </div>
                             </div>

                             <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between">
                                 <div>
                                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Última Visita</h3>
                                     <p className="text-3xl font-black">{healthRecord.visits.length > 0 ? healthRecord.visits[healthRecord.visits.length-1].date : 'Sin Registro'}</p>
                                 </div>
                                 <button onClick={() => setShowVisitModal(true)} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg">
                                     <Plus size={16}/> Registrar Control
                                 </button>
                             </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: VACCINES (Implemented) --- */}
                {activeTab === 'vaccines' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {stageConfig.vaccines.map((v, i) => {
                                const appliedDoses = healthRecord.vaccines.filter(vac => vac.name === v.name);
                                return (
                                    <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                                                <Syringe size={16} className="text-blue-500"/> {v.name}
                                            </h4>
                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{v.age}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {v.doses.map(dose => {
                                                const isApplied = appliedDoses.some(ad => ad.doseNumber === dose);
                                                const appliedRecord = appliedDoses.find(ad => ad.doseNumber === dose);
                                                return (
                                                    <div key={dose} className={`flex-1 p-3 rounded-xl border text-center ${isApplied ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                        <p className="text-[9px] font-black uppercase">{dose}</p>
                                                        <p className="text-[8px] font-medium">{isApplied ? appliedRecord?.applicationDate : 'Pendiente'}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* --- TAB: SCREENINGS (Implemented) --- */}
                {activeTab === 'screenings' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                             <h3 className="text-lg font-black uppercase text-slate-900 mb-6 flex items-center gap-2">
                                <FlaskConical size={20} className="text-emerald-600"/> Tamizajes y Detección Oportuna
                             </h3>
                             <div className="space-y-4">
                                 {stageConfig.screenings.map((s, i) => {
                                    if (s.gender && s.gender !== patient.sex) return null;
                                    const record = healthRecord.screenings.find(r => r.name === s.name);
                                    
                                    return (
                                        <div key={i} className={`p-5 rounded-2xl border flex justify-between items-center transition-all ${record ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase">{s.name}</h4>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{s.cat} • Frecuencia: {s.freq}</p>
                                            </div>
                                            <div className="text-right">
                                                {record ? (
                                                    <div>
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${record.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {record.status}
                                                        </span>
                                                        <p className="text-[8px] text-slate-400 mt-1">{record.lastDate}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-200 px-3 py-1 rounded-lg">Pendiente</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                 })}
                             </div>
                        </div>
                    </div>
                )}
                
                {/* --- TAB: PROMOTION (Implemented) --- */}
                {activeTab === 'promotion' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {stageConfig.promotion.map((topic, i) => {
                                const record = healthRecord.healthPromotion?.find(r => r.topic === topic);
                                return (
                                    <div key={i} className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${record ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${record ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <BookOpen size={18}/>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase max-w-[200px] leading-tight">{topic}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Educación para la Salud</p>
                                            </div>
                                        </div>
                                        {record ? (
                                            <div className="text-right">
                                                <CheckCircle2 size={20} className="text-emerald-500 ml-auto mb-1"/>
                                                <p className="text-[8px] font-bold text-slate-500">{record.date}</p>
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
                                        )}
                                    </div>
                                );
                            })}
                         </div>
                    </div>
                )}
                
                {/* --- TAB: GROWTH (Implemented) --- */}
                {activeTab === 'growth' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-80">
                                <h3 className="text-xs font-black uppercase text-slate-500 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Curva de Peso (kg)</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={growthData} margin={{top:5, right:20, bottom:5, left:0}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                        <XAxis dataKey="date" fontSize={10} tickFormatter={(v)=> new Date(v).toLocaleDateString()}/>
                                        <YAxis fontSize={10} domain={['auto', 'auto']}/>
                                        <Tooltip contentStyle={{borderRadius:'12px', border:'none', fontSize:'12px'}}/>
                                        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                             <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-80">
                                <h3 className="text-xs font-black uppercase text-slate-500 mb-4 flex items-center gap-2"><Ruler size={16}/> Curva de Talla (cm)</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={growthData} margin={{top:5, right:20, bottom:5, left:0}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                        <XAxis dataKey="date" fontSize={10} tickFormatter={(v)=> new Date(v).toLocaleDateString()}/>
                                        <YAxis fontSize={10} domain={['auto', 'auto']}/>
                                        <Tooltip contentStyle={{borderRadius:'12px', border:'none', fontSize:'12px'}}/>
                                        <Line type="monotone" dataKey="height" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: SPECIFIC ASSESSMENTS (INTERACTIVE ENGINE) --- */}
                {activeTab === 'specifics' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LISTADO DE ESCALAS DISPONIBLES */}
                             <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                <h3 className="text-lg font-black uppercase text-slate-900 mb-6 flex items-center gap-2">
                                    <Calculator size={20} className="text-indigo-600"/> Evaluaciones Clínicas
                                </h3>
                                <div className="space-y-3">
                                    {stageConfig.availableScales.map(scaleId => {
                                        const scale = MEDICAL_SCALES[scaleId];
                                        return (
                                            <button 
                                                key={scaleId}
                                                onClick={() => { setActiveScaleId(scaleId); setScaleAnswers({}); }}
                                                className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-2xl transition-all group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs font-black uppercase text-slate-800 group-hover:text-indigo-800">{scale.title}</p>
                                                        <p className="text-[9px] text-slate-400 mt-1">{scale.description}</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500"/>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                             </div>

                             {/* AREA DE EJECUCIÓN DE ESCALA */}
                             <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col">
                                {activeScaleId ? (
                                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 relative z-10">
                                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                            <h3 className="text-sm font-black uppercase text-white tracking-widest">{MEDICAL_SCALES[activeScaleId].title}</h3>
                                            <button onClick={() => setActiveScaleId(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                            {MEDICAL_SCALES[activeScaleId].questions.map(q => (
                                                <div key={q.id} className="space-y-3">
                                                    <p className="text-xs font-medium text-slate-200">{q.text}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {q.options.map(opt => (
                                                            <button 
                                                                key={opt.label}
                                                                onClick={() => handleAnswer(q.id, opt.points)}
                                                                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${scaleAnswers[q.id] === opt.points ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* RESULTADO EN TIEMPO REAL */}
                                        <div className="mt-6 pt-6 border-t border-white/10">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resultado Preliminar</p>
                                                    <p className={`text-lg font-black uppercase mt-1 ${MEDICAL_SCALES[activeScaleId].interpret((Object.values(scaleAnswers) as number[]).reduce((a: number, b: number) => a + b, 0)).color.replace('text-', 'text-')}`}>
                                                        {MEDICAL_SCALES[activeScaleId].interpret((Object.values(scaleAnswers) as number[]).reduce((a: number, b: number) => a + b, 0)).classification}
                                                    </p>
                                                </div>
                                                <button onClick={finishScale} className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg">
                                                    Guardar Evaluación
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                                        <Activity size={48} className="mb-4"/>
                                        <p className="text-xs font-black uppercase tracking-widest">Seleccione una escala para comenzar</p>
                                    </div>
                                )}
                             </div>
                        </div>

                        {/* HISTORIAL DE EVALUACIONES */}
                        {healthRecord.visits.some(v => v.notes.includes('[')) && (
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><HistoryIcon size={14}/> Historial de Evaluaciones</h4>
                                <div className="space-y-2">
                                    {healthRecord.visits.filter(v => v.notes.includes('[')).map((visit, i) => (
                                        <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                                            <p className="text-[10px] font-bold text-slate-400">{visit.date}</p>
                                            <p className="text-xs font-medium text-slate-700 italic">{visit.notes.split('\n').find(l => l.includes('[')) || 'Evaluación registrada'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* MODAL INTEGRAL DE VISITA / CAPTURA COMPLETA */}
        {showVisitModal && (
            <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[95vh] border border-white/20">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-6 mb-6">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registro de Control Integral</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{currentStage} • Fecha: {new Date().toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => setShowVisitModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} className="text-slate-300 hover:text-rose-500"/></button>
                    </div>

                    {/* MODAL TABS */}
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6 shadow-inner overflow-x-auto no-scrollbar">
                        {[
                            { id: 'somatometry', label: 'Somatometría', icon: <Ruler size={14}/> },
                            { id: 'vaccines', label: 'Vacunación', icon: <Syringe size={14}/> },
                            { id: 'screenings', label: 'Tamizajes', icon: <FlaskConical size={14}/> },
                            { id: 'promotion', label: 'Promoción', icon: <BookOpen size={14}/> },
                            stageConfig.availableScales.length > 0 ? { id: 'specifics', label: 'Evaluación Específica', icon: <Target size={14}/> } : null,
                            { id: 'notes', label: 'Notas', icon: <FileText size={14}/> }
                        ].filter(Boolean).map(t => t && (
                            <button
                                key={t.id}
                                onClick={() => setModalTab(t.id as any)}
                                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${modalTab === t.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        {modalTab === 'somatometry' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Peso (kg)</label>
                                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={visitForm.weight || ''} onChange={e => setVisitForm({...visitForm, weight: parseFloat(e.target.value)})} autoFocus/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Talla (cm)</label>
                                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={visitForm.height || ''} onChange={e => setVisitForm({...visitForm, height: parseFloat(e.target.value)})}/>
                                    </div>
                                    {['Recién Nacido', 'Lactante'].includes(currentStage) && (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">P. Cefálico (cm)</label>
                                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center" value={visitForm.headCircumference || ''} onChange={e => setVisitForm({...visitForm, headCircumference: parseFloat(e.target.value)})}/>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-blue-400 ml-1">Temp (°C)</label>
                                        <input type="number" className="w-full p-2 bg-white rounded-xl text-center font-bold text-sm" value={visitForm.temp} onChange={e => setVisitForm({...visitForm, temp: parseFloat(e.target.value)})}/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-blue-400 ml-1">T.A.</label>
                                        <input className="w-full p-2 bg-white rounded-xl text-center font-bold text-sm" placeholder="120/80" value={visitForm.bp} onChange={e => setVisitForm({...visitForm, bp: e.target.value})}/>
                                    </div>
                                </div>
                            </div>
                        )}

                        {modalTab === 'vaccines' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Marque las vacunas aplicadas hoy:</p>
                                {stageConfig.vaccines.map((v, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <p className="text-xs font-black text-slate-900 uppercase mb-2">{v.name} <span className="text-[9px] text-slate-400 font-bold ml-1">({v.age})</span></p>
                                        <div className="flex flex-wrap gap-2">
                                            {v.doses.map(dose => {
                                                const isSelected = visitForm.appliedVaccines.some(av => av.name === v.name && av.dose === dose);
                                                // Check if already in history to disable
                                                const inHistory = healthRecord.vaccines.some(hv => hv.name === v.name && hv.doseNumber === dose);
                                                
                                                if (inHistory) return null; // Don't show already applied

                                                return (
                                                    <button 
                                                        key={dose}
                                                        onClick={() => toggleModalVaccine(v.name, dose)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-2 ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        {dose} {isSelected && <Check size={12}/>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[9px] text-slate-400 italic text-center mt-4">Solo se muestran dosis pendientes o de refuerzo.</p>
                            </div>
                        )}

                        {modalTab === 'screenings' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Evaluación de Tamizajes:</p>
                                {stageConfig.screenings.map((s, i) => {
                                    if (s.gender && s.gender !== patient.sex) return null;
                                    const currentSelection = visitForm.performedScreenings.find(ps => ps.name === s.name);
                                    
                                    return (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase">{s.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{s.cat} • {s.freq}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setModalScreening(s.name, s.cat, currentSelection?.status === 'Normal' ? null : 'Normal')}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${currentSelection?.status === 'Normal' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200'}`}
                                                >
                                                    Normal
                                                </button>
                                                <button 
                                                    onClick={() => setModalScreening(s.name, s.cat, currentSelection?.status === 'Anormal' ? null : 'Anormal')}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${currentSelection?.status === 'Anormal' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-200'}`}
                                                >
                                                    Anormal
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {modalTab === 'promotion' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Temas Educativos Abordados:</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {stageConfig.promotion.map((topic, i) => {
                                        const isSelected = visitForm.topicsDiscussed.includes(topic);
                                        return (
                                            <button 
                                                key={i}
                                                onClick={() => toggleModalTopic(topic)}
                                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                            >
                                                <span className={`text-xs font-bold uppercase ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{topic}</span>
                                                {isSelected && <CheckCircle2 size={16} className="text-indigo-600"/>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {/* --- MODAL TAB: SPECIFIC SCALES --- */}
                        {modalTab === 'specifics' && (
                             <div className="space-y-6 animate-in slide-in-from-right-4">
                                 {/* Interactive Scale Selector within Modal */}
                                 {!activeScaleId ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {stageConfig.availableScales.map(scaleId => {
                                            const scale = MEDICAL_SCALES[scaleId];
                                            const isDone = completedScales[scaleId];
                                            return (
                                                <button 
                                                    key={scaleId}
                                                    onClick={() => { setActiveScaleId(scaleId); setScaleAnswers({}); }}
                                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs font-black uppercase text-slate-800">{scale.title}</p>
                                                            {isDone && <p className="text-[9px] font-bold text-emerald-600 mt-1">Resultado: {isDone.interpretation}</p>}
                                                        </div>
                                                        {isDone ? <CheckCircle2 size={18} className="text-emerald-500"/> : <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500"/>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                 ) : (
                                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                                         <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                            <h4 className="text-xs font-black uppercase text-slate-900">{MEDICAL_SCALES[activeScaleId].title}</h4>
                                            <button onClick={() => setActiveScaleId(null)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
                                         </div>
                                         <div className="space-y-6">
                                            {MEDICAL_SCALES[activeScaleId].questions.map(q => (
                                                <div key={q.id} className="space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase">{q.text}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {q.options.map(opt => (
                                                            <button 
                                                                key={opt.label}
                                                                onClick={() => handleAnswer(q.id, opt.points)}
                                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${scaleAnswers[q.id] === opt.points ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                         </div>
                                         <button onClick={finishScale} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-emerald-600 transition-all">
                                             Finalizar y Guardar
                                         </button>
                                     </div>
                                 )}
                             </div>
                        )}

                        {modalTab === 'notes' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Desarrollo / Hitos</label>
                                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 text-sm font-medium resize-none outline-none" placeholder="Lenguaje, motor, social..." value={visitForm.developmentMilestones} onChange={e => setVisitForm({...visitForm, developmentMilestones: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Notas Clínicas</label>
                                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium resize-none outline-none" value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Próxima Cita</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={visitForm.nextAppointment} onChange={e => setVisitForm({...visitForm, nextAppointment: e.target.value})} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button onClick={() => setShowVisitModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleAddVisit} className="flex-[2] py-4 bg-slate-900 rounded-2xl font-black text-xs uppercase text-white shadow-xl hover:bg-blue-600">
                            Guardar Control Completo
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ComprehensiveHealthControl;