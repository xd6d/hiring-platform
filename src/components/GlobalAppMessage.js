import React, { useEffect, useState } from 'react';

const GlobalAppMessage = ({ trigger }) => {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setMessage(trigger);
      setVisible(true);
      const timeout = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 bg-opacity-40 text-green-700 px-6 py-3 rounded shadow-lg z-50 transition-all duration-500 ease-in-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      {message}
    </div>
  );
};

export default GlobalAppMessage;