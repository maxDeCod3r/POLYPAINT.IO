import React, { Component } from 'react';
import "../styles/App.css";
import Web3 from 'web3'

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

    async loadPixelGrid() {
      this.setState({image: {source: '/pixel_data.png',hash: Date.now()}})
    }

    async updatePixelDatabase() {
      fetch("/pixel_data.raw")
      .then((res) => res.json())
      .then((data) => {
        var downloadedArray = data.data
        let newArray = []
        downloadedArray.forEach(piece => {
          const cleanColor = '#'+piece.toString(16)
          newArray.push(cleanColor)
        });
        this.setState({ raw_grid: newArray })
        const available = this.countOccurrences(newArray, "#2c2e43")
        const purchased = newArray.length - available
        this.setState({stats: {purchased, available, price: "?"}})
      });
    }

    onWindowResize() {
      let window_height = window.innerHeight
      let window_width = window.innerWidth
      let new_size = (window_height < window_width) ? window_height : window_width
      this.setState({ image_size: new_size })
    }

    countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

    constructor(props) {
      super(props)
      this.state = {
        account: "Connect wallet",
        network: '?',
        web3_enabled: false,
        connect_button_visibility: true,
        raw_grid: null,
        image: {source: '/pixel_data.png',hash: Date.now()},
        image_size: null,
        image_update_frequency_ms: 10 * 1000,
        stats: {purchased: 0,available: 0,price: "?"},
        selected_pixel: {pixel_id: null,pixel_x: null,pixel_y: null,pixel_color: null},
      }

      this.onWindowResize = this.onWindowResize.bind(this)
      let window_height = window.innerHeight
      let window_width = window.innerWidth
      this.state.image_size = (window_height < window_width) ? window_height : window_width
    }

    async componentDidMount() {
      this.startUpdatingPixelGrid()
      window.addEventListener('resize', this.onWindowResize);
    }

    async startUpdatingPixelGrid() {
      this.updatePixelDatabase()
      this.interval = setInterval(() => this.loadPixelGrid(), this.state.image_update_frequency_ms);
      this.interval = setInterval(() => this.updatePixelDatabase(), this.state.image_update_frequency_ms);
    }

    render() {
        return (
          <div className = "App" >
            {/* <nav className = "container">
              <h1 style = {{ color: 'black' }}>Hello World!</h1>
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
            <div className = "content-container">
              <div className = "column">
                <div className = "side-box blue-box big-box">
                  <b> Stats </b>
                  <p>Purchased blocks: { this.state.stats.purchased } < br/>
                    Available blocks: { this.state.stats.available } <br/>
                    Block price: { this.state.stats.price } USD
                  </p>
                </div>
                <div>
                  <div className = "side-box purple-box">
                    <b> About the project </b>
                  </div>
                  <div className = "side-box red-box">
                    <b> How to use </b>
                  </div>
                </div>
                <div className = "side-box special-box big-box">
                  <b> Other stuff </b>
                  <p>
                    <i className = "fas fa-envelope"></i>me@polypaint.io <br/>
                    <i className = "fab fa-twitter"> </i>@maxdedeseng <br/>
                    ©2022 All rights reserved
                  </p>
                </div>
              </div>
              <div className = "column-separator"> </div>
              <div className = "column column-img">
                <img src = { `${this.state.image.source}?${this.state.image.hash}` } alt = "THE_MAP"></img>
              </div>
              <div className = "column-separator"></div>
              <div className = "column">

              {(() => {
                if (this.state.connect_button_visibility) {
                  return (
                  <div className = "side-box blue-box right-correction clickable-box" onClick = {() => {this.loadBlockchainData()}}><b>Connect Wallet</b></div>
                  )
                } else {
                  return (
                  <div className = "side-box blue-box right-correction clickable-box" onClick = {() => {console.log('smth');}}>
                    <b>{`${this.state.account.slice(0, 5)}...${this.state.account.slice(38, 42)}`}</b></div>
                  )}})()}

                <div>
                  <div className = "side-box purple-box">
                    <b> Buy blocks </b>
                  </div>
                  <div className = "side-box red-box">
                    <b> Set block colours </b>
                  </div>
                </div>
                <div className = "side-box green-box big-box">
                  <b> Block info </b>
                  <p>
                    Id: 999999 @ 1000, 1000 <br/>
                    Hex colour: { '0xffeecc' } <br/>
                    <a href = "/">OpenSea Link</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
    );
};
}

export default App;
