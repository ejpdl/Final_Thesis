// ANCHOR - MIDDLEWARES
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const moment = require('moment');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cloudinary = require('cloudinary').v2;


const secret = 'your_jwt_secret';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/artifacts', express.static('artifacts'));
app.use(express.urlencoded({ extended: true }));

const logger = (req, res, next) => {

    console.log(`${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl} : ${moment().format()}`);

    next();

}

app.use(logger);

const connection = mysql.createConnection({

    host: "bphyhxsrvjwso4nouapp-mysql.services.clever-cloud.com",
    user: "uiwk2nin5mxv5v5r",
    password: "SVTbzHiDtTPRfsfX4akj",
    database: "bphyhxsrvjwso4nouapp"

});

connection.connect((err) => {

    if(err){

        console.log(`Error Connecting on the database MYSQL: ${err}`);
        return;

    }else{

        console.log(`Successfully Connected to ${connection.config.database}`);

    }

});


cloudinary.config({ 
    cloud_name: 'dshfavfin', // Replace with your cloud name
    api_key: '118876977612457',       // Replace with your api key
    api_secret: 'j97tZD2G24dCr5KPcI6pM8Hca58'  // Replace with your api secret
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function for Cloudinary upload
async function uploadToCloudinary(file) {
    try {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = "data:" + file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto',
            folder: 'artifacts'
        });

        return {
            secure_url: result.secure_url, // Public URL to display the file
            public_id: result.public_id   // Unique ID to manage the file in Cloudinary
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
}

// ANCHOR - UPLOAD USER IMAGE
// const fileStorage = multer.diskStorage({

//     destination: (req, file, cb) => {

//         cb(null, './uploads');

//     },

//     filename: (req, file, cb) => {

//         cb(null, Date.now() + '--' + file.originalname);

//     }

// });

// const upload = multer({ storage: fileStorage });


// ANCHOR - UPLOAD ARTIFACTS
// const artifactsStorage = multer.diskStorage({

//     destination: (req, file, cb) => {

//         cb(null, './artifacts');

//     },

//     filename: (req, file, cb) => {

//         cb(null,  Date.now() + '--' + file.originalname);

//     }

// });

// const uploadArtifacts = multer({ storage: artifactsStorage });


// ANCHOR - JSON WEB TOKEN (FOR AUTHENTICATION AND AUTHORIZATION)
const verifyToken = async (req, res, next) => {

    try{

        const token = await req.headers['authorization'];

        if(!token){

            return res.status(403).json({ msg: `Access Denied. No token Provided` });

        }

        jwt.verify(token, secret, async (err, decoded) => {

            if(err){

                return res.status(401).json({ msg: `Invalid Token` });

            }

            req.user = await decoded;
            next();

        });

    }catch(error){

        console.log(error);

    }

};

// ANCHOR <================================ CREDENTIALS ================================>
// LOG IN API
app.post(`/credentials/login`, async (req, res) => {

    try{

        const { Student_ID, password } = req.body;

        if(!Student_ID || !password){

            return res.status(400).json({ msg: `Student ID and Password are required` });

        }

        const query = `SELECT * FROM login_credentials WHERE Student_ID = ?`;
        
        connection.query(query, [Student_ID], async (err, rows) => {

            if(err){

                return res.status(500).json({ error: `Database Error` });

            }

            if(rows.length === 0){

                return res.status(401).json({ msg: `Student ID and Password is incorrect` });

            }

            const user = rows[0];

            if(!user.Hash_Password){

                return res.status(500).json({ error: `Password is missing in the database` });

            }

            try{

                const isMatch = await bcrypt.compare(password, user.Hash_Password);

                if(!isMatch){

                    return res.status(401).json({ msg: `Student ID or Password may be incorrect` });

                }

                const token = jwt.sign({ Student_ID: user.Student_ID, Role: user.Role }, 
                    secret, { expiresIn: '1h' }

                );

                const view_if_existing = `SELECT * FROM student_user WHERE Student_ID = ?`;
                
                connection.query(view_if_existing, [Student_ID], (err, studentRows) => {

                    if(err){

                        console.error(err);
                        return res.status(500).json({ error: `Database Error while checking student_user` });

                    }

                    // If student does not exist, ADD

                    if(studentRows.length === 0){

                        const newStudent = {

                            Student_ID,
                            First_Name: user.First_Name,
                            Last_Name: user.Last_Name,
                            Grade_Level: user.Grade,
                            Section: user.Section,

                        };

                        const add_student = `INSERT INTO student_user (Student_ID, First_Name, Last_Name, Grade_Level, Section) VALUES (?, ?, ?, ?, ?)`;
                        
                        connection.query(add_student, [newStudent.Student_ID, newStudent.First_Name, newStudent.Last_Name, newStudent.Grade_Level, newStudent.Section], (err) => {

                            if(err){

                                console.error(err);
                                return res.status(500).json({ error: `Error inserting new student user` });

                            }

                        });

                    }

                    const redirectUrl = 
                    user.Role === 'teacher' ? '../Teacher_Page/teacher.html' : 
                    user.Role === 'student' ? '../Student_User_Page/student.html' : 
                    user.Role === 'admin' ? '../Admin_Page/dashboard.html' : 
                    null;

                    res.status(200).json({

                        msg: `Login Successful`,
                        token: token,
                        redirectUrl: redirectUrl

                    });

                });

            }catch(error){

                console.error(`Error during password comparison: ${error}`);
                return res.status(500).json({ msg: `Error during password comparison` });

            }

        });

    }catch(error){

        console.log(error);
        res.status(500).json({ error: `Server error during login` });

    }
    
});


// CREDENTIALS LIST (VIEW)
app.get(`/credentials/list`, verifyToken, async (req, res) => {

    try{

        const query = `SELECT * FROM login_credentials`;

        connection.query(query, (err, rows) => {

            if(err){

                res.status(400).json({ error: err.message });

            }

            res.status(200).json(rows);

        });

    }catch(error){

        console.log(error);

    }

});


// CREDENTIALS LIST (VIEW WITH SPECIFIC PARAMS (ID))
app.get(`/credentials/list/view/:LogIn_ID`, verifyToken, async (req, res) => {

    const { LogIn_ID } = req.params;

    try{

        const query = `SELECT * FROM login_credentials WHERE LogIn_ID = ?`;

        connection.query(query, [LogIn_ID], (err, rows) => {

            if(err){

                res.status(400).json({ error: err.message });

            }

            if(rows.length === 0){

                return res.status(404).json({ error: "User not found" });
                
            }

            res.status(200).json(rows[0]);

        });

    }catch(error){

        console.log(error);

    }

});

app.post('/credentials/add', verifyToken, async (req, res) => {
    const { LogIn_ID, Student_ID, Hash_Password, First_Name, Last_Name, Grade, Section, role } = req.body;
    
    if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
    }
    
    try {
        // First, check if Student_ID already exists
        const checkQuery = 'SELECT * FROM login_credentials WHERE Student_ID = ?';
        connection.query(checkQuery, [Student_ID], async (checkErr, checkResults) => {
            if (checkErr) {
                console.log(checkErr);
                return res.status(500).json({ error: checkErr.message });
            }
            
            // If Student_ID already exists, return an error
            if (checkResults.length > 0) {
                return res.status(409).json({ error: 'Student ID already registered' });
            }
            
            // If Student_ID is unique, proceed with registration
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Hash_Password, salt);
            
            const insertQuery = `INSERT INTO login_credentials 
            (LogIn_ID, Student_ID, Hash_Password, First_Name, Last_Name, Grade, Section, Role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            connection.query(insertQuery, 
                [LogIn_ID, Student_ID, hashedPassword, First_Name, Last_Name, Grade, Section, role], 
                (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ msg: `User registered as ${role}` });
                }
            );
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error during registration." });
    }
});


// CREDENTIALS UPDATE
app.put(`/credentials/update`, verifyToken,async (req, res) => {
    
    const { Student_ID, First_Name, Last_Name, Grade, Section, Role, LogIn_ID } = req.body;

    try{

        const query = `UPDATE login_credentials SET Student_ID = ?, First_Name = ?, Last_Name = ?, Grade = ?, Section = ?, Role = ? WHERE LogIn_ID = ?`;

        connection.query(query, [Student_ID, First_Name, Last_Name, Grade, Section, Role, LogIn_ID], (err, results) => {
            
            if(err){

                return res.status(500).json({ error: err.message });

            }

            if (results.affectedRows === 0) {
                
                return res.status(404).json({ error: `No record found to update.` });
            
            }

            console.log(`Successfully updated User with LogIn_ID: ${LogIn_ID}`);
            res.status(200).json({ msg: `Successfully Updated!` });

        });

    }catch(error){
        
        console.log(error)
    
    }

});


// CREDENTIALS DELETE (DELETE WITH SPECIFIC ID)
app.delete(`/credentials/delete/:Student_ID`, verifyToken, async (req, res) => {

    const { Student_ID } = req.params;

    const query = `DELETE FROM login_credentials WHERE Student_ID = ?`;

    connection.query(query, [Student_ID], (err, rows) => {

        if(err){

            return res.status(500).json({ error: err.message });

        }

        res.status(200).json({ msg: `Successfully Deleted!` });

    });

});


// ANCHOR - STUDENT PAGE API =======================================================================>

// STUDENT VIEW
app.get('/student_user/view/', verifyToken, async (req, res) => {
    try {
        const { Student_ID } = req.user;
        const query = `SELECT * FROM student_user WHERE Student_ID = ?`;
        
        connection.query(query, [Student_ID], async (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (rows.length > 0) {
                // Don't modify the URL - return the Cloudinary URL directly
                const student = rows[0];
                // Remove any URL manipulation - just return the data as is
                res.status(200).json(student);
            } else {
                res.status(404).json({ msg: `Student with ID ${Student_ID} is not found` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});




// TO VIEW LIST OF STUDENT
app.get(`/students/list`, verifyToken, async (req, res) => {

    try{

        const query = `SELECT Student_ID, First_Name, Last_Name, Grade_Level, Section FROM student_user`;

        connection.query(query, async (err, rows) => {

            if(err){

                return res.status(500).json({ error: err.message });

            }

            res.status(200).json(rows);

        })

    }catch(error){

        console.log(error);
        res.status(500).json({ msg: `Server Error` });

    }

});


// ANCHOR - TO ADD THE NEW INFORMATION OF THE NEW USER
app.post('/student_user/add', verifyToken, async (req, res) => {

    try{

        const { student_id, fname, mname, lname, bday, age, gender, phone, email, grade_level, section, about } = req.body;

        const query = `INSERT INTO student_user (Student_ID, First_Name, Middle_Name, Last_Name, Birthday, Age, Gender, Phone_Number, Email, Grade_Level, Section, About_Me) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(query, [student_id, fname, mname, lname, bday, age, gender, phone, email, grade_level, section, about, ], (err, result) => {

            if(err){

                return res.status(500).json({ error: err.message });

            }

            res.status(200).json({ msg: `Student with Name of ${fname} is successfully added` });

        });

    }catch(error){

        console.log(error);

    }

});


// SHOW AND HIDE DEMOGRAPHICS
app.post(`/student_user/privacy`, verifyToken, async (req, res) => {

    try{

        const { Student_ID } = req.user;
        const { hide_demographics } = req.body;

        const query = `UPDATE student_user SET hide_demographics = ? WHERE Student_ID = ?`;

        connection.query(query, [hide_demographics, Student_ID], (err, result) => {

            if(err){

                return res.status(500).json({ error: err.message });

            }   

            res.status(200).json({ msg: `Privacy settings updated successfully` });

        });

    }catch(error){

        console.log(error);
        res.status(500).json({ msg: "Server Error" });

    }

});


// UPDATE STUDENT USER INFORMATION
app.put(`/student_user/update`, verifyToken, upload.single('image'), async (req, res) => {
    try {
        const {
            First_Name,
            Middle_Name,
            Last_Name,
            Birthday,
            Age,
            Gender,
            Email,
            Grade_Level,
            Section,
            About_Me,
            Student_ID,
        } = req.body;

        // Validate Student_ID
        if (!Student_ID) {
            return res.status(400).json({ error: `Student ID is required for updating` });
        }

        // Prepare variables for file handling
        let profileUrl = null;
        let publicId = null;

        // Upload image if provided
        if (req.file) {
            const fileUpload = await uploadToCloudinary(req.file); // Assuming uploadToCloudinary is a utility function
            profileUrl = fileUpload.secure_url;
            publicId = fileUpload.public_id; // Capture Cloudinary public_id
        }

        // Build dynamic query
        const query = `
            UPDATE student_user 
            SET First_Name = ?, 
                Middle_Name = ?, 
                Last_Name = ?, 
                Birthday = ?, 
                \`Age\` = ?, 
                Gender = ?, 
                Email = ?, 
                Grade_Level = ?, 
                Section = ?, 
                About_Me = ?, 
                Profile_Picture = COALESCE(?, Profile_Picture),
                Cloudinary_Public_ID = COALESCE(?, Cloudinary_Public_ID)
            WHERE Student_ID = ?
        `;

        // Execute query
        connection.query(
            query,
            [
                First_Name,
                Middle_Name,
                Last_Name,
                Birthday,
                Age,
                Gender,
                Email,
                Grade_Level,
                Section,
                About_Me,
                profileUrl,  // Only update if file uploaded
                publicId,    // Only update if file uploaded
                Student_ID,
            ],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                if (results.affectedRows === 0) {
                    return res.status(404).json({ error: `No student found with the provided ID` });
                }
                res.status(200).json({
                    msg: `Successfully Updated`,
                    student: {
                        First_Name,
                        Middle_Name,
                        Last_Name,
                        Birthday,
                        Age,
                        Gender,
                        Email,
                        Grade_Level,
                        Section,
                        About_Me,
                        profileUrl, // Return updated profile image URL
                    },
                });
            }
        );
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - CLASSMATE PAGE API =================================================================>
app.get(`/classmate/view/:Student_ID`, verifyToken, async (req, res) => {

    try{

        const { Student_ID } = req.params;

        const query = `SELECT * FROM student_user WHERE Student_ID = ?`;

        connection.query(query, [Student_ID], async (err, rows) => {

            if(err){

                return res.status(500).json({ error: err.message });

            }

            if(rows.length > 0){

                const classmate = rows[0];

                if(classmate.hide_demographics){

                    delete classmate.Age;
                    delete classmate.Birthday;
                    delete classmate.Phone_Number;
                    delete classmate.Email;

                }

                res.status(200).json(classmate);

            }else{

                res.status(404).json({ msg: `Classmate with ID ${Student_ID} is not found` });

            }

        });

    }catch(error){

        console.log(error);
        res.status(500).json({ msg: `Server Error` });

    }

});


//ANCHOR - UPLOAD THE IMAGE IN THE ARTIFACTS (GENERAL) ===========================================>
app.post(`/upload/artifacts`, verifyToken, upload.single('file'), async (req, res) => {
    try {
        console.log('Starting upload process');
        console.log('Request body:', req.body);
        console.log('File:', req.file);

        const { title, subject, material_type, grade } = req.body;
        const { Student_ID } = req.user;
        let fileDetails = null;

        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            console.log('Attempting to upload to Cloudinary');
            fileDetails = await uploadToCloudinary(req.file); // Upload to Cloudinary
            console.log('Cloudinary upload successful:', fileDetails);
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
        }

        // Ensure required data is present
        if (!title || !subject || !material_type || !grade || !Student_ID) {
            console.log('Missing required data:', { title, subject, material_type, grade, studentId: Student_ID });
            return res.status(400).json({ error: 'Missing required data' });
        }

        let query;
        let params;

        // Material type logic with Cloudinary `public_id`
        switch (material_type) {
            case 'Quiz':
                query = `INSERT INTO quiz (Title, Subject, File, Cloudinary_Public_ID, Grade, Student_ID) VALUES (?, ?, ?, ?, ?, ?)`;
                break;
            case 'Performance_Task':
                query = `INSERT INTO performance_task (Title, Subject, File, Cloudinary_Public_ID, Grade, Student_ID) VALUES (?, ?, ?, ?, ?, ?)`;
                break;
            case 'Assignment':
                query = `INSERT INTO assignment (Title, Subject, File, Cloudinary_Public_ID, Grade, Student_ID) VALUES (?, ?, ?, ?, ?, ?)`;
                break;
            case 'Seatwork':
                query = `INSERT INTO seatwork (Title, Subject, File, Cloudinary_Public_ID, Grade, Student_ID) VALUES (?, ?, ?, ?, ?, ?)`;
                break;
            case 'ExamPapers':
                query = `INSERT INTO exampapers (Title, Subject, File, Cloudinary_Public_ID, Grade, Student_ID) VALUES (?, ?, ?, ?, ?, ?)`;
                break;
            default:
                console.log('Invalid material type:', material_type);
                return res.status(400).json({ error: `Invalid Material Type` });
        }

        params = [title, subject, fileDetails.secure_url, fileDetails.public_id, grade, Student_ID];
        console.log('Executing query:', query);
        console.log('With parameters:', params);

        connection.query(query, params, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                console.log('No rows affected');
                return res.status(404).json({ error: `No record inserted` });
            }
            console.log('Successfully inserted record');
            res.status(200).json({
                msg: `Successfully Uploaded`,
                title: title,
                subject: subject,
                file_url: fileDetails.secure_url,
                public_id: fileDetails.public_id,
                grade: grade,
                material_type: material_type
            });
        });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});


// ANCHOR - QUIZ UPLOAD
app.post(`/upload/quiz`, verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, grade } = req.body;
        const { Student_ID } = req.user;

        let fileUrl = null;
        let publicId = null;

        if (req.file) {
            const fileUpload = await uploadToCloudinary(req.file);
            fileUrl = fileUpload.secure_url;
            publicId = fileUpload.public_id; // Get Cloudinary public_id
        }

        const query = `
            INSERT INTO quiz (Title, Subject, Grade, File, Cloudinary_Public_ID, Student_ID)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(query, [title, subject, grade, fileUrl, publicId, Student_ID], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: `No record inserted` });
            }
            res.status(200).json({
                msg: `Successfully Uploaded`,
                title: title,
                subject: subject,
                grade: grade,
                file_url: fileUrl
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// ANCHOR - PERFORMANCE TASK UPLOAD
app.post(`/upload/performance_task`, verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, grade } = req.body;
        const { Student_ID } = req.user;

        let fileUrl = null;
        let publicId = null;

        if (req.file) {
            const fileUpload = await uploadToCloudinary(req.file);
            fileUrl = fileUpload.secure_url;
            publicId = fileUpload.public_id; // Get Cloudinary public_id
        }

        const query = `
            INSERT INTO performance_task (Title, Subject, Grade, File, Cloudinary_Public_ID, Student_ID)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(query, [title, subject, grade, fileUrl, publicId, Student_ID], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: `No record inserted` });
            }
            res.status(200).json({
                msg: `Successfully Uploaded`,
                title: title,
                subject: subject,
                grade: grade,
                file_url: fileUrl
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - ASSIGNMENTS UPLOAD
app.post(`/upload/assignment`, verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, grade } = req.body;
        const { Student_ID } = req.user;

        let fileUrl = null;
        let publicId = null;

        if (req.file) {
            const fileUpload = await uploadToCloudinary(req.file);
            fileUrl = fileUpload.secure_url;
            publicId = fileUpload.public_id; // Get Cloudinary public_id
        }

        const query = `
            INSERT INTO assignment (Title, Subject, Grade, File, Cloudinary_Public_ID, Student_ID)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(query, [title, subject, grade, fileUrl, publicId, Student_ID], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: `No record inserted` });
            }
            res.status(200).json({
                msg: `Successfully Uploaded`,
                title: title,
                subject: subject,
                grade: grade,
                file_url: fileUrl
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// ANCHOR - SEATWORKS UPLOAD
app.post(`/upload/seatwork`, verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, grade } = req.body;
        const { Student_ID } = req.user;

        let fileUrl = null;
        let publicId = null;

        if (req.file) {
            const fileUpload = await uploadToCloudinary(req.file);
            fileUrl = fileUpload.secure_url;
            publicId = fileUpload.public_id; // Get Cloudinary public_id
        }

        const query = `
            INSERT INTO seatwork (Title, Subject, Grade, File, Cloudinary_Public_ID, Student_ID)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(query, [title, subject, grade, fileUrl, publicId, Student_ID], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: `No record inserted` });
            }
            res.status(200).json({
                msg: `Successfully Uploaded`,
                title: title,
                subject: subject,
                grade: grade,
                file_url: fileUrl
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - EXAM PAPERS UPLOAD
app.post(`/upload/exampapers`, verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, grade } = req.body;
        const { Student_ID } = req.user;

        let fileUrl = null;
        let publicId = null;

        if (req.file) {
            const fileUpload = await uploadToCloudinary(req.file);
            fileUrl = fileUpload.secure_url;
            publicId = fileUpload.public_id; // Get Cloudinary public_id
        }

        const query = `
            INSERT INTO exampapers (Title, Subject, Grade, File, Cloudinary_Public_ID, Student_ID)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(query, [title, subject, grade, fileUrl, publicId, Student_ID], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: `No record inserted` });
            }
            res.status(200).json({
                msg: `Successfully Uploaded`,
                title: title,
                subject: subject,
                grade: grade,
                file_url: fileUrl
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - VIEW QUIZ ARTIFACTS
app.get(`/view/quiz`, verifyToken, async (req, res) => {
    try {
        const { Student_ID } = req.user;
        console.log('Fetching quizzes for Student_ID:', Student_ID);

        const query = `SELECT * FROM quiz WHERE Student_ID = ?`;

        connection.query(query, [Student_ID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }

            console.log('Query results:', results);

            if (!results || results.length === 0) {
                console.log('No quizzes found for student');
                return res.status(200).json([]);
            }

            res.status(200).json(results);
        });

    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - VIEW PERFORMANCE TASK
app.get(`/view/performance_task`, verifyToken, async (req, res) => {
    try {
        const { Student_ID } = req.user;
        console.log('Fetching performance task for Student_ID:', Student_ID);

        const query = `SELECT * FROM performance_task WHERE Student_ID = ?`;

        connection.query(query, [Student_ID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }

            console.log('Query results:', results);

            if (!results || results.length === 0) {
                console.log('No performance task found for student');
                return res.status(200).json([]);
            }

            res.status(200).json(results);
        });

    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - VIEW ASSIGNMENT
app.get(`/view/assignment`, verifyToken, async (req, res) => {
    try {
        const { Student_ID } = req.user;
        console.log('Fetching assignment for Student_ID:', Student_ID);

        const query = `SELECT * FROM assignment WHERE Student_ID = ?`;

        connection.query(query, [Student_ID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }

            console.log('Query results:', results);

            if (!results || results.length === 0) {
                console.log('No performance task found for student');
                return res.status(200).json([]);
            }

            res.status(200).json(results);
        });

    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - VIEW SEATWORK
app.get(`/view/seatwork`, verifyToken, async (req, res) => {
    try {
        const { Student_ID } = req.user;
        console.log('Fetching seatwork for Student_ID:', Student_ID);

        const query = `SELECT * FROM seatwork WHERE Student_ID = ?`;

        connection.query(query, [Student_ID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }

            console.log('Query results:', results);

            if (!results || results.length === 0) {
                console.log('No seatwork found for student');
                return res.status(200).json([]);
            }

            res.status(200).json(results);
        });

    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});


// ANCHOR - VIEW EXAMPAPERS
app.get(`/view/exampapers`, verifyToken, async (req, res) => {
    try {
        const { Student_ID } = req.user;
        console.log('Fetching exampapers for Student_ID:', Student_ID);

        const query = `SELECT * FROM exampapers WHERE Student_ID = ?`;

        connection.query(query, [Student_ID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }

            console.log('Query results:', results);

            if (!results || results.length === 0) {
                console.log('No exampapers found for student');
                return res.status(200).json([]);
            }

            res.status(200).json(results);
        });

    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// ANCHOR - VIEW CLASSMATES ARTIFACTS
app.get(`/view/classmate/artifacts/:Student_ID`, verifyToken, async (req, res) => {

    const { Student_ID } = req.params;

    const quiz = `
    SELECT q.*, s.First_Name, s.Last_Name 
    FROM quiz q 
    JOIN student_user s ON q.Student_ID = s.Student_ID 
    WHERE q.Student_ID = ?`;

    const performance = `
    SELECT p.*, s.First_Name, s.Last_Name 
    FROM performance_task p 
    JOIN student_user s ON p.Student_ID = s.Student_ID 
    WHERE p.Student_ID = ?`;

    const assignment = `
    SELECT a.*, s.First_Name, s.Last_Name 
    FROM assignment a 
    JOIN student_user s ON a.Student_ID = s.Student_ID 
    WHERE a.Student_ID = ?`;

    const seatwork = `
    SELECT sw.*, s.First_Name, s.Last_Name 
    FROM seatwork sw 
    JOIN student_user s ON sw.Student_ID = s.Student_ID 
    WHERE sw.Student_ID = ?`;

    const exampaper = `
    SELECT ep.*, s.First_Name, s.Last_Name 
    FROM exampapers ep 
    JOIN student_user s ON ep.Student_ID = s.Student_ID 
    WHERE ep.Student_ID = ?`;

    try {
       
        const [

            quizResults,
            performanceTaskResults,
            seatworkResults,
            assignmentResults,
            examPapersResults

        ] = await Promise.all([

            new Promise((resolve, reject) => {

                connection.query(quiz, [Student_ID], (err, rows) => {

                    if(err) return reject(err);
                    resolve(rows);

                });

            }),

            new Promise((resolve, reject) => {

                connection.query(performance, [Student_ID], (err, rows) => {

                    if(err) return reject(err);
                    resolve(rows);

                });

            }),

            new Promise((resolve, reject) => {

                connection.query(assignment, [Student_ID], (err, rows) => {

                    if(err) return reject(err);
                    resolve(rows);

                });

            }),

            new Promise((resolve, reject) => {

                connection.query(seatwork, [Student_ID], (err, rows) => {

                    if(err) return reject(err);
                    resolve(rows);

                });

            }),

            new Promise((resolve, reject) => {

                connection.query(exampaper, [Student_ID], (err, rows) => {

                    if(err) return reject(err);
                    resolve(rows);

                });

            })

        ]);

        const combinedResults = {

            quizzes: quizResults,
            performanceTasks: performanceTaskResults,
            seatworks: seatworkResults,
            assignments: assignmentResults,
            examPapers: examPapersResults
            
        };

        res.status(200).json(combinedResults);

    }catch(error){

        res.status(500).json({ error: err.message });

    }

});


// ANCHOR - DELETE QUIZ
app.delete(`/delete/Quiz`, verifyToken, async (req, res) => {
    const { id } = req.body;

    // Fetch Cloudinary public_id
    const fetchQuery = 'SELECT Cloudinary_Public_ID FROM quiz WHERE id = ?';
    connection.query(fetchQuery, [id], async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching file details.' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found in database.' });
        }

        const publicId = rows[0].Cloudinary_Public_ID;

        // Remove file from Cloudinary
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
            return res.status(500).json({ error: 'Error deleting file from Cloudinary.' });
        }

        // Remove record from database
        const deleteQuery = 'DELETE FROM quiz WHERE id = ?';
        connection.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
                return res.status(500).json({ error: 'Error deleting record from database.' });
            }
            res.status(200).json({ msg: 'File and record deleted successfully!' });
        });
    });
});


// ANCHOR - DELETE PERFORMANCE TASK
app.delete(`/delete/performance_task`, verifyToken, async (req, res) => {
    const { id } = req.body;

    // Fetch Cloudinary public_id
    const fetchQuery = 'SELECT Cloudinary_Public_ID FROM performance_task WHERE id = ?';
    connection.query(fetchQuery, [id], async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching file details.' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found in database.' });
        }

        const publicId = rows[0].Cloudinary_Public_ID;

        // Remove file from Cloudinary
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
            return res.status(500).json({ error: 'Error deleting file from Cloudinary.' });
        }

        // Remove record from database
        const deleteQuery = 'DELETE FROM performance_task WHERE id = ?';
        connection.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
                return res.status(500).json({ error: 'Error deleting record from database.' });
            }
            res.status(200).json({ msg: 'File and record deleted successfully!' });
        });
    });
});


// ANCHOR - DELETE ASSIGNMENT
app.delete(`/delete/assignment`, verifyToken, async (req, res) => {
    const { id } = req.body;

    // Fetch Cloudinary public_id
    const fetchQuery = 'SELECT Cloudinary_Public_ID FROM assignment WHERE id = ?';
    connection.query(fetchQuery, [id], async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching file details.' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found in database.' });
        }

        const publicId = rows[0].Cloudinary_Public_ID;

        // Remove file from Cloudinary
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
            return res.status(500).json({ error: 'Error deleting file from Cloudinary.' });
        }

        // Remove record from database
        const deleteQuery = 'DELETE FROM assignment WHERE id = ?';
        connection.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
                return res.status(500).json({ error: 'Error deleting record from database.' });
            }
            res.status(200).json({ msg: 'File and record deleted successfully!' });
        });
    });
});

// ANCHOR - DELETE SEATWORK
app.delete(`/delete/seatwork`, verifyToken, async (req, res) => {
    const { id } = req.body;

    // Fetch Cloudinary public_id
    const fetchQuery = 'SELECT Cloudinary_Public_ID FROM seatwork WHERE id = ?';
    connection.query(fetchQuery, [id], async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching file details.' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found in database.' });
        }

        const publicId = rows[0].Cloudinary_Public_ID;

        // Remove file from Cloudinary
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
            return res.status(500).json({ error: 'Error deleting file from Cloudinary.' });
        }

        // Remove record from database
        const deleteQuery = 'DELETE FROM seatwork WHERE id = ?';
        connection.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
                return res.status(500).json({ error: 'Error deleting record from database.' });
            }
            res.status(200).json({ msg: 'File and record deleted successfully!' });
        });
    });
});



// ANCHOR - DELETE EXAMPAPERS
app.delete(`/delete/exampapers`, verifyToken, async (req, res) => {
    const { id } = req.body;

    // Fetch Cloudinary public_id
    const fetchQuery = 'SELECT Cloudinary_Public_ID FROM exampapers WHERE id = ?';
    connection.query(fetchQuery, [id], async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching file details.' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found in database.' });
        }

        const publicId = rows[0].Cloudinary_Public_ID;

        // Remove file from Cloudinary
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
            return res.status(500).json({ error: 'Error deleting file from Cloudinary.' });
        }

        // Remove record from database
        const deleteQuery = 'DELETE FROM exampapers WHERE id = ?';
        connection.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
                return res.status(500).json({ error: 'Error deleting record from database.' });
            }
            res.status(200).json({ msg: 'File and record deleted successfully!' });
        });
    });
});


// ANCHOR - GRADE AND SECTION =====================================================================>
// GRADE AND SECTION LIST
app.get(`/grade_and_section/list`, verifyToken, async (req, res) => {
    
    try{

        const query = `SELECT * FROM grade_and_sections`;

        connection.query(query, (err, rows) => {
            
            if(err){

                return res.status(500).json({ error: err.message });

            }

            res.status(200).json(rows);

        });

    }catch(error){

        console.log(error);

    }

});


// GRADE AND SECTION ADD
app.post(`/grade_and_section/add`, verifyToken, async (req, res) => {

    try{

        const { grade_level, section } = req.body;

        const query = `INSERT INTO grade_and_sections (Grade_level, Class_Section) VALUES (?, ?)`;

        connection.query(query, [grade_level, section], (err, result) => {

            if(err){

                return res.status(500).json({ error: err.message });

            }

            res.status(200).json({ msg: `Grade and Section is successfully added` });

        });

    }catch(error){

        console.log(error);

    }

});


// GRADE AND SECTION DELETE
app.delete(`/grade_and_section/delete/:id`, verifyToken, async (req, res) => {

    const { id } = req.params;

    const query = `DELETE FROM grade_and_sections WHERE id = ?`;

    connection.query(query, [id], (err, rows) => {

        if(err){

            return res.status(500).json({ error: err.message });

        }

        res.status(200).json({ msg: `Successfully Deleted!` });

    });

});


// ANCHOR - REQUEST ACCESS =====================================================================>
app.post('/request/access', verifyToken, async (req, res) => {

    const { classmateID } = req.body;
    const requesterID = req.user.Student_ID;

    const checkQuery = `SELECT * FROM file_requests WHERE requester_id = ? AND owner_id = ?`;
    const insertQuery = `INSERT INTO file_requests (requester_id, owner_id) VALUES (?, ?)`;
    const updateQuery = `UPDATE file_requests SET status = 'pending' WHERE requester_id = ? AND owner_id = ?`;

    try{

        connection.query(checkQuery, [requesterID, classmateID], (err, results) => {

            if(err){

                return res.status(500).json({ error: err.message });

            }

            if(results.length > 0){

                connection.query(updateQuery, [requesterID, classmateID], (updateErr, results) => {
                   
                    if(updateErr){

                        return res.status(500).json({ error: updateErr.message });

                    }

                    res.status(200).json({ msg: 'Access request updated successfully' });

                });

            }else{

                connection.query(insertQuery, [requesterID, classmateID], (insertErr, results) => {
                    
                    if(insertErr){

                        return res.status(500).json({ error: insertErr.message });

                    }

                    res.status(200).json({ msg: 'Access request sent successfully' });

                });

            }
            
        });

    }catch(error){

        res.status(500).json({ error: error.message });

    }

});


// ANCHOR - ACCESS REQUEST =======================================================================>
app.get('/access/requests', verifyToken, async (req, res) => {

    const classmateID  = req.user.Student_ID;

    const query = `
        SELECT fr.id, fr.requester_id, s.First_Name, s.Last_Name
        FROM file_requests fr 
        JOIN student_user s ON fr.requester_id = s.Student_ID
        WHERE fr.owner_id = ?
    `;

    try{
        
        connection.query(query, [classmateID], (err, results) => {

            if(err){

                console.error("Database error:", err);
                return res.status(500).json({ error: err.message });

            }

            res.status(200).json(results);

        });

    }catch(error){

        console.error('Error fetching access requests:', error);
        res.status(500).json({ error: error.message });

    }
    
});


// ANCHOR - ACCESS REQUEST USING SPECIFIC PARAMS (ID) AND ACTION =================================>
app.post('/access/request/:requestID/:action', verifyToken, async (req, res) => {

    const { requestID, action } = req.params;

    try{

        if(action === 'accept'){
            
            const acceptQuery = `UPDATE file_requests SET status = 'accepted' WHERE id = ?`;
            await connection.query(acceptQuery, [requestID]);

        }else if(action === 'decline'){
            
            const declineQuery = `UPDATE file_requests SET status = 'declined' WHERE id = ?`;
            await connection.query(declineQuery, [requestID]);

        }else{

            return res.status(400).json({ error: 'Invalid action' });

        }

        res.status(200).json({ msg: `Request ${action}ed successfully` });

    }catch(error){

        console.error('Error updating access request status:', error);
        res.status(500).json({ error: error.message });

    }

});


// ANCHOR - CHECK ACCESS STATUS ==================================================================>
app.get('/check/access/:classmateID', verifyToken, async (req, res) => {

    const requesterID = req.user.Student_ID;
    const { classmateID } = req.params;

    const query = `SELECT status FROM file_requests WHERE requester_id = ? AND owner_id = ?`;

    try{

        connection.query(query, [requesterID, classmateID], (err, results) => {

            if(err){

                console.error("Database error:", err);
                return res.status(500).json({ error: err.message });

            }

            if(results.length === 0){
               
                return res.status(404).json({ error: 'No access request found for this classmate.' });

            }

            const status = results[0].status;

            if(status === 'accepted'){

                res.json({ status: 'accepted', accessGranted: true });

            }else if(status === 'declined'){

                res.json({ status: 'declined', accessGranted: false });

            }else if(status === 'pending'){

                res.json({ status: 'pending', accessGranted: false });

            }else{

                res.status(400).json({ error: 'Unknown status' });

            }

        });

    }catch(error){

        console.error('Error checking access status:', error);
        res.status(500).json({ error: error.message });
        
    }
    
});


// ANCHOR - PEERS (CLASSMATES) LIST ==============================================================>
app.get(`/peers/list`, async (req, res) => {

    try{

        const query = `SELECT 
                student_user.Student_ID, 
                student_user.First_Name, 
                student_user.Last_Name, 
                student_user.Grade_Level, 
                student_user.Section, 
                student_user.Profile_Picture,
                login_credentials.Role
            FROM 
                student_user
            JOIN 
                login_credentials ON student_user.Student_ID = login_credentials.Student_ID
            WHERE 
                login_credentials.Role = 'student'
        `;

        connection.query(query, (err, results) => {

            if(err){

                return res.status(500).json({ error: err.message });

            }

            const students = results.map(student => {

                return {

                    Student_ID: student.Student_ID,
                    Name: `${student.First_Name} ${student.Last_Name}`,
                    Grade_Section: `${student.Grade_Level} ${student.Section}`,
                    Profile_Picture: student.Profile_Picture ? `https://achieve-hub.onrender.com/${student.Profile_Picture}` : null

                };

            });

            res.status(200).json(students);

        });

    }catch(error){

        console.log(error);
        res.status(500).json({ error: err.message });

    }

});

