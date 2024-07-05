const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('sportsPersonsAmsInstructors', (table) => {
      table.increments('id');
      table.jsonb('coaches');
      commonFields(table);
    })
    .alterTable('sportsPersons', (table) => {
      table.integer('amsInstructorId').unsigned();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('sportsPersonsAmsInstructors')
    .alterTable('sportsPersons', (table) => {
      table.dropColumn('amsInstructorId');
    });
};
