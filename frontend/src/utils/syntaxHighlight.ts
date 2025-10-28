/**
 * Simple syntax highlighting for code blocks
 * Supports common programming languages
 */
export function highlightCode(code: string): string {
  // Common keywords across languages
  const keywords = [
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'return', 'function', 'class', 'const', 'let', 'var', 'import', 'export',
    'from', 'as', 'default', 'new', 'this', 'super', 'extends', 'implements',
    'public', 'private', 'protected', 'static', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'void', 'null', 'undefined', 'true', 'false', 'def',
    'print', 'input', 'range', 'len', 'str', 'int', 'float', 'bool', 'list',
    'dict', 'set', 'tuple', 'in', 'not', 'and', 'or', 'is', 'lambda', 'with',
    'pass', 'raise', 'assert', 'yield', 'global', 'nonlocal', 'del', 'echo'
  ];

  let result = code;

  // Escape HTML first
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Use placeholders to mark already highlighted sections
  const placeholders: string[] = [];

  const createPlaceholder = (content: string): string => {
    const index = placeholders.length;
    placeholders.push(content);
    return `\x00PLACEHOLDER_${index}\x00`;
  };

  // Highlight strings (single, double quotes, and backticks)
  result = result.replace(/(['"`])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    return createPlaceholder(`<span class="string">${match}</span>`);
  });

  // Highlight single-line comments (// and #)
  result = result.replace(/(\/\/.*$|#.*$)/gm, (match) => {
    return createPlaceholder(`<span class="comment">${match}</span>`);
  });

  // Highlight multi-line comments /* */
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, (match) => {
    return createPlaceholder(`<span class="comment">${match}</span>`);
  });

  // Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, (match) => {
    return createPlaceholder(`<span class="number">${match}</span>`);
  });

  // Highlight keywords (word boundaries to avoid partial matches)
  const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  result = result.replace(keywordPattern, (match) => {
    return createPlaceholder(`<span class="keyword">${match}</span>`);
  });

  // Highlight function calls (identifier followed by opening parenthesis)
  result = result.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, (match) => {
    const trimmed = match.trim();
    // Don't highlight if it's already a keyword
    if (!keywords.includes(trimmed)) {
      return createPlaceholder(`<span class="function">${match}</span>`);
    }
    return match;
  });

  // Replace placeholders back with actual HTML
  placeholders.forEach((content, index) => {
    result = result.replace(new RegExp(`\x00PLACEHOLDER_${index}\x00`, 'g'), content);
  });

  return result;
}
