import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  HowToReg as HowToRegIcon,
} from "@mui/icons-material";
import { ROOT_URL } from "../../routes/routeUrls";
import { colors } from "../../constants/colors";
import VerifierFormSection from "./components/VerifierFormSection";
import BilingualFieldLabel from "./components/BilingualFieldLabel";
import { useVerifierRegistrationForm } from "./hooks/useVerifierRegistrationForm";
import {
  EDUCATIONAL_QUALIFICATIONS,
  LANGUAGE_SKILLS,
  OCCUPATION_OPTIONS,
  ORGANIZATION_TYPES,
  PROFESSIONAL_QUALIFICATIONS,
  VEHICLE_TYPES,
  WORK_DURATION_OPTIONS,
  YES_NO_OPTIONS,
} from "./constants/verifierRegistrationOptions";
import { DOB_BOUNDS } from "./utils/verifierRegistrationValidation";
import "./VerifierRegistration.css";

function YesNoGroup({ labelEn, labelGu, name, value, onChange, error, required }) {
  return (
    <FormControl error={!!error} required={required} className="vr-reg-yesno">
      <BilingualFieldLabel labelEn={labelEn} labelGu={labelGu} required={required} />
      <RadioGroup row name={name} value={value} onChange={onChange}>
        {YES_NO_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio size="small" />}
            label={`${option.labelEn} / ${option.labelGu}`}
          />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function RankedLocationFields({
  rank,
  districtValue,
  talukaValue,
  districts,
  talukaOptions,
  onDistrictChange,
  onTalukaChange,
  districtError,
  talukaError,
  required = false,
}) {
  return (
    <Box className="vr-reg-ranked-row">
      <Chip
        size="small"
        label={`Priority ${rank}`}
        className="vr-reg-ranked-row__chip"
        color={required ? "primary" : "default"}
      />
      <FormControl fullWidth size="small" error={!!districtError} required={required}>
        <InputLabel>{`District ${rank}`}</InputLabel>
        <Select
          value={districtValue}
          label={`District ${rank}`}
          onChange={onDistrictChange}
        >
          <MenuItem value="">
            <em>Select district</em>
          </MenuItem>
          {districts.map((district) => {
            const id = String(district.districtId ?? district.id ?? "");
            const name = district.districtName || district.name || id;
            return (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            );
          })}
        </Select>
        {districtError && <FormHelperText>{districtError}</FormHelperText>}
      </FormControl>

      <FormControl
        fullWidth
        size="small"
        error={!!talukaError}
        required={required}
        disabled={!districtValue}
      >
        <InputLabel>{`Block / Taluka ${rank}`}</InputLabel>
        <Select
          value={talukaValue}
          label={`Block / Taluka ${rank}`}
          onChange={onTalukaChange}
        >
          <MenuItem value="">
            <em>
              {!districtValue
                ? "Select district first"
                : talukaOptions.length === 0
                  ? "No blocks found"
                  : "Select block / taluka"}
            </em>
          </MenuItem>
          {talukaOptions.map((block) => {
            const id = String(block.blockId ?? block.id ?? "");
            const name = block.blockName || block.name || id;
            return (
              <MenuItem key={id} value={name}>
                {name}
              </MenuItem>
            );
          })}
        </Select>
        {talukaError && <FormHelperText>{talukaError}</FormHelperText>}
      </FormControl>
    </Box>
  );
}

function FileUploadField({ labelEn, labelGu, file, onChange, error, required, optional }) {
  return (
    <FormControl error={!!error} required={required} className="vr-reg-file">
      <BilingualFieldLabel
        labelEn={labelEn}
        labelGu={labelGu}
        required={required}
        optional={optional}
      />
      <Button
        component="label"
        variant="outlined"
        startIcon={<CloudUploadIcon />}
        className="vr-reg-file__button"
      >
        {file ? "Change file" : "Upload document"}
        <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} />
      </Button>
      {file && (
        <Typography variant="caption" className="vr-reg-file__name">
          Selected: {file.name}
        </Typography>
      )}
      <FormHelperText>
        {error || "Accepted formats: PDF, JPG, PNG"}
      </FormHelperText>
    </FormControl>
  );
}

export default function VerifierRegistration() {
  const navigate = useNavigate();
  const {
    form,
    errors,
    age,
    submitting,
    districts,
    talukaOptions,
    updateField,
    updateFile,
    toggleMultiValue,
    handleSubmit,
  } = useVerifierRegistrationForm();

  const isEmployed = form.occupation === "employed";
  const hasVehicle = form.hasVehicle === "yes";

  return (
    <div className="vr-reg-page">
      <header className="vr-reg-header">
        <IconButton
          aria-label="Back to dashboard"
          onClick={() => navigate(ROOT_URL)}
          sx={{ color: colors.primary.blue }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={800} color={colors.primary.blue}>
          Verifier Registration
        </Typography>
        <Box sx={{ width: 40 }} />
      </header>

      <Container maxWidth="md" className="vr-reg-container">
        <Paper elevation={0} className="vr-reg-card">
          <Box className="vr-reg-card__hero">
            <Box className="vr-reg-card__icon">
              <HowToRegIcon />
            </Box>
            <Typography variant="h5" fontWeight={800} className="vr-reg-card__title">
              Register as Verifier
            </Typography>
            <Typography variant="body2" className="vr-reg-card__sub">
              વેરિફાયર તરીકે નોંધણી કરો — dependent fields appear based on your answers.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            className="vr-reg-form"
            noValidate
          >
            {/* Section A */}
            <VerifierFormSection
              titleEn="Personal & Contact Details"
              titleGu="વ્યક્તિગત અને સંપર્ક વિગતો"
            >
              <TextField
                label="Full Name / પૂરું નામ"
                value={form.fullName}
                onChange={updateField("fullName")}
                fullWidth
                required
                size="small"
                error={!!errors.fullName}
                helperText={errors.fullName}
              />
              <TextField
                label="Email ID / ઈ-મેઈલ આઈડી"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                fullWidth
                required
                size="small"
                error={!!errors.email}
                helperText={
                  errors.email || "For official correspondence and sending orders"
                }
              />
              <Box className="vr-reg-grid vr-reg-grid--2">
                <TextField
                  label="Date of Birth / જન્મ તારીખ"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={updateField("dateOfBirth")}
                  onKeyDown={(event) => event.preventDefault()}
                  onPaste={(event) => event.preventDefault()}
                  fullWidth
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: DOB_BOUNDS.min,
                    max: DOB_BOUNDS.max,
                  }}
                  sx={{
                    "& input::-webkit-calendar-picker-indicator": {
                      cursor: "pointer",
                      opacity: 1,
                    },
                  }}
                  error={!!errors.dateOfBirth}
                  helperText={
                    errors.dateOfBirth || "Use the calendar — typing is disabled"
                  }
                />
                <TextField
                  label="Age / ઉંમર"
                  value={age}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  helperText="Auto-calculated from date of birth"
                />
              </Box>
              <TextField
                label="Mobile / WhatsApp Number / મોબાઈલ-વોટ્સએપ નંબર"
                value={form.mobileNumber}
                onChange={updateField("mobileNumber")}
                fullWidth
                required
                size="small"
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                error={!!errors.mobileNumber}
                helperText={
                  errors.mobileNumber || "For emergency contact / group messaging"
                }
              />
            </VerifierFormSection>

            {/* Section B */}
            <VerifierFormSection
              titleEn="Qualifications & Tech Skills"
              titleGu="શૈક્ષણિક લાયકાત અને તકનિકી કૌશલ્ય"
            >
              <FormControl
                fullWidth
                size="small"
                required
                error={!!errors.educationalQualification}
              >
                <InputLabel>Educational Qualification / શૈક્ષણિક લાયકાત</InputLabel>
                <Select
                  value={form.educationalQualification}
                  label="Educational Qualification / શૈક્ષણિક લાયકાત"
                  onChange={updateField("educationalQualification")}
                >
                  {EDUCATIONAL_QUALIFICATIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.labelEn} / {item.labelGu}
                    </MenuItem>
                  ))}
                </Select>
                {errors.educationalQualification && (
                  <FormHelperText>{errors.educationalQualification}</FormHelperText>
                )}
              </FormControl>

              <FormControl error={!!errors.professionalQualifications}>
                <FormLabel className="vr-reg-checkbox-group__label">
                  Professional Qualification / વ્યાવસાયિક લાયકાત{" "}
                  <span className="vr-reg-optional">(Optional)</span>
                </FormLabel>
                <Box className="vr-reg-checkbox-group">
                  {PROFESSIONAL_QUALIFICATIONS.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      control={
                        <Checkbox
                          size="small"
                          checked={form.professionalQualifications.includes(item.value)}
                          onChange={() =>
                            toggleMultiValue("professionalQualifications")(item.value)
                          }
                        />
                      }
                      label={`${item.labelEn} / ${item.labelGu}`}
                    />
                  ))}
                </Box>
                {errors.professionalQualifications && (
                  <FormHelperText>{errors.professionalQualifications}</FormHelperText>
                )}
              </FormControl>

              <YesNoGroup
                labelEn="Computer / IT Knowledge (computer, mobile, tablet)"
                labelGu="કમ્પ્યુટર/આઈટી જ્ઞાન"
                name="computerKnowledge"
                value={form.computerKnowledge}
                onChange={updateField("computerKnowledge")}
                error={errors.computerKnowledge}
                required
              />

              <FormControl error={!!errors.languageSkills} required>
                <FormLabel className="vr-reg-checkbox-group__label">
                  Language Knowledge / ભાષાનું જ્ઞાન *
                </FormLabel>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Reading / writing ability in Gujarati &amp; English
                </Typography>
                <Box className="vr-reg-checkbox-group">
                  {LANGUAGE_SKILLS.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      control={
                        <Checkbox
                          size="small"
                          checked={form.languageSkills.includes(item.value)}
                          onChange={() => toggleMultiValue("languageSkills")(item.value)}
                        />
                      }
                      label={`${item.labelEn} / ${item.labelGu}`}
                    />
                  ))}
                </Box>
                {errors.languageSkills && (
                  <FormHelperText>{errors.languageSkills}</FormHelperText>
                )}
              </FormControl>
            </VerifierFormSection>

            {/* Section C */}
            <VerifierFormSection
              titleEn="Work & Experience Details"
              titleGu="નોકરી અને અનુભવ સંબંધિત વિગતો"
            >
              <FormControl error={!!errors.occupation} required>
                <FormLabel className="vr-reg-radio-group__label">
                  Occupation / વ્યવસાય *
                </FormLabel>
                <RadioGroup
                  row
                  value={form.occupation}
                  onChange={updateField("occupation")}
                >
                  {OCCUPATION_OPTIONS.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio size="small" />}
                      label={`${item.labelEn} / ${item.labelGu}`}
                    />
                  ))}
                </RadioGroup>
                {errors.occupation && <FormHelperText>{errors.occupation}</FormHelperText>}
              </FormControl>

              {isEmployed && (
                <FormControl
                  fullWidth
                  size="small"
                  required
                  error={!!errors.organizationType}
                >
                  <InputLabel>
                    Type of Job Institution / નોકરીની સંસ્થાનો પ્રકાર
                  </InputLabel>
                  <Select
                    value={form.organizationType}
                    label="Type of Job Institution / નોકરીની સંસ્થાનો પ્રકાર"
                    onChange={updateField("organizationType")}
                  >
                    {ORGANIZATION_TYPES.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.labelEn} / {item.labelGu}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.organizationType && (
                    <FormHelperText>{errors.organizationType}</FormHelperText>
                  )}
                </FormControl>
              )}

              <TextField
                label="Educational / Administrative Experience (years) / અનુભવ (વર્ષ)"
                value={form.experienceYears}
                onChange={updateField("experienceYears")}
                fullWidth
                required
                size="small"
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: 2,
                }}
                error={!!errors.experienceYears}
                helperText={errors.experienceYears || "Digits only (0–60)"}
              />

              <YesNoGroup
                labelEn="Prior work in School Accreditation / Verification?"
                labelGu="સ્કૂલ એક્રેડિટેશન/વેરિફિકેશનમાં અગાઉ કામગીરી છે?"
                name="previousAccreditationWork"
                value={form.previousAccreditationWork}
                onChange={updateField("previousAccreditationWork")}
                error={errors.previousAccreditationWork}
                required
              />

              {form.previousAccreditationWork === "yes" && (
                <TextField
                  label="If Yes, for how long? (years) / જો હા તો કેટલા સમય માટે?"
                  value={form.previousAccreditationDuration}
                  onChange={updateField("previousAccreditationDuration")}
                  fullWidth
                  required
                  size="small"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: 2,
                  }}
                  error={!!errors.previousAccreditationDuration}
                  helperText={
                    errors.previousAccreditationDuration || "Digits only (1–60 years)"
                  }
                />
              )}

              <YesNoGroup
                labelEn="Experience of verification work other than school accreditation?"
                labelGu="સ્કૂલ એક્રેડિટેશન સિવાયની વેરિફિકેશનની કામગીરીનો અનુભવ"
                name="otherVerificationExperience"
                value={form.otherVerificationExperience}
                onChange={updateField("otherVerificationExperience")}
                error={errors.otherVerificationExperience}
                required
              />

              {form.otherVerificationExperience === "yes" && (
                <TextField
                  label="If Yes, details / વિગતો"
                  value={form.otherVerificationDetails}
                  onChange={updateField("otherVerificationDetails")}
                  fullWidth
                  required
                  multiline
                  minRows={2}
                  size="small"
                  error={!!errors.otherVerificationDetails}
                  helperText={errors.otherVerificationDetails}
                />
              )}
            </VerifierFormSection>

            {/* Section D */}
            <VerifierFormSection
              titleEn="Availability & Logistics"
              titleGu="ઉપલબ્ધતા અને લોજિસ્ટિક્સ"
            >
              <Typography variant="body2" className="vr-reg-section-note">
                Preferred district &amp; taluka (Priority 1, 2, 3) — all required. Taluka
                options filter by selected district.
              </Typography>

              {[1, 2, 3].map((rank) => (
                <RankedLocationFields
                  key={rank}
                  rank={rank}
                  districtValue={form[`preferredDistrict${rank}`]}
                  talukaValue={form[`preferredTaluka${rank}`]}
                  districts={districts}
                  talukaOptions={talukaOptions[rank]}
                  onDistrictChange={updateField(`preferredDistrict${rank}`)}
                  onTalukaChange={updateField(`preferredTaluka${rank}`)}
                  districtError={errors[`preferredDistrict${rank}`]}
                  talukaError={errors[`preferredTaluka${rank}`]}
                  required
                />
              ))}

              <YesNoGroup
                labelEn="Vehicle Facility (own two-wheeler / four-wheeler)?"
                labelGu="વાહનની સુવિધા (ટૂ-વ્હીલર/ફોર-વ્હીલર) છે કે નહીં?"
                name="hasVehicle"
                value={form.hasVehicle}
                onChange={updateField("hasVehicle")}
                error={errors.hasVehicle}
                required
              />

              {hasVehicle && (
                <>
                  <FormControl error={!!errors.vehicleType} required>
                    <FormLabel className="vr-reg-radio-group__label">
                      Vehicle Type / વાહનનો પ્રકાર *
                    </FormLabel>
                    <RadioGroup
                      row
                      value={form.vehicleType}
                      onChange={updateField("vehicleType")}
                    >
                      {VEHICLE_TYPES.map((item) => (
                        <FormControlLabel
                          key={item.value}
                          value={item.value}
                          control={<Radio size="small" />}
                          label={`${item.labelEn} / ${item.labelGu}`}
                        />
                      ))}
                    </RadioGroup>
                    {errors.vehicleType && (
                      <FormHelperText>{errors.vehicleType}</FormHelperText>
                    )}
                  </FormControl>

                  <YesNoGroup
                    labelEn="Do you have a license for that vehicle?"
                    labelGu="વાહનનું લાયસન્સ છે કે નહીં?"
                    name="hasDrivingLicense"
                    value={form.hasDrivingLicense}
                    onChange={updateField("hasDrivingLicense")}
                    error={errors.hasDrivingLicense}
                    required
                  />
                </>
              )}

              <FormControl error={!!errors.workDuration} required>
                <FormLabel className="vr-reg-radio-group__label">
                  Duration of Work Availability / કામગીરીનો સમયગાળો *
                </FormLabel>
                <RadioGroup
                  value={form.workDuration}
                  onChange={updateField("workDuration")}
                >
                  {WORK_DURATION_OPTIONS.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio size="small" />}
                      label={`${item.labelEn} / ${item.labelGu}`}
                    />
                  ))}
                </RadioGroup>
                {errors.workDuration && (
                  <FormHelperText>{errors.workDuration}</FormHelperText>
                )}
              </FormControl>
            </VerifierFormSection>

            {/* Section E */}
            <VerifierFormSection
              titleEn="Identity & Bank Details for Remuneration"
              titleGu="ઓળખ અને બેંક વિગતો"
            >
              <TextField
                label="Aadhaar Number / આધાર કાર્ડ"
                value={form.aadhaarNumber}
                onChange={updateField("aadhaarNumber")}
                fullWidth
                required
                size="small"
                inputProps={{ maxLength: 12, inputMode: "numeric" }}
                error={!!errors.aadhaarNumber}
                helperText={
                  errors.aadhaarNumber || "12-digit Aadhaar for identity verification"
                }
              />

              <TextField
                label="Confirm Aadhaar Number / આધાર કાર્ડ ફરીથી દાખલ કરો"
                value={form.confirmAadhaarNumber}
                onChange={updateField("confirmAadhaarNumber")}
                fullWidth
                required
                size="small"
                inputProps={{ maxLength: 12, inputMode: "numeric" }}
                error={!!errors.confirmAadhaarNumber}
                helperText={errors.confirmAadhaarNumber}
              />

              <FileUploadField
                labelEn="Aadhaar Card Upload"
                labelGu="આધાર કાર્ડ અપલોડ"
                file={form.aadhaarFile}
                onChange={updateFile("aadhaarFile")}
                error={errors.aadhaarFile}
                required
              />

              <TextField
                label="Account Holder Name / ખાતાધારકનું નામ"
                value={form.bankAccountName}
                onChange={updateField("bankAccountName")}
                fullWidth
                required
                size="small"
                error={!!errors.bankAccountName}
                helperText={errors.bankAccountName || "As per bank passbook"}
              />

              <Box className="vr-reg-grid vr-reg-grid--2">
                <TextField
                  label="Account Number / ખાતા નંબર"
                  value={form.bankAccountNumber}
                  onChange={updateField("bankAccountNumber")}
                  fullWidth
                  required
                  size="small"
                  inputProps={{ maxLength: 18, inputMode: "numeric" }}
                  error={!!errors.bankAccountNumber}
                  helperText={errors.bankAccountNumber}
                />
                <TextField
                  label="IFSC Code / IFSC કોડ"
                  value={form.bankIfsc}
                  onChange={updateField("bankIfsc")}
                  fullWidth
                  required
                  size="small"
                  inputProps={{
                    maxLength: 11,
                    style: { textTransform: "uppercase", letterSpacing: "0.06em" },
                  }}
                  error={!!errors.bankIfsc}
                  helperText={
                    errors.bankIfsc ||
                    "Format: ABCD0123456 (4 letters + 0 + 6 alphanumeric)"
                  }
                />
              </Box>

              <Box className="vr-reg-grid vr-reg-grid--2">
                <TextField
                  label="Branch Name / શાખાનું નામ"
                  value={form.bankBranch}
                  onChange={updateField("bankBranch")}
                  fullWidth
                  required
                  size="small"
                  error={!!errors.bankBranch}
                  helperText={errors.bankBranch}
                />
                <TextField
                  label="Bank Name / બેંકનું નામ"
                  value={form.bankName}
                  onChange={updateField("bankName")}
                  fullWidth
                  required
                  size="small"
                  error={!!errors.bankName}
                  helperText={errors.bankName}
                />
              </Box>

              <TextField
                label="Bank Address / બેંક સરનામું"
                value={form.bankAddress}
                onChange={updateField("bankAddress")}
                fullWidth
                required
                multiline
                minRows={2}
                size="small"
                error={!!errors.bankAddress}
                helperText={errors.bankAddress}
              />
            </VerifierFormSection>

            {/* Section F */}
            <VerifierFormSection
              titleEn="Approval & Self-Declaration"
              titleGu="મંજૂરી અને બાંહેધરી"
            >
              {isEmployed && (
                <FileUploadField
                  labelEn="Institution's No Objection Certificate (NOC)"
                  labelGu="સંસ્થાનું ના-વાંધા પ્રમાણપત્ર (NOC)"
                  file={form.nocFile}
                  onChange={updateFile("nocFile")}
                  error={errors.nocFile}
                  required
                />
              )}

              {!isEmployed && form.occupation === "retired" && (
                <Typography variant="body2" color="text.secondary">
                  NOC is not required for retired applicants.
                </Typography>
              )}

              <FileUploadField
                labelEn="Self-Declaration Document (optional upload)"
                labelGu="બાંહેધરી પત્રક અપલોડ"
                file={form.selfDeclarationFile}
                onChange={updateFile("selfDeclarationFile")}
                optional
              />

              <FormControl error={!!errors.selfDeclaration} required>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.selfDeclaration}
                      onChange={updateField("selfDeclaration")}
                    />
                  }
                  label={
                    <Typography variant="body2" className="vr-reg-declaration">
                      I declare that no departmental inquiry, disciplinary action, or court
                      case is pending against me.
                      <br />
                      હું બાંહેધરી આપું છું કે મારા વિરુદ્ધ કોઈ વિભાગીય તપાસ, શિસ્ત વિષયક
                      તપાસ કે કોર્ટ કેસ પેન્ડિંગ નથી. *
                    </Typography>
                  }
                />
                {errors.selfDeclaration && (
                  <FormHelperText>{errors.selfDeclaration}</FormHelperText>
                )}
              </FormControl>
            </VerifierFormSection>

            <Box className="vr-reg-actions">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate(ROOT_URL)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  bgcolor: colors.saffron.dark,
                  "&:hover": { bgcolor: colors.saffron.main },
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                {submitting ? "Registering..." : "Submit Registration"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </div>
  );
}
