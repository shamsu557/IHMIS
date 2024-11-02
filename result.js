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

async function validateStaff() {
    const staffIdentifier = document.getElementById("staffIdentifier").value;
    const password = document.getElementById("password").value;

    const response = await fetch('/result_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIdentifier, password })
    });

    const result = await response.json();

    if (result.success) {
        // Store the selected class in session storage
        sessionStorage.setItem("selectedClass", result.selectedClass); // Store selected class

        document.getElementById("loginForm").style.display = "none";
        document.getElementById("selectionForm").style.display = "block";
        loadClasses(); // Load classes using teacher_id
        loadSubjects(); // Load subjects using teacher_id
    } else {
        document.getElementById("loginError").innerText = result.message;
    }
}

function loadClassOptions() {
    $.ajax({
        url: '/api/getClasses',
        method: 'GET',
        success: function(classes) {
            const classSelection = $('#classSelect');
            classSelection.empty();
            classSelection.append('<option value="" selected disabled>Select Class</option>');
            classes.forEach(c => {
                classSelection.append(`<option value="${c}">${c}</option>`);
            });
        },
        error: function(err) {
            alert('Error loading classes.');
        }
    });
}

async function loadClasses(teacherClass) {
    try {
        const response = await fetch('/getTeacherClasses'); // Endpoint to get classes based on teacher_id
        const classes = await response.json();

        const classSelect = document.getElementById("classSelect");
        classSelect.innerHTML = '<option value="">Select Class</option>'; // Default option

        // Populate dropdown with all classes for the teacher and set the selected option
        classes.forEach(cls => {
            if (cls.class) {
                const selected = cls.class === teacherClass ? 'selected' : '';
                classSelect.innerHTML += `<option value="${cls.class}" ${selected}>${cls.class}</option>`;
            }
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadSubjects() {
    try {
        const response = await fetch('/getTeacherSubjects'); // Endpoint to get subjects based on teacher_id
        const subjects = await response.json();

        const subjectSelect = document.getElementById("subjectSelect");
        subjectSelect.innerHTML = '<option value="">Select Subject</option>'; // Default option

        // Populate the dropdown with valid subjects only
        subjects.forEach(subject => {
            if (subject.subject) { // Ensure each subject is added individually
                subjectSelect.innerHTML += `<option value="${subject.subject}">${subject.subject}</option>`;
            }
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function loadStudents(className) {
    console.log('Loading students for class:', className); // Log the class name being fetched
    $.ajax({
        url: '/api/getStudentsByClass',
        method: 'POST',
        data: JSON.stringify({ class: className }),
        contentType: 'application/json',
        success: function(students) {
            const studentList = $('#student-list');
            studentList.empty();
            if (students.length > 0) {
                // Create table structure
                studentList.append(`
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Full Name</th>
                                <th>1st Test</th>
                                <th>2nd Test</th>
                                <th>3rd Test</th>
                                <th>Exam</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                `);
                
                const tbody = studentList.find('tbody');

                students.forEach(student => {
                    tbody.append(`
                        <tr>
                            <td>${student.studentID}</td>
                            <td>${student.firstname} ${student.othername ? student.othername + ' ' : ''} ${student.surname}</td>
                            <td><input type="text" class="form-control score-input" name="test1" data-id="${student.studentID}" style="width: 65px; height: 40px; font-size: 16px;"></td>
                            <td><input type="text" class="form-control score-input" name="test2" data-id="${student.studentID}" style="width: 65px; height: 40px; font-size: 16px;"></td>
                            <td><input type="text" class="form-control score-input" name="test3" data-id="${student.studentID}" style="width: 65px; height: 40px; font-size: 16px;"></td>
                            <td><input type="text" class="form-control score-input" name="exam" data-id="${student.studentID}" style="width:  65px; height: 40px; font-size: 16px;"></td>
                        </tr>
                    `);
                });

                // Optional: Add validation to ensure only numbers are entered
                $('.score-input').on('input', function() {
                    this.value = this.value.replace(/[^0-9]/g, ''); // Allows only digits
                });
            } else {
                studentList.append('<p>No students found in this class.</p>');
            }
        },
        error: function(err) {
            console.error('AJAX Error:', err); // Log the error
            alert('Error loading students: ' + err.responseText); // Show the error message
        }
    });
}



// Event listener for the button click
$(document).ready(function() {
    loadClassOptions();
    $('#view-students').on('click', function() {
        const selectedClass = $('#classSelect').val(); // Get the selected class from dropdown
        if (selectedClass) {
            loadStudents(selectedClass); // Call the function with the selected class
        } else {
            alert('Please select a class first.'); // Alert if no class is selected
        }
    });
});

function logout() {
    // Redirect to the logout route, which will clear the session
    window.location.href = '/logout'; 
}

// Back button functionality
function goBack() {
    window.history.back();
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
