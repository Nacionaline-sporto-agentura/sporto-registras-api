const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('scholarships', (table) => {
    table.increments('id');
    table.integer('sportsPersonId').unsigned();
    table.integer('resultId').unsigned();
    table.string('documentNumber', 255);
    table.timestamp('date');
    table.timestamp('dateFrom');
    table.timestamp('dateTo');
    table.double('amount');
    table.jsonb('data');
    table.enum('status', ['ACTIVE', 'SUSPENDED', 'TERMINATED']);
    commonFields(table);
  });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('scholarships');
};
