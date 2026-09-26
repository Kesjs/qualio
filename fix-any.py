import os

def replace(filepath, bad, good):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(bad, good)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix implicit any
replace('src/components/dashboard/Header.tsx', ".then(({ data }) =>", ".then((res) => { const { data } = res;")
replace('src/components/dashboard/Header.tsx', "if (data.user) {", "if (data && data.user) {")
replace('src/components/dashboard/Header.tsx', "setUserEmail(data.user.email ?? null)\n      }", "setUserEmail(data.user.email ?? null)\n      }\n    })")

replace('src/app/dashboard/settings/page.tsx', ".then(({ data }) =>", ".then((res) => { const { data } = res;")
replace('src/app/dashboard/settings/page.tsx', "if (data.user) {", "if (data && data.user) {")
replace('src/app/dashboard/settings/page.tsx', "setUserEmail(data.user.email ?? null)\n      }", "setUserEmail(data.user.email ?? null)\n      }\n    })")
print("Any type fixed.")
