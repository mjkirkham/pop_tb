const extensionApi = typeof browser !== "undefined" ? browser : chrome;
const POST_2026_CODES = new Set(["1040", "1113", "2241", "2267", "2268", "2641", "2667", "7704", "7705", "7706", "7907"].map(normalizeAccountCode));
const PRE_2026_CODES = new Set(["1170", "2240", "2640", "7703", "7904", "7906"].map(normalizeAccountCode));
const POP_TB_DATA = window.PopTBData || { frameworks: [], presets: [] };

extensionApi.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  try {
    if (request.action === "populateTB") {
      sendResponse({ status: "success", ...populateTrialBalance(request.params || {}) });
    } else if (request.action === "clearTB") {
      clear();
      sendResponse({ status: "success", message: "Trial Balance cleared successfully!" });
    } else {
      sendResponse({ status: "error", message: "Unknown action requested." });
    }
  } catch (error) {
    sendResponse({
      status: "error",
      message: error.message || "The page could not be updated."
    });
  }

  return true;
});

function populateTrialBalance(params) {
  const records = collectRowRecords();
  if (records.length === 0) {
    throw new Error("No trial balance rows found. The page structure may have changed.");
  }

  if (params.postingMode === "preset") {
    clear();
    return populatePreset(records, params);
  }

  if (params.postingMode !== "category") {
    clear();
  }

  return populateRandom(records, params);
}

function populatePreset(records, params) {
  const preset = POP_TB_DATA.presets.find((item) => item.id === params.presetId) || POP_TB_DATA.presets[0];
  if (!preset) {
    throw new Error("No starter entry sets are available.");
  }

  const minValue = parseInteger(params.minValue, 1);
  const maxValue = parseInteger(params.maxValue, 9999);
  const baseAmount = randomAmount(minValue, maxValue);
  const event = new Event("change", { bubbles: true });
  let debitTotal = 0;
  let creditTotal = 0;
  let populatedCount = 0;

  preset.entries.forEach((entry, index) => {
    const row = findRowByCode(records, entry.code);
    if (!row) {
      throw new Error(`The preset account ${entry.code} is not available on this trial balance page.`);
    }

    let amount = Math.max(1, Math.round(baseAmount * (entry.ratio || 1)));

    if (index === preset.entries.length - 1) {
      const projectedDebitTotal = debitTotal + (entry.side === "debit" ? amount : 0);
      const projectedCreditTotal = creditTotal + (entry.side === "credit" ? amount : 0);
      const imbalance = projectedDebitTotal - projectedCreditTotal;

      if (imbalance !== 0) {
        if (entry.side === "debit" && imbalance < 0) {
          amount += Math.abs(imbalance);
        } else if (entry.side === "credit" && imbalance > 0) {
          amount += Math.abs(imbalance);
        }
      }
    }

    writeAmount(row, entry.side, amount);
    if (entry.side === "debit") {
      debitTotal += amount;
    } else {
      creditTotal += amount;
    }
    populatedCount += 1;
  });

  if (debitTotal !== creditTotal) {
    throw new Error(`Sample set "${preset.title}" could not be balanced automatically.`);
  }

  dispatchChange(records, event);
  focusSaveButton();
  return { rowsPopulated: populatedCount, message: `Posted sample set "${preset.title}" across ${populatedCount} accounts.` };
}

