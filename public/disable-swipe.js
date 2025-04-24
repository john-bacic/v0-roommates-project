// Disable horizontal swipe navigation for PWA while allowing vertical scrolling
document.addEventListener('touchstart', function(event) {
  // Only prevent horizontal edge swipes in standalone mode (PWA)
  if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
    // Check if the touch is starting from the left or right edge of the screen
    if (event.touches[0].pageX <= 10 || event.touches[0].pageX >= window.innerWidth - 10) {
      // Only prevent default for horizontal movements
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

// Allow pull-to-refresh but prevent overscroll bounce
document.addEventListener('touchmove', function(event) {
  // We're not preventing default here to allow scrolling
  // The CSS overscroll-behavior-x: none will handle the horizontal overscroll
}, { passive: true });
