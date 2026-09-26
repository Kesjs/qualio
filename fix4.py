import os

def prepend(filepath, text):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if text.strip().split('\n')[0] not in content:
        content = content.replace("'use client'\n", f"'use client'\n{text}\n")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

prepend('src/app/dashboard/sites/page.tsx', "import { useState, useMemo } from 'react'\nimport Link from 'next/link'\nimport { formatDistanceToNow } from 'date-fns'")
prepend('src/components/dashboard/AddSiteModal.tsx', "import { useState, useEffect } from 'react'")
prepend('src/components/dashboard/EvidenceDrawer.tsx', "import { useState, useEffect } from 'react'")
prepend('src/components/dashboard/RunScanModal.tsx', "import { useState, useEffect } from 'react'")
print("Added back missing imports")
