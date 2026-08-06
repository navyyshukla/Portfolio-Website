import "server-only";

/**
 * Picks which corpus documents go into the system prompt for a given question.
 *
 * Why this exists at all: the corpus is resent on every call, and the primary
 * free-tier model allows 100,000 tokens per day. Sending the whole record every
 * time caps the site at roughly twenty questions a day. Sending only what the
 * question is about covers four times as many projects for less than today's
 * prompt.
 *
 * There is no embedding step, no vector store and no network call — with about
 * a dozen documents, weighted term overlap is both sufficient and debuggable.
 * `scripts/eval-retrieval.mjs` is the check that it stays sufficient; run it
 * after touching anything in this file.
 *
 * This is prompt assembly, not a tool: the assistant cannot invoke it, cannot
 * see it, and cannot ask for a document. That distinction is what keeps the
 * "no tools, ever" rule in CLAUDE.md intact.
 */

export interface Retrievable {
  id: string;
  /** Title, slug, stack, keywords — a hit here is a strong signal. */
  strong: string;
  /** Body prose — a hit here is a weak signal. */
  weak: string;
}

/**
 * Words that appear in almost every recruiter question and so carry no signal.
 * This is a relevance-ranking aid, NOT a content filter — it never decides
 * whether a question gets answered, only which documents get attached.
 */
const STOPWORDS = new Set(
  ("the a an and or but if then than that this these those there here what which " +
    "who whom whose when where why how is are was were be been being am do does " +
    "did doing have has had having can could will would shall should may might " +
    "must of in on at by for with about against between into through during to " +
    "from up down out off over under again further once all any both each few " +
    "more most other some such no nor not only own same so too very just now " +
    "he she they it its his her their them him us we you your yours me my mine " +
    "i tell show give explain describe know about work works worked working " +
    "project projects thing things stuff much many good great best also please " +
    "did does done get got make made use used using like as well one two")
    .split(" "),
);

const STRONG_WEIGHT = 3;
const WEAK_WEIGHT = 1;

/** Below this share of the best score, a document is noise rather than a match. */
const RELATIVE_FLOOR = 0.34;
/** Below this absolute score, nothing matched and the caller should fall back. */
const ABSOLUTE_FLOOR = 1.2;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.+#]+/)
    .flatMap((raw) => {
      const word = raw.replace(/^\.+|\.+$/g, "");
      if (!word) return [];
      // "next.js" and "nextjs" must match each other; so must "node.js"/"node".
      const bare = word.replace(/\./g, "");
      return bare !== word ? [word, bare] : [word];
    })
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

/**
 * Rare terms discriminate; terms in every document do not. With ~12 documents
 * this is a crude inverse document frequency, but it is the difference between
 * "python" (in most of them) and "n8n" (in one) counting the same.
 */
function inverseFrequency(docs: Retrievable[]): Map<string, number> {
  const seen = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(tokenize(`${doc.strong} ${doc.weak}`))) {
      seen.set(term, (seen.get(term) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, count] of seen) {
    idf.set(term, Math.log(1 + docs.length / count));
  }
  return idf;
}

export function scoreDocuments(
  query: string,
  docs: Retrievable[],
): { id: string; score: number }[] {
  const terms = new Set(tokenize(query));
  const idf = inverseFrequency(docs);

  return docs
    .map((doc) => {
      // Presence per field, not frequency: otherwise the longest document wins
      // every broad question purely by repeating a word.
      const strong = new Set(tokenize(doc.strong));
      const weak = new Set(tokenize(doc.weak));
      let score = 0;
      for (const term of terms) {
        const weight = idf.get(term) ?? 0;
        if (!weight) continue;
        if (strong.has(term)) score += STRONG_WEIGHT * weight;
        else if (weak.has(term)) score += WEAK_WEIGHT * weight;
      }
      return { id: doc.id, score };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/**
 * The ids to attach in full, best first. Empty means nothing matched — the
 * caller decides what to send instead, and must send something.
 */
export function selectDocuments(
  query: string,
  docs: Retrievable[],
  limit: number,
): string[] {
  const ranked = scoreDocuments(query, docs);
  const best = ranked[0];
  if (!best || best.score < ABSOLUTE_FLOOR) return [];

  return ranked
    .filter((d) => d.score >= best.score * RELATIVE_FLOOR)
    .slice(0, limit)
    .map((d) => d.id);
}
