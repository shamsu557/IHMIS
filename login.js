document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        // Get form values (identifier can be email or staff ID)
        const identifier = form.querySelector('input[name="identifier"]').value;
        const password = form.querySelector('input[name="password"]').value;

        // Prepare the data to send
        const data = {
            emailOrStaffId: identifier,  // Updated to handle either email or staff ID
            password: password
        };

        // Send a POST request to the server
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // Parse JSON response
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message); // Handle error response with specific message
                });
            }
        })
        .then(data => {
            // Handle successful login, redirect to staff_dashboard
            window.location.href = data.redirectTo || '/staff_dashboard'; // Redirect based on server response
        })
        .catch(error => {
            alert(error.message); // Display an error message
        });
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
