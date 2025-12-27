// Constants for the application

export const CHAT_EXPIRY_DAYS = 7;
export const CHAT_STORAGE_KEY = 'dr_rajeev_chat_id';
export const CHAT_EXPIRY_STORAGE_KEY = 'dr_rajeev_chat_expiry';

// Intake flow steps
export const INTAKE_STEPS = {
  AGE: 'age',
  SEX: 'sex',
  PROBLEM: 'problem',
  DURATION: 'duration',
  EMERGENCY: 'emergency',
  CONDITIONS: 'conditions',
  MEDICATIONS: 'medications',
  COMPLETE: 'complete',
} as const;

// Emergency symptoms
export const EMERGENCY_SYMPTOMS = [
  'chest pain',
  'breathlessness',
  'heavy bleeding',
  'loss of consciousness',
] as const;

// Rate limiting
export const PATIENT_MESSAGE_RATE_LIMIT = 10; // messages per minute
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

