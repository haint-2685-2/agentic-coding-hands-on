# Playwright Project Setup & Test Generation - Complete Guide

## 🎯 **Overview**

This comprehensive guide provides three optimized workflows for Playwright test automation:

1. **🏗️ Project Setup Workflow** - Run once to establish complete project foundation
2. **⚡ Test Generation Workflow** - Run frequently to create tests quickly and efficiently
3. **🔍 Code Review Workflow** - Run after generation to ensure quality standards

All workflows use GitHub Copilot with specialized prompts to automate the entire process.

---

## 🏗️ **Workflow 1: Project Setup (One-Time)**

### **When to Use**

- Setting up a new Playwright project from scratch
- Need complete project structure with authentication, page objects, and configurations
- First time working with a new application or website

### **Prerequisites**

```bash
# Required installations
- Node.js (version 18+)
- VS Code with GitHub Copilot extension
- MCP Playwright

# Project initialization
mkdir my-playwright-project
cd my-playwright-project
yarn create playwright
```

### **Step 1: Gather Project Information**

**For Multi-Site Projects** (multiple different websites):

```yaml
project_type: "multi-site"
project_name: "my-testing-project"
sites:
  - name: "main-site"
    base_url: "https://main-app.example.com"
    login_url: "https://main-app.example.com/login"
    auth_fields:
      - name: "email"
        env_var: "MAIN_SITE_EMAIL"
        example: "user@example.com"
      - name: "password"
        env_var: "MAIN_SITE_PASSWORD"
        example: "password123"
  - name: "admin-portal"
    base_url: "https://admin.example.com"
    login_url: "https://admin.example.com/signin"
    auth_fields:
      - name: "username"
        env_var: "ADMIN_USERNAME"
        example: "admin"
      - name: "password"
        env_var: "ADMIN_PASSWORD"
        example: "adminpass"
```

**For Single-Site Multi-Role Projects** (one website with different user roles):

```yaml
project_type: "single-site-multi-role"
project_name: "my-app-tests"
base_url: "https://myapp.example.com"
login_url: "https://myapp.example.com/login"
roles:
  - name: "admin"
    auth_fields:
      - name: "email"
        env_var: "ADMIN_EMAIL"
        example: "admin@example.com"
      - name: "password"
        env_var: "ADMIN_PASSWORD"
        example: "admin123"
  - name: "user"
    auth_fields:
      - name: "email"
        env_var: "USER_EMAIL"
        example: "user@example.com"
      - name: "password"
        env_var: "USER_PASSWORD"
        example: "user123"
```

### **Step 2: Execute Setup Workflow**

Open GitHub Copilot Chat select Agent mode + Claude Sonnet 4 (recommended) or ChatGPT 5 (or newer versions) in VS Code and paste:

```prompt
Setup new Playwright project following 1_project_setup_workflow.md:

[Paste your project configuration here]

Execute Phase 1: Complete foundation setup with the following requirements:
- Create complete project structure
- Generate all configuration files
- Setup authentication system
- Create base page objects
- Ensure TypeScript compilation
- Validate sample tests pass
```

### **Step 3: Update Real Credentials**

After setup completes, update the generated `.env` file with actual credentials:

```bash
# Example .env file (replace with real values)
MAIN_SITE_EMAIL=real-email@sun-asterisk.com
MAIN_SITE_PASSWORD=RealPassword123
ADMIN_USERNAME=realadmin
ADMIN_PASSWORD=RealAdminPass456
```

### **Step 4: Validation**

The setup is complete when you see:

- ✅ Complete project structure created
- ✅ All configurations working and validated
- ✅ Sample authentication test passing
- ✅ Ready for test generation

---

## ⚡ **Workflow 2: Test Generation (Daily Use)**

### **When to Use**

- Project setup is already complete
- Need to create new test cases quickly
- Adding tests for new features or bug fixes
- Daily test automation tasks

### **Step 1: Choose Input Method**

**Method BEST: Specs + Code Analysis + MCP Web Access (Comprehensive Approach) 🌟**

```prompt
Generate tests from specification, frontend code, and using MCP Playwright live web analysis using 2_test_generation_workflow.md:

Target: [feature/component name to test]
Input method: Combined specification, frontend code analysis, and MCP web access
URL: [target URL for live analysis]
Test scenarios: [describe scenarios from specs]
Additional context: [any additional information]

[Attach both:
1. Specification file (.md) - defining requirements and scenarios
2. Frontend code file (.tsx, .vue, .js, .ts) - for code structure analysis]

Execute live web exploration to:
- Extract real DOM structure and locators from live page
- Analyze element attributes and relationships
- Capture actual page interactions and behaviors
- Generate most accurate and stable selectors
```

**Method A: MCP Playwright Live Web Analysis**

```prompt
Generate tests using MCP Playwright live web analysis with 2_test_generation_workflow.md:

Target: [feature/component name to test]
Input method: MCP Playwright live web analysis
URL: [target URL to analyze]
Test scenarios: [describe scenarios to test]
Additional context: [any additional information]

Execute live web exploration to:
- Extract real DOM structure and locators from live page
- Analyze element attributes and relationships
- Capture actual page interactions and behaviors
- Generate most accurate and stable selectors
```

