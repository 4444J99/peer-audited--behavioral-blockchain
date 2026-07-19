import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { CameraScreen } from './CameraScreen';

const mockCameraModule = jest.fn(({ contractId }: { contractId?: string }) => (
  <div>{`camera-module:${contractId ?? 'none'}`}</div>
));

jest.mock('../components/CameraModule', () => ({
  CameraModule: (props: { contractId?: string }) => mockCameraModule(props),
}));

describe('CameraScreen', () => {
  beforeEach(() => {
    mockCameraModule.mockClear();
  });

  it('prefills contract ID from route params', () => {
    const { getByDisplayValue, getByText } = render(
      <CameraScreen route={{ params: { contractId: 'contract-42' } }} />,
    );

    expect(getByDisplayValue('contract-42')).toBeTruthy();
    expect(getByText('camera-module:contract-42')).toBeTruthy();
  });

  it('passes trimmed contract ID into CameraModule', () => {
    const { getByPlaceholderText, getByText } = render(<CameraScreen />);

    const contractInput = getByPlaceholderText('Contract ID');
    fireEvent.change(contractInput, { target: { value: '   contract-99   ' } });

    expect(getByText('camera-module:contract-99')).toBeTruthy();
  });

  it('passes undefined contract ID when the field is empty', () => {
    const { getByText } = render(<CameraScreen />);
    expect(getByText('camera-module:none')).toBeTruthy();
  });

  it('renders live-capture guidance text', () => {
    const { container } = render(<CameraScreen />);
    expect(container.textContent).toContain('Live Proof Capture');
    expect(container.textContent).toContain('Gallery uploads are disabled');
  });
});
