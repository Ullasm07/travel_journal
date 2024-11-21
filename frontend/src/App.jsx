import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Use Routes instead of Switch
import Map from './components/Map';
import Gallery from './components/Gallery';
import Nav from './components/Nav';
import Timeline from './components/Timeline';
import GetUserLocation from './components/GetUserLocation';
import Stats from './components/Stats'; // Import Stats component


const App = () => {
    const [trips, setTrips] = useState([]);

    // Function to add a trip
    const addTrip = (newTrip) => {
        setTrips([...trips, newTrip]);
    };

    // Fetch trips data from the backend
    useEffect(() => {
        axios.get('http://localhost:5000/api/trips')
            .then((response) => {
                setTrips(response.data);
            })
            .catch((error) => console.error('Error fetching trips:', error));
    }, []);

    return (
        <Router> 
            <div>
                <Nav /> {/* Your Navbar with links to different pages */}
                <Routes> {/* Use Routes to define different routes */}
                    {/* Home Route - Shows Map, GetUserLocation, Timeline */}
                    <Route 
                        path="/" 
                        element={<><GetUserLocation /><Map trips={trips} /><Timeline trips={trips} /></>} 
                    />

                    {/* Gallery Route - Shows Gallery page */}
                    <Route 
                        path="/gallery" 
                        element={<Gallery trips={trips} />} 
                    />

                    {/* Stats Route - Shows Stats page */}
                    <Route 
                        path="/stats" 
                        element={<Stats trips={trips} />} 
                    />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
