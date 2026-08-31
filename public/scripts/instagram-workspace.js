const scripts = [
  '/scripts/instagram-workspace-core.js',
  '/scripts/instagram-workspace-renderer-primitives.js',
  '/scripts/instagram-workspace-renderer-layouts.js',
  '/scripts/instagram-workspace-actions.js',
];

for (const source of scripts) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = false;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error(`Instagram Studio could not load ${source}.`)),
      { once: true },
    );
    document.head.append(script);
  });
}
