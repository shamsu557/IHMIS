// Handle form submission
document.getElementById("teacherSignupForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Validate the 'form_master' role and class selection before creating formData
    const role = document.getElementById('role').value;
    if (role === 'form_master') {
        const selectedClass = document.getElementById("formClass").value;
        if (!selectedClass) {
            alert("Please select a class for Form Master.");
            return; // Exit the function to prevent form submission
        }
    }

    // Create a FormData object to handle form submission
    const formData = new FormData(this);

    // Get selected subjects and append them to FormData
    const subjects = [];
    document.querySelectorAll("input[name='subjects[]']:checked").forEach(subject => {
        subjects.push(subject.value);
    });
    formData.append('subjects', subjects.join(',')); // Join subjects as comma-separated values

    // Get selected classes and append them to FormData
    const classes = [];
    document.querySelectorAll("input[name='classes[]']:checked").forEach(cls => {
        classes.push(cls.value);
    });
    formData.append('classes', classes.join(',')); // Join classes as comma-separated values


    try {
        // Send a POST request to the server with FormData
        const response = await fetch('/signup', {
            method: 'POST',
            body: formData, // Use FormData instead of JSON
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Signup successful! Your staff ID is: ${result.staffId}`);
            // Optionally redirect to another page after successful signup
            window.location.href = "/login"; // Update this as necessary
        } else {
            // Handle errors (e.g., display validation errors or server messages)
            alert(result.message || "Signup failed. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
    }
});

// Role change event listener to show/hide class selection
document.getElementById('role').addEventListener('change', function () {
    const classSelection = document.getElementById('class-selection');
    const formClassInput = document.getElementById('formClass');
    
    if (this.value === 'form_master') {
        classSelection.style.display = 'block'; // Show class selection
        formClassInput.required = true; // Make it required
    } else {
        classSelection.style.display = 'none'; // Hide class selection
        formClassInput.required = false; // Remove required
    }
});

// Back-to-top button functionality
const mybutton = document.getElementById("myBtn");

    // Show button when user scrolls down 20px from top
    window.onscroll = function() {
      scrollFunction();
    };
  
    function scrollFunction() {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
      } else {
        mybutton.style.display = "none";
      }
    }
  
    // Scroll to top when button is clicked
    $('#myBtn').on('click', function() {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    });
  