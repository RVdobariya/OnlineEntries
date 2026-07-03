(async () => {
  try {
    await import('./index.js');
  } catch (err) {
    console.error(err);
  }
})();