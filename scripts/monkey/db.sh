#!/usr/bin/env bash
# ローカル Supabase の Postgres に SQL を 1 本流す(psql はコンテナにある)。結果はタブ区切り、ヘッダ無し。
#   scripts/monkey/db.sh "select count(*) from attempts"
set -eu
docker exec -i supabase_db_AccountingAcademy psql -U postgres -d postgres -Atc "${1:?SQL を指定してください}"
