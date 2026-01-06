import React from "react";
import "./AppButton.css";

/**
 * Common Button Component
 * @param {Object} props
 * @param {string} props.variant - Color variant: 'blue', 'green', 'red', 'gray', etc.
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'icon'
 * @param {React.ReactNode} props.children - Button content
 * @param {React.ReactNode} props.icon - Icon to display (optional)
 * @param {boolean} props.iconOnly - If true, shows only icon without text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disabled state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 */
const AppButton = ({
  variant = "blue",
  size = "md",
  children,
  icon,
  iconOnly = false,
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) => {
  // Build class names
  const buttonClasses = [
    "app-button",
    `app-button-${variant}`,
    `app-button-${size}`,
    iconOnly ? "icon-only" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <span
          className={
            iconOnly
              ? "app-button-icon-wrapper"
              : "app-button-icon-wrapper app-button-icon-rotate"
          }
        >
          {icon}
        </span>
      )}

      {/* Text (only if not iconOnly) */}
      {!iconOnly && children && <span>{children}</span>}
    </button>
  );
};

export default AppButton;

