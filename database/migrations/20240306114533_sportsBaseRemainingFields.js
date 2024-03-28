/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.string('buildingNumber', 255);
    table.text('buildingPurpose');
    table.integer('typeId').unsigned();
    table.integer('levelId').unsigned();
    table.integer('technicalConditionId').unsigned();
    table.integer('buildingTypeId').unsigned();
    table.string('address', 255);
    table.jsonb('coordinates');
    table.string('webPage', 255);
    table.jsonb('photos');
    table.string('plotNumber', 255);
    table.timestamp('constructionDate');
    table.timestamp('latestRenovationDate');
    table.boolean('disabledAccessible');
    table.boolean('blindAccessible');
    table.double('plotArea');
    table.double('builtPlotArea');
    table.double('buildingArea');
    table.integer('audienceSeats');
    table.integer('parkingPlaces');
    table.integer('dressingRooms');
    table.integer('methodicalClasses');
    table.integer('saunas');
    table.integer('diningPlaces');
    table.integer('accommodationPlaces');
    table.boolean('publicWifi');
    table.string('energyClass', 255);
    table.jsonb('energyClassCertificate');
    table.jsonb('plans');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
