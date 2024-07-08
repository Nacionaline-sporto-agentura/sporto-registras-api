/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('typesSportsBasesSpacesFields', (table) => {
      table.enu(
        'field_group',
        [
          'ERDVES_ISMATAVIMAI',
          'ZIUROVU_VIETOS',
          'PRITAIKYMAS_ASMENIMS_SU_NEGALIA',
          'DANGOS',
          'YPATYBES',
          'PAPILDOMI_SEKTORIAI',
          'BASEINO_PARAMETRAI',
          'TRASOS_PARAMETRAI',
          'SAUDYKLOS_PARAMETRAI',
          'PRIEPLAUKU_PARAMETRAI',
          'PAPILDOMA_INFORMACIJA',
        ],
        {
          useNative: true,
          enumName: 'types_sports_bases_spaces_fields_field_group',
        },
      );
    })
    .alterTable('typesSportsBasesSpacesTypes', (table) => {
      table.boolean('needSportType');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('typesSportsBasesSpacesFields', (table) => {
      table.dropColumn('field_group');
    })

    .alterTable('typesSportsBasesSpacesTypes', (table) => {
      table.dropColumn('needSportType');
    });
};
