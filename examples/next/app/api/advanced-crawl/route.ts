import { NextResponse } from 'next/server';
import { AsyncWebCrawler } from '@flyrank/flyscrape';

export async function POST(request: Request) {
  const { url, mode, sessionId } = await request.json();
  const crawler = new AsyncWebCrawler({ headless: true });

  try {
    let result;

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
      // Uses got-scraping for high-performance, stealthy non-browser requests
      console.log(`[Fast Mode] Crawling ${url} with TLS client`);
      result = await crawler.arun(url, {
        jsExecution: false, // Disables browser, enables got-scraping
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
        // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
        cookies: mode === 'session' ? (result as any).cookies : undefined,
        htmlLength: result.html.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
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
