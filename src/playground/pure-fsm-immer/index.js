import { createMachine, interpret } from '../../packages/fsm';
import { assign, createUpdater } from '../../packages/fsm-immer';

const levelUpdater = createUpdater('UPDATE_LEVEL', (ctx, { input }) => {
  ctx.level = input;
});

const toggleMachine = createMachine({
  id: 'toggle',
  context: {
    count: 0,
    level: 0
  },
  initial: 'inactive',
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: 'active',
          // Immutably update context the same "mutable"
          // way as you would do with Immer!
          actions: assign((ctx) => ctx.count++)
        }
      }
    },
    active: {
      on: {
        TOGGLE: {
          target: 'inactive'
        },
        // Use the updater for more convenience:
        [levelUpdater.type]: {
          actions: levelUpdater.action
        }
      }
    }
  }
});

const toggleService = interpret(toggleMachine);

toggleService.subscribe((state) => {
  console.log(state.context);
});

toggleService.start();

toggleService.send('TOGGLE');
// { count: 1, level: 0 }

toggleService.send(levelUpdater.update(9));
// { count: 1, level: 9 }

toggleService.send('TOGGLE');
// { count: 2, level: 9 }

toggleService.send(levelUpdater.update(-100));
// Notice how the level is not updated in 'inactive' state:
// { count: 2, level: 9 }