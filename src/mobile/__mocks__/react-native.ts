/**
 * Minimal stubs for react-native APIs used by mobile services.
 * Only stubs what the service layer actually imports.
 *
 * NOTE: Maps RN prop semantics to DOM-safe equivalents to avoid
 * React controlled-input warnings in test environments.
 */
import React from 'react';

/** Props safe to forward to HTML elements */
const SAFE_HTML_PROPS = new Set([
  'id', 'className', 'style', 'placeholder', 'value', 'type',
  'disabled', 'checked', 'readOnly', 'autoComplete',
  'defaultValue',
]);

/**
 * RN-to-DOM prop mappings.
 *
 * `onValueChange` → `onChange` (Switch sends checked state)
 * `onChangeText`  → `onChange` (TextInput sends string value)
 * `onPress`       → `onClick` (TouchableOpacity)
 * `editable`      → `!readOnly` (inverted)
 * `enabled`       → `!disabled` (inverted)
 */
function createPrimitive(tag: string) {
  return ({ children, ...props }: any) => {
    const safeProps: Record<string, any> = {};
    let hasOnChange = false;

    for (const key of Object.keys(props)) {
      const val = props[key];

      if (key === 'onPress' && typeof val === 'function') {
        safeProps.onClick = val;
        continue;
      }

      if (key === 'onChangeText' && typeof val === 'function') {
        hasOnChange = true;
        safeProps.onChange = (event: any) => val(event?.target?.value ?? '');
        continue;
      }

      if (key === 'onValueChange' && typeof val === 'function') {
        hasOnChange = true;
        safeProps.onChange = (event: any) => val(event?.target?.checked ?? false);
        continue;
      }

      if (key === 'onChange' && typeof val === 'function') {
        safeProps.onChange = val;
        continue;
      }

      if (key === 'editable') {
        safeProps.readOnly = !val;
        continue;
      }

      if (key === 'enabled') {
        safeProps.disabled = !val;
        continue;
      }

      if (
        SAFE_HTML_PROPS.has(key) &&
        (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')
      ) {
        safeProps[key] = val;
        continue;
      }
    }

    // Suppress controlled-input warning for value/checked without onChange
    if (tag === 'input' && !hasOnChange && ('value' in safeProps || 'checked' in safeProps)) {
      safeProps.readOnly = true;
    }

    return React.createElement(tag, safeProps, children);
  };
}

export const View = createPrimitive('div');
export const Text = createPrimitive('span');
export const ScrollView = createPrimitive('div');
export const KeyboardAvoidingView = createPrimitive('div');
export const TouchableOpacity = createPrimitive('button');
export const TextInput = createPrimitive('input');
export const ActivityIndicator = createPrimitive('span');
export const RefreshControl = createPrimitive('div');

/** Switch renders as type=checkbox with value→checked mapping */
export const Switch = ({ children, value, ...props }: any) => {
  return createPrimitive('input')({
    children,
    type: 'checkbox',
    checked: value,
    ...props,
  });
};

/** FlatList renders data items using renderItem, plus header/empty components */
export const FlatList = ({ data, renderItem, ListHeaderComponent, ListEmptyComponent, keyExtractor, ...rest }: any) => {
  const header = ListHeaderComponent
    ? (typeof ListHeaderComponent === 'function' ? React.createElement(ListHeaderComponent) : ListHeaderComponent)
    : null;
  const items = Array.isArray(data) && renderItem
    ? data.map((item: any, index: number) => {
        const key = keyExtractor ? keyExtractor(item, index) : (item?.id ?? String(index));
        return React.createElement(React.Fragment, { key }, renderItem({ item, index }));
      })
    : null;
  const empty = (!data || data.length === 0) && ListEmptyComponent
    ? (typeof ListEmptyComponent === 'function' ? React.createElement(ListEmptyComponent) : ListEmptyComponent)
    : null;
  return React.createElement('div', {}, header, items, empty);
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
  flatten: (style: unknown) => style,
};

export const Linking = {
  addEventListener: jest.fn(),
  getInitialURL: jest.fn(async () => null),
};

export const Alert = {
  alert: jest.fn(),
};

export const Platform = {
  OS: 'ios' as const,
  select: jest.fn((obj: Record<string, unknown>) => obj.ios),
};
