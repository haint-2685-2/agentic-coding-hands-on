# Backend API Test Cases

**Project**: [PROJECT_NAME]
**API Version**: v1
**Generated**: [DATE]
**Last Updated**: [DATE]

---

## Overview

This document contains functional test cases for all API endpoints, derived from:
- UI/UX designs in Figma
- Frontend functional test cases
- API specifications in `api-docs.yaml`

### Test Case Categories

| Category | Description | Priority |
|----------|-------------|----------|
| Positive | Valid inputs → expected success | P1 |
| Negative | Invalid inputs → expected error | P1 |
| Boundary | Edge values, limits | P2 |
| Validation | Format, required fields | P1 |
| Auth | Authorization checks | P1 |
| Integration | Cross-endpoint flows | P2 |

### Test Case ID Format

```
{ENDPOINT}_{NUMBER}
Example: LOGIN_01, USER_GET_03
```

---

## Authentication Endpoints

### POST /auth/login

#### Description
Authenticate user with email and password, return JWT tokens.

#### Request
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| LOGIN_01 | Positive | Valid credentials | `{"email":"user@test.com","password":"Valid123!"}` | `{"accessToken":"...","user":{...}}` | 200 |
| LOGIN_02 | Negative | Wrong password | `{"email":"user@test.com","password":"wrongpass"}` | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| LOGIN_03 | Negative | Non-existent user | `{"email":"nouser@test.com","password":"any"}` | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| LOGIN_04 | Validation | Missing email | `{"password":"Valid123!"}` | `{"error":{"code":"VALIDATION_ERROR","details":{"email":["Required"]}}}` | 422 |
| LOGIN_05 | Validation | Missing password | `{"email":"user@test.com"}` | `{"error":{"code":"VALIDATION_ERROR","details":{"password":["Required"]}}}` | 422 |
| LOGIN_06 | Validation | Invalid email format | `{"email":"notanemail","password":"Valid123!"}` | `{"error":{"details":{"email":["Invalid format"]}}}` | 422 |
| LOGIN_07 | Boundary | Email max length (255) | `{"email":"a{255}@test.com","password":"Valid123!"}` | Validation or auth error | 422/401 |
| LOGIN_08 | Boundary | Empty email | `{"email":"","password":"Valid123!"}` | `{"error":{"details":{"email":["Required"]}}}` | 422 |
| LOGIN_09 | Boundary | Empty password | `{"email":"user@test.com","password":""}` | `{"error":{"details":{"password":["Required"]}}}` | 422 |
| LOGIN_10 | Negative | Account locked | `{"email":"locked@test.com","password":"Valid123!"}` | `{"error":{"code":"ACCOUNT_LOCKED"}}` | 403 |

---

### POST /auth/register

#### Description
Register a new user account.

