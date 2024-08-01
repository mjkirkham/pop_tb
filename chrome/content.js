chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "populateTB") {
    clear();
    populateTrialBalance(request.params);
    sendResponse({status: "success"});
  } else if (request.action === "clearTB") {
    clear();
    sendResponse({status: "success"});
  } else {
    sendResponse({status: "unknown action"});
  }
  // Return true to indicate you want to send a response asynchronously
  return true;
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
  const lastInputRow = inputRows.pop();

  if (!includeBF) {
    inputRows = inputRows.filter(checkNotBF);
  }

  if (parsedDensity < 100) {
    shuffleArray(inputRows);
    const rowsToFill = Math.floor(inputRows.length * (parsedDensity / 100));
    inputRows = inputRows.slice(0, rowsToFill);
  }

  inputRows.forEach(inputRow => {
    const postTo = creditOrDebit(postingType);
    const value = Math.floor(Math.random() * range) + parseInt(minValue);
    const inputField = inputRow.querySelector(`input[name*=${postTo}]`);
    if (inputField) {
      inputField.value = value;
      if (postTo === 'debit') {
        total += value;
      } else {
        total -= value;
      }
    }
  });

  const finalPostTo = (total <= 0) ? 'debit' : 'credit';
  const finalInputField = lastInputRow.querySelector(`input[name*=${finalPostTo}]`);
  if (finalInputField) {
    finalInputField.value = Math.abs(total);
    finalInputField.dispatchEvent(event);
  }

  const saveButton = document.querySelector('button.save');
  if (saveButton) {
    saveButton.focus();
  }
}

function clear() {
  const event = new Event('change', { 'bubbles': true });
  const inputRows = document.querySelectorAll('tr.odd, tr.even');

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
