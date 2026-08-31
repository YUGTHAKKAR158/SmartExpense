// ═══════════════════════════════════════════════
// src/api/reportApi.js
//
// WHY special handling for CSV/PDF?
// These endpoints return binary/text file data
// not JSON. We need responseType: 'blob' for PDF
// and handle the download trigger in the browser.
// ═══════════════════════════════════════════════

import axiosInstance from './axiosInstance';

// Get report summary (JSON — for preview)
export const getReportSummaryApi = async (month, year) => {
  const response = await axiosInstance.get('/reports/summary', {
    params: { month, year },
  });
  return response.data;
};

// Download CSV — triggers file download
export const downloadCSVApi = async (month, year) => {
  const response = await axiosInstance.get('/reports/csv', {
    params: { month, year },
    // responseType text because CSV is plain text
    responseType: 'text',
  });

  // Create a download link and click it programmatically
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `SmartExpense_Report_${month}_${year}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Download PDF — triggers file download
export const downloadPDFApi = async (month, year) => {
  const response = await axiosInstance.get('/reports/pdf', {
    params: { month, year },
    // responseType blob because PDF is binary
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `SmartExpense_Report_${month}_${year}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};