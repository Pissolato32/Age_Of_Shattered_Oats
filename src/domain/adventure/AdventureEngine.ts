import { AdventureNode, AdventureChoice } from './AdventureTypes';
import { globalRNG } from '../../core/RandomService';

/**
 * AdventureEngine - Motor Procedural de Eventos e Aventuras de Campo (AOS V4.7/V4.8)
 * 
 * Gera dinamicamente aventuras e encontros com base na localização e clima, 
 * alimentando o Mestre Narrador e o Gemini com fatos determinísticos reais.
 */
export class AdventureEngine {
  public static generateForestAdventure(landmark: string): AdventureNode {
    const seedEvent = globalRNG.nextInt(1, 3);

    if (seedEvent === 1) {
      return {
        id: "forest_deserters",
        title: "Acampamento Clandestino nas Árvores",
        description: `Ao adentrar a floresta de ${landmark}, a patrulha detecta fumaça rala subindo dos pinheiros. Um grupo de desertores armados com machados e arcos rudimentares assa um cervo caçado ilegalmente nas terras do feudo.`,
        choices: [
          {
            id: "flank",
            text: "Cercar o acampamento em silêncio com a guarda a postos.",
            outcomeText: "Vossa guarda cercou os desertores. Rendidos sem derramamento de sangue, três aceitaram jurar lealdade para não responderem por traição.",
            resourceDelta: { troops: 3, silverdew: -5 }
          },
          {
            id: "charge",
            text: "Exigir rendição em voz alta com a espada desembainhada.",
            outcomeText: "Os desertores entraram em pânico e dispararam flechas antes de fugirem. Um soldado da guarda sofreu ferimentos leves, mas as provisões do acampamento foram apreendidas.",
            resourceDelta: { food: 20 }
          },
          {
            id: "parley",
            text: "Oferecer perdão senhorial em troca de informações das estradas.",
            outcomeText: "O líder dos bandidos revelou a rota de uma caravana ilegal que cruzará as fronteiras em dois dias.",
            resourceDelta: { reputation: 5 }
          }
        ]
      };
    } else if (seedEvent === 2) {
      return {
        id: "ancient_ruins",
        title: "Ruínas do Velho Altar de Ferro",
        description: `No coração da floresta gélida, cobertas por musgo e neve densa, erguem-se as ruínas de um altar dos antigos Senhores de Oaths. Um baú de ferro trancado repousa sob a pedra central.`,
        choices: [
          {
            id: "break_chest",
            text: "Forçar a fechadura de ferro com a picareta da tropa.",
            outcomeText: "O baú cedeu com um estalo metálico. Dentro foram encontradas 40 moedas antigas de Silverdew e lingotes de ferro bruto.",
            resourceDelta: { silverdew: 40 }
          },
          {
            id: "inspect_runes",
            text: "Examinar as inscrições nas pedras antes de tocar no cofre.",
            outcomeText: "As inscrições registravam um pacto heráldico esquecido. A honra da vossa Casa foi enaltecida entre os estudiosos do conselho.",
            resourceDelta: { reputation: 10 }
          }
        ]
      };
    }

    return {
      id: "stranded_caravan",
      title: "Caravana de Mantimentos Encalhada",
      description: `Uma carroça de comércio com a roda quebrada bloqueia o caminho gélido. Os mercadores tremem de frio e imploram por auxílio contra a tempestade iminente.`,
      choices: [
        {
          id: "help_caravan",
          text: "Designar 2 guardas para reparar a carroça e escoltá-los até a fortaleza.",
          outcomeText: "Agradecidos, os mercadores venderam seus grãos com 50% de desconto e doaram sacos de sal para o armazém.",
          resourceDelta: { food: 50, silverdew: -15 }
        },
        {
          id: "seize_goods",
          text: "Confiscar os mantimentos em nome da emergência do feudo.",
          outcomeText: "A carga foi integrada aos celeiros de Grey Keep, mas o boato da apreensão indignou as caravanas vizinhas.",
          resourceDelta: { food: 80, reputation: -10 }
        }
      ]
    };
  }
}
