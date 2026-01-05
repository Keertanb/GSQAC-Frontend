import React from "react";
import { Formik, Form } from "formik";

/**
 * Common Formik Wrapper Component
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Object} props.validationSchema - Yup validation schema
 * @param {Function} props.onSubmit - Form submit handler
 * @param {Function} props.children - Render function that receives formik props
 * @param {Object} props.formProps - Additional props to pass to Form component
 * @param {boolean} props.enableReinitialize - Whether to reinitialize form when initialValues change
 */
const FormikWrapper = ({
  initialValues,
  validationSchema,
  onSubmit,
  children,
  formProps = {},
  enableReinitialize = true,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize={enableReinitialize}
    >
      {(formikProps) => (
        <Form {...formProps}>
          {typeof children === "function" ? children(formikProps) : children}
        </Form>
      )}
    </Formik>
  );
};

export default FormikWrapper;

