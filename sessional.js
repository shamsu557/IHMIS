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
  

// Load Class Options
function loadClassOptions() {
    $.ajax({
        url: '/api/fetchClasses',
        method: 'GET',
        success: function (classes) {
            const classSelection = $('#class-selection');
            classSelection.empty().append('<option value="" selected disabled>Select Class</option>');
            classes.forEach(cls => {
                classSelection.append(`<option value="${cls}">${cls}</option>`);
            });
        },
        error: function () {
            alert('Error loading classes.');
        }
    });
}

// Load Students for Selected Class
function loadStudents(className) {
    $.ajax({
        url: '/api/fetchStudents',
        method: 'POST',
        data: JSON.stringify({ class: className }),
        contentType: 'application/json',
        success: function (students) {
            const studentList = $('#student-list');
            studentList.empty();
            if (students.length > 0) {
                students.forEach(student => {
                    const otherName = student.othername ? `${student.othername} ` : '';
                    studentList.append(`
                        <li class="student-item">
                            <span class="student-name">
                                ${student.studentID} - ${student.firstname} ${student.surname} ${otherName}
                            </span>
                            <div class="student-actions">
                                <a href="#" class="view-result" data-id="${student.studentID}">View Result</a> |
                                <a href="#" class="download-result" data-id="${student.studentID}">Download</a>
                            </div>
                        </li>
                    `);
                });
            } else {
                studentList.append('<li>No students found in this class.</li>');
            }
        },
        error: function () {
            alert('Error loading students.');
        }
    });
}

// Load Sessions
function loadSessions() {
    $.ajax({
        url: '/api/fetchSessions',
        method: 'GET',
        success: function (sessions) {
            const sessionDropdown = $('#sessionSelect');
            sessionDropdown.empty().append('<option value="" disabled selected>Select Session</option>');
            sessions.forEach(session => {
                sessionDropdown.append(`<option value="${session}">${session}</option>`);
            });
        },
        error: function () {
            alert('Failed to load sessions. Please try again later.');
        }
    });
}

// Event Handlers
$(document).ready(function () {
    loadClassOptions();
    loadSessions();

    // View Students
    $('#view-students').click(function () {
        const selectedClass = $('#class-selection').val();
        if (selectedClass) {
            loadStudents(selectedClass);
            $('#classSelection, #select-class-header, #view-students').hide();
            $('#selected-class-header')
                .text(`Class: ${selectedClass}`)
                .addClass('small text-muted')
                .show();
            $('#back-to-selection, #search-button, #filter-students').show();
        } else {
            alert('Please select a class.');
        }
    });

    // Back to Class Selection
    $('#back-to-selection').click(function () {
        $('#selected-class-header').hide().removeClass('small text-muted');
        $('#classSelection, #select-class-header, #view-students').show();
        $('#back-to-selection, #search-button, #filter-students').hide();
        $('#student-list').empty();
    });

    // Filter Students
    $('#filter-students').on('input', function () {
        const filterValue = $(this).val().toLowerCase();
        $('#student-list li').each(function () {
            const studentText = $(this).text().toLowerCase();
            $(this).toggle(studentText.includes(filterValue));
        });
    });

    // View Result
    $(document).on('click', '.view-result', function () {
        const studentID = $(this).data('id');
        const session = $('#sessionSelect').val(); // Get selected session

        console.log('Student ID:', studentID);  // Debugging output
        console.log('Selected Session:', session);  // Debugging output

        if (!studentID || !session) {
            alert('Please select a session and try again.');
            return;
        }

        // Proceed with redirect to view result
        window.location.href = `/api/sessionReport/view/${studentID}?session=${encodeURIComponent(session)}`;
    });

    // Download Result
    $(document).on('click', '.download-result', function () {
        const studentID = $(this).data('id');
        const session = $('#sessionSelect').val(); // Get selected session

        console.log('Student ID:', studentID);  // Debugging output
        console.log('Selected Session:', session);  // Debugging output

        if (!studentID || !session) {
            alert('Please select a session and try again.');
            return;
        }

        // Proceed with redirect to download result
        window.location.href = `/api/sessionReport/download/${studentID}?session=${encodeURIComponent(session)}`;
    });

    // Scroll to Top Button
    window.onscroll = function () {
        document.getElementById("myBtn").style.display = document.documentElement.scrollTop > 20 ? "block" : "none";
    };
    
    function topFunction() {
        document.documentElement.scrollTop = 0;
    }
    document.getElementById("myBtn").addEventListener("click", topFunction);
});
// Close button functionality
function goBack() {
    window.history.back();
    }
    