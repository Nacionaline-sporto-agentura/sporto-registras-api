const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable('sportsBasesInvestments', (table) => {
    table.increments('id');
    table.integer('sourceId').unsigned();
    table.integer('sportBaseId').unsigned();
    table.timestamp('appointedAt');
    table.text('improvements');
    table.integer('fundsAmount');

    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsBasesInvestments');
};
