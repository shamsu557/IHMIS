const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const db = require('./mysql'); // Ensure mysql.js is configured correctly
const fs = require('fs');
const multer = require('multer'); // Add multer for file handling
const app = express();
const saltRounds = 10; // Define salt rounds for bcrypt hashing
const session = require('express-session');
const PDFDocument = require('pdfkit');
const { Table } = require('pdfkit-table');

app.use(session({
    secret: 'a45A7ZMpVby14qNkWxlSwYGaSUv1d64x', // Replace with your secret key
    resave: false,
    saveUninitialized: false,
    cookie: { 
      httpOnly: true,
      maxAge:   60 * 60 * 1000 // 1 year session expiration
    }
  }));

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS, etc.) from the root directory
app.use(express.static(path.join(__dirname)));

// Set up multer for file uploads (profile pictures)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname); // Ensure this folder exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage: storage });
// User Signup page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
//term result
app.get('/student_term_result.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'student_term_result.html'));
});
//session result
app.get('/student_session_result.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'student_session_result.html'));
});
// User Signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});


// Route to serve staff_dashboard.html
app.get('/staff_dashboard', isAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store'); // Prevent caching
    res.sendFile(path.join(__dirname, 'staff_dashboard.html')); // Adjust the path as necessary
  });
  

// API route to fetch teacher details
app.get('/api/teacher-details', isAuthenticated, (req, res) => {
    const teacherId = req.session.teacher.id;
    const query = 'SELECT * FROM teachers WHERE id = ?';

    db.query(query, [teacherId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }

        const teacher = results[0]; // Get the first (and likely only) result
        res.json(teacher);
    });
});
// Handle User Signup with profile picture
app.post('/signup', upload.single('profilePicture'), (req, res) => {
    const { name, email, password, security_question, security_answer, role, formClass, subjects, classes, qualification, gender, phone } = req.body; // Include phone in destructuring 
    const profilePicture = req.file ? req.file.filename : null; // Save the uploaded profile picture file name

    // Generate a staff ID in the format IHMISYYNN, where YY is the last two digits of the year and NN is a random number between 1 and 100
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Get last two digits of the year
    const randomNumber = Math.floor(Math.random() * 100) + 1; // Random number between 1 and 100
    const staffId = `IHMIS/STF/${yearSuffix}${randomNumber.toString().padStart(2, '0')}`; // Format staff ID

    // Check if the email exists in the teachers table
    db.query('SELECT * FROM teachers WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error querying database for email verification:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        // If the email is not found in the teachers table, prevent signup
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Email not authorized for signup.' });
        }

        // Hash the password
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }

            // Build the SQL query to update the teacher's information
            const columns = ['name', 'password', 'security_question','security_answer',  'role', 'qualification', 'profile_picture', 'staff_id', 'gender','phone']; // Add 'phone' to columns 
            const values = [name, hashedPassword,security_question, security_answer, role, qualification, profilePicture, staffId, gender, phone]; // Add 'phone' to values

            if (role === 'Form Master') {
                columns.push('formClass'); // Include formClass if role is 'Form Master'
                values.push(formClass);
            }

            // Update teacher's information in the database
            const query = `UPDATE teachers SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE email = ?`;

            db.query(query, [...values, email], (err, result) => {
                if (err) {
                    console.error('Error updating teacher in database:', err);
                    return res.status(500).json({ success: false, message: 'Server error' });
                }

                // Use the teacher's ID from the results
                const teacherId = results[0].id; // Get the ID of the existing teacher

                // Helper function to insert subjects or classes
                const insertItems = (table, itemList) => {
                    if (Array.isArray(itemList) && itemList.length > 0) {
                        const columnName = table === 'teacher_subjects' ? 'subject' : 'class'; // Correctly define column name based on the table
                        const queries = itemList.map(item => 
                            new Promise((resolve, reject) => {
                                db.query(`INSERT INTO ${table} (teacher_id, ${columnName}) VALUES (?, ?)`, [teacherId, item.trim()], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            })
                        );
                        return Promise.all(queries);
                    }
                    return Promise.resolve(); // No items to insert
                };

                // Insert subjects and classes
                Promise.all([
                    insertItems('teacher_subjects', subjects),
                    insertItems('teacher_classes', classes)
                ])
                .then(() => {
                    res.json({ success: true, message: 'Teacher registered successfully.', staffId: staffId });
                })
                .catch(err => {
                    console.error('Error inserting subjects or classes:', err);
                    res.status(500).json({ success: false, message: 'Failed to register some subjects or classes.' });
                });
            });
        });
    });
});


// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.loggedin) {
        next(); // User is authenticated, proceed to the next middleware or route handler
    } else {
        res.redirect('/login'); // Redirect to the login page if not authenticated
    }
}

// Middleware to prevent caching on all protected routes
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  
  // API endpoint to handle login (POST request)
app.post('/login', (req, res) => {
    const { emailOrStaffId, password } = req.body;

    // Determine if the identifier is email or staff_id
    const isEmail = emailOrStaffId.includes('@');
    
    const query = isEmail
      ? 'SELECT * FROM teachers WHERE email = ?'
      : 'SELECT * FROM teachers WHERE staff_id = ?';

    db.query(query, [emailOrStaffId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.' });
        }

        // Check if a user was found
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email/staff ID or password.' });
        }

        const teacher = results[0];

        // Compare passwords using bcrypt
     
        bcrypt.compare(password, teacher.password, (err, match) => {
            if (err) {
                return res.status(500).json({ message: 'Error comparing passwords.' });
            }

            if (!match) {
                return res.status(401).json({ message: 'Invalid email/staff ID or password.' });
            }

            // Successful login
            req.session.loggedin = true;
            req.session.teacher = teacher; // Store teacher details in session
            res.json({ loggedin: true });
        });
    });
});

 // API endpoint to fetch teacher session details
app.get('/session', isAuthenticated, (req, res) => {
    const teacher = req.session.teacher;
    if (teacher) {
        res.json({
            loggedin: true,
            teacher: {
                name: teacher.name,
                email: teacher.email,
                qualification: teacher.qualification,
                role: teacher.role,
                formClass: teacher.formClass,
                profile_picture: teacher.profile_picture,
            },
        });
    } else {
        res.status(403).json({ loggedin: false });
    }
  });

 // Check session status
app.get('/checkSession', (req, res) => {
    if (req.session && req.session.loggedin) {
        res.json({ loggedin: true, user: req.session.teacher }); // Optionally send user info
    } else {
        res.json({ loggedin: false });
    }
  });
 

// Forgot password endpoint
app.post('/forgot-password', (req, res) => {
    const { identifier } = req.body;
  
    const query = identifier.includes('@') 
      ? 'SELECT security_question FROM teachers WHERE email = ?' 
      : 'SELECT security_question FROM teachers WHERE staff_id = ?';
  
    db.query(query, [identifier], (err, result) => {
      if (err) {
        console.error('Error fetching security question:', err);
        return res.status(500).json({ success: false, message: 'Error processing your request. Please try again.' });
      }
  
      if (result.length > 0) {
        res.json({ success: true, securityQuestion: result[0].security_question });
      } else {
        res.json({ success: false, message: 'Identifier not found.' });
      }
    });
  });
// Verify security answer endpoint
app.post('/verify-security-answer', (req, res) => {
    const { identifier, securityAnswer } = req.body;
  
    const query = identifier.includes('@') 
      ? 'SELECT security_answer FROM teachers WHERE email = ?' 
      : 'SELECT security_answer FROM teachers WHERE staff_id = ?';
  
    db.query(query, [identifier], (err, result) => {
      if (err) {
        console.error('Error fetching security answer:', err);
        return res.status(500).json({ success: false, message: 'Error processing your request. Please try again.' });
      }
  
      if (result.length > 0 && result[0].security_answer === securityAnswer) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Incorrect answer. Please try again.' });
      }
    });
  });
    
