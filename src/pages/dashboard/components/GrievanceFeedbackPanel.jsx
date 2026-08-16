import React, { useMemo, useState } from "react";
import {
  Feedback as FeedbackIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useSubmitParentFeedbackMutation } from "../../../services/feedbackService";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
} from "../../../services/adminService";
import { GRIEVANCE_SECTIONS } from "../data/grievanceStandards";

const MOBILE_LENGTH = 10;
const DISE_LENGTH = 11;
const NAME_MIN = 2;
const NAME_MAX = 150;
const SCHOOL_NAME_MIN = 2;
const SCHOOL_NAME_MAX = 300;
const FEEDBACK_MIN = 10;
const FEEDBACK_MAX = 5000;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const REPEATED_DIGIT_REGEX = /^(\d)\1{9}$/;
const LETTER_REGEX = /[\u0A80-\u0AFFA-Za-z]/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const INITIAL_FORM = {
  submitterName: "",
  mobileNumber: "",
  email: "",
  schoolId: "",
  schoolName: "",
  districtId: "",
  districtName: "",
  blockId: "",
  blockName: "",
  sectionId: "",
  domainName: "",
  subdomainName: "",
  questionText: "",
  feedbackText: "",
};

function onlyDigits(value, maxLength) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLength);
}

function normalizeDistrictOptions(list) {
  return (list || [])
    .map((district) => {
      const districtId = String(
        district.value ?? district.districtId ?? district.id ?? "",
      );
      const districtName =
        district.name || district.districtName || district.label || "";
      if (!districtId || !districtName) return null;
      return { districtId, districtName };
    })
    .filter(Boolean);
}

function normalizeBlockOptions(list) {
  return (list || [])
    .map((block) => {
      const blockId = String(block.value ?? block.blockId ?? block.id ?? "");
      const blockName = block.name || block.blockName || block.label || "";
      if (!blockId || !blockName) return null;
      return { blockId, blockName };
    })
    .filter(Boolean);
}

function getNameError(name) {
  const value = String(name ?? "").trim();
  if (!value) return "પૂરું નામ લખો";
  if (value.length < NAME_MIN) return "નામ ઓછામાં ઓછા 2 અક્ષરનું લખો";
  if (value.length > NAME_MAX) return "નામ 150 અક્ષરથી વધુ ન લખો";
  if (/\d/.test(value)) return "નામમાં અંક ન લખો";
  if (!LETTER_REGEX.test(value)) return "માન્ય પૂરું નામ લખો";
  return "";
}

function getMobileError(mobileNumber) {
  if (!mobileNumber) return "મોબાઇલ નંબર લખો";
  if (mobileNumber.length !== MOBILE_LENGTH) {
    return "મોબાઇલ નંબર 10 અંકનો લખો";
  }
  if (REPEATED_DIGIT_REGEX.test(mobileNumber)) {
    return "મોબાઇલ નંબરમાં એક જ અંક 10 વાર ન લખો";
  }
  if (!INDIAN_MOBILE_REGEX.test(mobileNumber)) {
    return "મોબાઇલ નંબર 6, 7, 8 અથવા 9 થી શરૂ થવો જોઈએ";
  }
  return "";
}

function getEmailError(email) {
  const value = String(email ?? "").trim();
  if (!value) return "";
  if (/\s/.test(value)) return "ઇમેઇલમાં સ્પેસ ન હોવી જોઈએ";
  if (!EMAIL_REGEX.test(value)) return "માન્ય ઇમેઇલ લખો";
  return "";
}

function getSchoolNameError(name) {
  const value = String(name ?? "").trim();
  if (!value) return "શાળાનું નામ લખો";
  if (value.length < SCHOOL_NAME_MIN) {
    return "શાળાનું નામ ઓછામાં ઓછા 2 અક્ષરનું લખો";
  }
  if (value.length > SCHOOL_NAME_MAX) {
    return "શાળાનું નામ 300 અક્ષરથી વધુ ન લખો";
  }
  if (!LETTER_REGEX.test(value)) return "માન્ય શાળાનું નામ લખો";
  return "";
}

