document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggle = document.querySelector('#loginDropdown'); // ID of the main dropdown toggle
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="loginDropdown"]'); // Menu linked to the toggle
    const dropdownItems = dropdownMenu.querySelectorAll('a.dropdown-item'); // Items inside the dropdown menu

    // Prevent dropdown toggle from navigating when clicked
    dropdownToggle.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        event.stopPropagation(); // Prevent bubbling
        dropdownMenu.classList.toggle('show'); // Toggle dropdown visibility
    });

    // Hide dropdown if clicked anywhere outside the button or menu
    document.addEventListener('click', (event) => {
        if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Navigate to the correct page and collapse the navbar when an item is clicked
    dropdownItems.forEach(item => {
        item.addEventListener('click', (event) => {
            const targetPage = item.getAttribute('href'); // Get the target URL
            if (targetPage) {
                const navbarNav = document.getElementById("navbarNav");
                navbarNav.classList.remove('show'); // Close the navbar
                window.location.href = targetPage; // Navigate to the target page
            }
        });
    });
});
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

  // Trigger modal after 3 seconds
  $(document).ready(function() {
    setTimeout(function() {
      $('#loginModal').modal('show');
    }, 500);
  });
  function showModal() {
     $('#loginModal').modal('show');
   }

   function openFindDetailsForm() {
   // Hide the welcome message
   document.getElementById('welcomeMessage').style.display = 'none';
   // Show the hidden content (Find Login Details form)
   document.getElementById('hiddenContent').style.display = 'block';
 }
 //names to uppercase and trim()
 function convertNamesToUppercase() {
   const firstnameField = document.getElementById('firstname');
   const surnameField = document.getElementById('surname');
   const othernameField = document.getElementById('othername');

   firstnameField.value = firstnameField.value.trim().toUpperCase();
   surnameField.value = surnameField.value.trim().toUpperCase();
   othernameField.value = othernameField.value.trim().toUpperCase();
}

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

   
