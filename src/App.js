import React, { useEffect, useContext } from 'react';
import { createMachine as Machine, assign, interpret } from '@xstate/fsm';
import { classNames, getId, fetchListData } from './utils';
import useMachine from './useMachine';
import useAppContext from './useAppContext';
import './App.css';

export const appMachine = Machine({
  // 应用初始状态
  initial: 'idle',
  // 应用的上下文
  context: {
    id: null,
    theme: 'light',
    list: [],
    timestamp: new Date().getTime(),
    error: null
  },
  // 应用的所有状态 idle, loading, loaded, failure
  states: {
    idle: {
      on: {
        // 监听 LOAD 事件，从 idle 状态过渡到 loading
        LOAD: {
          target: 'loading',
          // 触发此事件时修改上下文 context
          actions: assign({
            id: (_ctx, evt) => evt.id
          })
        }
      }
    },
    loading: {
      on: {
        // 监听 SUCCESS 事件，从 loading 状态过渡到 loaded
        SUCCESS: {
          target: 'loaded',
          // 触发此事件时修改上下文 context
          actions: assign({
            list: (_ctx, evt) => evt.listData
          })
        },
        // 监听 FAIL 事件，从 loading 状态过渡到 failure
        FAIL: {
          target: 'failure',
          // 触发此事件时修改上下文 context
          actions: assign({
            list: () => [],
            error: (_ctx, evt) => evt.error
          })
        },
        // 监听 PENDING 事件，重复触发 loading 状态
        PENDING: {
          target: 'loading',
          // 触发此事件时修改上下文 context
          actions: assign({
            timestamp: () => new Date().getTime()
          })
        }
      }
    },
    loaded: {
      // 应用最终状态
      type: 'final',
    },
    failure: {
      // 应用最终状态
      type: 'final',
    }
  }
});

// test single service
require('./singleService');

// 声明初始上下文
const AppContext = React.createContext({
  context: {},
  setContext: () => { }
});

function List(props) {
  const { theme } = props;
  // 使用上下文
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
  const { context, setCurrentContext } = useAppContext(appMachine.config.context);
  const [state, send, service] = useMachine(appMachine);

  useEffect(() => {
    service.subscribe(currentState => {
      if (currentState.changed) {
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
          Id: {context.id}, Current theme is {context.theme} <button onClick={() => {
            console.log('theme switch')
            if (context.theme === 'night') {
              setCurrentContext({ theme: 'light' });
            } else {
              setCurrentContext({ theme: 'night' })
            }
          }}>Theme Switch</button>
        </nav>

        {state.matches('loading') && <p className="loading-tip">loading... (timestamp {context.timestamp})</p>}
        {state.matches('loaded') && <List theme={context.theme} />}
        {state.matches('failure') && <p className="error-tip">{context.error}</p>}
      </div>
    </AppContext.Provider>
  );
}

export default App;

