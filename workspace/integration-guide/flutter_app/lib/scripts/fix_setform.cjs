const fs = require('fs');
let code = fs.readFileSync('utils/components/ScientificAdmissionForm.tsx', 'utf-8');

code = code.replace(/\/\/setFormData/g, "setFormData");
// wait! I need to ensure it uses the new states.
code = code.replace(/setFormData\(prev => \(\{[\n\s]*\.\.\.prev,[\n\s]*selectedInventory:\s*prev\.selectedInventory\.filter\(([^)]+)\)[\n\s]*\}\)\)/g, "setSelectedInventory(selectedInventory.filter($1))");
code = code.replace(/setFormData\(prev => \(\{[\n\s]*\.\.\.prev,[\n\s]*selectedInventory:\s*\[\.\.\.prev\.selectedInventory,([^\]]+)\][\n\s]*\}\)\)/g, "setSelectedInventory([...selectedInventory, $1])");

code = code.replace(/setFormData\(prev => \(\{[\n\s]*\.\.\.prev,[\n\s]*([a-zA-Z0-9]+):\s*([^}]+)[\n\s]*\}\)\)/g, "setValue('$1', $2)");

fs.writeFileSync('utils/components/ScientificAdmissionForm.tsx', code);
