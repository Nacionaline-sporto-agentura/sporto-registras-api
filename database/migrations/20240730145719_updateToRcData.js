const { commonFields } = require('./20231219091739_setup');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsBasesSpaces', (table) => {
      table.dropColumn('sportBaseSpaceBuildingPurposeId');
      table.dropColumn('sportBaseSpaceEnergyClassId');
      table.string('buildingPurpose');
      table.string('energyClass');
    })
    .dropTable('typesSportsBasesSpacesBuildingPurposes')
    .dropTable('typesSportsBasesSpacesEnergyClasses');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsBasesSpaces', (table) => {
      table.integer('sportBaseSpaceBuildingPurposeId').unsigned();
      table.integer('sportBaseSpaceEnergyClassId').unsigned();
      table.dropColumn('buildingPurpose');
      table.dropColumn('energyClass');
    })
    .createTable('typesSportsBasesSpacesBuildingPurposes', (table) => {
      table.increments('id');
      table.integer('parentId').unsigned().nullable();
      table.text('name');
      commonFields(table);
    })
    .createTable('typesSportsBasesSpacesEnergyClasses', (table) => {
      table.increments('id');
      table.text('name');
      commonFields(table);
    });
};
