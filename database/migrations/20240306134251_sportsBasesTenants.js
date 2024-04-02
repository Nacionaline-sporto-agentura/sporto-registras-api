const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable('sportsBasesTenants', (table) => {
    table.increments('id');
    table.integer('tenantId').unsigned().notNullable();
    table.integer('sportBaseId').unsigned().notNullable();
    table.timestamp('startAt');
    table.timestamp('endAt');
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsBasesTenants');
};
