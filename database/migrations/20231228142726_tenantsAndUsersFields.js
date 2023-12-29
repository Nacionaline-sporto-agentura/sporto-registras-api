/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('tenants', (table) => {
      table.string('tenantType', 255);
      table.string('type', 255);
      table.string('legalForm', 255);
      table.text('address');
      table.jsonb('data');
    })
    .alterTable('users', (table) => {
      table.string('authStrategy', 255);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('tenants', (table) => {
      table.dropColumn('tenantType');
      table.dropColumn('type');
      table.dropColumn('legalForm');
      table.dropColumn('address');
      table.dropColumn('data');
    })
    .alterTable('users', (table) => {
      table.dropColumn('authStrategy');
    });
};
