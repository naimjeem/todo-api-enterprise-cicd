#!/bin/bash

# Rollback Script for Todo API (Docker Compose)
set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
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

# Get current deployment status
get_deployment_status() {
    log "Getting current deployment status..."
    
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log "Services are currently running"
        docker-compose -f "$COMPOSE_FILE" ps
    else
        warn "No services are currently running"
    fi
}

# Perform rollback
perform_rollback() {
    log "Performing rollback..."
    
    # Stop current services
    log "Stopping current services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Wait a moment
    sleep 5
    
    # Start services again (this will use the previous image if available)
    log "Starting services with previous configuration..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    timeout 300 bash -c "until docker-compose -f $COMPOSE_FILE ps | grep -q 'healthy'; do sleep 5; done"
    
    if [[ $? -eq 0 ]]; then
        log "Rollback completed successfully"
    else
        error "Rollback failed - services did not become healthy"
    fi
}

# Verify rollback
verify_rollback() {
    log "Verifying rollback..."
    
    # Health check
    if curl -f http://localhost:3000/health &> /dev/null; then
        log "Health check passed - rollback successful"
    else
        error "Health check failed - rollback may have issues"
    fi
    
    # Show current status
    log "Current deployment status:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Main rollback function
main() {
    log "Starting rollback for $ENVIRONMENT environment"
    
    # Set up error handling
    trap 'error "Rollback failed at line $LINENO"' ERR
    
    check_prerequisites
    get_deployment_status
    
    # Confirm rollback
    read -p "Are you sure you want to rollback? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Rollback cancelled"
        exit 0
    fi
    
    perform_rollback
    verify_rollback
    
    log "Rollback to $ENVIRONMENT completed successfully!"
}

# Run main function
main "$@"

