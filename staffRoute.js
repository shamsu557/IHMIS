const db = require('./mysql');
const multer = require('multer');
const path = require('path');

module.exports = function (app) {
    // Multer storage configuration for profile pictures
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './'); // Destination folder for profile pictures
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // File naming convention
        }
    });
    const upload = multer({ storage: storage });

    // Staff sign-up route
    app.post('/signup_staff', upload.single('staffPic'), (req, res) => {
        const {
            email, firstname, lastname, surname, username,
            password, phoneNumber, highest_qualification, specialization,
            position, security_question, security_answer
        } = req.body;
        
        // Get the URL of the uploaded profile picture
        const staffPicUrl = req.file ? req.file.filename : '';

        // Convert security answer to uppercase
        const securityAnswerUpper = security_answer ? security_answer.toUpperCase() : '';

        // Generate a unique ID starting with CNAS followed by a 4-digit number
        const staffId = 'CNAS' + Math.floor(Date.now() % 10000).toString().padStart(4, '0');

        // Check if the email exists
        db.query('SELECT email FROM staff_data WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Error checking email existence.');
            }

            if (results.length > 0) {
                // Email exists, update the record
                const updateQuery = `
                    UPDATE staff_data
                    SET firstname = ?, lastname = ?, surname = ?, username = ?, password = ?, phoneNumber = ?, highest_qualification = ?, specialization = ?, position = ?, staffPic = ?, security_question = ?, security_answer = ?, staff_id = ?
                    WHERE email = ?
                `;
                const values = [firstname, lastname, surname, username, password, phoneNumber, highest_qualification, specialization, position, staffPicUrl, security_question, securityAnswerUpper, staffId, email];

                db.query(updateQuery, values, (err, result) => {
                    if (err) {
                        console.error('Database update error:', err);
                        return res.status(500).send('Error updating record.');
                    }
                    // Send a response with the staffId and prompt a redirection to slogin.html
                    res.send(`Staff record updated successfully. Your Staff ID is ${staffId}.`);
                });
            } else {
                res.status(404).send('Email address does not exist in the database.');
            }
        });
        
    });
};
