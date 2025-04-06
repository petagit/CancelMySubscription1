import { Subscription, InsertSubscription, subscriptionCategories } from "@shared/schema";
import { formatDate } from "./utils";

// Type definition for subscription input that aligns with what our backend expects
type SubscriptionInput = {
  userId: number;
  name: string;
  amount: string;
  billingCycle: "monthly" | "yearly" | "quarterly" | "weekly";
  nextBillingDate: Date;
  category: typeof subscriptionCategories[number];
  cancelUrl?: string;
};



// Alias for backward compatibility 
export const exportToExcel = exportToCSV;

export function exportToCSV(subscriptions: Subscription[], filename: string = "cancelmysubs-export") {
  if (!subscriptions || subscriptions.length === 0) {
    alert("No subscriptions to export");
    return;
  }
  
  console.log("Starting CSV export with", subscriptions.length, "subscriptions");
  
  try {
    // Format the data for CSV
    const headers = ["Name", "Amount", "Billing Cycle", "Next Billing Date", "Category", "Cancel URL"];
    const csvContent = [
      headers.join(","),
      ...subscriptions.map(sub => [
        // Handle fields that might contain commas by wrapping in quotes
        `"${(sub.name || '').replace(/"/g, '""')}"`,
        `"$${Number(sub.amount || 0).toFixed(2)}"`,
        `"${sub.billingCycle || 'monthly'}"`,
        `"${formatDate(new Date(sub.nextBillingDate || new Date()))}"`,
        `"${sub.category || 'Other'}"`,
        `"${(sub.cancelUrl || '').replace(/"/g, '""')}"`,
      ].join(","))
    ].join("\n");
    
    console.log("CSV content generated successfully");
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    console.log("Blob URL created:", url.substring(0, 30) + "...");
    
    // Create a visible button that the user can click
    const downloadButton = document.createElement("a");
    downloadButton.href = url;
    downloadButton.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadButton.innerText = "Download CSV";
    downloadButton.style.display = "none";
    document.body.appendChild(downloadButton);
    
    console.log("Download link created and appended to document");
    
    // Trigger the download automatically
    downloadButton.click();
    console.log("Download link clicked");
    
    // Clean up after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(downloadButton);
      console.log("Download cleanup completed");
    }, 100);
    
    return true;
  } catch (error) {
    console.error("Error exporting CSV:", error);
    alert("Failed to export CSV: " + (error instanceof Error ? error.message : String(error)));
    return false;
  }
}

export function importFromCSV(file: File): Promise<Partial<SubscriptionInput>[]> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No file selected');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n');
        
        if (lines.length < 2) {
          reject('CSV file is empty or invalid');
          return;
        }
        
        // Parse headers, removing quotes if present
        const headers = lines[0].split(',').map(h => {
          h = h.trim();
          if (h.startsWith('"') && h.endsWith('"')) {
            h = h.substring(1, h.length - 1);
          }
          return h;
        });
        
        // Map CSV headers to our application fields
        const headerMap: { [key: string]: keyof SubscriptionInput } = {
          'Name': 'name',
          'Amount': 'amount',
          'Price': 'amount',
          'Billing Cycle': 'billingCycle',
          'Next Billing Date': 'nextBillingDate',
          'Renewal Date': 'nextBillingDate',
          'Category': 'category',
          'Cancel URL': 'cancelUrl',
        };
        
        // Parse CSV rows into subscription objects
        const importedSubscriptions: Partial<SubscriptionInput>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines
          
          // Split the line by comma, respecting quotes
          const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          
          // Create a subscription object with the values
          const subscription: Partial<SubscriptionInput> = {};
          
          headers.forEach((header, index) => {
            if (index >= values.length) return;
            
            let value = values[index] || '';
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1).replace(/""/g, '"');
            }
            
            // Map header to our application's field names
            const fieldName = headerMap[header];
            if (!fieldName) return; // Skip unmapped fields
            
            if (fieldName === 'amount') {
              // Clean and parse amount (remove $ sign, commas, etc.)
              const cleanedValue = value.replace(/[$,]/g, '');
              subscription.amount = cleanedValue || '0';
            } else if (fieldName === 'nextBillingDate') {
              // Convert to Date object
              subscription.nextBillingDate = new Date(value);
            } else if (fieldName === 'billingCycle') {
              // Validate billing cycle
              const cycle = value.toLowerCase();
              if (['monthly', 'yearly', 'quarterly', 'weekly'].includes(cycle)) {
                subscription.billingCycle = cycle as any;
              } else {
                subscription.billingCycle = 'monthly';
              }
            } else if (fieldName === 'category') {
              // Validate category against our defined categories
              if (subscriptionCategories.includes(value as any)) {
                subscription.category = value as any;
              } else {
                subscription.category = 'Other';
              }
            } else if (fieldName === 'cancelUrl') {
              subscription.cancelUrl = value;
            } else if (fieldName === 'name') {
              subscription.name = value;
            }
          });
          
          // Validate the subscription has at least a name
          if (subscription.name) {
            // Set default values for required fields if missing
            if (!subscription.amount) subscription.amount = '0';
            if (!subscription.billingCycle) subscription.billingCycle = 'monthly';
            if (!subscription.nextBillingDate) {
              const date = new Date();
              date.setMonth(date.getMonth() + 1); // Default to 1 month from now
              subscription.nextBillingDate = date;
            }
            if (!subscription.category) subscription.category = 'Other';
            
            importedSubscriptions.push(subscription);
          }
        }
        
        if (importedSubscriptions.length === 0) {
          reject('No valid subscriptions found in the CSV file');
          return;
        }
        
        resolve(importedSubscriptions);
        
      } catch (error) {
        console.error('Error importing CSV:', error);
        reject('Error importing CSV file. Please check the format.');
      }
    };
    
    reader.onerror = () => {
      reject('Error reading the file');
    };
    
    reader.readAsText(file);
  });
}
