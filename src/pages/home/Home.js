import { useEffect, useState } from 'react';
import './Home.css';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { Tooltip } from 'react-tooltip';
import Calendar from './components/calendar/Calendar';


function Home() {
    const [hoveredPrice, setHoveredPrice] = useState(null);
    const [State, setState] = useState({
        Tickers: [],
        TempWatchList: {
            Symbol: '',
            Close: 0,
            Shares: 0,
            LikeIt: 0,
            LoveIt: 0,
            GotToHaveIt: 0
        },
        WatchListAdd: false,
        EditModal: false,
        SelectedTicker: null,
        StockChartURL: ''  // Store the image URL
    });
    
    

    useEffect( () => {
        fetch("http://localhost:3001/WatchList").then(
            response => response.json()
        ).then( data => {
            setState({
                ...State,
                Tickers: data,
            });
            console.log(data)
            console.log(State.Tickers.length != 0, 'here', State.Tickers)
        });
    }, [State.WatchListAdd, State.EditModal])
    
    useEffect(() => {
        console.log("Updated hoveredPrice:", hoveredPrice);
    }, [hoveredPrice]);


    const toggle = () => setState({ ...State, WatchListAdd: !State.WatchListAdd });

    const openEditModal = async (ticker) => {
        try {
            // Example: Fetch from TradingView (or another financial API)
            const chartURL = `https://finviz.com/chart.ashx?t=${ticker.Symbol}&ty=c&ta=1&p=d&s=l`;
    
            await setState({
                ...State,
                EditModal: true,
                SelectedTicker: { ...ticker },
                StockChartURL: chartURL  // Store the fetched chart URL
            });
            console.log(ticker, 'here 1')
            await HandleWishlistEdit(ticker);
            console.log(ticker, 'here')
        } catch (error) {
            console.error("Error fetching stock chart:", error);
        }
    };
    
    
    const closeEditModal = () => {
        setState({
            ...State,
            EditModal: false,
            SelectedTicker: null
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setState({
            ...State,
            SelectedTicker: {
                ...State.SelectedTicker,
                [name]: value
            }
        });
    };

    const HandleWishlistEdit = async (t) => {
        // Fetch the latest close price for the stock using its symbol
        const editedTicker = t
        console.log(editedTicker, 'here');
        const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${editedTicker.Symbol}/prev?adjusted=true`, {
            headers: {
                'Authorization': `Bearer ${process.env.REACT_APP_POLYGON_API_KEY}`
            }
        });

        const data = await response.json();

        // If the data contains a valid result, update the close price
        if (data.results && data.results.length > 0) {
            editedTicker.Close = data.results[0].c; // 'c' is the close price from the API response
        } else {
            console.error(`No close price data found for ticker ${editedTicker.Symbol}`);
            editedTicker.Close = null; // Fallback if no close price is found
        }

        // Update the ticker on your local JSON server
        const requestOptions = {
            method: "PUT", // Use PUT to update an existing entry
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editedTicker), // Send the updated ticker data
        };

        // Send the updated ticker data to your local JSON server
        await fetch(`http://localhost:3001/WatchList/${editedTicker.id}`, requestOptions);

    };
    

    const handleEditSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const requestOptions = {
                method: "PUT",  // Use PUT to update
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(State.SelectedTicker),
            };
    
            // API call to update the stock data
            const response = await fetch(`http://localhost:3001/WatchList/${State.SelectedTicker.id}`, requestOptions);
            const updatedTicker = await response.json();  // assuming the API returns the updated ticker
    
            // Log the updated ticker to check what is returned
            console.log("Updated Ticker:", updatedTicker);
    
            // Update state locally after successful API call
            setState((prevState) => ({
                ...prevState,
                EditModal: false,
                Tickers: prevState.Tickers.map(ticker =>
                    ticker.Symbol === updatedTicker.Symbol ? updatedTicker : ticker
                )
            }));
    
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    };
    

    const HandleWishlistInputChange = (e) => {
        const { name, value } = e.target;
        setState({
            ...State,
            TempWatchList: {
                ...State.TempWatchList,
                [name]: value.toUpperCase()
            }
        });
    };

    const HandleWishlistAdd = async (event) => {
        event.preventDefault();
    
        const newTicker = State.TempWatchList;
    
        try {

            const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${newTicker.Symbol}/prev?adjusted=true`, {
                headers: {
                    'Authorization': `Bearer ${process.env.REACT_APP_POLYGON_API_KEY}`
                }
            });

            const data = await response.json();
    
            if (data.results && data.results.length > 0) {
                newTicker.Close = data.results[0].c;
            }

            const requestOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTicker),
            };
            
            fetch("http://localhost:3001/WatchList", requestOptions)

            setState({...State,
                WatchListAdd: false
            })
            
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const removeStock = async () => {
        const tickerSymbol = State.SelectedTicker;
        console.log('Attempting to remove stock:', tickerSymbol); // Debugging log
    
        try {
            // Send DELETE request to backend to remove stock
            const response = await fetch(`http://localhost:3001/WatchList/${tickerSymbol.id}`, {
                method: "DELETE",
            });
    
            // Log the response to check if it was successful
            const result = await response.json();
            console.log('Response from DELETE:', result); // Debugging log
    
            if (response.ok) {
                // Remove stock from the local state (update watchlist)
                const updatedTickers = State.Tickers.filter(ticker => ticker.Symbol !== tickerSymbol);
                setState({
                    ...State,
                    Tickers: updatedTickers,
                    EditModal: false, // Close the modal after removal
                });
            } else {
                console.error('Error deleting stock:', result);
            }
        } catch (error) {
            console.error('Error removing stock:', error);
        }
    };
    

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setState({
                    ...State,
                    selectedImage: file,
                    imageUrl: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="Home">

            <Modal isOpen={State.WatchListAdd} toggle={toggle} size='lg'>
                <ModalHeader toggle={toggle}>Add A Stock</ModalHeader>
                <ModalBody>
                    <Form onSubmit={HandleWishlistAdd}>
                        <FormGroup>
                            <Label for="Symbol">Stock Ticker</Label>
                            <Input type="text" name="Symbol" id="Symbol" onChange={HandleWishlistInputChange} required />
                        </FormGroup>
                        <FormGroup>
                            <Label for="Shares">Shares</Label>
                            <Input type="number" name="Shares" id="Shares" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <FormGroup>
                            <Label for="LikeIt">Like It Price</Label>
                            <Input type="float" name="LikeIt" id="LikeIt" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <FormGroup>
                            <Label for="LoveIt">Love It Price</Label>
                            <Input type="float" name="LoveIt" id="LoveIt" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <FormGroup>
                            <Label for="GotToHaveIt">Got To Have It Price</Label>
                            <Input type="float" name="GotToHaveIt" id="GotToHaveIt" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <Button color="primary" type="submit">Add Stock</Button>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggle}>Cancel</Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={State.EditModal} toggle={closeEditModal} size='lg'>
                <ModalHeader toggle={closeEditModal}>Edit Stock</ModalHeader>
                <ModalBody>
                    {State.SelectedTicker && (
                        <>
                            {/* Stock Chart Image */}
                            {State.StockChartURL && (
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    <img 
                                        src={State.StockChartURL} 
                                        alt={`${State.SelectedTicker.Symbol} Stock Chart`} 
                                        style={{ width: '100%', borderRadius: '8px' }} 
                                    />
                                </div>
                            )}

                            <Form onSubmit={(e) => handleEditSubmit(e)}>
                                <FormGroup>
                                    <Label for="Symbol">Stock Ticker</Label>
                                    <Input type="text" name="Symbol" value={State.SelectedTicker.Symbol} disabled />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="Shares">Shares</Label>
                                    <Input type="number" name="Shares" value={State.SelectedTicker.Shares} onChange={handleEditChange} />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="LikeIt">Like It Price</Label>
                                    <Input type="number" name="LikeIt" value={State.SelectedTicker.LikeIt} onChange={handleEditChange} />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="LoveIt">Love It Price</Label>
                                    <Input type="number" name="LoveIt" value={State.SelectedTicker.LoveIt} onChange={handleEditChange} />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="GotToHaveIt">Got To Have It Price</Label>
                                    <Input type="number" name="GotToHaveIt" value={State.SelectedTicker.GotToHaveIt} onChange={handleEditChange} />
                                </FormGroup>
                                <Button color="primary" type="submit">Save Changes</Button>
                                {/* Remove Button */}
                                <Button 
                                    color="danger" 
                                    onClick={removeStock} 
                                    style={{ marginLeft: '10px' }}
                                >
                                    Remove Stock
                                </Button>
                            </Form>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    
                    <Button color="secondary" onClick={closeEditModal}>Cancel</Button>
                </ModalFooter>
            </Modal>

            <div className='watchlist'>
                <h2 className='watchlistTitle'>Watchlist</h2>
                <button className='watchlistButton' onClick={toggle}>Add Stock</button>

                {State.Tickers.length !== 0 && State.Tickers.map((ticker, index) => (
                    <div className='watchliststock' key={index} onClick={() => openEditModal(ticker)}>
                        <h4>{ticker.Symbol}</h4>
                        <p>{ticker.Shares}</p>
                        <p>${ticker.Close}</p>
                        <div className='llgdots'>
                            <p className={ticker.LikeIt === 0 ? 'llgset' : ticker.Close < ticker.LikeIt ? 'llgon' : 'llgoff'}
                            data-tooltip-id={`tooltip-${index}-like`}
                            data-tooltip-content={`Like It Price: $${ticker.LikeIt}`}></p>
                            <Tooltip id={`tooltip-${index}-like`} />

                            <p className={ticker.LoveIt === 0 ? 'llgset' : ticker.Close < ticker.LoveIt ? 'llgon' : 'llgoff'}
                            data-tooltip-id={`tooltip-${index}-love`}
                            data-tooltip-content={`Love It Price: $${ticker.LoveIt}`}></p>
                            <Tooltip id={`tooltip-${index}-love`} />

                            <p className={ticker.GotToHaveIt === 0 ? 'llgset' : ticker.Close < ticker.GotToHaveIt ? 'llgon' : 'llgoff'}
                            data-tooltip-id={`tooltip-${index}-got`}
                            data-tooltip-content={`Got To Have It Price: $${ticker.GotToHaveIt}`}></p>
                            <Tooltip id={`tooltip-${index}-got`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className='main'>
                <h1 className='title'>Brown Town Speculation</h1>

                <Calendar />
                
            </div>

        </div>
    );
}

export default Home;