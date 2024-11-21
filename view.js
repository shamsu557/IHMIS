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

// Load Class Options
function loadClassOptions() {
    $.ajax({
        url: '/api/fetchClasses',
        method: 'GET',
        success: function(classes) {
            const classSelection = $('#class-selection');
            classSelection.empty();
            classSelection.append('<option value="" selected disabled>Select Class</option>');
            classes.forEach(c => {
                classSelection.append(`<option value="${c}">${c}</option>`);
            });
        },
        error: function() {
            alert('Error loading classes.');
        }
    });
}

// View Students
function loadStudents(className, term, session) {
    $.ajax({
        url: '/api/fetchStudents',
        method: 'POST',
        data: JSON.stringify({ class: className, term: term, session: session }),
        contentType: 'application/json',
        success: function(students) {
            const studentList = $('#student-list');
            studentList.empty();
            if (students.length > 0) {
                students.forEach(student => {
                    studentList.append(`
                        <li>
                            ${student.studentID} - ${student.firstname} ${student.surname} ${student.othername ? student.othername + ' ' : ''}
                            <a href="/api/viewResult/${student.studentID}?term=${term}&session=${session}" class="view-link">View Result</a>
                            |
                            <a href="/api/downloadResult/${student.studentID}?term=${term}&session=${session}" class="download-link">Download Result</a>
                        </li>
                    `);
                });
            } else {
                studentList.append('<li>No students found in this class.</li>');
            }
        },
        error: function() {
            alert('Error loading students.');
        }
    });
}

// Event Listeners
$(document).ready(function() {
    loadClassOptions();

    $('#view-students').click(function() {
        const classSelection = $('#class-selection').val();
        const termSelection = $('#termSelect').val();
        const sessionSelection = $('#sessionSelect').val();

        if (classSelection && termSelection && sessionSelection) {
            loadStudents(classSelection, termSelection, sessionSelection);
            $('#classSelection, #select-class-header, #view-students').hide();
            $('#selected-class-header')
                .addClass('small text-muted')  
                .text(`Class: ${classSelection}, Term: ${termSelection}, Session: ${sessionSelection}`)
                .show();
            $('#back-to-selection').show();
        } else {
            alert('Please select class, term, and session.');
        }
    });

    $('#back-to-selection').click(function() {
        $('#selected-class-header').hide().removeClass('small text-muted');
        $('#classSelection, #select-class-header, #view-students').show();
        $('#back-to-selection').hide();
        $('#student-list').empty();
    });
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
