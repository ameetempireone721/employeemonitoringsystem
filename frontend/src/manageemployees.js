import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    CircularProgress,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Select,
    MenuItem,
    Alert,
    TextField,
    Checkbox,
    FormControlLabel,
    IconButton,
} from '@mui/material';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BASE_URL from './config';

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    marginTop: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    backgroundColor: '#ffffff',
    height: '550px', // Reduced height
    width: '80%', // Added width restriction
    margin: '0 auto', // Center the table container
    overflow: 'auto',
}));

const SignupFormContainer = styled(Box)(({ theme }) => ({
    width: '70%', // Restrict form width
    margin: '0 auto', // Center the form container
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    backgroundColor: '#f9f9f9',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: '#1976d2',
    '& .MuiTableCell-root': {
        color: '#ffffff',
        fontWeight: 'bold',
    },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    width: '200px',
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

const UpdateTeamPage = () => {
    const [employees, setEmployees] = useState([]);
    const [newTeam, setNewTeam] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [signupError, setSignupError] = useState('');
    const [signupSuccess, setSignupSuccess] = useState('');
    const [activePage, setActivePage] = useState('team'); // "team", "signup", or "resetPassword"
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [team, setTeam] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetSuccessMessage, setResetSuccessMessage] = useState('');
    const navigate = useNavigate();

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const rawToken = localStorage.getItem('token'); // Retrieve the token
    const token = rawToken ? rawToken.replace(/^"(.*)"$/, '$1') : null;
    

    useEffect(() => {
        axios.get(`${BASE_URL}/api/getemployees`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                setEmployees(response.data);
                setLoading(false);
            })
            .catch(error => console.error('Error fetching employees:', error));
    }, []);

    const handleUpdateTeam = (employeeId) => {
        const employee = employees.find(emp => emp.employee_id === employeeId);
        const employeeName = employee ? employee.name : 'Unknown Employee';
        const token = localStorage.getItem('token');

        axios.post(`${BASE_URL}/api/update-team`, { employeeId, newTeam }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(() => {
                setEmployees(employees.map(emp =>
                    emp.employee_id === employeeId ? { ...emp, team: newTeam } : emp
                ));
                setSuccessMessage(`Successfully updated team for ${employeeName}`);
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => console.error('Error updating team:', error));
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError('');
        setSignupSuccess('');

        if (!email.endsWith('@empireonegroup.com')) {
            setSignupError('Email must be from the @empireonegroup.com domain.');
            return;
        }

        if (password !== confirmPassword) {
            setSignupError('Passwords do not match.');
            return;
        }

        if (!team) {
            setSignupError('Please select a team.');
            return;
        }

        try {
            await axios.post(`${BASE_URL}/api/signup`, {
                firstName,
                lastName,
                email,
                password,
                team,
                is_admin: isAdmin,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setSignupSuccess('Employee account created successfully!');
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setTeam('');
            setIsAdmin(false);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                setSignupError('User already exists in the system with that email.');
            } else {
                setSignupError('Error creating account. Please try again.');
            }
            console.error('Error signing up:', error);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetSuccessMessage('');
        setSignupError('');

        try {
            await axios.post(`${BASE_URL}/api/reset-password`, { email: resetEmail, newPassword: resetPassword }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setResetSuccessMessage('Password reset successfully!');
            setResetEmail('');
            setResetPassword('');
        } catch (error) {
            setSignupError('Error resetting password. Please try again.');
            console.error('Error resetting password:', error);
        }
    };

    if (loading) {
        return (
            <Container>
                <Typography variant="h4" align="center" gutterBottom>
                    Loading...
                </Typography>
                <CircularProgress style={{ display: 'block', margin: 'auto' }} />
            </Container>
        );
    }

    return (
        <Container>
            <PageHeader>
                <Typography variant="h5">Admin Panel</Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/dashboard')}
                    sx={{
                        backgroundColor: '#1976d2',
                        color: '#ffffff',
                        '&:hover': {
                            backgroundColor: '#115293',
                        },
                    }}
                >
                    Dashboard
                </Button>

                <Box sx={{ display: 'flex'}}>
                    <Button
                        variant={activePage === 'team' ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => setActivePage('team')}
                        sx={{ mx: 1 }}
                    >
                        Edit Team
                    </Button>
                    <Button
                        variant={activePage === 'signup' ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => setActivePage('signup')}
                        sx={{ mx: 1 }}
                    >
                        Create Account
                    </Button>
                    <Button
                        variant={activePage === 'resetPassword' ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => setActivePage('resetPassword')}
                        sx={{ mx: 1 }}
                    >
                        Reset Password
                    </Button>
                </Box>
            </PageHeader>

            {activePage === 'team' && (
                <>
                    {successMessage && (
                        <Alert severity="success" style={{ marginBottom: '16px' }}>
                            {successMessage}
                        </Alert>
                    )}

                    <Typography variant="h6" align="center">Edit Employee Team Assignment</Typography>
                    <StyledTableContainer component={Paper}>
                        <Table>
                            <StyledTableHead>
                                <TableRow>
                                    <TableCell>Employee ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Current Team</TableCell>
                                    <TableCell>New Team</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </StyledTableHead>
                            <TableBody>
                                {employees.map(employee => (
                                    <TableRow key={employee.employee_id}>
                                        <TableCell>{employee.employee_id}</TableCell>
                                        <TableCell>{employee.name}</TableCell>
                                        <TableCell>{employee.team}</TableCell>
                                        <TableCell>
                                            <StyledSelect
                                                value={selectedEmployeeId === employee.employee_id ? newTeam : ''}
                                                onChange={(e) => {
                                                    setNewTeam(e.target.value);
                                                    setSelectedEmployeeId(employee.employee_id);
                                                }}
                                                displayEmpty
                                            >
                                                <MenuItem value="" disabled>
                                                    Select Team
                                                </MenuItem>
                                                <MenuItem value="Customer Service Representative">Customer Service Representative</MenuItem>
                                                <MenuItem value="Team Leader">Team Leader</MenuItem>
                                                <MenuItem value="Quality Assurance">Quality Assurance</MenuItem>
                                                <MenuItem value="Subject Matter Expert">Subject Matter Expert</MenuItem>
                                                <MenuItem value="Account Manager">Account Manager</MenuItem>
                                            </StyledSelect>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                disabled={selectedEmployeeId !== employee.employee_id || newTeam === ''}
                                                onClick={() => handleUpdateTeam(employee.employee_id)}
                                            >
                                                Update
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </StyledTableContainer>
                </>
            )}

            {activePage === 'signup' && (
                <SignupFormContainer>
                    {signupError && <Alert severity="error" style={{ marginBottom: '16px' }}>{signupError}</Alert>}
                    {signupSuccess && <Alert severity="success" style={{ marginBottom: '16px' }}>{signupSuccess}</Alert>}

                    <Typography variant="h6" align='center'>Create Employee Account</Typography>
                    <form onSubmit={handleSignup}>
                        <TextField
                            label="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <StyledSelect
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                            fullWidth
                            displayEmpty
                            required
                        >
                            <MenuItem value="" disabled>Select Team</MenuItem>
                            <MenuItem value="Customer Service Representative">Customer Service Representative</MenuItem>
                            <MenuItem value="Team Leader">Team Leader</MenuItem>
                            <MenuItem value="Quality Assurance">Quality Assurance</MenuItem>
                            <MenuItem value="Subject Matter Expert">Subject Matter Expert</MenuItem>
                            <MenuItem value="Account Manager">Account Manager</MenuItem>
                        </StyledSelect>
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <IconButton onClick={togglePasswordVisibility}>
                                        {showPassword ? (
                                            <VisibilityOffIcon />
                                        ) : (
                                            <VisibilityIcon />
                                        )}
                                    </IconButton>
                                ),
                            }}
                        />
                        <TextField
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                />
                            }
                            label="Is Admin?"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            style={{ marginTop: '16px' }}
                        >
                            Create Account
                        </Button>
                    </form>
                </SignupFormContainer>
            )}

            {activePage === 'resetPassword' && (
                <SignupFormContainer>
                    {resetSuccessMessage && (
                        <Alert severity="success" style={{ marginBottom: '16px' }}>
                            {resetSuccessMessage}
                        </Alert>
                    )}
                    {signupError && <Alert severity="error" style={{ marginBottom: '16px' }}>{signupError}</Alert>}

                    <Typography variant="h6" align="center">Reset Employee Password</Typography>
                    <form onSubmit={handleResetPassword}>
                        <TextField
                            label="Employee Email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <IconButton onClick={togglePasswordVisibility}>
                                        {showPassword ? (
                                            <VisibilityOffIcon />
                                        ) : (
                                            <VisibilityIcon />
                                        )}
                                    </IconButton>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            style={{ marginTop: '16px' }}
                        >
                            Reset Password
                        </Button>
                    </form>
                </SignupFormContainer>
            )}
        </Container>
    );
};

export default UpdateTeamPage;
