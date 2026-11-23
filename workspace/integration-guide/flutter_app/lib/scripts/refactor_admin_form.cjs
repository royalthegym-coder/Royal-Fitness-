const fs = require('fs');
let code = fs.readFileSync('utils/components/ScientificAdmissionForm.tsx', 'utf-8');

// Identify the shape of formData and build a zod schema
const schemaStr = `import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const admissionSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Valid phone is required"),
    email: z.string().email("Valid email is required").optional().or(z.literal('')),
    age: z.string(),
    gender: z.string(),
    profession: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    bloodGroup: z.string().optional(),
    bodyFat: z.string().optional(),
    avatar: z.string().optional(),
    password: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    emergencyContactRelation: z.string().optional(),
    injuries: z.string().optional(),
    conditions: z.array(z.string()).optional(),
    allergies: z.string().optional(),
    dietType: z.string().optional(),
    waterIntake: z.string().optional(),
    mealFrequency: z.string().optional(),
    sleepTime: z.string().optional(),
    supplements: z.string().optional(),
    primaryGoal: z.string().optional(),
    experienceLevel: z.string().optional(),
    timeCommitment: z.string().optional(),
    stressLevel: z.string().optional(),
    sleepQuality: z.string().optional(),
    metabolicRate: z.string().optional(),
    packageId: z.string().optional(),
    ptPackageId: z.string().optional(),
    // We leave array fields for complex logic to state directly if needed, or zod dynamic fields.
});

type AdmissionFormData = z.infer<typeof admissionSchema>;
`;

code = code.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\n" + schemaStr);

// Now inside the component...
const declareHook = `
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdmissionFormData>({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            stressLevel: '5',
            conditions: []
        }
    });

    const formValues = watch();
    // We override formData with formValues + some custom state arrays
    const formData = {
        ...formValues,
        medicalReports,
        selectedInventory
    };
`;

// wait, it's easier: I'll just write a script that does basic replacements 
code = code.replace("const [formData, setFormData] = useState({", declareHook + "\n    const [medicalReports, setMedicalReports] = useState<any[]>([]);\n    const [selectedInventory, setSelectedInventory] = useState<any[]>([]);\n    /*");
code = code.replace("    });\n\n    // Payment & Receipt States", "    */\n\n    // Payment & Receipt States");

// Replace all 'value={formData.X}' with '{...register("X")}'
// But only for string inputs. Wait, some are selects.
// `value={formData.phone}` -> `value={formValues.phone}` or `{...register("phone")}`
// I can just replace `value={formData.([a-zA-Z0-9_]+)}` with `{...register("$1")}` when it's an input or textarea.
code = code.replace(/onChange=\{\(e\) => setFormData\(prev => \(\{ \.\.\.prev, [a-zA-Z0-9_]+: e\.target\.value \}\)\)\}/g, "");
code = code.replace(/value=\{formData\.([a-zA-Z0-9_]+)\}/g, "{...register(\"$1\")}");
code = code.replace(/formData\.([a-zA-Z0-9_]+)/g, "formValues.$1");

// Fix some manual setFormDatas
code = code.replace(/setFormData\(prev => \(\{ \.\.\.prev, ([a-zA-Z0-9_]+): ([^}]+) \}\)\)/g, "setValue('$1', $2)");

fs.writeFileSync('utils/components/ScientificAdmissionForm.tsx', code);
