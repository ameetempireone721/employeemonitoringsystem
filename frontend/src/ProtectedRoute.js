import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useContext(AuthContext);
    console.log("Protected:", user)

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.isAdmin?'admin':'user')) {
        // Redirect to unauthorized page if role is not allowed
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

export default ProtectedRoute;
