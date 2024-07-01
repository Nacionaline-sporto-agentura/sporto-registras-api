const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('bonuses', (table) => {
    table.increments('id');
    table.integer('sportsPersonId').unsigned();
    table.integer('resultId').unsigned();
    table.string('documentNumber', 255);
    table.timestamp('date');
    table.double('amount');
    table.enum('type', ['NATIONAL', 'MUNICIPAL']);
    commonFields(table);
  });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('bonuses');
};
