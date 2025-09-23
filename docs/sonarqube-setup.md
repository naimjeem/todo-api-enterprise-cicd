# SonarQube Integration Guide

## 🚀 Quick Start with SonarCloud

### Step 1: Create SonarCloud Account
1. Go to [sonarcloud.io](https://sonarcloud.io)
2. Sign up with GitHub account
3. Authorize SonarCloud to access your repositories

### Step 2: Create New Project
1. Click "Create New Project"
2. Select "Import an existing GitHub repository"
3. Choose your `todo-api` repository
4. Generate a token for the project

### Step 3: Configure GitHub Secrets
Add these secrets to your GitHub repository:

```bash
# In GitHub Repository Settings > Secrets and variables > Actions
SONAR_TOKEN=your_sonarcloud_token_here
```

### Step 4: Update CI/CD Pipeline
The pipeline is already configured! It will automatically:
- Run SonarQube analysis on every push
- Check quality gates
- Fail the build if quality standards aren't met

## 🔧 Local Development Setup

### Install SonarScanner
```bash
# Windows (using Chocolatey)
choco install sonarscanner-msbuild-net

# macOS (using Homebrew)
brew install sonar-scanner

# Linux
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
unzip sonar-scanner-cli-4.8.0.2856-linux.zip
sudo mv sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner
```

### Run Local Analysis
```bash
# Set your SonarCloud token
export SONAR_TOKEN=your_token_here

# Run analysis
sonar-scanner \
  -Dsonar.projectKey=todo-api \
  -Dsonar.organization=your-org \
  -Dsonar.sources=src \
  -Dsonar.tests=tests \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
  -Dsonar.coverage.exclusions=**/node_modules/**,**/coverage/**,**/*.test.js
```

## 📊 Quality Gates Configuration

### Current Quality Gates
The project is configured with these quality gates:

1. **Coverage**: >85%
2. **Duplicated Lines**: <3%
3. **Maintainability Rating**: A
4. **Reliability Rating**: A
5. **Security Rating**: A
6. **Security Hotspots**: 0
7. **Vulnerabilities**: 0

### Customizing Quality Gates
1. Go to SonarCloud project settings
2. Navigate to "Quality Gates"
3. Create or modify quality gate rules
4. Set thresholds for your requirements

## 🎯 Understanding SonarQube Reports

### Code Quality Metrics
- **Bugs**: Actual errors in code
- **Vulnerabilities**: Security issues
- **Code Smells**: Maintainability issues
- **Coverage**: Test coverage percentage
- **Duplications**: Duplicated code blocks

### Quality Gate Status
- **✅ PASSED**: All quality gates met
- **❌ FAILED**: One or more gates failed
- **⚠️ WARNING**: Close to threshold

## 🔄 Integration with CI/CD

### Automatic Analysis
The GitHub Actions workflow automatically:
1. Runs SonarQube analysis on every push
2. Checks quality gates
3. Fails the build if standards aren't met
4. Uploads results to SonarCloud

### Manual Trigger
You can also trigger analysis manually:
```bash
# In your project directory
npm run sonar:scan
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Token Issues
```bash
# Error: Authentication failed
# Solution: Check SONAR_TOKEN is correct
echo $SONAR_TOKEN
```

#### 2. Coverage Not Found
```bash
# Error: Coverage report not found
# Solution: Run tests with coverage first
npm run test:coverage
```

#### 3. Project Key Mismatch
```bash
# Error: Project key not found
# Solution: Check sonar-project.properties
cat sonar-project.properties
```

### Getting Help
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [SonarQube Community](https://community.sonarsource.com/)
- [Quality Gate Documentation](https://docs.sonarcloud.io/advanced-setup/quality-gates/)

## 📈 Best Practices

### 1. Regular Analysis
- Run analysis on every commit
- Set up branch analysis for pull requests
- Monitor trends over time

### 2. Quality Gate Evolution
- Start with basic gates
- Gradually increase standards
- Involve team in gate decisions

### 3. Technical Debt Management
- Address new issues immediately
- Plan time for technical debt
- Use SonarQube's effort estimates

## 🎉 Success Metrics

Track these metrics to measure improvement:
- **Code Coverage**: Aim for >90%
- **Technical Debt**: Reduce over time
- **Bug Density**: Lower is better
- **Security Rating**: Maintain A rating
- **Maintainability**: Keep rating A
