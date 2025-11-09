import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Expense } from "../lib/supabase";

export function downloadExpensesPDF(expenses: Expense[], title: string) {
  try {
    const doc = new jsPDF("p", "mm", "a4");

    // === Title ===
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    if (!expenses || expenses.length === 0) {
      doc.setFontSize(14);
      doc.text("No expenses found.", 14, 40);
      doc.save(`${title}.pdf`);
      return;
    }

    // ================= TABLE =================
    const tableBody = expenses.map((exp) => [
      new Date(exp.date).toLocaleDateString(),
      exp.payer,
      exp.category,
      "₹" + exp.amount.toFixed(2),
      exp.description || "-",
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Date", "Payer", "Category", "Amount", "Description"]],
      body: tableBody,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [22, 122, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    const tableEndY = (doc as any).lastAutoTable.finalY + 10;

    // ================= TOTAL AMOUNT =================
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, tableEndY);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Expenses: ₹${totalAmount.toFixed(2)}`, 14, tableEndY + 8);

    // ================= TOTAL PER CATEGORY =================
    const categoryMap: Record<string, number> = {};
    expenses.forEach((exp) => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });

    let nextY = tableEndY + 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Total by Category:", 14, nextY);
    nextY += 8;

    Object.entries(categoryMap).forEach(([cat, amt]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`${cat}: ₹${amt.toFixed(2)}`, 20, nextY);
      nextY += 6;
    });

    // ================= TOTAL PER PERSON =================
    const payerMap: Record<string, number> = {};
    expenses.forEach((exp) => {
      payerMap[exp.payer] = (payerMap[exp.payer] || 0) + exp.amount;
    });

    nextY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Total by Person:", 14, nextY);
    nextY += 8;

    Object.entries(payerMap).forEach(([payer, amt]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`${payer}: ₹${amt.toFixed(2)}`, 20, nextY);
      nextY += 6;
    });

    // ================= FOOTER =================
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(10);

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 180, 290);
    }

    // === Save PDF ===
    doc.save(`${title}.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("PDF download failed. Check console.");
  }
}
