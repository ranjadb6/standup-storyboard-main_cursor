export const detectUrls = (text: string): { type: 'url' | 'text'; content: string }[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: { type: 'url' | 'text'; content: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    // Add URL
    parts.push({
      type: 'url',
      content: match[0],
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
};