app.post('/grade_section/add', verifyToken, async (req, res) => {

    const { Grade_level, Class_Section } = req.body;
    
    try {

        // First, check if Grade and Section already exists
        const checkQuery = 'SELECT * FROM grade_and_sections WHERE Grade_level = ? && Class_Section = ?';

        connection.query(checkQuery, [Grade_level, Class_Section], async (checkErr, checkResults) => {
            if (checkErr) {
                console.log(checkErr);
                return res.status(500).json({ error: checkErr.message });
            }
            
            // If Student_ID already exists, return an error
            if (checkResults.length > 0) {
                return res.status(409).json({ error: 'Grade Level and Class Section already registered' });
            }
            
            // If Student_ID is unique, proceed with registration
            
            const insertQuery = `INSERT INTO grade_and_sections
            (Grade_level, Class_Section) 
            VALUES (?, ?)`;
            
            connection.query(insertQuery, 
                [Grade_level, Class_Section], 
                (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ msg: `Successfully Added` });
                }
            );
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error during adding." });
    }
});

app.get(`/subjects/list`, verifyToken, async (req, res) => {
    
    try{

        const query = `SELECT * FROM subjects`;

        connection.query(query, (err, rows) => {
            
            if(err){

                return res.status(500).json({ error: err.message });

            }

            res.status(200).json(rows);

        });

    }catch(error){

        console.log(error);

    }

});