// Reset password endpoint
app.post('/reset-password', (req, res) => {
    const { identifier, newPassword } = req.body;
  
    bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ success: false, message: 'Error processing your request. Please try again.' });
      }
  
      const query = identifier.includes('@') 
        ? 'UPDATE teachers SET password = ? WHERE email = ?' 
        : 'UPDATE teachers SET password = ? WHERE staff_id = ?';
  
      db.query(query, [hashedPassword, identifier], (err, result) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ success: false, message: 'Server error occurred. Please try again later.' });
        }
  
        if (result.affectedRows > 0) {
          res.json({ success: true, message: 'Password updated successfully!' });
        } else {
          res.json({ success: false, message: 'Failed to update password. Please try again later.' });
        }
      });
    });
  });
  


// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/login'); // Redirect back to dashboard if there's an error
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/login'); // Redirect to login
    });
  });
  

   // Endpoint to add student
app.post('/add-student', upload.single('studentPicture'), (req, res) => {
    const studentID = req.body.studentID;
    const firstname = req.body.firstname;
    const surname = req.body.surname;
    const othername = req.body.othername;
    const studentClass = req.body.class;
    const guardianPhone = req.body.guardianPhone;
    const studentPicture = req.file.filename; // File name stored in the server

    // Check for duplicate student
    const checkDuplicateQuery = 'SELECT * FROM students WHERE firstname = ? AND class = ? AND guardianPhone = ?';
    const checkValues = [firstname, studentClass, guardianPhone];

    db.query(checkDuplicateQuery, checkValues, (err, results) => {
        if (err) {
            console.error('Error checking for duplicate student:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // If a student already exists with the same firstname, class, and guardianPhone
        if (results.length > 0) {
            return res.status(409).json({ success: false, message: 'Student already exists' });
        }

        // Insert student data into students table
        const insertStudentQuery = 'INSERT INTO students (studentID, firstname, surname, othername, class, guardianPhone, studentPicture) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const studentValues = [studentID, firstname, surname, othername, studentClass, guardianPhone, studentPicture];

        db.query(insertStudentQuery, studentValues, (err, result) => {
            if (err) {
                console.error('Error inserting student:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            // Now handle subjects
            const subjects = JSON.parse(req.body.subjects);
            const subjectInsertQuery = 'INSERT INTO subjects (studentID, subjectName) VALUES (?, ?)';

            const subjectPromises = subjects.map(subjectName => {
                return new Promise((resolve, reject) => {
                    db.query(subjectInsertQuery, [studentID, subjectName], (err, result) => {
                        if (err) {
                            console.error('Error inserting subject:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });

            // Wait for all subject insertions to complete
            Promise.all(subjectPromises)
                .then(() => {
                    res.json({ success: true, message: 'Student added successfully' });
                })
                .catch(err => {
                    res.status(500).json({ success: false, message: 'Error inserting subjects' });
                });
        });
    });
});


// Endpoint to get classes
app.get('/api/getClasses', (req, res) => {
    const query = 'SELECT DISTINCT class FROM students'; // Replace with your actual table name
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching classes:', err);
            return res.status(500).send('Server Error');
        }
        const classes = results.map(row => row.class);
        res.json(classes);
    });
});

// Endpoint to get students by class
app.post('/api/getStudents', (req, res) => {
    const { class: className } = req.body;
    const query = 'SELECT * FROM students WHERE class = ?'; // Replace with your actual table name
    db.query(query, [className], (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).send('Server Error');
        }
        res.json(results);
    });
});

// DELETE student endpoint
app.delete('/api/deleteStudent/:studentID', (req, res) => {
    const studentID = req.params.studentID;
    const { username, password } = req.body;

    // Query the admins table to verify username and password
    const checkAdminQuery = `
        SELECT * FROM admins
        WHERE username = ?
    `;

    db.query(checkAdminQuery, [username], (err, adminResults) => {
        if (err) {
            console.error('Error verifying admin:', err);
            return res.status(500).json({ message: 'Error verifying admin credentials' });
        }

        if (adminResults.length === 0) {
            return res.status(403).json({ message: 'Unauthorized: Incorrect username or password' });
        }

        const admin = adminResults[0];

        // Ensure admin password exists and appears hashed
        if (!admin.password || !admin.password.startsWith('$2')) {
            return res.status(500).json({ message: 'Error: Invalid password format in the database' });
        }

        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ message: 'Error verifying password' });
            }

            // If passwords do not match, return a 403 status with a message
            if (!isMatch) {
                return res.status(403).json({ message: 'Unauthorized: Incorrect password' });
            }

            // Proceed to delete the student
            db.query('DELETE FROM students WHERE studentID = ?', [studentID], (err, result) => {
                if (err) {
                    console.error('Error deleting student:', err);
                    return res.status(500).json({ message: 'Error deleting student' });
                }

                // If no rows were affected, the student was not found
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Student not found' });
                }

                res.json({ message: 'Student deleted successfully' });
            });
        });
    });
});
//edit student
app.post('/api/editStudent', upload.single('picture'), (req, res) => {
    const {
        id, firstname, othername, surname, guardianPhone, studentClass,
        subjects, staffEmailOrID, password
    } = req.body;

    const studentPicture = req.file ? req.file.filename : null;

    // Start with a base query
    let updateStudentQuery = `UPDATE students SET `;
    let queryValues = [];

    // Conditionally add fields to the query
    if (firstname) {
        updateStudentQuery += `firstname = ?, `;
        queryValues.push(firstname);
    }
    if (othername) {
        updateStudentQuery += `othername = ?, `;
        queryValues.push(othername);
    }
    if (surname) {
        updateStudentQuery += `surname = ?, `;
        queryValues.push(surname);
    }
    if (guardianPhone) {
        updateStudentQuery += `guardianPhone = ?, `;
        queryValues.push(guardianPhone);
    }
    if (studentClass) {
        updateStudentQuery += `class = ?, `;
        queryValues.push(studentClass);
    }
    if (studentPicture) {
        updateStudentQuery += `studentPicture = ?, `;
        queryValues.push(studentPicture);
    }

    // Trim the trailing comma and space from the query
    updateStudentQuery = updateStudentQuery.slice(0, -2);

    // Add the WHERE clause to update the specific student
    updateStudentQuery += ` WHERE studentID = ?`;
    queryValues.push(id);

    const checkAdminQuery = `
        SELECT * FROM admins
        WHERE (username = ? OR email = ?)
    `;

    db.query(checkAdminQuery, [staffEmailOrID, staffEmailOrID], (err, adminResults) => {
        if (err) {
            console.error('Error verifying admin:', err);
            return res.status(500).json({ message: 'Error verifying admin credentials' });
        }

        if (adminResults.length === 0) {
            return res.status(403).json({ message: 'Unauthorized: Incorrect username or email' });
        }

        const admin = adminResults[0];

        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ message: 'Error verifying password' });
            }

            if (!isMatch) {
                return res.status(403).json({ message: 'Unauthorized: Incorrect password' });
            }

            // Proceed to update the student if credentials are correct
            db.query(updateStudentQuery, queryValues, (err) => {
                if (err) {
                    console.error('Error updating student in database:', err);
                    return res.status(500).json({ message: 'Error updating student.' });
                }

                // If subjects are provided, update them
                if (subjects) {
                    const subjectsArray = subjects.split(',').map(subj => subj.trim());

                    // Delete existing subjects for the student
                    db.query('DELETE FROM subjects WHERE studentID = ?', [id], (err) => {
                        if (err) {
                            console.error('Error clearing subjects from database:', err);
                            return res.status(500).json({ message: 'Error updating subjects.' });
                        }

                        // Insert new subjects for the student
                        const insertSubjectQuery = 'INSERT INTO subjects (studentID, subjectName) VALUES (?, ?)';
                        const insertPromises = subjectsArray.map(subject => new Promise((resolve, reject) => {
                            db.query(insertSubjectQuery, [id, subject], (err) => {
                                if (err) {
                                    console.error(`Error inserting subject "${subject}" for studentID ${id}:`, err);
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        }));

                        // Wait for all insertions to complete
                        Promise.all(insertPromises)
                            .then(() => {
                                res.status(200).json({ message: 'Student updated successfully with new subjects.' });
                            })
                            .catch(err => {
                                console.error('Error updating subjects:', err);
                                res.status(500).json({ message: 'Error updating subjects.' });
                            });
                    });
                } else {
                    // If no subjects were provided, just update the student without modifying subjects
                    res.status(200).json({ message: 'Student updated successfully, no subjects changed.' });
                }
            });
        });
    });
});


