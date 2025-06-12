// Function to get API key from localStorage
function getGroqApiKey() {
  return localStorage.getItem('groq_api_key') || '';
}

// API URLs, Keys, and Models
const apiConfigs = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: getGroqApiKey(),
    models: ["llama3-70b-8192", "llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"]
  },
  fireworks: {
    url: "https://api.fireworks.ai/inference/v1/chat/completions",
    key: "",
    models: ["accounts/fireworks/models/llama-v3p1-70b-instruct"]
  },
  claude: {
    url: "https://api.anthropic.com/v1/messages",
    key: "",
    models: ["claude-3-5-sonnet-20240620"]
  }
};

let apiKey = apiConfigs.groq.key;  // Default to Groq API Key
let apiUrl = apiConfigs.groq.url;  // Default to Groq API URL
let model = "meta-llama/llama-4-scout-17b-16e-instruct";  // Default Groq Model (scout)

// Ensure default is in the list
if (!apiConfigs.groq.models.includes(model)) {
  apiConfigs.groq.models.unshift(model);
}

// Load saved model from localStorage if available
const storedGroqModel = localStorage.getItem('groq_model');
if (storedGroqModel) {
  model = storedGroqModel;
}

// Function to get URL parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Function to handle URL query parameter
function handleUrlQuery() {
  const query = getUrlParameter('q');
  if (query) {
    const decodedQuery = decodeURIComponent(query);
    // Store the query but don't show it in input field
    window.hiddenQuery = decodedQuery;
    // Set flag to hide the first message
    window.hideFirstUserMessage = true;
    // Automatically send the message after a short delay to ensure everything is loaded
    setTimeout(() => {
      sendHiddenMessage();
    }, 500);
  }
}

// Function to update API key from localStorage
function updateApiKeyFromStorage() {
  const storedApiKey = getGroqApiKey();
  apiKey = storedApiKey;
  apiConfigs.groq.key = storedApiKey;
  
  // Update UI if API key input exists
  if (apiKeyInput) {
    apiKeyInput.value = storedApiKey;
  }
}

// Clear content immediately when DOM is ready (faster than window.onload)
document.addEventListener('DOMContentLoaded', function() {
  // Get elements and clear them immediately
  const chatboxElement = document.getElementById("chatbox");
  const latestResponseElement = document.getElementById("latest-response");
  const userInputElement = document.getElementById("user-input");
  
  if (chatboxElement) chatboxElement.innerHTML = '';
  if (latestResponseElement) latestResponseElement.innerHTML = '';
  if (userInputElement) userInputElement.value = '';
  
  // Clear global variables
  messageHistory = [];
  lastBotResponse = "";
  window.hiddenQuery = null;
  window.hideFirstUserMessage = false;
  
  // Show content after clearing by adding class to body
  document.body.classList.add('content-ready');
});

// Ensure everything is ready when page fully loads
window.onload = function () {
  // Double-check clearing (in case DOMContentLoaded missed anything)
  chatbox.innerHTML = '';
  latestResponseBox.innerHTML = '';
  userInput.value = '';
  
  // Update API key from localStorage
  updateApiKeyFromStorage();
  
  // Handle URL query parameter
  handleUrlQuery();
};

// Listen for localStorage changes (when API key is updated in settings)
window.addEventListener('storage', function(e) {
  if (e.key === 'groq_api_key') {
    updateApiKeyFromStorage();
  }
});

const apiProviderDropdown = document.getElementById("api-provider");
const apiUrlInput = document.getElementById("api-url");
const apiKeyInput = document.getElementById("api-key");
const modelSelect = document.getElementById("model-select");
const messageLimitInput = document.getElementById("message-limit-input");  // Message limit input field

const sentCharactersLabel = document.getElementById("sent-characters");
const receivedCharactersLabel = document.getElementById("received-characters");
const sentTokensLabel = document.getElementById("sent-tokens");
const receivedTokensLabel = document.getElementById("received-tokens");

if (storedGroqModel && modelSelect) {
  modelSelect.value = storedGroqModel;
}

// Function to update model input based on selected API provider
function updateModelInput(provider) {
  const defaultModel = apiConfigs[provider].models[0];
  modelSelect.value = defaultModel;  // Set default model for the selected provider
  model = defaultModel;
}


// Function to handle API provider changes
apiProviderDropdown.addEventListener("change", function() {
  const selectedProvider = this.value;
  apiUrl = apiConfigs[selectedProvider].url;
  apiKey = apiConfigs[selectedProvider].key;
  apiUrlInput.value = apiUrl;
  apiKeyInput.value = apiKey;
  updateModelInput(selectedProvider);
});

