import React, { useState } from "react";

const EEGConnection = () => {
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    setConnected(true);
    alert("EEG Device Connected!");
  };

  return (
    <div className="eeg-container">
      <h1>EEG Device Connection</h1>
      <button onClick={handleConnect} className="connect-btn">
        {connected ? "Connected ✅" : "Connect EEG Device"}
      </button>
    </div>
  );
};

export default EEGConnection;
