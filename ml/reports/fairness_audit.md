# Demographic Parity & Counterfactual Fairness Audit

**Overall Audit Status:** `PASS`

**Max Counterfactual Score Variance:** `0.000000`

## Sub-tests

- **name_gender_ethnicity**: delta = `0.000000` (Passed: `True`)
- **institution_prestige**: delta = `0.000000` (Passed: `True`)
- **graduation_year_age_proxy**: delta = `0.000000` (Passed: `True`)
- **geographic_location**: delta = `0.000000` (Passed: `True`)

## Limitations

> AUDIT LIMITATIONS DISCLOSURE: While counterfactual perturbations verify zero direct or proximal score variance on name, institution, location, or graduation year in our feature space, this audit cannot establish the absence of latent societal biases embedded in industry vocabulary or systemic disparities in historical job title progression.
