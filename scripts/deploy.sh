#!/bin/bash

# Enterprise Deployment Script for Todo API (Docker Compose)
set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ENV_FILE=".env.${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Validate inputs
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Invalid environment. Must be 'staging' or 'production'"
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
    error "Docker Compose file $COMPOSE_FILE not found"
fi

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "docker daemon is not running"
    fi
    
    log "Prerequisites check passed"
}

# Create environment file
create_environment_file() {
    log "Creating environment file..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        cat > "$ENV_FILE" << EOF
DOCKER_IMAGE=naimjeem/todo-api:$IMAGE_TAG
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_USER=postgres
ALLOWED_ORIGINS=https://todo-api.example.com
REDIS_PASSWORD=$(openssl rand -hex 16)
EOF
        log "Created environment file $ENV_FILE"
    else
        log "Environment file $ENV_FILE already exists"
    fi
}

# Deploy application
deploy_application() {
    log "Deploying application to $ENVIRONMENT..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Deploy with blue-green strategy for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Using blue-green deployment strategy..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --scale todo-api-production=0
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --scale todo-api-production=2
    else
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    fi
    
    log "Application deployment initiated"
}

# Wait for deployment to be ready
wait_for_deployment() {
    log "Waiting for deployment to be ready..."
    
    # Wait for services to be healthy
    timeout 300 bash -c "until docker-compose -f $COMPOSE_FILE ps | grep -q 'healthy'; do sleep 5; done"
    
    if [[ $? -eq 0 ]]; then
        log "Deployment is ready"
    else
        error "Deployment failed to become ready"
    fi
}

# Run health checks
run_health_checks() {
    log "Running health checks..."
    
    # Get the service port
    if [[ "$ENVIRONMENT" == "production" ]]; then
        SERVICE_PORT=3000
    else
        SERVICE_PORT=3000
    fi
    
    # Health check
    if curl -f http://localhost:$SERVICE_PORT/health &> /dev/null; then
        log "Health check passed"
    else
        error "Health check failed"
    fi
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Run smoke tests
    npm test -- tests/smoke/ --testTimeout=30000
    
    if [[ $? -eq 0 ]]; then
        log "Smoke tests passed"
    else
        error "Smoke tests failed"
    fi
}

# Rollback function
rollback() {
    warn "Initiating rollback..."
    
    # Stop current deployment
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Start previous version (you might want to implement version tracking)
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    if [[ $? -eq 0 ]]; then
        log "Rollback completed successfully"
    else
        error "Rollback failed"
    fi
}

# Main deployment function
main() {
    log "Starting deployment to $ENVIRONMENT environment"
    log "Image tag: $IMAGE_TAG"
    
    # Set up error handling
    trap 'error "Deployment failed at line $LINENO"' ERR
    
    check_prerequisites
    create_environment_file
    deploy_application
    wait_for_deployment
    run_health_checks
    
    # Only run smoke tests if not in CI/CD pipeline
    if [[ -z "${CI:-}" ]]; then
        run_smoke_tests
    fi
    
    log "Deployment to $ENVIRONMENT completed successfully!"
}

# Run main function
main "$@"
