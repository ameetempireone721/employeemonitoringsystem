import React, { useState } from 'react';
import { Container, Typography, Button, TextField, MenuItem, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import BASE_URL from './config';

const ReportPage = () => {
    const [team, setTeam] = useState('');
    const [date, setDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [successMessage, setSuccessMessage] = useState(''); // Added state for success message
    

    const handleTeamChange = (event) => {
        setTeam(event.target.value);
    };

    const handleDateChange = (event) => {
        setDate(event.target.value);
    };

    const token = localStorage.getItem('token');

    const generateReport = async () => {
        try {
            const response = await fetch(`${BASE_URL??'https://eo-monitoring-system.com'}/api/generate-report?team=${team}&date=${date}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length === 0) {
                    setSuccessMessage('No Data Available'); // Show success message with name
    
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
                    return; // Don't generate the report if there is no data
                }

                setReportData(data); // Store the data for report generation
                generateExcel(data);
            } else {
                console.error('Error fetching report data');
                alert('Error fetching report data.');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating report.');
        }
    };

    const generateExcel = (data) => {
        const formattedData = data.map((row) => ({
            Name: row.name,
            Status: row.status_name,
            'Start Time': row.start_time,
            'End Time': row.end_time,
            Duration: formatDuration(row.duration),
            Team: row.team,
            Date: row.date,
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Report');

        const fileName = `Activity_Report_${team}_${date}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const formatDuration = (durationInSeconds) => {
        let hours = Math.floor(durationInSeconds / 3600);
        let minutes = Math.floor((durationInSeconds % 3600) / 60);
        let seconds = durationInSeconds % 60;
        let duration = '';
        if (hours > 0) {
            duration += `${hours} hour${hours > 1 ? 's' : ''} `;
        }
        if (minutes > 0) {
            duration += `${minutes} minute${minutes > 1 ? 's' : ''} `;
        }
        if (seconds > 0 || (hours === 0 && minutes === 0)) {
            duration += `${seconds} second${seconds > 1 ? 's' : ''}`;
        }
        return duration.trim();
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom align="center">
                Generate Activity Report
            </Typography>
            {/* Display success message */}
            {successMessage && (
                        <Alert severity="error" style={{ marginBottom: '16px' }}>
                            {successMessage}
                        </Alert>
                    )}

            {/* Team Selection */}
            <TextField
                select
                label="Select Team"
                value={team}
                onChange={handleTeamChange}
                fullWidth
                margin="normal"
            >
                <MenuItem value="" disabled>Select Team</MenuItem>
                <MenuItem value="Customer Service Representative">Customer Service Representative</MenuItem>
                <MenuItem value="Team Leader">Team Leader</MenuItem>
                <MenuItem value="Quality Assurance">Quality Assurance</MenuItem>
                <MenuItem value="Subject Matter Expert">Subject Matter Expert</MenuItem>
                <MenuItem value="Account Manager">Account Manager</MenuItem>
            </TextField>

            {/* Date Selection */}
            <TextField
                type="date"
                label="Select Date"
                value={date}
                onChange={handleDateChange}
                fullWidth
                margin="normal"
                InputLabelProps={{
                    shrink: true,
                }}
            />

            {/* Report Generation Button */}
            <Button variant="contained" color="primary" onClick={generateReport} style={{ marginTop: '20px' }}>
                Generate Report
            </Button>

            {/* Back Button to Dashboard */}
            <Button variant="outlined" color="secondary" component={Link} to="/dashboard" style={{ marginTop: '20px' , marginLeft:'10px'}}>
                Back to Dashboard
            </Button>
        </Container>
    );
};

export default ReportPage;
