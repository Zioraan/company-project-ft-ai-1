function createValidationController() {
  const form = document.getElementById("talent-form");
  if (!form) {
    return;
  }

  const fieldMap = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    country: document.getElementById("country"),
    experience: document.getElementById("experience"),
    sector: document.getElementById("sector"),
    englishLevel: document.getElementById("englishLevel"),
    linkedin: document.getElementById("linkedin"),
    comments: document.getElementById("comments"),
    policy: document.getElementById("policy")
  };

  const availabilityOptions = Array.from(
    form.querySelectorAll("input[name='availability']")
  );

  const summary = document.getElementById("form-summary");
  const successMessage = document.getElementById("success-message");
  const commentsCounter = document.getElementById("comments-counter");
  const touchedFields = new Set();
  let submitAttempted = false;

  const messages = {
    en: {
      fullName: "Name must contain at least first and last name",
      email: "Enter a valid email (example: <name@company.com>)",
      phone: "Phone must include country code (example: +34 612 345 678)",
      country: "Select your country of residence",
      experience: "Years of experience must be between 0 and 50",
      sector: "Select your sector of interest",
      englishLevel: "Indicate your English level",
      availability: "Select your availability",
      linkedin: "If you include LinkedIn, it must be a valid URL",
      comments: "Comments cannot exceed 500 characters ({remaining} remaining)",
      policy: "You must accept the data processing policy to continue",
      summary: "Please fix the highlighted fields before submitting.",
      commentsCounter: "{remaining} characters remaining"
    },
    es: {
      fullName: "El nombre debe incluir al menos nombre y apellido",
      email: "Ingresa un correo valido (ejemplo: nombre@empresa.com)",
      phone: "El telefono debe incluir codigo de pais (ejemplo: +34 612 345 678)",
      country: "Selecciona tu pais de residencia",
      experience: "Los anos de experiencia deben estar entre 0 y 50",
      sector: "Selecciona tu sector de interes",
      englishLevel: "Indica tu nivel de ingles",
      availability: "Selecciona tu disponibilidad",
      linkedin: "Si incluyes LinkedIn, debe ser una URL valida",
      comments: "Los comentarios no pueden superar 500 caracteres ({remaining} restantes)",
      policy: "Debes aceptar la politica de tratamiento de datos para continuar",
      summary: "Corrige los campos marcados antes de enviar.",
      commentsCounter: "{remaining} caracteres restantes"
    }
  };

  function currentLanguage() {
    const runtimeLanguage = window.NEXOVA_I18N?.getLanguage?.();
    return Object.hasOwn(messages, runtimeLanguage) ? runtimeLanguage : "en";
  }

  function getMessage(key, vars = {}) {
    const dictionary = messages[currentLanguage()];
    let template = dictionary[key] || "";
    Object.keys(vars).forEach((name) => {
      template = template.replace(`{${name}}`, String(vars[name]));
    });
    return template;
  }

  function setFieldError(fieldName, message, options = {}) {
    const isRadioGroup = options.radioGroup === true;
    const errorNode = document.getElementById(`${fieldName}-error`);

    if (errorNode) {
      errorNode.textContent = message;
      errorNode.dataset.activeKey = message ? fieldName : "";
      errorNode.dataset.remaining = String(options.remaining ?? "");
    }

    if (isRadioGroup) {
      availabilityOptions.forEach((radio) => {
        radio.setAttribute("aria-invalid", message ? "true" : "false");
      });
      return;
    }

    const field = fieldMap[fieldName];
    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
    }
  }

  function updateCommentsCounter() {
    const currentLength = fieldMap.comments.value.length;
    const remaining = 500 - currentLength;
    commentsCounter.textContent = getMessage("commentsCounter", { remaining });
    return remaining;
  }

  function validateFullName() {
    const value = fieldMap.fullName.value.trim();
    const words = value.split(/\s+/).filter(Boolean);
    const message = words.length >= 2 ? "" : getMessage("fullName");
    setFieldError("fullName", message);
    return !message;
  }

  function validateEmail() {
    const value = fieldMap.email.value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const message = regex.test(value) ? "" : getMessage("email");
    setFieldError("email", message);
    return !message;
  }

  function validatePhone() {
    const value = fieldMap.phone.value.trim();
    const regex = /^\+[0-9]{1,3}(?:\s[0-9]{2,4}){2,4}$/;
    const message = regex.test(value) ? "" : getMessage("phone");
    setFieldError("phone", message);
    return !message;
  }

  function validateCountry() {
    const message = fieldMap.country.value ? "" : getMessage("country");
    setFieldError("country", message);
    return !message;
  }

  function validateExperience() {
    const value = Number(fieldMap.experience.value);
    const hasValue = fieldMap.experience.value !== "";
    const inRange = hasValue && Number.isFinite(value) && value >= 0 && value <= 50;
    const message = inRange ? "" : getMessage("experience");
    setFieldError("experience", message);
    return !message;
  }

  function validateSector() {
    const message = fieldMap.sector.value ? "" : getMessage("sector");
    setFieldError("sector", message);
    return !message;
  }

  function validateEnglishLevel() {
    const message = fieldMap.englishLevel.value ? "" : getMessage("englishLevel");
    setFieldError("englishLevel", message);
    return !message;
  }

  function validateAvailability() {
    const checked = availabilityOptions.some((radio) => radio.checked);
    const message = checked ? "" : getMessage("availability");
    setFieldError("availability", message, { radioGroup: true });
    return !message;
  }

  function validateLinkedin() {
    const value = fieldMap.linkedin.value.trim();
    if (!value) {
      setFieldError("linkedin", "");
      return true;
    }

    const regex = /^https?:\/\/.+/i;
    const message = regex.test(value) ? "" : getMessage("linkedin");
    setFieldError("linkedin", message);
    return !message;
  }

  function validateComments() {
    const remaining = updateCommentsCounter();
    const message = remaining >= 0 ? "" : getMessage("comments", { remaining });
    setFieldError("comments", message, { remaining });
    return !message;
  }

  function validatePolicy() {
    const message = fieldMap.policy.checked ? "" : getMessage("policy");
    setFieldError("policy", message);
    return !message;
  }

  const validators = {
    fullName: validateFullName,
    email: validateEmail,
    phone: validatePhone,
    country: validateCountry,
    experience: validateExperience,
    sector: validateSector,
    englishLevel: validateEnglishLevel,
    availability: validateAvailability,
    linkedin: validateLinkedin,
    comments: validateComments,
    policy: validatePolicy
  };

  function validateAll() {
    const results = Object.values(validators).map((validator) => validator());
    return results.every(Boolean);
  }

  function validateField(fieldName) {
    if (validators[fieldName]) {
      return validators[fieldName]();
    }
    return true;
  }

  function setSummaryVisible(show) {
    summary.hidden = !show;
    summary.textContent = show ? getMessage("summary") : "";
  }

  function hideSuccess() {
    successMessage.hidden = true;
  }

  function showSuccess() {
    successMessage.hidden = false;
  }

  fieldMap.fullName.addEventListener("input", () => {
    touchedFields.add("fullName");
    validateFullName();
  });
  fieldMap.email.addEventListener("input", () => {
    touchedFields.add("email");
    validateEmail();
  });
  fieldMap.phone.addEventListener("input", () => {
    touchedFields.add("phone");
    validatePhone();
  });
  fieldMap.country.addEventListener("change", () => {
    touchedFields.add("country");
    validateCountry();
  });
  fieldMap.experience.addEventListener("input", () => {
    touchedFields.add("experience");
    validateExperience();
  });
  fieldMap.sector.addEventListener("change", () => {
    touchedFields.add("sector");
    validateSector();
  });
  fieldMap.englishLevel.addEventListener("change", () => {
    touchedFields.add("englishLevel");
    validateEnglishLevel();
  });
  availabilityOptions.forEach((radio) =>
    radio.addEventListener("change", () => {
      touchedFields.add("availability");
      validateAvailability();
    })
  );
  fieldMap.linkedin.addEventListener("input", () => {
    touchedFields.add("linkedin");
    validateLinkedin();
  });
  fieldMap.comments.addEventListener("input", () => {
    touchedFields.add("comments");
    validateComments();
  });
  fieldMap.policy.addEventListener("change", () => {
    touchedFields.add("policy");
    validatePolicy();
  });

  [
    fieldMap.fullName,
    fieldMap.email,
    fieldMap.phone,
    fieldMap.country,
    fieldMap.experience,
    fieldMap.sector,
    fieldMap.englishLevel,
    fieldMap.linkedin,
    fieldMap.comments,
    fieldMap.policy
  ].forEach((field) => {
    field.addEventListener("blur", () => {
      const key = field.name;
      touchedFields.add(key);
      validateField(key);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideSuccess();
    submitAttempted = true;

    const isValid = validateAll();
    if (!isValid) {
      setSummaryVisible(true);
      summary.focus();
      return;
    }

    setSummaryVisible(false);
    showSuccess();
    form.reset();
    submitAttempted = false;
    touchedFields.clear();
    updateCommentsCounter();
    Object.keys(fieldMap).forEach((name) => setFieldError(name, ""));
    setFieldError("availability", "", { radioGroup: true });
  });

  document.addEventListener("nexova-language-change", () => {
    updateCommentsCounter();
    if (submitAttempted) {
      validateAll();
    } else {
      touchedFields.forEach((fieldName) => {
        validateField(fieldName);
      });
    }
    if (!summary.hidden && submitAttempted) {
      summary.textContent = getMessage("summary");
    }
  });

  updateCommentsCounter();
}

document.addEventListener("DOMContentLoaded", createValidationController);
