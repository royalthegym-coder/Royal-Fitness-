const fs = require('fs');
let code = fs.readFileSync('utils/components/ScientificAdmissionForm.tsx', 'utf-8');

code = code.replace("formValues.medicalReports.reduce(", "medicalReports.reduce(");

// find setFormData in handleReportUpload
code = code.replace(/setFormData\(prev => \(\{\s*\.\.\.prev,\s*medicalReports: \[\.\.\.prev\.medicalReports, \{([^}]+)\}\]\s*\}\)\);/, "setMedicalReports(prev => ([...prev, {\$1}]));");

// there are other setFormData inside handleReportUpload?
// let's do a general replace: setFormData(prev => ({ ...prev, medicalReports: ...
code = code.replace(/setFormData\(prev => \(\{\s*\n\s*\.\.\.prev,\s*\n\s*medicalReports: \[\.\.\.prev\.medicalReports, (\{[^}]+\})\]\s*\n\s*\}\)\);/g, "setMedicalReports(prev => [...prev, $1]);");

fs.writeFileSync('utils/components/ScientificAdmissionForm.tsx', code);