// Route teacher for login for result
app.post('/result_login', (req, res) => {
    const { staffIdentifier, password } = req.body;

    // Query to find teacher by staff_id or email
    const query = `
        SELECT t.id, t.password 
        FROM teachers t
        WHERE t.staff_id = ? OR t.email = ?
    `;
    
    db.query(query, [staffIdentifier, staffIdentifier], (err, results) => {
        if (err) {
            console.error("Database error on login:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        const teacher = results[0];

        // Compare password with bcrypt
        bcrypt.compare(password, teacher.password, (err, isMatch) => {
            if (err) {
                console.error("Error comparing password:", err);
                return res.status(500).json({ success: false, message: 'Error verifying password' });
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid password' });
            }

            // Password is correct, store teacher ID in session
            req.session.teacherId = teacher.id; // Store the teacher ID

            // Fetch the teacher's classes
            const classQuery = `SELECT class FROM teacher_classes WHERE teacher_id = ?`;
            db.query(classQuery, [teacher.id], (err, classResults) => {
                if (err) {
                    console.error("Error fetching classes:", err);
                    return res.status(500).json({ success: false, message: 'Error fetching classes' });
                }

                // Send classes along with teacher ID
                const classes = classResults.map(cls => cls.class); // Use 'class' instead of 'class_name'
                return res.json({ success: true, teacherId: teacher.id, classes }); // Send classes back
            });
        });
    });
});

       
   
// Get Classes for a specific teacher
app.get('/getTeacherClasses', (req, res) => {
    const teacherId = req.session.teacherId; // Get teacher ID from session
    console.log("Fetching classes for teacher ID:", teacherId); // Log teacherId
    db.query('SELECT * FROM teacher_classes WHERE teacher_id = ?', [teacherId], (error, results) => {
        if (error) return res.status(500).json({ success: false, message: error.message });
        console.log('Classes:', results); // Log results
        res.json(results);
    });
});

// Get Subjects for a specific teacher
app.get('/getTeacherSubjects', (req, res) => {
    const teacherId = req.session.teacherId; // Get teacher ID from session
    console.log("Fetching subjects for teacher ID:", teacherId); // Log teacherId
    db.query('SELECT * FROM teacher_subjects WHERE teacher_id = ?', [teacherId], (error, results) => {
        if (error) return res.status(500).json({ success: false, message: error.message });
        console.log('Subjects:', results); // Log results
        res.json(results);
    });
});   
// Backend endpoint to get students by class
app.post('/api/getStudentsByClass', (req, res) => {
     const { class: className } = req.body;
    const query = 'SELECT * FROM students WHERE class = ?'; // Replace with your actual table name
    db.query(query, [className], (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).send('Server Error');
        }
        res.json(results);
    });
});

// Endpoint to submit scores
app.post('/api/submitScores', (req, res) => {
    const scores = req.body.scores; // Expecting an array of score objects

    // Ensure scores is an array
    if (!Array.isArray(scores)) {
        return res.status(400).json({ error: 'Scores must be an array' });
    }

    // SQL query to update scores
    const sql = `UPDATE subjects 
                 SET term = ?, session = ?, firstCA = ?, secondCA = ?, thirdCA = ?, exams = ?, total = ?, examGrade = ? 
                 WHERE studentID = ? AND subjectName = ?`;

    // Prepare to collect promises for each update
    const updatePromises = scores.map(score => {
        // Validate scores
        if (
            score.firstCA > 10 || score.secondCA > 10 || score.thirdCA > 10 ||
            score.exams > 70
        ) {
            return Promise.reject(`Invalid score detected for student ID: ${score.studentID}`);
        }

        const values = [
            score.term,
            score.session,
            score.firstCA,
            score.secondCA,
            score.thirdCA,
            score.exams,
            score.total,
            score.examGrade,
            score.studentID,
            score.subjectName
        ];

        return new Promise((resolve, reject) => {
            db.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return reject('Database error');
                }
                resolve(results);
            });
        });
    });

    // Execute all updates
    Promise.all(updatePromises)
        .then(results => {
            res.status(200).json({ message: 'Scores updated successfully!', results });
        })
        .catch(error => {
            console.error('Error updating scores:', error);
            res.status(500).json({ error });
        });
});


//to create admin for the first time as it will be used to login to admin dashboard visit /creation. then create the admin in the dashboard then other admin are created.
// Admin Signup page 
app.get('/creation', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-signup.html'));
});
  
