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
  
function checkSessionStatus() {
    fetch('/checkSession')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedin) {
                alert("Session has expired. Please log in again.");
                window.location.href = '/login'; // Redirect to the login page
            }
        })
        .catch(error => console.error('Error checking session status:', error));
}

// Check the session status every 5 minutes (300000 milliseconds)
setInterval(checkSessionStatus, 300000);

      function toggleNavbar() {
    const navbarNav = document.getElementById("navbarNav");
    const cancelButton = document.querySelector(".cancel-btn");
    const menuIcon = document.querySelector(".navbar-toggler-icon");

    const isOpen = navbarNav.classList.toggle("show");
    cancelButton.style.display = isOpen ? "block" : "none"; // Toggle cancel button
    menuIcon.classList.toggle("hidden", isOpen); // Show/hide menu icon
}

        // Function to fetch teacher details from the server
    async function fetchTeacherDetails() {
        try {
            const response = await fetch('/api/teacher-details'); // Your endpoint to fetch teacher details
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const teacher = await response.json();

            // Populate the HTML with teacher details
            document.getElementById('teacher-name').innerText = `Welcome, ${teacher.name}`;
            document.getElementById('teacher-email').innerText = teacher.email;
            document.getElementById('teacher-staff-id').innerText = teacher.staff_id;
            document.getElementById('teacher-qualification').innerText = teacher.qualification;
            document.getElementById('teacher-role').innerText = teacher.role;
            document.getElementById('teacher-profile-picture').src = teacher.profile_picture || 'default-profile.png';
             // Populate the ID card modal with teacher details
             document.getElementById('modal-teacher-name').innerText = teacher.name;
                document.getElementById('modal-teacher-staff-id').innerText = teacher.staff_id;
                document.getElementById('modal-teacher-qualification').innerText = teacher.qualification;
                document.getElementById('modal-teacher-role').innerText = teacher.role;
                document.getElementById('modal-teacher-profile-picture').src = teacher.profile_picture || 'default-profile.png';
                
        } catch (error) {
            console.error('Error fetching teacher details:', error);
        }
    }

    // Call the function to fetch teacher details when the page loads
    window.onload = fetchTeacherDetails;

    function logout() {
    // Redirect to the logout route, which will clear the session
    window.location.href = '/logout'; 
}


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
 
    
function preventBackNavigation() {
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener('popstate', function(event) {
        window.history.pushState(null, document.title, window.location.href);
    });
}

// Call this function on the staff_dashboard page
preventBackNavigation();