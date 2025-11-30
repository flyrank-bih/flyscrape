/**
 * Formats a list of references into a markdown citation section.
 * @param references Array of reference URLs.
 * @returns Formatted reference list string.
 */
export function formatReferences(references: string[]): string {
  if (references.length === 0) return '';

  const lines = ['\n\n## References\n'];
  references.forEach((ref, index) => {
    lines.push(`${index + 1}. ${ref}`);
  });

  return lines.join('\n');
}

/**
 * Converts standard markdown links [text](url) to citation style [text][i].
 * @param markdown The input markdown with standard links.
 * @returns Object containing the converted markdown and the list of references.
 */
export function convertToCitations(markdown: string): {
  markdown: string;
  references: string[];
} {
  const references: string[] = [];
  const urlMap = new Map<string, number>();

  // Regex to find markdown links: [text](url "optional title")
  // We need to be careful with nested brackets, but standard markdown links usually don't nest.
  // This is a simplified regex for standard [text](url) pattern.
  const linkRegex = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]+")?\)/g;

  const newMarkdown = markdown.replace(linkRegex, (_match, text, url) => {
    // console.log('Match:', match);
    // console.log('Text:', text);
    // console.log('URL:', url);

    // Normalize URL (trim)
    const cleanUrl = url.trim();

    let index: number;
    if (urlMap.has(cleanUrl)) {
      const found = urlMap.get(cleanUrl);
      if (found === undefined) {
        throw new Error(`URL not found in map: ${cleanUrl}`);
      }
      index = found;
    } else {
      index = references.length + 1;
      references.push(cleanUrl);
      urlMap.set(cleanUrl, index);
    }

    return `[${text}][${index}]`;
  });

  return {
    markdown: newMarkdown,
    references,
  };
}
