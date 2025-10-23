import React, { useState, useEffect } from 'react';
import { Upload, FileText, TrendingUp, DollarSign, Activity, XCircle, AlertCircle, Search, Trash2, CheckCircle, CreditCard, MapPin } from 'lucide-react';
import axios from 'axios';

const CreditReportApp = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState(null);

  // Fetch all reports on component mount
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  // Fetch statistics
  useEffect(() => {
    fetchStatisticsData();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/reports/creditreports');
      
      if (response.data.success) {
        console.log(response.data);
        setReports(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch reports. Please check if the server is running.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatisticsData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/reports/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/xml' || selectedFile.name.endsWith('.xml')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a valid XML file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
        const formData = new FormData();
        formData.append('xmlFile', file);

        const response = await axios.post('http://localhost:8000/reports/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

      if (response.data.success) {
        console.log(response.data);
        setReportData(response.data.data);
        setActiveTab('report');
        setFile(null);
        fetchStatisticsData();
        alert('File uploaded and processed successfully!');
      } else {
        setError(response.data.message || 'Failed to upload file');
      }
    } catch (err) {
      setError('Failed to upload file. Please check if the server is running.');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:8000/reports/creditreports/${id}`);;
      if (response.data.success) {
        setReports(reports.filter(r => r._id !== id));
        fetchStatisticsData();
        alert('Report deleted successfully!');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to delete report');
      console.error('Error deleting report:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchReports();
      return;
    }

    setLoading(true);
    setError(null);

    try {
        const response = await axios.get('http://localhost:8000/reports/creditreports/search', {
            params: { query: searchQuery }
        });
      if (response.data.success) {
        setReports(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to search reports');
      console.error('Error searching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCreditScoreColor = (score) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditScoreLabel = (score) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    return 'Needs Improvement';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CreditSea</h1>
                <p className="text-sm text-gray-500">Credit Report Analyzer</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Reports ({reports.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Dashboard */}
        {statistics && activeTab !== 'report' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.totalReports}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Credit Score</p>
                  <p className={`text-3xl font-bold ${getCreditScoreColor(statistics.avgCreditScore)}`}>
                    {statistics.avgCreditScore}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(statistics.totalBalance / 100000).toFixed(1)}L</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Credit Report</h2>
                <p className="text-gray-600">Upload an XML file containing Experian credit data</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">
                    {file ? file.name : 'Click to select XML file'}
                  </p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </label>
              </div>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Upload & Analyze'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reports List Tab */}
        {activeTab === 'reports' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Saved Reports</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search by name, PAN, or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No reports yet. Upload an XML file to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setReportData(report);
                          setActiveTab('report');
                        }}
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">{report.basicDetails.name}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                          <p>PAN: {report.basicDetails.pan}</p>
                          <p>Mobile: {report.basicDetails.mobile}</p>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{report.fileName}</p>
                        <p className="text-xs text-gray-400">{formatDate(report.uploadDate)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getCreditScoreColor(report.basicDetails.creditScore)}`}>
                            {report.basicDetails.creditScore}
                          </div>
                          <p className="text-xs text-gray-500">Credit Score</p>
                        </div>
                        <button
                          onClick={() => handleDeleteReport(report._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Report View Tab */}
        {activeTab === 'report' && reportData && (
          <div className="space-y-6">
            {/* Basic Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                Basic Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900">{reportData.basicDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mobile Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{reportData.basicDetails.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">PAN</p>
                  <p className="text-lg font-semibold text-gray-900">{reportData.basicDetails.pan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Credit Score</p>
                  <div className="flex items-center space-x-3">
                    <p className={`text-3xl font-bold ${getCreditScoreColor(reportData.basicDetails.creditScore)}`}>
                      {reportData.basicDetails.creditScore}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      reportData.basicDetails.creditScore >= 750
                        ? 'bg-green-100 text-green-700'
                        : reportData.basicDetails.creditScore >= 650
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {getCreditScoreLabel(reportData.basicDetails.creditScore)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                Report Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-700 mb-1">Total Accounts</p>
                  <p className="text-3xl font-bold text-blue-900">{reportData.reportSummary.totalAccounts}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center mb-1">
                    <CheckCircle className="w-4 h-4 text-green-700 mr-1" />
                    <p className="text-sm text-green-700">Active</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900">{reportData.reportSummary.activeAccounts}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <div className="flex items-center mb-1">
                    <XCircle className="w-4 h-4 text-gray-700 mr-1" />
                    <p className="text-sm text-gray-700">Closed</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{reportData.reportSummary.closedAccounts}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                  <div className="flex items-center mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-700 mr-1" />
                    <p className="text-sm text-orange-700">7-Day Enquiries</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900">{reportData.reportSummary.last7DaysEnquiries}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-5 h-5 text-purple-700 mr-2" />
                    <p className="text-sm text-purple-700 font-medium">Current Balance</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">₹{reportData.reportSummary.currentBalance.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
                  <p className="text-sm text-teal-700 font-medium mb-2">Secured Amount</p>
                  <p className="text-2xl font-bold text-teal-900">₹{reportData.reportSummary.securedAmount.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
                  <p className="text-sm text-pink-700 font-medium mb-2">Unsecured Amount</p>
                  <p className="text-2xl font-bold text-pink-900">₹{reportData.reportSummary.unsecuredAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Credit Accounts */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                Credit Accounts ({reportData.creditAccounts.length})
              </h2>
              <div className="space-y-4">
                {reportData.creditAccounts.map((account, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{account.type}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            account.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {account.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{account.bank}</p>
                      </div>
                      <p className="text-sm text-gray-500">{account.accountNumber}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                        <p className="text-lg font-semibold text-gray-900">₹{account.currentBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount Overdue</p>
                        <p className={`text-lg font-semibold ${account.amountOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{account.amountOverdue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditReportApp;