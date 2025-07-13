DROP VIEW IF EXISTS active_startups;
DROP VIEW IF EXISTS active_users;
CREATE OR REPLACE VIEW active_users AS
SELECT "result".*
FROM (
        SELECT "public"."users"."uuid",
            "public"."users"."username",
            "public"."users"."bio",
            "public"."users"."fullname",
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        CAST("public"."users"."competences" as TEXT),
                        '"',
                        '',
                        'g'
                    ),
                    '\[',
                    '',
                    'g'
                ),
                '\]',
                '',
                'g'
            ) as competences,
            CAST("public"."users"."domaine" AS VARCHAR(40)) as "domaine",
            "public"."users"."role",
            "public"."users"."primary_email",
            "public"."users"."link",
            "public"."users"."updated_at",
            "public"."users"."created_at",
            "public"."missions"."end" AS "mission_end"
        FROM "public"."users"
            LEFT JOIN "public"."missions" ON "public"."users"."uuid" = "missions"."user_id"
        WHERE (
                "missions"."end" IS NULL
                OR (
                    CAST(
                        extract(
                            day
                            from (
                                    DATE_TRUNC('day', "missions"."end") - DATE_TRUNC('day', NOW())
                                )
                        ) AS integer
                    ) > 0
                )
            )
        GROUP BY "public"."users"."username",
            "public"."missions"."end"
        ORDER BY "public"."users"."username" ASC,
            "public"."missions"."end" DESC NULLS FIRST
    ) AS "result";
COMMENT ON COLUMN active_users.competences IS 'List skills';
COMMENT ON COLUMN active_users.domaine IS 'Main skill';
CREATE OR REPLACE VIEW active_startups AS
SELECT "source"."last_phase_start" as derniere_phase,
    "source"."phase",
    "source"."members",
    "startups"."ghid",
    "startups"."name",
    "startups"."pitch",
    "startups"."description",
    "startups"."accessibility_status",
    "startups"."stats_url",
    "startups"."impact_url",
    "startups"."mon_service_securise",
    "startups"."link",
    "startups"."contact",
    "startups"."analyse_risques",
    "startups"."budget_url",
    "startups"."created_at",
    "startups"."updated_at",
    "source"."incubator",
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(CAST("startups".usertypes as TEXT), '"', '', 'g'),
            '\[',
            '',
            'g'
        ),
        '\]',
        '',
        'g'
    ) as usertypes,
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                CAST("startups".thematiques as TEXT),
                '"',
                '',
                'g'
            ),
            '\[',
            '',
            'g'
        ),
        '\]',
        '',
        'g'
    ) as thematiques,
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(CAST("startups".techno as TEXT), '"', '', 'g'),
            '\[',
            '',
            'g'
        ),
        '\]',
        '',
        'g'
    ) as techno
FROM (
        SELECT "public"."startups"."uuid" AS "uuid",
            "phases"."start" AS "last_phase_start",
            "phases"."name"::varchar AS "phase",
            concat(
                "incubators"."title",
                ' (',
                "incubators"."ghid",
                ')'
            )::varchar AS "incubator",
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    CAST(
                        array_agg(
                            DISTINCT "active_users".username --|| ' (' || "active_users".domaine || ')'
                        ) as TEXT
                    ),
                    '{',
                    '',
                    'g'
                ),
                '}',
                '',
                'g'
            ) as members
        FROM "public"."startups"
            LEFT JOIN "public"."phases" ON "public"."startups"."uuid" = "phases"."startup_id"
            LEFT JOIN "missions_startups" ON "missions_startups"."startup_id" = "startups"."uuid"
            LEFT JOIN "missions" ON "missions"."uuid" = "missions_startups"."mission_id"
            LEFT JOIN "active_users" ON "missions"."user_id" = "active_users"."uuid"
            LEFT JOIN "incubators" ON "incubators"."uuid" = "startups"."incubator_id"
        WHERE (
                "phases".start = (
                    -- select latest phase date
                    SELECT MAX(START)
                    FROM phases
                    WHERE startup_id = startups.uuid
                )
            )
            AND "phases"."name" NOT in ('alumni', 'transfer')
            AND (
                ("missions"."end" IS NULL)
                OR (
                    CAST(
                        extract(
                            day
                            from (
                                    DATE_TRUNC('day', "missions"."end") - DATE_TRUNC('day', NOW())
                                )
                        ) AS integer
                    ) > 0
                )
            )
        GROUP BY startups.uuid,
            phases.start,
            phases.name,
            incubator
        ORDER BY startups.uuid,
            phases.start DESC,
            phases.name
    ) AS "source",
    startups
WHERE startups.uuid = source.uuid
ORDER BY startups.ghid;
COMMENT ON COLUMN active_startups.members IS 'List of active_users.username';
COMMENT ON COLUMN active_startups.usertypes IS 'List of target audience';
COMMENT ON COLUMN active_startups.thematiques IS 'List of thematics';