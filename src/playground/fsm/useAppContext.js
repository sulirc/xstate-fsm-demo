import { useState, useCallback } from 'react';

export default function useAppContext(targetContext) {
  const [context, setContext] = useState(targetContext);
  const setCurrentContext = useCallback(newContext => {
    setContext({
      ...context,
      ...newContext
    });
  }, [context])
  return { context, setCurrentContext };
}
