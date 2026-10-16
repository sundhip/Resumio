/**
 * Resumio UI Localization & Canonical Content Dictionary (i18n)
 *
 * Implements the R0 Content Audit standards (docs/ui-audit/CONTENT_AUDIT.md):
 * - Canonical Glossary: Match Fit, Hiring Pipeline, Resume Screening, Job Opening, Interview, Evidence Span, Verified by Evidence, Human-in-the-Loop.
 * - Verb + Object action buttons (e.g., 'Publish Job Opening', 'Update Profile Information').
 * - Clear error states (What happened, Why, and Next Step).
 * - Meaningful, actionable empty states.
 * - Anti-jargon translations for transparent candidate and recruiter interfaces.
 */

import { useState, useEffect } from 'react';

export type I18nLanguage = 'en' | 'es';
export type SupportedLanguage = I18nLanguage;

export const TRANSLATIONS: Record<I18nLanguage, Record<string, string>> = {
  en: {
    // Brand & Product Identity
    'app.name': 'Resumio',
    'app.tagline': 'Production ATS Intelligence & Explainable Match Scoring',
    'app.heroTitle': 'Measurably Better Hiring Decisions. Zero Black Boxes.',
    'app.heroSubtitle': 'Deterministic, traceable match reports with concrete evidence spans, strict anti-bias guarantees, and human decision-making.',

    // Canonical Glossary Definitions
    'glossary.matchFit': 'Match Fit',
    'glossary.matchFitDescription': 'Quantitative percentage (0–100%) indicating how thoroughly verified skills and experience substantiate job requirements.',
    'glossary.hiringPipeline': 'Hiring Pipeline',
    'glossary.hiringPipelineDescription': 'Sequential stages an applicant progresses through (Applied -> Screening -> Interview -> Offer -> Hired).',
    'glossary.resumeScreening': 'Resume Screening',
    'glossary.resumeScreeningDescription': 'Objective parsing and structural evaluation of candidate resume documents.',
    'glossary.jobOpening': 'Job Opening',
    'glossary.jobOpeningDescription': 'A defined requisition with mandatory required skills, preferred bonuses, and calibrated weights.',
    'glossary.interview': 'Interview',
    'glossary.interviewDescription': 'Structured evaluation session linked to candidate evidence rubrics.',
    'glossary.evidenceSpan': 'Evidence Span',
    'glossary.evidenceSpanDescription': 'An exact excerpt or highlighted phrase from a candidate resume or repository corroborating a qualification.',
    'glossary.verifiedByEvidence': 'Verified by Evidence',
    'glossary.verifiedByEvidenceDescription': 'Badge awarded when a candidate qualification is independently confirmed by public code activity or verified records.',
    'glossary.humanInTheLoop': 'Human-in-the-Loop',
    'glossary.humanInTheLoopDescription': 'Resumio guarantee that every shortlisting, progression, and hiring decision is executed solely by human evaluators.',

    // Navigation Items
    'nav.dashboard': 'Dashboard',
    'nav.jobs': 'Job Openings',
    'nav.exploreJobs': 'Explore Job Openings',
    'nav.postJob': 'Publish Job Opening',
    'nav.candidates': 'Candidate Directory',
    'nav.pipeline': 'Hiring Pipeline',
    'nav.recruiterWorkspace': 'Recruiter Workspace',
    'nav.candidateExperience': 'Candidate Career Hub',
    'nav.resumeManager': 'Resume Manager',
    'nav.atsResumeStudio': 'ATS Resume Studio',
    'nav.applications': 'Applied Positions',
    'nav.interviews': 'Scheduled Interviews',
    'nav.analytics': 'Recruitment Analytics',
    'nav.platformIntegrations': 'Platform & API Hub',
    'nav.publicBenchmark': 'Public ML Benchmark',
    'nav.skillsOntology': 'Skill Ontology & Knowledge Base',
    'nav.modelOps': 'ModelOps AI Registry',
    'nav.settings': 'Account & Security Settings',
    'nav.logout': 'Sign Out',

    // Match Fit & Evidence Scoring
    'match.scoreTitle': 'Match Fit Score',
    'match.scoreFormula': 'Traceable Weighted Formula: Skills + Experience + Semantic Coverage',
    'match.heatmapTitle': 'Resume Evidence Heatmap',
    'match.strongEvidence': 'Verified Requirement Evidence',
    'match.weakEvidence': 'Partial or Related Evidence',
    'match.generalBackground': 'General Professional Background',
    'match.filterStrong': 'Highlight Verified Evidence',
    'match.filterWeak': 'Highlight Partial Evidence',
    'match.heatRatio': 'Evidence Coverage Density',
    'match.blindScreeningActive': 'Blind Screening Active (Demographic signals concealed)',
    'match.antiBiasNotice': 'Demographic attributes (name, gender, age, photo, nationality) are strictly excluded from scoring.',

    // Verb + Object Action Buttons
    'action.publishJob': 'Publish Job Opening',
    'action.saveDraft': 'Save as Draft',
    'action.updateJob': 'Update Job Opening',
    'action.applyPrimary': 'Submit Application with Primary Resume',
    'action.applyVersion': 'Submit Application with Selected Resume',
    'action.uploadResume': 'Upload Resume Document',
    'action.ingestQueue': 'Ingest Resumes into Queue',
    'action.connectGithub': 'Connect Public GitHub Profile',
    'action.scheduleInterview': 'Confirm & Send Interview Invitation',
    'action.submitScorecard': 'Submit Structured Scorecard',
    'action.updateProfile': 'Update Profile Information',
    'action.saveChanges': 'Save Configuration Changes',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete Permanently',
    'action.exportJson': 'Export Data as JSON',
    'action.exportCsv': 'Export Data as CSV',
    'action.promoteModel': 'Promote Model to Production',
    'action.rollbackModel': 'Rollback Model to Baseline',
    'action.runAudit': 'Execute Verification Audit',
    'action.dismiss': 'Dismiss Notice',

    // Actionable Empty States
    'empty.jobsTitle': 'No active Job Openings found',
    'empty.jobsDescription': 'Create your first job requisition to calibrate required skills, set scoring weights, and begin receiving applicants.',
    'empty.pipelineTitle': 'No applicants in this Hiring Pipeline yet',
    'empty.pipelineDescription': 'Share your published Job Opening or ingest candidate resume files to populate the review queue.',
    'empty.applicationsTitle': 'You have not submitted any applications yet',
    'empty.applicationsDescription': 'Explore curated Job Openings tailored to your verified skills and submit applications with 1 click.',
    'empty.resumesTitle': 'No resume versions uploaded',
    'empty.resumesDescription': 'Upload your primary resume in PDF or DOCX format to receive instant ATS parse feedback and health metrics.',
    'empty.interviewsTitle': 'No interviews scheduled',
    'empty.interviewsDescription': 'When candidates are advanced to the Interview stage, scheduled interview sessions and scorecards will appear here.',

    // Structured Error States (What, Why, Next Step)
    'error.uploadInvalidFormat': 'Unsupported File Format: The uploaded document is not a recognized PDF or DOCX file. Please convert your resume to standard PDF or DOCX and retry.',
    'error.uploadSizeLimit': 'File Size Exceeded: The uploaded document exceeds the 5MB upload limit. Please optimize or compress your document and re-upload.',
    'error.networkUnavailable': 'Network Request Failed: Unable to reach the Resumio application server. Please verify your connection or ensure the offline fallback service is active.',
    'error.authInvalidCredentials': 'Authentication Failed: The provided email or password does not match our records. Verify your login details or use the 1-click demo accounts.',
    'error.unauthorizedAction': 'Access Restricted: Your current account role does not have authorization to modify this resource. Switch to an administrator or authorized recruiter profile.',
    'error.biasGuardrailTriggered': 'Search Query Adjusted: Demographic parameters (age, gender, ethnicity) were excluded to enforce anti-bias hiring regulations.',

    // Tooltips & Guidance
    'tooltip.scoreExplanation': 'Based on verified required skills match, substantiated years of experience, and semantic role context.',
    'tooltip.blindMode': 'Conceals candidate name, photos, graduation years, and demographic indicators during initial screening to eliminate unconscious bias.',
    'tooltip.whatIfSimulator': 'Simulates how your Match Fit percentage increases if you add and substantiate this skill with verified project evidence.',
    'tooltip.offlineFallback': 'Resumio uses a deterministic BM25 and rule-based scorer when external cloud APIs are unavailable, ensuring 100% offline availability.',

    // System & Governance
    'governance.auditLogged': 'Action logged to tamper-evident audit ledger with timestamp and user ID.',
    'governance.disasterRecovery': 'Automated SQLite point-in-time restore drills verified with cryptographic parity.',
    'governance.dataPurge': 'Cascading permanent account deletion available under GDPR Article 17 and DPDP compliance.',
  },
  es: {
    // Brand & Product Identity
    'app.name': 'Resumio',
    'app.tagline': 'Inteligencia ATS de Producción y Evaluación Explicable de Candidatos',
    'app.heroTitle': 'Decisiones de Contratación Mediblemente Mejores. Cero Cajas Negras.',
    'app.heroSubtitle': 'Informes de ajuste deterministas y trazables con evidencia concreta, salvaguardas contra sesgos y decisiones humanas.',

    // Canonical Glossary Definitions
    'glossary.matchFit': 'Ajuste de Candidato (Match Fit)',
    'glossary.matchFitDescription': 'Porcentaje cuantitativo (0–100%) que indica el grado en que las habilidades y experiencia verificadas fundamentan los requisitos del puesto.',
    'glossary.hiringPipeline': 'Canal de Contratación (Hiring Pipeline)',
    'glossary.hiringPipelineDescription': 'Fases secuenciales por las que avanza un postulante (Postulado -> Evaluación -> Entrevista -> Oferta -> Contratado).',
    'glossary.resumeScreening': 'Evaluación de Currículum (Resume Screening)',
    'glossary.resumeScreeningDescription': 'Análisis objetivo y estructurado de los documentos de currículum de los candidatos.',
    'glossary.jobOpening': 'Oferta de Empleo (Job Opening)',
    'glossary.jobOpeningDescription': 'Requisición con habilidades obligatorias, bonificaciones deseadas y ponderaciones calibradas.',
    'glossary.interview': 'Entrevista (Interview)',
    'glossary.interviewDescription': 'Sesión de evaluación estructurada vinculada a rúbricas de evidencia del candidato.',
    'glossary.evidenceSpan': 'Fragmento de Evidencia (Evidence Span)',
    'glossary.evidenceSpanDescription': 'Extracto textual de un currículum o repositorio que corrobora una habilidad afirmada.',
    'glossary.verifiedByEvidence': 'Verificado por Evidencia',
    'glossary.verifiedByEvidenceDescription': 'Distintivo otorgado cuando una habilidad es confirmada de manera independiente por actividad pública de código.',
    'glossary.humanInTheLoop': 'Supervisión Humana Permanente (Human-in-the-Loop)',
    'glossary.humanInTheLoopDescription': 'Garantía de que toda decisión de preselección, avance o descarte es ejecutada exclusivamente por evaluadores humanos.',

    // Navigation Items
    'nav.dashboard': 'Panel Principal',
    'nav.jobs': 'Ofertas de Empleo',
    'nav.exploreJobs': 'Explorar Ofertas de Empleo',
    'nav.postJob': 'Publicar Oferta de Empleo',
    'nav.candidates': 'Directorio de Candidatos',
    'nav.pipeline': 'Canal de Contratación',
    'nav.recruiterWorkspace': 'Espacio del Reclutador',
    'nav.candidateExperience': 'Centro de Carrera',
    'nav.resumeManager': 'Gestor de Currículum',
    'nav.atsResumeStudio': 'Estudio de Currículum ATS',
    'nav.applications': 'Puestos Postulados',
    'nav.interviews': 'Entrevistas Programadas',
    'nav.analytics': 'Analítica de Contratación',
    'nav.platformIntegrations': 'Plataforma y Conectores API',
    'nav.publicBenchmark': 'Evaluación Pública de Modelos',
    'nav.skillsOntology': 'Ontología y Taxonomía de Habilidades',
    'nav.modelOps': 'Registro de ModelOps',
    'nav.settings': 'Configuración y Seguridad',
    'nav.logout': 'Cerrar Sesión',

    // Match Fit & Evidence Scoring
    'match.scoreTitle': 'Puntuación de Ajuste (Match Fit)',
    'match.scoreFormula': 'Fórmula Ponderada Trazable: Habilidades + Experiencia + Cobertura Semántica',
    'match.heatmapTitle': 'Mapa de Calor de Evidencia',
    'match.strongEvidence': 'Evidencia Verificada de Requisito',
    'match.weakEvidence': 'Evidencia Parcial o Relacionada',
    'match.generalBackground': 'Antecedentes Profesionales Generales',
    'match.filterStrong': 'Resaltar Evidencia Verificada',
    'match.filterWeak': 'Resaltar Evidencia Parcial',
    'match.heatRatio': 'Densidad de Cobertura de Evidencia',
    'match.blindScreeningActive': 'Evaluación a Ciegas Activa (Datos demográficos ocultos)',
    'match.antiBiasNotice': 'Los atributos demográficos están estrictamente excluidos de la puntuación.',

    // Verb + Object Action Buttons
    'action.publishJob': 'Publicar Oferta de Empleo',
    'action.saveDraft': 'Guardar como Borrador',
    'action.updateJob': 'Actualizar Oferta de Empleo',
    'action.applyPrimary': 'Enviar Postulación con Currículum Principal',
    'action.applyVersion': 'Enviar Postulación con Versión Seleccionada',
    'action.uploadResume': 'Subir Documento de Currículum',
    'action.ingestQueue': 'Ingresar Currículums a la Cola',
    'action.connectGithub': 'Conectar Perfil Público de GitHub',
    'action.scheduleInterview': 'Confirmar y Enviar Invitación a Entrevista',
    'action.submitScorecard': 'Enviar Rúbrica Estructurada',
    'action.updateProfile': 'Actualizar Información de Perfil',
    'action.saveChanges': 'Guardar Cambios de Configuración',
    'action.cancel': 'Cancelar',
    'action.delete': 'Eliminar Definitivamente',
    'action.exportJson': 'Exportar Datos en JSON',
    'action.exportCsv': 'Exportar Datos en CSV',
    'action.promoteModel': 'Promover Modelo a Producción',
    'action.rollbackModel': 'Revertir Modelo a Versión Anterior',
    'action.runAudit': 'Ejecutar Auditoría de Verificación',
    'action.dismiss': 'Descartar Aviso',

    // Actionable Empty States
    'empty.jobsTitle': 'No hay ofertas de empleo activas',
    'empty.jobsDescription': 'Cree su primera requisición para calibrar requisitos y comenzar a recibir postulantes.',
    'empty.pipelineTitle': 'Sin postulantes en este Canal de Contratación',
    'empty.pipelineDescription': 'Comparta su oferta de empleo o suba currículums para iniciar la revisión.',
    'empty.applicationsTitle': 'Aún no ha enviado ninguna postulación',
    'empty.applicationsDescription': 'Explore ofertas de empleo y postúlese en 1 clic con su currículum verificado.',
    'empty.resumesTitle': 'No hay versiones de currículum cargadas',
    'empty.resumesDescription': 'Suba su currículum en formato PDF o DOCX para obtener análisis inmediato de compatibilidad ATS.',
    'empty.interviewsTitle': 'No hay entrevistas programadas',
    'empty.interviewsDescription': 'Cuando los candidatos avancen a la fase de entrevista, las sesiones programadas aparecerán aquí.',

    // Structured Error States
    'error.uploadInvalidFormat': 'Formato No Válido: El archivo no es un documento PDF o DOCX reconocido. Por favor convierta su documento y vuelva a intentarlo.',
    'error.uploadSizeLimit': 'Límite de Tamaño Excedido: El archivo supera los 5MB permitidos. Optimice el documento y vuelva a cargarlo.',
    'error.networkUnavailable': 'Error de Conexión: No es posible conectar con el servidor de Resumio. Verifique su red.',
    'error.authInvalidCredentials': 'Error de Autenticación: El correo o la contraseña no coinciden con nuestros registros.',
    'error.unauthorizedAction': 'Acceso Restringido: Su rol actual no cuenta con autorización para realizar esta acción.',
    'error.biasGuardrailTriggered': 'Búsqueda Ajustada: Los parámetros demográficos se excluyeron para garantizar cumplimiento contra sesgos.',

    // Tooltips
    'tooltip.scoreExplanation': 'Basado en habilidades requeridas verificadas, años de experiencia demostrados y contexto del puesto.',
    'tooltip.blindMode': 'Oculta nombre, fotos y datos demográficos para erradicar sesgos inconscientes.',
    'tooltip.whatIfSimulator': 'Simula el aumento de su Ajuste de Candidato al corroborar esta habilidad con evidencia práctica.',
    'tooltip.offlineFallback': 'Resumio opera de manera determinista y local sin requerir servicios en la nube externos.',

    // Governance
    'governance.auditLogged': 'Acción registrada en el registro de auditoría con marca temporal.',
    'governance.disasterRecovery': 'Pruebas de restauración de base de datos ejecutadas con paridad criptográfica del 100%.',
    'governance.dataPurge': 'Eliminación permanente y definitiva de cuenta disponible conforme al RGPD.',
  },
};

let currentLang: I18nLanguage = (localStorage.getItem('resumio_lang') as I18nLanguage) || 'en';

export function setAppLanguage(lang: I18nLanguage) {
  currentLang = lang;
  localStorage.setItem('resumio_lang', lang);
  window.dispatchEvent(new Event('resumio_language_change'));
}

export function getAppLanguage(): I18nLanguage {
  return currentLang;
}

export function t(key: string, fallback?: string): string {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || fallback || key;
}

export function useI18n() {
  const [lang, setLang] = useState<I18nLanguage>(getAppLanguage());

  useEffect(() => {
    const handleLangChange = () => {
      setLang(getAppLanguage());
    };
    window.addEventListener('resumio_language_change', handleLangChange);
    return () => window.removeEventListener('resumio_language_change', handleLangChange);
  }, []);

  return {
    lang,
    setLanguage: setAppLanguage,
    t: (key: string, fallback?: string) => t(key, fallback),
  };
}
