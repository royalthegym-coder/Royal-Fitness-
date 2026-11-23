const fs = require('fs');
const path = require('path');

function replaceInDir(dir, replacements) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath, replacements);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const { regex, replace } of replacements) {
                if (regex.test(content)) {
                    content = content.replace(regex, replace);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

const replacements = [
    { regex: /Singularity/g, replace: '100X OMNI-MATRIX' },
    { regex: /SINGULARITY/g, replace: '100X OMNI' },
    { regex: /V\.50 APEX/g, replace: 'V.100 OMNI' },
    { regex: /Signatory V\.50 Neural/g, replace: '100X OMNI-God Neural' },
    { regex: /Apex/g, replace: 'Omni' },
    { regex: /APEX/g, replace: 'OMNI' },
    { regex: /singularityEngine/g, replace: 'omniEngine100x' } // fixing camelcase issue if 'singularity' isn't matched
];

replaceInDir('./utils', replacements);
replaceInDir('./lib', replacements);
