$env:PORT="3000"
$env:DATABASE_URL="postgres://user:password@localhost:5432/buildrmc"
$env:NODE_ENV="production"
$env:BASE_PATH="/"

Write-Host "Starting BuildRMC Single Server on http://localhost:3000"
Write-Host "Note: You need a PostgreSQL database running at the DATABASE_URL above."

node artifacts/api-server/dist/index.mjs