// Handle admin signup
app.post('/creation', (req, res) => {
    const { username, password, email, fullName, phone, role } = req.body;

    // Check if the email exists and ensure the phone field is empty
db.query('SELECT email, phone FROM admins WHERE email = ?', [email], (err, results) => {
    if (err) {
        console.error('Error querying database for signup:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Check if email exists
db.query('SELECT * FROM teachers WHERE email = ?', [email], (err, results) => {
    if (err) {
        console.error('Error querying database for signup:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Ensure the email exists in the database
    if (results.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Email not authorized for registration.'
        });
    }

    // Check if the phone number already exists in the database
    const checkPhoneQuery = 'SELECT * FROM teachers WHERE phone = ?';
    db.query(checkPhoneQuery, [phone], (err, phoneResults) => {
        if (err) {
            console.error('Error checking phone number in database:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        // If phone number already exists in the database, prevent signup
        if (phoneResults.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This phone number is already registered.'
            });
        }
    });
});

   
        // Hash the password
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }

            // Insert new admin into the database
            db.query('INSERT INTO admins (username, password, email, fullName, phone, role) VALUES (?, ?, ?, ?, ?, ?)', 
                [username, hashedPassword, email, fullName, phone, role], (err) => {
                    if (err) {
                        console.error('Error inserting admin into database:', err);
                        return res.status(500).json({ success: false, message: 'Server error' });
                    }
                    res.json({ success: true, message: 'Admin created successfully! They can now access the dashboard.' });
                }
            );
        });
    });
});
app.get('/Student_dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/StudentLogin');
    }
    res.sendFile(path.join(__dirname, 'student_dashbaord.html'));
});
app.get('/studentLogin', (req,res)=>{
    res.sendFile(path.join(__dirname, 'studentLogin.html'));
})
// Handle student login
app.post("/studentLogin", (req, res) => {
    const { studentID, password } = req.body;

    if (!studentID || !password) {
        return res.status(400).send('Both studentID and password are required.');
    }

    db.query('SELECT * FROM students WHERE studentID = ?', [studentID], (err, results) => {
        if (err) {
            console.error('Error querying database for student login:', err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(400).send('No student found');
        }

        const student = results[0];

        // Assuming the password is the studentID (this may need to be changed)
        if (student.studentID === password) { 
            req.session.studentID = student.studentID;  // Store the studentID in the session

            // Send a response with a message and redirect URL
            return res.status(200).json({
                redirect: "/student_dashboard.html"  // Redirect URL
            });
        } else {
            return res.status(400).send('Incorrect password');
        }
    });
});
// Populate student details on login
app.get('/populateStudentDetails', (req, res) => {
    const studentID = req.session.studentID; // Retrieve studentID from the session

    if (!studentID) {
        return res.status(400).json({ success: false, message: "Student ID is not available. Please log in again." });
    }

    // Query the database to fetch student details
    db.query('SELECT * FROM students WHERE studentID = ?', [studentID], (err, results) => {
        if (err) {
            console.error('Error querying database for student details:', err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const student = results[0];

        // Send the student details as a response
        return res.json({
            success: true,
            firstname: student.firstname,
            surname: student.surname,
            othername: student.othername || '', // Include othername if available
            studentID: student.studentID,
            class: student.class,
            guardianPhone: student.guardianPhone,
            studentPicture: student.studentPicture || 'Profile-Black.png' // Default if no picture
        });
    });
});
//loggedIn students
app.get('/getLoggedInStudent', (req, res) => {
    if (req.session.studentID) {
        // Return the logged-in student's ID
        return res.json({ success: true, studentID: req.session.studentID });
    } else {
        // No student is logged in
        return res.json({ success: false, message: "No student logged in" });
    }
});

app.post('/find-details', (req, res) => {
    const { firstname, surname, othername, class: studentClass } = req.body;
  
    // Convert inputs to uppercase (optional if already handled in frontend)
    const upperFirstName = firstname.trim().toUpperCase();
    const upperSurname = surname.trim().toUpperCase();
    const upperOtherName = othername ? othername.trim().toUpperCase() : '';
  
    // SQL Query to check if the names existconst
    let query = `
      SELECT studentID 
      FROM students 
      WHERE firstname = ? 
        AND surname = ? 
        AND (othername = ? OR othername IS NULL) 
        AND class = ?
    `;
  
    db.query(
      query,
      [upperFirstName, upperSurname, upperOtherName, studentClass],
      (err, results) => {
        if (err) {
          console.error('Database Error:', err);
          return res.status(500).send('Internal Server Error');
        }
  
        if (results.length > 0) {
          // If a match is found, display the studentID as username and password
          const studentID = results[0].studentID;
          res.send(`
            <style>
              a {
                text-decoration: none; /* Remove underline */
              }
              .btn {
                padding: 10px 15px;
                border-radius: 5px;
                display: inline-block;
                color: white;
              }
              .btn-primary {
                background-color: #007bff;
                border: none;
              }
              .btn-success {
                background-color: #28a745;
                border: none;
              }
            </style>
            <h3>Login Details Found</h3>
            <p><strong>Username:</strong> ${studentID}</p>
            <p><strong>Password:</strong> ${studentID}</p>
            <a href="/studentLogin" class="btn btn-primary">Go to Login</a>
          `);
        } else {
          // If no match is found
          res.send(`
            <style>
              a {
                text-decoration: none; /* Remove underline */
              }
              .btn {
                padding: 10px 15px;
                border-radius: 5px;
                display: inline-block;
                color: white;
              }
              .btn-primary {
                background-color: #007bff;
                border: none;
              }
              .btn-success {
                background-color: #28a745;
                border: none;
              }
            </style>
            <h3>No Matching Records Found</h3>
            <p>Please check your details and try again.</p>
            <a href="/studentLogin" class="btn btn-success">Back</a>
          `);
        }
      }
    );
  });
  
  
app.post('/studentLogout', (req, res) => {
    // Destroy the session for the student
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Logout failed');
        }
        res.status(200).send('Student logged out successfully');
    });
});


// Admin login page
app.get('/adminLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
  });
  // Handle admin login
  app.post('/adminLogin', (req, res) => {
    const { username, password } = req.body;
  
    db.query('SELECT * FROM admins WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error querying database for admin login:', err);
            return res.status(500).send('Server error');
        }
  
        if (results.length === 0) {
            return res.status(400).send('No admin found');
        }
  
        const user = results[0];
        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
            res.redirect('/admin-dashboard.html'); // Redirect to the admin dashboard
        } else {
            res.status(400).send('Incorrect password');
        }
    });
  });
  
  // admin Logout route
app.get('/adminLogout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/admin-login.html');
    });
  });
  
   // staff Logout route
app.get('/staffLogout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/login.html');
    });
  });
  
  // Single auth-check route for both admin-dashboard.html and resources.html
app.get('/auth-check', (req, res) => {
    if (req.session.user) {
      // Include userType to differentiate between admin and regular users
      res.json({ authenticated: true, userType: req.session.userType });
    } else {
      res.json({ authenticated: false });
    }
  });
  
// Staff Management Validate Admin Credentials
app.post('/api/validate-admin', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM admins WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) {
            return res.json({ isValid: false });
        }
        const admin = results[0];
        const isPasswordValid = bcrypt.compareSync(password, admin.password); // Assuming passwords are hashed
        if (isPasswordValid) {
            const role = admin.role;
            // Only allow access if the role is Super Admin or Assistant Super Admin
            if (role === 'Super Admin' || role === 'Assistant Super Admin') {
                return res.json({ isValid: true, role });
            } else {
                return res.json({ isValid: false });
            }
        }
        return res.json({ isValid: false });
    });
});

