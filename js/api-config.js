(function () {
  const localHosts = ["localhost", "127.0.0.1"];
  const localApiBaseUrl = "http://localhost:3000";
  const productionApiBaseUrl =
    "https://dropi-back-end-production.up.railway.app";
  const configuredApiBaseUrl =
    window.DROPI_API_BASE_URL ||
    (localHosts.includes(window.location.hostname)
      ? localApiBaseUrl
      : productionApiBaseUrl);

  window.dropiApiUrl = function (path) {
    if (!configuredApiBaseUrl) {
      throw new Error(
        "Set the production API URL in js/api-config.js before deploying.",
      );
    }

    return `${configuredApiBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  };
})();
