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
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('identifier').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/form-master-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });
                const data = await response.json();

                if (response.ok) {
                    document.getElementById('loginCard').style.display = 'none';
                    document.getElementById('classSelection').style.display = 'block';
                    document.getElementById('classInfo').innerText = `Class: ${data.formClass || 'Undefined'}`;
                    loadStudents(data.students || []);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Failed to log in');
            }
        });

        document.getElementById('loadStudentsBtn').addEventListener('click', () => {
            document.getElementById('classSelection').style.display = 'none';
            document.getElementById('studentList').style.display = 'block';
        });
        function loadStudents(students) {
    const container = document.getElementById('studentsContainer');
    container.innerHTML = '';
    students.forEach(student => {
        const studentDiv = document.createElement('div');
        studentDiv.classList.add('border', 'p-3', 'mb-3', 'rounded');
        studentDiv.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="selectedStudents" value="${student.studentID}" id="student${student.studentID}">
                <label class="form-check-label" for="student${student.studentID}">
                    ${student.firstname} ${student.surname} (ID: ${student.studentID})
                </label>
            </div>
           <div class="form-row mt-2">
    <div class="form-group col-md-6">
        <label>Academic Responsibility</label>
        <input type="text" maxlength="1" class="form-control form-control-score" name="academicResponsibility" required>
    </div>
    <div class="form-group col-md-6">
        <label>Respect and Discipline</label>
        <input type="text" maxlength="1" class="form-control form-control-score" name="respectAndDiscipline" required>
    </div>
</div>
<div class="form-row">
    <div class="form-group col-md-6">
        <label>Punctuality and Personal Organization</label>
        <input type="text" maxlength="1" class="form-control form-control-score" name="punctuality" required>
    </div>
    <div class="form-group col-md-6">
        <label>Social and Physical Development</label>
        <input type="text" maxlength="1" class="form-control form-control-score" name="socialDevelopment" required>
    </div>
</div>
<div class="form-row">
    <div class="form-group col-md-6">
        <label>Attendance</label>
        <input type="text" class="form-control form-control-score" name="attendance" required> <!-- Removed maxlength -->
    </div>
</div>

            <input type="hidden" name="studentID" value="${student.studentID}">
        `;
        container.appendChild(studentDiv);
    });
    
   // Restrict input to numbers only
document.querySelectorAll('.form-control-score').forEach(input => {
    input.addEventListener('input', function() {
        if (this.name === 'attendance') {
            // Allow values from 0 to 120 for Attendance
            this.value = this.value.replace(/[^0-9]/g, ''); // Allow only numeric characters
            if (this.value !== "" && parseInt(this.value, 10) > 120) {
                this.value = '120'; // Cap at 120
            }
        } else {
            // Restrict other fields to 1 to 4
            this.value = this.value.replace(/[^1-4]/g, ''); // Allow only 1 to 4
        }
    });
});
        }
document.getElementById('submitBtn').addEventListener('click', async () => {
    const term = document.getElementById('termSelect').value;
    const session = document.getElementById('sessionSelect').value;
    const assessments = Array.from(document.querySelectorAll('#studentsContainer > div'))
        .filter(studentDiv => studentDiv.querySelector('input[name="selectedStudents"]').checked)
        .map(studentDiv => ({
            studentID: studentDiv.querySelector('input[name="studentID"]').value,  // Updated to studentID
            academicResponsibility: studentDiv.querySelector('input[name="academicResponsibility"]').value,
            respectAndDiscipline: studentDiv.querySelector('input[name="respectAndDiscipline"]').value,
            punctuality: studentDiv.querySelector('input[name="punctuality"]').value,
            socialDevelopment: studentDiv.querySelector('input[name="socialDevelopment"]').value,
            attendance: studentDiv.querySelector('input[name="attendance"]').value

        }));
        // Check if any students are selected
    if (assessments.length === 0) {
        alert('Please select at least one student');
        return; // Stop the form submission if no student is selected
    }


    try {
        const response = await fetch('/form-master/submit-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term, session, assessments })
        });

        if (response.ok) {
            alert('Assessment data saved successfully');
            document.getElementById('studentList').style.display = 'none';
            document.getElementById('classSelection').style.display = 'block';
        } else {
            alert('Error saving assessment data');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Failed to submit assessments');
    }
});
