export const computeTotalScore = (rubricScores = []) => {
  return rubricScores.reduce((sum, item) => sum + Number(item.score || 0), 0);
};

export const computeAverageScore = (rubricScores = []) => {
  if (!rubricScores.length) return 0;
  return computeTotalScore(rubricScores) / rubricScores.length;
};

// Gi AI rabiya ni nako (Hehe) - Jullan 