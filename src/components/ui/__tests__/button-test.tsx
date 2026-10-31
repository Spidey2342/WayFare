import { fireEvent, render } from '@testing-library/react-native';

import { Button } from '../Button';

describe('Button', () => {
  test('calls onPress', async () => {
    const onPress = jest.fn();
    const view = await render(<Button label="Get started" onPress={onPress} />);
    fireEvent.press(view.getByRole('button', { name: 'Get started' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const view = await render(<Button label="Continue" disabled onPress={onPress} />);
    fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('exposes a busy state while loading', async () => {
    const view = await render(<Button label="Save" loading />);
    expect(view.getByRole('button', { name: 'Save' }).props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
  });
});
