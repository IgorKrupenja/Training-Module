WITH forwarded_chats_by_csa AS (
    SELECT base_id, customer_support_id, customer_support_display_name, ended 
    FROM chat 
    WHERE status = 'REDIRECTED'
    AND customer_support_id <> '' AND customer_support_id IS NOT NULL
    GROUP BY base_id, customer_support_id, customer_support_display_name, ended
)
SELECT COUNT(DISTINCT base_id) AS metric_value
FROM forwarded_chats_by_csa
WHERE date_trunc('day', forwarded_chats_by_csa.ended) = date_trunc('day', current_date - '1 day'::INTERVAL)
UNION ALL
SELECT COUNT(DISTINCT base_id) filter (
        WHERE external_id IS NOT NULL AND external_id <> ''
    ) AS metric_value
FROM chat
WHERE date_trunc('day', chat.ended) = date_trunc('day', current_date - '1 day'::INTERVAL)
