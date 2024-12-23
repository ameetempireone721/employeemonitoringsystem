import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import styled from '@emotion/styled';
import { Button } from '@mui/material';

const LogoutButton = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Perform logout action
        navigate('/'); // Redirect to the login page or any other page
    };
    // Styled components for enhanced UI
    const StyledButton = styled(Button)(({ theme }) => ({
        boxShadow: theme.shadows[2],
        margin: theme.spacing(1),
        '&:hover': {
            transform: 'scale(1.05)',
        },
    }));

    return (
        <StyledButton variant="contained" color="primary" onClick={handleLogout} >Logout</StyledButton>
    );
};

export default LogoutButton;