app.post('/subject/add', verifyToken, async (req, res) => {

    const { Subject_Name } = req.body;
    
    try {

        // First, check if Subjects already exists
        const checkQuery = 'SELECT * FROM subjects WHERE Subject_Name = ?';

        connection.query(checkQuery, [Subject_Name], async (checkErr, checkResults) => {
            if (checkErr) {
                console.log(checkErr);
                return res.status(500).json({ error: checkErr.message });
            }
            
            // If Student_ID already exists, return an error
            if (checkResults.length > 0) {
                return res.status(409).json({ error: 'Subject already registered' });
            }
            
            // If Student_ID is unique, proceed with registration
            
            const insertQuery = `INSERT INTO subjects
            (Subject_Name) 
            VALUES (?)`;
            
            connection.query(insertQuery, 
                [Subject_Name], 
                (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ msg: `Successfully Added` });
                }
            );
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error during adding." });
    }
});

app.post('/grade_section/add', verifyToken, async (req, res) => {

    const { Grade_level, Class_Section } = req.body;
    
    try {

        // First, check if Grade and Section already exists
        const checkQuery = 'SELECT * FROM grade_and_sections WHERE Grade_level = ? && Class_Section = ?';

        connection.query(checkQuery, [Grade_level, Class_Section], async (checkErr, checkResults) => {
            if (checkErr) {
                console.log(checkErr);
                return res.status(500).json({ error: checkErr.message });
            }
            
            // If Student_ID already exists, return an error
            if (checkResults.length > 0) {
                return res.status(409).json({ error: 'Grade Level and Class Section already registered' });
            }
            
            // If Student_ID is unique, proceed with registration
            
            const insertQuery = `INSERT INTO grade_and_sections
            (Grade_level, Class_Section) 
            VALUES (?, ?)`;
            
            connection.query(insertQuery, 
                [Grade_level, Class_Section], 
                (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ msg: `Successfully Added` });
                }
            );
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error during adding." });
    }
});


