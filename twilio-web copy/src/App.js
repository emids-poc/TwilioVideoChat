import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import VideoComponent from './VideoComponent';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Twilio</h1>
        </header>
        <VideoComponent/>
      </div>
    );
  }
}

export default App;
