$(document).ready(function() {
    // Login Form Submission
    $('#adminLoginForm').submit(function(e) {
        e.preventDefault();
        const username = $('#adminUsername').val();
        const password = $('#adminPassword').val();

        $.post('/api/validate-admin', { username, password }, function(response) {
            if (response.isValid && (response.role === 'Super Admin' || response.role === 'Assistant Super Admin')) {
                $('#loginSection').hide();
                $('#staffManagementSection').show();
                $('#report').show();
                fetchStaff();
                fetchAdmins();
            } else {
                alert('Invalid credentials or insufficient permissions!');
            }
        });
    });

    // Fetch Staff
    function fetchStaff() {
        $.get('/api/staff', function(data) {
            $('#staffList').empty(); // Assuming the list is in an element with id 'staffList'
            data.forEach(staff => {
                $('#staffList').append(`
                    <li>
                        ${staff.staff_id} - ${staff.name} - ${staff.role} 
                        ${staff.role === 'Form Master' ? `- ${staff.formClass}` : ''} 
                        - ${staff.email} - ${staff.phone}- ${staff.security_question}- ${staff.security_answer}
                        <button class="btn btn-warning btn-sm" onclick="editStaff(${staff.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteEntity('staff', ${staff.id})">Delete</button>
                    </li>
                    <hr> <!-- Horizontal line for separation -->
                `);
            });
        });
    }

    // Fetch Admins
    function fetchAdmins() {
        $.get('/api/admins', function(data) {
            $('#adminList').empty(); // Assuming the list is in an element with id 'adminList'
            data.forEach(admin => {
                $('#adminList').append(`
                    <li>
                        ${admin.username} - ${admin.fullName} - ${admin.role} - ${admin.phone} - ${admin.email}
                        <button class="btn btn-danger btn-sm" onclick="deleteEntity('admin', ${admin.id})">Delete</button>
                    </li>
                    <hr> <!-- Horizontal line for separation -->
                `);
            });
        });
    }

    // Filter Staff
    $('#filter-staff').on('input', function () {
        const filterValue = $(this).val().toLowerCase();
        $('#staffList li').each(function () {
            const staffText = $(this).text().toLowerCase();
            $(this).toggle(staffText.includes(filterValue));
        });
    });

    // Filter Admins
    $('#filter-admins').on('input', function () {
        const filterValue = $(this).val().toLowerCase();
        $('#adminList li').each(function () {
            const adminText = $(this).text().toLowerCase();
            $(this).toggle(adminText.includes(filterValue));
        });
    });

    // Delete Entity and Confirmation
    window.deleteEntity = function(type, id) {
        $('#entityToDelete').val(id);
        $('#entityType').val(type);
        $('#confirmationModal').modal('show');
    };

    $('#confirmDelete').click(function() {
        const id = $('#entityToDelete').val();
        const type = $('#entityType').val();
        const username = $('#confirmAdminUsername').val();
        const password = $('#confirmAdminPassword').val();

        $.post('/api/validate-admin', { username, password }, function(response) {
            if (response.isValid) {
                $.ajax({
                    url: `/api/delete-${type}/${id}`,
                    type: 'DELETE',
                    success: function() {
                        fetchStaff();
                        fetchAdmins();
                        $('#confirmationModal').modal('hide');
                        $('#successMessage').text('Entity deleted successfully.').show().delay(3000).fadeOut();
                    },
                    error: function(err) {
                        alert('Error deleting the entity: ' + (err.responseJSON.message || 'An error occurred.'));
                    }
                });
            } else {
                alert('Invalid admin credentials!');
            }
        });
    });

    // Show or hide formClass field based on role selection
    document.getElementById('role').addEventListener('change', function () {
        const formClassField = document.getElementById('class-selection');
        const formClassInput = document.getElementById('formClass');

        // Show the formClass field only if "Form Master" is selected
        if (this.value === 'Form Master') {
            formClassField.style.display = 'block';
        } else {
            formClassField.style.display = 'none';
            formClassInput.value = ''; // Clear formClass input if not needed
        }
    });

    // Function to open and populate the Edit Staff modal
window.editStaff = function (staffId) {
    fetch(`/teacher/${staffId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const teacher = data.teacher;

                $('#staffId').val(teacher.staff_id);
                $('#name').val(teacher.name);
                $('#email').val(teacher.email);
                $('#phone').val(teacher.phone);
                $('#role').val(teacher.role);
                
                // Populate gender with validation
                console.log('Gender:', teacher.gender); // Debugging
                $('#gender').val(teacher.gender ? teacher.gender.trim() : '');

                $('#qualification').val(teacher.qualification);

                // Show or hide form class based on role
                if (teacher.role === 'Form Master') {
                    $('#class-selection').show();
                    $('#formClass').val(teacher.formClass || '');
                } else {
                    $('#class-selection').hide();
                    $('#formClass').val('');
                }

                // Populate subjects
                const subjectSelect = $('#subjects').empty();
                (teacher.subjects || []).forEach(subject => {
                    subjectSelect.append(`<option value="${subject}" selected>${subject}</option>`);
                });

                // Populate classes
                const classSelect = $('#classes').empty();
                (teacher.classes || []).forEach(classItem => {
                    classSelect.append(`<option value="${classItem}" selected>${classItem}</option>`);
                });

                // Show the modal after all fields are set
                $('#editStaffModal').modal('show');
            } else {
                alert('Could not load staff data for editing.');
            }
        })
        .catch(error => console.error('Error loading staff data:', error));
};

    // Handle form submission in the modal
$('#editTeacherForm').on('submit', function (e) {
    e.preventDefault();

    const teacherData = {
        staff_id: $('#staffId').val(),
        name: $('#name').val().trim().toUpperCase(),
        email: $('#email').val(),
        phone: $('#phone').val(),
        role: $('#role').val(),
        gender: $('#gender').val(),
        qualification: $('#qualification').val()
    };

    if (teacherData.role === 'Form Master') {
        teacherData.formClass = $('#formClass').val();
    }

    const selectedSubjects = $("input[name='subjects[]']:checked").map(function () {
        return $(this).val();
    }).get();
    if (selectedSubjects.length) teacherData.subjects = selectedSubjects;

    const selectedClasses = $("input[name='classes[]']:checked").map(function () {
        return $(this).val();
    }).get();
    if (selectedClasses.length) teacherData.classes = selectedClasses;

    const formData = new FormData();
    formData.append('teacherData', JSON.stringify(teacherData));

    const profilePictureFile = $('#profilePicture')[0].files[0];
    if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile);
    }

    // Encode the staff_id to handle forward slashes in the URL
    const encodedStaffId = encodeURIComponent(teacherData.staff_id);

    fetch(`/update-teacher/${encodedStaffId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            // If the response status is not OK (not 2xx), throw an error
            return response.text().then(text => {
                throw new Error(`Server responded with status ${response.status}: ${text}`);
            });
        }
        return response.json();  // Only parse as JSON if the response is OK
    })
    .then(data => {
        if (data.success) {
            alert('Teacher details updated successfully!');
            $('#editStaffModal').modal('hide');
            fetchStaff();
        } else {
            alert('Failed to update teacher details: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error updating teacher data:', error);
        alert('An error occurred while updating teacher details. Please try again later.');
    });
});
});
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
