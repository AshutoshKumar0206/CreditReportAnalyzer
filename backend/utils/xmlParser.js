const xml2js = require('xml2js');
const fs = require('fs');

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

    if (!root) {
      throw new Error('Invalid XML structure: INProfileResponse not found');
    }

    // Extract Basic Details
    const basicDetails = extractBasicDetails(root);
    
    // Extract Accounts
    const accounts = extractAccounts(root);
    
    // Extract Report Summary
    const reportSummary = calculateReportSummary(accounts, root);
    
    // Extract Credit Accounts
    const creditAccounts = formatCreditAccounts(accounts);
    
    // Extract Addresses
    const addresses = extractAddresses(accounts);

    return {
      basicDetails,
      reportSummary,
      creditAccounts,
      addresses
    };

  } catch (error) {
    console.error('Error extracting data:', error);
    throw new Error('Failed to extract data from XML: ' + error.message);
  }
};

// Extract basic details
const extractBasicDetails = (root) => {
  try {
    const currentApplicant = root.Current_Application?.Current_Application_Details?.Current_Applicant_Details;
  
    const caisDetails = root.CAIS_Account?.CAIS_Account_DETAILS;
    const caisHolder = Array.isArray(caisDetails) 
      ? caisDetails[0]?.CAIS_Holder_Details 
      : caisDetails?.CAIS_Holder_Details;
    
    let firstName = currentApplicant?.First_Name || caisHolder?.First_Name_Non_Normalized || '';
    let lastName = currentApplicant?.Last_Name || caisHolder?.Surname_Non_Normalized || '';
    const fullName = `${firstName} ${lastName}`.trim().toUpperCase() || 'N/A';
    
    const caisPhone = Array.isArray(caisDetails)
      ? caisDetails[0]?.CAIS_Holder_Phone_Details
      : caisDetails?.CAIS_Holder_Phone_Details;
    
    const mobile = currentApplicant?.MobilePhoneNumber || 
                   caisPhone?.Telephone_Number ||
                   caisPhone?.Mobile_Telephone_Number ||
                   'N/A';
    
    const pan = caisHolder?.Income_TAX_PAN || 
                currentApplicant?.IncomeTaxPan || 
                'N/A';
    
    const creditScore = parseInt(root.SCORE?.BureauScore || '0');

    return {
      name: fullName,
      mobile: mobile,
      pan: pan,
      creditScore: creditScore
    };
  } catch (error) {
    console.error('Error extracting basic details:', error);
    throw new Error('Failed to extract basic details');
  }
};

// Extract accounts
const extractAccounts = (root) => {
  try {
    const accountDetails = root.CAIS_Account?.CAIS_Account_DETAILS;
    
    if (!accountDetails) {
      return [];
    }
    
    // Ensure accounts is always an array
    return Array.isArray(accountDetails) ? accountDetails : [accountDetails];
  } catch (error) {
    console.error('Error extracting accounts:', error);
    return [];
  }
};

// Account status mapping
const STATUS_MAP = {
  '11': 'Active',
  '13': 'Closed',
  '21': 'Active',
  '22': 'Active',
  '23': 'Active',
  '24': 'Active',
  '25': 'Active', 
  '53': 'Defaulted', 
  '71': 'Active', 
  '78': 'Settled',
  '80': 'Written Off',
  '82': 'Written Off', 
  '83': 'Written Off', 
  '84': 'Written Off', 
};