modelSelect.addEventListener("input", function() {
  model = this.value;  // Update the model name
  localStorage.setItem('groq_model', model);
});

const chatbox = document.getElementById("chatbox");
const latestResponseBox = document.getElementById("latest-response");
const spinner = document.getElementById("spinner");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const saveBtn = document.getElementById("save-btn");
const loadFileBtn = document.getElementById("load-file-btn");
const loadFileInput = document.getElementById("load-file");
const newChatBtn = document.getElementById("new-chat-btn");
const saveResponseBtn = document.getElementById("save-response-btn");

let temperature = 0.1;  // Default temperature value
const temperatureSlider = document.getElementById("temperature-slider");
const temperatureValueLabel = document.getElementById("temperature-value");

// Load saved temperature
const storedTemperature = localStorage.getItem('groq_temperature');
if (storedTemperature !== null) {
  temperature = parseFloat(storedTemperature);
  if (temperatureSlider) temperatureSlider.value = temperature;
  if (temperatureValueLabel) temperatureValueLabel.textContent = temperature;
} else {
  if (temperatureSlider) temperatureSlider.value = temperature;
  if (temperatureValueLabel) temperatureValueLabel.textContent = temperature;
}

temperatureSlider.addEventListener("input", function() {
  temperature = parseFloat(this.value);
  temperatureValueLabel.textContent = temperature;  // Display the current temperature
  localStorage.setItem('groq_temperature', temperature.toString());
});

let topP = 1.0;  // Default top_p value
const topPSlider = document.getElementById("top-p-slider");
const topPValueLabel = document.getElementById("top-p-value");

// Load saved top_p
const storedTopP = localStorage.getItem('groq_top_p');
if (storedTopP !== null) {
  topP = parseFloat(storedTopP);
  if (topPSlider) topPSlider.value = topP;
  if (topPValueLabel) topPValueLabel.textContent = topP;
}

topPSlider.addEventListener("input", function() {
  topP = parseFloat(this.value);
  topPValueLabel.textContent = topP;  // Display the current top_p value
  localStorage.setItem('groq_top_p', topP.toString());
});

// Character limit input
const characterLimitInput = document.getElementById("character-limit-input");
let characterLimit = 25000;  // Default character limit

characterLimitInput.addEventListener("input", function() {
  characterLimit = parseInt(this.value);
  document.getElementById("character-limit-value").textContent = characterLimit;
});

// Max tokens input
const maxTokensInput = document.getElementById("max-tokens-input");  // Max tokens input field
let maxTokens = parseInt(maxTokensInput.value);  // Default to 8192

// Load saved max tokens
const storedMaxTokens = localStorage.getItem('groq_max_tokens');
if (storedMaxTokens !== null) {
  maxTokens = parseInt(storedMaxTokens);
  if (maxTokensInput) maxTokensInput.value = maxTokens;
}

maxTokensInput.addEventListener("input", function() {
  maxTokens = parseInt(this.value);
  localStorage.setItem('groq_max_tokens', maxTokens.toString());
});

const systemInput = document.getElementById("system-input");
let messageHistory = [];
let lastBotResponse = "";  // Store the last response for saving to file

// Function to handle API errors
function handleAPIError(error) {
  chatbox.innerHTML += `<p class="error-message"><strong>Error:</strong> ${error.message}</p>`;
}

// Function to calculate total characters in messages
function calculateTotalCharacters(messages) {
  return messages.reduce((total, message) => total + message.content.length, 0);
}

// Function to calculate the token count based on characters
function calculateTokens(characters) {
  return Math.ceil(characters / 4.2);  // Approximate tokens count
}

// Function to format text with proper line breaks
function formatText(text) {
  if (!text) return '';
  return text
    .replace(/\n\n/g, '<br><br>')  // Double line breaks
    .replace(/\n/g, '<br>')        // Single line breaks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
    .replace(/\*(.*?)\*/g, '<em>$1</em>');             // Italic text
}

