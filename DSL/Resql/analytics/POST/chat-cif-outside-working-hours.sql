WITH workingTimeStart AS (
    SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    saturdayWorkingTimeStart AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationSaturdayWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    sundayWorkingTimeStart AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationSundayWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    mondayWorkingTimeStart AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationMondayWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    tuesdayWorkingTimeStart AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationTuesdayWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    wednesdayWorkingTimeStart AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationWednesdayWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    thursdayWorkingTimeStart AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationThursdayWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    fridayWorkingTimeStart AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationFridayWorkingTimeStartISO'
  AND deleted IS false
    )
    ),
    workingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationWorkingTimeEndISO'
  AND deleted IS false
    )
    ),
    saturdayWorkingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationSaturdayWorkingTimeEndISO'
  AND deleted IS false
    )
    ),
    sundayWorkingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationSundayWorkingTimeEndISO'
  AND deleted IS false
    )
    ),
    mondayWorkingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationMondayWorkingTimeEndISO'
  AND deleted IS false
    )
    ),
    tuesdayWorkingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationTuesdayWorkingTimeEndISO'
  AND deleted IS false
    )
    ),
    wednesdayWorkingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationWednesdayWorkingTimeEndISO'
  AND deleted IS false
    )
    ),
    thursdayWorkingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationThursdayWorkingTimeEndISO'
  AND deleted IS false
    )
    ),
    fridayWorkingTimeEnd AS (
SELECT EXTRACT(HOUR FROM value::timestamp) AS time
FROM configuration
WHERE id = (
    SELECT MAX(id) FROM configuration
    WHERE key = 'organizationFridayWorkingTimeEndISO'
  AND deleted IS false
    )
    )
SELECT
    DATE_TRUNC(:period, c.created) AS time,
  COUNT(DISTINCT c.base_id) AS chat_count
FROM chat c
    JOIN message m ON c.base_id = m.chat_base_id
WHERE c.created::date BETWEEN :start::date AND :end::date
  AND (
    m.event = 'contact-information-fulfilled' AND
    (c.end_user_email IS NOT NULL AND c.end_user_email <> '') OR
    (c.end_user_phone IS NOT NULL AND c.end_user_phone <> '')
  )
  AND (
    c.base_id IN (
      SELECT DISTINCT m.chat_base_id
      FROM message m
      WHERE m.event = 'unavailable_organization_ask_contacts' AND m.author_id = 'chatbot'
    )
  )
AND (
    EXTRACT(HOUR FROM m.created) < (SELECT time FROM workingTimeStart)
    OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM workingTimeEnd)
    OR (EXTRACT(DOW FROM m.created) = 0 AND (EXTRACT(HOUR FROM m.created) < (SELECT time FROM sundayWorkingTimeStart) OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM sundayWorkingTimeEnd)))
    OR (EXTRACT(DOW FROM m.created) = 1 AND (EXTRACT(HOUR FROM m.created) < (SELECT time FROM mondayWorkingTimeStart) OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM mondayWorkingTimeEnd)))
    OR (EXTRACT(DOW FROM m.created) = 2 AND (EXTRACT(HOUR FROM m.created) < (SELECT time FROM tuesdayWorkingTimeStart) OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM tuesdayWorkingTimeEnd)))
    OR (EXTRACT(DOW FROM m.created) = 3 AND (EXTRACT(HOUR FROM m.created) < (SELECT time FROM wednesdayWorkingTimeStart) OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM wednesdayWorkingTimeEnd)))
    OR (EXTRACT(DOW FROM m.created) = 4 AND (EXTRACT(HOUR FROM m.created) < (SELECT time FROM thursdayWorkingTimeStart) OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM thursdayWorkingTimeEnd)))
    OR (EXTRACT(DOW FROM m.created) = 5 AND (EXTRACT(HOUR FROM m.created) < (SELECT time FROM fridayWorkingTimeStart) OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM fridayWorkingTimeEnd)))
    OR (EXTRACT(DOW FROM m.created) = 6 AND (EXTRACT(HOUR FROM m.created) < (SELECT time FROM saturdayWorkingTimeStart) OR EXTRACT(HOUR FROM m.created) > (SELECT time FROM saturdayWorkingTimeEnd)))
)
GROUP BY time
ORDER BY time;
