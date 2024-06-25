/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { commonFields } = require('./20231219091739_setup');

exports.up = function (knex) {
  return knex.schema
    .createTable('competitions', (table) => {
      table.increments('id');
      table.string('name');
      table.string('year');
      table.integer('competitionTypeId').unsigned();
      table.string('website');
      table.jsonb('protocolDocument');
      commonFields(table);
    })
    .createTable('competitionsResults', (table) => {
      table.increments('id');
      table.integer('competitionId').unsigned();
      table.integer('sportsTypeId').unsigned();
      table.integer('matchId').unsigned();
      table.string('otherMatch');
      table.enum('matchType', ['INDIVIDUAL', 'TEAM']);
      table.boolean('selection');
      table.jsonb('sportsPersons');
      table.integer('resultType').unsigned();
      table.jsonb('result');
      table.integer('stages');
      table.integer('participantsNumber');
      commonFields(table);
    })
    .createTable('typesCompetitionsResultTypes', (table) => {
      table.increments('id');
      table.string('name');
      table.enum('type', ['NUMBER', 'NONE', 'RANGE']);
      commonFields(table);
    })
    .renameTable('typesCompetitionTypes', 'typesCompetitionsTypes');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable('competitionsResults')
    .dropTable('competitions')
    .dropTable('typesCompetitionsResultTypes')
    .renameTable('typesCompetitionsTypes', 'typesCompetitionTypes');
};
