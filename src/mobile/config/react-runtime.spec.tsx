import React, { useState } from 'react';
import { version as rendererVersion } from 'react-dom';
import { fireEvent, render, screen } from '@testing-library/react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}

describe('mobile React runtime isolation', () => {
  it('uses the mobile React version for the hoisted DOM test renderer', () => {
    expect(rendererVersion).toBe(React.version);
  });

  it('shares a hook dispatcher between components and the test renderer', () => {
    render(<Counter />);
    fireEvent.click(screen.getByRole('button', { name: 'Count: 0' }));
    expect(screen.getByRole('button', { name: 'Count: 1' })).toBeTruthy();
  });
});
