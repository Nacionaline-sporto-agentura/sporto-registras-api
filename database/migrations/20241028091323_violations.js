const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('typesViolationsDisqualificationReasons', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    })
    .createTable('violations', (table) => {
      table.increments('id');
      table.enum('type', ['DOPING', 'MANIPULATION']);
      table.integer('sportsPersonId').unsigned();
      table.integer('sportTypeId').unsigned();
      table.enum('penaltyType', ['SUSPENSION', 'DISQUALIFICATION']);
      table.integer('disqualificationReasonId').unsigned();
      table.timestamp('dateFrom');
      table.timestamp('dateTo');
      table.string('description');
      table.integer('competitionResultId').unsigned();
      table.boolean('invalidateResult');
      commonFields(table);
    });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('violations').dropTable('typesViolationsDisqualificationReasons');
};