// Account type mapping
const ACCOUNT_TYPE_MAP = {
  '00': 'Auto Loan',
  '01': 'Housing Loan',
  '02': 'Property Loan',
  '03': 'Loan Against Shares',
  '04': 'Personal Loan',
  '05': 'Consumer Loan',
  '06': 'Gold Loan',
  '07': 'Education Loan',
  '08': 'Loan to Professional',
  '09': 'Credit Card',
  '10': 'Credit Card',
  '11': 'Leasing',
  '12': 'Overdraft',
  '13': 'Two-wheeler Loan',
  '14': 'Non-funded Credit Facility',
  '15': 'Loan Against Bank Deposits',
  '16': 'Fleet Card',
  '17': 'Commercial Vehicle Loan',
  '18': 'Telco - Wireless',
  '19': 'Telco - Broadband',
  '20': 'Telco - Landline',
  '31': 'Secured Credit Card',
  '32': 'Used Car Loan',
  '33': 'Construction Equipment Loan',
  '34': 'Tractor Loan',
  '35': 'Corporate Credit Card',
  '36': 'Kisan Credit Card',
  '37': 'Loan on Credit Card',
  '38': 'Prime Minister Jaan Dhan Yojana',
  '39': 'Mudra Loans',
  '43': 'Microfinance - Business Loan',
  '44': 'Microfinance - Personal Loan',
  '45': 'Microfinance - Housing Loan',
  '47': 'Microfinance - Others',
  '51': 'Business Loan - General',
  '52': 'Business Loan - Priority Sector - Small Business',
  '53': 'Business Loan - Priority Sector - Agriculture',
  '54': 'Business Loan - Priority Sector - Others',
  '55': 'Business Loan - Secured',
  '56': 'Business Loan - Unsecured',
  '59': 'Business Non-funded Credit Facility - General',
  '61': 'Business Non-funded Credit Facility - Priority Sector - Small Business',
};

// Portfolio type mapping
const PORTFOLIO_TYPE_MAP = {
  'R': 'Revolving',
  'I': 'Installment', // Term Loans
  'M': 'Mortgage',
  'O': 'Other'
};

// Calculate report summary
const calculateReportSummary = (accounts, root) => {
  try {
    const totalAccounts = accounts.length;
    
    const activeAccounts = accounts.filter(acc => {
      const status = acc.Account_Status;
      return status === '11' || status === '21' || status === '71';
    }).length;
    
    const closedAccounts = accounts.filter(acc => {
      const status = acc.Account_Status;
      return status === '13';
    }).length;

    // Get CAIS Summary
    const caisSummary = root.CAIS_Account?.CAIS_Summary;
    
    const outstandingBalance = caisSummary?.Total_Outstanding_Balance;
    
    let currentBalance = 0;
    let securedAmount = 0;
    let unsecuredAmount = 0;
    
    if (outstandingBalance) {
      currentBalance = parseFloat(outstandingBalance.Outstanding_Balance_All || 0);
      securedAmount = parseFloat(outstandingBalance.Outstanding_Balance_Secured || 0);
      unsecuredAmount = parseFloat(outstandingBalance.Outstanding_Balance_UnSecured || 0);
    }
    
    if (currentBalance === 0) {
      currentBalance = accounts.reduce((sum, acc) => {
        return sum + parseFloat(acc.Current_Balance || 0);
      }, 0);
      
      // Estimate secured vs unsecured based on portfolio type
      securedAmount = accounts
        .filter(acc => acc.Portfolio_Type === 'I' || acc.Portfolio_Type === 'M')
        .reduce((sum, acc) => sum + parseFloat(acc.Current_Balance || 0), 0);
      
      unsecuredAmount = currentBalance - securedAmount;
    }
    
    // Get 7-day enquiries from TotalCAPS_Summary
    const totalCapsSummary = root.TotalCAPS_Summary;
    const last7DaysEnquiries = parseInt(totalCapsSummary?.TotalCAPSLast7Days || 0);

    return {
      totalAccounts,
      activeAccounts,
      closedAccounts,
      currentBalance: Math.round(currentBalance),
      securedAmount: Math.round(securedAmount),
      unsecuredAmount: Math.round(unsecuredAmount),
      last7DaysEnquiries
    };
  } catch (error) {
    console.error('Error calculating report summary:', error);
    return {
      totalAccounts: accounts.length,
      activeAccounts: 0,
      closedAccounts: 0,
      currentBalance: 0,
      securedAmount: 0,
      unsecuredAmount: 0,
      last7DaysEnquiries: 0
    };
  }
};

