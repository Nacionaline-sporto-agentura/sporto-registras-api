const { sortEnum } = require('./20231219091739_setup');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  /**
BEGIN;

ALTER TABLE requests ADD old_status varchar(255);
UPDATE requests SET old_status=status;

ALTER TYPE request_status RENAME VALUE 'DRAFT' to 'DRAFT_OLD';
ALTER TYPE request_status RENAME VALUE 'CREATED' to 'CREATED_OLD';
ALTER TYPE request_status RENAME VALUE 'RETURNED' to 'RETURNED_OLD';
ALTER TYPE request_status RENAME VALUE 'REJECTED' to 'REJECTED_OLD';
ALTER TYPE request_status RENAME VALUE 'APPROVED' to 'APPROVED_OLD';
ALTER TYPE request_status RENAME VALUE 'SUBMITTED' to 'SUBMITTED_OLD';

ALTER TYPE request_status RENAME VALUE 'DRAFT_OLD' to 'SUBMITTED';
ALTER TYPE request_status RENAME VALUE 'CREATED_OLD' to 'CREATED';
ALTER TYPE request_status RENAME VALUE 'RETURNED_OLD' to 'RETURNED';
ALTER TYPE request_status RENAME VALUE 'REJECTED_OLD' to 'APPROVED';
ALTER TYPE request_status RENAME VALUE 'APPROVED_OLD' to 'REJECTED';
ALTER TYPE request_status RENAME VALUE 'SUBMITTED_OLD' to 'DRAFT';

UPDATE requests SET status=old_status::request_status;
ALTER TABLE requests DROP old_status;

COMMIT;
  */

  return knex.raw(
    sortEnum(
      'requests',
      'status',
      'request_status',
      ['DRAFT', 'CREATED', 'RETURNED', 'REJECTED', 'APPROVED', 'SUBMITTED'],
      ['SUBMITTED', 'CREATED', 'RETURNED', 'APPROVED', 'REJECTED', 'DRAFT'],
    ),
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw(
    sortEnum(
      'requests',
      'status',
      'request_status',
      ['SUBMITTED', 'CREATED', 'RETURNED', 'APPROVED', 'REJECTED', 'DRAFT'],
      ['DRAFT', 'CREATED', 'RETURNED', 'REJECTED', 'APPROVED', 'SUBMITTED'],
    ),
  );
};
