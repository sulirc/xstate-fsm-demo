import React, { useEffect, useState, useContext, useCallback } from 'react';
import { createMachine as Machine, assign } from '@xstate/fsm';
import useMachine from './useMachine';
import './App.css';

function getId() {
  return Math.random().toString(16).slice(2, 10);
}

function fetchListData() {
  const mockData = [
    { title: 'apple', desc: 'apple is fruit.' },
    { title: 'beef', desc: 'beef is meat!' },
    { title: 'desktop', desc: 'desktop is furniture' },
  ];
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        resolve(mockData.map(item => ({ ...item, id: getId() })));
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

const AppContext = React.createContext({
  context: {},
  setContext: () => { }
});

function useAppContext() {
  const [context, setContext] = useState(appMachine.config.context);
  const setCurrentContext = useCallback(ctx => {
    setContext(ctx);
  }, [])
  return { context, setCurrentContext };
}

function List(props) {
  const { theme } = props;
  const { list, id } = useContext(AppContext);
  return (
    <div className="list">
      id: {id}
      {
        list.map(item => <Item key={item.id} {...item} />)
      }
    </div>
  );
}

function Item(props) {
  return (
    <div className="item">
      <p>title: {props.title}</p>
      <p>description: {props.desc}</p>
    </div>
  )
}

function App() {
  const { context, setCurrentContext } = useAppContext();
  const [state, send, service] = useMachine(appMachine);

  useEffect(() => {
    service.subscribe(currentState => {
      if (currentState.changed) {
        console.log('[currentState context]', currentState.context);
        setCurrentContext(currentState.context);
      }
    });

    send({ type: 'LOAD', id: getId() });

    const loadingTimer = setInterval(() => {
      send({ type: 'PENDING' });
    }, 1000);

    fetchListData()
      .then((res) => {
        send({ type: 'SUCCESS', listData: res });
      })
      .catch(err => {
        send({ type: 'FAIL', error: err });
      })
      .finally(() => {
        clearInterval(loadingTimer);
      });

  }, [send, service, setCurrentContext]);

  return (
    <AppContext.Provider value={context}>
      <div className="App">
        <List theme={context.theme} />
        { state.matches('failure') && context.error }
      </div>
    </AppContext.Provider>
  );
}

export default App;
