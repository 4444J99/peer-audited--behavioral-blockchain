# BIPA Classification for Wearable Data

## Executive Summary
This document analyzes the implications of the Illinois Biometric Information Privacy Act (BIPA) on Styx's use of wearable data (via Apple HealthKit and Google Health Connect) for goal verification. Based on current BIPA definitions and case law, standard wearable fitness data (steps, heart rate, sleep) does **not** classify as a biometric identifier under BIPA. However, any collection of facial geometry (e.g., via photo verification) or advanced physiological metrics that could be used to uniquely identify an individual requires strict compliance with BIPA's notice and consent requirements.

## 1. Regulatory Context: Illinois BIPA
The Illinois Biometric Information Privacy Act (740 ILCS 14/) regulates the collection, use, safeguarding, and storage of biometric information. It provides a private right of action, making it a high-risk compliance area for technology platforms operating in or collecting data from Illinois residents.

### Defined Terms under BIPA
*   **Biometric Identifier:** Strictly defined as a "retina or iris scan, fingerprint, voiceprint, or scan of hand or face geometry."
*   **Biometric Information:** Any information, regardless of how it is captured, converted, stored, or shared, based on an individual's biometric identifier used to identify an individual.

### Statutory Exclusions
BIPA explicitly excludes:
*   Writing samples, written signatures, photographs.
*   Physical descriptions (e.g., height, weight, hair color, eye color).
*   Information captured from a patient in a health care setting or protected under HIPAA.

## 2. Styx Wearable Data Analysis
Styx integrates with Apple HealthKit and Google Health Connect to verify goal completions (e.g., steps, workouts, sleep). 

### Health and Fitness Metrics (Steps, Heart Rate, Sleep)
**Classification: Not Biometric Data.**
Standard fitness metrics collected by wearables—such as step counts, generic heart rate data (BPM), and sleep duration—do not fall under BIPA's exhaustive list of biometric identifiers. They are not scans of facial geometry, fingerprints, voiceprints, or retinal scans.

### Physical Characteristics (Weight, Height)
**Classification: Explicitly Excluded.**
Styx may collect weight and height data for health goal verification. BIPA Section 10 expressly excludes "physical descriptions such as height, weight, hair color, or eye color" from the definition of biometric identifiers.

### Photo Proof and Facial Recognition Risk
**Classification: Potential Risk Area.**
While BIPA excludes ordinary "photographs," if Styx employs facial recognition, liveness detection, or any automated scan of facial geometry to verify the user in the photo proof pipeline, this **would** constitute collection of a biometric identifier.
*Current Styx Policy:* Photo proof relies on manual review, peer attestation, and EXIF/GPS metadata, not automated facial geometry scanning.

### Emerging Wearable Tech (Gait Analysis, EKG)
**Classification: Gray Area / Unlikely BIPA Application.**
Some modern wearables can capture unique gait patterns or single-lead EKGs. While currently not recognized as biometric identifiers under BIPA's strict statutory language (which specifies hand/face geometry, fingerprints, etc.), plaintiffs' attorneys frequently attempt to expand BIPA's scope. Styx should avoid using any wearable data for the explicit purpose of *uniquely authenticating or identifying* the user based on physiological patterns.

## 3. Washington My Health My Data Act (MHMDA) Distinction
While BIPA focuses narrowly on biometrics, the Washington My Health My Data Act (MHMDA) broadly regulates consumer health data, including data from wearables. As noted in the 50-State Skill Contest Survey (`docs/legal/50_state_skill_contest_survey.md`), MHMDA poses a separate and immediate compliance burden for wearable data in Washington State. BIPA and MHMDA require distinct compliance strategies.

## 4. Compliance Recommendations for Styx
Although Styx's current wearable data collection does not trigger BIPA, best practices dictate the following guardrails to mitigate future risk and address overlapping privacy laws (e.g., CCPA, MHMDA):

1.  **Strictly Limit Data Use:** Use wearable data (HealthKit, Google Health Connect) exclusively for goal verification and internal analytics. Do not use wearable data for identity verification, user authentication, or advertising.
2.  **No Facial Recognition:** Do not implement automated facial recognition or facial geometry scanning on user uploaded "proof" photos without first implementing a full BIPA-compliant consent flow.
3.  **Explicit Consent:** Maintain the planned distinct consent flow for HealthKit/Google Fit access (as outlined in the App Store UGC Moderation Packet). While not strictly required by BIPA for step counts, it fulfills Apple/Google guidelines and mitigates broader privacy risks.
4.  **Data Retention Policy:** Implement and publish a written data retention schedule and destruction guidelines for all user data, aligning with BIPA's requirement to destroy data when the initial purpose has been satisfied or within 3 years of the user's last interaction.

## Conclusion
Styx's collection of wearable data (steps, heart rate, sleep, weight) via HealthKit and Google Health Connect does not trigger the Illinois Biometric Information Privacy Act (BIPA). The data types fall outside the statutory definition of "biometric identifier." However, Styx must ensure that its photo proof verification pipeline does not inadvertently scan facial geometry, and it must comply with other applicable state laws like Washington's MHMDA that specifically target consumer health and wearable data.
