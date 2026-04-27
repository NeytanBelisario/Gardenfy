export const currentUser = {
  name: 'Diony Rinker',
  role: 'Cuidador principal',
  email: 'diony@gardenfy.app',
};

export function getUserInitial(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return 'G';
  }

  return normalizedName[0]?.toUpperCase() ?? 'G';
}