function getDiseError(schoolId) {
  if (!schoolId) return "";
  if (schoolId.length !== DISE_LENGTH) {
    return "ડાયસ કોડ 11 અંકનો લખો";
  }
  return "";
}

function getFeedbackError(text) {
  const value = String(text ?? "").trim();
  if (!value) return "રજૂઆતની વિગતો લખો";
  if (value.length < FEEDBACK_MIN) return "રજૂઆત ઓછામાં ઓછા 10 અક્ષરની લખો";
  if (value.length > FEEDBACK_MAX) return "રજૂઆત 5000 અક્ષરથી વધુ ન લખો";
  return "";
}

function requiredSelectError(value, message) {
  return value ? "" : message;
}

function validateGrievanceForm(form) {
  return {
    submitterName: getNameError(form.submitterName),
    mobileNumber: getMobileError(form.mobileNumber),
    districtId: requiredSelectError(form.districtId, "જિલ્લો પસંદ કરો"),
    blockId: requiredSelectError(form.blockId, "તાલુકો / બ્લોક પસંદ કરો"),
    schoolName: getSchoolNameError(form.schoolName),
    schoolId: getDiseError(form.schoolId),
    email: getEmailError(form.email),
    feedbackText: getFeedbackError(form.feedbackText),
  };
}

function fieldHasError(errors, field, showErrors, touched) {
  return Boolean(errors[field] && (showErrors || touched[field]));
}

