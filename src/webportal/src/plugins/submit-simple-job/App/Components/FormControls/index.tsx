export interface IFormControlProps<V> {
  children?: string;
  className?: string;
  value?: V;
  onChange?(value: V): void;
}
