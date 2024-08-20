/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsBasesSpaces', (table) => {
      table.dropColumn('constructionDate');
      table.dropColumn('latestRenovationDate');
    })
    .alterTable('sportsBasesSpaces', (table) => {
      table.string('constructionDate', 4);
      table.string('latestRenovationDate', 4);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsBasesSpaces', (table) => {
      table.dropColumn('constructionDate');
      table.dropColumn('latestRenovationDate');
    })
    .alterTable('sportsBasesSpaces', (table) => {
      table.timestamp('constructionDate');
      table.timestamp('latestRenovationDate');
    });
};
