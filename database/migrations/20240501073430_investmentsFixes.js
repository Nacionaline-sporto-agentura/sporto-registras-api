const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema
    .createTable('sportsBasesInvestmentsItems', (table) => {
      table.increments('id');
      table.integer('sportBaseInvestmentId').unsigned();
      table.integer('sportBaseInvestmentSourceId').unsigned();
      table.integer('fundsAmount');

      commonFields(table);
    })
    .alterTable('sportsBasesInvestments', (table) => {
      table.dropColumn('sportBaseInvestmentSourceId');
      table.dropColumn('fundsAmount');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('sportsBasesInvestmentsItems')
    .alterTable('sportsBasesInvestments', (table) => {
      table.integer('sportBaseInvestmentSourceId').unsigned();
      table.integer('fundsAmount');
    });
};
