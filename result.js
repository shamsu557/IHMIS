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
    const dropdownToggle = document.querySelector('#resultManagementDropdown'); // ID of the main dropdown toggle
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="resultManagementDropdown"]'); // Menu linked to the toggle
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const students = await response.json();

        const studentTbody = $('#student-tbody');
        const studentInfo = $('#student-info');
        const noStudentsMessage = $('#no-students-message');

        // Clear previous data and hide unnecessary sections
        studentTbody.empty();
        studentInfo.hide();
        noStudentsMessage.hide();

        if (students.length > 0) {
            // Display selected options
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
                            <td><input type="text" maxlength="2" class="form-control score-input" name="${test}" data-id="${student.studentID}" style="width: 50px; text-align: center;"></td>
                        `).join('')}
                    </tr>
                `);
            });

            // Restrict input to numbers only (0-100)
            $('.score-input').on('input', function() {
                this.value = this.value.replace(/[^0-9]/g, ''); // Allow only digits 0-9
            });

            // Hide the selection header and show score submission UI
            $('#view-students, #subjectSelect, #termSelect, #classSelect, #resultManagementHeader, #sessionSelect').hide();
            $('#submit-scores').show();
            $('#back-to-selection').show();
            $('#filter-students').show(); // Show the search input for filtering
            $('#search-button').show(); // Show the search input for filtering
           

        } else {
            noStudentsMessage.show();
        }
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Error loading students: ' + error.message);
    }

    // Back to class selection
    $('#back-to-selection').off('click').on('click', function () {
        // Hide student table and associated headers
        $('#student-info').hide();
        $('#submit-scores').hide();
        $('#filter-students').hide();


        // Show class selection fields
        $('#view-students, #subjectSelect, #termSelect, #classSelect, #resultManagementHeader, #sessionSelect').show();

        // Clear student table
        $('#student-tbody').empty();

        // Reset any error or no student messages
        $('#no-students-message').hide();

        // Hide the back-to-selection button
        $('#back-to-selection').hide();
    });
}


// Filter Students by Name or ID
$('#filter-students').on('input', function () {
    const filterValue = $(this).val().toLowerCase(); // Get the filter value
    $('#student-tbody tr').each(function () {
        const studentData = $(this).text().toLowerCase(); // Get the row text
        $(this).toggle(studentData.includes(filterValue)); // Show or hide based on the filter
    });
});

$(document).ready(function () {
    loadClassOptions();
    $('#view-students').on('click', loadStudents);
    $('#submit-scores').on('click', submitScores);

    // Restrict score inputs to their maximum values
    $(document).on('input', '.score-input', function () {
        const input = $(this);
        const name = input.attr('name');
        const value = parseInt(input.val()) || 0;

        if (name === 'test1' || name === 'test2' || name === 'test3') {
            if (value > 10) {
                alert('CA scores cannot exceed 10 marks. Please enter a valid score.');
                input.val(''); // Clear the field
            }
        } else if (name === 'exam') {
            if (value > 70) {
                alert('Exam scores cannot exceed 70 marks. Please enter a valid score.');
                input.val(''); // Clear the field
            }
        }
    });
});

async function submitScores() {
    const scores = [];
    const subjectName = document.getElementById("subject-name").innerText.replace('Subject: ', '').trim();
    const term = document.getElementById("term-name").innerText.replace('Term: ', '').trim();
    const session = document.getElementById("session-name").innerText.replace('Session: ', '').trim();

    let validScores = true; // Flag to check if all scores are valid

    $('#student-tbody tr').each(function () {
        const checkbox = $(this).find('.student-checkbox')[0];
        if (checkbox.checked) { // Only proceed if the student is checked
            const studentID = checkbox.dataset.id;
            const scoreInputs = $(this).find('.score-input');

            const caScores = [scoreInputs[0].value, scoreInputs[1].value, scoreInputs[2].value].map(score => parseInt(score) || 0);
            const examScore = parseInt(scoreInputs[3].value) || 0;

            // Validate CA and Exam scores
            if (caScores.some(score => score > 10) || examScore > 70) {
                validScores = false;
                alert(`Invalid scores for student ID: ${studentID}. Please ensure CAs are max 10 and Exam is max 70.`);
                return false; // Break out of .each loop
            }

            const total = caScores.reduce((sum, score) => sum + score, 0) + examScore;
            const examGrade = calculateGrade(total);

            scores.push({
                studentID: studentID,
                subjectName: subjectName,
                term: term,
                session: session,
                firstCA: caScores[0],
                secondCA: caScores[1],
                thirdCA: caScores[2],
                exams: examScore,
                total: total,
                examGrade: examGrade
            });
        }
    });

    if (!validScores) {
        return; // Exit function if any score validation fails
    }

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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update scores.');
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

window.onscroll = function() {
    document.getElementById("myBtn").style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none";
};

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
  // Close button functionality
  function goBack() {
    window.history.back();
    }