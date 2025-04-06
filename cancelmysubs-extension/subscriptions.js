// Subscription management functions

// Load all subscriptions from storage
async function loadSubscriptions() {
  return new Promise((resolve) => {
    chrome.storage.local.get('subscriptions', (result) => {
      const subscriptions = result.subscriptions || [];
      
      // Sort subscriptions by renewal date
      subscriptions.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
      
      // Update UI
      displaySubscriptions(subscriptions);
      
      // Update CSV buttons visibility
      const csvActions = document.getElementById('csv-actions');
      if (csvActions) {
        csvActions.style.display = subscriptions.length > 0 ? 'flex' : 'none';
      }
      
      resolve(subscriptions);
    });
  });
}

// Display subscriptions in the UI
function displaySubscriptions(subscriptions) {
  const container = document.getElementById('subscriptions-container');
  const emptyState = document.getElementById('empty-state');
  
  // Clear existing content
  container.innerHTML = '';
  
  if (subscriptions.length === 0) {
    // Show empty state
    emptyState.style.display = 'block';
    document.getElementById('monthly-total').textContent = '$0.00';
    document.getElementById('yearly-total').textContent = '$0.00 per year';
    return;
  }
  
  // Hide empty state
  emptyState.style.display = 'none';
  
  // Calculate total costs by billing cycle
  const monthlyCost = subscriptions
    .filter(sub => sub.billingCycle === 'monthly' || !sub.billingCycle)
    .reduce((sum, sub) => sum + (sub.price || 0), 0);
  
  const yearlyCost = subscriptions
    .filter(sub => sub.billingCycle === 'yearly')
    .reduce((sum, sub) => sum + (sub.price || 0), 0);
  
  const weeklyCost = subscriptions
    .filter(sub => sub.billingCycle === 'weekly')
    .reduce((sum, sub) => sum + (sub.price || 0), 0);
  
  // Calculate annualized total (monthly x 12 + yearly + weekly x 52)
  const annualizedTotal = (monthlyCost * 12) + yearlyCost + (weeklyCost * 52);
  
  // Update the totals in the UI
  document.getElementById('monthly-total').textContent = `$${monthlyCost.toFixed(2)}`;
  document.getElementById('yearly-total').textContent = `$${annualizedTotal.toFixed(2)} per year`;
  
  // Add each subscription
  subscriptions.forEach((subscription, index) => {
    const subscriptionElement = createSubscriptionElement(subscription, index);
    container.appendChild(subscriptionElement);
  });
  
  // Add event listeners for edit and delete actions
  addSubscriptionEventListeners();
}

// Create HTML element for a subscription
function createSubscriptionElement(subscription, index) {
  const element = document.createElement('div');
  element.className = 'subscription-item';
  element.dataset.index = index;
  
  // Calculate days until renewal
  const today = new Date();
  const renewalDate = new Date(subscription.renewalDate);
  const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
  
  // Determine if subscription is expiring soon (within 3 days)
  const isExpiringSoon = daysUntil <= 3 && daysUntil >= 0;
  
  let statusHtml = '';
  if (isExpiringSoon) {
    statusHtml = `<span class="subscription-status expiring-subscription">Renews ${daysUntil === 0 ? 'Today' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}</span>`;
  } else if (daysUntil > 0) {
    statusHtml = `<span class="subscription-status active-subscription">Active</span>`;
  } else {
    statusHtml = `<span class="subscription-status">Overdue</span>`;
  }
  
  // Format the renewal date
  const formattedDate = new Date(subscription.renewalDate).toLocaleDateString();
  
  // Determine billing cycle display
  const billingCycle = subscription.billingCycle || 'monthly';
  const priceLabel = billingCycle === 'monthly' ? 'month' : 
                    (billingCycle === 'yearly' ? 'year' : 'week');
  
  element.innerHTML = `
    <div class="subscription-name">${subscription.name} ${statusHtml}</div>
    <a href="${subscription.url}" class="subscription-url" target="_blank">${subscription.url}</a>
    <div class="subscription-price">$${subscription.price.toFixed(2)} / ${priceLabel}</div>
    <div class="subscription-date">Next renewal: ${formattedDate}</div>
    ${subscription.notes ? `<div class="subscription-notes">${subscription.notes}</div>` : ''}
    <div class="subscription-actions">
      <button class="btn-edit" data-index="${index}" title="Edit"><i class="fas fa-edit"></i></button>
      <button class="btn-delete" data-index="${index}" title="Delete"><i class="fas fa-trash-alt"></i></button>
    </div>
  `;
  
  return element;
}

