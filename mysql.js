const mysql = require('mysql');

// MySQL database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'mysql-shamsu557.alwaysdata.net',  // Use environment variable or default
    port: process.env.DB_PORT || 3306,                       // Default MySQL port or environment variable
    user: process.env.DB_USER || 'shamsu557',               // MySQL username from environment
    password: process.env.DB_PASSWORD || '@Shamsu1440',       // MySQL password from environment
    database: process.env.DB_NAME || 'shamsu557_school_database'            // Database name from environment
};


// MySQL database connection configuration
// const dbConfig = {
//     host: process.env.DB_HOST || 'sql3.freesqldatabase.com',  // Use environment variable or default
//     port: process.env.DB_PORT || 3306,                       // Default MySQL port or environment variable
//     user: process.env.DB_USER || 'sql3749419',               // MySQL username from environment
//     password: process.env.DB_PASSWORD || 'tSZTsnx4qx',       // MySQL password from environment
//     database: process.env.DB_NAME || 'sql3749419'            // Database name from environment
// };

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


// -- Create students table 
// CREATE TABLE students (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     studentID VARCHAR(20) UNIQUE,
//     firstname VARCHAR(50),
//     surname VARCHAR(50),
//     othername VARCHAR(50),
//     class VARCHAR(20),
//     guardianPhone VARCHAR(15),
//     studentPicture VARCHAR(255)
// );

// -- Create teachers table
// // CREATE TABLE teachers (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     staff_id VARCHAR(50),
//     name VARCHAR(255) NOT NULL,
//     email VARCHAR(255) NOT NULL UNIQUE,
//     password VARCHAR(255) NOT NULL,
//     role VARCHAR(100) NOT NULL,
//     security_question VARCHAR(255),
//     security_answer VARCHAR(255),
//     phone VARCHAR(20) NULL UNIQUE, -- Phone number must be unique
//     gender ENUM('Male', 'Female') NOT NULL,
//     formClass VARCHAR(50),
//     qualification ENUM('BSc', 'HND', 'NCE', 'Diploma', 'Master', 'PhD') NOT NULL,
//     profile_picture VARCHAR(50) NOT NULL,
//     registered TINYINT(1) DEFAULT 0, -- New column for registration status (0 = unregistered, 1 = registered)
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
   
// CREATE TABLE subjects (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     studentID VARCHAR(20),
//     subjectName VARCHAR(50),
//     term ENUM('First Term', 'Second Term', 'Third Term') DEFAULT 'First Term',  -- Default to 'First Term'
//     session ENUM('2024/2025', '2025/2026', '2026/2027') NOT NULL DEFAULT '2024/2025',  -- Default to '2024/2025'
//     firstCA INT DEFAULT 0,          -- Default for First Continuous Assessment
//     secondCA INT DEFAULT 0,         -- Default for Second Continuous Assessment
//     thirdCA INT DEFAULT 0,          -- Default for Third Continuous Assessment
//     exams INT DEFAULT 0,            -- Default for Exam score
//     total INT DEFAULT 0,            -- Default for Total score
//     examGrade VARCHAR(3) DEFAULT 'N/A',  -- Default to 'N/A' if no grade is assigned
//     FOREIGN KEY (studentID) REFERENCES students(studentID) ON DELETE CASCADE
// );

// CREATE TABLE admins (
//     id INT AUTO_INCREMENT PRIMARY KEY, -- Optional: a unique identifier for each admin
//     username VARCHAR(50) , -- Username must be unique
//     password VARCHAR(255) NOT NULL, -- Password storage should allow for hashed passwords
//     email VARCHAR(100) NOT NULL UNIQUE, -- Email must be unique
//     fullName VARCHAR(100) NOT NULL, -- Full name of the admin
//     phone VARCHAR(20),  -- Phone number must be uniqu
//     role VARCHAR(50) NOT NULL;
// );
// // -- Insert email addresses with valid qualifications
// INSERT INTO teachers (staff_id, name, email, password, role, gender, formClass, qualification, profile_picture, created_at) VALUES
// ('TEMP001', 'John Doe', '1440shamsusabo@gmail.com', 'placeholderpassword1', 'Teacher', 'male','Form A', 'BSc', 'default.jpg', NOW()),
// ('TEMP002', 'Jane Smith', 'fadimatusani2021@gmail.com', 'placeholderpassword2', 'Teacher','male', 'Form B', 'HND', 'default.jpg', NOW()),
// ('TEMP003', 'Alice Johnson', 'shamsusabocom@gmail.com', 'placeholderpassword3', 'Teacher','male', 'Form C', 'Master', 'default.jpg', NOW());
// -- Create form_master_assessments table to store assessments
// // CREATE TABLE form_master_assessments (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     studentID VARCHAR(50) NOT NULL,  -- Primary identifier for the student
//     term ENUM('First Term', 'Second Term', 'Third Term') DEFAULT 'First Term',
//     session ENUM('2024/2025', '2025/2026', '2026/2027') NOT NULL DEFAULT '2024/2025',  -- Default to '2024/2025'
    
//     -- Individual scores for each category (1-5)
//     academic_responsibility TINYINT NOT NULL CHECK (academic_responsibility BETWEEN 1 AND 5),
//     respect_and_discipline TINYINT NOT NULL CHECK (respect_and_discipline BETWEEN 1 AND 5),
//     punctuality_and_personal_organization TINYINT NOT NULL CHECK (punctuality_and_personal_organization BETWEEN 1 AND 5),
//     social_and_physical_development TINYINT NOT NULL CHECK (social_and_physical_development BETWEEN 1 AND 5),
//     attendance TINYINT NOT NULL CHECK (attendance BETWEEN 0 AND 160),

//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Created timestamp
    
//     -- Ensure the combination of studentID and term is unique
//     CONSTRAINT unique_student_term UNIQUE (studentID, term),

//     -- Foreign key constraint for studentID
//     CONSTRAINT fk_student FOREIGN KEY (studentID) REFERENCES students(studentID) ON DELETE CASCADE
// );
            // CREATE TABLE sessions (
            //     id VARCHAR(128) NOT NULL PRIMARY KEY,  -- Session ID (128-character string)
            //     expires DATETIME NOT NULL,            -- Expiration date and time for the session
            //     data TEXT NOT NULL                    -- Session data stored as a JSON string
            // );
