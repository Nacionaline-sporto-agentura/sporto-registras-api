/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { commonFields } = require('./20231219091739_setup');
exports.up = function (knex) {
  return knex.schema
    .createTable('sportsBasesBuildingTypes', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('sportsBasesTypes', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('sportsBasesTechnicalConditions', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('sportsBasesLevels', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('sportsBasesTypes')
    .dropTable('sportsBasesTechnicalConditions')
    .dropTable('sportsBasesLevels')
    .dropTable('sportsBasesBuildingTypes');
};
