import { useEffect, useState } from 'react';
import './App.css';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';

function App() {
    const [State, setState] = useState({
        Tickers: [
            {
                symbol: 'AAPL',
                close: 0,
                Shares: 0,
                LikeIt: 110,
                LoveIt: 130,
                GotToHaveIt: 120
            }
        ],
        TempWatchList: {
            symbol: '',
            close: 0,
            Shares: 0,
            LikeIt: 0,
            LoveIt: 0,
            GotToHaveIt: 0
        },
        WatchListAdd: false
    });

    const toggle = () => setState({ ...State, WatchListAdd: !State.WatchListAdd });

    const HandleWishlistInputChange = (e) => {
        const { name, value } = e.target;
        setState({
            ...State,
            TempWatchList: {
                ...State.TempWatchList,
                [name]: value
            }
        });
    };

    const HandleWishlistAdd = (event) => {
        event.preventDefault();
        console.log(State.TempWatchList);
        setState({
            ...State,
            Tickers: [
                ...State.Tickers,
                State.TempWatchList
            ],
            TempWatchList: {
                symbol: '',
                close: 0,
                Shares: 0,
                LikeIt: 0,
                LoveIt: 0,
                GotToHaveIt: 0
            },
            WatchListAdd: false
        });
    
        var response = fetch(`https://api.polygon.io/v2/aggs/ticker/${State.TempWatchList.symbol}/prev?adjusted=true`, {
            headers: {
                'Authorization': `Bearer ${process.env.REACT_APP_POLYGON_API_KEY}`
            }
        }).then(response => response.json())

        

    }
    const fetchData = async () => {
        const newTickers = [ ...State.Tickers ];

        try {
            const responses = await Promise.all(
                newTickers.map(ticker =>
                    fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker.symbol}/prev?adjusted=true`, {
                        headers: {
                            'Authorization': `Bearer ${process.env.REACT_APP_POLYGON_API_KEY}`
                        }
                    }).then(response => response.json())
                )
            );
            console.log(responses);
            
            responses.forEach((data, index) => {
                newTickers[index] = {
                    ...newTickers[index],
                    close: data.results[0].c,
                };
            });

            setState({
                ...State,
                Tickers: newTickers,
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            setState({
                ...State,
                loading: false
            });
        }
    };

    return (
        <div className="App">

            <Modal isOpen={State.WatchListAdd} toggle={toggle}>
                <ModalHeader toggle={toggle}>Add A Stock</ModalHeader>
                <ModalBody>
                    <Form onSubmit={HandleWishlistAdd}>
                        <FormGroup>
                            <Label for="symbol">Stock Ticker</Label>
                            <Input type="text" name="symbol" id="symbol" onChange={HandleWishlistInputChange} required />
                        </FormGroup>
                        <FormGroup>
                            <Label for="Shares">Shares</Label>
                            <Input type="number" name="Shares" id="Shares" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <FormGroup>
                            <Label for="LikeIt">Like It Price</Label>
                            <Input type="number" name="LikeIt" id="LikeIt" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <FormGroup>
                            <Label for="LoveIt">Love It Price</Label>
                            <Input type="number" name="LoveIt" id="LoveIt" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <FormGroup>
                            <Label for="GotToHaveIt">Got To Have It Price</Label>
                            <Input type="number" name="GotToHaveIt" id="GotToHaveIt" onChange={HandleWishlistInputChange}  />
                        </FormGroup>
                        <Button color="primary" type="submit">Add Stock</Button>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggle}>Cancel</Button>
                </ModalFooter>
            </Modal>

            <div className='watchlist'>
                <button onClick={fetchData}>Fetch Data</button>
                <button onClick={toggle}>Add Stock</button>

                {Array.isArray(State.Tickers) && State.Tickers.map((ticker, index) => (
                    <div className='watchliststock' key={index}>
                        <h4>{ticker.symbol}</h4>
                        <p>{ticker.Shares}</p>
                        <p>${ticker.close}</p>
                        <div className='llgdots'>
                            <p className={ticker.LikeIt === 0 ? 'llgset' : ticker.close < ticker.LikeIt ? 'llgon' : 'llgoff'}></p>
                            <p className={ticker.LoveIt === 0 ? 'llgset' : ticker.close < ticker.LoveIt ? 'llgon' : 'llgoff'}></p>
                            <p className={ticker.GotToHaveIt === 0 ? 'llgset' : ticker.close < ticker.GotToHaveIt ? 'llgon' : 'llgoff'}></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;