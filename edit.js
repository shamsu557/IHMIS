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
                            ${student.studentID} - ${student.firstname}  ${student.surname} ${student.othername ? student.othername + ' ' : ''} - ${student.guardianPhone}
                            <div class="action-buttons">
                                <button class="edit-btn btn-warning" data-id="${student.studentID}" data-firstname="${student.firstname}" data-othername="${student.othername}" data-surname="${student.surname}" data-guardianphone="${student.guardianPhone}" data-class="${student.class}" data-subjects="${student.subjects}" data-studentPicture="${student.picture}">Edit</button>
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
    $('#edit-student-id').val(studentData.id);
    $('#edit-firstname').val(studentData.firstname);
    $('#edit-othername').val(studentData.othername || '');
    $('#edit-surname').val(studentData.surname);
    $('#edit-guardian-phone').val(studentData.guardianphone);
    $('#formClass').val(studentData.class);

    $('input[name="subjects"]').prop('checked', false);
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
            subjects: $('input[name="subjects[]"]:checked').map(function() {
                return $(this).val();
            }).get().join(','), // Collect selected subjects as a comma-separated string
            picture: $('#studentPicture').prop('files')[0] || null
        };

        // Remove empty or unchanged fields before sending the object
        Object.keys(updatedStudent).forEach(key => {
            if (!updatedStudent[key] || updatedStudent[key] === '') {
                delete updatedStudent[key];
            }
        });

        editStudent(updatedStudent, confirmationInput, passwordInput);
    } else {
        alert('Please enter your Staff ID/Email and Password.');
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
// Make sure `subjects` field is collected as a comma-separated string
const updatedStudent = {
    id: $('#edit-student-id').val(),
    firstname: $('#edit-firstname').val().trim().toUpperCase(),
    othername: $('#edit-othername').val().trim().toUpperCase(),
    surname: $('#edit-surname').val().trim().toUpperCase(),
    guardianPhone: $('#edit-guardian-phone').val(),
    class: $('#formClass').val(),
    subjects: $('input[name="subjects"]:checked').map(function() { return this.value; }).get().join(','),
    picture: $('#studentPicture').prop('files')[0]
};

$(document).ready(function () {
    // Load class options into the dropdown
    loadClassOptions();

    // Event handler for "View Students" button
    $('#view-students').click(function () {
        const classSelection = $('#class-selection').val();
        const selectedClassText = $('#class-selection option:selected').text();

        if (classSelection) {
            // Load students for the selected class
            loadStudents(classSelection);

            // Hide class selection and show selected class header
            $('#select-class-header, #view-students, #class-label, #class-selection').hide();
            $('#selected-class-header')
                .addClass('small text-muted')
                .text(`List of The Students In ${selectedClassText}: `)
                .show();
            $('#back-to-selection').show();
            $('#search-button').show();
            $('#filter-students').show(); // Show the search input for filtering
        } else {
            alert('Please select a class.');
        }
    });

    // Event handler for "Back to Class" button
    $('#back-to-selection').click(function () {
        // Reset to initial view
        $('#selected-class-header').hide().removeClass('small text-muted');
        $('#select-class-header, #view-students, #class-label, #class-selection').show();
        $('#back-to-selection').hide();
        $('#search-button').hide();
        $('#filter-students').hide(); // Hide the search input
        $('#student-list').empty(); // Clear student list
    });

    // Event handler for filtering students
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

    // Close button functionality
function goBack() {
window.history.back();
}
