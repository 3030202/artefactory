// Simple Diff Viewer
export class DiffViewer {
  static computeLineDiff(oldText = '', newText = '') {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff = [];

    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const o = oldLines[i];
      const n = newLines[i];

      if (o === n) {
        diff.push({ type: 'unchanged', line: o || '' });
      } else {
        if (o !== undefined) diff.push({ type: 'removed', line: o });
        if (n !== undefined) diff.push({ type: 'added', line: n });
      }
    }
    return diff;
  }

  static renderToHtml(diffArray) {
    let html = `<div class="diff-container" style="font-family: var(--font-mono); font-size: 12px; line-height: 1.5; background: #070a12; border-radius: 8px; padding: 12px; border: 1px solid var(--border-subtle); max-height: 360px; overflow-y: auto;">`;
    diffArray.forEach(item => {
      if (item.type === 'added') {
        html += `<div style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 8px; border-left: 3px solid #10b981;">+ ${this.escapeHtml(item.line)}</div>`;
      } else if (item.type === 'removed') {
        html += `<div style="background: rgba(239, 68, 68, 0.15); color: #f87171; padding: 2px 8px; border-left: 3px solid #ef4444;">- ${this.escapeHtml(item.line)}</div>`;
      } else {
        html += `<div style="color: #94a3b8; padding: 2px 8px;">  ${this.escapeHtml(item.line)}</div>`;
      }
    });
    html += `</div>`;
    return html;
  }

  static escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
