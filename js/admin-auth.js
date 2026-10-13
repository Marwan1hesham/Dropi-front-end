const ADMIN_TOKEN_KEY = "dropiAdminAccessToken";
const ADMIN_COOKIE_NAME = "access_token";

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || getAdminCookie();
}

function getAdminCookie() {
  const tokenCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${ADMIN_COOKIE_NAME}=`));
  return tokenCookie
    ? decodeURIComponent(tokenCookie.split("=").slice(1).join("="))
    : "";
}

function saveAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  document.cookie = `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=86400`;
}

function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  document.cookie = `${ADMIN_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`;
}

async function loginAdmin(username, password) {
  const response = await fetch(window.dropiApiUrl("/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !result.data?.access_token) {
    throw new Error(
      result.message || "Unable to sign in. Check your credentials.",
    );
  }

  saveAdminToken(result.data.access_token);
  return result.data.access_token;
}

function adminFetch(path, options = {}) {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("token", token);
  return fetch(window.dropiApiUrl(path), {
    ...options,
    headers,
  }).then((response) => {
    if (response.status === 401) {
      clearAdminToken();
      window.location.replace("admin-login.html");
    }
    return response;
  });
}

window.getAdminToken = getAdminToken;
window.saveAdminToken = saveAdminToken;
window.clearAdminToken = clearAdminToken;
window.loginAdmin = loginAdmin;
window.adminFetch = adminFetch;
