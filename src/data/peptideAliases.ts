// Common aliases / brand names / shorthand researchers actually type when
// searching. Used by the global PeptideSearch and the Browse screen to boost
// matches against canonical peptide/blend names.
//
// Keyed by a lowercase fragment that must appear in the peptide's name or
// shortName. Values are alias tokens — both abbreviations and brand names.

export const aliasMap: Record<string, string[]> = {
  'tesamorelin': ['tesa', 'tesm', 'tezamorelin', 'egrifta'],
  'bpc-157': ['bpc', 'bpc157', 'pentadeca', 'body protection'],
  'tb-500': ['tb500', 'thymosin', 'tb 500'],
  'ipamorelin': ['ipa', 'ipam'],
  'cjc-1295': ['cjc', 'cjc1295', 'modgrf', 'mod grf'],
  'semaglutide': ['sema', 'ozempic', 'wegovy', 'rybelsus'],
  'tirzepatide': ['tirz', 'mounjaro', 'zepbound'],
  'retatrutide': ['reta', 'ly3437943'],
  'cagrilintide': ['cagri', 'cagrilin'],
  'eloralintide': ['elora', 'ly3841136', 'ly 3841136', 'amylin agonist'],
  'ghk-cu': ['ghk', 'ghkcu', 'copper peptide'],
  'mots-c': ['mots', 'motsc', 'mots c'],
  'pt-141': ['pt141', 'bremelanotide'],
  'melanotan ii': ['mt2', 'mt-ii', 'melanotan 2', 'melanotanii'],
  'melanotan i': ['mt1', 'mt-i', 'afamelanotide'],
  'aod9604': ['aod', 'aod-9604', 'aod 9604'],
  'epitalon': ['epithalon', 'epi', 'epitalon peptide'],
  'klow': ['klow blend', 'k l o w'],
  'gonadorelin': ['gnrh', 'gona'],
  'humanin': ['huma'],
  'kpv': ['lysine proline valine'],
  'semax': ['sem', 'semax peptide'],
  'selank': ['sel', 'selanc'],
  'dsip': ['delta sleep'],
  'thymulin': ['thy'],
  'hexarelin': ['hex'],
  'sermorelin': ['serm', 'sermo'],
  'ghrp-2': ['ghrp2'],
  'ghrp-6': ['ghrp6'],
  'mt-ii': ['melanotan'],
};

/**
 * Return alias tokens for a peptide/blend given its display name + shortName.
 * Multiple alias entries may apply (e.g. a stack containing BPC-157 + TB-500).
 */
export function getAliasesFor(name: string, shortName: string): string[] {
  const haystack = `${name} ${shortName}`.toLowerCase();
  const out: string[] = [];
  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (haystack.includes(key)) out.push(...aliases);
  }
  return out;
}

/**
 * Tiny Levenshtein with early-exit cap. Returns distance up to `max`, or max+1
 * if the true distance exceeds it. Plenty fast for short search queries.
 */
export function boundedLevenshtein(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}
