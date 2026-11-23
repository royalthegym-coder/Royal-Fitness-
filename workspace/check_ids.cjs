const fs = require('fs');
const sidebar = fs.readFileSync('./utils/components/Sidebar.tsx', 'utf8');
const appcontent = fs.readFileSync('./utils/components/AppContent.tsx', 'utf8');

const sidebarRegex = /id:\s*'([^']+)'/g;
let sidebarMatch;
const sidebarIDs = new Set();
while ((sidebarMatch = sidebarRegex.exec(sidebar)) !== null) {
  sidebarIDs.add(sidebarMatch[1]);
}

const appRegex = /case\s*'([^']+)'/g;
let appMatch;
const appIDs = new Set();
while ((appMatch = appRegex.exec(appcontent)) !== null) {
  appIDs.add(appMatch[1]);
}

const missing = [];
for (let id of sidebarIDs) {
  if (!appIDs.has(id)) {
    missing.push(id);
  }
}
console.log(missing.join('\n'));
