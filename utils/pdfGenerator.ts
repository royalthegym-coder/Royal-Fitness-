import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { WorkoutTemplate, DietPlan, Member } from '../types';
import { GymConfig, DEFAULT_GYM } from './context/GymProvider';

const getCurrentGymConfig = (): GymConfig => {
    try {
        const saved = localStorage.getItem('tenant_gym_config');
        return saved ? JSON.parse(saved) : DEFAULT_GYM;
    } catch {
        return DEFAULT_GYM;
    }
};

export const generateReceiptPDF = (member: any, paymentDetails: any) => {
    const doc = new jsPDF();
    const gym = getCurrentGymConfig();
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bolditalic");
    doc.text(gym.gymName.toUpperCase(), 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official Payment Receipt", 105, 28, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    doc.text(`Receipt No: REC-${Date.now().toString().slice(-6)}`, 14, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 50);
    doc.text(`Member Name: ${member.name}`, 14, 60);
    doc.text(`Phone: ${member.phone || 'N/A'}`, 14, 66);
    
    // Table
    (doc as any).autoTable({
        startY: 80,
        head: [['Description', 'Amount']],
        body: [
            [paymentDetails.description || 'Gym Membership Fee', `Rs. ${paymentDetails.amount}`],
            ['GST (18%)', 'Included']
        ],
        foot: [['Total Amount Paid', `Rs. ${paymentDetails.amount}`]],
        theme: 'grid',
        headStyles: { fillColor: [gym.themeColor === 'cyan' ? 6 : gym.themeColor === 'emerald' ? 16 : 245, gym.themeColor === 'cyan' ? 182 : gym.themeColor === 'emerald' ? 163 : 158, gym.themeColor === 'cyan' ? 212 : gym.themeColor === 'emerald' ? 74 : 11], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Transaction ID: ${paymentDetails.txnId || 'N/A'}`, 14, finalY);
    doc.text(`Payment Mode: ${paymentDetails.mode || 'Online'}`, 14, finalY + 6);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Thank you for choosing ${gym.gymName}!`, 105, finalY + 20, { align: "center" });
    doc.text(`Address: ${gym.address}`, 105, finalY + 26, { align: "center" });

    doc.save(`Receipt_${member.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

export const generateWorkoutPDF = (template: WorkoutTemplate, member?: Member) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bolditalic");
    doc.text("FITNESS FUTURE", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Advanced AI-Powered Training Protocol", 105, 28, { align: "center" });

    // Member Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    if (member) {
        doc.text(`Athlete: ${member.name}`, 14, 50);
        doc.text(`Level: ${template.level}`, 14, 56);
        doc.text(`Priority: ${template.priority || 'Medium'}`, 14, 62);
    } else {
        doc.text(`Level: ${template.level}`, 14, 50);
        doc.text(`Priority: ${template.priority || 'Medium'}`, 14, 56);
    }
    
    // Template Info
    doc.setFontSize(16);
    doc.text(template.name, 14, 70);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const splitDesc = doc.splitTextToSize(template.description, 180);
    doc.text(splitDesc, 14, 76);

    let currentY = 76 + (splitDesc.length * 5) + 5;

    // Helper for tables
    const addSection = (title: string, exercises: any[]) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bolditalic");
        doc.text(title, 14, currentY);
        currentY += 5;

        const tableData = exercises.map(ex => [ex.name, ex.sets, ex.reps]);
        
        (doc as any).autoTable({
            startY: currentY,
            head: [['Exercise', 'Sets', 'Reps/Time']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    };

    if (template.preWorkout) {
        addSection(`Pre-Workout: ${template.preWorkout.name}`, template.preWorkout.exercises);
    }

    template.mainWorkout.forEach((section, idx) => {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        addSection(`Main Block ${idx + 1}: ${section.name}`, section.exercises);
    });

    if (template.finisher) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        addSection(`Finisher: ${template.finisher.name}`, template.finisher.exercises);
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Future Overlord AI System • N8N Synced • GitHub Version Controlled", 105, 290, { align: "center" });

    doc.save(`${template.name.replace(/\s+/g, '_')}_Protocol.pdf`);
};

export const generateDietPDF = (diet: DietPlan, member?: Member) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bolditalic");
    doc.text("FITNESS FUTURE", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Advanced AI-Powered Nutritional Matrix", 105, 28, { align: "center" });

    // Member Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    if (member) {
        doc.text(`Athlete: ${member.name}`, 14, 50);
        doc.text(`Goal: ${diet.goal}`, 14, 56);
    }
    
    // Diet Info
    doc.setFontSize(16);
    doc.text(diet.name, 14, 70);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const splitDesc = doc.splitTextToSize(diet.description, 180);
    doc.text(splitDesc, 14, 76);

    let currentY = 76 + (splitDesc.length * 5) + 5;

    // Macros
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Daily Targets: ${diet.calories} kcal | P: ${diet.macros.protein}g | C: ${diet.macros.carbs}g | F: ${diet.macros.fats}g`, 14, currentY);
    currentY += 10;

    diet.meals.forEach((meal, idx) => {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bolditalic");
        doc.setTextColor(6, 182, 212);
        doc.text(`Meal ${idx + 1}: ${meal.name} (${meal.time})`, 14, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 5;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        if (meal.macros) {
            doc.text(`Calories: ${meal.totalCalories} | P: ${meal.macros.protein}g | C: ${meal.macros.carbs}g | F: ${meal.macros.fats}g`, 14, currentY);
            currentY += 5;
        }

        const tableData = meal.items.map((item: any) => [
            item.food || item, 
            item.portion || '-', 
            item.calories || '-', 
            item.protein ? `${item.protein}g` : '-', 
            item.carbs ? `${item.carbs}g` : '-', 
            item.fats ? `${item.fats}g` : '-'
        ]);
        
        (doc as any).autoTable({
            startY: currentY,
            head: [['Food Item', 'Portion', 'Cals', 'Protein', 'Carbs', 'Fats']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 2 },
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Future Overlord AI System • N8N Synced • GitHub Version Controlled", 105, 290, { align: "center" });

    doc.save(`${diet.name.replace(/\s+/g, '_')}_Diet.pdf`);
};
