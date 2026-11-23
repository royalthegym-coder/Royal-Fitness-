const fs = require('fs');
let code = fs.readFileSync('utils/components/ScientificAdmissionForm.tsx', 'utf-8');

code = code.replace(/formValues\.selectedInventory/g, "selectedInventory");
code = code.replace(/formValues\.medicalReports/g, "medicalReports");
code = code.replace(/setFormData/g, "//setFormData"); // comment out the old setFormData if any left
code = code.replace(/formData\.gender/g, "String(formValues.gender)"); // line 460 error

fs.writeFileSync('utils/components/ScientificAdmissionForm.tsx', code);
