import type { PlantPhotoStorage } from './photoStorageCore';

// Web stores the image itself rather than an object URL that expires on reload.
export const plantPhotos: PlantPhotoStorage = {
  async save(uri) {
    if (uri.startsWith('data:image/')) return uri;
    if (!uri.startsWith('blob:')) throw new Error('Não foi possível salvar esta foto no navegador.');
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Não foi possível ler a foto.');
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível guardar a foto.'));
      reader.onload = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          resolve(reader.result);
        } else {
          reject(new Error('A foto selecionada é inválida.'));
        }
      };
      reader.readAsDataURL(blob);
    });
  },
  async remove() {},
  resolve: (reference) => reference,
};
