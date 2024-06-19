const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsBasesSpaces', (table) => {
      table.integer('sportBaseSpaceBuildingPurposeId').unsigned();
      table.integer('sportBaseSpaceEnergyClassId').unsigned();
      table.dropColumn('sportBaseSpaceBuildingTypeId');
      table.dropColumn('buildingPurpose');
      table.dropColumn('energyClass');
    })
    .createTable('sportsBasesSpacesBuildingPurposes', (table) => {
      table.increments('id');
      table.integer('parentId').unsigned().nullable();
      table.text('name');
      commonFields(table);
    })
    .createTable('sportBaseSpaceEnergyClasses', (table) => {
      table.increments('id');
      table.text('name');
      commonFields(table);
    })
    .dropTable('sportsBasesSpacesBuildingTypes');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsBasesSpaces', (table) => {
      table.dropColumn('sportBaseSpaceBuildingPurposeId');
      table.dropColumn('sportBaseSpaceEnergyClassId');
      table.integer('sportBaseSpaceBuildingTypeId').unsigned();
      table.text('buildingPurpose');
      table.text('energyClass');
    })
    .dropTable('sportsBasesSpacesBuildingPurposes')
    .dropTable('sportBaseSpaceEnergyClasses')
    .createTable('sportsBasesSpacesBuildingTypes', (table) => {
      table.increments('id');
      table.string('name');
      commonFields(table);
    });
};
