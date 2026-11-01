// TypeScript types and exports bridging to error-configs.js
export interface ErrorAction {
  label: string;
  href?: string;
  actionType?: 'link' | 'reset' | 'reload' | 'back';
}

export interface ErrorPageConfig {
  code: string;
  badge?: string;
  title: string;
  description: string;
  primaryAction: ErrorAction;
  secondaryAction?: ErrorAction;
  showIncidentId?: boolean;
  showCountdown?: boolean;
  countdownSeconds?: number;
}

// Re-export implementations from error-configs.js
const {
  ERROR_CONFIGS,
  getErrorConfig,
  generateIncidentId,
  sanitizeRedirectUrl,
} = require("./error-configs.js");

export { ERROR_CONFIGS, getErrorConfig, generateIncidentId, sanitizeRedirectUrl };