app.get(`/grade_and_section/list`, verifyToken, async (req, res) => {
    
    try{

        const query = `SELECT * FROM grade_and_sections`;

        connection.query(query, (err, rows) => {
            
            if(err){

                return res.status(500).json({ error: err.message });

            }

            res.status(200).json(rows);

        });

    }catch(error){

        console.log(error);

    }

});

app.get(`/subjects/list`, verifyToken, async (req, res) => {
    
    try{

        const query = `SELECT * FROM subjects`;

        connection.query(query, (err, rows) => {
            
            if(err){

                return res.status(500).json({ error: err.message });

            }

            res.status(200).json(rows);

        });

    }catch(error){

        console.log(error);

    }

});


app.post('/subject/add', verifyToken, async (req, res) => {

    const { Subject_Name } = req.body;
    
    try {

        // First, check if Subjects already exists
        const checkQuery = 'SELECT * FROM subjects WHERE Subject_Name = ?';

        connection.query(checkQuery, [Subject_Name], async (checkErr, checkResults) => {
            if (checkErr) {
                console.log(checkErr);
                return res.status(500).json({ error: checkErr.message });
            }
            
            // If Student_ID already exists, return an error
            if (checkResults.length > 0) {
                return res.status(409).json({ error: 'Subject already registered' });
            }
            
            // If Student_ID is unique, proceed with registration
            
            const insertQuery = `INSERT INTO subjects
            (Subject_Name) 
            VALUES (?)`;
            
            connection.query(insertQuery, 
                [Subject_Name], 
                (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ msg: `Successfully Added` });
                }
            );
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error during adding." });
    }
});


