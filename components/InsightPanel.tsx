import React from 'react';
import { FinancialInsight } from '../types';

interface InsightPanelProps {
  insights: FinancialInsight[];
}

const InsightPanel: React.FC<InsightPanelProps> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
           <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Insights da IA</h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md
              ${insight.type === 'warning' ? 'bg-orange-50 border-orange-400' : 
                insight.type === 'success' ? 'bg-green-50 border-green-400' : 
                'bg-blue-50 border-blue-400'}`}
          >
            <div className="flex justify-between items-start">
              <h4 className={`font-bold text-sm uppercase tracking-wide mb-1
                 ${insight.type === 'warning' ? 'text-orange-700' : 
                   insight.type === 'success' ? 'text-green-700' : 
                   'text-blue-700'}`}>
                {insight.title}
              </h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {insight.description}
            </p>
            {insight.actionItem && (
               <div className="bg-white/60 p-2 rounded text-xs font-semibold text-gray-600 flex items-center gap-2">
                 <span className="text-lg">💡</span> {insight.actionItem}
               </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">Gerado pelo Gemini 2.5 Flash</p>
      </div>
    </div>
  );
};

export default InsightPanel;
