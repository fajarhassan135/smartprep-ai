/**
 * The shape of the real papers, used to generate practice papers that follow
 * the actual structure instead of a format the model invented.
 *
 * Everything marked `verified` below was read off the official syllabus page on
 * cambridgeinternational.org. Durations and mark totals live in the syllabus
 * PDFs rather than those pages, so where they are not filled in they are left
 * null rather than guessed -- a made-up mark total would teach a student to
 * budget their time wrongly.
 *
 * Sources: each entry's `source` is the official page the structure came from.
 */

export type Component = {
  paper: string;
  /** What the paper actually asks for. Drives the generator's question mix. */
  style: "multiple_choice" | "structured" | "extended_writing" | "problem_solving" | "case_study" | "practical";
  tier?: "Core" | "Extended" | "AS" | "A Level";
  minutes: number | null;
  marks: number | null;
  /**
   * How much of this paper depends on figures a generator cannot fake well.
   * "heavy" components are the ones to be careful about offering as practice.
   */
  diagrams: "none" | "some" | "heavy";
  notes?: string;
};

export type PaperSpec = {
  subject: string;
  level: string;
  code: string;
  source: string;
  components: Component[];
};

export const PAPER_SPECS: PaperSpec[] = [
  {
    subject: "Mathematics",
    level: "IGCSE",
    code: "0580",
    source: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/past-papers/",
    components: [
      { paper: "Paper 1", style: "problem_solving", tier: "Core", minutes: null, marks: null, diagrams: "some" },
      { paper: "Paper 2", style: "problem_solving", tier: "Core", minutes: null, marks: null, diagrams: "some" },
      { paper: "Paper 3", style: "problem_solving", tier: "Extended", minutes: null, marks: null, diagrams: "some" },
      { paper: "Paper 4", style: "problem_solving", tier: "Extended", minutes: null, marks: null, diagrams: "heavy",
        notes: "Geometry, transformations and graph sketching carry real figures." },
    ],
  },
  {
    subject: "Physics",
    level: "A-Level",
    code: "9702",
    source: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-physics-9702/past-papers/",
    components: [
      { paper: "Paper 1", style: "multiple_choice", tier: "AS", minutes: null, marks: null, diagrams: "some" },
      { paper: "Paper 2", style: "structured", tier: "AS", minutes: null, marks: null, diagrams: "heavy" },
      { paper: "Paper 3", style: "practical", tier: "AS", minutes: null, marks: null, diagrams: "heavy",
        notes: "Practical-based. Not suitable for generated practice: it assesses lab work." },
      { paper: "Paper 4", style: "structured", tier: "A Level", minutes: null, marks: null, diagrams: "heavy" },
      { paper: "Paper 5", style: "practical", tier: "A Level", minutes: null, marks: null, diagrams: "heavy",
        notes: "Planning, analysis and evaluation. Generatable in part, but built around real data." },
    ],
  },
  {
    subject: "English",
    level: "IGCSE",
    code: "0500",
    source: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-english-first-language-0500/past-papers/",
    components: [
      { paper: "Paper 1", style: "extended_writing", minutes: null, marks: null, diagrams: "none",
        notes: "Reading. Built on an unseen passage, which the generator must write as well." },
      { paper: "Paper 2", style: "extended_writing", minutes: null, marks: null, diagrams: "none",
        notes: "Directed Writing and Composition. The best fit for generated practice of any paper here." },
    ],
  },
];

/**
 * Components worth generating practice for: no practicals, and nothing that
 * leans on figures the model cannot draw reliably.
 */
export function generatableComponents(spec: PaperSpec) {
  return spec.components.filter((c) => c.style !== "practical" && c.diagrams !== "heavy");
}

export function findSpec(subject: string, level: string) {
  return PAPER_SPECS.find((s) => s.subject === subject && s.level === level);
}