app.post('/credentials/add', verifyToken, async (req, res) => {
    const { LogIn_ID, Student_ID, Hash_Password, First_Name, Last_Name, Grade, Section, role } = req.body;
    
    if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
    }
    
    try {
        // First, check if Student_ID already exists
        const checkQuery = 'SELECT * FROM login_credentials WHERE Student_ID = ?';
        connection.query(checkQuery, [Student_ID], async (checkErr, checkResults) => {
            if (checkErr) {
                console.log(checkErr);
                return res.status(500).json({ error: checkErr.message });
            }
            
            // If Student_ID already exists, return an error
            if (checkResults.length > 0) {
                return res.status(409).json({ error: 'Student ID already registered' });
            }
            
            // If Student_ID is unique, proceed with registration
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Hash_Password, salt);
            
            const insertQuery = `INSERT INTO login_credentials 
            (LogIn_ID, Student_ID, Hash_Password, First_Name, Last_Name, Grade, Section, Role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            connection.query(insertQuery, 
                [LogIn_ID, Student_ID, hashedPassword, First_Name, Last_Name, Grade, Section, role], 
                (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ msg: `User registered as ${role}` });
                }
            );
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error during registration." });
    }
});


// ANCHOR - SERVER API ========================================================================>
const PORT = process.env.PORT || 5000;

app.listen(5000, () => {

    console.log(`The Server API is running at PORT ${PORT}`);

});
