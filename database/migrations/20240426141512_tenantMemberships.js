const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable('tenantMemberships', (table) => {
    table.increments('id');
    table.integer('tenantId').unsigned();
    table.enu('type', ['LITHUANIAN', 'INTERNATIONAL'], {
      useNative: true,
      enumName: 'tenant_memberships_type',
    });
    table.text('name');
    table.text('companyCode');
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
  return knex.schema.dropTable('tenantMemberships');
};
