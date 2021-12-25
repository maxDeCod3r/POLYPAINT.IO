import React, { Component } from 'react';
import "../styles/App.css";
import Web3 from 'web3'
import PixelGrid from "react-pixel-grid";

class App extends Component {

    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum)
            await window.ethereum.enable()
            this.setState({ web3_enabled: true })
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
            this.setState({ web3_enabled: true })
        } else {
            window.alert("Non Web3 browser detected, cannot access Metamask")
        }
    }

    async updatePixelData() {
        fetch("/pixel_data")
            .then((res) => res.json())
            .then((data) => {
              var updatedArray = this.state.grid
              var downloadedArray = data.data
              for (const [key, value] of Object.entries(downloadedArray)) {
                if (key >= 0) {
                  updatedArray[key] = value
                }
              }
              let newArray = []
              updatedArray.forEach(piece => {
                  const cleanColor = piece.replace('0x', '#');
                  newArray.push(cleanColor);
                });
              this.setState({grid: newArray})
            });
    }

    async updatePixelGrid() {
      // infinite loop to update pixel data every n seconds
    }

    async loadBlockchainData() {
        await this.loadWeb3()
        if (this.state.web3_enabled) {
            const web3 = window.web3
            const network = await web3.eth.net.getNetworkType()
            const accounts = await web3.eth.getAccounts()
            if (accounts) {
                const account = accounts[0]
                this.setState({ account })
                this.setState({ network })
                this.setState({ connect_button_visibility: false })
            }
        } else {
            this.setState({ account: "Non Web3 browser" })
        }
    }

    async componentDidMount() {
        await this.updatePixelData()
            // this.loadBlockchainData()
    }

    constructor(props) {
        super(props)
        this.state = {
            account: "Connect wallet",
            network: '?',
            web3_enabled: false,
            connect_button_visibility: true,
            grid: [],
        }
        var empty_arr = []
        for (let i = 0; i < 1000000; i++) {
          empty_arr.push("0x007700")
        }
        this.state.grid = empty_arr
    }


    splitArray(array, part) {
      var tmp = [];
      for(var i = 0; i < array.length; i += part) {
          tmp.push(array.slice(i, i + part));
      }
      return tmp;
  }

    render() {
        return (
        <div className = "App" >
          {/* <nav className = "container" >
            <h1 style = {{ color: 'black' }} >Hello World!</h1>
            {(() => {
              if (this.state.connect_button_visibility) {
                return (
                  <button id = "connect_wallet"
                    className = "btn btn-block btn-primary"
                    onClick = {() => { this.loadBlockchainData() }
                } > Connect wallet </button>);
              } else {
                return (
                  <div>
                    <p style = {{ color: 'grey' }}>
                      Account: { this.state.account }
                    </p>
                    <p style = {{ color: 'grey' }}>
                      Network: { this.state.network }
                    </p>
                  </div>)}})()}
            </nav> */}
            {/* <div className="canvas">
            {this.state.grid.map((color, key) => {
              return(
                <div className="pixel" style={{backgroundColor: color}}></div>
                )
                    })}
            </div> */}

            {/* <PixelGrid data={this.splitArray(this.state.grid, this.state.grid.length ** 0.5)}
            options={{
              size: 1,
              padding: 0,
              background: [0, 0.5, 1],
            }} /> */}

            {/* <svg width={this.state.grid.length ** 0.5} height={this.state.grid.length ** 0.5}>
              {this.state.grid.map((color, key) => {
                let size = this.state.grid.length ** 0.5
                const rowId = Math.floor(key/size);
                const colId = key % size;
                return(
                  <rect x={colId} y={rowId} width={1} height={1} style={{fill: color}}/>
                  )
                  })}
            </svg> */}

            <canvas
              id="canvas"
              width={500}
              height={500}
              style={{border: '2px solid #000', marginTop: 10}}>

              </canvas>
          </div>
    );
  };
}

export default App;
