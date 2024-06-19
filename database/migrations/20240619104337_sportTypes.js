const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('typesSportTypes', (table) => {
      table.boolean('olympic');
      table.boolean('paralympic');
      table.boolean('strategic');
      table.boolean('technical');
      table.boolean('deaf');
      table.boolean('specialOlympics');
    })
    .createTable('typesSportTypesMatches', (table) => {
      table.increments('id');
      table.integer('sportTypeId').unsigned();
      table.string('name');
      table.enu('type', ['INDIVIDUAL', 'TEAM'], {
        useNative: true,
        enumName: 'types_sport_types_type',
      });
      table.boolean('olympic');
      table.boolean('paralympic');
      table.boolean('deaf');
      table.boolean('specialOlympics');

      commonFields(table);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('typesSportTypes', (table) => {
      table.dropColumn('olympic');
      table.dropColumn('paralympic');
      table.dropColumn('strategic');
      table.dropColumn('technical');
      table.dropColumn('deaf');
      table.dropColumn('specialOlympics');
    })
    .dropTable('typesSportTypesMatches');
};