function populateRandom(records, params) {
  const includeBF = !!params.includeBF;
  const use2026OnwardsCodes = params.codeFilter2026 !== false;
  const postingType = params.postingType || "both";
  const density = Math.max(1, parseInteger(params.density, 100));
  const minValue = parseInteger(params.minValue, 1);
  const maxValue = parseInteger(params.maxValue, 9999);
  const framework = getFrameworkById(params.frameworkId);
  const balanceOptions = framework.balanceOptions || [];
  const categories = framework.categories || [];
  const balanceOption = balanceOptions.find((item) => item.id === params.balanceAccount) || balanceOptions[0];
  const category = categories.find((item) => item.id === params.categoryId) || null;
  const excludedBalanceCode = balanceOption && balanceOption.code ? balanceOption.code : null;
  const additiveMode = params.postingMode === "category";

  let eligibleRecords = records.filter((record) => record.debitInput || record.creditInput);

  if (!includeBF) {
    eligibleRecords = eligibleRecords.filter(checkNotBF);
  }

  eligibleRecords = eligibleRecords.filter((record) => checkYearSpecificCodeFilter(record.code, use2026OnwardsCodes));

  if (params.postingMode === "category") {
    if (!category) {
      throw new Error("Please choose a category before populating category-based postings.");
    }
    const rangedCodes = getCategoryRangeCodes(category.codes, params.categoryFromCode, params.categoryToCode);
    const categoryCodes = new Set(rangedCodes.map(normalizeAccountCode));
    eligibleRecords = eligibleRecords.filter((record) => record.code && categoryCodes.has(record.code));
  }

  if (excludedBalanceCode) {
    eligibleRecords = eligibleRecords.filter((record) => record.code !== excludedBalanceCode);
  }

  if (eligibleRecords.length === 0) {
    throw new Error("No eligible rows were found after applying the selected filters.");
  }

  if (density < 100) {
    shuffleArray(eligibleRecords);
    const rowsToFill = Math.max(1, Math.floor(eligibleRecords.length * (density / 100)));
    eligibleRecords = eligibleRecords.slice(0, rowsToFill);
  }

  let total = 0;
  let populatedCount = 0;

  eligibleRecords.forEach((record) => {
    const side = creditOrDebit(postingType);
    const inputAvailable = side === "debit" ? record.debitInput : record.creditInput;
    if (!inputAvailable) {
      return;
    }

    const amount = randomAmount(minValue, maxValue);
    writeAmount(record, side, amount, additiveMode);
    populatedCount += 1;
    total += side === "debit" ? amount : -amount;
  });

  if (populatedCount === 0) {
    throw new Error("Could not find any usable debit or credit inputs for the selected rows.");
  }

  let message = `Populated ${populatedCount} row${populatedCount === 1 ? "" : "s"}`;

  if (balanceOption && balanceOption.code) {
    const balanceRecord = findRowByCode(records, balanceOption.code);
    if (!balanceRecord) {
      throw new Error(`The selected balancing account ${balanceOption.code} is not available on this trial balance page.`);
    }

    const overallImbalance = calculateOverallImbalance(records, balanceRecord.code);
    clearInputsForRecord(balanceRecord);

    if (overallImbalance !== 0) {
      const balanceSide = overallImbalance > 0 ? "credit" : "debit";
      writeAmount(balanceRecord, balanceSide, Math.abs(overallImbalance), false);
      populatedCount += 1;
    }

    message += ` and balanced to ${balanceOption.code}.`;
  } else if (total !== 0) {
    const outstandingSide = total > 0 ? "credit" : "debit";
    message += ` with ${Math.abs(total)} left on the ${outstandingSide} side for manual review.`;
  } else {
    message += " with no balancing line needed.";
  }

  dispatchChange(records, new Event("change", { bubbles: true }));
  focusSaveButton();
  return { rowsPopulated: populatedCount, message: message };
}

function collectRowRecords() {
  return Array.from(document.querySelectorAll("tr.odd, tr.even")).map((row) => ({
    row: row,
    code: getAccountCodeFromRow(row),
    name: getAccountNameFromRow(row),
    debitInput: row.querySelector('input[name*="debit"]'),
    creditInput: row.querySelector('input[name*="credit"]')
  }));
}

function writeAmount(record, side, amount, additiveMode = false) {
  const input = side === "debit" ? record.debitInput : record.creditInput;
  if (!input) {
    throw new Error(`Unable to write a ${side} amount for account ${record.code || record.name || "unknown"}.`);
  }

  const existingValue = additiveMode ? parseAmount(input.value) : 0;
  input.value = existingValue + amount;
}

function clearInputsForRecord(record) {
  if (record.debitInput) {
    record.debitInput.value = "";
  }
  if (record.creditInput) {
    record.creditInput.value = "";
  }
}

function dispatchChange(records, event) {
  const firstInput = records.find((record) => record.creditInput || record.debitInput);
  const input = firstInput ? (firstInput.creditInput || firstInput.debitInput) : null;
  if (input) {
    input.dispatchEvent(event);
  }
}

function clear() {
  const rows = collectRowRecords();
  if (rows.length === 0) {
    throw new Error("No trial balance rows found to clear. The page structure may have changed.");
  }

  rows.forEach((record) => {
    if (record.creditInput) {
      record.creditInput.value = "";
    }
    if (record.debitInput) {
      record.debitInput.value = "";
    }
  });

  dispatchChange(rows, new Event("change", { bubbles: true }));
}

function creditOrDebit(postingType) {
  if (postingType === "creditOnly") {
    return "credit";
  }
  if (postingType === "debitOnly") {
    return "debit";
  }
  return Math.random() < 0.5 ? "credit" : "debit";
}

function checkNotBF(record) {
  return !/(brought forward|prior period adjustments|effects of changes in accounting policies)/i.test(record.name || "");
}

function checkYearSpecificCodeFilter(accountCode, use2026OnwardsCodes) {
  if (!accountCode) {
    return true;
  }

  if (use2026OnwardsCodes) {
    return !PRE_2026_CODES.has(accountCode);
  }

  return !POST_2026_CODES.has(accountCode);
}

function getAccountNameFromRow(inputRow) {
  const nameElement = inputRow.querySelector(".nominal_account_name");
  return (nameElement && (nameElement.innerText || nameElement.textContent || "").trim()) || (inputRow.innerText || inputRow.textContent || "").trim();
}

