/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('rcAddresses', (table) => {
      table.increments('id');
      table.bigInteger('code');
    })
    .createTable('rcRooms', (table) => {
      table.increments('id');
      table.bigInteger('code');
    })
    .createTable('rcStreets', (table) => {
      table.increments('id');
      table.bigInteger('code');
    })
    .createTable('rcResidentialAreas', (table) => {
      table.increments('id');
      table.bigInteger('code');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('rcAddresses')
    .dropTable('rcRooms')
    .dropTable('rcStreets')
    .dropTable('rcResidentialAreas');
};
