import { FC } from "react";
import styled from "styled-components";
import { Panel } from "./components/Panel";
import { IncludedData } from "./included-data";
import { Route } from "./route-models";

interface IncludedDataSelectorProps {
  onRouteSelected: (route: Route) => void;
}
export const IncludedRouteSelector: FC<IncludedDataSelectorProps> = ({ onRouteSelected }) => (
  <Panel>
    <h3>Example routes:</h3>
    <ul>
      {IncludedData.map((r, idx) => (
        <li>
          <IncludedRouteLink
            href="#"
            key={idx}
            onClick={() => {
              onRouteSelected(r);
            }}
          >
            {r.title}
          </IncludedRouteLink>
        </li>
      ))}
    </ul>
  </Panel>
);

const IncludedRouteLink = styled.a`
  &,
  &:visited {
    color: #ddd;
  }

  &:hover,
  &:focus,
  &:active {
    color: white;
  }
`;
