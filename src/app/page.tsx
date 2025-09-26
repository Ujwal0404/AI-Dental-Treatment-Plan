'use client';

import { useState } from 'react';
import { PatientData, TreatmentPlan } from '@/types';
import PatientForm from '@/components/PatientForm';
import TreatmentPlanDisplay from '@/components/TreatmentPlanDisplay';
import { exportToPDF } from '@/utils/pdfExport';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  const handleGeneratePlan = async (data: PatientData) => {
    console.log('🎯 [FRONTEND] Starting plan generation for:', data.patientName);
    setIsLoading(true);
    setPatientData(data);
    
    try {
      console.log('📤 [FRONTEND] Sending request to /api/generate-plan...');
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📥 [FRONTEND] Received response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [FRONTEND] API error:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const plan: TreatmentPlan = await response.json();
      console.log('✅ [FRONTEND] Successfully received treatment plan:', {
        diagnosisLength: plan.diagnosis.length,
        phaseILength: plan.phaseI.length,
        phaseIILength: plan.phaseII.length,
        maintenanceLength: plan.maintenance.length,
        recommendationsLength: plan.additionalRecommendations.length
      });
      setTreatmentPlan(plan);
    } catch (error) {
      console.error('❌ [FRONTEND] Error generating treatment plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate treatment plan: ${errorMessage}`);
    } finally {
      console.log('🏁 [FRONTEND] Plan generation completed');
      setIsLoading(false);
    }
  };

  const handleEditPlan = (editedPlan: TreatmentPlan) => {
    console.log('✏️ [FRONTEND] Plan edited, updating state');
    setTreatmentPlan(editedPlan);
  };

  const handleBack = () => {
    console.log('🔙 [FRONTEND] Back button clicked, returning to form');
    setTreatmentPlan(null);
    setPatientData(null);
  };

  const handleExportPDF = (doctorName?: string) => {
    console.log('📄 [FRONTEND] Exporting PDF for doctor:', doctorName || 'Unknown');
    if (patientData && treatmentPlan) {
      exportToPDF(patientData, treatmentPlan, doctorName);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {!treatmentPlan ? (
          <PatientForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
        ) : (
          <TreatmentPlanDisplay
            patientData={patientData!}
            treatmentPlan={treatmentPlan}
            onEdit={handleEditPlan}
            onExportPDF={handleExportPDF}
            onBack={handleBack}
          />
        )}
      </div>
    </main>
  );
}