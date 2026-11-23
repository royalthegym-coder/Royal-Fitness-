const fs = require('fs');
const path = require('path');

const directoryPath = './utils/components';

const replacements = [
    { target: /Neural Strategy Oracle/gi, replacement: "Strategy Bot" },
    { target: /Premium Neural OS/gi, replacement: "Premium OS" },
    { target: /Neural Subscription Tier/gi, replacement: "Subscription Tier" },
    { target: /Bio-Aether Oracle/gi, replacement: "Bio-Metric Sensor" },
    { target: /Core Neural Sync Logic/gi, replacement: "Core Sync Logic" },
    { target: /rPPG \(Ghost Pulse\)/gi, replacement: "rPPG (Pulse Check)" },
    { target: /Neural Squad Finder/gi, replacement: "Partner Finder" },
    { target: /Neural Efficiency/gi, replacement: "Efficiency" },
    { target: /Compiling Neural Report/gi, replacement: "Compiling Report" },
    { target: /Bio-Aether Oracle Pivot/gi, replacement: "Bio-Metric Pivot" },
    { target: /Neural Analysis/gi, replacement: "Analysis" },
    { target: /Neural Protocol Synthesis/gi, replacement: "Protocol Synthesis" },
    { target: /Neural Handshake/gi, replacement: "Handshake" },
    { target: /Neural Nexus/gi, replacement: "IoT Settings" },
    { target: /Bio-Aether/gi, replacement: "Bio-Metrics" },
    { target: /Neural Mirror/gi, replacement: "Smart Mirror" },
    { target: /My Neural Profile/gi, replacement: "My Profile" },
    { target: /Neural Bottleneck/gi, replacement: "Bottleneck" },
    { target: /Ghost Pulse/gi, replacement: "Pulse" },
    { target: /Establish Neural Communication/gi, replacement: "Establish Communication" },
    { target: /Neural Sync/gi, replacement: "Sync" },
    { target: /Agentic Swarm/gi, replacement: "Automated Bots" },
    { target: /Neural Connection Lost/gi, replacement: "Connection Lost" },
    { target: /Neural Forecast/gi, replacement: "Forecast" },
    { target: /Neural Assistant/gi, replacement: "Assistant" },
    { target: /Neural HRV/gi, replacement: "HRV Snapshot" },
    { target: /Core Neural Load/gi, replacement: "Core Load" },
    { target: /Neural Encryption/gi, replacement: "Encryption" },
    { target: /Personalized Neural Coach/gi, replacement: "Personalized Coach" },
    { target: /'God Tier' Free Vision/gi, replacement: "Free Vision AI" },
    { target: /Awaiting Neural Target/gi, replacement: "Awaiting Target" },
    { target: /Neural Focus/gi, replacement: "Focus Monitor" },
    { target: /Aether Prime Assistant/gi, replacement: "Primary Assistant" },
    { target: /Neural Tools/gi, replacement: "Smart Tools" },
    { target: /QuantumCore/gi, replacement: "CoreSystem" },
    { target: /Quantum/gi, replacement: "Advanced" },
    { target: /God Tier/gi, replacement: "Advanced" },
    { target: /Omniscience/gi, replacement: "Analytics" },
    { target: /Ghost Sensor/gi, replacement: "Camera Sensor" },
    { target: /Ghost/gi, replacement: "Visual" }
];

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            replacements.forEach(({ target, replacement }) => {
                if (target.test(content)) {
                    content = content.replace(target, replacement);
                    modified = true;
                }
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(directoryPath);
