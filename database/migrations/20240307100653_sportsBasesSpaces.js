const { commonFields } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sportsBasesSpaces', (table) => {
    table.increments('id');
    table.string('name');
    table.integer('sportBaseId').unsigned().notNullable();
    table.integer('typeId').unsigned().notNullable();
    table.jsonb('sportTypes');
    table.integer('technicalConditionId').unsigned();
    table.integer('buildingTypeId').unsigned();
    table.string('buildingNumber', 255);
    table.text('buildingPurpose');
    table.string('energyClass', 255);
    table.double('buildingArea');
    table.jsonb('energyClassCertificate');
    table.timestamp('constructionDate');
    table.timestamp('latestRenovationDate');
    table.jsonb('photos');
    commonFields(table);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('sportsBasesSpaces');
};
