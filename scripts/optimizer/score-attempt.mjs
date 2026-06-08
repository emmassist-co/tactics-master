export function scoreCandidateReport(report) {
  return Number(
    (
      report.averageOverall * 100 +
      report.categoryAverages.offBallShape * 35 +
      report.categoryAverages.ballInteractions * 25 +
      report.categoryAverages.defending * 20 +
      report.categoryAverages.chanceCreation * 10 +
      report.readyCount * 15
    ).toFixed(2),
  );
}

export function compareAttempt({
  baselineReport,
  candidateReport,
  minimumDelta = 5,
  allowedCategoryRegression = 0.2,
}) {
  const baselineScore = scoreCandidateReport(baselineReport);
  const candidateScore = scoreCandidateReport(candidateReport);
  const aggregateDelta = Number((candidateScore - baselineScore).toFixed(2));
  const overallDelta = Number((candidateReport.averageOverall - baselineReport.averageOverall).toFixed(2));

  const regressedCategories = Object.keys(baselineReport.categoryAverages).filter((category) => {
    const baselineValue = baselineReport.categoryAverages[category];
    const candidateValue = candidateReport.categoryAverages[category];
    return baselineValue - candidateValue > allowedCategoryRegression;
  });

  const win = aggregateDelta >= minimumDelta && overallDelta >= 0.05 && regressedCategories.length <= 1;

  return {
    win,
    baselineScore,
    candidateScore,
    aggregateDelta,
    overallDelta,
    regressedCategories,
  };
}
