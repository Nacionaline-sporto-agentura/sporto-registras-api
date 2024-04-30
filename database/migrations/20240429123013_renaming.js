/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('sportsBasesInvestments', (table) => {
      table.renameColumn('sourceId', 'sportBaseInvestmentSourceId');
    })
    .alterTable('sportsBases', (table) => {
      table.renameColumn('typeId', 'sportBaseTypeId');
      table.renameColumn('levelId', 'sportBaseLevelId');
      table.renameColumn('technicalConditionId', 'sportBaseTechnicalConditionId');
    })
    .renameTable('sportsBasesBuildingTypes', 'sportsBasesSpacesBuildingTypes')
    .alterTable('sportsBasesSpaces', (table) => {
      table.renameColumn('sportTypes', 'sportBaseSpaceSportTypes');
      table.renameColumn('technicalConditionId', 'sportBaseTechnicalConditionId');
      table.renameColumn('buildingTypeId', 'sportBaseSpaceBuildingTypeId');
      table.renameColumn('typeId', 'sportBaseSpaceTypeId');
    })
    .alterTable('sportsBasesSpacesTypes', (table) => {
      table.renameColumn('typeId', 'sportBaseTypeId');
    })
    .alterTable('sportsBasesSpacesTypesAndFields', (table) => {
      table.renameColumn('typeId', 'sportBaseSpaceTypeId');
      table.renameColumn('fieldId', 'sportBaseSpaceFieldId');
    });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('sportsBasesInvestments', (table) => {
      table.renameColumn('sportBaseInvestmentSourceId', 'sourceId');
    })
    .alterTable('sportsBases', (table) => {
      table.renameColumn('sportBaseTypeId', 'typeId');
      table.renameColumn('sportBaseLevelId', 'levelId');
      table.renameColumn('sportBaseTechnicalConditionId', 'technicalConditionId');
    })
    .renameTable('sportsBasesSpacesBuildingTypes', 'sportsBasesBuildingTypes')
    .alterTable('sportsBasesSpaces', (table) => {
      table.renameColumn('sportBaseSpaceSportTypes', 'sportTypes');
      table.renameColumn('sportBaseTechnicalConditionId', 'technicalConditionId');
      table.renameColumn('sportBaseSpaceBuildingTypeId', 'buildingTypeId');
      table.renameColumn('sportBaseSpaceTypeId', 'typeId');
    })
    .alterTable('sportsBasesSpacesTypes', (table) => {
      table.renameColumn('sportBaseTypeId', 'typeId');
    })
    .alterTable('sportsBasesSpacesTypesAndFields', (table) => {
      table.renameColumn('sportBaseSpaceTypeId', 'typeId');
      table.renameColumn('sportBaseSpaceFieldId', 'fieldId');
    });
};
