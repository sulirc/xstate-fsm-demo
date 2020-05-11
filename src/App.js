import React, { useEffect, useReducer, useCallback, useContext } from 'react';
import { createMachine as Machine, assign } from '@xstate/fsm';
import useMachine from './useMachine';
import './App.css';

function getId() {
  return Math.random().toString(16).slice(2, 10);
}

function fetchListData(id) {
  const mockData = [
    { title: 'apple', text: 'apple is fruit.' },
    { title: 'beef', text: 'beef is meat!' },
    { title: 'desktop', text: 'desktop is furniture' },
  ];
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        resolve(mockData.map(item => ({ ...item, id })));
      } else {
        reject('Network error! Please retry')
      }
    }, 3000);
  })
}

const appMachine = Machine({
  initial: 'idle',
  context: {
    id: null,
    theme: 'night',
    list: [],
    timestamp: 0,
    error: null
  },
  states: {
    idle: {
      on: {
        LOAD: {
          target: 'loading',
          actions: assign({
            id: (_ctx, evt) => evt.id
          })
        }
      }
    },
    loading: {
      on: {
        SUCCESS: {
          target: 'loaded',
          actions: assign({
            list: (_ctx, evt) => evt.listData
          })
        },
        FAIL: {
          target: 'failure', actions: assign({
            list: () => [],
            error: (_ctx, evt) => evt.error
          })
        },
        PENDING: {
          target: 'loading',
          actions: assign({
            timestamp: () => new Date().getTime()
          })
        }
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


function List(props) {
  return (
    <div className="list">
      <Item />
    </div>
  );
}

function Item(props) {
  return (
    <div className="item">
      item
    </div>
  )
}

function App() {
  const [state, send, service] = useMachine(appMachine);

  useEffect(() => {
    service.subscribe(currentState => {
      if (currentState.changed) {
        console.log(service.state.context);
      }
    });

    send({ type: 'LOAD', id: getId() });

    const loadingTimer = setInterval(() => {
      send({ type: 'PENDING' });
    }, 1000);

    fetchListData().then((res) => {
      send({ type: 'SUCCESS', listData: res });
    }).catch(err => {
      send({ type: 'FAIL', error: err });
    }).finally(() => {
      clearInterval(loadingTimer);
    })

  }, [send, service]);

  return (
    <div className="App">
      {state.value}
      <List />
    </div>
  );
}

export default App;
