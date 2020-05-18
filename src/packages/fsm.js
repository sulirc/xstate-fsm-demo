/**
 * Formally, finite state machines have five parts
 * 
 * A finite number of states
 * A finite number of events
 * An initial state
 * A transition function that determines the next state given the current state and event
 * A (possibly empty) set of final states
 */
const INTERPRETER_STATUS = {
  NotStarted: 0,
  Running: 1,
  Stopped: 2
};
const INIT_EVENT = { type: 'xstate.init' };
const ASSIGN_ACTION = 'xstate.assign';

// support feat: cond, action, context, state
export function createMachine(fsmConfig) {
  const machine = {
    config: fsmConfig,
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

    if (stateConfig.on) {
      const transitions = toArray(stateConfig.on[eventObject.type]);

      for (const transition of transitions) {
        if (transition === undefined) {
          return createUnchangedState(value, context);
        }

        const { target = value, actions = [], cond = () => true } =
          typeof transition === 'string' ? { target: transition } : transition;

        let nextContext = context;

        if (cond(context, eventObject)) {
          let assigned = false;

          const nextStateConfig = fsmConfig.states[target];
          const actionsWillTrigger = []
            .concat(
              stateConfig.exit, actions, nextStateConfig.entry
            )
            .filter(a => a)
            .map(toActionObject)
            .filter(action => {
              if (action.type === ASSIGN_ACTION) {
                let tmpContext = Object.assign({}, nextContext);

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

                nextContext = tmpContext;
                assigned = true
              }
              return true;
            });

          return {
            value: target,
            context: nextContext,
            actions: actionsWillTrigger,
            changed: target !== value || actionsWillTrigger.length > 0 || assigned
          }
        }
      }
    }

    return createUnchangedState(value, context);
  }

  return machine;
}

export function interpret(machine) {
  const listeners = new Set();

  let state = machine.initialState;
  let status = INTERPRETER_STATUS.NotStarted;

  const service = {
    _machine: machine,
    send(event) {
      if (status !== INTERPRETER_STATUS.Running) {
        return;
      }
      state = machine.transition(state, event);
      handleStateChanged(state, toEventObject(event));

      listeners.forEach(listener => listener(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);

      return {
        unsubscribe: () => listeners.delete(listener)
      }
    },
    start() {
      status = INTERPRETER_STATUS.Running;
      handleStateChanged(state, INIT_EVENT);

      return service;
    },
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