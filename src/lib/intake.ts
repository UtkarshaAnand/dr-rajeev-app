// Intake flow utilities

import { INTAKE_STEPS, EMERGENCY_SYMPTOMS } from './constants';

export type IntakeStep = typeof INTAKE_STEPS[keyof typeof INTAKE_STEPS];

export interface IntakeState {
  step: IntakeStep;
  age: number | null;
  sex: 'Male' | 'Female' | null;
  complaint: string | null;
  duration: string | null;
  emergency: boolean | null;
  emergencySymptoms: string[];
  conditions: string | null;
  medications: string | null;
}

export const initialIntakeState: IntakeState = {
  step: INTAKE_STEPS.AGE,
  age: null,
  sex: null,
  complaint: null,
  duration: null,
  emergency: null,
  emergencySymptoms: [],
  conditions: null,
  medications: null,
};

export function getNextStep(currentStep: IntakeStep): IntakeStep | null {
  const stepOrder = [
    INTAKE_STEPS.AGE,
    INTAKE_STEPS.SEX,
    INTAKE_STEPS.PROBLEM,
    INTAKE_STEPS.DURATION,
    INTAKE_STEPS.EMERGENCY,
    INTAKE_STEPS.CONDITIONS,
    INTAKE_STEPS.MEDICATIONS,
    INTAKE_STEPS.COMPLETE,
  ];

  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
    return null;
  }

  return stepOrder[currentIndex + 1];
}

export function getStepQuestion(step: IntakeStep): string {
  switch (step) {
    case INTAKE_STEPS.AGE:
      return 'What is your age?';
    case INTAKE_STEPS.SEX:
      return 'What is your sex?';
    case INTAKE_STEPS.PROBLEM:
      return 'What is your main problem or concern?';
    case INTAKE_STEPS.DURATION:
      return 'How long have you been experiencing this?';
    case INTAKE_STEPS.EMERGENCY:
      return 'Are you experiencing any of these emergency symptoms?';
    case INTAKE_STEPS.CONDITIONS:
      return 'Do you have any existing medical conditions? (Type "NO" if none)';
    case INTAKE_STEPS.MEDICATIONS:
      return 'Are you currently taking any medications? (Type "NO" if none)';
    default:
      return '';
  }
}

export function validateStep(step: IntakeStep, value: any): boolean {
  switch (step) {
    case INTAKE_STEPS.AGE:
      return typeof value === 'number' && value > 0 && value < 150;
    case INTAKE_STEPS.SEX:
      return ['Male', 'Female'].includes(value);
    case INTAKE_STEPS.PROBLEM:
      return typeof value === 'string' && value.trim().length > 0;
    case INTAKE_STEPS.DURATION:
      return typeof value === 'string' && value.trim().length > 0;
    case INTAKE_STEPS.EMERGENCY:
      return typeof value === 'boolean';
    case INTAKE_STEPS.CONDITIONS:
      return typeof value === 'string';
    case INTAKE_STEPS.MEDICATIONS:
      return typeof value === 'string';
    default:
      return false;
  }
}

