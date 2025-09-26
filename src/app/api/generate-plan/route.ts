import { NextRequest, NextResponse } from 'next/server';
import { PatientData, TreatmentPlan } from '@/types';
import Groq from 'groq-sdk';
import { z } from 'zod';

const treatmentPlanSchema = z.object({
  diagnosis: z.string().min(1),
  phaseI: z.string().min(1),
  phaseII: z.string().min(1),
  maintenance: z.string().min(1),
  additionalRecommendations: z.string().min(1),
});

function buildPrompt(patientData: PatientData, symptoms: string[]) {
  return `You are a periodontal specialist AI assistant. Generate a comprehensive, highly detailed treatment plan based on the following patient information. The content must be practical and clinically actionable.

PATIENT INFORMATION:
- Name: ${patientData.patientName}
- Age: ${patientData.age} years
- Gender: ${patientData.gender}
- Medical History: ${patientData.medicalHistory}
- Dental History: ${patientData.dentalHistory}
- Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None reported'}
- Probing Depths: ${patientData.periodontalFindings.probingDepths}
- Gingival Recession: ${patientData.periodontalFindings.gingivalRecession}
- Mobility Grade: ${patientData.periodontalFindings.mobilityGrade}
- Radiographic Bone Loss: ${patientData.periodontalFindings.radiographicBoneLoss}

Return a strict JSON object with these fields only: {
  "diagnosis": string,
  "phaseI": string,
  "phaseII": string,
  "maintenance": string,
  "additionalRecommendations": string
}

IMPORTANT FORMATTING REQUIREMENTS:
- Each field must be a single, well-formatted string (NOT nested objects or arrays)
- Use bullet points (•) and numbered lists (1., 2., etc.) for organization
- Use line breaks (\\n) to separate sections
- Keep professional medical language but make it readable
- Format like a clinical treatment plan document

Example format for diagnosis:
"Chronic Periodontitis, Moderate severity, Generalized distribution with localized deep pockets. Contributing factors: Type II diabetes, hypertension, poor oral hygiene. Clinical findings support diagnosis based on 4-6mm generalized pockets, localized 7mm pockets, gingival recession, and radiographic bone loss."

Example format for phaseI:
"1. Quadrant-based scaling and root planing (SRP)
   • Upper right quadrant first
   • Local anesthesia: 2% lidocaine with epinephrine
   • Ultrasonic scalers followed by hand instruments
2. Adjunctive antimicrobial therapy
   • Chlorhexidine 0.12% mouthwash BID for 14 days
   • Site-specific minocycline microspheres for deep pockets
3. Home care instruction
   • Electric toothbrush with soft bristles
   • Interdental cleaning with brushes size 00
4. Re-evaluation in 6-8 weeks"

Guidance for content depth:
- Diagnosis: Include classification, severity, distribution, risk factors, and clinical rationale
- Phase I: Provide step-by-step protocol with specific procedures, medications, and timelines
- Phase II: Specify surgical indications or state "Not indicated at this time"
- Maintenance: Include recall intervals, procedures, and criteria for adjustments
- Additional Recommendations: Cover lifestyle modifications, risk management, and patient education

Return ONLY the JSON object with properly formatted strings. No explanations outside the JSON.`;
}

