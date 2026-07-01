import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY solo per questa migrazione amministrativa.');

const municipalities = JSON.parse(await readFile('public/data/comuni-italiani.json', 'utf8'));
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
const find = (city, province) => {
  const matches = municipalities.filter(item => normalize(item.name) === normalize(city) && (
    !province || normalize(item.provinceCode) === normalize(province) || normalize(item.provinceName) === normalize(province)
  ));
  return matches.length === 1 ? matches[0] : null;
};
const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const sources = [
  ['profiles', 'id'], ['service_requests', 'id'], ['service_areas', 'id'],
  ['company_service_areas', 'id'], ['job_posts', 'id'], ['candidate_profiles', 'id'],
];

let updated = 0; let unresolved = 0;
for (const [table, idColumn] of sources) {
  const { data, error } = await client.from(table).select(`${idColumn},city,province,municipality_code`).is('municipality_code', null).not('city', 'is', null);
  if (error) throw error;
  for (const row of data ?? []) {
    const municipality = find(row.city, row.province);
    if (!municipality) {
      unresolved += 1;
      await client.from('municipality_migration_issues').upsert({ source_table: table, source_id: String(row[idColumn]), city: row.city, province: row.province }, { onConflict: 'source_table,source_id' });
      continue;
    }
    const result = await client.from(table).update({ municipality_code: municipality.code, city: municipality.name, province_code: municipality.provinceCode, province: municipality.provinceName }).eq(idColumn, row[idColumn]);
    if (result.error) throw result.error;
    updated += 1;
  }
}
console.log(`Migrazione completata: ${updated} record aggiornati, ${unresolved} da verificare in municipality_migration_issues.`);
