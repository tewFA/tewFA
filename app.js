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
        if (!ciphertext) return null; // If ciphertext is null or undefined, return null
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return null; // Return null if decryption fails
    }
};

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
        alert('Passcode set successfully!');
    } else {
        alert('Passcodes do not match. Please try again.');
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
        }
    } else {
        alert('Incorrect passcode');
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
        alert('Token added successfully!');
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
        alert('Token updated successfully!');
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
            alert('Token code copied to clipboard!');
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

// Check if passcode setup is required on app load
window.onload = () => {
    if (!isPasscodeSet()) {
        passcodeSetupScreen.classList.remove('hidden');
    } else {
        passcodeLockScreen.classList.remove('hidden');
    }

    loadTokens();
    startSyncedTimer();
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
}