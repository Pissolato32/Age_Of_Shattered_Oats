import React, { useState, useEffect } from "react";
import { CampaignState } from "./types";
import { MainLauncher } from "./components/MainLauncher";
import { CharacterCreator } from "./components/CharacterCreator";
import { ActivePlay } from "./components/ActivePlay";
import { ApiKeyModal } from "./components/ApiKeyModal";

export default function App() {
  const [view, setView] = useState<'launcher' | 'creation' | 'play'>('launcher');
  const [activeState, setActiveState] = useState<CampaignState | null>(null);
  const [isTutorial, setIsTutorial] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ aiActive: boolean; statusText: string }>({
    aiActive: false,
    statusText: "AI NARRATOR: PROCEDURAL (OFFLINE)"
  });

  const checkAiStatus = () => {
    const clientKey = localStorage.getItem("aos_gemini_api_key") || "";
    fetch("/api/config/status", {
      headers: { "x-gemini-api-key": clientKey }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.statusText) {
          setAiStatus({
            aiActive: Boolean(data.aiActive),
            statusText: data.statusText
          });
        }
      })
      .catch(err => console.error("Erro ao verificar status da IA:", err));
  };

  useEffect(() => {
    checkAiStatus();
  }, []);

  const handleStartCampaign = (state: CampaignState, isTut: boolean) => {
    setActiveState(state);
    setIsTutorial(isTut);
    setView('play');
  };

  const handleFinishCreation = (state: CampaignState) => {
    setActiveState(state);
    setIsTutorial(false);
    setView('play');
  };

  if (view === 'play' && activeState) {
    return (
      <ActivePlay 
        initialState={activeState} 
        isTutorial={isTutorial} 
        onExit={() => {
          setActiveState(null);
          setView('launcher');
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0b0b0c] text-[#e4e4e7] font-sans overflow-hidden select-none">
      
      {/* Header Bar */}
      <header className="grid grid-cols-[200px_1fr_200px] md:grid-cols-[300px_1fr_300px] px-6 py-4 border-b-2 border-[#e4e4e7] bg-[#0b0b0c] items-center shrink-0">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#f2a900]">
            System 4.7 // Operational
          </div>
        </div>
        <h1 className="font-syne text-[14px] md:text-xl font-extrabold tracking-tight uppercase text-center text-[#e4e4e7] flex items-center justify-center gap-1.5 md:gap-2">
          Age of Shattered Oaths <span className="text-[#e4e4e7]/30 font-light">/</span> <span className="text-[#f2a900]">Simulation Engine</span>
        </h1>
        <div className="flex gap-4 md:gap-8 justify-end font-mono text-[10px] uppercase tracking-[0.15em] text-[#e4e4e7]/50">
          <div className="hidden sm:block">ID: 8829-AXIOM</div>
          <div className="text-[#00ff41]">Registry: Active</div>
        </div>
      </header>

      {/* Main Panel View */}
      <main className="flex-1 bg-[#0b0b0c] overflow-y-auto p-4 md:p-6 flex flex-col">
        {view === 'launcher' && (
          <MainLauncher 
            onStartCampaign={handleStartCampaign} 
            onEnterCharacterCreation={() => setView('creation')} 
          />
        )}

        {view === 'creation' && (
          <CharacterCreator 
            onCancel={() => setView('launcher')} 
            onFinishCreation={handleFinishCreation} 
          />
        )}
      </main>

      {/* Footer Bar */}
      <footer className="h-10 flex items-center justify-between px-6 bg-[#111113] border-t border-[#e4e4e7]/10 text-[10px] font-mono tracking-[0.15em] uppercase text-[#e4e4e7]/50 shrink-0">
        <div>
          LOCATION: /RAIZ/SYSTEM/CENTRAL
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-[#f2a900]">
            * SIMULATION STABLE *
          </div>
          <button 
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 border border-[#2d2d30] hover:border-[#F2A900]/50 bg-[#0d0d0e] hover:bg-[#18181b] rounded-sm transition cursor-pointer"
            title="Clique para configurar sua chave do Gemini"
          >
            <span className={`w-2 h-2 rounded-full ${aiStatus.aiActive ? 'bg-[#00ff41] animate-pulse' : 'bg-cyan-400'}`}></span>
            <span className={aiStatus.aiActive ? 'text-[#00ff41] font-bold' : 'text-cyan-300'}>
              {aiStatus.statusText}
            </span>
          </button>
        </div>
        <div>
          LATENCY: 14MS // STABLE
        </div>
      </footer>

      {/* Render ApiKeyModal */}
      <ApiKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)} 
        onKeyUpdated={checkAiStatus} 
      />

    </div>
  );
}
