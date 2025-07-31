import React from "react";
import "./SubmitButton.css";

type SubmitButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

const SubmitButton: React.FC<SubmitButtonProps> = ({ onClick, disabled }) => {
  return (
    <button className="submit-button" onClick={onClick} disabled={disabled}>
      Compute
    </button>
  );
};

export default SubmitButton;
