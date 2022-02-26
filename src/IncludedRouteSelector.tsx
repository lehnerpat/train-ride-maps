import { FC, useState } from "react";
import styled from "styled-components";
import { Panel } from "./common-components/Panel";
import { IncludedData } from "./included-data";
import { Link } from "wouter";
import { PageRouting } from "./page-routing";
import { RouteLocalStorageService } from "./common-components/RouteLocalStorageServiceImpl";

interface IncludedDataSelectorProps {}
export const IncludedRouteSelector: FC<IncludedDataSelectorProps> = () => {
  const [localRoutes, setLocalRoutes] = useState(listLocalRoutes());

  return (
    <Panel>
      <h3>Example routes:</h3>
      <ul>
        {IncludedData.map((r) => (
          <li key={r.uuid}>
            <RouteLink href={PageRouting.viewRoutePage(r.uuid)}>{r.title}</RouteLink>
          </li>
        ))}
      </ul>
      {localRoutes && localRoutes.length > 0 && (
        <>
          <h3>Routes saved in browser:</h3>
          <ul>
            {localRoutes.map((r) => (
              <li key={r.uuid}>
                <RouteLink href={PageRouting.viewRoutePage(r.uuid)}>{r.title}</RouteLink>{" "}
                <DeleteItemLink
                  href="#"
                  onClick={() => {
                    RouteLocalStorageService.delete(r.uuid);
                    setLocalRoutes(listLocalRoutes());
                  }}
                >
                  (Delete this)
                </DeleteItemLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
};

const RouteLink = styled(Link)`
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

const DeleteItemLink = styled.a`
  &,
  &:visited {
    color: #bbb;
    font-size: 80%;
  }

  &:hover,
  &:focus,
  &:active {
    color: #ffbbbb;
  }
`;

function listLocalRoutes() {
  return RouteLocalStorageService.getList();
}
