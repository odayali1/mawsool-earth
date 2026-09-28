export type PhaseRecord = {
  code: string;
  name: string;
  value: number;
};

/** One analytics layer. Personal Email is phase 01. Later record files become more phases. */
export type PhaseFile = {
  id: string;
  order: number;
  code: string;
  title: string;
  kicker: string;
  noun: string;
  singular: string;
  source: string;
  summary: string;
  records: PhaseRecord[];
};
