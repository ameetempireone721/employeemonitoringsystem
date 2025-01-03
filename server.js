const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json())

let connection;

const handleDisconnect = () => {
    connection = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'employee_monitoring'
    });

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL:', err);
            setTimeout(handleDisconnect, 2000); // Retry connection after 2 seconds
        } else {
            console.log('Connected to MySQL');
        }
    });

    connection.on('error', (err) => {
        console.error('MySQL error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect if connection is lost
        } else {
            throw err; // Other errors should be handled or logged
        }
    });
};

handleDisconnect();

// Secret key for JWT
const SECRET_KEY = 'd9347521c6d2fb1a031c02b2b05ee6a6197d7660e768fd9fd2b1d31c8a608125f2f643de0c20cb0759149ba98ed2d4b89dc3f58937a77ba866df5fe016f2384b'; // Replace with a secure secret key

// Middleware to verify token
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).send({ message: 'No token provided!' });
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).send({ message: 'Failed to authenticate token.' });
        req.userId = decoded.id;
        next();
    });
}

// Route to fetch live agent statuses
app.get('/api/agent-status', verifyToken, (req, res) => {
    console.log('Received request for agent status');
    const query = `
    SELECT 
    e.employee_id, 
    CONCAT(e.first_name, ' ', e.last_name) AS name, 
    IF(as_.end_time IS NULL, s.status_name, 'Offline') AS status_name, 
    IF(as_.end_time IS NULL, s.color_code, '#808080') AS color_code, 
    IF(as_.end_time IS NULL, 
       TIMESTAMPDIFF(SECOND, as_.start_time, NOW()), 
       TIMESTAMPDIFF(SECOND, as_.start_time, as_.end_time)) AS duration,
    DATE_FORMAT(as_.start_time, '%Y-%m-%d') AS start_date,  -- Extracts only the date (YYYY-MM-DD)
    e.team  -- Assuming 'team' is the correct column name in Employees table
FROM 
    Agent_Status as_ 
JOIN 
    Employees e ON e.employee_id = as_.employee_id 
JOIN 
    Statuses s ON s.status_id = as_.status_id
WHERE 
    as_.start_time = (
        SELECT MAX(start_time) 
        FROM Agent_Status 
        WHERE employee_id = as_.employee_id
    );
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching agent statuses:', err);
            res.status(500).send('Error fetching agent statuses');
            return;
        }
        console.log(results)
        res.json(results);
    });
});


app.get('/api/single-employee', verifyToken,(req, res) => {
    
    const { date, email } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0]; // Use provided date or default to today's date

    const query = `
    SELECT 
    e.employee_id, 
    CONCAT(emp.first_name, ' ', emp.last_name) AS name, 
    emp.team, 
    s.status_name, 
    e.start_time, 
    e.end_time,
    emp.email as email,
    TIMESTAMPDIFF(SECOND, e.start_time, e.end_time) AS duration
FROM 
    Agent_status e
JOIN 
    Employees emp ON emp.employee_id = e.employee_id
LEFT JOIN 
    Statuses s ON s.status_id = e.status_id
WHERE 
    DATE(e.start_time) = ?
    AND emp.email = ?
ORDER BY 
    e.start_time DESC;
    `;

    connection.query(query, [selectedDate, email], (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            res.status(500).send('Error fetching employees');
            return;
        }
        res.json(results);
    });
});

app.post('/api/update-team', verifyToken,(req, res) => {
    const { employeeId, newTeam } = req.body;

    // Validate input
    if (!employeeId || !newTeam) {
        return res.status(400).send('Employee ID and new team are required.');
    }

    const query = 'UPDATE Employees SET team = ? WHERE employee_id = ?';

    connection.query(query, [newTeam, employeeId], (err) => {
        if (err) {
            console.error('Error updating team:', err);
            return res.status(500).send('Error updating team.');
        }
        res.status(200).send('Team updated successfully.');
    });
});

app.get('/api/getemployees', verifyToken,(req, res) => {
    
    const query = `
    SELECT 
    emp.employee_id, 
    CONCAT(emp.first_name, ' ', emp.last_name) AS name, 
    emp.team
    FROM 
    Employees emp;
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            res.status(500).send('Error fetching employees');
            return;
        }
        res.json(results);
    });
});

