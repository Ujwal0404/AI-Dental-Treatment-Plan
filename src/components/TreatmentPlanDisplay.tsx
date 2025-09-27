'use client';

import { useState } from 'react';
import { TreatmentPlan, PatientData } from '@/types';
import { Edit3, Download, Save, X, ArrowLeft, User } from 'lucide-react';

interface TreatmentPlanDisplayProps {
  patientData: PatientData;
  treatmentPlan: TreatmentPlan;
  onEdit: (editedPlan: TreatmentPlan) => void;
  onExportPDF: (doctorName?: string) => void;
  onBack: () => void;
}

export default function TreatmentPlanDisplay({
  patientData,
  treatmentPlan,
  onEdit,
  onExportPDF,
  onBack,
}: TreatmentPlanDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<TreatmentPlan>(treatmentPlan);
  const [doctorName, setDoctorName] = useState('Dr. [Your Name]');

  const handleEdit = () => {
    console.log('✏️ [DISPLAY] Starting edit mode');
    setIsEditing(true);
  };

  const handleSave = () => {
    console.log('💾 [DISPLAY] Saving edited plan');
    onEdit(editedPlan);
    setIsEditing(false);
  };

  const handleCancel = () => {
    console.log('❌ [DISPLAY] Canceling edit, reverting changes');
    setEditedPlan(treatmentPlan);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof TreatmentPlan, value: string) => {
    setEditedPlan(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatSymptoms = (symptoms: PatientData['symptoms']) => {
    const activeSymptoms = Object.entries(symptoms)
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
    return activeSymptoms.length > 0 ? activeSymptoms.join(', ') : 'None reported';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Treatment Plan</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
              >
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => onExportPDF(doctorName)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Doctor Name */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Treating Dentist</h3>
        </div>
        <input
          type="text"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          placeholder="Enter doctor name"
        />
      </div>

      {/* Patient Summary */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Patient Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 text-sm">
          <div className="text-gray-800">
            <span className="font-medium text-blue-800">Name:</span> {patientData.patientName}
          </div>
          <div className="text-gray-800">
            <span className="font-medium text-blue-800">Age/Gender:</span> {patientData.age} years old, {patientData.gender}
          </div>
          <div className="md:col-span-2 text-gray-800">
            <span className="font-medium text-blue-800">Symptoms:</span> {formatSymptoms(patientData.symptoms)}
          </div>
        </div>
      </div>

      {/* Treatment Plan Sections */}
      <div className="space-y-4 sm:space-y-6">
        {/* Diagnosis */}
        <div className="border-l-4 border-blue-500 pl-3 sm:pl-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Diagnosis</h3>
          {isEditing ? (
            <textarea
              value={editedPlan.diagnosis}
              onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              rows={3}
            />
          ) : (
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{treatmentPlan.diagnosis}</p>
          )}
        </div>

        {/* Prognosis */}
        <div className="border-l-4 border-indigo-500 pl-3 sm:pl-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Prognosis</h3>
          {isEditing ? (
            <textarea
              value={editedPlan.prognosis}
              onChange={(e) => handleFieldChange('prognosis', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              rows={3}
            />
          ) : (
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{treatmentPlan.prognosis}</p>
          )}
        </div>

        {/* Phase I: Non-surgical therapy */}
        <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Phase I: Non-surgical Therapy</h3>
          {isEditing ? (
            <textarea
              value={editedPlan.phaseI}
              onChange={(e) => handleFieldChange('phaseI', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              rows={4}
            />
          ) : (
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{treatmentPlan.phaseI}</p>
          )}
        </div>

        {/* Phase II: Surgical therapy */}
        <div className="border-l-4 border-orange-500 pl-3 sm:pl-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Phase II: Surgical Therapy</h3>
          {isEditing ? (
            <textarea
              value={editedPlan.phaseII}
              onChange={(e) => handleFieldChange('phaseII', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              rows={4}
            />
          ) : (
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{treatmentPlan.phaseII}</p>
          )}
        </div>

        {/* Maintenance/Recall schedule */}
        <div className="border-l-4 border-purple-500 pl-3 sm:pl-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Maintenance/Recall Schedule</h3>
          {isEditing ? (
            <textarea
              value={editedPlan.maintenance}
              onChange={(e) => handleFieldChange('maintenance', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              rows={3}
            />
          ) : (
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{treatmentPlan.maintenance}</p>
          )}
        </div>

        {/* Additional Recommendations */}
        <div className="border-l-4 border-red-500 pl-3 sm:pl-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Additional Recommendations</h3>
          {isEditing ? (
            <textarea
              value={editedPlan.additionalRecommendations}
              onChange={(e) => handleFieldChange('additionalRecommendations', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              rows={3}
            />
          ) : (
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{treatmentPlan.additionalRecommendations}</p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs sm:text-sm text-yellow-800 leading-relaxed">
          <strong>Disclaimer:</strong> This treatment plan is AI-generated and should be reviewed by a licensed dentist before implementation.
        </p>
      </div>
    </div>
  );
}
