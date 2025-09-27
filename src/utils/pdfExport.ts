import jsPDF from 'jspdf';
import { PatientData, TreatmentPlan } from '@/types';

export const exportToPDF = (patientData: PatientData, treatmentPlan: TreatmentPlan, doctorName?: string) => {
  console.log('📄 [PDF] Starting enhanced PDF export for:', patientData.patientName);
  console.log('👨‍⚕️ [PDF] Doctor name:', doctorName || 'Not provided');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Colors
  const colors = {
    primary: [41, 128, 185],      // Blue
    secondary: [52, 152, 219],    // Light Blue
    success: [39, 174, 96],       // Green
    warning: [241, 196, 15],      // Yellow
    danger: [231, 76, 60],        // Red
    dark: [52, 73, 94],           // Dark Gray
    light: [236, 240, 241],       // Light Gray
    text: [44, 62, 80],           // Text Gray
  };

  // Helper functions
  const addHeader = () => {
    // Header background
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PERIODONTAL TREATMENT PLAN', pageWidth / 2, 25, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('AI-Generated Clinical Assessment', pageWidth / 2, 35, { align: 'center' });
    
    currentY = 70;
  };

  const addFooter = () => {
    const footerY = pageHeight - 30;
    doc.setFillColor(...colors.light);
    doc.rect(0, footerY, pageWidth, 30, 'F');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, footerY + 15);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerY + 15, { align: 'right' });
  };

  const checkPageBreak = (neededSpace: number) => {
    if (currentY + neededSpace > pageHeight - 50) {
      addFooter();
      doc.addPage();
      addHeader();
    }
  };

  const addSection = (title: string, content: string, color: number[]) => {
    checkPageBreak(60);
    
    // Section header with colored bar
    doc.setFillColor(...color);
    doc.rect(margin, currentY - 5, contentWidth, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 10, currentY + 7);
    
    currentY += 25;
    
    // Content
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Process content for better formatting
    const processedContent = content.replace(/•/g, '  •').replace(/\n\n/g, '\n \n');
    const lines = doc.splitTextToSize(processedContent, contentWidth - 20);
    
    // Check if content fits on current page
    const contentHeight = lines.length * 6;
    checkPageBreak(contentHeight);
    
    doc.text(lines, margin + 10, currentY);
    currentY += contentHeight + 15;
  };

  const addPatientInfo = () => {
    checkPageBreak(120);
    
    // Patient info box
    doc.setFillColor(...colors.light);
    doc.rect(margin, currentY, contentWidth, 100, 'F');
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.rect(margin, currentY, contentWidth, 100);
    
    // Title
    doc.setTextColor(...colors.primary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', margin + 10, currentY + 15);
    
    // Info in two columns
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const leftColumn = margin + 10;
    const rightColumn = margin + (contentWidth / 2);
    let infoY = currentY + 30;
    
    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Name:', leftColumn, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(patientData.patientName, leftColumn + 35, infoY);
    
    infoY += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Age:', leftColumn, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${patientData.age} years`, leftColumn + 15, infoY);
    
    infoY += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Gender:', leftColumn, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(patientData.gender, leftColumn + 22, infoY);
    
    // Right column
    infoY = currentY + 30;
    if (doctorName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Treating Dentist:', rightColumn, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(doctorName, rightColumn + 40, infoY);
      infoY += 12;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', rightColumn, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), rightColumn + 15, infoY);
    
    // Symptoms
    const symptoms = Object.entries(patientData.symptoms)
      .filter(([, value]) => value)
      .map(([key]) => {
        const labels: Record<string, string> = {
          bleedingGums: 'Bleeding Gums',
          toothMobility: 'Tooth Mobility',
          halitosis: 'Halitosis',
          sensitivity: 'Sensitivity',
          pain: 'Pain',
        };
        return labels[key];
      });
    
    infoY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Presenting Symptoms:', leftColumn, infoY);
    doc.setFont('helvetica', 'normal');
    const symptomsText = symptoms.length > 0 ? symptoms.join(', ') : 'None reported';
    const symptomLines = doc.splitTextToSize(symptomsText, contentWidth - 40);
    doc.text(symptomLines, leftColumn, infoY + 8);
    
    currentY += 115;
  };

  const addClinicalFindings = () => {
    // Medical History
    addSection('MEDICAL HISTORY', patientData.medicalHistory, colors.danger);
    
    // Dental History  
    addSection('DENTAL HISTORY', patientData.dentalHistory, colors.warning);
    
    // Periodontal Findings
    const findings = patientData.periodontalFindings || {
      probingDepths: '',
      gingivalRecession: '',
      mobilityGrade: '',
      radiographicBoneLoss: '',
    };
    
    const findingsText = `Probing Depths: ${findings.probingDepths || 'N/A'}

Gingival Recession: ${findings.gingivalRecession || 'N/A'}

Tooth Mobility: ${findings.mobilityGrade || 'N/A'}

Radiographic Bone Loss: ${findings.radiographicBoneLoss || 'N/A'}`;
    
    addSection('PERIODONTAL FINDINGS', findingsText, colors.secondary);
  };

  const addDisclaimer = () => {
    checkPageBreak(40);
    
    // Disclaimer box
    doc.setFillColor(255, 252, 230); // Light yellow
    doc.rect(margin, currentY, contentWidth, 30, 'F');
    doc.setDrawColor(...colors.warning);
    doc.setLineWidth(2);
    doc.rect(margin, currentY, contentWidth, 30);
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠️ IMPORTANT DISCLAIMER', margin + 10, currentY + 12);
    
    doc.setFont('helvetica', 'normal');
    const disclaimerText = 'This treatment plan is AI-generated and should be reviewed by a licensed dentist before implementation. Clinical judgment and individual patient assessment are essential for proper treatment decisions.';
    const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 20);
    doc.text(disclaimerLines, margin + 10, currentY + 20);
  };

  // Generate PDF
  console.log('🎨 [PDF] Creating professional multi-page PDF...');
  
  // Page 1: Header, Patient Info, Clinical Findings
  addHeader();
  addPatientInfo();
  addClinicalFindings();
  
  // Page 2+: Treatment Plan Sections
  addSection('DIAGNOSIS', treatmentPlan.diagnosis, colors.primary);
  addSection('PROGNOSIS', treatmentPlan.prognosis, colors.secondary);
  addSection('PHASE I: NON-SURGICAL THERAPY', treatmentPlan.phaseI, colors.success);
  addSection('PHASE II: SURGICAL THERAPY', treatmentPlan.phaseII, colors.warning);
  addSection('MAINTENANCE & RECALL SCHEDULE', treatmentPlan.maintenance, colors.primary);
  addSection('ADDITIONAL RECOMMENDATIONS', treatmentPlan.additionalRecommendations, colors.secondary);
  
  // Add disclaimer
  addDisclaimer();
  
  // Add footer to last page
  addFooter();
  
  // Save the PDF
  console.log('💾 [PDF] Saving enhanced PDF file...');
  const fileName = `treatment-plan-${patientData.patientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('✅ [PDF] Enhanced PDF export completed successfully');
};
