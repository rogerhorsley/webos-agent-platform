import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MousePointer, Move, Type, Save, X, Undo2,
  Palette, Square, AlignLeft, Maximize2, Minimize2,
} from 'lucide-react'

interface ElementInfo {
  selector: string
  tagName: string
  text: string
  styles: Record<string, string>
  rect: { x: number; y: number; width: number; height: number }
  outerHTML: string
}

export interface EditRecord {
  selector: string
  property: string
  oldValue: string
  newValue: string
  description: string
}

const IFRAME_INJECT_SCRIPT = `
<script>
(function() {
  let selected = null;
  let overlay = null;
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragOrigPos = { x: 0, y: 0 };

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = '__ve_overlay';
    overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.08);z-index:99999;transition:all 0.1s;display:none;';
    document.body.appendChild(overlay);
  }

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    let path = [];
    while (el && el !== document.body && el !== document.documentElement) {
      let tag = el.tagName.toLowerCase();
      let idx = 1;
      let sib = el.previousElementSibling;
      while (sib) { if (sib.tagName === el.tagName) idx++; sib = sib.previousElementSibling; }
      let count = 0;
      let s = el.parentElement ? el.parentElement.children : [];
      for (let i = 0; i < s.length; i++) if (s[i].tagName === el.tagName) count++;
      path.unshift(count > 1 ? tag + ':nth-of-type(' + idx + ')' : tag);
      el = el.parentElement;
    }
    return 'body > ' + path.join(' > ');
  }

  function getComputedProps(el) {
    const cs = getComputedStyle(el);
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      padding: cs.padding,
      margin: cs.margin,
      borderRadius: cs.borderRadius,
      width: cs.width,
      height: cs.height,
      display: cs.display,
      textAlign: cs.textAlign,
      position: cs.position,
      top: cs.top,
      left: cs.left,
    };
  }

  function selectElement(el) {
    if (el === document.body || el === document.documentElement || el.id === '__ve_overlay') return;
    selected = el;
    const rect = el.getBoundingClientRect();
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
    }
    window.parent.postMessage({
      type: 've:select',
      data: {
        selector: getSelector(el),
        tagName: el.tagName.toLowerCase(),
        text: el.textContent ? el.textContent.slice(0, 200) : '',
        styles: getComputedProps(el),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        outerHTML: el.outerHTML.slice(0, 500),
      }
    }, '*');
  }

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    selectElement(e.target);
  }, true);

  document.addEventListener('mousedown', function(e) {
    if (!selected || e.target.id === '__ve_overlay') return;
    if (e.target !== selected && !selected.contains(e.target)) return;
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    const cs = getComputedStyle(selected);
    dragOrigPos = { x: parseInt(cs.left) || 0, y: parseInt(cs.top) || 0 };
    if (cs.position === 'static') {
      selected.style.position = 'relative';
      dragOrigPos = { x: 0, y: 0 };
    }
    e.preventDefault();
  }, true);

  document.addEventListener('mousemove', function(e) {
    if (!isDragging || !selected) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    selected.style.left = (dragOrigPos.x + dx) + 'px';
    selected.style.top = (dragOrigPos.y + dy) + 'px';
    const rect = selected.getBoundingClientRect();
    if (overlay) {
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
    }
  }, true);

  document.addEventListener('mouseup', function(e) {
    if (!isDragging || !selected) return;
    isDragging = false;
    const cs = getComputedStyle(selected);
    window.parent.postMessage({
      type: 've:moved',
      data: {
        selector: getSelector(selected),
        left: cs.left,
        top: cs.top,
        position: cs.position,
      }
    }, '*');
  }, true);

  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 've:setStyle' && selected) {
      selected.style[e.data.prop] = e.data.value;
      const rect = selected.getBoundingClientRect();
      if (overlay) {
        overlay.style.left = rect.left + 'px';
        overlay.style.top = rect.top + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
      }
    }
    if (e.data.type === 've:setText' && selected) {
      selected.textContent = e.data.value;
    }
    if (e.data.type === 've:getHTML') {
      if (overlay) overlay.style.display = 'none';
      const clone = document.documentElement.cloneNode(true);
      const sc = clone.querySelectorAll('script');
      sc.forEach(function(s) { if (s.textContent && s.textContent.includes('__ve_overlay')) s.remove(); });
      const ov = clone.querySelector('#__ve_overlay');
      if (ov) ov.remove();
      window.parent.postMessage({ type: 've:html', data: clone.outerHTML }, '*');
    }
  });

  createOverlay();
  document.body.style.cursor = 'default';
})();
</script>`;

