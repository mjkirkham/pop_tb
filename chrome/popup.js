window.onload = function () {
  const form = document.getElementById("form");
  const btnPopTB = document.getElementById("btn_pop_tb_run");
  const btnClearTB = document.getElementById("btn_clear_tb");
  const rngDensity = document.getElementById("rngDensity");
  const rngDensityOutput = document.getElementById("rngDensityOutput");
  const densityFriendlyOutput = document.getElementById("densityFriendlyOutput");

  densityFriendlyOutput.innerHTML = friendlyDensity(rngDensity.value);

  rngDensity.addEventListener('input', function () {
    rngDensityOutput.innerHTML = this.value + '%';
    densityFriendlyOutput.innerHTML = friendlyDensity(this.value)
  });

  btnPopTB.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      const postingType = document.querySelector('input[name="postingType"]:checked').value,
        includeBF = document.getElementById("chkIncludeBF").checked,
        minValue = document.getElementById("numMinValue").value,
        maxValue = document.getElementById("numMaxValue").value,
        density = document.getElementById("rngDensity").value;

      const params = { "postingType": postingType, "includeBF": includeBF, "minValue": minValue, "maxValue": maxValue, "density": density };

      chrome.tabs.sendMessage(tab.id, { action: "populateTB", params: params }, function () {
        window.close();
      });
    });
  });

  btnClearTB.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      chrome.tabs.sendMessage(tab.id, { action: "clearTB" }, function () {
        window.close();
      });
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
    errorPanel.innerHTML = bullet(msgArray);
    errorPanel.style.display = (msgArray.length > 0) ? 'block' : 'none';
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

  function removeErrorState(inputControl) {
    inputControl.closest('.ui-control').classList.remove('error-state');
  }

  function addErrorState(inputControl) {
    inputControl.closest('.ui-control').classList.add('error-state');
  }

  function bullet(msgArray) {
    if (msgArray.length === 0) {
      return '';
    }

    const msgString = msgArray.map(msg => `<li>${msg}</li>`).join('');
    return `<div class='error-icon-container'><span class='error-icon'></span></div><span class='error-content'><ul>${msgString}</ul></span>`;
  }
};
