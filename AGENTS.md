# Momorph Agent Commands Guide

This guide provides an overview of all available prompt commands for the Momorph project. Each command is designed for specific development and testing workflows.

## 📋 Command Overview

### Development Planning & Specification

#### `momorph.plan`
- **Purpose**: Creates comprehensive development plans for features
- **Use Case**: Initial project planning, feature roadmapping
- **Output**: Structured development plan with milestones and tasks

#### `momorph.constitution`
- **Purpose**: Defines project constitution, guidelines, and architectural principles
- **Use Case**: Establishing coding standards, architecture decisions, and team conventions
- **Output**: Constitution document with project rules and standards

#### `momorph.screenflow`
- **Purpose**: Designs user flow and navigation patterns between screens
- **Use Case**: UX planning, navigation architecture, user journey mapping
- **Output**: Screenflow documentation with transitions and interactions

#### `momorph.specify`
- **Purpose**: Creates detailed specifications for features and components
- **Use Case**: Breaking down features into implementable specs
- **Output**: Technical specifications with acceptance criteria

### Figma Integration & UI Specifications

#### `momorph.specs`
- **Purpose**: Generates UI component specifications from Figma designs
- **Description**: Analyzes Figma design elements and creates stakeholder-friendly specs with validation rules and behavior descriptions
- **Tools Used**: Figma MCP tools (`get_frame`, `get_frame_image`, `list_design_items`, etc.)
- **Use Case**: Converting Figma designs to implementation-ready specifications
- **Output**: Structured specification documents in markdown format

### API & Database Design

#### `momorph.apispecs`
- **Purpose**: Generates API specifications and endpoint documentation
- **Use Case**: Defining REST/GraphQL APIs, request/response schemas
- **Output**: API documentation with endpoints, methods, and data contracts

#### `momorph.database`
- **Purpose**: Designs database schemas and data models
- **Use Case**: Database architecture planning, ORM configuration
- **Output**: Database design documents with tables, relationships, and migrations

### Implementation

#### `momorph.implement`
- **Purpose**: Implements features based on specifications
- **Use Case**: Actual code generation and implementation
- **Output**: Working code following project standards

#### `momorph.tasks`
- **Purpose**: Breaks down features into actionable development tasks
- **Use Case**: Sprint planning, task management, work breakdown
- **Output**: Task list with priorities and dependencies

### Testing & Quality Assurance

#### `momorph.createtestcases`
- **Purpose**: Generates comprehensive test cases from Figma design specifications
- **Description**: Reads specifications from markdown files, analyzes Figma design items, and generates test cases covering all scenarios
- **Tools Used**: Test viewpoints tools, Figma MCP tools
- **Process**:
  1. Converts Figma frame to specifications
  2. Analyzes design items and interactions
  3. Generates test cases for each scenario
- **Use Case**: Creating test suites from design specifications
- **Output**: Test case documents organized by screen in `.momorph/contexts/testcases/`

#### `momorph.updatetestcases`
- **Purpose**: Updates existing test cases based on Figma design specification changes
- **Description**: Analyzes differences between old and new specs, then regenerates/updates/deletes test cases accordingly
- **Tools Used**: `list_frame_spec_diffs`, `get_frame_test_cases`
- **Process**:
  1. Analyzes specification differences (NEW, MODIFIED, DELETED items)
  2. Fetches existing test cases
  3. Updates test cases maintaining original format consistency
- **Use Case**: Maintaining test suite alignment with evolving designs
- **Output**: Updated test cases reflecting specification changes

### End-to-End Testing (Playwright)

#### `momorph.setupe2e`
- **Purpose**: Orchestrates complete Playwright project setup
- **Description**: Coordinates multiple specialized prompts to create a production-ready Playwright testing project
- **Tools Used**: Playwright tools, project configuration tools
- **Workflow**:
  1. **Project Foundation**: Directory structure, configuration files
  2. **Code Quality**: ESLint, Prettier, Husky setup
  3. **Infrastructure**: Authentication fixtures, CI/CD integration
  4. **Utilities**: AuthManager, test helpers
  5. **Page Objects**: Base classes, initial page objects
- **Use Case**: Initial Playwright project setup for new applications
- **Output**: Complete Playwright project structure with all configurations

#### `momorph.writee2e`
- **Purpose**: Generates production-ready Playwright TypeScript tests
- **Description**: Creates tests with automatic project/fixture detection, strict POM compliance, and support for spec-driven or URL exploration inputs
- **Tools Used**: Playwright tools, frame test cases tools
- **Features**:
  - Universal architecture detection (multi-site, single-site-multi-role)
  - Automatic project structure detection
  - Page Object Model compliance
  - Robust selector strategies
- **Prerequisites**: Requires test plan markdown from Test Case Breakdown Guideline
- **Use Case**: Implementing automated tests from test specifications
- **Output**: Playwright test files following project architecture

#### `momorph.reviewe2e`
- **Purpose**: Reviews Playwright E2E test changes for quality and compliance
- **Description**: Evaluates tests for POM compliance, selector robustness, test data separation, and adherence to code review standards
- **Tools Used**: Playwright tools, code analysis tools
- **Review Checklist**:
  - Architecture & Design Patterns
  - POM compliance
  - Selector strategy
  - Test data management
  - Performance considerations
- **Use Case**: Pull request reviews, code quality assurance
- **Output**: Review feedback and improvement suggestions

### Version Control

#### `momorph.commit`
- **Purpose**: Generates conventional commit messages
- **Use Case**: Creating standardized, descriptive commit messages
- **Output**: Formatted commit messages following conventions

## 🔧 Usage Tips

1. **Start with Planning**: Use `momorph.plan` and `momorph.constitution` to establish project foundation
2. **Design First**: Use `momorph.specs` to analyze Figma designs before implementation
3. **Sequential Testing**: Use `momorph.createtestcases` for new features, then `momorph.updatetestcases` for changes
4. **E2E Setup Order**: Always run `momorph.setupe2e` before `momorph.writee2e`
5. **Review Changes**: Use `momorph.reviewe2e` before merging test automation code

## 📁 Output Locations

- **Specifications**: `.momorph/contexts/specs/`
- **Test Cases**: `.momorph/contexts/testcases/`
- **E2E Tests**: Project-specific test directories
- **Guidelines**: `.momorph/guidelines/`

## 🎯 Workflow Examples

### New Feature Development
1. `momorph.specs` → Generate specifications from Figma
2. `momorph.createtestcases` → Create test cases
3. `momorph.specify` → Create local screen specs
4. `momorph.plan` → Create feature plan
5. `momorph.implement` → Build the feature
6. `momorph.commit` → Commit changes

### E2E Test Automation Setup
1. `momorph.setupe2e` → Initialize Playwright project
2. `momorph.createtestcases` → Generate test specifications
3. `momorph.writee2e` → Implement Playwright tests
4. `momorph.reviewe2e` → Review test quality

### Design Update Workflow
1. Update Figma designs
2. `momorph.updatetestcases` → Update test cases
3. `momorph.writee2e` → Regenerate affected tests
4. `momorph.reviewe2e` → Verify changes

## MOMORPH CLI

```sh
# Upload test case CSV files to MoMorph server
momorph upload testcases path/to/file.csv --screen-id={screenID}

# Upload spec CSV files to MoMorph server
momorph upload specs path/to/file.csv --screen-id={screenID}
```
