const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./mysql'); // Ensure mysql.js is configured correctly
const fs = require('fs');
const multer = require('multer'); // Add multer for file handling
const app = express();
const saltRounds = 10; // Define salt rounds for bcrypt hashing
const session = require('express-session');

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
    const { name, email, password, role, formClass, subjects, classes, qualification, phone } = req.body; // Include phone in destructuring
    const profilePicture = req.file ? req.file.filename : null; // Save the uploaded profile picture file name

    // Generate a staff ID in the format IHMISYYNN, where YY is the last two digits of the year and NN is a random number between 1 and 100
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Get last two digits of the year
    const randomNumber = Math.floor(Math.random() * 100) + 1; // Random number between 1 and 100
    const staffId = `IHMISS${yearSuffix}${randomNumber.toString().padStart(2, '0')}`; // Format staff ID

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
            const columns = ['name', 'password', 'role', 'qualification', 'profile_picture', 'staff_id', 'phone']; // Add 'phone' to columns
            const values = [name, hashedPassword, role, qualification, profilePicture, staffId, phone]; // Add 'phone' to values

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
    const { identifier } = req.body; // Updated variable name for consistency

    // Determine whether the identifier is an email or staff ID
    const query = identifier.includes('@') 
        ? 'SELECT email FROM teachers WHERE email = ?' 
        : 'SELECT staff_id FROM teachers WHERE staff_id = ?';

    db.query(query, [identifier], (err, result) => {
        if (err) {
            console.error('Error checking identifier:', err);
            return res.status(500).json({ success: false, message: 'Server error occurred. Please try again later.' });
        }

        if (result.length > 0) {
            res.json({ success: true, message: 'Identifier found. You may now reset your password.' });
        } else {
            res.json({ success: false, message: 'Email or Staff ID does not exist.' });
        }
    });
});

// Reset password endpoint
app.post('/reset-password', (req, res) => {
    const { identifier, newPassword } = req.body;

    // Hash the new password
    bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ success: false, message: 'Error processing your request. Please try again.' });
        }

        // Determine whether the identifier is an email or staff ID
        const query = identifier.includes('@') 
            ? 'UPDATE teachers SET password = ? WHERE email = ?' 
            : 'UPDATE teachers SET password = ? WHERE staff_id = ?';

        db.query(query, [hashedPassword, identifier], (err, result) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.status(500).json({ success: false, message: 'Server error occurred. Please try again later.' });
            }

            if (result.affectedRows > 0) {
                res.json({ success: true, message: 'Password updated successfully!', redirectUrl: '/login' });
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
    const { staffEmailOrID, password } = req.body;

    const checkStaffQuery = `
        SELECT * FROM teachers
        WHERE (staff_id = ? OR email = ?) AND role IN ('Senior Master', 'Form Master')
    `;

    db.query(checkStaffQuery, [staffEmailOrID, staffEmailOrID], (err, staffResults) => {
        if (err) {
            console.error('Error verifying staff:', err);
            return res.status(500).json({ message: 'Error verifying staff credentials' });
        }

        if (staffResults.length === 0) {
            return res.status(403).json({ message: 'Unauthorized: Incorrect credentials or insufficient permissions' });
        }

        const staff = staffResults[0];

        // Ensure staff password exists and appears hashed
        if (!staff.password || !staff.password.startsWith('$2')) {
            return res.status(500).json({ message: 'Error: Invalid password format in the database' });
        }

        bcrypt.compare(password, staff.password, (err, isMatch) => {
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
// Endpoint for editing a student
app.post('/api/editStudent', upload.single('picture'), (req, res) => {
    const {
        id, firstname, othername, surname, guardianPhone, class: studentClass,
        subjects, staffEmailOrID, password
    } = req.body;

    const studentPicture = req.file ? req.file.filename : null;

    const updateStudentQuery = `
        UPDATE students SET 
            firstname = ?, 
            othername = ?, 
            surname = ?, 
            guardianPhone = ?, 
            class = ?, 
            studentPicture = COALESCE(?, studentPicture)
        WHERE studentID = ?
    `;

    const checkStaffQuery = `
        SELECT * FROM teachers
        WHERE (staff_id = ? OR email = ?) AND role IN ('Senior Master', 'Form Master')
    `;

    db.query(checkStaffQuery, [staffEmailOrID, staffEmailOrID], (err, staffResults) => {
        if (err) {
            console.error('Error verifying staff:', err);
            return res.status(500).json({ message: 'Error verifying staff credentials' });
        }

        if (staffResults.length === 0) {
            return res.status(403).json({ message: 'Unauthorized: Incorrect credentials or insufficient permissions' });
        }

        const staff = staffResults[0];

        if (!staff.password || !staff.password.startsWith('$2')) {
            return res.status(500).json({ message: 'Error: Invalid password format in the database' });
        }

        bcrypt.compare(password, staff.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ message: 'Error verifying password' });
            }

            if (!isMatch) {
                return res.status(403).json({ message: 'Unauthorized: Incorrect password' });
            }

            // Proceed to update the student if credentials are correct
            db.query(updateStudentQuery, [
                firstname, othername, surname, guardianPhone, studentClass, studentPicture, id
            ], (err) => {
                if (err) {
                    console.error('Error updating student in database:', err);
                    return res.status(500).json({ message: 'Error updating student.' });
                }

                if (subjects) {
                    const subjectsArray = subjects.split(',').map(subj => subj.trim());

                    db.query('DELETE FROM subjects WHERE studentID = ?', [id], (err) => {
                        if (err) {
                            console.error('Error clearing subjects from database:', err);
                            return res.status(500).json({ message: 'Error updating subjects.' });
                        }

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

                        Promise.all(insertPromises)
                            .then(() => {
                                res.status(200).json({ message: 'Student updated successfully.' });
                            })
                            .catch(err => {
                                console.error('Error updating subjects:', err);
                                res.status(500).json({ message: 'Error updating subjects.' });
                            });
                    });
                } else {
                    res.status(200).json({ message: 'Student updated successfully, no subjects changed.' });
                }
            });
        });
    });
});

// Route teacher for login for result
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

    // Check if the email already exists
    db.query('SELECT email FROM admins WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error querying database for signup:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Check if the email is already taken
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

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
                    res.json({ success: true, message: 'Admin created successfully! They can now access the dashboard.', redirectUrl: '/adminLogin' });
                }
            );
        });
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

