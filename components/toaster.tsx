import React, { useState, useCallback } from 'react';

let showToast: (msg: string) => void = () => {};

export function MinimalToaster() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const trigger = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 1500);
  }, []);

  showToast = trigger;

  return visible ? (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        transform: 'translateX(-50%)',
        background: 'black',
        color: 'white',
        padding: '12px 24px',
        borderRadius: 8,
        zIndex: 2147483647,
        fontSize: 16,
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  ) : null;
}

export { showToast }; 