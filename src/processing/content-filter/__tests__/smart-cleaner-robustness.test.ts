import { describe, expect, it } from 'vitest';
import { smartClean } from '../smart-cleaner';

describe('Smart Cleaner Robustness', () => {
  it('should extract content from fallback selectors when scoring fails', async () => {
    const html = `
      <html>
        <body>
          <div class="header">Header</div>
          <div class="main-content">
            <h1>Article Title</h1>
            <p>This is the main content of the article. It should be extracted even without main or article tags.</p>
            <p>More content here to ensure it has some length and score.</p>
          </div>
          <div class="footer">Footer</div>
        </body>
      </html>
    `;

    const cleaned = await smartClean(html, { mode: 'strict' });
    expect(cleaned).toContain('Article Title');
    expect(cleaned).toContain('This is the main content');
    expect(cleaned).not.toContain('Header');
    expect(cleaned).not.toContain('Footer');
  });

  it("should not remove layout containers with 'sidebar' in name", async () => {
    const html = `
      <html>
        <body>
          <div class="layout-sidebar">
            <div class="sidebar">
               <a href="#">Link 1</a>
               <a href="#">Link 2</a>
            </div>
            <div class="content">
              <h1>Real Content</h1>
              <p>This content is inside a layout-sidebar container. It should NOT be removed.</p>
              <p>The sidebar itself SHOULD be removed.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const cleaned = await smartClean(html, { mode: 'strict' });
    expect(cleaned).toContain('Real Content');
    expect(cleaned).not.toContain('Link 1');
  });

  it("should remove 'sidebar' class elements", async () => {
    const html = `
      <html>
        <body>
           <div class="sidebar">Sidebar Content</div>
           <div class="main">Main Content</div>
        </body>
      </html>
    `;
    const cleaned = await smartClean(html);
    expect(cleaned).not.toContain('Sidebar Content');
    expect(cleaned).toContain('Main Content');
  });

  it('should fallback to body if no specific container found', async () => {
    const html = `
       <html>
         <body>
           <p>Just some text in the body without any wrapper.</p>
           <p>Another paragraph of text.</p>
         </body>
       </html>
     `;
    const cleaned = await smartClean(html);
    expect(cleaned).toContain('Just some text');
  });
});
