const commonFields = (table) => {
  table.timestamp('createdAt');
  table.integer('createdBy').unsigned();
  table.timestamp('updatedAt');
  table.integer('updatedBy').unsigned();
  table.timestamp('deletedAt');
  table.integer('deletedBy').unsigned();
};

exports.commonFields = commonFields;

exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id');
    table.string('firstName', 255);
    table.string('lastName', 255);
    commonFields(table);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};

exports.sortEnum = function (table, column, typeName, oldValues, newValues) {
  if (oldValues.length !== newValues.length || newValues.some((val) => !oldValues.includes(val))) {
    throw new Error('Only order could be changed, not the values!');
  }

  let sql = `BEGIN;
ALTER TABLE ${table} ADD old_${column} varchar(255);
UPDATE ${table} SET old_${column}=${column};\n\n`;

  for (const oldStatus of oldValues) {
    sql += `ALTER TYPE ${typeName} RENAME VALUE '${oldStatus}' to '${oldStatus}_OLD';\n`;
  }

  for (const index in oldValues) {
    sql += `ALTER TYPE ${typeName} RENAME VALUE '${oldValues[index]}_OLD' to '${newValues[index]}';\n`;
  }

  sql += `\nUPDATE ${table} SET ${column}=old_${column}::${typeName};
ALTER TABLE ${table} DROP old_${column};
COMMIT;`;

  return sql;
};
