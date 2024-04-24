/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.raw(
    `ALTER TYPE "sport_base_space_field_type" RENAME VALUE 'TEXT' TO 'TEXT_AREA'`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw(`ALTER TYPE "sport_base_space_field_type" RENAME VALUE 'TEXT_AREA' TO 'TEXT'`);
};
