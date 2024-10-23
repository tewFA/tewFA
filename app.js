const tokenList = document.getElementById('token-list');
const passcodeLockScreen = document.getElementById('passcode-lock-screen');
const passcodeSetupScreen = document.getElementById('passcode-setup-screen');
const addTokenModal = document.getElementById('add-token-modal');
let countdownTime = 30; // Time in seconds for the countdown
const timerElement = document.getElementById('timer');
const editTokenModal = document.getElementById('edit-token-modal');
let editingTokenIndex = null; // To track the token being edited

// Encryption setup (using CryptoJS)
const secretKey = localStorage.getItem('secretKey') || '123'; // Store this securely

const encrypt = (text) => CryptoJS.AES.encrypt(text, secretKey).toString();
const decrypt = (ciphertext) => {
    try {
        if (!ciphertext) return null; // If cipher text is null or undefined, return null
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return null; // Return null if decryption fails
    }
};

// Custom toast notifications
function sendToast(message, color) {
    const notificationCenter = document.getElementById('notifications');
    
    const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.textContent = message;
         notificationCenter.appendChild(toast);
        
        // Create a separate color circle element
        const colorCircle = document.createElement('div');
        colorCircle.classList.add('color-circle');
        toast.appendChild(colorCircle);
        
        // Set the style.background property
        colorCircle.style.background = color;
    
    setTimeout(() => {
      toast.remove();
    }, 3000); // wait for 3 seconds
}

// Function to calculate the remaining time in the current 30-second interval
function getRemainingTime() {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds since epoch
    const remainingTime = 30 - (currentTime % 30); // Calculate remaining time in the 30-second interval
    return remainingTime;
}

// Function to start the synchronized timer
function startSyncedTimer() {
    updateTimer(); // Initial call to set the timer value immediately

    setInterval(() => {
        updateTimer(); // Update the timer every second
    }, 1000); // Check every second for accurate updates
}

// Function to update the timer display and refresh tokens if needed
function updateTimer() {
    const remainingTime = getRemainingTime();
    timerElement.innerText = `${remainingTime}s`;

    // Refresh tokens if the interval has reset
    if (remainingTime === 30) {
        loadTokens(); // Refresh OTP tokens when a new interval starts
        // tokenCodes.classList.remove('red');
        const tokenCodes = document.getElementsByClassName('token-code');
        for (let i = 0; i < tokenCodes.length; i++) {
          tokenCodes[i].classList.remove('red');
        }
    }
    
    if (remainingTime < 6) {
        // tokenCodes.classList.add('red');
        const tokenCodes = document.getElementsByClassName('token-code');
        for (let i = 0; i < tokenCodes.length; i++) {
          tokenCodes[i].classList.add('red');
        }

    }
}

// Check if passcode is set
function isPasscodeSet() {
    return!!localStorage.getItem('appPasscode');
}

// Set passcode for the first time
function setPasscode() {
    const newPasscode = document.getElementById('new-passcode').value;
    const confirmPasscode = document.getElementById('confirm-passcode').value;

    if (newPasscode && newPasscode === confirmPasscode) {
        // Encrypt the passcode with the user-provided secret key
        const encryptedPasscode = encrypt(newPasscode);
        localStorage.setItem('appPasscode', encryptedPasscode);

        passcodeSetupScreen.classList.add('hidden');
        tokenList.classList.remove('hidden');
        sendToast('Passcode set.', 'green');
    } else {
        alert('Passcodes do not match.');
    }
}

// Unlock the app with the passcode
function unlockApp() {
    const enteredPasscode = document.getElementById('passcode').value;
    const storedPasscode = decrypt(localStorage.getItem('appPasscode'));

    if (enteredPasscode === storedPasscode) {
        passcodeLockScreen.classList.add('hidden');
        tokenList.classList.remove('hidden');

        // Decrypt the stored passcodes with the user-provided secret key
        const encryptedTokens = localStorage.getItem('tokens');
        if (encryptedTokens) {
            const tokens = JSON.parse(decrypt(encryptedTokens));
            renderTokens(tokens);
            sendToast('Tokens loaded', 'var(--accent-color)');
        }
    } else {
        sendToast('Incorrect passcode', 'red');
    }
}

// Show the Add Token Modal
function showAddTokenModal() {
    addTokenModal.classList.remove('hidden');
}

// Close the Add Token Modal
function closeAddTokenModal() {
    addTokenModal.classList.add('hidden');
}

// Load tokens from localStorage and render them
function loadTokens() {
    const encryptedTokens = localStorage.getItem('tokens');
    if (encryptedTokens) {
        const tokens = JSON.parse(decrypt(encryptedTokens));
        renderTokens(tokens);
    }
}

// Add a new token
function addToken() {
    const name = document.getElementById('token-name').value;
    const secret = document.getElementById('token-secret').value;
    const color = document.getElementById('token-color').value;

    if (name && secret) {
        const encryptedTokens = localStorage.getItem('tokens');
        const tokens = encryptedTokens ? JSON.parse(decrypt(encryptedTokens)) || [] : [];
        tokens.push({ name, secret, color });
        localStorage.setItem('tokens', encrypt(JSON.stringify(tokens)));
        renderTokens(tokens);
        closeAddTokenModal();
        sendToast('Token added successfully!', 'green');
    } else {
        alert('Please fill in both the name and secret key fields.');
    }
}

