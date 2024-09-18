const {
  sportsBasesQuery: sportsBasesQueryOld,
  organizationsQuery: organizationsQueryOld,
} = require('./20240911150952_addingPublicViews');
const sportsBasesQuery = `
WITH fields_translates AS (
  SELECT
    tsbstaf.id,
    tsbsf.title
  FROM
    types_sports_bases_spaces_types_and_fields tsbstaf
    LEFT JOIN types_sports_bases_spaces_fields tsbsf ON tsbsf.id = tsbstaf.sport_base_space_field_id
),
mapped_tenants AS (
  SELECT
    t.id,
    jsonb_build_object(
      'id',
      t.id,
      'name',
      t.name,
      'phone',
      t.phone,
      'email',
      t.email,
      'url',
      t.data ->> 'url'
    ) AS tenant
  FROM
    tenants t
  GROUP BY
    t.id
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
mapped_additional_values AS (
  SELECT
    sbs.id AS space_id,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id',
        ft.id,
        'name',
        ft.title,
        'value',
        additional_value.value :: text
      )
    ) additional_values,
    jsonb_object(
      array_agg(ft.title :: text),
      array_agg(additional_value.value :: text)
    ) AS additional_values2
  FROM
    sports_bases_spaces sbs
    CROSS JOIN LATERAL jsonb_each_text(sbs.additional_values) AS additional_value(id, value)
    INNER JOIN fields_translates ft ON (additional_value.id) :: text :: int = ft.id
  GROUP BY
    sbs.id
),
mapped_base_tenants AS (
  SELECT
    sbt.sport_base_id,
    jsonb_agg(
      jsonb_build_object(
        'name',
        sbt.company_name,
        'basis',
        jsonb_build_object('id', tsbtb.id, 'name', tsbtb.name),
        'code',
        sbt.company_code
      )
    ) AS tenants
  FROM
    sports_bases_tenants sbt
    LEFT JOIN types_sports_bases_tenants_basis tsbtb ON tsbtb.id = sbt.sports_bases_tenants_basis_id
  GROUP BY
    sbt.sport_base_id
),
mapped_sports_spaces AS (
  SELECT
    sbs.sport_base_id,
    jsonb_agg(DISTINCT st.item) AS sport_types,
    min(sbs.construction_date) AS construction_date,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id',
        sbs.id,
        'name',
        sbs.name,
        'type',
        jsonb_build_object('id', tsbst.id, 'name', tsbst.name),
        'technicalCondition',
        jsonb_build_object('id', tsbtc.id, 'name', tsbtc.name, 'color', tsbtc.color),
        'constructionDate',
        sbs.construction_date,
        'additionalValues',
        mav.additional_values,
        'sportTypes',
        mst.sport_types
      )
    ) AS spaces
  FROM
    sports_bases_spaces sbs
    LEFT JOIN types_sports_bases_spaces_types tsbst ON tsbst.id = sbs.sport_base_space_type_id
    LEFT JOIN types_sports_bases_technical_conditions tsbtc ON tsbtc.id = sbs.sport_base_technical_condition_id
    LEFT JOIN mapped_additional_values mav ON mav.space_id = sbs.id
    LEFT JOIN mapped_sport_types mst ON mst.space_id = sbs.id
    CROSS JOIN LATERAL jsonb_array_elements(mst.sport_types) AS st(item)
  GROUP BY
    sbs.sport_base_id
)
SELECT
  sb.id,
  sb.name,
  sb.photos,
  sb.web_page,
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
  ) AS address,
  sb.parking_places,
  sb.methodical_classes,
  sb.saunas,
  sb.public_wifi,
  sb.email,
  sb.phone,
  sb.geom,
  mt.tenant,
  mss.spaces,
  mss.sport_types,
  mss.construction_date,
  mbt.tenants,
  jsonb_build_object('id', tsbt.id, 'name', tsbt.name) AS "type"
FROM
  sports_bases sb
  LEFT JOIN mapped_tenants mt ON sb.tenant_id = mt.id
  LEFT JOIN mapped_sports_spaces mss ON mss.sport_base_id = sb.id
  LEFT JOIN mapped_base_tenants mbt ON mbt.sport_base_id = sb.id
  LEFT JOIN types_sports_bases_types tsbt ON tsbt.id = sb.sport_base_type_id
WHERE sb.deleted_at IS NULL
`;

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
  GROUP BY
    sbs.sport_base_id
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
        )
      )
    ) AS sports_bases
  FROM
    sports_bases sb
    LEFT JOIN mapped_sports_spaces mss ON mss.sport_base_id = sb.id
    CROSS JOIN LATERAL jsonb_array_elements(mss.sport_types) AS st(item)
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

exports.sportsBasesQuery = sportsBasesQuery;
exports.organizationsQuery = organizationsQuery;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('publishing')
    .raw(`DROP INDEX publishing.publishing_sports_bases_geom_idx`)
    .dropMaterializedView('sportsBases')
    .dropMaterializedView('organizations')
    .createMaterializedView('sportsBases', function (view) {
      view.as(knex.raw(sportsBasesQuery));
    })
    .raw(
      `CREATE INDEX publishing_sports_bases_geom_idx ON publishing.sports_bases USING GIST (geom)`,
    )
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
    .raw(`DROP INDEX publishing.publishing_sports_bases_geom_idx`)
    .dropMaterializedView('sportsBases')
    .dropMaterializedView('organizations')
    .createMaterializedView('sportsBases', function (view) {
      view.as(knex.raw(sportsBasesQueryOld));
    })
    .raw(
      `CREATE INDEX publishing_sports_bases_geom_idx ON publishing.sports_bases USING GIST (geom)`,
    )
    .createMaterializedView('organizations', function (view) {
      view.as(knex.raw(organizationsQueryOld));
    });
};
