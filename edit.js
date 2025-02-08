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

let studentToDelete = null;

function loadClassOptions() {
    $.ajax({
        url: '/api/getClasses',
        method: 'GET',
        success: function(classes) {
            const classSelection = $('#class-selection');
            classSelection.empty();
            classSelection.append('<option value="" selected disabled>Select Class</option>');
            classes.forEach(c => {
                classSelection.append(`<option value="${c}">${c}</option>`);
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Failed to load classes:', textStatus, errorThrown);
            alert('Error loading classes. Please check the console for more details.');
        }
    });
}

function loadStudents(className) {
    $.ajax({
        url: '/api/getStudents',
        method: 'POST',
        data: JSON.stringify({ class: className }),
        contentType: 'application/json',
        success: function(students) {
            const studentList = $('#student-list');
            studentList.empty();
            if (students.length > 0) {
                students.forEach(student => {
                    studentList.append(`
                        <li>
                            ${student.studentID} - ${student.firstname} ${student.surname} ${student.othername ? student.othername + ' ' : ''} - ${student.guardianPhone}
                            <div class="action-buttons">
                                <button class="edit-btn btn-warning" 
                                    data-id="${student.studentID}" 
                                    data-firstname="${student.firstname}" 
                                    data-othername="${student.othername}" 
                                    data-surname="${student.surname}" 
                                    data-guardianphone="${student.guardianPhone}" 
                                    data-class="${student.class}" 
                                    data-gender="${student.gender}" 
                                    data-subjects="${student.subjects}" 
                                    data-studentPicture="${student.picture}">
                                    Edit
                                </button>
                                <button class="delete-btn btn-danger" data-id="${student.studentID}">Delete</button>
                            </div>
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

$(document).on('click', '.delete-btn', function() {
    studentToDelete = $(this).data('id');
    $('#confirmation-modal').show();
});

$('#confirm-delete').click(function() {
    const usernameInput = $('#admin-username-input').val();
    const passwordInput = $('#admin-password-input').val();
    if (usernameInput && passwordInput) {
        deleteStudent(studentToDelete, usernameInput, passwordInput);
    } else {
        alert('Please enter your Username and Password.');
    }
});

function deleteStudent(studentId, username, password) {
    $.ajax({
        url: `/api/deleteStudent/${studentId}`,
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({ username, password }),
        success: function(response) {
            alert(response.message);
            $('#confirmation-modal').hide();
            loadStudents($('#class-selection').val());
        },
        error: function(error) {
            alert(error.responseJSON?.message || 'Error deleting student.');
        }
    });
}

$(document).on('click', '.edit-btn', function() {
    const studentData = $(this).data();

    // Fill form with student data
    $('#edit-student-id').val(studentData.id);
    $('#edit-firstname').val(studentData.firstname);
    $('#edit-othername').val(studentData.othername || '');
    $('#edit-surname').val(studentData.surname);
    $('#edit-guardian-phone').val(studentData.guardianphone);
    $('#formClass').val(studentData.class);

    // Set the gender dropdown value
    $('#gender').val(studentData.gender || '');

    // Pre-select subjects
    $('input[name="subjects[]"]').prop('checked', false);
    const subjects = studentData.subjects ? studentData.subjects.split(',') : [];
    subjects.forEach(subject => {
        $(`input[name="subjects"][value="${subject.trim()}"]`).prop('checked', true);
    });

    $('#edit-modal').show();
});

$('#confirm-edit').click(function() {
    $('#edit-modal').hide();
    $('#edit-confirmation-modal').show();
});

$('#confirm-edit-save').click(function() {
    const confirmationInput = $('#admin-email-input-edit').val();
    const passwordInput = $('#admin-password-input-edit').val();

    if (confirmationInput && passwordInput) {
        const updatedStudent = {
            id: $('#edit-student-id').val(),
            firstname: $('#edit-firstname').val().trim().toUpperCase(),
            othername: $('#edit-othername').val().trim().toUpperCase(),
            surname: $('#edit-surname').val().trim().toUpperCase(),
            guardianPhone: $('#edit-guardian-phone').val(),
            studentClass: $('#formClass').val(),
            gender: $('#gender').val(), // Get selected gender
            subjects: $('input[name="subjects[]"]:checked').map(function() {
                return $(this).val();
            }).get().join(','),
            picture: $('#studentPicture').prop('files')[0] || null
        };

        if (!updatedStudent.gender) {
            alert('Please select a gender.');
            return;
        }

        editStudent(updatedStudent, confirmationInput, passwordInput);
    } else {
        alert('Please enter Admin username/email and Password.');
    }
});

function editStudent(student, staffEmailOrID, password) {
    const formData = new FormData();
    formData.append('staffEmailOrID', staffEmailOrID);
    formData.append('password', password);
    Object.keys(student).forEach(key => {
        if (student[key] !== undefined && student[key] !== null) {
            formData.append(key, student[key]);
        }
    });

    $.ajax({
        url: '/api/editStudent',
        method: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(response) {
            $('#edit-confirmation-modal').hide();
            loadStudents($('#class-selection').val());
            alert(response.message || 'Student updated successfully.');
        },
        error: function(err) {
            console.error('Update failed:', err);
            alert(err.responseJSON?.message || 'Error updating student.');
        }
    });
}

$(document).ready(function () {
    loadClassOptions();

    $('#view-students').click(function () {
        const classSelection = $('#class-selection').val();
        const selectedClassText = $('#class-selection option:selected').text();

        if (classSelection) {
            loadStudents(classSelection);

            $('#select-class-header, #view-students, #class-label, #class-selection').hide();
            $('#selected-class-header')
                .addClass('small text-muted')
                .text(`List of The Students In ${selectedClassText}: `)
                .show();
            $('#back-to-selection').show();
            $('#search-button').show();
            $('#filter-students').show();
        } else {
            alert('Please select a class.');
        }
    });

    $('#back-to-selection').click(function () {
        $('#selected-class-header').hide().removeClass('small text-muted');
        $('#select-class-header, #view-students, #class-label, #class-selection').show();
        $('#back-to-selection').hide();
        $('#search-button').hide();
        $('#filter-students').hide();
        $('#student-list').empty();
    });

    $('#filter-students').on('input', function () {
        const filterValue = $(this).val().toLowerCase();
        $('#student-list li').each(function () {
            const studentText = $(this).text().toLowerCase();
            $(this).toggle(studentText.includes(filterValue));
        });
    });
});

window.onscroll = function() { scrollFunction() };

function scrollFunction() {
    document.getElementById("myBtn").style.display = document.body.scrollTop > 20 || document.documentElement.scrollTop > 20 ? "block" : "none";
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function goBack() {
    window.history.back();
}
