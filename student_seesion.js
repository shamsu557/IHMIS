// Toggle Navbar
function toggleNavbar() {
    const navbarNav = document.getElementById("navbarNav");
    const cancelButton = document.querySelector(".cancel-btn");
    const menuIcon = document.querySelector(".navbar-toggler-icon");

    if (navbarNav.classList.contains("show")) {
        navbarNav.classList.remove("show");
        cancelButton.style.display = "none";
        menuIcon.style.display = "block";
    } else {
        navbarNav.classList.add("show");
        cancelButton.style.display = "block";
        menuIcon.style.display = "none";
    }
}

// Populate Student ID Field on Login
function populateStudentID() {
    $.ajax({
        url: "/api/getLoggedInStudent", // Replace with the endpoint to fetch logged-in student details
        method: "GET",
        success: function (response) {
            if (response && response.studentID) {
                $("#studentID").val(response.studentID); // Populate the readonly Student ID field
            } else {
                console.error("Student ID not found in response.");
            }
        },
        error: function () {
            console.error("Error fetching logged-in student details.");
        },
    });
}

// Fetch Student Details
function fetchStudentDetails(studentID, session) {
    if (!studentID || !session) {
        alert("Please provide both Student ID and Session.");
        return;
    }

    $.ajax({
        url: "/api/fetchStudentByID", // Update with your API endpoint
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ studentID, session }),
        success: function (response) {
            const studentDetailsSection = $("#studentDetailsSection");
            const studentDetailsList = $("#student-details");
            studentDetailsList.empty();

            if (response && response.student) {
                const student = response.student;
                studentDetailsList.append(`
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${student.studentID} - ${student.firstname} ${student.surname} ${student.othername ? student.othername + ' ' : ''}
                        <div>
                            <a href="#" class="view-result" data-id="${student.studentID}">View Result</a>
                            |
                            <a href="#" class="download-result" data-id="${student.studentID}">Download</a>
                        </div>
                    </li>
                `);

                studentDetailsSection.show();
                $("#studentInputSection").hide();
            } else {
                alert("No student details found.");
            }
        },
        error: function () {
            alert("Error fetching student details. Please try again.");
        },
    });
}

// Handle "View Result" and "Download Result"
function setupResultActions() {
    // View Result
    $(document).on("click", ".view-result", function (e) {
        e.preventDefault();
        const studentID = $(this).data("id");
        const session = $("#sessionSelect").val(); // Get selected session

        if (!session) {
            alert("Please select a session.");
            return;
        }

        window.location.href = `/api/sessionReport/view/${studentID}?session=${encodeURIComponent(session)}`;
    });

    // Download Result
    $(document).on("click", ".download-result", function (e) {
        e.preventDefault();
        const studentID = $(this).data("id");
        const session = $("#sessionSelect").val(); // Get selected session

        if (!session) {
            alert("Please select a session.");
            return;
        }

        window.location.href = `/api/sessionReport/download/${studentID}?session=${encodeURIComponent(session)}`;
    });
}

// Back to Input Section
function setupBackButton() {
    $("#back-button").click(function () {
        $("#studentDetailsSection").hide();
        $("#studentInputSection").show();
    });
}

// Back to Top Button
function setupScrollToTop() {
    const backToTopButton = $("#myBtn");
    $(window).scroll(function () {
        if ($(this).scrollTop() > 20) {
            backToTopButton.fadeIn();
        } else {
            backToTopButton.fadeOut();
        }
    });

    backToTopButton.click(function () {
        $("html, body").animate({ scrollTop: 0 }, "slow");
    });
}

// Close Button Functionality
function goBack() {
    window.history.back();
}

// Initialize on Page Load
$(document).ready(function () {
    // Populate Student ID field on page load
    populateStudentID();

    // Handle "Fetch Student" button click
    $("#fetch-student").click(function () {
        const studentID = $("#studentID").val().trim(); // Use populated Student ID
        const session = $("#sessionSelect").val();
        fetchStudentDetails(studentID, session);
    });

    // Initialize event handlers
    setupBackButton();
    setupScrollToTop();
    setupResultActions();
});
