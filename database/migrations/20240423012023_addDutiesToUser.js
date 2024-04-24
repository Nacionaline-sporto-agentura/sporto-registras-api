exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.text('duties');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('duties');
  });
};
