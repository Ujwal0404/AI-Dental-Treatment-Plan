export interface PatientData {
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalHistory: string;
  dentalHistory: string;
  symptoms: {
    bleedingGums: boolean;
    toothMobility: boolean;
    halitosis: boolean;
    sensitivity: boolean;
    pain: boolean;
  };
  periodontalFindings: {
    probingDepths: string;
    gingivalRecession: string;
    mobilityGrade: string;
    radiographicBoneLoss: string;
  };
}

export interface TreatmentPlan {
  diagnosis: string;
  prognosis: string;
  phaseI: string;
  phaseII: string;
  maintenance: string;
  additionalRecommendations: string;
}

export interface GeneratedPlan {
  id: string;
  patientData: PatientData;
  treatmentPlan: TreatmentPlan;
  createdAt: Date;
  isEdited: boolean;
}
