const STORAGE_KEY = "social-qr-links";

const PLATFORM_CONFIG = {
  x: {
    label: "X",
    placeholder: "x.com/yourname",
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "linkedin.com/in/yourname",
  },
  website: {
    label: "Website",
    placeholder: "yoursite.com",
  },
};

const state = {
  links: {
    x: "",
    linkedin: "",
    website: "",
  },
  selectedPlatform: "",
  isEditing: false,
};

const elements = {
  form: document.getElementById("link-form"),
  editToggle: document.getElementById("edit-toggle"),
  cancelEdit: document.getElementById("cancel-edit"),
  setupCard: document.getElementById("setup-card"),
  platformSwitcher: document.getElementById("platform-switcher"),
  qrCode: document.getElementById("qr-code"),
  selectedLabel: document.getElementById("selected-label"),
  selectedLink: document.getElementById("selected-link"),
  statusMessage: document.getElementById("status-message"),
  inputs: {
    x: document.getElementById("x-url"),
    linkedin: document.getElementById("linkedin-url"),
    website: document.getElementById("website-url"),
  },
};

document.addEventListener("DOMContentLoaded", () => {
  hydrateState();
  bindEvents();
  render();
});

function bindEvents() {
  elements.form.addEventListener("submit", handleSave);

  elements.editToggle.addEventListener("click", () => {
    if (state.isEditing && getAvailablePlatforms().length === 0) {
      setStatus("Save at least one link before closing the editor.", true);
      return;
    }

    state.isEditing = !state.isEditing;
    setStatus("");
    render();
  });

  elements.cancelEdit.addEventListener("click", () => {
    state.isEditing = false;
    setStatus("");
    render();
  });
}

function hydrateState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      state.isEditing = true;
      return;
    }

    const parsed = JSON.parse(raw);
    state.links = sanitizeLinks(parsed.links);

    const availablePlatforms = getAvailablePlatforms();
    state.selectedPlatform = availablePlatforms.includes(parsed.selectedPlatform)
      ? parsed.selectedPlatform
      : availablePlatforms[0] || "";
    state.isEditing = availablePlatforms.length === 0;
  } catch (error) {
    console.error("Unable to restore saved links.", error);
    state.isEditing = true;
  }
}

function sanitizeLinks(links) {
  const nextLinks = {
    x: "",
    linkedin: "",
    website: "",
  };

  for (const platform of Object.keys(nextLinks)) {
    const rawValue = typeof links?.[platform] === "string" ? links[platform] : "";
    const normalized = normalizeUrl(rawValue);
    nextLinks[platform] = isValidHttpUrl(normalized) ? normalized : "";
  }

  return nextLinks;
}

function handleSave(event) {
  event.preventDefault();

  const nextLinks = {};

  for (const platform of Object.keys(PLATFORM_CONFIG)) {
    const normalized = normalizeUrl(elements.inputs[platform].value);

    if (normalized && !isValidHttpUrl(normalized)) {
      setStatus(`Add a valid ${PLATFORM_CONFIG[platform].label} URL.`, true);
      return;
    }

    nextLinks[platform] = normalized;
  }

  const availablePlatforms = Object.keys(PLATFORM_CONFIG).filter(
    (platform) => Boolean(nextLinks[platform]),
  );

  if (availablePlatforms.length === 0) {
    setStatus("Add at least one link before saving.", true);
    return;
  }

  state.links = nextLinks;
  state.selectedPlatform = availablePlatforms.includes(state.selectedPlatform)
    ? state.selectedPlatform
    : availablePlatforms[0];
  state.isEditing = false;

  const didPersist = persistState();
  render();
  setStatus(
    didPersist
      ? "Links saved to this browser."
      : "Links updated, but browser storage is unavailable right now.",
    !didPersist,
    didPersist,
  );
}

function normalizeUrl(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_error) {
    return false;
  }
}

