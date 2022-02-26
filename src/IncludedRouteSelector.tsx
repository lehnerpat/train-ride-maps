import { FC } from "react";
import styled from "styled-components";
import { Panel } from "./common-components/Panel";
import { IncludedData } from "./included-data";
import { Link } from "wouter";
import { PageRouting } from "./page-routing";

interface IncludedDataSelectorProps {}
export const IncludedRouteSelector: FC<IncludedDataSelectorProps> = () => (
  <Panel>
    <h3>Example routes:</h3>
    <ul>
      {IncludedData.map((r, idx) => (
        <li>
          <IncludedRouteLink href={PageRouting.viewRoutePage(r.uuid)} key={idx}>
            {r.title}
          </IncludedRouteLink>
        </li>
      ))}
    </ul>
  </Panel>
);

const IncludedRouteLink = styled(Link)`
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
