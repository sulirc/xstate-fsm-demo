const hasOwn = {}.hasOwnProperty;

export function classNames() {
  const classes = [];

  for (let i = 0; i < arguments.length; i++) {
    const arg = arguments[i];
    if (!arg) {
      continue;
    }

    const argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = classNames.apply(null, arg);
        if (inner) {
          classes.push(inner);
        }
      }
    } else if (argType === 'object') {
      if (arg.toString !== Object.prototype.toString) {
        classes.push(arg.toString());
      } else {
        for (const key in arg) {
          if (hasOwn.call(arg, key) && arg[key]) {
            classes.push(key);
          }
        }
      }
    }
  }

  return classes.join(' ');
}

export function getId() {
  return Math.random().toString(32).slice(2, 10);
}

export function fetchListData() {
  const mockData = [
    { title: 'apple', desc: 'apple is fruit.' },
    { title: 'beef', desc: 'beef is meat!' },
    { title: 'desktop', desc: 'desktop is furniture' },
  ];
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.05) {
        resolve(mockData.map(item => ({ ...item, id: getId() })));
      } else {
        reject('Network error! Please retry')
      }
    }, 2000);
  })
}