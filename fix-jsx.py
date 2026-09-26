import os

def replace(filepath, bad, good):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(bad, good)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# src/app/dashboard/sites/page.tsx
p = 'src/app/dashboard/sites/page.tsx'
replace(p, '<Loader2', '<ArrowPathIcon')
replace(p, '<Play ', '<PlayIcon ')
replace(p, '<ChevronDown', '<ChevronDownIcon')
replace(p, '<Radar', '<SignalIcon')
replace(p, '<ArrowUpRight', '<ArrowUpRightIcon')

# src/components/dashboard/EvidenceDrawer.tsx
p = 'src/components/dashboard/EvidenceDrawer.tsx'
replace(p, '<Check ', '<CheckIcon ')
replace(p, '<Copy ', '<ClipboardDocumentIcon ')
replace(p, '<Minimize2', '<ArrowsPointingInIcon')
replace(p, '<Maximize2', '<ArrowsPointingOutIcon')
replace(p, '<FileCode', '<CodeBracketIcon')

# src/components/dashboard/RunScanModal.tsx
p = 'src/components/dashboard/RunScanModal.tsx'
replace(p, '<AlertCircle', '<ExclamationCircleIcon')
replace(p, '<CheckSquare', '<CheckCircleIcon')

print("Fixed JSX tags")
