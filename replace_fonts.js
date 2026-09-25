const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Global replace for Geist
    content = content.replace(/Geist_Mono/g, "JetBrains_Mono");
    content = content.replace(/geistMono/g, "jetbrainsMono");
    content = content.replace(/Geist Mono/gi, "JetBrains Mono");
    content = content.replace(/geist-mono/gi, "jetbrains-mono");
    
    content = content.replace(/Geist/g, "Manrope");
    content = content.replace(/geist/g, "manrope");
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
