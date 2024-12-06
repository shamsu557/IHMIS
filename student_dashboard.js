document.addEventListener("DOMContentLoaded", function () {
    const studentID = "your_student_id"; // Replace with actual student ID after login

    // Function to fetch and populate student details
    function fetchStudentDetails() {
        $.ajax({
            url: '/populateStudentDetails',
            type: 'GET',
            data: { studentID: studentID }, // Pass studentID to the backend
            success: function (response) {
                if (response.success) {
                    // Construct full name with possible additional names
                    const studentName = `${response.firstname} ${response.surname} ${response.othername || ''}`;
                    
                    // Update student profile on the page
                    $('#studentName').text(studentName);
                    $('#studentID').text(response.studentID);
                    $('#class').text(response.class);
                    $('#guardianPhone').text(response.guardianPhone);
                    
                    // Display student profile picture or default if not available
                    if (response.studentPicture) {
                        $('#profile-pic').attr('src', response.studentPicture);
                    } else {
                        $('#profile-pic').attr('src', 'Profile-Black.png'); // Default picture if none available
                    }

                    // Populate modal details as well
                    $('#modalStudentName').text(studentName);
                    $('#modalStudentID').text(response.studentID);
                    $('#modalClass').text(response.class);
                    $('#modalGuardianPhone').text(response.guardianPhone);
                    if (response.studentPicture) {
                        $('#modalProfilePic').attr('src', response.studentPicture);
                    } else {
                        $('#modalProfilePic').attr('src', 'Profile-Black.png');
                    }
                } else {
                    alert('Error fetching student details: ' + response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching student details:', error);
                alert('Error fetching student details');
            }
        });
    }

    // Call fetchStudentDetails on page load
    fetchStudentDetails();

    // Event listener for logout
    const logoutLink = document.getElementById("logout");
    logoutLink.addEventListener("click", function (event) {
        event.preventDefault();
        // Perform logout actions here, such as clearing session and redirecting
        $.ajax({
            url: '/logout', // Replace with your logout endpoint
            type: 'POST',
            success: function () {
                window.location.href = "studentLogin.html"; // Redirect to login page after logout
            },
            error: function (xhr, status, error) {
                console.error('Error during logout:', error);
            }
        });
    });

    // Event listener for opening ID card modal
    const viewIDCardLink = document.getElementById("viewIDCard");
    viewIDCardLink.addEventListener("click", function (event) {
        event.preventDefault();
        $('#idCardModal').modal('show');
    });

    // Scroll to top button
    let mybutton = document.getElementById("myBtn");
    window.onscroll = function () {
        scrollFunction();
    };

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            mybutton.style.display = "block";
        } else {
            mybutton.style.display = "none";
        }
    }
});
