import { createMachine as Machine, assign } from '@xstate/fsm';

const STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  GIFT_RANK_ROW: 'rank_gift_row',
  GIFT_RANK_LIST: 'rank_gift_list',
  DURATION_RANK_ROW: 'rank_duration_row',
  DURATION_RANK_LIST: 'rank_duration_list',
};

const RelationChainMachine = Machine({
  id: 'relation-chain',
  initial: STATE.IDLE,
  context: {
    users: [],
    hasReceiveGift: false,
  },
  states: {
    [STATE.IDLE]: {
      on: {
        LOAD: STATE.LOADING,
      },
    },
    [STATE.LOADING]: {
      entry: assign({
        users: (_ctx, evt) => evt.users,
        hasReceiveGift: (_ctx, evt) => evt.hasReceiveGift,
      }),
      on: {
        AUTO_SELECT: [
          { target: STATE.GIFT_RANK_ROW, cond: ctx => ctx.hasReceiveGift && ctx.users.length > 3 },
          { target: STATE.GIFT_RANK_LIST, cond: ctx => ctx.hasReceiveGift && ctx.users.length > 0 },
          { target: STATE.DURATION_RANK_ROW, cond: ctx => !ctx.hasReceiveGift && ctx.users.length > 3 },
          { target: STATE.DURATION_RANK_LIST, cond: ctx => !ctx.hasReceiveGift && ctx.users.length > 0 },
          { target: STATE.IDLE }
        ]
      },
    },
    [STATE.GIFT_RANK_ROW]: {},
    [STATE.GIFT_RANK_LIST]: {},
    [STATE.DURATION_RANK_ROW]: {},
    [STATE.DURATION_RANK_LIST]: {},
  }
});

export default RelationChainMachine;