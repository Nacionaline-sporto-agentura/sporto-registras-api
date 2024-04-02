const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sportsBasesSpacesTypesAndFieldsValues', (table) => {
    table.increments('id');
    table.integer('typeAndFieldId').unsigned().notNullable();
    table.integer('sportBaseSpaceId').unsigned().notNullable();
    table.jsonb('value');
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsBasesSpacesTypesAndFieldsValues');
};
