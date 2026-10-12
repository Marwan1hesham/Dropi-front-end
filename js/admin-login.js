if (getAdminToken()) {
  window.location.replace("admin.html");
}

document
  .getElementById("adminLoginForm")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;
    const error = document.getElementById("loginError");

    error.textContent = "";
    const submitButton = event.target.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Signing in';

    loginAdmin(username, password)
      .then(() => {
        window.location.href = "admin.html";
      })
      .catch((loginError) => {
        clearAdminToken();
        error.textContent =
          loginError.message === "Failed to fetch"
            ? "Could not reach the admin server. Check that the backend is running on port 3000."
            : loginError.message;
        submitButton.disabled = false;
        submitButton.innerHTML =
          '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign in';
      });
  });
