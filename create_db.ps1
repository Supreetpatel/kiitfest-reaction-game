<#
create_db.ps1
Creates the `kiitfest` database using the local `postgres` superuser.
Usage:
  .\create_db.ps1                 # uses default password in script
  .\create_db.ps1 -PostgresPassword "yourPassword"

Note: This script requires `psql` to be on PATH. If not, add PostgreSQL's bin folder (e.g., C:\Program Files\PostgreSQL\15\bin) to PATH.
#>

param(
  [string]$PostgresPassword = "dhrubo@2007"
)

# locate psql
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error "psql not found in PATH. Please add PostgreSQL's bin folder to PATH or run the SQL manually."
  exit 1
}

# Temporarily set PGPASSWORD to avoid interactive prompt
$env:PGPASSWORD = $PostgresPassword

try {
  Write-Host "Creating database 'kiitfest' (owner: postgres)..."
  & psql -U postgres -h localhost -c "CREATE DATABASE kiitfest OWNER postgres;"
  Write-Host "Done. If the database already existed, you'll see a notice."
} catch {
  Write-Error "Failed to create database: $_"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
