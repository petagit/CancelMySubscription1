// OpenAI API integration for cancellation instructions

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Get cancellation instructions from ChatGPT
async function getCancellationInstructions(website) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add it in the extension settings.');
  }
  
  const prompt = `I need step-by-step instructions on how to cancel a subscription for ${website}. Please provide a clear, numbered list of instructions that cover the complete cancellation process. Include any specific menus, buttons, or pages I need to navigate to. If there are multiple ways to cancel (website, phone, email), list all methods with clear instructions for each.`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides clear, accurate instructions for cancelling subscriptions and memberships. Focus on being specific and detailed.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to get cancellation instructions: ' + error.message);
  }
}

// Get API key from storage
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get('openaiApiKey', (result) => {
      const apiKey = result.openaiApiKey;
      
      if (apiKey) {
        // Use saved key
        resolve(apiKey);
      } else {
        // If no key is found, try to fetch from our server
        fetch('http://localhost:5000/api/openai-key')
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Failed to fetch OpenAI key from server');
            }
          })
          .then(data => {
            if (data.key) {
              // Save the key for future use
              chrome.storage.local.set({openaiApiKey: data.key});
              resolve(data.key);
            } else {
              // If no key is returned, prompt the user
              const userKey = prompt('Please enter your OpenAI API key:');
              if (userKey) {
                chrome.storage.local.set({openaiApiKey: userKey});
              }
              resolve(userKey);
            }
          })
          .catch(error => {
            console.error('Error fetching OpenAI key:', error);
            // Fall back to prompting the user
            const userKey = prompt('Please enter your OpenAI API key:');
            if (userKey) {
              chrome.storage.local.set({openaiApiKey: userKey});
            }
            resolve(userKey);
          });
      }
    });
  });
}
