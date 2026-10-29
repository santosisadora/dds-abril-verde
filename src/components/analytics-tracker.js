/**
 * src/components/analytics-tracker.js
 * Métricas de Engajamento em AR (leituras de QR/sessões, detecções de target,
 * tempo acumulado com câmera focada no marcador e eventos de conclusão).
 */

const STORAGE_KEY = 'abril_verde_analytics_v1';

function loadMetrics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    sessionsCount: 0,
    targetDetections: 0,
    totalFocusSeconds: 0,
    checklistsCompleted: 0,
    checkinsSubmitted: 0,
    desktopModeActivations: 0,
    lastAccess: null
  };
}

function saveMetrics(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

export const Analytics = {
  metrics: loadMetrics(),
  _focusStartMs: null,

  trackEvent(eventName, payload = {}) {
    console.log(`[Analytics] ${eventName}`, payload);
    // Suporte automático a Google Analytics (gtag) ou Plausible se presentes
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
    if (typeof window.plausible === 'function') {
      window.plausible(eventName, { props: payload });
    }
  },

  recordSessionStart() {
    this.metrics.sessionsCount += 1;
    this.metrics.lastAccess = new Date().toISOString();
    saveMetrics(this.metrics);
    this.trackEvent('ar_session_start', { sessions: this.metrics.sessionsCount });
  },

  startTargetFocus() {
    this.metrics.targetDetections += 1;
    this._focusStartMs = Date.now();
    saveMetrics(this.metrics);
    this.trackEvent('ar_target_found', { detections: this.metrics.targetDetections });
  },

  endTargetFocus() {
    if (this._focusStartMs) {
      const elapsedSec = Math.max(1, Math.round((Date.now() - this._focusStartMs) / 1000));
      this.metrics.totalFocusSeconds += elapsedSec;
      this._focusStartMs = null;
      saveMetrics(this.metrics);
      this.trackEvent('ar_target_lost', { addedSeconds: elapsedSec, totalFocusSeconds: this.metrics.totalFocusSeconds });
    }
  },

  getLiveFocusSeconds() {
    let extra = 0;
    if (this._focusStartMs) {
      extra = Math.round((Date.now() - this._focusStartMs) / 1000);
    }
    return this.metrics.totalFocusSeconds + extra;
  },

  recordChecklistComplete() {
    this.metrics.checklistsCompleted += 1;
    saveMetrics(this.metrics);
    this.trackEvent('dds_checklist_complete');
  },

  recordCheckinSubmitted(colaborador, matricula) {
    this.metrics.checkinsSubmitted += 1;
    saveMetrics(this.metrics);
    this.trackEvent('dds_checkin_submitted', { colaborador, matricula });
  },

  recordDesktopMode() {
    this.metrics.desktopModeActivations += 1;
    saveMetrics(this.metrics);
    this.trackEvent('desktop_3d_mode_enabled');
  }
};