// Function to send a hidden message from URL parameter
async function sendHiddenMessage() {
  if (!window.hiddenQuery) return;
  
  const userMessage = window.hiddenQuery;
  window.hiddenQuery = null; // Clear after use
  
  // Check if API key is available
  const currentApiKey = getGroqApiKey();
  if (!currentApiKey) {
    chatbox.innerHTML += `<p class="error-message"><strong>Error:</strong> Groq API key not found. Please set it in Main Settings.</p>`;
    chatbox.innerHTML += `<p class="info-message"><strong>How to get free Groq API key:</strong><br>
    1. Go to <a href="https://console.groq.com/keys" target="_blank" style="color: #007bff;">https://console.groq.com/keys</a><br>
    2. Sign up or log in to your account<br>
    3. Click "Create API Key"<br>
    4. Copy the generated key<br>
    5. Paste it in → Repetitions → Main Settings (⋮) → Groq API key</p>`;
    chatbox.scrollTop = chatbox.scrollHeight;
    return;
  }

  // Update API key in case it was changed in settings
  apiKey = currentApiKey;

  // Disable the send button but keep input active
  sendBtn.disabled = true;

  // Add the new user message to the history but don't display it
  messageHistory.push({ role: "user", content: userMessage });

  // Get the limit of messages to send from the input field
  const messageLimit = parseInt(messageLimitInput.value);

  // Ensure the total character count of messages is under the specified character limit
  let totalCharacters = calculateTotalCharacters(messageHistory);
  while (totalCharacters > characterLimit && messageHistory.length > 1) {
    messageHistory.shift();  // Remove the oldest message if the limit is exceeded
    totalCharacters = calculateTotalCharacters(messageHistory);  // Recalculate total characters
  }

  // Limit the number of messages sent to the API based on the user's input
  const limitedMessageHistory = messageHistory.slice(-messageLimit);

  // Ensure the first message is from the user for Claude
  if (apiUrl.includes('anthropic') && limitedMessageHistory.length > 0 && limitedMessageHistory[0].role !== 'user') {
    const firstUserMessage = messageHistory.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      limitedMessageHistory.unshift(firstUserMessage);  // Add a user message to the start if needed
    }
  }

  // Add system prompt to the beginning for non-Claude APIs
  if (!apiUrl.includes('anthropic') && systemInput.value.trim()) {
    limitedMessageHistory.unshift({ role: "system", content: systemInput.value });
  }

  // Calculate and display sent characters and tokens
  const sentCharacters = calculateTotalCharacters(limitedMessageHistory);
  sentCharactersLabel.textContent = sentCharacters;
  const sentTokens = calculateTokens(sentCharacters);
  sentTokensLabel.textContent = sentTokens;

  // Show spinner
  spinner.style.display = "block";

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (apiUrl.includes('anthropic')) {
      headers['x-api-key'] = apiKey;  // Claude uses x-api-key directly
      headers['anthropic-version'] = '2023-06-01';  // Add the required version header for Claude

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model,
          temperature: temperature,
          top_p: topP,
          max_tokens: maxTokens,
          system: systemInput.value,  // Send the system prompt for Claude
          messages: limitedMessageHistory
        })
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Error: ${response.status} - ${response.statusText}\nDetails: ${errorDetails}`);
      }

      const data = await response.json();
      const botMessage = data.content?.[0]?.text || "No content in the response";  // Get the text from content array

      lastBotResponse = botMessage;

      const receivedCharacters = botMessage.length;
      receivedCharactersLabel.textContent = receivedCharacters;
      const receivedTokens = calculateTokens(receivedCharacters);
      receivedTokensLabel.textContent = receivedTokens;

      messageHistory.push({ role: "assistant", content: botMessage });
      chatbox.innerHTML += `<p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
      latestResponseBox.innerHTML = `<p class="user-message"><strong>You:</strong> ${formatText(userMessage)}</p>
                                     <p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
    } else {
      // Groq and Fireworks API handling
      headers['Authorization'] = `Bearer ${apiKey}`;  // Use Bearer for other APIs

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model,  // Use the selected model
          messages: limitedMessageHistory,  // Send system prompt and limited message history
          temperature: temperature,  // Include temperature
          top_p: topP,
          max_tokens: maxTokens  // Set max tokens based on UI input
        })
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Error: ${response.status} - ${response.statusText}\nDetails: ${errorDetails}`);
      }

      const data = await response.json();
      const botMessage = data.choices[0].message.content;

      lastBotResponse = botMessage;

      const receivedCharacters = botMessage.length;
      receivedCharactersLabel.textContent = receivedCharacters;
      const receivedTokens = calculateTokens(receivedCharacters);
      receivedTokensLabel.textContent = receivedTokens;

      messageHistory.push({ role: "assistant", content: botMessage });
      chatbox.innerHTML += `<p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
      latestResponseBox.innerHTML = `<p class="user-message"><strong>You:</strong> ${formatText(userMessage)}</p>
                                     <p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
    }

    // saveResponseBtn.style.display = "block"; // Hidden by user request

    chatbox.scrollTop = chatbox.scrollHeight;

  } catch (error) {
    handleAPIError(error);
  } finally {
    spinner.style.display = "none";
    sendBtn.disabled = false;
  }
}

