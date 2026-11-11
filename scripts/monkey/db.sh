#!/usr/bin/env bash
# ローカルSupabaseのPostgresにSQLを1本流す(psqlはコンテナにある)。結果はタブ区切り、ヘッダ無し。
#   scripts/monkey/db.sh "select count(*) from attempts"
set -eu
docker exec -i supabase_db_AccountingAcademy psql -U postgres -d postgres -Atc "${1:?SQLを指定してください}"
