import React, { useState } from "react";
import { Search, BookOpen, ShieldAlert, CheckCircle2, Globe, X, FileText } from "lucide-react";

interface StructuredCodexNode {
  id: string;
  type: 'RULE' | 'TABLE' | 'DIRECTIVE' | 'SECTION';
  book: string;
  part: string;
  section: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  authority: string;
  version: string;
  keywords: string[];
  content: string;
  mechanical: boolean;
}

interface CodexSearchResult {
  node: StructuredCodexNode;
  score: number;
  matchedTerms: string[];
  exactRuleMatch?: boolean;
}

interface EvidenceItem {
  nodeId: string;
  book: string;
  part: string;
  section: string;
  pageStart: number;
  pageEnd: number;
  title: string;
  score: number;
  authority: 'CANON';
  type: 'RULE' | 'TABLE' | 'DIRECTIVE' | 'SECTION';
}

interface RuleResolverResult {
  decision: 'ALLOWED' | 'DENIED' | 'NOT_FOUND';
  authority: 'CODEX' | 'NOT_FOUND';
  ruleMatch?: {
    id: string;
    title: string;
    section: string;
    book: string;
  };
  evidence: EvidenceItem[];
  mechanicalAllowed: boolean;
  decisionReason: string;
  webFlavorAllowed: boolean;
}

