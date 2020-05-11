import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import useMachine from './useMachine';
import RelationChainMachine from './fsm';

window.DEV_ENV = 1;

function App() {
  const [state, send] = useMachine(RelationChainMachine);

  useEffect(() => {
    send({ type: 'LOAD', users: [1, 2, 3,], hasReceiveGift: false });
    send({ type: 'AUTO_SELECT' });
    // window.serviceSend = send;
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
