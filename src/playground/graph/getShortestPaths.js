import { Machine } from 'xstate';
import { getShortestPaths } from '@xstate/graph';

const feedbackMachine = Machine({
  id: 'feedback',
  initial: 'question',
  states: {
    question: {
      on: {
        CLICK_GOOD: 'thanks',
        CLICK_BAD: 'form',
        CLOSE: 'closed',
        ESC: 'closed'
      }
    },
    form: {
      on: {
        SUBMIT: 'thanks',
        CLOSE: 'closed',
        ESC: 'closed'
      }
    },
    thanks: {
      on: {
        CLOSE: 'closed',
        ESC: 'closed'
      }
    },
    closed: {
      type: 'final'
    }
  }
});

const shortestPaths = getShortestPaths(feedbackMachine);

console.log(shortestPaths);