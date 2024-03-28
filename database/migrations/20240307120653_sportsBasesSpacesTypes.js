const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sportsBasesSpacesTypes', (table) => {
    table.increments('id');
    table.integer('typeId').unsigned().nullable();
    table.text('name');
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsBasesSpacesTypes');
};
