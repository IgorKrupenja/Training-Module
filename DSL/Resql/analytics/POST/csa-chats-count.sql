WITH LastValidMessages AS (
    SELECT DISTINCT ON (message.chat_base_id)
    message.id,
    message.chat_base_id,
    message.author_id,
    message.author_role,
    message.created AS message_created
FROM message
WHERE message.author_role IN ('backoffice-user', 'end-user')
  AND message.author_id IS NOT NULL
  AND message.author_id <> ''
  AND message.author_id <> 'null'
ORDER BY message.chat_base_id, message.created DESC
    ),
    FilteredMessages AS (
SELECT
    lvm.chat_base_id,
    lvm.author_id,
    lvm.message_created,
    chat.created AS chat_created
FROM LastValidMessages lvm
    JOIN chat ON chat.base_id = lvm.chat_base_id
WHERE chat.created::date BETWEEN :start::date AND :end::date
    ),
    FinalData AS (
SELECT
    date_trunc(:metric, fm.chat_created) AS date_time,
    fm.chat_base_id,
    fm.author_id,
    "user".display_name,
    "user".first_name,
    "user".last_name,
    "user".id_code
FROM FilteredMessages fm
    LEFT JOIN "user" ON "user".id_code = fm.author_id
WHERE "user".id_code NOT IN (:excluded_csas)
    )
SELECT
    date_time,
    MAX(display_name) AS customer_support_display_name,
    MAX(id_code) AS customer_support_id,
    MAX(CONCAT(first_name, ' ', last_name)) AS customer_support_full_name,
    COUNT(DISTINCT chat_base_id) AS count
FROM FinalData
GROUP BY date_time, author_id;