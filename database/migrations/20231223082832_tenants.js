const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('tenants', (table) => {
      table.increments('id');
      table.string('name', 255);
      table.integer('authGroupId').unsigned();
      table.string('phone', 255);
      table.string('email', 255);
      table.string('code', 255);
      table.integer('parentId').unsigned();
      commonFields(table);
    })
    .createTable('tenantUsers', (table) => {
      table.increments('id');
      table.integer('tenantId').unsigned().notNullable();
      table.integer('userId').unsigned().notNullable();
      table
        .enu('role', ['USER', 'ADMIN'], {
          useNative: true,
          enumName: 'tenant_user_role',
        })
        .defaultTo('USER');
      commonFields(table);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('tenants').dropTable('tenantUsers');
};
