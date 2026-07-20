# Sanitization report

Emitted safe lookup columns: **1504**
Withheld columns (sensitive / not a lookup): **830**

Fact-table sample rows: **all withheld** (never written to the skill).
Free-text, email-like, phone-like, and >40-char values: withheld.
Any column whose name implies PII/lead/payment/credential data: withheld.

## Sample of withheld columns

- `darwin_poc.darwin_data_export_sl.ID (not-complete/too-many-distinct/unsafe-values)`
- `darwin_poc.darwin_data_export_sl.County (PII-name)`
- `techss_QA.auditType.name (PII-name)`
- `techss_QA.callCenterAuditLeads.ID (not-complete/too-many-distinct/unsafe-values)`
- `techss_QA.callCenterAuditLeads.OLeadID (PII-name)`
- `techss_QA.callCenterAuditLeads.firstName (PII-name)`
- `techss_QA.callCenterAuditLeads.lastName (PII-name)`
- `techss_QA.callCenterAuditLeads.email (PII-name)`
- `techss_QA.callCenterAuditLeads.phone (PII-name)`
- `techss_QA.callCenterAuditLeads.twilioPhoneId (PII-name)`
- `techss_QA.callCenterAuditLeads.address (PII-name)`
- `techss_QA.callCenterAuditLeads.city (PII-name)`
- `techss_QA.callCenterAuditLeads.postalCode (PII-name)`
- `techss_QA.callCenterAuditLeads.dob (PII-name)`
- `techss_QA.callCenterAuditLeads.ipAddress (PII-name)`
- `techss_QA.callCenterAuditLeads.creditScore (PII-name)`
- `techss_QA.callCenterAuditLeadsCallLog.ID (not-complete/too-many-distinct/unsafe-values)`
- `techss_QA.callCenterAuditLeadsCallLog.phone (PII-name)`
- `techss_QA.callCenterAuditLeadsCallLog.auditPhone (PII-name)`
- `techss_QA.callCenterAuditLeadsCallLog.oLeadId (PII-name)`
- `techss_QA.callCenterAuditLeadsCallLog.callId (not-complete/too-many-distinct/unsafe-values)`
- `techss_QA.callCenterAuditLeadsCallLog.content (not-complete/too-many-distinct/unsafe-values)`
- `techss_QA.callCenterAuditLeadsCallLog.log (not-complete/too-many-distinct/unsafe-values)`
- `techss_QA.callCenterAuditLeadsCallLog.insertionDate (not-complete/too-many-distinct/unsafe-values)`
- `techss_QA.clientAuditSettings.auditDays (not-complete/too-many-distinct/unsafe-values)`
- `techss_RV.RVInventoryEmails.toolName (PII-name)`
- `techss_RV.RVInventoryEmails.emailaddr (PII-name)`
- `techss_RV.RVInvtyVertical.rvInvty (PII-name)`
- `techss_all_leads.OLD_prismReserve.ID (not-complete/too-many-distinct/unsafe-values)`
- `techss_all_leads.OLD_prismReserve.OLeadID (PII-name)`
- `techss_all_leads.OLD_prismReserve.Zip (PII-name)`
- `techss_all_leads.OLD_prismReserve.insertionDate (not-complete/too-many-distinct/unsafe-values)`
- `techss_all_leads.appData.ID (not-complete/too-many-distinct/unsafe-values)`
- `techss_all_leads.appData.OLeadID (PII-name)`
- `techss_all_leads.appData.appTime (not-complete/too-many-distinct/unsafe-values)`
- `techss_all_leads.appData.data (not-complete/too-many-distinct/unsafe-values)`
- `techss_all_leads.appData.hashedData (PII-name)`
- `techss_all_leads.appData.insertionDate (not-complete/too-many-distinct/unsafe-values)`
- `techss_all_leads.callCenterDataPseudo.ID (not-complete/too-many-distinct/unsafe-values)`
- `techss_all_leads.callCenterDataPseudo.OLeadID (PII-name)`