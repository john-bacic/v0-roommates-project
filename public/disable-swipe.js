// Disable swipe navigation for PWA
document.addEventListener('touchstart', function(event) {
  // Prevent swipe navigation if in standalone mode (PWA)
  if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
    // Check if the touch is starting from the edge of the screen (common for swipe navigation)
    if (event.touches[0].pageX <= 10 || event.touches[0].pageX >= window.innerWidth - 10) {
      event.preventDefault();
    }
  }
}, { passive: false });

// Disable pull-to-refresh
document.addEventListener('touchmove', function(event) {
  if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
    // Prevent pull-to-refresh behavior
    if (document.scrollingElement.scrollTop === 0 && event.touches[0].clientY > 0) {
      event.preventDefault();
    }
  }
}, { passive: false });
