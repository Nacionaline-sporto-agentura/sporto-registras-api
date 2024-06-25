/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsPersons', (table) => {
      table.integer('tenantId').unsigned();
    })
    .alterTable('competitions', (table) => {
      table.integer('tenantId').unsigned();
    })
    .alterTable('competitionsResults', (table) => {
      table.integer('resultTypeId').unsigned();
      table.dropColumn('resultType');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsPersons', (table) => {
      table.dropColumn('tenantId');
    })
    .alterTable('competitions', (table) => {
      table.dropColumn('tenantId');
    })
    .alterTable('competitionsResults', (table) => {
      table.integer('resultType').unsigned();
      table.dropColumn('resultTypeId');
    });
};
