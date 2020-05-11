import React, { useEffect, useReducer } from 'react';
import { createMachine as Machine } from '@xstate/fsm';
import useMachine from './useMachine';

function fetchListData(id) {
  const mockData = [
    { title: 'apple', text: 'apple is fruit.' },
    { title: 'beef', text: 'beef is meat!' },
    { title: 'desktop', text: 'desktop is furniture' },
  ];
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(mockData);
    });
  })
}

const appMachine = Machine({
  initial: 'idle',
  context: {
    id: null,
    theme: 'night',
    list: []
  },
  states: {
    idle: {
      on: {
        LOAD: 'loading'
      }
    },
    loading: {
      on: {
        SUCCESS: 'loaded',
        FAIL: 'failure'
      }
    },
    loaded: {
      type: 'final',
    },
    failure: {
      type: 'final',
    }
  }
});


const AppContext = React.createContext(appMachine.config.context);

function List() {

}

function Item() {

}

function App() {
  // const [state, send, service] = useMachine(appMachine);
  return (
    <div className="App">

    </div>
  );
}

export default App;
