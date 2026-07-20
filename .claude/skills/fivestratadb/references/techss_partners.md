# Schema `techss_partners`

Partner reference data (small).

**7 tables** — dimension: 7

## `affiliate_user`  ·  dimension · ~51 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `affiliateID` | int | N |  |
| `userID` | int | N | MUL |

## `password_resets`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `email` | varchar(255) | N | MUL |
| `token` | varchar(255) | N |  |
| `created_at` | timestamp | Y |  |

## `role_scope`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `role_id` | int | N |  |
| `scope_id` | int | N |  |
| `grant_access` | tinyint(1) | N |  |

## `roles`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `name` | varchar(50) | N | UNI |

## `scopes`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `name` | varchar(50) | N | UNI |

## `user_scope`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `user_id` | int | N |  |
| `scope_id` | int | N |  |

## `users`  ·  dimension · ~3 rows · InnoDB
PK: `email`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | MUL |
| `name` | varchar(255) | N |  |
| `role_id` | int | Y |  |
| `email` | varchar(255) | N | PRI |
| `password` | varchar(255) | N |  |
| `remember_token` | varchar(100) | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |
