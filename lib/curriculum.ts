/**
 * One definition of the curriculum, shared by the quiz and flashcard screens so
 * they cannot drift apart.
 *
 * A level implies its board, which is why they are not two independent
 * pickers: "A-Level" is only ever Cambridge, "FSc" only ever Pakistan Board.
 */

export const SUBJECTS = [
  "Mathematics",
  "English",
  "Computer Science",
  "Physics",
  "Business Studies",
  "Economics",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export type Level = {
  id: string;
  label: string;
  board: "Cambridge" | "Pakistan Board";
  /** Fed to the model so it aims at the right standard. */
  description: string;
};

export const LEVELS: Level[] = [
  {
    id: "igcse",
    label: "IGCSE",
    board: "Cambridge",
    description:
      "Cambridge IGCSE (Years 10-11, ages 14-16). Extended tier. Questions should demand application and multi-step working, at the standard of the harder Paper 4 questions, not simple recall.",
  },
  {
    id: "alevel",
    label: "A-Level",
    board: "Cambridge",
    description:
      "Cambridge International AS & A Level (Years 12-13, ages 16-18). Questions should demand analysis, derivation and synthesis across topics, at the standard of A2 papers.",
  },
  {
    id: "matric",
    label: "Matric",
    board: "Pakistan Board",
    description:
      "Pakistani Secondary School Certificate (Matric, Classes 9-10), following the national curriculum. Questions should match the harder end of annual board papers.",
  },
  {
    id: "fsc",
    label: "FSc",
    board: "Pakistan Board",
    description:
      "Pakistani Higher Secondary School Certificate (FSc / Intermediate, Classes 11-12). Questions should match the standard of board exam long questions and numericals.",
  },
];

export function findLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id || l.label.toLowerCase() === id.toLowerCase());
}

/** Labels older rows and long-form board strings down to a short badge. */
export function shortBoard(board: string) {
  return board.startsWith("Cambridge") ? "Cambridge" : "Pak Board";
}
