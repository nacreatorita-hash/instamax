export interface Municipality {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  regionCode: string;
  regionName: string;
}

let municipalityPromise: Promise<Municipality[]> | null = null;

export function normalizeMunicipalitySearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').trim();
}

export function loadMunicipalities(): Promise<Municipality[]> {
  municipalityPromise ??= fetch(`${import.meta.env.BASE_URL}data/comuni-italiani.json`)
    .then(response => {
      if (!response.ok) throw new Error('Elenco dei comuni non disponibile.');
      return response.json() as Promise<Municipality[]>;
    });
  return municipalityPromise;
}

export async function findMunicipalityByLegacyLocation(city: string | null, province: string | null) {
  if (!city) return null;
  const cityKey = normalizeMunicipalitySearch(city);
  const provinceKey = normalizeMunicipalitySearch(province ?? '');
  const municipalities = await loadMunicipalities();
  return municipalities.find(item => normalizeMunicipalitySearch(item.name) === cityKey && (
    !provinceKey || normalizeMunicipalitySearch(item.provinceCode) === provinceKey || normalizeMunicipalitySearch(item.provinceName) === provinceKey
  )) ?? null;
}
