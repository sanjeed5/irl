"use strict";

const STORAGE_KEY = "social-qr-links";
const { normalizePlatformValue, validatePlatformUrl, getDisplayValue } =
  window.SocialQRUtils;

const PLATFORM_CONFIG = {
  x: { label: "X", mark: "X" },
  linkedin: { label: "LinkedIn", mark: "in" },
  website: { label: "Website", mark: "↗" },
};

const state = {
  links: { x: "", linkedin: "", website: "" },
  selectedPlatform: "",
  mode: "setup",
  editSnapshot: null,
  wakeLock: null,
  lastFocused: null,
};

let statusTimer = null;
let copyTimer = null;
let clearTimer = null;

const elements = {
  setupView: document.getElementById("setup-view"),
  shareView: document.getElementById("share-view"),
  setupTitle: document.getElementById("setup-title"),
  form: document.getElementById("link-form"),
  formActions: document.querySelector(".form-actions"),
  editButton: document.getElementById("edit-button"),
  cancelButton: document.getElementById("cancel-button"),
  clearDataButton: document.getElementById("clear-data-button"),
  platformSwitcher: document.getElementById("platform-switcher"),
  qrSurface: document.getElementById("qr-surface"),
  qrCode: document.getElementById("qr-code"),
  selectedPlatform: document.getElementById("selected-platform"),
  selectedValue: document.getElementById("selected-value"),
  presentButton: document.getElementById("present-button"),
  copyButton: document.getElementById("copy-button"),
  copyLabel: document.getElementById("copy-label"),
  openLink: document.getElementById("open-link"),
  presentationView: document.getElementById("presentation-view"),
  presentationQr: document.getElementById("presentation-qr"),
  presentationKicker: document.getElementById("presentation-kicker"),
  closePresentation: document.getElementById("close-presentation"),
  statusMessage: document.getElementById("status-message"),
  inputs: {
    x: document.getElementById("x-url"),
    linkedin: document.getElementById("linkedin-url"),
    website: document.getElementById("website-url"),
  },
  errors: {
    x: document.getElementById("x-error"),
    linkedin: document.getElementById("linkedin-error"),
    website: document.getElementById("website-error"),
  },
};

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  loadPersistedState();
  bindEvents();
  render();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSave);
  elements.editButton.addEventListener("click", enterEditMode);
  elements.cancelButton.addEventListener("click", cancelEditing);
  elements.clearDataButton.addEventListener("click", handleClearData);
  elements.qrSurface.addEventListener("click", openPresentation);
  elements.presentButton.addEventListener("click", openPresentation);
  elements.closePresentation.addEventListener("click", closePresentationMode);
  elements.copyButton.addEventListener("click", copySelectedLink);

  for (const [platform, input] of Object.entries(elements.inputs)) {
    input.addEventListener("input", () => clearFieldError(platform));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.presentationView.hidden) {
      closePresentationMode();
    }
  });

  document.addEventListener("visibilitychange", async () => {
    if (
      document.visibilityState === "visible" &&
      !elements.presentationView.hidden &&
      !state.wakeLock
    ) {
      await requestWakeLock();
    }
  });
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.mode = "setup";
      return;
    }

    const parsed = JSON.parse(raw);
    state.links = sanitizeLinks(parsed.links);
    const available = getAvailablePlatforms();
    state.selectedPlatform = available.includes(parsed.selectedPlatform)
      ? parsed.selectedPlatform
      : available[0] || "";
    state.mode = available.length ? "share" : "setup";
  } catch (error) {
    console.error("Unable to restore saved links.", error);
    state.mode = "setup";
    showStatus("Saved links could not be restored. Add them again.", "error");
  }
}

function sanitizeLinks(links) {
  const sanitized = { x: "", linkedin: "", website: "" };

  for (const platform of Object.keys(PLATFORM_CONFIG)) {
    const normalized = normalizePlatformValue(platform, links?.[platform] || "");
    const validation = validatePlatformUrl(platform, normalized);
    sanitized[platform] = validation.valid ? normalized : "";
  }

  return sanitized;
}

