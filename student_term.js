// Toggle Navbar
function toggleNavbar() {
    const navbarNav = document.getElementById("navbarNav");
    const cancelButton = document.querySelector(".cancel-btn");
    const menuIcon = document.querySelector(".navbar-toggler-icon");

    if (navbarNav) {
        const isExpanded = navbarNav.classList.contains("show");

        navbarNav.classList.toggle("show", !isExpanded);
        if (cancelButton) cancelButton.style.display = isExpanded ? "none" : "block";
        if (menuIcon) menuIcon.classList.toggle("hidden", !isExpanded);
    } else {
        console.error("Navbar element not found.");
    }
}

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

    // Event listener for resetting to selection
    $("#back-to-selection").click(resetToSelection);

    // Initially hide the "Back to Selection" button
    $("#back-to-selection").hide();
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