/**
 * Short answers can earn half a mark for a partial answer, so a score is not
 * always a whole number. Render 8 as "8" and 7.5 as "7.5".
 */
export function formatMarks(marks: number) {
  return Number.isInteger(marks) ? String(marks) : marks.toFixed(1);
}
