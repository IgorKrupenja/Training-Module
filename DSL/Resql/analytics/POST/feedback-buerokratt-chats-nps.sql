

WITH chat_buerokratt AS (
    SELECT DISTINCT base_id,
        first_value(ended) OVER (
            PARTITION BY base_id
            ORDER BY updated
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS ended,
        last_value(feedback_rating) OVER (
            PARTITION BY base_id
            ORDER BY updated
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS feedback_rating
    FROM chat
    WHERE EXISTS (
        SELECT 1
        FROM message
        WHERE message.chat_base_id = chat.base_id
          AND message.author_role = 'buerokratt'
    )
    AND status = 'ENDED'
    AND feedback_rating IS NOT NULL
    AND ended::date BETWEEN :start::date AND :end::date
),
point_nps AS (
    SELECT date_trunc(:metric, ended)::text AS date_time,
           COALESCE(
             CAST((
               (
                 SUM(CASE WHEN feedback_rating BETWEEN 9 AND 10 THEN 1 ELSE 0 END) * 1.0 -
                 SUM(CASE WHEN feedback_rating BETWEEN 0 AND 6 THEN 1 ELSE 0 END)
               ) / NULLIF(COUNT(feedback_rating), 0) * 100
             ) AS int), 0) AS nps
    FROM chat_buerokratt
    GROUP BY date_time
    ORDER BY date_time
),
period_nps AS (
    SELECT COALESCE(
             CAST((
               (
                 SUM(CASE WHEN feedback_rating BETWEEN 9 AND 10 THEN 1 ELSE 0 END) * 1.0 -
                 SUM(CASE WHEN feedback_rating BETWEEN 0 AND 6 THEN 1 ELSE 0 END)
               ) / NULLIF(COUNT(feedback_rating), 0) * 100
             ) AS int), 0) AS nps
    FROM chat_buerokratt
)
SELECT json_build_object(
    'pointNps', (SELECT json_agg(json_build_object('dateTime', date_time, 'nps', nps)) FROM point_nps),
    'periodNps', (SELECT nps FROM period_nps)
) AS result