app.post('/update-teacher/:staff_id', async (req, res) => {
    const staffId = req.params.staff_id;  // staff_id used only to identify the teacher
    const { name, email, phone, role, qualification, formClass, subjects, classes } = req.body;

    // Prepare the update columns and values dynamically
    let updateColumns = [];
    let updateValues = [];

    if (name) {
        updateColumns.push('name = ?');
        updateValues.push(name);
    }
    if (email) {
        updateColumns.push('email = ?');
        updateValues.push(email);
    }
    if (phone) {
        updateColumns.push('phone = ?');
        updateValues.push(phone);
    }
    if (role) {
        updateColumns.push('role = ?');
        updateValues.push(role);
    }
    if (qualification) {
        updateColumns.push('qualification = ?');
        updateValues.push(qualification);
    }
    if (formClass) {
        updateColumns.push('formClass = ?');
        updateValues.push(formClass);
    }

    try {
        if (updateColumns.length > 0) {
            // Update main teacher data without modifying the staff_id
            const query = `UPDATE teachers SET ${updateColumns.join(', ')} WHERE staff_id = ?`;
            updateValues.push(staffId);

            // Perform the update query
            const result = await db.query(query, updateValues);

            // Log the result to inspect its structure
            console.log('Update query result:', result);

            // Check for affected rows
            if (result && result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Teacher not found or no changes made.' });
            }
        }

        // Update subjects if provided
        if (subjects && Array.isArray(subjects)) {
            await db.query('DELETE FROM teacher_subjects WHERE teacher_id = ?', [staffId]);

            const subjectPromises = subjects.map(subject => {
                return db.query('INSERT INTO teacher_subjects (teacher_id, subject) VALUES (?, ?)', [staffId, subject]);
            });

            await Promise.all(subjectPromises);
        }

        // Update classes if provided
        if (classes && Array.isArray(classes)) {
            await db.query('DELETE FROM teacher_classes WHERE teacher_id = ?', [staffId]);

            const classPromises = classes.map(classItem => {
                return db.query('INSERT INTO teacher_classes (teacher_id, class) VALUES (?, ?)', [staffId, classItem]);
            });

            await Promise.all(classPromises);
        }

        res.json({ success: true, message: 'Teacher data updated successfully.' });
    } catch (error) {
        console.error('Error updating teacher data:', error);
        res.status(500).json({ success: false, message: 'Failed to update teacher data.' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});