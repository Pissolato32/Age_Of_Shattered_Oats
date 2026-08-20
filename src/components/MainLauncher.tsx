import React, { useState, useEffect } from "react";
import { Shield, Sparkles, BookOpen, Download, UserPlus, Hammer, Skull, Play, Trash2 } from "lucide-react";
import { CampaignState } from "../types";
import { PREGEN_CHARACTERS } from "../data";
import { createInitialState, importStateFromText } from "../engine";

interface MainLauncherProps {
  onStartCampaign: (state: CampaignState, isTutorial: boolean) => void;
  onEnterCharacterCreation: () => void;
}

export function MainLauncher({ onStartCampaign, onEnterCharacterCreation }: MainLauncherProps) {
  const [saveText, setSaveText] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedCampaign, setSavedCampaign] = useState<CampaignState | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shattered_oaths_campaign");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.character) {
          setSavedCampaign(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao ler campanha do localStorage:", e);
    }
  }, []);

  const handleLoad = () => {
    try {
      setLoadError(null);
      const loadedState = importStateFromText(saveText);
      // Auto-save this loaded state so we can resume it next time
      localStorage.setItem("shattered_oaths_campaign", JSON.stringify(loadedState));
      onStartCampaign(loadedState, false);
    } catch (e: any) {
      setLoadError(e.message || "Erro desconhecido ao carregar campanha.");
    }
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearSaved = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem("shattered_oaths_campaign");
    setSavedCampaign(null);
    setConfirmClear(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-8 text-[#D1D1D1] px-4 font-mono select-none">
      
      {/* Title Hero */}
      <div className="text-center max-w-2xl mb-8 animate-fade-in border border-[#2D2D30] bg-[#151518] p-6 rounded relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F2A900] to-transparent"></div>
        <div className="inline-flex items-center gap-2 px-3 py-0.5 border border-[#F2A900]/30 bg-[#F2A900]/5 text-[#F2A900] text-[10px] font-bold mb-3 tracking-widest uppercase">
          <Shield className="w-3 h-3 text-[#F2A900]" />
          NÚCLEO DE SIMULAÇÃO DETERMINÍSTICA // v4.7
        </div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight text-white mb-2 uppercase">
          Age of Shattered Oaths
        </h1>
        <p className="text-[#888] text-xs leading-relaxed max-w-xl mx-auto italic">
          "Quando uma trombeta soa, as lâminas se erguem. Os juramentos são testados. O livro de registros lembra o que os homens esquecem."
        </p>
      </div>

      {/* CONTINUAR CAMPANHA ATIVA */}
      {savedCampaign && (
        <div className="w-full max-w-4xl mb-6 p-4 border border-amber-500/40 bg-amber-950/10 rounded animate-fade-in flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <span className="text-[9px] text-amber-500 font-bold block uppercase tracking-wider">// CONTINUAR REGISTRO ATIVO</span>
            <h2 className="text-base font-bold text-white font-sans uppercase">
              {savedCampaign.character.name} <span className="text-zinc-500 text-xs font-mono">da Casa {savedCampaign.character.house}</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              {savedCampaign.character.title || savedCampaign.character.archetype} • {savedCampaign.character.location.landmark} ({savedCampaign.character.location.region})
            </p>
            <div className="flex gap-4 text-[9px] font-mono text-zinc-500 pt-1">
              <div>Calendário: <span className="text-amber-400 font-bold">{savedCampaign.weeklyLedger.month} {savedCampaign.weeklyLedger.year}</span></div>
              <div>Tesouro: <span className="text-amber-500 font-bold">{savedCampaign.weeklyLedger.silverdew} SD</span></div>
              <div>Exército: <span className="text-emerald-500 font-bold">{savedCampaign.army.units.reduce((acc, u) => acc + u.size, 0)} homens</span></div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            {!confirmClear ? (
              <>
                <button
                  onClick={() => onStartCampaign(savedCampaign, false)}
                  className="flex-1 md:flex-initial py-2 px-6 bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase text-xs flex items-center justify-center gap-2 transition rounded"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Retomar Campanha
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmClear(true);
                  }}
                  className="py-2 px-3 border border-red-950/60 hover:border-red-900 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 transition rounded"
                  title="Apagar Progresso Local"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-red-950/20 border border-red-900/40 p-1.5 rounded animate-pulse">
                <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">// CONFIRMA APAGAR?</span>
                <button
                  onClick={handleClearSaved}
                  className="py-1 px-2.5 bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-[9px] transition rounded"
                >
                  Sim
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmClear(false);
                  }}
                  className="py-1 px-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-300 text-[9px] transition rounded"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-8">
        
        {/* [1] TUTORIAL */}
        <button
          onClick={() => onStartCampaign(PREGEN_CHARACTERS[0], true)}
          className="flex items-start gap-4 p-4 border border-[#2D2D30] bg-[#0F0F12] hover:bg-[#151518] hover:border-[#F2A900]/60 transition text-left group"
        >
          <div className="p-2.5 bg-[#151518] border border-[#2D2D30] group-hover:border-[#F2A900]/30 shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-500 font-bold block mb-1 tracking-wider">[1] INICIAR TUTORIAL</span>
            <h3 className="text-sm font-bold text-white mb-1 uppercase font-sans">Caminho do Lorde Fronteiriço</h3>
            <p className="text-[#888] text-[11px] leading-relaxed">
              Introdução guiada ao mundo, ledgers e cerco em "As Três Fronteiras" com o Lorde Alric de Grey Keep. Recomendado para novos jogadores.
            </p>
          </div>
        </button>

        {/* [2] QUICK START */}
        <button
          onClick={() => onStartCampaign(PREGEN_CHARACTERS[1], false)}
          className="flex items-start gap-4 p-4 border border-[#2D2D30] bg-[#0F0F12] hover:bg-[#151518] hover:border-[#F2A900]/60 transition text-left group"
        >
          <div className="p-2.5 bg-[#151518] border border-[#2D2D30] group-hover:border-[#F2A900]/30 shrink-0">
            <Sparkles className="w-5 h-5 text-[#F2A900]" />
          </div>
          <div>
            <span className="text-[10px] text-[#F2A900] font-bold block mb-1 tracking-wider">[2] PARTIDA RÁPIDA</span>
            <h3 className="text-sm font-bold text-white mb-1 uppercase font-sans">Sera Vance: Companhia Livre</h3>
            <p className="text-[#888] text-[11px] leading-relaxed">
              Salte direto para a ação controlando uma mercenária sem terras. Lute por prata, faça contratos e gerencie seu bando em River Forests.
            </p>
          </div>
        </button>

        {/* [3] ARTIFICER START */}
        <button
          onClick={() => onStartCampaign(PREGEN_CHARACTERS[2], false)}
          className="flex items-start gap-4 p-4 border border-[#2D2D30] bg-[#0F0F12] hover:bg-[#151518] hover:border-[#F2A900]/60 transition text-left group"
        >
          <div className="p-2.5 bg-[#151518] border border-[#2D2D30] group-hover:border-[#F2A900]/30 shrink-0">
            <Hammer className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-amber-500 font-bold block mb-1 tracking-wider">[3] FORJA E METAL</span>
            <h3 className="text-sm font-bold text-white mb-1 uppercase font-sans">Mestre Valerius: Artífice das Montanhas</h3>
            <p className="text-[#888] text-[11px] leading-relaxed">
              Inicie com abundância de minérios e madeira nas Montanhas do Sul. Use as forjas de Ironridge para projetar e fabricar ligas superiores.
            </p>
          </div>
        </button>

        {/* [4] NECROMANCER START */}
        <button
          onClick={() => onStartCampaign(PREGEN_CHARACTERS[3], false)}
          className="flex items-start gap-4 p-4 border border-[#2D2D30] bg-[#0F0F12] hover:bg-[#151518] hover:border-[#F2A900]/60 transition text-left group"
        >
          <div className="p-2.5 bg-[#151518] border border-[#2D2D30] group-hover:border-[#F2A900]/30 shrink-0">
            <Skull className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] text-purple-400 font-bold block mb-1 tracking-wider">[4] TRADIÇÃO PROIBIDA</span>
            <h3 className="text-sm font-bold text-white mb-1 uppercase font-sans">Cadogan, o Corrupto: Lorde Necromante</h3>
            <p className="text-[#888] text-[11px] leading-relaxed">
              Controle um renegado no deserto de gelo. Comece com 45 Essências de Alma e erga mortos-vivos silenciosos que não pedem pão nem prata.
            </p>
          </div>
        </button>

        {/* [5] CHARACTER CREATION */}
        <button
          onClick={onEnterCharacterCreation}
          className="flex items-start gap-4 p-4 border border-[#2D2D30] bg-[#0F0F12] hover:bg-[#151518] hover:border-[#F2A900]/60 transition text-left group"
        >
          <div className="p-2.5 bg-[#151518] border border-[#2D2D30] group-hover:border-[#F2A900]/30 shrink-0">
            <UserPlus className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 font-bold block mb-1 tracking-wider">[5] CRIAÇÃO COMPLETA</span>
            <h3 className="text-sm font-bold text-white mb-1 uppercase font-sans">Moldar Seu Próprio Destino</h3>
            <p className="text-[#888] text-[11px] leading-relaxed">
              Crie seu lorde, cavaleiro, mestre ferreiro ou necromante de raiz. Escolha sua região, sementes de tradição e heráldica de sua casa.
            </p>
          </div>
        </button>

        {/* [6] LOAD CAMPAIGN */}
        <div className="flex flex-col p-4 border border-[#2D2D30] bg-[#0F0F12] text-left">
          <div className="flex items-start gap-4 mb-2">
            <div className="p-2.5 bg-[#151518] border border-[#2D2D30] shrink-0">
              <Download className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] text-amber-500 font-bold block mb-1 tracking-wider">[6] CARREGAR CAMPANHA</span>
              <h3 className="text-sm font-bold text-white mb-1 uppercase font-sans">Restaurar Savegame</h3>
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              placeholder="Cole aqui o seu bloco de save gerado anteriormente..."
              value={saveText}
              onChange={(e) => setSaveText(e.target.value)}
              className="w-full h-14 bg-[#050506] border border-[#2D2D30] p-2 text-[11px] font-mono text-[#D1D1D1] focus:outline-none focus:border-[#F2A900] resize-none"
            />
            <button
              onClick={handleLoad}
              disabled={!saveText.trim()}
              className="py-1.5 px-3 bg-[#2D2D30] hover:bg-[#3D3D42] disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-mono text-xs font-bold transition text-center uppercase tracking-wider"
            >
              Confirmar Carregamento
            </button>
            {loadError && (
              <span className="text-[10px] text-red-500 font-mono mt-1">{loadError}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Footnotes */}
      <div className="text-center text-[#666] font-mono text-[10px] mt-4 flex flex-wrap gap-4 justify-center">
        <span>DESIGN BRUTALISTA DE INTEGRIDADE DE LEDGER</span>
        <span>•</span>
        <span>SISTEMA DE SIMULAÇÃO 100% DETERMINÍSTICO</span>
        <span>•</span>
        <span>ESCUDO DE NARRADOR DE IA ATIVO</span>
      </div>
    </div>
  );
}
