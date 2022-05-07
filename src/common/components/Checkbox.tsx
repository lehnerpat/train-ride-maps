import { FC } from "react";
import styled from "styled-components";
import { UseState } from "../utils/state-utils";

interface CheckboxProps {
  id: string;
  checkedState: UseState<boolean>;
  children?: React.ReactNode;
}
export const Checkbox: FC<CheckboxProps> = ({ id, checkedState: [isChecked, setChecked], children }) => (
  <label htmlFor={id}>
    <CheckboxInputElement
      type="checkbox"
      id={id}
      checked={isChecked}
      onChange={(ev) => {
        setChecked(ev.target.checked);
      }}
    />
    <span>{children}</span>
  </label>
);

const CheckboxInputElement = styled.input`
  margin: 2px 5px;
`;
