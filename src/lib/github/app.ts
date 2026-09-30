import { createSign } from 'node:crypto'

const GITHUB_API = 'https://api.github.com'

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function appJwt() {
  const key = required('GITHUB_APP_PRIVATE_KEY').replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 540, iss: required('GITHUB_APP_ID') })).toString('base64url')
  const unsigned = `${header}.${payload}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key, 'base64url')
  return `${unsigned}.${signature}`
}

async function githubFetch<T>(path: string, init: RequestInit = {}, token = appJwt()): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.message || `GitHub API error (${response.status})`)
  return body as T
}

export async function getInstallationToken(installationId: number) {
  const data = await githubFetch<{ token: string }>(`/app/installations/${installationId}/access_tokens`, { method: 'POST' })
  return data.token
}

export async function listInstallationRepositories(installationId: number) {
  const token = await getInstallationToken(installationId)
  return githubFetch<{ repositories: Array<{ id: number; name: string; full_name: string; default_branch: string; private: boolean }> }>(
    '/installation/repositories?per_page=100', {}, token,
  )
}

export async function createProposedPullRequest(input: {
  installationId: number
  owner: string
  repo: string
  base: string
  branch: string
  filePath: string
  content: string
  title: string
  body: string
}) {
  const token = await getInstallationToken(input.installationId)
  const repoPath = `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`
  const ref = await githubFetch<{ object: { sha: string } }>(`${repoPath}/git/ref/heads/${encodeURIComponent(input.base)}`, {}, token)
  const blob = await githubFetch<{ sha: string }>(`${repoPath}/git/blobs`, {
    method: 'POST', body: JSON.stringify({ content: input.content, encoding: 'utf-8' }),
  }, token)
  const tree = await githubFetch<{ sha: string }>(`${repoPath}/git/trees`, {
    method: 'POST', body: JSON.stringify({ base_tree: ref.object.sha, tree: [{ path: input.filePath, mode: '100644', type: 'blob', sha: blob.sha }] }),
  }, token)
  const commit = await githubFetch<{ sha: string }>(`${repoPath}/git/commits`, {
    method: 'POST', body: JSON.stringify({ message: input.title, tree: tree.sha, parents: [ref.object.sha] }),
  }, token)
  await githubFetch(`${repoPath}/git/refs`, {
    method: 'POST', body: JSON.stringify({ ref: `refs/heads/${input.branch}`, sha: commit.sha }),
  }, token)
  return githubFetch<{ number: number; html_url: string }>(`${repoPath}/pulls`, {
    method: 'POST', body: JSON.stringify({ title: input.title, head: input.branch, base: input.base, body: input.body, draft: true }),
  }, token)
}