// Function to send a message to the selected API
async function sendMessage() {
  const userMessage = userInput.value;
  if (!userMessage.trim()) return;

  // Check if API key is available
  const currentApiKey = getGroqApiKey();
  if (!currentApiKey) {
    chatbox.innerHTML += `<p class="error-message"><strong>Error:</strong> Groq API key not found. Please set it in Main Settings.</p>`;
    chatbox.innerHTML += `<p class="info-message"><strong>How to get free Groq API key:</strong><br>
    1. Go to <a href="https://console.groq.com/keys" target="_blank" style="color: #007bff;">https://console.groq.com/keys</a><br>
    2. Sign up or log in to your account<br>
    3. Click "Create API Key"<br>
    4. Copy the generated key<br>
    5. Paste it in → Repetitions → Main Settings (⋮) → Groq API key</p>`;
    chatbox.scrollTop = chatbox.scrollHeight;
    return;
  }

  // Update API key in case it was changed in settings
  apiKey = currentApiKey;

  // Check if a message is already being processed (send button disabled)
  if (sendBtn.disabled) {
    chatbox.innerHTML += `<p class="warning-message"><strong>Wait for full response, first</strong></p>`;
    chatbox.scrollTop = chatbox.scrollHeight;
    return;
  }

  // Disable the send button but keep input active
  sendBtn.disabled = true;

  // Add the new user message to the history
  messageHistory.push({ role: "user", content: userMessage });
  // Don't display the first user message if it's from URL parameter
  if (!window.hideFirstUserMessage) {
    chatbox.innerHTML += `<p class="user-message"><strong>You:</strong> ${formatText(userMessage)}</p>`;
  } else {
    // Reset the flag after first use
    window.hideFirstUserMessage = false;
  }
  userInput.value = "";

  // Get the limit of messages to send from the input field
  const messageLimit = parseInt(messageLimitInput.value);

  // Ensure the total character count of messages is under the specified character limit
  let totalCharacters = calculateTotalCharacters(messageHistory);
  while (totalCharacters > characterLimit && messageHistory.length > 1) {
    messageHistory.shift();  // Remove the oldest message if the limit is exceeded
    totalCharacters = calculateTotalCharacters(messageHistory);  // Recalculate total characters
  }

  // Limit the number of messages sent to the API based on the user's input
  const limitedMessageHistory = messageHistory.slice(-messageLimit);

  // Ensure the first message is from the user for Claude
  if (apiUrl.includes('anthropic') && limitedMessageHistory.length > 0 && limitedMessageHistory[0].role !== 'user') {
    const firstUserMessage = messageHistory.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      limitedMessageHistory.unshift(firstUserMessage);  // Add a user message to the start if needed
    }
  }

  // Add the system prompt to the message history for Groq and Fireworks
  if (!apiUrl.includes('anthropic')) {
    limitedMessageHistory.unshift({ role: "system", content: systemInput.value });
  }

  // Calculate and display the number of characters being sent
  const sentCharacters = calculateTotalCharacters(limitedMessageHistory);
  sentCharactersLabel.textContent = sentCharacters;
  const sentTokens = calculateTokens(sentCharacters);
  sentTokensLabel.textContent = sentTokens;

  spinner.style.display = "block";

  try {
    // Prepare headers
    let headers = {
      'Content-Type': 'application/json'
    };

    if (apiUrl.includes('anthropic')) {
      headers['x-api-key'] = apiKey;  // Claude uses x-api-key directly
      headers['anthropic-version'] = '2023-06-01';  // Add the required version header for Claude

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model,
          temperature: temperature,
          top_p: topP,
          max_tokens: maxTokens,
          system: systemInput.value,  // Send the system prompt for Claude
          messages: limitedMessageHistory
        })
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Error: ${response.status} - ${response.statusText}\nDetails: ${errorDetails}`);
      }

      const data = await response.json();
      const botMessage = data.content?.[0]?.text || "No content in the response";  // Get the text from content array

      lastBotResponse = botMessage;

      const receivedCharacters = botMessage.length;
      receivedCharactersLabel.textContent = receivedCharacters;
      const receivedTokens = calculateTokens(receivedCharacters);
      receivedTokensLabel.textContent = receivedTokens;

      messageHistory.push({ role: "assistant", content: botMessage });
      chatbox.innerHTML += `<p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
      latestResponseBox.innerHTML = `<p class="user-message"><strong>You:</strong> ${formatText(userMessage)}</p>
                                     <p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
    } else {
      // Groq and Fireworks API handling
      headers['Authorization'] = `Bearer ${apiKey}`;  // Use Bearer for other APIs

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model,  // Use the selected model
          messages: limitedMessageHistory,  // Send system prompt and limited message history
          temperature: temperature,  // Include temperature
          top_p: topP,
          max_tokens: maxTokens  // Set max tokens based on UI input
        })
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Error: ${response.status} - ${response.statusText}\nDetails: ${errorDetails}`);
      }

      const data = await response.json();
      const botMessage = data.choices[0].message.content;

      lastBotResponse = botMessage;

      const receivedCharacters = botMessage.length;
      receivedCharactersLabel.textContent = receivedCharacters;
      const receivedTokens = calculateTokens(receivedCharacters);
      receivedTokensLabel.textContent = receivedTokens;

      messageHistory.push({ role: "assistant", content: botMessage });
      chatbox.innerHTML += `<p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
      latestResponseBox.innerHTML = `<p class="user-message"><strong>You:</strong> ${formatText(userMessage)}</p>
                                     <p class="bot-message"><strong>DictAI:</strong> ${formatText(botMessage)}</p>`;
    }

    // saveResponseBtn.style.display = "block"; // Hidden by user request

    chatbox.scrollTop = chatbox.scrollHeight;

  } catch (error) {
    handleAPIError(error);
  } finally {
    spinner.style.display = "none";
    sendBtn.disabled = false;
  }
}

// Function to save the last response to a file
function saveResponseToFile() {
  if (lastBotResponse.trim()) {
    const blob = new Blob([lastBotResponse], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dictai_response.txt';
    link.click();
  } else {
    alert("No response available to save.");
  }
}

// Function to generate a unique chat name
function generateChatName() {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0];
  const timePart = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `chat-${datePart}_${timePart}`;
}

// Function to save the entire chat history
function saveChat() {
  const chatName = generateChatName();
  const chatData = {
    messageHistory,  // Save the entire message history
    systemPrompt: systemInput.value,
    temperature: temperature,
    topP: topP
  };
  
  const chatDataJson = JSON.stringify(chatData, null, 2);

  const blob = new Blob([chatDataJson], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${chatName}.json`;  
  link.click();

  alert(`Chat saved as: ${chatName}`);  
}

