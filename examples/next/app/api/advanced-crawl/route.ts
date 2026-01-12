import { AsyncWebCrawler, type CrawlResult } from '@flyrank/flyscrape';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { url, mode, sessionId } = await request.json();
  const crawler = new AsyncWebCrawler({ headless: true });

  try {
    let result: CrawlResult;

    if (mode === 'session') {
      // 1. Session Persistence Example
      // This reuses the browser context (cookies, storage)
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: 'Session ID required for session mode' },
          { status: 400 },
        );
      }

      console.log(`[Session Mode] Crawling ${url} with session: ${sessionId}`);
      result = await crawler.arun(url, {
        session_id: sessionId,
        // Optional: wait for network idle to ensure cookies are set
        waitMode: 'networkidle',
      });
    } else if (mode === 'fast') {
      // 2. Fast Mode (TLS Client) Example
      // Uses impit for high-performance, stealthy non-browser requests
      console.log(`[Fast Mode] Crawling ${url} with TLS client`);
      result = await crawler.arun(url, {
        jsExecution: false, // Disables browser, enables impit
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid mode' },
        { status: 400 },
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        title: result.metadata?.title,
        statusCode: result.statusCode,
        // Return cookies to prove session persistence works (if in session mode)
        cookies: mode === 'session' ? result.cookies : undefined,
        htmlLength: result.html.length,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  } finally {
    // In a real app, you might want to keep the session alive.
    // Here we close it for the example unless it's a persistent service.
    if (mode === 'session' && sessionId) {
      // Don't close session if you want to reuse it in next request!
      // For this example, we'll keep it open.
      // await crawler.closeSession(sessionId);
    }
    // Only close the browser if we are done with all sessions
    // await crawler.close();
  }
}