export function GrievanceFeedbackPanel({ feedbackSource = "grievance" }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({});

  const { data: districtsData, isLoading: districtsLoading } =
    useGetAllDistrictsQuery();
  const { data: blocksData, isLoading: blocksLoading } =
    useGetDistrictWiseBlocksQuery(
      form.districtId ? Number(form.districtId) : undefined,
    );

  const districts = useMemo(() => {
    const raw = Array.isArray(districtsData?.data)
      ? districtsData.data
      : Array.isArray(districtsData)
        ? districtsData
        : [];
    return normalizeDistrictOptions(raw);
  }, [districtsData]);
  const blocks = useMemo(() => {
    const raw = Array.isArray(blocksData?.data)
      ? blocksData.data
      : Array.isArray(blocksData)
        ? blocksData
        : [];
    return normalizeBlockOptions(raw);
  }, [blocksData]);

  const submitMutation = useSubmitParentFeedbackMutation({
    onSuccess: () => {
      setSubmitted(true);
      setShowErrors(false);
      setTouched({});
      setForm(INITIAL_FORM);
    },
  });

  const selectedSection = useMemo(
    () => GRIEVANCE_SECTIONS.find((section) => section.id === form.sectionId) || null,
    [form.sectionId],
  );
  const selectedDomain = useMemo(
    () => selectedSection?.domains.find((domain) => domain.name === form.domainName) || null,
    [selectedSection, form.domainName],
  );
  const selectedSubdomain = useMemo(
    () =>
      selectedDomain?.subdomains.find((item) => item.name === form.subdomainName) || null,
    [selectedDomain, form.subdomainName],
  );

  const charCount = form.feedbackText.trim().length;
  const errors = useMemo(() => validateGrievanceForm(form), [form]);
  const isValid = useMemo(
    () => Object.values(errors).every((message) => !message),
    [errors],
  );

  const markTouched = (field) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleBlur = (field) => () => markTouched(field);

  const showFieldError = (field) =>
    fieldHasError(errors, field, showErrors, touched);

  const handleChange = (field) => (event) => {
    let value = event.target.value;

    if (field === "mobileNumber") {
      value = onlyDigits(value, MOBILE_LENGTH);
    }
    if (field === "schoolId") {
      value = onlyDigits(value, DISE_LENGTH);
    }

    if (field === "email") {
      value = value.replace(/\s/g, "");
    }

    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "districtId") {
        const district = districts.find((item) => item.districtId === value);
        next.districtName = district?.districtName || "";
        next.blockId = "";
        next.blockName = "";
      }
      if (field === "blockId") {
        const block = blocks.find((item) => item.blockId === value);
        next.blockName = block?.blockName || "";
      }
      if (field === "sectionId") {
        next.domainName = "";
        next.subdomainName = "";
        next.questionText = "";
      }
      if (field === "domainName") {
        next.subdomainName = "";
        next.questionText = "";
      }
      if (field === "subdomainName") {
        next.questionText = "";
      }
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowErrors(true);
    if (submitMutation.isPending) return;

    const currentErrors = validateGrievanceForm(form);
    if (Object.values(currentErrors).some(Boolean)) {
      window.requestAnimationFrame(() => {
        document
          .querySelector(".grievance-field.is-invalid")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    submitMutation.mutate({
      submitterName: form.submitterName.trim(),
      mobileNumber: form.mobileNumber.trim(),
      email: form.email.trim() || undefined,
      schoolId: form.schoolId.trim() || undefined,
      schoolName: form.schoolName.trim(),
      districtId: Number(form.districtId),
      districtName: form.districtName,
      blockId: Number(form.blockId),
      blockName: form.blockName,
      sectionName: selectedSection?.name || undefined,
      domainName: form.domainName.trim() || undefined,
      subdomainName: form.subdomainName.trim() || undefined,
      questionText: form.questionText.trim() || undefined,
      feedbackText: form.feedbackText.trim(),
      feedbackSource,
    });
  };

  if (submitted) {
    return (
      <div className="grievance-success">
        <CheckCircleIcon className="grievance-success__icon" />
        <h3>રજૂઆત / ફીડબેક મળી ગઈ છે</h3>
        <p>
          તમારી રજૂઆત / ફીડબેક GSQAC પાસે પહોંચી ગઈ છે. જરૂર મુજબ તેની સમીક્ષા
          કરવામાં આવશે.
        </p>
        <button
          type="button"
          className="grievance-btn grievance-btn--outline"
          onClick={() => setSubmitted(false)}
        >
          બીજી રજૂઆત / ફીડબેક નોંધાવો
        </button>
      </div>
    );
  }

  return (
    <form className="grievance-form" onSubmit={handleSubmit} noValidate>
      <div className="grievance-form__intro">
        <FeedbackIcon className="grievance-form__intro-icon" />
        <div>
          <h3>રજૂઆત / ફીડબેક નોંધાવો</h3>
          <p>
            શાળાનું નામ, મુખ્યક્ષેત્ર, પેટાક્ષેત્ર અને માપદંડ પસંદ કરીને તમારી
            રજૂઆતની જરૂરી વિગતો ભરી સબમિટ કરો.
          </p>
        </div>
      </div>

      {showErrors && !isValid ? (
        <div className="grievance-form__alert" role="alert">
          કૃપા કરીને લાલ રંગે દેખાતી જરૂરી વિગતો ભરો.
        </div>
      ) : null}

      <div className="grievance-form__grid">
        <label
          className={`grievance-field${showFieldError("submitterName") ? " is-invalid" : ""}`}
        >
          <span>
            પૂરું નામ <em>*</em>
          </span>
          <input
            type="text"
            value={form.submitterName}
            onChange={handleChange("submitterName")}
            onBlur={handleBlur("submitterName")}
            placeholder="તમારું પૂરું નામ"
            maxLength={NAME_MAX}
            autoComplete="name"
            aria-invalid={showFieldError("submitterName")}
            required
          />
          {showFieldError("submitterName") ? (
            <small className="is-error">{errors.submitterName}</small>
          ) : (
            <small>અક્ષરો જ લખો, અંક નહીં</small>
          )}
        </label>

        <label
          className={`grievance-field${showFieldError("mobileNumber") ? " is-invalid" : ""}`}
        >
          <span>
            મોબાઇલ નંબર <em>*</em>
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={form.mobileNumber}
            onChange={handleChange("mobileNumber")}
            onBlur={handleBlur("mobileNumber")}
            placeholder="10 અંકનો મોબાઇલ નંબર"
            maxLength={MOBILE_LENGTH}
            autoComplete="tel"
            aria-invalid={showFieldError("mobileNumber")}
            required
          />
          {showFieldError("mobileNumber") ? (
            <small className="is-error">{errors.mobileNumber}</small>
          ) : (
            <small>ફક્ત 10 અંક, 6/7/8/9 થી શરૂ</small>
          )}
        </label>

        <label
          className={`grievance-field${showFieldError("districtId") ? " is-invalid" : ""}`}
        >
          <span>
            જિલ્લો <em>*</em>
          </span>
          <select
            value={form.districtId}
            onChange={handleChange("districtId")}
            onBlur={handleBlur("districtId")}
            required
            disabled={districtsLoading}
            aria-invalid={showFieldError("districtId")}
          >
            <option value="">
              {districtsLoading ? "જિલ્લા લોડ થઈ રહ્યા છે..." : "જિલ્લો પસંદ કરો"}
            </option>
            {districts.map((district) => (
              <option key={district.districtId} value={district.districtId}>
                {district.districtName}
              </option>
            ))}
          </select>
          {showFieldError("districtId") ? (
            <small className="is-error">{errors.districtId}</small>
          ) : null}
        </label>

        <label
          className={`grievance-field${showFieldError("blockId") ? " is-invalid" : ""}`}
        >
          <span>
            તાલુકો / બ્લોક <em>*</em>
          </span>
          <select
            value={form.blockId}
            onChange={handleChange("blockId")}
            onBlur={handleBlur("blockId")}
            required
            disabled={!form.districtId || blocksLoading}
            aria-invalid={showFieldError("blockId")}
          >
            <option value="">
              {!form.districtId
                ? "પહેલા જિલ્લો પસંદ કરો"
                : blocksLoading
                  ? "તાલુકા લોડ થઈ રહ્યા છે..."
                  : "તાલુકો / બ્લોક પસંદ કરો"}
            </option>
            {blocks.map((block) => (
              <option key={block.blockId} value={block.blockId}>
                {block.blockName}
              </option>
            ))}
          </select>
          {showFieldError("blockId") ? (
            <small className="is-error">{errors.blockId}</small>
          ) : null}
        </label>

        <label
          className={`grievance-field grievance-field--full${showFieldError("schoolName") ? " is-invalid" : ""}`}
        >
          <span>
            શાળાનું નામ <em>*</em>
          </span>
          <input
            type="text"
            value={form.schoolName}
            onChange={handleChange("schoolName")}
            onBlur={handleBlur("schoolName")}
            placeholder="શાળાનું પૂરું નામ"
            maxLength={SCHOOL_NAME_MAX}
            aria-invalid={showFieldError("schoolName")}
            required
          />
          {showFieldError("schoolName") ? (
            <small className="is-error">{errors.schoolName}</small>
          ) : null}
        </label>

        <label
          className={`grievance-field${showFieldError("schoolId") ? " is-invalid" : ""}`}
        >
          <span>ડાયસ (UDISE)</span>
          <input
            type="tel"
            inputMode="numeric"
            value={form.schoolId}
            onChange={handleChange("schoolId")}
            onBlur={handleBlur("schoolId")}
            placeholder="11 અંકનો ડાયસ કોડ (વૈકલ્પિક)"
            maxLength={DISE_LENGTH}
            aria-invalid={showFieldError("schoolId")}
          />
          {showFieldError("schoolId") ? (
            <small className="is-error">{errors.schoolId}</small>
          ) : (
            <small>ફક્ત 11 અંક (વૈકલ્પિક)</small>
          )}
        </label>

        <label
          className={`grievance-field${showFieldError("email") ? " is-invalid" : ""}`}
        >
          <span>ઇમેઇલ</span>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            placeholder="you@example.com"
            maxLength={150}
            autoComplete="email"
            aria-invalid={showFieldError("email")}
          />
          {showFieldError("email") ? (
            <small className="is-error">{errors.email}</small>
          ) : (
            <small>વૈકલ્પિક</small>
          )}
        </label>

        <label className="grievance-field">
          <span>વિભાગ</span>
          <select
            value={form.sectionId}
            onChange={handleChange("sectionId")}
            onBlur={handleBlur("sectionId")}
          >
            <option value="">વિભાગ પસંદ કરો</option>
            {GRIEVANCE_SECTIONS.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          <small>વૈકલ્પિક</small>
        </label>

        <label className="grievance-field">
          <span>મુખ્યક્ષેત્ર</span>
          <select
            value={form.domainName}
            onChange={handleChange("domainName")}
            onBlur={handleBlur("domainName")}
            disabled={!selectedSection}
          >
            <option value="">મુખ્યક્ષેત્ર પસંદ કરો</option>
            {(selectedSection?.domains || []).map((domain) => (
              <option key={domain.name} value={domain.name}>
                {domain.name}
              </option>
            ))}
          </select>
          <small>{selectedSection ? "વૈકલ્પિક" : "પહેલા વિભાગ પસંદ કરો"}</small>
        </label>

        <label className="grievance-field grievance-field--full">
          <span>પેટાક્ષેત્ર</span>
          <select
            value={form.subdomainName}
            onChange={handleChange("subdomainName")}
            onBlur={handleBlur("subdomainName")}
            disabled={!selectedDomain}
          >
            <option value="">પેટાક્ષેત્ર પસંદ કરો</option>
            {(selectedDomain?.subdomains || []).map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <small>{selectedDomain ? "વૈકલ્પિક" : "પહેલા મુખ્યક્ષેત્ર પસંદ કરો"}</small>
        </label>

        <label className="grievance-field grievance-field--full">
          <span>માપદંડ / પ્રશ્ન</span>
          <select
            value={form.questionText}
            onChange={handleChange("questionText")}
            onBlur={handleBlur("questionText")}
            disabled={!selectedSubdomain}
          >
            <option value="">માપદંડ પસંદ કરો</option>
            {(selectedSubdomain?.questions || []).map((question) => (
              <option key={question} value={question}>
                {question}
              </option>
            ))}
          </select>
          <small>{selectedSubdomain ? "વૈકલ્પિક" : "પહેલા પેટાક્ષેત્ર પસંદ કરો"}</small>
        </label>

        <label
          className={`grievance-field grievance-field--full${showFieldError("feedbackText") ? " is-invalid" : ""}`}
        >
          <span>
            રજૂઆતની વિગતો <em>*</em>
          </span>
          <textarea
            value={form.feedbackText}
            onChange={handleChange("feedbackText")}
            onBlur={handleBlur("feedbackText")}
            placeholder="તમારી રજૂઆતની જરૂરી વિગતો ભરો..."
            rows={7}
            maxLength={FEEDBACK_MAX}
            aria-invalid={showFieldError("feedbackText")}
            required
          />
          {showFieldError("feedbackText") ? (
            <small className="is-error">{errors.feedbackText}</small>
          ) : (
            <small>
              {charCount}/{FEEDBACK_MAX} અક્ષરો (ઓછામાં ઓછા {FEEDBACK_MIN})
            </small>
          )}
        </label>
      </div>

      <div className="grievance-form__actions">
        <button
          type="submit"
          className="grievance-btn grievance-btn--primary"
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <SendIcon fontSize="small" />
          )}
          રજૂઆત / ફીડબેક સબમિટ કરો
        </button>
      </div>
    </form>
  );
}
