/**
 * Parse markdown-like bold syntax (**text**) to HTML <strong> tags
 * @param text - Text containing **bold** markers
 * @returns HTML string with <strong> tags
 */
export const parseBoldText = (text: string): string => {
  if (!text) return '';
  
  // Replace LaTeX arrows - handle broken formats like "$ ightarrow$" or "$\nrightarrow$"
  let result = text
    // Match: $ [whitespace] [\] [r]ightarrow [whitespace] $
    .replace(/\$\s*\\?r?ightarrow\s*\$/gi, '→')
    .replace(/\$\s*\\?l?eftarrow\s*\$/gi, '←')
    .replace(/\$\s*\\?l?eftrightarrow\s*\$/gi, '↔')
    .replace(/\$\s*\\?R?ightarrow\s*\$/gi, '⇒')
    .replace(/\$\s*\\?L?eftarrow\s*\$/gi, '⇐')
    .replace(/\$\s*\\?L?eftrightarrow\s*\$/gi, '⇔');
  
  // Replace **text** with <strong>text</strong>
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace \n with <br> for line breaks
  result = result.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
  
  return result;
};
