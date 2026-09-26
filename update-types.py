import os
import re

filepath = 'src/lib/qa/ai/index.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

replacement = '''
  evidence?: {
    id: string
    type: 'playwright' | 'network' | 'console' | 'screenshot' | 'dom' | 'trace'
    reason: string
  }[]
  _meta?: {
    tokens_input?: number
    tokens_output?: number
    duration_ms?: number
    cost_usd?: number
    model?: string
  }
}
'''
c = re.sub(r"  evidence\?: \{[\s\S]*?\} \[\]\n\}", replacement, c)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated QAAIDiagnostic type")
