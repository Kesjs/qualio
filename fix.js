const fs = require('fs');
function fix(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import Link from 'next\/link';\n*/g, '');
    content = content.replace(/import Link from "next\/link";\n*/g, '');
    content = 'import Link from "next/link";\n' + content;
    fs.writeFileSync(file, content);
}
fix('src/components/dashboard/Sidebar.tsx');
fix('src/components/dashboard/AccountMenu.tsx');
