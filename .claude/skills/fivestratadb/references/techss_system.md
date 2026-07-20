# Schema `techss_system`

System/application configuration, including navigation menus.

**32 tables** — dimension: 29, fact: 3

## `api_password_resets`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `email` | varchar(255) | Y | MUL |
| `token` | varchar(255) | Y |  |
| `created_at` | timestamp | Y |  |

## `api_query_routes`  ·  dimension · ~25 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `slug` | varchar(50) | N | MUL |
| `method` | varchar(5) | N |  |
| `dbName` | varchar(50) | N |  |
| `scopes` | json | N |  |
| `query` | text | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `api_route_tables`  ·  dimension · ~89 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `databaseName` | varchar(50) | Y |  |
| `tableName` | varchar(50) | Y |  |
| `slug` | varchar(50) | Y | UNI |
| `idKey` | varchar(50) | N |  |
| `dbRead` | varchar(50) | N |  |
| `dbWrite` | varchar(50) | N |  |
| `scopes` | json | N |  |
| `columnNames` | json | N |  |
| `fieldNames` | json | N |  |
| `resources` | json | N |  |
| `settings` | json | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `api_server_instance`  ·  dimension · ~2 rows · InnoDB
PK: `endPointAlias`

| column | type | null | key |
|---|---|---|---|
| `endPointAlias` | varchar(10) | N | PRI |
| `endPointUrl` | varchar(150) | N |  |
| `endPointPort` | varchar(5) | N |  |
| `active` | tinyint | Y | MUL |
| `lastUpdate` | timestamp | N | MUL |

## `api_users`  ·  dimension · ~6 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int unsigned | N | PRI |
| `name` | varchar(255) | Y |  |
| `email` | varchar(255) | Y | UNI |
| `password` | varchar(255) | Y |  |
| `remember_token` | varchar(100) | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `cv3_resolve_settings`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `error` | varchar(150) | N | MUL |
| `condition` | varchar(20) | Y |  |
| `fields` | json | N |  |

## `db_import_settings`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `title` | varchar(255) | N |  |
| `databaseName` | varchar(255) | N |  |
| `connectionName` | varchar(255) | N |  |
| `idKey` | varchar(255) | N |  |
| `tableName` | varchar(255) | N |  |
| `settings` | json | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `ncc_menus`  ·  dimension · ~52 rows · InnoDB
_Navigation menu configurations_
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int unsigned | N | PRI |
| `priority` | int unsigned | N | MUL |
| `is_active` | tinyint(1) | N | MUL |
| `settings` | json | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `ncc_pages`  ·  dimension · ~4 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int unsigned | N | PRI |
| `slug` | varchar(150) | N | UNI |
| `settings` | json | N |  |
| `is_active` | tinyint(1) | N | MUL |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `oauth_access_tokens`  ·  fact · ~191,763 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | varchar(100) | N | PRI |
| `user_id` | bigint unsigned | Y | MUL |
| `client_id` | char(36) | Y |  |
| `name` | varchar(255) | Y |  |
| `scopes` | text | Y |  |
| `revoked` | tinyint(1) | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |
| `expires_at` | datetime | Y |  |

## `oauth_auth_codes`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | varchar(100) | N | PRI |
| `user_id` | bigint unsigned | N | MUL |
| `client_id` | char(36) | Y |  |
| `scopes` | text | Y |  |
| `revoked` | tinyint(1) | N |  |
| `expires_at` | datetime | Y |  |

## `oauth_clients`  ·  dimension · ~5 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | char(36) | N | PRI |
| `user_id` | bigint unsigned | Y | MUL |
| `name` | varchar(255) | Y |  |
| `secret` | varchar(100) | Y |  |
| `provider` | varchar(255) | Y |  |
| `redirect` | text | Y |  |
| `personal_access_client` | tinyint(1) | N |  |
| `password_client` | tinyint(1) | N |  |
| `revoked` | tinyint(1) | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `oauth_personal_access_clients`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `client_id` | char(36) | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `oauth_refresh_tokens`  ·  fact · ~175,273 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | varchar(100) | N | PRI |
| `access_token_id` | varchar(100) | Y | MUL |
| `revoked` | tinyint(1) | N |  |
| `expires_at` | datetime | Y |  |

## `role_scope`  ·  dimension · ~30 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `role_id` | int | N |  |
| `scope_id` | int | N |  |
| `grant_access` | tinyint(1) | N |  |

## `roles`  ·  dimension · ~9 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `name` | varchar(50) | N | UNI |

