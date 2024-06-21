/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsPersonsAthletes', (table) => {
    table.integer('sportsPersonId').unsigned();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsPersonsAthletes', (table) => {
    table.dropColumn('sportsPersonId');
  });
};
