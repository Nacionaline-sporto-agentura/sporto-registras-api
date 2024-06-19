const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sportsPersons', (table) => {
    table.increments('id');
    table.string('firstName');
    table.string('lastName');
    table.string('personalCode');
    table.string('nationality');
    table.string('country');
    table.string('qualification');
    table.string('phone');
    table.string('email');
    table.string('municipality');
    table.string('city');
    table.string('street');
    table.jsonb('studies');

    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsPersons');
};
