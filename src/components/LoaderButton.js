import React from "react";
import Button from "react-bootstrap/Button";
import "./LoaderButton.css";

export default function LoaderButton({
  isLoading,
  variant,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <Button
      variant={variant}
      className={`LoaderButton ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <i className="fas fa-spinner spinning" />}
      {props.children}
    </Button>
  );
}
