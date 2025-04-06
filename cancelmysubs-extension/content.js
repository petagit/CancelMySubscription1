// Constants for cancel button detection
const CANCEL_KEYWORDS = [
  'cancel', 'unsubscribe', 'end subscription', 'terminate', 'stop subscription',
  'stop service', 'delete account', 'close account', 'end membership'
];

// Variables
let highlightEnabled = true;
let highlightedElements = [];

// Function to find and highlight cancel buttons
function findAndHighlightCancelButtons() {
  // Remove previous highlights
  removeHighlights();
  
  if (!highlightEnabled) {
    return 0;
  }
  
  const potentialElements = [];
  
  // Find elements containing cancel keywords
  CANCEL_KEYWORDS.forEach(keyword => {
    // Look for text content
    const textNodes = findTextNodesContaining(keyword);
    textNodes.forEach(node => {
      const element = getClickableParent(node);
      if (element && !potentialElements.includes(element)) {
        potentialElements.push(element);
      }
    });
    
    // Look for buttons, links, and other clickable elements
    const clickables = document.querySelectorAll('a, button, [role="button"], input[type="button"], input[type="submit"]');
    clickables.forEach(element => {
      const text = element.textContent.toLowerCase();
      const attr = [
        element.getAttribute('aria-label') || '',
        element.getAttribute('title') || '',
        element.getAttribute('name') || '',
        element.getAttribute('id') || '',
        element.getAttribute('value') || ''
      ].join(' ').toLowerCase();
      
      if ((text.includes(keyword) || attr.includes(keyword)) && !potentialElements.includes(element)) {
        potentialElements.push(element);
      }
    });
  });
  
  // Highlight the found elements
  potentialElements.forEach(element => {
    highlightElement(element);
  });
  
  // Store the highlighted elements for later removal
  highlightedElements = potentialElements;
  
  // Return the count of found elements
  return potentialElements.length;
}

// Function to find text nodes containing a keyword
function findTextNodesContaining(keyword) {
  const result = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.nodeValue.toLowerCase().includes(keyword.toLowerCase())) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    result.push(node);
  }
  
  return result;
}

// Find clickable parent element
function getClickableParent(node) {
  let element = node.parentElement;
  while (element) {
    if (isClickable(element)) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

// Check if an element is clickable
function isClickable(element) {
  const clickableTags = ['A', 'BUTTON'];
  const clickableRoles = ['button', 'link', 'menuitem'];
  
  return (
    clickableTags.includes(element.tagName) ||
    element.hasAttribute('onclick') ||
    clickableRoles.includes(element.getAttribute('role')) ||
    element.getAttribute('tabindex') === '0'
  );
}

// Highlight an element
function highlightElement(element) {
  if (!element) return;
  
  // Store original styles
  element.dataset.originalOutline = element.style.outline;
  element.dataset.originalBoxShadow = element.style.boxShadow;
  element.dataset.originalPosition = element.style.position;
  
  // Apply highlight styles
  element.style.outline = '3px solid #EA4335';
  element.style.boxShadow = '0 0 0 2px rgba(234, 67, 53, 0.3)';
  
  // Add a relative position if not already positioned
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }
}

// Remove highlights
function removeHighlights() {
  highlightedElements.forEach(element => {
    if (element) {
      // Restore original styles
      element.style.outline = element.dataset.originalOutline || '';
      element.style.boxShadow = element.dataset.originalBoxShadow || '';
      element.style.position = element.dataset.originalPosition || '';
      
      // Clean up data attributes
      delete element.dataset.originalOutline;
      delete element.dataset.originalBoxShadow;
      delete element.dataset.originalPosition;
    }
  });
  
  highlightedElements = [];
}

// Listen for DOM changes to find new cancel buttons
const observer = new MutationObserver(() => {
  if (highlightEnabled) {
    const count = findAndHighlightCancelButtons();
    chrome.runtime.sendMessage({
      action: 'updateCancelButtonsCount',
      count: count
    });
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

// Initial scan for cancel buttons
window.addEventListener('load', () => {
  setTimeout(() => {
    const count = findAndHighlightCancelButtons();
    chrome.runtime.sendMessage({
      action: 'updateCancelButtonsCount',
      count: count
    });
  }, 1000);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleHighlight') {
    highlightEnabled = message.enabled;
    if (highlightEnabled) {
      const count = findAndHighlightCancelButtons();
      sendResponse({count: count});
    } else {
      removeHighlights();
      sendResponse({count: 0});
    }
  } else if (message.action === 'getCancelButtonsCount') {
    const count = highlightedElements.length;
    sendResponse({count: count});
  }
  
  return true; // Keep the message channel open for async response
});
