# Test Case Breakdown Guideline

## 🎯 Purpose
Break down QA test cases into **atomic, deterministic Playwright test specifications** to ensure consistent test generation.
**⚠️ IMPORTANT**: If the test cases are written clearly and each one focuses on a single, specific scenario (with no unrelated content mixed in), the agent will generate the correct number of Playwright tests matching the test case specifications. Combining multiple scenarios into a single test case may result in inconsistent test generation.

## 📥 Input Sources
1. **Figma**
2. **URL**
3. **Natural Language Description**

## 🔍 Process

### Step 1: Extract Test Cases

**Method 1: Figma (fileKey + frameID)**
1. Call tool `momorph/get_frame_test_cases` with:
   - `fileKey`: {extracted from user input}
   - `frameID`: {extracted from user input}
2. Parse response to extract test cases for each screen
3. For each test case, identify:
   - Target component (map to `availableComponents[]`)
   - Test scenario (positive/negative/edge case)
   - Required test data (inputs, expected outputs)
   - Validation points (assertions to make)
4. Group test cases by screen/feature

**Method 2: URL Exploration**
1. Call `mcp_playwright_browser_navigate` with URL
2. Call `mcp_playwright_browser_snapshot` to capture page structure
3. Analyze snapshot to identify:
   - Form fields and validation rules
   - Interactive elements (buttons, links, dropdowns)
   - Navigation patterns (menus, breadcrumbs)
   - Error/success message patterns
4. Derive test scenarios:
   - Happy path: valid inputs → success
   - Error paths: invalid inputs → error messages
   - Edge cases: boundary values, empty states

**Method 3: Natural Language Description**
1. Parse user description for:
   - Feature name (e.g., "login", "checkout", "dashboard")
   - Target component
   - Mentioned scenarios (e.g., "validation", "error handling")
2. Infer standard test scenarios based on feature type:
   - Login → valid/invalid credentials, empty fields, forgot password
   - Forms → field validation, submission success/error
   - Dashboard → data display, filtering, navigation
3. Determine required test data and validation points

### Step 2: Classify & Analyze

For each test case:
- Identify scope: Single test or combined scenarios?
- Classify type: ✅ Positive / ❌ Negative / 🔄 Edge case
- Note preconditions and test data

### Step 3: Break Down Combined Tests

**Rule: One test = One scenario = One assertion goal**

### Step 4: Define Specifications

For each atomic test, specify:
- Test ID, Name, Type, Priority
- Preconditions
- Test Steps (numbered)
- Test Data (specific values)
- Expected Result (clear assertion)
- Required Page Objects & Selectors

## 📋 Output Format
Generate: `.momorph/contexts/e2e/test_plan_{feature}.md`
```markdown
# Test Plan: {Feature Name}
**Source**: {Figma/Manual/URL} | **Component**: {Site/Role/Module} | **Created**: {Date}
---
## Test Case: TC{ID} - {Brief Title}
**Test ID**: `TC{ID}` | **Type**: ✅/❌/🔄 | **Priority**: High/Medium/Low
**Preconditions**: {conditions}
**Test Steps**:
1. {action 1}
2. {action 2}
**Test Data**: Field1: `value`, Field2: `value`
**Expected Result**: {assertion}
**Requirements**: PageObject: `method()`, Selector: `strategy`
---
## Summary
Total: {X} | Positive: {Y} | Negative: {Z} | Edge: {W}
```

## ✅ Validation
- Atomic: One assertion per test
- Deterministic: Same input = same output
- Independent: Any order execution
- Complete: All scenarios covered
- Traceable: Maps to original test case

## 🔄 Next Steps
1. Save to `.momorph/contexts/e2e/test_plan_{feature}.md`
2. Continue the e2e generation.
