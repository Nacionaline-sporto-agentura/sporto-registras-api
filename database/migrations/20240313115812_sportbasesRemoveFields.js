/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.dropColumn('buildingNumber');
    table.dropColumn('buildingPurpose');
    table.dropColumn('buildingTypeId');
    table.dropColumn('constructionDate');
    table.dropColumn('latestRenovationDate');
    table.dropColumn('buildingArea');
    table.dropColumn('energyClass');
    table.dropColumn('energyClassCertificate');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.string('buildingNumber', 255);
    table.text('buildingPurpose');
    table.integer('buildingTypeId').unsigned();
    table.timestamp('constructionDate');
    table.timestamp('latestRenovationDate');
    table.double('buildingArea');
    table.string('energyClass', 255);
    table.jsonb('energyClassCertificate');
  });
};
