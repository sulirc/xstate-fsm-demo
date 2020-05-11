import React, { useEffect, useState, useContext, useCallback } from 'react';
import { createMachine as Machine, assign } from '@xstate/fsm';
import { classNames } from './utils';
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
      if (Math.random() > 0.01) {
        resolve(mockData.map(item => ({ ...item, id: getId() })));
      } else {
        reject('Network error! Please retry')
      }
    }, 2000);
  })
}

const appMachine = Machine({
  initial: 'idle',
  context: {
    id: null,
    theme: 'light',
    list: [],
    timestamp: new Date().getTime(),
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
  const setCurrentContext = useCallback(newContext => {
    setContext({
      ...context,
      ...newContext
    });
  }, [context])
  return { context, setCurrentContext };
}

function List(props) {
  const { theme } = props;
  const { list } = useContext(AppContext);
  return (
    <div className={classNames('list', {
      'theme-night': theme === 'night',
      'theme-light': theme === 'light'
    })} >
      {
        list.map(item => <Item key={item.id} {...item} />)
      }
    </div>
  );
}

function Item(props) {
  return (
    <div className="item">
      <p className="title">Title: {props.title}</p>
      <p className="desc">Description: {props.desc}</p>
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
    }, 100);

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
        <nav>
          Current theme is {context.theme} <button onClick={() => {
            console.log('theme switch')
            if (context.theme === 'night') {
              setCurrentContext({ theme: 'light' });
            } else {
              setCurrentContext({ theme: 'night' })
            }
          }}>Theme Switch</button>
        </nav>

        {state.matches('loading') && <p className="loading-tip">loading... (timestamp {context.timestamp})</p> }
        {state.matches('loaded') && <List theme={context.theme} />}
        {state.matches('failure') && <p className="error-tip">{context.error}</p>}

      </div>
    </AppContext.Provider>
  );
}

export default App;
