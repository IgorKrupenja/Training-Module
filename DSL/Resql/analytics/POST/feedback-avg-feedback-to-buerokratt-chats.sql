SELECT date_trunc(:metric, ended) AS date_time,
       ROUND(1.0 * SUM(CASE WHEN feedback_rating IS NOT NULL THEN feedback_rating ELSE 0 END) / NULLIF(COUNT(DISTINCT base_id), 0), 1) AS avg
FROM chat
WHERE EXISTS
    (SELECT 1
     FROM message
     WHERE message.chat_base_id = chat.base_id
       AND (message.author_role = 'buerokratt' OR message.author_role = 'Bürokratt'))
AND status = 'ENDED'
AND ended::date BETWEEN :start::date AND :end::date
GROUP BY date_time
