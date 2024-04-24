exports.up = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.dropColumn('audienceSeats');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('sportsBases', (table) => {
    table.integer('audienceSeats');
  });
};
