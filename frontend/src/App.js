import React from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Login from './Login';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard2 from './dashboard2';
import EmployeeTimeline from './employee_timeline';
import ReportPage from './report';
import SingleUserTimeline from './singleusertimeline';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Unauthorized from './unauthorized';
import UpdateTeamPage from './manageemployees';

const theme = createTheme({
    // You can customize the theme here
    palette: {
      divider: '#e0e0e0',  // Default divider color
      primary: {
        main: '#1976d2',
      },
    },
  });

function App() {
    
    return (
        <ThemeProvider theme={theme}>
        <Router>
            <Routes>
                <Route path="/dashboard" element={ <Dashboard2 />} />
                <Route path="/" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/timeline" element={<EmployeeTimeline/> }/>
                <Route path="/report" element={<ReportPage/>} />
                <Route path="/employee_timeline" element={<SingleUserTimeline/>} />
                <Route path="/updateteam" element={<UpdateTeamPage /> } />
            </Routes>
        </Router>
        </ThemeProvider>
    );
    
}

export default App;