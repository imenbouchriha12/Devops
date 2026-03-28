# ═══════════════════════════════════════════════════════════════
# Database Reset Script for Stock Module
# ═══════════════════════════════════════════════════════════════

Write-Host "=== Database Reset Script ===" -ForegroundColor Green
Write-Host ""

# Read database credentials from .env
$envFile = Get-Content .env
$dbName = ($envFile | Select-String "DB_NAME=(.+)").Matches.Groups[1].Value
$dbUser = ($envFile | Select-String "DB_USERNAME=(.+)").Matches.Groups[1].Value
$dbPassword = ($envFile | Select-String "DB_PASSWORD=(.+)").Matches.Groups[1].Value
$dbHost = ($envFile | Select-String "DB_HOST=(.+)").Matches.Groups[1].Value
$dbPort = ($envFile | Select-String "DB_PORT=(.+)").Matches.Groups[1].Value

Write-Host "Database: $dbName" -ForegroundColor Cyan
Write-Host "Host: $dbHost:$dbPort" -ForegroundColor Cyan
Write-Host "User: $dbUser" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "This will DELETE ALL DATA in $dbName. Continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Resetting database..." -ForegroundColor Yellow

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $dbPassword

# Drop and recreate database
$dropCmd = "DROP DATABASE IF EXISTS $dbName;"
$createCmd = "CREATE DATABASE $dbName;"

try {
    # Connect to postgres database and drop/create
    Write-Host "Dropping database..." -ForegroundColor Yellow
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c $dropCmd
    
    Write-Host "Creating database..." -ForegroundColor Yellow
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c $createCmd
    
    Write-Host ""
    Write-Host "✓ Database reset successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your NestJS application: npm run start:dev" -ForegroundColor White
    Write-Host "2. TypeORM will automatically create all tables" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "✗ Error resetting database!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin or psql" -ForegroundColor White
    Write-Host "2. Run the commands in QUICK_FIX.sql" -ForegroundColor White
    Write-Host ""
}

# Clear password from environment
$env:PGPASSWORD = $null
