import { FC, useState } from "react";
import styled from "styled-components";
import { Panel } from "../../common-components/Panel";
import { IncludedDataV2 as IncludedData } from "../../included-data";
import { Link } from "wouter";
import { PageRouting } from "../../page-routing";
import { TrackLocalStorageService } from "../../track-models/NewTrackLocalStorageService";

export const IncludedTrackSelector: FC = () => {
  const [localTracks, setLocalTracks] = useState(listLocalTracks());

  return (
    <Panel>
      <h3>Example tracks:</h3>
      <ul>
        {IncludedData.map((r) => (
          <li key={r.uuid}>
            <TrackLink href={PageRouting.viewTrackPageV2(r.uuid)}>{r.title}</TrackLink>
          </li>
        ))}
      </ul>
      {localTracks && localTracks.length > 0 && (
        <>
          <h3>Tracks saved in browser:</h3>
          <ul>
            {localTracks.map((r) => (
              <li key={r.uuid}>
                <TrackLink href={PageRouting.viewTrackPageV2(r.uuid)}>{r.title}</TrackLink>{" "}
                <DeleteItemLink
                  href="#"
                  onClick={() => {
                    TrackLocalStorageService.delete(r.uuid);
                    setLocalTracks(listLocalTracks());
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

const TrackLink = styled(Link)`
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

function listLocalTracks() {
  return TrackLocalStorageService.getList();
}
