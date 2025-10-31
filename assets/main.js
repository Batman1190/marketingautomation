/* Minimal client-side Markdown + Mermaid renderer */

(function() {
  const params = new URLSearchParams(window.location.search);
  const src = params.get('src');
  const titleEl = document.getElementById('doc-title');
  const target = document.getElementById('render-target');

  if (!target) return; // On index page there is no render target

  if (!src) {
    titleEl && (titleEl.textContent = 'No document specified');
    target.innerHTML = '<p>Provide a file via ?src=relative/path.md</p>';
    return;
  }

  titleEl && (titleEl.textContent = src.split('/').slice(-1)[0]);

  fetch(src)
    .then(async r => {
      if (!r.ok) throw new Error(`Failed to load ${src}`);
      const content = await r.text();
      const isMermaid = src.endsWith('.mmd');

      if (isMermaid) {
        // Wrap mermaid source into a code fence for consistent presentation
        target.innerHTML = `<pre class="mermaid">${DOMPurify.sanitize(content)}</pre>`;
        // Initialize mermaid
        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
          // Replace pre with div.mermaid for rendering
          const pre = target.querySelector('pre.mermaid');
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.textContent = content;
          pre.replaceWith(div);
          window.mermaid.run({ querySelector: '.mermaid' });
        }
        return;
      }

      // Render Markdown with marked -> sanitize -> inject
      const html = marked.parse(content, { mangle: false, headerIds: true });
      const safe = DOMPurify.sanitize(html);
      target.innerHTML = safe;

      // Mermaid support inside markdown ```mermaid blocks
      if (window.mermaid) {
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        // Replace code blocks labeled as mermaid into .mermaid divs
        const codeBlocks = target.querySelectorAll('pre code.language-mermaid');
        codeBlocks.forEach(code => {
          const pre = code.closest('pre');
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.textContent = code.textContent;
          pre.replaceWith(div);
        });
        window.mermaid.run({ querySelector: '.mermaid' });
      }
    })
    .catch(err => {
      target.innerHTML = `<p style="color:#fca5a5;">${DOMPurify.sanitize(String(err))}</p>`;
    });
})();


