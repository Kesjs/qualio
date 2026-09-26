import os
import re

def fix(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("import { formatDistanceToNow } from 'date-fns'", "", 1) # remove the first one
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix('src/app/dashboard/sites/page.tsx')
print("Fixed duplicate import")
