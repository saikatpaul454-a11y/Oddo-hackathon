const PDFDocument = require('pdfkit');

/**
 * Generates a styled salary slip PDF buffer.
 */
const generateSalarySlipPDF = (employee, salaryDetails, month, year) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Block
      doc
        .fillColor('#1e293b')
        .fontSize(20)
        .text('EMPLOYEE MANAGEMENT SYSTEM', { align: 'center', bold: true });
      doc
        .fontSize(10)
        .fillColor('#64748b')
        .text('Corporate Head Office, Tech Park, Suite 404', { align: 'center' });
      doc.text('Email: info@emsportal.com | Web: emsportal.com', { align: 'center' });
      
      doc.moveDown(1.5);
      
      // Divider
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Document Title
      doc
        .fillColor('#1e293b')
        .fontSize(14)
        .text(`SALARY SLIP - ${month.toUpperCase()} ${year}`, { align: 'center', underline: true });
      doc.moveDown(1.5);

      // Employee Information (Grid layout)
      const topOfGrid = doc.y;
      
      doc.fontSize(10).fillColor('#1e293b');
      
      // Left Column
      doc.text(`Employee ID:   ${employee.employeeId}`, 50, topOfGrid);
      doc.text(`Name:          ${employee.name}`, 50, topOfGrid + 18);
      doc.text(`Role:          ${employee.role.toUpperCase()}`, 50, topOfGrid + 36);
      
      // Right Column
      doc.text(`Department:   ${employee.department}`, 320, topOfGrid);
      doc.text(`Designation:  ${employee.designation}`, 320, topOfGrid + 18);
      doc.text(`Joining Date: ${new Date(employee.joiningDate).toLocaleDateString()}`, 320, topOfGrid + 36);

      doc.moveDown(3);
      
      // Table Header for Earnings & Deductions
      const tableTop = doc.y;
      doc.rect(50, tableTop, 495, 20).fill('#3b82f6').stroke();
      
      doc.fillColor('#ffffff').fontSize(10);
      doc.text('Earning Structure', 60, tableTop + 5);
      doc.text('Amount (INR)', 220, tableTop + 5);
      doc.text('Deduction Structure', 300, tableTop + 5);
      doc.text('Amount (INR)', 460, tableTop + 5);

      // Table Row 1 (Basic Salary & PF)
      const row1Top = tableTop + 20;
      doc.rect(50, row1Top, 495, 20).fill('#f8fafc').strokeColor('#e2e8f0').stroke();
      doc.fillColor('#1e293b');
      doc.text('Basic Salary', 60, row1Top + 5);
      doc.text(`${salaryDetails.basicSalary.toFixed(2)}`, 220, row1Top + 5);
      doc.text('Provident Fund (PF)', 300, row1Top + 5);
      doc.text(`${salaryDetails.providentFund.toFixed(2)}`, 460, row1Top + 5);

      // Table Row 2 (HRA & Professional Tax)
      const row2Top = row1Top + 20;
      doc.rect(50, row2Top, 495, 20).fill('#ffffff').strokeColor('#e2e8f0').stroke();
      doc.text('HRA Allowance', 60, row2Top + 5);
      doc.text(`${salaryDetails.hra.toFixed(2)}`, 220, row2Top + 5);
      doc.text('Professional Tax', 300, row2Top + 5);
      doc.text(`${salaryDetails.professionalTax.toFixed(2)}`, 460, row2Top + 5);

      // Table Row 3 (Medical & Leave Deductions)
      const row3Top = row2Top + 20;
      doc.rect(50, row3Top, 495, 20).fill('#f8fafc').strokeColor('#e2e8f0').stroke();
      doc.text('Medical Allowance', 60, row3Top + 5);
      doc.text(`${salaryDetails.medicalAllowance.toFixed(2)}`, 220, row3Top + 5);
      doc.text('Leave Deductions', 300, row3Top + 5);
      doc.text(`${salaryDetails.leaveDeductions.toFixed(2)}`, 460, row3Top + 5);

      // Totals
      const totalTop = row3Top + 20;
      doc.rect(50, totalTop, 495, 20).fill('#f1f5f9').strokeColor('#cbd5e1').stroke();
      doc.fillColor('#1e293b').font('Helvetica-Bold');
      doc.text('Gross Earnings', 60, totalTop + 5);
      doc.text(`${salaryDetails.grossEarnings.toFixed(2)}`, 220, totalTop + 5);
      doc.text('Total Deductions', 300, totalTop + 5);
      doc.text(`${salaryDetails.totalDeductions.toFixed(2)}`, 460, totalTop + 5);

      doc.moveDown(2.5);

      // Net Salary Block
      const netSalaryTop = doc.y;
      doc.rect(50, netSalaryTop, 495, 40).fill('#eff6ff').strokeColor('#bfdbfe').stroke();
      doc.fillColor('#1e3a8a').fontSize(12).font('Helvetica-Bold');
      doc.text(`NET PAYABLE SALARY:   INR ${salaryDetails.netSalary.toFixed(2)}`, 70, netSalaryTop + 14);

      doc.moveDown(4);

      // Signatures
      const sigTop = doc.y;
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text('________________________', 80, sigTop);
      doc.text('Employee Signature', 95, sigTop + 15);

      doc.text('________________________', 360, sigTop);
      doc.text('Authorized Signatory', 375, sigTop + 15);

      // Footer notice
      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .text('This is a computer-generated payslip and does not require a physical stamp or signature.', 50, 750, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateSalarySlipPDF };
