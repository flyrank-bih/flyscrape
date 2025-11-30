import TurndownService from 'turndown';

/**
 * Configures a TurndownService instance with standard options for clean markdown.
 * @param service The TurndownService instance to configure.
 */
export function configureTurndown(service: TurndownService): void {
  // Standard configuration
  service.addRule('remove_script_style', {
    filter: ['script', 'style', 'noscript', 'iframe'],
    replacement: () => '',
  });

  // Ensure code blocks are fenced
  service.options.codeBlockStyle = 'fenced';

  // Use # for headings
  service.options.headingStyle = 'atx';

  // Use - for bullet points
  service.options.bulletListMarker = '-';

  // Simple table handling (converts to text if not supported, or basic formatting)
  // Turndown doesn't support tables OOB, it strips them or keeps text.
  // For now, we'll let it default to text-preserving behavior unless we add a plugin.
  // We can add a custom rule to preserve simple table structure if needed later.
}

/**
 * Creates a pre-configured TurndownService.
 */
export function createTurndownService(
  options: TurndownService.Options = {},
): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    ...options,
  });

  configureTurndown(service);
  return service;
}
