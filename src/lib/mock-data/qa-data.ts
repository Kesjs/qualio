import { Site, QAScan, Issue, Check, PageResult, Evidence } from '@/lib/types/qa'

// Mock Evidence
const mockEvidence: Evidence[] = [
  {
    type: 'network',
    content: 'POST /api/contact → HTTP 500',
    description: 'Form submission failed with server error',
    timestamp: '2024-03-15T10:30:15Z'
  },
  {
    type: 'screenshot',
    content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    description: 'Form with submit button visible',
    timestamp: '2024-03-15T10:30:10Z'
  },
  {
    type: 'console',
    content: 'TypeError: Cannot read property "submit" of null',
    description: 'JavaScript error during form submission',
    timestamp: '2024-03-15T10:30:12Z'
  }
]

// Mock Issues
const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    severity: 'critical',
    category: 'forms',
    title: 'Contact form fails on submission',
    url: '/contact',
    description: 'The contact form submits successfully but the server returns a 500 error, preventing users from sending messages.',
    observedResult: 'POST /api/contact returns HTTP 500',
    evidence: mockEvidence,
    suggestion: 'Check server logs and API endpoint configuration'
  },
  {
    id: 'issue-2',
    severity: 'critical',
    category: 'pages',
    title: 'Pricing page returns 404',
    url: '/pricing',
    description: 'The pricing page is not accessible and returns a 404 error.',
    observedResult: 'GET /pricing returns HTTP 404',
    evidence: [mockEvidence[1]],
    suggestion: 'Verify the pricing page exists and is properly configured'
  },
  {
    id: 'issue-3',
    severity: 'major',
    category: 'responsive',
    title: 'Mobile navigation overflow',
    url: '/',
    description: 'The mobile navigation menu overflows on small screens, making some items inaccessible.',
    observedResult: 'Navigation width exceeds viewport on mobile',
    evidence: [mockEvidence[1]],
    suggestion: 'Adjust mobile CSS for navigation container'
  },
  {
    id: 'issue-4',
    severity: 'major',
    category: 'browser',
    title: 'JavaScript error on homepage',
    url: '/',
    description: 'Uncaught JavaScript error prevents some interactive features from working.',
    observedResult: 'TypeError: Cannot read property "addEventListener" of null',
    evidence: [mockEvidence[2]],
    suggestion: 'Fix JavaScript error in main.js'
  }
]

// Mock Pages
const mockPages: PageResult[] = [
  {
    url: '/',
    status: 200,
    title: 'ACME Construction - Home',
    checks: [
      { id: 'check-1', category: 'pages', name: 'HTTP Status', status: 'passed' },
      { id: 'check-2', category: 'seo', name: 'Page Title', status: 'passed' },
      { id: 'check-3', category: 'browser', name: 'Console Errors', status: 'failed', message: 'JavaScript error found' }
    ],
    issues: [mockIssues[2], mockIssues[3]]
  },
  {
    url: '/about',
    status: 200,
    title: 'About Us - ACME Construction',
    checks: [
      { id: 'check-4', category: 'pages', name: 'HTTP Status', status: 'passed' },
      { id: 'check-5', category: 'seo', name: 'Page Title', status: 'passed' },
      { id: 'check-6', category: 'accessibility', name: 'Alt Text', status: 'warning', message: 'Some images missing alt text' }
    ],
    issues: []
  },
  {
    url: '/services',
    status: 200,
    title: 'Services - ACME Construction',
    checks: [
      { id: 'check-7', category: 'pages', name: 'HTTP Status', status: 'passed' },
      { id: 'check-8', category: 'seo', name: 'Page Title', status: 'passed' }
    ],
    issues: []
  },
  {
    url: '/contact',
    status: 200,
    title: 'Contact - ACME Construction',
    checks: [
      { id: 'check-9', category: 'pages', name: 'HTTP Status', status: 'passed' },
      { id: 'check-10', category: 'forms', name: 'Form Submission', status: 'failed', message: 'Server error on submit' }
    ],
    issues: [mockIssues[0]]
  },
  {
    url: '/pricing',
    status: 404,
    title: 'Page Not Found',
    checks: [
      { id: 'check-11', category: 'pages', name: 'HTTP Status', status: 'failed', message: 'Page not found' }
    ],
    issues: [mockIssues[1]]
  }
]

// Mock QA Scans
export const mockQAScans: QAScan[] = [
  {
    id: 'scan-1',
    siteId: 'site-1',
    status: 'completed',
    startTime: '2024-03-15T10:25:00Z',
    endTime: '2024-03-15T10:33:42Z',
    duration: '8m 42s',
    pagesDiscovered: 31,
    totalChecks: 184,
    passed: 169,
    warnings: 11,
    issues: 4,
    pages: mockPages,
    allIssues: mockIssues,
    checks: []
  },
  {
    id: 'scan-2',
    siteId: 'site-1',
    status: 'completed',
    startTime: '2024-03-14T15:20:00Z',
    endTime: '2024-03-14T15:28:15Z',
    duration: '8m 15s',
    pagesDiscovered: 31,
    totalChecks: 184,
    passed: 167,
    warnings: 13,
    issues: 4,
    pages: mockPages,
    allIssues: mockIssues,
    checks: []
  }
]

// Mock Sites
export const mockSites: Site[] = [
  {
    id: 'site-1',
    name: 'ACME Construction',
    url: 'https://acme.com',
    createdAt: '2024-03-10T09:00:00Z',
    lastScan: mockQAScans[0],
    scanHistory: mockQAScans
  },
  {
    id: 'site-2',
    name: 'Startup Landing',
    url: 'https://mystartup.io',
    createdAt: '2024-03-12T14:30:00Z',
    lastScan: {
      id: 'scan-3',
      siteId: 'site-2',
      status: 'completed',
      startTime: '2024-03-15T09:15:00Z',
      endTime: '2024-03-15T09:22:30Z',
      duration: '7m 30s',
      pagesDiscovered: 12,
      totalChecks: 89,
      passed: 87,
      warnings: 2,
      issues: 0,
      pages: [],
      allIssues: [],
      checks: []
    },
    scanHistory: []
  },
  {
    id: 'site-3',
    name: 'E-commerce Store',
    url: 'https://shop.example.com',
    createdAt: '2024-03-08T11:15:00Z',
    lastScan: {
      id: 'scan-4',
      siteId: 'site-3',
      status: 'completed',
      startTime: '2024-03-14T16:00:00Z',
      endTime: '2024-03-14T16:15:45Z',
      duration: '15m 45s',
      pagesDiscovered: 67,
      totalChecks: 234,
      passed: 210,
      warnings: 12,
      issues: 12,
      pages: [],
      allIssues: [],
      checks: []
    },
    scanHistory: []
  }
]

// Fonction utilitaire pour obtenir un site par ID
export function getSiteById(id: string): Site | undefined {
  return mockSites.find(site => site.id === id)
}

// Fonction utilitaire pour obtenir un scan par ID
export function getScanById(siteId: string, scanId: string): QAScan | undefined {
  const site = getSiteById(siteId)
  if (!site) return undefined
  
  return site.scanHistory.find(scan => scan.id === scanId) || 
         (site.lastScan?.id === scanId ? site.lastScan : undefined)
}