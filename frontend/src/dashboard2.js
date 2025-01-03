import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    CircularProgress,
    Avatar,
    TextField,
    Button,
    Paper,
    Grid,
    Box,
    Tooltip,
    TableCell,
    TableBody,
    Table,
    TableRow,
    TableHead,
    TableContainer
} from '@mui/material';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import LogoutButton from './logout';
import BASE_URL from './config';

ChartJS.register(ArcElement, ChartTooltip, Legend);

// Helper function to format duration in seconds to minutes:seconds format
const formatDuration = (durationSec) => {
    if (durationSec >= 3600) {
        const hours = Math.floor(durationSec / 3600);
        const minutes = Math.floor((durationSec % 3600) / 60);
        return `${hours}h ${minutes}m`;
    } else if (durationSec >= 60) {
        const minutes = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;
        return `${minutes}m ${seconds}s`;
    } else {
        return `${durationSec}s`;
    }
};

// Styled components for enhanced UI
const StyledButton = styled(Button)(({ theme }) => ({
    boxShadow: theme.shadows[2],
    margin: theme.spacing(1),
    '&:hover': {
        transform: 'scale(1.05)',
    },
}));

// Styled components for enhanced UI
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    marginTop: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    backgroundColor: '#ffffff',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: '#1976d2',
    '& .MuiTableCell-root': {
        color: '#ffffff',
        fontWeight: 'bold',
    },
}));

const StatusIndicator = styled('div')(({ statusColor }) => ({
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: statusColor,
    marginRight: 8,
    boxShadow: `0 0 10px ${statusColor}`,
    display: 'inline-block',
    verticalAlign: 'middle',
}));

const FilterContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
}));

const PageHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    background: 'linear-gradient(135deg, #e0f7fa, #e1bee7)',
}));

const Dashboard2 = () => {
    const [agentStatus, setAgentStatus] = useState([]);
    const [filteredStatus, setFilteredStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterName, setFilterName] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const fetchData = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/api/agent-status`);
                setAgentStatus(response.data);
                setFilteredStatus(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data', error);
            }
    };

    useEffect(() => {
        fetchData(); // Initial data fetch
        const interval = setInterval(() => {
            fetchData(); // Refresh data every 30 seconds
        }, 30000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);

    const applyFilters = () => {
        const filtered = agentStatus.filter((agent) => {
            const matchesName = filterName ? agent.name.toLowerCase().includes(filterName.toLowerCase()) : true;
            const matchesDate = filterDate ? agent.start_date === filterDate : true;
            return matchesName && matchesDate;
        });
        setFilteredStatus(filtered);
    };

    // Calculate status counts for pie chart
    const statusCounts = filteredStatus.reduce((counts, agent) => {
        counts[agent.status_name] = counts[agent.status_name] ? counts[agent.status_name] + 1 : 1;
        return counts;
    }, {});

    const statusColorMapping = {
        'Available': '#00FF00',
        'Break': '#FFFF00',
        'Lunch': '#FFA500',
        'Coaching': '#ADD8E6',
        'Meeting': '#FF0000',
        'Training': '#800080',
        'Floor Support': '#008080',
        'Idle': '#FF4500',
        'Offline': '#808080',
    };

    // Map status names to their respective colors from the mapping
    const pieChartData = {
        labels: Object.keys(statusCounts),
        datasets: [
            {
                data: Object.values(statusCounts),
                backgroundColor: Object.keys(statusCounts).map(statusName => statusColorMapping[statusName]),
                hoverOffset: 4,
            },
        ],
    };

    if (loading) {
        return (
            <Container>
                <Typography variant="h4" align="center" gutterBottom>
                    Agent Status Dashboard
                </Typography>
                <CircularProgress style={{ display: 'block', margin: 'auto' }} />
            </Container>
        );
    }

    return (
        <Container>
            <PageHeader>
                <Typography variant="h5">Employee Detailed Activity Logs</Typography>
                <div>
                    <StyledButton variant="contained" color="secondary" component={Link} to="/timeline">
                        View Employee Timeline
                    </StyledButton>
                    <StyledButton variant="contained" color="success" component={Link} to="/report">
                        Generate Report
                    </StyledButton>
                    <StyledButton variant="contained" color="warning" component={Link} to="/updateteam">
                        Manage Employees
                    </StyledButton>
                    <LogoutButton />
                </div>
            </PageHeader>

            {/* Filter Section */}
            <FilterContainer>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={4}>
                        <TextField
                            label="Agent Name"
                            variant="outlined"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            size="small"
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <TextField
                            label="Date"
                            variant="outlined"
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <StyledButton
                            variant="contained"
                            color="primary"
                            onClick={applyFilters}
                            fullWidth
                        >
                            Apply Filters
                        </StyledButton>
                    </Grid>
                </Grid>
            </FilterContainer>

            {/* Grid Layout for Pie Chart next to Filter Section */}
            <Grid container spacing={3} alignItems="center">
                {/* Pie Chart Section */}
                <Grid item xs={3} md={3}>
                    <Paper style={{ padding: '16px', display: 'flex', minHeight: '300px' }}>
                        <Pie data={pieChartData} />
                    </Paper>
                </Grid>

                {/* Table Section */}
                <Grid item xs={12} md={9}>
                    <StyledTableContainer component={Paper}>
                        <Table>
                            <StyledTableHead>
                                <TableRow>
                                    <TableCell>Agent Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Team</TableCell>
                                </TableRow>
                            </StyledTableHead>
                            <TableBody>
                                {filteredStatus.length > 0 ? (
                                    filteredStatus.map((agent) => (
                                        <TableRow hover key={agent.employee_id}>
                                            <TableCell>
                                                <Tooltip title={agent.name}>
                                                </Tooltip>
                                                {agent.name}
                                            </TableCell>
                                            <TableCell>
                                                <StatusIndicator statusColor={agent.color_code} />
                                            </TableCell>
                                            {agent.status_name === 'Offline' ? (
                                                <TableCell>Offline</TableCell>
                                            ) : (
                                                <TableCell>{formatDuration(agent.duration)}</TableCell>
                                            )}
                                            <TableCell>{agent.start_date}</TableCell>
                                            <TableCell>{agent.team}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No data found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </StyledTableContainer>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard2;