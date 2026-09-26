const fs = require('fs');
const filepath = 'src/app/dashboard/sites/[siteId]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Ensure CameraIcon and CommandLineIcon are imported from heroicons
if (!content.includes('CameraIcon')) {
  content = content.replace(/from '@heroicons\/react\/24\/outline'/, ', CameraIcon, CommandLineIcon $&');
}
fs.writeFileSync(filepath, content, 'utf8');
