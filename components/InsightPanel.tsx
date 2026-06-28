import React from 'react';
import { Lightning, Lightbulb } from '@phosphor-icons/react';
import { FinancialInsight } from '../types';

interface InsightPanelProps {
  insights: FinancialInsight[];
}

const InsightPanel: React.FC<InsightPanelProps> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <div className="bg-surface rounded-xl shadow-brand-sm p-6 border border-line">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-secondary-soft rounded-lg">
           <Lightning size={20} weight="fill" className="text-secondary" />
        </div>
        <h2 className="text-xl font-display font-bold text-ink">Insights da IA</h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-brand-md
              ${insight.type === 'warning' ? 'bg-warning-soft border-warning' :
                insight.type === 'success' ? 'bg-success-soft border-success' :
                'bg-primary-soft border-primary'}`}
          >
            <div className="flex justify-between items-start">
              <h4 className={`font-bold text-sm uppercase tracking-wide mb-1
                 ${insight.type === 'warning' ? 'text-warning' :
                   insight.type === 'success' ? 'text-success' :
                   'text-primary'}`}>
                {insight.title}
              </h4>
            </div>
            <p className="text-muted text-sm leading-relaxed mb-3">
              {insight.description}
            </p>
            {insight.actionItem && (
               <div className="bg-surface/60 p-2 rounded text-xs font-semibold text-muted flex items-center gap-2">
                 <Lightbulb size={18} weight="fill" className="text-accent shrink-0" /> {insight.actionItem}
               </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs text-subtle">Gerado pelo Gemini 2.5 Flash</p>
      </div>
    </div>
  );
};

export default InsightPanel;
