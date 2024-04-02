const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sportsBasesSpacesFields', (table) => {
    table.increments('id');
    table.string('title');
    table.integer('precision');
    table.integer('scale');
    table.enu('type', ['SELECT', 'TEXT', 'BOOLEAN', 'NUMBER'], {
      useNative: true,
      enumName: 'sport_base_space_field_type',
    });
    table.jsonb('options');
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsBasesSpacesFields');
};
