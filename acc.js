$(document).ready(function() {
  // Handle the form submission for forgot password
  $('#forgotPasswordForm').on('submit', function(e) {
    e.preventDefault();
    const identifier = $('input[name="identifier"]').val(); // Handles both email and staff ID

    $.post('/forgot-password', { identifier }, function(response) {
      if (response.success) {
        // Show the reset password form if identifier is valid
        $('#resetIdentifier').val(identifier);
        $('#forgotPasswordForm').hide();
        $('#resetPasswordForm').show();
        $('#message').hide(); // Hide any previous messages
      } else {
        $('#message').text(response.message).show();
      }
    }, 'json');
  });

  // Handle the form submission for resetting the password
  $('#resetPasswordForm').on('submit', function(e) {
    e.preventDefault();
    const identifier = $('#resetIdentifier').val();
    const newPassword = $('input[name="newPassword"]').val();
    const confirmPassword = $('input[name="confirmPassword"]').val();

    if (newPassword !== confirmPassword) {
      $('#message').text('Passwords do not match.').show();
      return;
    }

    $.post('/reset-password', { identifier, newPassword }, function(response) {
      $('#message').text(response.message).show();
      if (response.success) {
        // Redirect to login page after 3 seconds if successful
        setTimeout(() => window.location.href = '/login', 3000);
      }
    }, 'json');
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
});
