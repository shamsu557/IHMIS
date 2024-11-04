function toggleNavbar() {
    const navbarNav = document.getElementById("navbarNav");
    const cancelButton = document.querySelector(".cancel-btn");
    const menuIcon = document.querySelector(".navbar-toggler-icon");

    const isOpen = navbarNav.classList.toggle("show");
    cancelButton.style.display = isOpen ? "block" : "none"; // Toggle cancel button
    menuIcon.classList.toggle("hidden", isOpen); // Show/hide menu icon
}

async function validateStaff() {
    const staffIdentifier = document.getElementById("staffIdentifier").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('/result_login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffIdentifier, password })
        });

        const result = await response.json();

        if (result.success) {
            sessionStorage.setItem("selectedClass", result.selectedClass);
            document.getElementById("loginForm").style.display = "none";
            document.getElementById("selectionForm").style.display = "block";
            await Promise.all([loadClasses(), loadSubjects()]); // Load classes and subjects concurrently
        } else {
            document.getElementById("loginError").innerText = result.message;
        }
    } catch (error) {
        console.error('Error validating staff:', error);
    }
}

async function loadClassOptions() {
    try {
        const response = await fetch('/api/getClasses');
        const classes = await response.json();
        const classSelection = $('#classSelect');

        classSelection.empty().append('<option value="" selected disabled>Select Class</option>');
        classes.forEach(c => classSelection.append(`<option value="${c}">${c}</option>`));
    } catch (error) {
        alert('Error loading classes: ' + error.message);
    }
}

async function loadClasses() {
    try {
        const response = await fetch('/getTeacherClasses');
        const classes = await response.json();
        const classSelect = document.getElementById("classSelect");

        classSelect.innerHTML = '<option value="">Select Class</option>';
        classes.forEach(cls => {
            if (cls.class) {
                classSelect.innerHTML += `<option value="${cls.class}">${cls.class}</option>`;
            }
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadSubjects() {
    try {
        const response = await fetch('/getTeacherSubjects');
        const subjects = await response.json();
        const subjectSelect = document.getElementById("subjectSelect");

        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        subjects.forEach(subject => {
            if (subject.subject) {
                subjectSelect.innerHTML += `<option value="${subject.subject}">${subject.subject}</option>`;
            }
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

async function loadStudents() {
    const selectedClass = document.getElementById("classSelect").value;
    const selectedSubject = document.getElementById("subjectSelect").value;
    const selectedTerm = document.getElementById("termSelect").value;
    const selectedSession = document.getElementById("sessionSelect").value;

    console.log('Loading students for class:', selectedClass);
    try {
        const response = await fetch('/api/getStudentsByClass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class: selectedClass })
        });
        const students = await response.json();

        const studentTbody = $('#student-tbody');
        const studentInfo = $('#student-info');
        const noStudentsMessage = $('#no-students-message');

        studentTbody.empty();
        studentInfo.hide();
        noStudentsMessage.hide();

        if (students.length > 0) {
            $('#class-name').text(`Class: ${selectedClass}`);
            $('#subject-name').text(`Subject: ${selectedSubject}`);
            $('#term-name').text(`Term: ${selectedTerm}`);
            $('#session-name').text(`Session: ${selectedSession}`);

            studentInfo.show();
            students.forEach(student => {
                studentTbody.append(`
                    <tr>
                        <td><input type="checkbox" class="student-checkbox" data-id="${student.studentID}"></td> <!-- Checkbox for selection -->
                        <td>${student.studentID}</td>
                        <td>${student.firstname} ${student.othername || ''} ${student.surname}</td>
                        ${['test1', 'test2', 'test3', 'exam'].map(test => `
                            <td><input type="number" class="form-control score-input" name="${test}" data-id="${student.studentID}" style="width: 65px; height: 40px; font-size: 16px;"></td>
                        `).join('')}
                    </tr>
                `);
            });

            // Ensure only digits can be entered
            $('.score-input').on('input', function() {
                this.value = this.value.replace(/[^0-9]/g, ''); // Allows only digits
            });

            $('#view-students, #subjectSelect, #termSelect, #classSelect, #resultManagementHeader, #sessionSelect').hide();
            $('#submit-scores').show();
        } else {
            noStudentsMessage.show();
        }
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Error loading students: ' + error.message);
    }
}

$(document).ready(function() {
    loadClassOptions();
    $('#view-students').on('click', loadStudents);
    $('#submit-scores').on('click', submitScores);
});
async function submitScores() {
    const scores = [];
    const subjectName = document.getElementById("subject-name").innerText.replace('Subject: ', '');
    const term = document.getElementById("term-name").innerText.replace('Term: ', '');
    const session = document.getElementById("session-name").innerText.replace('Session: ', '');

    $('#student-tbody tr').each(function() {
        const checkbox = $(this).find('.student-checkbox')[0];
        if (checkbox.checked) { // Only proceed if the student is checked
            const studentID = checkbox.dataset.id;
            const scoreInputs = $(this).find('.score-input');

            const total = [...scoreInputs].reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);
            const examGrade = calculateGrade(total);

            scores.push({
                studentID: studentID,
                subjectName: subjectName,
                term: term,
                session: session,
                firstCA: scoreInputs[0].value,
                secondCA: scoreInputs[1].value,
                thirdCA: scoreInputs[2].value,
                exams: scoreInputs[3].value,
                total: total,
                examGrade: examGrade
            });
        }
    });

    if (scores.length === 0) {
        alert('Please select at least one student to submit scores.');
        return; // Exit the function if no students are selected
    }

    try {
        const response = await fetch('/api/submitScores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scores }) // Send scores to the server
        });

        if (response.ok) {
            alert('Scores updated successfully!');
        } else {
            throw new Error('Failed to update scores.');
        }
    } catch (error) {
        console.error('Error updating scores:', error);
        alert('Failed to update scores: ' + error.message);
    }
}
function calculateGrade(total) {
    if (total >= 70) return 'A';
    else if (total >= 60) return 'B';
    else if (total >= 50) return 'C';
    else if (total >= 40) return 'D';
    return 'F';
}
function logout() {
    window.location.href = '/logout';
}

// Function to check authentication status
function checkAuth() {
    fetch('/auth-check')
    .then(response => response.json())
    .then(data => {
      if (!data.authenticated) {
        // Redirect to admin login if not authenticated
        window.location.href = '/adminLogin';
      }
    })
    .catch(err => {
      console.error('Error checking authentication:', err);
    });
  }
function goBack() {
    window.history.back();
}

window.onscroll = function() {
    document.getElementById("myBtn").style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none";
};

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
