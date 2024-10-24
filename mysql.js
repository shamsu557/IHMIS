const mysql = require('mysql');

// MySQL database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',  // Use environment variable or default
    port: process.env.DB_PORT || 3306,                       // Default MySQL port or environment variable
    user: process.env.DB_USER || 'root',               // MySQL username from environment
    password: process.env.DB_PASSWORD || '@Shamsu1440',       // MySQL password from environment
    database: process.env.DB_NAME || 'school_database'            // Database name from environment
};

// Create MySQL connection
const db = mysql.createConnection(dbConfig);

// Connect to MySQL database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Export the database connection
module.exports = db;


// // -- Create students table 
// CREATE TABLE students (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     studentID VARCHAR(20) UNIQUE,  -- You can make it UNIQUE if you want
//     firstname VARCHAR(50),
//     surname VARCHAR(50),
//     othername VARCHAR(50),
//     class VARCHAR(20),
//     guardianPhone VARCHAR(15),
//     studentPicture VARCHAR(255)
//   );
  
//   -- Create subjects table
//   CREATE TABLE subjects (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     studentID VARCHAR(20),
//     subjectName VARCHAR(50),
//     term ENUM('First Term', 'Second Term', 'Third Term'),
//     ca INT,
//     exams INT,
//     grade CHAR(2),
//     FOREIGN KEY (studentID) REFERENCES students(studentID)
//   );
  
// -- Create a table for teachers
// CREATE TABLE teachers (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     staff_id varchar(50),
//     name VARCHAR(255) NOT NULL,
//     email VARCHAR(255) NOT NULL UNIQUE,
//     password VARCHAR(255) NOT NULL,
//     role VARCHAR(100) NOT NULL,
//     formClass varchar(50) NOT NULL
//     qualification ENUM('BSc', 'HND', 'NCE', 'Diploma', 'Master', 'PhD') NOT NULL,
//     profile_picture varchar(50) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// -- Create a table for teacher subjects
// CREATE TABLE teacher_subjects (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     teacher_id INT NOT NULL,
//     subject VARCHAR(255) NOT NULL,
//     FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
// );

// -- Create a table for teacher classes
// CREATE TABLE teacher_classes (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     teacher_id INT NOT NULL,
//     class VARCHAR(255) NOT NULL,
//     FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
// );
