// A score record must not round the judge's saved values for display.
export const formatRecordedScore = (value) => {
  if (value === null || value === undefined) return '(null)';
  if (value === '') return '(blank)';
  return String(value);
};

export const formatReportDate = (value) => {
  if (!value) return 'No saved scores';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return `${new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(date)} PHT`;
};

export const reportStatusLabel = (status) => ({
  complete: 'Scoring complete', incomplete: 'Incomplete score record',
  no_scores: 'No saved scores', needs_review: 'Requires review',
}[status] ?? status);

export const rowStatusLabel = (status) => ({
  complete: 'Complete', in_progress: 'Incomplete',
  not_started: 'Not scored', needs_review: 'Review required',
}[status] ?? status);
