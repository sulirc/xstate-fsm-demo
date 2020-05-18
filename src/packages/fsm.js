/**
 * Formally, finite state machines have five parts
 * 
 * A finite number of states
 * A finite number of events
 * An initial state
 * A transition function that determines the next state given the current state and event
 * A (possibly empty) set of final states
 * 
 * ———— https://xstate.js.org/docs/about/concepts.html
 */

// 解释器状态
const INTERPRETER_STATUS = {
  NotStarted: 0,
  Running: 1,
  Stopped: 2
};
// 内部状态机初始事件（目前并无它用）
const INIT_EVENT = { type: 'xstate.init' };
// 内部状态机赋值事件
const ASSIGN_ACTION = 'xstate.assign';

/**
 * 支持特性：cond, action, context, state
 * 状态机是纯函数，transition 后每次返回一个新的状态机
 * @param {*} fsmConfig 状态机配置
 */
export function createMachine(fsmConfig) {
  const machine = {
    config: fsmConfig,
    // 初始状态节点
    initialState: {
      value: fsmConfig.initial,
      actions: toArray(fsmConfig.states[fsmConfig.initial].entry),
      context: fsmConfig.context
    },
    transition: FSMStateTransition
  };

  function FSMStateTransition(state, event) {
    const { value, context } = toStateObject(state, fsmConfig.context);
    const eventObject = toEventObject(event);
    const stateConfig = fsmConfig.states[value];

    // 处理状态过渡事件
    if (stateConfig.on) {
      // 状态节点的所有过渡配置
      const transitions = toArray(stateConfig.on[eventObject.type]);

      for (const transition of transitions) {
        if (transition === undefined) {
          return createUnchangedState(value, context);
        }

        const { target = value, actions = [], cond = () => true } =
          typeof transition === 'string' ? { target: transition } : transition;

        let nextContext = context;

        // 条件断言，真值才可执行 action & transition
        if (cond(context, eventObject)) {
          let assigned = false;

          const nextStateConfig = fsmConfig.states[target];
          const actionsWillTrigger = []
            // 合并上个状态节点的出口 Action 函数，当前节点的 Action 函数，下个节点的入口 Action 函数
            .concat(
              stateConfig.exit, actions, nextStateConfig.entry
            )
            // 过滤假值
            .filter(a => a)
            // 兼容为对象模式
            .map(toActionObject)
            // 执行 assign 操作
            .filter(action => {
              if (action.type === ASSIGN_ACTION) {
                let tmpContext = Object.assign({}, nextContext);

                // 兼容函数或对象模式
                if (typeof action.assignment === 'function') {
                  tmpContext = action.assignment(nextContext, eventObject);
                } else {
                  Object.keys(action.assignment).forEach(key => {
                    tmpContext[key] =
                      typeof action.assignment[key] === 'function'
                        ? action.assignment[key](nextContext, eventObject)
                        : action.assignment[key];
                  });
                }

                // 更新上下文
                nextContext = tmpContext;
                assigned = true;
              }
              return true;
            });
          
          // 新的状态节点
          return {
            value: target,
            context: nextContext,
            actions: actionsWillTrigger,
            changed: target !== value || actionsWillTrigger.length > 0 || assigned
          }
        }
      }
    }

    // 未变更的状态节点
    return createUnchangedState(value, context);
  }

  return machine;
}

/**
 * 解释服务，用以表达副作用
 * @param {*} machine 
 */
export function interpret(machine) {
  const listeners = new Set();

  let state = machine.initialState;
  let status = INTERPRETER_STATUS.NotStarted;

  const service = {
    _machine: machine,
    // 发送事件
    send(event) {
      if (status !== INTERPRETER_STATUS.Running) {
        return;
      }
      state = machine.transition(state, event);
      // 非纯函数，直接修改上下文
      handleStateChanged(state, toEventObject(event));

      // 执行事件，或表达副作用
      listeners.forEach(listener => listener(state));
    },
    // 订阅
    subscribe(listener) {
      listeners.add(listener);
      listener(state);

      return {
        unsubscribe: () => listeners.delete(listener)
      }
    },
    // 启动服务，同时执行初始化事件
    start() {
      status = INTERPRETER_STATUS.Running;
      handleStateChanged(state, INIT_EVENT);

      return service;
    },
    // 暂停服务，同时清空所有订阅
    stop() {
      status = INTERPRETER_STATUS.Stopped;
      listeners.clear();

      return service;
    },
    get state() {
      return state;
    },
    get status() {
      return status;
    }
  };

  return service;
}

export function assign(assignment) {
  return {
    type: ASSIGN_ACTION,
    assignment
  }
}

function handleStateChanged(state, event) {
  state.actions.forEach(({ exec }) => {
    exec && exec(state.context, event);
  });
}


function toArray(item) {
  return item === undefined ? [] : [].concat(item);
}

function toStateObject(state, context) {
  switch (typeof state) {
    case 'string':
      return {
        value: state, context,
      }
    default:
      return state;
  }
}

function toEventObject(event) {
  switch (typeof event) {
    case 'string':
      return {
        type: event,
      }
    default:
      return event;
  }
}

function toActionObject(action) {
  switch (typeof action) {
    case 'function':
      return {
        type: action.name,
        exec: action
      }
    default:
      return action;
  }
}

function createUnchangedState(value, context) {
  return {
    value, context, actions: [], changed: false
  };
}