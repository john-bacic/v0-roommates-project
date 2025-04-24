// Enhanced swipe prevention for Safari on iPhone PWA
(function() {
  // Check if we're in a PWA context
  const isPwa = () => {
    return window.navigator.standalone || 
           window.matchMedia('(display-mode: standalone)').matches;
  };

  // Check if we're on iOS Safari
  const isIosSafari = () => {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    return iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/OPiOS/i);
  };

  // Create a transparent overlay div that will capture edge swipes
  if (isPwa() && isIosSafari()) {
    // Create left edge swipe blocker
    const leftBlocker = document.createElement('div');
    leftBlocker.style.position = 'fixed';
    leftBlocker.style.top = '0';
    leftBlocker.style.left = '0';
    leftBlocker.style.width = '20px';
    leftBlocker.style.height = '100%';
    leftBlocker.style.zIndex = '9999';
    leftBlocker.style.backgroundColor = 'transparent';
    document.body.appendChild(leftBlocker);

    // Create right edge swipe blocker
    const rightBlocker = document.createElement('div');
    rightBlocker.style.position = 'fixed';
    rightBlocker.style.top = '0';
    rightBlocker.style.right = '0';
    rightBlocker.style.width = '20px';
    rightBlocker.style.height = '100%';
    rightBlocker.style.zIndex = '9999';
    rightBlocker.style.backgroundColor = 'transparent';
    document.body.appendChild(rightBlocker);

    // Add event listeners to both blockers
    [leftBlocker, rightBlocker].forEach(blocker => {
      blocker.addEventListener('touchstart', function(e) {
        e.preventDefault();
      }, { passive: false });
      
      blocker.addEventListener('touchmove', function(e) {
        e.preventDefault();
      }, { passive: false });
      
      blocker.addEventListener('touchend', function(e) {
        e.preventDefault();
      }, { passive: false });
    });
  }

  // General swipe prevention for all browsers
  document.addEventListener('touchstart', function(event) {
    // Only prevent horizontal edge swipes in standalone mode (PWA)
    if (isPwa()) {
      // Check if the touch is starting from the left or right edge of the screen
      if (event.touches[0].pageX <= 15 || event.touches[0].pageX >= window.innerWidth - 15) {
        const initialX = event.touches[0].pageX;
        const initialY = event.touches[0].pageY;
        
        const touchMoveHandler = function(moveEvent) {
          if (moveEvent.touches.length > 0) {
            const deltaX = Math.abs(moveEvent.touches[0].pageX - initialX);
            const deltaY = Math.abs(moveEvent.touches[0].pageY - initialY);
            
            // If horizontal movement is greater than vertical, prevent it
            if (deltaX > deltaY) {
              moveEvent.preventDefault();
            }
          }
        };
        
        const touchEndHandler = function() {
          document.removeEventListener('touchmove', touchMoveHandler);
          document.removeEventListener('touchend', touchEndHandler);
        };
        
        document.addEventListener('touchmove', touchMoveHandler, { passive: false });
        document.addEventListener('touchend', touchEndHandler);
      }
    }
  }, { passive: true });

  // Prevent Safari's elastic overscroll effect
  document.addEventListener('gesturestart', function(e) {
    if (isPwa() && isIosSafari()) {
      e.preventDefault();
    }
  }, { passive: false });
})();