interface CodexSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CodexSearchModal({ isOpen, onClose }: CodexSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'validate'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionQuery, setActionQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CodexSearchResult[]>([]);
  const [resolverResult, setResolverResult] = useState<RuleResolverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/codex/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 6 })
      });
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      } else {
        setError('Nenhum resultado retornado.');
      }
    } catch (err: any) {
      console.error('Erro na busca do Codex:', err);
      setError('Falha ao conectar com o servidor RAG do Codex.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/query-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAction: actionQuery })
      });
      const data: RuleResolverResult = await res.json();
      setResolverResult(data);
    } catch (err: any) {
      console.error('Erro ao validar ação:', err);
      setError('Falha ao conectar com o Rule Resolver.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#e4e4e7]/20 rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#e4e4e7]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e4e7]/10 bg-[#0b0b0c]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#f2a900]" />
            <div>
              <h2 className="font-syne text-lg font-bold text-[#e4e4e7] tracking-wide">
                Codex Lexical RAG & Rule Resolver <span className="text-xs font-mono text-[#f2a900] ml-2">V4.7 CANON (529 PÁGS)</span>
              </h2>
              <p className="text-xs text-[#e4e4e7]/50 font-mono">
                Consulta Estruturada Canon de 743 Nós e Validador Determinístico de Regras
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[#e4e4e7]/10 rounded text-[#e4e4e7]/60 hover:text-[#e4e4e7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#e4e4e7]/10 bg-[#17171a] px-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'search'
                ? 'border-[#f2a900] text-[#f2a900] font-bold'
                : 'border-transparent text-[#e4e4e7]/50 hover:text-[#e4e4e7]'
            }`}
          >
            <Search className="w-4 h-4" />
            Pesquisa Estruturada no Codex
          </button>
          <button
            onClick={() => setActiveTab('validate')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'validate'
                ? 'border-[#f2a900] text-[#f2a900] font-bold'
                : 'border-transparent text-[#e4e4e7]/50 hover:text-[#e4e4e7]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Rule Resolver Determinístico
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Digite uma regra ou termo (ex: Part 40, recrutamento infantaria, fortificação, ração)..."
                    className="w-full bg-[#0b0b0c] border border-[#e4e4e7]/20 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-[#f2a900] text-[#e4e4e7] placeholder-[#e4e4e7]/30 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#f2a900] hover:bg-[#d99700] text-[#0b0b0c] font-bold font-mono text-xs px-5 py-2.5 rounded transition-colors disabled:opacity-50 uppercase tracking-wider"
                >
                  {isLoading ? 'Consultando...' : 'Buscar Codex'}
                </button>
              </form>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-xs text-red-400 font-mono">
                  {error}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-[#e4e4e7]/50 uppercase tracking-wider">
                    {searchResults.length} Resultados Estruturados do Codex Canon:
                  </div>
                  {searchResults.map((res, idx) => (
                    <div 
                      key={res.node.id || idx}
                      className="bg-[#17171a] border border-[#e4e4e7]/10 rounded-lg p-4 space-y-2 hover:border-[#f2a900]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-[#e4e4e7]/10 pb-2">
                        <span className="text-xs font-mono text-[#f2a900] uppercase font-bold flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          {res.node.book} // Part {res.node.part} // Págs. {res.node.pageStart}-{res.node.pageEnd}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-[#f2a900]/10 text-[#f2a900] px-2 py-0.5 rounded border border-[#f2a900]/20 font-bold uppercase">
                            {res.node.type}
                          </span>
                          <span className="text-[10px] font-mono bg-[#0b0b0c] text-[#00ff41] px-2 py-0.5 rounded border border-[#00ff41]/20 font-bold">
                            Score: {res.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-syne font-bold text-sm text-[#e4e4e7]">
                        {res.node.title}
                      </h4>
                      <pre className="text-xs font-mono text-[#e4e4e7]/80 bg-[#0b0b0c] p-3 rounded overflow-x-auto whitespace-pre-wrap leading-relaxed border border-[#e4e4e7]/5 max-h-48">
                        {res.node.content}
                      </pre>
                      {res.matchedTerms.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] font-mono text-[#e4e4e7]/40">Termos Encontrados:</span>
                          {res.matchedTerms.map((t, ti) => (
                            <span key={ti} className="text-[10px] font-mono bg-[#f2a900]/10 text-[#f2a900] px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RULE RESOLVER */}
          {activeTab === 'validate' && (
            <div className="space-y-6">
              <form onSubmit={handleValidateAction} className="flex gap-2">
                <input
                  type="text"
                  value={actionQuery}
                  onChange={(e) => setActionQuery(e.target.value)}
                  placeholder="Descreva uma ação para o Rule Resolver (ex: 'Quero contratar 50 soldados' ou 'Fabricar espada de aço valiriano')..."
                  className="w-full bg-[#0b0b0c] border border-[#e4e4e7]/20 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-[#f2a900] text-[#e4e4e7] placeholder-[#e4e4e7]/30 font-mono"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#f2a900] hover:bg-[#d99700] text-[#0b0b0c] font-bold font-mono text-xs px-5 py-2.5 rounded transition-colors disabled:opacity-50 uppercase tracking-wider shrink-0"
                >
                  {isLoading ? 'Validando...' : 'Resolver Ação'}
                </button>
              </form>

              {resolverResult && (
                <div className="bg-[#17171a] border border-[#e4e4e7]/10 rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-[#e4e4e7]/10 pb-3">
                    {resolverResult.decision === 'ALLOWED' ? (
                      <CheckCircle2 className="w-6 h-6 text-[#00ff41]" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-[#ff3333]" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase font-bold text-[#e4e4e7]">
                          Decisão:
                        </span>
                        <span className={`font-mono text-xs uppercase px-2 py-0.5 rounded font-bold ${
                          resolverResult.decision === 'ALLOWED'
                            ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30'
                            : 'bg-red-950/40 text-red-400 border border-red-500/30'
                        }`}>
                          {resolverResult.decision}
                        </span>
                        <span className="font-mono text-xs uppercase text-[#e4e4e7]/40 ml-2">
                          Autoridade: <strong>{resolverResult.authority}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-[#e4e4e7]/80 font-mono mt-1">
                        {resolverResult.decisionReason}
                      </p>
                    </div>
                  </div>

                  {!resolverResult.mechanicalAllowed && (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded text-xs font-mono text-amber-300 flex items-start gap-2">
                      <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Regra de Ouro (Mundo Fechado):</strong> Ação mecânica desautorizada por ausência de regra no Codex Canon. Apenas contextualização narrativa de flavor é permitida.
                      </div>
                    </div>
                  )}

                  {resolverResult.evidence && resolverResult.evidence.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-mono text-[#e4e4e7]/50 uppercase font-bold flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#f2a900]" /> Evidências do Codex Utilizadas:
                      </div>
                      {resolverResult.evidence.map((ev, idx) => (
                        <div key={idx} className="bg-[#0b0b0c] p-3 rounded text-xs font-mono border border-[#e4e4e7]/5 flex items-center justify-between">
                          <div>
                            <span className="text-[#f2a900] font-bold">{ev.book} (Part {ev.part})</span>: {ev.title} — <span className="text-[#e4e4e7]/60">Págs {ev.pageStart}-{ev.pageEnd}</span>
                          </div>
                          <span className="text-[10px] bg-[#17171a] text-[#00ff41] px-2 py-0.5 rounded border border-[#00ff41]/20 font-bold">
                            Score: {ev.score.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
