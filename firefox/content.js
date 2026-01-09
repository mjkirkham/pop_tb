browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "populateTB") {
    try {
      clear();
      const result = populateTrialBalance(request.params);
      return Promise.resolve({ status: "success", ...result });
    } catch (error) {
      return Promise.resolve({ 
        status: "error", 
        errorType: "populate_failed",
        message: error.message || "Failed to populate the trial balance."
      });
    }
  } else if (request.action === "clearTB") {
    try {
      clear();
      return Promise.resolve({ status: "success" });
    } catch (error) {
      return Promise.resolve({ 
        status: "error", 
        errorType: "clear_failed",
        message: error.message || "Failed to clear the trial balance."
      });
    }
  } else {
    return Promise.resolve({ status: "error", errorType: "unknown_action", message: "Unknown action requested." });
  }
});

function populateTrialBalance(params) {
  const {
    includeBF,
    minValue,
    maxValue,
    postingType,
    density
  } = params;
  const parsedDensity = parseInt(density);
  const range = maxValue - minValue + 1;
  const event = new Event('change', { 'bubbles': true });

  let total = 0;
  let inputRows = Array.from(document.querySelectorAll('tr.odd, tr.even'));
  
  if (inputRows.length === 0) {
    throw new Error("No trial balance rows found. The page structure may have changed.");
  }
  
  const lastInputRow = inputRows.pop();

  if (!includeBF) {
    inputRows = inputRows.filter(checkNotBF);
  }
  
  if (inputRows.length === 0) {
    throw new Error("No eligible rows to populate after filtering. Try enabling 'Include brought forward accounts'.");
  }

  if (parsedDensity < 100) {
    shuffleArray(inputRows);
    const rowsToFill = Math.floor(inputRows.length * (parsedDensity / 100));
    inputRows = inputRows.slice(0, rowsToFill);
  }
  
  let populatedCount = 0;
  inputRows.forEach(inputRow => {
    const postTo = creditOrDebit(postingType);
    const value = Math.floor(Math.random() * range) + parseInt(minValue);
    const inputField = inputRow.querySelector(`input[name*=${postTo}]`);
    if (inputField) {
      inputField.value = value;
      populatedCount++;
      if (postTo === 'debit') {
        total += value;
      } else {
        total -= value;
      }
    }
  });
  
  if (populatedCount === 0) {
    throw new Error("Could not find any input fields to populate. The page structure may have changed.");
  }

  const finalPostTo = (total <= 0) ? 'debit' : 'credit';
  const finalInputField = lastInputRow.querySelector(`input[name*=${finalPostTo}]`);
  if (finalInputField) {
    finalInputField.value = Math.abs(total);
    finalInputField.dispatchEvent(event);
  } else {
    throw new Error("Could not find the balancing row input field. The page structure may have changed.");
  }

  const saveButton = document.querySelector('button.save');
  if (saveButton) {
    saveButton.focus();
  }
  
  return { rowsPopulated: populatedCount + 1 };
}

function clear() {
  const event = new Event('change', { 'bubbles': true });
  const inputRows = document.querySelectorAll('tr.odd, tr.even');
  
  if (inputRows.length === 0) {
    throw new Error("No trial balance rows found to clear. The page structure may have changed.");
  }

  inputRows.forEach(row => {
    const creditInput = row.querySelector('input[name*=credit]');
    const debitInput = row.querySelector('input[name*=debit]');

    if (creditInput) creditInput.value = '';
    if (debitInput) debitInput.value = '';
  });

  const firstCreditInput = inputRows[0].querySelector('input[name*=credit]');
  if (firstCreditInput) firstCreditInput.dispatchEvent(event);
}

function creditOrDebit(postingType) {
  const postingTypes = {
    "creditOnly": 'credit',
    "debitOnly": 'debit'
  };

  return postingTypes[postingType] || (Math.floor(Math.random() * 2) === 0 ? 'credit' : 'debit');
}

function checkNotBF(inputRow) {
  const account_name = inputRow.querySelector('span.nominal_account_name').innerText;
  const excludedTerms = /(brought forward|prior period adjustments|effects of changes in accounting policies)/i;

  // Check if the account name contains any of the excluded terms
  return !excludedTerms.test(account_name);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
