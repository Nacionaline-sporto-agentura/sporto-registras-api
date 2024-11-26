const {
  organizationsQuery: organizationsQueryOld,
} = require('./20240919090726_publicViewsNotDeleted');

const organizationsQuery = `
WITH mapped_organization_types AS (
  SELECT
    ttsot.id,
    jsonb_build_object('id', ttsot.id, 'name', ttsot.name) AS "type"
  FROM
    types_tenants_sport_organization_types ttsot
  GROUP BY
    ttsot.id
),
mapped_legal_forms AS (
  SELECT
    ttlf.id,
    jsonb_build_object('id', ttlf.id, 'name', ttlf.name) AS legal_form
  FROM
    types_tenants_legal_forms ttlf
  GROUP BY
    ttlf.id
),
mapped_sport_types AS (
  SELECT
    sbsst.id AS space_id,
    jsonb_agg(
      DISTINCT jsonb_build_object('id', sbsst.st_id, 'name', sbsst.st_name)
    ) AS sport_types
  FROM
    (
      SELECT
        sbs.id,
        tst.id AS st_id,
        tst.name AS st_name
      FROM
        sports_bases_spaces sbs
        CROSS JOIN LATERAL jsonb_array_elements(sbs.sport_base_space_sport_types) AS sport_type(id)
        INNER JOIN types_sport_types tst ON (sport_type.id) :: text :: int = tst.id
    ) sbsst
  GROUP BY
    sbsst.id
),
mapped_sports_spaces AS (
  SELECT
    sbs.sport_base_id,
    jsonb_agg(DISTINCT st.item) AS sport_types
  FROM
    sports_bases_spaces sbs
    LEFT JOIN mapped_sport_types mst ON mst.space_id = sbs.id
    CROSS JOIN LATERAL jsonb_array_elements(mst.sport_types) AS st(item)
  WHERE
    sbs.deleted_at IS NULL
  GROUP BY
    sbs.sport_base_id
),
mapped_base_photo AS (
  SELECT
    sb.id,
    jsonb_agg(DISTINCT photo.item) filter (
      WHERE
        photo.item ->> 'representative' = 'true'
    ) -> 0 AS photo
  FROM
    sports_bases sb
    LEFT JOIN LATERAL jsonb_array_elements(sb.photos) AS photo(item) ON TRUE
  GROUP BY
    sb.id
),
mapped_sports_bases AS (
  SELECT
    sb.tenant_id,
    jsonb_agg(DISTINCT st.item) AS sports_types,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id',
        sb.id,
        'name',
        sb.name,
        'sportsTypes',
        mss.sport_types,
        'address',
        jsonb_build_object(
          'municipality',
          (sb.address ->> 'municipality') :: jsonb,
          'city',
          (sb.address ->> 'city') :: jsonb,
          'street',
          (sb.address ->> 'street') :: jsonb,
          'house',
          (sb.address ->> 'house') :: jsonb,
          'apartment',
          (sb.address ->> 'apartment') :: jsonb
        ),
        'photo',
        mbp.photo
      )
    ) AS sports_bases
  FROM
    sports_bases sb
    LEFT JOIN mapped_base_photo mbp ON mbp.id = sb.id
    LEFT JOIN mapped_sports_spaces mss ON mss.sport_base_id = sb.id
    CROSS JOIN LATERAL jsonb_array_elements(mss.sport_types) AS st(item)
  WHERE
    sb.deleted_at IS NULL
  GROUP BY
    sb.tenant_id
),
mapped_requests AS (
  SELECT
    r.tenant_id,
    max(r.updated_at) AS last_request_date
  FROM
    requests r
  WHERE
    r.entity_type = 'TENANTS'
    AND r.status = 'APPROVED'
    AND r.deleted_at IS NOT NULL
  GROUP BY
    r.tenant_id
)
SELECT
  t.id,
  t.name,
  t.code,
  t.address,
  t.phone,
  t.email,
  t.data ->> 'url' AS url,
  CASE
    WHEN t.data ->> 'nonGovernmentalOrganization' = 'true' THEN TRUE
    ELSE false
  END AS non_governmental_organization,
  CASE
    WHEN t.data ->> 'hasBeneficiaryStatus' = 'true' THEN TRUE
    ELSE false
  END AS has_beneficiary_status,
  CASE
    WHEN t.data ->> 'nonFormalEducation' = 'true' THEN TRUE
    ELSE false
  END AS non_formal_education,
  mot.type,
  mlf.legal_form,
  msb.sports_bases,
  msb.sports_types,
  mr.last_request_date
FROM
  tenants t
  LEFT JOIN mapped_organization_types mot ON mot.id = t.sport_organization_type_id
  LEFT JOIN mapped_legal_forms mlf ON t.legal_form_id = mlf.id
  LEFT JOIN mapped_sports_bases msb ON msb.tenant_id = t.id
  LEFT JOIN mapped_requests mr ON mr.tenant_id = t.id
WHERE
  t.tenant_type = 'ORGANIZATION'
  AND t.name IS NOT NULL
  AND t.deleted_at IS NULL
`;

exports.organizationsQuery = organizationsQuery;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('publishing')
    .dropMaterializedView('organizations')
    .createMaterializedView('organizations', function (view) {
      view.as(knex.raw(organizationsQuery));
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .withSchema('publishing')
    .dropMaterializedView('organizations')
    .createMaterializedView('organizations', function (view) {
      view.as(knex.raw(organizationsQueryOld));
    });
};
