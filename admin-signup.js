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
    const dropdownToggle = document.querySelector('#resultManagementDropdown'); // ID of the main dropdown toggle
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="resultManagementDropdown"]'); // Menu linked to the toggle
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
// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    // Send data to the server
    fetch('/creation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Show success message
            alert('Admin Creation successful!'); 
            
            // Reset the form if creation is successful
            this.reset();
        } else {
            // Show error message if creation fails
            alert(result.message || 'An error occurred. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An unexpected error occurred. Please try again.');
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
// Close button functionality
function goBack() {
    window.history.back();
    }