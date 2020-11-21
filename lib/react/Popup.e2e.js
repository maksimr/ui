import { act } from 'react-dom/test-utils';
import { Popup } from './Popup';
import React from 'react';
import { screen } from "../../test/e2e/screen";

describe('Popup', function() {
  it('should position popup near anchor', async function() {
    act(() => {
      screen(
        <Anchor>
          <BoxPopup/>
        </Anchor>
      );
    });

    // @ts-ignore
    const image = await window.screenshot();
    // @ts-ignore
    await expectAsync(image).toMatchImageSnapshot();
  });

  it('should open popup at the top if not enough place at the bottom', async function() {
    act(() => {
      screen(
        <PositionedContainer style={{ overflow: 'hidden', height: 200 }}>
          <Anchor style={{ position: 'absolute', bottom: 0, left: 0 }}>
            <BoxPopup/>
          </Anchor>
        </PositionedContainer>
      );
    });

    // @ts-ignore
    const image = await window.screenshot();
    // @ts-ignore
    await expectAsync(image).toMatchImageSnapshot();
  });

  function BoxPopup() {
    return (
      <Popup>
        <Box/>
      </Popup>
    );
  }

  function Anchor({ children, style = {}, ...props }) {
    return (
      <div {...props} style={{ 'display': 'inline-block', ...style }}>
        <Box size={20}/>
        {children}
      </div>
    );
  }

  function PositionedContainer({ children, style = {}, ...props }) {
    return (
      <div {...props} style={{ 'position': 'relative', border: '1px solid blue', ...style }}>
        {children}
      </div>
    );
  }

  function Box({ size = 100, color = 'rgb(0,0,255)', width = size, height = size }) {
    return (
      <svg width={width} height={height} style={{ display: 'inline-flex' }}>
        <rect width={width} height={height} style={{ fill: color }}/>
      </svg>
    );
  }
});