const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sportsBasesSpacesTypesAndFields', (table) => {
    table.increments('id');
    table.integer('typeId').unsigned().notNullable();
    table.integer('fieldId').unsigned().notNullable();
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsBasesSpacesTypesAndFields');
};
