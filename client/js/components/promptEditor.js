import { api } from '../api.js';
import { Toast } from './toast.js';
import { Icons } from './icons.js';

export class PromptEditor {
  static openModal(prompt = null, onSaved = null) {
    const isEdit = !!prompt;
    const p = prompt || {
      id: '',
      title: '',
      description: '',
      template: 'Ты опытный AI-инженер. Проанализируй следующий контекст: {{context}}.\n\nВыполни задачу: {{task}} и верни результат строго в JSON формате.',
      variables: ['context', 'task'],
      model: 'universal',
      category: 'engineering',
      tags: ['ai', 'agent', 'rag'],
      version: '1.0.0',
      schema: JSON.stringify({
        type: "object",
        properties: {
          analysis: { type: "string" },
          status: { type: "string", enum: ["success", "error"] },
          score: { type: "number" }
        },
        required: ["analysis", "status"]
      }, null, 2),
      in_tokens_est: 250,
      out_tokens_est: 800
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';

    backdrop.innerHTML = `
      <div class="modal-window" style="max-width: 920px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-drag-handle"></div>
        
        <!-- Modal Header -->
        <div class="modal-header" style="flex-shrink: 0;">
          <div class="modal-title">
            <span style="color: var(--cat-prompts, #8b5cf6);">${Icons.prompts(20)}</span>
            <span>${isEdit ? `Edit Prompt Template: ${p.title || 'Untitled'}` : 'New Prompt Template'}</span>
            <span class="badge badge-prompts">Prompt Studio Pro</span>
          </div>
          <button class="btn-icon btn-close-modal">✕</button>
        </div>

        <!-- Editor Tabs Bar -->
        <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding: 0 20px; background: rgba(0,0,0,0.25); flex-shrink: 0;">
          <button class="tab-btn active" data-tab="template" style="padding: 10px 14px; font-size: 12px; font-weight: 600; background: none; border: none; color: var(--text-primary); cursor: pointer; border-bottom: 2px solid var(--cat-prompts, #8b5cf6);">
            📝 Template & Variables
          </button>
          <button class="tab-btn" data-tab="schema" style="padding: 10px 14px; font-size: 12px; font-weight: 600; background: none; border: none; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent;">
            📐 JSON Schema (Structured Output)
          </button>
          <button class="tab-btn" data-tab="playground" style="padding: 10px 14px; font-size: 12px; font-weight: 600; background: none; border: none; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent;">
            🧪 Test Playground & Live Preview
          </button>
          <button class="tab-btn" data-tab="cost" style="padding: 10px 14px; font-size: 12px; font-weight: 600; background: none; border: none; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent;">
            📊 Token Metrics & Cost Estimator
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="modal-body" id="prompt-editor-body" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Top Metadata Form Row -->
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 11.5px;">Prompt Title *</label>
              <input type="text" class="form-input" id="inp-prompt-title" value="${p.title || ''}" placeholder="e.g. LangChain Agent ReAct Supervisor" required>
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 11.5px;">Target LLM Model</label>
              <select class="form-select" id="inp-prompt-model">
                <option value="universal" ${p.model === 'universal' ? 'selected' : ''}>Universal (All LLMs)</option>
                <option value="gpt-4o" ${p.model === 'gpt-4o' ? 'selected' : ''}>OpenAI GPT-4o</option>
                <option value="claude-3-5-sonnet" ${p.model === 'claude-3-5-sonnet' ? 'selected' : ''}>Claude 3.5 Sonnet</option>
                <option value="gemini-1.5-pro" ${p.model === 'gemini-1.5-pro' ? 'selected' : ''}>Gemini 1.5 Pro</option>
                <option value="llama-3.3-70b" ${p.model === 'llama-3.3-70b' ? 'selected' : ''}>Llama 3.3 70B</option>
              </select>
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 11.5px;">Version Tag</label>
              <input type="text" class="form-input" id="inp-prompt-version" value="${p.version || '1.0.0'}" placeholder="1.0.0">
            </div>
          </div>

          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 11.5px;">Description & Engineering Intent</label>
            <input type="text" class="form-input" id="inp-prompt-desc" value="${p.description || ''}" placeholder="Brief description of the prompt template purpose and requirements...">
          </div>

          <!-- Dynamic Tab Content Sections -->
          <div id="tab-content-template" class="editor-tab-pane">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label class="form-label" style="font-size: 12px; font-weight: 700; margin: 0;">
                Template Syntax (Use <code style="color: #c084fc;">{{variable_name}}</code> for dynamic injection)
              </label>
              <div id="bracket-warning" style="font-size: 11px; font-weight: 600; color: #fbbf24; display: none;">
                ⚠️ Unclosed brackets detected
              </div>
            </div>

            <div style="position: relative; background: #05070d; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">
              <textarea id="inp-prompt-template" style="width: 100%; height: 220px; background: transparent; border: none; padding: 14px; font-family: var(--font-mono); font-size: 13px; color: #e2e8f0; line-height: 1.6; resize: vertical; outline: none;">${p.template || ''}</textarea>
            </div>

            <!-- Detected Variables Bar -->
            <div style="margin-top: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Extracted Variables:</span>
                <div id="detected-variables-chips" style="display: flex; gap: 6px; flex-wrap: wrap;"></div>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);" id="char-token-counter">
                0 chars • ~0 in-tokens
              </div>
            </div>
          </div>

          <!-- Tab 2: JSON Schema Validator -->
          <div id="tab-content-schema" class="editor-tab-pane" style="display: none; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">Structured Outputs JSON Schema</div>
                <div style="font-size: 11px; color: var(--text-secondary);">Defines required response format for OpenAI Structured Outputs, Anthropic Tool calling, or Pydantic validation</div>
              </div>
              <span class="badge badge-success" id="schema-validity-badge">VALID JSON</span>
            </div>

            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="chip-btn" id="btn-schema-preset-obj" style="font-size: 11px; padding: 4px 8px;">Preset: Standard Object</button>
              <button class="chip-btn" id="btn-schema-preset-list" style="font-size: 11px; padding: 4px 8px;">Preset: Array of Items</button>
              <button class="chip-btn" id="btn-schema-preset-eval" style="font-size: 11px; padding: 4px 8px;">Preset: LLM Evaluation Matrix</button>
            </div>

            <textarea id="inp-prompt-schema" style="width: 100%; height: 200px; background: #05070d; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-family: var(--font-mono); font-size: 12px; color: #67e8f9; line-height: 1.5; resize: vertical; outline: none;">${p.schema || ''}</textarea>
            <div id="schema-error-msg" style="font-size: 11.5px; color: #f43f5e; font-family: var(--font-mono); display: none;"></div>
          </div>

          <!-- Tab 3: Test Playground -->
          <div id="tab-content-playground" class="editor-tab-pane" style="display: none; flex-direction: column; gap: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <!-- Left: Variable Inputs -->
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">Test Variable Values</div>
                <div id="playground-variable-inputs" style="display: flex; flex-direction: column; gap: 8px;"></div>
              </div>

              <!-- Right: Live Compiled Prompt Preview -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">Compiled Live Preview</div>
                  <button class="btn btn-secondary btn-sm" id="btn-copy-compiled-preview" style="font-size: 11px; padding: 3px 8px;">📋 Copy</button>
                </div>
                <div id="playground-compiled-preview" style="background: #05070d; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-family: var(--font-mono); font-size: 12px; color: #86efac; min-height: 180px; max-height: 240px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5;"></div>
              </div>
            </div>
          </div>

          <!-- Tab 4: Token Metrics & Cost -->
          <div id="tab-content-cost" class="editor-tab-pane" style="display: none; flex-direction: column; gap: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">Multi-Model Cost Matrix (Estimated per 1,000 requests)</div>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;" id="cost-matrix-cards">
              <!-- Dynamically rendered -->
            </div>
          </div>

          <!-- Tags input -->
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 11.5px;">Tags (Comma-separated)</label>
            <input type="text" class="form-input" id="inp-prompt-tags" value="${(p.tags || []).join(', ')}" placeholder="e.g. reasoning, security, classification">
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="modal-footer" style="flex-shrink: 0; justify-content: space-between;">
          <div style="font-size: 11px; color: var(--text-muted);">
            Auto-saves version history in SQLite / GitOps
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary btn-close-modal">Cancel</button>
            <button class="btn btn-primary" id="btn-save-prompt-studio" style="background: var(--cat-prompts, #8b5cf6); border: none;">
              💾 Save Prompt Template
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => backdrop.remove()));

    // Tab Switching
    backdrop.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        backdrop.querySelectorAll('.tab-btn').forEach(b => {
          const isAct = b === btn;
          b.classList.toggle('active', isAct);
          b.style.color = isAct ? 'var(--text-primary)' : 'var(--text-secondary)';
          b.style.borderBottomColor = isAct ? 'var(--cat-prompts, #8b5cf6)' : 'transparent';
        });

        backdrop.querySelectorAll('.editor-tab-pane').forEach(pane => pane.style.display = 'none');
        const targetPane = backdrop.querySelector(`#tab-content-${tab}`);
        if (targetPane) {
          targetPane.style.display = (tab === 'playground' || tab === 'schema' || tab === 'cost') ? 'flex' : 'block';
        }

        if (tab === 'playground') updatePlayground();
        if (tab === 'cost') updateCostMatrix();
      });
    });

    const templateTextarea = backdrop.querySelector('#inp-prompt-template');
    const schemaTextarea = backdrop.querySelector('#inp-prompt-schema');

    // Extract Variables regex: {{variable_name}}
    const extractVariables = (text) => {
      const matches = text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || [];
      return Array.from(new Set(matches.map(m => m.replace(/[\{\}]/g, '').trim())));
    };

    // Check for unclosed brackets {{... without }}
    const checkBracketSyntax = (text) => {
      const openCount = (text.match(/\{\{/g) || []).length;
      const closeCount = (text.match(/\}\}/g) || []).length;
      return openCount !== closeCount;
    };

    const updateVariableAnalysis = () => {
      const text = templateTextarea.value || '';
      const vars = extractVariables(text);
      const hasUnclosed = checkBracketSyntax(text);

      const warningEl = backdrop.querySelector('#bracket-warning');
      if (warningEl) warningEl.style.display = hasUnclosed ? 'block' : 'none';

      const chipsContainer = backdrop.querySelector('#detected-variables-chips');
      if (chipsContainer) {
        chipsContainer.innerHTML = vars.length === 0 
          ? '<span style="color: var(--text-muted); font-size: 11px;">None</span>'
          : vars.map(v => `<span class="badge badge-prompts" style="font-size: 10px;">{{${v}}}</span>`).join('');
      }

      const counterEl = backdrop.querySelector('#char-token-counter');
      if (counterEl) {
        const chars = text.length;
        const inTokens = Math.ceil(chars / 3.8);
        counterEl.textContent = `${chars} chars • ~${inTokens} in-tokens`;
      }
    };

    templateTextarea.addEventListener('input', updateVariableAnalysis);
    updateVariableAnalysis();

    // JSON Schema Validation
    const validateSchema = () => {
      const raw = schemaTextarea.value.trim();
      const badge = backdrop.querySelector('#schema-validity-badge');
      const errEl = backdrop.querySelector('#schema-error-msg');

      if (!raw) {
        badge.className = 'badge';
        badge.textContent = 'OPTIONAL';
        errEl.style.display = 'none';
        return true;
      }

      try {
        JSON.parse(raw);
        badge.className = 'badge badge-success';
        badge.textContent = 'VALID JSON SCHEMA';
        errEl.style.display = 'none';
        return true;
      } catch (err) {
        badge.className = 'badge badge-danger';
        badge.textContent = 'INVALID JSON';
        errEl.textContent = `Parse Error: ${err.message}`;
        errEl.style.display = 'block';
        return false;
      }
    };

    schemaTextarea.addEventListener('input', validateSchema);
    validateSchema();

    // Preset Schema buttons
    backdrop.querySelector('#btn-schema-preset-obj')?.addEventListener('click', () => {
      schemaTextarea.value = JSON.stringify({
        type: "object",
        properties: {
          summary: { type: "string", description: "Executive summary" },
          key_points: { type: "array", items: { type: "string" } },
          confidence_score: { type: "number", minimum: 0, maximum: 1 }
        },
        required: ["summary", "key_points"]
      }, null, 2);
      validateSchema();
    });

    backdrop.querySelector('#btn-schema-preset-list')?.addEventListener('click', () => {
      schemaTextarea.value = JSON.stringify({
        type: "array",
        items: {
          type: "object",
          properties: {
            item_name: { type: "string" },
            category: { type: "string" },
            priority: { type: "string", enum: ["low", "medium", "high"] }
          },
          required: ["item_name", "priority"]
        }
      }, null, 2);
      validateSchema();
    });

    backdrop.querySelector('#btn-schema-preset-eval')?.addEventListener('click', () => {
      schemaTextarea.value = JSON.stringify({
        type: "object",
        properties: {
          eval_passed: { type: "boolean" },
          jailbreak_attempt_detected: { type: "boolean" },
          relevance_score_pct: { type: "integer", minimum: 0, maximum: 100 },
          reasoning_steps: { type: "array", items: { type: "string" } }
        },
        required: ["eval_passed", "jailbreak_attempt_detected", "relevance_score_pct"]
      }, null, 2);
      validateSchema();
    });

    // Playground Variable substitution
    const testVarValues = {};
    const updatePlayground = () => {
      const text = templateTextarea.value || '';
      const vars = extractVariables(text);
      const container = backdrop.querySelector('#playground-variable-inputs');
      
      container.innerHTML = vars.length === 0
        ? '<div style="color: var(--text-muted); font-size: 12px;">No variables detected in template.</div>'
        : vars.map(v => {
          if (testVarValues[v] === undefined) testVarValues[v] = `Sample ${v} value`;
          return `
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 11px; color: #c084fc;">{{${v}}}</label>
              <input type="text" class="form-input test-var-inp" data-var="${v}" value="${testVarValues[v]}" style="padding: 6px 10px; font-size: 12px;">
            </div>
          `;
        }).join('');

      container.querySelectorAll('.test-var-inp').forEach(inp => {
        inp.addEventListener('input', () => {
          const v = inp.getAttribute('data-var');
          testVarValues[v] = inp.value;
          renderCompiledPreview();
        });
      });

      renderCompiledPreview();
    };

    const renderCompiledPreview = () => {
      let compiled = templateTextarea.value || '';
      for (const [k, val] of Object.entries(testVarValues)) {
        compiled = compiled.replaceAll(`{{${k}}}`, val);
      }
      backdrop.querySelector('#playground-compiled-preview').textContent = compiled;
    };

    backdrop.querySelector('#btn-copy-compiled-preview')?.addEventListener('click', () => {
      const txt = backdrop.querySelector('#playground-compiled-preview').textContent;
      navigator.clipboard.writeText(txt);
      Toast.success('Compiled prompt copied to clipboard');
    });

    // Cost Estimator Matrix
    const updateCostMatrix = () => {
      const text = templateTextarea.value || '';
      const inTokens = Math.ceil(text.length / 3.8);
      const outTokens = 600; // estimated output
      const requests = 1000;

      const models = [
        { name: 'OpenAI GPT-4o', inPerM: 2.50, outPerM: 10.00, color: '#10a37f' },
        { name: 'Claude 3.5 Sonnet', inPerM: 3.00, outPerM: 15.00, color: '#d97706' },
        { name: 'Gemini 1.5 Pro', inPerM: 1.25, outPerM: 5.00, color: '#3b82f6' },
        { name: 'Llama 3.3 70B', inPerM: 0.59, outPerM: 0.79, color: '#8b5cf6' }
      ];

      const cardsContainer = backdrop.querySelector('#cost-matrix-cards');
      cardsContainer.innerHTML = models.map(m => {
        const totalInCost = (inTokens * requests / 1_000_000) * m.inPerM;
        const totalOutCost = (outTokens * requests / 1_000_000) * m.outPerM;
        const totalCost = (totalInCost + totalOutCost).toFixed(3);

        return `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-top: 3px solid ${m.color}; border-radius: var(--radius-md); padding: 12px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">${m.name}</div>
            <div style="font-size: 18px; font-weight: 800; font-family: var(--font-mono); color: #34d399; margin-bottom: 4px;">
              $${totalCost}
            </div>
            <div style="font-size: 10px; color: var(--text-muted); line-height: 1.4;">
              In: $${m.inPerM}/1M • Out: $${m.outPerM}/1M
            </div>
            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
              1k calls (~${inTokens} in / ${outTokens} out)
            </div>
          </div>
        `;
      }).join('');
    };

    // Save Prompt
    backdrop.querySelector('#btn-save-prompt-studio')?.addEventListener('click', async () => {
      const title = backdrop.querySelector('#inp-prompt-title').value.trim();
      const model = backdrop.querySelector('#inp-prompt-model').value;
      const version = backdrop.querySelector('#inp-prompt-version').value.trim() || '1.0.0';
      const description = backdrop.querySelector('#inp-prompt-desc').value.trim();
      const template = templateTextarea.value.trim();
      const schemaRaw = schemaTextarea.value.trim();
      const tagsRaw = backdrop.querySelector('#inp-prompt-tags').value;
      const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

      if (!title) {
        Toast.error('Please provide a Prompt Title');
        return;
      }
      if (!template) {
        Toast.error('Please provide template text');
        return;
      }
      if (schemaRaw && !validateSchema()) {
        Toast.error('Please fix JSON Schema syntax errors before saving');
        return;
      }

      const payload = {
        title,
        model,
        version,
        description,
        template,
        variables: extractVariables(template),
        schema: schemaRaw,
        tags,
        in_tokens_est: Math.ceil(template.length / 3.8),
        out_tokens_est: 800
      };

      try {
        if (isEdit && p.id) {
          await api.updatePrompt(p.id, payload);
          Toast.success(`Prompt "${title}" updated to v${version}`);
        } else {
          await api.createPrompt(payload);
          Toast.success(`New prompt template "${title}" registered!`);
        }
        backdrop.remove();
        if (onSaved) onSaved();
      } catch (err) {
        Toast.error(`Failed to save prompt: ${err.message}`);
      }
    });
  }
}