app.get('/api/employee-status', verifyToken,(req, res) => {
    
    const { date } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0]; // Use provided date or default to today's date

    const query = `
    SELECT 
    e.employee_id, 
    CONCAT(emp.first_name, ' ', emp.last_name) AS name, 
    emp.team, 
    s.status_name, 
    e.start_time, 
    e.end_time,
    TIMESTAMPDIFF(SECOND, e.start_time, e.end_time) AS duration
FROM 
    Agent_status e
JOIN 
    Employees emp ON emp.employee_id = e.employee_id
LEFT JOIN 
    Statuses s ON s.status_id = e.status_id
WHERE 
    DATE(e.start_time) = ?
ORDER BY 
    e.employee_id, e.start_time ASC;
    `;

    connection.query(query, [selectedDate, selectedDate], (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            res.status(500).send('Error fetching employees');
            return;
        }
        res.json(results);
    });
});

// New endpoint for fetching report data based on filters (team and date)
app.get('/api/generate-report', verifyToken,(req, res) => {
    const { team, date } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0]; // Default to today's date if no date is provided
    let query = `
    SELECT 
    e.employee_id, 
    CONCAT(e.first_name, ' ', e.last_name) AS name, 
    s.status_name, 
    s.color_code,
    e.team,
    TIME(as_.start_time) AS start_time,  -- Only the time part of start_time
    TIME(as_.end_time) AS end_time,  
    TIMESTAMPDIFF(SECOND, as_.start_time, as_.end_time) AS duration,
    DATE_FORMAT(as_.start_time, '%Y-%m-%d') AS date
FROM 
    Agent_Status as_ 
JOIN 
    Employees e ON e.employee_id = as_.employee_id 
JOIN 
    Statuses s ON s.status_id = as_.status_id
WHERE 
    DATE(as_.start_time) = ?
    AND as_.end_time IS NOT NULL`;

    if (team) {
        query += ` AND e.team = ?`;
    }

    // Execute query based on filters
    connection.query(query, [selectedDate, team], (err, results) => {
        if (err) {
            console.error('Error fetching report data:', err);
            return res.status(500).send('Error generating report');
        }
        res.json(results);
    });
});


app.post('/api/signup', verifyToken,(req, res) => {
    const { firstName, lastName, email, team , password, is_admin} = req.body;

    if (!email.endsWith('@empireonegroup.com')) {
        return res.status(400).send('Email must be from the @empireonegroup.com domain.');
    }

    try {
        const query = 'INSERT INTO Employees (first_name, last_name, email, team, password, is_admin) VALUES (?, ?, ?, ?, ?, ?)';
        connection.query(query, [firstName, lastName, email, team, password, is_admin], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).send('User already exists in the system with that email.');
                }
                console.error('Error signing up:', err);
                return res.status(500).send('Error signing up. Please try again.');
            }
            res.status(201).send('User registered successfully');
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error signing up. Please try again.');
    }
});

app.post('/api/reset-password', verifyToken,(req, res) => {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
        return res.status(400).send('Email and new password are required.');
    }

    const query = 'UPDATE Employees SET password = ? WHERE email = ?';

    connection.query(query, [newPassword, email], (err) => {
        if (err) {
            console.error('Error resetting password:', err);
            return res.status(500).send('Error resetting password.');
        }
        res.status(200).send('Password reset successfully.');
    });
});


// Route for user login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM Employees WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).send('Error logging in. Please try again.');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid email or password.');
        }

        const user = results[0];
        const token = jwt.sign({ id: user.employee_id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login successful', user, token });
        
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
