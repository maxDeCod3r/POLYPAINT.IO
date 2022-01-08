import React, { Component } from 'react';
import "../styles/App.css";
import Web3 from 'web3'
import Modal from "./Modal";
import Pixels from '../abis/Pixels.json'


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

    async loadContractData() {
      await this.loadWeb3()
      if (this.state.web3_enabled) {
        const web3 = window.web3
        // const network_name = await web3.eth.net.getNetworkType()
        const network_id = await web3.eth.net.getId()
        const accounts = await web3.eth.getAccounts()
        if (accounts) {
          const account = accounts[0]
          this.setState({ account })
          this.setState({ network_id })
          this.setState({ connect_button_visibility: false })

          const networkData = Pixels.networks[network_id]
          if (networkData) {
              const abi = Pixels.abi
              const contractAddress = networkData.address
              const contract = new web3.eth.Contract(abi, contractAddress)
              this.setState({contract, contractAddress})
          }
          else {
            try {
              await web3.currentProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x13881" }] //Mumbai
                // params: [{ chainId: "0x89" }] //Polygon
              });
            } catch (error) {
              alert(error.message);
              this.setState({ web3_enabled: false })
              window.alert("Smart contract not on the network!")
            }
          }
        }
      } else {
        this.setState({ account: "Non Web3 browser" })
      }
    }

    async loadPixelGrid() {
      this.setState({image: {source: '/pixel_data.png',hash: Date.now()}})
    }

    async updatePixelDatabase() {
      fetch("/pixel_data.colours")
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
      fetch("/pixel_data.links")
      .then((res) => res.json())
      .then((data) => {
        var downloadedArray = data.data
        let newArray = []
        downloadedArray.forEach(piece => {
          newArray.push(String(piece))
        });
        this.setState({ raw_links: newArray })
      });
    }

    countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

    UserException(message) {this.message = message; this.name = 'UserException';}

    constructor(props) {
      super(props)
      this.state = {
        account: "Connect wallet",
        network_id: '?',
        web3_enabled: false,
        // web3_enabled: false,
        connect_button_visibility: true,
        raw_grid: null,
        raw_links: null,
        image: {source: '/pixel_data.png',hash: Date.now()},
        image_update_frequency_ms: 10 * 1000,
        stats: {purchased: 0,available: 0,price: "?"},
        selected_pixel: {pixel_id: null,pixel_x: null,pixel_y: null,pixel_color: null},
        show_buyer_modal: false,
        show_setter_modal: false,
        buy_modal_price: null,
        buy_modal_pixels: null,
        buy_modal_link: null,
        buy_modal_colours: null,
        set_modal_pixels: null,
        set_modal_colours: null,
        contract: null,
        contractAddress: null,
        max_link_length: 30,
        hovering_pixel: {
          id_long: 0,
          id_short: {x: 0, y:0},
          hex_colour: "#000000",
          link: '/',
          full_link: '/'
        }
      }
    }

    handle_buyer_submit(e) {
      try {
        const pixelContract = this.state.contract
        const pixelsToBuy = this.state.buy_modal_pixels.split(',');
        const pixelsToSet = this.state.buy_modal_colours.split(',');
        const idArray = []
        const colorArray = []
        pixelsToBuy.forEach(pixel => {idArray.push(Number(pixel))});
        pixelsToSet.forEach(color => {colorArray.push(color.replace(' ',''))});
        const payableAmount = this.state.buy_modal_price * 1000000000000000000
        if (idArray.length !== colorArray.length) {alert('Array lengths inconsistent')}
          console.log("Sending contract call");
          pixelContract.methods.mintMultiple(idArray, colorArray, '/').send({from: this.state.account, value: payableAmount})
          .on('receipt', (e) => {
            console.log('receipt');
            console.log(e);
          })
          .on('transactionHash', (e) => {
            console.log('transactionHash');
            console.log(e);
            this.setState({show_buyer_modal: false})
          })
        } catch (e) {window.alert(e.message)}
    }

    handle_setter_submit(e) {
      try {
        const pixelContract = this.state.contract
        const pixelsToChange = this.state.set_modal_pixels.split(',');
        const pixelColours = this.state.set_modal_colours.split(',');
        const idArray = []
        const colorArray = []
        pixelsToChange.forEach(pixel => {idArray.push(Number(pixel))});
        pixelColours.forEach(color => {colorArray.push(color.replace(' ',''))});
        console.log("Sending contract call");
        pixelContract.methods.changePixelColourMultiple(idArray, colorArray).send({from: this.state.account})
        .on('receipt', (e) => {
          console.log('receipt');
          console.log(e);
        })
        .on('transactionHash', (e) => {
          console.log('transactionHash');
          console.log(e);
          this.setState({show_setter_modal: false})
        })
      } catch (e) {window.alert(e.message)}
    }

    buyer_modalOpen() {this.setState({ show_buyer_modal: true });}
    setter_modalOpen() {this.setState({ show_setter_modal: true });}

    buyer_modalClose() {this.setState({show_buyer_modal: false})}
    setter_modalClose() {this.setState({show_setter_modal: false})}


    trimString(string, length) {
      return string.length > length ?
             string.substring(0, length) + '...' :
             string;
    };


    mouseOnGrid(e) {
      const rect = e.target.getBoundingClientRect();
      const elementSize = rect.right - rect.left
      const x_pix_rel = e.clientX - rect.left; //x position within the element.
      const y_pix_rel = e.clientY - rect.top;  //y position within the element.
      const x = parseInt(x_pix_rel * 1000 / elementSize)
      const y = parseInt(y_pix_rel * 1000 / elementSize)
      const relativeIndex = (1000*y) + x
      const full_link = this.state.raw_links[relativeIndex]
      const hover_link = this.trimString(this.state.raw_links[relativeIndex], this.state.max_link_length)

      this.setState(
      {hovering_pixel: {
        id_long: relativeIndex,
        id_short: {x, y},
        hex_colour: this.state.raw_grid[relativeIndex],
        link: hover_link,
        full_link: full_link
      }})
    }

    clickOnGrid(e) {
      const rect = e.target.getBoundingClientRect();
      const elementSize = rect.right - rect.left
      const x_pix_rel = e.clientX - rect.left; //x position within the element.
      const y_pix_rel = e.clientY - rect.top;  //y position within the element.
      const x = parseInt(x_pix_rel * 1000 / elementSize)
      const y = parseInt(y_pix_rel * 1000 / elementSize)
      const relativeIndex = (1000*y) + x
      const full_link = this.state.raw_links[relativeIndex]

      if (full_link != '/#') {
        window.open(full_link,'_blank');
      }
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

            <Modal show={this.state.show_buyer_modal}>
              <div className="main-modal">
                <b>Buy blocks</b>
                <div className="modal-form-group">
                  <input type="text"
                    id="pay_block_ids"
                    placeholder="Payment (0.4 * amount of pixels) (MATIC)"
                    onChange={ (e)  => {this.setState({buy_modal_price: e.target.value})}}
                    name="modalInputName"/>
                  <input type="text"
                    id="buy_block_ids"
                    placeholder="Block id(s): 500,501,502"
                    onChange={ (e)  => {this.setState({buy_modal_pixels: e.target.value})}}
                    name="modalInputName"/>
                  <input type="text"
                    id="buy_colour_ids"
                    placeholder="Block colours(s): 0x111111,0x2222220,333333"
                    onChange={ (e)  => {this.setState({buy_modal_colours: e.target.value})}}
                    name="modalInputName"/>
                  <input type="text"
                    id="buy_link"
                    placeholder="(optional) ONE link"
                    onChange={ (e)  => {this.setState({buy_modal_link: e.target.value})}}
                    name="modalInputName"/>
                </div>
                <div className="modal-button-row">
                  <button className='modal-button modal-submit' onClick={() => this.handle_buyer_submit()} type="button">Buy</button>
                  <button className="modal-button modal-close" onClick={() => this.buyer_modalClose()}><i className="fas fa-times"></i></button>
                </div>
              </div>
          </Modal>

          <Modal show={this.state.show_setter_modal}>
              <div className="main-modal">
                <b>Change blocks</b>
                <div className="modal-form-group">
                  <input type="text"
                    id="buy_block_ids"
                    placeholder="Block id(s): 500,501,502"
                    onChange={ (e)  => {this.setState({set_modal_pixels: e.target.value})}}
                    name="modalInputName"/>
                  <input type="text"
                    id="buy_colour_ids"
                    placeholder="Block colours(s): 0x111111,0x2222220,333333"
                    onChange={ (e)  => {this.setState({set_modal_colours: e.target.value})}}
                    name="modalInputName"/>
                </div>
                <div className="modal-button-row">
                  <button className='modal-button modal-submit' onClick={() => this.handle_setter_submit()} type="button">Set</button>
                  <button className="modal-button modal-close" onClick={() => this.setter_modalClose()}><i className="fas fa-times"></i></button>
                </div>
              </div>
          </Modal>

            <div className = "content-container">
              <div className = "column">
                <div className = "side-box blue-box big-box">
                  <b> Stats </b>
                  <p>Purchased blocks: { this.state.stats.purchased } < br/>
                    Available blocks: { this.state.stats.available } <br/>
                    Block price: 0.4 MATIC
                  </p>
                </div>
                <div className="middle-col">
                  <div className = "side-box purple-box">
                    <b> About </b>
                  </div>
                  <div className = "side-box red-box">
                    <b> How to use </b>
                  </div>
                </div>
                <div className = "side-box special-box big-box">
                  <b>Other stuff </b>
                  <p>
                    <i className = "fas fa-envelope"></i> me@polypaint.io <br/>
                    <i className = "fab fa-twitter"></i> @maxdedeseng <br/>
                    ©2022 All rights reserved
                  </p>
                </div>
              </div>
              <div className = "column-separator"> </div>
              <div className = "column column-img" onMouseMove={(e) => {this.mouseOnGrid(e)}} onClick={(e) => {this.clickOnGrid(e)}}>
                <img src = { `${this.state.image.source}?${this.state.image.hash}` } alt = "THE_MAP"></img>
              </div>
              <div className = "column-separator"></div>
              <div className = "column">

              {(() => {
                if (this.state.connect_button_visibility) {
                  return (
                  <div className = "side-box blue-box right-correction clickable-box" onClick = {() => {this.loadContractData()}}><b>Connect Wallet</b></div>
                  )
                } else {
                  return (
                  <div className = "side-box blue-box right-correction clickable-box" onClick = {() => {console.log('smth');}}>
                    <b>{`${this.state.account.slice(0, 5)}...${this.state.account.slice(38, 42)}`}</b></div>
                  )}})()}
                  <div className="middle-col">
                    <div className = "side-box purple-box"
                      style = {this.state.web3_enabled ? {color: 'black', cursor: 'pointer'} : {color: 'grey'}}
                      onClick={() => {if (this.state.web3_enabled) {this.buyer_modalOpen()}}}>
                      <b> Buy blocks </b>
                    </div>
                    <div className = "side-box red-box" style = {this.state.web3_enabled ? {color: 'black', cursor: 'pointer'} : {color: 'grey'}}
                    onClick={() => {if (this.state.web3_enabled) {this.setter_modalOpen()}}}>
                      <b> Set colours </b>
                    </div>
                </div>
                <div className = "side-box green-box big-box info-box">
                  <b> Block info </b>
                  <p>
                    Id: {this.state.hovering_pixel.id_long} @ {this.state.hovering_pixel.id_short.x}, {this.state.hovering_pixel.id_short.y} <br/>
                    Hex colour: {this.state.hovering_pixel.hex_colour} <br/>
                    Link: {this.state.hovering_pixel.link}
                  </p>
                </div>
              </div>
            </div>
          </div>
    );
};
}

export default App;
