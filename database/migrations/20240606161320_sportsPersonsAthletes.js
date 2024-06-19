const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('sportsPersonsAthletes', (table) => {
      table.increments('id');
      table.jsonb('sportsBases');
      table.jsonb('workRelations');
      table.jsonb('winnings');
      table.jsonb('bonuses');
      table.jsonb('scholarships');
      table.jsonb('pensions');
      table.jsonb('nationalTeams');
      table.jsonb('memberships');
      table.jsonb('violations');
      table.jsonb('coaches');
      table.jsonb('studies');
      table.timestamp('careerEndedAt');

      commonFields(table);
    })
    .createTable('typesCompetitionTypes', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('typesSportsPersonsViolationsAntiDoping', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('typesSportsPersonsViolationsResultsManipulation', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('typesSportsPersonsViolationsSanctions', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsPersonsAthletes');
};