function persistState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        links: state.links,
        selectedPlatform: state.selectedPlatform,
      }),
    );
    return true;
  } catch (error) {
    console.error("Unable to save links to local storage.", error);
    return false;
  }
}

function getAvailablePlatforms() {
  return Object.keys(PLATFORM_CONFIG).filter((platform) =>
    Boolean(state.links[platform]),
  );
}

function setStatus(message, isError = false, isSuccess = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("is-error", isError);
  elements.statusMessage.classList.toggle("is-success", isSuccess);
}

function render() {
  syncFormValues();
  renderSetupCard();
  renderPlatformButtons();
  renderQrPanel();
}

function syncFormValues() {
  for (const platform of Object.keys(PLATFORM_CONFIG)) {
    elements.inputs[platform].value = state.links[platform];
    elements.inputs[platform].placeholder = PLATFORM_CONFIG[platform].placeholder;
  }
}

function renderSetupCard() {
  const hasSavedLinks = getAvailablePlatforms().length > 0;

  elements.setupCard.hidden = !state.isEditing;
  elements.cancelEdit.hidden = !(state.isEditing && hasSavedLinks);
  elements.editToggle.textContent = state.isEditing
    ? hasSavedLinks
      ? "Done editing"
      : "Save links"
    : "Edit links";
}

function renderPlatformButtons() {
  const availablePlatforms = getAvailablePlatforms();

  if (!availablePlatforms.includes(state.selectedPlatform)) {
    state.selectedPlatform = availablePlatforms[0] || "";
  }

  elements.platformSwitcher.innerHTML = "";

  for (const [platform, config] of Object.entries(PLATFORM_CONFIG)) {
    const button = document.createElement("button");
    const isEnabled = Boolean(state.links[platform]);
    const isSelected = state.selectedPlatform === platform;

    button.type = "button";
    button.className = `platform-button${isSelected ? " is-active" : ""}`;
    button.textContent = config.label;
    button.disabled = !isEnabled;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(isSelected));
    button.setAttribute("aria-controls", "qr-code");

    if (isEnabled) {
      button.addEventListener("click", () => {
        state.selectedPlatform = platform;
        persistState();
        render();
      });
    }

    elements.platformSwitcher.appendChild(button);
  }
}

function renderQrPanel() {
  const activePlatform = state.selectedPlatform;
  const activeLink = state.links[activePlatform];

  if (!activePlatform || !activeLink) {
    elements.qrCode.innerHTML =
      '<p class="qr-empty">Save a link, then tap a platform to show a large QR code.</p>';
    elements.selectedLabel.textContent = "Add a link to begin";
    elements.selectedLink.hidden = true;
    return;
  }

  if (typeof qrcode !== "function") {
    elements.qrCode.innerHTML =
      '<p class="qr-empty">QR generator failed to load. Refresh to try again.</p>';
    elements.selectedLabel.textContent = `${PLATFORM_CONFIG[activePlatform].label} selected`;
    elements.selectedLink.hidden = false;
    elements.selectedLink.href = activeLink;
    elements.selectedLink.textContent = activeLink;
    return;
  }

  const qr = qrcode(0, "M");
  qr.addData(activeLink);
  qr.make();

  const marginCells = 4;
  const targetSize = 320;
  const cellSize = Math.max(
    4,
    Math.floor(targetSize / (qr.getModuleCount() + marginCells * 2)),
  );

  const image = document.createElement("img");
  image.src = qr.createDataURL(cellSize, marginCells);
  image.alt = `${PLATFORM_CONFIG[activePlatform].label} QR code`;
  image.width = (qr.getModuleCount() + marginCells * 2) * cellSize;
  image.height = (qr.getModuleCount() + marginCells * 2) * cellSize;

  elements.qrCode.innerHTML = "";
  elements.qrCode.appendChild(image);

  elements.selectedLabel.textContent = PLATFORM_CONFIG[activePlatform].label;
  elements.selectedLink.hidden = false;
  elements.selectedLink.href = activeLink;
  elements.selectedLink.textContent = activeLink;
}
