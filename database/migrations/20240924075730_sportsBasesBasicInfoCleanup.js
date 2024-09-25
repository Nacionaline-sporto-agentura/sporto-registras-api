/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.dropColumn('sportBaseTechnicalConditionId');
    table.text('notes');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.integer('sportBaseTechnicalConditionId');
    table.dropColumn('notes');
  });
};
