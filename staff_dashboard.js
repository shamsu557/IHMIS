  function toggleNavbar() {
  const navbarNav = document.getElementById("navbarNav");
  const cancelButton = document.querySelector(".cancel-btn");
  const menuIcon = document.querySelector(".navbar-toggler-icon");

  const isOpen = navbarNav.classList.contains("show");

  navbarNav.classList.toggle("show", !isOpen);
  cancelButton.style.display = isOpen ? "none" : "block";
  menuIcon.classList.toggle("hidden", !isOpen);
}

document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.querySelector('#resultManagementDropdown');
  const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="resultManagementDropdown"]');
  if (!dropdownToggle || !dropdownMenu) return;

  const dropdownItems = dropdownMenu.querySelectorAll('a.dropdown-item');
  const navbarNav = document.getElementById("navbarNav");
  const cancelButton = document.querySelector(".cancel-btn");
  const menuIcon = document.querySelector(".navbar-toggler-icon");

  dropdownToggle.addEventListener('mouseover', () => {
    dropdownMenu.classList.add('show');
  });

  dropdownMenu.addEventListener('mouseover', () => {
    dropdownMenu.classList.add('show');
  });

  dropdownToggle.addEventListener('mouseout', () => {
    dropdownMenu.classList.remove('show');
  });

  dropdownMenu.addEventListener('mouseout', () => {
    dropdownMenu.classList.remove('show');
  });

  dropdownItems.forEach(item => {
    item.addEventListener('click', (event) => {
      const targetPage = item.getAttribute('href');
      navbarNav.classList.remove('show');
      cancelButton.style.display = "none";
      menuIcon.classList.remove("hidden");

      if (targetPage) {
        window.location.href = targetPage;
      }
    });
  });

  const navLinks = document.querySelectorAll('#navbarNav .nav-link:not(.dropdown-toggle)');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbarNav.classList.remove('show');
      cancelButton.style.display = "none";
      menuIcon.classList.remove("hidden");
    });
  });

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
