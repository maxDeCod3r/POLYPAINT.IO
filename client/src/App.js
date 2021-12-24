import React, { Component } from 'react';
import './App.css';
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
            window.alert("Non ethereum browser detected, cannot access Metamask")
        }
    }

    async testApiCall() {
        fetch("/api")
            .then((res) => res.json())
            .then((data) => console.log(data));
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
        await this.testApiCall()
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
    }


    render() {
        return ( <
                div className = "App" >
                <
                nav className = "container" >
                <
                h1 style = {
                    { color: 'white' }
                } >
                Hello World!
                <
                /h1> {
                (() => {
                    if (this.state.connect_button_visibility) {
                        return ( < button id = "connect_wallet"
                            className = "btn btn-block btn-primary"
                            onClick = {
                                () => { this.loadBlockchainData() }
                            } > Connect wallet < /button>
                        );
                    } else {
                        return ( <
                            div >
                            <
                            p style = {
                                { color: 'white' }
                            } >
                            Account: { this.state.account } <
                            /p> <
                            p style = {
                                { color: 'white' }
                            } >
                            Network: { this.state.network } <
                            /p> < /
                            div >
                        )
                    }
                })()
            } <
            /nav> < /
        div >
    );
};
}

export default App;