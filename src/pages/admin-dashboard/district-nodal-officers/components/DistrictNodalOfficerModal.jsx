import React, { useEffect, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import FormikWrapper from "../../../../components/FormikWrapper/FormikWrapper";
import FormikField from "../../../../components/FormikWrapper/FormikField";
import { sanitizeMobileNumber } from "../utils/districtNodalOfficersUtils";

export function DistrictNodalOfficerModal({
  open,
  editingOfficer,
  onClose,
  getInitialValues,
  validationSchema,
  onSubmit,
  districtsLoading,
  districts,
  upsertMutation,
}) {
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowPassword(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingOfficer ? "Edit Nodal Officer" : "Add Nodal Officer"}
          </h2>
          <button type="button" onClick={onClose} className="modal-close-button">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <FormikWrapper
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          enableReinitialize={true}
          formProps={{ className: "modal-form" }}
        >
          {(formik) => (
            <>
              <FormikField
                name="userName"
                label="User Name"
                required
                placeholder="Enter user name"
              />

              <div className="form-group">
                <label className="form-label">
                  Mobile Number
                  <span className="form-label-required">*</span>
                </label>
                <input
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={formik.values.mobileNumber}
                  onChange={(e) => {
                    const sanitized = sanitizeMobileNumber(e.target.value);
                    formik.setFieldValue("mobileNumber", sanitized);
                    if (formik.errors.mobileNumber) {
                      formik.setFieldError("mobileNumber", undefined);
                    }
                  }}
                  onBlur={() => formik.setFieldTouched("mobileNumber", true)}
                  className={`form-input ${
                    formik.touched.mobileNumber && formik.errors.mobileNumber
                      ? "form-input-error"
                      : ""
                  }`}
                  aria-invalid={
                    !!(formik.touched.mobileNumber && formik.errors.mobileNumber)
                  }
                  aria-describedby={
                    formik.touched.mobileNumber && formik.errors.mobileNumber
                      ? "nodal-officer-mobile-number-error"
                      : undefined
                  }
                />
                {formik.touched.mobileNumber && formik.errors.mobileNumber && (
                  <div
                    id="nodal-officer-mobile-number-error"
                    className="form-error"
                    role="alert"
                  >
                    {formik.errors.mobileNumber}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password
                  <span className="form-label-required">*</span>
                </label>
                <div className="nodal-officer-password-input-wrap">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={7}
                    placeholder={
                      editingOfficer
                        ? "Update password (more than 6 characters)"
                        : "Enter password (more than 6 characters)"
                    }
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={() => formik.setFieldTouched("password", true)}
                    className={`form-input form-input-password ${
                      formik.touched.password && formik.errors.password
                        ? "form-input-error"
                        : ""
                    }`}
                    aria-invalid={
                      !!(formik.touched.password && formik.errors.password)
                    }
                    aria-describedby={
                      formik.touched.password && formik.errors.password
                        ? "nodal-officer-password-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    className="nodal-officer-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: 20 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 20 }} />
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <div
                    id="nodal-officer-password-error"
                    className="form-error"
                    role="alert"
                  >
                    {formik.errors.password}
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="form-label-container">
                  <label className="form-label">
                    Districts <span className="form-label-required">*</span>
                  </label>
                  {formik.values.districts?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        formik.setFieldValue("districts", []);
                      }}
                      className="clear-districts-button"
                      title="Clear all districts"
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {districtsLoading ? (
                  <div className="form-loading">Loading districts...</div>
                ) : (
                  <div className="district-multiselect-container">
                    <div className="district-multiselect">
                      {districts.map((district) => {
                        const isSelected = formik.values.districts?.includes(
                          district.value,
                        );
                        return (
                          <label
                            key={district.value}
                            className={`district-checkbox-label ${
                              isSelected ? "district-checkbox-selected" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const districtValueNum = Number(district.value);
                                const currentDistricts =
                                  formik.values.districts || [];
                                const selected = currentDistricts.includes(
                                  districtValueNum,
                                );

                                if (selected) {
                                  formik.setFieldValue(
                                    "districts",
                                    currentDistricts.filter(
                                      (id) => id !== districtValueNum,
                                    ),
                                  );
                                } else {
                                  formik.setFieldValue("districts", [
                                    ...currentDistricts,
                                    districtValueNum,
                                  ]);
                                }
                              }}
                              className="district-checkbox"
                            />
                            <span className="district-checkbox-text">
                              {district.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {formik.values.districts?.length > 0 && (
                      <div className="selected-districts-info">
                        {formik.values.districts.length} district
                        {formik.values.districts.length > 1 ? "s" : ""} selected
                      </div>
                    )}
                    {formik.touched.districts && formik.errors.districts && (
                      <div className="form-error">{formik.errors.districts}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="isActive"
                  value={formik.values.isActive}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="form-select"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="modal-button modal-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting || upsertMutation.isPending}
                  className="modal-button modal-button-submit"
                >
                  {formik.isSubmitting || upsertMutation.isPending
                    ? "Saving..."
                    : editingOfficer
                      ? "Update"
                      : "Add"}
                </button>
              </div>
            </>
          )}
        </FormikWrapper>
      </div>
    </div>
  );
}
