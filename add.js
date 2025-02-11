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
   // Function to validate file size
function validateFileSize(fileInput) {
  const file = fileInput.files[0];
  const maxSize = 80 * 1024; // 80KB in bytes

  if (file && file.size > maxSize) {
      alert('File size exceeds the 80KB limit. Please choose a smaller file.');
      fileInput.value = ''; // Clear the input
      return false;
  }
  return true;
}

// Add event listener to the profile picture input
document.getElementById('studentPicture').addEventListener('change', function () {
  validateFileSize(this);
});

    // Function to generate the Student ID
function generateStudentID() {
    const year = new Date().getFullYear().toString().slice(-2); // last 2 digits of the year
    const randomNum = Math.floor(Math.random() * 1000) + 1; // number between 1 and 1000
    return `IHMISTD${year}${randomNum}`;
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