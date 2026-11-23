const fs = require('fs');
const path = require('path');

const directoryPaths = ['./utils/components', './utils/components/admin', './utils/components/member', './utils/components/common'];

const renames = [
    { target: /Neural/g, replacement: "Smart" },
    { target: /Quantum/g, replacement: "Advanced" },
    { target: /Aether/g, replacement: "Cloud" },
    { target: /Omniscience/g, replacement: "Analytics" },
    { target: /Singularity/g, replacement: "Platform" },
    { target: /Agentic/g, replacement: "Automated" },
    { target: /Ghost/g, replacement: "Visual" }
];

directoryPaths.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            let newFile = file;
            renames.forEach(({ target, replacement }) => {
                newFile = newFile.replace(target, replacement);
            });
            
            if (newFile !== file) {
                const oldPath = path.join(dirPath, file);
                const newPath = path.join(dirPath, newFile);
                if (fs.lstatSync(oldPath).isFile()) {
                    fs.renameSync(oldPath, newPath);
                    console.log(`Renamed: ${oldPath} -> ${newPath}`);
                }
            }
        });
    }
});
