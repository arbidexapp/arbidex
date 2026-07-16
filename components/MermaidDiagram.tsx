'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

let idCounter = 0;

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const id = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#fff7ed',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#f97316',
            lineColor: '#f97316',
            secondaryColor: '#fef3c7',
            tertiaryColor: '#fff',
            background: '#ffffff',
            mainBkg: '#fff7ed',
            nodeBorder: '#f97316',
            clusterBkg: '#fef9f0',
            titleColor: '#1f2937',
            edgeLabelBackground: '#fff7ed',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          },
          flowchart: { curve: 'basis', padding: 20 },
          sequence: { actorMargin: 50, messageMargin: 40 },
        });
        const { svg: rendered } = await mermaid.render(id.current, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        console.error('Mermaid render error:', e);
        if (!cancelled) setError(true);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) return null;
  if (!svg) {
    return (
      <div className="flex items-center justify-center py-8 bg-orange-50 rounded-2xl border border-orange-100 my-6">
        <div className="h-5 w-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="overflow-x-auto my-6 bg-white rounded-2xl border border-orange-100 p-4 shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
