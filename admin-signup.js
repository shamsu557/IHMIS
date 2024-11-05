// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    // Send data to the server
    fetch('/creation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message); // Display the response message

        if (result.success) {
            this.reset(); // Reset the form if signup is successful

            if (result.redirectUrl) {
                window.location.href = result.redirectUrl; // Redirect if redirectUrl is provided
            }
        }
    })
    .catch(error => console.error('Error:', error));
});
    // Back to top button functionality
    window.onscroll = function() {scrollFunction()};
  
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
