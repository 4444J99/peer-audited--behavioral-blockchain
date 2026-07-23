# Data Processing Agreement (DPA) Template

**Effective Date:** March 10, 2026  
**Between:** Styx / ORGANVM ("Data Processor") and Enterprise Client ("Data Controller")

## 1. Scope and Purpose
This Data Processing Agreement ("DPA") governs the processing of personal data provided by Data Controller to Data Processor in connection with the Styx behavioral accountability and enterprise management platform.

## 2. Processing Obligations
1. **Compliance with Laws**: Processor shall comply with all applicable data protection laws, including CCPA/CPRA, GDPR, and state health privacy frameworks.
2. **Confidentiality**: All personnel authorized to process personal data have committed to strict confidentiality obligations.
3. **Data Minimization & Security**: Processor implements appropriate technical and organizational measures (AES-256 encryption at rest, TLS 1.3 in transit, automated PII redaction) to protect personal data against unauthorized processing or disclosure.

## 3. Sub-Processors
Processor utilizes approved sub-processors for infrastructure, storage, and payment handling:
- **Render Inc.** (Cloud Infrastructure & Postgres DB, US)
- **Cloudflare Inc.** (R2 Object Storage & CDN, Global)
- **Stripe Inc.** (FBO Escrow & Payment Settlement, US - PCI DSS Level 1)

## 4. Data Subject Rights & Incident Notification
1. **Data Subject Requests**: Processor shall assist Controller in responding to data subject access, deletion, or modification requests.
2. **Incident Notification**: Processor shall notify Controller without undue delay (within 72 hours) upon becoming aware of a personal data breach.
