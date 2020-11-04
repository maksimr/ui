import { act } from 'react-dom/test-utils';
import { render } from 'react-dom';
import React from 'react';
import { StoreLayer, useStore } from './StoreLayer';
import { Store } from '../Store';
describe('StoreLayer', function () {
    let rootNode;
    let store;
    beforeEach(function () {
        rootNode = document.createElement('div');
        store = new Store({ counter: 0 }, (state, fn) => fn(state));
    });
    it('should pass store to components', function () {
        act(() => {
            render(React.createElement(StoreLayer, { store: store },
                React.createElement(Foo, null)), rootNode);
        });
        expect(rootNode.querySelector('b').innerHTML).toEqual('0');
    });
    it('should redraw component on store`s state change', function () {
        act(() => {
            render(React.createElement(StoreLayer, { store: store },
                React.createElement(Foo, null)), rootNode);
        });
        act(() => {
            store.swap((state) => ({ counter: state.counter + 1 }));
        });
        expect(rootNode.querySelector('b').innerHTML).toEqual('1');
    });
    it('should update store state from a component', function () {
        act(() => {
            render(React.createElement(StoreLayer, { store: store },
                React.createElement(Foo, null)), rootNode);
        });
        act(() => {
            rootNode.querySelector('button')
                .dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(rootNode.querySelector('b').innerHTML).toEqual('1');
    });
    it('should redraw only components which store state has changed', function () {
        const qa = (state) => state.a;
        const qb = (state) => state.b;
        // noinspection JSValidateTypes
        /**
         * @type {function(): JSX.Element}
         */
        const App = jest.fn(() => React.createElement("div", null,
            React.createElement(A, null),
            React.createElement(B, null)));
        // noinspection JSValidateTypes
        /**
         * @type {function(): JSX.Element}
         */
        const A = jest.fn(() => {
            useStore(qa);
            return React.createElement("div", null);
        });
        // noinspection JSValidateTypes
        /**
         * @type {function(): JSX.Element}
         */
        const B = jest.fn(() => {
            useStore(qb);
            return React.createElement("div", null);
        });
        store.swap(() => ({ a: '', b: '' }));
        act(() => {
            render(React.createElement(StoreLayer, { store: store },
                React.createElement(App, null)), rootNode);
        });
        expect(App).toHaveBeenCalledTimes(1);
        expect(A).toHaveBeenCalledTimes(1);
        expect(B).toHaveBeenCalledTimes(1);
        act(() => {
            store.swap((state) => (Object.assign(Object.assign({}, state), { b: 'change' })));
        });
        expect(App).toHaveBeenCalledTimes(1);
        expect(A).toHaveBeenCalledTimes(1);
        expect(B).toHaveBeenCalledTimes(2);
    });
    function Foo() {
        const [state, setState] = useStore();
        return (React.createElement("div", null,
            React.createElement("button", { onClick: () => setState((state) => ({ counter: state.counter + 1 })) }),
            React.createElement("b", null, state.counter)));
    }
});
