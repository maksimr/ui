import { act } from 'react-dom/test-utils';
import { render } from 'react-dom';
import React from 'react';
import { useStateWithCallback } from './useStateWithCallback';

describe('useStateWithCallback', function() {
  let rootNode;
  beforeEach(function() {
    rootNode = document.createElement('div');
  });

  it('should call callback after state update', function() {
    const callback = jest.fn();

    function Foo() {
      const [state, setState] = useStateWithCallback(0);
      return <button onClick={() => setState(1, callback)}>{state}</button>;
    }

    act(() => {
      render(<Foo/>, rootNode);
    });
    act(() => {
      rootNode.querySelector('button').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should correctly work without callback', function() {
    function Foo() {
      const [state, setState] = useStateWithCallback(0);
      return <button onClick={() => setState(1)}>{state}</button>;
    }

    act(() => {
      render(<Foo/>, rootNode);
    });

    const buttonNode = rootNode.querySelector('button');
    act(() => {
      buttonNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(buttonNode.innerHTML).toEqual("1");
  });
});