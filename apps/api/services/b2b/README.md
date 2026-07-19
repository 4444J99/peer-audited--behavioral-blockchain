# Styx B2B Service (The Empire) - Ironclad Directive

## 1. Module Definition
This service handles **Corporate Integration**. It allows employers to fund "Sponsored Pots" for their employees without touching the employee's personal health data.

## 2. Core Mandates
1.  **Privacy Firewall**: The Employer **NEVER** sees individual health data (Weight, Steps, Sleep). They only see "Aggregate Success Rates" and "Engagement Scores."
2.  **Sponsored Pots**: Logic for "Company Pays, Employee Plays." (If Employee fails, money goes to Anti-Charity or Company Charity; Employee loses nothing but the bonus).

## 3. Architecture
- **CRM Connectors**: Adapters for Salesforce/HubSpot (for Sales Goals).
- **HRIS Connectors**: Adapters for Workday/BambooHR (for Roster Sync).
- **Billing**: Generates monthly invoices based on "Active Users."

## 4. API Contracts
### `POST /v1/b2b/roster/sync`
- **Input**: CSV or JSON list of Employee Emails.
- **Action**: Generates "Invite Links" with pre-funded credits.

### `GET /v1/b2b/analytics/aggregate`
- **Output**: `{ "total_steps_company_wide": 1000000, "active_users": 50 }`
- **Constraint**: Must enforce `k-anonymity` (min 5 users per group) before displaying stats.

## 5. Error Handling
- If HRIS sync fails, **Retry Exponentially** (do not drop invites).
- If an employee is terminated (via webhook), **Freeze** their sponsored contracts immediately.

## 6. Testing
- **Privacy Test**: Attempt to request individual data via B2B Admin token -> Must return `403 Forbidden`.
