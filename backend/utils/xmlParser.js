const xml2js = require('xml2js');
const fs = require('fs');

//Helper Functions
  
// Parse XML file
const parseXMLFile = async (filePath) => {
  try {
    const xmlData = fs.readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
      normalize: true,
      normalizeTags: false
    });
   
    const result = await parser.parseStringPromise(xmlData);

    return result; 
  } catch (error) {
    throw new Error('Failed to read XML file: ' + error.message);
  }
};

// Extract credit data from parsed XML
const extractCreditData = (parsedXML) => {
  try {
    // Navigate to the root of the XML structure
    const root = parsedXML.INProfileResponse;

    // Extract Basic Details
    const basicDetails = extractBasicDetails(root);
    // Extract Accounts
    const accounts = extractAccounts(root);
    
    // Extract Report Summary
    const reportSummary = calculateReportSummary(accounts, root);
    
    // Extract Credit Accounts
    const creditAccounts = formatCreditAccounts(accounts);

    return {
      basicDetails,
      reportSummary,
      creditAccounts,
    };

  } catch (error) {
    console.error('Error extracting data:', error);
    throw new Error('Failed to extract data from XML: ' + error.message);
  }
};

//Extract basic details
const extractBasicDetails = (root) => {
  const currentApplicant = root.Current_Application?.Current_Application_Details;
  return {
    name: (currentApplicant.Current_Applicant_Details.First_Name + ' ' + currentApplicant.Current_Applicant_Details.Last_Name).toUpperCase(),
    mobile: currentApplicant.Current_Applicant_Details.MobilePhoneNumber,
    pan: currentApplicant.PAN || 'N/A',
    creditScore: root.SCORE?.BureauScore || '0'
  };
};

//Extract accounts
const extractAccounts = (root) => {
  const accounts = root.CAIS_Account?.CAIS_Account_DETAILS || [];
  // Ensure accounts is always an array
  return Array.isArray(accounts) ? accounts : [accounts];
};

//Calculate report summary
const STATUS_MAP = {
  '11': 'Active',
  '13': 'Closed',
  '53': 'Defaulted',
  '71': 'Pending',
};
const calculateReportSummary = (accounts, root) => {
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(acc => (acc.Account_Status) === '11').length;
  const closedAccounts = accounts.filter(acc => (acc.Account_Status) === '13').length;

  const summary = root.CAIS_Account?.CAIS_Summary || {};

  return {
    totalAccounts,
    activeAccounts,
    closedAccounts,
    currentBalance: parseFloat(summary.TotalBalance || 0),
    securedAmount: parseFloat(summary.SecuredAmount || 0),
    unsecuredAmount: parseFloat(summary.UnsecuredAmount || 0),
    last7DaysEnquiries: parseInt(root.TotalCAPS_Summary?.TotalCAPSLast7Days || 0)
  };
};

//Format credit accounts
const formatCreditAccounts = (accounts) => {
  if (!Array.isArray(accounts)) return [];
  return accounts.map(acc => {
    const type = acc.Account_Type || 'Unknown';
    const bank = acc.Subscriber_Name || 'Unknown Bank';
    const accountNumber = acc.Account_Number || 'XXXX';
    const currentBalance = parseFloat(acc.Current_Balance || 0);
    const amountOverdue = parseFloat(acc.Amount_Past_Due || 0);

    // Convert status code to enum string
    const rawStatus = acc.Account_Status;
    const status = STATUS_MAP[rawStatus];
    
    return {
      type,
      bank,
      accountNumber: maskAccountNumber(accountNumber),
      currentBalance,
      amountOverdue,
      status
    };
  });
};

//Mask account number
const maskAccountNumber = (accountNumber) => {
  const str = accountNumber.toString();
  if (str.length <= 4) return str;
  return 'XXXX-XXXX-' + str.slice(-4);
};

module.exports = {
  parseXMLFile,
  extractCreditData
};
