import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, TextField, Button, CircularProgress, Tooltip ,Grid} from "@mui/material";
import styled from "@emotion/styled";
import { Link } from 'react-router-dom';
import BASE_URL from "./config";

const TimelineContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const EmployeeContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const TimeAxis = styled.div`
    display: flex;
    justify-content: space-between;
    position: relative;
    font-size: 12px;
    margin-bottom: 5px;
`;

const HorizontalTimeline = styled.div`
    display: flex;
    position: relative;
    height: 30px;
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 5px;
    overflow: hidden;
`;

const TimelineSegment = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: ${({ color }) => color};
    cursor: pointer;  // Makes the segments look interactive
`;

const LegendContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: center;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`;

const EmployeeTimeline = () => {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Default to today
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nameFilter, setNameFilter] = useState(""); // New state for name filter
    const token = localStorage.getItem('token');

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/api/employee-status?date=${date}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const aggregatedData = aggregateRecords(response.data || []);
            setRecords(aggregatedData);
        } catch (error) {
            console.error("Error fetching records", error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch records immediately when the effect runs
        fetchRecords();
    
        // Set up an interval to fetch records every 30 seconds
        const intervalId = setInterval(fetchRecords, 30000);
    
        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [date]); // 

    const aggregateRecords = (data) => {
        const aggregated = {};
        data.forEach((record) => {
            const { employee_id, name, team, start_time, end_time, status_name } = record;

            if (!aggregated[employee_id]) {
                aggregated[employee_id] = {
                    employee_id,
                    name,
                    team,
                    statuses: [],
                };
            }

            aggregated[employee_id].statuses.push({
                start_time,
                end_time,
                status_name,
            });
        });

        return Object.values(aggregated);
    };

    const calculatePosition = (startTime, endTime) => {
        const start = new Date(startTime).getHours() * 60 + new Date(startTime).getMinutes();
        const end = new Date(endTime).getHours() * 60 + new Date(endTime).getMinutes();
        const totalMinutes = 24 * 60;
        const left = (start / totalMinutes) * 100;
        const width = ((end - start) / totalMinutes) * 100;
        return { left: `${left}%`, width: `${width}%` };
    };

    const statusColors = {
        Available: "#4CAF50",   // Moderate Green
        Break: "#FFC107",       // Amber
        Lunch: "#FF9800",       // Deep Orange
        Coaching: "#03A9F4",    // Light Blue
        Meeting: "#F44336",     // Red
        Training: "#9C27B0",    // Purple
        "Floor Support": "#009688", // Teal
        Idle: "#FF5722",        // Deep Orange Red
    };

    const renderTimeAxis = () => {
        const hours = Array.from({ length: 25 }, (_, i) => `${i}:00`);
        return (
            <TimeAxis>
                {hours.map((hour, index) => (
                    <div key={index} style={{ flex: 1, textAlign: "center" }}>
                        {hour}
                    </div>
                ))}
            </TimeAxis>
        );
    };

    const renderLegend = () => (
        <LegendContainer>
            {Object.entries(statusColors).map(([status, color]) => (
                <LegendItem key={status}>
                    <div style={{ width: "20px", height: "20px", backgroundColor: color }}></div>
                    <Typography>{status}</Typography>
                </LegendItem>
            ))}
        </LegendContainer>
    );

    // Filter records by name
    const filteredRecords = records.filter(record =>
        record.name.toLowerCase().includes(nameFilter.toLowerCase())
    );

    return (
        <Container>
            <Typography variant="h4" gutterBottom align="center">
                Employee Daily Status Timeline
            </Typography>

            {/* Color Legend */}
            {renderLegend()}


            <div style={{ marginBottom: "20px" }}>
    <Grid container spacing={2} alignItems="center" justifyContent="space-between">
        {/* Date Picker */}
        <Grid item xs={12} sm={3}>
            <TextField
                label="Select Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
            />
        </Grid>

        {/* Name Filter */}
        <Grid item xs={12} sm={3}>
            <TextField
                label="Filter by Name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
            />
        </Grid>
        {/* Fetch Records Button */}
        <Grid item xs={12} sm={3}>
            <Button 
                variant="contained" 
                color="primary" 
                onClick={fetchRecords} 
                fullWidth
            >
                Fetch Records
            </Button>
        </Grid>
        {/* Back to Dashboard Button */}
        <Grid item xs={12} sm={3}>
            <Button 
                variant="outlined" 
                color="secondary" 
                component={Link} 
                to="/dashboard" 
                fullWidth
                sx={{
                    backgroundColor: '#1976d2', // Custom background color
                    color: '#ffffff', // Text color
                    '&:hover': {
                        backgroundColor: '#115293', // Darker shade for hover effect
                    },
                }}
            >
                Back to Dashboard
            </Button>
        </Grid>
    </Grid>
</div>
            {loading ? (
                <CircularProgress style={{ display: "block", margin: "auto" }} />
            ) : filteredRecords.length > 0 ? (
                <TimelineContainer>
                    {filteredRecords.map((record) => (
                        <EmployeeContainer key={record.employee_id}>
                            <Typography variant="h6">
                                {record.name} - {record.team}
                            </Typography>
                            {renderTimeAxis()}
                            <HorizontalTimeline>
                                {record.statuses.map((status, index) => {
                                    const { left, width } = calculatePosition(
                                        status.start_time,
                                        status.end_time
                                    );
                                    const color = statusColors[status.status_name] || "gray";
                                    return (
                                        <Tooltip key={index} title={status.status_name} arrow>
                                            <TimelineSegment
                                                color={color}
                                                style={{ left, width }}
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </HorizontalTimeline>
                        </EmployeeContainer>
                    ))}
                </TimelineContainer>
            ) : (
                <Typography align="center">No records found for the selected date.</Typography>
            )}
        </Container>
    );
};

export default EmployeeTimeline;