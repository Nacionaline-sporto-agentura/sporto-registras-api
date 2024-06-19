/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsPersons', (table) => {
    table.dropColumn('country');
    table.dropColumn('qualification');
    table.dropColumn('phone');
    table.dropColumn('email');
    table.dropColumn('municipality');
    table.dropColumn('city');
    table.dropColumn('street');

    table.jsonb('sportTypes');
    table.jsonb('workRelations');
    table.jsonb('education');
    table.jsonb('sportsBases');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsPersons', (table) => {
    table.string('country');
    table.string('qualification');
    table.string('phone');
    table.string('email');
    table.string('municipality');
    table.string('city');
    table.string('street');

    table.dropColumn('sportTypes');
    table.dropColumn('workRelations');
    table.dropColumn('education');
    table.dropColumn('sportsBases');
  });
};
