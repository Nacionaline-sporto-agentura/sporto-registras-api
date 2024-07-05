const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('sportsPersonsFaSpecialists', (table) => {
      table.increments('id');
      commonFields(table);
    })
    .alterTable('sportsPersons', (table) => {
      table.integer('faSpecialistId').unsigned();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('sportsPersonsFaSpecialists')
    .alterTable('sportsPersons', (table) => {
      table.dropColumn('faSpecialistId');
    });
};
