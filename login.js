
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

document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggle = document.querySelector('#loginDropdown'); // ID of the main dropdown toggle
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="loginDropdown"]'); // Menu linked to the toggle
    const dropdownItems = dropdownMenu.querySelectorAll('a.dropdown-item'); // Items inside the dropdown menu
  
    // Show dropdown on hover over the toggle
    dropdownToggle.addEventListener('mouseover', () => {
      dropdownMenu.classList.add('show');
    });
  
    // Keep the dropdown visible when hovering over the menu itself
    dropdownMenu.addEventListener('mouseover', () => {
      dropdownMenu.classList.add('show');
    });
  
    // Hide dropdown when mouse leaves both toggle and menu
    dropdownToggle.addEventListener('mouseout', () => {
      dropdownMenu.classList.remove('show');
    });
  
    dropdownMenu.addEventListener('mouseout', () => {
      dropdownMenu.classList.remove('show');
    });
  
    // Navigate to the correct page and hide dropdown when an item is clicked
    dropdownItems.forEach(item => {
      item.addEventListener('click', (event) => {
        const targetPage = item.getAttribute('href'); // Get the target URL
        if (targetPage) {
          dropdownMenu.classList.remove('show'); // Hide the dropdown
          window.location.href = targetPage; // Navigate to the target page
        }
      });
    });
  
    // Hide dropdown if clicked anywhere outside the button or menu
    document.addEventListener('click', (event) => {
      if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  });
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        // Get form values (identifier can be email or staff ID)
        const identifier = form.querySelector('input[name="identifier"]').value;
        const password = form.querySelector('input[name="password"]').value;

        // Prepare the data to send
        const data = {
            emailOrStaffId: identifier,  // Updated to handle either email or staff ID
            password: password
        };

        // Send a POST request to the server
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // Parse JSON response
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message); // Handle error response with specific message
                });
            }
        })
        .then(data => {
            // Handle successful login, redirect to staff_dashboard
            window.location.href = data.redirectTo || '/staff_dashboard'; // Redirect based on server response
        })
        .catch(error => {
            alert(error.message); // Display an error message
        });
    });
});
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
      alert("Please enter both username and password.");
      return;
  }

  try {
      // Send login credentials to the backend
      const response = await fetch("/studentLogin", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentID: username, password: password }),
      });

      // Check if login was successful
      if (response.ok) {
          const result = await response.json();
          
          // Redirect to the student dashboard after successful login
          if (result.redirect) {
              window.location.href = result.redirect;
          } else {
              alert("Login successful, but no redirect URL found.");
          }
      } else {
          // Handle unsuccessful login with error message
          const errorMessage = await response.text();
          alert(errorMessage || "Invalid username or password.");
      }
  } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again later.");
  }
});

    // Back to top button functionality
    window.onscroll = function() { scrollFunction() };

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
