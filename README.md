# Train Ride Maps - Synchronized map view for train videos

With this webapp, you can watch train videos with an overlaid map of the train's location.

[Try the webapp now](https://train-ride-maps.lehnerpat.com/)

There are some videos with route data available in the webapp, just choose one of the "example tracks" on the start page!

Screenshot:
![Screenshot of the app](doc/assets/demo_screenshot.jpg)

## How it works

The webapp embeds a YouTube video, and overlays an OpenStreetMap map view over it. If there is timing & location data for the video, the map shows the train's location synchronized with video playback.

Note that timing & location data must be entered manually with this webapp; this data is not extracted automatically from the video.

## Editing mode
This mode allows users to add and remove timing points to refine the syncing of map and video.
- Click the **EDITING** button in the upper-right corner of the screen to open editing mode.

![Screenshotshowing position of editing button]()

### Timing points map
The **timing points map** appears on the right side of the **editing** mode screen. It displays the track path and train position.

![Screenshot highlighting map]()

- The position of the train as referenced in the video is indicated by the **blue pin.**
- The track path as defined by the OSM XML file appears as a **purple line.**
- Timing points are indicated by **green circles.**

#### Changing the map view
- Zoom in and out with:
  - Buttons in the upper-left corner of the map.
  - Mouse wheel.
  - '-' and '+' keys.
- While the video is paused, pan with:
  - Mouse click and drag.
  - Arrow keys. 

#### Edit track geomoetry button. 
- I don't think this currently does anything.

### Add timing point
Adding timing points refines the syncing of the video and map.

![Screenshot highlighting add timing point button]()

- Click **add timing point** button to add a timing point at the location of the crosshairs in the **timing points map.**
  - t = video time elapsed (in seconds).
  - d = distance traveled along track path (in meters).

- **Tips**
  1. Look for landmarks that are clearly visible in both video and map. *Examples: road crossings, bridges, buildings, stations.*
  2. Pause the video when the train crosses these points.
  3. Drag the crosshairs on the **timing points map** to the appropriate location.
  4. Place a timing point by clicking the **add timing point** button.

### Timing points list
Displays all current timing points in order by video time elapsed and distance traveled along track path. Timing points appear as green circles on the **timing points map.**
- Click ... and select 'delete' to remove a timing point.

![Screenshot highlighting timing points list}()


### Import OSM XML
- Imports XML path map from OpenStreetMaps.
- Need a better explanation of how this works. 

![Screenshot highlighting Import OSM XML button]()

### Reverse path
- Reverses the map path to run end -. start.
- Why would a user do this?

![Screenshot highlighting Reverse path button]()

---

## License

The source code in this repository is published under the MIT license. You can find the full license text in the [LICENSE file](LICENSE).
