const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('sportsPersonsFaInstructors', (table) => {
      table.increments('id');
      table.integer('sportsPersonId').unsigned();
      table.jsonb('sportsBases');
      table.jsonb('faSpecialists');
      table.jsonb('competences');
      table.jsonb('workRelations');
      table.jsonb('studies');
      commonFields(table);
    })
    .createTable('sportsPersonsReferees', (table) => {
      table.increments('id');
      table.integer('sportsPersonId').unsigned();
      table.jsonb('categories');
      table.jsonb('studies');
      table.timestamp('careerEndedAt');
      commonFields(table);
    })
    .createTable('typesCategoriesCompanies', (table) => {
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
  return knex.schema
    .dropTable('sportsPersonsFaInstructors')
    .dropTable('sportsPersonsReferees')
    .dropTable('typesCategoriesCompanies');
};
