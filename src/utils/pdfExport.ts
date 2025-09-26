import jsPDF from 'jspdf';
import { PatientData, TreatmentPlan } from '@/types';

export const exportToPDF = (patientData: PatientData, treatmentPlan: TreatmentPlan, doctorName?: string) => {
  console.log('📄 [PDF] Starting PDF export for:', patientData.patientName);
  console.log('👨‍⚕️ [PDF] Doctor name:', doctorName || 'Not provided');
  
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(20);
  doc.text('Periodontal Treatment Plan', 20, 30);
  
  // Doctor Name
  if (doctorName) {
    doc.setFontSize(12);
    doc.text(`Treating Dentist: ${doctorName}`, 20, 40);
  }
  
  console.log('📝 [PDF] Adding patient information...');
  
  // Patient Information
  doc.setFontSize(14);
  doc.text('Patient Information:', 20, 50);
  doc.setFontSize(12);
  doc.text(`Name: ${patientData.patientName}`, 20, 60);
  doc.text(`Age: ${patientData.age} years`, 20, 68);
  doc.text(`Gender: ${patientData.gender}`, 20, 76);
  
  // Symptoms
  const symptoms = Object.entries(patientData.symptoms)
    .filter(([_, value]) => value)
    .map(([key, _]) => {
      const labels: Record<string, string> = {
        bleedingGums: 'Bleeding Gums',
        toothMobility: 'Tooth Mobility',
        halitosis: 'Halitosis',
        sensitivity: 'Sensitivity',
        pain: 'Pain',
      };
      return labels[key];
    });
  
  doc.text(`Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None reported'}`, 20, 84);
  
  // Medical History
  doc.text('Medical History:', 20, 100);
  const medicalHistoryLines = doc.splitTextToSize(patientData.medicalHistory, 170);
  doc.text(medicalHistoryLines, 20, 108);
  
  // Dental History
  const dentalHistoryY = 108 + (medicalHistoryLines.length * 5) + 10;
  doc.text('Dental History:', 20, dentalHistoryY);
  const dentalHistoryLines = doc.splitTextToSize(patientData.dentalHistory, 170);
  doc.text(dentalHistoryLines, 20, dentalHistoryY + 8);
  
  // Periodontal Findings (safe access with fallbacks)
  const periodontalY = dentalHistoryY + 8 + (dentalHistoryLines.length * 5) + 10;
  const findings = patientData.periodontalFindings || {
    probingDepths: '',
    gingivalRecession: '',
    mobilityGrade: '',
    radiographicBoneLoss: '',
  };
  doc.text('Periodontal Findings:', 20, periodontalY);
  doc.text(
    `Probing Depths: ${findings.probingDepths || 'N/A'}`,
    20,
    periodontalY + 8
  );
  doc.text(
    `Gingival Recession: ${findings.gingivalRecession || 'N/A'}`,
    20,
    periodontalY + 16
  );
  doc.text(
    `Mobility Grade: ${findings.mobilityGrade || 'N/A'}`,
    20,
    periodontalY + 24
  );
  doc.text(
    `Radiographic Bone Loss: ${findings.radiographicBoneLoss || 'N/A'}`,
    20,
    periodontalY + 32
  );
  
  // Treatment Plan
  const treatmentY = periodontalY + 40;
  doc.setFontSize(14);
  doc.text('Treatment Plan:', 20, treatmentY);
  
  doc.setFontSize(12);
  doc.text('Diagnosis:', 20, treatmentY + 10);
  const diagnosisLines = doc.splitTextToSize(treatmentPlan.diagnosis, 170);
  doc.text(diagnosisLines, 20, treatmentY + 18);
  
  const phaseIY = treatmentY + 18 + (diagnosisLines.length * 5) + 10;
  doc.text('Phase I: Non-surgical Therapy:', 20, phaseIY);
  const phaseILines = doc.splitTextToSize(treatmentPlan.phaseI, 170);
  doc.text(phaseILines, 20, phaseIY + 8);
  
  const phaseIIY = phaseIY + 8 + (phaseILines.length * 5) + 10;
  doc.text('Phase II: Surgical Therapy:', 20, phaseIIY);
  const phaseIILines = doc.splitTextToSize(treatmentPlan.phaseII, 170);
  doc.text(phaseIILines, 20, phaseIIY + 8);
  
  const maintenanceY = phaseIIY + 8 + (phaseIILines.length * 5) + 10;
  doc.text('Maintenance/Recall Schedule:', 20, maintenanceY);
  const maintenanceLines = doc.splitTextToSize(treatmentPlan.maintenance, 170);
  doc.text(maintenanceLines, 20, maintenanceY + 8);
  
  const recommendationsY = maintenanceY + 8 + (maintenanceLines.length * 5) + 10;
  doc.text('Additional Recommendations:', 20, recommendationsY);
  const recommendationsLines = doc.splitTextToSize(treatmentPlan.additionalRecommendations, 170);
  doc.text(recommendationsLines, 20, recommendationsY + 8);
  
  // Disclaimer
  const disclaimerY = recommendationsY + 8 + (recommendationsLines.length * 5) + 20;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('Disclaimer: This treatment plan is AI-generated and should be reviewed by a licensed dentist before implementation.', 20, disclaimerY);
  
  // Save the PDF
  console.log('💾 [PDF] Saving PDF file...');
  doc.save(`treatment-plan-${patientData.patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  console.log('✅ [PDF] PDF export completed successfully');
};
