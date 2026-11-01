// Test fixture only. Production never imports this module or substitutes a diagnosis.
module.exports = function report(condition = 'possible_disease') {
  return {
    success: true,
    crop: 'Tomato',
    plantCondition: condition,
    primaryDiagnosis: {
      name: condition === 'possible_disease' ? 'Possible leaf spot' : null,
      confidence: null,
      confidenceType: null,
      explanation: 'Test fixture: visible spots require examination.',
    },
    alternativeDiagnoses: [{ name: 'Environmental stress', explanation: 'Other causes require field context.' }],
    observedSymptoms: ['Test fixture: small brown areas on a leaf.'],
    recommendedActions: ['Photograph both sides of the leaf and consult a local agronomist.'],
    preventionTips: ['Monitor nearby plants and keep tools clean.'],
    limitations: ['A photograph cannot confirm a disease.'],
    needsExpertReview: true,
  };
};
