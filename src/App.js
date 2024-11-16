
import { useEffect } from 'react';
import './App.css';

function App() {


    const fetchData = async () => {
        try {
            const response = await fetch(`https://api.polygon.io/v1/open-close/AAPL/2023-01-09?adjusted=true`, {
                headers: {
                    'Authorization': `Bearer ${process.env.REACT_APP_POLYGON_API_KEY}`
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <div className="App">

            <button onClick={fetchData}>Fetch Data</button>

        </div>
    );
}


export default App;

