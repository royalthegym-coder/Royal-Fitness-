const fs = require('fs');
let code = fs.readFileSync('utils/components/ScientificAdmissionForm.tsx', 'utf-8');

code = code.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{/g, "const handleFinalSubmit = async (data: AdmissionFormData) => {");

code = code.replace(/<form onSubmit=\{handleSubmit\} /g, "<form onSubmit={handleSubmit(handleFinalSubmit)} ");

// the handleSubmit prevented default, but react-hook-form does that. So remove e.preventDefault(); inside handleFinalSubmit
// We might not have `e` defined in handleFinalSubmit if we changed args to `data`
code = code.replace(/e\.preventDefault\(\);/g, "// e.preventDefault();");

fs.writeFileSync('utils/components/ScientificAdmissionForm.tsx', code);