function buildEditableDocument(content: string): string {
  let html = content
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1a1a1a;padding:16px;}img,video{max-width:100%;height:auto;}</style>
</head><body>${html}</body></html>`
  }
  return html.replace('</body>', IFRAME_INJECT_SCRIPT + '</body>')
}

function PropertyField({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-[10px] w-20 flex-shrink-0">{label}</span>
      {type === 'color' ? (
        <div className="flex items-center gap-1 flex-1">
          <input type="color" value={rgbToHex(value)} onChange={e => onChange(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border border-white/10" />
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="flex-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/70 font-mono focus:outline-none focus:border-white/20" />
        </div>
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/70 font-mono focus:outline-none focus:border-white/20" />
      )}
    </div>
  )
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return rgb.startsWith('#') ? rgb : '#000000'
  const r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3])
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

export function VisualEditor({ content, onSave, onClose }: {
  content: string
  onSave: (edits: EditRecord[], modifiedHtml: string) => void
  onClose: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [selected, setSelected] = useState<ElementInfo | null>(null)
  const [edits, setEdits] = useState<EditRecord[]>([])
  const [localStyles, setLocalStyles] = useState<Record<string, string>>({})
  const [localText, setLocalText] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const doc = buildEditableDocument(content)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return
      if (e.data.type === 've:select') {
        const info = e.data.data as ElementInfo
        setSelected(info)
        setLocalStyles(info.styles)
        setLocalText(info.text)
      }
      if (e.data.type === 've:moved') {
        const { selector, left, top, position } = e.data.data
        setEdits(prev => [
          ...prev,
          { selector, property: 'position', oldValue: '', newValue: `position:${position};left:${left};top:${top}`, description: `Moved element ${selector}` },
        ])
      }
      if (e.data.type === 've:html') {
        const modifiedHtml = e.data.data as string
        onSave(edits, modifiedHtml)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [edits, onSave])

  const applyStyle = useCallback((prop: string, value: string) => {
    if (!selected) return
    const oldValue = localStyles[prop] || ''
    setLocalStyles(prev => ({ ...prev, [prop]: value }))
    iframeRef.current?.contentWindow?.postMessage({ type: 've:setStyle', prop, value }, '*')
    setEdits(prev => [
      ...prev,
      { selector: selected.selector, property: prop, oldValue, newValue: value, description: `Changed ${prop} of ${selected.tagName} from "${oldValue}" to "${value}"` },
    ])
  }, [selected, localStyles])

  const applyText = useCallback((value: string) => {
    if (!selected) return
    setLocalText(value)
    iframeRef.current?.contentWindow?.postMessage({ type: 've:setText', value }, '*')
    setEdits(prev => [
      ...prev,
      { selector: selected.selector, property: 'textContent', oldValue: selected.text, newValue: value, description: `Changed text of ${selected.tagName} to "${value.slice(0, 50)}"` },
    ])
  }, [selected])

  const handleSave = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 've:getHTML' }, '*')
  }

  const handleUndo = () => {
    if (edits.length === 0) return
    setEdits(prev => prev.slice(0, -1))
  }

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-[100] flex bg-[#0e0e12]'
    : 'flex h-full'

  return (
    <div className={containerClass}>
      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 flex-shrink-0 bg-black/30">
          <MousePointer className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white/80 text-xs font-medium">Visual Editor</span>
          <span className="text-white/30 text-[10px]">Click to select · Drag to move</span>
          <div className="flex-1" />
          {edits.length > 0 && (
            <span className="text-white/30 text-[10px] mr-1">{edits.length} edits</span>
          )}
          <button onClick={handleUndo} disabled={edits.length === 0}
            className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-20" title="Undo">
            <Undo2 className="w-3.5 h-3.5 text-white/50" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-white/50" /> : <Maximize2 className="w-3.5 h-3.5 text-white/50" />}
          </button>
          <button onClick={handleSave} disabled={edits.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
            style={{ background: edits.length > 0 ? 'linear-gradient(135deg,#34D399,#22D3EE)' : 'rgba(255,255,255,0.05)', color: 'white' }}>
            <Save className="w-3 h-3" /> Save & Send to Agent
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* iframe */}
        <div className="flex-1 overflow-hidden p-2">
          <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-xl">
            <iframe
              ref={iframeRef}
              srcDoc={doc}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
              title="Visual Editor"
            />
          </div>
        </div>
      </div>

      {/* Property panel */}
      <div className="w-56 flex-shrink-0 border-l border-white/10 flex flex-col bg-black/20 overflow-auto">
        <div className="px-3 py-2 border-b border-white/10">
          <span className="text-white/60 text-xs font-medium">Properties</span>
        </div>

        {selected ? (
          <div className="p-3 space-y-4 text-xs">
            {/* Element info */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Square className="w-3 h-3 text-blue-400" />
                <span className="text-white/70 font-medium">&lt;{selected.tagName}&gt;</span>
              </div>
              <p className="text-white/30 text-[10px] font-mono truncate">{selected.selector}</p>
            </div>

            {/* Text */}
            {selected.text && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Type className="w-3 h-3 text-green-400" />
                  <span className="text-white/50 text-[10px]">Text</span>
                </div>
                <textarea value={localText} onChange={e => applyText(e.target.value)} rows={2}
                  className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/70 resize-none focus:outline-none focus:border-white/20" />
              </div>
            )}

            {/* Colors */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Palette className="w-3 h-3 text-pink-400" />
                <span className="text-white/50 text-[10px]">Colors</span>
              </div>
              <div className="space-y-1.5">
                <PropertyField label="Color" value={localStyles.color || ''} onChange={v => applyStyle('color', v)} type="color" />
                <PropertyField label="Background" value={localStyles.backgroundColor || ''} onChange={v => applyStyle('backgroundColor', v)} type="color" />
              </div>
            </div>

            {/* Typography */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlignLeft className="w-3 h-3 text-purple-400" />
                <span className="text-white/50 text-[10px]">Typography</span>
              </div>
              <div className="space-y-1.5">
                <PropertyField label="Font Size" value={localStyles.fontSize || ''} onChange={v => applyStyle('fontSize', v)} />
                <PropertyField label="Font Weight" value={localStyles.fontWeight || ''} onChange={v => applyStyle('fontWeight', v)} />
                <PropertyField label="Text Align" value={localStyles.textAlign || ''} onChange={v => applyStyle('textAlign', v)} />
              </div>
            </div>

            {/* Spacing */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Move className="w-3 h-3 text-yellow-400" />
                <span className="text-white/50 text-[10px]">Spacing & Size</span>
              </div>
              <div className="space-y-1.5">
                <PropertyField label="Padding" value={localStyles.padding || ''} onChange={v => applyStyle('padding', v)} />
                <PropertyField label="Margin" value={localStyles.margin || ''} onChange={v => applyStyle('margin', v)} />
                <PropertyField label="Width" value={localStyles.width || ''} onChange={v => applyStyle('width', v)} />
                <PropertyField label="Height" value={localStyles.height || ''} onChange={v => applyStyle('height', v)} />
                <PropertyField label="Radius" value={localStyles.borderRadius || ''} onChange={v => applyStyle('borderRadius', v)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-4">
            <MousePointer className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-[11px] text-center">Click an element<br />in the preview to edit</p>
          </div>
        )}

        {/* Edit history */}
        {edits.length > 0 && (
          <div className="border-t border-white/10 p-2 flex-shrink-0">
            <p className="text-white/30 text-[10px] mb-1">Recent edits ({edits.length})</p>
            <div className="max-h-24 overflow-auto space-y-0.5">
              {edits.slice(-5).reverse().map((edit, i) => (
                <div key={i} className="text-[9px] text-white/25 truncate">{edit.description}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function generateEditPrompt(edits: EditRecord[], _originalHtml: string, _modifiedHtml: string): string {
  const deduped = new Map<string, EditRecord>()
  for (const edit of edits) {
    const key = `${edit.selector}::${edit.property}`
    deduped.set(key, edit)
  }

  const changes = Array.from(deduped.values())
  if (changes.length === 0) return ''

  let prompt = `Please update the HTML code with the following visual edits (incremental changes only, do NOT rewrite the entire code):\n\n`

  for (const change of changes) {
    if (change.property === 'textContent') {
      prompt += `- Change the text content of \`${change.selector}\` to: "${change.newValue}"\n`
    } else if (change.property === 'position') {
      prompt += `- Move \`${change.selector}\`: set ${change.newValue}\n`
    } else {
      prompt += `- Change \`${change.property}\` of \`${change.selector}\` from "${change.oldValue}" to "${change.newValue}"\n`
    }
  }

  prompt += `\nIMPORTANT: Only modify the specific elements and properties listed above. Keep everything else unchanged. Return the updated HTML in a \`\`\`html code block.`

  return prompt
}