function handleSave(event) {
  event.preventDefault();
  clearAllErrors();

  const nextLinks = { x: "", linkedin: "", website: "" };
  let firstInvalidInput = null;

  for (const platform of Object.keys(PLATFORM_CONFIG)) {
    const normalized = normalizePlatformValue(platform, elements.inputs[platform].value);
    const validation = validatePlatformUrl(platform, normalized);

    if (!validation.valid) {
      setFieldError(platform, validation.message);
      firstInvalidInput ||= elements.inputs[platform];
    } else {
      nextLinks[platform] = normalized;
    }
  }

  if (firstInvalidInput) {
    firstInvalidInput.focus();
    return;
  }

  const available = Object.keys(PLATFORM_CONFIG).filter(
    (platform) => Boolean(nextLinks[platform]),
  );

  if (!available.length) {
    setFieldError("x", "Add at least one profile to continue.");
    elements.inputs.x.focus();
    return;
  }

  state.links = nextLinks;
  state.selectedPlatform = available.includes(state.selectedPlatform)
    ? state.selectedPlatform
    : available[0];
  state.mode = "share";
  state.editSnapshot = null;

  const persisted = persistState();
  render();
  if (!persisted) {
    showStatus("Links work for now, but could not be saved.", "error");
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
    console.error("Unable to save links.", error);
    return false;
  }
}

function enterEditMode() {
  resetClearDataButton();
  state.editSnapshot = {
    links: { ...state.links },
    selectedPlatform: state.selectedPlatform,
  };
  state.mode = "setup";
  clearAllErrors();
  render();
  elements.inputs[state.selectedPlatform || "x"].focus();
}

function cancelEditing() {
  resetClearDataButton();
  if (state.editSnapshot) {
    state.links = { ...state.editSnapshot.links };
    state.selectedPlatform = state.editSnapshot.selectedPlatform;
  }
  state.editSnapshot = null;
  state.mode = getAvailablePlatforms().length ? "share" : "setup";
  clearAllErrors();
  render();
  elements.editButton.focus();
}

function render() {
  const isSetup = state.mode === "setup";
  elements.setupView.hidden = !isSetup;
  elements.shareView.hidden = isSetup;
  elements.editButton.hidden = isSetup;

  if (isSetup) {
    renderSetupView();
  } else {
    renderShareView();
  }
}

function renderSetupView() {
  const isEditing = Boolean(state.editSnapshot);
  elements.setupTitle.textContent = isEditing
    ? "Update what you share."
    : "One scan. You’re connected.";
  elements.cancelButton.hidden = !isEditing;
  elements.clearDataButton.hidden = !isEditing;
  elements.formActions.classList.toggle("has-cancel", isEditing);

  for (const platform of Object.keys(PLATFORM_CONFIG)) {
    elements.inputs[platform].value = state.links[platform];
  }
}

function handleClearData() {
  if (elements.clearDataButton.dataset.confirm !== "true") {
    resetClearDataButton();
    elements.clearDataButton.dataset.confirm = "true";
    elements.clearDataButton.classList.add("is-armed");
    elements.clearDataButton.textContent = "Tap again to clear saved data";
    clearTimer = window.setTimeout(resetClearDataButton, 3200);
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Unable to clear saved links.", error);
    showStatus("Saved links could not be cleared.", "error");
    return;
  }

  resetClearDataButton();
  state.links = { x: "", linkedin: "", website: "" };
  state.selectedPlatform = "";
  state.editSnapshot = null;
  state.mode = "setup";
  render();
  elements.inputs.x.focus();
}

function resetClearDataButton() {
  window.clearTimeout(clearTimer);
  elements.clearDataButton.dataset.confirm = "false";
  elements.clearDataButton.classList.remove("is-armed");
  elements.clearDataButton.textContent = "Clear saved data from this device";
}

function renderShareView() {
  const available = getAvailablePlatforms();
  if (!available.includes(state.selectedPlatform)) {
    state.selectedPlatform = available[0] || "";
  }

  renderPlatformButtons(available);
  renderSelectedProfile();
}

function getAvailablePlatforms() {
  return Object.keys(PLATFORM_CONFIG).filter((platform) => Boolean(state.links[platform]));
}

