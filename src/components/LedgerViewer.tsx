import React, { useState } from "react";
import { CampaignState } from "../types";
import { Shield, Coins, Users, Landmark, Globe, X } from "lucide-react";

interface LedgerViewerProps {
  state: CampaignState;
  onClose: () => void;
}

export function LedgerViewer({ state, onClose }: LedgerViewerProps) {
  const [tab, setTab] = useState<'character' | 'finances' | 'military' | 'holdings' | 'world' | 'villages' | 'councils' | 'spyCommerce' | 'militaryInventory' | 'artifacts'>('character');

  return (
    <div className="fixed inset-0 bg-[#0D0D0E]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-[#0F0F12] border-2 border-[#2D2D30] max-w-5xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#151518] p-4 border-b border-[#2D2D30]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#F2A900]" /> REGISTRO OFICIAL DE LEDGERS // SEC_REGISTRY
            </h2>
            <p className="text-[#888] text-[10px] uppercase mt-0.5">
              Semana {state.weeklyLedger.week} de {state.worldLedger.currentDate.month.replace("_", " ")}, Ano {state.worldLedger.currentDate.year} | Modo: {state.character.archetype}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2D2D30] text-[#888] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#2D2D30] bg-[#151518] text-[10px] font-bold overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setTab('character')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'character' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.1 PERSONAGEM
          </button>
          <button
            onClick={() => setTab('finances')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'finances' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.2 TESOURARIA
          </button>
          <button
            onClick={() => setTab('military')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'military' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.3 EXÉRCITO
          </button>
          <button
            onClick={() => setTab('holdings')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'holdings' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.4 PROPRIEDADES
          </button>
          <button
            onClick={() => setTab('world')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'world' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.5 NOBREZA & CASAS
          </button>
          <button
            onClick={() => setTab('villages')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'villages' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.V VILAREJOS & POSTOS
          </button>
          <button
            onClick={() => setTab('councils')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'councils' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.C CONSELHOS
          </button>
          <button
            onClick={() => setTab('spyCommerce')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'spyCommerce' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.S ESPIONAGEM & COMÉRCIO
          </button>
          <button
            onClick={() => setTab('militaryInventory')}
            className={`flex items-center gap-2 px-4 py-3 border-r border-[#2D2D30] shrink-0 transition uppercase tracking-wider ${
              tab === 'militaryInventory' ? 'bg-[#0F0F12] text-[#F2A900] border-b-2 border-b-[#F2A900]' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.I ESTOQUE & FORÇAS
          </button>
          <button
            onClick={() => setTab('artifacts')}
            className={`flex items-center gap-2 px-4 py-3 shrink-0 transition uppercase tracking-wider ${
              tab === 'artifacts' ? 'bg-[#0F0F12] text-amber-500 border-b-2 border-b-amber-500' : 'text-[#666] hover:text-[#D1D1D1]'
            }`}
          >
            G.A ARTEFATOS & SEGREDOS
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 p-5 overflow-y-auto text-[#D1D1D1] text-xs bg-[#09090A]/80">
          
          {/* TAB 1: CHARACTER (G.1) */}
          {tab === 'character' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Profile Card */}
              <div className="border border-[#2D2D30] bg-[#151518]/60 p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Identidade do Personagem</h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between"><span>Nome:</span> <span className="text-white font-bold">{state.character.name}</span></div>
                  <div className="flex justify-between"><span>Casa Nobre:</span> <span className="text-white font-bold">{state.character.house}</span></div>
                  <div className="flex justify-between"><span>Título:</span> <span className="text-white font-bold">{state.character.title}</span></div>
                  <div className="flex justify-between"><span>Arquetipo:</span> <span className="text-[#00E5FF] font-bold">{state.character.archetype}</span></div>
                  <div className="flex justify-between"><span>Idade:</span> <span className="text-white">{state.character.age} anos</span></div>
                  <div className="flex justify-between"><span>Gênero:</span> <span className="text-white">{state.character.gender}</span></div>
                  <div className="flex justify-between"><span>Local Atual:</span> <span className="text-amber-500 font-bold">{state.character.location.landmark} ({state.character.location.region})</span></div>
                </div>
              </div>

              {/* Combat Equipment Card */}
              <div className="border border-[#2D2D30] bg-[#151518]/60 p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Equipamento Pessoal</h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between"><span>Arma Principal:</span> <span className="text-white">{state.character.stats.weapon} ({state.character.stats.weaponQuality})</span></div>
                  <div className="flex justify-between"><span>Escudo:</span> <span className="text-white">{state.character.stats.shield} ({state.character.stats.shieldQuality})</span></div>
                  <div className="flex justify-between"><span>Montaria:</span> <span className="text-white">{state.character.stats.mount} ({state.character.stats.mountQuality})</span></div>
                  <div className="flex justify-between"><span>Classe de Armadura (AC):</span> <span className="text-emerald-500 font-bold">{state.character.stats.ac} AC</span></div>
                  <div className="flex justify-between"><span>Iniciativa Bônus:</span> <span className="text-emerald-400 font-bold">+{state.character.stats.initiativeBonus}</span></div>
                </div>
              </div>

              {/* Necromancy / Special Stats if applicable */}
              {state.character.soulEssence !== undefined && (
                <div className="border border-purple-900/40 bg-purple-950/5 p-4 md:col-span-2">
                  <h3 className="text-purple-400 font-bold text-xs mb-3 border-b border-purple-900/40 pb-1.5 uppercase">// Dados de Necromancia</h3>
                  <div className="grid grid-cols-3 gap-4 text-[11px]">
                    <div>Essência de Alma: <span className="text-purple-400 font-bold">{state.character.soulEssence}</span></div>
                    <div>Controle Usado: <span className="text-white font-bold">{state.character.controlUsed} / {state.character.controlLimit} Skeletons</span></div>
                    <div>Estado de Lich: <span className="text-white">{state.character.isLich ? "Transformação Completa (Imortal)" : "Humano Mortal"}</span></div>
                  </div>
                </div>
              )}

              {/* Banner Details */}
              <div className="border border-[#2D2D30] bg-[#151518]/60 p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Símbolos e Estandarte</h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between"><span>Cores:</span> <span className="text-white font-bold">{state.character.banner.colors}</span></div>
                  <div className="flex justify-between"><span>Símbolo:</span> <span className="text-white font-bold">{state.character.banner.symbol}</span></div>
                  <div className="flex justify-between"><span>Lema da Casa:</span> <span className="text-amber-500 italic">"{state.character.banner.motto}"</span></div>
                </div>
              </div>

              {/* Backstory & Appearance */}
              <div className="border border-[#2D2D30] bg-[#151518]/60 p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Biografia e Aparência</h3>
                <div className="space-y-3 text-[11px] leading-relaxed text-slate-300">
                  <div><span className="text-[#666] uppercase block text-[9px] tracking-tight">Aparência:</span> <p className="text-white mt-0.5">{state.character.flavorDetail}</p></div>
                  <div><span className="text-[#666] uppercase block text-[9px] tracking-tight">Antecedentes:</span> <p className="text-white mt-0.5">{state.character.backstory}</p></div>
                </div>
              </div>

              {/* Dynastic Lineage Card */}
              <div className="border border-pink-900/40 bg-pink-950/5 p-4 md:col-span-1">
                <h3 className="text-pink-400 font-bold text-xs mb-3 border-b border-pink-900/40 pb-1.5 uppercase">// LINHAGEM DINÁSTICA DA CASA {state.character.house}</h3>
                <div className="space-y-3 text-[11px]">
                  {state.family?.spouse ? (
                    <div className="space-y-1 bg-[#151518]/40 p-2 border border-pink-900/30">
                      <div className="flex justify-between"><span>Cônjuge Imperial:</span> <span className="text-white font-bold">{state.family.spouse.name}</span></div>
                      <div className="flex justify-between"><span>Idade do Cônjuge:</span> <span className="text-white">{state.family.spouse.age} anos</span></div>
                      <div className="flex justify-between"><span>Afeto Senhorial:</span> <span className="text-pink-400 font-bold">{'♥'.repeat(state.family.spouse.affection)}</span></div>
                      {state.family.pregnancyWeekRemaining !== undefined && (
                        <div className="text-pink-300 animate-pulse text-[10px] mt-1 text-center bg-pink-950/30 border border-pink-800 p-1 font-bold">
                          Gestação de Herdeiro ativo ({state.family.pregnancyWeekRemaining} semanas para o parto)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[#666] italic bg-black/20 p-2 text-center">Nenhum matrimônio real firmado. Procure o menu de Dinastia na corte.</div>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-[#888] font-bold block">Filhos e Herdeiros Legítimos:</span>
                    {state.family?.children?.length === 0 ? (
                      <div className="text-[10px] text-[#555] italic pl-2">Nenhum herdeiro nascido na linhagem senhorial ativa.</div>
                    ) : (
                      <div className="space-y-1">
                        {state.family?.children?.map((c, cIdx) => (
                          <div key={cIdx} className="p-1.5 bg-[#151518]/30 border border-[#2D2D30] text-[10px] flex justify-between items-center">
                            <div>
                              <span className="font-bold text-white">{c.name}</span>
                              <span className="text-[8px] text-[#666] block">Idade: {c.age} anos | {c.gender === 'Male' ? 'Masculino' : 'Feminino'}</span>
                            </div>
                            {c.isHeir && <span className="text-[8px] bg-yellow-950 text-yellow-500 border border-yellow-800 px-1 font-bold">Herdeiro</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Claimed Crowns Card */}
              <div className="border border-yellow-900/40 bg-yellow-950/5 p-4 md:col-span-1">
                <h3 className="text-yellow-500 font-bold text-xs mb-3 border-b border-yellow-900/40 pb-1.5 uppercase">// COROAS E LEGITIMAÇÃO REIVINDICADA</h3>
                <div className="space-y-2 text-[11px]">
                  {state.crowns?.filter(c => c.unlocked).length === 0 ? (
                    <div className="text-[#666] italic bg-black/20 p-2 text-center">Nenhuma das Oito Coroas foi reivindicada por direito senhorial.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {state.crowns?.filter(c => c.unlocked).map((c) => (
                        <div key={c.id} className="p-1.5 bg-yellow-950/20 border border-yellow-800/50 flex justify-between items-center">
                          <span className="text-yellow-400 font-bold">{c.name}</span>
                          <span className="text-[8px] bg-yellow-950 text-yellow-500 border border-yellow-800 px-1">SOBERANO</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1 border-t border-yellow-900/20">
                    <span className="text-[#888] font-bold block">Progresso de Unificação Regional:</span>
                    <div className="text-[10px] space-y-1">
                      {state.crowns?.map((c) => (
                        <div key={c.id} className="flex justify-between items-center text-[9px] text-slate-400">
                          <span>{c.name.split(' (')[0]}:</span>
                          <span className={c.unlocked ? 'text-yellow-400 font-bold' : 'text-neutral-600'}>
                            {c.unlocked ? 'Coroado (Legítimo)' : 'Sem direito ativo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TREASURY (G.2) */}
          {tab === 'finances' && (
            <div className="space-y-4">
              {/* Financial Balance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-[#2D2D30] bg-[#151518] p-4 text-center">
                  <span className="text-[#666] text-[10px] block mb-1">SALDO ATUAL</span>
                  <div className="text-xl font-bold text-[#F2A900]">{state.weeklyLedger.silverdew} SD</div>
                  <span className="text-[9px] text-[#555]">Silverdew Coins</span>
                </div>
                <div className="border border-[#2D2D30] bg-[#151518] p-4 text-center">
                  <span className="text-[#666] text-[10px] block mb-1">MANTIMENTOS</span>
                  <div className="text-xl font-bold text-emerald-500">{state.weeklyLedger.food.toFixed(1)} FSU</div>
                  <span className="text-[9px] text-[#555]">Food Supply Units</span>
                </div>
                <div className="border border-[#2D2D30] bg-[#151518] p-4 text-center flex flex-col justify-center">
                  <span className="text-[#666] text-[10px] block mb-1">MATERIAIS DE STORAGE</span>
                  <div className="text-[11px] font-bold text-[#00E5FF] mt-1">
                    Madeira: {state.weeklyLedger.materials.timber} SU | Ferro: {state.weeklyLedger.materials.iron} SU
                  </div>
                </div>
              </div>

              {/* Weekly Ledger Sheet */}
              <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Balanço Semanal (Ledger de Gastos)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]">
                  {/* Income column */}
                  <div>
                    <h4 className="text-emerald-500 font-bold border-b border-emerald-950 pb-1 mb-2 uppercase">// Fontes de Receita</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span>Renda de Feudo Base:</span> <span className="text-white">+{state.weeklyLedger.incomeDetail.holdings} SD</span></div>
                      <div className="flex justify-between"><span>Patches de Recursos:</span> <span className="text-white">+{state.weeklyLedger.incomeDetail.patches} SD</span></div>
                      <div className="flex justify-between"><span>Comércio & Caravanas:</span> <span className="text-white">+{state.weeklyLedger.incomeDetail.trade} SD</span></div>
                      <div className="flex justify-between"><span>Impostos & Taxas:</span> <span className="text-white">+{state.weeklyLedger.incomeDetail.taxes} SD</span></div>
                    </div>
                  </div>

                  {/* Expenses column */}
                  <div>
                    <h4 className="text-rose-500 font-bold border-b border-rose-950 pb-1 mb-2 uppercase">// Despesas Semanais</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span>Soldos da Tropa (Wages):</span> <span className="text-white">-{state.weeklyLedger.expenseDetail.wages} SD</span></div>
                      <div className="flex justify-between"><span>Manutenção da Guarnição:</span> <span className="text-white">-{state.weeklyLedger.expenseDetail.garrison} SD</span></div>
                      <div className="flex justify-between"><span>Compra de Alimentos:</span> <span className="text-white">-{state.weeklyLedger.expenseDetail.foodPurchases} SD</span></div>
                      <div className="flex justify-between"><span>Salários de Especialistas:</span> <span className="text-white">-{state.weeklyLedger.expenseDetail.engineerWages} SD</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARMY & FLEET (G.3) */}
          {tab === 'military' && (
            <div className="space-y-4">
              {/* Force Overview */}
              <div className="grid grid-cols-2 gap-4 text-[11px] border border-[#2D2D30] bg-[#151518] p-3">
                <div>Força de Campo Total: <span className="text-white font-bold">{state.army.units.reduce((acc, u) => acc + u.size, 0)} soldados</span></div>
                <div>Tamanho de Guarnição: <span className="text-white font-bold">{state.army.garrisonSize} soldados (Estacionados)</span></div>
              </div>

              {/* Units Table */}
              <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 overflow-x-auto">
                <h3 className="text-white font-bold text-xs mb-3 uppercase">// Unidades Militares Registradas</h3>
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2D2D30] text-[#666]">
                      <th className="py-1.5">NOME DO BANDO</th>
                      <th className="py-1.5">QUANTIDADE</th>
                      <th className="py-1.5">TIPO / TIER</th>
                      <th className="py-1.5">ARMADURA (AC)</th>
                      <th className="py-1.5">ARMA PRINCIPAL</th>
                      <th className="py-1.5">MORAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.army.units.map((u, i) => (
                      <tr key={u.id} className={`border-b border-neutral-900 text-slate-300 ${i % 2 === 0 ? 'bg-[#151518]/30' : ''}`}>
                        <td className="py-1.5 font-bold text-white">{u.name}</td>
                        <td className="py-1.5">{u.size} / {u.maxSize} homens</td>
                        <td className="py-1.5">Tier {u.tier} ({u.type || "Infanteria"})</td>
                        <td className="py-1.5">{u.ac} AC</td>
                        <td className="py-1.5">{u.weapon}</td>
                        <td className="py-1.5">
                          <span className={u.morale >= 4 ? "text-emerald-500 font-bold" : "text-amber-500"}>{u.morale}/6</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: HOLDINGS & PAT_RESOURCES (G.4) */}
          {tab === 'holdings' && (
            state.character.archetype === 'Landless' || (state.holdings.population === 0 && state.holdings.resourcePatches.length === 0) ? (
              <div className="border border-[#2D2D30] bg-[#121215] p-8 text-center space-y-4">
                <div className="inline-block p-2.5 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-sm">
                  <h3 className="font-bold text-xs uppercase tracking-widest">// CONDIÇÃO: BANDO SEM TERRAS (LANDLESS)</h3>
                </div>
                <p className="text-xs text-[#AAA] max-w-xl mx-auto leading-relaxed">
                  Vossa companhia de armas não possui feudo, fortaleza ou domínio senhorial. 
                  Vocês mantêm um <strong>Acampamento de Marcha</strong> a céu aberto nos arredores de {state.character.location.landmark || 'Grey Keep'} ({state.character.location.region || 'Central Plains'}).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs pt-4 border-t border-[#2D2D30]/60">
                  <div className="bg-[#18181C] p-3 border border-[#2D2D30]">
                    <span className="text-[#666] block uppercase text-[10px]">Efetivo do Bando</span>
                    <span className="text-white font-bold">{state.army.units.reduce((acc, u) => acc + (u.size || 0), 0)} Homens em Armas</span>
                  </div>
                  <div className="bg-[#18181C] p-3 border border-[#2D2D30]">
                    <span className="text-[#666] block uppercase text-[10px]">Cofre da Companhia</span>
                    <span className="text-[#F2A900] font-bold">{state.weeklyLedger.silverdew} Moedas de Prata</span>
                  </div>
                  <div className="bg-[#18181C] p-3 border border-[#2D2D30]">
                    <span className="text-[#666] block uppercase text-[10px]">Provisões de Estrada</span>
                    <span className="text-emerald-400 font-bold">{state.weeklyLedger.food.toFixed(0)} Fardos de Ração</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#666] italic pt-2">
                  Castelos, forjas e feudos vassalos poderão ser conquistados, tomados por armas ou concedidos por senhores durante a campanha.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Holding Details */}
                <div className="border border-[#2D2D30] bg-[#151518]/60 p-4">
                  <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Propriedade Senhorial</h3>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between"><span>Nome do Assento:</span> <span className="text-white font-bold">{state.holdings.name}</span></div>
                    <div className="flex justify-between"><span>Tipo de Assento:</span> <span className="text-white">{state.holdings.type} (Tier {state.holdings.tier})</span></div>
                    <div className="flex justify-between"><span>População Local:</span> <span className="text-white">{state.holdings.population} cidadãos</span></div>
                    <div className="flex justify-between"><span>Mão de Obra Ativa:</span> <span className="text-white">{state.holdings.laborPool} adultos (40%)</span></div>
                    <div className="flex justify-between"><span>Fortificação:</span> <span className="text-white">{state.holdings.fortification.type}</span></div>
                    <div className="flex justify-between"><span>Bônus de Muralha:</span> <span className="text-emerald-400 font-bold">+{state.holdings.fortification.acBonus} AC</span></div>
                  </div>
                </div>

                {/* Resident Smith Card */}
                <div className="border border-[#2D2D30] bg-[#151518]/60 p-4">
                  <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Ferreiro Residente (G.35)</h3>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between"><span>Mestre Ferreiro:</span> <span className="text-white font-bold">{state.holdings.residentSmith.name}</span></div>
                    <div className="flex justify-between"><span>Nível de Forja:</span> <span className="text-white">Lvl {state.holdings.residentSmith.level} / 5</span></div>
                    <div className="flex justify-between"><span>Especialidade:</span> <span className="text-[#00E5FF]">{state.holdings.residentSmith.specialty}</span></div>
                    <div className="flex justify-between"><span>Experiência (XP):</span> <span className="text-slate-400">{state.holdings.residentSmith.xp} / 100 XP</span></div>
                  </div>
                </div>

                {/* Resource Patches */}
                <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 md:col-span-2 overflow-x-auto">
                  <h3 className="text-white font-bold text-xs mb-3 uppercase">// Patches de Recursos Ativos</h3>
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#2D2D30] text-[#666]">
                        <th className="py-1.5">NOME DO PATCH</th>
                        <th className="py-1.5">TIPO</th>
                        <th className="py-1.5">QUALIDADE</th>
                        <th className="py-1.5">RENDIMENTO / DIA</th>
                        <th className="py-1.5">TRABALHADORES (LABOR)</th>
                        <th className="py-1.5">RENDA / MÊS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.holdings.resourcePatches.map((p, i) => (
                        <tr key={p.id} className={`border-b border-neutral-900 text-slate-300 ${i % 2 === 0 ? 'bg-[#151518]/30' : ''}`}>
                          <td className="py-1.5 font-bold text-white">{p.name}</td>
                          <td className="py-1.5">{p.type}</td>
                          <td className="py-1.5">{p.quality}</td>
                          <td className="py-1.5 text-emerald-500 font-bold">+{p.yieldPerDay} SU</td>
                          <td className="py-1.5">{p.laborRequired} alocados</td>
                          <td className="py-1.5 text-[#F2A900] font-bold">+{p.incomePerDay * 30} SD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* TAB 5: WORLD STATE (G.W) */}
          {tab === 'world' && (
            <div className="space-y-4">
              {/* Rare Event Status */}
              <div className="border border-[#2D2D30] bg-[#151518]/60 p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Status de Eventos Raros Continentais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="flex justify-between border-b border-[#2D2D30]/30 pb-1.5">
                    <span>Ano Quente (Warm Year):</span>
                    <span className={state.worldLedger.rareEventStatus.warmYear.active ? "text-[#F2A900] font-bold" : "text-[#555]"}>
                      {state.worldLedger.rareEventStatus.warmYear.active ? "ATIVO (Sem Neve)" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#2D2D30]/30 pb-1.5">
                    <span>Jovem Pretendente (Pretender):</span>
                    <span className={state.worldLedger.rareEventStatus.youngPretender.active ? "text-[#F2A900] font-bold" : "text-[#555]"}>
                      {state.worldLedger.rareEventStatus.youngPretender.active ? `Ativo em ${state.worldLedger.rareEventStatus.youngPretender.region}` : "Inativo"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#2D2D30]/30 pb-1.5">
                    <span>Migração de Ursos da Neve:</span>
                    <span className={state.worldLedger.rareEventStatus.snowBearMigration.active ? "text-[#F2A900] font-bold" : "text-[#555]"}>
                      {state.worldLedger.rareEventStatus.snowBearMigration.active ? "ATIVO" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#2D2D30]/30 pb-1.5">
                    <span>Viajante Cego (Blind Traveler):</span>
                    <span className={state.worldLedger.rareEventStatus.blindTraveler.active ? "text-rose-500 font-bold" : "text-[#555]"}>
                      {state.worldLedger.rareEventStatus.blindTraveler.active ? "APARECEU NA VILA" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Relações entre Facções */}
              <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 overflow-x-auto">
                <h3 className="text-white font-bold text-xs mb-3 uppercase">// Matriz de Opinião e Relações</h3>
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2D2D30] text-[#666]">
                      <th className="py-1.5">CASA NOBRE</th>
                      <th className="py-1.5">REGIÃO</th>
                      <th className="py-1.5">ASSENTO PRINCIPAL</th>
                      <th className="py-1.5">SENHOR ATUAL</th>
                      <th className="py-1.5">OPINIÃO ATUAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.worldLedger.nobleHouses.map((h, i) => (
                      <tr key={h.name} className={`border-b border-neutral-900 text-slate-300 ${i % 2 === 0 ? 'bg-[#151518]/30' : ''}`}>
                        <td className="py-1.5 font-bold text-white">{h.name}</td>
                        <td className="py-1.5">{h.region}</td>
                        <td className="py-1.5">{h.seat}</td>
                        <td className="py-1.5">{h.currentLord}</td>
                        <td className="py-1.5">
                          <span className={h.opinion > 0 ? "text-emerald-500 font-bold" : h.opinion < 0 ? "text-rose-500 font-bold" : "text-[#666]"}>
                            {h.opinion > 0 ? `+${h.opinion}` : h.opinion} ({h.opinion === 3 ? "Leal" : h.opinion === 2 ? "Amigável" : h.opinion === 1 ? "Favorável" : h.opinion === -1 ? "Desconfiado" : h.opinion === -2 ? "Inimigo" : h.opinion === -3 ? "Guerra de Sangue" : "Neutro"})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: VILLAGES & OUTPOSTS (G.V) */}
          {tab === 'villages' && (
            <div className="space-y-6">
              {/* Villages Section */}
              <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Vilarejos e Alianças Regionais (G.V)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#2D2D30] text-[#666]">
                        <th className="py-1.5">NOME DO VILAREJO</th>
                        <th className="py-1.5">STATUS ADMINISTRAÇÃO</th>
                        <th className="py-1.5">DIREÇÃO & DISTÂNCIA</th>
                        <th className="py-1.5">PRODUTOS</th>
                        <th className="py-1.5">RELAÇÃO / NOTAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(state.holdings?.villages || state.worldLedger?.villages || []).length > 0 ? (
                        (state.holdings?.villages || state.worldLedger?.villages || []).map((v: any, i: number) => (
                          <tr key={v.name} className={`border-b border-neutral-900 text-slate-300 ${i % 2 === 0 ? 'bg-[#151518]/30' : ''}`}>
                            <td className="py-2.5 font-bold text-white">{v.name}</td>
                            <td className="py-2.5">
                              <span className={`px-1.5 py-0.5 font-bold text-[10px] ${
                                v.status?.includes('Protectorate') || v.status === 'Protectorate' ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/40' :
                                v.status?.includes('Embargo') || v.status === 'Embargoed' ? 'text-amber-500 bg-amber-950/20 border border-amber-900/40' :
                                v.status === 'Burnt' ? 'text-red-500 bg-red-950/20 border border-red-900/40' :
                                v.status === 'Independent' ? 'text-cyan-400 bg-cyan-950/20 border border-cyan-900/40' :
                                'text-slate-300 bg-slate-900/20 border border-slate-800'
                              }`}>
                                {v.status === 'Protectorate' ? 'Protetorado' :
                                 v.status === 'Embargoed' || v.status?.includes('Embargo') ? 'Embargado' :
                                 v.status === 'Burnt' ? 'Cinzas' :
                                 v.status === 'Independent' ? 'Independente' : v.status || 'Não Contatado'}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-300 font-mono">
                              {v.direction ? `${v.direction} (${v.distanceDays} dias)` : v.subordination || '—'}
                            </td>
                            <td className="py-2.5 text-amber-500/90 font-mono">{v.products || '—'}</td>
                            <td className="py-2.5 text-slate-400 leading-normal italic">{v.notes || v.relation}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">Nenhum vilarejo registrado neste ledger.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outposts Section */}
              <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Fortes & Postos de Observação Ativos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#2D2D30] text-[#666]">
                        <th className="py-1.5">NOME DO POSTO</th>
                        <th className="py-1.5">NÍVEL / TIPO</th>
                        <th className="py-1.5">GUARNIÇÃO ATIVA</th>
                        <th className="py-1.5">SUPRIMENTOS / DIRETRIZES</th>
                        <th className="py-1.5">NOTAS OPERACIONAIS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(state.holdings?.otherHoldings || state.worldLedger?.outposts || []).length > 0 ? (
                        (state.holdings?.otherHoldings || state.worldLedger?.outposts || []).map((o: any, i: number) => (
                          <tr key={o.name} className={`border-b border-neutral-900 text-slate-300 ${i % 2 === 0 ? 'bg-[#151518]/30' : ''}`}>
                            <td className="py-2.5 font-bold text-white">{o.name}</td>
                            <td className="py-2.5 text-cyan-400 font-mono">{o.type || `Tier ${o.tier}`}</td>
                            <td className="py-2.5 font-bold text-emerald-400">{o.garrison} soldados</td>
                            <td className="py-2.5 font-bold text-[#F2A900]">
                              {o.incomePerWeek !== undefined ? `+${o.incomePerWeek} SD/semana` : o.incomeBonus !== undefined ? `+${o.incomeBonus} SD/mês` : `Suprimento de ${o.supplyFrom || 'Valenfort'}`}
                            </td>
                            <td className="py-2.5 text-slate-400 leading-normal">{o.function || o.notes}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">Nenhum posto avançado registrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tribal Relations */}
              <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Clãs & Matriz de Relações Tribais</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#2D2D30] text-[#666]">
                        <th className="py-1.5">CLÃ / TRIBO</th>
                        <th className="py-1.5">LÍDER / CHEFE</th>
                        <th className="py-1.5">ESTADO DA RELAÇÃO</th>
                        <th className="py-1.5">FORÇA ESTIMADA</th>
                        <th className="py-1.5">DETALHES DE DIPLOMACIA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(state.tribalRelations || state.worldLedger?.tribalRelations || []).length > 0 ? (
                        (state.tribalRelations || state.worldLedger?.tribalRelations || []).map((t: any, i: number) => (
                          <tr key={t.group || t.tribeName} className={`border-b border-neutral-900 text-slate-300 ${i % 2 === 0 ? 'bg-[#151518]/30' : ''}`}>
                            <td className="py-2.5 font-bold text-white">{t.group || t.tribeName}</td>
                            <td className="py-2.5">{t.leader || t.location}</td>
                            <td className="py-2.5">
                              <span className={`px-1.5 py-0.5 font-bold text-[10px] ${
                                t.opinion === 'Friendly' || t.relation === 'Amigável' ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/40' :
                                t.opinion === 'Neutral' || t.relation === 'Neutro' ? 'text-slate-300 bg-slate-900/20 border border-slate-800' :
                                t.opinion === 'Hostile' || t.relation === 'Hostil' ? 'text-red-400 bg-red-950/20 border border-red-900/40' :
                                'text-[#ff7777] bg-red-950/10 border border-red-900/20'
                              }`}>
                                {t.opinion === 'Friendly' || t.relation === 'Amigável' ? 'Amigável' :
                                 t.opinion === 'Neutral' || t.relation === 'Neutro' ? 'Neutro' :
                                 t.opinion === 'Hostile' || t.relation === 'Hostil' ? 'Hostil' : t.status || 'Eliminado'}
                              </span>
                            </td>
                            <td className="py-2.5 text-amber-500 font-mono">{t.soldiersEstimate || t.strength || 'Desconhecido'}</td>
                            <td className="py-2.5 text-slate-400 leading-normal">{t.details || t.notes}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">Nenhum clã registrado ou visível.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: COUNCILS (G.C) */}
          {tab === 'councils' && (
            <div className="space-y-6">
              {(() => {
                let councilsList: any[] = [];
                if (state.councils) {
                  if (Array.isArray(state.councils)) {
                    councilsList = state.councils;
                  } else {
                    councilsList = Object.values(state.councils).filter(c => c && typeof c === 'object');
                  }
                } else if (state.worldLedger?.councils) {
                  councilsList = state.worldLedger.councils;
                }

                if (councilsList.length > 0) {
                  return councilsList.map((council: any) => {
                    const fundVal = typeof council.emergencyFund === 'object' ? council.emergencyFund.size : council.emergencyFund || 0;
                    return (
                      <div key={council.name} className="border border-[#2D2D30] bg-[#0F0F12] p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2D2D30] pb-2 gap-2">
                          <div>
                            <h3 className="text-white font-bold text-xs uppercase flex items-center gap-2">
                              <Landmark className="w-4 h-4 text-[#F2A900]" /> {council.name}
                            </h3>
                            {council.nature && <span className="text-[9px] text-[#888] font-mono uppercase">{council.nature}</span>}
                          </div>
                          <span className="text-[10px] bg-amber-950/30 border border-amber-900/40 text-[#F2A900] px-2 py-0.5 font-bold font-mono">
                            Fundo de Emergência: {fundVal} SD
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Seats/Members table */}
                          <div>
                            <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">Assentos do Conselho</h4>
                            <div className="space-y-1.5">
                              {council.seats?.map((seat: any, sIdx: number) => (
                                <div key={sIdx} className="flex justify-between items-center bg-[#151518]/40 p-2 border border-neutral-900 text-xs">
                                  <div>
                                    <span className="font-bold text-white block text-xs">
                                      {seat.name || seat.representative}
                                    </span>
                                    <span className="text-[9px] text-[#666] uppercase">
                                      {seat.role || `Casa ${seat.house}`}
                                    </span>
                                  </div>
                                  <div className="flex gap-4 font-mono text-[10px] shrink-0">
                                    {seat.disposition !== undefined && (
                                      <div>Apreço/Votos: <span className="text-emerald-400 font-bold">{seat.disposition || seat.votes}</span></div>
                                    )}
                                    {seat.loyalty !== undefined && (
                                      <div>Lealdade/Status: <span className="text-[#00E5FF] font-bold">{seat.loyalty || seat.status}</span></div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Agendas & Rules */}
                          <div>
                            {(() => {
                              const agendas = council.pendingAgendas || council.pendingAgenda;
                              if (!agendas) return null;
                              return (
                                <div className="mb-4">
                                  <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">Agendas & Pautas Pendentes</h4>
                                  <div className="space-y-2">
                                    {agendas.length > 0 ? (
                                      agendas.map((agenda: string, aIdx: number) => (
                                        <div key={aIdx} className="p-2.5 bg-[#151518] border border-l-2 border-neutral-800 border-l-[#F2A900] text-[11px] leading-relaxed text-slate-300 font-mono">
                                          &gt; {agenda}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-3 text-center text-[#555] italic border border-neutral-900">Nenhuma pauta pendente registrada.</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {council.rules && (
                              <div>
                                <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">Regras & Protocolos</h4>
                                <div className="p-2.5 bg-neutral-950 border border-neutral-900 font-mono text-[10px] leading-relaxed text-slate-400 space-y-1">
                                  {council.rules.map((rule: string, rIdx: number) => (
                                    <div key={rIdx}>• {rule}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {council.emergencyFund?.contributions && (
                              <div className="mt-4">
                                <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">Contribuições de Fundo</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]">
                                  {Object.entries(council.emergencyFund.contributions).map(([house, amt]: any) => (
                                    <div key={house} className="p-1.5 bg-[#151518]/60 border border-neutral-900 text-center">
                                      <span className="text-[#666] block text-[8px] uppercase">{house}</span>
                                      <span className="text-white font-bold">{amt} SD</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                } else {
                  return (
                    <div className="border border-[#2D2D30] bg-[#121215] p-8 text-center space-y-3">
                      <Landmark className="w-8 h-8 text-[#F2A900]/60 mx-auto mb-1" />
                      <div className="inline-block p-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        // CONDIÇÃO: SEM ASSENTO EM CONSELHOS SENHORIAIS
                      </div>
                      <p className="text-xs text-[#AAA] max-w-lg mx-auto leading-relaxed">
                        Como companhia livre de armas, vosso bando não preside conselhos administrativos nem possui assento cativo nas cortes senhoriais da região.
                      </p>
                      <p className="text-[11px] text-[#666] italic">
                        Assentos políticos, arbitragens feudais e votos em conclaves poderão ser obtidos mediante prestígio, concessão de terras ou serviços prestados à nobreza.
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {/* TAB 8: ESPIONAGE & COMMERCE (G.S) */}
          {tab === 'spyCommerce' && (
            <div className="space-y-6">
              {/* Espionage Network */}
              {(() => {
                const spyData = state.spyNetwork || state.worldLedger?.espionage;
                if (!spyData || (spyData.totalAgents === 0 && (!spyData.agents || spyData.agents.length === 0))) {
                  return (
                    <div className="border border-[#2D2D30] bg-[#121215] p-6 text-center space-y-2">
                      <h3 className="text-white font-bold text-xs border-b border-[#2D2D30] pb-1.5 uppercase">// Batedores de Estrada & Reconhecimento</h3>
                      <p className="text-xs text-[#AAA] max-w-lg mx-auto">
                        Vosso bando não mantém uma rede permanente de espiões infiltrados em cortes distantes (custo de manutenção: 0 SD/semana).
                      </p>
                      <p className="text-[11px] text-[#666] italic">
                        O capitão utiliza batedores da própria tropa para patrulha e sondagens táticas imediatas no terreno.
                      </p>
                    </div>
                  );
                }
                const agentsList = spyData.activeAgents || spyData.agents || [];
                let intelList = spyData.activeIntelligence || spyData.intelligenceGathered || [];
                return (
                  <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 space-y-4">
                    <h3 className="text-white font-bold text-xs border-b border-[#2D2D30] pb-1.5 uppercase flex justify-between items-center">
                      <span>// Rede de Espionagem & Sussurros (Chefe: {spyData.spymaster || 'Roric'})</span>
                      <span className="text-cyan-400 text-[10px] font-mono">
                        Manutenção: -{spyData.costPerWeek || spyData.weeklyUpkeep || spyData.costPerMonth / 4 || 15} SD/semana
                      </span>
                    </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Agents list */}
                        <div>
                          <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">
                            Agentes em Campo ({spyData.totalAgents || agentsList.length} Ativos)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                            {agentsList.map((agent: any, idx: number) => (
                              <div key={agent.id || idx} className="p-2 bg-[#151518]/60 border border-neutral-900 text-[10px]">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-white font-mono">
                                    {agent.codename || agent.name || (agent.ref ? (agent.ref.length > 2 ? agent.ref : `Agente ${agent.ref}`) : 'Agente Oculto')}
                                  </span>
                                  <span className={`px-1 text-[8px] font-bold ${
                                    agent.status === 'Active' || agent.status === 'Ativo' || agent.status === 'Disponível' ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/40' : 'text-red-400 bg-red-950/20 border border-red-900/40'
                                  }`}>{agent.status === 'Active' || agent.status === 'Ativo' || agent.status === 'Disponível' ? 'Ativo' : agent.status}</span>
                                </div>
                                <div className="text-[#666] mt-1 font-mono">Local: {agent.location || 'Valenfort'}</div>
                                {agent.cover && <div className="text-slate-400 font-mono text-[9px] mt-0.5">Disfarce: {agent.cover}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
 
                        {/* Active Intelligence */}
                        <div>
                          <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">Segredos & Inteligência Ativa</h4>
                          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                            {intelList.length > 0 ? (
                              intelList.map((intel: any, idx: number) => {
                                const displayText = typeof intel === 'object'
                                  ? `[${intel.date || 'Registro'}] (${intel.source || 'Interceptado'}): ${intel.info || intel.event || JSON.stringify(intel)}`
                                  : intel;
                                return (
                                  <div key={idx} className="p-2.5 bg-cyan-950/5 border border-cyan-900/20 text-[#00E5FF] leading-relaxed text-[11px] font-mono italic">
                                    &gt; {displayText}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-3 text-center text-[#555] italic border border-neutral-900 text-[11px]">Nenhuma informação valiosa interceptada recentemente.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Trade Routes & Caravans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trade Routes */}
                <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                  <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Rotas Comerciais Registradas</h3>
                  <div className="space-y-2">
                    {(state.tradeRoutes || state.worldLedger?.tradeRoutes || []).length > 0 ? (
                      (state.tradeRoutes || state.worldLedger?.tradeRoutes || []).map((route: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-[#151518]/60 border border-neutral-900 text-[11px]">
                          <div>
                            <span className="font-bold text-white block">{route.route || route.target}</span>
                            <span className="text-slate-400 text-[10px] block leading-normal">
                              {route.details || `Mercadorias: ${route.goods} • Frequência: ${route.frequency}`}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 font-bold text-[9px] ${
                            route.status === 'Active' || route.status === 'Ativo' ? 'text-emerald-400 bg-emerald-950/20' : 'text-red-400 bg-red-950/20'
                          }`}>
                            {route.status === 'Active' || route.status === 'Ativo' ? 'Ativa' : route.status || 'Embargada'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-[#555] italic">Nenhuma rota de comércio ativa registrada.</div>
                    )}
                  </div>
                </div>

                {/* Caravans */}
                <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                  <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Registro de Caravanas Comerciais</h3>
                  <div className="space-y-2">
                    {(() => {
                      let caravansList: any[] = [];
                      if (state.worldLedger?.caravanas) {
                        caravansList = state.worldLedger.caravanas;
                      } else if (state.caravanLedger) {
                        caravansList = [
                          ...(state.caravanLedger.activeCaravans || []),
                          ...(state.caravanLedger.pendingCaravans || [])
                        ];
                      }

                      if (caravansList.length > 0) {
                        return caravansList.map((caravan: any) => (
                          <div key={caravan.id} className="p-3 bg-[#151518] border border-neutral-900 text-[11px] space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white uppercase">{caravan.name}</span>
                              <span className="text-[#F2A900] font-mono text-[9px] tracking-wider uppercase">
                                [Semana {caravan.weekLaunched || 1}]
                              </span>
                            </div>
                            <div className="text-slate-300">Líder Comercial: <span className="font-bold text-white">{caravan.leader}</span></div>
                            <div className="text-slate-400 leading-normal">Escolta: {caravan.guardDetails}</div>
                            <div className="text-emerald-400 font-bold border-t border-neutral-900/60 pt-1.5 mt-1">Status: {caravan.status}</div>
                          </div>
                        ));
                      } else {
                        return (
                          <div className="py-6 text-center space-y-1">
                            <p className="text-[11px] text-slate-400">Nenhuma caravana comercial ativa ou despachada.</p>
                            <p className="text-[10px] text-[#666] italic">O envio de caravanas comerciais requer a posse de um feudo, forja ou entreposto com excedentes de produção.</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: EQUIPMENT STOCK & FORCES (G.I) */}
          {tab === 'militaryInventory' && (
            <div className="space-y-6">
              {/* Detailed Forces */}
              {(() => {
                const hasDetailedForces = state.army.detailedForces;
                const garrisonObj = state.army.garrisonDetail || state.army.garrison?.detail;
                const hasGarrisonDetail = !!garrisonObj;
                
                const commandList = (() => {
                  const raw = state.army.commandStructure || state.army.chainOfCommand;
                  if (!raw) return [];
                  if (Array.isArray(raw)) {
                    return raw.map((item: any) => ({ role: item.role, name: item.name }));
                  }
                  return Object.entries(raw).map(([role, name]: any) => ({ role, name }));
                })();
                const hasCommandStructure = commandList.length > 0;
                
                const hasMilitia = state.army.militia;

                if (hasDetailedForces || hasGarrisonDetail || hasCommandStructure || hasMilitia) {
                  return (
                    <div className="space-y-6">
                      
                      {/* Garrison detail list if present */}
                      {hasGarrisonDetail && (
                        <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                          <h4 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Detalhamento da Guarnição e Postos de Vigia</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(garrisonObj).map(([place, size]: any) => {
                              const translatePlace = (name: string) => {
                                const dict: Record<string, string> = {
                                  guarnicaoFixa: "Guarnição Fixa",
                                  patrulhasMoveis: "Patrulhas Móveis",
                                  recrutasTreinamento: "Recrutas em Treinamento",
                                  torreLeste: "Torre Leste",
                                  torreCorvopedra: "Torre de Corvopedra",
                                  postoSul: "Posto Sul"
                                };
                                return dict[name] || name.replace(/([A-Z])/g, ' $1').trim();
                              };
                              return (
                                <div key={place} className="p-2.5 bg-[#151518]/60 border border-neutral-900 flex justify-between items-center text-xs">
                                  <span className="text-slate-400 capitalize font-mono text-[11px]">{translatePlace(place)}</span>
                                  <span className="text-emerald-400 font-bold font-mono shrink-0">{size} soldados</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Command Structure */}
                      {hasCommandStructure && (
                        <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                          <h4 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Cadeia de Comando Militar</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {commandList.map((cmd: any, cIdx: number) => (
                              <div key={cIdx} className="p-3 bg-[#151518]/60 border border-neutral-900 text-xs font-mono">
                                <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-0.5">{cmd.role}</span>
                                <span className="text-white font-bold text-xs">{cmd.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Militia Reserves */}
                      {hasMilitia && (
                        <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                          <h4 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Reservas & Milícia Regional</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="p-3 bg-[#151518]/60 border border-neutral-900">
                              <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-1">Reservas Treinadas</span>
                              <span className="text-[#00E5FF] font-bold text-base">{state.army.militia.trainedReserves || 0} reservistas</span>
                            </div>
                            <div className="p-3 bg-[#151518]/60 border border-neutral-900">
                              <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-1">Convocáveis (Levy Pool)</span>
                              <span className="text-rose-400 font-bold text-base">{state.army.militia.levyPool || 0} camponeses</span>
                            </div>
                            <div className="p-3 bg-[#151518]/60 border border-neutral-900">
                              <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-1">Estado de Prontidão</span>
                              <span className="text-[#F2A900] font-bold text-xs leading-normal">{state.army.militia.readiness || "Não especificado"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Old Detailed Forces structure fallback */}
                      {hasDetailedForces && (
                        <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 space-y-4">
                          <h3 className="text-white font-bold text-xs border-b border-[#2D2D30] pb-1.5 uppercase">// Distribuição Detalhada de Forças Senhoriais (Gerais)</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Garrisons list */}
                            <div>
                              <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">Postos de Guarnição & Fortes</h4>
                              <div className="space-y-1.5">
                                {hasDetailedForces.garrisons.map((g: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center p-2 bg-[#151518]/60 border border-neutral-900 text-[11px]">
                                    <div>
                                      <span className="font-bold text-white block">{g.location}</span>
                                      {g.description && <span className="text-[10px] text-[#666] block leading-normal">{g.description}</span>}
                                    </div>
                                    <span className="font-bold text-[#00E5FF] font-mono shrink-0">{g.soldiers} homens</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Overall military capabilities stats */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-[#888] font-mono text-[9px] uppercase tracking-wider mb-2 border-b border-neutral-900 pb-1">Estatísticas Gerais do Comando</h4>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="p-3 bg-[#151518]/60 border border-neutral-900 text-center">
                                    <span className="text-[#666] uppercase block text-[8px] mb-1">Força de Campo</span>
                                    <span className="text-base font-bold text-white font-mono">{hasDetailedForces.fieldForce}</span>
                                  </div>
                                  <div className="p-3 bg-[#151518]/60 border border-neutral-900 text-center">
                                    <span className="text-[#666] uppercase block text-[8px] mb-1">Milícia Treinada</span>
                                    <span className="text-base font-bold text-emerald-400 font-mono">{hasDetailedForces.trainedMilicia}</span>
                                  </div>
                                  <div className="p-3 bg-[#151518]/60 border border-neutral-900 text-center col-span-2">
                                    <span className="text-[#666] uppercase block text-[8px] mb-1">Levy de Emergência (Convocável)</span>
                                    <span className="text-sm font-bold text-rose-400 font-mono">{hasDetailedForces.emergencyLevy} camponeses armados</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return null;
                }
              })()}

              {/* Equipment Inventory (from state.equipmentInventory) */}
              {state.equipmentInventory?.armory && (
                <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                  <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase">// Inventário do Arsenal da Armaria</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#2D2D30] text-[#666]">
                          <th className="py-1.5">ITEM / EQUIPAMENTO</th>
                          <th className="py-1.5">TIPO</th>
                          <th className="py-1.5">QUALIDADE</th>
                          <th className="py-1.5">ESTOQUE ATUAL</th>
                          <th className="py-1.5">NOTAS / OBSERVAÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.equipmentInventory.armory.map((item: any, i: number) => (
                          <tr key={item.item || i} className={`border-b border-neutral-900 text-slate-300 ${i % 2 === 0 ? 'bg-[#151518]/30' : ''}`}>
                            <td className="py-2.5 font-bold text-white">{item.item}</td>
                            <td className="py-2.5 font-mono text-cyan-400">{item.type}</td>
                            <td className="py-2.5">{item.quality}</td>
                            <td className="py-2.5 font-bold text-emerald-400 font-mono">{item.qty} un</td>
                            <td className="py-2.5 text-slate-400 leading-normal italic">{item.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {state.equipmentInventory.production && (
                    <div className="mt-4 p-3 bg-neutral-950 border border-neutral-900 text-[11px] leading-relaxed text-slate-300 font-mono">
                      <span className="text-amber-500 font-bold uppercase block mb-1">[Linha de Produção Ativa]</span>
                      {Object.entries(state.equipmentInventory.production).map(([key, prod]: any) => (
                        <div key={key}>
                          • <span className="text-white uppercase font-bold">{key}</span>: {prod.perWeek ? `+${prod.perWeek} unidades/semana via ${prod.source}` : `${prod.total} encomendadas via ${prod.source} (Custo total: ${prod.cost} SD)`}
                        </div>
                      ))}
                    </div>
                  )}

                  {state.equipmentInventory.personalEquipment && (
                    <div className="mt-4 border-t border-neutral-900 pt-4">
                      <h4 className="text-white font-bold text-xs mb-2 uppercase tracking-wider">// Equipamento Pessoal dos Líderes</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono leading-relaxed">
                        {Object.entries(state.equipmentInventory.personalEquipment).map(([officer, equip]: any) => (
                          <div key={officer} className="p-2 bg-[#151518]/60 border border-neutral-900">
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-wider mb-0.5">{officer}</span>
                            <span className="text-white font-bold">{equip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Equipment Stock (GeraisFallback) */}
              {state.worldLedger.equipmentStock && !state.equipmentInventory?.armory && (
                <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 space-y-4">
                  <h3 className="text-white font-bold text-xs border-b border-[#2D2D30] pb-1.5 uppercase">// Arsenal da Armaria Senhorial (Equipamentos em Estoque)</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Curaças (Cuirasses)</span>
                      <span className="text-lg font-bold text-white font-mono">{state.worldLedger.equipmentStock.cuirasses}</span>
                    </div>
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Cotas de Malha</span>
                      <span className="text-lg font-bold text-white font-mono">{state.worldLedger.equipmentStock.chainmail}</span>
                    </div>
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Armaduras de Placa</span>
                      <span className="text-lg font-bold text-[#F2A900] font-mono">{state.worldLedger.equipmentStock.plateArmor}</span>
                    </div>
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Escudos Revestidos</span>
                      <span className="text-lg font-bold text-white font-mono">{state.worldLedger.equipmentStock.shields}</span>
                    </div>
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Lanças de Batalha</span>
                      <span className="text-lg font-bold text-white font-mono">{state.worldLedger.equipmentStock.spears}</span>
                    </div>
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Espadas Curtas</span>
                      <span className="text-lg font-bold text-white font-mono">{state.worldLedger.equipmentStock.shortswords}</span>
                    </div>
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Arcos Longos</span>
                      <span className="text-lg font-bold text-white font-mono">{state.worldLedger.equipmentStock.longbows}</span>
                    </div>
                    <div className="p-3 bg-[#151518] border border-neutral-900">
                      <span className="text-[#666] text-[8px] uppercase block mb-1">Vestes de Inverno</span>
                      <span className="text-lg font-bold text-[#00E5FF] font-mono">{state.worldLedger.equipmentStock.winterClothes}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-900 text-[11px] leading-relaxed text-slate-300 font-mono">
                    <span className="text-amber-500 font-bold uppercase block mb-1">[Linha de Produção & Notas do Ferreiro]</span>
                    {state.worldLedger.equipmentStock.productionDetails || "Nenhuma nota de produção ativa ou pendente."}
                  </div>
                </div>
              )}

              {/* TAB 10: ARTIFACTS & SECRETS (G.A) */}
              {tab === 'artifacts' && (
                <div className="space-y-6">
                  {/* Info Header explaining how dynamic narrative artifacts work */}
                  <div className="border border-amber-900/40 bg-amber-950/5 p-4 rounded-sm">
                    <h3 className="text-amber-500 font-bold text-xs mb-1.5 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <span>✦</span> GESTÃO DE ARTEFATOS E SEGREDOS DINÂMICOS
                    </h3>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Esta aba cataloga de forma estruturada as relíquias exclusivas, tomos e segredos revelados durante a sua crônica heráldica.
                      Desta forma, os artefatos criados cooperativamente entre você e o mestre permanecem visíveis sem poluir o HUD principal,
                      e são permanentemente salvos nos Ledgers para que o Sistema (IA) os consulte dinamicamente antes de gerar cada reação sensorial.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Section I: Relíquias e Artefatos Únicos */}
                    <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 flex flex-col h-full">
                      <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Relíquias Senhoriais & Acervo
                      </h3>
                      <div className="space-y-4 flex-1">
                        {(state.discoveredArtifacts || []).length > 0 ? (
                          (state.discoveredArtifacts || []).map((art, idx) => (
                            <div key={idx} className="p-3 bg-[#151518] border border-neutral-800 rounded-sm space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wide">{art.name}</h4>
                                  <span className="text-[9px] text-cyan-400 font-mono uppercase block mt-0.5">{art.type || "Artefato Místico"}</span>
                                </div>
                                {art.weekFound && (
                                  <span className="text-[8px] bg-[#1a1a1e] text-[#888] px-1.5 py-0.5 border border-neutral-800">
                                    Semana {art.weekFound}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">{art.description}</p>
                              {art.origin && (
                                <div className="text-[10px] text-slate-400">
                                  <span className="text-[#666] font-bold">Origem:</span> {art.origin}
                                </div>
                              )}
                              {art.properties && (
                                <div className="text-[10px] text-amber-500 bg-amber-950/10 border border-amber-900/30 p-1.5 mt-1">
                                  <span className="font-bold block text-[9px] text-amber-400 uppercase tracking-tight mb-0.5">[Efeito Mecânico / Propriedade]</span>
                                  {art.properties}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-[#666] italic text-center py-8">
                            Nenhum artefato ou relíquia heráldica catalogado nas crônicas de ferro.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section II: O Livro Negro & Dossiers */}
                    <div className="border border-[#2D2D30] bg-[#0F0F12] p-4 flex flex-col h-full">
                      <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        O Livro Negro de Caedor
                      </h3>
                      
                      <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-sm space-y-3 flex-1">
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          O Livro Negro abriga perfis confidenciais, dossiês de fraquezas e anotações obtidas através de subornos e vigilância. Ele é atualizado dinamicamente pelo seu Mestre de Espiões.
                        </p>
                        
                        {state.livroNegroDetail ? (
                          <div className="font-mono text-[10px] leading-relaxed text-emerald-400 bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-sm space-y-2 whitespace-pre-wrap">
                            <span className="text-emerald-500 font-bold uppercase block border-b border-emerald-900/30 pb-1 mb-1">// DOSSIÊ SECRETO // CONSPIRACY_FILE</span>
                            {typeof state.livroNegroDetail === 'string' ? state.livroNegroDetail : JSON.stringify(state.livroNegroDetail, null, 2)}
                          </div>
                        ) : (
                          <div className="border border-dashed border-neutral-800 p-4 text-center text-[#555] text-[10px] rounded-sm space-y-1">
                            <p className="font-bold text-[#666] uppercase">Registro de Dossiers Vazio</p>
                            <p>Nenhuma anotação de conspiração ativa ou dossiê sobre nobres inimigos foi obtida.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section III: Matriz de Segredos de Estado & Investigações */}
                  <div className="border border-[#2D2D30] bg-[#0F0F12] p-4">
                    <h3 className="text-white font-bold text-xs mb-3 border-b border-[#2D2D30] pb-1.5 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                      Segredos de Estado & Dossiês de Investigação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(state.worldSecrets || []).map((sec) => (
                        <div key={sec.id} className={`p-3 border rounded-sm flex flex-col justify-between ${
                          sec.revealed 
                            ? 'bg-cyan-950/5 border-cyan-800/40 text-slate-300' 
                            : 'bg-neutral-950 border-neutral-900 text-slate-400'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-sm ${
                                sec.category === 'Dynasty' ? 'bg-pink-950 text-pink-400 border border-pink-900/40' :
                                sec.category === 'Military' ? 'bg-amber-950 text-amber-500 border border-amber-900/40' :
                                'bg-cyan-950 text-cyan-400 border border-cyan-900/40'
                              }`}>
                                {sec.category === 'Dynasty' ? 'Linhagem' :
                                 sec.category === 'Military' ? 'Militar' : 'Conspiração'}
                              </span>
                              <span className={`px-1 text-[8px] font-mono ${
                                sec.criticality === 'Critical' ? 'text-red-500 font-bold' :
                                sec.criticality === 'High' ? 'text-amber-500' : 'text-slate-500'
                              }`}>
                                {sec.criticality || 'Normal'}
                              </span>
                            </div>

                            <h4 className={`text-xs font-bold uppercase tracking-wide ${sec.revealed ? 'text-cyan-400' : 'text-neutral-500'}`}>
                              {sec.revealed ? sec.title : "??? SEGREDO NÃO REVELADO ???"}
                            </h4>

                            <p className="text-[10px] leading-relaxed">
                              {sec.revealed ? sec.description : "Sussurros fragmentados correm a fronteira. Inicie uma investigação heráldica ou envie espiões para revelar este mistério."}
                            </p>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-neutral-900 space-y-2">
                            {sec.revealed ? (
                              <div className="text-[10px] text-emerald-400 bg-emerald-950/10 border border-emerald-900/30 p-2 rounded-sm whitespace-pre-wrap font-sans">
                                <span className="font-bold text-[9px] text-emerald-400 block uppercase tracking-tight mb-0.5">[Consequência Mecânica Ativa]</span>
                                {sec.outcomeDesc}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-mono text-[#666]">
                                  <span>PROGRESSO DE REVELAÇÃO:</span>
                                  <span>{sec.investigationProgress} / 3</span>
                                </div>
                                <div className="w-full bg-neutral-900 h-1.5 rounded-sm overflow-hidden border border-neutral-800">
                                  <div 
                                    className="bg-cyan-600 h-full transition-all duration-300"
                                    style={{ width: `${(sec.investigationProgress / 3) * 100}%` }}
                                  ></div>
                                </div>
                                {sec.difficultyClass && (
                                  <span className="text-[8px] text-slate-500 block text-right font-mono">Dificuldade Estimada: DC {sec.difficultyClass}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
