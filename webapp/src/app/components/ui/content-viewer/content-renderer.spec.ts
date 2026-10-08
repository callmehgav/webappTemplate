import { renderContent } from './content-renderer';

describe('About content formatting', () => {
  it('renders Markdown headings, bold text, and paragraphs', () => {
    expect(renderContent('## Your event\n\nA **beautiful** day.\n\nAnother paragraph.', 1))
      .toBe('<h2>Your event</h2><p>A <strong>beautiful</strong> day.</p><p>Another paragraph.</p>');
  });
  it('supports simple HTML heading and paragraph notation', () => {
    expect(renderContent('<h3>Visit us</h3><p>Our <strong>venue</strong>.</p>', 1))
      .toBe('<h3>Visit us</h3><p>Our <strong>venue</strong>.</p>');
  });
  it('keeps unsupported HTML inert', () => {
    const result = renderContent('<script>alert(1)</script>\n\n**<img src=x onerror=alert(1)>**', 1);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('<strong>&lt;img');
  });
  it('preserves plain-text format without interpreting Markdown', () => {
    expect(renderContent('## Heading\n\n**Text**', 0)).toBe('<p>## Heading</p><p>**Text**</p>');
  });
});