// Format credit accounts
const formatCreditAccounts = (accounts) => {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return [];
  }
  
  return accounts.map(acc => {
    try {
      // Get account type
      const accountTypeCode = acc.Account_Type || '00';
      const accountType = ACCOUNT_TYPE_MAP[accountTypeCode] || `Account Type ${accountTypeCode}`;
      
      // Get portfolio type
      const portfolioType = acc.Portfolio_Type || '';
      const portfolioDesc = PORTFOLIO_TYPE_MAP[portfolioType] || '';
      
      // Combine type description
      const type = portfolioDesc ? `${accountType} (${portfolioDesc})` : accountType;
      
      // Get bank name (clean up)
      const bank = (acc.Subscriber_Name || 'Unknown Bank').trim().replace(/^\s+/, '');
      
      // Get account number
      const accountNumber = acc.Account_Number || 'XXXX';
      
      // Get balances
      const currentBalance = parseFloat(acc.Current_Balance || 0);
      const amountOverdue = parseFloat(acc.Amount_Past_Due || 0);
      
      // Get credit limit
      const creditLimit = parseFloat(acc.Credit_Limit_Amount || acc.Highest_Credit_or_Original_Loan_Amount || 0);
      
      // Get status
      const rawStatus = acc.Account_Status;
      const status = STATUS_MAP[rawStatus] || 'Unknown';
      
      // Get date information
      const openDate = formatDate(acc.Open_Date);
      const dateReported = formatDate(acc.Date_Reported);
      const dateClosed = acc.Date_Closed ? formatDate(acc.Date_Closed) : null;

      return {
        type,
        bank,
        accountNumber: maskAccountNumber(accountNumber),
        currentBalance,
        amountOverdue,
        creditLimit,
        status,
        openDate,
        dateReported,
        dateClosed
      };
    } catch (error) {
      console.error('Error formatting account:', error);
      return null;
    }
  }).filter(acc => acc !== null);
};

// Format date from YYYYMMDD to readable format
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '00000000' || dateStr.length !== 8) {
    return null;
  }
  
  try {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  } catch (error) {
    return null;
  }
};

// Mask account number
const maskAccountNumber = (accountNumber) => {
  const str = accountNumber.toString();
  if (str.length <= 4) return str;
  
  // For longer account numbers, show last 4 digits
  if (str.length > 12) {
    return 'XXXX-XXXX-' + str.slice(-4);
  } else if (str.length > 8) {
    return 'XXXX-' + str.slice(-4);
  } else {
    return 'X'.repeat(str.length - 4) + str.slice(-4);
  }
};

// Extract addresses from accounts
const extractAddresses = (accounts) => {
  try {
    const addresses = [];
    const uniqueAddresses = new Set();
    
    // Get addresses from first account (usually has most complete info)
    if (accounts && accounts.length > 0) {
      const addressDetails = accounts[0].CAIS_Holder_Address_Details;
      
      if (addressDetails) {
        const addressLines = [
          addressDetails.First_Line_Of_Address_non_normalized,
          addressDetails.Second_Line_Of_Address_non_normalized,
          addressDetails.Third_Line_Of_Address_non_normalized,
          addressDetails.City_non_normalized,
          addressDetails.State_non_normalized,
          addressDetails.ZIP_Postal_Code_non_normalized
        ].filter(line => line && line.trim() !== '');
        
        const fullAddress = addressLines.join(', ');
        
        if (fullAddress && !uniqueAddresses.has(fullAddress)) {
          addresses.push({
            type: 'Permanent',
            address: fullAddress
          });
          uniqueAddresses.add(fullAddress);
        }
      }
    }
    
    // If no addresses found, return default
    if (addresses.length === 0) {
      return [{
        type: 'Permanent',
        address: 'Address not available in XML'
      }];
    }
    
    return addresses;
  } catch (error) {
    console.error('Error extracting addresses:', error);
    return [{
      type: 'Permanent',
      address: 'Address not available in XML'
    }];
  }
};

module.exports = {
  parseXMLFile,
  extractCreditData
};