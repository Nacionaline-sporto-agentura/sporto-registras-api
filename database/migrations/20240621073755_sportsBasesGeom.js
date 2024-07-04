/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .raw(`CREATE EXTENSION IF NOT EXISTS postgis;`)
    .raw(`ALTER TABLE sports_bases ADD COLUMN geom geometry(geometry, 3346)`)
    .raw(`CREATE INDEX sports_bases_geom_idx ON sports_bases USING GIST (geom)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sports_bases', (table) => {
    table.dropColumn('geom');
  });
};