## `schedule_crons`  ·  dimension · ~4 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `name` | varchar(50) | N |  |
| `timezone` | varchar(50) | N |  |
| `rerun` | datetime | Y |  |
| `cron` | json | N |  |
| `global_params` | json | Y |  |
| `queues` | json | N |  |
| `results` | json | Y |  |
| `activeAt` | datetime | Y |  |
| `runAt` | datetime | Y |  |
| `doneAt` | datetime | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `schedule_query_templates`  ·  dimension · ~4 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `title` | varchar(50) | N |  |
| `description` | varchar(50) | N |  |
| `scheduler` | varchar(50) | N |  |
| `temporary` | tinyint(1) | N |  |
| `template` | json | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |
| `deleted_at` | timestamp | Y |  |

## `schedule_queues`  ·  dimension · ~8 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `name` | varchar(50) | N |  |
| `templateId` | int | N |  |
| `data` | json | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `scheduled_action_failures`  ·  dimension · ~26 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `name` | varchar(255) | Y | MUL |
| `scheduled_action_id` | int unsigned | Y | MUL |
| `payload` | json | Y |  |
| `retry_limit` | int | N | MUL |
| `retry_minute` | int | N |  |
| `retry_count` | int | N | MUL |
| `retry_at` | datetime | Y | MUL |
| `last_run_at` | datetime | Y | MUL |

## `scheduled_action_logs`  ·  dimension · ~1,446 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `name` | varchar(255) | Y | MUL |
| `scheduled_action_id` | int unsigned | Y | MUL |
| `payload` | json | Y |  |
| `result` | text | Y |  |
| `start_at` | datetime | N | MUL |
| `end_at` | datetime | Y | MUL |
| `status` | varchar(50) | N | MUL |

## `scheduled_actions`  ·  dimension · ~22 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `name` | varchar(255) | Y | MUL |
| `notes` | text | Y | MUL |
| `payload` | json | Y |  |
| `payload_params` | json | Y |  |
| `cron_options` | json | Y |  |
| `tz` | varchar(50) | Y |  |
| `active_at` | datetime | Y |  |
| `rerun_at` | time | Y |  |
| `run_at` | time | Y |  |
| `updated_by` | varchar(100) | Y |  |
| `created_at` | timestamp | N |  |
| `updated_at` | timestamp | N | MUL |

## `scopes`  ·  dimension · ~16 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `name` | varchar(50) | N | UNI |

## `settings`  ·  dimension · ~84 rows · InnoDB
PK: `ukey`

| column | type | null | key |
|---|---|---|---|
| `ukey` | varchar(50) | N | PRI |
| `valueType` | varchar(20) | N |  |
| `uvalue` | text | N |  |
| `description` | varchar(255) | N |  |
| `createDate` | timestamp | N |  |
| `updateDate` | timestamp | Y | MUL |

## `system_credentials`  ·  dimension · ~45,595 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `system` | varchar(10) | N | MUL |
| `systemKey` | varchar(255) | N |  |
| `response` | varchar(255) | N |  |
| `requestTime` | timestamp | N |  |

## `system_pages`  ·  dimension · ~93 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(30) | N |  |
| `menu` | varchar(20) | N |  |
| `url` | varchar(255) | N |  |

## `system_settings`  ·  dimension · ~1 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `timezoneOffsetHoursET` | int | N |  |
| `timezoneOffsetHoursMT` | int | N |  |
| `localDialingStartTime` | time | N |  |
| `localDialingEndTime` | time | N |  |

## `user_access`  ·  dimension · ~207 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `userId` | int | N | MUL |
| `pageId` | int | N |  |

## `user_activity`  ·  fact · ~756,135 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `userId` | int | N | MUL |
| `page` | varchar(255) | N |  |
| `query` | text | N |  |
| `post` | text | N |  |
| `timestamp` | timestamp | N |  |

## `user_roles`  ·  dimension · ~4 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `roleName` | varchar(40) | N |  |

## `user_scope`  ·  dimension · ~78 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `user_id` | int | N |  |
| `scope_id` | int | N |  |

## `users`  ·  dimension · ~31 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(40) | N |  |
| `role_id` | int | Y |  |
| `lastName` | varchar(40) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | Y |  |
| `notification` | tinyint | N |  |
| `password` | varchar(100) | N |  |
| `salt` | varchar(64) | N |  |
| `five9Id` | int | N | MUL |
| `roleType` | int | N |  |
| `active` | tinyint(1) | N |  |
| `assignable` | tinyint(1) | N |  |
| `assignPercent` | decimal(10,0) | N |  |
| `exclusive` | tinyint(1) | N |  |
