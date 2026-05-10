@echo off
set PORT=3000
set DATABASE_URL=postgres://user:password@localhost:5432/buildrmc
set NODE_ENV=production
set BASE_PATH=/

echo Starting BuildRMC Single Server on http://localhost:3000
echo Note: You need a PostgreSQL database running at the DATABASE_URL above.

node artifacts/api-server/dist/index.mjs
