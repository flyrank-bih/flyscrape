/** biome-ignore-all lint/suspicious/noExplicitAny: <Technical debt> */
'use client';

import {
  CheckCircle2,
  Code2,
  Copy,
  Globe,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { type SetStateAction, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { scrapeUrl } from './actions';

export default function Home() {
  const [url, setUrl] = useState('https://example.com');
  const [contentOnly, setContentOnly] = useState(false);
  const [excludeMedia, setExcludeMedia] = useState(false);
  const [optimizeWithAI, setOptimizeWithAI] = useState(false);
  const [stealth, setStealth] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await scrapeUrl(url, {
        contentOnly,
        excludeMedia,
        optimizeWithAI,
        stealth,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold">FlyRank</span>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                SDK Preview
              </Badge>
            </div>
            <nav className="flex items-center gap-6">
              <a
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </a>
              <a
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                API
              </a>
              <a
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-4">
              Web Crawling SDK for Developers
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground text-pretty leading-relaxed">
              Extract structured data from any website with our powerful API.
              Built for scale, optimized for performance.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Interactive Demo */}
          <div className="lg:col-span-7">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Interactive Playground
                </CardTitle>
                <CardDescription>
                  Test the FlyRank crawler API with real URLs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">
                    Target URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e: {
                        target: { value: SetStateAction<string> };
                      }) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleScrape}
                      disabled={loading}
                      size="default"
                      className="min-w-[100px]"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Crawling...
                        </>
                      ) : (
                        'Crawl'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Label
                        htmlFor="stealth"
                        className="font-medium cursor-pointer"
                      >
                        Stealth Mode
                      </Label>
                    </div>
                    <input
                      id="stealth"
                      type="checkbox"
                      checked={stealth}
                      onChange={(e) => setStealth(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-muted-foreground" />
                      <Label
                        htmlFor="contentOnly"
                        className="font-medium cursor-pointer"
                      >
                        Content Only
                      </Label>
                    </div>
                    <input
                      id="contentOnly"
                      type="checkbox"
                      checked={contentOnly}
                      onChange={(e) => setContentOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                  </div>

                  {contentOnly && (
                    <>
                      <div className="flex items-center justify-between pl-6">
                        <Label
                          htmlFor="excludeMedia"
                          className="text-sm cursor-pointer"
                        >
                          Exclude Media
                        </Label>
                        <input
                          id="excludeMedia"
                          type="checkbox"
                          checked={excludeMedia}
                          onChange={(e) => setExcludeMedia(e.target.checked)}
                          className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between pl-6">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-muted-foreground" />
                          <Label
                            htmlFor="optimizeWithAI"
                            className="text-sm cursor-pointer"
                          >
                            AI Optimization
                          </Label>
                        </div>
                        <input
                          id="optimizeWithAI"
                          type="checkbox"
                          checked={optimizeWithAI}
                          onChange={(e) => setOptimizeWithAI(e.target.checked)}
                          className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Success State */}
                {result && !error && (
                  <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Successfully crawled and extracted content
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <Card className="mt-6 shadow-sm">
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>Extracted data from {url}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="metadata" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                      <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                    </TabsList>

                    <TabsContent value="metadata" className="mt-4">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(result.metadata, null, 2),
                            )
                          }
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-[400px] text-xs sm:text-sm">
                          {JSON.stringify(result.metadata, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="markdown" className="mt-4">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 z-10"
                          onClick={() => copyToClipboard(result.markdown)}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-[400px] text-xs sm:text-sm whitespace-pre-wrap">
                          {result.markdown}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="raw" className="mt-4">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 z-10"
                          onClick={() =>
                            copyToClipboard(JSON.stringify(result, null, 2))
                          }
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-[400px] text-xs sm:text-sm">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Code Example */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Quick Start
                  </CardTitle>
                  <CardDescription>
                    Get started with FlyRank in seconds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        INSTALLATION
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          copyToClipboard('npm install @flyrank/flyscrape')
                        }
                      >
                        {copied ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre className="p-3 bg-muted rounded-md text-xs sm:text-sm font-mono">
                      npm install @flyrank/flyscrape
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        EXAMPLE
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          copyToClipboard(`import { AsyncWebCrawler } from "@flyrank/flyscrape";

async function main() {
  const crawler = new AsyncWebCrawler();
  await crawler.start();
  
  // Crawl a URL and get clean Markdown
  const result = await crawler.arun("https://example.com");
  
  if (result.success) {
    console.log(result.markdown);
  }
  
  await crawler.close();
}

main();`)
                        }
                      >
                        {copied ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre className="p-3 bg-muted rounded-md text-xs sm:text-sm font-mono overflow-x-auto">
                      {`import { AsyncWebCrawler } from "@flyrank/flyscrape";

async function main() {
  const crawler = new AsyncWebCrawler();
  await crawler.start();
  
  // Crawl a URL and get clean Markdown
  const result = await crawler.arun("https://example.com");
  
  if (result.success) {
    console.log(result.markdown);
  }
  
  await crawler.close();
}

main();`}
                    </pre>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium mb-3">Features</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>
                          Bypass anti-bot protection with stealth mode
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>Extract clean markdown content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>AI-powered content optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>High-performance distributed crawling</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
