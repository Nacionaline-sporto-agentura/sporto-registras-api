/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('typesSportsBasesTechnicalConditions', (table) => {
    table.string('color', 7).defaultTo('#FFFFFF');
    table.string('description', 255);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('typesSportsBasesTechnicalConditions', (table) => {
    table.dropColumn('color');
    table.dropColumn('description');
  });
};