#### Request
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "name": "string (required)"
}
```

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| REGISTER_01 | Positive | Valid registration | `{"email":"new@test.com","password":"Valid123!","name":"Test User"}` | `{"data":{"id":...,"email":"new@test.com"}}` | 201 |
| REGISTER_02 | Negative | Duplicate email | `{"email":"existing@test.com","password":"Valid123!","name":"Test"}` | `{"error":{"code":"CONFLICT"}}` | 409 |
| REGISTER_03 | Validation | Password too short | `{"email":"new@test.com","password":"123","name":"Test"}` | `{"error":{"details":{"password":["Min 8 chars"]}}}` | 422 |
| REGISTER_04 | Validation | Password no number | `{"email":"new@test.com","password":"NoNumbers!","name":"Test"}` | `{"error":{"details":{"password":["Must contain number"]}}}` | 422 |
| REGISTER_05 | Validation | Name too short | `{"email":"new@test.com","password":"Valid123!","name":"A"}` | `{"error":{"details":{"name":["Min 2 chars"]}}}` | 422 |
| REGISTER_06 | Boundary | Name max length (100) | `{"email":"new@test.com","password":"Valid123!","name":"A{100}"}` | Success | 201 |
| REGISTER_07 | Boundary | Name exceeds max | `{"email":"new@test.com","password":"Valid123!","name":"A{101}"}` | Validation error | 422 |
| REGISTER_08 | Validation | All fields missing | `{}` | Multiple validation errors | 422 |

---

### POST /auth/refresh

#### Description
Refresh access token using refresh token.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| REFRESH_01 | Positive | Valid refresh token | `{"refreshToken":"valid_token"}` | `{"accessToken":"...","expiresIn":3600}` | 200 |
| REFRESH_02 | Negative | Expired refresh token | `{"refreshToken":"expired_token"}` | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| REFRESH_03 | Negative | Invalid refresh token | `{"refreshToken":"invalid"}` | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| REFRESH_04 | Validation | Missing refresh token | `{}` | Validation error | 422 |
| REFRESH_05 | Negative | Revoked refresh token | `{"refreshToken":"revoked_token"}` | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |

---

### POST /auth/logout

#### Description
Invalidate current session.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| LOGOUT_01 | Positive | Valid logout | Header: `Authorization: Bearer valid_token` | No content | 204 |
| LOGOUT_02 | Auth | No token | No Authorization header | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| LOGOUT_03 | Auth | Invalid token | Header: `Authorization: Bearer invalid` | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| LOGOUT_04 | Negative | Already logged out | Use same token again | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |

---

## User Endpoints

### GET /users/me

#### Description
Get current authenticated user's profile.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| USER_ME_01 | Positive | Get own profile | Valid auth token | `{"data":{"id":...,"email":"...","name":"..."}}` | 200 |
| USER_ME_02 | Auth | No token | No Authorization header | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| USER_ME_03 | Auth | Expired token | Expired auth token | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| USER_ME_04 | Negative | Deleted user token | Token of deleted user | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |

---

### PUT /users/me

#### Description
Update current user's profile.

#### Request
```json
{
  "name": "string (optional)",
  "avatar": "string (optional, URL)"
}
```

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| USER_UPDATE_01 | Positive | Update name | `{"name":"New Name"}` | `{"data":{"name":"New Name"}}` | 200 |
| USER_UPDATE_02 | Positive | Update avatar | `{"avatar":"https://example.com/img.jpg"}` | `{"data":{"avatar":"..."}}` | 200 |
| USER_UPDATE_03 | Positive | Update both | `{"name":"New","avatar":"https://..."}` | Updated user | 200 |
| USER_UPDATE_04 | Positive | Empty body | `{}` | Unchanged user | 200 |
| USER_UPDATE_05 | Validation | Invalid avatar URL | `{"avatar":"not-a-url"}` | Validation error | 422 |
| USER_UPDATE_06 | Validation | Name too short | `{"name":"A"}` | Validation error | 422 |
| USER_UPDATE_07 | Auth | No token | No auth | Unauthorized | 401 |
| USER_UPDATE_08 | Negative | Try to change email | `{"email":"new@test.com"}` | Ignored or error | 200/422 |

---

### GET /users

#### Description
List users with pagination.

#### Query Parameters
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `sort` (string, format: `field:asc|desc`)
- `search` (string)

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| USER_LIST_01 | Positive | Default pagination | No params | `{"data":[...],"meta":{"page":1,"limit":20}}` | 200 |
| USER_LIST_02 | Positive | Custom pagination | `?page=2&limit=10` | `{"data":[...],"meta":{"page":2,"limit":10}}` | 200 |
| USER_LIST_03 | Positive | Search by name | `?search=john` | Filtered results | 200 |
| USER_LIST_04 | Positive | Sort ascending | `?sort=name:asc` | Sorted A-Z | 200 |
| USER_LIST_05 | Positive | Sort descending | `?sort=created_at:desc` | Newest first | 200 |
| USER_LIST_06 | Boundary | Page 0 | `?page=0` | Error or page 1 | 422/200 |
| USER_LIST_07 | Boundary | Negative page | `?page=-1` | Validation error | 422 |
| USER_LIST_08 | Boundary | Limit exceeds max | `?limit=200` | Capped to 100 | 200 |
| USER_LIST_09 | Boundary | Empty result | `?search=nonexistent` | `{"data":[],"meta":{}}` | 200 |
| USER_LIST_10 | Auth | No token | No auth | Unauthorized | 401 |

---

### GET /users/{id}

#### Description
Get specific user by ID.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| USER_GET_01 | Positive | Valid ID | `/users/1` | `{"data":{"id":1,...}}` | 200 |
| USER_GET_02 | Negative | Non-existent ID | `/users/99999` | `{"error":{"code":"NOT_FOUND"}}` | 404 |
| USER_GET_03 | Validation | Invalid ID format | `/users/abc` | Validation error | 422 |
| USER_GET_04 | Boundary | ID = 0 | `/users/0` | Not found | 404 |
| USER_GET_05 | Boundary | Negative ID | `/users/-1` | Validation error | 422 |
| USER_GET_06 | Auth | No token | No auth | Unauthorized | 401 |

---

## [RESOURCE] Endpoints (Template)

### GET /[resources]

#### Description
[Description of list endpoint]

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| [RES]_LIST_01 | Positive | Default list | No params | Success with pagination | 200 |
| [RES]_LIST_02 | Auth | No token | No auth | Unauthorized | 401 |

---

### POST /[resources]

#### Description
[Description of create endpoint]

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| [RES]_CREATE_01 | Positive | Valid creation | Valid body | Created resource | 201 |
| [RES]_CREATE_02 | Validation | Missing required | Incomplete body | Validation error | 422 |
| [RES]_CREATE_03 | Auth | No token | No auth | Unauthorized | 401 |

---

### GET /[resources]/{id}

#### Description
[Description of get endpoint]

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| [RES]_GET_01 | Positive | Valid ID | `/[resources]/1` | Resource data | 200 |
| [RES]_GET_02 | Negative | Not found | `/[resources]/99999` | Not found | 404 |

---

### PUT /[resources]/{id}

#### Description
[Description of update endpoint]

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| [RES]_UPDATE_01 | Positive | Valid update | Valid body | Updated resource | 200 |
| [RES]_UPDATE_02 | Negative | Not found | Non-existent ID | Not found | 404 |
| [RES]_UPDATE_03 | Auth | Not owner | Other user's resource | Forbidden | 403 |

---

### DELETE /[resources]/{id}

#### Description
[Description of delete endpoint]

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| [RES]_DELETE_01 | Positive | Valid delete | Valid ID | No content | 204 |
| [RES]_DELETE_02 | Negative | Not found | Non-existent ID | Not found | 404 |
| [RES]_DELETE_03 | Negative | Already deleted | Deleted resource | Not found | 404 |
| [RES]_DELETE_04 | Auth | Not owner | Other user's resource | Forbidden | 403 |

---

## Integration Test Scenarios

### Scenario: User Registration and Login Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST /auth/register | User created (201) |
| 2 | POST /auth/login with new user | Tokens received (200) |
| 3 | GET /users/me with token | User profile returned (200) |
| 4 | PUT /users/me update profile | Profile updated (200) |
| 5 | POST /auth/logout | Session ended (204) |
| 6 | GET /users/me with old token | Unauthorized (401) |

### Scenario: Token Refresh Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST /auth/login | Get access + refresh tokens |
| 2 | Wait for access token expiry | - |
| 3 | GET /users/me with expired token | Unauthorized (401) |
| 4 | POST /auth/refresh | New access token |
| 5 | GET /users/me with new token | Success (200) |

---

## Test Data Requirements

### Seed Data

| Entity | Count | Purpose |
|--------|-------|---------|
| Users | 10 | Test listing, pagination |
| Admin Users | 2 | Test admin endpoints |
| Locked Users | 1 | Test account lock |

### Test User Credentials

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@test.com | Admin123! | admin | active |
| user@test.com | User123! | user | active |
| locked@test.com | Locked123! | user | locked |

---

## Notes

- All test cases assume proper test database isolation
- Integration tests should use transactions for rollback
- Performance tests are documented separately
- Security tests (injection, XSS) are documented in security-tests.md
