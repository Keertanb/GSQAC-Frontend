import React, { useMemo, useState } from "react";
import {
  ReportProblem as GrievanceIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useSubmitParentFeedbackMutation } from "../../../services/feedbackService";
import { GRIEVANCE_SECTIONS } from "../data/grievanceStandards";

const INITIAL_FORM = {
  submitterName: "",
  mobileNumber: "",
  email: "",
  schoolId: "",
  schoolName: "",
  sectionId: "",
  domainName: "",
  subdomainName: "",
  questionText: "",
  feedbackText: "",
};

export function GrievanceFeedbackPanel({ feedbackSource = "grievance" }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useSubmitParentFeedbackMutation({
    onSuccess: () => {
      setSubmitted(true);
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

  const charCount = form.feedbackText.length;
  const isValid = useMemo(() => {
    return (
      form.submitterName.trim().length >= 2 &&
      form.schoolName.trim().length >= 2 &&
      form.sectionId &&
      form.domainName &&
      form.subdomainName &&
      form.questionText &&
      form.feedbackText.trim().length >= 10 &&
      charCount <= 5000
    );
  }, [form, charCount]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
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
    if (!isValid || submitMutation.isPending) return;

    submitMutation.mutate({
      submitterName: form.submitterName.trim(),
      mobileNumber: form.mobileNumber.trim() || undefined,
      email: form.email.trim() || undefined,
      schoolId: form.schoolId.trim() || undefined,
      schoolName: form.schoolName.trim(),
      sectionName: selectedSection?.name || undefined,
      domainName: form.domainName,
      subdomainName: form.subdomainName,
      questionText: form.questionText,
      feedbackText: form.feedbackText.trim(),
      feedbackSource,
    });
  };

  if (submitted) {
    return (
      <div className="grievance-success">
        <CheckCircleIcon className="grievance-success__icon" />
        <h3>ફરિયાદ મળી ગઈ છે</h3>
        <p>
          તમારી ફરિયાદ GSQAC પાસે પહોંચી ગઈ છે. જરૂર મુજબ તેની સમીક્ષા કરવામાં આવશે.
        </p>
        <button
          type="button"
          className="grievance-btn grievance-btn--outline"
          onClick={() => setSubmitted(false)}
        >
          બીજી ફરિયાદ નોંધાવો
        </button>
      </div>
    );
  }

  return (
    <form className="grievance-form" onSubmit={handleSubmit} noValidate>
      <div className="grievance-form__intro">
        <GrievanceIcon className="grievance-form__intro-icon" />
        <div>
          <h3>ફરિયાદ નોંધાવો</h3>
          <p>
            શાળાનું નામ, મુખ્યક્ષેત્ર, પેટાક્ષેત્ર અને માપદંડ પસંદ કરીને તમારી ફરિયાદ લખો.
          </p>
        </div>
      </div>

      <div className="grievance-form__grid">
        <label className="grievance-field">
          <span>
            પૂરું નામ <em>*</em>
          </span>
          <input
            type="text"
            value={form.submitterName}
            onChange={handleChange("submitterName")}
            placeholder="તમારું પૂરું નામ"
            maxLength={150}
            required
          />
        </label>

        <label className="grievance-field">
          <span>મોબાઇલ નંબર</span>
          <input
            type="tel"
            value={form.mobileNumber}
            onChange={handleChange("mobileNumber")}
            placeholder="10 અંકનો મોબાઇલ નંબર"
            maxLength={15}
          />
        </label>

        <label className="grievance-field grievance-field--full">
          <span>
            શાળાનું નામ <em>*</em>
          </span>
          <input
            type="text"
            value={form.schoolName}
            onChange={handleChange("schoolName")}
            placeholder="શાળાનું પૂરું નામ"
            maxLength={300}
            required
          />
        </label>

        <label className="grievance-field">
          <span>UDISE / School ID</span>
          <input
            type="text"
            value={form.schoolId}
            onChange={handleChange("schoolId")}
            placeholder="UDISE કોડ (વૈકલ્પિક)"
            maxLength={15}
          />
        </label>

        <label className="grievance-field">
          <span>ઇમેઇલ</span>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="you@example.com"
            maxLength={150}
          />
        </label>

        <label className="grievance-field">
          <span>
            વિભાગ <em>*</em>
          </span>
          <select value={form.sectionId} onChange={handleChange("sectionId")} required>
            <option value="">વિભાગ પસંદ કરો</option>
            {GRIEVANCE_SECTIONS.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grievance-field">
          <span>
            મુખ્યક્ષેત્ર <em>*</em>
          </span>
          <select
            value={form.domainName}
            onChange={handleChange("domainName")}
            disabled={!selectedSection}
            required
          >
            <option value="">મુખ્યક્ષેત્ર પસંદ કરો</option>
            {(selectedSection?.domains || []).map((domain) => (
              <option key={domain.name} value={domain.name}>
                {domain.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grievance-field grievance-field--full">
          <span>
            પેટાક્ષેત્ર <em>*</em>
          </span>
          <select
            value={form.subdomainName}
            onChange={handleChange("subdomainName")}
            disabled={!selectedDomain}
            required
          >
            <option value="">પેટાક્ષેત્ર પસંદ કરો</option>
            {(selectedDomain?.subdomains || []).map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grievance-field grievance-field--full">
          <span>
            માપદંડ / પ્રશ્ન <em>*</em>
          </span>
          <select
            value={form.questionText}
            onChange={handleChange("questionText")}
            disabled={!selectedSubdomain}
            required
          >
            <option value="">માપદંડ પસંદ કરો</option>
            {(selectedSubdomain?.questions || []).map((question) => (
              <option key={question} value={question}>
                {question}
              </option>
            ))}
          </select>
        </label>

        <label className="grievance-field grievance-field--full">
          <span>
            ફરિયાદ / પ્રતિસાદ <em>*</em>
          </span>
          <textarea
            value={form.feedbackText}
            onChange={handleChange("feedbackText")}
            placeholder="પસંદ કરેલા માપદંડ અંગેની તમારી ફરિયાદ વિગતવાર લખો..."
            rows={7}
            maxLength={5000}
            required
          />
          <small className={charCount > 5000 ? "is-error" : ""}>
            {charCount}/5000 અક્ષરો (ઓછામાં ઓછા 10)
          </small>
        </label>
      </div>

      <div className="grievance-form__actions">
        <button
          type="submit"
          className="grievance-btn grievance-btn--primary"
          disabled={!isValid || submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <SendIcon fontSize="small" />
          )}
          ફરિયાદ સબમિટ કરો
        </button>
      </div>
    </form>
  );
}
