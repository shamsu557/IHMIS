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

  // Navigate to the correct page and hide dropdown when an item is clicked
  dropdownItems.forEach(item => {
    item.addEventListener('click', (event) => {
      const targetPage = item.getAttribute('href'); // Get the target URL
      if (targetPage) {
        dropdownMenu.classList.remove('show'); // Hide the dropdown
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
$(document).ready(function() {
 // Handle the form submission for forgot password
$('#forgotPasswordForm').on('submit', function(e) {
  e.preventDefault();
  const identifier = $('input[name="identifier"]').val(); // Handles both email and staff ID

  $.post('/forgot-password', { identifier }, function(response) {
    if (response.success) {
      // Show the security question form if identifier is valid
      $('#securityQuestionLabel').text(response.securityQuestion);  // Display the fetched security question
      $('#securityQuestionForm').show();
      $('#forgotPasswordForm').hide();
      $('#message').hide(); // Hide any previous messages
    } else {
      $('#message').text(response.message).show();
    }
  }, 'json');
});

// Handle the form submission for the security question answer
$('#securityQuestionForm').on('submit', function(e) {
  e.preventDefault();
  const identifier = $('input[name="identifier"]').val(); // Handle both email and staff ID
  const securityAnswer = $('input[name="securityAnswer"]').val().toUpperCase().trim();

  $.post('/verify-security-answer', { identifier, securityAnswer }, function(response) {
    if (response.success) {
      // Show the reset password form if the answer is correct
      $('#resetIdentifier').val(identifier);
      $('#securityQuestionForm').hide();
      $('#resetPasswordForm').show();
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