// Function to start a new chat
function startNewChat() {
  messageHistory = [];
  chatbox.innerHTML = '';
  latestResponseBox.innerHTML = '';
  userInput.value = '';
  systemInput.value = document.getElementById("system-input").value; 
}

// Function to load chat from a file
function loadChatFromFile(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const { messageHistory: loadedMessages, systemPrompt, temperature: loadedTemperature, topP: loadedTopP } = JSON.parse(event.target.result);
      messageHistory = loadedMessages;  
      systemInput.value = systemPrompt;
      temperature = loadedTemperature;
      temperatureSlider.value = loadedTemperature;
      temperatureValueLabel.textContent = loadedTemperature;
      if (loadedTopP !== undefined) {
        topP = loadedTopP;
        topPSlider.value = loadedTopP;
        topPValueLabel.textContent = loadedTopP;
      }

      chatbox.innerHTML = '';  
      latestResponseBox.innerHTML = '';  

      let lastUserMessage = '';
      let lastBotMessage = '';

      messageHistory.forEach(message => {
        const messageClass = message.role === "user" ? "user-message" : "bot-message";
        chatbox.innerHTML += `<p class="${messageClass}"><strong>${message.role === "user" ? "You" : "DictAI"}:</strong> ${formatText(message.content)}</p>`;

        if (message.role === "user") {
          lastUserMessage = message.content;
        } else if (message.role === "assistant") {
          lastBotMessage = message.content;
        }
      });

      if (lastUserMessage && lastBotMessage) {
        latestResponseBox.innerHTML = `<p class="user-message"><strong>You:</strong> ${formatText(lastUserMessage)}</p>
                                       <p class="bot-message"><strong>DictAI:</strong> ${formatText(lastBotMessage)}</p>`;
      }

      chatbox.scrollTop = chatbox.scrollHeight;
      alert("Chat loaded from file!");

    } catch (e) {
      alert("Error loading chat from file.");
    }
  };
  reader.readAsText(file);
}

// Event listener for the "Save Response to File" button
saveResponseBtn.addEventListener("click", saveResponseToFile);

// Event listener to detect Enter key in the input field
userInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();  // Trigger message sending when Enter is pressed
  }
});

sendBtn.addEventListener("click", sendMessage);
saveBtn.addEventListener("click", saveChat);
newChatBtn.addEventListener("click", startNewChat);
loadFileBtn.addEventListener("click", () => loadFileInput.click());
loadFileInput.addEventListener("change", function() {
  if (this.files.length > 0) {
    loadChatFromFile(this.files[0]);
  }
});
