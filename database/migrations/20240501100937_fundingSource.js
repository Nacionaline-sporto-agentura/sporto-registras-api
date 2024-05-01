const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema
    .renameTable('tenantInvestments', 'tenantFundingSources')
    .renameTable('tenantInvestmentSources', 'tenantFundingSourcesTypes')
    .alterTable('tenantFundingSources', (table) => {
      table.dropColumn('tenantInvestmentSourceId');
      table.integer('tenantFundingSourceTypeId').unsigned();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .renameTable('tenantFundingSources', 'tenantInvestments')
    .renameTable('tenantFundingSourcesTypes', 'tenantInvestmentSources')
    .alterTable('tenantFundingSources', (table) => {
      table.integer('tenantInvestmentSourceId').unsigned();
      table.dropColumn('tenantFundingSourceTypeId');
    });
};
