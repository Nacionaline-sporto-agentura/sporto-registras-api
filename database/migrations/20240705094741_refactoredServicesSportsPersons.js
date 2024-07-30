const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsPersonsCoaches', (table) => {
      table.dropColumn('sportsBases');
      table.dropColumn('nationalTeams');
      table.dropColumn('bonuses');
      table.dropColumn('workRelations');
      table.dropColumn('studies');
    })
    .alterTable('sportsPersonsReferees', (table) => {
      table.dropColumn('studies');
    })
    .createTable('typesEducationalCompanies', (table) => {
      table.increments('id');
      table.string('name');
      table.string('code');
      commonFields(table);
    })
    .createTable('typesQualificationCategories', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .dropTable('typesCategoriesCompanies')
    .alterTable('sportsPersonsFaInstructors', (table) => {
      table.dropColumn('sportsBases');
      table.dropColumn('competences');
      table.dropColumn('workRelations');
      table.dropColumn('studies');
    })
    .dropTable('typesStudiesCompanies');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsPersonsCoaches', (table) => {
      table.jsonb('sportsBases');
      table.jsonb('nationalTeams');
      table.jsonb('bonuses');
      table.jsonb('workRelations');
      table.jsonb('studies');
    })
    .alterTable('sportsPersonsReferees', (table) => {
      table.jsonb('studies');
    })
    .dropTable('typesEducationalCompanies')
    .dropTable('typesQualificationCategories')
    .createTable('typesCategoriesCompanies', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .alterTable('sportsPersonsFaInstructors', (table) => {
      table.jsonb('sportsBases');
      table.jsonb('competences');
      table.jsonb('workRelations');
      table.jsonb('studies');
    })
    .createTable('typesStudiesCompanies', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    });
};
