import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from './assets/Picture1.png';
import { AuthContext } from './AuthContext';
import BASE_URL from './config';

const Login = () => {
    const [email, setEmail] = useState('ameet@empireonegroup.com');
    const [password, setPassword] = useState('Tumbin45');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${BASE_URL}/api/login`, { email, password });
            // Extract user data from the response
           
            console.log('JSON.stringify(userData)',response.data.token)
            const userData = {
                id: response.data.user.employee_id, // Replace with actual field name for user ID
                email: response.data.user.email, // Replace with actual field name for email
                isAdmin: response.data.user.is_admin === 1, // Adjust based on your API response
            };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token',response.data.token)

        // Call login function to set session
        login(userData);
            if (response.data['user']['is_admin']===1)
                navigate(`/dashboard?email=${encodeURIComponent(response.data.user.email)}`);
            else
                navigate(`/employee_timeline?email=${encodeURIComponent(response.data.user.email)}`);
        } catch (error) {
            console.error('Error logging in:', error);
            if (error.response && error.response.status === 401) {
                setErrorMessage('Invalid email or password.');
            } else {
                setErrorMessage('Error logging in. Please try again.');
            }
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="signup-header">
                    <img src={logo} alt="EmpireOne Logo" className="signup-logo" />
                    <h2>Login</h2>
                </div>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="input-field"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="input-field"
                        required
                    />
                    <button type="submit" className="login-button">Login</button>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                </form>
            </div>
        </div>
    );
};

export default Login;