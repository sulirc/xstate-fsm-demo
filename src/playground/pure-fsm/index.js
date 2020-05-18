import { createMachine, interpret } from '../../packages/fsm';

// Stateless finite state machine definition
// machine.transition(...) is a pure function.
const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  context: {
    count: 0
  },
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { on: { TOGGLE: 'inactive' } }
  }
});

console.log('[toggleMachine]', toggleMachine);

const { initialState } = toggleMachine;

const toggledState = toggleMachine.transition(initialState, 'TOGGLE');
console.log('[toggleState]', toggledState);

const untoggledState = toggleMachine.transition(toggledState, 'TOGGLE');
console.log('[untoggledState]', untoggledState);

// interpret demo
const toggleService = interpret(toggleMachine).start();

toggleService.subscribe(state => {
  console.log('[subscribe]', state.value);
});

toggleService.send('TOGGLE');
// => logs 'active'

toggleService.send('TOGGLE');
// => logs 'inactive'

toggleService.stop();