import React, { useState } from "react";
import { CampaignState, Character } from "../types";
import { createInitialState } from "../engine";
import { REGIONS } from "../data";
import { Shield, Sparkles, User, Sword, Wand2, Hammer, ArrowLeft, ArrowRight, Check, Skull } from "lucide-react";

interface CharacterCreatorProps {
  onCancel: () => void;
  onFinishCreation: (state: CampaignState) => void;
}

export function CharacterCreator({ onCancel, onFinishCreation }: CharacterCreatorProps) {
  const [step, setStep] = useState(1);
  const [archetype, setArchetype] = useState<'Noble Ruler' | 'Landed Knight' | 'Landless' | 'Artificer' | 'Necromancer'>('Noble Ruler');
  const [name, setName] = useState("Kaelen");
  const [house, setHouse] = useState("Vance");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("Male");
  const [appearance, setAppearance] = useState("Alto, cabelos escuros e olhar firme.");
  const [region, setRegion] = useState("Central Plains");
  const [colors, setColors] = useState("Blue and Silver");
  const [symbol, setSymbol] = useState("Wolf");
  const [motto, setMotto] = useState("We Hold the March");
  const [backstory, setBackstory] = useState("Treinado em armas desde jovem para proteger as terras e honrar o nome da família.");

  const handleFinish = () => {
    // Generate state dynamically based on user choices
    const baseState = createInitialState(archetype === 'Necromancer' ? 'Necromancer' : 'Noble Ruler', region);
    
    // Modify based on inputs
    baseState.character.name = name;
    baseState.character.house = house;
    baseState.character.age = age;
    baseState.character.gender = gender;
    baseState.character.flavorDetail = appearance;
    baseState.character.banner.colors = colors;
    baseState.character.banner.symbol = symbol;
    baseState.character.banner.motto = motto;
    baseState.character.backstory = backstory;
    
    if (archetype === 'Landed Knight') {
      baseState.character.archetype = 'Landed Knight';
      baseState.character.title = 'Sir Landed Knight';
      baseState.weeklyLedger.silverdew = 400; // Knight starting money
    } else if (archetype === 'Landless') {
      baseState.character.archetype = 'Landless';
      baseState.character.title = 'Captain';
      baseState.weeklyLedger.silverdew = 200;
    } else if (archetype === 'Artificer') {
      baseState.character.archetype = 'Artificer';
      baseState.character.title = 'Master Smith';
      baseState.weeklyLedger.silverdew = 150;
    }

    onFinishCreation(baseState);
  };

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto border border-[#2D2D30] bg-[#0F0F12] p-6 md:p-8 text-[#D1D1D1] relative animate-fade-in my-4 font-mono select-none shadow-2xl">
      {/* Back Button */}
      <button
        onClick={onCancel}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-[#888] hover:text-[#F2A900] transition uppercase font-mono"
      >
        <ArrowLeft className="w-4 h-4" /> Cancelar
      </button>

      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-8 border-b border-[#2D2D30] pb-4 mt-6">
        <h2 className="text-base md:text-lg font-bold uppercase tracking-tight text-white flex items-center gap-2">
          <User className="text-[#F2A900] w-5 h-5" /> G.1.1 // Criar Personagem
        </h2>
        <span className="text-xs text-[#888] font-bold">PASSO {step} DE 4</span>
      </div>

      {/* STEP 1: CHOOSE ARCHETYPE */}
      {step === 1 && (
        <div>
          <p className="text-xs text-[#888] mb-6 uppercase tracking-wider">
            [SISTEMA DE ALOCAÇÃO DE ARQUÉTIPOS INICIALIZADO. SELECIONE UMA MATRIZ]
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Noble Ruler */}
            <button
              onClick={() => setArchetype('Noble Ruler')}
              className={`flex items-start gap-4 p-4 border text-left transition ${
                archetype === 'Noble Ruler' ? 'border-[#F2A900] bg-[#151518]' : 'border-[#2D2D30] bg-[#0D0D0E] hover:border-[#888]'
              }`}
            >
              <div className="p-2 bg-[#151518] border border-[#2D2D30] shrink-0">
                <Shield className="w-5 h-5 text-[#F2A900]" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm">Governante Nobre</h4>
                <p className="text-xs text-[#888] leading-relaxed mt-1">
                  Landed Ruler. Você detém terras, vilas e súditos por direito de sangue ou conquista militar.
                </p>
              </div>
            </button>

            {/* Landed Knight */}
            <button
              onClick={() => setArchetype('Landed Knight')}
              className={`flex items-start gap-4 p-4 border text-left transition ${
                archetype === 'Landed Knight' ? 'border-[#F2A900] bg-[#151518]' : 'border-[#2D2D30] bg-[#0D0D0E] hover:border-[#888]'
              }`}
            >
              <div className="p-2 bg-[#151518] border border-[#2D2D30] shrink-0">
                <Sword className="w-5 h-5 text-[#00E5FF]" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm">Cavaleiro com Terras</h4>
                <p className="text-xs text-[#888] leading-relaxed mt-1">
                  Landed Knight. Você possui uma espada, um cavalo, um nome e uma pequena propriedade senhorial.
                </p>
              </div>
            </button>

            {/* Landless */}
            <button
              onClick={() => setArchetype('Landless')}
              className={`flex items-start gap-4 p-4 border text-left transition ${
                archetype === 'Landless' ? 'border-[#F2A900] bg-[#151518]' : 'border-[#2D2D30] bg-[#0D0D0E] hover:border-[#888]'
              }`}
            >
              <div className="p-2 bg-[#151518] border border-[#2D2D30] shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm">Caminhante Sem Terra</h4>
                <p className="text-xs text-[#888] leading-relaxed mt-1">
                  Landless. Você vaga com seu bando de guerreiros, motivado por prata, sobrevivência ou ideais.
                </p>
              </div>
            </button>

            {/* Artificer */}
            <button
              onClick={() => setArchetype('Artificer')}
              className={`flex items-start gap-4 p-4 border text-left transition ${
                archetype === 'Artificer' ? 'border-[#F2A900] bg-[#151518]' : 'border-[#2D2D30] bg-[#0D0D0E] hover:border-[#888]'
              }`}
            >
              <div className="p-2 bg-[#151518] border border-[#2D2D30] shrink-0">
                <Hammer className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm">Artífice / Ferreiro</h4>
                <p className="text-xs text-[#888] leading-relaxed mt-1">
                  Artificer. Você molda metal e fogo. A forja é o seu domínio para fabricar equipamentos lendários.
                </p>
              </div>
            </button>

            {/* Necromancer */}
            <button
              onClick={() => setArchetype('Necromancer')}
              className={`flex items-start gap-4 p-4 border text-left transition col-span-1 md:col-span-2 ${
                archetype === 'Necromancer' ? 'border-[#F2A900] bg-[#151518]' : 'border-[#2D2D30] bg-[#0D0D0E] hover:border-[#888]'
              }`}
            >
              <div className="p-2 bg-[#151518] border border-[#2D2D30] shrink-0">
                <Skull className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm">Mestre da Arte Proibida (Necromante)</h4>
                <p className="text-xs text-[#888] leading-relaxed mt-1">
                  Necromancer. Você domina a essência das almas. Erga soldados mortos-vivos silenciosos que não pedem ração nem moedas de prata.
                </p>
              </div>
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-[#F2A900] hover:bg-[#D97706] text-[#0D0D0E] font-bold text-xs flex items-center gap-2 transition uppercase tracking-wider rounded-sm"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PERSONAL DATA */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Nome do Personagem</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">
                {archetype === 'Landless' ? 'Sobrenome / Alcunha de Origem' : archetype === 'Artificer' ? 'Sobrenome / Forja' : archetype === 'Necromancer' ? 'Nome do Culto / Linhagem' : 'Sobrenome / Nome da Casa'}
              </label>
              <input
                type="text"
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                placeholder={archetype === 'Landless' ? 'Ex: Corvo, o Errante, Vance' : 'Ex: Vance, Stormcrest'}
                className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Idade (Sugerido: 25-45 anos)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Gênero</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
              >
                <option value="Male">Masculino</option>
                <option value="Female">Feminino</option>
                <option value="Other">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Aparência Física e Traços Fisiológicos</label>
            <textarea
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              className="w-full h-24 bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900] resize-none"
            />
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-[#2D2D30] hover:border-[#888] text-xs font-bold flex items-center gap-2 transition uppercase"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-[#F2A900] hover:bg-[#D97706] text-[#0D0D0E] font-bold text-xs flex items-center gap-2 transition uppercase tracking-wider rounded-sm"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CHOOSE REGION */}
      {step === 3 && (
        <div>
          <label className="block text-xs text-[#888] uppercase mb-4 tracking-wider">Escolha a Região Inicial de Atuação</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`p-4 border text-left transition ${
                  region === r ? 'border-[#F2A900] bg-[#151518]' : 'border-[#2D2D30] bg-[#0D0D0E] hover:border-[#888]'
                }`}
              >
                <h5 className="font-bold text-white text-sm mb-2 uppercase font-sans">{r}</h5>
                <span className="text-xs text-[#888] leading-relaxed block">
                  {r === "Central Plains" && "Terras férteis, planícies abertas, cavalaria pesada."}
                  {r === "Western Rivers" && "Canais, portos fluviais, rotas comerciais ricas."}
                  {r === "Eastern Forests" && "Bosques antigos, batedores furtivos, arquearia."}
                  {r === "Southern Mountains" && "Passagens estreitas, defesas sólidas, picos nevados."}
                  {r === "Northern Snowlands" && "Invernos letais, tundra congelada, resistência extrema."}
                  {r === "Nomad Steppe" && "Mar de grama infinito, arqueiros a cavalo, velocidade."}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 border border-[#2D2D30] hover:border-[#888] text-xs font-bold flex items-center gap-2 transition uppercase"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 bg-[#F2A900] hover:bg-[#D97706] text-[#0D0D0E] font-bold text-xs flex items-center gap-2 transition uppercase tracking-wider rounded-sm"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: HERALDRY & SUMMARY */}
      {step === 4 && (
        <div className="flex flex-col gap-6">
          {archetype === 'Landless' ? (
            <div className="p-4 bg-[#121215] border border-[#2D2D30] rounded-sm">
              <h5 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">// CONDIÇÃO DIEGÉTICA: VAGANTE SEM FEUDO</h5>
              <p className="text-xs text-[#AAA] leading-relaxed">
                Como <strong>Caminhante Sem Terra</strong>, você ainda não possui terras senhoriais, brasão formal ou estandarte dinástico. 
                Sua heráldica e lema de linhagem poderão ser formalmente fundados no decorrer da crônica se você vier a conquistar um feudo, 
                prestar juramento a um senhor ou fundar sua própria companhia livre.
              </p>
            </div>
          ) : archetype === 'Artificer' ? (
            <div className="p-4 bg-[#121215] border border-[#2D2D30] rounded-sm">
              <h5 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-widest">// MARCA DA FORJA & OFÍCIO</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Símbolo / Marca do Ferreiro</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Ex: Bigorna, Martelo Duplo, Chama"
                    className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Princípio do Ofício</label>
                  <input
                    type="text"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    placeholder="Ex: O Aço Nunca Mente"
                    className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
                  />
                </div>
              </div>
            </div>
          ) : archetype === 'Necromancer' ? (
            <div className="p-4 bg-[#121215] border border-[#2D2D30] rounded-sm">
              <h5 className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-widest">// INSÍGNIA OCULTA & PACTO DAS ALMAS</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Símbolo da Morte</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Ex: Caveira de Ébano, Coroa Quebrada"
                    className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Lema Proibido</label>
                  <input
                    type="text"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    placeholder="Ex: O Sangue Lembra"
                    className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Cores do Estandarte</label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Ex: Dark Blue and Silver"
                    className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Símbolo Heráldico</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Ex: Wolf, Eagle, Bear"
                    className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">Lema da Casa Nobre</label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Ex: Our Word Is Our Bond."
                  className="w-full bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-[#888] uppercase mb-2 tracking-wider">
              {archetype === 'Landless' ? 'Antecedente (Como você foi parar no exílio ou nas estradas)' : 'Antecedente (História de Origem)'}
            </label>
            <textarea
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              className="w-full h-24 bg-[#050506] border border-[#2D2D30] p-3 text-sm text-white focus:outline-none focus:border-[#F2A900] resize-none"
            />
          </div>

          <div className="p-4 bg-[#050506] border border-[#2D2D30] rounded-sm">
            <h5 className="text-xs font-bold text-[#F2A900] mb-3 uppercase tracking-widest">// REVISÃO MECÂNICA E DETERMINÍSTICA</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div><span className="text-[#888] block">Nome:</span> <span className="text-white font-bold">{name}</span></div>
              <div>
                <span className="text-[#888] block">{archetype === 'Landless' ? 'Origem / Bando:' : 'Casa:'}</span> 
                <span className="text-white font-bold">{house || (archetype === 'Landless' ? 'Sem Casa' : 'Vance')}</span>
              </div>
              <div><span className="text-[#888] block">Arquétipo:</span> <span className="text-[#00E5FF] font-bold">{archetype}</span></div>
              <div><span className="text-[#888] block">Região Inicial:</span> <span className="text-white font-bold">{region}</span></div>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 border border-[#2D2D30] hover:border-[#888] text-xs font-bold flex items-center gap-2 transition uppercase"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-[#F2A900] hover:bg-[#D97706] text-[#0D0D0E] font-bold text-xs flex items-center gap-2 transition uppercase tracking-wider rounded-sm shadow-md"
            >
              Finalizar Criação <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
