export type DiagnosticInput = {
  category: 'codec-corruption' | 'journal-recovery';
  message: string;
  context: Record<string, string>;
};
