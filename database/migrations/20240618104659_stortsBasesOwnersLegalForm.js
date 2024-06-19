/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsBasesOwners', (table) => {
    table.enum('legalForm', ['COMPANY', 'PERSON']);
    table.renameColumn('companyCode', 'code');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsBasesOwners', (table) => {
    table.dropColumns('legalForm');
    table.renameColumn('code', 'companyCode');
  });
};
