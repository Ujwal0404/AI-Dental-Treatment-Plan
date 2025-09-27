import { NextRequest, NextResponse } from 'next/server';
import { PatientData, TreatmentPlan } from '@/types';
import Groq from 'groq-sdk';
import { z } from 'zod';

const treatmentPlanSchema = z.object({
  diagnosis: z.string().min(1),
  prognosis: z.string().min(1),
  phaseI: z.string().min(1),
  phaseII: z.string().min(1),
  maintenance: z.string().min(1),
  additionalRecommendations: z.string().min(1),
});

function buildPrompt(patientData: PatientData, symptoms: string[]) {
  return `You are a board-certified periodontist following current AAP guidelines and evidence-based practice. Generate a comprehensive, clinically-accurate treatment plan.

PATIENT CLINICAL DATA:
- Name: ${patientData.patientName}
- Age: ${patientData.age} years, Gender: ${patientData.gender}
- Medical History: ${patientData.medicalHistory}
- Dental History: ${patientData.dentalHistory}
- Presenting Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None reported'}
- Probing Depths: ${patientData.periodontalFindings.probingDepths}
- Gingival Recession: ${patientData.periodontalFindings.gingivalRecession}
- Tooth Mobility: ${patientData.periodontalFindings.mobilityGrade}
- Radiographic Bone Loss: ${patientData.periodontalFindings.radiographicBoneLoss}

CRITICAL TREATMENT PLANNING CRITERIA:
1. SURGICAL INDICATIONS: Pockets ≥6mm after non-surgical therapy, angular defects, furcation involvement Grade II-III
2. MILLER'S CLASSIFICATION PROGNOSIS:
   - Class I: 100% predictable root coverage
   - Class II: Partial but significant coverage possible (70-90%)
   - Class III: Unpredictable, limited coverage (30-60%)
   - Class IV: No predictable coverage (<30%)
3. MOBILITY GRADING: Grade I (slight), Grade II (moderate, 1mm), Grade III (severe, >1mm or depressible)

EVIDENCE-BASED PROTOCOLS:
- Pockets 4-5mm: SRP with adjunctive antimicrobials if indicated
- Pockets ≥6mm: SRP + re-evaluation → surgical therapy if persistent
- Angular defects: Consider regenerative procedures (GTR, EMD, bone grafts)
- Furcation involvement: Grade I (SRP), Grade II (surgery/regeneration), Grade III (extraction/tunneling)

Return JSON object with these exact fields: {
  "diagnosis": string,
  "prognosis": string,
  "phaseI": string,
  "phaseII": string,
  "maintenance": string,
  "additionalRecommendations": string
}

CRITICAL: Each field MUST be a single string value, NOT nested objects or arrays. Format content within each string using line breaks (\\n) and bullet points (•) for proper display.

FORMATTING REQUIREMENTS:
- Use \\n for line breaks between major sections
- Use numbered lists (1., 2., 3.) for sequential steps
- Use bullet points (•) for sub-items and details
- Use proper spacing between sections

EXAMPLES OF PROPER FORMATTING:

DIAGNOSIS example:
"Periodontitis Stage II, Grade B\\n\\n• Severity: Moderate\\n• Extent: Generalized with localized deep pockets\\n• Contributing factors: Type II diabetes, poor oral hygiene\\n• Clinical findings: 4-6mm generalized pockets, 7mm localized pockets #16, #26\\n• Radiographic: 30-40% horizontal bone loss in posterior sextants"

PHASE I example:
"1. Initial Therapy\\n• Quadrant-based scaling and root planing\\n• Local anesthesia: 2% lidocaine with epinephrine\\n• Ultrasonic scalers followed by hand instruments\\n\\n2. Adjunctive Antimicrobials\\n• Chlorhexidine 0.12% mouthwash BID for 14 days\\n• Systemic doxycycline 100mg BID for 7 days (pockets ≥6mm)\\n\\n3. Home Care Protocol\\n• Electric toothbrush with soft bristles\\n• Interdental brushes size 00 for posterior areas\\n• Daily flossing technique demonstration\\n\\n4. Re-evaluation\\n• Schedule: 6-8 weeks post-therapy\\n• Parameters: PPD reduction ≥2mm, BOP <20%"

REQUIRED CONTENT STRUCTURE:

DIAGNOSIS: Include AAP classification (if applicable), severity (slight/moderate/severe), extent (localized/generalized), stage/grade, contributing risk factors, and clinical justification.

PROGNOSIS: Assess overall periodontal prognosis (excellent/good/fair/poor/hopeless) based on:
- Bone loss percentage and pattern
- Tooth mobility grades
- Miller's classification for recession sites
- Patient age, systemic health, and compliance factors
- Individual tooth prognosis where relevant

PHASE I: Comprehensive non-surgical therapy including:
- Quadrant-based SRP with specific instrumentation
- Adjunctive antimicrobials (systemic/local) based on pocket depths
- Specific oral hygiene protocols
- Risk factor modification
- Re-evaluation timeline (4-6 weeks) with specific parameters

PHASE II: Evidence-based surgical decisions:
- If pockets remain ≥6mm: specify surgical approach (resective vs regenerative)
- For angular defects: detail regenerative procedures (GTR, bone grafts, biologics)
- For recession: specify Miller's class and expected coverage outcomes
- For furcation: grade-specific treatment recommendations
- If not indicated: state "Phase II not indicated based on re-evaluation results"

MAINTENANCE: Risk-based recall intervals:
- High risk (deep pockets, bone loss): 3-month intervals
- Moderate risk: 3-4 month intervals  
- Low risk: 4-6 month intervals
- Specific procedures and monitoring parameters

ADDITIONAL RECOMMENDATIONS: Address systemic factors, lifestyle modifications, adjunctive treatments, and patient education specific to their risk profile.

Use professional terminology with bullet points (•) and numbered lists for organization. Include specific measurements, medications, and timeframes. Base all recommendations on current evidence and AAP guidelines.`;
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
    console.log('📝 [API] LLM Input Prompt:\n', '='.repeat(50));
    console.log(prompt);
    console.log('='.repeat(50));

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
        model: 'openai/gpt-oss-20b',
        temperature: 0.2,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a periodontal specialist AI that ALWAYS replies with a single valid JSON object only. Each field must be a flat string with proper formatting using \\n for line breaks and • for bullet points. Example: "1. First step\\n• Detail one\\n• Detail two\\n\\n2. Second step\\n• More details". NOT nested objects. No prose. No code fences.',
          },
          { role: 'user', content: prompt },
        ],
      });

      console.log('✅ [API] Groq API call successful (attempt 1)');
      const content = completion.choices?.[0]?.message?.content || '';
      console.log('📄 [API] Response content length:', content.length);
      console.log('📤 [API] LLM Output Response:\n', '='.repeat(50));
      console.log(content);
      console.log('='.repeat(50));
      
      const parsed = tryParseJsonFromContent(content);
      console.log('🔍 [API] Parsed JSON:', parsed ? 'Success' : 'Failed');
      
      // Coerce nested objects to strings if needed
      const coerceToStrings = (obj: any): TreatmentPlan | null => {
        if (!obj) return null;
        
        const formatValue = (value: any): string => {
          if (typeof value === 'string') return value;
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              return value.map((item, index) => `${index + 1}. ${formatValue(item)}`).join('\n');
            }
            return Object.entries(value)
              .map(([key, val]) => {
                const formattedVal = formatValue(val);
                if (formattedVal.includes('\n')) {
                  return `${key}:\n${formattedVal.split('\n').map(line => `• ${line}`).join('\n')}`;
                }
                return `• ${key}: ${formattedVal}`;
              })
              .join('\n\n');
          }
          return String(value);
        };

        try {
          return {
            diagnosis: formatValue(obj.diagnosis),
            prognosis: formatValue(obj.prognosis),
            phaseI: formatValue(obj.phaseI),
            phaseII: formatValue(obj.phaseII),
            maintenance: formatValue(obj.maintenance),
            additionalRecommendations: formatValue(obj.additionalRecommendations),
          };
        } catch (error) {
          console.log('❌ [API] Error in coercion:', error);
          return null;
        }
      };

      let coercedData = parsed;
      
      // Try direct validation first
      let validation = parsed && treatmentPlanSchema.safeParse(parsed);
      if (validation && !validation.success) {
        console.log('❌ [API] Direct validation failed, attempting coercion...');
        coercedData = coerceToStrings(parsed);
        if (coercedData) {
          validation = treatmentPlanSchema.safeParse(coercedData);
          console.log('🔄 [API] After coercion validation:', validation.success ? 'Success' : 'Failed');
        }
      }
      
      if (!(validation && validation.success)) {
        console.log('⚠️ [API] First attempt failed, trying retry without response_format...');
        // Retry without response_format and coerce
        const retry = await groq.chat.completions.create({
          model: 'openai/gpt-oss-20b',
          temperature: 0.2,
          max_tokens: 8000,
          messages: [
            {
              role: 'system',
              content:
                'You are a periodontal specialist AI. Output ONLY a JSON object matching keys: diagnosis, prognosis, phaseI, phaseII, maintenance, additionalRecommendations. Each field must be a flat string with proper formatting using \\n for line breaks and • for bullet points. Example: "1. First step\\n• Detail one\\n• Detail two\\n\\n2. Second step\\n• More details". NOT nested objects. No explanations. No code fences.',
            },
            { role: 'user', content: prompt },
          ],
        });
        
        console.log('✅ [API] Groq retry call successful');
        const retryContent = retry.choices?.[0]?.message?.content || '';
        console.log('📄 [API] Retry response content length:', retryContent.length);
        console.log('📤 [API] LLM Retry Output Response:\n', '='.repeat(50));
        console.log(retryContent);
        console.log('='.repeat(50));
        
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

        // Validate retry response and apply coercion if needed
        let retryCoercedData = finalParsed;
        validation = finalParsed && treatmentPlanSchema.safeParse(finalParsed);
        
        if (validation && !validation.success) {
          console.log('❌ [API] Retry direct validation failed, attempting coercion...');
          retryCoercedData = coerceToStrings(finalParsed);
          if (retryCoercedData) {
            validation = treatmentPlanSchema.safeParse(retryCoercedData);
            console.log('🔄 [API] After retry coercion validation:', validation.success ? 'Success' : 'Failed');
          }
        }
        
        if (validation && validation.success) {
          console.log('✅ [API] Retry validation successful, returning Groq plan');
          const plan: TreatmentPlan = validation.data;
          console.log('📋 [API] Final Retry Treatment Plan Structure:');
          console.log('  - Diagnosis length:', plan.diagnosis.length);
          console.log('  - Prognosis length:', plan.prognosis.length);
          console.log('  - Phase I length:', plan.phaseI.length);
          console.log('  - Phase II length:', plan.phaseII.length);
          console.log('  - Maintenance length:', plan.maintenance.length);
          console.log('  - Additional Recommendations length:', plan.additionalRecommendations.length);
          return NextResponse.json(plan);
        }
        console.log('❌ [API] Retry validation failed, using fallback');
      } else {
        console.log('✅ [API] First attempt validation successful, returning Groq plan');
        const plan: TreatmentPlan = validation.data;
        console.log('📋 [API] Final Treatment Plan Structure:');
        console.log('  - Diagnosis length:', plan.diagnosis.length);
        console.log('  - Prognosis length:', plan.prognosis.length);
        console.log('  - Phase I length:', plan.phaseI.length);
        console.log('  - Phase II length:', plan.phaseII.length);
        console.log('  - Maintenance length:', plan.maintenance.length);
        console.log('  - Additional Recommendations length:', plan.additionalRecommendations.length);
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
      diagnosis: `Based on the provided findings, ${patientData.patientName} presents with ${patientData.age < 35 ? 'Aggressive' : 'Chronic'} Periodontitis of moderate severity with generalized distribution.`,
      prognosis: `Overall prognosis: Fair to Good with patient compliance. Individual tooth prognosis varies based on bone loss severity and mobility. Successful treatment depends on patient adherence to oral hygiene protocols and maintenance appointments.`,
      phaseI: `1. Quadrant-based scaling and root planing (SRP)\n2. Customized oral hygiene instruction (modified Bass technique, interdental cleaning)\n3. Antimicrobial rinse: 0.12% chlorhexidine BID for 14 days\n4. Risk factor counseling (smoking, glycemic control as applicable)\n5. Re-evaluation in 6–8 weeks`,
      phaseII: hasDeepPockets
        ? `Surgical intervention may be indicated based on re-evaluation:\n1. Open flap debridement for residual deep pockets\n2. Regenerative procedures where indicated (GTR, bone graft)\n3. Consider crown lengthening where restorative needs dictate`
        : `Not indicated at this time. Re-evaluate after Phase I therapy completion.`,
      maintenance: `1. Periodontal maintenance every 3 months initially\n2. Comprehensive periodontal charting every 6 months\n3. Annual radiographic review to monitor bone levels`,
      additionalRecommendations: `1. Daily interdental cleaning (floss or interdental brushes)\n2. Consider electric toothbrush\n3. Manage systemic risk factors (e.g., diabetes, smoking cessation)\n4. Nutritional and stress management counseling as appropriate`,
    };
    
    console.log('✅ [API] Fallback plan generated successfully');
    console.log('📋 [API] Fallback Treatment Plan Structure:');
    console.log('  - Diagnosis length:', fallback.diagnosis.length);
    console.log('  - Prognosis length:', fallback.prognosis.length);
    console.log('  - Phase I length:', fallback.phaseI.length);
    console.log('  - Phase II length:', fallback.phaseII.length);
    console.log('  - Maintenance length:', fallback.maintenance.length);
    console.log('  - Additional Recommendations length:', fallback.additionalRecommendations.length);
    console.log('📤 [API] Fallback Plan Content:\n', '='.repeat(50));
    console.log('DIAGNOSIS:', fallback.diagnosis);
    console.log('\nPROGNOSIS:', fallback.prognosis);
    console.log('\nPHASE I:', fallback.phaseI);
    console.log('\nPHASE II:', fallback.phaseII);
    console.log('\nMAINTENANCE:', fallback.maintenance);
    console.log('\nADDITIONAL RECOMMENDATIONS:', fallback.additionalRecommendations);
    console.log('='.repeat(50));
    return NextResponse.json(fallback);
  } catch (error) {
    console.error('❌ [API] Error generating treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate treatment plan' },
      { status: 500 }
    );
  }
}
