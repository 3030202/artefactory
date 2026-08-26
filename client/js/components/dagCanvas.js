// Interactive DAG Canvas Renderer
export class DAGCanvas {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.nodes = [];
    this.edges = [];
    this.activeNodeId = null;
    this.onNodeClick = options.onNodeClick || (() => {});
  }

  render(workflow) {
    if (!workflow) return;
    this.nodes = workflow.nodes || [];
    this.edges = workflow.edges || [];

    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'dag-wrapper';

    // SVG Layer for connectors
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'dag-canvas');
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.zIndex = '1';
    wrapper.appendChild(svg);

    // Defs for Arrow Markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="dag-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
      </marker>
      <marker id="dag-arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
      </marker>
    `;
    svg.appendChild(defs);

    // Render Edges
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.from);
      const targetNode = this.nodes.find(n => n.id === edge.to);
      if (!sourceNode || !targetNode) return;

      const sx = (sourceNode.x || 100) + 160;
      const sy = (sourceNode.y || 100) + 26;
      const tx = targetNode.x || 300;
      const ty = (targetNode.y || 100) + 26;

      const dx = (tx - sx) / 2;
      const pathData = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#475569');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-dasharray', '4 4');
      path.setAttribute('marker-end', 'url(#dag-arrow)');
      path.id = `edge-${edge.from}-${edge.to}`;
      svg.appendChild(path);

      if (edge.label) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (sx + tx) / 2);
        text.setAttribute('y', (sy + ty) / 2 - 8);
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '10');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'sans-serif');
        text.textContent = edge.label;
        svg.appendChild(text);
      }
    });

    // Render Nodes
    this.nodes.forEach(node => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'dag-node';
      nodeEl.id = `node-${node.id}`;
      nodeEl.style.left = `${node.x || 100}px`;
      nodeEl.style.top = `${node.y || 100}px`;

      let icon = '⚡';
      if (node.type === 'prompt') icon = '🟣';
      if (node.type === 'code' || node.type === 'skill') icon = '🟢';
      if (node.type === 'test') icon = '🧪';
      if (node.type === 'security') icon = '🛡️';
      if (node.type === 'mcp') icon = '🌐';
      if (node.type === 'dataset') icon = '📊';

      nodeEl.innerHTML = `
        <div class="dag-node-title">
          <span>${icon}</span>
          <span>${node.label}</span>
        </div>
        <div class="dag-node-status" id="status-${node.id}">Status: ${node.status || 'READY'}</div>
      `;

      nodeEl.addEventListener('click', () => {
        this.onNodeClick(node);
      });

      wrapper.appendChild(nodeEl);
    });

    this.container.appendChild(wrapper);
  }

  highlightStep(nodeId, status = 'RUNNING') {
    this.nodes.forEach(n => {
      const el = document.getElementById(`node-${n.id}`);
      if (el) el.classList.remove('active-running');
    });

    const activeEl = document.getElementById(`node-${nodeId}`);
    if (activeEl) {
      activeEl.classList.add('active-running');
      const statusEl = document.getElementById(`status-${nodeId}`);
      if (statusEl) statusEl.textContent = `Status: ${status}`;
    }
  }

  markCompleted(nodeId) {
    const el = document.getElementById(`node-${nodeId}`);
    if (el) {
      el.classList.remove('active-running');
      el.style.borderColor = 'var(--status-success)';
      const statusEl = document.getElementById(`status-${nodeId}`);
      if (statusEl) {
        statusEl.textContent = 'Status: COMPLETED';
        statusEl.style.color = 'var(--status-success)';
      }
    }
  }
}
