const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('tenants', (table) => {
    table.integer('legalFormId').unsigned();
    table.integer('sportOrganizationTypeId').unsigned();
    table.dropColumn('legalForm');
    table.dropColumn('type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('tenants', (table) => {
    table.string('type', 255);
    table.string('legalForm', 255);
    table.dropColumn('legalFormId');
    table.dropColumn('sportOrganizationTypeId');
  });
};