// Fetch Staff List
app.get('/api/staff', (req, res) => {
    db.query('SELECT * FROM teachers', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Fetch Admin List
app.get('/api/admins', (req, res) => {
    db.query('SELECT * FROM admins', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Delete Staff
app.delete('/api/delete-staff/:id', (req, res) => {
    const staffId = req.params.id;
    db.query('DELETE FROM teachers WHERE id = ?', [staffId], (err, results) => {
        if (err) {
            console.error(err); // Log the error for debugging
            return res.status(500).json({ success: false, message: 'An error occurred while trying to delete the staff member.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        res.json({ success: true, message: 'Staff deleted successfully' });
    });
});


// Delete Admin
app.delete('/api/delete-admin/:id', (req, res) => {
    const adminId = req.params.id;
    db.query('SELECT role FROM admins WHERE id = ?', [adminId], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        const admin = results[0];
        if (admin.role === 'Super Admin') {
            return res.status(403).json({ message: 'Super Admin cannot be deleted' });
        }
        db.query('DELETE FROM admins WHERE id = ?', [adminId], (err) => {
            if (err) return res.status(500).send(err);
            res.json({ success: true, message: 'Admin deleted successfully' });
        });
    });
});
// Fetch teacher details by id
app.get('/teacher/:id', (req, res) => {
    const teacherId = req.params.id;
    const query = 'SELECT staff_id, name, email, phone FROM teachers WHERE id = ?';
    
    // Use db.query() instead of db.execute()
    db.query(query, [teacherId], (err, results) => {
        if (err) {
            console.error('Error fetching teacher data:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch teacher data.' });
        }

        if (results.length > 0) {
            res.json({ success: true, teacher: results[0] });
        } else {
            res.status(404).json({ success: false, message: 'Teacher not found.' });
        }
    });
});
//edit staff
// Edit staff with separate handling for subjects and classes
app.post('/update-teacher/:staff_id', upload.single('profilePicture'), (req, res) => {
    const staffId = req.params.staff_id;
    const teacherData = JSON.parse(req.body.teacherData);
    const { name, email, phone, role, qualification, formClass, subjects, classes } = teacherData;
    const profilePicture = req.file ? req.file.filename : null;

    // Prepare the update columns and values
    let updateColumns = [];
    let updateValues = [];

    if (name) updateColumns.push('name'), updateValues.push(name);
    if (email) updateColumns.push('email'), updateValues.push(email);
    if (phone) updateColumns.push('phone'), updateValues.push(phone);
    if (role) updateColumns.push('role'), updateValues.push(role);
    if (qualification) updateColumns.push('qualification'), updateValues.push(qualification);
    if (formClass) updateColumns.push('formClass'), updateValues.push(formClass);
    if (profilePicture) updateColumns.push('profile_picture'), updateValues.push(profilePicture);

    // Add staff ID for WHERE clause
    const query = `UPDATE teachers SET ${updateColumns.map(col => `${col} = ?`).join(', ')} WHERE staff_id = ?`;
    updateValues.push(staffId);

    db.query(query, updateValues, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to update teacher data.' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Teacher not found or no changes made.' });

        db.query('SELECT id FROM teachers WHERE staff_id = ?', [staffId], (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: 'Failed to retrieve teacher ID.' });
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found.' });

            const teacherId = rows[0].id;

            // Separate handling for updating subjects
            const updateSubjects = () => {
                return new Promise((resolve, reject) => {
                    if (!subjects) return resolve(); // No subjects to update

                    db.query('DELETE FROM teacher_subjects WHERE teacher_id = ?', [teacherId], (err) => {
                        if (err) return reject(err);

                        const subjectQueries = subjects.map(subject => {
                            return new Promise((subResolve, subReject) => {
                                db.query('INSERT INTO teacher_subjects (teacher_id, subject) VALUES (?, ?)', [teacherId, subject], (err) => {
                                    if (err) subReject(err);
                                    else subResolve();
                                });
                            });
                        });

                        Promise.all(subjectQueries)
                            .then(() => resolve())
                            .catch(reject);
                    });
                });
            };

            // Separate handling for updating classes
            const updateClasses = () => {
                return new Promise((resolve, reject) => {
                    if (!classes) return resolve(); // No classes to update

                    db.query('DELETE FROM teacher_classes WHERE teacher_id = ?', [teacherId], (err) => {
                        if (err) return reject(err);

                        const classQueries = classes.map(classItem => {
                            return new Promise((classResolve, classReject) => {
                                db.query('INSERT INTO teacher_classes (teacher_id, class) VALUES (?, ?)', [teacherId, classItem], (err) => {
                                    if (err) classReject(err);
                                    else classResolve();
                                });
                            });
                        });

                        Promise.all(classQueries)
                            .then(() => resolve())
                            .catch(reject);
                    });
                });
            };

            // Execute both update functions independently
            Promise.all([updateSubjects(), updateClasses()])
                .then(() => res.json({ success: true, message: 'Teacher data updated successfully.' }))
                .catch(err => res.status(500).json({ success: false, message: 'Failed to update subjects or classes.' }));
        });
    });
});

// Endpoint to fetch student details by StudentID
app.post('/api/fetchStudentByID', (req, res) => {
    const { studentID } = req.body;

    // Check if studentID is provided
    if (!studentID) {
        return res.status(400).json({ error: "Student ID is required." });
    }

    const query = 'SELECT * FROM students WHERE StudentID = ?'; // Replace with your actual table name
    db.query(query, [studentID], (err, results) => {
        if (err) {
            console.error('Error fetching student details:', err);
            return res.status(500).send('Server Error');
        }

        // Check if results contain a student
        if (results.length > 0) {
            const student = results[0];
            res.json({ student });
        } else {
            res.json({ student: null }); // No student found
        }
    });
});

// for view students page
// Endpoint to get students by class
app.post('/api/fetchStudents', (req, res) => {
    const { class: className } = req.body;
    const query = 'SELECT * FROM students WHERE class = ?'; // Replace with your actual table name
    db.query(query, [className], (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).send('Server Error');
        }
        res.json(results);
    });
});

// Endpoint to get classes
app.get('/api/fetchClasses', (req, res) => {
    const query = 'SELECT DISTINCT class FROM students'; // Replace with your actual table name
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching classes:', err);
            return res.status(500).send('Server Error');
        }
        const classes = results.map(row => row.class);
        res.json(classes);
    });
});

// Form Master Login Route
app.post('/form-master-login', (req, res) => {
    const { identifier, password } = req.body;
    const query = `SELECT * FROM teachers WHERE (email = ? OR staff_id = ?) AND role = 'Form Master'`;

    db.query(query, [identifier, identifier], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send("Internal server error");
        }
        if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

        const formMaster = results[0];
        const isPasswordMatch = await bcrypt.compare(password, formMaster.password);

        if (!isPasswordMatch) return res.status(401).json({ message: "Invalid password" });

        // Login successful - fetch students in the form master's assigned class
        const formClass = formMaster.formClass;
        const staffId = formMaster.staff_id; // Include the staff_id in the response
        const studentsQuery = `SELECT * FROM students WHERE class = ?`;

        db.query(studentsQuery, [formClass], (err, students) => {
            if (err) {
                console.error('Error fetching students:', err);
                return res.status(500).json({ message: "Error fetching students" });
            }

            res.json({
                message: "Login successful",
                formClass: formClass, // Ensure the frontend receives the assigned class
                staffId: staffId,
                students: students // List of students in the form master's assigned class
            });
        });
    });
});


