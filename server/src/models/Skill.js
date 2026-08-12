import { supabase } from '../config/db.js';

/**
 * Canonical skill catalog (SDS "Skill" entity), shared across all resumes.
 * Case-insensitively unique — "Python" and "python" from different resumes
 * collapse into one row (see skills_name_lower_idx in schema.sql).
 */

/**
 * Find an existing skill by name (case-insensitive) or create it. When a
 * category is supplied and the existing row has none, it's backfilled —
 * this lets an "uncategorized" term (category = null, added when only seen
 * in a free-text skills-section listing) get upgraded once the dictionary
 * scan recognizes it too.
 */
export async function findOrCreateByName(name, category = null) {
  const { data: existing, error: findError } = await supabase
    .from('skills')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  if (existing) {
    if (category && !existing.category) {
      const { data, error } = await supabase
        .from('skills')
        .update({ category })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('skills')
    .insert({ name, category })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
