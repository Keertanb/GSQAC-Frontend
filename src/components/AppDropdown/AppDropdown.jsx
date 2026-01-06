import React, { useState, useRef, useEffect } from "react";
import "./AppDropdown.css";

/**
 * Common Dropdown Component
 * @param {Object} props
 * @param {Array} props.options - Array of options { value, label } or { value, name }
 * @param {string|number} props.value - Selected value
 * @param {Function} props.onChange - Change handler (value) => void
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Label text
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.valueKey - Key for value in options (default: 'value')
 * @param {string} props.labelKey - Key for label in options (default: 'label' or 'name')
 */
const AppDropdown = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  label,
  disabled = false,
  className = "",
  valueKey = "value",
  labelKey = "label",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Get selected option label
  const getSelectedLabel = () => {
    if (!value) return placeholder;
    const selectedOption = options.find(
      (option) => String(option[valueKey]) === String(value)
    );
    return selectedOption
      ? selectedOption[labelKey] || selectedOption.name || selectedOption.label
      : placeholder;
  };

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  const selectedLabel = getSelectedLabel();
  const hasValue = value !== "" && value !== null && value !== undefined;

  return (
    <div
      className={`app-dropdown-container ${className}`}
      ref={dropdownRef}
      {...props}
    >
      {label && <label className="app-dropdown-label">{label}</label>}
      <div
        className={`app-dropdown ${disabled ? "disabled" : ""} ${
          isOpen ? "open" : ""
        } ${hasValue ? "has-value" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="app-dropdown-selected">{selectedLabel}</span>
        <svg
          className={`app-dropdown-arrow ${isOpen ? "open" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isOpen && !disabled && (
        <div className="app-dropdown-menu">
          {options.length === 0 ? (
            <div className="app-dropdown-empty">No options available</div>
          ) : (
            options.map((option) => {
              const optionValue = option[valueKey];
              const optionLabel =
                option[labelKey] || option.name || option.label || optionValue;
              const isSelected =
                String(optionValue) === String(value) && hasValue;

              return (
                <div
                  key={optionValue}
                  className={`app-dropdown-option ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(optionValue)}
                >
                  {optionLabel}
                  {isSelected && (
                    <svg
                      className="app-dropdown-check"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AppDropdown;

