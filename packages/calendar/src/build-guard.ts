export type BuildGuardResult =
  { ok: true } | { ok: false; reason: 'empty_calendar' | 'source_mismatch' | 'normalization_drop' };

// Le calendrier publié doit refléter Supabase, pas une valeur de référence : la saison fait
// varier le nombre de randos. On vérifie donc que la lecture est complète (même total qu'un
// comptage indépendant) et que la normalisation n'écarte pas plus de la moitié des lignes.
export const evaluateBuildGuard = (published: number, fetched: number, sourceCount: number): BuildGuardResult => {
  if (published === 0) return { ok: false, reason: 'empty_calendar' };
  if (fetched !== sourceCount) return { ok: false, reason: 'source_mismatch' };
  if (published < Math.ceil(fetched / 2)) return { ok: false, reason: 'normalization_drop' };
  return { ok: true };
};
