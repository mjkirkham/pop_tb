window.onload = function () {
  const extensionApi = typeof browser !== "undefined" ? browser : chrome;
  const data = window.PopTBData || { categories: [], presets: [], balanceOptions: [] };
  const codeNamesByFramework = window.PopTBCodeNames || {};
  const form = document.getElementById("form");
  const btnPopTB = document.getElementById("btn_pop_tb_run");
  const btnClearTB = document.getElementById("btn_clear_tb");
  const rngDensity = document.getElementById("rngDensity");
  const rngDensityOutput = document.getElementById("rngDensityOutput");
  const densityFriendlyOutput = document.getElementById("densityFriendlyOutput");
  const mainContent = document.getElementById("mainContent");
  const notAvailableMessage = document.getElementById("notAvailableMessage");
  const themeToggle = document.getElementById("themeToggle");
  const postingModeSelect = document.getElementById("selPostingMode");
  const frameworkSelect = document.getElementById("selFramework");
  const categorySelect = document.getElementById("selCategory");
  const categoryFromCodeSelect = document.getElementById("selCategoryFromCode");
  const categoryToCodeSelect = document.getElementById("selCategoryToCode");
  const presetSelect = document.getElementById("selPreset");
  const balanceAccountSelect = document.getElementById("selBalanceAccount");
  const postingSourceNote = document.getElementById("postingSourceNote");
  const categoryRow = document.getElementById("categoryRow");
  const categoryRangeRow = document.getElementById("categoryRangeRow");
  const presetRow = document.getElementById("presetRow");
  const balanceRow = document.getElementById("balanceRow");

  const defaultPrefs = {
    postingType: "both",
    frameworkId: data.frameworks && data.frameworks[0] ? data.frameworks[0].id : "",
    postingMode: "random",
    categoryId: "",
    categoryFromCode: "",
    categoryToCode: "",
    presetId: data.presets[0] ? data.presets[0].id : "",
    balanceAccount: "1200",
    includeBF: false,
    codeFilter2026: true,
    minValue: "1",
    maxValue: "9999",
    density: "100"
  };

  populateSelectOptions();

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "auto") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    updateThemeToggleLabel(theme);
  }

  function updateThemeToggleLabel(theme) {
    const effectiveTheme = theme === "auto" ? getSystemTheme() : theme;
    const label = effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
  }

  function storageGet(key, fallback, callback) {
    if (!extensionApi.storage || !extensionApi.storage.local) {
      callback(fallback);
      return;
    }

    if (typeof browser !== "undefined") {
      extensionApi.storage.local.get(key).then((result) => {
        callback(result[key] || fallback);
      }).catch(() => callback(fallback));
      return;
    }

    extensionApi.storage.local.get(key, (result) => {
      callback(result[key] || fallback);
    });
  }

  function storageSet(value) {
    if (!extensionApi.storage || !extensionApi.storage.local) {
      return;
    }

    if (typeof browser !== "undefined") {
      extensionApi.storage.local.set(value);
      return;
    }

    extensionApi.storage.local.set(value);
  }

  function executeInActiveTab(payload, callback) {
    queryActiveTab((tab) => {
      if (!tab || !tab.id) {
        callback(null, true);
        return;
      }

      if (typeof browser !== "undefined") {
        extensionApi.tabs.sendMessage(tab.id, payload).then((response) => {
          callback(response, false);
        }).catch(() => {
          callback(null, true);
        });
        return;
      }

      extensionApi.tabs.sendMessage(tab.id, payload, (response) => {
        callback(response, !!extensionApi.runtime.lastError);
      });
    });
  }

  function queryActiveTab(callback) {
    if (typeof browser !== "undefined") {
      extensionApi.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        callback(tabs[0]);
      }).catch(() => callback(null));
      return;
    }

    extensionApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      callback(tabs[0]);
    });
  }

  function executePageCheck(tabId, callback) {
    const options = {
      target: { tabId: tabId },
      func: () => document.querySelector("form.UIForm.trial-balance") !== null
    };

    if (typeof browser !== "undefined") {
      extensionApi.scripting.executeScript(options).then((results) => {
        callback(!!(results && results[0] && results[0].result));
      }).catch(() => callback(false));
      return;
    }

    extensionApi.scripting.executeScript(options, (results) => {
      if (extensionApi.runtime.lastError) {
        callback(false);
        return;
      }
      callback(!!(results && results[0] && results[0].result));
    });
  }

  function loadTheme() {
    storageGet("theme", "auto", applyTheme);
  }

  function saveTheme(theme) {
    storageSet({ theme: theme });
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const systemTheme = getSystemTheme();
    let newTheme;

    if (!currentTheme) {
      newTheme = systemTheme === "dark" ? "light" : "dark";
    } else if (currentTheme === "dark") {
      newTheme = "light";
    } else {
      newTheme = "dark";
    }

    applyTheme(newTheme);
    saveTheme(newTheme);
  }

  function populateSelectOptions() {
    frameworkSelect.options.length = 0;
    (data.frameworks || []).forEach((framework) => {
      frameworkSelect.add(new Option(framework.title, framework.id));
    });

    data.presets.forEach((preset) => {
      presetSelect.add(new Option(preset.title, preset.id));
    });
    refreshFrameworkOptions(defaultPrefs.frameworkId);
  }

  function getSelectedFramework() {
    const frameworks = data.frameworks || [];
    return frameworks.find((framework) => framework.id === frameworkSelect.value) || frameworks[0] || { categories: [], balanceOptions: [] };
  }

  function refreshFrameworkOptions(preferredCategoryId, preferredBalanceOptionId, preferredFromCode, preferredToCode) {
    const framework = getSelectedFramework();
    const categoryIdToUse = preferredCategoryId || categorySelect.value;
    const balanceIdToUse = preferredBalanceOptionId || balanceAccountSelect.value || defaultPrefs.balanceAccount;

    categorySelect.options.length = 0;
    framework.categories.forEach((category) => {
      categorySelect.add(new Option(category.title, category.id));
    });

    balanceAccountSelect.options.length = 0;
    framework.balanceOptions.forEach((option) => {
      balanceAccountSelect.add(new Option(option.title, option.id));
    });

    if (framework.categories.some((category) => category.id === categoryIdToUse)) {
      categorySelect.value = categoryIdToUse;
    } else if (framework.categories[0]) {
      categorySelect.value = framework.categories[0].id;
    }

    if (framework.balanceOptions.some((option) => option.id === balanceIdToUse)) {
      balanceAccountSelect.value = balanceIdToUse;
    } else if (framework.balanceOptions[0]) {
      balanceAccountSelect.value = framework.balanceOptions[0].id;
    }

    refreshCategoryRangeOptions(preferredFromCode, preferredToCode);
  }

  function getSelectedCategory() {
    const framework = getSelectedFramework();
    return framework.categories.find((category) => category.id === categorySelect.value) || framework.categories[0] || null;
  }

  function refreshCategoryRangeOptions(preferredFromCode, preferredToCode) {
    const category = getSelectedCategory();
    const codes = category ? category.codes.map(String) : [];
    const frameworkCodeNames = codeNamesByFramework[frameworkSelect.value] || {};
    const fromCodeToUse = preferredFromCode || categoryFromCodeSelect.value;
    const toCodeToUse = preferredToCode || categoryToCodeSelect.value;

    categoryFromCodeSelect.options.length = 0;
    categoryToCodeSelect.options.length = 0;

    codes.forEach((code) => {
      categoryFromCodeSelect.add(new Option(formatCodeLabel(code, frameworkCodeNames), code));
    });

    const safeFromCode = codes.includes(fromCodeToUse) ? fromCodeToUse : codes[0];
    if (safeFromCode) {
      categoryFromCodeSelect.value = safeFromCode;
    }

    const fromIndex = codes.indexOf(categoryFromCodeSelect.value);
    const toCodes = fromIndex >= 0 ? codes.slice(fromIndex) : codes;
    toCodes.forEach((code) => {
      categoryToCodeSelect.add(new Option(formatCodeLabel(code, frameworkCodeNames), code));
    });

    const safeToCode = toCodes.includes(toCodeToUse) ? toCodeToUse : toCodes[toCodes.length - 1];
    if (safeToCode) {
      categoryToCodeSelect.value = safeToCode;
    }
  }

  function applyPreferences(prefs) {
    const postingTypeRadio = document.querySelector(`input[name="postingType"][value="${prefs.postingType}"]`);
    if (postingTypeRadio) {
      postingTypeRadio.checked = true;
    }

    frameworkSelect.value = prefs.frameworkId || defaultPrefs.frameworkId;
    refreshFrameworkOptions(prefs.categoryId, prefs.balanceAccount, prefs.categoryFromCode, prefs.categoryToCode);
    postingModeSelect.value = prefs.postingMode || defaultPrefs.postingMode;
    presetSelect.value = prefs.presetId || defaultPrefs.presetId;
    document.getElementById("chkIncludeBF").checked = prefs.includeBF;
    document.getElementById("chkCodeFilter2026").checked = prefs.codeFilter2026 !== false;
    document.getElementById("numMinValue").value = prefs.minValue;
    document.getElementById("numMaxValue").value = prefs.maxValue;
    rngDensity.value = prefs.density;
    rngDensityOutput.innerHTML = `${prefs.density}%`;
    densityFriendlyOutput.innerHTML = friendlyDensity(prefs.density);
    syncPostingModeState();
  }

  function savePreferences() {
    const postingTypeInput = document.querySelector('input[name="postingType"]:checked');
    const prefs = {
      postingType: postingTypeInput ? postingTypeInput.value : defaultPrefs.postingType,
      frameworkId: frameworkSelect.value,
      postingMode: postingModeSelect.value,
      categoryId: categorySelect.value,
      categoryFromCode: categoryFromCodeSelect.value,
      categoryToCode: categoryToCodeSelect.value,
      presetId: presetSelect.value,
      balanceAccount: balanceAccountSelect.value,
      includeBF: document.getElementById("chkIncludeBF").checked,
      codeFilter2026: document.getElementById("chkCodeFilter2026").checked,
      minValue: document.getElementById("numMinValue").value,
      maxValue: document.getElementById("numMaxValue").value,
      density: rngDensity.value
    };

    storageSet({ preferences: prefs });
  }

  function syncPostingModeState() {
    const postingMode = postingModeSelect.value;
    const isPresetMode = postingMode === "preset";
    const isCategoryMode = postingMode === "category";
    const postingTypeInputs = form.querySelectorAll('input[name="postingType"]');

    categorySelect.disabled = !isCategoryMode;
    categoryFromCodeSelect.disabled = !isCategoryMode;
    categoryToCodeSelect.disabled = !isCategoryMode;
    presetSelect.disabled = !isPresetMode;
    balanceAccountSelect.disabled = isPresetMode;
    categoryRow.classList.toggle("is-hidden", !isCategoryMode);
    categoryRangeRow.classList.toggle("is-hidden", !isCategoryMode);
    presetRow.classList.toggle("is-hidden", !isPresetMode);
    balanceRow.classList.toggle("is-hidden", isPresetMode);

    postingTypeInputs.forEach((input) => {
      input.disabled = isPresetMode;
    });

    if (isPresetMode) {
      const preset = data.presets.find((item) => item.id === presetSelect.value);
      postingSourceNote.textContent = preset ? preset.description : "Sample sets use fixed account mixes based on your chart.";
    } else if (isCategoryMode) {
      const framework = getSelectedFramework();
      postingSourceNote.textContent = `Random entries will only be posted to the selected ${framework.title} category and code range, with an optional balancing line.`;
    } else {
      const framework = getSelectedFramework();
      postingSourceNote.textContent = `Random entries can use any eligible ${framework.title} row on the page, with an optional balancing line.`;
    }
  }

  function setLoadingState(isLoading) {
    btnPopTB.classList.toggle("loading", isLoading);
    btnPopTB.disabled = isLoading;
    btnClearTB.disabled = isLoading;
  }

  function showContentError(message, isError = true) {
    const errorPanel = document.getElementById("errorPanel");
    const errorList = document.getElementById("errorList");

    if (isError) {
      errorList.innerHTML = `<li>${message}</li>`;
      errorPanel.classList.add("visible");
      errorPanel.focus();
    } else {
      errorPanel.classList.remove("visible");
    }
  }

  function showToast(message, type = "success", duration = 2200) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = toast.querySelector(".toast-icon");

    toastMessage.textContent = message;
    toastIcon.textContent = type === "success" ? "\u2713" : "\u2139";
    toast.classList.remove("toast-success", "toast-info");
    toast.classList.add(`toast-${type}`);
    toast.classList.add("visible");

    setTimeout(() => {
      toast.classList.remove("visible");
    }, duration);
  }

  function handleResponse(response, fallbackMessage, hasError) {
    setLoadingState(false);

    if (hasError) {
      showContentError("Could not connect to the page. Please refresh the page and try again.");
      return;
    }

    if (!response) {
      showContentError("Unable to communicate with the page. Please refresh and try again.");
      return;
    }

    if (response.status === "error") {
      showContentError(response.message || "An unexpected error occurred.");
      return;
    }

    showToast(response.message || fallbackMessage, "success");
  }

  function buildPopulateParams() {
    const postingTypeInput = document.querySelector('input[name="postingType"]:checked');
    return {
      postingType: postingTypeInput ? postingTypeInput.value : defaultPrefs.postingType,
      frameworkId: frameworkSelect.value,
      postingMode: postingModeSelect.value,
      categoryId: categorySelect.value,
      categoryFromCode: categoryFromCodeSelect.value,
      categoryToCode: categoryToCodeSelect.value,
      presetId: presetSelect.value,
      balanceAccount: balanceAccountSelect.value,
      includeBF: document.getElementById("chkIncludeBF").checked,
      codeFilter2026: document.getElementById("chkCodeFilter2026").checked,
      minValue: document.getElementById("numMinValue").value,
      maxValue: document.getElementById("numMaxValue").value,
      density: rngDensity.value
    };
  }

  function validateNumberInputs() {
    const errorPanel = document.getElementById("errorPanel");
    const minValueInput = document.getElementById("numMinValue");
    const maxValueInput = document.getElementById("numMaxValue");
    const minValue = parseInt(minValueInput.value, 10);
    const maxValue = parseInt(maxValueInput.value, 10);
    const msgArray = [];

    removeErrorState(minValueInput);
    removeErrorState(maxValueInput);

    const validationRules = [
      {
        condition: maxValue < minValue,
        message: "Maximum value cannot be less than the minimum value.",
        element: maxValueInput
      },
      {
        condition: minValue > parseInt(minValueInput.max, 10),
        message: `Minimum value cannot be greater than ${minValueInput.max}.`,
        element: minValueInput
      },
      {
        condition: minValue < parseInt(minValueInput.min, 10),
        message: `Minimum value cannot be less than ${minValueInput.min}.`,
        element: minValueInput
      },
      {
        condition: maxValue > parseInt(maxValueInput.max, 10),
        message: `Maximum value cannot be greater than ${maxValueInput.max}.`,
        element: maxValueInput
      },
      {
        condition: maxValue < parseInt(maxValueInput.min, 10),
        message: `Maximum value cannot be less than ${maxValueInput.min}.`,
        element: maxValueInput
      }
    ];

    validationRules.forEach((rule) => {
      if (rule.condition) {
        msgArray.push(rule.message);
        addErrorState(rule.element);
      }
    });

    btnPopTB.disabled = msgArray.length > 0;
    document.getElementById("errorList").innerHTML = msgArray.map((msg) => `<li>${msg}</li>`).join("");
    errorPanel.classList.toggle("visible", msgArray.length > 0);
  }

  function friendlyDensity(densityValue) {
    const intDensity = parseInt(densityValue, 10);
    if (intDensity === 1) { return "the bare minimum"; }
    if (intDensity <= 10) { return "hardly any"; }
    if (intDensity <= 40) { return "just a few"; }
    if (intDensity <= 60) { return "about half"; }
    if (intDensity <= 75) { return "a reasonable amount"; }
    if (intDensity < 100) { return "quite a lot"; }
    return "As many as possible";
  }

  function removeErrorState(inputControl) {
    inputControl.closest(".input-row").classList.remove("error-state");
  }

  function addErrorState(inputControl) {
    inputControl.closest(".input-row").classList.add("error-state");
  }

  function formatCodeLabel(code, frameworkCodeNames) {
    const codeName = frameworkCodeNames[String(code)];
    return codeName ? `${code} - ${codeName}` : String(code);
  }

  loadTheme();
  themeToggle.addEventListener("click", toggleTheme);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!document.documentElement.getAttribute("data-theme")) {
      updateThemeToggleLabel("auto");
    }
  });

  storageGet("preferences", defaultPrefs, (prefs) => {
    applyPreferences({ ...defaultPrefs, ...prefs });
  });

  form.addEventListener("change", () => {
    syncPostingModeState();
    savePreferences();
  });

  postingModeSelect.addEventListener("change", syncPostingModeState);
  frameworkSelect.addEventListener("change", () => {
    refreshFrameworkOptions();
    syncPostingModeState();
    savePreferences();
  });
  categorySelect.addEventListener("change", () => {
    refreshCategoryRangeOptions();
    validateNumberInputs();
    savePreferences();
  });
  categoryFromCodeSelect.addEventListener("change", () => {
    refreshCategoryRangeOptions(categoryFromCodeSelect.value, categoryToCodeSelect.value);
    validateNumberInputs();
    savePreferences();
  });

  queryActiveTab((tab) => {
    if (!tab || !tab.id) {
      mainContent.style.display = "none";
      notAvailableMessage.style.display = "flex";
      return;
    }

    executePageCheck(tab.id, (isValidPage) => {
      mainContent.style.display = isValidPage ? "block" : "none";
      notAvailableMessage.style.display = isValidPage ? "none" : "flex";
    });
  });

  densityFriendlyOutput.innerHTML = friendlyDensity(rngDensity.value);
  rngDensity.addEventListener("input", function () {
    rngDensityOutput.innerHTML = `${this.value}%`;
    densityFriendlyOutput.innerHTML = friendlyDensity(this.value);
    this.setAttribute("aria-valuenow", this.value);
    this.setAttribute("aria-valuetext", `${this.value}%`);
  });

  btnPopTB.addEventListener("click", function () {
    setLoadingState(true);
    showContentError("", false);

    executeInActiveTab({ action: "populateTB", params: buildPopulateParams() }, (response, hasError) => {
      handleResponse(response, "Trial Balance populated successfully!", hasError);
    });
  });

  btnClearTB.addEventListener("click", function () {
    setLoadingState(true);
    showContentError("", false);

    executeInActiveTab({ action: "clearTB" }, (response, hasError) => {
      handleResponse(response, "Trial Balance cleared successfully!", hasError);
    });
  });

  form.addEventListener("blur", function (event) {
    if (event.target.type === "number") {
      const numericValue = parseInt(event.target.value, 10);
      event.target.value = Number.isNaN(numericValue) ? event.target.defaultValue : numericValue;
      validateNumberInputs();
    }
  }, true);

  const radioGroups = document.querySelectorAll(".radio-group");
  radioGroups.forEach((group) => {
    const radios = group.querySelectorAll('input[type="radio"]');
    radios.forEach((radio, index) => {
      radio.addEventListener("keydown", function (e) {
        let newIndex;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          newIndex = (index + 1) % radios.length;
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          newIndex = (index - 1 + radios.length) % radios.length;
        }

        if (newIndex !== undefined) {
          radios[newIndex].focus();
          radios[newIndex].checked = true;
          radios[newIndex].dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  });

  document.querySelectorAll(".help-icon").forEach((icon) => {
    icon.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        this.blur();
      }
    });
  });

  const focusableElements = document.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
};
