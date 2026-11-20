export function getScoreTone(value) {
  if (value >= 8) {
    return {
      label: 'Rất tốt',
      stroke: 'stroke-ice-score-excellent',
      text: 'text-ice-score-excellent-text',
      textDark: 'text-ice-score-excellent-dark',
      fill: 'bg-ice-score-excellent',
      hex: '#9b6b00',
    }
  }

  if (value >= 5) {
    return {
      label: 'Đạt',
      stroke: 'stroke-ice-score-pass',
      text: 'text-ice-score-pass-text',
      textDark: 'text-ice-score-pass-dark',
      fill: 'bg-ice-score-pass',
      hex: '#6ee7b7',
    }
  }

  return {
    label: 'Cần ôn thêm',
    stroke: 'stroke-ice-score-needs-work',
    text: 'text-ice-score-needs-work-text',
    textDark: 'text-ice-score-needs-work-dark',
    fill: 'bg-ice-score-needs-work',
    hex: '#57816c',
  }
}
