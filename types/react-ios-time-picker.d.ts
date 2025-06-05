declare module 'react-ios-time-picker' {
  interface TimePickerProps {
    value?: string;
    onChange: (value: string) => void;
    use24Hour?: boolean;
    cellHeight?: number;
    theme?: {
      background?: string;
      border?: string;
      primary?: string;
      secondary?: string;
      text?: string;
      selectionBackground?: string;
      selectionText?: string;
    };
    height?: number | string;
    width?: number | string;
    disabled?: boolean;
    cancelButton?: string;
    confirmButton?: string;
    onCancel?: () => void;
    onConfirm?: () => void;
  }

  const TimePicker: React.FC<TimePickerProps>;
  export default TimePicker;
}
