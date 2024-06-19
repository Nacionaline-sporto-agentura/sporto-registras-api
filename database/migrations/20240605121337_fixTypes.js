/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .renameTable('tenantSportOrganizationTypes', 'typesTenantsSportOrganizationTypes')
    .renameTable('tenantLegalForms', 'typesTenantsLegalForms')
    .renameTable('tenantFundingSourcesTypes', 'typesTenantsFundingSourcesTypes')
    .renameTable('sportsBasesTypes', 'typesSportsBasesTypes')
    .renameTable('sportsBasesTechnicalConditions', 'typesSportsBasesTechnicalConditions')
    .renameTable('sportsBasesLevels', 'typesSportsBasesLevels')
    .renameTable('sportsBasesTenantsBasis', 'typesSportsBasesTenantsBasis')
    .renameTable('sportsBasesSpacesTypesAndFields', 'typesSportsBasesSpacesTypesAndFields')
    .renameTable('sportsBasesSpacesTypes', 'typesSportsBasesSpacesTypes')
    .renameTable('sportsBasesInvestmentsSources', 'typesSportsBasesInvestmentsSources')
    .renameTable('sportsBasesSpacesBuildingPurposes', 'typesSportsBasesSpacesBuildingPurposes')
    .renameTable('sportBaseSpaceEnergyClasses', 'typesSportsBasesSpacesEnergyClasses')
    .renameTable('sportsBasesSpacesFields', 'typesSportsBasesSpacesFields')
    .renameTable('sportsBasesSpacesSportTypes', 'typesSportsBasesSpacesSportTypes');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .renameTable('typesTenantsSportOrganizationTypes', 'tenantSportOrganizationTypes')
    .renameTable('typesTenantsLegalForms', 'tenantLegalForms')
    .renameTable('typesTenantsFundingSourcesTypes', 'tenantFundingSourcesTypes')
    .renameTable('typesSportsBasesTypes', 'sportsBasesTypes')
    .renameTable('typesSportsBasesTechnicalConditions', 'sportsBasesTechnicalConditions')
    .renameTable('typesSportsBasesLevels', 'sportsBasesLevels')
    .renameTable('typesSportsBasesTenantsBasis', 'sportsBasesTenantsBasis')
    .renameTable('typesSportsBasesSpacesTypesAndFields', 'sportsBasesSpacesTypesAndFields')
    .renameTable('typesSportsBasesSpacesTypes', 'sportsBasesSpacesTypes')
    .renameTable('typesSportsBasesInvestmentsSources', 'sportsBasesInvestmentsSources')
    .renameTable('typesSportsBasesSpacesBuildingPurposes', 'sportsBasesSpacesBuildingPurposes')
    .renameTable('typesSportsBasesSpacesEnergyClasses', 'sportBaseSpaceEnergyClasses')
    .renameTable('typesSportsBasesSpacesFields', 'sportsBasesSpacesFields')
    .renameTable('typesSportsBasesSpacesSportTypes', 'sportsBasesSpacesSportTypes');
};
