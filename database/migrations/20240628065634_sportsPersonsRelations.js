/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsPersons', (table) => {
      table.integer('athleteId').unsigned();
      table.integer('coachId').unsigned();
      table.integer('faInstructorId').unsigned();
      table.integer('refereeId').unsigned();
    })
    .alterTable('sportsPersonsAthletes', (table) => {
      table.dropColumn('sportsPersonId');
    })
    .alterTable('sportsPersonsCoaches', (table) => {
      table.dropColumn('sportsPersonId');
    })
    .alterTable('sportsPersonsFaInstructors', (table) => {
      table.dropColumn('sportsPersonId');
    })
    .alterTable('sportsPersonsReferees', (table) => {
      table.dropColumn('sportsPersonId');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsPersons', (table) => {
      table.dropColumn('athleteId');
      table.dropColumn('coachId');
      table.dropColumn('faInstructorId');
      table.dropColumn('refereeId');
    })
    .alterTable('sportsPersonsAthletes', (table) => {
      table.integer('sportsPersonId').unsigned();
    })
    .alterTable('sportsPersonsCoaches', (table) => {
      table.integer('sportsPersonId').unsigned();
    })
    .alterTable('sportsPersonsFaInstructors', (table) => {
      table.integer('sportsPersonId').unsigned();
    })
    .alterTable('sportsPersonsReferees', (table) => {
      table.integer('sportsPersonId').unsigned();
    });
};
