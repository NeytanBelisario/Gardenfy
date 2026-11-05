import { showSuccessToast } from '../../components/shell/successToastStore';
import { deletePlantCare, recordPlantCare } from './store';
import { describeWateringPlan, getWateringPlan } from './watering';
import type { GardenPlant } from './types';

/** Registers a watering now and offers a short undo, shared by lists and the home "Para hoje". */
export async function quickWater(gardenId: string, plant: GardenPlant) {
  try {
    const record = await recordPlantCare(gardenId, plant.id, 'water');
    const plan = getWateringPlan(plant);
    showSuccessToast('Rega registrada', plan ? plant.name + ' · ' + describeWateringPlan(plan).split(' · ')[0].toLowerCase() : plant.name, {
      tone: 'water',
      action: {
        label: 'Desfazer',
        onPress: () => {
          deletePlantCare(gardenId, plant.id, record.id)
            .then(() => showSuccessToast('Rega desfeita', plant.name))
            .catch(() => showSuccessToast('Não foi possível desfazer', 'Corrija o registro no histórico da planta.', { tone: 'error' }));
        },
      },
    });
  } catch (cause) {
    showSuccessToast('Não foi possível registrar a rega', cause instanceof Error ? cause.message : 'Tente novamente.', { tone: 'error' });
  }
}
