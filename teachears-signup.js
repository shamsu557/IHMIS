
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
// Handle form submission
document.getElementById("teacherSignupForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Validate the 'form_master' role and class selection before creating formData
    const role = document.getElementById('role').value;
    if (role === 'Form Master') {
        const selectedClass = document.getElementById("formClass").value;
        if (!selectedClass) {
            alert("Please select a class for Form Master.");
            return; // Exit the function to prevent form submission
        }
    }

    // Create a FormData object to handle form submission
    const formData = new FormData(this);

    // Get selected subjects and append them to FormData
    const subjects = [];
    document.querySelectorAll("input[name='subjects[]']:checked").forEach(subject => {
        subjects.push(subject.value);
    });
    formData.append('subjects', subjects.join(',')); // Join subjects as comma-separated values

    // Get selected classes and append them to FormData
    const classes = [];
    document.querySelectorAll("input[name='classes[]']:checked").forEach(cls => {
        classes.push(cls.value);
    });
    formData.append('classes', classes.join(',')); // Join classes as comma-separated values


    try {
        // Send a POST request to the server with FormData
        const response = await fetch('/signup', {
            method: 'POST',
            body: formData, // Use FormData instead of JSON
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Signup successful! Your staff ID is: ${result.staffId}`);           
        } else {
            // Handle errors (e.g., display validation errors or server messages)
            alert(result.message || "Signup failed. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
    }
});

// Role change event listener to show/hide class selection
document.getElementById('role').addEventListener('change', function () {
    const classSelection = document.getElementById('class-selection');
    const formClassInput = document.getElementById('formClass');
    
    if (this.value === 'Form Master') {
        classSelection.style.display = 'block'; // Show class selection
        formClassInput.required = true; // Make it required
    } else {
        classSelection.style.display = 'none'; // Hide class selection
        formClassInput.required = false; // Remove required
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