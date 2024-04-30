const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable('tenantInvestments', (table) => {
    table.increments('id');
    table.integer('tenantInvestmentSourceId').unsigned();
    table.integer('tenantId').unsigned();
    table.timestamp('appointedAt');
    table.text('description');
    table.integer('fundsAmount');

    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('tenantInvestments');
};
