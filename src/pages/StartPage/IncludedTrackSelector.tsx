import { FC, useState } from "react";
import { IncludedData } from "../../included-data";
import { Link } from "wouter";
import { PageRouting } from "../../page-routing";
import { TrackLocalStorageService } from "../../track-models/TrackLocalStorageService";
import { List, ListItem, ListItemButton, ListItemText, Collapse, Divider, IconButton } from "@mui/material";
import { ExpandLess, ExpandMore, Delete } from "@mui/icons-material";
import { TopLevelCard } from "../../common/components/TopLevelCard";

export const IncludedTrackSelector: FC = () => {
  const [localTracks, setLocalTracks] = useState(listLocalTracks());
  const [isExampleTracksOpen, setExampleTracksOpen] = useState(true);
  const [isLocalTracksOpen, setLocalTracksOpen] = useState(true);

  return (
    <>
      <TopLevelCard>
        <List disablePadding>
          <ListItemButton onClick={() => setExampleTracksOpen(!isExampleTracksOpen)}>
            <ListItemText primary="Example tracks" primaryTypographyProps={{ variant: "h5", pt: 1 }} />
            {isExampleTracksOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={isExampleTracksOpen}>
            <List component="div" disablePadding>
              {IncludedData.map((r) => (
                <ListItemButton component={Link} href={PageRouting.viewTrackPage(r.uuid)} key={r.uuid} sx={{ pl: 4 }}>
                  <ListItemText primary={r.title} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>

          <Divider />

          <ListItemButton onClick={() => setLocalTracksOpen(!isLocalTracksOpen)}>
            <ListItemText primary="Tracks saved in browser" primaryTypographyProps={{ variant: "h5", pt: 1 }} />
            {isLocalTracksOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={isLocalTracksOpen}>
            <List component="div" disablePadding>
              {localTracks && localTracks.length > 0 ? (
                localTracks.map((r) => (
                  <ListItem
                    key={r.uuid}
                    sx={{ pl: 4 }}
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => {
                          TrackLocalStorageService.delete(r.uuid);
                          setLocalTracks(listLocalTracks());
                        }}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemButton component={Link} href={PageRouting.viewTrackPage(r.uuid)}>
                      <ListItemText primary={r.title} />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <ListItem sx={{ pl: 4 }} disabled>
                  <ListItemText primary="No local tracks. Create one below." />
                </ListItem>
              )}
            </List>
          </Collapse>
        </List>
      </TopLevelCard>
    </>
  );
};

function listLocalTracks() {
  return TrackLocalStorageService.getList();
}
