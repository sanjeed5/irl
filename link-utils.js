(function exposeLinkUtils(globalScope) {
  "use strict";

  const PLATFORM_HOSTS = {
    x: new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]),
    linkedin: new Set(["linkedin.com", "www.linkedin.com"]),
  };

  function ensureHttps(value) {
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) {
      return value;
    }
    return `https://${value}`;
  }

  function normalizePlatformValue(platform, value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";

    if (platform === "x") {
      const handle = trimmed.replace(/^@/, "");
      if (/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
        return `https://x.com/${handle}`;
      }
    }

    if (platform === "linkedin") {
      const slug = trimmed.replace(/^@/, "");
      if (/^[A-Za-z0-9-]{3,100}$/.test(slug)) {
        return `https://www.linkedin.com/in/${slug}`;
      }
    }

    return ensureHttps(trimmed);
  }

  function validatePlatformUrl(platform, value) {
    if (!value) return { valid: true, message: "" };

    let url;
    try {
      url = new URL(value);
    } catch (_error) {
      return { valid: false, message: "Enter a valid link or handle." };
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { valid: false, message: "Use an HTTP or HTTPS link." };
    }

    if (platform === "x" && !PLATFORM_HOSTS.x.has(url.hostname.toLowerCase())) {
      return { valid: false, message: "Use an X handle or x.com profile link." };
    }

    if (
      platform === "linkedin" &&
      !PLATFORM_HOSTS.linkedin.has(url.hostname.toLowerCase())
    ) {
      return {
        valid: false,
        message: "Use a LinkedIn handle or linkedin.com profile link.",
      };
    }

    return { valid: true, message: "" };
  }

  function getDisplayValue(platform, value) {
    try {
      const url = new URL(value);
      const path = url.pathname.replace(/^\/+|\/+$/g, "");

      if (platform === "x" && path) return `@${path.split("/")[0]}`;
      if (platform === "linkedin" && path) {
        const parts = path.split("/");
        const slug = parts[0] === "in" ? parts[1] : parts[0];
        if (slug) return slug;
      }

      return url.hostname.replace(/^www\./, "");
    } catch (_error) {
      return value;
    }
  }

  const api = { normalizePlatformValue, validatePlatformUrl, getDisplayValue };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    globalScope.SocialQRUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
