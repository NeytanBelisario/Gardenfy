import { Directory, File, Paths } from 'expo-file-system';

import { createManagedPhotoStorage } from './photoStorageCore';

function photoDirectory() {
  return new Directory(Paths.document, 'gardenfy-photos');
}

export const plantPhotos = createManagedPhotoStorage({
  directoryUri: () => photoDirectory().uri,
  async copy(sourceUri, filename) {
    const directory = photoDirectory();
    directory.create({ idempotent: true, intermediates: true });
    new File(sourceUri).copy(new File(directory, filename));
  },
  async remove(filename) {
    const file = new File(photoDirectory(), filename);
    if (file.exists) file.delete();
  },
});
