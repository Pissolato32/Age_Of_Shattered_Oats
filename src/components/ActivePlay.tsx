import React, { useState, useEffect, useRef } from "react";
import { CampaignState, ArmyUnit, NobleHouse } from "../types";
import { resolveWeeklyTurn, exportStateToText, simulateCombatRound, adjustHouseOpinion, setHouseOpinion, resolveNpcCombatAction, getVisibleWorldSecrets, calculateMaterialPrice, resolveDynasticSuccession } from "../engine";
import { Shield, Sparkles, BookOpen, Clock, Compass, Coins, Users, Hammer, Flame, Copy, Save, FileText, ChevronRight } from "lucide-react";
import { LedgerViewer } from "./LedgerViewer";
import { CodexSearchModal } from "./CodexSearchModal";
import { ApiKeyModal } from "./ApiKeyModal";
import { executeGameplayPipeline } from "../lib/gameplayPipeline";
import { globalRNG } from "../core/RandomService";

interface ActivePlayProps {
  initialState: CampaignState;
  isTutorial: boolean;
  onExit: () => void;
}

// Helper to generate a tailored, immersive Iron Chronicle prologue based on character & custom lore
function buildCanonicalPrologue(st: CampaignState, isTut: boolean): string {
  const { character, weeklyLedger } = st;
  const houseName = character.house ? `Casa ${character.house}` : "Vossa Casa";
  const mottoText = character.banner?.motto ? ` sob o lema "${character.banner.motto}"` : "";
  const symbolText = character.banner?.symbol ? `o estandarte do ${character.banner.symbol}` : "vosso estandarte";
  const colorsText = character.banner?.colors ? `em ${character.banner.colors}` : "";
  const locLandmark = character.location.landmark || "a fortaleza";
  const locRegion = character.location.region || "as terras centrais";
  const weatherText = weeklyLedger.weather ? `O clima apresenta-se em ${weeklyLedger.weather.toLowerCase()}` : "O vento sopra gélido";
  const backstoryText = character.backstory ? `\n\n"${character.backstory}"` : "";
  const descText = character.flavorDetail ? `\n\nTraços conhecidos: ${character.flavorDetail}` : "";

  if (isTut) {
    return `[MESTRE] Você assumiu o comando de ${locLandmark} na região ${locRegion}. As muralhas de pedra seca resistem ao vento constante que desce das colinas.

Mara, vossa conselheira de chancelaria, desenrola o mapa territorial sobre a mesa de carvalho:
'O assento é vosso, meu lorde. Os cofres guardam ${weeklyLedger.silverdew} moedas de prata e temos ${weeklyLedger.food.toFixed(0)} fardos de provisão nos celeiros.'

Do pátio exterior, o som de ferro batido e passos pesados anunciam a prontidão da guarda. Os batedores relatam movimentações nas fronteiras e as casas vizinhas observam em silêncio. As rédeas do domínio estão em vossas mãos.${backstoryText}

Vossos conselheiros aguardam vossas ordens. O que deseja comandar?`;
  }

  switch (character.archetype) {
    case 'Landed Knight':
      return `[MESTRE] O aço da vossa armadura range sob a geada matinal. Como ${character.title} da ${houseName}${mottoText}, vossa autoridade é reconhecida em ${locLandmark} (${locRegion}).

Erguendo ${symbolText} ${colorsText}, vossos veteranos de armas montam vigília sobre os desfiladeiros. ${weatherText}. As reservas contam com ${weeklyLedger.silverdew} moedas de prata e uma guarnição pronta para o combate.${descText}${backstoryText}

Vossos homens aguardam vossas instruções. Qual é a vossa primeira ordem?`;

    case 'Landless': {
      const leaderTitle = character.house ? `${character.title} ${character.name} (${character.house})` : `${character.title} ${character.name}`;
      return `[MESTRE] As cinzas da fogueira ainda fumegam na alvorada fria de ${locRegion}. Como ${leaderTitle}, vosso nome é forjado nas estradas e nas cinzas de batalhas passadas.

Vossa companhia livre de armas descansa as mãos sobre os cabos de espada nos arredores de ${locLandmark}. ${weatherText}. Sem terras ou muralhas senhoriais para se esconder, vossa força reside na lealdade dos vossos homens e nas ${weeklyLedger.silverdew} moedas de prata que garantem o soldo da tropa.${descText}${backstoryText}

A estrada se abre à vossa frente. Qual é a vossa próxima ordem?`;
    }

    case 'Artificer':
      return `[MESTRE] O calor das forjas ilumina as abóbadas de pedra de ${locLandmark}. Como ${character.title} da ${houseName}${mottoText}, o domínio do ferro, das obras defensivas e das armas vos pertence.

Nas bancadas de trabalho, ferramentas e lingotes de metal acumulam-se para suprir a região. ${weatherText}. Os intendentes conferem ${weeklyLedger.silverdew} moedas de prata e os estoques de materiais disponíveis.${descText}${backstoryText}

As forjas estão acesas e os artífices aguardam diretrizes. O que deseja ordenar ou produzir?`;

    case 'Necromancer':
      return `[MESTRE] O silêncio sepulcral de ${locLandmark} é quebrado apenas pelo eco de juramentos rompidos. Como ${character.title} da ${houseName}, vós dominais os segredos que os homens comuns temem pronunciar.

Sob a névoa densa de ${locRegion}, ${weatherText}. As cinzas do passado guardam poder e os mortos aguardam vosso chamado.${descText}${backstoryText}

A noite obedece à vossa vontade. O que deseja ordenar?`;

    case 'Noble Ruler':
    default:
      return `[MESTRE] Os portões de ${locLandmark} abrem-se para o vosso governo em ${locRegion}. Como ${character.title} da ${houseName}${mottoText}, o destino destas terras e de seus súditos repousa sobre vossas decisões.

Flutuando sobre as ameias, ${symbolText} ${colorsText} anuncia a presença de vosso senhorio perante os clãs e vassalos. ${weatherText}. Os livros de ferro da tesouraria registram ${weeklyLedger.silverdew} moedas de prata e ${weeklyLedger.food.toFixed(0)} fardos de provisão nos celeiros.${descText}${backstoryText}

Vosso conselho e marechais aguardam vossas primeiras instruções. O que deseja ordenar?`;
  }
}

