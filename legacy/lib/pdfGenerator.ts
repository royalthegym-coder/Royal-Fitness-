import { jsPDF } from 'jspdf';
import { AIFitnessAnalysis } from './aiBioAnalyst';

export const generateReceiptPDF = (
    receiptData: {
        receiptNo: string;
        date: string;
        memberName: string;
        memberId: string | number;
        amount: number;
        method: string;
        items: { description: string; amount: number; type?: string }[];
    }
): string => {
    const doc = new jsPDF();
    
    // Brand Header
    doc.setFontSize(26);
    doc.setTextColor(6, 182, 212); // Cyan 500
    doc.text('FITNESS FUTURE', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('The Ultimate Neural Gym Intelligence', 105, 32, { align: 'center' });
    
    // Receipt Info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt No: ${receiptData.receiptNo}`, 20, 50);
    doc.text(`Date: ${receiptData.date}`, 140, 50);
    
    doc.setFontSize(12);
    doc.text(`Member ID: ${receiptData.memberId}`, 20, 60);
    doc.text(`Member Name: ${receiptData.memberName}`, 20, 67);
    doc.text(`Payment Method: ${receiptData.method}`, 20, 74);
    
    // Divider
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 80, 190, 80);
    
    // Table Header
    let yPos = 90;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, yPos);
    doc.text('Amount (INR)', 150, yPos);
    
    yPos += 5;
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    let total = 0;
    receiptData.items.forEach(item => {
        doc.text(item.description, 20, yPos);
        doc.text(`Rs. ${item.amount.toFixed(2)}`, 150, yPos);
        total += item.amount;
        yPos += 10;
        
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
    });
    
    // Total Line
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAID:', 100, yPos);
    doc.text(`Rs. ${total.toFixed(2)}`, 150, yPos);
    
    // Footer Badge
    yPos += 25;
    doc.setFontSize(10);
    doc.setTextColor(6, 182, 212);
    doc.text('Omni100x-Network Signature:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Verified by Google Opals & GitHub Copilot Auth', 80, yPos);
    
    doc.setFontSize(9);
    doc.text('This is a system generated digital receipt.', 105, 290, { align: 'center' });
    
    return doc.output('datauristring');
};

export const generateAIPDFReport = (
    memberName: string, 
    analysis: AIFitnessAnalysis, 
    originalFileName: string
): string => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text('Fitness Future - AI Medical Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
    
    // Member Info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Member Name: ${memberName}`, 20, 45);
    doc.text(`Source File: ${originalFileName}`, 20, 52);
    
    // Divider
    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);
    
    // Analysis Content
    let yPos = 70;
    
    const addSection = (title: string, content: string | string[]) => {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, yPos);
        yPos += 8;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        const textContent = Array.isArray(content) 
            ? content.join(', ') 
            : typeof content === 'string' 
                ? content 
                : content ? JSON.stringify(content) : 'N/A';

        const textLines = doc.splitTextToSize(textContent || 'N/A', 170);
        
        doc.text(textLines, 20, yPos);
        yPos += (textLines.length * 6) + 10;
        
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
    };
    
    addSection('Body Analysis', analysis.diagnosis);
    addSection('Severity Level', analysis.severity);
    addSection('Exercise Plan', analysis.exercise_plan || 'N/A');
    addSection('Diet Plan', analysis.diet_plan || 'N/A');
    addSection('Supplement Stack', analysis.supplement_stack || 'N/A');
    addSection('Allopathic Treatment', analysis.treatment_allopathic || 'N/A');
    addSection('Ayurvedic Treatment', analysis.treatment_ayurvedic || 'N/A');
    addSection('Estimated Time', `${analysis.recovery_days} Days`);
    addSection('AI Agents Involved', analysis.agents_involved);
    
    if (analysis.latest_research_links && analysis.latest_research_links.length > 0) {
        addSection('Latest Research Links', analysis.latest_research_links.join('\n'));
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an AI-generated report intended for fitness and wellness guidance.', 105, 290, { align: 'center' });
    
    // Return base64 data URI
    return doc.output('datauristring');
};