// Add event listeners to subscription elements
function addSubscriptionEventListeners() {
  // Edit buttons
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', (event) => {
      const index = parseInt(event.currentTarget.dataset.index);
      editSubscription(index);
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', (event) => {
      const index = parseInt(event.currentTarget.dataset.index);
      deleteSubscription(index);
    });
  });
}

// Add a new subscription
async function addSubscription(subscription) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('subscriptions', (result) => {
      const subscriptions = result.subscriptions || [];
      subscriptions.push(subscription);
      
      chrome.storage.local.set({subscriptions: subscriptions}, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(subscription);
        }
      });
    });
  });
}

// Edit a subscription
function editSubscription(index) {
  chrome.storage.local.get('subscriptions', (result) => {
    const subscriptions = result.subscriptions || [];
    const subscription = subscriptions[index];
    
    if (!subscription) {
      return;
    }
    
    // Switch to the Add tab and pre-fill the form
    document.querySelector('[data-tab="add"]').click();
    
    // Update form title
    document.querySelector('.form-title').textContent = 'EDIT SUBSCRIPTION';
    
    // Populate the form
    document.getElementById('service-name').value = subscription.name;
    document.getElementById('service-url').value = subscription.url;
    document.getElementById('price').value = subscription.price;
    document.getElementById('billing-cycle').value = subscription.billingCycle || 'monthly';
    document.getElementById('renewal-date').value = subscription.renewalDate;
    document.getElementById('notes').value = subscription.notes || '';
    
    // Change the form submit button to "Update"
    const submitButton = document.querySelector('#subscription-form button[type="submit"]');
    submitButton.textContent = 'Save Changes';
    
    // Store the index being edited
    document.getElementById('subscription-form').dataset.editIndex = index;
    
    // Override the form submission to update instead of add
    const originalSubmitHandler = document.getElementById('subscription-form').onsubmit;
    document.getElementById('subscription-form').onsubmit = function(event) {
      event.preventDefault();
      
      const updatedSubscription = {
        name: document.getElementById('service-name').value,
        url: document.getElementById('service-url').value,
        price: parseFloat(document.getElementById('price').value),
        billingCycle: document.getElementById('billing-cycle').value,
        renewalDate: document.getElementById('renewal-date').value,
        notes: document.getElementById('notes').value,
        dateAdded: subscription.dateAdded
      };
      
      updateSubscription(index, updatedSubscription).then(() => {
        // Reset the form
        document.getElementById('subscription-form').reset();
        document.getElementById('renewal-date').valueAsDate = new Date();
        
        // Remove the edit index
        delete document.getElementById('subscription-form').dataset.editIndex;
        
        // Restore the original title
        document.querySelector('.form-title').textContent = 'ADD NEW SUBSCRIPTION';
        
        // Restore the original button text
        submitButton.textContent = 'Save';
        
        // Restore original submit handler
        document.getElementById('subscription-form').onsubmit = originalSubmitHandler;
        
        // Switch to subscriptions tab
        document.querySelector('[data-tab="subscriptions"]').click();
        
        // Show success notification
        showNotification('Subscription updated successfully');
      });
    };
  });
}

// Update a subscription
async function updateSubscription(index, updatedSubscription) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('subscriptions', (result) => {
      const subscriptions = result.subscriptions || [];
      subscriptions[index] = updatedSubscription;
      
      chrome.storage.local.set({subscriptions: subscriptions}, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(updatedSubscription);
        }
      });
    });
  });
}

// Delete a subscription
function deleteSubscription(index) {
  if (!confirm('Are you sure you want to delete this subscription?')) {
    return;
  }
  
  chrome.storage.local.get('subscriptions', (result) => {
    const subscriptions = result.subscriptions || [];
    subscriptions.splice(index, 1);
    
    chrome.storage.local.set({subscriptions: subscriptions}, () => {
      // Reload the subscriptions
      loadSubscriptions();
      
      // Show success notification
      showNotification('Subscription deleted successfully');
    });
  });
}
