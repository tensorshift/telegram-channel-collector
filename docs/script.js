(() => {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const isGitHubPages = window.location.hostname.endsWith('.github.io') && pathParts.length > 0;
  const owner = window.location.hostname.replace('.github.io', '');
  const repository = pathParts[0];
  const repositoryUrl = isGitHubPages
    ? `https://github.com/${owner}/${repository}`
    : '#top';

  document.querySelectorAll('[data-repo-link]').forEach(link => {
    link.href = repositoryUrl;
    if (isGitHubPages) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
  });
})();

