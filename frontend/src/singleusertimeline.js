import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Container, Typography, TextField, Button, CircularProgress, Tooltip, Grid } from "@mui/material";
import styled from "@emotion/styled";
import { AuthContext } from "./AuthContext";
import LogoutButton from "./logout";
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
    cursor: pointer;
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

const SingleUserTimeline = () => {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Default to today
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useContext(AuthContext);
    const token = localStorage.getItem('token');
    
    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/api/single-employee?date=${date}&email=${user.email}`, {
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
            const { employee_id, name, team, start_time, end_time, status_name, email } = record;

            if (!aggregated[employee_id] && email === user.email) {
                aggregated[employee_id] = {
                    employee_id,
                    name,
                    team,
                    statuses: [],
                };
            }

            if (email === user.email) {
                aggregated[employee_id].statuses.push({
                    start_time,
                    end_time,
                    status_name,
                });
            }
        });

        return Object.values(aggregated);
    };

    const getCurrentStatus = (statuses) => {
            if (!statuses || statuses.length === 0) {
                return "No Status Available";
            }
            if (statuses[0].end_time){
                return "No Status Available";
            }
            return statuses[0].status_name; // Get the first record's status_name
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
        Available: "#4CAF50",
        Break: "#FFC107",
        Lunch: "#FF9800",
        Coaching: "#03A9F4",
        Meeting: "#F44336",
        Training: "#9C27B0",
        "Floor Support": "#009688",
        Idle: "#FF5722",
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

    return (
        <Container>
            <Typography variant="h5" gutterBottom align="center">
                Employee Daily Status Timeline
                <LogoutButton color="success"/>
            </Typography>

            {/* Color Legend */}
            {renderLegend()}

            <div style={{ marginBottom: "20px" }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={8} sm={2}>
                        <TextField
                            label="Select Date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={8} sm={2}>
                        <Button variant="contained" color="primary" onClick={fetchRecords} fullWidth>
                            Fetch Records
                        </Button>
                    </Grid>
                </Grid>
            </div>

            {loading ? (
                <CircularProgress style={{ display: "block", margin: "auto" }} />
            ) : records.length > 0 ? (
                <TimelineContainer>
                    {records.map((record) => (
                        <EmployeeContainer key={record.employee_id}>
                            <Typography variant="h6">
                                {record.name} - {record.team}
                            </Typography>
                            <Typography variant="subtitle1" color="primary">
                                Current Status: {getCurrentStatus(record.statuses)}
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

export default SingleUserTimeline;