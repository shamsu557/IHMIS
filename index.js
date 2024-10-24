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
    const { name, email, password, role, formClass, subjects, classes, qualification, otherQualification } = req.body;
    const profilePicture = req.file ? req.file.filename : null; // Save the uploaded profile picture file name

   // Generate a staff ID in the format IHMISYYNN, where YY is the last two digits of the year and NN is a random number between 1 and 100
   const currentYear = new Date().getFullYear();
   const yearSuffix = currentYear.toString().slice(-2); // Get last two digits of the year
   const randomNumber = Math.floor(Math.random() * 100) + 1; // Random number between 1 and 100
   const staffId = `IHMISS${yearSuffix}${randomNumber.toString().padStart(2, '0')}`; // Format staff ID


    // Check if the email already exists
    db.query('SELECT * FROM teachers WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error querying database for teacher signup:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Check if the email is already taken
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        // Hash the password
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }

            // Build the SQL query based on the role
            const columns = ['name', 'email', 'password', 'role', 'qualification', 'profile_picture', 'staff_id'];
            const values = [name, email, hashedPassword, role, qualification,  profilePicture, staffId];

            if (role === 'form_master') {
                columns.push('formClass');  // Include formClass if role is 'form_master'
                values.push(formClass);
            }

            // Insert the new teacher into the database
            const query = `INSERT INTO teachers (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;

            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error inserting teacher into database:', err);
                    return res.status(500).json({ success: false, message: 'Server error' });
                }

                const teacherId = result.insertId; // Get the ID of the newly inserted teacher

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
      // If the session is active, return that the user is logged in
      res.json({ loggedin: true, user: req.session.teacher }); // Optionally send user info
    } else {
      // If the session has expired or user is not logged in, return false
      res.json({ loggedin: false });
    }
  });
  
  // Middleware to check if the user is authenticated
  function isAuthenticated(req, res, next) {
    if (req.session && req.session.loggedin) {
      return next(); // User is authenticated
    } else {
      // User is not authenticated, redirect to login page
      return res.redirect('/login');
    }
  }
  
  

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

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/staff_dashboard'); // Redirect back to dashboard if there's an error
        }
        res.clearCookie('connect.sid'); // Clear the cookie
        res.redirect('/login'); // Redirect to login
    });
});

// POST route to handle Form Master/Senior Master login
app.post('/master-login', (req, res) => {
    const { staffIdOrEmail, password } = req.body;
  
    // Query to find the teacher by staff ID or email
    const sql = `SELECT * FROM teachers WHERE staff_id = ? OR email = ?`;
    
    db.query(sql, [staffIdOrEmail, staffIdOrEmail], (err, result) => {
      if (err) throw err;
  
      if (result.length > 0) {
        const teacher = result[0];
  
        // Check the role: Only form master or senior master can proceed
        if (teacher.role === 'Form Master' || teacher.role === 'Senior Master') {
          // Compare passwords
          bcrypt.compare(password, teacher.password, (err, isMatch) => {
            if (err) throw err;
  
            if (isMatch) {
              // Password matched, send success response
              res.json({ success: true });
            } else {
              // Incorrect password
              res.status(401).json({ success: false, message: 'Incorrect password' });
            }
          });
        } else {
          // User is not a form master or senior master
          res.status(403).json({ success: false, message: 'Access denied. You are not a Form Master or Senior Master.' });
        }
      } else {
        // Staff ID or email not found
        res.status(404).json({ success: false, message: 'Staff ID or email not found' });
      }
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

// Server listening on port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
