'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PatientData, TreatmentPlan } from '@/types';
import { User, Calendar, FileText, Stethoscope, AlertCircle, Plus } from 'lucide-react';

const patientSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  age: z.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120'),
  gender: z.enum(['male', 'female', 'other']),
  medicalHistory: z.string().min(1, 'Medical history is required'),
  dentalHistory: z.string().min(1, 'Dental history is required'),
  symptoms: z.object({
    bleedingGums: z.boolean(),
    toothMobility: z.boolean(),
    halitosis: z.boolean(),
    sensitivity: z.boolean(),
    pain: z.boolean(),
  }),
  periodontalFindings: z.object({
    probingDepths: z.string().min(1, 'Probing depths are required'),
    gingivalRecession: z.string().min(1, 'Gingival recession details are required'),
    mobilityGrade: z.string().min(1, 'Mobility grade is required'),
    radiographicBoneLoss: z.string().min(1, 'Radiographic bone loss details are required'),
  }),
});

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading: boolean;
}

export default function PatientForm({ onSubmit, isLoading }: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PatientData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patientName: '',
      age: 0,
      gender: 'other',
      medicalHistory: '',
      dentalHistory: '',
      symptoms: {
        bleedingGums: false,
        toothMobility: false,
        halitosis: false,
        sensitivity: false,
        pain: false,
      },
      periodontalFindings: {
        probingDepths: '',
        gingivalRecession: '',
        mobilityGrade: '',
        radiographicBoneLoss: '',
      },
    },
  });

  const watchedSymptoms = watch('symptoms');

  const handleFormSubmit = (data: PatientData) => {
    console.log('📝 [FORM] Form submitted with data:', {
      name: data.patientName,
      age: data.age,
      gender: data.gender,
      symptomsCount: Object.values(data.symptoms).filter(Boolean).length,
      hasMedicalHistory: data.medicalHistory.length > 0,
      hasDentalHistory: data.dentalHistory.length > 0
    });
    onSubmit(data);
  };

  const handleAddMock = () => {
    console.log('🎭 [FORM] Adding mock data to form');
    const mockData: PatientData = {
      patientName: 'John Doe',
      age: 45,
      gender: 'male',
      medicalHistory: 'Type II diabetes (HbA1c 6.8%), hypertension controlled with medication. No known drug allergies.',
      dentalHistory: 'Irregular dental visits. Reports occasional bleeding on brushing. Uses manual toothbrush, no interdental cleaning.',
      symptoms: {
        bleedingGums: true,
        toothMobility: false,
        halitosis: true,
        sensitivity: false,
        pain: false,
      },
      periodontalFindings: {
        probingDepths: 'Generalized 4–6 mm pockets; localized 7 mm pockets on #16, #26 distal.',
        gingivalRecession: 'Miller Class I recession on #13 and #23 (~2 mm).',
        mobilityGrade: 'Grade I mobility on #26 and #36.',
        radiographicBoneLoss: 'Horizontal bone loss 30–40% in posterior sextants; localized angular defects in upper molars.',
      },
    };
    reset(mockData, { keepErrors: false, keepDirty: false });
    console.log('✅ [FORM] Mock data added successfully');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Periodontal Treatment Plan Generator</h1>
        </div>
        <button
          type="button"
          onClick={handleAddMock}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center gap-2 border border-gray-300"
        >
          <Plus className="h-4 w-4" />
          Add mock entry
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Patient Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name *
              </label>
              <input
                {...register('patientName')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter patient name"
              />
              {errors.patientName && (
                <p className="text-red-500 text-sm mt-1">{errors.patientName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age *
              </label>
              <input
                {...register('age', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Age"
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Medical History
          </h2>
          <textarea
            {...register('medicalHistory')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter relevant medical history, medications, allergies, systemic conditions..."
          />
          {errors.medicalHistory && (
            <p className="text-red-500 text-sm mt-1">{errors.medicalHistory.message}</p>
          )}
        </div>

        {/* Dental History */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Dental History
          </h2>
          <textarea
            {...register('dentalHistory')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter dental history, previous treatments, oral hygiene habits..."
          />
          {errors.dentalHistory && (
            <p className="text-red-500 text-sm mt-1">{errors.dentalHistory.message}</p>
          )}
        </div>

        {/* Symptoms */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Symptoms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'bleedingGums', label: 'Bleeding Gums' },
              { key: 'toothMobility', label: 'Tooth Mobility' },
              { key: 'halitosis', label: 'Halitosis (Bad Breath)' },
              { key: 'sensitivity', label: 'Sensitivity' },
              { key: 'pain', label: 'Pain' },
            ].map((symptom) => (
              <label key={symptom.key} className="flex items-center space-x-2">
                <input
                  {...register(`symptoms.${symptom.key as keyof typeof watchedSymptoms}`)}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{symptom.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Periodontal Findings */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Periodontal Findings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Probing Depths *
              </label>
              <textarea
                {...register('periodontalFindings.probingDepths')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Generalized 4-6mm pockets, localized 7mm pockets in posterior areas"
              />
              {errors.periodontalFindings?.probingDepths && (
                <p className="text-red-500 text-sm mt-1">{errors.periodontalFindings.probingDepths.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gingival Recession *
              </label>
              <textarea
                {...register('periodontalFindings.gingivalRecession')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Miller Class I recession on teeth #6, #11"
              />
              {errors.periodontalFindings?.gingivalRecession && (
                <p className="text-red-500 text-sm mt-1">{errors.periodontalFindings.gingivalRecession.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobility Grade *
              </label>
              <textarea
                {...register('periodontalFindings.mobilityGrade')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Grade I mobility on teeth #14, #19"
              />
              {errors.periodontalFindings?.mobilityGrade && (
                <p className="text-red-500 text-sm mt-1">{errors.periodontalFindings.mobilityGrade.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radiographic Bone Loss *
              </label>
              <textarea
                {...register('periodontalFindings.radiographicBoneLoss')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Horizontal bone loss 30-50% in posterior areas"
              />
              {errors.periodontalFindings?.radiographicBoneLoss && (
                <p className="text-red-500 text-sm mt-1">{errors.periodontalFindings.radiographicBoneLoss.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Plan...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Generate Treatment Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
