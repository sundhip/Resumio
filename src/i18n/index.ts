/**
 * UI Localization (i18n) Scaffolding
 * Provides language switching between English ('en') and Spanish ('es')
 * with fully translated strings for core recruitment and matching workflows.
 */

import { useState, useEffect } from 'react';

export type I18nLanguage = 'en' | 'es';
export type SupportedLanguage = I18nLanguage;

export const TRANSLATIONS: Record<I18nLanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.jobs': 'Job Openings',
    'nav.candidates': 'Candidates',
    'nav.matchLab': 'Match Lab & Scorer',
    'nav.recruiterWorkspace': 'Recruiter Workspace',
    'nav.candidateExperience': 'Candidate Career Hub',
    'nav.platformIntegrations': 'Platform & API Hub',
    'nav.publicBenchmark': 'Public ML Benchmark',
    'nav.logout': 'Sign Out',

    // Match Lab & Heatmap
    'match.scoreTitle': 'Match Fit Score',
    'match.heatmapTitle': 'Resume Evidence Heatmap',
    'match.strongEvidence': 'Strong Requirement Evidence',
    'match.weakEvidence': 'Weak / Partial Evidence',
    'match.generalBackground': 'General Background',
    'match.filterStrong': 'Highlight Strong Evidence',
    'match.filterWeak': 'Highlight Weak Evidence',
    'match.heatRatio': 'Evidence Coverage Density',

    // Platform & Integrations
    'platform.apiKeys': 'Public API Keys',
    'platform.webhooks': 'Outbound Webhooks',
    'platform.atsConnectors': 'ATS Connectors (Greenhouse)',
    'platform.importExport': 'Bulk Import / Export',
    'platform.modelOps': 'ModelOps & Shadow Mode',
    'platform.jdIntelligence': 'JD Quality & Inclusivity',
    'platform.sso': 'Enterprise SSO (OIDC/SAML)',
    'platform.dryRun': 'Dry-Run Schema Validation',

    // Common Actions
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.testSend': 'Test Webhook Ping',
    'action.promote': 'Promote Model to Production',
    'action.rollback': 'Rollback Model',
    'action.exportJson': 'Export JSON',
    'action.exportCsv': 'Export CSV',
    'action.apply': 'Apply Now',
  },
  es: {
    // Navigation
    'nav.dashboard': 'Panel Principal',
    'nav.jobs': 'Ofertas de Empleo',
    'nav.candidates': 'Candidatos',
    'nav.matchLab': 'Laboratorio de Coincidencias',
    'nav.recruiterWorkspace': 'Espacio del Reclutador',
    'nav.candidateExperience': 'Centro de Carrera',
    'nav.platformIntegrations': 'Plataforma e Integraciones',
    'nav.publicBenchmark': 'Evaluación ML Pública',
    'nav.logout': 'Cerrar Sesión',

    // Match Lab & Heatmap
    'match.scoreTitle': 'Puntuación de Ajuste',
    'match.heatmapTitle': 'Mapa de Calor de Evidencia',
    'match.strongEvidence': 'Evidencia Fuerte de Requisito',
    'match.weakEvidence': 'Evidencia Débil o Parcial',
    'match.generalBackground': 'Antecedentes Generales',
    'match.filterStrong': 'Resaltar Evidencia Fuerte',
    'match.filterWeak': 'Resaltar Evidencia Débil',
    'match.heatRatio': 'Densidad de Cobertura de Evidencia',

    // Platform & Integrations
    'platform.apiKeys': 'Claves de API Pública',
    'platform.webhooks': 'Webhooks de Salida',
    'platform.atsConnectors': 'Conectores ATS (Greenhouse)',
    'platform.importExport': 'Importación y Exportación Masiva',
    'platform.modelOps': 'Operaciones de Modelos (Shadow Mode)',
    'platform.jdIntelligence': 'Calidad de JD e Inclusividad',
    'platform.sso': 'SSO Empresarial (OIDC/SAML)',
    'platform.dryRun': 'Validación Previa de Esquema (Dry-Run)',

    // Common Actions
    'action.save': 'Guardar Cambios',
    'action.cancel': 'Cancelar',
    'action.delete': 'Eliminar',
    'action.testSend': 'Probar Envío de Webhook',
    'action.promote': 'Promover Modelo a Producción',
    'action.rollback': 'Revertir Modelo',
    'action.exportJson': 'Exportar JSON',
    'action.exportCsv': 'Exportar CSV',
    'action.apply': 'Postularse Ahora',
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

export function t(key: string): string {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
}

export function useI18n() {
  const [lang, setLang] = useState<I18nLanguage>(getAppLanguage());

  useEffect(() => {
    const handleLangChange = () => setLang(getAppLanguage());
    window.addEventListener('resumio_language_change', handleLangChange);
    return () => window.removeEventListener('resumio_language_change', handleLangChange);
  }, []);

  return {
    lang,
    setLanguage: setAppLanguage,
    t: (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key,
  };
}