function getAccountCodeFromRow(inputRow) {
  const directCandidates = getDirectCodeCandidates(inputRow);
  for (const candidate of directCandidates) {
    const code = extractLeadingAccountCode(candidate);
    if (code) {
      return code;
    }
  }

  const codeSelectors = [
    ".nominal_account_code",
    '[class*="nominal_account_code"]',
    '[class*="account_code"]',
    "[data-account-code]",
    "[data-nominal-code]"
  ];

  for (const selector of codeSelectors) {
    const codeElement = inputRow.querySelector(selector);
    const rawCode = codeElement && (codeElement.innerText || codeElement.textContent || codeElement.getAttribute("data-account-code") || codeElement.getAttribute("data-nominal-code"));
    const code = extractLeadingAccountCode(rawCode) || extractAccountCode(rawCode);
    if (code) {
      return code;
    }
  }

  const firstCell = inputRow.querySelector("td");
  const firstCellCode = extractLeadingAccountCode(firstCell && (firstCell.innerText || firstCell.textContent));
  if (firstCellCode) {
    return firstCellCode;
  }

  return extractAccountCode(inputRow.innerText || inputRow.textContent);
}

function extractAccountCode(value) {
  if (!value) {
    return null;
  }

  const fourDigitMatch = value.match(/\b([0-9]{4})\b/);
  if (fourDigitMatch) {
    return fourDigitMatch[1];
  }

  const shorterMatch = value.match(/\b([0-9]{2,3})\b/);
  return shorterMatch ? normalizeAccountCode(shorterMatch[1]) : null;
}

function extractLeadingAccountCode(value) {
  if (!value) {
    return null;
  }

  const trimmedValue = String(value).trim();
  const match = trimmedValue.match(/^([0-9]{2,4})\b/);
  return match ? normalizeAccountCode(match[1]) : null;
}

function getDirectCodeCandidates(inputRow) {
  const candidates = [];
  const firstCell = inputRow.querySelector("td");
  const secondCell = inputRow.querySelector("td:nth-child(2)");

  if (firstCell) {
    candidates.push(firstCell.innerText || firstCell.textContent || "");
    candidates.push(firstCell.getAttribute("data-account-code") || "");
    candidates.push(firstCell.getAttribute("data-nominal-code") || "");
  }

  if (secondCell) {
    candidates.push(secondCell.innerText || secondCell.textContent || "");
  }

  candidates.push(inputRow.getAttribute("data-account-code") || "");
  candidates.push(inputRow.getAttribute("data-nominal-code") || "");
  candidates.push(inputRow.id || "");
  candidates.push(inputRow.className || "");

  return candidates.filter(Boolean);
}

function findRowByCode(records, code) {
  const normalizedCode = normalizeAccountCode(code);
  return records.find((record) => record.code === normalizedCode);
}

function normalizeAccountCode(code) {
  if (code === null || code === undefined) {
    return null;
  }

  const digitsOnly = String(code).trim().match(/[0-9]{2,4}/);
  if (!digitsOnly) {
    return null;
  }

  const normalized = digitsOnly[0].replace(/^0+/, "");
  return normalized || "0";
}

function randomAmount(minValue, maxValue) {
  const lower = Math.min(minValue, maxValue);
  const upper = Math.max(minValue, maxValue);
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

function parseInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function focusSaveButton() {
  const saveButton = document.querySelector("button.save");
  if (saveButton) {
    saveButton.focus();
  }
}

function getFrameworkById(frameworkId) {
  const frameworks = POP_TB_DATA.frameworks || [];
  return frameworks.find((framework) => framework.id === frameworkId) || frameworks[0] || { categories: [], balanceOptions: [] };
}

function getCategoryRangeCodes(categoryCodes, fromCode, toCode) {
  const normalizedCodes = categoryCodes.map(String);
  const startCode = fromCode || normalizedCodes[0];
  const endCode = toCode || normalizedCodes[normalizedCodes.length - 1];
  const startIndex = normalizedCodes.indexOf(String(startCode));
  const endIndex = normalizedCodes.indexOf(String(endCode));

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("The selected category code range is not valid.");
  }

  if (endIndex < startIndex) {
    throw new Error("The selected category 'to' code cannot be before the 'from' code.");
  }

  return normalizedCodes.slice(startIndex, endIndex + 1);
}

function calculateOverallImbalance(records, excludedCode) {
  return records.reduce((runningTotal, record) => {
    if (record.code === excludedCode) {
      return runningTotal;
    }

    return runningTotal + parseAmount(record.debitInput && record.debitInput.value) - parseAmount(record.creditInput && record.creditInput.value);
  }, 0);
}

function parseAmount(value) {
  const sanitized = String(value || "").replace(/,/g, "").trim();
  const parsed = parseFloat(sanitized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function shuffleArray(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
}