app.post('/form-master/submit-assessment', (req, res) => {
    const { term, session, assessments } = req.body;

    const assessmentQueries = assessments.map(({ studentID, academicResponsibility, respectAndDiscipline, punctuality, socialDevelopment, attendance }) => {
        return new Promise((resolve, reject) => {
            // Insert or update the assessment including the attendance field
            const insertQuery = `
                INSERT INTO form_master_assessments (studentID, term, session, academic_responsibility, respect_and_discipline, punctuality_and_personal_organization, social_and_physical_development, attendance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    academic_responsibility = VALUES(academic_responsibility),
                    respect_and_discipline = VALUES(respect_and_discipline),
                    punctuality_and_personal_organization = VALUES(punctuality_and_personal_organization),
                    social_and_physical_development = VALUES(social_and_physical_development),
                    attendance = VALUES(attendance)
            `;

            db.query(insertQuery, [
                studentID, term, session, academicResponsibility, respectAndDiscipline, punctuality, socialDevelopment, attendance
            ], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    });

    Promise.all(assessmentQueries)
        .then(() => res.status(200).json({ message: 'Assessment data saved successfully' }))
        .catch(error => {
            console.error('Error saving assessments:', error);
            res.status(500).json({ message: 'Failed to save assessment data' });
        });
});

// School Information
const schoolInfo = {
    name: 'IMAM HAFSIN MODEL INTERNATIONAL SCHOOL',
    logoPath: 'logo.jpg', // Update with the actual path to the school logo
    address: '622, Yakasai Street, Tal\'udu G/Kaya',
    email: 'imamhafsin@gmail.com',
    phone: '08030999939939399'
};

// Helper function for grades and comments
function getGradeAndComment(score) {
    if (score >= 70) return { grade: 'A', comment: 'Excellent' };
    if (score >= 60) return { grade: 'B', comment: 'Very Good' };
    if (score >= 50) return { grade: 'C', comment: 'Good' };
    if (score >= 40) return { grade: 'D', comment: 'Pass' };
    return { grade: 'F', comment: 'Fail' };
}
// Helper function for Conduct and Development grading scale
function getConductGrade(score) {
    if (score === 4) return 'Exemplary';
    if (score === 3) return 'Above Average';
    if (score === 2) return 'Average';
    if (score === 1) return 'Below Average';
    return 'No Assessment';
}

// Generate student report function
function generateStudentReport(req, res, saveToFile = false) {
    const { studentID } = req.params;
    const { term, session } = req.query;

    db.query('SELECT * FROM students WHERE studentID = ?', [studentID], (err, studentResult) => {
        if (err) return res.status(500).json({ error: 'Database error fetching student', details: err });
        if (studentResult.length === 0) return res.status(404).json({ error: 'Student not found' });

        const studentClass = studentResult[0].class;

        db.query('SELECT COUNT(*) as count FROM students WHERE class = ?', [studentClass], (err, studentCountResult) => {
            if (err) return res.status(500).json({ error: 'Database error fetching student count', details: err });

            const totalStudents = studentCountResult[0].count;

            db.query(`
                SELECT subjectName, firstCA, secondCA, thirdCA, exams, total, examGrade
                FROM subjects
                WHERE studentID = ? AND term = ? AND session = ?`, [studentID, term, session],
                (err, subjectsResult) => {
                    if (err) return res.status(500).json({ error: 'Database error fetching subjects', details: err });

                    db.query(`
                        SELECT academic_responsibility, respect_and_discipline, punctuality_and_personal_organization,
                               social_and_physical_development, attendance
                        FROM form_master_assessments
                        WHERE studentID = ? AND term = ? AND session = ?`, [studentID, term, session],
                        (err, assessmentResult) => {
                            if (err) return res.status(500).json({ error: 'Database error fetching assessment', details: err });

                            let doc = new PDFDocument({ layout: session === 'whole session' ? 'landscape' : 'portrait' });
                            const filename = `Student_Report_${studentID}.pdf`;

                            if (saveToFile) {
                                doc.pipe(fs.createWriteStream(filename));
                            } else {
                                res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
                                res.setHeader('Content-Type', 'application/pdf');
                                doc.pipe(res);
                            }

                             // School Header Section (Same as before)
                             const margin = 20;
                             const logoWidth = 80;
                             const logoHeight = 80;
                             const textStartX = logoWidth + 2 * margin;
 
                             try {
                                 doc.image(schoolInfo.logoPath, margin, margin, { width: logoWidth, height: logoHeight });
                             } catch (imageError) {
                                 console.error("Failed to load logo image:", imageError);
                                 doc.text("(Logo unavailable)", margin, margin);
                             }
 
                             doc.font('Helvetica-Bold').fontSize(16).text(schoolInfo.name, textStartX, margin, { align: 'center' });
                             doc.font('Helvetica').fontSize(12)
                                 .text(schoolInfo.address, textStartX, margin + 25, { align: 'center' })
                                 .text(schoolInfo.email, textStartX, margin + 40, { align: 'center' })
                                 .text(schoolInfo.phone, textStartX, margin + 55, { align: 'center' });
 
                             doc.font('Helvetica-Bold').fontSize(14).text(
                                 `Report Sheet for ${term} ${session} Academic Session`,
                                 margin,
                                 margin + 80,
                                 { width: doc.page.width - 2 * margin, align: 'center' }
                             );
                             doc.moveTo(margin, margin + 100).lineTo(doc.page.width - margin, margin + 100).stroke();
 
                             // Student Information Section (Same as before)
                             doc.moveDown();
                             const infoStartX = 50;
                             let infoCurrentY = doc.y;
 
                             const studentInfoRows = [
                                 { 
                                     label: "Student Name", 
                                     value: `${studentResult[0].firstname} ${studentResult[0].surname}${studentResult[0].othername ? ' ' + studentResult[0].othername : ''}` 
                                 },                                 
                                 { label: "Admission No", value: studentID },
                                 { label: "Class", value: studentClass },
                                 { label: "Term", value: term },
                                 { label: "Session", value: session },
                                 { label: "Total Students", value: totalStudents },
                                 { label: "Attendance", value: assessmentResult.length > 0 ? assessmentResult[0].attendance : "N/A" }
                             ];
 
                             studentInfoRows.forEach((row, index) => {
                                 const rowY = infoCurrentY + index * 15;
 
                                 // Set alternating background color
                                 if (index % 2 === 0) {
                                     doc.rect(infoStartX, rowY, doc.page.width - 2 * infoStartX, 15).fill('#F0F0F0');
                                 }
 
                                 // Draw text
                                 doc.fontSize(10).fillColor('black')
                                     .text(row.label, infoStartX, rowY + 4, { width: 200, align: 'left' })
                                     .text(row.value, infoStartX + 200, rowY + 4, { width: doc.page.width - 2 * infoStartX - 200, align: 'left' });
                             });
 
                             infoCurrentY += studentInfoRows.length * 15;
                              // Subject Table for terminal results
                            doc.moveDown().fontSize(8);
                            const startX = 50;
                            let currentY = doc.y + 20;
                            const cellHeight = 15;
                            const cellWidth = 50;

                            // Draw table headers with percentages (Same as before)
                            doc.moveTo(startX, currentY - 5).lineTo(startX + 500, currentY - 5).stroke();
                            doc.text('Subject', startX, currentY, { width: 100, align: 'center', bold: true });
                            doc.text('1st CA', startX + 100, currentY, { width: cellWidth, align: 'center', bold: true });
                            doc.text('2nd CA', startX + 150, currentY, { width: cellWidth, align: 'center', bold: true });
                            doc.text('3rd CA', startX + 200, currentY, { width: cellWidth, align: 'center', bold: true });
                            doc.text('Exam', startX + 250, currentY, { width: cellWidth, align: 'center', bold: true });
                            doc.text('Total', startX + 300, currentY, { width: cellWidth, align: 'center', bold: true });
                            doc.text('Grade', startX + 350, currentY, { width: cellWidth, align: 'center', bold: true });
                            doc.text('Comment', startX + 400, currentY, { width: 100, align: 'center', bold: true });

                            // Move down for percentages
                            currentY += 10;

                            // Draw percentages below each column header
                            doc.text('(10%)', startX + 100, currentY, { width: cellWidth, align: 'center' });
                            doc.text('(10%)', startX + 150, currentY, { width: cellWidth, align: 'center' });
                            doc.text('(10%)', startX + 200, currentY, { width: cellWidth, align: 'center' });
                            doc.text('(70%)', startX + 250, currentY, { width: cellWidth, align: 'center' });
                            doc.text('(100%)', startX + 300, currentY, { width: cellWidth, align: 'center' });
             
                            // Move to the first row position
                            currentY += 10;
                            doc.moveTo(startX, currentY).lineTo(startX + 500, currentY).stroke();
                            currentY += 5;

                            // Render each subject in a new row (Same as before)
                            let totalScore = 0;
                            subjectsResult.forEach((subject, index) => {
                                const rowY = currentY + index * cellHeight;

                                // Set alternating row background colors
                                if (index % 2 === 0) {
                                    doc.rect(startX, rowY, 500, cellHeight).fill('#F0F0F0');
                                }

                                const { grade, comment } = getGradeAndComment(subject.total);
                                totalScore += subject.total;

                                doc.fontSize(8).fillColor('black')
                                    .text(subject.subjectName, startX, rowY + 4, { width: 100, align: 'center' })
                                    .text(subject.firstCA, startX + 100, rowY + 4, { width: cellWidth, align: 'center' })
                                    .text(subject.secondCA, startX + 150, rowY + 4, { width: cellWidth, align: 'center' })
                                    .text(subject.thirdCA, startX + 200, rowY + 4, { width: cellWidth, align: 'center' })
                                    .text(subject.exams, startX + 250, rowY + 4, { width: cellWidth, align: 'center' })
                                    .text(subject.total, startX + 300, rowY + 4, { width: cellWidth, align: 'center' })
                                    .text(grade, startX + 350, rowY + 4, { width: cellWidth, align: 'center' })
                                    .text(comment, startX + 400, rowY + 4, { width: 100, align: 'center' });
                            });

                            currentY += subjectsResult.length * cellHeight + 5;
                            doc.moveTo(startX, currentY).lineTo(startX + 500, currentY).stroke();

                            // Add Total and Average scores
                            currentY += 10;
                            doc.fontSize(10).text(`Total Score: ${totalScore}`, startX, currentY);
                            const averageScore = totalScore / subjectsResult.length;
                            doc.text(`Average Score: ${averageScore.toFixed(2)}`, startX + 200, currentY);

                     // Conduct and Development and Grading Scale Tables
currentY += 20;
doc.fontSize(10).text('Attitude and Values Towards:', startX, currentY);
doc.fontSize(10).text('Grading Scale:', startX + 350, currentY); // Adjust for scale column start
currentY += 15;

// Table Data
const conductCategories = [
    { label: "Academic Responsibility", scoreKey: "academic_responsibility" },
    { label: "Respect & Discipline", scoreKey: "respect_and_discipline" },
    { label: "Punctuality & Organization", scoreKey: "punctuality_and_personal_organization" },
    { label: "Social & Physical Development", scoreKey: "social_and_physical_development" },
];

const gradingScale = [
    [4, 'Exemplary'],
    [3, 'Above Average'],
    [2, 'Average'],
    [1, 'Below Average']
];

// Define maximum rows for alignment
const maxRows = Math.max(conductCategories.length, gradingScale.length);

// Draw rows for both tables
for (let i = 0; i < maxRows; i++) {
    const rowY = currentY + i * 15;

    // Alternating row colors
    if (i % 2 === 0) {
        doc.rect(startX, rowY, 300, 15).fill('#F8F8F8'); // Conduct and Development background
        doc.rect(startX + 350, rowY, 300, 15).fill('#F8F8F8'); // Grading Scale background
    }

    // Conduct and Development Table
    if (i < conductCategories.length) {
        const category = conductCategories[i];
        const score = assessmentResult[0]?.[category.scoreKey];
        doc.fillColor('black')
            .fontSize(10).text(category.label, startX + 5, rowY + 2, { align: 'left' })
            .text(score, startX + 200, rowY + 2, { align: 'left' });
    }

    // Grading Scale Table
    if (i < gradingScale.length) {
        const [score, comment] = gradingScale[i];
        doc.fillColor('black')
            .fontSize(10).text(score, startX + 355, rowY + 2, { align: 'left' })
            .text(comment, startX + 400, rowY + 2, { align: 'left' });
    }
}

// Update currentY after tables
currentY += maxRows * 15 + 20;
// Add Signature Section
currentY += 40; // Add some space before the signature section

// Text indicating who is signing
doc.font('Helvetica').fontSize(12).text('Signed by:', startX, currentY);
currentY += 30;

// Line for the signature and the date on the same row
doc.moveTo(startX, currentY).lineTo(startX + 200, currentY).stroke();
doc.text('Date: _____________________', startX + 300, currentY - 10); // Adjust Y-coordinate for proper alignment

currentY += 10;

// Add the signer's designation below the line
doc.font('Helvetica-Bold').fontSize(14).text('Form Master', startX, currentY, { width: 500, align: 'left' });
currentY += 20;



                            // Finish PDF Document
                            doc.end();
                            if (saveToFile) res.download(filename);
                        });
                });
        });
    });
}
// for fetching sessions from the subjects table
app.get('/api/fetchSessions', (req, res) => {
    db.query('SELECT DISTINCT session FROM subjects ORDER BY session', (err, results) => {
        if (err) {
            console.error('Error fetching sessions:', err);
            return res.status(500).json({ error: 'Failed to fetch sessions' });
        }
        // Send back the session data
        res.json(results.map(result => result.session));
    });
});

// Generate sessional result
function generateSessionalResult(req, res, saveToFile = false) {
   // Assuming studentID and session are provided via params and query
const { studentID } = req.params;
const { session } = req.query;

if (!studentID || !session) {
    return res.status(400).json({ error: 'Missing required parameters: studentID or session' });
}

db.query('SELECT * FROM students WHERE studentID = ?', [studentID], (err, studentResult) => {
    if (err) {
        return res.status(500).json({ error: 'Database error fetching student', details: err });
    }
    if (studentResult.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
    }

    const studentClass = studentResult[0].class;

    db.query('SELECT COUNT(*) as count FROM students WHERE class = ?', [studentClass], (err, studentCountResult) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching student count', details: err });
        }

        const totalStudents = studentCountResult[0].count;

        db.query(`
            SELECT term, subjectName, SUM(firstCA) AS firstCA, SUM(secondCA) AS secondCA,
                   SUM(thirdCA) AS thirdCA, SUM(exams) AS exams, SUM(total) AS total
            FROM subjects
            WHERE studentID = ? AND session = ?
            GROUP BY term, subjectName
            ORDER BY term`, [studentID, session], (err, subjectsResult) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error fetching subjects', details: err });
                }

                db.query(`
                    SELECT academic_responsibility, respect_and_discipline, punctuality_and_personal_organization,
                           social_and_physical_development, attendance, term
                    FROM form_master_assessments
                    WHERE studentID = ? AND session = ?
                    ORDER BY term`, [studentID, session], (err, assessmentsResult) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error fetching assessments', details: err });
                        }

                        // Calculate total attendance
                        let totalAttendance = 0;
                        assessmentsResult.forEach(assessment => {
                            totalAttendance += assessment.attendance;
                        });

                         // Initialize PDF document
                         const doc = new PDFDocument({ layout: 'portrait', margin: 20 });
                         const filename = `Sessional_Report_${studentID}_${session}.pdf`;

                         // Conditionally set response headers
                         if (saveToFile) {
                             res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                         } else {
                             res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
                         }
                         res.setHeader('Content-Type', 'application/pdf');

                         // Pipe the generated PDF to the response
                         doc.pipe(res);
                       // Header Section
                       const margin = 15;
                       const logoWidth = 80;
                       const logoHeight = 80;
                       const textStartX = logoWidth + margin-20;
                       try {
                           doc.image(schoolInfo.logoPath, margin, margin, { width: logoWidth, height: logoHeight });
                       } catch (imageError) {
                           console.error("Failed to load logo image:", imageError);
                           doc.text("(Logo unavailable)", margin, margin);
                       }

                       // School Info centered
                       doc.font('Helvetica-Bold').fontSize(16).text(schoolInfo.name, textStartX, margin, {
                           align: 'center',
                           width: doc.page.width - logoWidth - 3 * margin,
                       });
                       doc.font('Helvetica').fontSize(12)
                           .text(schoolInfo.address, textStartX, margin + 30, { align: 'center' })
                           .text(schoolInfo.email, textStartX, margin + 40, { align: 'center' })
                           .text(schoolInfo.phone, textStartX, margin + 53, { align: 'center' });

                       doc.font('Helvetica-Bold').fontSize(14).text(
                           `Sessional Report Sheet for ${session} Academic Session`,
                           margin,
                           margin + 80,
                           { width: doc.page.width - 2 * margin, align: 'center' }
                       );
                       doc.moveTo(margin, margin + 100).lineTo(doc.page.width - margin, margin + 100).stroke();

                       // Calculate cumulative total and average
                       let cumulativeTotal = 0;
                       subjectsResult.forEach(subject => {
                           cumulativeTotal += subject.total;
                       });

                       const average = cumulativeTotal / subjectsResult.length;
                       const status = average >= 50 ? 'Pass' : 'Fail';

                       // Student Info Section
                       const infoStartX = 50;
                       let infoCurrentY = doc.y + 20;

                       const studentInfoRows = [
                           { 
                               label: "Student Name", 
                               value: `${studentResult[0].firstname} ${studentResult[0].surname}${studentResult[0].othername ? ' ' + studentResult[0].othername : ''}` 
                           },
                           { label: "Admission No", value: studentID },
                           { label: "Class", value: studentClass },
                           { label: "Session", value: session },
                           { label: "Total Students", value: totalStudents },
                           { label: "Total Attendance", value: totalAttendance },
                           { label: "End of The Year Average", value: average.toFixed(2) },
                           { label: "Status", value: status },
                       ];

                       studentInfoRows.forEach((row, index) => {
                           const rowY = infoCurrentY + index * 15;

                           if (index % 2 === 0) {
                               doc.rect(infoStartX, rowY, doc.page.width - 2 * infoStartX, 15).fill('#F0F0F0');
                           } else {
                               doc.rect(infoStartX, rowY, doc.page.width - 2 * infoStartX, 15).fill('#FFFFFF');
                           }

                           doc.fillColor('black')
                               .fontSize(10)
                               .text(row.label, infoStartX, rowY + 4, { width: 200, align: 'left' })
                               .text(row.value, infoStartX + 200, rowY + 4, { align: 'left' });
                       });

                       infoCurrentY += studentInfoRows.length * 15;
                       doc.moveTo(infoStartX, infoCurrentY + 10).lineTo(doc.page.width - infoStartX, infoCurrentY + 10).stroke();
                       infoCurrentY += 20;

// Subject Table for sessional results
doc.moveDown().fontSize(8);
const startX = 50;
let currentY = doc.y + 10; // Start position (reduced for heading adjustment)
const cellHeight = 15;
const headerHeight = 20;

// Column width adjustments
const termWidth = 60;
const subjectWidth = 120;
const caWidth = 50;
const examWidth = 55;
const totalWidth = 60;
const gradeWidth = 60;

// Draw table headers
doc.fontSize(9).fillColor('black')
   .text('Term', startX, currentY - 5, { width: termWidth, align: 'center' }) // Move headers slightly upwards
   .text('Subject', startX + termWidth, currentY - 5, { width: subjectWidth, align: 'center' })
   .text('1st CA', startX + termWidth + subjectWidth, currentY - 5, { width: caWidth, align: 'center' })
   .text('2nd CA', startX + termWidth + subjectWidth + caWidth, currentY - 5, { width: caWidth, align: 'center' })
   .text('3rd CA', startX + termWidth + subjectWidth + 2 * caWidth, currentY - 5, { width: caWidth, align: 'center' })
   .text('Exam', startX + termWidth + subjectWidth + 3 * caWidth, currentY - 5, { width: examWidth, align: 'center' })
   .text('Total', startX + termWidth + subjectWidth + 3 * caWidth + examWidth, currentY - 5, { width: totalWidth, align: 'center' })
   .text('Grade', startX + termWidth + subjectWidth + 3 * caWidth + examWidth + totalWidth, currentY - 5, { width: gradeWidth, align: 'center' });

// Draw percentage row
currentY += headerHeight - 5; // Move percentage row closer to headers
doc.fontSize(8)
   .text('(10%)', startX + termWidth + subjectWidth, currentY, { width: caWidth, align: 'center' })
   .text('(10%)', startX + termWidth + subjectWidth + caWidth, currentY, { width: caWidth, align: 'center' })
   .text('(10%)', startX + termWidth + subjectWidth + 2 * caWidth, currentY, { width: caWidth, align: 'center' })
   .text('(70%)', startX + termWidth + subjectWidth + 3 * caWidth, currentY, { width: examWidth, align: 'center' })
   .text('(100%)', startX + termWidth + subjectWidth + 3 * caWidth + examWidth, currentY, { width: totalWidth, align: 'center' }); // Add percentage for total column

// Line after percentage row
doc.moveTo(startX, currentY + 10).lineTo(doc.page.width - startX, currentY + 10).stroke(); // Move the line below the text

currentY += headerHeight;

// Helper function for grades
function getGrade(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

// Iterate over subjects and draw rows
subjectsResult.forEach((subject, index) => {
    const total = Number(subject.firstCA || 0) + Number(subject.secondCA || 0) + Number(subject.thirdCA || 0) + Number(subject.exams || 0);
    const grade = getGrade(total);

    const isEvenRow = index % 2 === 0;
    doc.rect(startX, currentY, termWidth + subjectWidth + 3 * caWidth + examWidth + totalWidth + gradeWidth, cellHeight)
       .fill(isEvenRow ? '#E8F6F3' : '#FFFFFF')
       .stroke();

    doc.fillColor('black')
       .text(subject.term, startX, currentY, { width: termWidth, align: 'center' })
       .text(subject.subjectName, startX + termWidth, currentY + 3, { width: subjectWidth, align: 'center' })
       .text(subject.firstCA, startX + termWidth + subjectWidth, currentY + 3, { width: caWidth, align: 'center' })
       .text(subject.secondCA, startX + termWidth + subjectWidth + caWidth, currentY + 3, { width: caWidth, align: 'center' })
       .text(subject.thirdCA, startX + termWidth + subjectWidth + 2 * caWidth, currentY + 3, { width: caWidth, align: 'center' })
       .text(subject.exams, startX + termWidth + subjectWidth + 3 * caWidth, currentY + 3, { width: examWidth, align: 'center' })
       .text(subject.total, startX + termWidth + subjectWidth + 3 * caWidth + examWidth, currentY + 3, { width: totalWidth, align: 'center' })
       .text(grade, startX + termWidth + subjectWidth + 3 * caWidth + examWidth + totalWidth, currentY + 3, { width: gradeWidth, align: 'center' });

    currentY += cellHeight;
});


                       // Add horizontal line after the table
                       doc.moveTo(startX, currentY + 4).lineTo(doc.page.width - startX, currentY + 4).stroke();

                       // Display Cumulative Total and Session Average after table
                       currentY += 10;
                       doc.text(`Cumulative Total: ${cumulativeTotal}`, startX, currentY);
                       doc.text(`Session Average: ${average.toFixed(2)}`, startX + 200, currentY);
                       // Add Signature Section
currentY += 40; // Add some space before the signature section

// Text indicating who is signing
doc.font('Helvetica').fontSize(12).text('Signed by:', startX, currentY);
currentY += 30;

// Line for the signature and the date on the same row
doc.moveTo(startX, currentY).lineTo(startX + 200, currentY).stroke();
doc.text('Date: _____________________', startX + 300, currentY - 10); // Adjust Y-coordinate for proper alignment

currentY += 10;

// Add the signer's designation below the line
doc.font('Helvetica-Bold').fontSize(14).text('Director (Western Education)', startX, currentY, { width: 500, align: 'left' });
currentY += 20;

                        
                        doc.end(); // Finish the document
                        if (saveToFile) res.download(filename);
                    });
            });
    });
});
}

