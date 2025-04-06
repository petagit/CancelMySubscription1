// Initialize the extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Subscription Manager installed');
  
  // Set up default storage
  chrome.storage.local.get('subscriptions', (result) => {
    if (!result.subscriptions) {
      chrome.storage.local.set({subscriptions: []});
    }
  });
  
  // Set up alarm for checking subscription renewals
  chrome.alarms.create('checkSubscriptionRenewals', {
    periodInMinutes: 1440 // Check once a day (24 * 60 minutes)
  });
});

// Listen for alarm to check subscription renewals
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkSubscriptionRenewals') {
    checkUpcomingRenewals();
  }
});

// Check for upcoming subscription renewals
function checkUpcomingRenewals() {
  chrome.storage.local.get('subscriptions', (result) => {
    const subscriptions = result.subscriptions || [];
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    // Find subscriptions with renewals in the next 3 days
    const upcomingRenewals = subscriptions.filter(subscription => {
      const renewalDate = new Date(subscription.renewalDate);
      return renewalDate >= today && renewalDate <= threeDaysFromNow;
    });
    
    // Send notifications for upcoming renewals
    upcomingRenewals.forEach(subscription => {
      const daysUntilRenewal = Math.ceil((new Date(subscription.renewalDate) - today) / (1000 * 60 * 60 * 24));
      const message = daysUntilRenewal === 0 
        ? `${subscription.name} renews today ($${subscription.price.toFixed(2)})`
        : `${subscription.name} renews in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''} ($${subscription.price.toFixed(2)})`;
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.svg',
        title: 'Subscription Renewal Reminder',
        message: message,
        priority: 2
      });
    });
  });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshData') {
    // Trigger any necessary data refresh
    sendResponse({success: true});
  }
});

// Initialize data when browser starts
chrome.runtime.onStartup.addListener(() => {
  checkUpcomingRenewals();
});
