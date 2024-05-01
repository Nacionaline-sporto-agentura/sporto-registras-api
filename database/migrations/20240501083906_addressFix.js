/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsBases', (table) => {
      table.dropColumn('address');
    })
    .alterTable('sportsBases', (table) => {
      table.jsonb('address');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsBases', (table) => {
      table.dropColumn('address');
    })
    .alterTable('sportsBases', (table) => {
      table.string('address');
    });
};
