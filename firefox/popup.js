window.onload = function () {
  const form = document.getElementById("form");
  const btnPopTB = document.getElementById("btn_pop_tb_run");
  const btnClearTB = document.getElementById("btn_clear_tb");
  const rngDensity = document.getElementById("rngDensity");
  const rngDensityOutput = document.getElementById("rngDensityOutput");
  const densityFriendlyOutput = document.getElementById("densityFriendlyOutput");
  const mainContent = document.getElementById("mainContent");
  const notAvailableMessage = document.getElementById("notAvailableMessage");
  const themeToggle = document.getElementById("themeToggle");

  // Theme management
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    updateThemeToggleLabel(theme);
  }

  function updateThemeToggleLabel(theme) {
    const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;
    const label = effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
  }

  function loadTheme() {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      browser.storage.local.get('theme').then((result) => {
        const theme = result.theme || 'auto';
        applyTheme(theme);
      }).catch(() => {
        applyTheme('auto');
      });
    } else {
      applyTheme('auto');
    }
  }

  function saveTheme(theme) {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      browser.storage.local.set({ theme: theme });
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const systemTheme = getSystemTheme();
    
    let newTheme;
    if (!currentTheme) {
      // Currently auto - switch to opposite of system
      newTheme = systemTheme === 'dark' ? 'light' : 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'light';
    } else {
      newTheme = 'dark';
    }
    
    applyTheme(newTheme);
    saveTheme(newTheme);
  }

  // Initialize theme
  loadTheme();

  // Theme toggle click handler
  themeToggle.addEventListener('click', toggleTheme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (!currentTheme) {
      // Only update label if in auto mode
      updateThemeToggleLabel('auto');
    }
  });

  // Default preferences
  const defaultPrefs = {
    postingType: 'both',
    includeBF: false,
    minValue: '1',
    maxValue: '9999',
    density: '100'
  };

  // Load saved preferences
  if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
    browser.storage.local.get('preferences').then((result) => {
      const prefs = result.preferences || defaultPrefs;
      applyPreferences(prefs);
    }).catch(() => {
      applyPreferences(defaultPrefs);
    });
  } else {
    // Storage not available, use defaults
    applyPreferences(defaultPrefs);
  }

  function applyPreferences(prefs) {
    // Apply posting type
    const postingTypeRadio = document.querySelector(`input[name="postingType"][value="${prefs.postingType}"]`);
    if (postingTypeRadio) postingTypeRadio.checked = true;

    // Apply include BF
    document.getElementById("chkIncludeBF").checked = prefs.includeBF;

    // Apply min/max values
    document.getElementById("numMinValue").value = prefs.minValue;
    document.getElementById("numMaxValue").value = prefs.maxValue;

    // Apply density
    rngDensity.value = prefs.density;
    rngDensityOutput.innerHTML = prefs.density + '%';
    densityFriendlyOutput.innerHTML = friendlyDensity(prefs.density);
  }

  function savePreferences() {
    if (typeof browser === 'undefined' || !browser.storage || !browser.storage.local) return;
    
    const prefs = {
      postingType: document.querySelector('input[name="postingType"]:checked').value,
      includeBF: document.getElementById("chkIncludeBF").checked,
      minValue: document.getElementById("numMinValue").value,
      maxValue: document.getElementById("numMaxValue").value,
      density: document.getElementById("rngDensity").value
    };
    browser.storage.local.set({ preferences: prefs });
  }

  // Save preferences when any input changes
  form.addEventListener('change', savePreferences);

  // Check if we're on a Trial Balance page
  browser.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
    const tab = tabs[0];
    browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.querySelector('form.UIForm.trial-balance') !== null
    }).then((results) => {
      if (results && results[0] && results[0].result) {
        // On a valid Trial Balance page - show the main UI
        mainContent.style.display = "block";
        notAvailableMessage.style.display = "none";
      } else {
        // Not on a Trial Balance page - show the message
        mainContent.style.display = "none";
        notAvailableMessage.style.display = "flex";
      }
    }).catch((error) => {
      // Script execution failed (e.g., restricted page) - show the message
      mainContent.style.display = "none";
      notAvailableMessage.style.display = "flex";
    });
  });

  densityFriendlyOutput.innerHTML = friendlyDensity(rngDensity.value);

  rngDensity.addEventListener('input', function () {
    rngDensityOutput.innerHTML = this.value + '%';
    densityFriendlyOutput.innerHTML = friendlyDensity(this.value);
    // Update ARIA attributes for accessibility
    this.setAttribute('aria-valuenow', this.value);
    this.setAttribute('aria-valuetext', this.value + '%');
  });

  function setLoadingState(isLoading) {
    btnPopTB.classList.toggle('loading', isLoading);
    btnPopTB.disabled = isLoading;
    btnClearTB.disabled = isLoading;
  }

  function showContentError(message, isError = true) {
    const errorPanel = document.getElementById("errorPanel");
    const errorList = document.getElementById('errorList');
    
    if (isError) {
      // Clear existing errors
      errorList.textContent = '';
      // Create list item safely
      const li = document.createElement('li');
      li.textContent = message;
      errorList.appendChild(li);
      errorPanel.classList.add('visible');
      // Focus the error panel for screen readers
      errorPanel.focus();
    } else {
      errorPanel.classList.remove('visible');
    }
  }

  function showToast(message, type = 'success', duration = 2000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // Set message and icon based on type
    toastMessage.textContent = message;
    toastIcon.textContent = type === 'success' ? '✓' : 'ℹ';
    
    // Remove old type classes and add new one
    toast.classList.remove('toast-success', 'toast-info');
    toast.classList.add(`toast-${type}`);
    
    // Show toast
    toast.classList.add('visible');
    
    // Hide after duration and close popup
    setTimeout(() => {
      toast.classList.remove('visible');
      // Close popup after toast animation completes
      setTimeout(() => window.close(), 300);
    }, duration);
  }

  function handleResponse(response, successMessage, action) {
    setLoadingState(false);
    
    if (!response) {
      showContentError("Unable to communicate with the page. Please refresh and try again.");
      return;
    }
    
    if (response.status === "error") {
      const errorMessages = {
        "populate_failed": response.message || "Failed to populate the trial balance.",
        "clear_failed": response.message || "Failed to clear the trial balance.",
        "unknown_action": "An unexpected error occurred. Please try again."
      };
      showContentError(errorMessages[response.errorType] || response.message || "An unexpected error occurred.");
      return;
    }
    
    if (response.status === "success") {
      // Show success toast with custom message
      const message = action === 'populate' && response.rowsPopulated 
        ? `Populated ${response.rowsPopulated} rows successfully!`
        : successMessage;
      showToast(message, 'success');
    }
  }

  btnPopTB.addEventListener('click', function () {
    setLoadingState(true);
    showContentError('', false); // Clear any previous errors

    browser.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
      const tab = tabs[0];
      const postingType = document.querySelector('input[name="postingType"]:checked').value,
        includeBF = document.getElementById("chkIncludeBF").checked,
        minValue = document.getElementById("numMinValue").value,
        maxValue = document.getElementById("numMaxValue").value,
        density = document.getElementById("rngDensity").value;

      const params = { "postingType": postingType, "includeBF": includeBF, "minValue": minValue, "maxValue": maxValue, "density": density };

      browser.tabs.sendMessage(tab.id, { action: "populateTB", params: params }).then(function (response) {
        handleResponse(response, "Trial Balance populated successfully!", 'populate');
      }).catch(function (error) {
        setLoadingState(false);
        showContentError("Could not connect to the page. Please refresh the page and try again.");
      });
    }).catch(function (error) {
      setLoadingState(false);
      showContentError("Could not access the current tab. Please try again.");
    });
  });

  btnClearTB.addEventListener('click', function () {
    setLoadingState(true);
    showContentError('', false); // Clear any previous errors

    browser.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
      const tab = tabs[0];
      browser.tabs.sendMessage(tab.id, { action: "clearTB" }).then(function (response) {
        handleResponse(response, "Trial Balance cleared successfully!", 'clear');
      }).catch(function (error) {
        setLoadingState(false);
        showContentError("Could not connect to the page. Please refresh the page and try again.");
      });
    }).catch(function (error) {
      setLoadingState(false);
      showContentError("Could not access the current tab. Please try again.");
    });
  });

  form.addEventListener("blur", function (event) {
    if (event.target.type === 'number') {
      const numericValue = parseInt(event.target.value);
      event.target.value = (isNaN(numericValue)) ? event.target.defaultValue : numericValue;
    }

    const errorPanel = document.getElementById("errorPanel");
    const minValueInput = document.getElementById('numMinValue');
    const maxValueInput = document.getElementById('numMaxValue');
    const minValue = parseInt(minValueInput.value);
    const maxValue = parseInt(maxValueInput.value);
    const btnPopTB = document.getElementById("btn_pop_tb_run");
    const msgArray = [];

    // Reset error state
    removeErrorState(minValueInput);
    removeErrorState(maxValueInput);

    // Validation rules
    const validationRules = [
      {
        condition: maxValue < minValue,
        message: "Maximum value cannot be less than the minimum value.",
        element: maxValueInput
      },
      {
        condition: minValue > parseInt(minValueInput.max),
        message: `Minimum value cannot be greater than ${minValueInput.max}.`,
        element: minValueInput
      },
      {
        condition: minValue < parseInt(minValueInput.min),
        message: `Minimum value cannot be less than ${minValueInput.min}.`,
        element: minValueInput
      },
      {
        condition: maxValue > parseInt(maxValueInput.max),
        message: `Maximum value cannot be greater than ${maxValueInput.max}.`,
        element: maxValueInput
      },
      {
        condition: maxValue < parseInt(maxValueInput.min),
        message: `Maximum value cannot be less than ${maxValueInput.min}.`,
        element: maxValueInput
      }
    ];

    // Validate the form
    validationRules.forEach(rule => {
      if (rule.condition) {
        msgArray.push(rule.message);
        addErrorState(rule.element);
      }
    });

    btnPopTB.disabled = msgArray.length > 0;
    const errorList = document.getElementById('errorList');
    // Clear existing errors safely
    errorList.textContent = '';
    // Add each error message safely
    msgArray.forEach(msg => {
      const li = document.createElement('li');
      li.textContent = msg;
      errorList.appendChild(li);
    });
    errorPanel.classList.toggle('visible', msgArray.length > 0);
  }, true);

  function friendlyDensity(densityValue) {
    const intDensity = parseInt(densityValue);
    if (intDensity === 1) { return "the bare minimum" }
    if (intDensity <= 10) { return "hardly any" }
    if (intDensity <= 40) { return "just a few" }
    if (intDensity <= 60) { return "about half" }
    if (intDensity <= 75) { return "a reasonable amount" }
    if (intDensity < 100) { return "quite a lot" }
    return "As many as possible";
  }

  // Keyboard navigation for radio groups (arrow keys)
  const radioGroups = document.querySelectorAll('.radio-group');
  radioGroups.forEach(group => {
    const radios = group.querySelectorAll('input[type="radio"]');
    radios.forEach((radio, index) => {
      radio.addEventListener('keydown', function(e) {
        let newIndex;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          newIndex = (index + 1) % radios.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          newIndex = (index - 1 + radios.length) % radios.length;
        }
        if (newIndex !== undefined) {
          radios[newIndex].focus();
          radios[newIndex].checked = true;
          radios[newIndex].dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  });

  // Escape key closes help tooltips
  const helpIcons = document.querySelectorAll('.help-icon');
  helpIcons.forEach(icon => {
    icon.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.blur();
      }
    });
  });

  // Tab trap within the popup (ensure focus stays within popup)
  const focusableElements = document.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });

  function removeErrorState(inputControl) {
    inputControl.closest('.input-row').classList.remove('error-state');
  }

  function addErrorState(inputControl) {
    inputControl.closest('.input-row').classList.add('error-state');
  }
};
