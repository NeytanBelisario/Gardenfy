import type { GardenPlant } from './types';

export type PlantCareProfile = {
  scientificName: string;
  commonName: string;
  aliases: string[];
  description: string;
  light: string;
  watering: string;
  soil: string;
  growth: string;
  sourceUrl: string;
};

// Short editorial summaries; these are species guidance, never readings of a photo.
export const plantCareProfiles: PlantCareProfile[] = [
  {
    scientificName: 'Monstera deliciosa', commonName: 'Costela-de-adão',
    aliases: ['Costela de Adao', 'Costela-de-adão'],
    description: 'Folhagem trepadeira de folhas grandes. Pode precisar de apoio para os caules.',
    light: 'Luz indireta, com boa claridade. Evite sol direto forte.',
    watering: 'Regue bem e deixe a parte superior do substrato secar antes de repetir. Confira o solo antes de regar.',
    soil: 'Substrato rico em matéria orgânica, com boa drenagem.',
    growth: 'Crescimento rápido em condições favoráveis; varia com o ambiente.',
    sourceUrl: 'https://plants.ces.ncsu.edu/plants/monstera-deliciosa/',
  },
  {
    scientificName: 'Pilea peperomioides', commonName: 'Planta-chinesa-do-dinheiro',
    aliases: ['Planta Chinesa do Dinheiro'],
    description: 'Planta compacta, com folhas arredondadas e brotos que podem formar novas plantas.',
    light: 'Boa claridade com luz indireta.',
    watering: 'Mantenha umidade moderada, sem encharcar. Excesso de água pode prejudicar as raízes.',
    soil: 'Substrato com boa drenagem, que conserve alguma umidade.',
    growth: 'Crescimento rápido em condições favoráveis; costuma manter porte compacto.',
    sourceUrl: 'https://plants.ces.ncsu.edu/plants/pilea-peperomioides/',
  },
  {
    scientificName: 'Goeppertia orbifolia', commonName: 'Calatéia-orbifolia',
    aliases: ['Calathea orbifolia', 'Calathea de Folha Redonda'],
    description: 'Folhagem brasileira de folhas arredondadas com faixas prateadas.',
    light: 'Luz indireta ou meia-sombra. Sol direto pode queimar as folhas.',
    watering: 'Mantenha o substrato úmido, sem encharcar. Prefira água da chuva ou destilada quando possível.',
    soil: 'Substrato levemente ácido, com boa drenagem e retenção de umidade.',
    growth: 'Crescimento rápido com calor e umidade adequados, sem prazo fixo.',
    sourceUrl: 'https://plants.ces.ncsu.edu/plants/goeppertia-orbifolia/',
  },
  {
    scientificName: 'Dracaena trifasciata', commonName: 'Espada-de-são-jorge',
    aliases: ['Sansevieria trifasciata', 'Espada de Sao Jorge', 'Espada-de-são-jorge'],
    description: 'Folhagem resistente, de folhas eretas. Também conhecida como Sansevieria.',
    light: 'Tolera pouca luz; pode receber sol por parte do dia.',
    watering: 'Deixe o substrato secar entre regas. Reduza a rega no frio e evite excesso de água.',
    soil: 'Substrato bem drenado, em vaso com saída para a água.',
    growth: 'O ritmo varia com luz e temperatura; não há prazo fixo para novas folhas.',
    sourceUrl: 'https://plants.ces.ncsu.edu/plants/dracaena-trifasciata/',
  },
];

export function normalizePlantName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-\s]+/g, ' ').trim();
}

export function findPlantCareProfile(name: string) {
  const normalized = normalizePlantName(name);
  return plantCareProfiles.find((profile) => [profile.scientificName, profile.commonName, ...profile.aliases]
    .some((alias) => normalizePlantName(alias) === normalized));
}

export function getPlantCareProfile(plant: GardenPlant) {
  // An explicit identification wins over a user nickname or an old catalog title.
  return findPlantCareProfile(plant.species?.scientificName ?? plant.identifiedName ?? plant.name);
}
