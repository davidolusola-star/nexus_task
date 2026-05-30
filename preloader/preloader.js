// Preloader Handler
(function() {
  const preloader = document.querySelector('.preloader');

  // Minimum display time (prevents flash on fast connections)
  const MIN_DISPLAY_TIME = 1000; // 1 second
  const startTime = Date.now();

  function hidePreloader() {
    if (!preloader) return;

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    setTimeout(() => {
      // Add fade out animation
      preloader.style.transition = 'opacity 0.5s ease-out, visibility 0.5s';
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';

      // Remove from DOM after animation completes
      setTimeout(() => {
        if (preloader.parentNode) {
          preloader.remove();
        }
      }, 500);
    }, remaining);
  }

  // Hide preloader when page is fully loaded
  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader);
  }

  // Fallback: force hide after 5 seconds
  setTimeout(() => {
    if (preloader && preloader.parentNode) {
      hidePreloader();
    }
  }, 5000);
})();