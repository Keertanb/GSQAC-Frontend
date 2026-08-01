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
  VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";
import { ROOT_URL } from "../../routes/routeUrls";
import LogoImg from "../../assets/logo_image.png";
import GsqacLogoImg from "../../assets/gsqac_logo.png";
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
  GENDER_OPTIONS,
  CURRENT_SCHOOL_LEVEL_OPTIONS,
  PRIMARY_DESIGNATION_OPTIONS,
  SECONDARY_DESIGNATION_OPTIONS,
  formatBilingualOption,
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
            label={formatBilingualOption(option)}
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
  allowNone = false,
}) {
  const isNone = districtValue === "none";
  const talukaRequired = required && !isNone && !!districtValue;

  return (
    <Box className="vr-reg-ranked-row">
      <Chip
        size="small"
        label={`Priority ${rank}`}
        className="vr-reg-ranked-row__chip"
        color={required ? "primary" : "default"}
      />
      <FormControl fullWidth size="small" error={!!districtError} required={required}>
        <InputLabel>{`જિલ્લો ${rank} / District ${rank}`}</InputLabel>
        <Select
          value={districtValue}
          label={`જિલ્લો ${rank} / District ${rank}`}
          onChange={onDistrictChange}
        >
          <MenuItem value="">
            <em>જિલ્લો પસંદ કરો / Select district</em>
          </MenuItem>
          {allowNone && (
            <MenuItem value="none">
              <em>કોઈ નહીં / None</em>
            </MenuItem>
          )}
          {districts.map((district) => {
            const id = String(
              district.value ?? district.districtId ?? district.id ?? "",
            );
            const name =
              district.name || district.districtName || district.label || id;
            if (!id) return null;
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
        required={talukaRequired}
        disabled={!districtValue || isNone}
      >
        <InputLabel>{`બ્લોક / તાલુકો ${rank} / Block / Taluka ${rank}`}</InputLabel>
        <Select
          value={isNone ? "" : talukaValue}
          label={`બ્લોક / તાલુકો ${rank} / Block / Taluka ${rank}`}
          onChange={onTalukaChange}
        >
          <MenuItem value="">
            <em>
              {!districtValue
                ? "પહેલા જિલ્લો પસંદ કરો / Select district first"
                : isNone
                  ? "લાગુ નથી / Not applicable"
                  : talukaOptions.length === 0
                    ? "બ્લોક મળ્યા નથી / No blocks found"
                    : "બ્લોક / તાલુકો પસંદ કરો / Select block / taluka"}
            </em>
          </MenuItem>
          {!isNone &&
            talukaOptions.map((block) => {
              const id = String(block.value ?? block.blockId ?? block.id ?? "");
              const name = block.name || block.blockName || block.label || id;
              if (!name) return null;
              return (
                <MenuItem key={id || name} value={name}>
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

function FileUploadField({
  labelEn,
  labelGu,
  file,
  onChange,
  error,
  required,
  optional,
  disabled = false,
}) {
  return (
    <FormControl
      error={!!error}
      required={required}
      className="vr-reg-file"
      disabled={disabled}
    >
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
        disabled={disabled}
      >
        {file ? "ફાઈલ બદલો / Change file" : "દસ્તાવેજ અપલોડ / Upload document"}
        <input
          type="file"
          hidden
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={onChange}
          disabled={disabled}
        />
      </Button>
      {file && !disabled && (
        <Typography variant="caption" className="vr-reg-file__name">
          Selected: {file.name}
        </Typography>
      )}
      <FormHelperText>
        {error ||
          (disabled
            ? "અપલોડ માટે નીચેની સંમતિ ચેકબોક્સ પસંદ કરો / Select the consent checkbox to enable upload"
            : "Accepted formats: PDF, JPG, PNG")}
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
      <div className="vr-reg-page__accent" aria-hidden />

      <header className="vr-reg-header">
        <div className="vr-reg-header__inner">
          <button
            type="button"
            className="vr-reg-header__back"
            aria-label="Back to dashboard"
            onClick={() => navigate(ROOT_URL)}
          >
            <ArrowBackIcon fontSize="small" />
            <span>પાછા / Back</span>
          </button>

          <div className="vr-reg-header__brand">
            <img src={LogoImg} alt="GCERT" className="vr-reg-header__logo" />
            <div className="vr-reg-header__brand-text">
              <p className="vr-reg-header__org-gu">
                ગુજરાત સ્કૂલ ક્વોલિટી એશ્યોરન્સ કાઉન્સિલ
              </p>
              <p className="vr-reg-header__org-en">
                Gujarat School Quality Assurance Council
              </p>
            </div>
            <img
              src={GsqacLogoImg}
              alt="GSQAC"
              className="vr-reg-header__logo vr-reg-header__logo--gsqac"
            />
          </div>
        </div>
      </header>

      <main className="vr-reg-main">
        <Container maxWidth="md" className="vr-reg-container">
          <Paper elevation={0} className="vr-reg-card">
            <Box className="vr-reg-card__letterhead">
              <div className="vr-reg-card__letterhead-top">
                <img
                  src={LogoImg}
                  alt=""
                  className="vr-reg-card__seal"
                  aria-hidden
                />
                <div className="vr-reg-card__letterhead-copy">
                  <Typography component="h1" className="vr-reg-card__title">
                    વેરિફાયર તરીકે નોંધણી
                  </Typography>
                  <Typography className="vr-reg-card__title-en">
                    Verifier Registration
                  </Typography>
                </div>
                <div className="vr-reg-card__badge" aria-hidden>
                  <VerifiedUserIcon />
                  <span>GSQAC</span>
                </div>
              </div>
              <p className="vr-reg-card__sub">
                નીચેની વિગતો સંપૂર્ણ અને સચોટ ભરો. તારાંકિત (*) ક્ષેત્રો અનિવાર્ય છે.
                <span>
                  Complete all sections carefully. Fields marked (*) are
                  mandatory.
                </span>
              </p>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              className="vr-reg-form"
              noValidate
            >
            {/* Section A */}
            <VerifierFormSection
              step={1}
              titleEn="Personal & Contact Details"
              titleGu="વ્યક્તિગત માહિતી અને સંપર્ક વિગતો"
            >
              <TextField
                label="પૂરું નામ / Full Name"
                value={form.fullName}
                onChange={updateField("fullName")}
                fullWidth
                required
                size="small"
                error={!!errors.fullName}
                helperText={errors.fullName}
              />

              <FormControl
                error={!!errors.gender}
                required
                className="vr-reg-choice-group"
              >
                <BilingualFieldLabel
                  labelGu="લિંગ"
                  labelEn="Gender"
                  required
                />
                <RadioGroup
                  row
                  name="gender"
                  value={form.gender}
                  onChange={updateField("gender")}
                  className="vr-reg-choice-group__options"
                >
                  {GENDER_OPTIONS.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      className={`vr-reg-choice-option${
                        form.gender === item.value
                          ? " vr-reg-choice-option--selected"
                          : ""
                      }`}
                      control={<Radio size="small" />}
                      label={
                        <span className="vr-reg-choice-option__label">
                          <span className="vr-reg-choice-option__gu">
                            {item.labelGu}
                          </span>
                          <span className="vr-reg-choice-option__en">
                            {item.labelEn}
                          </span>
                        </span>
                      }
                    />
                  ))}
                </RadioGroup>
                {errors.gender && (
                  <FormHelperText>{errors.gender}</FormHelperText>
                )}
              </FormControl>

              <TextField
                label="શિક્ષક કોડ / Teacher Code"
                value={form.teacherCode}
                onChange={updateField("teacherCode")}
                fullWidth
                required
                size="small"
                inputProps={{ inputMode: "numeric", maxLength: 20 }}
                error={!!errors.teacherCode}
                helperText={errors.teacherCode}
              />

              <TextField
                label="ઈ-મેઈલ આઈડી / Email ID"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                fullWidth
                required
                size="small"
                error={!!errors.email}
                helperText={errors.email}
              />
              <Box className="vr-reg-grid vr-reg-grid--2">
                <TextField
                  label="જન્મ તારીખ / Date of Birth"
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
                  helperText={errors.dateOfBirth}
                />
                <TextField
                  label="ઉંમર / Age"
                  value={age}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                />
              </Box>
              <TextField
                label="મોબાઈલ-વોટ્સએપ નંબર / Mobile / WhatsApp Number"
                value={form.mobileNumber}
                onChange={updateField("mobileNumber")}
                fullWidth
                required
                size="small"
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber}
              />
            </VerifierFormSection>

            {/* Section B */}
            <VerifierFormSection
              step={2}
              titleEn="Qualifications & Tech Skills"
              titleGu="શૈક્ષણિક લાયકાત અને તકનિકી કૌશલ્ય"
            >
              <FormControl
                fullWidth
                size="small"
                required
                error={!!errors.educationalQualification}
              >
                <InputLabel>શૈક્ષણિક લાયકાત / Educational Qualification</InputLabel>
                <Select
                  value={form.educationalQualification}
                  label="શૈક્ષણિક લાયકાત / Educational Qualification"
                  onChange={updateField("educationalQualification")}
                >
                  {EDUCATIONAL_QUALIFICATIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {formatBilingualOption(item)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.educationalQualification && (
                  <FormHelperText>{errors.educationalQualification}</FormHelperText>
                )}
              </FormControl>

              <FormControl error={!!errors.professionalQualifications}>
                <FormLabel className="vr-reg-checkbox-group__label">
                  વ્યાવસાયિક લાયકાત / Professional Qualification{" "}
                  <span className="vr-reg-optional">(વૈકલ્પિક / Optional)</span>
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
                      label={formatBilingualOption(item)}
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
                  ભાષાનું જ્ઞાન / Language Knowledge *
                </FormLabel>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  ગુજરાતી અને અંગ્રેજીમાં વાંચન / લેખન ક્ષમતા — Reading / writing ability in Gujarati &amp; English
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
                      label={formatBilingualOption(item)}
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
              step={3}
              titleEn="Work & Experience Details"
              titleGu="નોકરી અને અનુભવ સંબંધિત વિગતો"
            >
              <FormControl error={!!errors.occupation} required>
                <FormLabel className="vr-reg-radio-group__label">
                  વ્યવસાય / Occupation *
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
                      label={formatBilingualOption(item)}
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
                    નોકરીની સંસ્થાનો પ્રકાર / Type of Job Institution
                  </InputLabel>
                  <Select
                    value={form.organizationType}
                    label="નોકરીની સંસ્થાનો પ્રકાર / Type of Job Institution"
                    onChange={updateField("organizationType")}
                  >
                    {ORGANIZATION_TYPES.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {formatBilingualOption(item)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.organizationType && (
                    <FormHelperText>{errors.organizationType}</FormHelperText>
                  )}
                </FormControl>
              )}

              {isEmployed && (
                <>
                  <FormControl
                    error={!!errors.currentSchoolLevel}
                    required
                    className="vr-reg-choice-group"
                  >
                    <BilingualFieldLabel
                      labelGu="વર્તમાન હોદ્દો — શાળા પ્રકાર"
                      labelEn="Current Post — School Type"
                      required
                    />
                    <RadioGroup
                      row
                      name="currentSchoolLevel"
                      value={form.currentSchoolLevel}
                      onChange={updateField("currentSchoolLevel")}
                      className="vr-reg-choice-group__options"
                    >
                      {CURRENT_SCHOOL_LEVEL_OPTIONS.map((item) => (
                        <FormControlLabel
                          key={item.value}
                          value={item.value}
                          className={`vr-reg-choice-option${
                            form.currentSchoolLevel === item.value
                              ? " vr-reg-choice-option--selected"
                              : ""
                          }`}
                          control={<Radio size="small" />}
                          label={
                            <span className="vr-reg-choice-option__label">
                              <span className="vr-reg-choice-option__gu">
                                {item.labelGu}
                              </span>
                              <span className="vr-reg-choice-option__en">
                                {item.labelEn}
                              </span>
                            </span>
                          }
                        />
                      ))}
                    </RadioGroup>
                    {errors.currentSchoolLevel && (
                      <FormHelperText>{errors.currentSchoolLevel}</FormHelperText>
                    )}
                  </FormControl>

                  {form.currentSchoolLevel && (
                    <FormControl
                      fullWidth
                      size="small"
                      required
                      error={!!errors.currentDesignation}
                    >
                      <InputLabel>
                        વર્તમાન હોદ્દો / Current Designation
                      </InputLabel>
                      <Select
                        value={form.currentDesignation}
                        label="વર્તમાન હોદ્દો / Current Designation"
                        onChange={updateField("currentDesignation")}
                      >
                        {(form.currentSchoolLevel === "primary"
                          ? PRIMARY_DESIGNATION_OPTIONS
                          : SECONDARY_DESIGNATION_OPTIONS
                        ).map((item) => (
                          <MenuItem key={item.value} value={item.value}>
                            {formatBilingualOption(item)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.currentDesignation && (
                        <FormHelperText>{errors.currentDesignation}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                </>
              )}

              <TextField
                label="અનુભવ (વર્ષ) / Educational / Administrative Experience (years)"
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
                helperText={errors.experienceYears || "ફક્ત અંક / Digits only (0–60)"}
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
                  label="જો હા તો કેટલા સમય માટે? (વર્ષ) / If Yes, for how long? (years)"
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
                labelEn="Experience of other verification work besides school accreditation?"
                labelGu="સ્કૂલ એક્રેડિટેશન સિવાયની વેરિફિકેશન અન્ય કામગીરીનો અનુભવ"
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
              step={4}
              titleEn="Preferred District for Accreditation Work"
              titleGu="એક્રેડિટેશન કામગીરી માટે પસંદગીનો જિલ્લો"
            >
              <Typography variant="body2" className="vr-reg-section-note">
                એક જિલ્લામાંથી 3 બ્લોક પસંદ કરી શકો છો, અથવા અન્ય જિલ્લા માટે &quot;કોઈ નહીં / None&quot; પસંદ કરો.
                <span>
                  You can pick up to 3 blocks (same or different districts). Use None for unused district preferences.
                </span>
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
                  allowNone={rank > 1}
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
                      વાહનનો પ્રકાર / Vehicle Type *
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
                          label={formatBilingualOption(item)}
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

              <FormControl error={!!errors.workDuration} required className="vr-reg-choice-group">
                <BilingualFieldLabel
                  labelGu="સ્કૂલ એક્રેડિટેશનની કામગીરી માટે તમે કેટલા સમય સુધી જોડાઈ શકો છો?"
                  labelEn="How long can you join for school accreditation work?"
                  required
                />
                <RadioGroup
                  value={form.workDuration}
                  onChange={updateField("workDuration")}
                >
                  {WORK_DURATION_OPTIONS.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio size="small" />}
                      label={formatBilingualOption(item)}
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
              step={5}
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
                label="આધાર નંબરની પુષ્ટિ / Confirm Aadhaar Number"
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

              <Typography variant="body2" className="vr-reg-section-note">
                આ માહિતી ફક્ત અમારા પેમેન્ટ પર્પઝ માટે લઈએ છીએ.
                <span>This information is collected only for our payment purpose.</span>
              </Typography>

              <TextField
                label="ખાતાધારકનું નામ / Account Holder Name"
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
                  label="ખાતા નંબર / Account Number"
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
                  label="IFSC કોડ / IFSC Code"
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
                  label="શાખાનું નામ / Branch Name"
                  value={form.bankBranch}
                  onChange={updateField("bankBranch")}
                  fullWidth
                  required
                  size="small"
                  error={!!errors.bankBranch}
                  helperText={errors.bankBranch}
                />
                <TextField
                  label="બેંકનું નામ / Bank Name"
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
                label="બેંક સરનામું / Bank Address"
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
              step={6}
              titleEn="Approval & Self-Declaration"
              titleGu="મંજૂરી અને બાંહેધરી"
            >
              <FileUploadField
                labelEn="Self-Declaration Document (optional upload)"
                labelGu="બાંહેધરી પત્રક અપલોડ"
                file={form.selfDeclarationFile}
                onChange={updateFile("selfDeclarationFile")}
                optional
                disabled={!form.willingToJoin}
              />

              <FormControl className="vr-reg-declaration-box">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.willingToJoin}
                      onChange={updateField("willingToJoin")}
                    />
                  }
                  label={
                    <Typography variant="body2" className="vr-reg-declaration">
                      હું મારી સ્વેચ્છા અને સંમતિથી આ કામગીરીમાં જોડાવા ઇચ્છું છું.
                      <br />
                      <span>
                        I wish to join this work of my own free will and consent.
                      </span>
                    </Typography>
                  }
                />
              </FormControl>

              <FormControl error={!!errors.selfDeclaration} required className="vr-reg-declaration-box">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.selfDeclaration}
                      onChange={updateField("selfDeclaration")}
                    />
                  }
                  label={
                    <Typography variant="body2" className="vr-reg-declaration">
                      હું બાંહેધરી આપું છું કે મારા વિરુદ્ધ કોઈ વિભાગીય તપાસ, શિસ્ત વિષયક
                      તપાસ કે કોર્ટ કેસ પેન્ડિંગ નથી. *
                      <br />
                      <span>
                        I declare that no departmental inquiry, disciplinary action, or court
                        case is pending against me.
                      </span>
                    </Typography>
                  }
                />
                {errors.selfDeclaration && (
                  <FormHelperText>{errors.selfDeclaration}</FormHelperText>
                )}
              </FormControl>
            </VerifierFormSection>

            <Box className="vr-reg-actions">
              <div className="vr-reg-actions__note">
                <strong>નોંધ / Note:</strong> સબમિટ કર્યા પછી વિગતોમાં ફેરફાર શક્ય નથી.
                <span>Details cannot be edited after submission.</span>
              </div>
              <div className="vr-reg-actions__buttons">
                <Button
                  type="button"
                  variant="outlined"
                  className="vr-reg-btn-cancel"
                  onClick={() => navigate(ROOT_URL)}
                  disabled={submitting}
                >
                  રદ કરો / Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  className="vr-reg-btn-submit"
                  disabled={submitting || !form.selfDeclaration}
                >
                  {submitting
                    ? "સબમિટ થઈ રહ્યું છે... / Submitting..."
                    : "અરજી સબમિટ કરો / Submit Application"}
                </Button>
              </div>
            </Box>
            </Box>

            <footer className="vr-reg-card__footer">
              <p>
                ગુજરાત સ્કૂલ ક્વોલિટી એશ્યોરન્સ કાઉન્સિલ (GSQAC)
              </p>
              <p>
                Gujarat Council of Educational Research and Training (GCERT)
              </p>
            </footer>
          </Paper>
        </Container>
      </main>
    </div>
  );
}
