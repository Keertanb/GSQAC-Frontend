import React from "react";
import { useField, ErrorMessage } from "formik";

/**
 * Formik Field Component with Error Display
 * @param {Object} props
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.inputProps - Additional props for input element
 */
const FormikField = ({
  name,
  label,
  required = false,
  type = "text",
  placeholder,
  className = "",
  inputProps = {},
  ...props
}) => {
  const [field, meta] = useField(name);
  const hasError = meta.touched && meta.error;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-label-required">*</span>}
        </label>
      )}
      <input
        {...field}
        {...inputProps}
        type={type}
        placeholder={placeholder}
        className={`form-input ${hasError ? "form-input-error" : ""}`}
      />
      <ErrorMessage name={name} component="div" className="form-error" />
    </div>
  );
};

export default FormikField;

