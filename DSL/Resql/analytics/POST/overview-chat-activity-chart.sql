WITH chat_stats AS (
    SELECT date_trunc('hour', ended) AS ended,
        base_id,
        (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND "event" = 'CLIENT_LEFT_WITH_ACCEPTED'
        ) AS client_left_with_accepted,
        (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND "event" = 'CLIENT_LEFT_WITH_NO_RESOLUTION'
        ) AS client_left_with_no_resolution,
        (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND "event" = 'HATE_SPEECH'
        ) AS hate_speech,
        (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND "event" = 'ACCEPTED'
        ) AS accepted,
        (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND "event" = 'OTHER'
        ) AS other,
        (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND "event" = 'RESPONSE_SENT_TO_CLIENT_EMAIL'
        ) AS response_sent_to_client_email
    FROM chat
    WHERE ended >= date_trunc('hour', CURRENT_DATE)
)
SELECT timescale.ended AS ended,
    COUNT(DISTINCT base_id) AS metric_value,
    COUNT(DISTINCT base_id) filter (
        WHERE client_left_with_accepted IS NOT NULL
    ) AS client_left_with_accepted,
    COUNT(DISTINCT base_id) filter (
        WHERE client_left_with_no_resolution IS NOT NULL
    ) AS client_left_with_no_resolution,
    COUNT(DISTINCT base_id) filter (
        WHERE hate_speech IS NOT NULL
    ) AS hate_speech,
    COUNT(DISTINCT base_id) filter (
        WHERE accepted IS NOT NULL
    ) AS accepted,
    COUNT(DISTINCT base_id) filter (
        WHERE other IS NOT NULL
    ) AS other,
    COUNT(DISTINCT base_id) filter (
        WHERE response_sent_to_client_email IS NOT NULL
    ) AS response_sent_to_client_email
FROM (
        SELECT date_trunc(
                'hour',
                generate_series(
                    current_date,
                    NOW(),
                    '1 hour'::INTERVAL
                )
            ) AS ended
    ) AS timescale
    LEFT JOIN chat_stats ON chat_stats.ended = timescale.ended
GROUP BY 1
ORDER BY 1 desc
