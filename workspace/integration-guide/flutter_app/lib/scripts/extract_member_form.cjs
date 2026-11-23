const extract = require('fs').readFileSync('utils/components/Members.tsx', 'utf-8').split('\n');
const memberFormCode = extract.slice(29, 668).join('\n');
require('fs').writeFileSync('utils/components/MemberForm.tsx', memberFormCode);
