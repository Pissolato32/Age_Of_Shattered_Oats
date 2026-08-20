import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, Check, Trash2, X, ExternalLink, Sparkles } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onKeyUpdated }: ApiKeyModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("aos_gemini_api_key");
      setSavedKey(stored);
      setApiKeyInput(stored || "");
      setSaveSuccess(false);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      localStorage.removeItem("aos_gemini_api_key");
      setSavedKey(null);
      setStatusMessage("Chave removida. Modo off-line ativado.");
    } else if (trimmed.length < 15) {
      setStatusMessage("⚠️ Chave muito curta! Verifique se copiou a chave de API inteira no Google AI Studio.");
      return;
    } else {
      localStorage.setItem("aos_gemini_api_key", trimmed);
      setSavedKey(trimmed);
      setSaveSuccess(true);
      setStatusMessage("🟢 Chave do Gemini salva com sucesso! IA ativada.");
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    onKeyUpdated();
  };

  const handleClear = () => {
    localStorage.removeItem("aos_gemini_api_key");
    setApiKeyInput("");
    setSavedKey(null);
    setStatusMessage("Chave removida localmente. Modo off-line ativado.");
    onKeyUpdated();
  };

  const maskedKey = savedKey
    ? `${savedKey.slice(0, 6)}...${savedKey.slice(-4)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-mono select-none">
      <div className="bg-[#0F0F12] border border-[#2D2D30] w-full max-w-lg p-6 shadow-2xl relative text-[#D1D1D1]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888] hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[#2D2D30] pb-4 mb-4">
          <Key className="w-5 h-5 text-[#F2A900]" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Configuração de Chave da IA Narradora
          </h3>
        </div>

        {/* Info */}
        <p className="text-xs text-[#888] leading-relaxed mb-4">
          Cole abaixo sua chave gratuita da API do Google Gemini gerada no Google AI Studio. 
          Ela será salva <strong className="text-emerald-400">exclusivamente no seu navegador local</strong>.
        </p>

        {/* Status Indicator */}
        <div className={`p-3 border mb-4 text-xs flex items-center gap-2 ${
          savedKey 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' 
            : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
        }`}>
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <div>
            <span className="font-bold block uppercase">
              {savedKey ? "Status: IA Narradora Ativa (Online)" : "Status: Modo Procedural (Off-line)"}
            </span>
            {maskedKey && <span className="text-[10px] opacity-80">Chave em uso: {maskedKey}</span>}
          </div>
        </div>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-[10px] text-[#888] uppercase mb-1.5 tracking-wider">
            Cole sua GEMINI_API_KEY (Ex: AIzaSy...)
          </label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-xs text-white focus:outline-none focus:border-[#F2A900] font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 mt-6 border-t border-[#2D2D30] pt-4">
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-[#F2A900] hover:underline flex items-center gap-1"
          >
            Obter chave grátis <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            {savedKey && (
              <button
                onClick={handleClear}
                className="px-3 py-2 border border-red-900/40 hover:border-red-600 bg-red-950/20 text-red-400 text-xs font-bold transition flex items-center gap-1 uppercase"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#F2A900] hover:bg-[#D97706] text-black text-xs font-bold transition flex items-center gap-1.5 uppercase tracking-wider rounded-sm"
            >
              <Check className="w-4 h-4" /> Salvar Chave
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div className="mt-3 text-[11px] text-emerald-400 font-bold text-center animate-fade-in">
            {statusMessage}
          </div>
        )}

      </div>
    </div>
  );
}
