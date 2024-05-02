/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsBasesTenants', (table) => {
    table.dropColumn('componyName');
    table.string('companyName');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsBasesTenants', (table) => {
    table.dropColumn('companyName');
    table.string('componyName');
  });
};