// Show the Edit Token Modal
function showEditTokenModal(index) {
    const encryptedTokens = localStorage.getItem('tokens');
    if (encryptedTokens) {
        const tokens = JSON.parse(decrypt(encryptedTokens));
        const token = tokens[index];

        document.getElementById('edit-token-name').value = token.name;
        document.getElementById('edit-token-secret').value = token.secret;
        document.getElementById('edit-token-color').value = token.color;

        editingTokenIndex = index; // Set the index of the token being edited
        editTokenModal.classList.remove('hidden');
    }
}

// Close the Edit Token Modal
function closeEditTokenModal() {
    editTokenModal.classList.add('hidden');
    editingTokenIndex = null;
}

// Update the token after editing
function updateToken() {
    const name = document.getElementById('edit-token-name').value;
    const secret = document.getElementById('edit-token-secret').value;
    const color = document.getElementById('edit-token-color').value;

    if (name && secret && editingTokenIndex !== null) {
        const encryptedTokens = localStorage.getItem('tokens');
        const tokens = encryptedTokens ? JSON.parse(decrypt(encryptedTokens)) || [] : [];

        tokens[editingTokenIndex] = { name, secret, color }; // Update the token

        localStorage.setItem('tokens', encrypt(JSON.stringify(tokens)));
        renderTokens(tokens);
        closeEditTokenModal();
        sendToast('Token updated.', 'green')
    } else {
        alert('Please fill in all fields.');
    }
}

// Render tokens on the screen
function renderTokens(tokens) {
    tokenList.innerHTML = '';
    tokens.forEach((token, index) => {
        const tokenElement = document.createElement('div');
        tokenElement.classList.add('token-card');

        // Create a div for the color line
        const colorLine = document.createElement('div');
        colorLine.classList.add('color-line');
        colorLine.style.backgroundColor = token.color || '#760eff';
        tokenElement.appendChild(colorLine);

        // Token content (Name and OTP)
        const tokenContent = document.createElement('div');
        tokenContent.classList.add('token-details');
        tokenContent.innerHTML = `
            <span>${token.name}</span>
            <div class="token-code" onclick="copyToClipboard('${getOtp(token.secret)}')">
                ${getOtp(token.secret)}
            </div>
            <div class="token-buttons">
                <button onclick="showEditTokenModal(${index})" class="edit-btn" style="color: ${token.color};">Edit</button>
                <button onclick="removeToken(${index})" class="remove-btn">Remove</button>
            </div>
        `;

        tokenElement.appendChild(tokenContent);
        tokenList.appendChild(tokenElement);
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
       .then(() => {
            sendToast('Token copied!', 'green');
        })
       .catch(err => {
            console.error('Could not copy text: ', err);
        });
}

function removeToken(index) {
    const encryptedTokens = localStorage.getItem('tokens');
    if (encryptedTokens) {
        const tokens = JSON.parse(decrypt(encryptedTokens)) || [];
        tokens.splice(index, 1); // Remove the token at the specified index
        localStorage.setItem('tokens', encrypt(JSON.stringify(tokens))); // Update local storage
        renderTokens(tokens); // Re-render the tokens
    }
}

// Generate OTP
function getOtp(secret) {
    const totp = new jsOTP.totp();
    return totp.getOtp(secret);  // Use jsOTP to generate the OTP
}

// Settings
// Initialize the settings modal
function initSettingsModal() {
  const importButton = document.getElementById('import-button');
  const exportButton = document.getElementById('export-button');

  importButton.addEventListener('click', () => {
    importTokensFromJSON();
  });

  exportButton.addEventListener('click', () => {
    exportTokensToJSON();
  });
}

// Import tokens from JSON
function importTokensFromJSON() {
  // Prompt the user to select a file
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // Read the file contents
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        
        const encryptedTokens = localStorage.getItem('tokens');
        if (encryptedTokens) {
          const tokens = JSON.parse(decrypt(encryptedTokens));
          
          // Update existing tokens with imported data
          data.forEach((token, index) => {
            tokens[index] = token;
          });

          localStorage.setItem('tokens', encrypt(JSON.stringify(tokens)));
        } else {
          // Create a new array if no tokens exist
          localStorage.setItem('tokens', encrypt(JSON.stringify(data)));
        }

        // Update UI and close modal
        renderTokens(data);
        closeSettingsModal();
      };

      // Start reading the file as text
      reader.readAsText(file);
    }
  });

  // Append the file input to the DOM and trigger file selection
  document.getElementById('data-management').appendChild(fileInput);
  fileInput.click();  // Open file selection dialog

  // Clean up by removing the file input after use
  document.body.removeChild(fileInput);
}
// Export tokens to JSON
function exportTokensToJSON() {
  const encryptedTokens = localStorage.getItem('tokens');
  if (encryptedTokens) {
    // Get the token data
    const tokens = JSON.parse(decrypt(encryptedTokens));
    
    // Create a blob of the JSON data
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create an anchor element and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tokens.json';
    document.body.appendChild(a); // Append the link to the DOM
    a.click(); // Simulate a click to download the file
    document.body.removeChild(a); // Remove the link after download
  } else {
    alert('No tokens to export.');
  }
}
// Open and close settings
function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}
function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// Check if passcode setup is required on app load
window.onload = () => {
    if (!isPasscodeSet()) {
        passcodeSetupScreen.classList.remove('hidden');
    } else {
        passcodeLockScreen.classList.remove('hidden');
    }

    loadTokens();
    startSyncedTimer();
    initSettingsModal();
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
}