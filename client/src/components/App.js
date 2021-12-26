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
      this.updatePixelGrid()
    }

    constructor(props) {
        super(props)
        this.state = {
            account: "Connect wallet",
            network: '?',
            web3_enabled: false,
            connect_button_visibility: true,
        }
    }

    render() {
        return (
        <div className = "App" >
          <nav className = "container" >
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
            </nav>
            <img src="/pixel_data.png" alt="THE_MAP" width="1000" height="1000"/>


          </div>
    );
  };
}

export default App;
