import type { VitalConfig, VitalType, VitalStatus } from '@/types/health';

export const VITAL_CONFIGS: Record<VitalType, VitalConfig> = {
  blood_pressure: {
    type: 'blood_pressure',
    label: 'Blood Pressure',
    unit: 'mmHg',
    icon: 'Heart',
    normalRange: { min: 90, max: 120 },
    warningRange: { min: 80, max: 140 },
    hasSecondaryValue: true,
    secondaryLabel: 'Diastolic',
  },
  heart_rate: {
    type: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    icon: 'Activity',
    normalRange: { min: 60, max: 100 },
    warningRange: { min: 50, max: 120 },
  },
  temperature: {
    type: 'temperature',
    label: 'Temperature',
    unit: '°F',
    icon: 'Thermometer',
    normalRange: { min: 97, max: 99 },
    warningRange: { min: 95, max: 101 },
  },
  weight: {
    type: 'weight',
    label: 'Weight',
    unit: 'kg',
    icon: 'Scale',
    normalRange: { min: 50, max: 90 },
    warningRange: { min: 40, max: 120 },
  },
  blood_sugar: {
    type: 'blood_sugar',
    label: 'Blood Sugar',
    unit: 'mg/dL',
    icon: 'Droplet',
    normalRange: { min: 70, max: 100 },
    warningRange: { min: 60, max: 140 },
  },
  oxygen_saturation: {
    type: 'oxygen_saturation',
    label: 'Oxygen Level',
    unit: '%',
    icon: 'Wind',
    normalRange: { min: 95, max: 100 },
    warningRange: { min: 90, max: 100 },
  },
  bmi: {
    type: 'bmi',
    label: 'BMI',
    unit: 'kg/m²',
    icon: 'TrendingUp',
    normalRange: { min: 18.5, max: 24.9 },
    warningRange: { min: 16, max: 30 },
  },
  cholesterol: {
    type: 'cholesterol',
    label: 'Cholesterol',
    unit: 'mg/dL',
    icon: 'Beaker',
    normalRange: { min: 0, max: 200 },
    warningRange: { min: 0, max: 240 },
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    unit: '',
    icon: 'Plus',
    normalRange: { min: 0, max: 100 },
    warningRange: { min: 0, max: 100 },
  },
};

export const getVitalStatus = (
  value: number,
  type: VitalType,
  secondaryValue?: number
): VitalStatus => {
  const config = VITAL_CONFIGS[type];
  
  // Special handling for blood pressure (systolic/diastolic)
  if (type === 'blood_pressure' && secondaryValue !== undefined) {
    const systolicNormal = value >= 90 && value <= 120;
    const diastolicNormal = secondaryValue >= 60 && secondaryValue <= 80;
    const systolicWarning = value >= 80 && value <= 140;
    const diastolicWarning = secondaryValue >= 50 && secondaryValue <= 90;
    
    if (systolicNormal && diastolicNormal) return 'normal';
    if (systolicWarning && diastolicWarning) return 'warning';
    return 'critical';
  }

  const { normalRange, warningRange } = config;
  
  if (value >= normalRange.min && value <= normalRange.max) {
    return 'normal';
  }
  
  if (value >= warningRange.min && value <= warningRange.max) {
    return 'warning';
  }
  
  return 'critical';
};

export const getStatusColor = (status: VitalStatus): string => {
  switch (status) {
    case 'normal':
      return 'bg-health-normal text-health-normal-foreground';
    case 'warning':
      return 'bg-health-warning text-health-warning-foreground';
    case 'critical':
      return 'bg-health-critical text-health-critical-foreground';
  }
};

export const getStatusBorderColor = (status: VitalStatus): string => {
  switch (status) {
    case 'normal':
      return 'border-l-health-normal';
    case 'warning':
      return 'border-l-health-warning';
    case 'critical':
      return 'border-l-health-critical';
  }
};
