const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .renameTable('typesSportsBasesSpacesSportTypes', 'typesSportTypes')
    .createTable('sportsPersonsCoaches', (table) => {
      table.increments('id');
      table.integer('sportsPersonId').unsigned();
      table.jsonb('sportsBases');
      table.jsonb('nationalTeams');
      table.jsonb('bonuses');
      table.jsonb('workRelations');
      table.jsonb('competences');
      table.jsonb('studies');
      commonFields(table);
    })
    .createTable('typesNationalTeamAgeGroups', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('typesNationalTeamGenders', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('typesTenantsWorkRelations', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('typesStudiesCompanies', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('typesStudiesPrograms', (table) => {
      table.increments('id');
      table.string('name');
      table.integer('studiesCompanyId').unsigned();
      commonFields(table);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .renameTable('typesSportTypes', 'typesSportsBasesSpacesSportTypes')
    .dropTable('sportsPersonsCoaches')
    .dropTable('typesNationalTeamAgeGroups')
    .dropTable('typesNationalTeamGenders')
    .dropTable('typesTenantsWorkRelations')
    .dropTable('typesStudiesCompanies')
    .dropTable('typesStudiesPrograms');
};
