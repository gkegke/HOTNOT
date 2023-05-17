import React from 'react';

const ProgressBar = ({ progress, background }) => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '3px',
      backgroundColor: '#111',
      zIndex: 9999
    }}>
      <div style={{ 
        width: `${progress}%`, 
        height: '100%', 
        backgroundColor: `${background}`, 
      }} />
    </div>
  );
};

export default ProgressBar;
