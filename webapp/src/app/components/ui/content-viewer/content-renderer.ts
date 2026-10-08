/** Render the supported About formatting without allowing arbitrary HTML. */
export function renderContent(source: string, format: number): string {
  const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const inline = (text: string) => escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  if (format !== 1) return source.split(/\n\s*\n/).filter(block => block.trim()).map(block => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`).join('');

  // Accept simple HTML paragraph/heading notation as well as Markdown shortcuts.
  const normalized = source.replace(/\r\n/g, '\n')
    .replace(/<h([1-6])\s*>([\s\S]*?)<\/h\1\s*>/gi, (_, level: string, text: string) => `\n\n${'#'.repeat(+level)} ${text}\n\n`)
    .replace(/<\/?p\s*>/gi, '\n\n')
    .replace(/<\/?(?:strong|b)\s*>/gi, '**')
    .replace(/<\/?(?:em|i)\s*>/gi, '*')
    .replace(/<br\s*\/?\s*>/gi, '\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  const flush = () => { if (paragraph.length) blocks.push(`<p>${paragraph.map(inline).join('<br>')}</p>`); paragraph = []; };
  for (const line of normalized.split('\n')) {
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!line.trim()) { flush(); }
    else if (heading) { flush(); const level = heading[1].length; blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`); }
    else paragraph.push(line);
  }
  flush();
  return blocks.join('');
}
