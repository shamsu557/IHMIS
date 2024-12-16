function toggleNavbar() {
    const navbarNav = document.getElementById("navbarNav");
    const cancelButton = document.querySelector(".cancel-btn");
    const menuIcon = document.querySelector(".navbar-toggler-icon");

    if (navbarNav.classList.contains("show")) {
        navbarNav.classList.remove("show");
        cancelButton.style.display = "none";
        menuIcon.classList.remove("hidden");
    } else {
        navbarNav.classList.add("show");
        cancelButton.style.display = "block";
        menuIcon.classList.add("hidden");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggle = document.querySelector('#loginDropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="loginDropdown"]');
    const dropdownItems = dropdownMenu.querySelectorAll('a.dropdown-item');

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
            if (targetPage) {
                dropdownMenu.classList.remove('show');
                window.location.href = targetPage;
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    const session = {};
    const defaultProfilePic = 'Profile-Black.png';

    function updateProfilePicture(elementId, imageUrl) {
        const imageElement = document.getElementById(elementId);
        imageElement.src = imageUrl || defaultProfilePic;
    }

    async function fetchStudentDetails(studentID) {
        try {
            const response = await fetch(`/populateStudentDetails?studentID=${encodeURIComponent(studentID)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                const studentName = `${data.firstname} ${data.surname} ${data.othername || ''}`.trim();

                document.getElementById('studentName').textContent = studentName;
                document.getElementById('studentID').textContent = data.studentID || 'N/A';
                document.getElementById('class').textContent = data.class || 'N/A';
                document.getElementById('guardianPhone').textContent = data.guardianPhone || 'N/A';

                updateProfilePicture('profile-pic', data.studentPicture);

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

    const response = await fetch('/getLoggedInStudent');
    if (response.ok) {
        const data = await response.json();
        if (data.success && data.studentID) {
            session.studentID = data.studentID;
            fetchStudentDetails(data.studentID);
        } else {
            alert('Please log in first.');
            window.location.href = "studentLogin.html";
        }
    } else {
        alert('Failed to fetch logged-in student details. Please log in again.');
        window.location.href = "studentLogin.html";
    }

    ["student-term-result-link", "student-session-result-link"].forEach((linkId) => {
        const linkElement = document.getElementById(linkId);
        if (linkElement) {
            linkElement.addEventListener("click", (event) => {
                if (!session.studentID) {
                    event.preventDefault();
                    alert("Please log in first!");
                } else {
                    sessionStorage.setItem("studentID", session.studentID);
                    if (linkId === "student-term-result-link") {
                        window.location.href = "/student_term_result.html";
                    } else if (linkId === "student-session-result-link") {
                        window.location.href = "/student_session_result.html";
                    }
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
});