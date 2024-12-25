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
document.addEventListener('DOMContentLoaded', () => {
// Call the backend API to get stats
fetch('/stats')
    .then(response => response.json())
    .then(data => {
        // Update the dashboard with the stats received
        document.getElementById('studentsCount').innerText = data.studentsCount;
        document.getElementById('classesCount').innerText = data.classesCount;
        document.getElementById('subjectsCount').innerText = data.subjectsCount;
        document.getElementById('teachersCount').innerText = data.teachersCount;

        // Update the counts for male and female teachers and students
        document.getElementById('maleTeachersCount').innerText = data.maleTeachersCount;
        document.getElementById('femaleTeachersCount').innerText = data.femaleTeachersCount;
        document.getElementById('maleStudentsCount').innerText = data.maleStudentsCount;
        document.getElementById('femaleStudentsCount').innerText = data.femaleStudentsCount;

        // Update the table for students per class
        const studentsPerClassTable = document.getElementById('studentsPerClass');
        data.studentsPerClass.forEach(classData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${classData.class}</td>
                <td>${classData.male_count}</td>
                <td>${classData.female_count}</td>
                <td>${classData.total_count}</td>
            `;
            studentsPerClassTable.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error fetching stats:', error);
        alert('Failed to load stats.');
    });
});