// Route Definitions for downloading and viewing 
app.get('/api/viewResult/:studentID', (req, res) => generateStudentReport(req, res));
app.get('/api/downloadResult/:studentID', (req, res) => generateStudentReport(req, res, true));
// Sessional result routes
app.get('/api/sessionReport/view/:studentID', (req, res) => generateSessionalResult(req, res));
app.get('/api/sessionReport/download/:studentID', (req, res) => generateSessionalResult(req, res, true));

//NodeMailer for contact
app.post("/send-message", (req, res) => {
    const { name, email, message } = req.body;

    // Validate input fields
    if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Validate email format
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address." });
    }

    // Nodemailer transporter configuration
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "1440shamsusabo@gmail.com", // Your Gmail address
            pass: "xgxw lgas frhh ugiq", // App password
        },
    });

    // Email options
    const mailOptions = {
        from: `"${name}" <${email}>`,
        to: "1440shamsusabo@gmail.com", // Recipient email
        subject: `New Contact Form Submission from ${name}`,
        text: `You have a new message from your website contact form:
        
Name: ${name}
Email: ${email}
Message: ${message}`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ error: "Failed to send your message. Please try again later." });
        }
        console.log("Email sent: " + info.response);
        return res.status(200).json({ message: "Your message has been sent successfully!" });
    });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
