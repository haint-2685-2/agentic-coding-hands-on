import type { Page } from '@playwright/test';

/**
 * Helpers to mock Supabase Edge Function / PostgREST responses called by
 * the FE. Routes match by URL substring so tests stay loose against the
 * exact host/port of the Supabase stack.
 */

export type RouteSpec = {
  match: string | RegExp;
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  contentType?: string;
};

export async function mockRoutes(page: Page, specs: RouteSpec[]) {
  for (const spec of specs) {
    const matcher =
      typeof spec.match === 'string'
        ? new RegExp(spec.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        : spec.match;
    await page.route(matcher, async (route) => {
      await route.fulfill({
        status: spec.status ?? 200,
        contentType: spec.contentType ?? 'application/json',
        headers: spec.headers,
        body: typeof spec.body === 'string' ? spec.body : JSON.stringify(spec.body ?? {}),
      });
    });
  }
}

/** Record outbound requests matching a URL pattern, for shape assertions. */
export function recordRequests(page: Page, pattern: RegExp) {
  const records: { url: string; method: string; postData: string | null }[] = [];
  page.on('request', (req) => {
    if (pattern.test(req.url())) {
      records.push({ url: req.url(), method: req.method(), postData: req.postData() });
    }
  });
  return records;
}
