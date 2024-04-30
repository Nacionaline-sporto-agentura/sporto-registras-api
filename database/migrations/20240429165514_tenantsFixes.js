const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('sportsBasesTenantsBasis', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .alterTable('sportsBasesTenants', (table) => {
      table.dropColumn('tenantId');
      table.string('companyCode');
      table.string('componyName');
      table.integer('sportsBasesTenantsBasisId').unsigned().notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('sportsBasesTenantsBasis')
    .alterTable('sportsBasesTenants', (table) => {
      table.integer('tenantId').unsigned().notNullable();
      table.dropColumns('companyCode', 'componyName', 'sportsBasesTenantsBasisId');
    });
};
