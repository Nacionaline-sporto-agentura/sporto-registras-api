const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.dropColumn('disabledAccessible');
    table.dropColumn('blindAccessible');
    table.dropColumn('dressingRooms');
    table.dropColumn('diningPlaces');
    table.dropColumn('accommodationPlaces');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.boolean('disabledAccessible');
    table.boolean('blindAccessible');
    table.integer('dressingRooms');
    table.integer('diningPlaces');
    table.integer('accommodationPlaces');
  });
};
