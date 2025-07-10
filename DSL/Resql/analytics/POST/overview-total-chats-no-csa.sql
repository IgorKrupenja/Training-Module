WITH chats AS (
    SELECT base_id,
        date_trunc(:group_period, ended) AS ended
    FROM chat
    WHERE EXISTS (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND message.author_role = 'end-user'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND message.author_role = 'backoffice-user'
        )
        AND EXISTS (
            SELECT 1
            FROM message
            WHERE message.chat_base_id = chat.base_id
                AND message.author_role = 'buerokratt'
        )
        AND chat.ended >= date_trunc(
            :group_period,
            current_date - concat('1 ', :group_period)::INTERVAL
        )
)
SELECT timescale.ended AS ended,
    COUNT(DISTINCT base_id) AS metric_value
FROM (
        SELECT date_trunc(
                :group_period,
                generate_series(
                    current_date - concat('1 ', :group_period)::INTERVAL,
                    NOW(),
                    concat('1 ', :group_period)::INTERVAL
                )
            ) AS ended
    ) AS timescale
    LEFT JOIN chats ON chats.ended = timescale.ended
GROUP BY 1
ORDER BY 1 desc
