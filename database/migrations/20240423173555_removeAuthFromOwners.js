/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsBasesOwners', (table) => {
    table.dropColumn('tenantId');
    table.dropColumn('userId');
    table.string('name');
    table.string('website');
    table.string('companyCode');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsBasesOwners', (table) => {
    table.integer('tenantId').unsigned();
    table.integer('userId').unsigned();
    table.dropColumn('name');
    table.dropColumn('website');
    table.dropColumn('companyCode');
  });
};
