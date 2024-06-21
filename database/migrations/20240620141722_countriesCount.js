/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('competitionsResults', (table) => {
    table.integer('countriesCount').unsigned();
    table.integer('sportTypeId').unsigned();
    table.dropColumn('sportsTypeId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('competitionsResults', (table) => {
    table.dropColumn('countriesCount');
    table.integer('sportsTypeId').unsigned();
    table.dropColumn('sportTypeId');
  });
};