function tryParseJsonFromContent(content: string) {
  try {
    return JSON.parse(content);
  } catch (_) {
    // try to extract from code block
    const match = content.match(/```json[\s\S]*?```/i) || content.match(/```[\s\S]*?```/i);
    if (match) {
      const inner = match[0].replace(/```json|```/gi, '').trim();
      try {
        return JSON.parse(inner);
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 [API] Starting treatment plan generation...');
  try {
    const patientData: PatientData = await request.json();
    console.log('📋 [API] Received patient data:', {
      name: patientData.patientName,
      age: patientData.age,
      gender: patientData.gender,
      symptomsCount: Object.values(patientData.symptoms).filter(Boolean).length
    });

    // Format symptoms for the prompt
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

    console.log('🔍 [API] Active symptoms:', symptoms);

    const prompt = buildPrompt(patientData, symptoms);
    console.log('📝 [API] Generated prompt length:', prompt.length);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('❌ [API] Missing GROQ_API_KEY');
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY on server' },
        { status: 500 }
      );
    }

    console.log('🔑 [API] Groq API key found, length:', apiKey.length);

    const groq = new Groq({ apiKey });
    try {
      console.log('🤖 [API] Calling Groq API (attempt 1 with response_format)...');
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 2800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a periodontal specialist AI that ALWAYS replies with a single valid JSON object only. No prose. No code fences.',
          },
          { role: 'user', content: prompt },
        ],
      });

      console.log('✅ [API] Groq API call successful (attempt 1)');
      const content = completion.choices?.[0]?.message?.content || '';
      console.log('📄 [API] Response content length:', content.length);
      
      const parsed = tryParseJsonFromContent(content);
      console.log('🔍 [API] Parsed JSON:', parsed ? 'Success' : 'Failed');
      
      // Since we're asking Groq to return properly formatted strings, validate directly
      let validation = parsed && treatmentPlanSchema.safeParse(parsed);
      if (!(validation && validation.success)) {
        console.log('⚠️ [API] First attempt failed, trying retry without response_format...');
        // Retry without response_format and coerce
        const retry = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          temperature: 0.2,
          max_tokens: 2800,
          messages: [
            {
              role: 'system',
              content:
                'You are a periodontal specialist AI. Output ONLY a JSON object matching keys: diagnosis, phaseI, phaseII, maintenance, additionalRecommendations. No explanations. No code fences.',
            },
            { role: 'user', content: prompt },
          ],
        });
        
        console.log('✅ [API] Groq retry call successful');
        const retryContent = retry.choices?.[0]?.message?.content || '';
        console.log('📄 [API] Retry response content length:', retryContent.length);
        
        const retryParsed = tryParseJsonFromContent(retryContent);
        console.log('🔍 [API] Retry parsed JSON:', retryParsed ? 'Success' : 'Failed');

        // Try to extract JSON from text if direct parsing failed
        let finalParsed = retryParsed;
        if (!retryParsed && retryContent) {
          console.log('🔍 [API] Attempting to extract JSON from text...');
          // Look for JSON-like structures in the text
          const jsonMatch = retryContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              finalParsed = JSON.parse(jsonMatch[0]);
              console.log('✅ [API] Successfully extracted JSON from text');
            } catch (e) {
              console.log('❌ [API] Failed to parse extracted JSON');
            }
          }
        }

        // Validate retry response directly (should be properly formatted strings now)
        validation = finalParsed && treatmentPlanSchema.safeParse(finalParsed);
        if (validation && validation.success) {
          console.log('✅ [API] Retry validation successful, returning Groq plan');
          const plan: TreatmentPlan = validation.data;
          return NextResponse.json(plan);
        }
        console.log('❌ [API] Retry validation failed, using fallback');
      } else {
        console.log('✅ [API] First attempt validation successful, returning Groq plan');
        const plan: TreatmentPlan = validation.data;
        return NextResponse.json(plan);
      }
      // If still failing, fall through to fallback
    } catch (groqError) {
      console.error('❌ [API] Groq generation failed:', groqError);
    }

    // Fallback: generate a simulated plan so the UI remains functional
    console.log('🔄 [API] Using fallback plan generation...');
    const hasDeepPockets =
      patientData.periodontalFindings.probingDepths.includes('7') ||
      patientData.periodontalFindings.probingDepths.includes('8');
    const fallback: TreatmentPlan = {
      diagnosis: `Based on the provided findings, ${patientData.patientName} presents with ${patientData.age < 35 ? 'Aggressive' : 'Chronic'} Periodontitis of moderate severity.`,
      phaseI: `1. Quadrant-based scaling and root planing (SRP)\n2. Customized oral hygiene instruction (modified Bass technique, interdental cleaning)\n3. Antimicrobial rinse: 0.12% chlorhexidine BID for 14 days\n4. Risk factor counseling (smoking, glycemic control as applicable)\n5. Re-evaluation in 6–8 weeks`,
      phaseII: hasDeepPockets
        ? `Surgical intervention may be indicated based on re-evaluation:\n1. Open flap debridement for residual deep pockets\n2. Regenerative procedures where indicated (GTR, bone graft)\n3. Consider crown lengthening where restorative needs dictate`
        : `Not indicated at this time. Re-evaluate after Phase I therapy completion.`,
      maintenance: `1. Periodontal maintenance every 3 months initially\n2. Comprehensive periodontal charting every 6 months\n3. Annual radiographic review to monitor bone levels`,
      additionalRecommendations: `1. Daily interdental cleaning (floss or interdental brushes)\n2. Consider electric toothbrush\n3. Manage systemic risk factors (e.g., diabetes, smoking cessation)\n4. Nutritional and stress management counseling as appropriate`,
    };
    
    console.log('✅ [API] Fallback plan generated successfully');
    return NextResponse.json(fallback);
  } catch (error) {
    console.error('❌ [API] Error generating treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate treatment plan' },
      { status: 500 }
    );
  }
}
