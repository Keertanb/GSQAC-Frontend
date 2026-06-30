import React, { useMemo, useState } from "react";
import {
  RateReview as FeedbackIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useSubmitParentFeedbackMutation } from "../../../services/feedbackService";

const INITIAL_FORM = {
  submitterName: "",
  mobileNumber: "",
  email: "",
  schoolId: "",
  schoolName: "",
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

  const charCount = form.feedbackText.length;
  const isValid = useMemo(() => {
    return (
      form.submitterName.trim().length >= 2 &&
      form.feedbackText.trim().length >= 10 &&
      charCount <= 5000
    );
  }, [form.submitterName, form.feedbackText, charCount]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || submitMutation.isPending) return;

    submitMutation.mutate({
      submitterName: form.submitterName.trim(),
      mobileNumber: form.mobileNumber.trim() || undefined,
      email: form.email.trim() || undefined,
      schoolId: form.schoolId.trim() || undefined,
      schoolName: form.schoolName.trim() || undefined,
      feedbackText: form.feedbackText.trim(),
      feedbackSource,
    });
  };

  if (submitted) {
    return (
      <div className="grievance-success">
        <CheckCircleIcon className="grievance-success__icon" />
        <h3>Thank you for your feedback</h3>
        <p>
          Your message has been received. GSQAC will review it and take
          appropriate action where required.
        </p>
        <button
          type="button"
          className="grievance-btn grievance-btn--outline"
          onClick={() => setSubmitted(false)}
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form className="grievance-form" onSubmit={handleSubmit} noValidate>
      <div className="grievance-form__intro">
        <FeedbackIcon className="grievance-form__intro-icon" />
        <div>
          <h3>Share your feedback</h3>
          <p>
            Parents, guardians, and community members can share complete
            feedback about school quality, accreditation, or related concerns.
          </p>
        </div>
      </div>

      <div className="grievance-form__grid">
        <label className="grievance-field">
          <span>
            Full name <em>*</em>
          </span>
          <input
            type="text"
            value={form.submitterName}
            onChange={handleChange("submitterName")}
            placeholder="Enter your full name"
            maxLength={150}
            required
          />
        </label>

        <label className="grievance-field">
          <span>Mobile number</span>
          <input
            type="tel"
            value={form.mobileNumber}
            onChange={handleChange("mobileNumber")}
            placeholder="10-digit mobile number"
            maxLength={15}
          />
        </label>

        <label className="grievance-field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="you@example.com"
            maxLength={150}
          />
        </label>

        <label className="grievance-field">
          <span>UDISE / School ID</span>
          <input
            type="text"
            value={form.schoolId}
            onChange={handleChange("schoolId")}
            placeholder="School UDISE code (optional)"
            maxLength={15}
          />
        </label>

        <label className="grievance-field grievance-field--full">
          <span>School name</span>
          <input
            type="text"
            value={form.schoolName}
            onChange={handleChange("schoolName")}
            placeholder="Name of the school (optional)"
            maxLength={300}
          />
        </label>

        <label className="grievance-field grievance-field--full">
          <span>
            Your feedback <em>*</em>
          </span>
          <textarea
            value={form.feedbackText}
            onChange={handleChange("feedbackText")}
            placeholder="Write your complete feedback, suggestions, or grievance in detail..."
            rows={7}
            maxLength={5000}
            required
          />
          <small className={charCount > 5000 ? "is-error" : ""}>
            {charCount}/5000 characters (minimum 10)
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
          Submit Feedback
        </button>
      </div>
    </form>
  );
}
