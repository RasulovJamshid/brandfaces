# CastingBot Production Deployment Script (PowerShell)
# This script automates the deployment process for Windows

$ErrorActionPreference = "Stop"

# Functions
function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

function Print-Header {
    param([string]$Message)
    Write-Host "`n=== $Message ===`n" -ForegroundColor Green
}

# Check if .env file exists
function Check-EnvFile {
    if (-not (Test-Path ".env")) {
        Print-Error ".env file not found!"
        Print-Info "Creating .env from .env.example..."
        Copy-Item ".env.example" ".env"
        Print-Info "Please edit .env file with your configuration and run this script again."
        exit 1
    }
    Print-Success ".env file found"
}

# Validate required environment variables
function Validate-EnvVars {
    Print-Info "Validating required environment variables..."
    
    $requiredVars = @("POSTGRES_PASSWORD", "BOT_TOKEN", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD")
    $missingVars = @()
    
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw
        
        foreach ($var in $requiredVars) {
            if (-not ($envContent -match "^$var=") -or ($envContent -match "^$var=.*change.*")) {
                $missingVars += $var
            }
        }
    }
    else {
        $missingVars = $requiredVars
    }
    
    if ($missingVars.Count -gt 0) {
        Print-Error "Please configure these variables in .env file:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var"
        }
        exit 1
    }
    
    Print-Success "All required environment variables are set"
}

# Create necessary directories
function Create-Directories {
    Print-Info "Creating necessary directories..."
    New-Item -ItemType Directory -Force -Path "nginx\ssl" | Out-Null
    New-Item -ItemType Directory -Force -Path "nginx\logs" | Out-Null
    New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null
    Print-Success "Directories created"
}

# Pull latest changes
function Pull-Changes {
    Print-Info "Pulling latest changes from git..."
    try {
        git pull origin main
        Print-Success "Code updated"
    }
    catch {
        Print-Info "Skipping git pull (not in a git repository or no changes)"
    }
}

# Build and start services
function Deploy-Services {
    Print-Info "Building Docker images..."
    docker compose -f docker-compose.prod.yml build
    Print-Success "Images built"

    Print-Info "Starting services..."
    docker compose -f docker-compose.prod.yml up -d
    Print-Success "Services started"
}

# Wait for database to be ready
function Wait-ForDatabase {
    Print-Info "Waiting for database to be ready..."
    Start-Sleep -Seconds 10
    
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $result = docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres 2>&1
            if ($LASTEXITCODE -eq 0) {
                Print-Success "Database is ready"
                return $true
            }
        }
        catch {
            # Continue waiting
        }
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    
    Print-Error "Database failed to start"
    return $false
}

# Run database migrations
function Run-Migrations {
    Print-Info "Running database migrations..."
    docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
    Print-Success "Migrations completed"
}

# Seed superadmin
function Seed-Superadmin {
    Print-Info "Seeding superadmin account..."
    try {
        docker compose -f docker-compose.prod.yml exec -T backend npx prisma db seed
        Print-Success "Superadmin seeding completed"
    }
    catch {
        Print-Info "Superadmin already exists or seeding skipped"
    }
}

# Show service status
function Show-Status {
    Print-Header "Service Status"
    docker compose -f docker-compose.prod.yml ps
}

# Main deployment flow
function Main {
    Print-Header "CastingBot Production Deployment"
    
    # Pre-deployment checks
    Print-Header "Pre-deployment Checks"
    Check-EnvFile
    Validate-EnvVars
    Create-Directories
    
    # Deployment
    Print-Header "Deployment"
    Pull-Changes
    Deploy-Services
    
    if (Wait-ForDatabase) {
        Run-Migrations
        Seed-Superadmin
    }
    else {
        Print-Error "Deployment failed due to database connection issues"
        exit 1
    }
    
    # Post-deployment
    Show-Status
    
    Print-Header "Deployment Complete!"
    Print-Success "Application is now running"
    Print-Info "Frontend: http://localhost (or your domain)"
    Print-Info "Backend API: http://localhost/api (or your API domain)"
    Print-Info ""
    Print-Info "Next steps:"
    Print-Info "1. Configure SSL certificates (see nginx\README.md)"
    Print-Info "2. Update DNS records to point to this server"
    Print-Info "3. Login with superadmin credentials from .env file"
    Print-Info "4. Change superadmin password immediately"
    Print-Info ""
    Print-Info "To view logs: docker compose -f docker-compose.prod.yml logs -f"
    Print-Info "To stop services: docker compose -f docker-compose.prod.yml down"
}

# Run main function
Main
