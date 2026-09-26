import os

def replace(filepath, bad, good):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(bad, good)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace('src/components/dashboard/RunScanModal.tsx', "setChecks((prev) =>", "setChecks((prev: any) =>")
replace('src/app/dashboard/sites/page.tsx', "filteredSites.map((site) =>", "filteredSites.map((site: any) =>")

print("Fixed implicit any")
