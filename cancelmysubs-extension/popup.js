document.addEventListener('DOMContentLoaded', function() {
  // Popular subscription services
  const popularServices = [
    { name: 'Netflix', defaultPrice: '15.49', website: 'https://netflix.com' },
    { name: 'Spotify', defaultPrice: '9.99', website: 'https://spotify.com' },
    { name: 'Disney+', defaultPrice: '7.99', website: 'https://disneyplus.com' },
    { name: 'Amazon Prime', defaultPrice: '14.99', website: 'https://amazon.com/prime' },
    { name: 'Hulu', defaultPrice: '7.99', website: 'https://hulu.com' },
    { name: 'YouTube Premium', defaultPrice: '11.99', website: 'https://youtube.com/premium' },
    { name: 'Apple TV+', defaultPrice: '6.99', website: 'https://tv.apple.com' },
    { name: 'HBO Max', defaultPrice: '9.99', website: 'https://hbomax.com' }
  ];

  // Populate popular services buttons
  const popularServicesContainer = document.getElementById('popular-services');
  popularServices.forEach(service => {
    const button = document.createElement('button');
    button.textContent = service.name;
    button.className = 'service-button';
    button.type = 'button';
    button.addEventListener('click', () => {
      document.getElementById('service-name').value = service.name;
      document.getElementById('price').value = service.defaultPrice;
      document.getElementById('service-url').value = service.website;
    });
    popularServicesContainer.appendChild(button);
  });

  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab pane
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabId) {
          pane.classList.add('active');
        }
      });

      // Load special tab content if needed
      if (tabId === 'cancel-help') {
        loadCurrentWebsiteInfo();
      } else if (tabId === 'subscriptions') {
        loadSubscriptions();
      }
    });
  });

  // Initialize form with today's date
  document.getElementById('renewal-date').valueAsDate = new Date();
  
  // Cancel button for form
  document.getElementById('cancel-add').addEventListener('click', () => {
    document.getElementById('subscription-form').reset();
    document.getElementById('renewal-date').valueAsDate = new Date();
    document.querySelector('[data-tab="subscriptions"]').click();
  });
  
  // Form submission for adding subscriptions
  const subscriptionForm = document.getElementById('subscription-form');
  subscriptionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const subscription = {
      name: document.getElementById('service-name').value,
      url: document.getElementById('service-url').value,
      price: parseFloat(document.getElementById('price').value),
      billingCycle: document.getElementById('billing-cycle').value,
      renewalDate: document.getElementById('renewal-date').value,
      notes: document.getElementById('notes').value,
      dateAdded: new Date().toISOString()
    };
    
    addSubscription(subscription).then(() => {
      subscriptionForm.reset();
      document.getElementById('renewal-date').valueAsDate = new Date();
      
      // Switch to subscriptions tab
      document.querySelector('[data-tab="subscriptions"]').click();
      
      // Show success notification
      showNotification('Subscription added successfully');
    });
  });
  
  // ChatGPT instructions button
  const getInstructionsBtn = document.getElementById('get-instructions');
  getInstructionsBtn.addEventListener('click', async () => {
    const currentWebsite = document.getElementById('current-website').textContent;
    if (currentWebsite === 'Not available') {
      showNotification('No website detected. Please open a website tab first.', 'error');
      return;
    }
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const instructionsContainer = document.getElementById('cancellation-instructions');
    
    try {
      loadingIndicator.classList.remove('hidden');
      instructionsContainer.innerHTML = '';
      
      const instructions = await getCancellationInstructions(currentWebsite);
      
      instructionsContainer.innerHTML = `<p>${instructions}</p>`;
    } catch (error) {
      console.error('Error getting cancellation instructions:', error);
      instructionsContainer.innerHTML = `<p class="error">Error: ${error.message || 'Failed to get cancellation instructions'}</p>`;
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  });
  
  // Toggle highlight cancel buttons
  const highlightToggle = document.getElementById('highlight-toggle');
  highlightToggle.addEventListener('change', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleHighlight',
          enabled: highlightToggle.checked
        });
      }
    });
  });
  
  // Initially load subscriptions
  loadSubscriptions().then(subscriptions => {
    // Show CSV actions if there are subscriptions
    const csvActions = document.getElementById('csv-actions');
    csvActions.style.display = subscriptions.length > 0 ? 'flex' : 'none';
    
    // Set up CSV export button
    document.getElementById('export-csv').addEventListener('click', () => {
      chrome.storage.local.get('subscriptions', (result) => {
        const subs = result.subscriptions || [];
        const message = exportSubscriptionsToCSV(subs);
        showNotification(message);
      });
    });
    
    // Set up CSV import functionality
    document.getElementById('import-csv').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      chrome.storage.local.get('subscriptions', (result) => {
        const existingSubscriptions = result.subscriptions || [];
        
        importSubscriptionsFromCSV(
          file,
          existingSubscriptions,
          (importedSubscriptions) => {
            // Success callback
            const mergedSubscriptions = [...existingSubscriptions, ...importedSubscriptions];
            chrome.storage.local.set({subscriptions: mergedSubscriptions}, () => {
              loadSubscriptions();
              showNotification(`Successfully imported ${importedSubscriptions.length} subscriptions`);
              event.target.value = null; // Reset the file input
            });
          },
          (errorMessage) => {
            // Error callback
            showNotification(errorMessage, 'error');
            event.target.value = null; // Reset the file input
          }
        );
      });
    });
  });
  
  // Check current website for cancel help tab
  if (document.querySelector('[data-tab="cancel-help"]').classList.contains('active')) {
    loadCurrentWebsiteInfo();
  }
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCancelButtonsCount') {
      document.getElementById('cancel-buttons-count').textContent = message.count;
    }
  });
});

// Function to load current website info
function loadCurrentWebsiteInfo() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const url = new URL(tabs[0].url);
      const hostname = url.hostname.replace('www.', '');
      document.getElementById('current-website').textContent = hostname;
      
      // Request cancel button count
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getCancelButtonsCount'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error getting cancel buttons count:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.count !== undefined) {
          document.getElementById('cancel-buttons-count').textContent = response.count;
        }
      });
    } else {
      document.getElementById('current-website').textContent = 'Not available';
    }
  });
}

// Utility function to show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }, 10);
}