**Method B: Specification-Driven**

```prompt
Generate tests from specification using 2_test_generation_workflow.md:

Target: login validation for main-site
Input method: Specification file
Test scenarios:
- Valid credentials login success
- Invalid credentials error handling
- Empty fields validation
- Password visibility toggle

[Attach your test specification .md file if available]
```

**Method C: URL Exploration**

```prompt
Generate tests using 2_test_generation_workflow.md:

Target: main-site login functionality
Input method: URL exploration
URL: https://main-app.example.com/login
Scenarios: Explore and test all login functionality
```

**Method D: Frontend Code Analysis**

```prompt
Generate tests using 2_test_generation_workflow.md:

Target: [feature/component name to test]
Input method: Frontend code analysis
Test scenarios: [describe scenarios to test]
Additional context: [any additional information]

[Attach frontend code file (React/Vue/Angular component) for accurate locator analysis]
```

**Method E: Simple Description**

```prompt
Generate tests using 2_test_generation_workflow.md:

Test request: "Create login validation tests for admin-portal"
Include: successful login, error handling, form validation
```

### **Step 2: Test Generation**

The test generator will automatically:

- 🔍 Detect your project structure and conventions
- 📝 Generate appropriate test files following your project patterns
- 🎯 Use existing page objects (or create new ones if needed)
- 📊 Extract and organize selectors properly
- ✅ Ensure tests pass validation

### **Step 3: Review and Run**

Generated tests will be:

- ✅ Ready for code review
- ✅ Following Page Object Model principles
- ✅ Using proper authentication fixtures
- ✅ Properly integrated with existing structure

### **Step 4: Code Quality Review (IMPORTANT)**

After test generation, always conduct code review:

```prompt
Review generated code using 3_code_review_standards.md:

Generated files:
- tests/main-site/login/validation.spec.ts
- locales/ja/main-site/selectors/login.json

Review focus:
- Page Object Model compliance
- Selector extraction quality
- Architecture adherence
- Test quality standards
```

**Only after review approval are tests production-ready!**

---

## 🔍 **Workflow 3: Code Quality Review (After Generation)**

### **When to Use**

- After completing project setup (Workflow 1)
- After generating new tests (Workflow 2)
- Before deploying tests to production
- During regular code quality audits

### **Step 1: Execute Code Review**

```prompt
Review generated code using 3_code_review_standards.md:

Review type: [initial setup review OR test code review]
Files to review:
- [list of generated/modified files]

Focus areas:
- Page Object Model compliance
- Selector extraction and organization
- Architecture pattern adherence
- Test quality and maintainability
- Cross-browser compatibility
```

### **Step 2: Address Review Findings**

The review will identify:

- ✅ **Compliant code** - Ready for production
- ⚠️ **Issues found** - Specific recommendations for fixes
- 🔧 **Improvements suggested** - Optional enhancements

### **Step 3: Approval and Deployment**

Only after review approval:

- ✅ Tests are production-ready
- ✅ Code meets quality standards
- ✅ Architecture is maintainable
- ✅ Ready for team usage

---

## 📞 **Quick Reference**

### **Setup Command Template**

```prompt
Setup new Playwright project following 1_project_setup_workflow.md:

project_type: "[multi-site or single-site-multi-role]"
project_name: "[your-project-name]"
[paste configuration here]

Execute Phase 1: Complete foundation setup
```

### **Test Generation Command Template**

**PREMIUM Practice Template (Highest Recommendation):**

```prompt
Generate tests using MCP Playwright live web analysis with 2_test_generation_workflow.md:

Target: [feature/page description]
Input method: MCP Playwright live web analysis
URL: [target URL for live analysis]
Test scenarios: [specific requirements]

Execute live web exploration for real-time DOM analysis and accurate locator extraction.
```

**BEST Practice Template (Comprehensive Approach):**

```prompt
Generate tests using 2_test_generation_workflow.md:

Target: [feature/page description]
Input method: Combined specification, frontend code analysis, and MCP web access
URL: [target URL for live analysis]
Test scenarios: [specific requirements from specs]

[Attach both:
1. Specification file (.md) - defining requirements and scenarios
2. Frontend code file (.tsx, .vue, .js, .ts) - for code structure analysis]

Plus execute MCP Playwright web access for live DOM analysis.
```

**Other Methods Template:**

```prompt
Generate tests using 2_test_generation_workflow.md:

Target: [feature/page description]
Input method: [specification/URL exploration/frontend code analysis/MCP web analysis/simple description]
Test scenarios: [specific requirements]

[If using frontend code analysis, attach FE code files (.tsx, .vue, .js, .ts)]
[If using MCP analysis, provide target URL]
```

### **Code Review Command Template**

```prompt
Review generated code using 3_code_review_standards.md:

Review type: [initial setup review OR test code review]
Files to review: [list of generated/modified files]
Focus areas: [POM compliance/selector extraction/architecture]
```

### **File Locations**

- **Main prompts**: `.github/prompts/1_project_setup_workflow.md`, `2_test_generation_workflow.md`
- **Code review**: `.github/prompts/3_code_review_standards.md`
- **Component prompts**: `.github/prompts/components/` folder
- **Configurations**: `playwright.config.ts`, `.env`
