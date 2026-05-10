$env:BASE_PATH="/"

# Start backend on 5000
$env:PORT="5000"
Write-Host "Launching Backend on Port 5000..."
Start-Process cmd -ArgumentList "/c", "pnpm --filter @workspace/api-server run dev" -NoNewWindow

# Start frontend on 3000
$env:PORT="3000"
Write-Host "Launching Frontend on Port 3000..."
Start-Process cmd -ArgumentList "/c", "pnpm --filter @workspace/buildrmc run dev" -NoNewWindow

Write-Host "Servers launched successfully. Please wait 10 seconds and check http://localhost:3000"
