import React, { useState } from 'react';
import { searchTrends } from '../services/geminiService';
import { Globe, Loader2, Search } from 'lucide-react';

const TrendTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{text: string; grounding?: any[]} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await searchTrends(query);
      setResult({
        text: data.text || "未找到趋势。",
        grounding: data.grounding
      });
    } catch (error) {
      setResult({ text: "获取趋势时出错，请重试。", grounding: [] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-pastel-card p-8 rounded-xl border border-pastel-border shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2 text-pastel-text">
          <Globe className="w-6 h-6 text-pastel-highlight" />
          趋势洞察
        </h2>
        <p className="text-pastel-muted mb-6">搜索最新的视觉趋势以指导您的策略。</p>
        
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如：2025年户外装备视觉趋势"
            className="w-full bg-pastel-input border border-pastel-border rounded-full py-3 pl-5 pr-12 text-pastel-text focus:border-pastel-pink focus:ring-1 focus:ring-pastel-pink outline-none transition-all placeholder-pastel-muted shadow-sm"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-pastel-pink hover:bg-pastel-pinkhover rounded-full text-pastel-text transition-colors disabled:bg-gray-100"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm animate-fade-in">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-pastel-text leading-relaxed">
              {result.text}
            </div>
          </div>
          
          {result.grounding && result.grounding.length > 0 && (
            <div className="mt-6 pt-4 border-t border-pastel-border">
              <h4 className="text-sm font-semibold text-pastel-muted uppercase tracking-wider mb-3">来源</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.grounding.map((chunk, idx) => {
                  if (chunk.web?.uri) {
                    return (
                      <a 
                        key={idx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-pastel-bg rounded-lg hover:bg-white transition-colors border border-pastel-border hover:border-pastel-highlight group"
                      >
                        <div className="bg-white p-1 rounded group-hover:bg-pastel-bg transition-colors shadow-sm">
                            <Globe className="w-3 h-3 text-pastel-muted group-hover:text-pastel-highlight" />
                        </div>
                        <span className="text-sm text-pastel-highlight truncate">{chunk.web.title || chunk.web.uri}</span>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendTab;