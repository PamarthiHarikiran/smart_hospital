/**
 * Rule-based symptom to department recommendation engine.
 * Modularized for future machine learning model plug-and-play.
 */
const SYMPTOM_RULES = [
  {
    department: 'Cardiology',
    keywords: ['chest pain', 'palpitation', 'shortness of breath', 'high blood pressure', 'angina', 'heart', 'irregular heartbeat'],
    priority: 10,
    guidance: 'Symptoms may be related to cardiovascular health. Please consult a Cardiologist promptly if symptoms are severe.',
  },
  {
    department: 'Neurology',
    keywords: ['migraine', 'headache', 'dizziness', 'seizure', 'numbness', 'tremor', 'vertigo', 'loss of balance', 'memory loss'],
    priority: 9,
    guidance: 'Neurological symptoms require evaluation by a specialist.',
  },
  {
    department: 'Orthopedics',
    keywords: ['joint pain', 'back pain', 'fracture', 'bone', 'knee pain', 'arthritis', 'muscle sprain', 'swollen joints'],
    priority: 8,
    guidance: 'Musculoskeletal concerns are best addressed by the Orthopedic department.',
  },
  {
    department: 'Dermatology',
    keywords: ['skin rash', 'itching', 'acne', 'eczema', 'psoriasis', 'hair fall', 'skin allergy', 'lesion', 'mole'],
    priority: 7,
    guidance: 'Skin and hair related complaints fall under Dermatology.',
  },
  {
    department: 'Pediatrics',
    keywords: ['child', 'infant', 'baby', 'toddler', 'vaccination', 'growth issue'],
    priority: 9,
    guidance: 'Children under 16 should be seen by a Pediatrician.',
  },
  {
    department: 'ENT',
    keywords: ['ear pain', 'hearing loss', 'sore throat', 'tonsils', 'nasal congestion', 'sinus', 'runny nose', 'ringing ear'],
    priority: 7,
    guidance: 'Ear, Nose, and Throat specialists handle these conditions.',
  },
  {
    department: 'Ophthalmology',
    keywords: ['blurred vision', 'eye pain', 'red eye', 'dry eye', 'cataract', 'glaucoma', 'vision loss'],
    priority: 8,
    guidance: 'Ophthalmologists specialize in comprehensive eye care.',
  },
  {
    department: 'Gynecology',
    keywords: ['pregnancy', 'menstrual', 'pelvic pain', 'period cramp', 'pcos', 'vaginal discharge'],
    priority: 8,
    guidance: 'Obstetrics and Gynecology covers women reproductive health.',
  },
  {
    department: 'General Medicine',
    keywords: ['fever', 'cough', 'cold', 'fatigue', 'weakness', 'body ache', 'vomiting', 'nausea', 'diarrhea', 'flu'],
    priority: 5,
    guidance: 'General systemic symptoms are best assessed initially by an Internal Medicine physician.',
  },
];

const recommendDepartment = (symptomsInput) => {
  if (!symptomsInput || typeof symptomsInput !== 'string') {
    return {
      recommendedDepartment: 'General Medicine',
      confidence: 'LOW',
      matchedSymptoms: [],
      guidance: 'Please consult General Medicine for an initial clinical evaluation.',
      disclaimer: 'This feature provides general department guidance and is not a medical diagnosis.',
    };
  }

  const normalizedInput = symptomsInput.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;
  let matchedKeywords = [];

  for (const rule of SYMPTOM_RULES) {
    let score = 0;
    const currentMatches = [];

    for (const kw of rule.keywords) {
      if (normalizedInput.includes(kw)) {
        score += 10;
        currentMatches.push(kw);
      }
    }

    if (score > 0) {
      score += rule.priority;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = rule;
      matchedKeywords = currentMatches;
    }
  }

  if (!bestMatch || maxScore === 0) {
    return {
      recommendedDepartment: 'General Medicine',
      confidence: 'DEFAULT',
      matchedSymptoms: [],
      guidance: 'No specific specialized department matched your description. General Medicine is recommended for initial assessment.',
      disclaimer: 'This feature provides general department guidance and is not a medical diagnosis.',
    };
  }

  return {
    recommendedDepartment: bestMatch.department,
    confidence: maxScore > 20 ? 'HIGH' : 'MODERATE',
    matchedSymptoms: matchedKeywords,
    guidance: bestMatch.guidance,
    disclaimer: 'This feature provides general department guidance and is not a medical diagnosis.',
  };
};

module.exports = {
  recommendDepartment,
  SYMPTOM_RULES,
};
