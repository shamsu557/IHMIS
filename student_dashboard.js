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
  
    // Hide dropdown if clicked anywhere outside the button or menu
    document.addEventListener('click', (event) => {
      if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  });
  
document.addEventListener("DOMContentLoaded", function () {
    const session = {}; // Simulated session store (replace with actual session handling in production)
    const defaultProfilePic = 'Profile-Black.png';

    // Utility function to update profile picture
    function updateProfilePicture(elementId, imageUrl) {
        const imageElement = document.getElementById(elementId);
        imageElement.src = imageUrl || defaultProfilePic;
    }

    // Fetch and populate student details
    async function fetchStudentDetails(studentID) {
        try {
            const response = await fetch(`/populateStudentDetails?studentID=${encodeURIComponent(studentID)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                const studentName = `${data.firstname} ${data.surname} ${data.othername || ''}`.trim();

                // Populate profile details
                document.getElementById('studentName').textContent = studentName;
                document.getElementById('studentID').textContent = data.studentID || 'N/A';
                document.getElementById('class').textContent = data.class || 'N/A';
                document.getElementById('guardianPhone').textContent = data.guardianPhone || 'N/A';

                // Profile picture
                updateProfilePicture('profile-pic', data.studentPicture);

                // Populate modal details
                document.getElementById('modalStudentName').textContent = studentName;
                document.getElementById('modalStudentID').textContent = data.studentID || 'N/A';
                document.getElementById('modalClass').textContent = data.class || 'N/A';
                document.getElementById('modalGuardianPhone').textContent = data.guardianPhone || 'N/A';
                updateProfilePicture('modalProfilePic', data.studentPicture);
            } else {
                console.error(`Backend error: ${data.message}`);
                alert(`Error fetching student details: ${data.message}`);
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
            alert('An error occurred while fetching student details.');
        }
    }

    // Event listener for ID card modal
    const viewIDCardLink = document.getElementById("viewIDCard");
    if (viewIDCardLink) {
        viewIDCardLink.addEventListener("click", (event) => {
            event.preventDefault();
            $('#idCardModal').modal('show');
        });
    }

   // Handle session-based navigation
["student-term-result-link", "student-session-result-link"].forEach((linkId) => {
    const linkElement = document.getElementById(linkId);
    if (linkElement) {
        linkElement.addEventListener("click", (event) => {
            if (!session.studentID) {
                event.preventDefault();
                alert("Please log in first!");
            } else {
                sessionStorage.setItem("studentID", session.studentID);
                window.location.href = "/student_term_result.html"; // Redirect to the student result page
            }
        });
    }
});

    // Scroll-to-top button functionality
    const scrollToTopButton = document.getElementById("myBtn");
    if (scrollToTopButton) {
        window.addEventListener("scroll", () => {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                scrollToTopButton.style.display = "block";
            } else {
                scrollToTopButton.style.display = "none";
            }
        });

        scrollToTopButton.addEventListener("click", () => {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For other browsers
        });
    }

    // Student logout
    const logoutLink = document.getElementById("student_logout");
    if (logoutLink) {
        logoutLink.addEventListener("click", async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('/studentLogout', { method: 'POST' });
                if (response.ok) {
                    session.studentID = null;
                    window.location.href = "studentLogin.html";
                } else {
                    throw new Error('Failed to log out');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('An error occurred during logout. Please try again.');
            }
        });
    }

    // Simulated login function (replace with actual backend authentication)
    async function login(studentID, password) {
        // Replace this section with actual backend authentication logic
        const studentDatabase = { "testID": "testPassword" }; // Simulated database

        if (studentDatabase[studentID] && studentDatabase[studentID] === password) {
            session.studentID = studentID;
            alert("Login successful!");
            // Redirect to dashboard or appropriate page
        } else {
            alert("Invalid login credentials!");
        }
    }

    // Initialize data on page load
    const studentID = "your_student_id"; // Replace with actual logged-in student ID
    if (studentID) {
        session.studentID = studentID;
        fetchStudentDetails(studentID);
    }
});
