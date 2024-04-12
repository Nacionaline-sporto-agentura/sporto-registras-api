const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('requests', (table) => {
    table.increments('id');
    table
      .enu('status', ['DRAFT', 'CREATED', 'RETURNED', 'REJECTED', 'APPROVED', 'SUBMITTED'], {
        useNative: true,
        enumName: 'request_status',
      })
      .defaultTo('DRAFT');
    table.string('entityType'); // TODO: enum
    table.integer('entityId').unsigned(); // TODO: notNullable?
    table.integer('tenantId').unsigned();
    table.json('changes');
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('requests');
};
