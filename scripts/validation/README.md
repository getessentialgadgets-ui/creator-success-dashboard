Validation scripts for Retention Cohorts MVP

Usage:
  - Ensure env var WHOP_API_KEY (or other auth) is set so the SDK can authenticate.
  - Run with node, e.g.:
      COMPANY=your_company_id node scripts/validation/identity_coverage.js

Scripts:
  - identity_coverage.js  : measures % of transactions with customerEmail (identity coverage) and emits CSV.
  - member_vs_tx_retention.js : computes per-user retention flags and splits by source (member vs transaction fallback). Emits CSV and summary JSON.
  - refund_impact.js      : measures how many fallback-retained users had refunds within the window.
  - pagination_check.js   : runs paginated fetch and reports truncation / page-limit hits.

Outputs are written to ./validation-results/<timestamp>/ as CSV and JSON summaries.
