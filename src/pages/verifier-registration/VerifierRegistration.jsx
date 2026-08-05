import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { ROOT_URL } from "../../routes/routeUrls";
import LogoImg from "../../assets/logo_image.png";
import GsqacLogoImg from "../../assets/gsqac_logo.png";
import VerifierFormSection from "./components/VerifierFormSection";
import BilingualFieldLabel from "./components/BilingualFieldLabel";
import { useVerifierRegistrationForm } from "./hooks/useVerifierRegistrationForm";
import { useGetVerifierRegistrationStatusQuery } from "../../services/verifierRegistrationService";
import { VERIFIER_REGISTRATION_CLOSED_MESSAGE } from "../../constants/verifierRegistration";
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
  IF_APPLICABLE_HINT,
} from "./constants/verifierRegistrationOptions";
import { DOB_BOUNDS } from "./utils/verifierRegistrationValidation";
import "./VerifierRegistration.css";

function YesNoGroup({ labelEn, labelGu, name, value, onChange, onBlur, error, required }) {
  return (
    <FormControl
      error={!!error}
      required={required}
      className="vr-reg-yesno"
      onBlur={onBlur}
    >
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
  excludedDistrictIds = [],
  onDistrictChange,
  onTalukaChange,
  onDistrictBlur,
  onTalukaBlur,
  districtError,
  talukaError,
  required = false,
  allowNone = false,
}) {
  const isNone = districtValue === "none";
  const talukaRequired = required && !isNone && !!districtValue;
  const selectedTalukas = Array.isArray(talukaValue)
    ? talukaValue
    : talukaValue
      ? [talukaValue]
      : [];

  const handleTalukaChange = (event) => {
    const raw = event.target.value;
    const next = typeof raw === "string" ? raw.split(",") : raw;
    const unique = [...new Set((next || []).filter(Boolean))].slice(0, 3);
    onTalukaChange({
      target: { type: "text", value: unique },
    });
  };

  const availableDistricts = districts.filter((district) => {
    const id = String(
      district.value ?? district.districtId ?? district.id ?? "",
    );
    if (!id) return false;
    if (id === districtValue) return true;
    return !excludedDistrictIds.includes(id);
  });

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
          onBlur={onDistrictBlur}
          onClose={onDistrictBlur}
        >
          <MenuItem value="">
            <em>જિલ્લો પસંદ કરો / Select district</em>
          </MenuItem>
          {allowNone && (
            <MenuItem value="none">
              <em>કોઈ નહીં / None</em>
            </MenuItem>
          )}
          {availableDistricts.map((district) => {
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
        <InputLabel>{`બ્લોક / તાલુકા ${rank} (મહત્તમ 3) / Blocks / Talukas ${rank} (max 3)`}</InputLabel>
        <Select
          multiple
          value={isNone ? [] : selectedTalukas}
          label={`બ્લોક / તાલુકા ${rank} (મહત્તમ 3) / Blocks / Talukas ${rank} (max 3)`}
          onChange={handleTalukaChange}
          onBlur={onTalukaBlur}
          onClose={onTalukaBlur}
          renderValue={(selected) =>
            selected.length ? selected.join(", ") : ""
          }
        >
          {!districtValue && (
            <MenuItem value="" disabled>
              <em>પહેલા જિલ્લો પસંદ કરો / Select district first</em>
            </MenuItem>
          )}
          {isNone && (
            <MenuItem value="" disabled>
              <em>લાગુ નથી / Not applicable</em>
            </MenuItem>
          )}
          {!isNone && districtValue && talukaOptions.length === 0 && (
            <MenuItem value="" disabled>
              <em>બ્લોક મળ્યા નથી / No blocks found</em>
            </MenuItem>
          )}
          {!isNone &&
            talukaOptions.map((block) => {
              const id = String(block.value ?? block.blockId ?? block.id ?? "");
              const name = block.name || block.blockName || block.label || id;
              if (!name) return null;
              const disabled =
                selectedTalukas.length >= 3 && !selectedTalukas.includes(name);
              return (
                <MenuItem key={id || name} value={name} disabled={disabled}>
                  <Checkbox
                    size="small"
                    checked={selectedTalukas.includes(name)}
                  />
                  {name}
                </MenuItem>
              );
            })}
        </Select>
        <FormHelperText>
          {talukaError ||
            (!isNone && districtValue
              ? `${selectedTalukas.length}/3 selected`
              : " ")}
        </FormHelperText>
      </FormControl>
    </Box>
  );
}

export default function VerifierRegistration() {
  const navigate = useNavigate();
  const {
    data: statusData,
    isLoading: isLoadingStatus,
  } = useGetVerifierRegistrationStatusQuery();

  const registrationIsActive =
    statusData?.data?.isActive === 1 || statusData?.data?.isActive === true;
  const closedMessage =
    statusData?.data?.message || VERIFIER_REGISTRATION_CLOSED_MESSAGE;

  const handleClosedDialogClose = () => {
    navigate(ROOT_URL);
  };

  const {
    form,
    errors,
    age,
    submitting,
    districts,
    talukaOptions,
    updateField,
    blurField,
    toggleMultiValue,
    handleSubmit,
  } = useVerifierRegistrationForm();

  const isEmployed = form.occupation === "employed";
  const isNivruti = form.occupation === "nivruti";
  const showWorkDetails = isEmployed || isNivruti;
  const hasVehicle = form.hasVehicle === "yes";

  if (isLoadingStatus) {
    return (
      <div className="vr-reg-page">
        <div className="vr-reg-page__accent" aria-hidden />
        <main className="vr-reg-main">
          <Container maxWidth="md" className="vr-reg-container">
            <Paper elevation={0} className="vr-reg-card">
              <Typography sx={{ p: 4, textAlign: "center" }}>
                Loading...
              </Typography>
            </Paper>
          </Container>
        </main>
      </div>
    );
  }

  if (!registrationIsActive) {
    return (
      <div className="vr-reg-page">
        <div className="vr-reg-page__accent" aria-hidden />
        <Dialog
          open
          onClose={handleClosedDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>વેરિફાયર રજીસ્ટ્રેશન</DialogTitle>
          <DialogContent>
            <Typography sx={{ pt: 1, lineHeight: 1.7, fontSize: "1.05rem" }}>
              {closedMessage}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="contained"
              onClick={handleClosedDialogClose}
              sx={{ textTransform: "none" }}
            >
              ઠીક છે
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

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
                ગુજરાત સ્કૂલ ક્વોલિટી એક્રેડિટેશન કાઉન્સિલ (GSQAC)
              </p>
              <p className="vr-reg-header__org-en">
                Gujarat - SSSA
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
                <img
                  src={GsqacLogoImg}
                  alt="GSQAC"
                  className="vr-reg-card__gsqac-logo"
                />
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
                label="પૂરું નામ (Full Name)"
                value={form.fullName}
                onChange={updateField("fullName")}
                onBlur={blurField("fullName")}
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
                onBlur={blurField("gender")}
              >
                <BilingualFieldLabel
                  labelGu="જાતિ"
                  labelEn="Gender"
                  required
                />
                <RadioGroup
                  row
                  name="gender"
                  value={form.gender}
                  onChange={updateField("gender")}
                  onBlur={blurField("gender")}
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
                            {formatBilingualOption(item)}
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
                label="શિક્ષક કોડ / CRC કોડ (Teacher Code / CRC Code)"
                value={form.teacherCode}
                onChange={updateField("teacherCode")}
                onBlur={blurField("teacherCode")}
                fullWidth
                size="small"
                inputProps={{ inputMode: "numeric", maxLength: 20 }}
                error={!!errors.teacherCode}
                helperText={errors.teacherCode || IF_APPLICABLE_HINT}
              />

              <TextField
                label="શાળા DISE કોડ (School DISE Code)"
                value={form.schoolDiseCode}
                onChange={updateField("schoolDiseCode")}
                onBlur={blurField("schoolDiseCode")}
                fullWidth
                size="small"
                inputProps={{ inputMode: "numeric", maxLength: 15 }}
                error={!!errors.schoolDiseCode}
                helperText={errors.schoolDiseCode || IF_APPLICABLE_HINT}
              />

              <FormControl
                fullWidth
                size="small"
                required
                error={!!errors.nativeDistrictId}
              >
                <InputLabel>વતન નો જિલ્લો (Native District)</InputLabel>
                <Select
                  value={form.nativeDistrictId}
                  label="વતન નો જિલ્લો (Native District)"
                  onChange={updateField("nativeDistrictId")}
                  onBlur={blurField("nativeDistrictId")}
                  onClose={blurField("nativeDistrictId")}
                >
                  {districts.map((district) => {
                    const id = String(
                      district.districtId ?? district.value ?? district.id ?? "",
                    );
                    const name =
                      district.districtName ||
                      district.name ||
                      district.label ||
                      id;
                    return (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.nativeDistrictId && (
                  <FormHelperText>{errors.nativeDistrictId}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                fullWidth
                size="small"
                required
                error={!!errors.jobDistrictId}
              >
                <InputLabel>નોકરી નો જિલ્લો (Job District)</InputLabel>
                <Select
                  value={form.jobDistrictId}
                  label="નોકરી નો જિલ્લો (Job District)"
                  onChange={updateField("jobDistrictId")}
                  onBlur={blurField("jobDistrictId")}
                  onClose={blurField("jobDistrictId")}
                >
                  <MenuItem value="none">કોઈ નહીં / NA</MenuItem>
                  {districts.map((district) => {
                    const id = String(
                      district.districtId ?? district.value ?? district.id ?? "",
                    );
                    const name =
                      district.districtName ||
                      district.name ||
                      district.label ||
                      id;
                    return (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.jobDistrictId && (
                  <FormHelperText>{errors.jobDistrictId}</FormHelperText>
                )}
              </FormControl>

              <TextField
                label="ઈ-મેઈલ આઈડી (Email ID)"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                onBlur={blurField("email")}
                fullWidth
                required
                size="small"
                error={!!errors.email}
                helperText={errors.email}
              />
              <Box className="vr-reg-grid vr-reg-grid--2">
                <TextField
                  label="જન્મ તારીખ (Date of Birth)"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={updateField("dateOfBirth")}
                  onBlur={blurField("dateOfBirth")}
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
                  label="ઉંમર (Age)"
                  value={age}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                />
              </Box>
              <TextField
                label="મોબાઈલ-વોટ્સએપ નંબર (Mobile / WhatsApp Number)"
                value={form.mobileNumber}
                onChange={updateField("mobileNumber")}
                onBlur={blurField("mobileNumber")}
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
                <InputLabel>શૈક્ષણિક લાયકાત (Educational Qualification)</InputLabel>
                <Select
                  value={form.educationalQualification}
                  label="શૈક્ષણિક લાયકાત (Educational Qualification)"
                  onChange={updateField("educationalQualification")}
onBlur={blurField("educationalQualification")}
onClose={blurField("educationalQualification")}
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

              <FormControl
                error={!!errors.professionalQualifications}
                onBlur={blurField("professionalQualifications")}
              >
                <FormLabel className="vr-reg-checkbox-group__label">
                  વ્યાવસાયિક લાયકાત (Professional Qualification){" "}
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

              {form.professionalQualifications.includes("other") && (
                <TextField
                  label="અન્ય વ્યાવસાયિક લાયકાત સ્પષ્ટ કરો (Specify Other Professional Qualification)"
                  value={form.professionalQualificationOther}
                  onChange={updateField("professionalQualificationOther")}
                  onBlur={blurField("professionalQualificationOther")}
                  fullWidth
                  required
                  size="small"
                  error={!!errors.professionalQualificationOther}
                  helperText={errors.professionalQualificationOther}
                />
              )}

              <YesNoGroup
                labelEn="Computer / IT Knowledge (computer/ mobile/ tablet)"
                labelGu="કમ્પ્યુટર/આઈટી જ્ઞાન"
                name="computerKnowledge"
                value={form.computerKnowledge}
                onChange={updateField("computerKnowledge")}
                onBlur={blurField("computerKnowledge")}
                error={errors.computerKnowledge}
                required
              />

              <FormControl
                error={!!errors.languageSkills}
                required
                onBlur={blurField("languageSkills")}
              >
                <FormLabel className="vr-reg-checkbox-group__label">
                  ભાષાનું જ્ઞાન (Language Knowledge) *
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
              <FormControl
                error={!!errors.occupation}
                required
                onBlur={blurField("occupation")}
              >
                <FormLabel className="vr-reg-radio-group__label">
                  વ્યવસાય (Occupation) *
                </FormLabel>
                <RadioGroup
                  row
                  value={form.occupation}
                  onChange={updateField("occupation")}
                  onBlur={blurField("occupation")}
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
                    નોકરીની સંસ્થાનો પ્રકાર (Type of Job Institution)
                  </InputLabel>
                  <Select
                    value={form.organizationType}
                    label="નોકરીની સંસ્થાનો પ્રકાર (Type of Job Institution)"
                    onChange={updateField("organizationType")}
onBlur={blurField("organizationType")}
onClose={blurField("organizationType")}
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

              {showWorkDetails && (
                <>
                  <FormControl
                    error={!!errors.currentSchoolLevel}
                    required
                    className="vr-reg-choice-group"
                    onBlur={blurField("currentSchoolLevel")}
                  >
                    <BilingualFieldLabel
                      labelGu={
                        isNivruti
                          ? "શાળા પ્રકાર"
                          : "વર્તમાન હોદ્દો — શાળા પ્રકાર"
                      }
                      labelEn={
                        isNivruti ? "School Type" : "Current Post — School Type"
                      }
                      required
                    />
                    <RadioGroup
                      row
                      name="currentSchoolLevel"
                      value={form.currentSchoolLevel}
                      onChange={updateField("currentSchoolLevel")}
                      onBlur={blurField("currentSchoolLevel")}
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
                                {formatBilingualOption(item)}
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

                  {form.currentSchoolLevel === "other" && (
                    <TextField
                      label="અન્ય શાળા પ્રકાર સ્પષ્ટ કરો (Specify Other School Type)"
                      value={form.currentSchoolLevelOther}
                      onChange={updateField("currentSchoolLevelOther")}
                      onBlur={blurField("currentSchoolLevelOther")}
                      fullWidth
                      required
                      size="small"
                      error={!!errors.currentSchoolLevelOther}
                      helperText={errors.currentSchoolLevelOther}
                    />
                  )}

                  {(form.currentSchoolLevel === "other" ||
                    form.currentSchoolLevel === "higher_education") && (
                    <TextField
                      label={
                        form.currentSchoolLevel === "higher_education"
                          ? "વિગતો સ્પષ્ટ કરો (Specify Details)"
                          : "વર્તમાન હોદ્દો (Current Designation)"
                      }
                      value={form.currentDesignation}
                      onChange={updateField("currentDesignation")}
                      onBlur={blurField("currentDesignation")}
                      fullWidth
                      required
                      size="small"
                      error={!!errors.currentDesignation}
                      helperText={errors.currentDesignation}
                    />
                  )}

                  {(form.currentSchoolLevel === "primary" ||
                    form.currentSchoolLevel === "secondary") && (
                    <FormControl
                      fullWidth
                      size="small"
                      required
                      error={!!errors.currentDesignation}
                    >
                      <InputLabel>
                        વર્તમાન હોદ્દો (Current Designation)
                      </InputLabel>
                      <Select
                        value={form.currentDesignation}
                        label="વર્તમાન હોદ્દો (Current Designation)"
                        onChange={updateField("currentDesignation")}
                        onBlur={blurField("currentDesignation")}
                        onClose={blurField("currentDesignation")}
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

              <Box className="vr-reg-grid vr-reg-grid--2">
                <TextField
                  label="અનુભવ — વર્ષ (Experience — Years)"
                  value={form.experienceYears}
                  onChange={updateField("experienceYears")}
                  onBlur={blurField("experienceYears")}
                  fullWidth
                  required
                  size="small"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: 2,
                  }}
                  error={!!errors.experienceYears}
                  helperText={errors.experienceYears || "0–60 વર્ષ / years"}
                />
                <TextField
                  label="અનુભવ — મહિના (Experience — Months)"
                  value={form.experienceMonths}
                  onChange={updateField("experienceMonths")}
                  onBlur={blurField("experienceMonths")}
                  fullWidth
                  size="small"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: 2,
                  }}
                  error={!!errors.experienceMonths}
                  helperText={errors.experienceMonths || "0–11 મહિના / months"}
                />
              </Box>

              <YesNoGroup
                labelEn="Prior work in School Accreditation / Verification?"
                labelGu="સ્કૂલ એક્રેડિટેશન/વેરિફિકેશનમાં અગાઉ કામગીરી કરેલ છે?"
                name="previousAccreditationWork"
                value={form.previousAccreditationWork}
                onChange={updateField("previousAccreditationWork")}
                onBlur={blurField("previousAccreditationWork")}
                error={errors.previousAccreditationWork}
                required
              />

              {form.previousAccreditationWork === "yes" && (
                <TextField
                  label="જો હા તો કેટલા સમય માટે? — વર્ષ (If Yes, for how long? — years)"
                  value={form.previousAccreditationDuration}
                  onChange={updateField("previousAccreditationDuration")}
                  onBlur={blurField("previousAccreditationDuration")}
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
                onBlur={blurField("otherVerificationExperience")}
                error={errors.otherVerificationExperience}
                required
              />

              {form.otherVerificationExperience === "yes" && (
                <TextField
                  label="વિગતો (If Yes, details)"
                  value={form.otherVerificationDetails}
                  onChange={updateField("otherVerificationDetails")}
                  onBlur={blurField("otherVerificationDetails")}
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
              <Typography variant="body2" className="vr-reg-section-note vr-reg-section-note--emphasis">
                <strong>નોંધ / Note:</strong> આ માહિતીનો હેતુ વેરિફિકેશન માટે શાળા ફાળવણીને વધુ સુગમ બનાવવાનો છે. પરંતુ તમે પસંદ કરેલ જિલ્લાઓ અને તાલુકાઓમાં જ શાળાઓ ફાળવાય તે જરૂરી નથી.
                <span>
                  This information is only to make school allocation for verification smoother. It is not necessary that schools will be allotted only in your selected districts and talukas.
                </span>
                <span className="vr-reg-section-note__sub">
                  દરેક જિલ્લો ફક્ત એક વાર પસંદ કરી શકાય. એક જિલ્લામાંથી 3 બ્લોક / તાલુકા પસંદ કરી શકો છો (કુલ મહત્તમ 9). અન્ય જિલ્લા માટે &quot;કોઈ નહીં / None&quot; પસંદ કરો.
                  Each district can be selected only once. You can select up to 3 blocks/talukas per district (max 9 total). Use &quot;None&quot; for unused district preferences.
                </span>
              </Typography>

              {[1, 2, 3].map((rank) => {
                const excludedDistrictIds = [1, 2, 3]
                  .filter((otherRank) => otherRank !== rank)
                  .map((otherRank) =>
                    String(form[`preferredDistrict${otherRank}`] || ""),
                  )
                  .filter((id) => id && id !== "none");

                return (
                  <RankedLocationFields
                    key={rank}
                    rank={rank}
                    districtValue={form[`preferredDistrict${rank}`]}
                    talukaValue={form[`preferredTaluka${rank}`]}
                    districts={districts}
                    talukaOptions={talukaOptions[rank]}
                    excludedDistrictIds={excludedDistrictIds}
                    onDistrictChange={updateField(`preferredDistrict${rank}`)}
                    onTalukaChange={updateField(`preferredTaluka${rank}`)}
                    onDistrictBlur={blurField(`preferredDistrict${rank}`)}
                    onTalukaBlur={blurField(`preferredTaluka${rank}`)}
                    districtError={errors[`preferredDistrict${rank}`]}
                    talukaError={errors[`preferredTaluka${rank}`]}
                    required
                    allowNone={rank > 1}
                  />
                );
              })}

              <YesNoGroup
                labelEn="Vehicle Facility (own two-wheeler / four-wheeler)?"
                labelGu="વાહનની સુવિધા (ટૂ-વ્હીલર/ફોર-વ્હીલર) છે કે નહીં?"
                name="hasVehicle"
                value={form.hasVehicle}
                onChange={updateField("hasVehicle")}
                onBlur={blurField("hasVehicle")}
                error={errors.hasVehicle}
                required
              />

              {hasVehicle && (
                <>
                  <FormControl
                    error={!!errors.vehicleType}
                    required
                    onBlur={blurField("vehicleType")}
                  >
                    <FormLabel className="vr-reg-radio-group__label">
                      વાહનનો પ્રકાર (Vehicle Type) *
                    </FormLabel>
                    <RadioGroup
                      row
                      value={form.vehicleType}
                      onChange={updateField("vehicleType")}
                      onBlur={blurField("vehicleType")}
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
                    onBlur={blurField("hasDrivingLicense")}
                    error={errors.hasDrivingLicense}
                    required
                  />
                </>
              )}

              <FormControl
                error={!!errors.workDuration}
                required
                className="vr-reg-choice-group"
                onBlur={blurField("workDuration")}
              >
                <BilingualFieldLabel
                  labelGu="સ્કૂલ એક્રેડિટેશનની કામગીરી માટે તમે કેટલા સમય સુધી જોડાઈ શકો છો?"
                  labelEn="How long can you join for school accreditation work?"
                  required
                />
                <RadioGroup
                  value={form.workDuration}
                  onChange={updateField("workDuration")}
                  onBlur={blurField("workDuration")}
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
                label="આધાર કાર્ડ (Aadhaar Number)"
                value={form.aadhaarNumber}
                onChange={updateField("aadhaarNumber")}
                onBlur={blurField("aadhaarNumber")}
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
                label="આધાર નંબરની પુષ્ટિ (Confirm Aadhaar Number)"
                value={form.confirmAadhaarNumber}
                onChange={updateField("confirmAadhaarNumber")}
                onBlur={blurField("confirmAadhaarNumber")}
                fullWidth
                required
                size="small"
                inputProps={{ maxLength: 12, inputMode: "numeric" }}
                error={!!errors.confirmAadhaarNumber}
                helperText={errors.confirmAadhaarNumber}
              />

              <Typography variant="body2" className="vr-reg-section-note">
                આ માહિતી માત્ર વેરિફિકેશનની કામગીરી માટે નાણાકીય ચૂકવણીના હેતુ માટે છે.
                <span>
                  This information is only for monetary payment related to verification work.
                </span>
              </Typography>

              <TextField
                label="ખાતાધારકનું નામ (Account Holder Name)"
                value={form.bankAccountName}
                onChange={updateField("bankAccountName")}
                onBlur={blurField("bankAccountName")}
                fullWidth
                required
                size="small"
                error={!!errors.bankAccountName}
                helperText={errors.bankAccountName || "As per bank passbook"}
              />

              <Box className="vr-reg-grid vr-reg-grid--2">
                <TextField
                  label="ખાતા નંબર (Account Number)"
                  value={form.bankAccountNumber}
                  onChange={updateField("bankAccountNumber")}
                  onBlur={blurField("bankAccountNumber")}
                  fullWidth
                  required
                  size="small"
                  inputProps={{ maxLength: 18, inputMode: "numeric" }}
                  error={!!errors.bankAccountNumber}
                  helperText={errors.bankAccountNumber}
                />
                <TextField
                  label="IFSC કોડ (IFSC Code)"
                  value={form.bankIfsc}
                  onChange={updateField("bankIfsc")}
                  onBlur={blurField("bankIfsc")}
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
                  label="શાખાનું નામ (Branch Name)"
                  value={form.bankBranch}
                  onChange={updateField("bankBranch")}
                  onBlur={blurField("bankBranch")}
                  fullWidth
                  required
                  size="small"
                  error={!!errors.bankBranch}
                  helperText={errors.bankBranch}
                />
                <TextField
                  label="બેંકનું નામ (Bank Name)"
                  value={form.bankName}
                  onChange={updateField("bankName")}
                  onBlur={blurField("bankName")}
                  fullWidth
                  required
                  size="small"
                  error={!!errors.bankName}
                  helperText={errors.bankName}
                />
              </Box>

              <TextField
                label="બેંક સરનામું (Bank Address)"
                value={form.bankAddress}
                onChange={updateField("bankAddress")}
                onBlur={blurField("bankAddress")}
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
              <FormControl error={!!errors.selfDeclaration} required className="vr-reg-declaration-box">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.selfDeclaration}
                      onChange={updateField("selfDeclaration")}
                      onBlur={blurField("selfDeclaration")}
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

              <FormControl error={!!errors.willingToJoin} required className="vr-reg-declaration-box">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.willingToJoin}
                      onChange={updateField("willingToJoin")}
                      onBlur={blurField("willingToJoin")}
                    />
                  }
                  label={
                    <Typography variant="body2" className="vr-reg-declaration">
                      હું મારી સ્વેચ્છાએ આ કામગીરીમાં જોડવા ઈચ્છું છું. *
                      <br />
                      <span>
                        I willingly wish to join this work / assignment.
                      </span>
                    </Typography>
                  }
                />
                {errors.willingToJoin && (
                  <FormHelperText>{errors.willingToJoin}</FormHelperText>
                )}
              </FormControl>
            </VerifierFormSection>

            <Box className="vr-reg-actions">
              <div className="vr-reg-actions__note">
                <strong>નોંધ / Note:</strong> અરજી કર્યાથી વેરિફાયર તરીકે પસંદગી કે કામગીરી માટેનો કોઈ હક કે દાવો કરી શકાશે નહીં. પસંદગીનો અંતિમ નિર્ણય GCERT-GSQAC નો રહેશે.
                <span>
                  Submitting an application does not create any right or claim to selection or work as a verifier. The final decision rests with GCERT-GSQAC.
                </span>
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
                  disabled={
                    submitting || !form.selfDeclaration || !form.willingToJoin
                  }
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
                ગુજરાત સ્કૂલ ક્વોલિટી એક્રેડિટેશન કાઉન્સિલ (GSQAC) — Gujarat - SSSA
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
