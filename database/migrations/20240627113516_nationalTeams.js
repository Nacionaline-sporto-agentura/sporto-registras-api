const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('nationalTeams', (table) => {
    table.increments('id');
    table.string('name');
    table.datetime('startAt');
    table.datetime('endAt');
    table.integer('ageGroupId').unsigned();
    table.integer('genderId').unsigned();
    table.integer('sportTypeId').unsigned();
    table.jsonb('athletes');
    table.jsonb('coaches');
    table.integer('tenantId').unsigned();
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('nationalTeams');
};
