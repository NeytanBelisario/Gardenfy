import { createId } from './ids';

const PHOTO_PREFIX = 'gardenfy-photo:';
const PHOTO_NAME = /^photo-[a-z0-9-]+\.(jpg|jpeg|png|webp|heic|heif|gif)$/;

export interface PlantPhotoStorage {
  save(uri: string): Promise<string>;
  remove(reference: string): Promise<void>;
  resolve(reference: string): string;
}

export interface PhotoFiles {
  directoryUri(): string;
  copy(sourceUri: string, filename: string): Promise<void>;
  remove(filename: string): Promise<void>;
}

function filenameFor(reference: string) {
  const filename = reference.slice(PHOTO_PREFIX.length);
  if (!PHOTO_NAME.test(filename)) throw new Error('Referência de foto inválida.');
  return filename;
}

export function isValidPhotoReference(reference: string) {
  return !reference.startsWith(PHOTO_PREFIX) || PHOTO_NAME.test(reference.slice(PHOTO_PREFIX.length));
}

export function createManagedPhotoStorage(files: PhotoFiles): PlantPhotoStorage {
  return {
    async save(uri) {
      if (!/^(file|content):\/\//.test(uri)) {
        throw new Error('Não foi possível ler a foto local para salvar.');
      }
      const extension = uri.split(/[?#]/)[0].match(/\.(jpg|jpeg|png|webp|heic|heif|gif)$/i)?.[1].toLowerCase() ?? 'jpg';
      const filename = `${createId('photo')}.${extension}`;
      try {
        await files.copy(uri, filename);
      } catch {
        await files.remove(filename).catch(() => undefined);
        throw new Error('Não foi possível guardar a foto. Tente novamente.');
      }
      return PHOTO_PREFIX + filename;
    },
    async remove(reference) {
      if (reference.startsWith(PHOTO_PREFIX)) await files.remove(filenameFor(reference));
    },
    resolve(reference) {
      return reference.startsWith(PHOTO_PREFIX)
        ? `${files.directoryUri().replace(/\/$/, '')}/${filenameFor(reference)}`
        : reference;
    },
  };
}
