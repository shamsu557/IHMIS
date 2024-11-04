function toggleNavbar() {
  const navbarNav = document.getElementById("navbarNav");
  const cancelButton = document.querySelector(".cancel-btn");
  const menuIcon = document.querySelector(".navbar-toggler-icon"); // Select the menu icon

  if (navbarNav.classList.contains("show")) {
      // If navbar is open, close it
      navbarNav.classList.remove("show");
      cancelButton.style.display = "none"; // Hide cancel button
      menuIcon.classList.remove("hidden"); // Show menu icon
  } else {
      // If navbar is closed, open it
      navbarNav.classList.add("show");
      cancelButton.style.display = "block"; // Show cancel button
      menuIcon.classList.add("hidden"); // Hide menu icon completely
  }
}
// Function to check authentication status
    function checkAuth() {
      fetch('/auth-check')
      .then(response => response.json())
      .then(data => {
        if (!data.authenticated) {
          // Redirect to admin login if not authenticated
          window.location.href = '/adminLogin';
        }
      })
      .catch(err => {
        console.error('Error checking authentication:', err);
      });
    }

    // Check authentication status on page load
    window.onload = function() {
      checkAuth();
    };

  // Also check authentication status when navigating back/forward
  window.onpageshow = function(event) {
      if (event.persisted) {
          checkAuth();
      }
  };
  function logout() {
  window.location.href = '/adminLogout'; // Redirect to admin logout route
}
 // Back to top button functionality
 window.onscroll = function() {scrollFunction()};
  
  function scrollFunction() {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
          document.getElementById("myBtn").style.display = "block";
      } else {
          document.getElementById("myBtn").style.display = "none";
      }
  }

  function topFunction() {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
  }