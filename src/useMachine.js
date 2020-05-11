import { useState, useEffect, useRef } from 'react';
import { interpret } from '@xstate/fsm';

function useConstant(fn = () => { }) {
  const ref = useRef();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
}

export default function useMachine(machine) {
  const service = useConstant(() => interpret(machine).start());
  const [state, setState] = useState(service.state);

  service.historyMatches = states => {
    if (!service.historyStates) {
      return false;
    }

    const targetValues = states.split('/').reverse();
    const values = service.historyStates.map(state => state.value).reverse();

    for (let i = 0; i < targetValues.length; i++) {
      if (values[i] !== targetValues[i]) {
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    service.historyStates = [state];
    service.subscribe(currentState => {
      if (currentState.changed) {
        service.historyStates.push(currentState);
        setState(currentState);
      }
    });

    setState(service.state);

    return () => {
      service.historyStates = [];
      service.stop();
    };
  },
    // eslint-disable-next-line
    []
  );

  return [state, service.send, service];
}