WITH botname AS (
    SELECT "value"
    FROM "configuration"
    WHERE "key" = 'bot_institution_id'
    LIMIT 1
), customer_support_changes AS (
    SELECT base_id,
        date_trunc('day', created) AS created,
        customer_support_id,
        updated,
        lag(customer_support_id) over (
            PARTITION by base_id
            ORDER BY updated
        ) AS prev_support_id,
        lag(updated) over (
            PARTITION by base_id
            ORDER BY updated
        ) AS prev_updated
    FROM chat
    WHERE chat.created >= date_trunc(
            :group_period,
            current_date - concat('1 ', :group_period)::INTERVAL
        )
)
SELECT date_trunc(:group_period, timescale.ended) AS ended,
    COALESCE(
        AVG(
            extract(
                epoch
                FROM (updated - prev_updated)
            )
        ) filter (
            WHERE prev_support_id = ''
                AND customer_support_id NOT IN (
                    (
                        SELECT "value"
                        FROM botname
                    ),
                    ''
                )
        ),
        0
    ) AS metric_value
FROM (
        SELECT date_trunc(
                'day',
                generate_series(
                    date_trunc(
                        :group_period,
                        current_date - concat('1 ', :group_period)::INTERVAL
                    ),
                    NOW(),
                    '1 day'::INTERVAL
                )
            ) AS ended
    ) AS timescale
    LEFT JOIN customer_support_changes ON customer_support_changes.created = timescale.ended
GROUP BY 1
ORDER BY 1 desc
