# 🔍 SonarQube Usage Guide for Todo API

## 🚀 Quick Start

### 1. **SonarCloud Setup (Recommended)**

#### Step 1: Create Account
```bash
# Go to https://sonarcloud.io
# Sign up with GitHub account
# Authorize SonarCloud access
```

#### Step 2: Create Project
1. Click "Create New Project"
2. Select "Import an existing GitHub repository"
3. Choose `todo-api` repository
4. Generate project token

#### Step 3: Configure GitHub Secrets
```bash
# In GitHub Repository Settings > Secrets and variables > Actions
SONAR_TOKEN=your_sonarcloud_token_here
```

### 2. **Run Analysis Locally**

#### Install SonarScanner
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

#### Set Environment Variables
```bash
# Set your SonarCloud token
export SONAR_TOKEN=your_token_here
export SONAR_PROJECT_KEY=todo-api
export SONAR_ORGANIZATION=your-org
```

#### Run Analysis
```bash
# Method 1: Using npm script
npm run sonar:scan

# Method 2: Using script directly
./scripts/sonar-scan.sh

# Method 3: Manual command
sonar-scanner \
  -Dsonar.projectKey=todo-api \
  -Dsonar.organization=your-org \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.sources=src \
  -Dsonar.tests=tests \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
```

## 📊 Understanding SonarQube Reports

### Quality Metrics Explained

| **Metric** | **Description** | **Good Value** |
|------------|-----------------|----------------|
| **Bugs** | Actual errors in code | 0 |
| **Vulnerabilities** | Security issues | 0 |
| **Code Smells** | Maintainability issues | <10 |
| **Coverage** | Test coverage percentage | >85% |
| **Duplications** | Duplicated code blocks | <3% |
| **Technical Debt** | Time to fix all issues | <1 hour |

### Quality Gate Status

#### ✅ **PASSED**
- All quality gates met
- Code meets standards
- Ready for deployment

#### ❌ **FAILED**
- One or more gates failed
- Code needs improvement
- Deployment blocked

#### ⚠️ **WARNING**
- Close to threshold
- Monitor closely
- Consider improvements

## 🎯 Quality Gates Configuration

### Current Quality Gates
The project is configured with these quality gates:

```yaml
Quality Gates:
  Coverage: >85%
  Duplicated Lines: <3%
  Maintainability Rating: A
  Reliability Rating: A
  Security Rating: A
  Security Hotspots: 0
  Vulnerabilities: 0
```

### Customizing Quality Gates
1. Go to SonarCloud project settings
2. Navigate to "Quality Gates"
3. Create or modify quality gate rules
4. Set thresholds for your requirements

## 🔧 Integration with CI/CD

### Automatic Analysis
The GitHub Actions workflow automatically:
1. Runs SonarQube analysis on every push
2. Checks quality gates
3. Fails the build if standards aren't met
4. Uploads results to SonarCloud

### Manual Trigger
```bash
# Trigger analysis manually
npm run sonar:scan

# Or use the script directly
./scripts/sonar-scan.sh
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. **Authentication Failed**
```bash
# Error: Authentication failed
# Solution: Check SONAR_TOKEN is correct
echo $SONAR_TOKEN
```

#### 2. **Coverage Report Not Found**
```bash
# Error: Coverage report not found
# Solution: Run tests with coverage first
npm run test:coverage
```

#### 3. **Project Key Not Found**
```bash
# Error: Project key not found
# Solution: Check sonar-project.properties
cat sonar-project.properties
```

#### 4. **Network Issues**
```bash
# Error: Connection timeout
# Solution: Check network connectivity
ping sonarcloud.io
```

### Getting Help
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [SonarQube Community](https://community.sonarsource.com/)
- [Quality Gate Documentation](https://docs.sonarcloud.io/advanced-setup/quality-gates/)

## 📈 Best Practices

### 1. **Regular Analysis**
- Run analysis on every commit
- Set up branch analysis for pull requests
- Monitor trends over time

### 2. **Quality Gate Evolution**
- Start with basic gates
- Gradually increase standards
- Involve team in gate decisions

### 3. **Technical Debt Management**
- Address new issues immediately
- Plan time for technical debt
- Use SonarQube's effort estimates

## 🎉 Success Metrics

Track these metrics to measure improvement:

| **Metric** | **Target** | **Current** |
|------------|------------|-------------|
| **Code Coverage** | >90% | 78.81% |
| **Technical Debt** | <1 hour | TBD |
| **Bug Density** | 0 | TBD |
| **Security Rating** | A | TBD |
| **Maintainability** | A | TBD |

## 🔄 Workflow Integration

### Pre-commit Hook
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
npm run sonar:scan
if [ $? -ne 0 ]; then
    echo "SonarQube analysis failed. Please fix issues before committing."
    exit 1
fi
```

### IDE Integration
- **VS Code**: SonarLint extension
- **IntelliJ**: SonarLint plugin
- **Eclipse**: SonarLint plugin

## 📚 Advanced Configuration

### Custom Rules
```javascript
// In sonar-project.properties
sonar.javascript.eslint.reportPaths=eslint-report.json
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/node_modules/**,**/coverage/**,**/*.test.js
```

### Branch Analysis
```bash
# Analyze specific branch
sonar-scanner \
  -Dsonar.branch.name=feature/new-feature \
  -Dsonar.branch.target=main
```

### Pull Request Analysis
```bash
# Analyze pull request
sonar-scanner \
  -Dsonar.pullrequest.key=123 \
  -Dsonar.pullrequest.branch=feature/new-feature \
  -Dsonar.pullrequest.base=main
```

## 🎯 Next Steps

1. **Set up SonarCloud account**
2. **Configure project and token**
3. **Run first analysis**
4. **Review results and fix issues**
5. **Set up CI/CD integration**
6. **Monitor quality trends**

---

**Happy Analyzing! 🚀**
