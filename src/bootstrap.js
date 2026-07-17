(() => {
  const notice = document.querySelector('#runtime-notice');

  if (window.location.protocol === 'file:') {
    if (notice) notice.hidden = false;
    document.documentElement.classList.add('direct-file-mode');
    return;
  }

  import('./app.js').catch((error) => {
    console.error('Prompteur failed to start.', error);
    if (notice) {
      notice.hidden = false;
      notice.querySelector('strong').textContent = 'Prompteur could not start.';
      notice.querySelector('span').textContent = 'Refresh the page or run the project through its local Node server.';
    }
  });
})();
