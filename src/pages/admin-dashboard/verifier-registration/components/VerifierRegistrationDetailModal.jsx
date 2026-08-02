import React from "react";

function DetailItem({ label, value }) {
  return (
    <div className="vr-reg-detail-item">
      <span className="vr-reg-detail-label">{label}</span>
      <span className="vr-reg-detail-value">{value ?? "-"}</span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="vr-reg-detail-section">
      <h3>{title}</h3>
      <div className="vr-reg-detail-grid">{children}</div>
    </section>
  );
}

export function VerifierRegistrationDetailModal({ row, onClose }) {
  if (!row) return null;

  return (
    <div className="vr-reg-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="vr-reg-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vr-reg-modal-title"
      >
        <div className="vr-reg-modal-header">
          <div>
            <h2 id="vr-reg-modal-title">Registration Details</h2>
            <p>
              #{row.registrationId} · {row.fullName}
            </p>
          </div>
          <button type="button" className="vr-reg-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="vr-reg-modal-body">
          <DetailSection title="Personal & Contact">
            <DetailItem label="Full Name" value={row.fullName} />
            <DetailItem label="Username" value={row.userName} />
            <DetailItem label="Gender" value={row.genderLabel} />
            <DetailItem label="Teacher Code / CRC Code" value={row.teacherCode || "-"} />
            <DetailItem label="Email" value={row.email} />
            <DetailItem label="Date of Birth" value={row.dateOfBirthLabel} />
            <DetailItem label="Mobile" value={row.mobileNumber} />
            <DetailItem label="Registered At" value={row.createdAtLabel} />
          </DetailSection>

          <DetailSection title="Qualifications & Skills">
            <DetailItem
              label="Educational Qualification"
              value={row.educationalQualificationLabel}
            />
            <DetailItem
              label="Professional Qualifications"
              value={row.professionalQualificationsLabel}
            />
            <DetailItem
              label="Computer / IT Knowledge"
              value={row.computerKnowledgeLabel}
            />
            <DetailItem label="Language Skills" value={row.languageSkillsLabel} />
          </DetailSection>

          <DetailSection title="Work & Experience">
            <DetailItem label="Occupation" value={row.occupationLabel} />
            <DetailItem
              label="Organization Type"
              value={row.organizationTypeLabel}
            />
            <DetailItem
              label="Current School Level"
              value={row.currentSchoolLevelLabel}
            />
            <DetailItem
              label="Current Designation"
              value={row.currentDesignationLabel}
            />
            <DetailItem label="Experience" value={row.experienceLabel} />
            <DetailItem
              label="Prior Accreditation Work"
              value={row.previousAccreditationWorkLabel}
            />
            <DetailItem
              label="Prior Duration (Years)"
              value={row.previousAccreditationDuration || "-"}
            />
            <DetailItem
              label="Other Verification Experience"
              value={row.otherVerificationExperienceLabel}
            />
            <DetailItem
              label="Other Verification Details"
              value={row.otherVerificationDetails || "-"}
            />
          </DetailSection>

          <DetailSection title="Availability & Logistics">
            <DetailItem
              label="Preferred District 1"
              value={row.preferredDistrict1Name}
            />
            <DetailItem
              label="Preferred Block / Taluka 1"
              value={row.preferredTaluka1}
            />
            <DetailItem
              label="Preferred District 2"
              value={row.preferredDistrict2Name}
            />
            <DetailItem
              label="Preferred Block / Taluka 2"
              value={row.preferredTaluka2}
            />
            <DetailItem
              label="Preferred District 3"
              value={row.preferredDistrict3Name}
            />
            <DetailItem
              label="Preferred Block / Taluka 3"
              value={row.preferredTaluka3}
            />
            <DetailItem label="Has Vehicle" value={row.hasVehicleLabel} />
            <DetailItem label="Vehicle Type" value={row.vehicleTypeLabel} />
            <DetailItem
              label="Driving License"
              value={row.hasDrivingLicenseLabel}
            />
            <DetailItem
              label="Work Duration"
              value={row.workDurationLabel}
            />
          </DetailSection>

          <DetailSection title="Identity & Bank">
            <DetailItem label="Aadhaar Number" value={row.aadhaarNumber} />
            <DetailItem label="Aadhaar File" value={row.aadhaarFileName} />
            <DetailItem
              label="Account Holder Name"
              value={row.bankAccountName}
            />
            <DetailItem
              label="Account Number"
              value={row.bankAccountNumber}
            />
            <DetailItem label="IFSC" value={row.bankIfsc} />
            <DetailItem label="Branch" value={row.bankBranch} />
            <DetailItem label="Bank Name" value={row.bankName} />
            <DetailItem label="Bank Address" value={row.bankAddress} />
          </DetailSection>

          <DetailSection title="Declaration">
            <DetailItem label="NOC File" value={row.nocFileName || "-"} />
            <DetailItem
              label="Self Declaration"
              value={row.selfDeclarationLabel}
            />
            <DetailItem
              label="Self Declaration File"
              value={row.selfDeclarationFileName || "-"}
            />
            <DetailItem label="Status" value={row.status} />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
