import React, { useState, useEffect } from "react";
import { CampaignState, ArmyUnit } from "../types";
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

export function ActivePlay({ initialState, isTutorial, onExit }: ActivePlayProps) {
  const [state, setState] = useState<CampaignState>(initialState);
  const [narrativeHistory, setNarrativeHistory] = useState<string[]>(initialState.narrativeHistory || []);
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
          investigationProgress: 0,
          category: "Dynasty",
          outcomeDesc: "CONFIRMADO! A herdeira de Gwyneth realmente existe. Ela chama-se Lyra e vive disfarçada de tecelã nas Southern Mountains. Você pode tentar propor casamento heráldico legítimo para selar sua unificação territorial!"
        },
        {
          id: "secret_2",
          title: "O Suborno do Marechal Ren",
          description: "Dizem que o Marechal Ren de House Viremont aceitaria uma generosa propina em prata para desertar durante o próximo cerco.",
          revealed: false,
          investigationProgress: 0,
          category: "Military",
          outcomeDesc: "CONFIRMADO! O Marechal Ren está disposto a abrir as portas da torre por 150 SD durante o cerco militar. Uma traição preciosa."
        },
        {
          id: "secret_3",
          title: "O Enclave Secreto de Sálvia Sagrada",
          description: "Lendas rústicas contam sobre um vale sagrado abundante em sálvia selvagem mística nas Eastern Forests.",
          revealed: false,
          investigationProgress: 0,
          category: "Plot",
          outcomeDesc: "CONFIRMADO! A localização exata do enclave foi mapeada. Seus rituais de defumação (Smudging) agora restauram o dobro de moral de tropa e ganham +2 de opinião com qualquer Grande Casa!"
        }
      ];
      hasUpdated = true;
    }
    if (hasUpdated) {
      setState(s);
    }

    if (initialState.narrativeHistory && initialState.narrativeHistory.length > 0) {
      setNarrativeHistory(initialState.narrativeHistory);
      setCurrentNarrative(initialState.narrativeHistory[initialState.narrativeHistory.length - 1]);
      return;
    }

    let introPrompt = "";
    let isResume = false;
    if (isTutorial) {
      introPrompt = `Você assumiu o assento de Grey Keep na região Central Plains. Uma fortaleza robusta onde o vento nunca para. 
      MARA, sua conselheira, empurra um livro desgastado pela mesa:
      'Você assumiu o assento, meu lorde. Agora precisa saber o que isso significa.'
      Um batedor cansado e coberto de poeira se aproxima do portão: 'Meu lorde! Movimentações estranhas de tropas perto do rio Caedor. House Viremont e House Blackmere estão reunindo homens. Isso pode significar guerra antes do verão.'`;
    } else {
      introPrompt = `A jornada começa. Como ${initialState.character.title} da Casa ${initialState.character.house}, você se encontra em ${initialState.character.location.landmark}.
      As estradas estão desertas, sob um céu de chumbo gélido. Seus ledgers heráldicos estão em ordem e prontos para registrar o futuro de suas propriedades. O que deseja ordenar?`;
    }
    
    setNarrativeHistory([introPrompt]);
    setCurrentNarrative(introPrompt);
    generateNarrativeWithAI(introPrompt, "Apresente o início de uma nova campanha, apresentando os segredos e as fronteiras ao redor de Grey Keep.");
  }, []);

  // Sync narrativeHistory state to CampaignState narrativeHistory
  useEffect(() => {
    if (narrativeHistory.length > 0) {
      setState(prev => {
        if (!prev) return prev;
        if (JSON.stringify(prev.narrativeHistory) !== JSON.stringify(narrativeHistory)) {
          return {
            ...prev,
            narrativeHistory
          };
        }
        return prev;
      });
    }
  }, [narrativeHistory]);

  // Auto-save state to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem("shattered_oaths_campaign", JSON.stringify(state));
    } catch (e) {
      console.error("Erro ao salvar progresso automaticamente:", e);
    }
  }, [state]);

  // Safe wrapper for server-side Gemini narrative generation
  const generateNarrativeWithAI = async (actionDesc: string, mechanicalOutcome: string, webFlavorText?: string) => {
    setIsNarrating(true);
    try {
      const clientApiKey = localStorage.getItem("aos_gemini_api_key") || "";
      const response = await fetch("/api/narrate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": clientApiKey
        },
        body: JSON.stringify({
          systemPrompt: `Você é o Mestre Narrador e os Conselheiros (como o Marechal de Armas Ren e os Intendentes) de 'Age of Shattered Oaths'. Sua função é dar vida e fluidez dramática ao mundo medieval em tom de Crônica de Ferro.

DIRETRIZ DE FLUXO INFINITO DE CENA (EVENT CHAIN LOOP):
1. CONTINUIDADE E SELEÇÃO DE OPÇÕES (ex: o jogador digita "1", "2", "3" ou toma uma decisão):
   - Entenda qual opção o jogador escolheu no histórico recente de mensagens.
   - Narre a consequência imediata e visceral dessa escolha (ex: marchar com a guarda de 5 homens na floresta, ser surpreendido por desertores, encontrar cinzas de acampamento).

2. PRÓXIMO PASSO E NOVAS ESCOLHAS DRAMÁTICAS:
   - NUNCA termine com um encerramento passivo ou "ordem registrada nos ledgers".
   - Faça a cena evoluir para o PRÓXIMO EVENTO/DESAFIO imediato.
   - Apresente SEMPRE 2 ou 3 NOVAS ESCOLHAS CONCRETAS numeradas (1, 2, 3) ou pergunta reativa para o jogador responder a seguir.

3. CONVERSA E EVENTOS INFINITOS:
   - Permita que o jogador explore, tome decisões livres, converse com conselheiros ou continue enfrentando os eventos em um fluxo contínuo e infinito de narrativa.

DIRETRIZES DE SILÊNCIO MECÂNICO:
- Escreva em tom realista, sombrio e visceral (Crônica de Ferro em Português do Brasil).
- Mantenha a continuidade narrativa usando o contexto anterior.`,
          userPrompt: `HISTÓRICO RECENTE DA CENA:\n${narrativeHistory.slice(-6).join("\n")}\n\nLocalização: ${state.character.location.landmark} (${state.character.location.region}).
Clima atual: ${state.weeklyLedger.weather}.
Sua ação atual: ${actionDesc}.
Resultado Mecânico da Engine: ${mechanicalOutcome}.`,
          webFlavorText,
          clientApiKey
        })
      });
      const data = await response.json();
      if (data.text) {
        const masterNarrative = `[MESTRE] ${data.text}`;
        setCurrentNarrative(masterNarrative);
        setNarrativeHistory(prev => {
          const updated = [...prev, masterNarrative];
          setState(s => s ? { ...s, narrativeHistory: updated } : s);
          return updated;
        });
      }
    } catch (e) {
      console.error("AI narration error, falling back:", e);
      const p = (actionDesc || "").toLowerCase();
      let fallbackText = `Os conselheiros de ${state.character.location.landmark} registraram vossa ordem nos ledgers da fortaleza. As decisões tomadas ecoam pelas salas de guerra e os batedores cumprem os deveres sob o céu cinzento do inverno.`;
      if (p === "2" || p.includes("opcao 2") || p.includes("opção 2") || p.includes("escolha 2") || p.includes("2.")) {
        fallbackText = `Você convoca 5 infantarias armadas da guarnição. Com as espadas embainhadas e escudos de madeira bruta, a patrulha avança sob a geada densa da floresta.\n\nApós meia hora de marcha, a tropa encontra cinzas quentes de uma fogueira clandestina e vestígios de um cervo abatido. Marcas de botas e sangue fresco seguem em direção a uma ravina à esquerda.\n\nComo deseja comandar a tropa?\n1. Enviar 2 guardas para flanquear a ravina com arcos a postos.\n2. Avançar em formação de parede de escudos pelo caminho principal.\n3. Exigir rendição em voz alta aos homens ocultos na ravina.`;
      } else if (p === "1" || p.includes("opcao 1") || p.includes("opção 1") || p.includes("escolha 1") || p.includes("1.")) {
        fallbackText = `Você avança sozinho, deixando os portões de ${state.character.location.landmark} para trás. O silêncio dos pinheiros é quebrado apenas pelo ranger da geada sob suas botas.\n\nDe repente, dois homens em trapos de ex-soldados surgem de trás de uma rocha, empunhando machados enferrujados com olhares desesperados.\n\nComo você reage?\n1. Desembainhar a espada e confrontar os desertores.\n2. Oferecer moedas de prata (5 SD) para que prestem juramento de lealdade.\n3. Recuar taticamente em direção aos portões da fortaleza.`;
      } else if (p === "3" || p.includes("opcao 3") || p.includes("opção 3") || p.includes("escolha 3") || p.includes("3.")) {
        fallbackText = `Você ordena que os batedores avancem 100 passos na frente. Pouco tempo depois, o eco de um assobio de alerta ressoa entre as árvores. Os batedores retornam informando que avistaram uma patrulha inimiga disfarçada de mercadores.\n\nComo deseja proceder?\n1. Preparar uma emboscada silenciosa nas árvores altas.\n2. Interceptar a caravana e exigir inspeção de carga.\n3. Retornar ao castelo para convocar a cavalaria.`;
      } else if (p.includes("floresta") || p.includes("passear") || p.includes("caminhar") || p.includes("viajar") || p.includes("explorar") || p.includes("bosque") || p.includes("estrada") || p.includes("vila") || p.includes("sair") || p.includes("patrulha")) {
        fallbackText = `Ao ouvirem vossa intenção de deixar a fortaleza de ${state.character.location.landmark} para caminhar pela floresta gélida, o Marechal Ren coloca a mão no cabo da espada e adverte com tom sério: 'Senhor, a geada cobriu os trilhos e batedores relataram rastros de desertores e lobos esfomeados nas árvores. É imprudência marchar sem escolta enquanto as fronteiras estão tensas.'\n\nO vento sopra forte na borda dos bosques. Como deseja proceder?\n1. Marchar sozinho aceitando o risco de emboscada.\n2. Levar uma guarda pessoal de 5 infantarias armadas.\n3. Ordenar que batedores limpem o caminho antes de cruzar os portões.`;
      } else if (p.includes("fazer") || p.includes("opções") || p.includes("opcoes") || p.includes("posso") || p.includes("onde estou") || p.includes("ajuda") || p.includes("comandos") || p.includes("instruções") || p.includes("prioridade") || p.includes("urgencia") || p.includes("urgência") || p.includes("qual") || p.includes("devo") || p.includes("proxima")) {
        fallbackText = `Como soberano em ${state.character.location.landmark}, vossos ledgers heráldicos e conselheiros aguardam ordens imediatas. Vossas opções estratégicas são:\n\n1. Recrutar infantaria ou tropas feudais para reforçar a guarnição (Custo: 3 SD por soldado).\n2. Construir fortificações, paliçadas ou oficinas de forja no feudo.\n3. Coletar tributos da população ou negociar caravanas de mantimentos.\n4. Enviar patrulhas e batedores para vigiar as estradas e fronteiras da região.\n5. Inserir qualquer ação diplomática, ordem customizada ou pergunta livre no terminal.`;
      }
      const fallback = `[MESTRE] ${fallbackText}`;
      setCurrentNarrative(fallback);
      setNarrativeHistory(prev => {
        const updated = [...prev, fallback];
        setState(s => s ? { ...s, narrativeHistory: updated } : s);
        return updated;
      });
    } finally {
      setIsNarrating(false);
    }
  };

  // Resolve Weekly Turn mechanics (fully deterministic)
  const handleAdvanceWeek = () => {
    const { updatedState, turnResult } = resolveWeeklyTurn(state);
    setState(updatedState);
    setMenuMode('main');
    generateNarrativeWithAI("Avançar tempo por mais uma semana no assento senhorial.", turnResult.eventLog.join("\n"));
  };

  // Blacksmith crafting mechanics
  const handleCraftEquipment = (wep: string, costTimber: number, costIron: number, costSD: number) => {
    if (state.weeklyLedger.silverdew < costSD || state.weeklyLedger.materials.timber < costTimber || state.weeklyLedger.materials.iron < costIron) {
      alert("Recursos insuficientes na tesouraria!");
      return;
    }

    const s = { ...state };
    s.weeklyLedger.silverdew -= costSD;
    s.weeklyLedger.materials.timber -= costTimber;
    s.weeklyLedger.materials.iron -= costIron;
    
    // Smith gains XP
    s.holdings.residentSmith.xp += 15;
    if (s.holdings.residentSmith.xp >= 100 && s.holdings.residentSmith.level < 5) {
      s.holdings.residentSmith.level += 1;
      s.holdings.residentSmith.xp = 0;
    }

    setState(s);
    setMenuMode('main');
    generateNarrativeWithAI(
      `Ordenar ao ferreiro ${state.holdings.residentSmith.name} que forje ${wep}.`,
      `Consumo: -${costSD} SD, -${costTimber} madeira, -${costIron} ferro. Ferreiro ganhou +15 XP.`
    );
  };

  // Troop recruitment / raising undead
  const handleRecruitTroops = (type: string, costSD: number, costEssence?: number) => {
    if (costEssence && (state.character.soulEssence || 0) < costEssence) {
      alert("Essência de alma insuficiente!");
      return;
    }
    if (!costEssence && state.weeklyLedger.silverdew < costSD) {
      alert("Moedas de Silverdew insuficientes na tesouraria!");
      return;
    }

    const s = { ...state };
    if (costEssence) {
      s.character.soulEssence = (s.character.soulEssence || 0) - costEssence;
      s.character.controlUsed = (s.character.controlUsed || 0) + 10;
      // Add skeletons to army
      s.army.units.push({
        id: `skeleton_${globalRNG.nextInt(0, 1000000)}`,
        name: `Infanteria Morta-Viva ${s.army.units.length + 1}`,
        size: 10,
        maxSize: 10,
        tier: 1,
        ac: 3,
        weapon: "Fists",
        mount: "None",
        morale: 6,
        type: "Skeletons"
      });
    } else {
      s.weeklyLedger.silverdew -= costSD;
      // Add recruits
      const levyUnit = s.army.units.find(u => u.name === "Landed Levy");
      if (levyUnit) {
        levyUnit.size = Math.min(levyUnit.maxSize, levyUnit.size + 15);
      } else {
        s.army.units.push({
          id: `levy_${globalRNG.nextInt(0, 1000000)}`,
          name: "Landed Levy",
          size: 15,
          maxSize: 60,
          tier: 1,
          ac: 3,
          weapon: "Spears",
          mount: "None",
          morale: 4,
          type: "Levy"
        });
      }
    }

    setState(s);
    setMenuMode('main');
    generateNarrativeWithAI(
      `Convocar e armar novos soldados para o exército pessoal.`,
      costEssence 
        ? `Consumo: -${costEssence} Essência de alma. Criados +10 esqueletos de infantaria.`
        : `Consumo: -${costSD} SD. Recrutados +15 novos soldados do bando.`
    );
  };

  // Launch caravan trade route
  const handleLaunchCaravan = (good: string, profit: number, costSD: number) => {
    if (state.weeklyLedger.silverdew < costSD) {
      alert("Falta prata de Silverdew para suprir a caravana comercial!");
      return;
    }

    const s = { ...state };
    s.weeklyLedger.silverdew -= costSD;
    s.weeklyLedger.silverdew += profit;

    setState(s);
    setMenuMode('main');
    generateNarrativeWithAI(
      `Despachar caravana de suprimentos para as rotas regionais com carregamento de ${good}.`,
      `Finanças: Custos de viagem -${costSD} SD pagos. Retorno bruto de venda de mercadorias: +${profit} SD. Lucro líquido: +${profit - costSD} SD.`
    );
  };

  // Travel landmarks week-by-week
  const handleTravelToRegion = (targetRegion: string) => {
    const s = { ...state };
    s.character.location.region = targetRegion;
    s.character.location.landmark = targetRegion === "Central Plains" ? "Hollowford" : "Bogthrone";
    
    // Trigger weekly turn updates due to travel passage
    const { updatedState, turnResult } = resolveWeeklyTurn(s);
    setState(updatedState);
    setMenuMode('main');
    
    generateNarrativeWithAI(
      `Marchar com sua escolta armada em jornada em direção à região de ${targetRegion}.`,
      `Deslocamento: Viagem de 1 semana realizada. ${turnResult.eventLog.join("\n")}`
    );
  };

  // Initiate combat spar with commander Ren
  const handleInitCombat = () => {
    setPlayerUnit({
      id: "p_comb",
      name: "Sua Guarda Pessoal",
      size: 40,
      maxSize: 40,
      tier: 2,
      ac: 4,
      weapon: "Swords",
      mount: "None",
      morale: 5
    });

    setEnemyUnit({
      id: "e_comb",
      name: "Tropa de Elite de Ren",
      size: 40,
      maxSize: 40,
      tier: 2,
      ac: 4,
      weapon: "Swords",
      mount: "None",
      morale: 4
    });

    setCombatLog(["Sparring amigável iniciado com o Marshal no pátio de treino de Grey Keep."]);
    setCombatHornBlowingCooldown(false);
    setCombatEnemyScouted(false);
    setMenuMode('combat');
  };

  // Process one combat iteration round
  const handleCombatAction = (action: 'Keep Attacking' | 'Defend' | 'Charge') => {
    if (!playerUnit || !enemyUnit) return;

    const p = { ...playerUnit };
    const e = { ...enemyUnit };

    // AI determines action using CommanderAIService via Engine
    const aiAction = resolveNpcCombatAction(e, p);

    const result = simulateCombatRound(p, e, action, aiAction);
    
    // 25% chance of enemy commander blowing their signature horn: O Chifre de Grifo de Grey
    const enemyBlowsHorn = globalRNG.next() < 0.25;
    if (enemyBlowsHorn && e.size > 0 && p.size > 0) {
      e.morale = Math.min(10, e.morale + 1);
      p.size = Math.max(0, p.size - 2);
      result.combatLog.push("[BERRANTE INIMIGO] Marshal Ren sopra o Chifre de Grifo de Grey ('Sopro de bronze gélido que convoca as asas'). A moral da tropa de Ren aumentou e 2 de seus guardas recuaram de pavor!");
    }

    setPlayerUnit(p);
    setEnemyUnit(e);
    setCombatLog(prev => [...prev, ...result.combatLog]);

    if (p.size <= 0 || e.size <= 0) {
      let winText = "";
      if (p.size <= 0 && e.size <= 0) {
        winText = "O combate terminou em um empate brutal. Ambas as linhas colapsaram no pó.";
      } else if (p.size <= 0) {
        winText = "Derrota! Suas defesas falharam diante das táticas implacáveis do oponente.";
      } else {
        winText = "Vitória! Seus homens mantiveram a muralha de escudos e forçaram a rendição inimiga.";
        setHasWonSpar(true);
      }
      setCombatLog(prev => [...prev, winText]);
      
      // Update real state values
      const s = { ...state };
      if (s.army.units[0]) {
        s.army.units[0].size = Math.max(5, s.army.units[0].size - 5); // take small symbolic losses
      }
      setState(s);
    }
  };

  const handleBlowHornInCombat = (hornId: string) => {
    if (!playerUnit || !enemyUnit) return;
    if (combatHornBlowingCooldown) {
      alert("Você já soprou um berrante heráldico nesta escaramuça táctica!");
      return;
    }

    const horn = state.inventory.horns.find(h => h.id === hornId);
    if (!horn) return;
    if (horn.broken) {
      alert("Este berrante está quebrado!");
      return;
    }

    const p = { ...playerUnit };
    const e = { ...enemyUnit };
    let outcome = "";

    if (horn.type === 'Hunting') {
      e.size = Math.max(0, e.size - 5);
      outcome = `Você sopra o Berrante de Caça '${horn.name}' ('${horn.sound}'). Seus batedores flanqueiam a retaguarda inimiga! -5 combatentes inimigos.`;
    } else if (horn.type === 'Battle') {
      p.size = Math.min(p.maxSize, p.size + 8);
      outcome = `Você sopra o Berrante de Batalha '${horn.name}' ('${horn.sound}'). Os homens batem espadas nos escudos e renovam as forças! +8 soldados re-alistados.`;
    } else if (horn.type === 'War') {
      e.size = Math.max(0, e.size - 8);
      outcome = `Você sopra o Berrante de Guerra '${horn.name}' ('${horn.sound}'). O rugido de bronze ecoa e aterroriza o inimigo! -8 inimigos debandam.`;
    } else {
      p.size = Math.min(p.maxSize, p.size + 12);
      outcome = `Você sopra o Berrante de Juramento '${horn.name}' ('${horn.sound}'). Reservas juradas correm para a batalha em fealdade! +12 soldados de reforço.`;
    }

    setPlayerUnit(p);
    setEnemyUnit(e);
    setCombatHornBlowingCooldown(true);
    setCombatLog(prev => [...prev, `[BERRANTE ALIADO] ${outcome}`]);

    generateNarrativeWithAI(
      `Soprar com força incomum o berrante heráldico familiar ${horn.name} durante a batalha campal táctica.`,
      `Mecânica de Berrante em Combate: ${outcome}`
    );
  };

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
    setNarrativeHistory(prev => [...prev, playerMsg]);

    try {
      const clientApiKey = localStorage.getItem("aos_gemini_api_key") || "";
      const response = await fetch("/api/narrative-cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": clientApiKey
        },
        body: JSON.stringify({
          playerInput: commandText,
          state,
          clientApiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.resultState) {
        setState(data.resultState);
        const masterNarrative = data.narrative.startsWith("[MESTRE]")
          ? data.narrative
          : `[MESTRE] ${data.narrative}`;
        setCurrentNarrative(masterNarrative);
        setNarrativeHistory(prev => {
          const updated = [...prev, masterNarrative];
          return updated;
        });
      } else {
        throw new Error(data.error || "Resposta inválida do servidor narrativo");
      }
    } catch (err: any) {
      console.error("Erro na comunicação com /api/narrative-cycle:", err);
      const fallbackMsg = `[MESTRE] Os conselheiros de ${state.character.location.landmark} registraram a ordem sob os livros de ferro. A simulação permanece segura e o estado preservado.`;
      setCurrentNarrative(fallbackMsg);
      setNarrativeHistory(prev => [...prev, fallbackMsg]);
    } finally {
      setIsNarrating(false);
    }
  };

  // ==========================================
  // STAGE 1 & 2 RITUAL, HORN, AND DYNASTIC LOGIC
  // ==========================================

  const handleBuySmudge = (type: 'sage' | 'cedar' | 'sweetgrass' | 'tobacco', cost: number) => {
    if (state.weeklyLedger.silverdew < cost) {
      alert("Silverdew (SD) insuficiente na tesouraria!");
      return;
    }
    const s = { ...state };
    s.weeklyLedger.silverdew -= cost;
    s.inventory.smudgeBundles[type] += 1;
    setState(s);
    generateNarrativeWithAI(
      `Comprar ervas secas de ${type === 'sage' ? 'Sálvia' : type === 'cedar' ? 'Cedro' : type === 'sweetgrass' ? 'Erva-Doce' : 'Tabaco'} com mercadores itinerantes.`,
      `Consumo: -${cost} SD. Estoque de ${type} aumentado em +1 feixe.`
    );
  };

  const handlePerformSmudging = (type: 'sage' | 'cedar' | 'sweetgrass' | 'tobacco') => {
    if (!state.inventory || state.inventory.smudgeBundles[type] <= 0) {
      alert(`Você não possui feixes de ${type} estocados!`);
      return;
    }
    
    const s = { ...state };
    s.inventory.smudgeBundles[type] -= 1;
    
    let mechanicalOutcome = "";
    if (type === 'sage') {
      s.worldLedger.nobleHouses.forEach(h => {
        if (globalRNG.next() < 0.5) adjustHouseOpinion(h, 1);
      });
      s.character.reputation += 1;
      mechanicalOutcome = "Ritual de Defumação com Sálvia: A fumaça herborista purifica as desconfianças do salão. +1 Reputação mundial, e a opinião de algumas Grandes Casas aumentou em +1.";
    } else if (type === 'cedar') {
      s.character.reputation += 2;
      mechanicalOutcome = "Ritual de Defumação com Cedro: Purificação com fumaça protetora ancestral. +2 de Reputação heráldica pelo apreço às tradições do norte.";
    } else if (type === 'sweetgrass') {
      s.army.units.forEach(u => {
        u.morale = Math.min(10, u.morale + 2);
      });
      mechanicalOutcome = "Ritual de Defumação com Erva-Doce: Aroma de bondade e harmonia espiritual. +2 de Moral para todas as suas divisões militares de escolta.";
    } else if (type === 'tobacco') {
      s.weeklyLedger.silverdew += 40;
      mechanicalOutcome = "Ritual de Defumação com Tabaco: Oferta de gratidão sagrada aos espíritos do local. Um batedor descobre moedas escondidas (+40 SD) no acampamento.";
    }

    setState(s);
    generateNarrativeWithAI(
      `Conduzir uma Cerimônia de Defumação Sagrada no Grande Círculo de Partilha usando feixe de ${type}.`,
      `Consumo: -1 feixe de ${type}. ${mechanicalOutcome}`
    );
  };

  const handleCraftHorn = (type: 'Hunting' | 'Battle' | 'War' | 'Clan' | 'Oath' | 'Mourning', costSD: number, costTimber: number) => {
    if (state.weeklyLedger.silverdew < costSD || state.weeklyLedger.materials.timber < costTimber) {
      alert("Recursos insuficientes na tesouraria!");
      return;
    }

    const s = { ...state };
    s.weeklyLedger.silverdew -= costSD;
    s.weeklyLedger.materials.timber -= costTimber;

    let sound = "";
    if (type === 'Hunting') sound = "Sopro rápido, brilhante e alegre de caça";
    else if (type === 'Battle') sound = "Sopro profundo, urgente e ensurdecedor de bronze";
    else if (type === 'War') sound = "Sopro longo, crescente e cavernoso de comando militar";
    else if (type === 'Clan') sound = "Sopro ancestral e entalhado ressoando as colinas";
    else if (type === 'Oath') sound = "Sopro argentino de prata pura carregando a verdade jurada";
    else if (type === 'Mourning') sound = "Sopro baixo, fúnebre e reverente de perda";

    const label = type === 'Hunting' ? 'Caça' : type === 'Battle' ? 'Batalha' : type === 'War' ? 'Guerra' : type === 'Clan' ? 'Clã' : type === 'Oath' ? 'Juramento' : 'Lamento';

    const newHorn = {
      id: `horn_${globalRNG.nextInt(0, 1000000)}`,
      name: `Berrante de ${label}`,
      type,
      sound,
      broken: false
    };

    s.inventory.horns.push(newHorn);
    setState(s);
    generateNarrativeWithAI(
      `Ordenar o entalhe e a fundição de um novo ${newHorn.name} pelo artesão.`,
      `Consumo: -${costSD} SD, -${costTimber} madeira. Criado com sucesso o ${newHorn.name}.`
    );
  };

  const handleSoundHorn = (hornId: string) => {
    const horn = state.inventory.horns.find(h => h.id === hornId);
    if (!horn) return;
    if (horn.broken) {
      alert("Este berrante está rachado e silenciado!");
      return;
    }

    const s = { ...state };
    let mechanicalOutcome = "";

    if (horn.type === 'Hunting') {
      mechanicalOutcome = "Berrante de Caça soado. O bando localiza caça fresca nos bosques, adicionando +4.0 FSU à despensa.";
      s.weeklyLedger.food += 4.0;
    } else if (horn.type === 'Battle') {
      mechanicalOutcome = "Berrante de Batalha soado. O metal vibra na armadura. +1 de Iniciativa e +1 de Moral de combate para todas as forças.";
      s.character.stats.initiativeBonus = (s.character.stats.initiativeBonus || 0) + 1;
      s.army.units.forEach(u => u.morale = Math.min(10, u.morale + 1));
    } else if (horn.type === 'War') {
      mechanicalOutcome = "Berrante de Guerra soado. Um rugido longo que ecoa por milhas. +1 de Reputação mundial incontestada.";
      s.character.reputation += 1;
    } else if (horn.type === 'Clan') {
      mechanicalOutcome = "Berrante de Clã soado. Unidade heráldica restaurada. A opinião das Casas da mesma região aumenta em +1.";
      s.worldLedger.nobleHouses.forEach(h => {
        if (h.region === s.character.location.region) {
          adjustHouseOpinion(h, 1);
        }
      });
    } else if (horn.type === 'Oath') {
      mechanicalOutcome = "Berrante de Juramento soado. Voz de prata ressoando lealdade. Opinião de todas as Casas Nobles do ledger aumenta em +1.";
      s.worldLedger.nobleHouses.forEach(h => {
        adjustHouseOpinion(h, 1);
      });
    } else if (horn.type === 'Mourning') {
      mechanicalOutcome = "Berrante de Lamento soado. Postura reverente respeitada por vassalos. O Lorde ganha +1 de Reputação.";
      s.character.reputation += 1;
    }

    setState(s);
    generateNarrativeWithAI(
      `Soprar forte o lendário ${horn.name}, fazendo o som de '${horn.sound}' ecoar pelas terras frias.`,
      `Mecânica: ${mechanicalOutcome}`
    );
  };

  const handleArrangeMarriage = (targetHouseName: string) => {
    const s = { ...state };
    if (s.family.spouse) {
      alert("Você já possui um cônjuge oficial jurado!");
      return;
    }
    
    const targetHouse = s.worldLedger.nobleHouses.find(h => h.name === targetHouseName);
    if (!targetHouse) return;

    if (s.weeklyLedger.silverdew < 150) {
      alert("Silverdew (SD) insuficiente na tesouraria para pagar o dote tradicional de 150 SD!");
      return;
    }

    s.weeklyLedger.silverdew -= 150;
    adjustHouseOpinion(targetHouse, 2);
    
    const names = ["Lady Elysia", "Lady Beatrix", "Lady Sibylla", "Lady Rowan", "Lady Gwendolyn", "Lady Yvaine", "Lady Morgaine"];
    const chosenSpouseName = globalRNG.pick(names);
    
    s.family.spouse = {
      name: `${chosenSpouseName} da Casa ${targetHouse.name.replace("House ", "")}`,
      house: targetHouse.name,
      age: 18 + globalRNG.nextInt(0, 7),
      affection: 5
    };

    setState(s);
    generateNarrativeWithAI(
      `Selar aliança política nupcial com a dinastia da prestigiosa ${targetHouse.name}, promovendo um banquete heráldico de união de sangue.`,
      `Diplomacia: Casado(a) com ${s.family.spouse.name}. Opinião com a ${targetHouse.name} aumentada em +2. Tesouraria: -150 SD com despesas do dote.`
    );
  };

  const handleTryConceive = () => {
    if (!state.family.spouse) {
      alert("Você necessita de um cônjuge ativo para conceber descendência!");
      return;
    }
    if (state.family.pregnancyWeekRemaining !== undefined) {
      alert("Seu cônjuge já se encontra gestando a linhagem ativa!");
      return;
    }

    const s = { ...state };
    const successChance = 0.35 + (s.family.spouse.affection * 0.04);
    const rolls = globalRNG.next();

    let mechanicalOutcome = "";
    if (rolls < successChance) {
      s.family.pregnancyWeekRemaining = 10; // 10 weeks to birth!
      s.family.spouse.affection = Math.min(10, s.family.spouse.affection + 1);
      mechanicalOutcome = "Sucesso! A gestação da linhagem heráldica legítima foi iniciada e durará 10 semanas de cuidados na corte.";
    } else {
      s.family.spouse.affection = Math.max(1, s.family.spouse.affection - 1);
      mechanicalOutcome = "Fracasso: Os ventos frios da estação sopraram contra os aposentos privados do feudo. Sem gravidez registrada.";
    }

    setState(s);
    generateNarrativeWithAI(
      `Recolher-se aos aposentos privados com seu cônjuge ${state.family.spouse.name} para assegurar a linhagem de descendência direta.`,
      `Linhagem: ${mechanicalOutcome}`
    );
  };

  const handleTrainHeir = (childName: string) => {
    if (state.weeklyLedger.silverdew < 50) {
      alert("Silverdew (SD) insuficiente para contratar os mestres tutores (50 SD)!");
      return;
    }

    const s = { ...state };
    s.weeklyLedger.silverdew -= 50;
    s.character.reputation += 1;
    
    setState(s);
    generateNarrativeWithAI(
      `Designar clérigos, armeiros e tutores mercenários para instruir o herdeiro ${childName} na arte da cavalaria, comando e diplomacia.`,
      `Educação: Consumidos -50 SD. O herdeiro enriquece seu intelecto. Reputação da dinastia aumentada em +1.`
    );
  };

  const handleClaimCrown = (crownId: 'blood' | 'contracts' | 'northwind' | 'greendrake' | 'stone' | 'rubicon') => {
    const s = { ...state };
    const crown = s.crowns.find(c => c.id === crownId);
    if (!crown) return;

    // Lineage and starting limits check
    const hasRoyalLineage = s.character.archetype === 'Noble Ruler' || s.character.archetype === 'Landed Knight';
    const isFalseLineageReady = s.falseLineage && s.falseLineage.active && s.falseLineage.documentsForged && !s.falseLineage.isExposed;

    // Non-noble archetype blocks pacified claims unless forgery is ready
    if (!hasRoyalLineage && !isFalseLineageReady && crownId !== 'rubicon') {
      alert(`DIREITO SANGUÍNEO NEGADO!\n\nSua origem como ${s.character.archetype} carece de linhagem nobre ou heráldica legítima. Você não pode reivindicar a coroa de ${crown.name} por herança dinástica ou vias pacíficas.\n\nSoberania exige audácia:\n1. Inicie a Conspiração de Falsa Linhagem (disponível abaixo na aba de Coroas) para forjar árvores genealógicas falsas de alto custo semanal.\n2. Reivindique a COROA RUBICON através de rebelião e aclamação das espadas (Caminho do Ferro/Guerra).`);
      return;
    }

    let canClaim = false;
    let failReason = "";

    if (crownId === 'blood') {
      const helpfulHouses = s.worldLedger.nobleHouses.filter(h => h.region === 'Central Plains' && h.opinion >= 1);
      if (s.character.reputation >= 3 && helpfulHouses.length >= 2) {
        canClaim = true;
      } else {
        failReason = "Você necessita de ao menos Reputação de nível 3 e que pelo menos 2 Casas das Planícies tenham Opinião positiva (>= +1) com você.";
      }
    } else if (crownId === 'contracts') {
      if (s.weeklyLedger.silverdew >= 250 && s.worldLedger.nobleHouses.filter(h => h.region === 'Western Rivers' && h.opinion >= 1).length >= 1) {
        canClaim = true;
      } else {
        failReason = "Você necessita de ao menos 250 SD em cofres e que pelo menos 1 Casa Fluvial mercante tenha Opinião positiva (>= +1).";
      }
    } else if (crownId === 'northwind') {
      if (s.weeklyLedger.season === 'Deepfrost' && s.weeklyLedger.weather.toLowerCase().includes('neve')) {
        canClaim = true;
      } else {
        failReason = "A Coroa do Vento do Norte exige realizar o ritual de isolamento na estação de Deepfrost sob clima ativo de Neve.";
      }
    } else if (crownId === 'greendrake') {
      if (s.holdings.residentSmith.level >= 3) {
        canClaim = true;
      } else {
        failReason = "Sua corte necessita de um Ferreiro Mestre residente com Nível 3 ou maior.";
      }
    } else if (crownId === 'stone') {
      if (s.weeklyLedger.materials.iron >= 10 && s.weeklyLedger.materials.timber >= 20) {
        canClaim = true;
      } else {
        failReason = "Requer 10 de ferro e 20 de madeira nos estoques para a fundição da coroa de pedra.";
      }
    } else if (crownId === 'rubicon') {
      const totalTroops = s.army.units.reduce((acc, u) => acc + u.size, 0);
      
      if (s.character.archetype === 'Artificer') {
        // Special Blacksmith/Artificer path: Sceptre of Iron and Fire
        const isSmithMaster = s.holdings.residentSmith.level >= 4;
        const hasIronStock = s.weeklyLedger.materials.iron >= 30;
        if (totalTroops >= 120 && isSmithMaster && hasIronStock) {
          canClaim = true;
        } else {
          failReason = "Como Artífice, o Rubicão exige um exército de 120 homens armados com ferro superior, ferreiro residente Nível 4+ e 30 minérios de ferro acumulados.";
        }
      } else if (s.character.archetype === 'Necromancer') {
        // Special Necromancer path: The Crown of Souls
        const soulEssenceCount = s.character.soulEssence || 0;
        const skeletonsCount = s.army.units
          .filter(u => u.type === 'Skeletons' || u.type === 'Skeleton Archers')
          .reduce((acc, u) => acc + u.size, 0);
        if (skeletonsCount >= 80 && soulEssenceCount >= 25) {
          canClaim = true;
        } else {
          failReason = "Como Necromante, o Rubicão exige comandar pelo menos 80 esqueletos vivos e reter 25 Essências de Alma.";
        }
      } else {
        // Standard path
        if (totalTroops >= 80) {
          canClaim = true;
        } else {
          failReason = "Exige liderar um exército com no mínimo 80 homens ativos.";
        }
      }
    }

    if (!canClaim) {
      alert(`Requisitos de aclamação heráldica não atendidos!\n\nMotivo: ${failReason}`);
      return;
    }

    crown.unlocked = true;
    s.character.reputation += 3;
    
    let claimTitle = "";
    if (crownId === 'rubicon' && s.character.archetype === 'Artificer') {
      claimTitle = "Sovereign of Iron and Fire - Maker of Kings";
      s.character.nicknames.push({ name: "O Grande Forjador", date: `Ano ${s.worldLedger.currentDate.year}` });
    } else if (crownId === 'rubicon' && s.character.archetype === 'Necromancer') {
      claimTitle = "High Sovereign of Souls - Death Ruler";
      s.character.nicknames.push({ name: "O Senhor das Cinzas", date: `Ano ${s.worldLedger.currentDate.year}` });
    } else {
      claimTitle = `High Sovereign of the Shattered Oaths - Claimed ${crown.name}`;
    }
    
    if (isFalseLineageReady) {
      s.character.nicknames.push({ name: "O Usurpador de Sangue", date: `Ano ${s.worldLedger.currentDate.year}` });
    }

    s.character.title = claimTitle;
    setState(s);
    generateNarrativeWithAI(
      `Reivindicar soberania heráldica sobre a coroa de ${crown.name} usando o status de sua dinastia.`,
      `Soberania Conquistada: O reino treme e as harpas de guerra cantam sob sua aclamação. Você foi coroado como: ${claimTitle}.`
    );
  };

  const handleSendScouts = () => {
    const s = { ...state };
    if (s.weeklyLedger.silverdew < 30) {
      alert("Nobre Lorde, seus cofres carecem de prata suficiente (30 SD) para subornar informantes e batedores externos!");
      return;
    }

    const allRegions = Array.from(new Set(s.worldLedger.nobleHouses.map(h => h.region)));
    const currentRevealed = s.revealedRegions || [s.character.location.region];
    const unrevealed = allRegions.filter(r => !currentRevealed.includes(r));

    if (unrevealed.length === 0) {
      alert("Todas as regiões conhecidas já foram completamente infiltradas por seus espiões!");
      return;
    }

    // Pick a random unrevealed region
    const targetReg = globalRNG.pick(unrevealed);
    const updatedRevealed = [...currentRevealed, targetReg];

    s.weeklyLedger.silverdew -= 30;
    s.revealedRegions = updatedRevealed;
    setState(s);

    generateNarrativeWithAI(
      `Infiltrar informantes e batedores reais nas terras de ${targetReg} para mapear a opinião política de suas Grandes Casas.`,
      `Espionagem: Consumidos -30 SD. Sua rede de espionagem estabelece raízes seguras em ${targetReg}. Agora, a opinião heráldica das casas daquela região foi limpa da Névoa de Guerra.`
    );
  };

  const handleScoutEnemyInCombat = () => {
    if (!enemyUnit) return;
    const s = { ...state };
    
    // Fluid food cost formula: 2 FSU + 1 FSU per 40 enemy soldiers
    const foodCost = parseFloat((2 + (enemyUnit.size / 40)).toFixed(1));
    if (s.weeklyLedger.food < foodCost) {
      alert(`Nobre Lorde, suas forças carecem de provisões suficientes (requer ${foodCost} FSU) para despachar batedores rápidos em patrulhas táticas neste conflito!`);
      return;
    }

    s.weeklyLedger.food = parseFloat((s.weeklyLedger.food - foodCost).toFixed(1));

    // Spymaster intelligence bonus
    const spyMasterName = s.advisors?.spyMasterName || "Barth";
    const spyMasterBonuses: { [key: string]: number } = {
      "Ren": 2, "Sylas": 3, "Kaelen": 5, "Lyra": 4, "Fiona": 3, "Valia": 2, "Morwen": 5, "Rook": 4
    };
    const spyMasterBonus = spyMasterBonuses[spyMasterName] || 2;

    // Roll d20 vs DC 11 (standard tactical scouting)
    const dc = 11;
    const d20 = globalRNG.nextInt(1, 20);
    const rollTotal = d20 + spyMasterBonus;

    if (rollTotal >= dc) {
      setCombatEnemyScouted(true);
      setCombatLog(prev => [
        ...prev,
        `SUCESSO DOS BATEDORES (D20: ${d20} + ${spyMasterBonus} vs DC ${dc}): Seus batedores mapearam as forças de ${enemyUnit.name} furtivamente. Provisões gastas: -${foodCost} FSU.`
      ]);
      generateNarrativeWithAI(
        `Despachar patrulha de batedores táticos contra o inimigo (${enemyUnit.name}).`,
        `Sucesso tático: Batedores mapearam o contingente inimigo perfeitamente. Alimento gasto: -${foodCost} FSU.`
      );
    } else {
      // EMBUSH / COLLATERAL DAMAGE!
      setCombatEnemyScouted(false);
      const lostSoldiers = globalRNG.nextInt(5, 10);
      if (s.army.units.length > 0) {
        s.army.units[0].size = Math.max(2, s.army.units[0].size - lostSoldiers);
        s.army.units[0].morale = Math.max(1, s.army.units[0].morale - 1);
      }
      setCombatLog(prev => [
        ...prev,
        `EMBOSCADA INIMIGA (D20: ${d20} + ${spyMasterBonus} vs DC ${dc}): Seus batedores caíram em uma armadilha tática! Foram trucidados (-${lostSoldiers} homens, Moral caiu). Névoa de Guerra se mantém sobre as forças inimigas.`
      ]);
      generateNarrativeWithAI(
        `Batedores de flanco emboscados pelas linhas de frente inimigas de ${enemyUnit.name}.`,
        `Desastre tático: Patrulha de reconhecimento foi destruída pelas patrulhas táticas de ${enemyUnit.name}. Perdas de homens: -${lostSoldiers}, moral afetada.`
      );
    }
    setState(s);
  };

  const handleInvestigateSecret = (secId: string) => {
    const s = { ...state };
    const targetSec = s.worldSecrets?.find(x => x.id === secId);
    if (!targetSec) return;

    // 1. Dynamic Cost Formula
    const critMultiplier = { Low: 0.8, Medium: 1.0, High: 1.5, Critical: 2.2 }[targetSec.criticality || 'Medium'];
    const baseCost = Math.round(25 * critMultiplier);

    // Spymaster intelligence bonus
    const spyMasterName = s.advisors?.spyMasterName || "Barth";
    const spyMasterBonuses: { [key: string]: number } = {
      "Ren": 2, "Sylas": 3, "Kaelen": 5, "Lyra": 4, "Fiona": 3, "Valia": 2, "Morwen": 5, "Rook": 4
    };
    const spyMasterBonus = spyMasterBonuses[spyMasterName] || 2;

    if (s.weeklyLedger.silverdew < baseCost) {
      alert(`Nobre Lorde, a infiltração deste mistério de criticidade [${targetSec.criticality || 'Medium'}] exige no mínimo ${baseCost} SD para subornos táticos e preparativos!`);
      return;
    }

    // Deduct cost
    s.weeklyLedger.silverdew -= baseCost;

    // 2. Roll a d20
    const d20 = globalRNG.nextInt(1, 20);
    const dc = targetSec.difficultyClass || 14;
    const rollTotal = d20 + spyMasterBonus;

    // Logs for details
    let outcomeTitle = "";
    let outcomeLog = "";

    // 3. Outcomes
    if (rollTotal >= dc + 5) {
      // CRITICAL SUCCESS
      const progressGain = Math.min(100 - targetSec.investigationProgress, globalRNG.nextInt(45, 65)); // +45% to +65%
      targetSec.investigationProgress += progressGain;
      if (targetSec.investigationProgress >= 100) {
        targetSec.revealed = true;
        targetSec.investigationProgress = 100;
      }
      outcomeTitle = `SUCESSO CRÍTICO (D20: ${d20} + ${spyMasterBonus} vs DC ${dc})`;
      outcomeLog = `Seu Mestre dos Sussurros (${spyMasterName}) orquestrou um golpe brilhante nas sombras. Progresso aumentado em +${progressGain}%. Seus batedores permanecem indetectados e recolheram relatórios intactos.`;
    } else if (rollTotal >= dc) {
      // SUCCESS
      const progressGain = Math.min(100 - targetSec.investigationProgress, globalRNG.nextInt(25, 40)); // +25% to +40%
      targetSec.investigationProgress += progressGain;
      if (targetSec.investigationProgress >= 100) {
        targetSec.revealed = true;
        targetSec.investigationProgress = 100;
      }
      outcomeTitle = `SUCESSO (D20: ${d20} + ${spyMasterBonus} vs DC ${dc})`;
      outcomeLog = `Informações foram adquiridas com êxito. Progresso aumentado em +${progressGain}%.`;
    } else if (rollTotal >= dc - 4) {
      // PARTIAL FAILURE
      const progressGain = globalRNG.nextInt(5, 15); // +5% to +15%
      targetSec.investigationProgress = Math.min(100, targetSec.investigationProgress + progressGain);
      if (targetSec.investigationProgress >= 100) {
        targetSec.revealed = true;
        targetSec.investigationProgress = 100;
      }
      
      const compromiseRoll = globalRNG.next();
      const threshold = targetSec.compromisedChance || 0.15;
      if (compromiseRoll < threshold) {
        const randomHouse = globalRNG.pick(s.worldLedger.nobleHouses as any) as any;
        if (randomHouse) {
          adjustHouseOpinion(randomHouse, -1);
          outcomeLog = `SUSSURROS ESCASSOS (Espiões Expostos): Seus batedores conseguiram extrair poucos sussurros (+${progressGain}%), mas deixaram rastros na região. A Casa ${randomHouse.name} interceptou mensagens cifradas e sua opinião com você caiu para ${randomHouse.opinion}.`;
        } else {
          outcomeLog = `SUSSURROS ESCASSOS (Rede Tensa): Conseguiram pouco progresso (+${progressGain}%) mas tiveram que queimar refúgios temporários para evitar a captura pelas patrulhas locais.`;
        }
      } else {
        outcomeLog = `SUSSURROS ESCASSOS: Linhas de inteligência tensas. Conseguiram apenas +${progressGain}% de progresso, mas recuaram a tempo de evitar detecção direta.`;
      }
      outcomeTitle = `FALHA PARCIAL (D20: ${d20} + ${spyMasterBonus} vs DC ${dc})`;
    } else {
      // CRITICAL FAILURE
      outcomeTitle = `FALHA CRÍTICA (D20: ${d20} + ${spyMasterBonus} vs DC ${dc})`;
      const rollConsequence = globalRNG.nextInt(0, 2);
      if (rollConsequence === 0) {
        const randomHouse = globalRNG.pick(s.worldLedger.nobleHouses as any) as any;
        if (randomHouse) {
          adjustHouseOpinion(randomHouse, -2);
        }
        s.character.reputation = Math.max(0, s.character.reputation - 1);
        outcomeLog = `DETECÇÃO E EXPOSIÇÃO! Seus espiões foram capturados e enforcados publicamente na fortaleza. Sua rede local ruiu. Perdido -1 de Reputação e a Casa mais próxima ganhou ressentimento de intriga.`;
      } else if (rollConsequence === 1) {
        targetSec.corrupted = true;
        outcomeLog = `INFORMAÇÃO CORROMPIDA: Contra-espiões inimigos plantaram relatórios totalmente deturpados na sua correspondência! O mistério está CORROMPIDO e seu progresso congelado até que limpe a rede na Chancelaria por 25 SD.`;
      } else {
        const stolen = Math.min(s.weeklyLedger.silverdew, 45);
        s.weeklyLedger.silverdew -= stolen;
        outcomeLog = `CHANTAGEM DO SINDICATO: Mercenários interceptaram suas cartas e chantagearam sua tesouraria de ferro para manter segredo real (Drenados -${stolen} SD em subornos emergenciais).`;
      }
    }

    setState(s);
    generateNarrativeWithAI(
      `Comando de Espionagem: Financiar infiltração de "${targetSec.title}" liderada por seu mestre dos sussurros ${spyMasterName}.`,
      `Ação Conspiratória: ${outcomeTitle}. ${outcomeLog}`
    );
  };

  const handleCleanCorruptedSecret = (secId: string) => {
    const s = { ...state };
    const targetSec = s.worldSecrets?.find(x => x.id === secId);
    if (!targetSec) return;
    if (s.weeklyLedger.silverdew < 25) {
      alert("Silverdew (SD) insuficiente na tesouraria (necessário 25 SD) para purgar falsários!");
      return;
    }
    s.weeklyLedger.silverdew -= 25;
    targetSec.corrupted = false;
    setState(s);
    generateNarrativeWithAI(
      `Expulsar espiões duplos e purgar relatórios falsificados sobre o rumor "${targetSec.title}".`,
      `Chancelaria de Segredos: Gastou 25 SD. Rede limpa e restaurada com relatórios fidedignos.`
    );
  };

  const handleStartFalseLineage = () => {
    const s = { ...state };
    if (s.weeklyLedger.silverdew < 150) {
      alert("Moedas de Silverdew insuficientes! Iniciar a fraude dinástica de uma Falsa Linhagem Real exige 150 SD iniciais para subornar genealogistas da coroa e encomendar brasões antigos falsos.");
      return;
    }
    s.weeklyLedger.silverdew -= 150;
    s.falseLineage = {
      active: true,
      forgeryProgress: 5,
      weeklyUpkeep: 15, // drains 15 SD/week
      documentsForged: false,
      bribesPaid: false,
      exposureChance: 0.12, // 12% baseline chance per week once active
      isExposed: false
    };
    setState(s);
    generateNarrativeWithAI(
      "Iniciar a fraude de uma árvore genealógica real fictícia para clamar o trono real de sangue legítimo por direito falsificado.",
      "Conspiração de Sangue: Gastou 150 SD. Documentos iniciais começaram a ser forjados nas sombras."
    );
  };

  const handleProgressFalseLineage = () => {
    const s = { ...state };
    if (!s.falseLineage) return;
    if (s.weeklyLedger.silverdew < 40) {
      alert("Silverdew insuficiente (necessário 40 SD) para financiar os escribas criminosos e heráldicos corruptos!");
      return;
    }
    s.weeklyLedger.silverdew -= 40;

    const spyMasterName = s.advisors?.spyMasterName || "Barth";
    const spyMasterBonuses: { [key: string]: number } = {
      "Ren": 2, "Sylas": 3, "Kaelen": 5, "Lyra": 4, "Fiona": 3, "Valia": 2, "Morwen": 5, "Rook": 4
    };
    const spyMasterBonus = spyMasterBonuses[spyMasterName] || 2;

    const d20 = globalRNG.nextInt(1, 20);
    const dc = 15;
    const rollTotal = d20 + spyMasterBonus;

    let logMsg = "";
    if (rollTotal >= dc) {
      const p = Math.min(100 - s.falseLineage.forgeryProgress, globalRNG.nextInt(20, 30)); // +20% to +30%
      s.falseLineage.forgeryProgress += p;
      if (s.falseLineage.forgeryProgress >= 100) {
        s.falseLineage.forgeryProgress = 100;
        s.falseLineage.documentsForged = true;
        logMsg = `SUCESSO COMPLETO NA FORJA (D20: ${d20} + ${spyMasterBonus} vs DC ${dc}): Os documentos reais fictícios foram finalizados com selos de cera e pergaminhos envelhecidos legítimos! Você agora pode clamar direitos sanguíneos dinásticos na aba de Reivindicações, mas esteja de sobreaviso: manter esta farsa viva custará um fluxo gélido de 15 SD de silêncio por semana.`;
      } else {
        logMsg = `SUCESSO PARCIAL NA FORJA (D20: ${d20} + ${spyMasterBonus} vs DC ${dc}): Escribas avançaram o trabalho heráldico em +${p}% de progresso. Mais selos e depoimentos subornados estão sendo coordenados.`;
      }
    } else if (rollTotal >= dc - 4) {
      s.falseLineage.forgeryProgress = Math.min(100, s.falseLineage.forgeryProgress + 5);
      s.falseLineage.exposureChance = Math.min(0.5, s.falseLineage.exposureChance + 0.05);
      logMsg = `DIFICULDADE HERÁLDICA (D20: ${d20} + ${spyMasterBonus} vs DC ${dc}): Escribas imperiais desconfiaram dos registros antigos. Progresso avançou meros +5% e a chance de exposição semanal subiu para ${(s.falseLineage.exposureChance * 100).toFixed(0)}% devido a pontas soltas.`;
    } else {
      s.falseLineage.forgeryProgress = Math.max(0, s.falseLineage.forgeryProgress - 10);
      s.falseLineage.exposureChance = Math.min(0.6, s.falseLineage.exposureChance + 0.12);
      
      const compromiseRoll = globalRNG.next();
      if (compromiseRoll < 0.3) {
        const h = globalRNG.pick(s.worldLedger.nobleHouses as any) as any;
        if (h) {
          adjustHouseOpinion(h, -1);
          logMsg = `FALHA CRÍTICA NA CONSPIRAÇÃO (D20: ${d20} + ${spyMasterBonus} vs DC ${dc}): Seus agentes foram vistos nos arquivos da Catedral Real! Progresso caiu em -10% e a Casa ${h.name} suspeita do seu interesse heráldico (Opinião caiu para ${h.opinion}).`;
        } else {
          logMsg = `FALHA CRÍTICA NA CONSPIRAÇÃO (D20: ${d20} + ${spyMasterBonus} vs DC ${dc}): Seus conspiradores se desentenderam. Progresso retrocedeu em -10% e fofocas reais aumentaram sua exposição semanal em +12%.`;
        }
      } else {
        logMsg = `FALHA CRÍTICA NA CONSPIRAÇÃO: Escribas destruíram provas com medo das forcas! Progresso retrocedeu em -10% e a paranoia heráldica aumentou o risco de vazamentos.`;
      }
    }

    setState(s);
    generateNarrativeWithAI(
      "Financiar mais passos da fraude da árvore genealógica legítima de sua casa.",
      `Conspiração Real: Executada ação heráldica por seu espião. ${logMsg}`
    );
  };

  // --- DYNASTIC SUCCESSION ENGINE (STAGE 2/3) ---
  const handleAbdicateOrDie = (mode: 'abdicate' | 'death') => {
    const s = { ...state };
    
    const result = resolveDynasticSuccession(s, mode);
    if (!result.success) {
      alert("FIM DA LINHAGEM! Sua Casa não possui herdeiros vivos para assumir as rédeas do feudo. A dinastia ruiu sob as cinzas do tempo.");
      return;
    }

    s.worldLedger.notableDeaths.push({
      name: result.oldLordName,
      title: `Ex-Lord of the Keep`,
      date: `Week ${s.weeklyLedger.week}, Month ${s.weeklyLedger.month}`,
      cause: mode === 'abdicate' ? 'Exílio voluntário e meditação' : 'Morte natural decorrente de velhice na corte',
      successor: result.primaryHeirName || s.character.name
    });

    setState(s);
    setMenuMode('main');
    
    generateNarrativeWithAI(
      `Conduzir a solenidade dinástica onde ${result.oldLordName} ${mode === 'abdicate' ? 'abdica do trono em favor de' : 'falece na corte e repassa o selo de ferro para'} seu legítimo herdeiro, ${result.primaryHeirName}.`,
      `Sucessão Dinástica: O novo líder da Casa ${s.character.house} é ${s.character.name} (Idade: ${s.character.age} anos). A reputação heráldica da linhagem agora é de nível ${s.character.reputation}.`
    );
  };

  // --- ACQUIRE NICKNAMES ENGINE (PART 119) ---
  const handleAcquireNickname = (
    name: string, 
    type: 'Heroic' | 'Dark' | 'Fearsome' | 'Scandalous' | 'Amusing',
    effect: string,
    desc: string
  ) => {
    const s = { ...state };
    
    // Avoid duplicates
    if (s.character.nicknames.some(n => n.name === name)) {
      alert("Você já detém esta alcunha lendária em sua crônica heráldica!");
      return;
    }

    const newNickname = {
      name,
      earned: desc,
      date: `W${s.weeklyLedger.week}, M${s.weeklyLedger.month}`,
      effect
    };

    s.character.nicknames.push(newNickname);
    s.character.reputation += 1;

    setState(s);
    generateNarrativeWithAI(
      `O clamor dos homens e a crônica heráldica das Terras Despedaçadas começam a chamar você de "${name}".`,
      `Alcunha Adquirida: "${name}" (${type}). Efeito ativo: ${effect}. Reputação aumentada em +1.`
    );
  };

  // --- DETAILED SIEGE & NEGOTIATED SURRENDER (PART 121) ---
  const handleInitSiege = (targetHouseName: string) => {
    setSiegeTargetHouse(targetHouseName);
    setSiegeWeeks(1);
    setSiegeDefenderFood(8); // defender starts with 8 FSU
    setSiegeDefenderMorale(6);
    setSiegeReliefWeeks(6); // relief army in 6 weeks
    setSiegeIntelRevealed(false);
    setSiegeLog([`Cerco iniciado contra a fortaleza da ${targetHouseName}. Suas forças cercaram as muralhas inimigas e cortaram as rotas de abastecimento.`]);
    setMenuMode('siege');
  };

  const handleSiegeAction = (action: 'Maintain Siege' | 'Ultimatum' | 'Assault') => {
    if (!siegeTargetHouse) return;

    const s = { ...state };
    
    if (action === 'Maintain Siege') {
      // Maintaining siege costs 1 week, 2 FSU to player, and reduces defender food and morale
      if (s.weeklyLedger.food < 2) {
        alert("Suas forças não possuem mantimentos suficientes (mínimo 2.0 FSU) para manter o cerco por outra semana!");
        return;
      }

      // Process a week in the world
      const { updatedState, turnResult } = resolveWeeklyTurn(s);
      
      const newDefFood = Math.max(0, siegeDefenderFood - 2);
      const newDefMorale = Math.max(1, siegeDefenderMorale - 1);
      const newRelief = Math.max(0, siegeReliefWeeks - 1);
      const newSiegeWeeks = siegeWeeks + 1;

      setSiegeDefenderFood(newDefFood);
      setSiegeDefenderMorale(newDefMorale);
      setSiegeReliefWeeks(newRelief);
      setSiegeWeeks(newSiegeWeeks);

      let eventMsg = `Semana ${newSiegeWeeks} de Cerco. Defensores consumiram rações (Restam ${newDefFood} semanas de provisões, Moral: ${newDefMorale}). Reforços inimigos em ${newRelief} semanas.`;
      if (newRelief === 0) {
        eventMsg += " ALERTA: Forças de alívio inimigas chegaram e quebraram as linhas traseiras do cerco! Você foi forçado a recuar.";
        setMenuMode('main');
        updatedState.army.units[0].size = Math.max(5, updatedState.army.units[0].size - 10);
        setState(updatedState);
        generateNarrativeWithAI(
          `Sustentar o cerco à fortaleza da ${siegeTargetHouse}, mas as forças de alívio inimigas romperam o perímetro na retaguarda.`,
          `Cerco Malogrado: Suas tropas bateram em retirada estratégica. Custos semanais aplicados. Perdas de tropas: -10 homens.`
        );
        return;
      }

      setSiegeLog(prev => [...prev, eventMsg]);
      setState(updatedState);
      return;
    }

    if (action === 'Ultimatum') {
      // Calculate Surrender deterministically based on Part 121
      const playerHasIntimidating = s.character.nicknames.some(n => n.name === 'O Lobo de Ferro' || n.name === 'A Mão do Inverno');
      const playerIsOathbreaker = s.character.nicknames.some(n => n.name === 'O Quebrador de Juramentos');

      let outcome: 'Full Surrender' | 'Conditional Surrender' | 'No Surrender' | 'Fight to Death' = 'No Surrender';
      let outcomeDesc = "";

      if (playerIsOathbreaker) {
        outcome = 'Fight to Death';
        outcomeDesc = "LUTA ATÉ A MORTE: Os defensores sabem que você é um Quebrador de Juramentos sem honra e recusarão qualquer rendição, sabendo que serão executados de qualquer forma. Eles trancaram as portas e resistirão até o último homem.";
      } else if (siegeDefenderFood <= 2 && siegeDefenderMorale <= 3 && siegeReliefWeeks > 1) {
        outcome = 'Full Surrender';
        outcomeDesc = "RENDIÇÃO TOTAL: A fome corrói os defensores, o moral de armas desmoronou e não há esperança imediata de alívio. O comandante entrega as chaves da fortaleza de joelhos. Suas forças tomaram o forte sem derramamento de sangue!";
      } else if (playerHasIntimidating && siegeDefenderFood <= 4) {
        outcome = 'Conditional Surrender';
        outcomeDesc = "RENDIÇÃO CONDICIONAL: Temendo sua alcunha intimidadora, eles concordam em desarmar-se e entregar o castelo sob a única promessa de marchar livremente em exílio.";
      } else {
        outcome = 'No Surrender';
        outcomeDesc = "SEM RENDIÇÃO: 'Nossas muralhas são fortes e nossos aliados estão a caminho!' Eles se recusam a render-se.";
      }

      setSiegeLog(prev => [...prev, `[ULTIMATO] ${outcomeDesc}`]);

      if (outcome === 'Full Surrender' || outcome === 'Conditional Surrender') {
        // Reward player with gold and prestige
        s.weeklyLedger.silverdew += 150;
        s.character.reputation += 2;
        
        // Improve or change world standings
        const houseIdx = s.worldLedger.nobleHouses.findIndex(h => h.name === siegeTargetHouse);
        if (houseIdx !== -1) {
          s.worldLedger.nobleHouses[houseIdx].status = "Subjugada";
          setHouseOpinion(s.worldLedger.nobleHouses[houseIdx], -3); // they hate being taken but are vassalized
        }

        setState(s);
        generateNarrativeWithAI(
          `Enviar emissário heráldico com ultimato de rendição negociada às portas da fortaleza de ${siegeTargetHouse}.`,
          `Rendição Negociada: SUCESSO! A fortaleza capitulou. Tesouro: +150 SD pilhados, Reputação aumentada em +2. Status da ${siegeTargetHouse} atualizado para 'Subjugada'.`
        );
      }
      return;
    }

    if (action === 'Assault') {
      // Direct military clash
      const totalTroops = s.army.units.reduce((acc, u) => acc + u.size, 0);
      if (totalTroops < 30) {
        alert("Você necessita de ao menos 30 soldados ativos para tentar um assalto direto contra muralhas fortificadas!");
        return;
      }

      const wins = totalTroops > 60;
      let assaultMsg = "";
      
      if (wins) {
        s.weeklyLedger.silverdew += 100;
        s.character.reputation += 3;
        s.army.units[0].size = Math.max(10, s.army.units[0].size - 15); // took heavy losses
        
        const houseIdx = s.worldLedger.nobleHouses.findIndex(h => h.name === siegeTargetHouse);
        if (houseIdx !== -1) {
          s.worldLedger.nobleHouses[houseIdx].status = "Destruída";
          setHouseOpinion(s.worldLedger.nobleHouses[houseIdx], -3);
        }

        assaultMsg = "ASSALTO VITORIOSO: Suas divisões escalaram as muralhas sob fogo de flechas e conquistaram a fortaleza à força! O inimigo foi aniquilado, mas suas perdas foram severas (-15 soldados). +100 SD e +3 de Reputação.";
      } else {
        s.army.units[0].size = Math.max(5, s.army.units[0].size - 20); // terrible defeat
        assaultMsg = "ASSALTO FALHOU: Seus soldados foram repelidos com óleo fervente e flechas das muralhas altas. Recuo catastrófico registrado (-20 soldados).";
      }

      setSiegeLog(prev => [...prev, assaultMsg]);
      setState(s);
      
      generateNarrativeWithAI(
        `Ordenar assalto de armas direto e violento contra as defesas da fortaleza de ${siegeTargetHouse}.`,
        `Assalto Militar: ${assaultMsg}`
      );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-mono text-[#f2efeb] bg-[#111113] select-none">
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
              {state.character.title} // {state.character.archetype === "Noble Ruler" ? "Governante Nobre" : state.character.archetype === "Landed Knight" ? "Cavaleiro" : state.character.archetype === "Landless" ? "Sem Terras" : state.character.archetype === "Artificer" ? "Artífice" : "Necromante"}
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
          <div className="flex-1 p-8 overflow-y-auto space-y-4 min-h-[220px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e4e4e7]/50 mb-4">
              [INITIALIZING TURN_BLOCK: WEEK_{state.weeklyLedger.week}]
            </div>
            
            {narrativeHistory.slice(-8).map((para, idx) => {
              const isPlayer = para.startsWith("[JOGADOR]");
              return (
                <div 
                  key={idx} 
                  className={`font-mono text-xs md:text-[13px] leading-relaxed transition-all duration-300 rounded-sm ${
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
                    Casas nobres de territórios distantes encontram-se ocultas de vossas redes de sussurros.
                  </p>
                  <button
                    onClick={handleSendScouts}
                    className="w-full py-1.5 bg-cyan-950/20 hover:bg-cyan-950/40 border border-[#00e5ff]/30 hover:border-[#00e5ff] text-[#00e5ff] text-[9px] font-mono font-bold uppercase transition cursor-pointer"
                  >
                    Enviar Espiões (-30 SD)
                  </button>
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
