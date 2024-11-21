// Toggle Navbar
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
$(document).ready(function () {
    // Load Classes
    function loadClasses() {
        $.ajax({
            url: '/api/fetchClasses',
            method: 'GET',
            success: function (classes) {
                const classDropdown = $('#class-selection');
                classDropdown.empty().append('<option value="" disabled selected>Select Class</option>');
                classes.forEach(cls => classDropdown.append(`<option value="${cls}">${cls}</option>`));
            },
            error: function () {
                alert('Failed to load classes.');
            }
        });
    }

    // Load Students for Selected Class
    $('#load-students').click(function () {
        const selectedClass = $('#class-selection').val();

        if (!selectedClass) {
            alert('Please select a class.');
            return;
        }

        $.ajax({
            url: '/api/fetchStudents',
            method: 'POST',
            data: JSON.stringify({ class: selectedClass }),
            contentType: 'application/json',
            success: function (students) {
                const studentsList = $('#students-list');
                studentsList.empty();

                if (students.length) {
                    students.forEach(student => {
                        studentsList.append(`
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${student.studentID} - ${student.firstname} ${student.surname} ${student.othername ? student.othername + ' ' : ''}
                                <div>
                                    <a href="#" class="view-result" data-id="${student.studentID}">View Result</a>
                                    |
                                    <a href="#" class="download-result" data-id="${student.studentID}">Download</a>

                                    
                                </div>
                            </li>
                        `);
                    });

                    $('#class-header').text(`Class: ${selectedClass}`);
                    $('#classSelection').hide();
                    $('#students-section').show();
                } else {
                    alert('No students found.');
                }
            },
            error: function () {
                alert('Failed to load students.');
            }
        });
    });

    // Back Button
    $('#back-button').click(function () {
        $('#students-section').hide();
        $('#classSelection').show();
        $('#students-list').empty();
    });

    // View Result
    $(document).on('click', '.view-result', function () {
        const studentID = $(this).data('id');
        const session = $('#sessionSelect').val(); // Get selected session

        if (!session) {
            alert('Please select a session.');
            return;
        }

        window.location.href = `/api/sessionReport/view/${studentID}?session=${encodeURIComponent(session)}`;
    });

    // Download Result
    $(document).on('click', '.download-result', function () {
        const studentID = $(this).data('id');
        const session = $('#sessionSelect').val(); // Get selected session

        if (!session) {
            alert('Please select a session.');
            return;
        }

        window.location.href = `/api/sessionReport/download/${studentID}?session=${encodeURIComponent(session)}`;
    });

 // Load Sessions
function loadSessions() {
    $.ajax({
        url: '/api/fetchSessions',
        method: 'GET',
        success: function (sessions) {
            console.log("Sessions loaded:", sessions);  // Log the sessions returned
            const sessionDropdown = $('#sessionSelect');
            sessionDropdown.empty().append('<option value="" disabled selected>Select Session</option>');
            sessions.forEach(session => sessionDropdown.append(`<option value="${session}">${session}</option>`));
        },
        error: function (xhr, status, error) {
            console.error('Failed to load sessions:', error); // Log any errors
            alert('Failed to load sessions. Please try again later.');
        }
    });
}


    // Initialize
    loadClasses();
    loadSessions();
});

    // Close button functionality
function goBack() {
window.history.back();
}

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