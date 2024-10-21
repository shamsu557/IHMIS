const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./mysql'); // Ensure mysql.js is configured correctly
const fs = require('fs');
const multer = require('multer'); // Add multer for file handling
const app = express();
const saltRounds = 10; // Define salt rounds for bcrypt hashing


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
app.get('/staff_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'staff_dashboard.html'));
});

// Handle User Signup with profile picture
app.post('/signup', upload.single('profilePicture'), (req, res) => {
    const { name, email, password, role, formClass, subjects, classes, qualification, otherQualification } = req.body;
    const profilePicture = req.file ? req.file.filename : null; // Save the uploaded profile picture file name

    // Generate a random staff ID (for example, between 1000 and 9999)
    const staffId = Math.floor(Math.random() * 9000) + 1000;

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
            const columns = ['name', 'email', 'password', 'role', 'qualification', 'other_qualification', 'profile_picture', 'staff_id'];
            const values = [name, email, hashedPassword, role, qualification, otherQualification, profilePicture, staffId];

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
                    res.json({ success: true, message: 'Teacher registered successfully.' });
                })
                .catch(err => {
                    console.error('Error inserting subjects or classes:', err);
                    res.status(500).json({ success: false, message: 'Failed to register some subjects or classes.' });
                });
            });
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { emailOrStaffId, password } = req.body;

    // Check if input is email or staff_id
    const isStaffId = !isNaN(emailOrStaffId);

    const query = isStaffId
        ? 'SELECT * FROM teachers WHERE staff_id = ?'
        : 'SELECT * FROM teachers WHERE email = ?';

    db.query(query, [emailOrStaffId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email/staff ID or password.' });
        }

        const teacher = results[0];

        // Compare passwords
        bcrypt.compare(password, teacher.password, (err, match) => {
            if (err) {
                return res.status(500).json({ message: 'Error comparing passwords.' });
            }
            if (!match) {
                return res.status(401).json({ message: 'Invalid email/staff ID or password.' });
            }

            // Successful login
            res.json({ redirectTo: '/staff_dashboard' });
        });
    });
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

// Server listening on port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