function renderPlatformButtons(available) {
  elements.platformSwitcher.replaceChildren();

  available.forEach((platform, index) => {
    const config = PLATFORM_CONFIG[platform];
    const selected = platform === state.selectedPlatform;
    const button = document.createElement("button");
    const mark = document.createElement("span");
    const label = document.createElement("span");

    button.type = "button";
    button.className = "platform-button";
    button.id = `tab-${platform}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(selected));
    button.setAttribute("aria-controls", "qr-code");
    button.tabIndex = selected ? 0 : -1;
    button.dataset.platform = platform;

    mark.className = "tab-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = config.mark;
    label.textContent = config.label;

    button.append(mark, label);
    button.addEventListener("click", () => selectPlatform(platform));
    button.addEventListener("keydown", (event) => {
      handleTabKeydown(event, available, index);
    });
    elements.platformSwitcher.appendChild(button);
  });
}

function handleTabKeydown(event, available, index) {
  let nextIndex = null;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (index + 1) % available.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (index - 1 + available.length) % available.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = available.length - 1;
  }

  if (nextIndex === null) return;
  event.preventDefault();
  selectPlatform(available[nextIndex]);
  document.getElementById(`tab-${available[nextIndex]}`)?.focus();
}

function selectPlatform(platform) {
  state.selectedPlatform = platform;
  persistState();
  renderShareView();
}

function renderSelectedProfile() {
  const platform = state.selectedPlatform;
  const link = state.links[platform];
  const config = PLATFORM_CONFIG[platform];

  if (!platform || !link) return;

  elements.selectedPlatform.textContent = config.label;
  elements.selectedValue.textContent = getDisplayValue(platform, link);
  elements.openLink.href = link;
  renderQrInto(elements.qrCode, link, `${config.label} profile QR code`);
}

function renderQrInto(container, link, alt) {
  if (typeof qrcode !== "function") {
    const error = document.createElement("p");
    error.className = "qr-error";
    error.textContent = "QR code could not be generated. Use the Open button instead.";
    container.replaceChildren(error);
    return false;
  }

  const qr = qrcode(0, "M");
  qr.addData(link);
  qr.make();

  const marginCells = 4;
  const targetSize = 720;
  const cellSize = Math.max(
    6,
    Math.floor(targetSize / (qr.getModuleCount() + marginCells * 2)),
  );
  const renderedSize = (qr.getModuleCount() + marginCells * 2) * cellSize;
  const image = document.createElement("img");

  image.src = qr.createDataURL(cellSize, marginCells);
  image.alt = alt;
  image.width = renderedSize;
  image.height = renderedSize;
  container.replaceChildren(image);
  return true;
}

async function copySelectedLink() {
  const link = state.links[state.selectedPlatform];
  if (!link) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else {
      copyWithFallback(link);
    }
    showCopyFeedback();
  } catch (_error) {
    try {
      copyWithFallback(link);
      showCopyFeedback();
    } catch (fallbackError) {
      console.error("Unable to copy link.", fallbackError);
      showStatus("Could not copy. Use Open instead.", "error");
    }
  }
}

function showCopyFeedback() {
  window.clearTimeout(copyTimer);
  elements.copyLabel.textContent = "Copied";
  elements.copyButton.setAttribute("aria-label", "Link copied");
  copyTimer = window.setTimeout(() => {
    elements.copyLabel.textContent = "Copy link";
    elements.copyButton.removeAttribute("aria-label");
  }, 1600);
}

function copyWithFallback(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy command failed");
}

async function openPresentation() {
  const platform = state.selectedPlatform;
  const link = state.links[platform];
  if (!link) return;

  state.lastFocused = document.activeElement;
  elements.presentationKicker.textContent = PLATFORM_CONFIG[platform].label;
  renderQrInto(
    elements.presentationQr,
    link,
    `${PLATFORM_CONFIG[platform].label} profile QR code`,
  );
  elements.presentationView.hidden = false;
  document.body.style.overflow = "hidden";
  elements.closePresentation.focus();

  await requestWakeLock();
}

async function requestWakeLock() {
  if (!navigator.wakeLock?.request) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener("release", () => {
      state.wakeLock = null;
    });
  } catch (_error) {
    state.wakeLock = null;
  }
}

async function closePresentationMode() {
  if (elements.presentationView.hidden) return;

  if (state.wakeLock) {
    await state.wakeLock.release();
    state.wakeLock = null;
  }

  elements.presentationView.hidden = true;
  document.body.style.overflow = "";

  state.lastFocused?.focus();
  state.lastFocused = null;
}

function setFieldError(platform, message) {
  elements.errors[platform].textContent = message;
  elements.inputs[platform].setAttribute("aria-invalid", "true");
}

function clearFieldError(platform) {
  elements.errors[platform].textContent = "";
  elements.inputs[platform].removeAttribute("aria-invalid");
}

function clearAllErrors() {
  for (const platform of Object.keys(PLATFORM_CONFIG)) {
    clearFieldError(platform);
  }
}

function showStatus(message, type = "") {
  window.clearTimeout(statusTimer);
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = "status-message";
  if (type) elements.statusMessage.classList.add(`is-${type}`);
  elements.statusMessage.hidden = false;

  statusTimer = window.setTimeout(() => {
    elements.statusMessage.hidden = true;
  }, 2800);
}
