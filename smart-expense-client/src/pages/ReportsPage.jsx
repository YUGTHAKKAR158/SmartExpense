// ═══════════════════════════════════════════════
// src/pages/ReportsPage.jsx
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  getReportSummaryApi,
  downloadCSVApi,
  downloadPDFApi,
} from '../api/reportApi';
import ReportSummaryCard from '../components/reports/ReportSummaryCard';
import Button from '../components/common/Button';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const ReportsPage = () => {
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [reportData,    setReportData]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [csvLoading,    setCsvLoading]    = useState(false);
  const [pdfLoading,    setPdfLoading]    = useState(false);
  const [downloadMsg,   setDownloadMsg]   = useState('');

  const currentYear = now.getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear];

  // ─────────────────────────────────────────
  // FETCH REPORT PREVIEW
  // ─────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getReportSummaryApi(selectedMonth, selectedYear);
      setReportData(response.data);
    } catch (err) {
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ─────────────────────────────────────────
  // DOWNLOAD HANDLERS
  // ─────────────────────────────────────────
  const handleDownloadCSV = async () => {
    setCsvLoading(true);
    setDownloadMsg('');
    try {
      await downloadCSVApi(selectedMonth, selectedYear);
      setDownloadMsg('✅ CSV downloaded successfully!');
      setTimeout(() => setDownloadMsg(''), 3000);
    } catch (err) {
      setDownloadMsg('❌ Failed to download CSV. Please try again.');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    setDownloadMsg('');
    try {
      await downloadPDFApi(selectedMonth, selectedYear);
      setDownloadMsg('✅ PDF downloaded successfully!');
      setTimeout(() => setDownloadMsg(''), 3000);
    } catch (err) {
      setDownloadMsg('❌ Failed to download PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const hasData = reportData && reportData.expenseCount > 0;

  return (
    <div>
      {/* ─────────────────────────────────────
          HEADER
          ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2>📄 Monthly Reports</h2>
          <p className="text-gray-500 mt-1">
            Download your expense reports as CSV or PDF
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────
          CONTROLS CARD
          ───────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">

          {/* Month selector */}
          <div className="flex-1 min-w-40">
            <label className="label">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div className="min-w-28">
            <label className="label">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <div>
            <Button
              variant="secondary"
              onClick={fetchReport}
              disabled={loading}
            >
              🔄 Refresh Preview
            </Button>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────
          DOWNLOAD BUTTONS
          ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* CSV Download */}
        <div className="card border-2 border-green-100 hover:border-green-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              📊
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                CSV Export
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Spreadsheet format. Open in Excel, Google Sheets. Includes all transactions + category summary.
              </p>
              <Button
                variant="primary"
                fullWidth
                loading={csvLoading}
                onClick={handleDownloadCSV}
                disabled={loading || !hasData}
              >
                {csvLoading ? 'Generating...' : '⬇️ Download CSV'}
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Download */}
        <div className="card border-2 border-red-100 hover:border-red-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              📋
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                PDF Report
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Formatted report with charts, category breakdown, and transaction list. Ready to share or print.
              </p>
              <Button
                variant="danger"
                fullWidth
                loading={pdfLoading}
                onClick={handleDownloadPDF}
                disabled={loading || !hasData}
              >
                {pdfLoading ? 'Generating...' : '⬇️ Download PDF'}
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Download status message */}
      {downloadMsg && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
          downloadMsg.startsWith('✅')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {downloadMsg}
        </div>
      )}

      {/* No data warning */}
      {!loading && !hasData && !error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800 text-sm font-medium">
            ⚠️ No expenses found for {MONTHS[selectedMonth - 1]} {selectedYear}.
            Add some expenses first to generate a report.
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────
          REPORT PREVIEW
          ───────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-800">
            📋 Report Preview
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </span>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="card animate-pulse h-40" />
            <div className="card animate-pulse h-32" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">❌</p>
            <p className="text-gray-600 text-sm">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchReport}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Report preview */}
        {!loading && !error && reportData && (
          <ReportSummaryCard reportData={reportData} />
        )}

      </div>

      {/* ─────────────────────────────────────
          WHAT'S INCLUDED INFO
          ───────────────────────────────────── */}
      {!loading && (
        <div className="mt-8 card bg-gray-50 border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            📦 What's included in the report
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
            {[
              { icon: '📊', text: 'Complete transaction list with dates, amounts, categories' },
              { icon: '📂', text: 'Category breakdown with totals and percentages' },
              { icon: '💳', text: 'Payment method distribution' },
              { icon: '🎯', text: 'Budget vs actual comparison' },
              { icon: '📈', text: 'Daily average and per-transaction average' },
              { icon: '🏷️', text: 'Merchant names and notes for each expense' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsPage;