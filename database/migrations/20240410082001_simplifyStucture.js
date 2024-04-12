/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .dropTable('sportsBasesSpacesTypesAndFieldsValues')
    .alterTable('sportsBasesSpaces', (table) => {
      table.jsonb('additionalValues');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .createTable('sportsBasesSpacesTypesAndFieldsValues', (table) => {
      table.increments('id');
      table.integer('typeAndFieldId').unsigned().notNullable();
      table.integer('sportBaseSpaceId').unsigned().notNullable();
      table.jsonb('value');
      commonFields(table);
    })
    .alterTable('sportsBasesSpaces', (table) => {
      table.dropColumn('additionalValues');
    });
};
