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
    // Function to generate the Student ID
function generateStudentID() {
    const year = new Date().getFullYear().toString().slice(-2); // last 2 digits of the year
    const randomNum = Math.floor(Math.random() * 1000) + 1; // number between 1 and 1000
    return `IHS${year}${randomNum}`;
}

// Handle form submission
document.getElementById('add-student-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const studentID = generateStudentID(); // Generate unique student ID

    // Get form data
    const firstname = document.getElementById('firstname').value.trim().toUpperCase(); // Trim and convert to uppercase
    const surname = document.getElementById('surname').value.trim().toUpperCase(); // Trim and convert to uppercase
    const othername = (document.getElementById('othername').value.trim() || '').toUpperCase(); // Trim and convert to uppercase if available
    const studentClass = document.getElementById('class').value;
    const gender = document.getElementById('gender').value;
    const subjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(input => input.value);
    const guardianPhone = document.getElementById('guardianPhone').value;
    const studentPicture = document.getElementById('studentPicture').files[0];

    // Create FormData object to handle file upload
    const formData = new FormData();
    formData.append('studentID', studentID);
    formData.append('firstname', firstname);
    formData.append('surname', surname);
    formData.append('othername', othername); // Even if it's optional, it will be sent as empty string if not filled
    formData.append('class', studentClass);
    formData.append('gender', gender);
    formData.append('subjects', JSON.stringify(subjects)); // Send subjects as JSON string
    formData.append('guardianPhone', guardianPhone);
    formData.append('studentPicture', studentPicture);

    // Send form data to server using Fetch API
    fetch('/add-student', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Student added successfully with ID: ${studentID}`);
        } else {
            alert(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    });
});

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
    // Close button functionality
function goBack() {
window.history.back();
}