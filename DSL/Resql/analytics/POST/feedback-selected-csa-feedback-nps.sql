WITH ranked_chats AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY base_id ORDER BY updated DESC) AS rn
    FROM chat
    WHERE customer_support_id NOT IN ('', 'chatbot')
      AND STATUS = 'ENDED'
      AND feedback_rating IS NOT NULL
      AND created::date BETWEEN :start::date AND :end::date
                                   AND customer_support_id NOT IN (:excluded_csas)
                                   AND EXISTS (
    SELECT 1
    FROM message
    WHERE message.chat_base_id = chat.base_id
                                   AND message.author_role = 'end-user'
    )
    ),
    chat_csas AS (
SELECT base_id,
    created,
    customer_support_id,
    customer_support_display_name,
    feedback_rating
FROM ranked_chats
WHERE rn = 1
    ),
    point_nps_by_csa AS (
SELECT date_trunc(:metric, created)::text AS date_time,
    customer_support_id,
    TRIM(customer_support_display_name) AS customer_support_display_name,
    COALESCE(CAST(((
    SUM(CASE WHEN feedback_rating BETWEEN 9 AND 10 THEN 1 ELSE 0 END) * 1.0 -
    SUM(CASE WHEN feedback_rating BETWEEN 0 AND 6 THEN 1 ELSE 0 END)
    ) / COUNT(base_id) * 100) AS int), 0) AS nps
FROM chat_csas
GROUP BY date_time, customer_support_id, customer_support_display_name
    ),
    period_nps_by_csa AS (
SELECT customer_support_id,
    TRIM(customer_support_display_name) AS customer_support_display_name,
    MAX(CONCAT("user".first_name, ' ', "user".last_name)) AS customer_support_full_name,
    COALESCE(CAST(((
    SUM(CASE WHEN feedback_rating BETWEEN 9 AND 10 THEN 1 ELSE 0 END) * 1.0 -
    SUM(CASE WHEN feedback_rating BETWEEN 0 AND 6 THEN 1 ELSE 0 END)
    ) / COUNT(base_id) * 100) AS int), 0) AS period_nps
FROM chat_csas
    LEFT JOIN "user" ON "user".id_code = chat_csas.customer_support_id
    GROUP BY customer_support_id, customer_support_display_name
)
SELECT p.date_time,
       p.customer_support_id,
       p.customer_support_display_name,
       t.customer_support_full_name,
       p.nps,
       t.period_nps
FROM point_nps_by_csa p
JOIN period_nps_by_csa t ON p.customer_support_id = t.customer_support_id
ORDER BY p.date_time, p.customer_support_display_name