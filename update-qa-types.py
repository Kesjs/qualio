import os
import re

filepath = 'src/lib/qa/types/index.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

issue_repl = '''  export interface Issue {
    id: string
    scanId: string
    pageId: string | null
    category: CheckCategory
    severity: IssueSeverity
    title: string
    description: string
    suggestion: string
    confidence: Confidence
    status: IssueStatus
    aiTokensInput?: number
    aiTokensOutput?: number
    aiCostUsd?: number
    aiDurationMs?: number
    aiModel?: string'''
c = re.sub(r"  export interface Issue \{[\s\S]*?status: IssueStatus", issue_repl, c)

scan_repl = '''export interface ScanResult {
  scanId: string
  siteId: string
  status: 'completed' | 'failed'
  pages: Page[]
  checks: CheckResult[]
  issues: Issue[]
  summary: string
  error?: string
  aiCallsCount?: number
  aiTokensInput?: number
  aiTokensOutput?: number
  aiCostUsd?: number
  aiDurationMs?: number'''
c = re.sub(r"export interface ScanResult \{[\s\S]*?error\?: string", scan_repl, c)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated QA types")
