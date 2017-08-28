import StateMachine from 'javascript-state-machine';

export default (init = 'new') => {
  const fsm = new StateMachine({
    init,
    transitions: [
      { name: 'atWork', from: 'new', to: 'atWork' },
      { name: 'testing', from: 'atWork', to: 'testing' },
      { name: 'atWork', from: 'testing', to: 'atWork' },
      { name: 'finshed', from: 'testing', to: 'finished' },
    ],
  });
  return fsm;
};
