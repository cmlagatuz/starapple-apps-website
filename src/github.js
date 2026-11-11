const byId = id => document.getElementById(id);
export async function initGithub() {
  const config = window.STARAPPLE_CONFIG || {};
  const owner = typeof config.githubOwner === 'string' && /^[\w-]{1,39}$/.test(config.githubOwner) ? config.githubOwner : '';
  const link = byId('github-profile-link');
  if (!owner) { setUnavailable('Set githubOwner in public/site-config.js to connect your profile.'); return; }
  const profile = `https://github.com/${encodeURIComponent(owner)}`;
  link.href = profile;
  byId('footer-github').href = profile;
  byId('github-description').textContent = `Showing public repositories for @${owner}.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const info = await fetch(`https://api.github.com/users/${encodeURIComponent(owner)}`, { headers, signal: controller.signal });
    if (!info.ok) throw new Error(info.status === 403 ? 'GitHub public API rate limit reached.' : 'GitHub profile is unavailable.');
    const profileData = await info.json();
    const type = profileData.type === 'Organization' ? 'orgs' : 'users';
    const result = await fetch(`https://api.github.com/${type}/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated&type=${type === 'orgs' ? 'public' : 'owner'}`, { headers, signal: controller.signal });
    if (!result.ok) throw new Error(result.status === 403 ? 'GitHub public API rate limit reached.' : 'Repository activity is unavailable.');
    const repos = await result.json();
    if (!Array.isArray(repos)) throw new Error('Unexpected GitHub response.');
    byId('stat-repos').textContent = String(repos.length);
    byId('stat-stars').textContent = String(repos.reduce((sum, repo) => sum + (Number(repo.stargazers_count) || 0), 0));
    const newest = repos.map(r => r.pushed_at).filter(Boolean).sort().at(-1);
    byId('stat-activity').textContent = newest ? new Date(newest).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No pushes';
    byId('github-status').textContent = 'Public API connected';
    byId('github-description').textContent = `${repos.length === 100 ? 'Latest 100' : repos.length} public ${repos.length === 1 ? 'repository' : 'repositories'} from @${owner}`;
    renderRepos(repos.slice().sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0)).slice(0, 3));
  } catch (err) { setUnavailable(err.name === 'AbortError' ? 'GitHub request timed out.' : err.message); }
  finally { clearTimeout(timeout); }
}
function setUnavailable(message) {
  byId('github-status').textContent = 'Currently unavailable';
  byId('github-description').textContent = message;
  byId('stat-repos').textContent = '—'; byId('stat-stars').textContent = '—'; byId('stat-activity').textContent = '—';
}
function renderRepos(repos) {
  const host = byId('github-repo-list'); host.replaceChildren();
  for (const repo of repos) {
    const card = document.createElement('a');
    card.className = 'repo-card';
    if (typeof repo.html_url !== 'string' || !/^https:\/\/github\.com\//.test(repo.html_url)) continue;
    card.href = repo.html_url; card.target = '_blank'; card.rel = 'noopener noreferrer';
    const name = document.createElement('strong'); name.textContent = `${repo.name} ↗`;
    const desc = document.createElement('span'); desc.textContent = repo.description || 'Public repository';
    const language = document.createElement('span'); language.className = 'repo-language'; language.textContent = repo.language ? `${repo.language}  ·  ★ ${repo.stargazers_count || 0}` : `★ ${repo.stargazers_count || 0}`;
    card.append(name, desc, language); host.appendChild(card);
  }
}
