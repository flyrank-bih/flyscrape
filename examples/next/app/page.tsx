/** biome-ignore-all lint/suspicious/noExplicitAny: <Technical debt> */
"use client";

import { useState } from "react";
import { scrapeUrl } from "./actions";

export default function Home() {
  const [url, setUrl] = useState("https://example.com");
  const [contentOnly, setContentOnly] = useState(false);
  const [excludeMedia, setExcludeMedia] = useState(false);
  const [optimizeWithAI, setOptimizeWithAI] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await scrapeUrl(url, {
        contentOnly,
        excludeMedia,
        optimizeWithAI,
      });
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 font-sans bg-white text-black">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">FlyScrape Next.js Test</h1>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded text-black"
            placeholder="Enter URL to scrape"
          />
          <button
            onClick={handleScrape}
            type="button"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Scraping..." : "Scrape"}
          </button>
        </div>

        <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50 rounded border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={contentOnly}
              onChange={(e) => setContentOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Content Only</span>
          </label>

          {contentOnly && (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excludeMedia}
                  onChange={(e) => setExcludeMedia(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Exclude Media</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={optimizeWithAI}
                  onChange={(e) => setOptimizeWithAI(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Optimize with AI (Requires API Key)</span>
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-100 rounded border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">Metadata</h2>
              <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-60">
                {JSON.stringify(result.metadata, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-gray-100 rounded border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">Markdown Content</h2>
              <div className="bg-white p-4 rounded border h-96 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {result.markdown}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-gray-100 rounded border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">Raw Result</h2>
              <details>
                <summary className="cursor-pointer text-blue-600 font-medium">
                  View Full JSON
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-96 bg-white p-2 rounded border">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
