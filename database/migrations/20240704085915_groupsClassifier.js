const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('typesSportsBasesSpacesGroups', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .alterTable('typesSportsBasesSpacesTypes', (table) => {
      table.dropColumn('sportBaseTypeId');
      table.integer('sportBaseSpaceGroupId').unsigned();
    })
    .alterTable('typesSportsBasesSpacesFields', (table) => {
      table.boolean('required');
    })
    .alterTable('sportsBasesSpaces', (table) => {
      table.integer('sportBaseSpaceGroupId').unsigned();
    });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('typesSportsBasesSpacesGroups')
    .alterTable('typesSportsBasesSpacesTypes', (table) => {
      table.dropColumn('sportBaseSpaceGroupId');
      table.integer('sportBaseTypeId').unsigned();
    })
    .alterTable('typesSportsBasesSpacesFields', (table) => {
      table.dropColumn('required');
    })
    .alterTable('sportsBasesSpaces', (table) => {
      table.dropColumn('sportBaseSpaceGroupId');
    });
};
