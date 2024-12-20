
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

// Load Students
function loadStudents(studentID, term, session) {
    if (!studentID || !term || !session) {
        alert("Please provide all required inputs.");
        return;
    }

    $.ajax({
        url: "/api/fetchStudentByID",
        method: "POST",
        data: JSON.stringify({ studentID, term, session }),
        contentType: "application/json",
        success: function (response) {
            const studentList = $("#student-list");
            const backToSelectionBtn = $("#back-to-selection");
            studentList.empty();

            if (response && response.student) {
                const student = response.student;
                const otherName = student.othername ? `${student.othername} ` : "";

                // Add student details to the list
                studentList.append(`
                    <li>
                        ${student.studentID} - ${student.firstname} ${student.surname} ${otherName} -
                        <a href="/api/viewResult/${student.studentID}?term=${term}&session=${session}" class="view-link">View Result</a>
                        |
                        <a href="/api/downloadResult/${student.studentID}?term=${term}&session=${session}" class="download-link">Download Result</a>
                    </li>
                `);

                // Hide input fields completely
                $("#studentID").closest("div").hide(); // Hide Student ID field
                $("#termSelect").closest("div").hide(); // Hide Term dropdown
                $("#sessionSelect").closest("div").hide(); // Hide Session dropdown
                $("#view-students").hide(); // Hide View Students button

                // Show "Back to Selection" button
                backToSelectionBtn.show();
            } else {
                // No student found
                $("#no-details").text("No student details found.").show();
                backToSelectionBtn.show(); // Show "Back to Selection" button
            }
        },
        error: function () {
            alert("Error fetching student details. Please try again.");
        },
    });
}

// Back to Selection View
function resetToSelection() {
    // Reset everything to its initial state
    $("#studentID").closest("div").show(); // Show Student ID field
    $("#termSelect").closest("div").show(); // Show Term dropdown
    $("#sessionSelect").closest("div").show(); // Show Session dropdown
    $("#view-students").show(); // Show View Students button
    $("#student-list, #no-details").empty(); // Clear fetched data and messages
    $("#back-to-selection").hide(); // Hide "Back to Selection" button
}

// Document Ready
$(document).ready(function () {
    // Event listener for viewing students
    $("#view-students").click(function () {
        const studentID = $("#studentID").val();
        const term = $("#termSelect").val();
        const session = $("#sessionSelect").val();

        if (studentID && term && session) {
            loadStudents(studentID, term, session);
        } else {
            alert("Please select student ID, term, and session.");
        }
    });

    // Automatically populate and disable the student ID field
    $("#student-term-result-link").click(function () {
        const sessionStudentID = sessionStorage.getItem("studentID");
        if (sessionStudentID) {
            $("#studentID").val(sessionStudentID).prop("disabled", true); // Populate and disable
        }
        window.location.href = "student_term_result.html";
    });

    // Event listener for resetting to selection
    $("#back-to-selection").click(resetToSelection);

    // Initially hide the "Back to Selection" button
    $("#back-to-selection").hide();
});

document.addEventListener("DOMContentLoaded", function () {
    const studentIDField = document.getElementById("studentID");
    const storedStudentID = sessionStorage.getItem("studentID");

    if (storedStudentID) {
        studentIDField.value = storedStudentID; // Populate the field with the stored Student ID
        studentIDField.disabled = true; // Disable the field to prevent editing
    } else {
        alert("No Student ID found. Please return to the previous page.");
        window.history.back(); // Go back if no Student ID is found
    }
});

// Back to Top Button
window.onscroll = function() { scrollFunction(); };
function scrollFunction() {
    document.getElementById("myBtn").style.display = document.documentElement.scrollTop > 20 ? "block" : "none";
}
function topFunction() {
    document.documentElement.scrollTop = 0;
}
// Close button functionality
function goBack() {
    window.history.back();
}