export function ActivePlay({ initialState, isTutorial, onExit }: ActivePlayProps) {
  const [state, setState] = useState<CampaignState>(initialState);
  const [currentNarrative, setCurrentNarrative] = useState<string>("");
  const [isNarrating, setIsNarrating] = useState(false);
  const [customCommand, setCustomCommand] = useState("");
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
  
  // Auto-scroll ref for narrative feed
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.narrativeHistory, isNarrating]);

  // Ledger viewer toggle
  const [showLedgers, setShowLedgers] = useState(false);
  const [showCodexModal, setShowCodexModal] = useState(false);
  
  // Save export drawer toggle
  const [showSaveBlock, setShowSaveSaveBlock] = useState(false);
  const [saveString, setSaveString] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // General modular menu states
  const [menuMode, setMenuMode] = useState<'main' | 'travel' | 'craft' | 'recruit' | 'trade' | 'combat' | 'culture' | 'dynasty' | 'crowns' | 'siege' | 'chancellery'>('main');

  // Active mobile column for responsive views
  const [activeMobileCol, setActiveMobileCol] = useState<'left' | 'center' | 'right'>('center');

  // Combat states
  const [activeCombat, setActiveCombat] = useState<boolean>(false);
  const [combatRound, setCombatLog] = useState<string[]>([]);
  const [playerUnit, setPlayerUnit] = useState<ArmyUnit | null>(null);
  const [enemyUnit, setEnemyUnit] = useState<ArmyUnit | null>(null);

  // Siege and Surrender states
  const [siegeTargetHouse, setSiegeTargetHouse] = useState<string>("");
  const [siegeWeeks, setSiegeWeeks] = useState<number>(1);
  const [siegeDefenderFood, setSiegeDefenderFood] = useState<number>(8);
  const [siegeDefenderMorale, setSiegeDefenderMorale] = useState<number>(6);
  const [siegeReliefWeeks, setSiegeReliefWeeks] = useState<number>(5);
  const [siegeLog, setSiegeLog] = useState<string[]>([]);
  const [siegeIntelRevealed, setSiegeIntelRevealed] = useState<boolean>(false);
  const [combatEnemyScouted, setCombatEnemyScouted] = useState<boolean>(false);
  const [hasWonSpar, setHasWonSpar] = useState<boolean>(false);
  const [combatHornBlowingCooldown, setCombatHornBlowingCooldown] = useState<boolean>(false);

  // Initialize first narration
  useEffect(() => {
    const s = { ...state };
    let hasUpdated = false;
    if (!s.worldSecrets || s.worldSecrets.length === 0) {
      s.worldSecrets = [
        {
          id: "secret_1",
          title: "A Herdeira Oculta",
          description: "Sussurros nas tavernas do sul indicam que uma jovem camponesa carrega o medalhão de Gwyneth, o antigo rei.",
          revealed: false,
          infiltrationProgress: 0,
          discoveryDC: 12
        },
        {
          id: "secret_2",
          title: "O Suborno do Marechal Ren",
          description: "Dizem que o Marechal Ren de House Viremont aceitaria uma generosa propina em prata para desertar durante o próximo cerco.",
          revealed: false,
          infiltrationProgress: 0,
          discoveryDC: 14
        }
      ];
      hasUpdated = true;
    }
    if (hasUpdated) {
      setState(s);
    }

    if (initialState.narrativeHistory && initialState.narrativeHistory.length > 0) {
      setState(s => s ? { ...s, narrativeHistory: initialState.narrativeHistory } : s);
      setCurrentNarrative(initialState.narrativeHistory[initialState.narrativeHistory.length - 1]);
      return;
    }

    const prologue = buildCanonicalPrologue(initialState, isTutorial);
    setState(s => s ? { ...s, narrativeHistory: [prologue] } : s);
    setCurrentNarrative(prologue);
  }, []);

  // Auto-save state to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem("shattered_oaths_campaign", JSON.stringify(state));
    } catch (e) {
      console.error("Erro ao salvar progresso automaticamente:", e);
    }
  }, [state]);

  // Export Savegame block
  const handleExportSave = () => {
    const exported = exportStateToText(state);
    setSaveString(exported);
    setShowSaveSaveBlock(true);
    setCopySuccess(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(saveString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCustomCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim() || isNarrating) return;

    const commandText = customCommand.trim();
    setCustomCommand("");
    setIsNarrating(true);

    const playerMsg = `[JOGADOR] "${commandText}"`;
    const currentHistory = state.narrativeHistory || [];
    const historyWithPlayer = [...currentHistory, playerMsg];
    setState(s => s ? { ...s, narrativeHistory: historyWithPlayer } : s);

    try {
      const clientApiKey = localStorage.getItem("aos_gemini_api_key") || "";
      const clientOpenCodeKey = localStorage.getItem("aos_opencode_api_key") || localStorage.getItem("aos_ox_alpha_api_key") || "";
      const clientOpenRouterKey = localStorage.getItem("aos_openrouter_api_key") || "";
      const clientHuggingFaceKey = localStorage.getItem("aos_huggingface_api_key") || "";
      const clientProvider = localStorage.getItem("aos_llm_provider") || (clientOpenCodeKey ? "opencode" : "cascading");
      const response = await fetch("/api/narrative-cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": clientApiKey,
          "x-opencode-api-key": clientOpenCodeKey,
          "x-openrouter-api-key": clientOpenRouterKey,
          "x-huggingface-api-key": clientHuggingFaceKey,
          "x-provider": clientProvider
        },
        body: JSON.stringify({
          playerInput: commandText,
          state: { ...state, narrativeHistory: historyWithPlayer },
          clientApiKey,
          clientOpenCodeKey,
          clientOpenRouterKey,
          clientHuggingFaceKey,
          provider: clientProvider
        })
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.resultState) {
        const masterNarrative = data.narrative.startsWith("[MESTRE]")
          ? data.narrative
          : `[MESTRE] ${data.narrative}`;
        setCurrentNarrative(masterNarrative);
        const updatedHistory = [...(data.resultState.narrativeHistory || historyWithPlayer), masterNarrative];
        setState({
          ...data.resultState,
          narrativeHistory: updatedHistory
        });
      } else {
        throw new Error(data.error || "Resposta inválida do servidor narrativo");
      }
    } catch (err: any) {
      console.error("Erro na comunicação com /api/narrative-cycle:", err);
      const fallbackMsg = `[MESTRE] Os conselheiros de ${state.character.location.landmark} registraram a ordem sob os livros de ferro. A simulação permanece segura e o estado preservado.`;
      setCurrentNarrative(fallbackMsg);
      setState(s => s ? { ...s, narrativeHistory: [...(s.narrativeHistory || historyWithPlayer), fallbackMsg] } : s);
    } finally {
      setIsNarrating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-mono text-[#f2efeb] bg-[#111113]">
      {/* Header */}
      <header className="shrink-0 border-b-2 border-[#f2efeb] bg-[#111113] px-6 py-4 flex justify-between items-baseline gap-2">
        <div className="text-[10px] text-[#f2efeb]/50 uppercase tracking-[0.15em] font-mono">System 4.7 // Operational</div>
        <h1 className="font-syne text-lg md:text-2xl font-extrabold text-[#f2efeb] uppercase tracking-tighter leading-none">
          Age of Shattered Oaths <span className="text-[#f2efeb]/30 font-light">/</span> <span className="text-[#f2a900]">Simulation Engine</span>
        </h1>
        <div className="text-[10px] text-[#f2efeb]/50 uppercase tracking-[0.15em] font-mono hidden md:block">ID: 8829-AXIOM // Registry: Active</div>
      </header>

      {/* Mobile / Tablet Segmented Selector Bar */}
      <div className="lg:hidden shrink-0 grid grid-cols-3 border-b border-[#f2efeb]/10 bg-[#18181a] text-[10px] font-mono">
        <button 
          onClick={() => setActiveMobileCol('left')}
          className={`py-3.5 text-center uppercase tracking-wider border-r border-[#f2efeb]/10 transition duration-200 cursor-pointer ${
            activeMobileCol === 'left' ? 'text-[#f2a900] bg-[#111113] font-bold border-b-2 border-b-[#f2a900]' : 'text-[#f2efeb]/40 hover:text-[#f2efeb]'
          }`}
        >
          [01] ESTADO
        </button>
        <button 
          onClick={() => setActiveMobileCol('center')}
          className={`py-3.5 text-center uppercase tracking-wider border-r border-[#f2efeb]/10 transition duration-200 cursor-pointer ${
            activeMobileCol === 'center' ? 'text-[#f2a900] bg-[#111113] font-bold border-b-2 border-b-[#f2a900]' : 'text-[#f2efeb]/40 hover:text-[#f2efeb]'
          }`}
        >
          [02] CRÔNICA
        </button>
        <button 
          onClick={() => setActiveMobileCol('right')}
          className={`py-3.5 text-center uppercase tracking-wider transition duration-200 cursor-pointer ${
            activeMobileCol === 'right' ? 'text-[#f2a900] bg-[#111113] font-bold border-b-2 border-b-[#f2a900]' : 'text-[#f2efeb]/40 hover:text-[#f2efeb]'
          }`}
        >
          [03] TESOURO
        </button>
      </div>

      {/* Columns Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Column - World State and Chronology Info (G.W) */}
        <aside className={`col-span-12 lg:col-span-3 border-r border-[#f2efeb]/10 bg-[#18181a] flex flex-col overflow-y-auto ${activeMobileCol === 'left' ? 'flex' : 'hidden lg:flex'}`}>
        <section className="p-6 border-b border-[#e4e4e7]/10">
          <div className="mb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e4e4e7]/50">
              G.W // Global Registry
            </div>
            <h2 className="font-syne text-[15px] font-extrabold tracking-tight uppercase text-white mt-2 leading-tight">
              {state.character.name} de {state.character.house}
            </h2>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#f2a900] mt-1">
              {state.character.title} // {state.character.archetype === "Noble Ruler" ? "Governante Nobre" : state.character.archetype === "Landed Knight" ? "Cavaleiro" : state.character.archetype === "Landless" ? "Sem Terras" : state.character.archetype === "Artífice" ? "Artífice" : "Necromante"}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-px bg-[#e4e4e7]/10 border border-[#e4e4e7]/10 my-4">
            <div className="bg-[#111113] p-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#e4e4e7]/50">Idade</div>
              <div className="text-sm font-bold text-[#f2a900] mt-0.5">
                {state.character.age}Y // {(state.character.gender && state.character.gender.length > 0) ? state.character.gender[0] : 'N/A'}
              </div>
            </div>
            <div className="bg-[#111113] p-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#e4e4e7]/50">Armor</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {state.character.stats.ac !== null && state.character.stats.ac !== undefined ? `${state.character.stats.ac} AC` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-end border-b border-[#e4e4e7]/10 pb-1.5 text-xs">
              <span className="text-[#e4e4e7]/50">Data Atual</span>
              <span className="font-bold text-white">Semana {state.weeklyLedger.week}, {state.worldLedger.currentDate.month.replace("_", " ")} {state.worldLedger.currentDate.year} AC</span>
            </div>
            
            <div className="flex justify-between items-end border-b border-[#e4e4e7]/10 pb-1.5 text-xs">
              <span className="text-[#e4e4e7]/50">Estação</span>
              <span className="font-bold text-cyan-400 uppercase">
                {state.weeklyLedger.season === "Thawtide" ? "Degelo (Thawtide)" : state.weeklyLedger.season === "Sunreach" ? "Sol Alto (Sunreach)" : state.weeklyLedger.season === "Reapingfall" ? "Colheita (Reapingfall)" : "Frio Profundo (Deepfrost)"}
              </span>
            </div>

            <div className="flex justify-between items-end border-b border-[#e4e4e7]/10 pb-1.5 text-xs">
              <span className="text-[#e4e4e7]/50">Estado do Clima</span>
              <span className="font-bold text-[#f2a900] uppercase">{state.weeklyLedger.weather}</span>
            </div>

            <div className="pt-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#e4e4e7]/50 block mb-1">Evento Regional Ativo</span>
              <div className="text-[10px] font-mono text-[#f2a900] bg-[#f2a900]/5 p-2 border border-[#f2a900]/20">
                {state.worldLedger.rareEventStatus.snowBearMigration.active ? "[MIGRAÇÃO DE URSOS DA NEVE: ATIVA]" : "[STATUS: COLHEITA PACÍFICA]"}
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e4e4e7]/50 mb-3">
              G.3 // Military Command
            </div>
            <div className="space-y-1.5">
              {state.army.units.map((u) => (
                <div key={u.id} className="flex justify-between py-2 border-b border-dotted border-[#e4e4e7]/10 text-xs font-mono">
                  <span className="truncate max-w-[140px] text-white">{u.name}</span>
                  <span className="text-emerald-500 font-bold">{u.size} / {u.maxSize}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-b border-dotted border-[#e4e4e7]/10 text-xs font-mono font-bold text-[#f2a900] mt-2 pt-1.5">
                <span>Força de Campo Total</span>
                <span>{state.army.units.reduce((acc, u) => acc + u.size, 0)}</span>
              </div>
            </div>

            <div className="text-[10px] border-t border-[#e4e4e7]/10 pt-4 mt-6">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#e4e4e7]/50 block mb-1">Lema da Casa</span>
              <span className="text-[#f2a900] italic font-sans text-xs">"{state.character.banner.motto}"</span>
            </div>
          </div>
        </section>

        {/* Action Triggers Footer */}
        <div className="p-6 bg-[#111113] border-t border-[#e4e4e7]/10 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setShowCodexModal(true)}
            className="w-full py-2 border border-[#f2a900]/30 text-[10px] font-bold uppercase tracking-widest text-[#f2a900] bg-[#f2a900]/5 hover:bg-[#f2a900]/10 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#f2a900]" /> Consultar Codex RAG
          </button>
          <button
            onClick={() => setShowLedgers(true)}
            className="w-full py-2 border border-[#e4e4e7]/10 text-[10px] font-bold uppercase tracking-widest text-[#e4e4e7] bg-transparent hover:bg-[#e4e4e7]/5 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#f2a900]" /> Visualizar Ledgers
          </button>
          <button
            onClick={handleExportSave}
            className="w-full py-2 border border-[#e4e4e7]/10 text-[10px] font-bold uppercase tracking-widest text-[#e4e4e7] bg-transparent hover:bg-[#e4e4e7]/5 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#f2a900]" /> Exportar Campanha
          </button>
        </div>
      </aside>

      {/* Center Column - Narrative Novel Simulator & Option Board */}
      <main className={`col-span-12 lg:col-span-6 bg-[#111113] flex flex-col overflow-hidden border-r border-[#f2efeb]/10 ${activeMobileCol === 'center' ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Terminal Text Simulator Box */}
        <div 
          className="flex-1 flex flex-col bg-[#111113] relative overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(rgba(242, 239, 235, 0.05) 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }}
        >
          <div className="absolute top-4 right-6 font-mono text-[9px] uppercase tracking-[0.15em] text-[#e4e4e7]/30 select-none">
            SEC_NARRATIVE_LOG // FEED
          </div>
          
          {/* Historical text feed */}
          <div className="flex-1 p-8 overflow-y-auto space-y-4 min-h-[220px] select-text">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e4e4e7]/50 mb-4 select-text">
              [INITIALIZING TURN_BLOCK: WEEK_{state.weeklyLedger.week}]
            </div>
            
            {(state.narrativeHistory || []).slice(-8).map((para, idx) => {
              const isPlayer = para.startsWith("[JOGADOR]");
              return (
                <div 
                  key={idx} 
                  className={`font-mono text-xs md:text-[13px] leading-relaxed transition-all duration-300 rounded-sm select-text ${
                    isPlayer 
                      ? "border-l-2 border-cyan-400 bg-cyan-950/20 p-3 text-cyan-100 font-bold" 
                      : "border-l-2 border-[#f2a900] bg-[#f2a900]/[0.05] p-4 text-[#e4e4e7]"
                  }`}
                >
                  {para}
                </div>
              );
            })}
            
            {isNarrating && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#f2a900] animate-pulse py-1 border-l-2 border-[#f2a900] pl-4">
                <Flame className="w-4 h-4 animate-spin text-[#f2a900]" />
                &gt; SISTEMA PROCESSANDO EVENTOS DETERMINÍSTICOS...
              </div>
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-[#e4e4e7]/10 bg-[#111113]">
            <form onSubmit={handleCustomCommandSubmit} className="flex items-center border-b border-[#e4e4e7] pb-2">
              <span className="text-[#f2a900] mr-3 font-mono font-bold text-lg select-none">&gt;</span>
              <input
                type="text"
                placeholder="Insira ordens ou ações livres..."
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                disabled={isNarrating}
                className="flex-1 bg-transparent border-none text-[#f2a900] font-mono text-sm outline-none placeholder-[#e4e4e7]/30 caret-[#f2a900]"
              />
              <button
                type="submit"
                disabled={isNarrating || !customCommand.trim()}
                className="bg-[#f2a900] text-[#0b0b0c] font-bold uppercase h-6 px-4 font-mono text-[10px] tracking-wider border-none cursor-pointer hover:opacity-85 transition disabled:opacity-40"
              >
                Executar
              </button>
            </form>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#e4e4e7]/30 mt-2">
              Status: Terminal Online // Aguardando Parâmetros
            </div>
          </div>
        </div>
      </main>

      {/* Right Column - Inventory and Relation Matrices (G.25 / G.W) */}
      <aside className={`col-span-12 lg:col-span-3 border-l border-[#f2efeb]/10 bg-[#18181a] flex flex-col overflow-y-auto ${activeMobileCol === 'right' ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Treasury section */}
        <section className="p-6 border-b border-[#e4e4e7]/10">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e4e4e7]/50 mb-4">
            G.2 // Treasury Registry
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold font-mono text-[#f2a900] tracking-tight">
              {state.weeklyLedger.silverdew.toLocaleString()} <span className="text-xs font-mono font-normal text-[#e4e4e7]/50">SD</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#e4e4e7]/40 mt-1">
              Reservas de Silverdew (Prata Líquida)
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-[#e4e4e7]/10 border border-[#e4e4e7]/10 mt-6">
            <div className="bg-[#111113] p-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#e4e4e7]/50">Mantimentos</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">{state.weeklyLedger.food.toFixed(1)} FSU</div>
            </div>
            <div className="bg-[#111113] p-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#e4e4e7]/50">Ferro</div>
              <div className="text-xs font-bold text-[#f2a900] mt-1">{state.weeklyLedger.materials.iron} SU</div>
            </div>
            <div className="bg-[#111113] p-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#e4e4e7]/50">Madeira</div>
              <div className="text-xs font-bold text-[#f2a900] mt-1">{state.weeklyLedger.materials.timber} SU</div>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-[#e4e4e7]/40 font-mono">
            <span>MÃO DE OBRA ATIVA:</span>
            <span className="text-[#00e5ff] font-bold">{state.holdings.laborPool} operários</span>
          </div>
        </section>

        {/* Matrix relation section */}
        <section className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e4e4e7]/50 mb-4">
              Regional Matrix (G.W)
            </div>
            <div className="space-y-3">
              {state.worldLedger.nobleHouses.map((house) => {
                const isRevealed = (state.revealedRegions || [state.character.location.region]).includes(house.region) || house.name === state.character.house;
                
                if (!isRevealed) {
                  return (
                    <div key={house.name} className="flex items-center gap-3 text-xs opacity-50">
                      <span className="w-20 truncate font-mono text-[10px] uppercase text-[#e4e4e7]/50">{house.name.replace("House ", "")}</span>
                      <div className="flex-1 h-1.5 bg-[#e4e4e7]/5 relative border border-dashed border-[#e4e4e7]/10"></div>
                      <span className="font-mono text-[10px] text-[#e4e4e7]/30 font-bold w-6 text-right">???</span>
                    </div>
                  );
                }

                if (house.opinion === 0) {
                  return (
                    <div key={house.name} className="flex items-center gap-3 text-xs">
                      <span className="w-20 truncate font-mono text-[10px] uppercase text-[#e4e4e7]">{house.name.replace("House ", "")}</span>
                      <div className="flex-1 h-1.5 bg-[#e4e4e7]/5 relative">
                        <div className="absolute left-[50%] top-0 bottom-0 w-[2px] bg-[#f2a900]"></div>
                      </div>
                      <span className="font-mono text-[10px] text-[#e4e4e7]/50 font-bold w-6 text-right">0</span>
                    </div>
                  );
                }

                if (house.opinion > 0) {
                  const widthPercent = (house.opinion / 3) * 50;
                  return (
                    <div key={house.name} className="flex items-center gap-3 text-xs">
                      <span className="w-20 truncate font-mono text-[10px] uppercase text-[#e4e4e7]">{house.name.replace("House ", "")}</span>
                      <div className="flex-1 h-1.5 bg-[#e4e4e7]/5 relative">
                        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-[#e4e4e7]/20"></div>
                        <div 
                          className="absolute left-[50%] top-0 bottom-0 bg-[#00ff41]" 
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-[10px] text-[#00ff41] font-bold w-6 text-right">+{house.opinion}</span>
                    </div>
                  );
                }

                // house.opinion < 0
                const widthPercent = (Math.abs(house.opinion) / 3) * 50;
                return (
                  <div key={house.name} className="flex items-center gap-3 text-xs">
                    <span className="w-20 truncate font-mono text-[10px] uppercase text-[#e4e4e7]">{house.name.replace("House ", "")}</span>
                    <div className="flex-1 h-1.5 bg-[#e4e4e7]/5 relative">
                      <div className="absolute left-[50%] top-0 bottom-0 w-px bg-[#e4e4e7]/20"></div>
                      <div 
                        className="absolute right-[50%] top-0 bottom-0 bg-[#ff7777]" 
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-[10px] text-[#ff7777] font-bold w-6 text-right">{house.opinion}</span>
                  </div>
                );
              })}
            </div>

            {(() => {
              const allRegions = Array.from(new Set(state.worldLedger.nobleHouses.map(h => h.region)));
              const currentRevealed = state.revealedRegions || [state.character.location.region];
              const unrevealed = allRegions.filter(r => !currentRevealed.includes(r));
              return unrevealed.length > 0 ? (
                <div className="mt-6 pt-4 border-t border-[#e4e4e7]/10 space-y-2">
                  <div className="text-[9px] text-[#00e5ff] uppercase font-mono tracking-wider font-bold">Névoa de Guerra Ativa</div>
                  <p className="text-[10px] text-[#e4e4e7]/40 leading-snug">
                    Casas nobres de territórios distantes encontram-se ocultas. Ordene batedores ou missões de espionagem pelo terminal para dissipar a névoa.
                  </p>
                </div>
              ) : null;
            })()}

            {state.character.soulEssence !== undefined && (
              <div className="mt-6 border-t border-[#e4e4e7]/10 pt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a855f7] mb-2 font-bold">
                  G.NECRO // Essência de Alma
                </div>
                <div className="bg-[#a855f7]/5 border border-[#a855f7]/20 p-3 text-xs space-y-1 text-purple-300">
                  <div className="flex justify-between"><span>Essência Coletada:</span> <span className="font-bold">{state.character.soulEssence}</span></div>
                  <div className="flex justify-between"><span>Vassalos Esqueletos:</span> <span className="font-bold">{state.character.controlUsed} / {state.character.controlLimit}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-[#e4e4e7]/10 pt-4 space-y-4">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#ff7777] font-bold">
                Integrity Risk
              </div>
              <p className="text-[10px] text-[#e4e4e7]/40 mt-1 leading-normal">
                Mecânica de simulação ativa. Erros narrativos serão deterministicamente purgados.
              </p>
            </div>

            <button 
              onClick={onExit}
              className="w-full py-2 border border-red-900/40 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-950/20 transition text-center cursor-pointer"
            >
              Sair da Campanha
            </button>
          </div>
        </section>
      </aside>

      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-[#f2efeb]/10 bg-[#111113] px-6 py-2 flex justify-between items-center text-[10px] text-[#f2efeb]/40 font-mono">
        <div>LOCATION: /RAIZ/SYSTEM/{state.character.location.region.toUpperCase().replace(/\s+/g, '_')}</div>
        <div className="flex items-center gap-4">
          <div className="text-[#f2a900] font-bold tracking-widest hidden md:block">* SIMULATION STABLE *</div>
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
        <div>LATENCY: 14MS</div>
      </footer>

      {/* Render ApiKeyModal */}
      <ApiKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)} 
        onKeyUpdated={checkAiStatus} 
      />

      {/* Render Codex RAG Search Modal */}
      <CodexSearchModal 
        isOpen={showCodexModal} 
        onClose={() => setShowCodexModal(false)} 
      />

      {/* Render Ledger Viewer overlay */}
      {showLedgers && (
        <LedgerViewer 
          state={state} 
          onClose={() => setShowLedgers(false)} 
        />
      )}

      {/* Save Block Overlay Modal */}
      {showSaveBlock && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] border border-[#2D2D30] max-w-xl w-full p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[#2D2D30] pb-2">
              <h3 className="text-xs font-bold text-[#F2A900] uppercase flex items-center gap-1">
                <Save className="w-4 h-4" /> Exportar Registro de Campanha (Save)
              </h3>
              <button onClick={() => setShowSaveSaveBlock(false)} className="text-[#888] hover:text-white text-[10px] uppercase">Fechar</button>
            </div>
            <p className="text-[#888] text-[11px] leading-relaxed">
              Copie o bloco de texto abaixo e cole no launcher da próxima vez para continuar a simulação determinística do ponto exato de onde parou.
            </p>
            <textarea
              readOnly
              value={saveString}
              className="w-full h-40 bg-[#050506] border border-[#2D2D30] p-2 text-xs text-[#D1D1D1] focus:outline-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={copyToClipboard}
                className="py-1.5 px-4 bg-[#F2A900] hover:bg-[#D97706] text-[#0D0D0E] text-[11px] font-bold flex items-center gap-1 transition uppercase"
              >
                <Copy className="w-3.5 h-3.5" /> {copySuccess ? "Copiado!" : "Copiar Bloco de Texto"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
