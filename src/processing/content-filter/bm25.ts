import type { BM25Options } from './interfaces';

/**
 * Implementation of the BM25 (Best Matching 25) ranking function.
 * Used for estimating the relevance of documents to a given search query.
 */
export class BM25 {
  private documents: string[][];
  private docLengths: number[];
  private avgdl: number;
  private k1: number;
  private b: number;
  private idf: Map<string, number>;

  /**
   * Creates a new BM25 instance.
   * @param corpus Array of documents (strings) to index.
   * @param options Configuration options.
   */
  constructor(corpus: string[], options: BM25Options = {}) {
    this.k1 = options.k1 ?? 1.2;
    this.b = options.b ?? 0.75;

    // Tokenize all documents
    this.documents = corpus.map((doc) => this.tokenize(doc));
    this.docLengths = this.documents.map((doc) => doc.length);

    // Calculate average document length
    const totalLength = this.docLengths.reduce((a, b) => a + b, 0);
    this.avgdl = totalLength / (this.docLengths.length || 1);

    this.idf = new Map();
    this.calculateIDF();
  }

  /**
   * Simple tokenizer that splits by non-alphanumeric characters.
   * @param text Text to tokenize.
   * @returns Array of tokens.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  /**
   * Calculates Inverse Document Frequency (IDF) for all terms in the corpus.
   */
  private calculateIDF() {
    const docCount = this.documents.length;
    const docFreqs = new Map<string, number>();

    // Count document frequency for each term
    for (const doc of this.documents) {
      const uniqueTokens = new Set(doc);
      for (const token of Array.from(uniqueTokens)) {
        docFreqs.set(token, (docFreqs.get(token) || 0) + 1);
      }
    }

    // Calculate IDF for each term
    docFreqs.forEach((freq, token) => {
      // Standard IDF formula: log((N - n + 0.5) / (n + 0.5) + 1)
      const idf = Math.log((docCount - freq + 0.5) / (freq + 0.5) + 1);
      this.idf.set(token, Math.max(idf, 0)); // Ensure non-negative
    });
  }

  /**
   * Scores documents against a query.
   * @param query The search query.
   * @returns Array of scores corresponding to the original documents.
   */
  public score(query: string): number[] {
    const queryTokens = this.tokenize(query);
    const scores = new Array(this.documents.length).fill(0);

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const docLen = this.docLengths[i];

      if (docLen === 0) continue;

      // Calculate term frequencies for this document
      const tf = new Map<string, number>();
      for (const token of doc) {
        tf.set(token, (tf.get(token) || 0) + 1);
      }

      for (const token of queryTokens) {
        if (!this.idf.has(token)) continue;

        const tokenFreq = tf.get(token) || 0;
        const idf = this.idf.get(token);
        if (idf === undefined) continue;

        // BM25 formula
        const num = tokenFreq * (this.k1 + 1);
        const den =
          tokenFreq + this.k1 * (1 - this.b + this.b * (docLen / this.avgdl));

        scores[i] += idf * (num / den);
      }
    }

    return scores;
  }
}
