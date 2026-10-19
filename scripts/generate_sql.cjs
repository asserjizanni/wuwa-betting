const fs = require('fs');
const path = require('path');

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards_seed.json'), 'utf8'));

// Format SQL values
function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeJson(obj) {
  if (!obj) return `'{}'::jsonb`;
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

const statements = [];

for (const card of cards) {
  const charId = escapeSqlString(card.character_id);
  const templateId = escapeSqlString(card.template_id);
  const setId = `'b4734a81-46a8-4fa3-bc49-f2fc119ccd26'`;
  const name = escapeSqlString(card.name);
  const title = escapeSqlString(card.title);
  const subtitle = escapeSqlString(card.subtitle);
  const decorativeText = escapeSqlString(card.decorative_text);
  const element = escapeSqlString(card.element);
  const rarity = `'${card.rarity}'::card_rarity`;
  const desc = escapeSqlString(card.subtitle);
  const imagePath = escapeSqlString(card.image_path);
  const cardDesignOverride = escapeJson(card.card_design_override);
  const isLimited = card.is_limited ? 'true' : 'false';
  const maxSupply = card.max_supply ? card.max_supply : 'NULL';
  const stats = escapeJson(card.stats);
  const skills = escapeJson(card.skills);

  const stmt = `
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  ${charId}, ${templateId}, ${setId}, ${name}, ${title}, ${subtitle}, ${decorativeText},
  ${element}, ${rarity}, ${desc}, ${imagePath}, ${cardDesignOverride},
  ${isLimited}, ${maxSupply}, 0, true, ${stats}, ${skills}
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = ${name}
);`;
  statements.push(stmt);
}

// Split into batches of 15 statements
const batches = [];
for (let i = 0; i < statements.length; i += 15) {
  batches.push(statements.slice(i, i + 15).join('\n'));
}

console.log(`Generated ${statements.length} SQL insert statements in ${batches.length} batches.`);
fs.writeFileSync(path.join(__dirname, 'insert_batches.json'), JSON.stringify(batches, null, 2), 'utf8');
