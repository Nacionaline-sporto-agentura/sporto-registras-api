const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('requestHistories', (table) => {
    table.increments('id');
    table.integer('requestId').unsigned().notNullable();
    table.enu('type', ['CREATED', 'SUBMITTED', 'REJECTED', 'RETURNED', 'APPROVED', 'DELETED'], {
      useNative: true,
      enumName: 'request_history_type',
    });
    table.text('comment');
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
