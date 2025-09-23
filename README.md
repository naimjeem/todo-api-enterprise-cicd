# Todo API - Enterprise CI/CD Pipeline

A robust, enterprise-grade Todo API with comprehensive CI/CD pipeline that enforces strict quality and security standards.

## 🚀 Features

- **RESTful API** with Express.js and PostgreSQL
- **Comprehensive Testing** (Unit, Integration, Smoke, Performance)
- **Security Scanning** (SAST, Container, Dependency)
- **Performance Testing** with k6
- **Quality Gates** (85% test coverage, P95 < 200ms, security scans)
- **Automated Deployment** to staging and production
- **Rollback Capability** on deployment failures

## 📋 Quality Gates

All quality gates must pass before deployment:

1. ✅ **Unit Test Coverage > 85%**
2. ✅ **All Integration Tests Pass**
3. ✅ **Security Scan (SAST) passes with no HIGH severity vulnerabilities**
4. ✅ **API P95 Response Time < 200ms under minimal load**
5. ✅ **Code Quality Score > 8.0 (via SonarQube/SonarCloud)**
6. ✅ **Dependency Vulnerability Scan passes with no HIGH severity CVEs**
7. ✅ **Smoke Tests Pass in the staging environment**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   GitHub       │    │   Docker       │
│   Repository    │───▶│   Actions      │───▶│   Compose      │
│                 │    │   CI/CD        │    │   (Staging/    │
└─────────────────┘    └─────────────────┘    │   Production)  │
                                              └─────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Testing**: Jest, Supertest, k6
- **Security**: ESLint Security Plugin, Trivy, Snyk
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Health checks, Performance metrics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Nginx (for production)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the database**
   ```bash
   docker-compose up postgres -d
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   npm run test:coverage
   ```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up

# Run staging environment
docker-compose -f docker-compose.staging.yml up -d

# Run production environment
docker-compose -f docker-compose.production.yml up -d
```

## 📊 API Endpoints

### Health Checks
- `GET /health` - Health status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Tasks
- `GET /tasks` - List tasks (with pagination, filtering, search)
- `GET /tasks/:id` - Get specific task
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `PATCH /tasks/:id/complete` - Mark task complete/incomplete

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** (100 requests per 15 minutes)
- **CORS** configuration
- **Input validation** with Joi and express-validator
- **SQL injection protection** with parameterized queries
- **Security scanning** in CI/CD pipeline

## 🧪 Testing Strategy

### Unit Tests
- **Coverage**: >85% required
- **Framework**: Jest
- **Location**: `tests/unit/`

### Integration Tests
- **Database**: PostgreSQL test database
- **Framework**: Jest + Supertest
- **Location**: `tests/integration/`

### Performance Tests
- **Tool**: k6
- **Threshold**: P95 < 200ms
- **Location**: `tests/performance/`

### Smoke Tests
- **Purpose**: Basic functionality verification
- **Location**: `tests/smoke/`

## 🚀 CI/CD Pipeline

### Pipeline Stages

1. **Code Quality & Security**
   - ESLint code analysis
   - Security audit (npm audit)
   - SonarQube quality gate

2. **Testing**
   - Unit tests with coverage
   - Integration tests
   - Coverage threshold validation

3. **Build & Containerization**
   - Docker image build
   - Multi-architecture support
   - Container registry push

4. **Performance Testing**
   - k6 load testing
   - P95 response time validation
   - Performance metrics collection

5. **Security Scanning**
   - Container vulnerability scan (Trivy)
   - Dependency scan (Snyk)
   - License compliance check

6. **Deployment**
   - Staging deployment
   - Smoke tests
   - Production deployment
   - Post-deployment verification

### Quality Gates

Each stage has specific quality gates that must pass:

```yaml
Quality Gates:
  - Unit Test Coverage: >85%
  - Security Scan: No HIGH severity vulnerabilities
  - Performance: P95 < 200ms
  - Code Quality: SonarQube score >8.0
  - Smoke Tests: All must pass
```

## 🚀 Deployment

### Staging Deployment
```bash
./scripts/deploy.sh staging develop
```

### Production Deployment
```bash
./scripts/deploy.sh production main
```

### Docker Compose Deployment
```bash
# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Deploy to production
docker-compose -f docker-compose.production.yml up -d
```

### Rollback
```bash
# Rollback staging
./scripts/rollback.sh staging

# Rollback production
./scripts/rollback.sh production
```

## 📈 Monitoring & Observability

### Health Checks
- **Liveness**: `/health/live`
- **Readiness**: `/health/ready`
- **Health Status**: `/health`

### Metrics
- Response time monitoring
- Error rate tracking
- Resource utilization
- Database connection status

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
LOG_LEVEL=info
ALLOWED_ORIGINS=https://yourdomain.com
```

### Secrets Management
- Environment files for sensitive data
- GitHub Secrets for CI/CD
- Docker Compose environment variables

## 🛡️ Security Best Practices

- **Non-root containers**
- **Read-only filesystem**
- **Security headers**
- **Input validation**
- **Rate limiting**
- **Dependency scanning**
- **Container scanning**

## 📁 Project Structure

```
todo-api/
├── src/                          # Application source code
├── tests/                        # Comprehensive test suite
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── smoke/                    # Smoke tests
│   └── performance/              # k6 performance tests
├── nginx/                        # Nginx configurations
│   ├── staging.conf              # Staging reverse proxy
│   └── production.conf           # Production reverse proxy
├── .github/workflows/            # CI/CD pipelines
├── database/                     # Database initialization
├── scripts/                      # Deployment scripts
├── docs/                         # Documentation
├── docker-compose.yml            # Development environment
├── docker-compose.staging.yml    # Staging environment
├── docker-compose.production.yml # Production environment
└── Configuration files           # ESLint, Docker, etc.
```

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Ensure all quality gates pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting guide
- Review the CI/CD pipeline logs

---

**Built with ❤️ for enterprise-grade reliability and security**
