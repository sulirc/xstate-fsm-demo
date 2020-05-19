import { produce } from 'immer';
import { assign as xstateAssign } from './fsm';

function immerAssign(recipe) {
  return xstateAssign((context, event) => {
    return produce(context, draft => {
      recipe(draft, event);
    });
  });
}

export { immerAssign as assign };
export function createUpdater(type, recipe) {
  return {
    update: input => ({
      type, input
    }),
    action: immerAssign(recipe),
    type
  }
}