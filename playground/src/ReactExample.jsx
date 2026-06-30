import React from "react";
import { useUnimask } from "unimask/react";

function ReactExample() {
  // Using the useUnimask hook with a phone number mask
  const { value, onInput } = useUnimask("(###) ###-####");

  const handleInput = (e) => {
    onInput(e);
  };

  return (
    <div className="card">
      <h3>React Example - Phone Mask</h3>
      <p>Format: (###) ###-####</p>
      <input type="text" value={value} onChange={handleInput} placeholder="(###) ###-####" />
      <div className="placeholder">Current value: {value || "Empty"}</div>
      <div className="placeholder">Try typing a phone number like 1234567890</div>
    </div>
  );
}

export default ReactExample;
