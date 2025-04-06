/**
 * Export subscriptions to CSV file for download
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {string} Success message
 */
function exportSubscriptionsToCSV(subscriptions) {
  if (subscriptions.length === 0) {
    return 'No subscriptions to export';
  }
  
  // Define the headers for the CSV file
  const headers = ['name', 'url', 'price', 'billingCycle', 'renewalDate', 'notes', 'dateAdded'];
  
  // Convert subscriptions to CSV format
  const csvContent = [
    headers.join(','), // Headers row
    ...subscriptions.map(sub => {
      return headers.map(header => {
        // Handle fields that might contain commas by wrapping in quotes
        const value = sub[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
    })
  ].join('\n');
  
  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a link to download the CSV file
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `cancelmysubs-export-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return 'Subscriptions exported successfully';
}

/**
 * Import subscriptions from a CSV file
 * @param {File} file - The CSV file to import
 * @param {Array} existingSubscriptions - Existing subscriptions array
 * @param {Function} onSuccess - Callback function with imported subscriptions
 * @param {Function} onError - Callback function for error handling
 */
function importSubscriptionsFromCSV(file, existingSubscriptions, onSuccess, onError) {
  if (!file) {
    onError('No file selected');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const csvText = e.target.result;
      const lines = csvText.split('\n');
      
      if (lines.length < 2) {
        onError('CSV file is empty or invalid');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Ensure the CSV has the required headers
      const requiredHeaders = ['name', 'price', 'billingCycle'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        onError(`Invalid CSV format. Missing headers: ${missingHeaders.join(', ')}`);
        return;
      }
      
      // Parse CSV rows into subscription objects
      const importedSubscriptions = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        // Split the line by comma, respecting quotes
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        
        // Create a subscription object with the values
        const subscription = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
          }
          subscription[header.trim()] = value;
        });
        
        // Add today as dateAdded if not provided
        if (!subscription.dateAdded) {
          subscription.dateAdded = new Date().toISOString().split('T')[0];
        }
        
        // Convert price to number if it's a string
        if (subscription.price && typeof subscription.price === 'string') {
          subscription.price = parseFloat(subscription.price);
        }
        
        // Validate required fields
        if (subscription.name && subscription.price) {
          importedSubscriptions.push(subscription);
        }
      }
      
      if (importedSubscriptions.length === 0) {
        onError('No valid subscriptions found in the CSV file');
        return;
      }
      
      // Ask for confirmation if there are existing subscriptions
      if (existingSubscriptions.length > 0) {
        const confirmed = window.confirm(
          `Import ${importedSubscriptions.length} subscriptions? This will be added to your existing ${existingSubscriptions.length} subscriptions.`
        );
        
        if (!confirmed) return;
      }
      
      // Return the imported subscriptions
      onSuccess(importedSubscriptions);
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      onError('Error importing CSV file. Please check the format.');
    }
  };
  
  reader.readAsText(file);
}