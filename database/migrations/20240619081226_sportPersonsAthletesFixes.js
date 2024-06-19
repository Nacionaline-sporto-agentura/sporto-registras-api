/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsPersonsAthletes', (table) => {
    table.dropColumn('sportsBases');
    table.dropColumn('workRelations');
    table.dropColumn('winnings');
    table.dropColumn('bonuses');
    table.dropColumn('scholarships');
    table.dropColumn('pensions');
    table.dropColumn('nationalTeams');
    table.dropColumn('violations');
    table.dropColumn('studies');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsPersonsAthletes', (table) => {
    table.jsonb('sportsBases');
    table.jsonb('workRelations');
    table.jsonb('winnings');
    table.jsonb('bonuses');
    table.jsonb('scholarships');
    table.jsonb('pensions');
    table.jsonb('nationalTeams');
    table.jsonb('violations');
    table.jsonb('studies');
  });
};
